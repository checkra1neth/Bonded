// User Types
export interface User {
  id: string
  walletAddress: string
  basename?: string
  fid?: number
  name?: string
  bio?: string
  age?: number
  location?: string
  profilePic?: string
  isVerified: boolean
  isActive: boolean
  cryptoPersonality?: CryptoPersonality
  portfolioValue: PortfolioTier
  joinedCrypto?: Date
  showPortfolio: boolean
  showNFTs: boolean
  showDeFiActivity: boolean
  createdAt: Date
  updatedAt: Date
}

// Portfolio Types
export interface Portfolio {
  id: string
  userId: string
  totalValue: number
  lastAnalyzed: Date
  topTokens: TokenHolding[]
  nftCollections: NFTCollection[]
  defiProtocols: DeFiProtocol[]
  riskScore: number
  diversityScore: number
  activityScore: number
}

export interface TokenHolding {
  symbol: string
  name: string
  percentage: number
  category: TokenCategory
  logoUrl?: string
}

export interface NFTCollection {
  name: string
  count: number
  floorPrice: number
  logoUrl?: string
}

export interface DeFiProtocol {
  protocol: string
  category: DeFiCategory
  tvl: number
  logoUrl?: string
}

// Match Types
export interface Match {
  id: string
  user1Id: string
  user2Id: string
  compatibilityScore: number
  icebreaker?: string
  isActive: boolean
  createdAt: Date
  user1?: User
  user2?: User
  messages?: Message[]
}

export interface Like {
  id: string
  senderId: string
  receiverId: string
  isSuper: boolean
  message?: string
  createdAt: Date
  sender?: User
  receiver?: User
}

// Message Types
export interface Message {
  id: string
  matchId: string
  senderId: string
  content: string
  type: MessageType
  createdAt: Date
  sender?: User
}

// Group Types
export interface Group {
  id: string
  name: string
  description?: string
  category: GroupCategory
  isPublic: boolean
  maxMembers: number
  createdAt: Date
  members?: GroupMember[]
}

export interface GroupMember {
  id: string
  userId: string
  groupId: string
  role: GroupRole
  joinedAt: Date
  user?: User
  group?: Group
}

// Enums
export enum CryptoPersonality {
  BANKER = 'BANKER',
  DEFI_DEGEN = 'DEFI_DEGEN',
  NFT_COLLECTOR = 'NFT_COLLECTOR',
  GAMEFI_PLAYER = 'GAMEFI_PLAYER',
  DIAMOND_HANDS = 'DIAMOND_HANDS',
  DAY_TRADER = 'DAY_TRADER'
}

export enum PortfolioTier {
  UNKNOWN = 'UNKNOWN',
  SMALL = 'SMALL',     // < $1K
  MEDIUM = 'MEDIUM',   // $1K - $10K
  LARGE = 'LARGE',     // $10K - $100K
  WHALE = 'WHALE'      // $100K+
}

export enum TokenCategory {
  DEFI = 'DEFI',
  LAYER1 = 'LAYER1',
  LAYER2 = 'LAYER2',
  MEME = 'MEME',
  GAMING = 'GAMING',
  STABLECOIN = 'STABLECOIN',
  NFT = 'NFT'
}

export enum DeFiCategory {
  DEX = 'DEX',
  LENDING = 'LENDING',
  YIELD_FARMING = 'YIELD_FARMING',
  STAKING = 'STAKING',
  DERIVATIVES = 'DERIVATIVES',
  INSURANCE = 'INSURANCE'
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  CRYPTO_GIFT = 'CRYPTO_GIFT',
  CHALLENGE = 'CHALLENGE'
}

export enum GroupCategory {
  DEFI = 'DEFI',
  NFT = 'NFT',
  GAMING = 'GAMING',
  TRADING = 'TRADING',
  GENERAL = 'GENERAL'
}

export enum GroupRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER'
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Form Types
export interface OnboardingForm {
  name: string
  bio: string
  age: number
  location: string
  profilePic?: File
  showPortfolio: boolean
  showNFTs: boolean
  showDeFiActivity: boolean
}

export interface ProfileUpdateForm {
  name?: string
  bio?: string
  age?: number
  location?: string
  profilePic?: File
  showPortfolio?: boolean
  showNFTs?: boolean
  showDeFiActivity?: boolean
}

// Compatibility Types
export interface CompatibilityAnalysis {
  score: number
  commonTokens: string[]
  commonNFTs: string[]
  commonProtocols: string[]
  personalityMatch: number
  riskCompatibility: number
  reasons: string[]
}

// External API Types
export interface TokenPrice {
  symbol: string
  price: number
  change24h: number
  marketCap: number
}

export interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: Array<{
    trait_type: string
    value: string | number
  }>
}

// Viral Content Types
export interface CompatibilityReport {
  user1: Pick<User, 'name' | 'cryptoPersonality'>
  user2: Pick<User, 'name' | 'cryptoPersonality'>
  score: number
  highlights: string[]
  memeTemplate: string
  shareableImage: string
}

export interface CryptoChallenge {
  id: string
  title: string
  description: string
  category: GroupCategory
  startDate: Date
  endDate: Date
  prize: string
  participants: number
  isActive: boolean
}