"use client";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const projectId = "demo-project-id";

const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected(),
    walletConnect({ projectId, showQrModal: true }),
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