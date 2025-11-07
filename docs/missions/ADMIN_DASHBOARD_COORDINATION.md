# 🎛️ ADMIN DASHBOARD MISSION COORDINATION

## Mission Overview
**Agent**: admin-dashboard  
**Priority**: High  
**Depends On**: rbac (must complete first)  
**Assigned To**: Amazon Q  
**Human Reviewer**: You  

## Implementation Strategy

### Core Pages
```
/app/admin/
├── page.tsx           # Dashboard overview
├── assets/
│   ├── page.tsx       # Pending assets list
│   └── [cid]/
│       └── page.tsx   # Asset detail + QC report
├── campaigns/
│   ├── page.tsx       # Campaign management
│   └── [id]/
│       └── page.tsx   # Campaign details
├── mint-queue/
│   └── page.tsx       # Mint approval queue
└── analytics/
    └── page.tsx       # Platform metrics
```

### Key Components
```typescript
// AdAnchorEditor.tsx - R3F-based anchor placement
// AssetPreview.tsx - 2.5D layer preview
// QCReport.tsx - AI confidence display
// MintApproval.tsx - EIP-712 signature flow
// CampaignManager.tsx - Sponsor workflow
```

### Data Flow
```
Pending Asset → QC Review → Anchor Placement → Metadata Generation → Mint Queue
```

## Dependencies
- **rbac** - Route protection middleware
- **asset-review** - QC reports (can mock initially)
- **R3F** - 3D preview components
- **Thirdweb** - Wallet integration

## Success Criteria
- [ ] Admin can review pending assets
- [ ] QC reports display with confidence scores
- [ ] Ad anchor editor works in R3F preview
- [ ] Mint queue shows approval workflow
- [ ] Campaign management functional
- [ ] All routes protected by RBAC

## Human Review Checklist
- [ ] UI/UX is intuitive for content curation
- [ ] Ad anchor placement is precise
- [ ] Approval workflow is clear
- [ ] No unauthorized access possible
- [ ] Performance acceptable with large asset lists

## File Structure
```
/app/admin/
├── components/
│   ├── AdAnchorEditor.tsx
│   ├── AssetPreview.tsx
│   ├── QCReport.tsx
│   ├── MintApproval.tsx
│   └── CampaignManager.tsx
├── hooks/
│   ├── useAssets.ts
│   ├── useCampaigns.ts
│   └── useMintQueue.ts
└── utils/
    ├── qc-validation.ts
    └── signature-helpers.ts
```

## API Endpoints Needed
```typescript
// /api/admin/assets
GET    /api/admin/pending-assets
GET    /api/admin/asset/[cid]
POST   /api/admin/asset/[cid]/approve
POST   /api/admin/asset/[cid]/reject

// /api/admin/anchors
POST   /api/admin/anchor/[cid]/save
GET    /api/admin/anchor/[cid]/preview

// /api/admin/mint
GET    /api/admin/mint-queue
POST   /api/admin/mint-request
```

## Amazon Q Instructions

### Implementation Priority
1. Basic admin layout with RBAC protection
2. Asset list and detail pages
3. QC report display (mock data initially)
4. Ad anchor editor (R3F component)
5. Mint queue and approval flow
6. Campaign management interface

### Key Requirements
- Responsive design (Tailwind CSS)
- Real-time updates where possible
- Graceful error handling
- Loading states for async operations
- Accessibility compliance

### Testing Strategy
```bash
# Component tests
npm test -- admin

# E2E workflow tests
npm run test:e2e -- admin-workflow

# RBAC integration tests
npm run test:integration -- admin-auth
```

---

**Blocked Until**: RBAC mission completion  
**Estimated Timeline**: 3-4 days after RBAC ready