"use client";
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Zap, Users, TrendingUp } from 'lucide-react'
import { Wallet } from "@coinbase/onchainkit/wallet";
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { isConnected } = useAccount()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isConnected && mounted) {
      router.push('/onboarding')
    }
  }, [isConnected, mounted, router])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-90" />
        <div className="relative z-10 container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-8"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full backdrop-blur-sm">
                <Heart className="w-10 h-10 text-pink-300" />
              </div>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent">
              Base Dating
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Find your crypto soulmate. Match with people who share your 
              <span className="text-yellow-300 font-semibold"> DeFi strategies</span>, 
              <span className="text-green-300 font-semibold"> NFT collections</span>, and 
              <span className="text-purple-300 font-semibold"> onchain dreams</span>.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <div className="flex justify-center">
                <Wallet />
              </div>
              <p className="text-sm text-blue-200">
                Connect your wallet to start matching with crypto enthusiasts
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating crypto icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-white/10 text-6xl"
              initial={{ 
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                rotate: 0 
              }}
              animate={{ 
                y: [null, -20, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            >
              {['₿', 'Ξ', '♦', '◊', '⬟', '●'][i]}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Base Dating?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Traditional dating apps don't understand your crypto lifestyle. 
              We match you based on what really matters in Web3.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "Portfolio Matching",
                description: "Find someone who shares your investment strategy and risk tolerance",
                gradient: "gradient-crypto"
              },
              {
                icon: Zap,
                title: "DeFi Compatibility", 
                description: "Match with users of the same protocols - Uniswap, Aave, Compound",
                gradient: "gradient-defi"
              },
              {
                icon: Heart,
                title: "NFT Collections",
                description: "Bond over shared NFT interests and digital art collections",
                gradient: "gradient-nft"
              },
              {
                icon: Users,
                title: "Crypto Community",
                description: "Join groups based on interests - GameFi, DeFi, Trading, NFTs",
                gradient: "gradient-gaming"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full card-hover border-0 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${feature.gradient} mb-4`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to find your crypto soulmate
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                title: "Connect Wallet",
                description: "Link your Base Account to analyze your crypto portfolio and DeFi activity"
              },
              {
                step: "2", 
                title: "Get Matched",
                description: "Our algorithm finds compatible users based on shared tokens, NFTs, and DeFi protocols"
              },
              {
                step: "3",
                title: "Start Dating",
                description: "Chat with matches, join crypto groups, and plan DeFi dates together"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-white"
          >
            <h2 className="text-4xl font-bold mb-4">
              Ready to Find Your Crypto Match?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of crypto enthusiasts finding love onchain
            </p>
            <div className="flex justify-center">
              <Wallet />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2024 Base Dating. Built on Base. Made with ❤️ for the crypto community.
          </p>
        </div>
      </footer>
    </div>
  )
}