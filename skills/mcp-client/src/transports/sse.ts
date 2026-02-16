/**
 * SSE Transport Implementation
 */

import { BaseTransport } from './base.js';
import type { JSONRPCMessage } from '../types/index.js';
import { MCPConnectionError, MCPProtocolError } from '../errors/index.js';

export interface SSETransportOptions {
  url: string;
  headers?: Record<string, string>;
}

export class SSEClientTransport extends BaseTransport {
  private eventSource: EventSource | null = null;
  private endpoint: string | null = null;

  constructor(private options: SSETransportOptions) {
    super();
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const { url, headers } = this.options;

      // For Node.js environments, we need to use a polyfill or native implementation
      if (typeof EventSource === 'undefined') {
        reject(new MCPConnectionError('EventSource not available. Use stdio transport or provide EventSource polyfill.'));
        return;
      }

      this.eventSource = new EventSource(url, {
        headers
      });

      this.eventSource.onopen = () => {
        this._connected = true;
        resolve();
      };

      this.eventSource.onerror = (error) => {
        this.emit('error', new MCPConnectionError(`SSE error: ${error}`));
        reject(error);
      };

      this.eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as JSONRPCMessage;
          this.queueMessage(message);
        } catch (error) {
          this.emit('error', new MCPProtocolError(`Failed to parse SSE message: ${event.data}`));
        }
      };

      // Handle endpoint event
      this.eventSource.addEventListener('endpoint', (event) => {
        this.endpoint = event.data;
      });
    });
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (!this._connected || !this.endpoint) {
      throw new MCPConnectionError('SSE transport not connected or endpoint not received');
    }

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.options.headers
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      throw new MCPConnectionError(`HTTP error: ${response.status}`);
    }
  }

  async close(): Promise<void> {
    this._connected = false;
    this.eventSource?.close();
    this.eventSource = null;
  }
}
