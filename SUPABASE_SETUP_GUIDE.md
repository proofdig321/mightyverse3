# 🗄️ **Supabase Database Setup Guide**

## ✅ **Credentials Configured**
Your environment variables are now set:
- **URL**: `https://hwrnvussmnugmzpoqqsj.supabase.co`
- **API Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` ✅
- **Livepeer**: `bd7cb521-56cc-4aae-8a38-261475652d19` ✅

## 🚀 **Manual Database Setup (Recommended)**

### **Step 1: Access Supabase Dashboard**
1. Go to: **https://hwrnvussmnugmzpoqqsj.supabase.co**
2. Login with your Supabase account
3. Navigate to **SQL Editor** (left sidebar)

### **Step 2: Execute Database Schema**
1. Click **"New Query"**
2. Copy the entire contents of: `/workspaces/mightyverse3/db/migrations/20251206_comprehensive_schema.sql`
3. Paste into the SQL editor
4. Click **"Run"** button

### **Step 3: Verify Tables Created**
After execution, check that these tables exist:
- ✅ `assets`
- ✅ `murals` 
- ✅ `cards`
- ✅ `decks`
- ✅ `deck_assets`
- ✅ `content_analysis`
- ✅ `processing_jobs`
- ✅ `workflow_states`

### **Step 4: Test Connection**
```bash
# Start the development server
npm run dev

# Visit http://localhost:3000/admin
# Should show "Enhanced data store: active" instead of "localStorage fallback"
```

## 🔧 **Alternative: Quick Schema Copy**

Here's the essential schema for copy-paste:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Assets table (main content)
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    creator_wallet VARCHAR(42) NOT NULL,
    asset_type VARCHAR(50) NOT NULL DEFAULT 'media',
    file_cid VARCHAR(100),
    status VARCHAR(20) DEFAULT 'draft',
    quality_score FLOAT DEFAULT 0.0,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processing jobs table
CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL,
    content_id UUID,
    content_type VARCHAR(20),
    status VARCHAR(20) DEFAULT 'queued',
    progress INTEGER DEFAULT 0,
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content analysis table
CREATE TABLE IF NOT EXISTS content_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type VARCHAR(20) NOT NULL,
    quality_score FLOAT NOT NULL DEFAULT 0.0,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_creator ON assets(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
```

## ✅ **Verification Steps**

1. **Check Admin Dashboard**: Visit `/admin` - should show real database connection
2. **Test Asset Creation**: Try creating an asset - should persist after refresh
3. **Check Console**: No "localStorage fallback" warnings

## 🎯 **Next Steps After Setup**

1. **Test Demo Pages**: Visit `/campaigns/demo` and `/campaigns/dashboard`
2. **Verify Persistence**: Create campaigns/assets and refresh - should persist
3. **Check Real-time Updates**: Multiple browser tabs should sync data
4. **Test Content Curation**: Use the admin content curation panel

## 🔒 **Security Notes**

- Database credentials are already configured in `.env.local`
- File is in `.gitignore` (won't be committed)
- Use Row Level Security (RLS) for production deployment

## 💡 **Troubleshooting**

**If tables don't appear:**
- Check SQL execution for errors
- Verify you're in the correct Supabase project
- Try executing schema in smaller chunks

**If connection fails:**
- Verify URL and API key in `.env.local`
- Check Supabase project is active
- Restart development server: `npm run dev`

Once database is set up, the system will automatically switch from localStorage to real Supabase persistence!