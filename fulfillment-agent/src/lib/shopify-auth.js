const shop = process.env.SHOPIFY_SHOP_DOMAIN;
const clientId = process.env.SHOPIFY_CLIENT_ID;
const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

let cachedToken = null;
let expiresAt = 0;

export async function getShopifyAccessToken() {
  if (!shop || !clientId || !clientSecret) {
    throw new Error("Missing Shopify client credentials");
  }

  if (cachedToken && Date.now() < expiresAt - 60_000) {
    return cachedToken;
  }

  const response = await fetch(
    `https://${shop}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret
      })
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shopify token exchange failed: ${response.status} ${text}`);
  }

  const data = await response.json();

  cachedToken = data.access_token;
  expiresAt = Date.now() + (data.expires_in * 1000);

  return cachedToken;
}
