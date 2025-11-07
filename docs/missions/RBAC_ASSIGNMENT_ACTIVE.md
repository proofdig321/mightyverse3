# 🔐 RBAC MISSION - ACTIVE ASSIGNMENT

**Status**: 🟢 ACTIVE  
**Assigned To**: Amazon Q  
**Priority**: CRITICAL PATH  
**Started**: 2025-01-27  
**ETA**: 2 days  

## Mission Brief
Implement role-based access control system using IPFS-stored role manifests and EIP-712 signatures. This mission blocks 4 other critical missions and must be completed first.

## Implementation Checklist

### Phase 1: Core Infrastructure ⏳
- [ ] Create `/app/auth/roles.ts` - Role definitions and types
- [ ] Create `/utils/auth/role-manifest.ts` - IPFS role management
- [ ] Create `/utils/auth/signature-verify.ts` - EIP-712 validation
- [ ] Create `/data/roles/role_registry.json` - Registry initialization
- [ ] Test: Role type definitions and utilities

### Phase 2: Authentication System ⏳
- [ ] Create `/app/auth/middleware.ts` - Route protection
- [ ] Create `/app/auth/rbac-provider.tsx` - React context
- [ ] Create `/app/auth/wallet-auth.ts` - Wallet integration
- [ ] Test: Middleware route protection
- [ ] Test: Wallet connection flow

### Phase 3: Admin Interface ⏳
- [ ] Create `/app/admin/rbac/page.tsx` - Role management UI
- [ ] Create `/app/admin/rbac/components/RoleAssigner.tsx`
- [ ] Create `/app/admin/rbac/components/RoleViewer.tsx`
- [ ] Test: Role assignment workflow
- [ ] Test: UI component interactions

### Phase 4: Integration & Testing ⏳
- [ ] Add comprehensive unit tests
- [ ] Add integration tests for auth flow
- [ ] Add E2E tests for role assignment
- [ ] Update documentation
- [ ] Security review preparation

## Technical Specifications

### File Structure
```
/app/auth/
├── roles.ts              # ✅ Role enum and interfaces
├── middleware.ts         # ✅ Next.js route protection
├── rbac-provider.tsx     # ✅ React context provider
└── wallet-auth.ts        # ✅ Wallet connection utilities

/utils/auth/
├── role-manifest.ts      # ✅ IPFS CRUD operations
├── signature-verify.ts   # ✅ EIP-712 validation
└── role-registry.ts      # ✅ Registry management

/app/admin/rbac/
├── page.tsx             # ✅ Main role management page
└── components/
    ├── RoleAssigner.tsx # ✅ Role assignment form
    └── RoleViewer.tsx   # ✅ Current roles display

/data/roles/
└── role_registry.json   # ✅ Wallet → CID mapping
```

### Core Implementation Requirements

#### 1. Role Definitions (`/app/auth/roles.ts`)
```typescript
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

export interface RoleRegistry {
  [wallet: string]: string; // wallet -> manifest CID
}
```

#### 2. IPFS Role Management (`/utils/auth/role-manifest.ts`)
```typescript
export async function createRoleManifest(
  wallet: string,
  roles: Role[],
  adminWallet: string
): Promise<string> {
  // 1. Create manifest object
  // 2. Generate EIP-712 signature
  // 3. Pin to IPFS via existing utils
  // 4. Update role registry
  // 5. Return manifest CID
}

export async function getRoleManifest(wallet: string): Promise<RoleManifest | null> {
  // 1. Lookup CID in registry
  // 2. Fetch from IPFS
  // 3. Validate signature
  // 4. Return manifest or null
}

export async function revokeRole(wallet: string, adminWallet: string): Promise<void> {
  // 1. Create revocation manifest
  // 2. Sign and pin to IPFS
  // 3. Update registry
}
```

#### 3. Route Protection (`/app/auth/middleware.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/admin')) {
    return checkRole(request, [Role.ADMIN]);
  }
  
  if (pathname.startsWith('/animator')) {
    return checkRole(request, [Role.ANIMATOR, Role.ADMIN]);
  }
  
  if (pathname.startsWith('/sponsor')) {
    return checkRole(request, [Role.SPONSOR, Role.ADMIN]);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/animator/:path*', '/sponsor/:path*']
};
```

#### 4. React Context (`/app/auth/rbac-provider.tsx`)
```typescript
interface RBACContextType {
  roles: Role[];
  hasRole: (role: Role) => boolean;
  isAdmin: boolean;
  loading: boolean;
  refreshRoles: () => Promise<void>;
}

export function RBACProvider({ children }: { children: React.ReactNode }) {
  // 1. Connect to wallet
  // 2. Fetch user roles from IPFS
  // 3. Provide role checking utilities
  // 4. Handle role updates
}
```

## Dependencies Available
- ✅ Thirdweb SDK configured
- ✅ IPFS utils in `/agents-stubs/utils/pinning.py` (adapt to TypeScript)
- ✅ Next.js App Router configured
- ✅ FastAPI service running

## Success Criteria
1. **Route Protection**: `/admin/*` routes blocked for non-admins
2. **Role Assignment**: Admin can assign roles via UI
3. **IPFS Storage**: Role manifests pin successfully to IPFS
4. **Signature Validation**: EIP-712 signatures verify correctly
5. **Registry Management**: Wallet → CID mapping functions properly
6. **Error Handling**: Graceful failures with clear error messages
7. **Test Coverage**: 80%+ coverage for all auth utilities

## Human Review Gates

### Security Review Required
- [ ] EIP-712 signature implementation
- [ ] Role escalation prevention
- [ ] Admin role assignment security
- [ ] Emergency recovery mechanisms

### UI/UX Review Required
- [ ] Role management interface usability
- [ ] Error message clarity
- [ ] Loading states and feedback
- [ ] Mobile responsiveness

## Blocked Missions (Will Unblock After Completion)
1. **admin-dashboard** - Needs RBAC middleware
2. **animator-dashboard** - Needs role-based access
3. **campaigns** - Needs sponsor role validation
4. **mint-approval** - Needs admin signature verification

## Testing Strategy

### Unit Tests Required
```bash
# Role utilities
npm test -- auth/roles.test.ts
npm test -- auth/role-manifest.test.ts
npm test -- auth/signature-verify.test.ts

# Middleware
npm test -- auth/middleware.test.ts
```

### Integration Tests Required
```bash
# Full auth flow
npm run test:integration -- rbac-flow

# IPFS integration
npm run test:integration -- ipfs-roles
```

### E2E Tests Required
```bash
# Role assignment workflow
npm run test:e2e -- role-assignment

# Route protection
npm run test:e2e -- route-protection
```

## Implementation Notes

### IPFS Integration
- Use existing pinning utilities from `/agents-stubs/utils/pinning.py`
- Adapt Python pinning logic to TypeScript
- Implement retry logic for IPFS failures
- Cache manifests locally for performance

### Security Considerations
- Never store private keys in code
- All admin signatures must be EIP-712 compliant
- Role manifests are immutable (create new for changes)
- Implement proper signature verification
- Add rate limiting for role operations

### Performance Optimization
- Cache role manifests in localStorage
- Implement background refresh for role updates
- Use React Query for state management
- Minimize IPFS calls with smart caching

---

## 🚨 CRITICAL PATH MISSION

This is the **critical path blocker** for The Mighty Verse development. All subsequent missions depend on RBAC completion.

**Amazon Q**: Begin implementation immediately using the specifications above. Create a feature branch `feature/rbac-system` and implement in the order specified.

**Human Review**: Security review required after Phase 1 completion.