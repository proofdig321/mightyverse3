#!/usr/bin/env python3
"""
COMPLETE BUILD FIX
Final resolution of all Vercel build errors
"""

import json
from pathlib import Path

def fix_all_build_errors():
    """Apply all necessary fixes for successful build"""
    root = Path("/workspaces/The-Mighty-Verse-2")
    
    print("🔧 APPLYING COMPLETE BUILD FIXES...")
    
    # 1. Ensure package.json has all dependencies
    package_path = root / 'web' / 'package.json'
    with open(package_path, 'r') as f:
        package_data = json.load(f)
    
    # Add all missing dependencies
    required_deps = {
        "hls.js": "^1.4.12",
        "pg": "^8.11.3"
    }
    
    required_dev_deps = {
        "@types/pg": "^8.10.7"
    }
    
    for dep, version in required_deps.items():
        package_data.setdefault('dependencies', {})[dep] = version
    
    for dep, version in required_dev_deps.items():
        package_data.setdefault('devDependencies', {})[dep] = version
    
    with open(package_path, 'w') as f:
        json.dump(package_data, f, indent=2)
    
    print("✅ Updated package.json with all dependencies")
    
    # 2. Create next.config.js with proper webpack config
    next_config_path = root / 'web' / 'next.config.js'
    next_config_content = '''/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pg']
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        pg: false,
        'pg-native': false
      };
    }
    return config;
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  images: {
    domains: ['gateway.pinata.cloud', 'ipfs.io'],
  },
};

module.exports = nextConfig;
'''
    
    with open(next_config_path, 'w') as f:
        f.write(next_config_content)
    
    print("✅ Updated next.config.js with webpack configuration")
    
    # 3. Ensure all services are properly structured
    services_dir = root / 'services'
    services_dir.mkdir(exist_ok=True)
    
    campaigns_dir = services_dir / 'campaigns'
    campaigns_dir.mkdir(exist_ok=True)
    
    # Create __tests__ directory if referenced
    tests_dir = campaigns_dir / '__tests__'
    tests_dir.mkdir(exist_ok=True)
    
    # Create a simple test file
    test_file = tests_dir / 'orchestrator.test.ts'
    test_content = '''import { CampaignOrchestrator } from '../orchestrator';

describe('CampaignOrchestrator', () => {
  it('should create campaign', async () => {
    const orchestrator = new CampaignOrchestrator();
    const result = await orchestrator.createCampaign({
      id: 'test',
      name: 'Test Campaign',
      streamId: 'stream1',
      placements: []
    });
    expect(result).toBe('test');
  });
});
'''
    
    with open(test_file, 'w') as f:
        f.write(test_content)
    
    print("✅ Created services directory structure")
    
    # 4. Create proper TypeScript configuration
    tsconfig_path = root / 'web' / 'tsconfig.json'
    if tsconfig_path.exists():
        with open(tsconfig_path, 'r') as f:
            tsconfig = json.load(f)
        
        # Ensure proper path mapping
        tsconfig.setdefault('compilerOptions', {}).setdefault('paths', {})
        tsconfig['compilerOptions']['paths']['@/*'] = ['./*']
        tsconfig['compilerOptions']['paths']['@/services/*'] = ['../services/*']
        
        with open(tsconfig_path, 'w') as f:
            json.dump(tsconfig, f, indent=2)
        
        print("✅ Updated TypeScript configuration")
    
    print("🎉 ALL BUILD FIXES APPLIED SUCCESSFULLY")

if __name__ == "__main__":
    fix_all_build_errors()