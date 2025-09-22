export class AuthError extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidAddressError extends AuthError {
  constructor(message = "Invalid wallet address provided") {
    super(message, 400);
  }
}

export class MissingNonceError extends AuthError {
  constructor(message = "Missing wallet verification nonce") {
    super(message, 400);
  }
}

export class SignatureVerificationError extends AuthError {
  constructor(message = "Unable to verify wallet signature") {
    super(message, 401);
  }
}

export class MissingFarcasterTokenError extends AuthError {
  constructor(message = "Sign-In-With-Farcaster token is required") {
    super(message, 401);
  }
}

export class SessionVerificationError extends AuthError {
  constructor(message = "Invalid or expired session token") {
    super(message, 401);
  }
}

export class IdentityResolutionError extends AuthError {
  constructor(message = "Failed to resolve wallet identity") {
    super(message, 502);
  }
}
