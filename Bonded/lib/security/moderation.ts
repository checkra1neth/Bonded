import type { ChatMessage } from "../chat/types";

const SAFETY_STATE_SYMBOL = Symbol.for("bonded.security.moderationState");

type ReportSeverity = "low" | "medium" | "high";

export type ReportCategory =
  | "harassment"
  | "spam"
  | "fraud"
  | "impersonation"
  | "inappropriate"
  | "other";

export type ReportStatus = "open" | "investigating" | "resolved" | "dismissed";

export interface ReportUpdate {
  at: number;
  status: ReportStatus;
  note?: string;
  moderatorId?: string;
}

export interface UserReport {
  id: string;
  reporterId: string;
  subjectId: string;
  category: ReportCategory;
  description: string;
  channel: "chat" | "profile" | "match" | "other";
  evidence: string[];
  occurrences: number;
  severity: ReportSeverity;
  weight: number;
  status: ReportStatus;
  createdAt: number;
  updates: ReportUpdate[];
}

export interface FileUserReportInput {
  reporterId: string;
  subjectId: string;
  category: ReportCategory;
  description: string;
  channel?: "chat" | "profile" | "match" | "other";
  evidence?: string[];
  occurrences?: number;
  severityHint?: ReportSeverity;
}

export interface ReportQuery {
  subjectId?: string;
  reporterId?: string;
  status?: ReportStatus;
  severity?: ReportSeverity;
}

type ModerationMessage = Pick<ChatMessage, "body" | "createdAt" | "senderId" | "kind">;

export interface SuspiciousActivityInput {
  conversationId: string;
  actorId: string;
  messages: ModerationMessage[];
  accountAgeHours: number;
  reportsAgainstUser: number;
  failedVerifications: number;
  unusualGiftAttempts: number;
  blockedByOthers: number;
}

export interface SuspiciousActivitySignal {
  type:
    | "message_velocity"
    | "repeated_content"
    | "phishing_link"
    | "risky_phrase"
    | "new_account"
    | "user_reports"
    | "verification_failures"
    | "gift_abuse"
    | "user_blocks";
  weight: number;
  severity: ReportSeverity;
  description: string;
}

export interface SuspiciousActivityReport {
  score: number;
  severity: ReportSeverity;
  signals: SuspiciousActivitySignal[];
  recommendedActions: string[];
}

export type ContentSeverity = "none" | ReportSeverity;

export type ContentFlagType =
  | "scam"
  | "phishing_link"
  | "contact_request"
  | "nsfw"
  | "spam"
  | "shouting";

export interface ContentFlag {
  type: ContentFlagType;
  severity: ReportSeverity;
  snippet: string;
  message: string;
}

export interface ContentModerationResult {
  severity: ContentSeverity;
  flags: ContentFlag[];
  sanitizedText: string;
  blockRecommended: boolean;
}

export interface ProfileModerationInput {
  headline?: string;
  bio?: string;
  highlights?: string[];
  interests?: string[];
  externalLinks?: string[];
}

export type FraudRiskLevel = "low" | "medium" | "high";

export interface FraudSignalInput {
  walletAgeDays: number;
  chargebackRate: number;
  disputedGiftCount: number;
  kycVerified: boolean;
  velocityLastHour: number;
  highValueGiftUsd: number;
  failedPinAttempts: number;
}

export interface FraudRiskAssessment {
  score: number;
  level: FraudRiskLevel;
  triggers: string[];
  recommendedActions: string[];
}

export interface BlockRecord {
  id: string;
  blockerId: string;
  blockedId: string;
  reason?: string;
  note?: string;
  createdAt: number;
  expiresAt?: number;
  active: boolean;
}

export interface BlockUserOptions {
  reason?: string;
  note?: string;
  expiresAt?: number | Date;
}

interface SafetyState {
  reports: Map<string, UserReport>;
  reportsBySubject: Map<string, Set<string>>;
  blocks: Map<string, BlockRecord[]>;
}

