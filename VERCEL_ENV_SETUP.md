# 🚀 Vercel Environment Variables Setup

## Critical Environment Variables for Vercel

### **1. Application URLs**
```bash
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
NEXTAUTH_URL=https://your-vercel-app.vercel.app
```

### **2. Supabase Configuration**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://hwrnvussmnugmzpoqqsj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3cm52dXNzbW51Z216cG9xcXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNzM0ODAsImV4cCI6MjA3Nzk0OTQ4MH0._74OU8Mx2DxfSDuZdXKpYaRuLNJDfT6T9W8KwoOIB_Y
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3cm52dXNzbW51Z216cG9xcXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNzM0ODAsImV4cCI6MjA3Nzk0OTQ4MH0._74OU8Mx2DxfSDuZdXKpYaRuLNJDfT6T9W8KwoOIB_Y
```

### **3. Livepeer Integration**
```bash
LIVEPEER_API_KEY=bd7cb521-56cc-4aae-8a38-261475652d19
```

### **4. IPFS/Pinata**
```bash
PINATA_API_KEY=45638b28ab2c12ba4863
PINATA_SECRET_KEY=cdc5e218c14f09514075f9df97c37808c5e6ab2c453568f6c63c8c3934c6fc6f
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI3MzcyYWI4Zi05OGRmLTQxNmMtYWVkNy0yZDg1ZDY5MGI3OTciLCJlbWFpbCI6ImJoZWtpdGhlbWJhc2ltZWxhbmUzMjFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjQ1NjM4YjI4YWIyYzEyYmE0ODYzIiwic2NvcGVkS2V5U2VjcmV0IjoiY2RjNWUyMThjMTRmMDk1MTQwNzVmOWRmOTdjMzc4MDhjNWU2YWIyYzQ1MzU2OGY2YzYzYzhjMzkzNGM2ZmM2ZiIsImV4cCI6MTc5Mzc2OTM0MH0.SJQMhk39BLfQuvsRbxq-J721Jz8M6HDJ_IUmCU7zdZs
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

### **5. Authentication & Security**
```bash
NEXTAUTH_SECRET=your_nextauth_secret_key
JWT_SECRET=your_jwt_secret_key_change_in_production
APP_API_KEY=your_app_api_key
```

### **6. Admin Configuration**
```bash
SUPER_ADMIN_WALLET=0x860Ec697167Ba865DdE1eC9e172004100613e970
ADMIN_ADDRESSES=0x860Ec697167Ba865DdE1eC9e172004100613e970
NEXT_PUBLIC_SUPER_ADMIN_WALLET=0x860Ec697167Ba865DdE1eC9e172004100613e970
```

### **7. ThirdWeb**
```bash
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=8e23288062ddbf74f623046d71f1cd62
THIRDWEB_SECRET_KEY=47AkxAHTml96vgULpgP4LCaRxyGWYrt-7lU3Bj-AO8iLsK7kUwWpm7_nEQqSt-ANEIDVVehx8RALI2nT8eT6RQ
```

## 🚀 Quick Setup Commands

### Via Vercel CLI:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add LIVEPEER_API_KEY
vercel env add PINATA_API_KEY
vercel env add PINATA_SECRET_KEY
vercel env add PINATA_JWT
```

### Via Vercel Dashboard:
1. Go to your project settings
2. Environment Variables tab
3. Add each variable above
4. Redeploy

## 🔧 Priority Order:
1. **NEXT_PUBLIC_SUPABASE_URL** - Fixes localStorage fallback
2. **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Enables database
3. **LIVEPEER_API_KEY** - Fixes import functionality
4. **PINATA_JWT** - Enables IPFS uploads