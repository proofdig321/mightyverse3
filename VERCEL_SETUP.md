# 🚀 Vercel Auto-Deployment Setup

## Why Auto-Deploy Isn't Working

The project needs to be **linked to Vercel** for automatic deployments. Here's how to fix it:

## ✅ **Manual Setup Required:**

### 1. **Link Project to Vercel**
```bash
# In your local environment (not codespace)
npx vercel login
npx vercel link
```

### 2. **GitHub Integration** 
- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Click "Add New Project"
- Import from GitHub: `prooftv/themightyverse`
- Set build settings:
  - **Framework**: Next.js
  - **Root Directory**: `web`
  - **Build Command**: `npm run build`
  - **Output Directory**: `.next`

### 3. **Environment Variables**
Add these to Vercel dashboard:
```
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=8e23288062ddbf74f623046d71f1cd62
NEXT_PUBLIC_SUPER_ADMIN_WALLET=0x860Ec697167Ba865DdE1eC9e172004100613e970
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXTAUTH_SECRET=mighty_verse_secret_2025
```

### 4. **GitHub Secrets** (for workflow)
Add to GitHub repository secrets:
```
VERCEL_TOKEN=your_vercel_token
ORG_ID=your_org_id  
PROJECT_ID=your_project_id
```

## 🔧 **Current Status:**
- ✅ Code pushed to GitHub
- ✅ Vercel.json configured
- ✅ GitHub workflow ready
- ❌ Project not linked to Vercel
- ❌ Auto-deploy not active

## 🎯 **Next Steps:**
1. **Manual Deploy**: Link project in Vercel dashboard
2. **Test Auth**: Verify authentication after deployment
3. **Monitor**: Check MCP agents are operational

Once linked, every push to `main` will auto-deploy! 🚀