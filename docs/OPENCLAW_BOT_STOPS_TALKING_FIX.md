# OpenClaw "Bot Stops Talking" Troubleshooting Guide

**Issue**: Bot stops responding to messages  
**Symptoms**: Daily disconnections, broken openclaw.json, no responses  
**Platform**: Telegram (primarily)

---

## Common Causes & Solutions

### 1. Session/Context Limit Reached

**Problem**: Token limit exceeded, session needs compaction

**Symptoms**:
- Bot was working, then suddenly stops
- No error messages
- Happens after long conversations

**Check**:
```bash
openclaw status
```

Look for:
```
Tokens: 200k/262k (76%)
```

**Solution**:
- Enable automatic compaction
- Or manually compact: `/compact` or `/reset`

**Config Fix** (in `openclaw.json`):
```json
"agents": {
  "defaults": {
    "compaction": {
      "mode": "auto",
      "threshold": 0.8
    }
  }
}
```

---

### 2. Telegram Bot Token Issues

**Problem**: Token expired, bot blocked, or webhook conflicts

**Symptoms**:
- Bot completely silent
- No "typing" indicator
- Happens suddenly

**Check**:
```bash
openclaw status --deep
```

**Solutions**:

**A. Regenerate Bot Token**:
1. Go to @BotFather on Telegram
2. `/revoke` your bot token
3. `/token` to get new one
4. Update `openclaw.json`:
```json
"channels": {
  "telegram": {
    "botToken": "NEW_TOKEN_HERE"
  }
}
```

**B. Check Bot Status**:
```bash
curl https://api.telegram.org/botYOUR_TOKEN/getMe
```

Should return bot info. If not, token is invalid.

---

### 3. Gateway Connection Issues

**Problem**: Gateway crashes or loses connection

**Symptoms**:
- Bot stops mid-conversation
- Gateway status shows errors
- Needs restart to fix

**Check**:
```bash
openclaw logs --follow
```

**Solutions**:

**A. Restart Gateway**:
```bash
openclaw gateway restart
```

**B. Check Gateway Service**:
```bash
sudo systemctl status openclaw-gateway
```

**C. Enable Auto-Restart**:
```bash
sudo systemctl enable openclaw-gateway
```

---

### 4. Rate Limiting / API Issues

**Problem**: API rate limits or connection timeouts

**Symptoms**:
- Intermittent responses
- "Thinking..." then nothing
- Happens during heavy use

**Check**:
- API key status
- Rate limit headers

**Solutions**:

**A. Check API Key**:
```bash
# Test Kimi API
curl -H "Authorization: Bearer YOUR_KEY" \
  https://api.kimi.com/coding/v1/models
```

**B. Add Retry Logic** (in `openclaw.json`):
```json
"plugins": {
  "entries": {
    "kimi-claw": {
      "config": {
        "retry": {
          "baseMs": 2000,
          "maxMs": 30000,
          "maxAttempts": 3
        }
      }
    }
  }
}
```

---

### 5. Corrupted openclaw.json

**Problem**: Config file gets corrupted during writes

**Symptoms**:
- "Broken openclaw.json" errors
- Bot stops after config changes
- Daily issues

**Prevention**:

**A. Backup Config**:
```bash
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.backup
```

**B. Validate JSON**:
```bash
# Before any manual edits
python3 -m json.tool ~/.openclaw/openclaw.json > /dev/null && echo "Valid JSON"
```

**C. Use CLI Commands** (avoid manual edits):
```bash
# Instead of editing JSON directly:
openclaw config set channels.telegram.enabled true
openclaw config set agents.defaults.maxConcurrent 4
```

---

### 6. Memory/Resource Issues

**Problem**: System runs out of memory or disk space

**Symptoms**:
- Bot becomes slow then stops
- Happens over time
- System feels sluggish

**Check**:
```bash
# Memory
free -h

# Disk space
df -h

# OpenClaw specifically
du -sh ~/.openclaw
```

**Solutions**:

**A. Clear Old Sessions**:
```bash
rm -rf ~/.openclaw/agents/main/sessions/old_sessions
```

**B. Limit Session History**:
```json
"agents": {
  "defaults": {
    "maxHistoryMessages": 50
  }
}
```

**C. Enable Log Rotation**:
```bash
# Add to crontab
0 0 * * * find ~/.openclaw/logs -name "*.log" -mtime +7 -delete
```

---

