import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { coinbaseWallet, metaMask, walletConnect } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'Base Dating',
      appLogoUrl: 'https://basedating.app/logo.png',
    }),
    metaMask(),
    walletConnect({ 
      projectId,
      metadata: {
        name: 'Base Dating',
        description: 'Find your crypto soulmate',
        url: 'https://basedating.app',
        icons: ['https://basedating.app/logo.png']
      }
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
})