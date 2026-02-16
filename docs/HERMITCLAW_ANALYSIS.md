# HermitClaw - The Autonomous Research Agent

**Repository**: https://github.com/brendanhogan/hermitclaw  
**Author**: Brendan Hogan  
**Concept**: "A tamagotchi that does research"  
**Tagline**: "A tiny AI creature that lives in a folder on your computer"

---

## The Concept

**HermitClaw** is fundamentally different from OpenClaw:

| Aspect | OpenClaw | HermitClaw |
|--------|----------|------------|
| **Interaction** | User-driven | Autonomous |
| **Trigger** | Wait for commands | Self-directed research |
| **Scope** | Full system access | Single folder sandbox |
| **Personality** | None | Generated genome |
| **Memory** | Session-based | Persistent, reflective |
| **Visual** | Terminal/dashboard | Pixel-art room |

**Core Idea**: An AI agent that lives continuously, follows its own curiosity, and fills a folder with research - like a digital pet that does work.

---

## Key Features

### 1. Autonomous Research Loop
The crab runs 24/7 on a continuous loop:
```
Think → Use Tools → Remember → Reflect → Plan → Sleep → Loop
```

**Activities**:
- Picks topics on its own
- Searches the web
- Writes reports
- Writes code
- Takes notes
- Moves to next topic

### 2. Personality Genome
**Generated from keyboard entropy** (mashing keys):
- **3 curiosity domains** (from 50 options)
- **2 thinking styles** (from 16 options)
- **1 temperament** (from 8 options)

**Example**:
```
Domains: mycology, fractal geometry, tidepool ecology
Style: connecting disparate ideas, inverting assumptions
Temperament: playful and associative
```

### 3. Memory System (Smallville-style)

**Inspired by**: [Park et al., 2023 - Generative Agents](https://arxiv.org/abs/2304.03442)

**Storage**:
- Append-only memory stream (JSONL)
- Every thought scored 1-10 for importance
- Vector embeddings for semantic search

**Three-Factor Retrieval**:
```
score = recency + importance + relevance
```

**Reflection Hierarchy**:
```
Raw thoughts → Reflections (depth 1) → Higher reflections (depth 2) → ...
```

### 4. The Pixel-Art Room

**Visual Environment**:
- 12x12 tile room (HTML5 Canvas)
- Crab moves between locations:
  - **Desk** - Writing, coding
  - **Bookshelf** - Research, browsing
  - **Window** - Pondering, reflecting
  - **Bed** - Resting
  - **Rug** - Default/center

**State Indicators**:
- 💭 Thought bubble - thinking
- ✨ Sparkles - reflecting
- 📋 Clipboard - planning
- 💬 Speech bubble - conversing
- ❗ Red ! - new file detected

### 5. Moods (Autonomous Behavior)

When not focused, the crab gets random moods:

| Mood | Behavior |
|------|----------|
| **Research** | Pick topic, web search, write report |
| **Deep-dive** | Push a project forward |
| **Coder** | Write scripts, tools, simulations |
| **Writer** | Write reports, essays, analysis |
| **Explorer** | Search unknown topics |
| **Organizer** | Update projects, organize files |

### 6. Sandboxing

**Security**: Crab can ONLY access its own folder

**Restrictions**:
- Blocked shell prefixes (sudo, curl, ssh, rm -rf)
- No path traversal (..)
- No absolute paths
- Python sandbox (pysandbox.py)
- 60-second timeout
- Own virtual environment

---

## Comparison with OpenClaw

### Philosophy

| | OpenClaw | HermitClaw |
|---|----------|------------|
| **Metaphor** | Assistant/Employee | Pet/Creature |
| **Relationship** | Master-servant | Companion |
| **Initiative** | User-driven | Self-directed |
| **Scope** | Broad (system-wide) | Narrow (single folder) |
| **Continuity** | Session-based | Persistent/24-7 |

### Use Cases

**OpenClaw**:
- Task automation
- Code generation
- System administration
- Business workflows

**HermitClaw**:
- Background research
- Continuous learning
- Creative exploration
- Digital companion

---

## Technical Architecture

### Backend (Python)
```
hermitclaw/
├── main.py          # Entry point, multi-crab
├── brain.py         # Thinking loop (heart)
├── memory.py        # Memory stream
├── prompts.py       # System prompts
├── providers.py     # OpenAI API
├── tools.py         # Sandboxed shell
├── pysandbox.py     # Python sandbox
├── identity.py      # Personality genome
└── server.py        # FastAPI + WebSocket
```

### Frontend (React + Canvas)
```
frontend/
├── App.tsx          # Layout, chat, switcher
├── GameWorld.tsx    # Pixel-art room
└── sprites.ts       # Sprite definitions
```

### Storage (No Database)
- Append-only JSONL for memories
- Flat files for everything else
- Gitignored `{name}_box/` folders

---

## Multi-Crab Support

**Run multiple crabs simultaneously**:
```bash
$ python hermitclaw/main.py
Found 2 crab(s): Coral, Pepper
Create a new one? (y/N)
```

Each crab:
- Independent thinking loop
- Own personality
- Own folder/box
- Switchable UI

---

## Implications for OpenClaw Hosting

### 1. Different Market Segment

**HermitClaw**: Personal, creative, companion  
**OpenClaw Hosting**: Business, production, managed

**Minimal overlap** - different use cases

### 2. Feature Inspiration

**Could adapt for OpenClaw**:
- Personality profiles for agents
- Persistent memory across sessions
- Autonomous background tasks
- Visual agent representation

### 3. Integration Opportunity

**Hybrid concept**:
```
OpenClaw VPS (business tasks)
    ↕
HermitClaw (personal research)
    ↕
Shared memory/knowledge base
```

### 4. Positioning

**OpenClaw Hosting**:
> "The serious, managed infrastructure for AI agents"

**HermitClaw**:
> "The playful, personal AI companion"

---

## Unique Selling Points

### HermitClaw Only:
- ✅ 24/7 autonomous operation
- ✅ Personality genome from entropy
- ✅ Pixel-art visual representation
- ✅ Reflection/memory hierarchy
- ✅ Sandboxed to single folder
- ✅ "Tamagotchi" experience

### OpenClaw Hosting Only:
- ✅ VPS provisioning
- ✅ Multi-agent orchestration
- ✅ Business integrations (WHMCS)
- ✅ Production infrastructure
- ✅ Managed service
- ✅ Scalability

---

## Conclusion

**HermitClaw represents a different paradigm**:
- **Not a tool**, but a companion
- **Not user-driven**, but autonomous
- **Not broad**, but focused
- **Not business**, but personal

**For OpenClaw Hosting**:
- No direct competition
- Potential feature inspiration
- Different market entirely
- Could offer as "personal tier"

**The AI agent space is diversifying**:
- OpenClaw → Business/Enterprise
- HermitClaw → Personal/Creative
- PicoClaw → Embedded/IoT
- Ultron → Scale/Automation

---

**Source**: https://github.com/brendanhogan/hermitclaw  
**Concept**: Autonomous research agent as digital pet  
**License**: MIT
