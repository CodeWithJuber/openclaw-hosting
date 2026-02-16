/**
 * LLM Provider Interface
 * Unified interface for Claude, GPT-4, Gemini
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export interface LLMConfig {
  provider: 'anthropic' | 'openai';
  apiKey: string;
  model?: string;
}

export interface LLMResponse {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  model: string;
}

export abstract class LLMProvider {
  abstract complete(prompt: string, systemPrompt?: string): Promise<LLMResponse>;
  abstract getModel(): string;
}

export class ClaudeProvider extends LLMProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-3-opus-20240229') {
    super();
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async complete(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    });

    return {
      text: response.content[0].type === 'text' ? response.content[0].text : '',
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      },
      model: this.model
    };
  }

  getModel(): string {
    return this.model;
  }
}

export class OpenAIProvider extends LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4-turbo-preview') {
    super();
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async complete(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    const messages: any[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: 4096
    });

    return {
      text: response.choices[0].message.content || '',
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0
      },
      model: this.model
    };
  }

  getModel(): string {
    return this.model;
  }
}

export class LLMManager {
  private providers: Map<string, LLMProvider> = new Map();
  private defaultProvider: string;

  constructor(configs: Record<string, LLMConfig>) {
    for (const [name, config] of Object.entries(configs)) {
      if (config.provider === 'anthropic') {
        this.providers.set(name, new ClaudeProvider(config.apiKey, config.model));
      } else if (config.provider === 'openai') {
        this.providers.set(name, new OpenAIProvider(config.apiKey, config.model));
      }
    }
    
    this.defaultProvider = Object.keys(configs)[0];
  }

  async complete(
    prompt: string, 
    systemPrompt?: string,
    providerName?: string
  ): Promise<LLMResponse> {
    const name = providerName || this.defaultProvider;
    const provider = this.providers.get(name);
    
    if (!provider) {
      throw new Error(`Provider ${name} not found`);
    }

    return provider.complete(prompt, systemPrompt);
  }

  getProvider(name?: string): LLMProvider | undefined {
    return this.providers.get(name || this.defaultProvider);
  }
}