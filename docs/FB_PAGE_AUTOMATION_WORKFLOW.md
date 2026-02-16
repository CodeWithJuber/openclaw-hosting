# OpenClaw FB Page AI System - Automation Workflow

**Source**: LaunchMyOpenClaw.com  
**Use Case**: Automated Facebook posting with AI-generated images

---

## System Architecture

### Tech Stack
| Component | Service | Purpose |
|-----------|---------|---------|
| **Brain** | MiniMax 2.5 | Content generation, prompts |
| **Images** | FLUX.2 Pro | AI image generation |
| **API Routing** | OpenRouter | Model access |
| **Agent** | OpenClaw | Orchestration |
| **Auth** | Maton (OAuth) | Google Drive authentication |
| **CRM/Posting** | GoHighLevel | Facebook posting |

---

## How It Works

### Workflow Diagram
```
MiniMax 2.5 → FLUX.2 Pro → OpenRouter → OpenClaw
     ↓              ↓            ↓           ↓
   Brain         Images        API        Agent
                              Routing

     ↓              ↓
   Maton        GoHighLevel
   (OAuth)       (Post to FB)
```

### The Process (4 Steps)

#### Step 1: Generate Image
- **Tool**: MiniMax 2.5
- **Action**: Creates prompts for FLUX.2 Pro
- **Output**: AI-generated image

#### Step 2: Save to Drive
- **Tool**: Maton (Google OAuth)
- **Action**: Upload image to Google Drive
- **Purpose**: Temporary storage with public access

#### Step 3: Make Public
- **Tool**: Maton API
- **Action**: Set Drive file permissions to public
- **Why**: GoHighLevel needs public URL to post

#### Step 4: Post to FB
- **Tool**: OpenClaw + GoHighLevel
- **Action**: Call GHL API with correct format
- **Result**: Published to Facebook Page

---

## The Problem & Solution

### Problem
**GoHighLevel API kept rejecting image posts**
```
Error: "Invalid media format type"
```

### Root Cause
- Image format not properly specified
- Drive files not publicly accessible
- MIME type missing

### Solution
```json
{
  "type": "image/jpeg"
}
```

**Key fixes:**
1. ✅ Use correct MIME type
2. ✅ Make Drive files public
3. ✅ Pass correct format to GHL API

---

## Skills Required

### 1. API Gateway Skill
```typescript
// Google OAuth for Drive access
const googleAuth = await apiGateway.authenticate('google', {
  scopes: ['drive.file', 'drive.readonly']
});
```

### 2. HighLevel Skill
```typescript
// Connect to GoHighLevel CRM
const ghl = new HighLevelSkill({
  apiKey: process.env.GHL_API_KEY
});

// Post to Facebook
await ghl.postToFacebook({
  pageId: 'page-id',
  message: content,
  imageUrl: publicDriveUrl,
  mimeType: 'image/jpeg'
});
```

### 3. OpenRouter Skill
```typescript
// Access MiniMax 2.5
const minimax = await openrouter.chat({
  model: 'minimax/minimax-2.5',
  messages: [{ role: 'user', content: prompt }]
});

// Access FLUX for images
const flux = await openrouter.image({
  model: 'black-forest-labs/flux-2-pro',
  prompt: imagePrompt
});
```

### 4. Google Drive OAuth
```typescript
// Store AI-generated images
const drive = new GoogleDriveSkill();
const file = await drive.upload({
  name: 'ai-generated-post.jpg',
  content: imageBuffer,
  mimeType: 'image/jpeg'
});

// Make public
await drive.makePublic(file.id);
const publicUrl = drive.getPublicUrl(file.id);
```

---

## Implementation for OpenClaw Hosting

### Automation Workflow
```typescript
class FBPageAutomation {
  async createPost(topic: string) {
    // 1. Generate content with MiniMax
    const content = await this.generateContent(topic);
    
    // 2. Generate image with FLUX
    const imagePrompt = await this.createImagePrompt(content);
    const image = await this.generateImage(imagePrompt);
    
    // 3. Upload to Google Drive
    const driveFile = await this.uploadToDrive(image);
    await this.makePublic(driveFile);
    
    // 4. Post to Facebook via GoHighLevel
    await this.postToFacebook(content, driveFile.publicUrl);
    
    return { success: true, postId: '...' };
  }
}
```

### Cron Schedule
```typescript
// Daily journaling post
cron.schedule('0 9 * * *', async () => {
  await fbAutomation.createPost('daily journal');
});

// AI Reels (future)
cron.schedule('0 12 * * 1,3,5', async () => {
  await fbAutomation.createReel('trending topic');
});
```

---

## What Was Built

✅ **AI-generated posts** - Content created by MiniMax 2.5  
✅ **Auto-posting to FB** - Fully automated via GoHighLevel  
✅ **Custom images** - FLUX.2 Pro generates unique visuals  
✅ **Fully automated** - No manual intervention needed  

---

## Use Cases for OpenClaw Hosting Customers

### 1. Social Media Automation
- Auto-post to Facebook, Instagram, Twitter
- AI-generated content + images
- Scheduled campaigns

### 2. Content Marketing
- Blog post automation
- Email newsletter generation
- SEO-optimized content

### 3. E-commerce
- Product description generation
- Automated social proof posts
- Review response automation

### 4. Personal Branding
- Daily journaling (as shown)
- Thought leadership posts
- Automated engagement

---

## Integration with OpenClaw Hosting

### Customer Workflow
```
1. Customer orders VPS
2. We provision OpenClaw instance
3. Customer configures automation:
   - Connect GoHighLevel
   - Set up OpenRouter
   - Configure Google Drive
4. Automation runs 24/7 on VPS
```

### Revenue Opportunity
- **Base VPS**: $10-50/month
- **Automation add-on**: +$20/month
- **Custom workflows**: +$50 setup

---

## Technical Notes

### MIME Types Reference
| Format | MIME Type |
|--------|-----------|
| JPEG | `image/jpeg` |
| PNG | `image/png` |
| GIF | `image/gif` |
| WebP | `image/webp` |

### GoHighLevel API Format
```json
{
  "message": "Post text content",
  "media": [
    {
      "url": "https://drive.google.com/uc?id=FILE_ID",
      "type": "image/jpeg"
    }
  ]
}
```

---

## Conclusion

This workflow demonstrates:
- ✅ Multi-skill orchestration
- ✅ OAuth integration (Google)
- ✅ AI content generation
- ✅ Social media automation
- ✅ Problem-solving (MIME type fix)

**Perfect use case for OpenClaw Hosting customers!**

---

**Source**: LaunchMyOpenClaw.com  
**Website**: https://launchmyopenclaw.com
