# OpenClaw Tools & Skills Tutorial - Analysis

**Source**: https://yu-wenhao.com/en/blog/openclaw-tools-skills-tutorial/  
**Author**: Hence (Yu Wenhao)  
**Focus**: Comprehensive guide to 25 Tools + 53 Skills  
**Date**: February 2026

---

## Overview

This is one of the **most comprehensive guides** to OpenClaw's tools and skills, written by Hence (a PM turned solo builder). It explains the difference between Tools (capabilities) and Skills (instruction manuals), and provides a practical configuration guide.

**Key Quote**:
> "Tools are organs — they determine whether OpenClaw can do something. Skills are textbooks — they teach OpenClaw how to combine Tools to accomplish tasks."

---

## Core Concept: Tools vs Skills

### Tools = Organs (Capabilities)

| Tool | Function | Risk |
|------|----------|------|
| **read** | Read files | Low |
| **write** | Write files | Medium |
| **exec** | Execute commands | Very High |
| **web_search** | Web search | Low |
| **browser** | Browser control | High |
| **message** | Send messages | Very High |

**Key Insight**: Tools determine *whether* OpenClaw can do something.

### Skills = Textbooks (Knowledge)

| Skill | Function | Risk |
|-------|----------|------|
| **gog** | Google Workspace | Medium |
| **github** | GitHub operations | Medium |
| **obsidian** | Note management | Low |
| **slack** | Slack integration | Medium |

**Key Insight**: Skills teach *how* to combine Tools for tasks.

### The Three Requirements

For OpenClaw to actually do something:

1. **Configuration** - Is the Tool enabled? (e.g., exec)
2. **Installation** - Is the bridge tool installed? (e.g., gog CLI)
3. **Authorization** - Has the user granted access? (e.g., Google OAuth)

---

## The 25 Tools (Organized by Layer)

### Layer 1: Core Capabilities (8 Tools)

**Foundation - Most people enable these**

| Tool | Function | Risk | Recommendation |
|------|----------|------|----------------|
| **read** | Read files | Low | ✅ Enable |
| **write** | Write files | Medium | ✅ Enable |
| **edit** | Structured editing | Medium | ✅ Enable |
| **apply_patch** | Apply code patches | Medium | ✅ Enable |
| **exec** | Execute shell commands | Very High | ✅ Enable with approval |
| **process** | Manage processes | Medium | ✅ Enable |
| **web_search** | Web search | Low | ✅ Enable |
| **web_fetch** | Fetch web pages | Medium | ✅ Enable |

### Layer 2: Advanced Capabilities (17 Tools)

**Transform OpenClaw from chatbot to assistant**

#### Browser & Visual

| Tool | Function | Risk | Use Case |
|------|----------|------|----------|
| **browser** | Chrome control | High | Price comparison, form filling |
| **canvas** | Visual workspace | Low | Diagrams, flowcharts |
| **image** | Image analysis | Low | "What's in this image?" |

#### Memory

| Tool | Function | Risk | Benefit |
|------|----------|------|---------|
| **memory_search** | Search memory | Medium | Remembers preferences |
| **memory_get** | Get memory | Medium | Cross-session learning |

**Example**: After a week, OpenClaw knows you build blogs with Astro, deploy on Azure, prefer Traditional Chinese.

#### Multi-Session (5 Tools)

| Tool | Function | Risk |
|------|----------|------|
| **sessions_list** | List sessions | Low |
| **sessions_history** | Session history | Medium |
| **sessions_send** | Send messages | High |
| **sessions_spawn** | Spawn sub-agents | High |
| **session_status** | Check status | Low |

**Use Case**: Run multiple tasks simultaneously without interference.

#### Messaging

| Tool | Function | Risk | Author's Recommendation |
|------|----------|------|------------------------|
| **message** | Cross-platform messaging | Very High | Only send to yourself |

**Warning**: Messages sent by AI can't be unsent. If it misunderstands or gets tricked by Prompt Injection, you bear the consequences.

#### Hardware Control

| Tool | Function | Risk | Author's Choice |
|------|----------|------|-----------------|
| **nodes** | Cross-device control | Very High | ❌ Disabled |

**Reason**: "When would I need AI to open my camera on its own?"

