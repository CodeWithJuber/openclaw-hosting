/**
 * Stdio Transport Implementation
 */

import { spawn, type ChildProcess } from 'child_process';
import { BaseTransport, createRequestId } from './base.js';
import type { JSONRPCMessage, ServerParameters } from '../types/index.js';
import { MCPConnectionError, MCPProtocolError } from '../errors/index.js';

export interface StdioTransportOptions extends ServerParameters {
  stderr?: 'pipe' | 'inherit' | 'ignore';
}

export class StdioClientTransport extends BaseTransport {
  private process: ChildProcess | null = null;
  private buffer = '';
  private pendingRequests = new Map<string | number, (response: JSONRPCMessage) => void>();

  constructor(private options: StdioTransportOptions) {
    super();
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const { command, args = [], env, cwd, stderr = 'pipe' } = this.options;

      this.process = spawn(command, args, {
        env: { ...process.env, ...env },
        cwd,
        stdio: ['pipe', 'pipe', stderr]
      });

      if (!this.process.stdin || !this.process.stdout) {
        reject(new MCPConnectionError('Failed to create stdio pipes'));
        return;
      }

      this.process.on('error', (error) => {
        this.emit('error', new MCPConnectionError(`Process error: ${error.message}`));
        reject(error);
      });

      this.process.on('exit', (code) => {
        this._connected = false;
        this.emit('close');
        if (code !== 0 && code !== null) {
          this.emit('error', new MCPConnectionError(`Process exited with code ${code}`));
        }
      });

      this.process.stdout.on('data', (data: Buffer) => {
        this.handleData(data.toString());
      });

      // Wait a bit for process to start
      setTimeout(() => {
        this._connected = true;
        resolve();
      }, 100);
    });
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (!this.process?.stdin || !this._connected) {
      throw new MCPConnectionError('Transport not connected');
    }

    const line = JSON.stringify(message) + '\n';
    this.process.stdin.write(line);
  }

  async close(): Promise<void> {
    this._connected = false;
    
    if (this.process) {
      this.process.stdin?.end();
      this.process.kill();
      this.process = null;
    }
  }

  private handleData(data: string): void {
    this.buffer += data;
    
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line) as JSONRPCMessage;
          this.queueMessage(message);
        } catch (error) {
          this.emit('error', new MCPProtocolError(`Failed to parse message: ${line}`));
        }
      }
    }
  }
}
