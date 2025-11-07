# 📚 THE MIGHTY VERSE - API DOCUMENTATION

## Overview

The Mighty Verse platform provides a comprehensive REST API for managing holographic 2.5D content, blockchain operations, and user interactions. This documentation covers all available endpoints, authentication, and integration patterns.

## Base URL

```
Production: https://api.mightyverse.io
Staging: https://staging-api.mightyverse.io
Development: http://localhost:3000/api
```

## Authentication

### JWT Bearer Token
```http
Authorization: Bearer <jwt_token>
```

### Wallet Signature (EIP-712)
```http
X-Wallet-Address: 0x...
X-Signature: 0x...
X-Message: {...}
```

## Core Endpoints

### 🎬 Assets Management

#### Upload Asset
```http
POST /api/assets/upload
Content-Type: multipart/form-data

{
  "file": <binary>,
  "metadata": {
    "title": "string",
    "description": "string",
    "tags": ["string"],
    "animatorVersion": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assetId": "asset_123",
    "contentCid": "bafybei...",
    "status": "processing"
  }
}
```

#### Get Asset Details
```http
GET /api/assets/{assetId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "asset_123",
    "title": "Super Hero Ego - Verse 1",
    "contentCid": "bafybei...",
    "metadataCid": "bafybei...",
    "layers": {
      "background": "ipfs://...",
      "midground": "ipfs://...",
      "foreground": "ipfs://...",
      "depthMapCid": "ipfs://..."
    },
    "adAnchors": [...],
    "metadata": {
      "confidence": 0.92,
      "qcScore": 0.88,
      "tags": ["verse", "urban"],
      "aiAnalysis": {...}
    },
    "status": "approved",
    "createdAt": "2025-01-27T10:30:00Z"
  }
}
```

### 🔮 Holographic Deck Viewer

#### Get Deck Manifest
```http
GET /api/decks/{deckId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "deck_001",
    "title": "Super Hero Ego",
    "artist": "Golden Shovel",
    "totalCards": 8,
    "duration": 240,
    "animatorVersions": ["futuristic", "gritty"],
    "cards": [...],
    "metadata": {
      "genre": "Hip Hop",
      "isrc": "ZAMV125001234"
    }
  }
}
```

#### Get Card Details
```http
GET /api/cards/{cardId}
```

### ⛓️ Blockchain Operations

#### Request NFT Mint
```http
POST /api/blockchain/mint/request
Authorization: Bearer <jwt_token>

{
  "assetId": "asset_123",
  "recipient": "0x...",
  "amount": 1,
  "network": "polygon"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mintRequestId": "mint_456",
    "status": "pending_approval",
    "estimatedGas": 150000,
    "gasPrice": "20 gwei"
  }
}
```

#### Get Mint Status
```http
GET /api/blockchain/mint/{mintRequestId}
```

### 🎵 Audio Workflows

#### Generate ISRC
```http
POST /api/audio/isrc/generate
Authorization: Bearer <jwt_token>

{
  "title": "Super Hero Ego",
  "artist": "Golden Shovel",
  "contributors": [
    {
      "name": "Golden Shovel",
      "role": "artist",
      "samroId": "12345"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isrc": "ZAMV125001234",
    "status": "reserved",
    "reservedAt": "2025-01-27T10:30:00Z",
    "splitSheet": [...]
  }
}
```

#### Analyze Audio
```http
POST /api/audio/analyze
Content-Type: multipart/form-data

{
  "audioFile": <binary>,
  "includeTranscript": true
}
```

### 📊 Analytics & Monitoring

#### Send Analytics Data
```http
POST /api/analytics
Content-Type: application/json

{
  "sessionId": "session_123",
  "events": [...],
  "performance": {...},
  "timestamp": 1706356200000
}
```

#### Get Platform Health
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": {
      "api": { "healthy": true },
      "ipfs": { "healthy": true },
      "blockchain": { "healthy": true }
    },
    "timestamp": "2025-01-27T10:30:00Z"
  }
}
```

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "title",
      "reason": "Title is required"
    }
  },
  "timestamp": "2025-01-27T10:30:00Z"
}
```

### Error Codes
- `VALIDATION_ERROR` - Invalid input parameters
- `AUTHENTICATION_ERROR` - Invalid or missing authentication
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error
- `BLOCKCHAIN_ERROR` - Blockchain operation failed
- `IPFS_ERROR` - IPFS operation failed

## Rate Limiting

```
Rate Limit: 1000 requests per hour per API key
Burst Limit: 100 requests per minute

Headers:
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1706356800
```

## Webhooks

### Asset Processing Complete
```http
POST <your_webhook_url>
Content-Type: application/json

{
  "event": "asset.processing.complete",
  "data": {
    "assetId": "asset_123",
    "status": "approved",
    "qcScore": 0.88
  },
  "timestamp": "2025-01-27T10:30:00Z"
}
```

### NFT Mint Complete
```http
POST <your_webhook_url>
Content-Type: application/json

{
  "event": "nft.mint.complete",
  "data": {
    "mintRequestId": "mint_456",
    "tokenId": 123,
    "txHash": "0x...",
    "network": "polygon"
  },
  "timestamp": "2025-01-27T10:30:00Z"
}
```

## SDK Integration

### JavaScript/TypeScript SDK
```bash
npm install @mightyverse/sdk
```

```typescript
import { MightyVerseSDK } from '@mightyverse/sdk';

const sdk = new MightyVerseSDK({
  apiKey: 'your_api_key',
  environment: 'production'
});

// Upload asset
const asset = await sdk.assets.upload({
  file: fileBuffer,
  metadata: {
    title: 'My Asset',
    tags: ['verse', 'urban']
  }
});

// Request NFT mint
const mintRequest = await sdk.blockchain.requestMint({
  assetId: asset.id,
  recipient: '0x...'
});
```

### Python SDK
```bash
pip install mightyverse-sdk
```

```python
from mightyverse import MightyVerseSDK

sdk = MightyVerseSDK(
    api_key='your_api_key',
    environment='production'
)

# Upload asset
asset = sdk.assets.upload(
    file=file_data,
    metadata={
        'title': 'My Asset',
        'tags': ['verse', 'urban']
    }
)
```

## Integration Examples

### React Hook for Asset Upload
```typescript
import { useState } from 'react';
import { MightyVerseSDK } from '@mightyverse/sdk';

export function useAssetUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async (file: File, metadata: any) => {
    setUploading(true);
    try {
      const sdk = new MightyVerseSDK({ apiKey: process.env.NEXT_PUBLIC_API_KEY });
      const result = await sdk.assets.upload({
        file,
        metadata,
        onProgress: setProgress
      });
      return result;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, progress };
}
```

### Holographic Deck Integration
```typescript
import { HolographicDeckViewer } from '@mightyverse/react-components';

function MyDeckViewer({ deckId }: { deckId: string }) {
  return (
    <HolographicDeckViewer
      deckId={deckId}
      holographicIntensity={0.8}
      onCardSelect={(card) => console.log('Selected:', card)}
      onAdAnchorClick={(anchor) => console.log('Ad clicked:', anchor)}
    />
  );
}
```

## Support

- **Documentation**: https://docs.mightyverse.io
- **API Status**: https://status.mightyverse.io
- **Support Email**: support@mightyverse.io
- **Discord**: https://discord.gg/mightyverse