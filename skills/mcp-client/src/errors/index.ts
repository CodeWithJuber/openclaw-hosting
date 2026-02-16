/**
 * MCP Error Classes
 */

export class MCPError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MCPError';
    Object.setPrototypeOf(this, MCPError.prototype);
  }
}

export class MCPConnectionError extends MCPError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONNECTION_ERROR', details);
    this.name = 'MCPConnectionError';
    Object.setPrototypeOf(this, MCPConnectionError.prototype);
  }
}

export class MCPTimeoutError extends MCPError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'TIMEOUT_ERROR', details);
    this.name = 'MCPTimeoutError';
    Object.setPrototypeOf(this, MCPTimeoutError.prototype);
  }
}

export class MCPProtocolError extends MCPError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PROTOCOL_ERROR', details);
    this.name = 'MCPProtocolError';
    Object.setPrototypeOf(this, MCPProtocolError.prototype);
  }
}

export class MCPAuthenticationError extends MCPError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', details);
    this.name = 'MCPAuthenticationError';
    Object.setPrototypeOf(this, MCPAuthenticationError.prototype);
  }
}

export class MCPAuthorizationError extends MCPError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', details);
    this.name = 'MCPAuthorizationError';
    Object.setPrototypeOf(this, MCPAuthorizationError.prototype);
  }
}

export class MCPNotFoundError extends MCPError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NOT_FOUND', details);
    this.name = 'MCPNotFoundError';
    Object.setPrototypeOf(this, MCPNotFoundError.prototype);
  }
}

export class MCPValidationError extends MCPError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'MCPValidationError';
    Object.setPrototypeOf(this, MCPValidationError.prototype);
  }
}

export class MCPRetryExhaustedError extends MCPError {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: Error,
    details?: Record<string, unknown>
  ) {
    super(message, 'RETRY_EXHAUSTED', details);
    this.name = 'MCPRetryExhaustedError';
    Object.setPrototypeOf(this, MCPRetryExhaustedError.prototype);
  }
}

export function isMCPError(error: unknown): error is MCPError {
  return error instanceof MCPError;
}

export function isRetryableError(error: unknown): boolean {
  if (!isMCPError(error)) {
    return true; // Unknown errors are retryable by default
  }
  
  const nonRetryableCodes = [
    'AUTHENTICATION_ERROR',
    'AUTHORIZATION_ERROR',
    'VALIDATION_ERROR',
    'NOT_FOUND'
  ];
  
  return !nonRetryableCodes.includes(error.code);
}
