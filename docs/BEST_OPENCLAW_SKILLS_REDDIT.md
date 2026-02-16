# Best OpenClaw Skills - Community Recommendations

**Source**: r/AI_Agents Reddit post  
**Author**: Active OpenClaw user  
**Context**: "500+ skills on clawhub, sharing ones that actually get used daily"

---

## Top Recommended Skills

### 1. GitHub Integration ⭐

**Install**: `clawdhub install github`

**What It Does**:
- Managed OAuth
- Handles repos/issues/PRs/commits
- Create issues from chat
- Review PRs
- Search code without GitHub UI

**Use Case**: Essential for any dev work

**Verdict**: **MUST HAVE** for developers

---

### 2. AgentMail 📧

**Install**: `clawdhub install agentmail`

**What It Does**:
- Give agents their own email addresses
- Create inboxes programmatically
- Handle verifications
- Manage multiple agent identities
- Let agents sign up for services

**Use Case**: Email automation, agent identity management

**Verdict**: **UNIQUE** - not available elsewhere

---

### 3. Linear Integration 📊

**Install**: `clawdhub install linear`

**What It Does**:
- GraphQL-based API
- Manage issues/projects/teams/cycles
- Create/update Linear issues
- Faster than switching apps

**Use Case**: Project management for Linear users

**Verdict**: **GREAT** if you use Linear

---

### 4. Automation Workflows ⚙️

**Install**: `clawdhub install automation-workflows`

**What It Does**:
- Design automation workflows
- Identify repetitive tasks
- Set up triggers/actions
- Agent builds workflows for you

**Use Case**: Workflow automation across tools

**Verdict**: **META** - agent that builds automations

---

### 5. Monday.com Integration 📋

**Install**: `clawdhub install monday`

**What It Does**:
- Create items on boards
- Update boards
- Manage tasks
- 2.5K downloads

**Use Case**: Project tracking for Monday users

**Verdict**: **POPULAR** - 2.5K downloads

---

### 6. Playwright Scraper 🔍

**Install**: `clawdhub install playwright-scraper-skill`

**What It Does**:
- Web scraping with anti-bot protection
- Works on complex sites
- Bypasses bot detection

**Use Case**: Data extraction from protected sites

**Verdict**: **POWERFUL** for scraping

---

### 7. Playwright MCP 🌐

**Install**: `clawdhub install playwright-mcp`

**What It Does**:
- Navigate websites
- Click elements
- Fill forms
- Take screenshots
- Complete browser automation

**Use Case**: Full browser automation workflows

**Verdict**: **ESSENTIAL** for web automation

---

### 8. Obsidian Direct 📝

**Install**: `clawdhub install obsidian-direct`

**What It Does**:
- Fuzzy search across notes
- Auto-folder detection
- Manage tags and wikilinks
- Query Obsidian vault as knowledge base

**Use Case**: Knowledge base integration

**Verdict**: **GREAT** for Obsidian users

---

### 9. NextJS 16+ Documentation 📚

**Install**: `clawdhub install lb-nextjs16-skill`

**What It Does**:
- Entire NextJS 16 documentation
- Markdown format
- Reference while building/debugging

**Use Case**: NextJS development

**Verdict**: **HELPFUL** for NextJS projects

---

## Installation Guide

### Prerequisites
```bash
# Install clawdhub CLI
npm i -g clawdhub
```

### Search and Install
```bash
# Search for skills
clawdhub search "skill-name"

# Install a skill
clawdhub install skill-name
```

### Configuration
- Skills load automatically
- OAuth skills (GitHub, Monday) need authentication
- Others work out of the box

---

## Author's Personal Stack

**What they're actually using daily**:

1. **github** - Dev work
2. **agentmail** - Email automation
3. **linear** - Project management
4. **playwright-mcp** - Browser tasks
5. **obsidian-direct** - Knowledge management

