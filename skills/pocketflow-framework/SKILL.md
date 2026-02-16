---
name: pocketflow-framework
version: 1.0.0
description: Lightweight 100-line LLM framework for building agent workflows. Let agents build agents.
homepage: https://github.com/openclaw/skills/pocketflow-framework
---

# PocketFlow Framework Skill

A minimal, 100-line LLM framework for building agent workflows. Based on The-Pocket/PocketFlow. Let agents build agents with zero dependencies.

## Why PocketFlow?

- **100 lines of code** - Minimal, readable, hackable
- **Zero dependencies** - No bloat, just core logic
- **Graph-based** - Visual workflow design
- **Agent composition** - Agents can build other agents

## Quick Start

```javascript
const { Node, Flow, Agent } = require('./index');

// Create a simple node
const greetNode = new Node({
  run: (input) => {
    return { message: `Hello, ${input.name}!` };
  }
});

// Create a flow
const flow = new Flow({
  start: greetNode
});

// Run the flow
const result = await flow.run({ name: 'World' });
console.log(result.message); // "Hello, World!"
```

## Core Concepts

### 1. Nodes

Nodes are the building blocks:

```javascript
const { Node } = require('./index');

// Simple node
const node = new Node({
  run: (input) => {
    // Process input
    return { result: 'processed' };
  }
});

// Async node
const asyncNode = new Node({
  run: async (input) => {
    const data = await fetchData(input.url);
    return { data };
  }
});

// LLM-powered node
const llmNode = new Node({
  run: async (input) => {
    const response = await llm.complete({
      prompt: `Summarize: ${input.text}`
    });
    return { summary: response };
  }
});
```

### 2. Flows

Connect nodes into workflows:

```javascript
const { Flow } = require('./index');

// Linear flow
const linearFlow = new Flow({
  start: nodeA,
  edges: {
    [nodeA.id]: nodeB,
    [nodeB.id]: nodeC
  }
});

// Branching flow
const branchFlow = new Flow({
  start: decisionNode,
  edges: {
    [decisionNode.id]: (result) => {
      return result.value > 0.5 ? nodeA : nodeB;
    }
  }
});

// Parallel flow
const parallelFlow = new Flow({
  start: splitNode,
  parallel: [nodeA, nodeB, nodeC],
  merge: mergeNode
});
```

### 3. Agents

Agents are autonomous flows:

```javascript
const { Agent } = require('./index');

// Create an agent
const codingAgent = new Agent({
  goal: 'Write a function to sort an array',
  nodes: {
    plan: planNode,
    code: codeNode,
    test: testNode,
    review: reviewNode
  },
  flow: ['plan', 'code', 'test', 'review']
});

// Run the agent
const result = await codingAgent.run({
  requirements: 'Quick sort algorithm'
});
```

## Examples

### Self-Improving Agent

```javascript
const selfImprovingAgent = new Agent({
  goal: 'Improve code quality',
  
  nodes: {
    analyze: new Node({
      run: async (input) => {
        // Analyze code for issues
        return { issues: await analyzeCode(input.code) };
      }
    }),
    
    improve: new Node({
      run: async (input) => {
        // Generate improvements
        return { improved: await improveCode(input.issues) };
      }
    }),
    
    validate: new Node({
      run: async (input) => {
        // Test the improvements
        return { valid: await validateCode(input.improved) };
      }
    })
  },
  
  flow: ['analyze', 'improve', 'validate'],
  
  // Loop until quality threshold met
  loop: (result) => !result.valid || result.quality < 0.9
});
```

### Multi-Agent System

```javascript
// Create specialized agents
const researchAgent = new Agent({
  goal: 'Research topic',
  nodes: { search, summarize }
});

const writingAgent = new Agent({
  goal: 'Write content',
  nodes: { outline, draft, edit }
});

const reviewAgent = new Agent({
  goal: 'Review content',
  nodes: { check, feedback }
});

// Orchestrate agents
const contentPipeline = new Flow({
  start: researchAgent,
  edges: {
    [researchAgent.id]: writingAgent,
    [writingAgent.id]: reviewAgent
  }
});
```

### Agent Builder Agent

```javascript
const agentBuilder = new Agent({
  goal: 'Build specialized agents',
  
  nodes: {
    understand: new Node({
      run: async (input) => {
        // Understand the requirements
        return { spec: await analyzeRequirements(input.task) };
      }
    }),
    
    design: new Node({
      run: async (input) => {
        // Design agent architecture
        return { design: await designAgent(input.spec) };
      }
    }),
    
    implement: new Node({
      run: async (input) => {
        // Generate agent code
        return { agent: await generateAgent(input.design) };
      }
    }),
    
    test: new Node({
      run: async (input) => {
        // Test the generated agent
        return { tested: await testAgent(input.agent) };
      }
    })
  },
  
  flow: ['understand', 'design', 'implement', 'test']
});

// Build a new agent
const newAgent = await agentBuilder.run({
  task: 'Create a data validation agent'
});
```

## Advanced Features

### Memory

```javascript
const agent = new Agent({
  memory: true, // Enable memory
  
  nodes: {
    recall: new Node({
      run: async (input, memory) => {
        // Access previous interactions
        const context = memory.get('previous_results');
        return { context };
      }
    })
  }
});
```

### Tools

```javascript
const agent = new Agent({
  tools: {
    search: async (query) => await webSearch(query),
    calculate: (expr) => eval(expr),
    readFile: (path) => fs.readFileSync(path, 'utf8')
  },
  
  nodes: {
    useTools: new Node({
      run: async (input, memory, tools) => {
        const data = await tools.readFile(input.file);
        const result = tools.calculate(data);
        return { result };
      }
    })
  }
});
```

### Streaming

```javascript
const agent = new Agent({
  stream: true
});

for await (const chunk of agent.runStream({ task: '...' })) {
  process.stdout.write(chunk);
}
```

## Best Practices

1. **Keep nodes small** - Single responsibility
2. **Use types** - Define input/output schemas
3. **Handle errors** - Graceful degradation
4. **Log everything** - For debugging
5. **Test flows** - Unit test each node

## Comparison

| Framework | Size | Dependencies | Best For |
|-----------|------|--------------|----------|
| LangChain | 405KB | Many | Complex apps |
| CrewAI | 173KB | Many | Team workflows |
| PocketFlow | 56KB | Zero | Simple, hackable agents |
