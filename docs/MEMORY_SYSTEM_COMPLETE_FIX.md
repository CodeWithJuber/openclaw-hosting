# OpenClaw Memory System - Complete Fix Guide

**Based on**: GitHub issues #16214, #13329, discussions #6038, #17692, r/AI_Agents, r/LocalLLaMA, ComposioHQ/secure-openclaw

---

## Current Memory Issues

### 1. Sub-Agent Memory Access Denied (Issue #16214)

**Problem**: `memory_search` and `memory_get` are in default deny list for sub-agents

**Impact**: Sub-agents can't efficiently access memory - must use `read` + `exec` (grep) instead

**Current Workaround**:
```bash
# Sub-agent must use inefficient file reading instead of semantic search
read memory/2026-02-17.md
exec grep "keyword" memory/*.md
```

**Solution**: Remove from default deny list

---

### 2. Hidden Memory Features (Discussion #6038)

**Problem**: Powerful features are OFF by default, users don't know they exist

**Missing Features**:
- Pre-compaction memory flush
- Hybrid search (BM25 + vector)
- Embedding cache
- Session transcript search

**Fix - Enable All**:
```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "reserveTokensFloor": 20000,
        "memoryFlush": {
          "enabled": true,
          "softThresholdTokens": 4000,
          "systemPrompt": "Session nearing compaction. Store durable memories now.",
          "prompt": "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store."
        }
      },
      "memorySearch": {
        "provider": "local",
        "model": "all-MiniLM-L6-v2",
        "local": {
          "modelPath": "sentence-transformers/all-MiniLM-L6-v2"
        },
        "query": {
          "hybrid": {
            "enabled": true,
            "vectorWeight": 0.7,
            "textWeight": 0.3,
            "candidateMultiplier": 4
          }
        },
        "cache": {
          "enabled": true,
          "maxEntries": 50000
        }
      }
    }
  }
}
```

**Verify Cache**:
```bash
sqlite3 ~/.openclaw/memory/main.sqlite "SELECT COUNT(*) FROM embedding_cache;"
```

---

### 3. Memory Accuracy Degradation (r/AI_Agents)

**Problem**: As documents grow, picking accuracy decreases

**Root Cause**: Simple retrieval without consolidation

