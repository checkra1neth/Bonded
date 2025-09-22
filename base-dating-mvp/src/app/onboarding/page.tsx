'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
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
import {
  CryptoPersonality,
  OnboardingForm,
  PortfolioTier,
} from '@/types'
import {
  formatAddress,
  formatPercentage,
  generateIcebreaker,
  getCompatibilityColor,
  getCryptoPersonalityColor,
} from '@/lib/utils'


type ExtendedOnboardingForm = OnboardingForm & {
  cryptoPersonality: CryptoPersonality
  portfolioValue: PortfolioTier
  interests: string[]
  riskTolerance: number
  matchGoals: string
}

const steps = [
  {
    title: 'Profile Basics',
    description: 'Help the Base community understand who you are.',
  },
  {
    title: 'Crypto Persona',
    description: 'Share your onchain style so we can recommend better matches.',
  },
  {
    title: 'Preview & Launch',
    description: 'Double-check your profile before you go live.',
  },
]

const personalityCopy: Record<
  CryptoPersonality,
  { label: string; description: string; highlight: string }
> = {
  [CryptoPersonality.BANKER]: {
    label: 'Base Banker',
    description: 'Stable yield, thoughtful risk management and long-term plays.',
    highlight: 'bg-blue-500/10 text-blue-700',
  },
  [CryptoPersonality.DEFI_DEGEN]: {
    label: 'DeFi Degen',
    description: 'High-octane strategies, new protocol drops and creative loops.',
    highlight: 'bg-purple-500/10 text-purple-700',
  },
  [CryptoPersonality.NFT_COLLECTOR]: {
    label: 'NFT Curator',
    description: 'Digital art, culture, and iconic mint experiences.',
    highlight: 'bg-pink-500/10 text-pink-700',
  },
  [CryptoPersonality.GAMEFI_PLAYER]: {
    label: 'GameFi Adventurer',
    description: 'Quests, guilds, and play-to-earn adventures.',
    highlight: 'bg-green-500/10 text-green-700',
  },
  [CryptoPersonality.DIAMOND_HANDS]: {
    label: 'Diamond Hands',
    description: 'Conviction, blue-chip stacks, and resilient belief.',
    highlight: 'bg-yellow-500/10 text-yellow-700',
  },
  [CryptoPersonality.DAY_TRADER]: {
    label: 'Day Trader',
    description: 'Signals, charts, and precision entries every morning.',
    highlight: 'bg-red-500/10 text-red-700',
  },
}

const interestOptions = [
  'DeFi Strategies',
  'NFT Collecting',
  'Onchain Gaming',
  'AI + Crypto',
  'IRL Meetups',
  'Onchain Governance',
  'Yield Farming',
  'Crypto Content Creation',
]

const matchGoalOptions = [
  'Find a DeFi power couple',
  'Meet NFT collectors IRL',
  'Collaborate on an onchain project',
  'Explore the ecosystem together',
]

const initialForm: ExtendedOnboardingForm = {
  name: '',
  bio: '',
  age: 0,
  location: '',
  profilePic: undefined,
  showPortfolio: true,
  showNFTs: true,
  showDeFiActivity: true,
  cryptoPersonality: CryptoPersonality.DEFI_DEGEN,
  portfolioValue: PortfolioTier.UNKNOWN,
  interests: ['DeFi Strategies', 'Yield Farming'],
  riskTolerance: 60,
  matchGoals: matchGoalOptions[0],
}

const sampleTokens = ['ETH', 'AAVE', 'UNI', 'OP', 'MAGIC']

