#!/bin/bash

# 📊 MIGHTY VERSE PROGRESS CHECK
# Automated status checker for mission progress

echo "🎯 MIGHTY VERSE PROGRESS CHECK"
echo "================================"
echo "Timestamp: $(date)"
echo ""

# Check repository status
echo "📁 Repository Status:"
echo "- Branch: $(git branch --show-current)"
echo "- Last commit: $(git log -1 --pretty=format:'%h - %s (%cr)')"
echo "- Uncommitted changes: $(git status --porcelain | wc -l) files"
echo ""

# Check build status
echo "🔨 Build Status:"
if [ -f "package.json" ]; then
    echo "- Node modules: $([ -d node_modules ] && echo "✅ Installed" || echo "❌ Missing")"
    echo "- Build status: $(npm run build --silent 2>/dev/null && echo "✅ Passing" || echo "❌ Failing")"
else
    echo "- No package.json found"
fi
echo ""

# Check test status
echo "🧪 Test Status:"
if [ -d "agents-stubs/tests" ]; then
    cd agents-stubs
    echo "- Python tests: $(python -m pytest tests/ -q --tb=no 2>/dev/null && echo "✅ Passing" || echo "❌ Failing")"
    cd ..
else
    echo "- No test directory found"
fi
echo ""

# Check service status
echo "🚀 Service Status:"
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "- FastAPI service: ✅ Running (port 8000)"
else
    echo "- FastAPI service: ❌ Not running"
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "- Next.js frontend: ✅ Running (port 3000)"
else
    echo "- Next.js frontend: ❌ Not running"
fi
echo ""

# Check mission status
echo "🎯 Mission Status:"
if [ -f "docs/MISSION_STATUS.md" ]; then
    completed=$(grep -c "- \[x\]" docs/MISSION_STATUS.md)
    total=$(grep -c "- \[" docs/MISSION_STATUS.md)
    echo "- Missions completed: $completed/$total"
    
    # Show active missions
    echo "- Active missions:"
    grep "- \[ \]" docs/MISSION_STATUS.md | head -3 | sed 's/^/  /'
else
    echo "- Mission status file not found"
fi
echo ""

# Check dependencies
echo "🔗 Dependencies:"
echo "- IPFS utils: $([ -f "agents-stubs/utils/pinning.py" ] && echo "✅ Available" || echo "❌ Missing")"
echo "- Thirdweb config: $([ -f "web/package.json" ] && grep -q "thirdweb" web/package.json && echo "✅ Configured" || echo "❌ Missing")"
echo "- Environment vars: $([ -f ".env.local" ] && echo "✅ Present" || echo "❌ Missing")"
echo ""

# Check for blockers
echo "🚨 Potential Blockers:"
blockers=0

if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "- FastAPI service not running"
    blockers=$((blockers + 1))
fi

if [ ! -f ".env.local" ]; then
    echo "- Environment configuration missing"
    blockers=$((blockers + 1))
fi

if [ ! -d "node_modules" ] && [ -f "package.json" ]; then
    echo "- Node dependencies not installed"
    blockers=$((blockers + 1))
fi

if [ $blockers -eq 0 ]; then
    echo "- No blockers detected ✅"
fi

echo ""
echo "================================"
echo "Status check complete. Review any ❌ items above."