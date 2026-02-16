# Tiered Memory System - Human Memory Model for OpenClaw

**Source**: OpenClaw GitHub Discussion #17692  
**Author**: Community proposal  
**Concept**: 5-tier memory system similar to human memory

---

## Overview

A multi-tiered memory system that mimics how human memory works, with automatic promotion and demotion of memories based on relevance and recall frequency.

---

## The 5-Tier Memory System

### T0 — Foundational Memory (Permanent)

**What**: Core identity files  
**Location**: Workspace root  
**Files**:
- `MEMORY.md` - Long-term curated memories
- `SOUL.md` - Agent personality and values
- `USER.md` - User preferences and context

**Behavior**:
- ✅ Never compressed
- ✅ Never archived
- ✅ Never deleted
- ✅ Injected into every system prompt
- ✅ Always loaded

**Analogy**: Core beliefs and identity - always accessible

---

### T1 — Working Memory (Context)

**What**: Current active context  
**Location**: LLM context window  
**Contents**:
- System prompt
- Active conversation
- Tool results
- Recent interactions

**Behavior**:
- Managed by LLM context (not memory system)
- Implicit and automatic
- Limited by token budget

**Analogy**: Short-term memory - what you're thinking about right now

---

### T2 — Daily Memory (Fast Capture)

**What**: Today's events and observations  
**Location**: `memory/daily/YYYY-MM-DD.md`  
**Format**:
```markdown
# 2026-02-17

## Deployment
- Set up Linode server 45.56.105.143
- Configured GitHub Actions workflow
- Deployed OpenClaw Hosting platform

## Decisions
- Using pnpm for monorepo management
- Docker for containerization

## Action Items
- [ ] Configure SSL certificates
- [ ] Set up monitoring
```

**Behavior**:
- ✅ Uncompressed
- ✅ Verbatim capture
- ✅ Fast write, no loss
- ✅ Organized by topic headings
- Written by session hooks and memory flush

**Analogy**: Today's journal - fresh and detailed

**Transition**: T2 → T3 after 48 hours (compression)

---

### T3 — Short-term Memory (Compressed Topics)

**What**: Compressed topic summaries  
**Location**: `memory/short-term/{topic}.md`  
**Examples**:
- `api-design.md`
- `deployment-setup.md`
- `security-fixes.md`

**Format**:
```markdown
# Deployment Setup

## Summary
OpenClaw Hosting deployed on Linode VPS (45.56.105.143) using Docker.

## Key Decisions
- Ubuntu 24.04 LTS base image
- Docker Compose for orchestration
- PostgreSQL + Redis for data layer

## Action Items
- [ ] SSL certificates (Let's Encrypt)
- [ ] Monitoring setup (Prometheus/Grafana)

## Last Updated
2026-02-17
```

**Behavior**:
- ✅ Compressed (LLM-summarized)
- ✅ Topic-organized
- ✅ Merged updates
- ✅ Manifest tracks topics
- ✅ Baseline search weight (1.0x)

**Analogy**: Study notes - organized by subject

**Transition**:
- T2 → T3: Compression after 48 hours
- T3 → T4: Archival after 14 days (low recall)
- T4 → T3: Promotion after 3 recalls in 7 days

---

### T4 — Long-term Memory (Archive)

**What**: Archived, rarely accessed memories  
**Location**: `memory/long-term/{topic}.md`  
**Behavior**:
- ✅ Excluded from normal search
- ✅ Only in deep search
- ✅ 0.5x search weight
- ✅ Candidate for deletion after 90 days

**Analogy**: Old archives - accessible but not actively searched

---

## Tier Transitions

### 1. Daily → Short-term (Compression)

**Trigger**: Daily files older than 48 hours

**Process**:
1. Scan daily files past threshold
2. Parse topic headings
3. Group content by topic
4. Send to LLM with compression prompt:
   ```
   Preserve: decisions, dates, names, action items, preferences
   Remove: conversational noise
   Output: Under token budget
   ```
5. Write to short-term directory
6. Retain daily files for 7 days (safety)

**Example**:
```
Input (Daily):
"Today I worked on the deployment. The server kept failing 
because of Docker issues. Finally got it working at 3am. 
Note: Need to fix the Dockerfile for better caching."

Output (Short-term):
"Docker deployment issues resolved. Dockerfile needs 
caching optimization. Completed 2026-02-17."
```

---

### 2. Short-term → Long-term (Archival)

**Trigger**: 
- Low recall count (≤1 in 14 days)
- Time since last recall > 14 days

**Process**:
1. Track recall frequency per file
2. Check threshold conditions
3. Move file to long-term directory
4. No content transformation
5. Update search index

**Example**:
```
File: api-design.md
Recalls: 0 in 14 days
Action: Move to memory/long-term/api-design.md
```

---

### 3. Long-term → Short-term (Promotion)

**Trigger**:
- 3+ recalls in 7 days (from deep search)
- Or explicit agent request

**Process**:
1. Detect frequent recalls
2. Move file to short-term
3. Add to normal search
4. 72-hour cooldown (prevent ping-pong)

**Example**:
```
File: old-architecture.md
Deep search recalls: 5 in 7 days
Action: Promote to memory/short-term/old-architecture.md
```

