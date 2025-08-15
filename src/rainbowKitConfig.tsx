"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { anvil, Chain } from "wagmi/chains";
import { isBrowser } from "@/utils/environment";

const coreMainnet: Chain = {
  id: 1116,
  name: "Core Blockchain Mainnet",
  nativeCurrency: {
    name: "Core",
    symbol: "CORE",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.coredao.org"],
      webSocket: ["wss://ws.coredao.org"],
    },
    public: {
      http: ["https://rpc.coredao.org"],
      webSocket: ["wss://ws.coredao.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "CoreScan",
      url: "https://scan.coredao.org",
    },
  },
  testnet: false,
};

const coreTestnet: Chain = {
  id: 1114,
  name: "Core Blockchain Testnet",
  nativeCurrency: {
    name: "Test Core",
    symbol: "tCORE",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.test2.btcs.network"],
    },
    public: {
      http: ["https://rpc.test2.btcs.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Core Testnet Scan",
      url: "https://scan.test2.btcs.network",
    },
  },
  testnet: true,
};

// Only create config on client side
const createConfig = () => {
  if (!isBrowser) {
    return null;
  }

  return getDefaultConfig({
    appName: "Magma",
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
    chains: [coreMainnet],
    ssr: false,
  });
};

export default createConfig;
