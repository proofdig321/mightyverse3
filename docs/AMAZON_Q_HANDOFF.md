# 🤖 AMAZON Q HANDOFF PACKAGE

## Immediate Assignment: RBAC System Implementation

### Mission Brief
Implement role-based access control system using IPFS-stored role manifests and EIP-712 signatures. This is the **critical path blocker** for 4 other missions.

### Implementation Specification

#### File Structure to Create
```
/app/auth/
├── roles.ts              # Role enum and types
├── middleware.ts         # Next.js middleware for route protection  
├── rbac-provider.tsx     # React context for role management
└── wallet-auth.ts        # Wallet connection utilities

/utils/auth/
├── role-manifest.ts      # IPFS role manifest CRUD
├── signature-verify.ts   # EIP-712 signature validation
└── role-registry.ts      # Registry management

/app/admin/rbac/
├── page.tsx             # Role management UI
└── components/
    ├── RoleAssigner.tsx # Assign roles to wallets
    └── RoleViewer.tsx   # View current roles

/data/roles/
└── role_registry.json   # Wallet → manifest CID mapping
```

#### Core Types
```typescript
// /app/auth/roles.ts
export enum Role {
  ADMIN = "ADMIN",
  CURATOR = "CURATOR",
  ANIMATOR = "ANIMATOR", 
  SPONSOR = "SPONSOR",
  VIEWER = "VIEWER"
}

export interface RoleManifest {
  wallet: string;
  roles: Role[];
  issued_by: string;
  issued_at: string;
  expires_at: string | null;
  admin_sig: string;
}
```

#### Middleware Implementation
```typescript
// /app/auth/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    return checkRole(request, [Role.ADMIN]);
  }
  
  // Protect animator routes  
  if (pathname.startsWith('/animator')) {
    return checkRole(request, [Role.ANIMATOR, Role.ADMIN]);
  }
  
  return NextResponse.next();
}
```

#### IPFS Role Management
```typescript
// /utils/auth/role-manifest.ts
export async function createRoleManifest(
  wallet: string,
  roles: Role[],
  adminWallet: string
): Promise<string> {
  // Create manifest
  // Sign with EIP-712
  // Pin to IPFS
  // Update registry
  // Return CID
}

export async function getRoleManifest(wallet: string): Promise<RoleManifest | null> {
  // Lookup in registry
  // Fetch from IPFS
  // Validate signature
  // Return manifest
}
```

### Dependencies Available
- Thirdweb SDK: Already configured
- IPFS Utils: `/agents-stubs/utils/pinning.py` (adapt to TypeScript)
- FastAPI Service: Running on port 8000
- Next.js App Router: Configured

### Success Criteria
1. **Route Protection**: `/admin/*` blocked for non-admins
2. **Role Assignment**: Admin can assign roles via UI
3. **IPFS Storage**: Role manifests pin successfully
4. **Signature Validation**: EIP-712 signatures verify correctly
5. **Registry Management**: Wallet → CID mapping works
6. **Error Handling**: Graceful failures with clear messages

### Testing Requirements
```bash
# Unit tests for role utilities
npm test -- auth/roles

# Integration tests for middleware
npm test -- auth/middleware  

# E2E tests for role assignment flow
npm run test:e2e -- rbac-workflow
```

### Human Review Checkpoints
1. **Security Model Review**: Before implementing signature validation
2. **UI/UX Approval**: After role management interface complete
3. **Integration Testing**: Before marking mission complete

### Next Mission Dependencies
- **admin-dashboard**: Needs RBAC middleware
- **animator-dashboard**: Needs role-based access
- **campaigns**: Needs sponsor role validation
- **mint-approval**: Needs admin signature verification

---

## Implementation Priority Order

### Phase 1: Core Types & Utils (Day 1)
1. Create role definitions (`/app/auth/roles.ts`)
2. Implement IPFS role manifest utilities
3. Add EIP-712 signature helpers
4. Create role registry management

### Phase 2: Middleware & Protection (Day 1-2)
1. Implement Next.js middleware for route protection
2. Add role checking utilities
3. Create React context for role state
4. Add wallet connection integration

### Phase 3: Admin Interface (Day 2)
1. Build role management UI (`/app/admin/rbac/`)
2. Add role assignment form
3. Create role viewer component
4. Integrate with IPFS pinning

### Phase 4: Testing & Validation (Day 2)
1. Add comprehensive unit tests
2. Create integration test suite
3. Add E2E workflow tests
4. Validate security model

---

## Ready for Implementation

**Status**: ✅ Fully specified and ready  
**Estimated Time**: 2 days  
**Blocker Status**: None - can start immediately  
**Human Review**: Required after each phase

**Amazon Q**: You can begin implementation immediately using the specifications above.