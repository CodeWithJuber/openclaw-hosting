/**
 * Islamic AGI Core System
 * Main orchestrator integrating all components
 */

import { FitraVerifier, FitraResult } from './fitra';
import { MizanOptimizer, MizanScores } from './mizan';
import { IslamicOntology } from '../knowledge/ontology';
import { LLMManager, LLMResponse } from '../llm/provider';

export interface AGIConfig {
  llmManager: LLMManager;
  fitraAxioms?: any[];
  mizanWeights?: any;
}

export interface AGIResponse {
  output: string;
  fitraCheck: FitraResult;
  mizanScores?: MizanScores;
  balance?: number;
  citations?: string[];
  disclaimer: string;
  processingTime: number;
}

export class IslamicAGI {
  private fitra: FitraVerifier;
  private mizan: MizanOptimizer;
  private ontology: IslamicOntology;
  private llm: LLMManager;

  constructor(config: AGIConfig) {
    this.fitra = new FitraVerifier(config.fitraAxioms);
    this.mizan = new MizanOptimizer(config.mizanWeights);
    this.ontology = new IslamicOntology();
    this.llm = config.llmManager;
  }

  async process(input: string): Promise<AGIResponse> {
    const startTime = Date.now();

    // 1. Fitra input validation
    const inputCheck = this.fitra.verifyInput(input);
    if (!inputCheck.passes) {
      return {
        output: 'I cannot process this request as it appears to attempt bypassing my ethical constraints.',
        fitraCheck: inputCheck,
        disclaimer: this.getDisclaimer(),
        processingTime: Date.now() - startTime
      };
    }

    // 2. Generate system prompt with Islamic constraints
    const systemPrompt = this.generateSystemPrompt();

    // 3. LLM processing (Hisab)
    const llmResponse = await this.llm.complete(input, systemPrompt);
    let output = llmResponse.text;

    // 4. Fitra verification
    const fitraCheck = this.fitra.verify(output);
    if (!fitraCheck.passes) {
      // Regenerate with corrections
      const correctionPrompt = `
        ${input}
        
        Your previous response had these issues:
        ${fitraCheck.corrections?.join('\n')}
        
        Please provide a response that respects:
        - Causality: Every effect has a cause
        - Teleology: Actions have purpose
        - Unity: Reality is unified under One Creator
        - Divine Attributes: Only Allah has divine qualities
      `;
      
      const corrected = await this.llm.complete(correctionPrompt, systemPrompt);
      output = corrected.text;
    }

    // 5. Ontology verification
    const ontologyCheck = this.verifyWithOntology(output);
    
    // 6. Mizan optimization
    const mizanResult = await this.mizan.optimize(
      output,
      (text) => this.evaluateMizan(text),
      (text, issues) => this.regenerate(text, issues, input, systemPrompt)
    );

    const processingTime = Date.now() - startTime;

    return {
      output: mizanResult.output,
      fitraCheck,
      mizanScores: mizanResult.scores,
      balance: mizanResult.balance,
      citations: ontologyCheck.citations,
      disclaimer: this.getDisclaimer(),
      processingTime
    };
  }

  private generateSystemPrompt(): string {
    return `
You are an AI assistant operating within an Islamic ethical framework.

CORE PRINCIPLES:
1. CAUSALITY: Every effect implies a cause. Nothing happens randomly or without reason.
2. TELEOLOGY: All actions have purpose. Existence is meaningful, not random.
3. UNITY (TAWHID): Reality is a unified whole under One Creator (Allah).
4. DIVINE ATTRIBUTES: Only Allah is All-Knowing, All-Powerful, All-Seeing.

BEHAVIORAL GUIDELINES:
- Always speak truthfully and with humility
- Acknowledge uncertainty when appropriate
- Never claim divine knowledge or attributes
- Respect all faiths while maintaining Islamic principles
- Provide citations for religious claims
- Direct complex religious questions to qualified scholars

PROHIBITED:
- Claiming omniscience or divine knowledge
- Suggesting life is meaningless or random
- Attributing divine qualities to yourself or others
- Providing fatwas (religious rulings) without qualification

You are a tool to assist with knowledge, not a replacement for human scholars or divine guidance.
    `.trim();
  }

