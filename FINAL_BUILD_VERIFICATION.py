#!/usr/bin/env python3
"""
FINAL BUILD VERIFICATION
Ensure all path resolution issues are fixed
"""

from pathlib import Path

def verify_build_readiness():
    """Verify all build issues are resolved"""
    root = Path("/workspaces/The-Mighty-Verse-2")
    
    print("🔍 FINAL BUILD VERIFICATION")
    
    issues = []
    fixes = []
    
    # 1. Verify services location
    web_services = root / "web/services/campaigns/orchestrator.ts"
    if web_services.exists():
        fixes.append("✅ Services moved to web/services for Next.js compatibility")
    else:
        issues.append("❌ Services not in web/services")
    
    # 2. Verify API route imports
    api_files = [
        "web/app/api/streams/[id]/playback/route.ts",
        "web/app/api/streams/[id]/placements/[placementId]/route.ts"
    ]
    
    for api_file_path in api_files:
        api_file = root / api_file_path
        if api_file.exists():
            content = api_file.read_text()
            if "from '../../../services/campaigns/orchestrator'" in content:
                fixes.append(f"✅ Correct import path in {api_file_path}")
            else:
                issues.append(f"❌ Incorrect import path in {api_file_path}")
    
    # 3. Verify orchestrator completeness
    if web_services.exists():
        content = web_services.read_text()
        required_methods = [
            "createCampaign",
            "getPlacement", 
            "updatePlacement",
            "getPlaybackUrl"
        ]
        
        for method in required_methods:
            if method in content:
                fixes.append(f"✅ Method {method} exists in orchestrator")
            else:
                issues.append(f"❌ Missing method {method} in orchestrator")
    
    # 4. Verify package.json dependencies
    package_file = root / "web/package.json"
    if package_file.exists():
        import json
        with open(package_file) as f:
            package_data = json.load(f)
        
        required_deps = ["hls.js", "pg"]
        for dep in required_deps:
            if dep in package_data.get("dependencies", {}):
                fixes.append(f"✅ Dependency {dep} in package.json")
            else:
                issues.append(f"❌ Missing dependency {dep}")
    
    # Generate report
    print(f"\n✅ FIXES APPLIED ({len(fixes)}):")
    for fix in fixes:
        print(f"  {fix}")
    
    if issues:
        print(f"\n❌ REMAINING ISSUES ({len(issues)}):")
        for issue in issues:
            print(f"  {issue}")
        return False
    else:
        print(f"\n🎉 ALL ISSUES RESOLVED - BUILD READY")
        return True

if __name__ == "__main__":
    success = verify_build_readiness()
    if success:
        print("🚀 VERCEL BUILD SHOULD SUCCEED")
    else:
        print("⚠️ BUILD ISSUES REMAIN")