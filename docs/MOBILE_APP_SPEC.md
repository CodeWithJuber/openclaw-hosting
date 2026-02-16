# OpenClaw Mobile App - Specification

## Overview
Official mobile app for OpenClaw Hosting - manage VPS instances from anywhere.

**Platforms**: iOS, Android  
**Tech Stack**: React Native (cross-platform)  
**API**: Mobile-optimized REST API

---

## Core Features

### 1. Dashboard
- Instance count and status
- Resource usage (CPU, memory, disk)
- Recent alerts
- Quick actions

### 2. Instance Management
- List all instances
- View instance details
- Start/stop/restart
- View metrics charts
- Execute commands

### 3. Notifications
- Push notifications for alerts
- Instance status changes
- Billing reminders
- Support ticket updates

### 4. Billing
- Current month usage
- Cost breakdown
- Payment method
- Invoice history

### 5. Support
- View tickets
- Create new ticket
- Chat with support
- Knowledge base

---

## Technical Architecture

### Frontend (React Native)
```
mobile-app/
├── src/
│   ├── components/     # Reusable UI components
│   ├── screens/        # App screens
│   ├── navigation/     # React Navigation
│   ├── services/       # API clients
│   ├── store/          # State management (Zustand)
│   └── utils/          # Helpers
├── android/            # Android-specific
├── ios/                # iOS-specific
└── package.json
```

### Backend (Mobile API)
Already implemented in `apps/api/src/routes/mobile.ts`:
- `/mobile/dashboard` - Summary data
- `/mobile/instances` - Instance list
- `/mobile/instances/:id` - Instance details
- `/mobile/notifications` - Push notifications
- `/mobile/billing` - Billing info
- `/mobile/support` - Support tickets

---

## Screens

### 1. Login Screen
- Email/password
- Biometric auth (Face ID/Touch ID)
- Remember me

### 2. Dashboard Screen
```
┌─────────────────────────────┐
│  OpenClaw          [bell]   │
├─────────────────────────────┤
│                             │
│  [Instances]  [Alerts]      │
│     5            1          │
│                             │
│  ┌─────────────────────┐   │
│  │ CPU Usage    45%    │   │
│  │ ████████████░░░░░░░ │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ Memory Usage 62%    │   │
│  │ ████████████████░░░ │   │
│  └─────────────────────┘   │
│                             │
│  [Quick Actions]            │
│  [+ New] [Backup] [Restart] │
│                             │
└─────────────────────────────┘
```

### 3. Instances Screen
- List view with status indicators
- Search/filter
- Swipe actions (restart, stop)

### 4. Instance Detail Screen
```
┌─────────────────────────────┐
│  <  Production API          │
├─────────────────────────────┤
│                             │
│  Status: 🟢 Active          │
│  IP: 192.168.1.100          │
│  Region: US East            │
│  Plan: Professional         │
│                             │
│  [Metrics Chart]            │
│                             │
│  CPU: 45%  RAM: 62%         │
│  Disk: 38%  Net: 120Mbps    │
│                             │
│  [Actions]                  │
│  [Restart] [Stop] [Backup]  │
│                             │
└─────────────────────────────┘
```

### 5. Notifications Screen
- List of alerts
- Mark as read
- Filter by type

---

## Push Notifications

### Types
1. **Instance Alerts**
   - High CPU/Memory
   - Instance down
   - Security warnings

2. **Billing**
   - Invoice due
   - Payment failed
   - Usage threshold

3. **System**
   - Maintenance scheduled
   - New features
   - Security updates

### Implementation
```typescript
// Register device for push
await mobileApi.post('/push-token', {
  token: deviceToken,
  platform: 'ios', // or 'android'
  deviceId: uniqueId
});
```

---

## WhatsApp Integration

### Features
1. **Alerts to WhatsApp**
   ```
   🚨 High CPU Alert
   
   Instance: Production API
   CPU: 85% (threshold: 80%)
   Time: 2026-02-16 14:30
   
   [Restart] [Scale Up] [Ignore]
   ```

2. **Weekly Reports**
   ```
   📊 Weekly OpenClaw Report
   
   Instances: 5 active
   API Calls: 125,000
   Cost: $127.50
   
   View dashboard: https://...
   ```

3. **Quick Actions via WhatsApp**
   - Reply "RESTART vps-123"
   - Reply "STATUS"
   - Reply "HELP"

### Setup
```typescript
const whatsapp = new WhatsAppIntegration({
  phoneNumberId: process.env.WHATSAPP_PHONE_ID,
  accessToken: process.env.WHATSAPP_TOKEN,
  webhookSecret: process.env.WHATSAPP_SECRET
});

// Send alert
await whatsapp.sendVPSAlert(userPhone, {
  severity: 'critical',
  title: 'Instance Down',
  message: 'vps-123 is not responding',
  instanceId: 'vps-123'
});
```

---

## Security

### Mobile App
- Biometric authentication
- Secure token storage (Keychain/Keystore)
- Certificate pinning
- Auto-lock after inactivity

### API
- JWT authentication
- Rate limiting
- Device fingerprinting
- Session management

---

## Development Timeline

### Phase 1: MVP (4 weeks)
- [ ] Login/auth
- [ ] Dashboard
- [ ] Instance list
- [ ] Basic actions

### Phase 2: Core Features (4 weeks)
- [ ] Instance details
- [ ] Metrics/charts
- [ ] Notifications
- [ ] Billing

### Phase 3: Polish (2 weeks)
- [ ] Push notifications
- [ ] Offline mode
- [ ] Performance optimization
- [ ] App store submission

**Total**: 10 weeks to launch

---

## Monetization

### Free Tier
- View instances
- Basic metrics
- Email notifications

### Pro Tier ($5/month)
- Push notifications
- Advanced metrics
- WhatsApp integration
- Priority support

### Included with Hosting
- All Pro features free
- White-label option

---

## Competitive Advantage

### vs Competitors
| Feature | DigitalOcean | Linode | AWS | OpenClaw |
|---------|-------------|--------|-----|----------|
| Mobile App | ❌ | ❌ | ⚠️ Complex | ✅ Native |
| WhatsApp | ❌ | ❌ | ❌ | ✅ Yes |
| Push Notifications | ⚠️ Email only | ⚠️ Email only | ⚠️ Complex | ✅ Native |
| Quick Actions | ❌ | ❌ | ❌ | ✅ One-tap |

---

## Success Metrics

- **Downloads**: 1,000 in first month
- **DAU**: 300+ daily active users
- **Rating**: 4.5+ stars
- **Retention**: 60% after 30 days

---

## Next Steps

1. **Design**: Create Figma mockups
2. **Setup**: Initialize React Native project
3. **API**: Finalize mobile API endpoints
4. **Develop**: Build MVP features
5. **Test**: Beta testing with customers
6. **Launch**: App Store + Play Store

---

**Status**: Specification complete, ready for development
