/**
 * Prompt Compressor - Applied compression technique
 * Reduces token count by optimizing prompts
 */

export class PromptCompressor {
  /**
   * Compress a prompt to reduce token count
   */
  static compress(prompt: string): string {
    let compressed = prompt;
    
    // 1. Remove redundant whitespace
    compressed = this.normalizeWhitespace(compressed);
    
    // 2. Remove redundant system instructions
    compressed = this.deduplicateInstructions(compressed);
    
    // 3. Truncate long code blocks
    compressed = this.truncateCodeBlocks(compressed);
    
    // 4. Remove outdated conversation context
    compressed = this.trimConversationHistory(compressed);
    
    return compressed;
  }
  
  /**
   * Normalize whitespace
   */
  private static normalizeWhitespace(text: string): string {
    return text
      .replace(/\n\s*\n\s*\n/g, '\n\n')  // Max 2 newlines
      .replace(/[ \t]+/g, ' ')           // Single spaces
      .trim();
  }
  
  /**
   * Remove duplicate instructions
   */
  private static deduplicateInstructions(text: string): string {
    const seen = new Set<string>();
    const lines = text.split('\n');
    
    return lines.filter(line => {
      const normalized = line.toLowerCase().trim();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    }).join('\n');
  }
  
  /**
   * Truncate long code blocks
   */
  private static truncateCodeBlocks(text: string): string {
    const codeBlockRegex = /```[\s\S]*?```/g;
    
    return text.replace(codeBlockRegex, (match) => {
      const lines = match.split('\n');
      
      // If code block is too long, keep first and last parts
      if (lines.length > 50) {
        const firstPart = lines.slice(0, 20).join('\n');
        const lastPart = lines.slice(-10).join('\n');
        return `${firstPart}\n// ... (${lines.length - 30} lines omitted) ...\n${lastPart}`;
      }
      
      return match;
    });
  }
  
  /**
   * Trim old conversation history
   */
  private static trimConversationHistory(text: string): string {
    // Keep only last 10 exchanges
    const exchanges = text.split(/\n(?=User:|Assistant:)/g);
    
    if (exchanges.length > 20) {
      const recent = exchanges.slice(-20);
      return recent.join('\n');
    }
    
    return text;
  }
  
  /**
   * Summarize long text using extractive method
   */
  static summarize(text: string, maxLength: number = 1000): string {
    if (text.length <= maxLength) return text;
    
    // Extract key sentences (simple heuristic: first sentence of each paragraph)
    const paragraphs = text.split('\n\n');
    const keyPoints: string[] = [];
    let currentLength = 0;
    
    for (const para of paragraphs) {
      const firstSentence = para.split('.')[0] + '.';
      if (currentLength + firstSentence.length < maxLength) {
        keyPoints.push(firstSentence);
        currentLength += firstSentence.length;
      } else {
        break;
      }
    }
    
    return keyPoints.join(' ') + '\n\n[Content summarized]';
  }
  
  /**
   * Calculate compression ratio
   */
  static getCompressionRatio(original: string, compressed: string): number {
    return (1 - compressed.length / original.length) * 100;
  }
}

/**
 * Smart context window manager
 */
export class ContextWindowManager {
  private maxTokens: number;
  
  constructor(maxTokens: number = 8000) {
    this.maxTokens = maxTokens;
  }
  
  /**
   * Fit content within token limit
   */
  fitWithinLimit(systemPrompt: string, context: string, userQuery: string): string {
    // Rough token estimate (1 token ≈ 4 chars)
    const estimateTokens = (text: string) => Math.ceil(text.length / 4);
    
    let total = estimateTokens(systemPrompt) + 
                estimateTokens(context) + 
                estimateTokens(userQuery);
    
    // If over limit, compress context
    while (total > this.maxTokens && context.length > 100) {
      context = PromptCompressor.compress(context);
      
      // If still too long, summarize
      if (estimateTokens(context) > this.maxTokens * 0.5) {
        context = PromptCompressor.summarize(context, this.maxTokens * 2);
      }
      
      total = estimateTokens(systemPrompt) + 
              estimateTokens(context) + 
              estimateTokens(userQuery);
    }
    
    return `${systemPrompt}\n\n${context}\n\n${userQuery}`;
  }
}
