import { NextResponse } from 'next/server'

import { CryptoPersonality, PortfolioTier } from '@/types'

interface OnboardingPayload {
  walletAddress?: string
  profile?: {
    name?: string
    bio?: string
    age?: number
    location?: string
    profileImage?: string | null
    cryptoPersonality?: CryptoPersonality | string
    portfolioValue?: PortfolioTier | string
    interests?: unknown
    riskTolerance?: number
    matchGoals?: string
    showPortfolio?: boolean
    showNFTs?: boolean
    showDeFiActivity?: boolean
  }
}

const sanitizeString = (value: unknown, fallback = ''): string => {
  return typeof value === 'string' ? value.trim() : fallback
}

const clampNumber = (value: unknown, min: number, max: number, fallback: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback
  }

  return Math.min(Math.max(value, min), max)
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as OnboardingPayload

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const walletAddress = sanitizeString(payload.walletAddress, '')

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    if (!payload.profile) {
      return NextResponse.json(
        { success: false, error: 'Profile details are missing' },
        { status: 400 }
      )
    }

    const {
      name,
      bio,
      age,
      location,
      profileImage,
      cryptoPersonality,
      portfolioValue,
      interests,
      riskTolerance,
      matchGoals,
      showPortfolio,
      showNFTs,
      showDeFiActivity,
    } = payload.profile

    const safeName = sanitizeString(name, 'Anon Builder')
    const safeBio = sanitizeString(bio, '')
    const safeLocation = sanitizeString(location, '')
    const safeMatchGoal = sanitizeString(matchGoals, '')

    const normalizedInterests = Array.isArray(interests)
      ? (interests.filter(item => typeof item === 'string') as string[])
      : []

    const normalizedRisk = clampNumber(riskTolerance, 0, 100, 50)

    const validPersonality = Object.values(CryptoPersonality).includes(
      cryptoPersonality as CryptoPersonality
    )
      ? (cryptoPersonality as CryptoPersonality)
      : CryptoPersonality.DEFI_DEGEN

    const validPortfolio = Object.values(PortfolioTier).includes(
      portfolioValue as PortfolioTier
    )
      ? (portfolioValue as PortfolioTier)
      : PortfolioTier.UNKNOWN

    const compatibilitySignal = Math.min(
      0.95,
      0.42 + Math.min(normalizedInterests.length * 0.08, 0.32) + normalizedRisk * 0.0015 + (showDeFiActivity ? 0.06 : 0)
    )

    const sanitizedProfile = {
      name: safeName,
      bio: safeBio,
      age: typeof age === 'number' && age >= 18 ? Math.floor(age) : null,
      location: safeLocation,
      profileImage: profileImage ?? null,
      cryptoPersonality: validPersonality,
      portfolioValue: validPortfolio,
      interests: normalizedInterests,
      riskTolerance: normalizedRisk,
      matchGoals: safeMatchGoal,
      showPortfolio: Boolean(showPortfolio),
      showNFTs: Boolean(showNFTs),
      showDeFiActivity: Boolean(showDeFiActivity),
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding data captured. Persist to database service when ready.',
      data: {
        walletAddress,
        profile: sanitizedProfile,
        analytics: {
          compatibilitySignal,
          interestCount: sanitizedProfile.interests.length,
          hasProfileImage: Boolean(sanitizedProfile.profileImage),
        },
      },
    })
  } catch (error) {
    console.error('Failed to process onboarding payload', error)
    return NextResponse.json(
      { success: false, error: 'Unable to process onboarding data' },
      { status: 500 }
    )
  }
}

