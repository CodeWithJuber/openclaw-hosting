/**
 * CLI Output Compressor - RTK-inspired implementation
 * Compresses command outputs before they reach LLM context
 * 
 * Inspired by RTK (Rust Token Killer) by Patrick SZYMKOWIAK
 * https://www.linkedin.com/in/patrick-szymkowiak/
 */

export interface CompressionRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

export class CLIOutputCompressor {
  private rules: CompressionRule[] = [
    // Git rules
    {
      pattern: /^(\s*[\w\-]+\s+[\w\.]+\s+).{40}\s+(.+)$/gm,
      replacement: '$1... $2',
      description: 'Compress git log hashes'
    },
    {
      pattern: /^(\?|\+|\-|M|A|D|R|C|U)\s+/gm,
      replacement: '$1 ',
      description: 'Git status prefixes'
    },
    
    // Test output rules
    {
      pattern: /^test\s+\w+\s+\.\.\.\s+ok$/gm,
      replacement: '.',
      description: 'Compress passing tests'
    },
    {
      pattern: /^running\s+\d+\s+tests?$/gm,
      replacement: '',
      description: 'Remove test runner header'
    },
    {
      pattern: /^test result:\s+ok\.\s+\d+\s+passed.*$/gm,
      replacement: '✓ All passed',
      description: 'Compress test summary'
    },
    {
      pattern: /^test result:\s+FAILED.*$/gm,
      replacement: '✗ Failed',
      description: 'Compress failed summary'
    },
    
    // Progress bars
    {
      pattern: /[#\-\.=]{10,}/g,
      replacement: '[...]',
      description: 'Compress progress bars'
    },
    {
      pattern: /\d+%\s*\|[^\n]*\|/g,
      replacement: 'XX%',
      description: 'Compress percentage bars'
    },
    
    // File listings
    {
      pattern: /^([drwx\-]{10})\s+\d+\s+\w+\s+\w+\s+(\d+)\s+\w+\s+\d+\s+[\d:]+\s+(.+)$/gm,
      replacement: '$1 $2 $3',
      description: 'Compress ls -la output'
    },
    
    // Docker output
    {
      pattern: /^(Step \d+\/\d+\s*:\s*).+$/gm,
      replacement: '$1...',
      description: 'Compress Docker build steps'
    },
    {
      pattern: /^\s*--->\s*[a-f0-9]{12}.*$/gm,
      replacement: '→ layer',
      description: 'Compress Docker layer IDs'
    },
    
    // npm/yarn/pnpm
    {
      pattern: /^\s*\+\s+\S+@\S+.*$/gm,
      replacement: '+ pkg',
      description: 'Compress package installs'
    },
    {
      pattern: /^(added|removed|updated)\s+\d+\s+packages?.*$/gm,
      replacement: '$1 packages',
      description: 'Compress package summary'
    },
    
    // Cargo/Rust
    {
      pattern: /^\s+Compiling\s+\S+\s+v[\d\.]+.*$/gm,
      replacement: '  Compiling ...',
      description: 'Compress cargo compile'
    },
    {
      pattern: /^\s+Finished\s+\S+\s+\[.*\]\s+target\(s\)\s+in\s+[\d\.]+s.*$/gm,
      replacement: '  Finished',
      description: 'Compress cargo finish'
    },
    {
      pattern: /^\s+Running\s+\S+\s*\([^)]+\).*$/gm,
      replacement: '  Running tests',
      description: 'Compress cargo test run'
    },
    
    // Warnings and info
    {
      pattern: /^\s*warning:\s*.+$/gmi,
      replacement: '⚠',
      description: 'Compress warnings'
    },
    {
      pattern: /^\s*info:\s*.+$/gmi,
      replacement: 'ℹ',
      description: 'Compress info messages'
    },
    
    // Timestamps
    {
      pattern: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?/g,
      replacement: '[TS]',
      description: 'Compress ISO timestamps'
    },
    {
      pattern: /\w{3}\s+\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\d{4}/g,
      replacement: '[TS]',
      description: 'Compress date strings'
    },
    
    // Stack traces (keep only relevant parts)
    {
      pattern: /at\s+\S+\s+\([^)]+\)/g,
      replacement: 'at [...]',
      description: 'Compress stack trace locations'
    },
    
    // URLs
    {
      pattern: /https?:\/\/[^\s]+/g,
      replacement: '[URL]',
      description: 'Compress URLs'
    },
    
