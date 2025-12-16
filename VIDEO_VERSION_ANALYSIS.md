# Video Version Management Analysis

## Current State: No Version Handling

### Standard MP4 Upload Flow
1. **Upload**: `/api/livepeer/upload` processes MP4s
2. **Storage**: Creates single `assets` record
3. **Problem**: No grouping for same song/different animators

### Missing Features for Version Management

#### 1. Content Grouping
```typescript
// MISSING: No way to group related content
interface ContentGroup {
  id: string;
  title: string; // "Super Hero Ego"
  artist: string; // Original artist
  versions: ContentVersion[];
}

interface ContentVersion {
  id: string;
  group_id: string;
  animator_wallet: string;
  animator_style: 'futuristic' | 'gritty' | 'cultural' | 'minimal';
  asset_id: string; // Links to assets table
  version_number: number;
  is_primary: boolean;
}
```

#### 2. Duplicate Detection
```typescript
// MISSING: No duplicate prevention
interface DuplicateCheck {
  title_similarity: number;
  audio_fingerprint?: string;
  duration_match: boolean;
  existing_versions: ContentVersion[];
}
```

#### 3. Version Comparison
```typescript
// MISSING: No version comparison system
interface VersionComparison {
  group_id: string;
  versions: {
    animator: string;
    style: string;
    quality_score: number;
    view_count: number;
    rating: number;
  }[];
}
```

## Required Implementation

### Fix 1: Add Content Groups Table
```sql
CREATE TABLE content_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  original_artist VARCHAR(255),
  genre VARCHAR(100),
  duration INTEGER, -- seconds
  audio_fingerprint TEXT,
  primary_version_id UUID,
  total_versions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES content_groups(id),
  asset_id UUID REFERENCES assets(id),
  animator_wallet VARCHAR(42) NOT NULL,
  animator_style VARCHAR(50) NOT NULL,
  version_number INTEGER NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  quality_score DECIMAL(3,2),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, animator_wallet, animator_style)
);
```

### Fix 2: Enhanced Upload with Version Detection
```typescript
// In /api/livepeer/upload/route.ts - ADD after asset creation:

// Check for existing content groups
const existingGroups = await enhancedDataManager.searchItems(
  'content_groups', 
  name || file.name, 
  ['title']
);

let contentGroup;
let versionNumber = 1;

if (existingGroups.length > 0) {
  // Found similar content - check if it's the same song
  const similarGroup = existingGroups.find(group => 
    group.title.toLowerCase() === (name || file.name).toLowerCase() &&
    Math.abs((group.duration || 0) - (metadata.duration || 0)) < 10 // Within 10 seconds
  );
  
  if (similarGroup) {
    contentGroup = similarGroup;
    const existingVersions = await enhancedDataManager.getData('content_versions');
    const groupVersions = existingVersions.filter(v => v.group_id === similarGroup.id);
    versionNumber = groupVersions.length + 1;
    
    // Update total versions count
    await enhancedDataManager.updateItem('content_groups', similarGroup.id, {
      total_versions: versionNumber,
      updated_at: new Date().toISOString()
    });
  }
}

if (!contentGroup) {
  // Create new content group
  contentGroup = await enhancedDataManager.createItem('content_groups', {
    title: name || file.name,
    original_artist: metadata.artist || 'Unknown',
    genre: category || 'Digital Art',
    duration: metadata.duration || 180,
    total_versions: 1
  });
}

// Create version record
const contentVersion = await enhancedDataManager.createItem('content_versions', {
  group_id: contentGroup.id,
  asset_id: assetData.id,
  animator_wallet: creatorWallet,
  animator_style: metadata.animator_style || 'standard',
  version_number: versionNumber,
  is_primary: versionNumber === 1, // First version is primary
  quality_score: 0.8 // Default score
});

// Update asset with version info
await enhancedDataManager.updateItem('assets', assetData.id, {
  content_group_id: contentGroup.id,
  version_id: contentVersion.id,
  is_primary_version: contentVersion.is_primary
});
```

### Fix 3: Version Management API
```typescript
// NEW: /api/content-groups/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('id');
  
  if (groupId) {
    // Get specific group with all versions
    const group = await enhancedDataManager.getItemById('content_groups', groupId);
    const versions = await enhancedDataManager.getData('content_versions');
    const groupVersions = versions.filter(v => v.group_id === groupId);
    
    // Get asset details for each version
    const versionsWithAssets = await Promise.all(
      groupVersions.map(async (version) => {
        const asset = await enhancedDataManager.getItemById('assets', version.asset_id);
        return { ...version, asset };
      })
    );
    
    return NextResponse.json({
      success: true,
      group: { ...group, versions: versionsWithAssets }
    });
  } else {
    // Get all groups with version counts
    const groups = await enhancedDataManager.getData('content_groups');
    return NextResponse.json({ success: true, groups });
  }
}
```

### Fix 4: Version Comparison Component
```typescript
// NEW: /components/VersionComparison.tsx
interface VersionComparisonProps {
  groupId: string;
}

export default function VersionComparison({ groupId }: VersionComparisonProps) {
  const [group, setGroup] = useState<any>(null);
  
  useEffect(() => {
    fetch(`/api/content-groups?id=${groupId}`)
      .then(res => res.json())
      .then(data => setGroup(data.group));
  }, [groupId]);
  
  if (!group) return <div>Loading versions...</div>;
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{group.title} - All Versions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {group.versions.map((version: any) => (
          <div key={version.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{version.animator_style}</h3>
              {version.is_primary && (
                <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs">
                  PRIMARY
                </span>
              )}
            </div>
            
            <HolographicVideoPlayer
              fileCid={version.asset?.file_cid}
              thumbnailCid={version.asset?.thumbnail_cid}
              mimeType={version.asset?.mime_type}
              title={`Version ${version.version_number}`}
              className="w-full aspect-video mb-2"
            />
            
            <div className="text-sm text-gray-600 space-y-1">
              <div>Animator: {version.animator_wallet.slice(0, 8)}...</div>
              <div>Quality: {(version.quality_score * 100).toFixed(0)}%</div>
              <div>Views: {version.view_count}</div>
            </div>
            
            <button className="w-full mt-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Select This Version
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Summary

**Current Problem**: Standard MP4s are uploaded as isolated assets with no version management.

**Solution**: Implement content grouping system that:
1. **Groups related content** by title/duration similarity
2. **Tracks animator versions** with style classifications
3. **Prevents duplicates** while allowing legitimate variations
4. **Enables version comparison** for users to choose preferred styles
5. **Maintains primary version** designation for default playback

This creates a proper version management system for the same song/content across different animator interpretations.