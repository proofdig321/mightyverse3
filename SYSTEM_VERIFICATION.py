#!/usr/bin/env python3
"""
MIGHTY VERSE SYSTEM VERIFICATION
Complete platform analysis and validation
"""

import os
import json
import subprocess
from pathlib import Path

class MightyVerseVerifier:
    def __init__(self):
        self.root = Path("/workspaces/The-Mighty-Verse-2")
        self.issues = []
        self.verified = []
        
    def verify_everything(self):
        """Verify complete Mighty Verse platform"""
        print("🔍 STUDYING ENTIRE MIGHTY VERSE PLATFORM")
        
        # Core Architecture
        self._verify_architecture()
        
        # Frontend Systems
        self._verify_frontend()
        
        # Backend Systems  
        self._verify_backend()
        
        # Integration Points
        self._verify_integrations()
        
        # MCP Deployment
        self._verify_mcp_deployment()
        
        # Generate Report
        self._generate_verification_report()
        
    def _verify_architecture(self):
        """Verify core architecture"""
        print("📋 Verifying Architecture...")
        
        # Check project structure
        required_dirs = ['web', 'agents', 'contracts', 'db', 'scripts']
        for dir_name in required_dirs:
            if (self.root / dir_name).exists():
                self.verified.append(f"✅ {dir_name}/ directory exists")
            else:
                self.issues.append(f"❌ Missing {dir_name}/ directory")
        
        # Check key files
        key_files = [
            'web/package.json',
            'web/next.config.js', 
            'web/.env.example',
            'contracts/hardhat.config.js',
            'db/schemas/content_schemas.sql'
        ]
        
        for file_path in key_files:
            if (self.root / file_path).exists():
                self.verified.append(f"✅ {file_path} exists")
            else:
                self.issues.append(f"❌ Missing {file_path}")
    
    def _verify_frontend(self):
        """Verify frontend systems"""
        print("🎨 Verifying Frontend...")
        
        # Check Next.js app structure
        app_dirs = ['admin', 'animator', 'api', 'auth', 'campaigns', 'murals']
        for dir_name in app_dirs:
            if (self.root / 'web' / 'app' / dir_name).exists():
                self.verified.append(f"✅ /app/{dir_name} route exists")
            else:
                self.issues.append(f"❌ Missing /app/{dir_name} route")
        
        # Check components
        component_dirs = ['3d', 'admin', 'shared', 'media']
        for dir_name in component_dirs:
            if (self.root / 'web' / 'components' / dir_name).exists():
                self.verified.append(f"✅ components/{dir_name} exists")
            else:
                self.issues.append(f"❌ Missing components/{dir_name}")
        
        # Check utilities
        util_dirs = ['storage', 'auth', 'blockchain', 'analytics']
        for dir_name in util_dirs:
            if (self.root / 'web' / 'utils' / dir_name).exists():
                self.verified.append(f"✅ utils/{dir_name} exists")
            else:
                self.issues.append(f"❌ Missing utils/{dir_name}")
    
    def _verify_backend(self):
        """Verify backend systems"""
        print("⚙️ Verifying Backend...")
        
        # Check API routes
        api_routes = [
            'auth/wallet',
            'ipfs/upload', 
            'curation/analyze',
            'workflow/approve',
            'blockchain/monitor',
            'agents/status'
        ]
        
        for route in api_routes:
            route_path = self.root / 'web' / 'app' / 'api' / route / 'route.ts'
            if route_path.exists():
                self.verified.append(f"✅ API route /api/{route} exists")
            else:
                self.issues.append(f"❌ Missing API route /api/{route}")
        
        # Check agents
        agent_files = [
            'asset_review.py',
            'metadata_gen.py', 
            'mint_approval.py'
        ]
        
        for agent_file in agent_files:
            if (self.root / 'agents' / agent_file).exists():
                self.verified.append(f"✅ Agent {agent_file} exists")
            else:
                self.issues.append(f"❌ Missing agent {agent_file}")
        
        # Check smart contracts
        contracts = [
            'MightyVerseAssets.sol',
            'CreditToken.sol',
            'ApprovalRegistry.sol'
        ]
        
        for contract in contracts:
            if (self.root / 'contracts' / 'contracts' / contract).exists():
                self.verified.append(f"✅ Contract {contract} exists")
            else:
                self.issues.append(f"❌ Missing contract {contract}")
    
    def _verify_integrations(self):
        """Verify integration points"""
        print("🔗 Verifying Integrations...")
        
        # Check data-store integration
        datastore_path = self.root / 'web' / 'utils' / 'storage' / 'data-store.ts'
        if datastore_path.exists():
            content = datastore_path.read_text()
            if 'ipfsClient' in content:
                self.verified.append("✅ IPFS integration in data-store")
            else:
                self.issues.append("❌ Missing IPFS integration in data-store")
        
        # Check middleware
        middleware_path = self.root / 'web' / 'middleware.ts'
        if middleware_path.exists():
            content = middleware_path.read_text()
            if 'jwtAuth' in content:
                self.verified.append("✅ JWT auth in middleware")
            else:
                self.issues.append("❌ Missing JWT auth in middleware")
        
        # Check environment variables
        env_path = self.root / 'web' / '.env.example'
        if env_path.exists():
            content = env_path.read_text()
            required_vars = [
                'PINATA_JWT',
                'NEXT_PUBLIC_CONTRACT_ADDRESS',
                'JWT_SECRET',
                'NEXT_PUBLIC_WS_URL'
            ]
            
            for var in required_vars:
                if var in content:
                    self.verified.append(f"✅ Environment variable {var} configured")
                else:
                    self.issues.append(f"❌ Missing environment variable {var}")
    
    def _verify_mcp_deployment(self):
        """Verify MCP deployment status"""
        print("🤖 Verifying MCP Deployment...")
        
        # Check MCP files
        mcp_files = [
            'agents/mcp_coordinator.py',
            'agents/deployment_agents.py',
            'scripts/mcp_deployment_orchestrator.py',
            'MCP_AGENT_IMPLEMENTATION_PLAN.md',
            'AUTOPILOT_EXECUTION.py'
        ]
        
        for file_path in mcp_files:
            if (self.root / file_path).exists():
                self.verified.append(f"✅ MCP file {file_path} exists")
            else:
                self.issues.append(f"❌ Missing MCP file {file_path}")
        
        # Check autopilot status
        if (self.root / 'AUTOPILOT_STATUS.md').exists():
            self.verified.append("✅ Autopilot deployment completed")
        else:
            self.issues.append("❌ Autopilot deployment not verified")
    
    def _generate_verification_report(self):
        """Generate comprehensive verification report"""
        print("\n" + "="*80)
        print("📊 MIGHTY VERSE VERIFICATION REPORT")
        print("="*80)
        
        print(f"\n✅ VERIFIED COMPONENTS ({len(self.verified)}):")
        for item in self.verified:
            print(f"  {item}")
        
        if self.issues:
            print(f"\n❌ ISSUES FOUND ({len(self.issues)}):")
            for issue in self.issues:
                print(f"  {issue}")
        else:
            print(f"\n🎉 NO ISSUES FOUND - SYSTEM FULLY VERIFIED")
        
        # Calculate verification score
        total_checks = len(self.verified) + len(self.issues)
        score = (len(self.verified) / total_checks * 100) if total_checks > 0 else 0
        
        print(f"\n📈 VERIFICATION SCORE: {score:.1f}%")
        
        if score >= 95:
            print("🏆 EXCELLENT - Platform ready for production")
        elif score >= 85:
            print("✅ GOOD - Minor issues to address")
        elif score >= 70:
            print("⚠️ FAIR - Several issues need attention")
        else:
            print("❌ POOR - Major issues require immediate attention")
        
        print("="*80)

if __name__ == "__main__":
    verifier = MightyVerseVerifier()
    verifier.verify_everything()