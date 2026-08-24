"use client";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const projectId = "verse-ai-walletconnect";

const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected(),
    walletConnect({
      projectId,
      showQrModal: true,
      metadata: {
        name: "Verse AI",
        description: "AI-powered DeFi strategies",
        url: "https://verse-ai-levis-production.vercel.app",
        icons: ["https://verse-ai-levis-production.vercel.app/favicon.ico"],
      },
    }),
  ],
  transports: {
    [sepolia.id]: http("https://eth-sepolia.g.alchemy.com/v2/3ZZKvYTH3eqSTimNaqUz0"),
  },
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
