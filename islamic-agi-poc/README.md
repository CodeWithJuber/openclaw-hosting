# Islamic AGI POC

Proof of Concept for Islamic-inspired AGI system with ethical constraints.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Run development
npm run dev

# Build for production
npm run build

# Deploy to Linode
./deploy.sh
```

## Architecture

```
User Input
    ↓
Fitra Verification (4 axioms)
    ↓
LLM Processing (Hisab)
    ↓
Ontology Verification
    ↓
Mizan Optimization (4 objectives)
    ↓
Output + Disclaimer
```

## API Endpoints

### POST /process
Main AGI processing endpoint.

```bash
curl -X POST http://localhost:3000/process \
  -H 'Content-Type: application/json' \
  -d '{"input": "What is justice in Islam?"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "output": "...",
    "fitraCheck": { "passes": true, "violations": [] },
    "mizanScores": { "accuracy": 0.9, "ethics": 0.95, "harmony": 0.85, "utility": 0.8 },
    "balance": 0.87,
    "disclaimer": "..."
  }
}
```

### POST /verify-fitra
Check text against Fitra axioms.

### GET /health
Health check endpoint.

## Fitra Axioms

1. **Causality**: Every effect implies a cause
2. **Teleology**: Actions have purpose
3. **Unity (Tawhid)**: Reality is unified under One Creator
4. **Divine Attributes**: Do not attribute divine qualities to creation

## Mizan Objectives

- **Accuracy** (α): Factual correctness
- **Ethics** (β): Moral alignment
- **Harmony** (γ): Internal consistency
- **Utility** (δ): Practical usefulness

## License

MIT