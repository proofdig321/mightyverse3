# 🎯 DASHBOARD ACCESS GUIDE

## 🚀 Quick Start

### 1. Start Development Server
```bash
cd /workspaces/themightyverse/web
npm run dev
```

### 2. Access URLs
- **Homepage**: `https://your-codespace-url.github.dev/`
- **Admin Dashboard**: `https://your-codespace-url.github.dev/admin`
- **Animator Portal**: `https://your-codespace-url.github.dev/animator`
- **Asset Hub**: `https://your-codespace-url.github.dev/hub`
- **Deck Viewer**: `https://your-codespace-url.github.dev/deck/sample`

## 🔧 Codespaces Configuration

### Port Forwarding
1. Open **Ports** tab in Codespaces
2. Forward port **3000** 
3. Set visibility to **Public**
4. Access via the forwarded URL

### Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Edit with your values
code .env.local
```

## 🎨 Dashboard Features

### Admin Dashboard (`/admin`)
- **Asset Review**: `/admin/assets`
- **Campaign Management**: `/admin/campaigns` 
- **Mint Queue**: `/admin/mint-queue`
- **RBAC Management**: `/admin/rbac`

### Animator Portal (`/animator`)
- **Upload Assets**: `/animator/upload`
- **View Submissions**: `/animator/submissions`

### Asset Hub (`/hub`)
- **2.5D Media Player**
- **Holographic Visualizer**
- **Asset Management**

## 🔐 Required Environment Variables

### Essential (Copy to .env.local)
```env
NEXT_PUBLIC_APP_NAME="The Mighty Verse"
NEXT_PUBLIC_APP_URL="https://your-codespace-url.github.dev"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-codespace-url.github.dev"
```

### Optional (For Full Features)
```env
PINATA_API_KEY="your_pinata_key"
PINATA_SECRET_KEY="your_pinata_secret"
NEXT_PUBLIC_RPC_URL="your_rpc_endpoint"
```

## 🚨 Troubleshooting

### 404 Errors
1. Ensure server is running on port 3000
2. Check port forwarding is public
3. Verify URL includes correct codespace domain

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
npm run dev
```

### RBAC Access
- Admin features require wallet connection
- Use any wallet address for development
- RBAC provider handles role assignment

## 🎯 Git Workflow

### Commit Changes
```bash
git add .
git commit -m "feat: dashboard access configuration"
git push origin main
```

### Deploy to Production
```bash
npm run build
npm run start
```

---

**🚀 Ready to explore The Mighty Verse holographic dashboards!**