#!/usr/bin/env bash
set -euo pipefail
BRANCH="${1:-feature/enterprise-stream-campaigns}"
BASE="${2:-main}"
COMMIT_MSG="${3:-chore: add enterprise stream campaigns scaffolds (pinning, livepeer, agent-sdk, deck player)}"

echo "Creating branch ${BRANCH} from $(git rev-parse --abbrev-ref HEAD)..."
git checkout -b "${BRANCH}"

echo "Adding files..."
git add foundation/ services/ web/components/ db/migrations scripts || true

git commit -m "${COMMIT_MSG}" || true
git push --set-upstream origin "${BRANCH}"

echo "Creating draft PR..."
gh pr create --draft --title "Enterprise: Stream Campaigns + Deck Player" \
  --body "Adds PinningService, LivepeerOrchestrator, AgentSDK, CampaignOrchestrator skeleton, DB migrations, DeckPlayer and tests. All production-critical actions still require human approval per AGENTS.md." \
  --base "${BASE}"

echo "Done. Draft PR created for branch ${BRANCH}."
#!/bin/bash

# Enterprise Stream Campaigns - Branch Creation and PR Script
# Creates feature branch, commits scaffolds, and opens draft PR

set -e

BRANCH_NAME="feature/enterprise-stream-campaigns"
PR_TITLE="Enterprise: Stream Campaigns + Deck Player"
PR_BODY="Draft PR — requires human approvals per AGENTS.md

## Summary
Adds enterprise-grade campaign → stream integration with:
- PinningService (multi-provider IPFS)
- Livepeer orchestrator for streaming
- Agent SDK with idempotency
- Campaign orchestrator
- DeckPlayer (2.5D holographic)
- Database migrations
- Test scaffolds

## Human Approval Checklist
- [ ] Secrets stored in AWS Secrets Manager
- [ ] Livepeer keys rotated
- [ ] DB migration reviewed and backed up
- [ ] Feature flags added
- [ ] Admin approval flow present
- [ ] E2E simulation passed
- [ ] Security scan completed

## Files Added
- foundation/pinning/index.ts
- foundation/livepeer/orchestrator.ts
- foundation/agent-sdk/index.ts
- services/campaigns/orchestrator.ts
- web/components/DeckPlayer/DeckPlayer.tsx
- db/migrations/20251106_add_campaigns.sql
- scripts/find_agent_duplicates.sh

Per AGENTS.md: Human approval required for production deployment."

echo "🚀 Creating enterprise stream campaigns branch and PR..."

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) not found. Please install it first."
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI not authenticated. Run 'gh auth login' first."
    exit 1
fi

# Check if we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository."
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes. Committing them first..."
    git add .
    git commit -m "WIP: Save current changes before creating enterprise branch"
fi

# Create and switch to feature branch
echo "🌿 Creating branch: $BRANCH_NAME"
if git show-ref --verify --quiet refs/heads/$BRANCH_NAME; then
    echo "⚠️  Branch $BRANCH_NAME already exists. Switching to it..."
    git checkout $BRANCH_NAME
else
    git checkout -b $BRANCH_NAME
fi

# Add all scaffold files
echo "📁 Adding scaffold files..."
git add foundation/ services/ web/components/DeckPlayer/ scripts/ IMPLEMENTATION_PLAN.md

# Check if there are files to commit
if git diff --cached --quiet; then
    echo "⚠️  No new files to commit. Branch is up to date."
else
    # Commit the scaffolds
    echo "💾 Committing enterprise stream campaigns scaffolds..."
    git commit -m "chore: add enterprise stream campaigns scaffolds

- PinningService with multi-provider support (Pinata/Infura/self-hosted)
- Livepeer orchestrator for stream management
- Agent SDK with idempotency and tracing
- Campaign orchestrator for placement execution
- DeckPlayer component with 2.5D holographic effects
- Implementation plan and scripts

Per AGENTS.md: Human approval required for production deployment."
fi

# Push the branch
echo "⬆️  Pushing branch to origin..."
git push --set-upstream origin $BRANCH_NAME

# Create draft PR
echo "📝 Creating draft PR..."
gh pr create \
    --draft \
    --title "$PR_TITLE" \
    --body "$PR_BODY" \
    --base main \
    --head $BRANCH_NAME

echo "✅ Enterprise stream campaigns branch and PR created successfully!"
echo ""
echo "🔗 Next steps:"
echo "1. Review the PR in GitHub"
echo "2. Run tests: npm ci && npx jest --runInBand"
echo "3. Run duplication scan: bash scripts/find_agent_duplicates.sh . ./agent-dup-report.txt"
echo "4. Complete human approval checklist"
echo "5. Merge after all approvals"
echo ""
echo "📋 PR URL: $(gh pr view --json url --jq .url)"