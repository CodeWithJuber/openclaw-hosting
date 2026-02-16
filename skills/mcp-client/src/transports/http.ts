/**
 * HTTP Transport Implementation
 */

import { BaseTransport } from './base.js';
import type { JSONRPCMessage } from '../types/index.js';
import { MCPConnectionError, MCPProtocolError } from '../errors/index.js';

export interface HTTPTransportOptions {
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export class HTTPClientTransport extends BaseTransport {
  private abortController: AbortController | null = null;

  constructor(private options: HTTPTransportOptions) {
    super();
  }

  async connect(): Promise<void> {
    // HTTP is stateless, so we just mark as connected
    this._connected = true;
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (!this._connected) {
      throw new MCPConnectionError('HTTP transport not connected');
    }

    const { url, headers, timeout = 30000 } = this.options;
    this.abortController = new AbortController();

    const timeoutId = setTimeout(() => {
      this.abortController?.abort();
    }, timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(message),
        signal: this.abortController.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new MCPConnectionError(`HTTP error: ${response.status}`);
      }

      const data = await response.json() as JSONRPCMessage;
      this.queueMessage(data);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new MCPConnectionError('Request timeout');
      }
      throw error;
    }
  }

  async close(): Promise<void> {
    this._connected = false;
    this.abortController?.abort();
  }
}
