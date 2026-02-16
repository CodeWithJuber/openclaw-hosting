/**
 * Error classes for Browser-Use skill
 */

class BrowserError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BrowserError';
  }
}

class NavigationError extends BrowserError {
  constructor(message, url) {
    super(message);
    this.name = 'NavigationError';
    this.url = url;
  }
}

class ElementNotFoundError extends BrowserError {
  constructor(message, selector) {
    super(message);
    this.name = 'ElementNotFoundError';
    this.selector = selector;
  }
}

class TimeoutError extends BrowserError {
  constructor(message, timeout) {
    super(message);
    this.name = 'TimeoutError';
    this.timeout = timeout;
  }
}

class AuthenticationError extends BrowserError {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

class ValidationError extends BrowserError {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.validationErrors = errors;
  }
}

class ProxyError extends BrowserError {
  constructor(message, proxy) {
    super(message);
    this.name = 'ProxyError';
    this.proxy = proxy;
  }
}

class SessionError extends BrowserError {
  constructor(message) {
    super(message);
    this.name = 'SessionError';
  }
}

module.exports = {
  BrowserError,
  NavigationError,
  ElementNotFoundError,
  TimeoutError,
  AuthenticationError,
  ValidationError,
  ProxyError,
  SessionError
};
