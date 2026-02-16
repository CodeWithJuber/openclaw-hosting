const pRetry = require('p-retry');

/**
 * Execute function with retry logic
 */
async function withRecovery(fn, options = {}) {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    onError,
    fallback,
    retryCondition
  } = options;
  
  const retryOptions = {
    retries: maxAttempts - 1,
    minTimeout: delay,
    onFailedAttempt: (error) => {
      if (onError) {
        onError(error, error.attemptNumber);
      }
    }
  };
  
  if (backoff === 'linear') {
    retryOptions.factor = 1;
  } else if (backoff === 'exponential') {
    retryOptions.factor = 2;
  }
  
  if (retryCondition) {
    retryOptions.shouldRetry = retryCondition;
  }
  
  try {
    return await pRetry(fn, retryOptions);
  } catch (error) {
    if (fallback) {
      return fallback(error);
    }
    throw error;
  }
}

/**
 * Retry with specific error types
 */
async function retryOnErrors(fn, errorTypes, options = {}) {
  const retryCondition = (error) => {
    return errorTypes.some(ErrorType => error instanceof ErrorType);
  };
  
  return withRecovery(fn, { ...options, retryCondition });
}

/**
 * Timeout wrapper
 */
async function withTimeout(fn, timeoutMs) {
  return Promise.race([
    fn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
    )
  ]);
}

module.exports = {
  withRecovery,
  retryOnErrors,
  withTimeout
};
