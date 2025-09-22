'use client'

import { motion } from 'framer-motion'
import { MessageCircle, Sparkles, Users, Zap } from 'lucide-react'
import { useAccount } from 'wagmi'

import { ConnectWallet } from '@/components/connect-wallet'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CryptoPersonality } from '@/types'
import {
  formatAddress,
  formatPercentage,
  getCompatibilityColor,
  getCryptoPersonalityColor,
} from '@/lib/utils'

const personalityLabel: Record<CryptoPersonality, string> = {
  [CryptoPersonality.BANKER]: 'Base Banker',
  [CryptoPersonality.DEFI_DEGEN]: 'DeFi Degen',
  [CryptoPersonality.NFT_COLLECTOR]: 'NFT Curator',
  [CryptoPersonality.GAMEFI_PLAYER]: 'GameFi Adventurer',
  [CryptoPersonality.DIAMOND_HANDS]: 'Diamond Hands',
  [CryptoPersonality.DAY_TRADER]: 'Day Trader',
}

const mockMatches = [
  {
    id: 'luna',
    name: 'Luna',
    compatibility: 0.86,
    personality: CryptoPersonality.NFT_COLLECTOR,
    bio: 'Curates Base-native digital art drops and co-hosts weekly gallery spaces.',
    commonTokens: ['ETH', 'OP', 'MAGIC'],
    sharedFocus: 'Exploring AI x art collaborations on Base.',
    matchGoal: 'Collaborate on onchain art drops',
    lastActive: 'Active 5m ago',
  },
  {
    id: 'mason',
    name: 'Mason',
    compatibility: 0.74,
    personality: CryptoPersonality.DEFI_DEGEN,
    bio: 'Runs a yield strategy newsletter and experiments with intent-based protocols.',
    commonTokens: ['AAVE', 'UNI', 'ENA'],
    sharedFocus: 'Building capital efficient vaults for Base power users.',
    matchGoal: 'Find a DeFi power couple',
    lastActive: 'Active 18m ago',
  },
  {
    id: 'ari',
    name: 'Ari',
    compatibility: 0.68,
    personality: CryptoPersonality.GAMEFI_PLAYER,
    bio: 'Designs onchain quests and play-to-earn ecosystems with Base Guilds.',
    commonTokens: ['MAGIC', 'OP', 'USDC'],
    sharedFocus: 'Launching a cross-guild tournament for Base adventurers.',
    matchGoal: 'Explore the ecosystem together',
    lastActive: 'Active 42m ago',
  },
]

const highlights = [
  {
    icon: Sparkles,
    title: 'Fresh matches',
    value: '3 new intros',
    description: 'Curated from your portfolio signals and onboarding answers.',
  },
  {
    icon: Users,
    title: 'Clubs to join',
    value: '2 invites',
    description: 'Crypto-native spaces aligned with your interests.',
  },
  {
    icon: Zap,
    title: 'Boost available',
    value: '1 superlike',
    description: 'Activate Base Pay to unlock premium visibility.',
  },
]

export default function DiscoverPage() {
  const { address, isConnected } = useAccount()

  if (!isConnected) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
        <Card className="max-w-xl border-0 bg-white/70 shadow-xl backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle>Unlock your curated matches</CardTitle>
            <CardDescription>
              Connect your Base Account to view personalised intros and community invites.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ConnectWallet />
            <p className="text-xs text-gray-500">
              You can revisit onboarding anytime. We only surface anonymised insights.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl bg-white/85 p-6 shadow-xl backdrop-blur"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Base Dating discovery feed</h1>
              <p className="mt-2 text-sm text-gray-600">
                Based on your wallet {address ? `(${formatAddress(address)})` : ''}, we selected matches and clubs that fit your onchain persona.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary">
                Share compatibility report
              </Button>
              <Button>Post to Base App</Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {highlights.map(item => (
              <div key={item.title} className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      {item.title}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-blue-700">{item.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="grid gap-6 lg:grid-cols-3"
        >
          {mockMatches.map(match => (
            <Card key={match.id} className="flex h-full flex-col border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-2xl text-gray-900">{match.name}</CardTitle>
                    <CardDescription>{match.matchGoal}</CardDescription>
                  </div>
                  <span
                    className={`text-xs font-semibold uppercase tracking-wide ${getCryptoPersonalityColor(match.personality)}`}
                  >
                    {personalityLabel[match.personality]}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getCompatibilityColor(match.compatibility)}`}
                  >
                    {formatPercentage(match.compatibility)} compatible
                  </span>
                  <span className="text-xs text-gray-400">{match.lastActive}</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <p className="text-sm text-gray-600">{match.bio}</p>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Shared signals
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {match.commonTokens.map(token => (
                      <span
                        key={token}
                        className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
                      >
                        {token}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                  <p className="font-medium text-gray-900">Why this match</p>
                  <p className="mt-1">{match.sharedFocus}</p>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-3">
                <Button variant="ghost" size="sm">
                  Skip
                </Button>
                <Button size="sm" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Start chat
                </Button>
              </CardFooter>
            </Card>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

