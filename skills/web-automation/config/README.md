# Web Automation Skill Configuration

## Environment Variables

The following environment variables can be used to configure the skill:

### Browser Settings
- `WEB_AUTO_BROWSER` - Browser type: `chromium`, `firefox`, or `webkit`
- `WEB_AUTO_HEADLESS` - Run in headless mode: `true` or `false`
- `WEB_AUTO_TIMEOUT` - Default timeout in milliseconds

### Proxy Settings
- `WEB_AUTO_PROXY_SERVER` - Proxy server URL
- `WEB_AUTO_PROXY_USERNAME` - Proxy username
- `WEB_AUTO_PROXY_PASSWORD` - Proxy password

### CAPTCHA Services
- `CAPMONSTER_API_KEY` - CapMonster Cloud API key
- `TWOCAPTCHA_API_KEY` - 2Captcha API key
- `ANTICAPTCHA_API_KEY` - Anti-Captcha API key

### Security
- `WEB_AUTO_STEALTH` - Enable stealth mode: `true` or `false`
- `WEB_AUTO_RESPECT_ROBOTS` - Respect robots.txt: `true` or `false`

### Logging
- `WEB_AUTO_LOG_LEVEL` - Log level: `debug`, `info`, `warn`, `error`
- `WEB_AUTO_DEBUG` - Enable debug mode: `true` or `false`

## Proxy Configuration File

Create `config/proxies.json` for proxy pool:

```json
{
  "proxies": [
    {
      "server": "http://proxy1.example.com:8080",
      "username": "user1",
      "password": "pass1"
    },
    {
      "server": "http://proxy2.example.com:8080",
      "username": "user2",
      "password": "pass2"
    }
  ],
  "rotation": {
    "strategy": "round-robin",
    "interval": 5
  }
}
```

## Custom Configuration

You can load custom configuration files:

```javascript
const config = require('./config/production.json');
const scraper = new WebAutomation(config);
```
