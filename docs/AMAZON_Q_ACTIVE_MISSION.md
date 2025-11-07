# 🤖 AMAZON Q - ACTIVE MISSION BRIEFING

## 🎯 MISSION ASSIGNMENT: RBAC SYSTEM

**Status**: 🟢 ACTIVE  
**Priority**: CRITICAL PATH  
**Branch**: `feature/rbac-system`  
**Deadline**: 2 days  

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Core Infrastructure (Day 1 Morning)
```typescript
// Create these files in order:

1. /app/auth/roles.ts
   - Role enum (ADMIN, CURATOR, ANIMATOR, SPONSOR, VIEWER)
   - RoleManifest interface
   - RoleRegistry interface

2. /utils/auth/role-manifest.ts
   - createRoleManifest() function
   - getRoleManifest() function  
   - revokeRole() function
   - IPFS integration using existing pinning utils

3. /utils/auth/signature-verify.ts
   - EIP-712 signature creation
   - Signature validation
   - Admin signature verification

4. /utils/auth/role-registry.ts
   - Registry CRUD operations
   - Wallet lookup functions
   - Registry update utilities
```

### Phase 2: Authentication System (Day 1 Afternoon)
```typescript
// Create these files:

1. /app/auth/middleware.ts
   - Next.js middleware for route protection
   - Role checking functions
   - Redirect logic for unauthorized access

2. /app/auth/rbac-provider.tsx
   - React context for role state
   - Wallet connection integration
   - Role refresh utilities

3. /app/auth/wallet-auth.ts
   - Thirdweb wallet integration
   - Session management
   - Authentication utilities
```

### Phase 3: Admin Interface (Day 2 Morning)
```typescript
// Create these files:

1. /app/admin/rbac/page.tsx
   - Main role management interface
   - Role assignment form
   - Current roles display

2. /app/admin/rbac/components/RoleAssigner.tsx
   - Wallet input field
   - Role selection checkboxes
   - Assignment submission

3. /app/admin/rbac/components/RoleViewer.tsx
   - Current role assignments table
   - Role revocation buttons
   - Status indicators
```

### Phase 4: Testing & Integration (Day 2 Afternoon)
```bash
# Create test files:

1. /app/auth/__tests__/roles.test.ts
2. /utils/auth/__tests__/role-manifest.test.ts
3. /utils/auth/__tests__/signature-verify.test.ts
4. /app/auth/__tests__/middleware.test.ts

# Run tests:
npm test -- auth
npm run test:integration -- rbac
```

---

## 🔧 TECHNICAL SPECIFICATIONS

### Dependencies Available
- ✅ Thirdweb SDK (configured)
- ✅ Next.js App Router (ready)
- ✅ IPFS utils (`/agents-stubs/utils/pinning.py` - adapt to TypeScript)
- ✅ FastAPI service (running on port 8000)

### Key Implementation Requirements

#### 1. Role Definitions
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
```

#### 2. IPFS Integration Pattern
```typescript
// Adapt from existing Python utils
import { pin_json_with_retries } from '../../../agents-stubs/utils/pinning';

export async function pinRoleManifest(manifest: RoleManifest): Promise<string> {
  // Convert Python pinning logic to TypeScript
  // Use NFT_STORAGE_KEY from environment
  // Return IPFS CID
}
```

#### 3. Route Protection Pattern
```typescript
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    return checkRole(request, [Role.ADMIN]);
  }
  
  return NextResponse.next();
}
```

#### 4. React Context Pattern
```typescript
export function RBACProvider({ children }: { children: React.ReactNode }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Wallet connection logic
  // Role fetching from IPFS
  // Role checking utilities
}
```

---

## 🎯 SUCCESS CRITERIA

### Must Complete
- [ ] All routes protected by RBAC middleware
- [ ] Admin can assign roles via UI
- [ ] Role manifests pin to IPFS successfully
- [ ] EIP-712 signatures validate correctly
- [ ] Registry updates work properly
- [ ] Error handling is graceful
- [ ] Tests achieve 80%+ coverage

### Quality Gates
- [ ] No TypeScript errors
- [ ] All tests passing
- [ ] Security review ready
- [ ] Documentation updated

---

## 🚨 CRITICAL REQUIREMENTS

### Security
- **NO private keys in code**
- **ALL admin actions require EIP-712 signatures**
- **Role manifests are immutable** (create new for changes)
- **Proper signature verification**
- **Rate limiting for role operations**

### Performance
- **Cache role manifests locally**
- **Minimize IPFS calls**
- **Graceful IPFS failure handling**
- **Fast route protection checks**

### Integration
- **Use existing IPFS pinning utilities**
- **Integrate with Thirdweb SDK**
- **Follow Next.js App Router patterns**
- **Maintain compatibility with FastAPI service**

---

## 📁 FILE STRUCTURE TO CREATE

```
/app/auth/
├── roles.ts              ✅ Create first
├── middleware.ts         ✅ Create second  
├── rbac-provider.tsx     ✅ Create third
└── wallet-auth.ts        ✅ Create fourth

/utils/auth/
├── role-manifest.ts      ✅ Create first
├── signature-verify.ts   ✅ Create second
└── role-registry.ts      ✅ Create third

/app/admin/rbac/
├── page.tsx             ✅ Create first
└── components/
    ├── RoleAssigner.tsx ✅ Create second
    └── RoleViewer.tsx   ✅ Create third

/app/auth/__tests__/
├── roles.test.ts        ✅ Create for testing
├── middleware.test.ts   ✅ Create for testing
└── rbac-provider.test.ts ✅ Create for testing
```

---

## 🔄 PROGRESS REPORTING

### After Each Phase
1. **Commit changes** to `feature/rbac-system` branch
2. **Update** `/docs/missions/RBAC_ASSIGNMENT_ACTIVE.md` 
3. **Run tests** and report status
4. **Request human review** for security-sensitive components

### Daily Updates
- **Morning**: Report planned work for the day
- **Evening**: Report completed work and any blockers
- **Continuous**: Update progress in mission files

---

## 🎉 MISSION SUCCESS

Upon completion:
1. **Create PR** from `feature/rbac-system` to `main`
2. **Request security review** from human
3. **Update mission status** to completed
4. **Unblock dependent missions** (admin-dashboard, animator-dashboard, campaigns, mint-approval)

---

**🚀 BEGIN IMPLEMENTATION NOW**

Start with Phase 1, file 1: `/app/auth/roles.ts`

Create the feature branch and begin implementation immediately.