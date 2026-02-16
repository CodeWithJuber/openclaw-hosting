---
name: multi-agent-orchestrator
version: 1.0.0
description: Orchestrate multiple AI agents (Claude, Codex, Gemini) for parallel task execution with intelligent routing
homepage: https://github.com/openclaw/skills/multi-agent-orchestrator
---

# Multi-Agent Orchestrator Skill

Based on Auto-Claude and Claude Octopus patterns. Orchestrate multiple AI providers (Claude, OpenAI Codex, Google Gemini) for parallel research, coding, and review workflows.

## Installation

```bash
npm install openai @anthropic-ai/sdk @google/generative-ai
```

## Quick Start

```javascript
const { MultiAgentOrchestrator } = require('./index');

const orchestrator = new MultiAgentOrchestrator({
  claude: { apiKey: process.env.CLAUDE_API_KEY },
  openai: { apiKey: process.env.OPENAI_API_KEY },
  gemini: { apiKey: process.env.GEMINI_API_KEY }
});

// Run parallel research
const results = await orchestrator.research({
  topic: "OAuth 2.1 security best practices",
  providers: ['claude', 'openai', 'gemini']
});

// Get synthesized answer
console.log(results.synthesis);
```

## Features

### 1. Parallel Provider Execution

```javascript
// Research from multiple providers simultaneously
const research = await orchestrator.research({
  topic: "Compare React vs Vue in 2025",
  providers: ['claude', 'openai', 'gemini'],
  consensusThreshold: 0.75 // 75% agreement required
});

// Results include individual responses + synthesis
console.log(research.responses.claude);
console.log(research.responses.openai);
console.log(research.responses.gemini);
console.log(research.synthesis); // Combined insights
```

### 2. Intelligent Routing

```javascript
// Auto-route based on task type
const result = await orchestrator.route({
  task: "Implement user authentication",
  context: "Node.js Express app with JWT"
});

// Routes to best provider(s) for the task
```

### 3. Code Review with Multiple Perspectives

```javascript
const review = await orchestrator.codeReview({
  code: fs.readFileSync('auth.js', 'utf8'),
  language: 'javascript',
  providers: ['claude', 'openai']
});

// Get security, performance, and style feedback
console.log(review.securityIssues);
console.log(review.performanceTips);
console.log(review.styleSuggestions);
```

### 4. AI Debate Mode

```javascript
const debate = await orchestrator.debate({
  topic: "Monorepo vs Microservices",
  providerA: 'claude',
  providerB: 'openai',
  rounds: 3
});

console.log(debate.transcript);
console.log(debate.consensus);
console.log(debate.winner);
```

### 5. Workflow Orchestration

```javascript
// Full development workflow
const workflow = await orchestrator.workflow({
  name: "build-feature",
  phases: [
    { name: "discover", provider: "gemini", task: "research" },
    { name: "define", provider: "claude", task: "requirements" },
    { name: "develop", provider: "openai", task: "implement" },
    { name: "review", providers: ["claude", "openai"], task: "review" }
  ]
});

await workflow.run();
```

## Configuration

```javascript
const orchestrator = new MultiAgentOrchestrator({
  // Provider configs
  claude: {
    apiKey: process.env.CLAUDE_API_KEY,
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 4096
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o',
    maxTokens: 4096
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-pro',
    maxTokens: 4096
  },
  
  // Orchestration settings
  defaults: {
    consensusThreshold: 0.75,
    timeout: 60000,
    maxRetries: 3
  }
});
```

## Personas

```javascript
// Use specialized personas
const securityAudit = await orchestrator.run({
  persona: 'security-auditor',
  task: 'Review API for vulnerabilities',
  code: apiCode
});

const performanceReview = await orchestrator.run({
  persona: 'performance-engineer',
  task: 'Optimize database queries',
  code: dbCode
});
```

## Cost Tracking

```javascript
// Track usage across providers
const session = await orchestrator.startSession();

await session.research({ topic: "AI agents" });
await session.codeReview({ code: sourceCode });

console.log(session.costs);
// { claude: 0.023, openai: 0.045, gemini: 0.012, total: 0.08 }
```

## Error Handling

```javascript
try {
  const result = await orchestrator.research({ topic: "..." });
} catch (error) {
  if (error.code === 'PROVIDER_TIMEOUT') {
    // Retry with fallback
    const fallback = await orchestrator.research({
      topic: "...",
      fallback: 'claude'
    });
  }
}
```

## Best Practices

1. **Use consensus threshold** for critical decisions
2. **Route by task type** - research vs coding vs review
3. **Track costs** across providers
4. **Cache results** for repeated queries
5. **Handle provider failures** gracefully
