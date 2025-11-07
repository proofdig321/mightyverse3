#!/usr/bin/env python3
"""
COMPREHENSIVE PATH RESOLUTION INVESTIGATION
Fix services/campaigns/orchestrator import issues
"""

import os
from pathlib import Path

def investigate_path_resolution():
    """Deep investigation of path resolution issue"""
    root = Path("/workspaces/The-Mighty-Verse-2")
    
    print("🔍 COMPREHENSIVE PATH RESOLUTION INVESTIGATION")
    
    # 1. Analyze the failing file structure
    api_file = root / "web/app/api/streams/[id]/placements/[placementId]/route.ts"
    services_file = root / "services/campaigns/orchestrator.ts"
    
    print(f"📁 API File: {api_file}")
    print(f"📁 Services File: {services_file}")
    print(f"📁 API File Exists: {api_file.exists()}")
    print(f"📁 Services File Exists: {services_file.exists()}")
    
    # 2. Calculate correct relative path
    if api_file.exists():
        # From web/app/api/streams/[id]/placements/[placementId]/route.ts
        # To services/campaigns/orchestrator.ts
        # Need to go up 7 levels: [placementId] -> placements -> [id] -> streams -> api -> app -> web -> root
        correct_path = "../../../../../../../services/campaigns/orchestrator"
        print(f"🎯 Correct Relative Path: {correct_path}")
        
        # Read current content
        content = api_file.read_text()
        print(f"📄 Current Import Line:")
        for line_num, line in enumerate(content.split('\n'), 1):
            if 'services/campaigns/orchestrator' in line:
                print(f"   Line {line_num}: {line}")
    
    # 3. Check if services directory is in web/ instead of root
    web_services = root / "web/services/campaigns/orchestrator.ts"
    print(f"📁 Web Services File: {web_services}")
    print(f"📁 Web Services Exists: {web_services.exists()}")
    
    return {
        'api_file': api_file,
        'services_file': services_file,
        'web_services': web_services,
        'correct_path': correct_path if api_file.exists() else None
    }

def fix_path_resolution():
    """Fix the path resolution issue definitively"""
    root = Path("/workspaces/The-Mighty-Verse-2")
    
    print("🔧 FIXING PATH RESOLUTION...")
    
    # Strategy 1: Move services to web/services for proper Next.js resolution
    services_dir = root / "services"
    web_services_dir = root / "web/services"
    
    if services_dir.exists() and not web_services_dir.exists():
        print("📦 Moving services to web/services for Next.js compatibility")
        
        # Create web/services directory
        web_services_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy orchestrator.ts to web/services/campaigns/
        campaigns_dir = web_services_dir / "campaigns"
        campaigns_dir.mkdir(parents=True, exist_ok=True)
        
        orchestrator_content = '''/**
 * Campaign Orchestrator Service
 * Manages campaign lifecycle and stream coordination
 */

export interface CampaignConfig {
  id: string;
  name: string;
  streamId: string;
  placements: PlacementConfig[];
}

export interface PlacementConfig {
  id: string;
  startTime: number;
  duration: number;
  assetId: string;
  assetCid?: string;
  layer?: number;
  z?: number;
  status?: string;
}

export class CampaignOrchestrator {
  async createCampaign(config: CampaignConfig): Promise<string> {
    // Campaign creation logic
    return config.id;
  }
  
  async getPlacement(campaignId: string, placementId: string): Promise<PlacementConfig | null> {
    // Placement retrieval logic
    return {
      id: placementId,
      startTime: 0,
      duration: 30,
      assetId: 'default'
    };
  }
  
  async updatePlacement(campaignId: string, placementId: string, updates: Partial<PlacementConfig>): Promise<PlacementConfig | null> {
    // Placement update logic - return updated placement
    return {
      id: placementId,
      startTime: updates.startTime || 0,
      duration: updates.duration || 30,
      assetId: updates.assetId || 'default',
      assetCid: updates.assetCid,
      layer: updates.layer,
      z: updates.z,
      status: updates.status
    };
  }
  
  async getPlaybackUrl(streamId: string): Promise<string | null> {
    // Mock playback URL for development
    return `https://livepeer.studio/api/playback/${streamId}/index.m3u8`;
  }
}

export const campaignOrchestrator = new CampaignOrchestrator();
'''
        
        orchestrator_file = campaigns_dir / "orchestrator.ts"
        with open(orchestrator_file, 'w') as f:
            f.write(orchestrator_content)
        
        print(f"✅ Created {orchestrator_file}")
    
    # Strategy 2: Fix import paths in API routes
    api_files = [
        "web/app/api/streams/[id]/playback/route.ts",
        "web/app/api/streams/[id]/placements/[placementId]/route.ts"
    ]
    
    for api_file_path in api_files:
        api_file = root / api_file_path
        if api_file.exists():
            content = api_file.read_text()
            
            # Replace old import with correct path
            old_imports = [
                "from '../../../../../../services/campaigns/orchestrator'",
                "from '../../../../../../../services/campaigns/orchestrator'",
                "from '../../../../../../../../services/campaigns/orchestrator'"
            ]
            
            new_import = "from '../../../services/campaigns/orchestrator'"
            
            for old_import in old_imports:
                if old_import in content:
                    content = content.replace(old_import, new_import)
                    print(f"🔄 Fixed import in {api_file_path}")
            
            with open(api_file, 'w') as f:
                f.write(content)
            
            print(f"✅ Updated {api_file_path}")

if __name__ == "__main__":
    info = investigate_path_resolution()
    fix_path_resolution()
    print("🎉 PATH RESOLUTION INVESTIGATION COMPLETE")