import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function calculateCompatibility(user1Portfolio: any, user2Portfolio: any): number {
  // Simple compatibility algorithm based on shared tokens
  if (!user1Portfolio?.topTokens || !user2Portfolio?.topTokens) {
    return 0
  }

  const tokens1 = user1Portfolio.topTokens.map((t: any) => t.symbol.toLowerCase())
  const tokens2 = user2Portfolio.topTokens.map((t: any) => t.symbol.toLowerCase())
  
  const commonTokens = tokens1.filter((token: string) => tokens2.includes(token))
  const totalUniqueTokens = new Set([...tokens1, ...tokens2]).size
  
  return commonTokens.length / totalUniqueTokens
}

export function generateIcebreaker(compatibility: number, commonTokens: string[]): string {
  const icebreakers = [
    `I see we both hold ${commonTokens[0]}! What got you into it?`,
    `Fellow ${commonTokens[0]} holder! Are you bullish long-term?`,
    `${Math.round(compatibility * 100)}% portfolio match! That's rare 🔥`,
    `We have similar DeFi taste - want to compare strategies?`,
    `I notice we both like ${commonTokens[0]} and ${commonTokens[1]}. Great minds think alike!`
  ]
  
  return icebreakers[Math.floor(Math.random() * icebreakers.length)]
}

export function getCryptoPersonalityColor(personality: string): string {
  const colors = {
    BANKER: 'bg-blue-100 text-blue-800',
    DEFI_DEGEN: 'bg-purple-100 text-purple-800', 
    NFT_COLLECTOR: 'bg-pink-100 text-pink-800',
    GAMEFI_PLAYER: 'bg-green-100 text-green-800',
    DIAMOND_HANDS: 'bg-yellow-100 text-yellow-800',
    DAY_TRADER: 'bg-red-100 text-red-800',
  }
  
  return colors[personality as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

export function getCompatibilityColor(score: number): string {
  if (score >= 0.8) return 'compatibility-high'
  if (score >= 0.6) return 'compatibility-medium'
  return 'compatibility-low'
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}