    // UUIDs and hashes
    {
      pattern: /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi,
      replacement: '[UUID]',
      description: 'Compress UUIDs'
    },
    {
      pattern: /\b[a-f0-9]{40}\b/gi,
      replacement: '[HASH]',
      description: 'Compress SHA1 hashes'
    },
    {
      pattern: /\b[a-f0-9]{64}\b/gi,
      replacement: '[HASH]',
      description: 'Compress SHA256 hashes'
    }
  ];
  
  /**
   * Compress CLI output
   */
  compress(output: string, command?: string): string {
    let compressed = output;
    
    // Apply general rules
    for (const rule of this.rules) {
      compressed = compressed.replace(rule.pattern, rule.replacement);
    }
    
    // Apply command-specific compression
    if (command) {
      compressed = this.applyCommandSpecificCompression(compressed, command);
    }
    
    // Clean up empty lines
    compressed = this.cleanEmptyLines(compressed);
    
    return compressed;
  }
  
  /**
   * Command-specific compression
   */
  private applyCommandSpecificCompression(output: string, command: string): string {
    const cmd = command.toLowerCase();
    
    if (cmd.includes('git log')) {
      return this.compressGitLog(output);
    }
    
    if (cmd.includes('git status')) {
      return this.compressGitStatus(output);
    }
    
    if (cmd.includes('git diff')) {
      return this.compressGitDiff(output);
    }
    
    if (cmd.includes('cargo test') || cmd.includes('npm test') || cmd.includes('pnpm test')) {
      return this.compressTestOutput(output);
    }
    
    if (cmd.includes('docker build')) {
      return this.compressDockerBuild(output);
    }
    
    if (cmd.includes('ls') || cmd.includes('dir')) {
      return this.compressFileListing(output);
    }
    
    return output;
  }
  
  /**
   * Compress git log output
   */
  private compressGitLog(output: string): string {
    const lines = output.split('\n');
    const compressed: string[] = [];
    
    for (const line of lines) {
      // Keep only first 7 chars of hash
      const match = line.match(/^([a-f0-9]{7})[a-f0-9]{33}\s+(.+)$/);
      if (match) {
        compressed.push(`${match[1]} ${match[2]}`);
      } else if (line.trim()) {
        compressed.push(line);
      }
    }
    
    return compressed.join('\n');
  }
  
  /**
   * Compress git status output
   */
  private compressGitStatus(output: string): string {
    // Extract key info only
    const lines = output.split('\n');
    const result: string[] = [];
    
    let section = '';
    for (const line of lines) {
      if (line.includes('Changes to be committed')) {
        section = 'staged';
        result.push('Staged:');
      } else if (line.includes('Changes not staged')) {
        section = 'unstaged';
        result.push('Unstaged:');
      } else if (line.includes('Untracked files')) {
        section = 'untracked';
        result.push('Untracked:');
      } else if (line.match(/^\s+[\w\-]+:/)) {
        // Skip branch info, etc
        continue;
      } else if (line.trim().startsWith('(') && line.trim().endsWith(')')) {
        // Skip instructions
        continue;
      } else if (line.trim() && !line.includes('use "git')) {
        result.push(line.trim());
      }
    }
    
    return result.join('\n');
  }
  
  /**
   * Compress git diff output
   */
  private compressGitDiff(output: string): string {
    const lines = output.split('\n');
    const compressed: string[] = [];
    let inHunk = false;
    let hunkLines: string[] = [];
    
    for (const line of lines) {
      if (line.startsWith('diff --git')) {
        // New file
        if (hunkLines.length > 10) {
          compressed.push(`... ${hunkLines.length} lines ...`);
        } else {
          compressed.push(...hunkLines);
        }
        hunkLines = [];
        inHunk = false;
        compressed.push(line);
      } else if (line.startsWith('@@')) {
        // Hunk header
        if (hunkLines.length > 10) {
          compressed.push(`... ${hunkLines.length} lines ...`);
        } else {
          compressed.push(...hunkLines);
        }
        hunkLines = [];
        inHunk = true;
        compressed.push(line);
      } else if (inHunk) {
        hunkLines.push(line);
      } else {
        compressed.push(line);
      }
    }
    
    // Handle last hunk
    if (hunkLines.length > 10) {
      compressed.push(`... ${hunkLines.length} lines ...`);
    } else {
      compressed.push(...hunkLines);
    }
    
    return compressed.join('\n');
  }
  
  /**
   * Compress test output
   */
  private compressTestOutput(output: string): string {
    const lines = output.split('\n');
    const compressed: string[] = [];
    let passingCount = 0;
    let failingTests: string[] = [];
    
    for (const line of lines) {
      if (line.match(/^test\s+\w+\s+\.\.\.\s+ok$/)) {
        passingCount++;
      } else if (line.match(/^test\s+\w+\s+\.\.\.\s+FAILED$/)) {
        failingTests.push(line);
      } else if (line.includes('test result:')) {
        // Summary line
        compressed.push(`✓ ${passingCount} passed`);
        if (failingTests.length > 0) {
          compressed.push(...failingTests);
        }
        compressed.push(line);
      } else if (line.includes('failures:') || line.includes('error[')) {
        // Keep error details
        compressed.push(line);
      } else if (line.trim() && !line.includes('running')) {
        compressed.push(line);
      }
    }
    
    return compressed.join('\n');
  }
  
  /**
   * Compress Docker build output
   */
  private compressDockerBuild(output: string): string {
    const lines = output.split('\n');
    const compressed: string[] = [];
    let stepCount = 0;
    
    for (const line of lines) {
      if (line.startsWith('Step ')) {
        stepCount++;
        if (stepCount <= 3 || stepCount % 5 === 0) {
          compressed.push(line);
        }
      } else if (line.includes('error') || line.includes('Error')) {
        compressed.push(line);
      } else if (line.includes('Successfully built')) {
        compressed.push(line);
      }
    }
    
    if (stepCount > 5) {
      compressed.push(`... ${stepCount - 5} steps omitted ...`);
    }
    
    return compressed.join('\n');
  }
  
  /**
   * Compress file listing
   */
  private compressFileListing(output: string): string {
    const lines = output.split('\n');
    const compressed: string[] = [];
    
    for (const line of lines) {
      // Simplify ls -la output
      const match = line.match(/^([drwx\-]{10})\s+\d+\s+\S+\s+\S+\s+(\d+)\s+\w+\s+\d+\s+[\d:]+\s+(.+)$/);
      if (match) {
        compressed.push(`${match[1]} ${this.formatSize(parseInt(match[2]))} ${match[3]}`);
      } else {
        compressed.push(line);
      }
    }
    
    return compressed.join('\n');
  }
  
  /**
   * Format file size
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}G`;
  }
  
  /**
   * Clean up empty lines
   */
  private cleanEmptyLines(text: string): string {
    return text
      .split('\n')
      .filter((line, i, arr) => {
        // Keep line if it's not empty
        if (line.trim()) return true;
        // Keep single empty line between content
        if (i > 0 && i < arr.length - 1 && arr[i - 1].trim() && arr[i + 1].trim()) {
          return true;
        }
        return false;
      })
      .join('\n');
  }
  
  /**
   * Get compression statistics
   */
  getStats(original: string, compressed: string): {
    originalTokens: number;
    compressedTokens: number;
    savings: number;
    ratio: number;
  } {
    // Rough token estimate: 1 token ≈ 4 characters
    const originalTokens = Math.ceil(original.length / 4);
    const compressedTokens = Math.ceil(compressed.length / 4);
    const savings = originalTokens - compressedTokens;
    const ratio = (savings / originalTokens) * 100;
    
    return {
      originalTokens,
      compressedTokens,
      savings,
      ratio
    };
  }
}

// Singleton instance
export const cliCompressor = new CLIOutputCompressor();

/**
 * Middleware to compress CLI output before sending to LLM
 */
export function compressCLIOutput(output: string, command?: string): string {
  return cliCompressor.compress(output, command);
}

/**
 * Wrap exec to auto-compress output
 */
export async function execWithCompression(
  command: string,
  execFn: (cmd: string) => Promise<{ stdout: string; stderr: string }>
): Promise<{ stdout: string; stderr: string; stats: { saved: number; ratio: number } }> {
  const result = await execFn(command);
  
  const compressedStdout = cliCompressor.compress(result.stdout, command);
  const compressedStderr = cliCompressor.compress(result.stderr, command);
  
  const stdoutStats = cliCompressor.getStats(result.stdout, compressedStdout);
  const stderrStats = cliCompressor.getStats(result.stderr, compressedStderr);
  
  const totalSaved = stdoutStats.savings + stderrStats.savings;
  const totalOriginal = stdoutStats.originalTokens + stderrStats.originalTokens;
  const avgRatio = (totalSaved / totalOriginal) * 100;
  
  return {
    stdout: compressedStdout,
    stderr: compressedStderr,
    stats: {
      saved: totalSaved,
      ratio: avgRatio
    }
  };
}