type GlobalWithSafetyState = typeof globalThis & {
  [SAFETY_STATE_SYMBOL]?: SafetyState;
};

export function fileUserReport(input: FileUserReportInput): UserReport {
  const state = getSafetyState();
  const now = Date.now();
  const evidence = [...(input.evidence ?? [])].map((entry) => entry.trim()).filter(Boolean);
  const sanitizedDescription = input.description.trim();
  const weight = calculateReportWeight(input, evidence.length);
  const severity = classifySeverity(weight, input.severityHint);

  const report: UserReport = {
    id: crypto.randomUUID(),
    reporterId: input.reporterId,
    subjectId: input.subjectId,
    category: input.category,
    description: sanitizedDescription,
    channel: input.channel ?? "chat",
    evidence,
    occurrences: Math.max(1, input.occurrences ?? 1),
    severity,
    weight,
    status: "open",
    createdAt: now,
    updates: [],
  };

  state.reports.set(report.id, report);
  let index = state.reportsBySubject.get(report.subjectId);
  if (!index) {
    index = new Set();
    state.reportsBySubject.set(report.subjectId, index);
  }
  index.add(report.id);

  return report;
}

export function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  context: { note?: string; moderatorId?: string } = {},
): UserReport {
  const state = getSafetyState();
  const report = state.reports.get(reportId);
  if (!report) {
    throw new Error(`Report ${reportId} does not exist`);
  }

  if (report.status === status && !context.note && !context.moderatorId) {
    return report;
  }

  report.status = status;
  report.updates.push({
    at: Date.now(),
    status,
    note: context.note,
    moderatorId: context.moderatorId,
  });

  return report;
}

