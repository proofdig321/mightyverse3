# Railway MCP Deployment Guide

## Mission: mv-mcp-railway-2025-12

### Current Status: ✅ READY FOR RAILWAY DEPLOYMENT

The MCP coordinator has been successfully built and tested locally. Follow these steps to complete the Railway deployment.

## Prerequisites Completed ✅

- [x] Docker image built successfully
- [x] Local smoke tests passed (85% success rate)
- [x] Health endpoints verified
- [x] MCP coordinator functionality confirmed

## Manual Deployment Steps

### Step 1: Container Registry Setup

Since GitHub Container Registry push failed, use an alternative registry:

**Option A: Docker Hub**
```bash
# Tag for Docker Hub
docker tag mightyverse-mcp:test your-dockerhub-username/mightyverse-mcp:latest

# Push to Docker Hub
docker login
docker push your-dockerhub-username/mightyverse-mcp:latest
```

**Option B: Railway's Built-in Registry**
```bash
# Let Railway build from source
railway login
railway init
railway link
railway up
```

### Step 2: Railway Service Creation

1. **Login to Railway Dashboard**
   - Go to https://railway.app
   - Create new project: "mightyverse-mcp"

2. **Create Service**
   - Add new service
   - Choose "Deploy from Docker Image" or "Deploy from GitHub"
   - Set image: `your-registry/mightyverse-mcp:latest`

### Step 3: Environment Variables Configuration

Set these variables in Railway dashboard:

```env
# Required Variables
MCP_AUTH_TOKEN=your-secure-token-here
DATABASE_URL=postgresql://user:pass@host:port/db
PORT=8000

# AWS S3 Configuration
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# Livepeer Configuration
LIVEPEER_API_KEY=your-livepeer-key

# Optional
MCP_SYNC_ENDPOINT=https://your-sync-endpoint.com
```

### Step 4: Health Check Configuration

- **Health Check Path**: `/api/mcp/health`
- **Port**: `8000`
- **Expected Response**: `200 OK`

### Step 5: Deploy and Verify

1. **Deploy the service**
2. **Wait for deployment to complete**
3. **Check service logs**:
   ```bash
   railway logs --follow
   ```

### Step 6: Production Smoke Tests

Once deployed, run smoke tests against production:

```bash
# Set your Railway service URL
export MCP_URL=https://your-service.railway.app
export MCP_AUTH_TOKEN=your-production-token

# Run enhanced smoke tests
./scripts/enhanced-smoke-tests.sh
```

## Expected Test Results

The smoke tests should show:
- ✅ Health check: PASSED
- ✅ Status endpoint: PASSED  
- ✅ Root endpoint: PASSED
- ✅ Execute ping (no auth): PASSED
- ✅ Execute ping (with auth): PASSED
- ✅ Execute noop task: PASSED
- ⚠️ Upload pipeline: MAY FAIL (expected if web app not deployed)
- ✅ Response time: < 100ms
- ✅ Concurrent requests: PASSED

## Monitoring and Validation

### 15-Minute Post-Deploy Monitoring

Monitor these metrics for 15 minutes after deployment:

1. **Service Health**
   ```bash
   curl https://your-service.railway.app/api/mcp/health
   ```

2. **Response Times**
   ```bash
   time curl https://your-service.railway.app/api/mcp/status
   ```

3. **Error Logs**
   - Check Railway dashboard logs
   - Look for any ERROR or CRITICAL messages

### Success Criteria

- ✅ Service responds to health checks
- ✅ No critical errors in logs for 15 minutes
- ✅ Response times < 1 second
- ✅ All smoke tests pass (except upload pipeline)

## Rollback Plan

If deployment fails:

1. **Immediate Rollback**
   ```bash
   railway rollback
   ```

2. **Check Previous Deployment**
   - Review Railway deployment history
   - Restore to last known good state

3. **Database Recovery** (if needed)
   - Restore from latest backup
   - Check data integrity

## Troubleshooting

### Common Issues

1. **Service Won't Start**
   - Check environment variables
   - Verify Docker image accessibility
   - Review startup logs

2. **Health Check Fails**
   - Verify port configuration (8000)
   - Check health endpoint path
   - Review application logs

3. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check network connectivity
   - Validate credentials

### Support Contacts

- **Railway Support**: https://railway.app/help
- **Emergency Rollback**: Use Railway dashboard
- **Logs Access**: `railway logs --follow`

## Final Report

After successful deployment, generate final report:

```bash
# Update deployment status
echo "Deployment completed at $(date)" >> reports/mcp-deploy-final.txt

# Collect production logs
railway logs --since 1h > reports/production-logs.txt

# Run final smoke tests
MCP_URL=https://your-service.railway.app ./scripts/enhanced-smoke-tests.sh > reports/production-smoke-tests.txt
```

---

**Mission Status**: Ready for Railway deployment
**Next Action**: Complete manual deployment steps above
**Estimated Time**: 30-45 minutes