# 🔧 RBAC IMPLEMENTATION - CORRECTED PATHS

## Path Correction Required

**Working Directory**: `/workspaces/themightyverse` ✅  
**Target Implementation**: `/workspaces/themightyverse/web/` (Next.js app) ✅  

## Corrected File Structure for Amazon Q

### Phase 1: Core Infrastructure
```
/workspaces/themightyverse/web/app/auth/
├── roles.ts              # Role definitions
├── middleware.ts         # Next.js middleware
├── rbac-provider.tsx     # React context
└── wallet-auth.ts        # Wallet utilities

/workspaces/themightyverse/web/utils/auth/
├── role-manifest.ts      # IPFS role management
├── signature-verify.ts   # EIP-712 validation
└── role-registry.ts      # Registry operations
```

### Phase 2: Admin Interface
```
/workspaces/themightyverse/web/app/admin/rbac/
├── page.tsx             # Role management UI
└── components/
    ├── RoleAssigner.tsx # Role assignment
    └── RoleViewer.tsx   # Role display
```

### Phase 3: Integration Points
```
/workspaces/themightyverse/web/middleware.ts     # Next.js middleware config
/workspaces/themightyverse/web/app/layout.tsx   # RBAC provider wrapper
```

## Dependencies Available
- **Next.js App**: `/workspaces/themightyverse/web/` ✅
- **IPFS Utils**: `/workspaces/themightyverse/agents-stubs/utils/pinning.py` ✅
- **FastAPI Service**: Running on port 8000 ✅

## Amazon Q - Updated Instructions

### Start Implementation Here
1. **Navigate to**: `/workspaces/themightyverse/web/`
2. **Create branch**: `feature/rbac-system`
3. **Begin with**: `app/auth/roles.ts`
4. **Follow corrected paths** above

### Key Changes from Original Spec
- All paths now target `/web/` directory
- Middleware goes in `/web/middleware.ts`
- RBAC provider wraps `/web/app/layout.tsx`
- Admin interface in `/web/app/admin/rbac/`

---

**🚀 PROCEED WITH CORRECTED PATHS**