## Recommended Configuration (Stable)

Based on your current setup, here's an optimized config:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "mode": "auto",
        "threshold": 0.75,
        "minMessages": 20
      },
      "maxConcurrent": 2,
      "subagents": {
        "maxConcurrent": 4
      },
      "maxHistoryMessages": 100
    }
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "dmPolicy": "pairing",
      "groupPolicy": "allowlist",
      "streamMode": "partial",
      "retry": {
        "maxAttempts": 3,
        "delayMs": 1000
      }
    }
  },
  "gateway": {
    "port": 18789,
    "mode": "local",
    "auth": {
      "mode": "token"
    },
    "healthCheck": {
      "enabled": true,
      "intervalMs": 30000
    }
  },
  "plugins": {
    "entries": {
      "kimi-claw": {
        "config": {
          "retry": {
            "baseMs": 2000,
            "maxMs": 30000,
            "maxAttempts": 3
          },
          "bridge": {
            "historyPendingTimeoutMs": 30000
          }
        }
      }
    }
  }
}
```

---

## Daily Maintenance Script

Create this script to prevent daily issues:

```bash
#!/bin/bash
# ~/openclaw-maintenance.sh

echo "=== OpenClaw Daily Maintenance ==="

# 1. Check gateway status
echo "Checking gateway..."
openclaw status | grep -q "running" || openclaw gateway restart

# 2. Backup config
echo "Backing up config..."
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.backup.$(date +%Y%m%d)

# 3. Clean old sessions (keep last 5)
echo "Cleaning old sessions..."
cd ~/.openclaw/agents/main/sessions
ls -t | tail -n +6 | xargs rm -rf 2>/dev/null

# 4. Check disk space
echo "Checking disk space..."
USAGE=$(df ~/.openclaw | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$USAGE" -gt 80 ]; then
  echo "WARNING: Disk usage at ${USAGE}%"
  find ~/.openclaw/logs -name "*.log" -mtime +3 -delete
fi

# 5. Validate JSON
echo "Validating config..."
python3 -m json.tool ~/.openclaw/openclaw.json > /dev/null || {
  echo "ERROR: Invalid JSON, restoring backup"
  cp ~/.openclaw/openclaw.json.backup ~/.openclaw/openclaw.json
}

echo "=== Maintenance Complete ==="
```

**Add to crontab**:
```bash
0 6 * * * /root/openclaw-maintenance.sh >> /var/log/openclaw-maintenance.log 2>&1
```

---

## Quick Diagnostics

When bot stops responding, run these in order:

```bash
# 1. Check status
openclaw status

# 2. Check logs
openclaw logs --follow

# 3. Test Telegram connection
curl -s "https://api.telegram.org/bot$(jq -r '.channels.telegram.botToken' ~/.openclaw/openclaw.json)/getMe" | jq

# 4. Test API connection
curl -s -H "Authorization: Bearer $(jq -r '.env.KIMI_API_KEY' ~/.openclaw/openclaw.json)" \
  https://api.kimi.com/coding/v1/models | jq

# 5. Restart if needed
openclaw gateway restart
```

---

## Prevention Checklist

- [ ] Enable auto-compaction
- [ ] Set up daily maintenance script
- [ ] Backup config before changes
- [ ] Use CLI commands instead of manual JSON edits
- [ ] Monitor disk space
- [ ] Set up log rotation
- [ ] Configure retry logic
- [ ] Limit concurrent agents
- [ ] Use allowlist for groups
- [ ] Enable health checks

---

## If Nothing Works

**Nuclear Option** (preserves config):
```bash
# 1. Backup everything
tar czf ~/openclaw-backup-$(date +%Y%m%d).tar.gz ~/.openclaw

# 2. Restart fresh
openclaw stop
rm -rf ~/.openclaw/agents/main/sessions/*
openclaw start

# 3. If still broken, reinstall
openclaw uninstall --keep-config
openclaw install
```

---

## Summary

**Most Likely Causes**:
1. Context limit (compaction needed)
2. Telegram token issues
3. Gateway crashes
4. Config corruption

**Quick Fix**:
```bash
openclaw gateway restart && openclaw status
```

**Long-term Fix**: Implement the maintenance script and stable configuration above.

---

**Need Help?**:
- OpenClaw Docs: https://docs.openclaw.ai
- Troubleshooting: https://docs.openclaw.ai/troubleshooting
- Telegram: @openclaw_support
