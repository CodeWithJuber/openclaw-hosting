# Supermemory Plugin for OpenClaw

**Source**: https://github.com/supermemoryai/openclaw-supermemory  
**Purpose**: Perfect memory and recall for OpenClaw agents  
**Type**: Cloud-based memory system

---

## Overview

Supermemory gives OpenClaw **perfect long-term memory** by:
- Automatically remembering conversations
- Recalling relevant context
- Building persistent user profiles
- Powered by Supermemory cloud (no local infrastructure)

---

## Installation

### Install Plugin
```bash
openclaw plugins install @supermemory/openclaw-supermemory
```

**Restart OpenClaw** after installing.

---

## Configuration

### Required: API Key

Get your API key at [console.supermemory.ai](https://console.supermemory.ai)

**Option 1: Environment Variable**
```bash
export SUPERMEMORY_OPENCLAW_API_KEY="sm_..."
```

**Option 2: openclaw.json**
```json
{
  "plugins": {
    "entries": {
      "openclaw-supermemory": {
        "enabled": true,
        "config": {
          "apiKey": "${SUPERMEMORY_OPENCLAW_API_KEY}"
        }
      }
    }
  }
}
```

---

## Advanced Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `containerTag` | string | `openclaw_{hostname}` | Memory namespace |
| `autoRecall` | boolean | `true` | Inject memories before AI turn |
| `autoCapture` | boolean | `true` | Store conversation automatically |
| `maxRecallResults` | number | `10` | Max memories per turn |
| `profileFrequency` | number | `50` | Inject full profile every N turns |
| `captureMode` | string | `"all"` | `"all"` or `"everything"` |
| `debug` | boolean | `false` | Verbose debug logs |

**Example Configuration**:
```json
{
  "plugins": {
    "entries": {
      "openclaw-supermemory": {
        "enabled": true,
        "config": {
          "apiKey": "sm_your_key_here",
          "containerTag": "openclaw_production",
          "autoRecall": true,
          "autoCapture": true,
          "maxRecallResults": 15,
          "profileFrequency": 30,
          "captureMode": "all",
          "debug": false
        }
      }
    }
  }
}
```

---

## How It Works

### Auto-Recall
Before every AI turn:
1. Queries Supermemory for relevant memories
2. Injects user profile (preferences, facts)
3. Adds semantically similar past conversations
4. AI sees full context

### Auto-Capture
After every AI turn:
1. Extracts key information from exchange
2. Deduplicates similar memories
3. Stores in Supermemory cloud
4. Updates user profile

**Everything runs in the cloud** - no local infrastructure needed.

---

## Slash Commands

| Command | Description |
|---------|-------------|
| `/remember <text>` | Manually save to memory |
| `/recall <query>` | Search memories with similarity scores |

**Examples**:
```
/remember User prefers Kimi K2.5 for coding tasks
/recall What AI models does the user like?
```

---

## AI Tools

Claude can use these tools autonomously:

| Tool | Description |
|------|-------------|
| `supermemory_store` | Save information to long-term memory |
| `supermemory_search` | Search memories by query |
| `supermemory_forget` | Delete memory by query |
| `supermemory_profile` | View user profile |

---

## CLI Commands

```bash
# Search memories
openclaw supermemory search "deployment preferences"

# View user profile
openclaw supermemory profile

# Delete all memories (DESTRUCTIVE - requires confirmation)
openclaw supermemory wipe
```

---

## Comparison: Default Memory vs Supermemory

| Feature | Default OpenClaw Memory | Supermemory |
|---------|------------------------|-------------|
| **Storage** | Local files | Cloud |
| **Search** | Basic | Semantic + BM25 |
| **Profile** | None | Automatic user profile |
| **Deduplication** | None | Automatic |
| **Infrastructure** | None required | Cloud service |
| **Cost** | Free | Pro plan required |
| **Reliability** | Session-based | Persistent |

---

## For OpenClaw Hosting

### Why We Need This

**Current Issues**:
- Context overflow errors
- Memory only saves on `/new`
- Session crashes = lost context
- No semantic search

**Supermemory Solves**:
- ✅ Persistent cloud storage
- ✅ Automatic semantic recall
- ✅ User profile building
- ✅ No context loss on crashes

### Implementation Plan

**Phase 1: Install Plugin**
```bash
openclaw plugins install @supermemory/openclaw-supermemory
```

**Phase 2: Configure**
- Get Pro plan at supermemory.ai
- Add API key to environment
- Configure for production use

**Phase 3: Test**
- Verify auto-recall works
- Check memory capture
- Test semantic search

**Phase 4: Deploy**
- Add to all agents
- Monitor memory usage
- Optimize recall settings

---

## Pricing

**Requires**: Supermemory Pro or above

**Get started**: [console.supermemory.ai/billing](https://console.supermemory.ai/billing)

---

## Alternative Memory Solutions

### Other Options

1. **OpenClaw Memory System** (Community)
   - Local storage
   - Free
   - Less sophisticated

2. **Momo Memory Plugin**
   - Local vector DB
   - Self-hosted
   - More control

3. **Custom RAG Implementation**
   - Full control
   - Higher maintenance
   - Custom integration

**Recommendation**: Supermemory for production, Momo for self-hosted.

---

## Security Considerations

⚠️ **Data in Cloud**
- Conversations stored on Supermemory servers
- Review their privacy policy
- Consider for sensitive data

**Mitigations**:
- Don't store secrets in conversations
- Use local memory for sensitive contexts
- Encrypt sensitive data before storage

---

## Conclusion

### Benefits
- ✅ Perfect memory recall
- ✅ Automatic profile building
- ✅ Semantic search
- ✅ No infrastructure needed
- ✅ Works across sessions

### Drawbacks
- ❌ Requires Pro plan
- ❌ Data in third-party cloud
- ❌ Dependency on external service

### Recommendation

**Use Supermemory for**:
- Production deployments
- Long-running projects
- Multi-session workflows
- User preference tracking

**Use default memory for**:
- Quick tasks
- Sensitive data
- Offline environments
- Cost-sensitive projects

---

**Source**: supermemoryai/openclaw-supermemory  
**Type**: Cloud memory plugin  
**Cost**: Pro plan required  
**Status**: Recommended for production use