---

### 4. Long-term Deletion (Purge)

**Trigger**: 90 days without recall

**Process**:
1. Identify stale files
2. Check deletion enabled flag
3. Remove file from disk
4. Remove from index
5. Log deletion

**Safety**: Disabled by default - nothing lost unless explicitly enabled

---

## Recall Tracking

### What Gets Tracked

Every memory search records:
- Which chunks were recalled
- When (timestamp)
- Query that triggered recall
- Relevance score
- Tier of recalled memory

### Database Schema

```sql
CREATE TABLE memory_recalls (
    id INTEGER PRIMARY KEY,
    file_path TEXT,
    tier INTEGER,  -- 0-4
    query TEXT,
    relevance_score FLOAT,
    recalled_at TIMESTAMP,
    session_id TEXT
);
```

### Usage

Recall frequency drives all tier transitions. High recall = promotion, low recall = archival.

---

## Search Weighting

| Tier | Weight | Search Scope |
|------|--------|--------------|
| T0 Foundational | 1.2x | Always included |
| T1 Working | N/A | Context window |
| T2 Daily | 1.5x | Normal search |
| T3 Short-term | 1.0x | Normal search |
| T4 Long-term | 0.5x | Deep search only |

**Purpose**: Fresher memories rank higher in results

---

## Background Execution

### Heartbeat Integration

Tier maintenance runs as a lightweight background task:

```
Heartbeat (every 5 min)
    ↓
Check if maintenance due
    ↓
Run transition pipeline:
    - Compression (T2→T3)
    - Promotion (T4→T3)
    - Archival (T3→T4)
    - Deletion (T4 purge)
    - Daily cleanup
```

### Guardrails

- Minimum 5-minute interval
- Guard flag prevents concurrent runs
- Exit immediately if nothing due
- Near-zero overhead when idle

---

## Plugin Integration

### Hooks Available

**Before Transition**:
```javascript
beforeTransition: (file, fromTier, toTier) => {
    // Return: 'proceed' | 'skip' | 'force'
    if (file.includes('critical')) return 'skip';
    return 'proceed';
}
```

**After Transition**:
```javascript
afterTransition: (file, fromTier, toTier) => {
    // Logging, analytics, workflows
    log.info(`Moved ${file} from T${fromTier} to T${toTier}`);
}
```

---

## Configuration

### Config Block

```json
{
  "memory": {
    "tiered": {
      "enabled": true,
      "tiers": {
        "t0": {
          "files": ["MEMORY.md", "SOUL.md", "USER.md"],
          "permanent": true
        },
        "t2": {
          "compressionThreshold": "48h",
          "retentionAfterCompression": "7d"
        },
        "t3": {
          "archivalThreshold": "14d",
          "maxRecallsBeforeArchival": 1
        },
        "t4": {
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
      },
      "background": {
        "interval": "5m",
        "concurrentProtection": true
      }
    }
  }
}
```

### Defaults

All fields optional with sensible defaults. System disabled by default until explicitly enabled.

---

## Benefits

### 1. Efficient Context Usage
- Working memory only holds relevant info
- Automatic compression reduces token usage
- No manual memory management

### 2. Natural Recall Patterns
- Frequently used memories stay accessible
- Rarely used memories archived automatically
- Promotes relevant knowledge back

### 3. Persistent Knowledge
- Foundational memory never lost
- Daily capture ensures nothing forgotten
- Archive preserves historical context

### 4. Configurable
- All thresholds adjustable
- Disable entirely if not needed
- Plugin hooks for customization

---

## Implementation for OpenClaw Hosting

### Current System
We use basic memory files:
- `MEMORY.md` (T0 equivalent)
- `memory/YYYY-MM-DD.md` (T2 equivalent)

### Proposed Enhancement

Add tiered system:
```
memory/
├── daily/           # T2 - Daily capture
│   ├── 2026-02-16.md
│   └── 2026-02-17.md
├── short-term/      # T3 - Compressed topics
│   ├── deployment.md
│   ├── security.md
│   └── architecture.md
├── long-term/       # T4 - Archive
│   └── old-decisions.md
└── manifest.json    # Topic tracking
```

### Integration

1. **Daily Flush**: Write to `memory/daily/`
2. **Heartbeat**: Run tier transitions
3. **Search**: Apply tier weights
4. **Recall Tracking**: Log all searches

---

## Conclusion

### Key Innovation

Human-like memory management for AI agents:
- **Foundational**: Core identity (never forget)
- **Working**: Active context (limited)
- **Daily**: Fresh capture (detailed)
- **Short-term**: Compressed topics (organized)
- **Long-term**: Archive (accessible but deprioritized)

### For OpenClaw Hosting

This system would:
- ✅ Reduce context bloat
- ✅ Preserve important decisions
- ✅ Archive old information automatically
- ✅ Surface relevant memories
- ✅ Work with existing MEMORY.md

### Next Steps

1. Implement core tier system
2. Add recall tracking
3. Create background maintenance
4. Build plugin hooks
5. Test with real usage

---

**Source**: OpenClaw Discussion #17692  
**Status**: Community proposal  
**Type**: Feature request  
**Impact**: High - would revolutionize memory management