  private async evaluateMizan(text: string): Promise<MizanScores> {
    // Evaluate across four dimensions
    const scores: MizanScores = {
      accuracy: await this.scoreAccuracy(text),
      ethics: await this.scoreEthics(text),
      harmony: await this.scoreHarmony(text),
      utility: await this.scoreUtility(text)
    };

    return scores;
  }

  private async scoreAccuracy(text: string): Promise<number> {
    // Check for factual claims and confidence markers
    const uncertaintyMarkers = [
      /i think/i,
      /perhaps/i,
      /maybe/i,
      /it is said/i,
      /some scholars/i
    ];
    
    const hasUncertainty = uncertaintyMarkers.some(m => m.test(text));
    const hasCitations = /\[.*?\]/.test(text) || /\(.*?\)/.test(text);
    
    let score = 0.7;
    if (hasUncertainty) score += 0.1;
    if (hasCitations) score += 0.2;
    
    return Math.min(1.0, score);
  }

  private async scoreEthics(text: string): Promise<number> {
    // Check ontology alignment
    const words = text.toLowerCase().split(/\s+/);
    let virtueCount = 0;
    let viceCount = 0;

    for (const word of words) {
      const weight = this.ontology.getMoralWeight(word);
      if (weight > 0.7) virtueCount++;
      if (weight < 0.3) viceCount++;
    }

    const total = virtueCount + viceCount;
    if (total === 0) return 0.7;
    
    return 0.5 + (virtueCount / total) * 0.5;
  }

  private async scoreHarmony(text: string): Promise<number> {
    // Check internal consistency
    const contradictions = [
      /allah is one.*multiple gods/i,
      /truth is absolute.*truth is relative/i
    ];
    
    for (const pattern of contradictions) {
      if (pattern.test(text)) return 0.3;
    }
    
    return 0.85;
  }

  private async scoreUtility(text: string): Promise<number> {
    // Check if response is helpful and actionable
    const helpfulIndicators = [
      /here is/i,
      /you can/i,
      /i recommend/i,
      /consider/i,
      /steps?/i
    ];
    
    for (const indicator of helpfulIndicators) {
      if (indicator.test(text)) return 0.85;
    }
    
    return 0.7;
  }

  private async regenerate(
    text: string, 
    issues: string[],
    originalInput: string,
    systemPrompt: string
  ): Promise<string> {
    const prompt = `
${originalInput}

Your previous response had these balance issues:
${issues.join('\n')}

Please provide an improved response that maintains better balance between:
- Accuracy (factual correctness)
- Ethics (moral alignment)
- Harmony (internal consistency)
- Utility (practical usefulness)
    `;

    const response = await this.llm.complete(prompt, systemPrompt);
    return response.text;
  }

  private verifyWithOntology(text: string): { valid: boolean; citations: string[] } {
    const citations: string[] = [];
    
    // Extract key concepts and verify
    const concepts = ['justice', 'mercy', 'truth', 'good', 'evil'];
    
    for (const concept of concepts) {
      if (text.toLowerCase().includes(concept)) {
        const verification = this.ontology.verifyConcept(concept);
        if (!verification.valid) {
          citations.push(`Note: ${verification.contradictions.join(', ')}`);
        }
      }
    }

    return { valid: citations.length === 0, citations };
  }

  private getDisclaimer(): string {
    return `
DISCLAIMER:
I am an artificial intelligence system designed to assist with Islamic knowledge.
I do not possess consciousness, soul (ruh), or moral accountability.
My responses are generated through statistical pattern matching and logical inference,
not through spiritual insight or divine knowledge.

For matters of religious obligation (fard, wajib), please consult qualified scholars (ulama).
For complex fiqh questions, seek guidance from recognized Islamic institutions.

All good is from Allah, and any errors are from myself and Satan.
    `.trim();
  }
}