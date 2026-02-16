/**
 * Structured API error classes
 */

class ApiError extends Error {
  constructor(message, config) {
    super(message);
    this.name = 'ApiError';
    this.config = config;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

class NetworkError extends ApiError {
  constructor(message, config) {
    super(message, config);
    this.name = 'NetworkError';
  }
}

class TimeoutError extends ApiError {
  constructor(message, config) {
    super(message, config);
    this.name = 'TimeoutError';
  }
}

class RateLimitError extends ApiError {
  constructor(message, config, retryAfter) {
    super(message, config);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

class AuthenticationError extends ApiError {
  constructor(message, config) {
    super(message, config);
    this.name = 'AuthenticationError';
  }
}

class ValidationError extends ApiError {
  constructor(message, config, validationErrors) {
    super(message, config);
    this.name = 'ValidationError';
    this.validationErrors = validationErrors || {};
  }
}

class NotFoundError extends ApiError {
  constructor(message, config) {
    super(message, config);
    this.name = 'NotFoundError';
  }
}

class ServerError extends ApiError {
  constructor(message, config, status) {
    super(message, config);
    this.name = 'ServerError';
    this.status = status;
  }
}

/**
 * Create appropriate error from HTTP response
 */
function createErrorFromResponse(error, config) {
  const status = error.response?.status;
  const data = error.response?.data;
  
  if (!status) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return new TimeoutError('Request timeout', config);
    }
    return new NetworkError(error.message, config);
  }
  
  switch (status) {
    case 401:
      return new AuthenticationError('Authentication failed', config);
    case 403:
      return new AuthenticationError('Access forbidden', config);
    case 404:
      return new NotFoundError('Resource not found', config);
    case 422:
      return new ValidationError('Validation failed', config, data?.errors);
    case 429:
      const retryAfter = error.response.headers['retry-after'];
      return new RateLimitError('Rate limit exceeded', config, parseInt(retryAfter) || 60);
    default:
      if (status >= 500) {
        return new ServerError('Server error', config, status);
      }
      return new ApiError(error.message, config);
  }
}

module.exports = {
  ApiError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  ServerError,
  createErrorFromResponse
};
