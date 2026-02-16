/**
 * CLI Tool Wrapper - Auto-compresses command outputs
 * 
 * Usage:
 *   import { wrappedExec } from './cli-wrapper';
 *   const result = await wrappedExec('git log --oneline -20');
 *   // result.output is compressed
 *   // result.stats shows token savings
 */

import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { CLIOutputCompressor } from './cli-compressor';

const execAsync = promisify(execCallback);

export interface WrappedExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  compression: {
    originalTokens: number;
    compressedTokens: number;
    saved: number;
    ratio: number;
  };
}

export class CLIWrapper {
  private compressor = new CLIOutputCompressor();
  private stats = {
    totalCommands: 0,
    totalTokensSaved: 0,
    totalOriginalTokens: 0
  };
  
  /**
   * Execute command with automatic output compression
   */
  async exec(command: string, options?: { 
    cwd?: string;
    timeout?: number;
    maxBuffer?: number;
  }): Promise<WrappedExecResult> {
    const startTime = Date.now();
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: options?.cwd,
        timeout: options?.timeout || 30000,
        maxBuffer: options?.maxBuffer || 10 * 1024 * 1024 // 10MB
      });
      
      // Compress outputs
      const compressedStdout = this.compressor.compress(stdout, command);
      const compressedStderr = this.compressor.compress(stderr, command);
      
      // Calculate stats
      const stdoutStats = this.compressor.getStats(stdout, compressedStdout);
      const stderrStats = this.compressor.getStats(stderr, compressedStderr);
      
      const totalOriginal = stdoutStats.originalTokens + stderrStats.originalTokens;
      const totalCompressed = stdoutStats.compressedTokens + stderrStats.compressedTokens;
      const totalSaved = totalOriginal - totalCompressed;
      const ratio = (totalSaved / totalOriginal) * 100;
      
      // Update global stats
      this.stats.totalCommands++;
      this.stats.totalTokensSaved += totalSaved;
      this.stats.totalOriginalTokens += totalOriginal;
      
      // Log compression stats
      console.log(`[CLI] ${command.substring(0, 50)}...`);
      console.log(`[CLI] Compressed: ${totalOriginal} → ${totalCompressed} tokens (${ratio.toFixed(1)}% saved)`);
      
      return {
        stdout: compressedStdout,
        stderr: compressedStderr,
        exitCode: 0,
        compression: {
          originalTokens: totalOriginal,
          compressedTokens: totalCompressed,
          saved: totalSaved,
          ratio
        }
      };
      
    } catch (error: any) {
      // Compress even on error
      const stdout = error.stdout || '';
      const stderr = error.stderr || '';
      
      const compressedStdout = this.compressor.compress(stdout, command);
      const compressedStderr = this.compressor.compress(stderr, command);
      
      const stdoutStats = this.compressor.getStats(stdout, compressedStdout);
      const stderrStats = this.compressor.getStats(stderr, compressedStderr);
      
      const totalOriginal = stdoutStats.originalTokens + stderrStats.originalTokens;
      const totalCompressed = stdoutStats.compressedTokens + stderrStats.compressedTokens;
      const totalSaved = totalOriginal - totalCompressed;
      
      return {
        stdout: compressedStdout,
        stderr: compressedStderr,
        exitCode: error.code || 1,
        compression: {
          originalTokens: totalOriginal,
          compressedTokens: totalCompressed,
          saved: totalSaved,
          ratio: (totalSaved / totalOriginal) * 100
        }
      };
    }
  }
  
  /**
   * Get global compression statistics
   */
  getGlobalStats(): {
    totalCommands: number;
    totalTokensSaved: number;
    totalOriginalTokens: number;
    averageSavings: number;
  } {
    return {
      ...this.stats,
      averageSavings: this.stats.totalOriginalTokens > 0 
        ? (this.stats.totalTokensSaved / this.stats.totalOriginalTokens) * 100 
        : 0
    };
  }
  
  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalCommands: 0,
      totalTokensSaved: 0,
      totalOriginalTokens: 0
    };
  }
}

// Singleton instance
export const cliWrapper = new CLIWrapper();

/**
 * Convenience function for one-off exec with compression
 */
export async function wrappedExec(
  command: string,
  options?: { cwd?: string; timeout?: number }
): Promise<WrappedExecResult> {
  return cliWrapper.exec(command, options);
}

/**
 * Git helper with compression
 */
export const git = {
  status: () => wrappedExec('git status'),
  log: (n = 10) => wrappedExec(`git log --oneline -${n}`),
  diff: (file?: string) => wrappedExec(file ? `git diff ${file}` : 'git diff'),
  branch: () => wrappedExec('git branch -a'),
  stash: {
    list: () => wrappedExec('git stash list'),
    show: (n = 0) => wrappedExec(`git stash show -p stash@{${n}}`)
  }
};

/**
 * Test helper with compression
 */
export const testRunner = {
  cargo: () => wrappedExec('cargo test'),
  npm: () => wrappedExec('npm test'),
  pnpm: () => wrappedExec('pnpm test'),
  vitest: () => wrappedExec('vitest run'),
  jest: () => wrappedExec('jest')
};

/**
 * Docker helper with compression
 */
export const docker = {
  ps: () => wrappedExec('docker ps'),
  images: () => wrappedExec('docker images'),
  build: (tag: string) => wrappedExec(`docker build -t ${tag} .`),
  logs: (container: string, lines = 50) => 
    wrappedExec(`docker logs --tail ${lines} ${container}`)
};