export function listReports(query: ReportQuery = {}): UserReport[] {
  const state = getSafetyState();
  let reports: UserReport[];

  if (query.subjectId) {
    const identifiers = state.reportsBySubject.get(query.subjectId);
    reports = identifiers
      ? [...identifiers]
          .map((id) => state.reports.get(id))
          .filter((record): record is UserReport => Boolean(record))
      : [];
  } else {
    reports = Array.from(state.reports.values());
  }

  return reports
    .filter((report) => (query.reporterId ? report.reporterId === query.reporterId : true))
    .filter((report) => (query.status ? report.status === query.status : true))
    .filter((report) => (query.severity ? report.severity === query.severity : true))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function detectSuspiciousActivity(input: SuspiciousActivityInput): SuspiciousActivityReport {
  const messages = input.messages.filter((message) => message.senderId === input.actorId);
  const signals: SuspiciousActivitySignal[] = [];
  let score = 0;

  if (messages.length > 1) {
    const sorted = [...messages].sort((a, b) => a.createdAt - b.createdAt);
    const first = sorted[0]!.createdAt;
    const last = sorted[sorted.length - 1]!.createdAt;
    const durationMinutes = Math.max(1, (last - first) / 60000);
    const rate = messages.length / durationMinutes;
    if (rate > 18) {
      signals.push({
        type: "message_velocity",
        weight: 18,
        severity: "medium",
        description: `Sent ${messages.length} messages in ${durationMinutes.toFixed(1)} minutes`,
      });
      score += 18;
    } else if (rate > 10) {
      signals.push({
        type: "message_velocity",
        weight: 12,
        severity: "low",
        description: `Elevated messaging cadence of ${rate.toFixed(1)} per minute`,
      });
      score += 12;
    }

    const repeated = countRepeatedBodies(messages);
    if (repeated >= 3) {
      signals.push({
        type: "repeated_content",
        weight: 14,
        severity: "medium",
        description: "Multiple repeated messages detected",
      });
      score += 14;
    }
  }

  const phishingSignals = findSuspiciousLinks(messages.map((message) => message.body).join(" \n"));
  if (phishingSignals.length > 0) {
    signals.push({
      type: "phishing_link",
      weight: 20,
      severity: "high",
      description: `Detected risky links: ${phishingSignals.join(", ")}`,
    });
    score += 20;
  }

  const riskyPhraseCount = messages.filter((message) => findRiskyPhrases(message.body).length > 0).length;
  if (riskyPhraseCount > 0) {
    signals.push({
      type: "risky_phrase",
      weight: Math.min(16, riskyPhraseCount * 6),
      severity: riskyPhraseCount > 1 ? "high" : "medium",
      description: `${riskyPhraseCount} messages contained high-risk phrases`,
    });
    score += Math.min(16, riskyPhraseCount * 6);
  }

  if (input.accountAgeHours < 12) {
    signals.push({
      type: "new_account",
      weight: 10,
      severity: "low",
      description: `Account age ${input.accountAgeHours.toFixed(1)} hours`,
    });
    score += 10;
  }

  if (input.reportsAgainstUser > 0) {
    signals.push({
      type: "user_reports",
      weight: Math.min(18, input.reportsAgainstUser * 6),
      severity: input.reportsAgainstUser > 2 ? "high" : "medium",
      description: `${input.reportsAgainstUser} prior reports on record`,
    });
    score += Math.min(18, input.reportsAgainstUser * 6);
  }

  if (input.failedVerifications > 0) {
    signals.push({
      type: "verification_failures",
      weight: Math.min(12, input.failedVerifications * 5),
      severity: input.failedVerifications > 1 ? "medium" : "low",
      description: `${input.failedVerifications} failed verification attempts`,
    });
    score += Math.min(12, input.failedVerifications * 5);
  }

  if (input.unusualGiftAttempts > 0) {
    signals.push({
      type: "gift_abuse",
      weight: Math.min(16, input.unusualGiftAttempts * 8),
      severity: input.unusualGiftAttempts > 1 ? "high" : "medium",
      description: `${input.unusualGiftAttempts} unusual Base Pay gift attempts blocked`,
    });
    score += Math.min(16, input.unusualGiftAttempts * 8);
  }

  if (input.blockedByOthers > 0) {
    signals.push({
      type: "user_blocks",
      weight: Math.min(12, input.blockedByOthers * 6),
      severity: input.blockedByOthers > 1 ? "medium" : "low",
      description: `${input.blockedByOthers} users blocked this account recently`,
    });
    score += Math.min(12, input.blockedByOthers * 6);
  }

  score = Math.min(100, score);
  const severity = deriveSeverityFromScore(score);
  const recommendedActions = buildRecommendedActions(severity, signals);

  return { score, severity, signals, recommendedActions };
}

export function analyzeMessageContent(body: string): ContentModerationResult {
  const sanitized = body.trim();
  const flags = findRiskyPhrases(sanitized);
  const linkFlags = findSuspiciousLinks(sanitized).map<ContentFlag>((link) => ({
    type: "phishing_link",
    severity: "high",
    snippet: link,
    message: `Potential phishing or off-platform link detected: ${link}`,
  }));
  const combinedFlags = [...flags, ...linkFlags];

  if (isShouting(sanitized)) {
    combinedFlags.push({
      type: "shouting",
      severity: "low",
      snippet: sanitized.slice(0, 60),
      message: "Message contains excessive capitalization and may feel aggressive",
    });
  }

  const severity = combinedFlags.length
    ? combinedFlags.reduce<ReportSeverity>((level, flag) =>
        compareSeverity(flag.severity, level) > 0 ? flag.severity : level,
      "low")
    : "low";

  return {
    severity: combinedFlags.length ? severity : "none",
    flags: combinedFlags,
    sanitizedText: sanitized,
    blockRecommended: combinedFlags.some((flag) => flag.severity === "high" && flag.type !== "shouting"),
  };
}

export function analyzeProfileContent(input: ProfileModerationInput): ContentModerationResult {
  const segments = [input.headline, input.bio, ...(input.highlights ?? []), ...(input.interests ?? [])]
    .filter((segment): segment is string => Boolean(segment && segment.trim().length))
    .map((segment) => segment!.trim());
  const combinedText = segments.join(" \n");
  const flags = findRiskyPhrases(combinedText);

  const linkFlags = (input.externalLinks ?? [])
    .map((link) => link.trim())
    .filter(Boolean)
    .flatMap((link) =>
      findSuspiciousLinks(link).map<ContentFlag>((suspicious) => ({
        type: "contact_request",
        severity: "medium",
        snippet: suspicious,
        message: `External link requires review: ${suspicious}`,
      })),
    );

  const combinedFlags = [...flags, ...linkFlags];
  if (!combinedText && combinedFlags.length === 0) {
    return { severity: "none", flags: [], sanitizedText: "", blockRecommended: false };
  }

  const severity = combinedFlags.length
    ? combinedFlags.reduce<ReportSeverity>((level, flag) =>
        compareSeverity(flag.severity, level) > 0 ? flag.severity : level,
      "low")
    : "low";

  return {
    severity: combinedFlags.length ? severity : "none",
    flags: combinedFlags,
    sanitizedText: combinedText,
    blockRecommended: combinedFlags.some((flag) => flag.severity === "high"),
  };
}

export function assessFraudRisk(input: FraudSignalInput): FraudRiskAssessment {
  let score = 0;
  const triggers: string[] = [];

  if (input.chargebackRate > 0.4) {
    score += 30;
    triggers.push(`Chargeback rate ${(input.chargebackRate * 100).toFixed(0)}%`);
  } else if (input.chargebackRate > 0.2) {
    score += 18;
    triggers.push(`Elevated chargeback rate ${(input.chargebackRate * 100).toFixed(0)}%`);
  }

  if (input.disputedGiftCount > 0) {
    const addition = Math.min(24, input.disputedGiftCount * 8);
    score += addition;
    triggers.push(`${input.disputedGiftCount} disputed gift attempts`);
  }

  if (!input.kycVerified) {
    score += 12;
    triggers.push("Wallet missing KYC verification");
  }

  if (input.walletAgeDays < 14) {
    score += 10;
    triggers.push(`Wallet age ${input.walletAgeDays} days`);
  }

  if (input.velocityLastHour > 4) {
    score += 12;
    triggers.push(`${input.velocityLastHour} premium purchases in the last hour`);
  }

  if (input.highValueGiftUsd > 500) {
    score += 16;
    triggers.push(`High-value gift attempt $${input.highValueGiftUsd.toFixed(0)}`);
  }

  if (input.failedPinAttempts > 2) {
    score += Math.min(12, input.failedPinAttempts * 3);
    triggers.push(`${input.failedPinAttempts} failed payment PIN attempts`);
  }

  score = Math.min(100, score);
  const level = deriveFraudLevel(score);
  const recommendedActions = buildFraudRecommendations(level, triggers);

  return { score, level, triggers, recommendedActions };
}

export function blockUser(blockerId: string, blockedId: string, options: BlockUserOptions = {}): BlockRecord {
  if (!blockerId || !blockedId) {
    throw new Error("Both blockerId and blockedId are required");
  }
  if (blockerId === blockedId) {
    throw new Error("A user cannot block themselves");
  }

  const state = getSafetyState();
  const now = Date.now();
  const expiration = normalizeExpiration(options.expiresAt);
  const list = state.blocks.get(blockerId) ?? [];
  pruneExpiredBlocks(list, now);

  const existing = list.find((entry) => entry.blockedId === blockedId && entry.active);
  if (existing) {
    if (expiration && (!existing.expiresAt || expiration > existing.expiresAt)) {
      existing.expiresAt = expiration;
    }
    if (options.reason) {
      existing.reason = options.reason;
    }
    if (options.note) {
      existing.note = options.note;
    }
    return existing;
  }

  const record: BlockRecord = {
    id: crypto.randomUUID(),
    blockerId,
    blockedId,
    reason: options.reason,
    note: options.note,
    createdAt: now,
    expiresAt: expiration ?? undefined,
    active: true,
  };

  list.unshift(record);
  state.blocks.set(blockerId, list);
  return record;
}

export function unblockUser(blockerId: string, blockedId: string): boolean {
  const state = getSafetyState();
  const list = state.blocks.get(blockerId);
  if (!list) {
    return false;
  }

  let updated = false;
  for (const record of list) {
    if (record.blockedId === blockedId && record.active) {
      record.active = false;
      record.expiresAt = Date.now();
      updated = true;
    }
  }
  return updated;
}

export function listBlockedUsers(blockerId: string): BlockRecord[] {
  const state = getSafetyState();
  const list = state.blocks.get(blockerId);
  if (!list) {
    return [];
  }

  pruneExpiredBlocks(list, Date.now());
  return list.filter((record) => record.active).sort((a, b) => b.createdAt - a.createdAt);
}

export function isUserBlocked(userA: string, userB: string): boolean {
  return (
    listBlockedUsers(userA).some((record) => record.blockedId === userB) ||
    listBlockedUsers(userB).some((record) => record.blockedId === userA)
  );
}

export function resetModerationStateForTesting() {
  const globalObject = globalThis as GlobalWithSafetyState;
  globalObject[SAFETY_STATE_SYMBOL] = createSafetyState();
}

function getSafetyState(): SafetyState {
  const globalObject = globalThis as GlobalWithSafetyState;
  if (!globalObject[SAFETY_STATE_SYMBOL]) {
    globalObject[SAFETY_STATE_SYMBOL] = createSafetyState();
  }
  return globalObject[SAFETY_STATE_SYMBOL]!;
}

function createSafetyState(): SafetyState {
  return {
    reports: new Map(),
    reportsBySubject: new Map(),
    blocks: new Map(),
  };
}

function calculateReportWeight(input: FileUserReportInput, evidenceCount: number): number {
  const baseWeight: Record<ReportCategory, number> = {
    harassment: 28,
    spam: 18,
    fraud: 36,
    impersonation: 30,
    inappropriate: 22,
    other: 14,
  };

  let score = baseWeight[input.category] ?? 15;
  score += Math.min(20, evidenceCount * 6);
  score += Math.min(18, Math.max(0, (input.occurrences ?? 1) - 1) * 6);
  if (input.severityHint === "high") {
    score += 12;
  } else if (input.severityHint === "medium") {
    score += 6;
  }
  return Math.min(100, score);
}

function classifySeverity(weight: number, hint?: ReportSeverity): ReportSeverity {
  if (hint === "high" && weight >= 60) {
    return "high";
  }
  if (weight >= 70) {
    return "high";
  }
  if (weight >= 40) {
    return "medium";
  }
  return "low";
}

function deriveSeverityFromScore(score: number): ReportSeverity {
  if (score >= 70) {
    return "high";
  }
  if (score >= 40) {
    return "medium";
  }
  return "low";
}

function buildRecommendedActions(
  severity: ReportSeverity,
  signals: SuspiciousActivitySignal[],
): string[] {
  if (signals.length === 0) {
    return [];
  }
  if (severity === "high") {
    return ["immediate_review", "suspend_messaging", "require_manual_verification"];
  }
  if (severity === "medium") {
    return ["flag_for_review", "limit_outbound_messages"];
  }
  return ["monitor_activity"];
}

const RISKY_PHRASE_PATTERNS: Array<{
  pattern: RegExp;
  type: ContentFlagType;
  severity: ReportSeverity;
  message: string;
}> = [
  {
    pattern: /(seed phrase|secret recovery|private key|passphrase)/i,
    type: "scam",
    severity: "high",
    message: "Request for sensitive wallet recovery information",
  },
  {
    pattern: /(guaranteed|risk[-\s]?free|double your).*(return|profit|payout)/i,
    type: "scam",
    severity: "high",
    message: "Unrealistic profit guarantees detected",
  },
  {
    pattern: /(airdrop|claim).*(link|now|today)/i,
    type: "spam",
    severity: "medium",
    message: "Potential unsolicited airdrop promotion",
  },
  {
    pattern: /(telegram|whatsapp|signal|snapchat|discord|gmail|email|phone number)/i,
    type: "contact_request",
    severity: "medium",
    message: "Off-platform contact request detected",
  },
  {
    pattern: /(onlyfans|explicit|nsfw|adult content)/i,
    type: "nsfw",
    severity: "medium",
    message: "Adult content reference detected",
  },
  {
    pattern: /(wire|send).*(eth|btc|usdc|usdt)/i,
    type: "scam",
    severity: "medium",
    message: "Direct crypto transfer request detected",
  },
];

const SUSPICIOUS_LINK_PATTERNS: RegExp[] = [
  /(https?:\/\/)?t\.me\//i,
  /(https?:\/\/)?wa\.me\//i,
  /(https?:\/\/)?discord\.gg\//i,
  /(https?:\/\/)?discord\.com\/invite\//i,
  /(https?:\/\/)?onlyfans\.com\//i,
  /(https?:\/\/)?cash\.app\//i,
  /(https?:\/\/)?telegram\.me\//i,
];

function findRiskyPhrases(text: string): ContentFlag[] {
  if (!text) {
    return [];
  }

  const flags: ContentFlag[] = [];
  for (const rule of RISKY_PHRASE_PATTERNS) {
    const match = text.match(rule.pattern);
    if (match) {
      flags.push({
        type: rule.type,
        severity: rule.severity,
        snippet: match[0] ?? text.slice(0, 60),
        message: rule.message,
      });
    }
  }
  return flags;
}

function findSuspiciousLinks(text: string): string[] {
  const results = new Set<string>();
  const genericMatches = text.match(/https?:\/\/[^\s]+/gi) ?? [];
  for (const link of genericMatches) {
    results.add(link);
  }
  for (const pattern of SUSPICIOUS_LINK_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        results.add(match);
      }
    }
  }
  return [...results];
}

