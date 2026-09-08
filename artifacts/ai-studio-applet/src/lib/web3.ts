import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { defineChain } from '@reown/appkit/networks';

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;

if (!projectId) {
  throw new Error('VITE_REOWN_PROJECT_ID is required to initialize wallet access.');
}

export const robinhoodChain = defineChain({
  id: 4663,
  caipNetworkId: 'eip155:4663',
  chainNamespace: 'eip155',
  name: 'Robinhood Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.mainnet.chain.robinhood.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Robinhood Chain Explorer',
      url: 'https://robinhoodchain.blockscout.com',
    },
  },
});

export const ACCESS_TOKEN_ADDRESS = '0x23D1BF831469305488902070066aa3966f011617' as const;

export const accessTokenAbi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

const networks: [typeof robinhoodChain] = [robinhoodChain];
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const isRuntimeWorkspace = window.location.pathname === `${basePath}/workspace`;

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
});

const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  enableCoinbase: !isRuntimeWorkspace,
  enableBaseAccount: !isRuntimeWorkspace,
  metadata: {
    name: 'Lissa',
    description: 'Token-gated AI application builder on Robinhood Chain',
    url: baseUrl.href,
    icons: [new URL('brand/lissa-logo.jpg', baseUrl).href],
  },
  features: {
    analytics: true,
    email: false,
    socials: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#050BE0',
    '--w3m-border-radius-master': '2px',
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;