**Solution - Tiered Memory System** (Discussion #17692):

```
T0: Foundational (MEMORY.md, SOUL.md, USER.md) - Always loaded
T1: Working (Context window) - Current session
T2: Daily (memory/daily/YYYY-MM-DD.md) - 48h then compress
T3: Short-term (memory/short-term/{topic}.md) - 14d then archive
T4: Long-term (memory/long-term/{topic}.md) - Deep search only
```

**Implementation**:
```bash
# Directory structure
memory/
├── daily/
│   ├── 2026-02-16.md
│   └── 2026-02-17.md
├── short-term/
│   ├── deployment.md
│   ├── security.md
│   └── architecture.md
├── long-term/
│   └── old-decisions.md
└── manifest.json
```

---

### 4. Missing Memory Types (r/LocalLLaMA)

**Problem**: Current systems only have weak episodic memory

**Missing**:
- Semantic (distilled knowledge)
- Procedural (learned skills)
- Working (attention gate)
- Prospective (future reminders)

**Solution - 5-Type Memory**:

```json
{
  "memory": {
    "episodic": {
      "enabled": true,
      "path": "memory/daily/",
      "format": "detailed_with_context"
    },
    "semantic": {
      "enabled": true,
      "path": "memory/semantic/",
      "consolidation": {
        "enabled": true,
        "minOccurrences": 3,
        "timeWindow": "30d"
      }
    },
    "procedural": {
      "enabled": true,
      "path": "memory/procedural/",
      "tracks": [
        "coding_style",
        "communication_preferences",
        "decision_patterns"
      ]
    },
    "working": {
      "enabled": true,
      "maxTokens": 4000,
      "relevanceThreshold": 0.7
    },
    "prospective": {
      "enabled": true,
      "path": "memory/prospective/",
      "triggers": ["time", "context", "event"]
    }
  }
}
```

---

### 5. No Deterministic Local Memory (Issue #13329)

**Problem**: Need auditable, reproducible memory

**Solution - Mem Integration**:

```bash
# Install mem
npm install -g @amcbstudio/mem

# Initialize
mem init

# Usage in OpenClaw
mem append --event "deployment_completed" --data '{"server": "45.56.105.143"}'
mem sync
mem show
```

**Artifacts**:
- `.amcb/memory/events.jsonl` (append-only log)
- `.amcb/memory/state.json` (deterministic state)
- `.amcb/memory/MEMORY.md` (human-readable)

---

## Complete Memory Configuration

### openclaw.json - Full Memory Setup

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "mode": "auto",
        "threshold": 0.75,
        "reserveTokensFloor": 20000,
        "memoryFlush": {
          "enabled": true,
          "softThresholdTokens": 4000,
          "systemPrompt": "Session nearing compaction. Store durable memories now.",
          "prompt": "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store."
        }
      },
      "memorySearch": {
        "provider": "local",
        "model": "all-MiniLM-L6-v2",
        "local": {
          "modelPath": "sentence-transformers/all-MiniLM-L6-v2"
        },
        "query": {
          "hybrid": {
            "enabled": true,
            "vectorWeight": 0.7,
            "textWeight": 0.3,
            "candidateMultiplier": 4
          }
        },
        "cache": {
          "enabled": true,
          "maxEntries": 50000
        }
      },
      "tools": {
        "subagents": {
          "tools": {
            "allow": ["memory_search", "memory_get", "read", "write", "edit"],
            "deny": []
          }
        }
      }
    }
  },
  "memory": {
    "tiered": {
      "enabled": true,
      "tiers": {
        "t0": {
          "files": ["MEMORY.md", "SOUL.md", "USER.md"],
          "permanent": true
        },
        "t2": {
          "path": "memory/daily/",
          "compressionThreshold": "48h",
          "retentionAfterCompression": "7d"
        },
        "t3": {
          "path": "memory/short-term/",
          "archivalThreshold": "14d",
          "maxRecallsBeforeArchival": 1
        },
        "t4": {
          "path": "memory/long-term/",
          "promotionThreshold": "3 recalls in 7d",
          "promotionCooldown": "72h",
          "deletionThreshold": "90d",
          "deletionEnabled": false
        }
      },
      "searchWeights": {
        "t0": 1.2,
        "t2": 1.5,
        "t3": 1.0,
        "t4": 0.5
      }
    },
    "types": {
      "episodic": {
        "enabled": true,
        "path": "memory/daily/"
      },
      "semantic": {
        "enabled": true,
        "path": "memory/semantic/",
        "consolidation": {
          "enabled": true,
          "schedule": "0 2 * * *"
        }
      },
      "procedural": {
        "enabled": true,
        "path": "memory/procedural/"
      },
      "prospective": {
        "enabled": true,
        "path": "memory/prospective/"
      }
    }
  }
}
```

---

## Implementation Checklist

### Phase 1: Immediate Fixes
- [ ] Remove `memory_search`/`memory_get` from sub-agent deny list
- [ ] Enable hybrid search (BM25 + vector)
- [ ] Enable embedding cache
- [ ] Enable pre-compaction memory flush

### Phase 2: Tiered Memory
- [ ] Create directory structure (daily/, short-term/, long-term/)
- [ ] Implement compression (T2 → T3)
- [ ] Implement archival (T3 → T4)
- [ ] Implement promotion (T4 → T3)
- [ ] Add recall tracking

### Phase 3: 5-Type Memory
- [ ] Enhance episodic (context + emotion)
- [ ] Build semantic consolidation
- [ ] Track procedural patterns
- [ ] Implement working memory gate
- [ ] Add prospective reminders

### Phase 4: Integration
- [ ] Add mem integration option
- [ ] Test with Supermemory plugin
- [ ] Benchmark accuracy improvements
- [ ] Document best practices

---

## Verification Commands

```bash
# Check embedding cache
sqlite3 ~/.openclaw/memory/main.sqlite "SELECT COUNT(*) FROM embedding_cache;"

# Check tiered memory structure
ls -la ~/.openclaw/workspace/memory/

# Verify hybrid search is working
openclaw memory search "deployment" --verbose

# Test sub-agent memory access
openclaw spawn "Search memory for security fixes"

# Check prospective memories
openclaw memory prospective list
```

---

## Resources

- Issue #16214: Sub-agent memory access
- Issue #13329: Mem integration
- Discussion #6038: Memory optimization
- Discussion #17692: Tiered memory system
- r/AI_Agents: Memory accuracy discussion
- r/LocalLLaMA: 5 memory types
- ComposioHQ/secure-openclaw: Production implementation

---

**Status**: Comprehensive memory fix guide complete  
**Priority**: High - Memory is core to agent effectiveness  
**Impact**: Dramatically improved recall and accuracy