#### Automation

| Tool | Function | Risk | Use Case |
|------|----------|------|----------|
| **cron** | Scheduled tasks | High | Daily Brief at 6:47 AM |
| **gateway** | Restart gateway | High | System management |

#### Other

| Tool | Function | Risk |
|------|----------|------|
| **agents_list** | List agents | Low |
| **llm_task** | Workflow LLM step | Medium |
| **lobster** | Workflow engine | Medium |

---

## The 53 Official Skills (By Category)

### Notes (4 Skills)

| Skill | Platform | Deployment Constraint |
|-------|----------|----------------------|
| **obsidian** | Obsidian | Local files only |
| **notion** | Notion | Cloud-based ✅ |
| **apple-notes** | Apple Notes | Mac only |
| **bear-notes** | Bear | Mac only |

**Author's Choice**: Uses Obsidian locally with Claude Code instead of OpenClaw (VM deployment).

### Productivity

#### Email

| Skill | Protocol | Recommendation |
|-------|----------|----------------|
| **gog** | Google Workspace | ✅ Recommended (complete) |
| **himalaya** | IMAP/SMTP | Basic only |

#### Tasks

| Skill | Platform |
|-------|----------|
| **things-mac** | Things 3 |
| **apple-reminders** | Reminders |
| **trello** | Trello |

**Note**: If using gog, Google Tasks is included.

#### Communication

| Skill | Platform | Risk | Author's Choice |
|-------|----------|------|-----------------|
| **slack** | Slack | Medium | ❌ Not installed |
| **discord** | Discord | Medium | ❌ Not installed |
| **wacli** | WhatsApp | Very High | ❌ Not installed |
| **imsg** | iMessage | Very High | ❌ Not installed |
| **bird** | X/Twitter | Very High | ❌ Not installed |

**Reason**: "The last step in external communication is always manual."

### Developer Tools

| Skill | Function | Author's Status |
|-------|----------|-----------------|
| **github** | GitHub operations | ✅ Installed |
| **tmux** | Terminal sessions | ✅ Installed |
| **session-logs** | Log search | ✅ Installed |
| **coding-agent** | AI coding assistants | ⏳ Planning to install |

**Use Case**: "If CI/CD breaks while I'm out, I ask 'check why this PR build failed' on my phone."

### Security

| Skill | Function | Risk | Recommendation |
|-------|----------|------|----------------|
| **1password** | Password access | Very High | ❌ Not installed |

**Warning**: All-or-nothing access to entire vault. Consider "AI-only vault" if needed.

### Other Categories

- **Music**: spotify-player, sonoscli, blucli
- **Smart Home**: openhue, eightctl
- **Food**: food-order, ordercli
- **Creative**: openai-image-gen, nano-banana-pro
- **Voice**: sag, openai-whisper, sherpa-onnx-tts
- **AI**: gemini, oracle, mcporter
- **System**: clawhub, skill-creator, healthcheck, summarize, weather
- **Places**: goplaces, local-places
- **Media**: camsnap
- **News**: blogwatcher
- **Docs**: nano-pdf
- **Monitor**: model-usage

---

## Author's Configuration

### Tools (21 of 25 enabled)

```json
{
  "tools": {
    "allow": [
      "read", "write", "edit", "apply_patch",
      "exec", "process",
      "web_search", "web_fetch",
      "browser", "image",
      "memory_search", "memory_get",
      "sessions_list", "sessions_history", "sessions_send", "sessions_spawn", "session_status",
      "message", "cron", "gateway", "agents_list"
    ],
    "deny": ["nodes", "canvas", "llm_task", "lobster"]
  },
  "approvals": {
    "exec": { "enabled": true }
  }
}
```

**Disabled** (4):
- nodes: Can't think of a scenario
- canvas: Don't need it
- llm_task, lobster: Not using workflow engine

**exec**: Has approval enabled
**message**: Only sends to himself

### Skills (9 of 53 enabled)

```json
{
  "skills": {
    "allowBundled": [
      "gog", "github", "tmux", "session-logs",
      "weather", "summarize", "clawhub",
      "healthcheck", "skill-creator"
    ]
  }
}
```

