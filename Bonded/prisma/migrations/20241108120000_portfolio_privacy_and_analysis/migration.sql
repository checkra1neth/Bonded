-- CreateEnum
CREATE TYPE "PortfolioVisibilityLevel" AS ENUM ('HIDDEN', 'SUMMARY', 'DETAILED');
CREATE TYPE "ActivityVisibilityLevel" AS ENUM ('HIDDEN', 'TIMEZONE_ONLY', 'PATTERNS');
CREATE TYPE "CompatibilityCategory" AS ENUM (
  'CRYPTO_SOULMATES',
  'DEFI_COMPATIBLE',
  'POTENTIAL_MATCH',
  'DIFFERENT_STRATEGIES'
);

-- CreateTable
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "walletAddress" TEXT NOT NULL,
  "fid" INTEGER,
  "ensName" TEXT,
  "basename" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateTable
CREATE TABLE "Portfolio" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "highlights" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_userId_key" ON "Portfolio"("userId");

-- CreateTable
CREATE TABLE "PortfolioPrivacy" (
  "id" TEXT NOT NULL,
  "portfolioId" TEXT NOT NULL,
  "shareTokens" BOOLEAN NOT NULL DEFAULT true,
  "shareDefi" BOOLEAN NOT NULL DEFAULT true,
  "shareNfts" BOOLEAN NOT NULL DEFAULT true,
  "shareActivity" BOOLEAN NOT NULL DEFAULT true,
  "shareHighlights" BOOLEAN NOT NULL DEFAULT true,
  "tokenVisibility" "PortfolioVisibilityLevel" NOT NULL DEFAULT 'SUMMARY',
  "defiVisibility" "PortfolioVisibilityLevel" NOT NULL DEFAULT 'SUMMARY',
  "nftVisibility" "PortfolioVisibilityLevel" NOT NULL DEFAULT 'SUMMARY',
  "activityVisibility" "ActivityVisibilityLevel" NOT NULL DEFAULT 'PATTERNS',
  "viewerFids" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "viewerAddresses" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PortfolioPrivacy_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PortfolioPrivacy_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioPrivacy_portfolioId_key" ON "PortfolioPrivacy"("portfolioId");

-- CreateTable
CREATE TABLE "CompatibilityAnalysis" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "targetUserId" TEXT,
  "portfolioId" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "sharedInterests" JSONB NOT NULL,
  "reasoning" JSONB NOT NULL,
  "overallScore" DOUBLE PRECISION NOT NULL,
  "tokenScore" DOUBLE PRECISION NOT NULL,
  "defiScore" DOUBLE PRECISION NOT NULL,
  "nftScore" DOUBLE PRECISION NOT NULL,
  "activityScore" DOUBLE PRECISION NOT NULL,
  "category" "CompatibilityCategory" NOT NULL,
  "highlights" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompatibilityAnalysis_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CompatibilityAnalysis_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CompatibilityAnalysis_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "CompatibilityAnalysis_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CompatibilityAnalysis_ownerId_idx" ON "CompatibilityAnalysis"("ownerId");
CREATE INDEX "CompatibilityAnalysis_targetUserId_idx" ON "CompatibilityAnalysis"("targetUserId");
CREATE INDEX "CompatibilityAnalysis_portfolioId_idx" ON "CompatibilityAnalysis"("portfolioId");