function countRepeatedBodies(messages: ModerationMessage[]): number {
  const counts = new Map<string, number>();
  for (const message of messages) {
    const normalized = message.body.trim().toLowerCase();
    if (!normalized) {
      continue;
    }
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }
  let repeated = 0;
  for (const [, value] of counts) {
    if (value > 1) {
      repeated += 1;
    }
  }
  return repeated;
}

function compareSeverity(a: ReportSeverity, b: ReportSeverity): number {
  const order: Record<ReportSeverity, number> = { low: 0, medium: 1, high: 2 };
  return order[a] - order[b];
}

function isShouting(text: string): boolean {
  if (text.length < 12) {
    return false;
  }
  const uppercaseCount = text.replace(/[^A-Z]/g, "").length;
  return uppercaseCount / text.length > 0.6;
}

function deriveFraudLevel(score: number): FraudRiskLevel {
  if (score >= 70) {
    return "high";
  }
  if (score >= 40) {
    return "medium";
  }
  return "low";
}

function buildFraudRecommendations(level: FraudRiskLevel, triggers: string[]): string[] {
  if (level === "high") {
    return ["pause_gifts", "require_manual_review", "notify_security_team"];
  }
  if (level === "medium") {
    return ["limit_transaction_amounts", "request_kyc_update"];
  }
  return triggers.length ? ["continue_monitoring"] : [];
}

function normalizeExpiration(input?: number | Date): number | undefined {
  if (!input) {
    return undefined;
  }
  if (input instanceof Date) {
    return input.getTime();
  }
  return input;
}

function pruneExpiredBlocks(blocks: BlockRecord[], now: number) {
  for (const record of blocks) {
    if (record.active && record.expiresAt && record.expiresAt <= now) {
      record.active = false;
    }
  }
}
