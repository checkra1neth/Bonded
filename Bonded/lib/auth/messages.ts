export type AuthMessageOptions = {
  address: string;
  domain: string;
  nonce: string;
};

export function createAuthMessage({ address, domain, nonce }: AuthMessageOptions) {
  return `Bonded requests wallet verification on ${domain}.` +
    "\n\n" +
    `Address: ${address}` +
    "\n" +
    `Nonce: ${nonce}` +
    "\n\n" +
    "Signing proves you own this wallet and permits Bonded to create a private session without requesting balances.";
}
