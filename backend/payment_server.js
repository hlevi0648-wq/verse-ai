const express = require("express");
const rateLimit = require("express-rate-limit");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { ethers } = require("ethers");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use("/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

// --- FIX: Restrict CORS to frontend origin ---
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000").split(",");
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
}));

// --- FIX: Rate limiting on checkout endpoint ---
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many checkout attempts. Please try again later." },
});
app.use("/api/create-checkout", checkoutLimiter);

// --- FIX: Persist orders to disk instead of in-memory Map ---
const ORDERS_FILE = path.join(__dirname, "orders.json");

function loadOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, "utf8");
      return new Map(Object.entries(JSON.parse(data)));
    }
  } catch (err) {
    console.error("Failed to load orders file:", err.message);
  }
  return new Map();
}

function saveOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(Object.fromEntries(orders), null, 2));
  } catch (err) {
    console.error("Failed to save orders file:", err.message);
  }
}

let pendingOrders = loadOrders();

const VERSE_TOKEN_ABI = [
  "function mint(address to, uint256 amount) external",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
];

const VERSE_TOKEN_ADDRESS = process.env.VERSE_TOKEN_ADDRESS || "";
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY || "";
const RPC_URL = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

// --- FIX: Make price configurable via env ---
const PRICE_PER_VERSE_USD = parseFloat(process.env.PRICE_PER_VERSE_USD || "0.001");

app.post("/api/create-checkout", async (req, res) => {
  try {
    const { tokenAmount, walletAddress, usdAmount } = req.body;

    if (!tokenAmount || tokenAmount < 100) {
      return res.status(400).json({ error: "Minimum purchase: 100 VERSE" });
    }
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    const expectedUsd = tokenAmount * PRICE_PER_VERSE_USD;
    if (Math.abs(usdAmount - expectedUsd) > 0.01) {
      return res.status(400).json({ error: "Price mismatch" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "VERSE Token",
              description: `${tokenAmount.toLocaleString()} VERSE tokens for wallet ${walletAddress.slice(0, 8)}...`,
            },
            unit_amount: Math.round(PRICE_PER_VERSE_USD * 100),
          },
          quantity: tokenAmount,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/buy?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/buy?cancelled=true`,
      metadata: {
        walletAddress,
        tokenAmount: String(tokenAmount),
      },
    });

    pendingOrders.set(session.id, {
      walletAddress,
      tokenAmount,
      usdAmount,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    saveOrders(pendingOrders);

    res.json({ sessionId: session.id });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

app.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const walletAddress = session.metadata.walletAddress;
    const tokenAmount = BigInt(session.metadata.tokenAmount) * BigInt(10 ** 18);

    // --- FIX: Idempotency — skip if already fulfilled or processing ---
    const order = pendingOrders.get(session.id);
    if (order && (order.status === "fulfilled" || order.status === "processing")) {
      console.log(`Skipping duplicate webhook for ${session.id} (status: ${order.status})`);
      return res.json({ received: true });
    }

    if (order) {
      order.status = "processing";
      saveOrders(pendingOrders);
    }

    console.log(`Payment received! Sending ${session.metadata.tokenAmount} VERSE to ${walletAddress}`);

    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet(TREASURY_PRIVATE_KEY, provider);
      const verseToken = new ethers.Contract(VERSE_TOKEN_ADDRESS, VERSE_TOKEN_ABI, wallet);

      // --- FIX: Check treasury balance before transfer ---
      const treasuryBalance = await verseToken.balanceOf(wallet.address);
      if (treasuryBalance < tokenAmount) {
        throw new Error(
          `Treasury insufficient: has ${ethers.formatEther(treasuryBalance)}, needs ${ethers.formatEther(tokenAmount)}`
        );
      }

      const tx = await verseToken.transfer(walletAddress, tokenAmount);
      await tx.wait();

      if (order) {
        order.status = "fulfilled";
        order.txHash = tx.hash;
        saveOrders(pendingOrders);
      }

      console.log(`Tokens sent! TX: ${tx.hash}`);
    } catch (err) {
      console.error("Token transfer failed:", err);
      if (order) {
        order.status = "transfer_failed";
        order.error = err.message;
        saveOrders(pendingOrders);
      }
    }
  }

  res.json({ received: true });
});

app.get("/api/order/:sessionId", (req, res) => {
  const order = pendingOrders.get(req.params.sessionId);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json(order);
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    pendingOrders: pendingOrders.size,
    tokenAddress: VERSE_TOKEN_ADDRESS,
    pricePerVerse: PRICE_PER_VERSE_USD,
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Verse AI payment server running on port ${PORT}`);
  console.log(`Price: $${PRICE_PER_VERSE_USD} per VERSE`);
  console.log(`Token address: ${VERSE_TOKEN_ADDRESS}`);
});
