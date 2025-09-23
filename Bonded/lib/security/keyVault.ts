const KEY_VAULT_SYMBOL = Symbol.for("bonded.security.keyVault");

export interface ConversationKeyRecord {
  id: string;
  conversationId: string;
  material: Uint8Array;
  createdAt: number;
  expiresAt: number;
  lastRotatedAt: number;
  lastUsedAt: number | null;
  usageCount: number;
  fingerprint: string;
  revoked: boolean;
  cryptoKey?: CryptoKey;
}

interface KeyVaultState {
  byConversation: Map<string, ConversationKeyRecord[]>;
  byFingerprint: Map<string, ConversationKeyRecord>;
  ttlMs: number;
}

type GlobalWithKeyVault = typeof globalThis & {
  [KEY_VAULT_SYMBOL]?: KeyVaultState;
};

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const KEY_LENGTH_BYTES = 32;

export interface ConversationKeyOptions {
  ttlMs?: number;
  material?: Uint8Array;
}

export function createConversationKey(
  conversationId: string,
  options: ConversationKeyOptions = {},
): ConversationKeyRecord {
  const vault = getKeyVault();
  const ttlMs = options.ttlMs ?? vault.ttlMs;
  const now = Date.now();
  const material = options.material ?? generateRandomBytes(KEY_LENGTH_BYTES);
  const record: ConversationKeyRecord = {
    id: crypto.randomUUID(),
    conversationId,
    material,
    createdAt: now,
    expiresAt: now + ttlMs,
    lastRotatedAt: now,
    lastUsedAt: null,
    usageCount: 0,
    fingerprint: createFingerprint(material),
    revoked: false,
  };

  storeRecord(vault, record);
  return record;
}

export function ensureConversationKey(
  conversationId: string,
  options: ConversationKeyOptions = {},
): ConversationKeyRecord {
  const vault = getKeyVault();
  pruneExpired(conversationId, vault);
  const existing = getActiveConversationKey(conversationId);
  if (existing) {
    return existing;
  }
  return createConversationKey(conversationId, options);
}

export function getActiveConversationKey(
  conversationId: string,
): ConversationKeyRecord | undefined {
  const vault = getKeyVault();
  const records = vault.byConversation.get(conversationId);
  if (!records?.length) {
    return undefined;
  }

  const now = Date.now();
  return records.find((record) => !record.revoked && record.expiresAt > now);
}

export function getKeyByFingerprint(
  fingerprint: string,
): ConversationKeyRecord | undefined {
  const vault = getKeyVault();
  const record = vault.byFingerprint.get(fingerprint);
  if (!record) {
    return undefined;
  }
  if (record.revoked || record.expiresAt <= Date.now()) {
    return undefined;
  }
  return record;
}

export function rotateConversationKey(
  conversationId: string,
  options: ConversationKeyOptions = {},
): ConversationKeyRecord {
  const vault = getKeyVault();
  pruneExpired(conversationId, vault);
  const record = createConversationKey(conversationId, options);
  record.lastRotatedAt = Date.now();
  return record;
}

export function revokeConversationKey(record: ConversationKeyRecord) {
  record.revoked = true;
}

export function markKeyUsed(record: ConversationKeyRecord) {
  record.usageCount += 1;
  record.lastUsedAt = Date.now();
}

export function exportKeyMaterial(
  record: ConversationKeyRecord,
  format: "base64" | "hex" = "base64",
): string {
  if (format === "hex") {
    return Array.from(record.material)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  return toBase64(record.material);
}

export function resetKeyVaultForTesting() {
  const globalObject = globalThis as GlobalWithKeyVault;
  globalObject[KEY_VAULT_SYMBOL] = createVault();
}

function getKeyVault(): KeyVaultState {
  const globalObject = globalThis as GlobalWithKeyVault;
  if (!globalObject[KEY_VAULT_SYMBOL]) {
    globalObject[KEY_VAULT_SYMBOL] = createVault();
  }
  return globalObject[KEY_VAULT_SYMBOL]!;
}

function createVault(): KeyVaultState {
  return {
    byConversation: new Map(),
    byFingerprint: new Map(),
    ttlMs: DEFAULT_TTL_MS,
  };
}

function storeRecord(vault: KeyVaultState, record: ConversationKeyRecord) {
  const list = vault.byConversation.get(record.conversationId) ?? [];
  list.unshift(record);
  vault.byConversation.set(record.conversationId, list);
  vault.byFingerprint.set(record.fingerprint, record);
}

function pruneExpired(conversationId: string, vault: KeyVaultState) {
  const records = vault.byConversation.get(conversationId);
  if (!records?.length) {
    return;
  }
  const now = Date.now();
  const active: ConversationKeyRecord[] = [];
  for (const record of records) {
    if (record.revoked || record.expiresAt <= now) {
      vault.byFingerprint.delete(record.fingerprint);
    } else {
      active.push(record);
    }
  }
  vault.byConversation.set(conversationId, active);
}

function generateRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(array);
    return array;
  }
  throw new Error("Secure random generator is not available");
}

function createFingerprint(material: Uint8Array): string {
  let hash = 0;
  for (const byte of material) {
    hash = (hash * 31 + byte) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function toBase64(data: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(data).toString("base64");
  }
  let binary = "";
  data.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}