**Coverage**:
- ✅ Dev work
- ✅ Project management
- ✅ Email automation
- ✅ Browser automation
- ✅ Knowledge management

---

## Analysis: What Makes These Popular

### Common Patterns

1. **Integration-First**
   - GitHub, Linear, Monday, Obsidian
   - Connect to tools people already use

2. **Automation-Heavy**
   - Playwright (2 variants)
   - Automation workflows
   - AgentMail

3. **Developer-Focused**
   - GitHub essential
   - NextJS docs
   - Linear for tech teams

4. **Unique Capabilities**
   - AgentMail (agent email addresses)
   - Obsidian integration
   - Anti-bot scraping

---

## Implications for OpenClaw Hosting

### 1. Pre-Install Popular Skills

**Offer bundles**:
```bash
# Developer bundle
openclaw skills install github linear playwright-mcp

# Content creator bundle
openclaw skills install agentmail obsidian-direct

# Automation bundle
openclaw skills install automation-workflows playwright-mcp
```

### 2. Skill Recommendations

**Onboarding flow**:
```
What do you want to automate?
[ ] Development → Install: github, linear
[ ] Content → Install: agentmail, obsidian-direct
[ ] Research → Install: playwright-scraper, obsidian-direct
[ ] Business → Install: monday, automation-workflows
```

### 3. Custom Skills

**Build our own**:
- WHMCS integration (billing)
- VPS management
- Multi-agent orchestration
- Custom monitoring

### 4. Skill Marketplace

**Feature**: Curated skill store
- Popular skills highlighted
- User ratings
- One-click install
- Verified skills

---

## Missing Skills (Opportunities)

### Not Mentioned But Needed

1. **Database Skills**
   - PostgreSQL management
   - Query builder
   - Migration tools

2. **Cloud Skills**
   - AWS/GCP/Azure integration
   - Resource management
   - Cost optimization

3. **Communication Skills**
   - Slack advanced features
   - Discord bot creation
   - Teams integration

4. **Monitoring Skills**
   - Uptime monitoring
   - Log analysis
   - Alert management

5. **Security Skills**
   - Vulnerability scanning
   - Secret management
   - Compliance checking

---

## Community Insights

### What Users Want

From the post and comments:
1. **Integration with existing tools** - Not new tools
2. **Automation of repetitive tasks** - Time saving
3. **Developer workflows** - Code, PRs, issues
4. **Knowledge management** - Search, organize
5. **Email automation** - Agent identities

### What Works

- OAuth-managed integrations
- Browser automation
- Knowledge base queries
- Project management
- Email handling

---

## Action Items

### For OpenClaw Hosting

1. **Pre-Configure Popular Skills**
   - Install top 10 skills by default
   - Configure OAuth automatically
   - Ready-to-use setup

2. **Create Skill Bundles**
   - Developer pack
   - Business pack
   - Content creator pack
   - Automation pack

3. **Build Missing Skills**
   - WHMCS integration
   - VPS management
   - Monitoring tools
   - Security scanning

4. **Skill Documentation**
   - How to use each skill
   - Best practices
   - Example workflows
   - Troubleshooting

5. **Community Engagement**
   - Reddit presence
   - Skill showcase
   - User testimonials
   - Case studies

---

## Conclusion

### Key Takeaways

1. **500+ skills available** - Ecosystem is rich
2. **10 skills are essential** - Focus on these
3. **Integration is key** - Connect to existing tools
4. **Developer-focused** - Most users are technical
5. **Automation is the goal** - Save time, reduce context switching

### For Our Platform

**Position as**:
> "OpenClaw Hosting comes with the best skills pre-installed and pre-configured"

**Value add**:
- Curated skill selection
- Pre-configured OAuth
- Optimized for our infrastructure
- Custom skills for hosting

---

**Source**: r/AI_Agents Reddit  
**Skills Listed**: 9 essential skills  
**Total Available**: 500+ on clawhub  
**Top Categories**: Dev tools, Automation, Project management
