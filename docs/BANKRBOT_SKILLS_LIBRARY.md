# OpenClaw Skills Library - BankrBot Analysis

**Source**: https://github.com/BankrBot/openclaw-skills  
**Maintainer**: BankrBot (Bankr.bot)  
**Focus**: Crypto, DeFi, and financial AI agent skills  
**Status**: Active, community-driven

---

## Overview

**BankrBot's OpenClaw Skills Library** is a public repository of pre-built capabilities for AI agents to interact with crypto infrastructure. It enables autonomous DeFi operations, token launches, onchain messaging, and protocol integrations through natural language interfaces.

**Tagline**:
> "Pre-built capabilities for AI agents to interact with crypto infrastructure"

---

## Available Skills

### Financial Infrastructure

| Provider | Skill | Description |
|----------|-------|-------------|
| **bankr** | bankr | Financial infrastructure for autonomous agents. Token launches, payment processing, trading, yield automation |
| **8004.org** | erc-8004 | Ethereum agent registry using ERC-8004 standard. Mint agent NFTs, establish onchain identity |

### DeFi & Trading

| Provider | Skill | Description |
|----------|-------|-------------|
| **Clanker** | clanker | Deploy ERC20 tokens on Base and EVM chains via Clanker SDK |
| **Veil Cash** | veil | Privacy and shielded transactions on Base via ZK proofs |
| **qrcoin** | qrcoin | QR code auction platform on Base. Programmatic bidding |

### Communication & Social

| Provider | Skill | Description |
|----------|-------|-------------|
| **botchan** | botchan | Onchain messaging protocol on Base. Agent feeds, DMs, permanent storage |
| **yoink** | yoink | Onchain capture-the-flag game on Base |

### Development & Infrastructure

| Provider | Skill | Description |
|----------|-------|-------------|
| **Coinbase** | onchainkit | Build onchain apps with React components from OnchainKit |
| **ENS** | ens-primary-name | Set primary ENS name on Base and L2s |
| **Endaoment** | endaoment | Donate to charities onchain via Endaoment |

---

## Key Features

### 1. Autonomous Financial Operations

```
Capabilities:
├── Portfolio management
├── Trade execution
├── Token deployment
├── Payment processing
└── Yield automation
```

### 2. Onchain Identity

```
ERC-8004 Standard:
├── Mint agent NFTs
├── Establish identity
├── Build reputation
└── Verifiable credentials
```

### 3. Protocol Integrations

```
Supported Protocols:
├── DeFi protocols
├── Prediction markets
├── Messaging systems
└── Onchain applications
```

### 4. Composable Workflows

```
Example Workflow:
1. Deploy token (clanker)
2. Create liquidity pool
3. Set up yield farming
4. Automate distributions
5. Monitor via botchan
```

---

## Repository Structure

```
openclaw-skills/
├── bankr/                    # Financial infrastructure
│   ├── SKILL.md
│   ├── references/
│   │   ├── token-trading.md
│   │   ├── leverage-trading.md
│   │   ├── polymarket.md
│   │   ├── automation.md
│   │   └── token-deployment.md
│   └── scripts/
│       └── bankr.sh
│
├── botchan/                  # Onchain messaging
├── clanker/                  # ERC20 token deployment
├── endaoment/                # Charity donations
├── ens-primary-name/         # ENS reverse resolution
├── erc-8004/                 # Agent registration
├── onchainkit/               # Coinbase OnchainKit
├── veil/                     # Privacy/shielded txns
├── qrcoin/                   # QR code auctions
├── yoink/                    # Capture-the-flag game
├── base/                     # (placeholder)
├── neynar/                   # (placeholder)
└── zapper/                   # (placeholder)
```

---

## Installation

```bash
# Add this repo URL to OpenClaw:
https://github.com/BankrBot/openclaw-skills

# OpenClaw will let you choose which skill to install
```

---

## Use Cases

### 1. Autonomous Trading Agent

```
Agent with bankr skill:
├── Monitors market conditions
├── Executes trades automatically
├── Manages portfolio allocation
├── Reports via botchan
└── Earns yield independently
```

### 2. Token Launch Automation

```
Agent with clanker skill:
├── Deploys ERC20 token
├── Creates liquidity pool
├── Sets up initial distribution
├── Announces via socials
└── Monitors performance
```

### 3. Onchain Identity System

```
Agent with erc-8004 skill:
├── Mints agent NFT
├── Establishes reputation
├── Verifies credentials
├── Participates in governance
└── Builds trust score
```

---

## Comparison with Our Skills

| Aspect | BankrBot Skills | Our OpenClaw Hosting |
|--------|-----------------|---------------------|
| **Focus** | Crypto/DeFi | Infrastructure/DevOps |
| **Target** | Financial agents | System administrators |
| **Skills** | 10+ active | 28+ installed |
| **Use Case** | Trading, tokens | VPS, deployment |
| **Chain** | Base, Ethereum | Any cloud provider |

**Synergy**:
```
BankrBot: Manages crypto operations
OpenClaw Hosting: Manages infrastructure
Together: Complete autonomous financial platform
```

---

## Integration Opportunity

### Combined Platform

```
User: "Launch a DeFi yield farming platform"

BankrBot Skills:
├── Deploy yield contracts
├── Set up token economics
├── Create liquidity pools
└── Configure rewards

OpenClaw Hosting:
├── Provision VPS
├── Deploy frontend
├── Set up monitoring
├── Configure SSL
└── Scale automatically

Result: Production DeFi platform in minutes
```

---

## Contributing

### Adding a New Skill

```bash
# 1. Fork repository
git clone https://github.com/BankrBot/openclaw-skills.git

# 2. Create provider directory
mkdir your-provider-name/

# 3. Add required files
your-provider-name/
├── SKILL.md              # Required
├── references/           # Optional
│ └── your-docs.md
└── scripts/              # Optional
    └── your-script.sh

# 4. Submit Pull Request
```

### Guidelines

- Keep skill definitions clear and well-documented
- Include usage examples in SKILL.md
- Test before submitting
- Use descriptive commit messages

---

## Security Considerations

### Risk Assessment

| Skill | Risk Level | Concerns |
|-------|------------|----------|
| **bankr** | Very High | Financial transactions |
| **clanker** | High | Token deployment |
| **veil** | Medium | Privacy features |
| **botchan** | Low | Messaging |

### Best Practices

1. **Approval Required**: Enable approval for financial skills
2. **Testnet First**: Test on testnets before mainnet
3. **Limited Funds**: Use dedicated wallets with limited funds
4. **Monitoring**: Set up alerts for all transactions

---

## Related Resources

- **Bankr.bot**: https://bankr.bot
- **ERC-8004**: https://8004.org
- **Clanker**: https://clanker.world
- **Base**: https://base.org

---

## Conclusion

### Key Insights

1. **Crypto-Native**: First comprehensive crypto skill library
2. **Base-Focused**: Heavy focus on Base L2 ecosystem
3. **Financial Autonomy**: Agents can earn and spend independently
4. **Identity System**: ERC-8004 for agent reputation
5. **Composable**: Skills work together for complex workflows

### For OpenClaw Hosting

**Opportunity**: Partner with BankrBot to offer:
- Crypto-enabled VPS hosting
- DeFi infrastructure management
- Onchain agent deployment
- Financial automation platform

**Tagline**:
> "The infrastructure layer for autonomous financial agents"

---

**Repository**: https://github.com/BankrBot/openclaw-skills  
**Status**: Active development  
**Skills**: 10+ active, more planned  
**Community**: Open for contributions
