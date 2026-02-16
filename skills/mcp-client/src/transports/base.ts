/**
 * Base Transport Interface and Utilities
 */

import { EventEmitter } from 'events';
import type { JSONRPCMessage } from '../types/index.js';

export interface ClientTransport extends EventEmitter {
  connect(): Promise<void>;
  send(message: JSONRPCMessage): Promise<void>;
  close(): Promise<void>;
  isConnected(): boolean;
}

export interface TransportEvents {
  'message': (message: JSONRPCMessage) => void;
  'error': (error: Error) => void;
  'close': () => void;
}

export abstract class BaseTransport extends EventEmitter {
  protected _connected = false;
  protected _messageQueue: JSONRPCMessage[] = [];
  protected _sendQueue: JSONRPCMessage[] = [];

  isConnected(): boolean {
    return this._connected;
  }

  protected async processMessageQueue(): Promise<void> {
    while (this._messageQueue.length > 0) {
      const message = this._messageQueue.shift();
      if (message) {
        this.emit('message', message);
      }
    }
  }

  protected queueMessage(message: JSONRPCMessage): void {
    this._messageQueue.push(message);
    this.processMessageQueue();
  }
}

export function createRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function isJSONRPCRequest(message: JSONRPCMessage): boolean {
  return message.method !== undefined && message.id !== undefined;
}

export function isJSONRPCResponse(message: JSONRPCMessage): boolean {
  return (message.result !== undefined || message.error !== undefined) && message.id !== undefined;
}

export function isJSONRPCNotification(message: JSONRPCMessage): boolean {
  return message.method !== undefined && message.id === undefined;
}
