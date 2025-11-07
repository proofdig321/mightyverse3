# 🔐 RBAC MISSION COORDINATION

## Mission Overview
**Agent**: rbac  
**Priority**: Critical (blocks 4 other missions)  
**Assigned To**: Amazon Q  
**Human Reviewer**: You  

## Implementation Strategy

### Phase 1: Role Definition
```typescript
enum Role {
  ADMIN = "ADMIN",
  CURATOR = "CURATOR", 
  ANIMATOR = "ANIMATOR",
  SPONSOR = "SPONSOR",
  VIEWER = "VIEWER"
}
```

### Phase 2: IPFS-Based Role Storage
```json
// role_manifest_{wallet}.json
{
  "wallet": "0x...",
  "roles": ["ADMIN"],
  "issued_by": "0xAdmin",
  "issued_at": "2025-01-27T...",
  "expires_at": null,
  "admin_sig": "0x..."
}
```

### Phase 3: Middleware Implementation
- `/app/admin/*` - Admin only
- `/app/animator/*` - Animator + Admin
- `/app/sponsor/*` - Sponsor + Admin
- API route protection

## File Structure
```
/app/auth/
├── roles.ts           # Role definitions
├── middleware.ts      # Route protection
├── rbac-provider.tsx  # React context
└── wallet-auth.ts     # Wallet connection

/utils/
├── role-manifest.ts   # IPFS role management
└── signature-verify.ts # EIP-712 validation

/data/roles/
└── role_registry.json # Wallet → manifest CID mapping
```

## Dependencies
- Thirdweb SDK (already available)
- IPFS pinning (use existing utils)
- EIP-712 signing (implement)

## Success Criteria
- [ ] Role assignment works via admin UI
- [ ] Route protection blocks unauthorized access
- [ ] Role manifests pin to IPFS correctly
- [ ] EIP-712 signatures validate properly
- [ ] Tests cover all role combinations

## Human Review Checklist
- [ ] Security model is sound
- [ ] No privilege escalation possible
- [ ] Admin role assignment is secure
- [ ] Role revocation works correctly
- [ ] Emergency admin recovery exists

## Next Missions Unblocked
1. **admin-dashboard** - Needs RBAC for route protection
2. **animator-dashboard** - Needs role-based access
3. **campaigns** - Needs sponsor role validation
4. **mint-approval** - Needs admin signature verification

## Amazon Q Instructions

### Implementation Order
1. Create role definitions and types
2. Implement IPFS role manifest system
3. Build middleware for route protection
4. Create admin UI for role management
5. Add comprehensive tests
6. Update documentation

### Key Requirements
- No private keys in code
- All admin actions require EIP-712 signatures
- Role manifests are immutable (new manifest for changes)
- Graceful fallback when IPFS unavailable
- Clear error messages for unauthorized access

### Testing Requirements
```bash
# Unit tests
npm test -- rbac

# Integration tests
npm run test:e2e -- auth

# Security tests
npm run test:security -- rbac
```

---

**Ready for Assignment**: This mission is fully specified and ready for Amazon Q implementation.