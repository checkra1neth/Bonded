import { randomBytes } from "crypto";

export function createNonce(length = 16) {
  return randomBytes(length).toString("hex");
}
