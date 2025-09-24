import { createHash } from "crypto";
import { createPublicClient, getAddress, http, isAddress } from "viem";
import { base, mainnet } from "viem/chains";
import { getServerEnv } from "../config/env";
import { logger } from "../observability/logger";
import { IdentityResolutionError, InvalidAddressError } from "./errors";

export type WalletIdentity = {
  address: string;
  ensName: string | null;
  basename: string | null;
  fallbackName: string;
  primaryName: string;
  primarySource: "ens" | "basename" | "fallback";
  isSmartContract: boolean;
};

const serverEnv = getServerEnv();
const defaultBaseRpc = serverEnv.BASE_RPC_URL ?? "https://mainnet.base.org";
const defaultEthereumRpc = serverEnv.ETHEREUM_RPC_URL ?? "https://eth.llamarpc.com";

const baseClient = createPublicClient({
  chain: base,
  transport: http(defaultBaseRpc),
});

const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(defaultEthereumRpc),
});

export function formatAddress(address: string) {
  const checksum = getAddress(address);
  return `${checksum.slice(0, 6)}…${checksum.slice(-4)}`;
}

export async function resolveWalletIdentity(address: string): Promise<WalletIdentity> {
  if (!isAddress(address)) {
    throw new InvalidAddressError();
  }

  const checksumAddress = getAddress(address);
  const env = getServerEnv();
  const disableNetwork = env.AUTH_DISABLE_NETWORK === "true";

  let isSmartContract = false;

  if (!disableNetwork) {
    try {
      const bytecode = await baseClient.getBytecode({ address: checksumAddress });
      isSmartContract = bytecode !== undefined && bytecode !== "0x";
    } catch (error) {
      logger.warn("Unable to inspect Base address bytecode", { error });
    }
  }

  let ensName: string | null = null;

  if (!disableNetwork) {
    try {
      ensName = await mainnetClient.getEnsName({ address: checksumAddress });
    } catch (error) {
      logger.warn("Unable to resolve ENS name", { error });
    }
  }

  let basename: string | null = null;
  const resolverEndpoint = env.BASENAME_RESOLVER_URL?.trim();

  if (!disableNetwork && resolverEndpoint && typeof fetch === "function") {
    const normalizedEndpoint = resolverEndpoint.endsWith("/")
      ? resolverEndpoint.slice(0, -1)
      : resolverEndpoint;

    try {
      const response = await fetch(`${normalizedEndpoint}/${checksumAddress}`);
      if (response.ok) {
        const payload = (await response.json()) as { basename?: string; name?: string };
        basename = payload.basename ?? payload.name ?? null;
      }
    } catch (error) {
      logger.warn("Unable to resolve Basename", { error, endpoint: normalizedEndpoint });
    }
  }

  const fallbackName = generateFallbackBasename(checksumAddress);
  const primaryName = ensName ?? basename ?? fallbackName;
  const primarySource: WalletIdentity["primarySource"] = ensName
    ? "ens"
    : basename
    ? "basename"
    : "fallback";

  if (!ensName && !basename && primarySource === "fallback" && disableNetwork) {
    logger.warn(
      "Wallet identity resolution skipped network lookups. Falling back to deterministic Basename.",
      { address: checksumAddress },
    );
  }

  return {
    address: checksumAddress,
    ensName,
    basename,
    fallbackName,
    primaryName,
    primarySource,
    isSmartContract,
  };
}

function generateFallbackBasename(address: string) {
  const words = [
    ["lunar", "solar", "stellar", "quantum", "ethereal", "aqua", "ember", "neon", "plasma", "orbital"],
    ["builder", "guardian", "oracle", "scout", "pilot", "degen", "whale", "archon", "curator", "captain"],
    ["alpha", "beta", "gamma", "delta", "omega", "sigma", "lambda", "theta", "zeta", "omicron"],
  ];

  const hash = createHash("sha256").update(address.toLowerCase()).digest();

  const segments = words.map((choices, index) => {
    const value = hash[index] ?? index;
    return choices[value % choices.length];
  });

  return `${segments.join("-")}.base`;
}

export function assertIdentity(identity: WalletIdentity) {
  if (!identity.primaryName) {
    throw new IdentityResolutionError("Unable to derive wallet primary name");
  }
}
