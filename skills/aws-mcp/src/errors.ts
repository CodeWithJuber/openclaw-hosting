/**
 * Error classes for AWS MCP Skill
 */

export class AWSSkillError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'AWSSkillError';
  }
}

export class AWSCredentialsError extends AWSSkillError {
  constructor(message: string) {
    super(message, 'CREDENTIALS_ERROR');
    this.name = 'AWSCredentialsError';
  }
}

export class AWSPermissionError extends AWSSkillError {
  constructor(
    message: string,
    public readonly requiredPermission?: string,
    public readonly resourceArn?: string
  ) {
    super(message, 'PERMISSION_ERROR');
    this.name = 'AWSPermissionError';
  }
}

export class AWSResourceNotFoundError extends AWSSkillError {
  constructor(
    message: string,
    public readonly resourceType?: string,
    public readonly resourceId?: string
  ) {
    super(message, 'RESOURCE_NOT_FOUND');
    this.name = 'AWSResourceNotFoundError';
  }
}

export class AWSRateLimitError extends AWSSkillError {
  constructor(
    message: string,
    public readonly retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_ERROR');
    this.name = 'AWSRateLimitError';
  }
}

export class AWSServiceError extends AWSSkillError {
  constructor(
    message: string,
    public readonly serviceName?: string,
    public readonly originalError?: Error
  ) {
    super(message, 'SERVICE_ERROR');
    this.name = 'AWSServiceError';
  }
}

export class AWSValidationError extends AWSSkillError {
  constructor(
    message: string,
    public readonly fieldErrors?: Record<string, string>
  ) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'AWSValidationError';
  }
}

/**
 * Convert AWS SDK errors to skill errors
 */
export function convertAwsError(error: any): AWSSkillError {
  const name = error?.name || error?.Code || 'UnknownError';
  const message = error?.message || error?.Message || 'Unknown error';

  // Credential errors
  if (
    name.includes('Credentials') ||
    name.includes('TokenRefresh') ||
    message.includes('credentials') ||
    message.includes('authentication')
  ) {
    return new AWSCredentialsError(message);
  }

  // Permission errors
  if (
    name.includes('AccessDenied') ||
    name.includes('Unauthorized') ||
    name.includes('Forbidden')
  ) {
    return new AWSPermissionError(message);
  }

  // Resource not found
  if (
    name.includes('NotFound') ||
    name.includes('NoSuch') ||
    name.includes('DoesNotExist')
  ) {
    return new AWSResourceNotFoundError(message);
  }

  // Rate limiting
  if (
    name.includes('Throttling') ||
    name.includes('RateExceeded') ||
    name.includes('TooManyRequests')
  ) {
    const retryAfter = error.$metadata?.retryDelay || 1000;
    return new AWSRateLimitError(message, retryAfter);
  }

  // Validation errors
  if (
    name.includes('Validation') ||
    name.includes('InvalidParameter')
  ) {
    return new AWSValidationError(message);
  }

  // Default service error
  return new AWSServiceError(message, undefined, error);
}