export default function OnboardingPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<ExtendedOnboardingForm>(initialForm)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const progress = ((currentStep + 1) / steps.length) * 100

  const compatibilityPreview = useMemo(() => {
    const baseScore = 0.42
    const interestBoost = Math.min(formData.interests.length * 0.08, 0.32)
    const riskBoost = (formData.riskTolerance / 100) * 0.15
    const privacyBoost = formData.showDeFiActivity ? 0.06 : 0
    return Math.min(0.95, baseScore + interestBoost + riskBoost + privacyBoost)
  }, [formData])

  const icebreakerSuggestion = useMemo(() => {
    return generateIcebreaker(compatibilityPreview, sampleTokens)
  }, [compatibilityPreview])

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setFormData(prev => ({ ...prev, profilePic: undefined }))
      setProfilePreview(null)
      return
    }

    setFormData(prev => ({ ...prev, profilePic: file }))

    const reader = new FileReader()
    reader.onloadend = () => {
      setProfilePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const toggleInterest = (interest: string) => {
    setFormData(prev => {
      const exists = prev.interests.includes(interest)
      return {
        ...prev,
        interests: exists
          ? prev.interests.filter(item => item !== interest)
          : [...prev.interests, interest],
      }
    })
  }

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const isStepValid = useMemo(() => {
    if (currentStep === 0) {
      return (
        formData.name.trim().length > 0 &&
        formData.bio.trim().length >= 10 &&
        Number.isFinite(formData.age) &&
        formData.age >= 18
      )
    }

    if (currentStep === 1) {
      return formData.interests.length > 0
    }

    return true
  }, [currentStep, formData])

  const handleComplete = async () => {
    if (!address) {
      toast.error('Connect your wallet before finishing onboarding')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          profile: {
            name: formData.name.trim(),
            bio: formData.bio.trim(),
            age: formData.age,
            location: formData.location.trim(),
            profileImage: profilePreview,
            cryptoPersonality: formData.cryptoPersonality,
            portfolioValue: formData.portfolioValue,
            interests: formData.interests,
            riskTolerance: formData.riskTolerance,
            matchGoals: formData.matchGoals,
            showPortfolio: formData.showPortfolio,
            showNFTs: formData.showNFTs,
            showDeFiActivity: formData.showDeFiActivity,
          },
        }),
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to save your profile')
      }

      toast.success('Welcome to Base Dating! We crafted your first matches.')
      router.push('/discover')
    } catch (error) {
      console.error('Onboarding submission failed', error)
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong, try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            key="step-basic"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="grid gap-6"
          >
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Introduce yourself</CardTitle>
                <CardDescription>
                  Your profile helps other Base explorers understand your vibe.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Display name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={event =>
                        setFormData(prev => ({ ...prev, name: event.target.value }))
                      }
                      placeholder="Satoshi, DeFi Queen, NFT Wizard..."
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="age" className="text-sm font-medium text-gray-700">
                      Age
                    </label>
                    <input
                      id="age"
                      type="number"
                      min={18}
                      value={formData.age || ''}
                      onChange={event =>
                        setFormData(prev => ({
                          ...prev,
                          age: Number(event.target.value),
                        }))
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="location" className="text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={event =>
                      setFormData(prev => ({ ...prev, location: event.target.value }))
                    }
                    placeholder="NYC, Lisbon, Seoul..."
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="bio" className="text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={event =>
                      setFormData(prev => ({ ...prev, bio: event.target.value }))
                    }
                    placeholder="GM! Tell everyone what you build, collect or explore onchain."
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <p className="text-xs text-gray-500">
                    Minimum 10 characters. Share a fun fact, your favourite protocol, or your Base story.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-[200px_1fr]">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative h-36 w-36 overflow-hidden rounded-full border-4 border-white shadow-lg">
                      {profilePreview ? (
                        <Image
                          src={profilePreview}
                          alt="Profile preview"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/10 to-purple-500/20 text-sm font-semibold text-blue-700">
                          {formData.name ? formData.name.slice(0, 2).toUpperCase() : 'GM'}
                        </div>
                      )}
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-blue-500">
                      Upload photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfileImageChange}
                      />
                    </label>
                    <p className="text-xs text-center text-gray-500">
                      We recommend square images at least 400px. You can update this anytime.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
                    <h3 className="text-sm font-semibold text-blue-800">
                      Wallet connected
                    </h3>
                    <p className="mt-1 text-sm text-blue-600">
                      {address ? formatAddress(address) : 'Connect to Base Account'}
                    </p>
                    <p className="mt-4 text-sm text-gray-600">
                      Your Base Account powers identity across the Mini App. We only share anonymised insights by default.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    What brings you here?
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {matchGoalOptions.map(goal => (
                      <label
                        key={goal}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm shadow-sm transition ${
                          formData.matchGoals === goal
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-200'
                        }`}
                      >
                        <span>{goal}</span>
                        <input
                          type="radio"
                          name="matchGoal"
                          value={goal}
                          checked={formData.matchGoals === goal}
                          onChange={() =>
                            setFormData(prev => ({ ...prev, matchGoals: goal }))
                          }
                          className="h-4 w-4 border-blue-600 text-blue-600 focus:ring-blue-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )

      case 1:
        return (
          <motion.div
            key="step-crypto"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="grid gap-6"
          >
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Choose your crypto persona</CardTitle>
                <CardDescription>
                  Pick the energy that best describes how you operate onchain.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {Object.entries(personalityCopy).map(([value, copy]) => {
                  const personality = value as CryptoPersonality
                  const isActive = formData.cryptoPersonality === personality
                  return (
                    <Card
                      key={personality}
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          cryptoPersonality: personality,
                        }))
                      }
                      className={`cursor-pointer border transition ${
                        isActive
                          ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
                          : 'border-gray-100 hover:border-blue-200'
                      }`}
                    >
                      <CardContent className="flex h-full flex-col gap-3 p-6">
                        <span
                          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${copy.highlight}`}
                        >
                          {copy.label}
                        </span>
                        <p className="text-sm text-gray-600">{copy.description}</p>
                        {isActive && (
                          <p className="text-xs font-medium text-blue-600">
                            Selected – this tag will show on your public card.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Tell us how you operate</CardTitle>
                <CardDescription>
                  These details help us curate compatible intros and groups.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Portfolio tier
                    </label>
                    <select
                      value={formData.portfolioValue}
                      onChange={event =>
                        setFormData(prev => ({
                          ...prev,
                          portfolioValue: event.target.value as PortfolioTier,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      {Object.values(PortfolioTier).map(tier => (
                        <option key={tier} value={tier}>
                          {tier === PortfolioTier.UNKNOWN
                            ? 'Prefer not to say'
                            : tier}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">
                      We only show anonymised tiers, never exact balances.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Risk tolerance: {formData.riskTolerance}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={formData.riskTolerance}
                      onChange={event =>
                        setFormData(prev => ({
                          ...prev,
                          riskTolerance: Number(event.target.value),
                        }))
                      }
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gradient-to-r from-blue-200 to-purple-300"
                    />
                    <p className="text-xs text-gray-500">
                      Higher scores surface adventurous partners, lower scores surface steady companions.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-gray-700">
                    What are you most excited about?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {interestOptions.map(interest => {
                      const isChecked = formData.interests.includes(interest)
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                            isChecked
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {interest}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            key="step-review"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="grid gap-6"
          >
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Preview your profile</CardTitle>
                <CardDescription>
                  This is how your card will appear across Base App mini experiences.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-500/10 to-pink-500/10" />
                  <div className="relative grid gap-6 p-6 md:grid-cols-[220px_1fr]">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-lg">
                        {profilePreview ? (
                          <Image
                            src={profilePreview}
                            alt="Profile preview"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-lg font-semibold text-blue-700">
                            {formData.name ? formData.name.slice(0, 2).toUpperCase() : 'GM'}
                          </div>
                        )}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getCryptoPersonalityColor(formData.cryptoPersonality)}`}
                      >
                        {personalityCopy[formData.cryptoPersonality].label}
                      </span>
                      <p className="text-sm text-gray-500">
                        {formData.location || 'Somewhere on Base'} ·
                        {formData.age ? ` ${formData.age}` : ' Age hidden'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div>
                        <h3 className="text-2xl font-semibold text-gray-900">
                          {formData.name || 'Anon Base Explorer'}
                        </h3>
                        <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">
                          {formData.bio || 'Tell the community what you are building or collecting.'}
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl bg-blue-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                            Interests
                          </p>
                          <p className="mt-2 text-sm text-blue-900">
                            {formData.interests.length
                              ? formData.interests.join(' • ')
                              : 'Add at least one interest'}
                          </p>
                        </div>
                        <div className="rounded-xl bg-purple-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                            Match goal
                          </p>
                          <p className="mt-2 text-sm text-purple-900">{formData.matchGoals}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 rounded-xl bg-gray-900 p-4 text-white">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Projected compatibility</p>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getCompatibilityColor(compatibilityPreview)}`}
                          >
                            {formatPercentage(compatibilityPreview)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300">
                          Based on your selections and wallet signals, this is how strong your intro can feel to similar builders.
                        </p>
                        <p className="text-sm text-blue-100">Suggested opener: “{icebreakerSuggestion}”</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    {
                      title: 'Portfolio highlights',
                      description: 'Share anonymised allocations so matches understand your style.',
                      enabled: formData.showPortfolio,
                    },
                    {
                      title: 'Show NFTs you love',
                      description: 'Surface your top collections for instant conversation starters.',
                      enabled: formData.showNFTs,
                    },
                    {
                      title: 'DeFi activity',
                      description: 'Let people know which protocols you actively use.',
                      enabled: formData.showDeFiActivity,
                    },
                  ].map(setting => (
                    <div
                      key={setting.title}
                      className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{setting.title}</h4>
                        <p className="mt-2 text-xs text-gray-500">{setting.description}</p>
                      </div>
                      <label className="mt-4 inline-flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={setting.enabled}
                          onChange={() => {
                            setFormData(prev => {
                              switch (setting.title) {
                                case 'Portfolio highlights':
                                  return { ...prev, showPortfolio: !prev.showPortfolio }
                                case 'Show NFTs you love':
                                  return { ...prev, showNFTs: !prev.showNFTs }
                                default:
                                  return {
                                    ...prev,
                                    showDeFiActivity: !prev.showDeFiActivity,
                                  }
                              }
                            })
                          }}
                          className="peer sr-only"
                        />
                        <span className="relative h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-blue-600">
                          <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
                        </span>
                        <span className="text-xs font-medium text-gray-600">
                          {setting.enabled ? 'Visible' : 'Hidden'}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>What happens next?</CardTitle>
                <CardDescription>
                  Once you launch, we unlock curated matches and groups aligned to your vibe.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-blue-50 p-4">
                  <h4 className="text-sm font-semibold text-blue-700">Daily match drops</h4>
                  <p className="mt-2 text-xs text-blue-600">
                    We refresh your queue with people who share similar allocations or protocol usage.
                  </p>
                </div>
                <div className="rounded-xl bg-purple-50 p-4">
                  <h4 className="text-sm font-semibold text-purple-700">Community invites</h4>
                  <p className="mt-2 text-xs text-purple-600">
                    Join themed Base Clubs for collaborative quests, trading rooms and IRL meetups.
                  </p>
                </div>
                <div className="rounded-xl bg-pink-50 p-4">
                  <h4 className="text-sm font-semibold text-pink-700">Premium unlocks</h4>
                  <p className="mt-2 text-xs text-pink-600">
                    Turn on Base Pay to access superlikes, compatibility reports and VIP events.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Need to tweak something?</p>
                  <p className="text-xs text-gray-500">
                    You can revisit onboarding anytime from settings. Nothing is permanent.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={handleBack} disabled={isSubmitting}>
                    Back
                  </Button>
                  <Button onClick={handleComplete} disabled={isSubmitting}>
                    {isSubmitting ? 'Preparing matches...' : 'Complete onboarding'}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )

      default:
        return null
    }
  }

  if (!isConnected) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
        <Card className="max-w-xl border-0 bg-white/70 shadow-xl backdrop-blur">
          <CardHeader className="space-y-2 text-center">
            <CardTitle>Connect your Base Account</CardTitle>
            <CardDescription>
              Onboarding tailors matches to your wallet insights. Connect to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ConnectWallet />
            <p className="text-xs text-gray-500">
              We only use anonymised wallet data for compatibility. You stay in control.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pt-12">
        <div className="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Launch your Base Dating profile</h1>
              <p className="mt-2 text-sm text-gray-600">
                We combine your wallet signals, preferences, and onchain persona to help you meet the right people instantly.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-gray-500">Wallet</p>
              <p className="text-sm font-semibold text-blue-600">{address ? formatAddress(address) : 'Not connected'}</p>
            </div>
          </div>

          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {steps.map((step, index) => (
              <div key={step.title} className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    index <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

        {currentStep < steps.length - 1 && (
          <div className="sticky bottom-6 flex items-center justify-between rounded-2xl border border-blue-100 bg-white/80 px-6 py-4 shadow-lg backdrop-blur">
            <div>
              <p className="text-sm font-semibold text-gray-900">Next up: {steps[currentStep + 1].title}</p>
              <p className="text-xs text-gray-500">{steps[currentStep + 1].description}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0}>
                Back
              </Button>
              <Button onClick={handleNext} disabled={!isStepValid}>
                Continue
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