**Enabled**:
- **gog**: Email and calendar
- **github**: Repository management
- **tmux, session-logs**: Terminal utilities
- **weather, summarize**: Daily Brief utilities
- **clawhub, healthcheck, skill-creator**: System management

---

## Automation Examples

### 1. Daily Brief (6:47 AM)

```
Trigger: cron (daily at 6:47 AM)
Action: Compile:
  - Today's calendar
  - Pending emails needing replies
  - Weather forecast
  - CI/CD failures overnight
Deliver: Telegram message
```

**Result**: "Replaced checking five different apps before coffee."

### 2. Email Triage (Twice daily)

```
Action: Scan inbox, categorize by urgency
Result: 
  - Newsletters → archived
  - Action needed → flagged with summary
Time saved: 30 minutes → 5 minutes
```

### 3. CI/CD Monitoring

```
Trigger: GitHub Actions failure
Action: Read error log, identify cause
Deliver: Telegram with diagnosis
Result: "Fixed production issues from my phone"
```

### 4. Content Research

```
Daily collection from:
- Specific subreddits
- Hacker News threads
- RSS feeds
Result: Digest of potential writing topics
```

---

## Key Principles

### 1. Minimalism

> "If you can't think of a use case, leave it off"

### 2. Security First

> "More capability, more control — enable approval for exec, only message yourself"

### 3. Manual Last Mile

> "The last mile is always manual — checkout, sending messages, posting publicly"

---

## FAQ Highlights

### Q: Do Skills change permissions?

**A**: No. Skills are manuals. Tools are the actual switches.

### Q: Can 1password Skill read all passwords?

**A**: Yes. Once authorized, it has access to the entire vault.

### Q: OpenClaw vs ChatGPT?

**A**: 
- **ChatGPT**: Can only talk. You manually copy/paste.
- **OpenClaw**: Acts after conversation. Searches web, manages calendar, reads Gmail, drafts replies.

### Q: Can I use OpenClaw without coding?

**A**: Day-to-day: no coding needed. Setup: has learning curve.

---

## Comparison with Our Approach

| Aspect | Author's Setup | Our OpenClaw Hosting |
|--------|---------------|---------------------|
| **Deployment** | Azure VM | Linode VPS |
| **Interface** | Telegram | Telegram + WhatsApp |
| **Primary Use** | Personal productivity | Infrastructure management |
| **Skills Count** | 9 enabled | 28+ installed |
| **Focus** | Email, calendar, research | VPS, deployment, monitoring |

**Common Ground**:
- ✅ Both use cron for automation
- ✅ Both use messaging for notifications
- ✅ Both emphasize security
- ✅ Both enable exec with approval

---

## Actionable Insights

### For Our Documentation

1. **Adopt the Layer Concept**: Organize tools by capability level
2. **Provide Example Configs**: "Start with this, then customize"
3. **Explain the Why**: Not just what, but why each tool/skill matters
4. **Security First**: Always mention risks and safeguards

### For Our Platform

1. **Pre-configured Templates**: "Developer", "Personal", "Enterprise"
2. **Risk Indicators**: Show risk level for each tool/skill
3. **Approval Workflows**: Easy enable/disable approvals
4. **Automation Gallery**: Pre-built automation examples

---

## Conclusion

### Why This Guide Matters

This is the **definitive practical guide** to OpenClaw configuration:
- Clear distinction between Tools and Skills
- Real-world configuration examples
- Honest risk assessments
- Automation inspiration

### Key Takeaways

1. **Tools = Capabilities** (organs)
2. **Skills = Knowledge** (textbooks)
3. **Start minimal**, add as needed
4. **Security is paramount**
5. **The last mile stays manual**

### Recommended Reading Order

1. This guide (configuration)
2. Security guide (protection)
3. Deploy cost guide (costs)

---

**Source**: https://yu-wenhao.com/en/blog/openclaw-tools-skills-tutorial/  
**Author**: Hence (Yu Wenhao)  
**LinkedIn**: https://www.linkedin.com/in/hence/  
**Related Guides**:
- Security Guide: `/en/blog/2026-02-04-is-openclaw-safe-security-guide`
- Deploy Cost: `/en/blog/2026-02-01-openclaw-deploy-cost-guide`
- Claude Code: `/en/blog/claude-code-tutorial`
