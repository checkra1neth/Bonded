import type { ChatMessage, ChatMessageEncryption } from "./types";
import {
  ensureConversationKey,
  getKeyByFingerprint,
  markKeyUsed,
  type ConversationKeyRecord,
} from "../security/keyVault";

interface EncryptOptions {
  associatedData?: Record<string, string> | string;
  previewLength?: number;
}

interface DecryptOptions {
  associatedData?: Record<string, string> | string;
}

export async function encryptChatMessage(
  conversationId: string,
  plaintext: string,
  options: EncryptOptions = {},
): Promise<{ payload: ChatMessageEncryption; preview: string }> {
  const record = ensureConversationKey(conversationId);
  const key = await getCryptoKey(record);
  const iv = generateRandomBytes(12);
  const encoder = new TextEncoder();
  const encodedPlaintext = encoder.encode(plaintext);
  const additionalData = encodeAssociatedData(options.associatedData);

  const encrypted = await subtleEncrypt(key, iv, additionalData, encodedPlaintext);
  const { ciphertext, authTag } = splitCiphertextAndTag(new Uint8Array(encrypted));

  const payload: ChatMessageEncryption = {
    version: "1",
    algorithm: "AES-256-GCM",
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
    authTag: toBase64(authTag),
    fingerprint: record.fingerprint,
  };

  if (typeof options.associatedData === "string") {
    payload.associatedData = options.associatedData;
  } else if (options.associatedData) {
    payload.associatedData = stringifyAssociatedData(options.associatedData);
  }

  markKeyUsed(record);

  return {
    payload,
    preview: maskPreview(plaintext, options.previewLength),
  };
}

export async function decryptChatMessage(
  payload: ChatMessageEncryption,
  conversationId?: string,
  options: DecryptOptions = {},
): Promise<string> {
  const record = getKeyByFingerprint(payload.fingerprint);
  if (!record) {
    throw new Error("Unknown encryption fingerprint");
  }

  if (conversationId && record.conversationId !== conversationId) {
    throw new Error("Conversation mismatch for encrypted message");
  }

  const key = await getCryptoKey(record);
  const iv = fromBase64(payload.iv);
  const ciphertext = fromBase64(payload.ciphertext);
  const authTag = fromBase64(payload.authTag);
  const additionalData = encodeAssociatedData(options.associatedData ?? payload.associatedData);

  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext, 0);
  combined.set(authTag, ciphertext.length);

  const decrypted = await subtleDecrypt(key, iv, additionalData, combined);
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

export function scrubMessageForTransmission(
  message: ChatMessage,
  options: { includePlaintext: boolean },
): ChatMessage {
  if (options.includePlaintext) {
    return message;
  }

  const { body: _body, ...rest } = message;
  return {
    ...rest,
    body: message.preview ?? maskPreview(message.body ?? ""),
  };
}

export function maskPreview(plaintext: string, limit = 120): string {
  const normalized = plaintext.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return "Encrypted message";
  }
  if (normalized.length <= limit) {
    return normalized;
  }
  return `${normalized.slice(0, limit - 1)}…`;
}

async function getCryptoKey(record: ConversationKeyRecord): Promise<CryptoKey> {
  if (record.cryptoKey) {
    return record.cryptoKey;
  }

  const subtle = getSubtle();
  const key = await subtle.importKey("raw", record.material, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
  record.cryptoKey = key;
  return key;
}

function encodeAssociatedData(data?: Record<string, string> | string): ArrayBuffer {
  if (!data) {
    return new ArrayBuffer(0);
  }

  const encoder = new TextEncoder();
  const encoded = typeof data === "string"
    ? encoder.encode(data)
    : encoder.encode(stringifyAssociatedData(data));

  return toArrayBuffer(encoded);
}

function stringifyAssociatedData(data: Record<string, string>): string {
  return Object.keys(data)
    .sort()
    .map((key) => `${key}:${data[key]}`)
    .join("|");
}

function splitCiphertextAndTag(bytes: Uint8Array): { ciphertext: Uint8Array; authTag: Uint8Array } {
  if (bytes.length < 16) {
    throw new Error("Encrypted payload too short");
  }
  const cipher = bytes.slice(0, bytes.length - 16);
  const tag = bytes.slice(bytes.length - 16);
  return { ciphertext: cipher, authTag: tag };
}

async function subtleEncrypt(
  key: CryptoKey,
  iv: Uint8Array,
  additionalData: ArrayBuffer,
  data: Uint8Array,
): Promise<ArrayBuffer> {
  const subtle = getSubtle();
  return subtle.encrypt({ name: "AES-GCM", iv, additionalData }, key, data);
}

async function subtleDecrypt(
  key: CryptoKey,
  iv: Uint8Array,
  additionalData: ArrayBuffer,
  data: Uint8Array,
): Promise<ArrayBuffer> {
  const subtle = getSubtle();
  return subtle.decrypt({ name: "AES-GCM", iv, additionalData }, key, data);
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

function fromBase64(value: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64"));
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function generateRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(array);
    return array;
  }
  throw new Error("Secure random generator not available");
}

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  if (view.buffer instanceof ArrayBuffer && view.byteOffset === 0 && view.byteLength === view.buffer.byteLength) {
    return view.buffer;
  }

  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  return copy.buffer;
}

function getSubtle(): SubtleCrypto {
  const subtle = crypto?.subtle;
  if (!subtle) {
    throw new Error("SubtleCrypto API is not available in this environment");
  }
  return subtle;
}
