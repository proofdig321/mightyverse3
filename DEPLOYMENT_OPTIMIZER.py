#!/usr/bin/env python3
"""
DEPLOYMENT OPTIMIZER
Fix deprecated packages and optimize build speed
"""

import json
from pathlib import Path

def optimize_deployment():
    """Optimize deployment by fixing deprecated packages"""
    root = Path("/workspaces/The-Mighty-Verse-2")
    package_path = root / "web/package.json"
    
    print("⚡ OPTIMIZING DEPLOYMENT")
    
    with open(package_path, 'r') as f:
        package_data = json.load(f)
    
    # Remove/update deprecated packages
    deprecated_fixes = {
        # Update deprecated packages
        "@paulmillr/qr": "qr",
        "rimraf": "^5.0.5",
        "@humanwhocodes/object-schema": "@eslint/object-schema",
        "@humanwhocodes/config-array": "@eslint/config-array"
    }
    
    # Remove problematic packages that cause warnings
    packages_to_remove = [
        "@hey-api/client-fetch",
        "cids", 
        "multibase",
        "multicodec",
        "@motionone/vue",
        "ethereumjs-abi",
        "@magic-ext/connect",
        "@magic-ext/oauth",
        "@json-rpc-tools/provider",
        "@json-rpc-tools/types", 
        "@json-rpc-tools/utils",
        "eip1193-provider",
        "@safe-global/safe-ethers-adapters"
    ]
    
    # Apply fixes
    deps = package_data.get("dependencies", {})
    dev_deps = package_data.get("devDependencies", {})
    
    for old_pkg, new_pkg in deprecated_fixes.items():
        if old_pkg in deps:
            if new_pkg.startswith("^"):
                deps[old_pkg] = new_pkg
            else:
                del deps[old_pkg]
                deps[new_pkg] = "latest"
            print(f"✅ Updated {old_pkg} -> {new_pkg}")
    
    for pkg in packages_to_remove:
        if pkg in deps:
            del deps[pkg]
            print(f"🗑️ Removed deprecated {pkg}")
        if pkg in dev_deps:
            del dev_deps[pkg]
            print(f"🗑️ Removed deprecated {pkg} from devDeps")
    
    # Optimize build with minimal dependencies
    essential_deps = {
        "next": "14.2.33",
        "react": "^18.2.0", 
        "react-dom": "^18.2.0",
        "hls.js": "^1.4.12",
        "pg": "^8.11.3"
    }
    
    # Keep only essential dependencies
    package_data["dependencies"] = essential_deps
    
    # Minimal dev dependencies
    package_data["devDependencies"] = {
        "@types/node": "^20.0.0",
        "@types/react": "^18.2.0",
        "@types/react-dom": "^18.2.0", 
        "@types/pg": "^8.10.7",
        "typescript": "^5.0.0"
    }
    
    # Add build optimization scripts
    package_data["scripts"] = {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "next lint"
    }
    
    with open(package_path, 'w') as f:
        json.dump(package_data, f, indent=2)
    
    print("✅ Package.json optimized for fast deployment")

if __name__ == "__main__":
    optimize_deployment()