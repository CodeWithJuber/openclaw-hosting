/**
 * Mizan (Balance) Optimizer
 * Multi-objective optimization maintaining equilibrium
 */

export interface MizanWeights {
  accuracy: number;   // α - factual correctness
  ethics: number;     // β - moral alignment
  harmony: number;    // γ - internal consistency
  utility: number;    // δ - usefulness
}

export interface MizanScores {
  accuracy: number;
  ethics: number;
  harmony: number;
  utility: number;
}

export interface MizanResult {
  output: string;
  scores: MizanScores;
  balance: number;
  weights: MizanWeights;
  iterations: number;
}

export class MizanOptimizer {
  private weights: MizanWeights;
  private targetBalance: number = 0.75;
  private maxIterations: number = 3;

  constructor(initialWeights?: MizanWeights) {
    this.weights = initialWeights || {
      accuracy: 0.3,
      ethics: 0.3,
      harmony: 0.2,
      utility: 0.2
    };
  }

  async optimize(
    output: string,
    evaluator: (text: string) => Promise<MizanScores>,
    regenerator: (text: string, issues: string[]) => Promise<string>
  ): Promise<MizanResult> {
    let currentOutput = output;
    let iterations = 0;

    while (iterations < this.maxIterations) {
      const scores = await evaluator(currentOutput);
      const balance = this.calculateBalance(scores);

      if (balance >= this.targetBalance) {
        return {
          output: currentOutput,
          scores,
          balance,
          weights: this.weights,
          iterations
        };
      }

      // Adjust weights based on imbalance
      this.adjustWeights(scores);
      
      // Regenerate with feedback
      const issues = this.identifyIssues(scores);
      currentOutput = await regenerator(currentOutput, issues);
      
      iterations++;
    }

    // Return best effort after max iterations
    const finalScores = await evaluator(currentOutput);
    return {
      output: currentOutput,
      scores: finalScores,
      balance: this.calculateBalance(finalScores),
      weights: this.weights,
      iterations
    };
  }

  private calculateBalance(scores: MizanScores): number {
    const values = Object.values(scores);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
    // Calculate variance - lower variance = higher balance
    const variance = values.reduce((sum, val) => {
      return sum + Math.pow(val - mean, 2);
    }, 0) / values.length;
    
    // Convert to balance score (0-1)
    return Math.max(0, 1 - variance);
  }

  private adjustWeights(scores: MizanScores): void {
    const minScore = Math.min(...Object.values(scores));
    
    // Find which dimension is lowest and boost it
    for (const [key, score] of Object.entries(scores)) {
      if (score === minScore && score < 0.7) {
        this.weights[key as keyof MizanWeights] *= 1.2;
      }
    }

    // If accuracy is too high but ethics is low, reduce accuracy weight
    if (scores.accuracy > 0.9 && scores.ethics < 0.6) {
      this.weights.accuracy *= 0.9;
      this.weights.ethics *= 1.3;
    }

    this.normalizeWeights();
  }

  private normalizeWeights(): void {
    const sum = Object.values(this.weights).reduce((a, b) => a + b, 0);
    for (const key in this.weights) {
      this.weights[key as keyof MizanWeights] /= sum;
    }
  }

  private identifyIssues(scores: MizanScores): string[] {
    const issues: string[] = [];
    
    if (scores.ethics < 0.7) {
      issues.push('Output may have ethical concerns');
    }
    if (scores.accuracy < 0.7) {
      issues.push('Factual accuracy needs improvement');
    }
    if (scores.harmony < 0.7) {
      issues.push('Internal consistency issues detected');
    }
    if (scores.utility < 0.7) {
      issues.push('Response may not be useful');
    }

    return issues;
  }

  getCurrentWeights(): MizanWeights {
    return { ...this.weights };
  }
}