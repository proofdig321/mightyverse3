import { NextRequest, NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../utils/storage/enhanced-data-store';
import { ipfsClient } from '../../../utils/storage/ipfs-client';
import { LayerValidator } from '../../../utils/validation/layer-validator';

// CREATE - Upload new layer set
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract and validate mural data
    const muralData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      duration: parseInt(formData.get('duration') as string),
      animatorVersion: formData.get('animatorVersion') as any,
      creatorWallet: formData.get('creatorWallet') as string
    };
    
    const muralValidation = LayerValidator.validateMuralData(muralData);
    if (!muralValidation.isValid) {
      return NextResponse.json({ 
        success: false, 
        errors: muralValidation.errors 
      }, { status: 400 });
    }
    
    // Extract and validate layer files
    const layerFiles = {
      background: formData.get('background') as File,
      midground: formData.get('midground') as File,
      foreground: formData.get('foreground') as File,
      depthMap: formData.get('depthMap') as File
    };
    
    const fileValidation = LayerValidator.validateLayerFiles(layerFiles);
    if (!fileValidation.isValid) {
      return NextResponse.json({ 
        success: false, 
        errors: fileValidation.errors 
      }, { status: 400 });
    }
    
    const sanitizedData = muralValidation.sanitized!;
    
    // Upload files to IPFS
    const layerCids: Record<string, string> = {};
    const uploadPromises = Object.entries(layerFiles).map(async ([layerType, file]) => {
      if (file && file.size > 0) {
        try {
          const sanitizedName = LayerValidator.sanitizeFilename(
            `${sanitizedData.title}-${layerType}-${Date.now()}`
          );
          const cid = await ipfsClient.pinFile(file, sanitizedName);
          layerCids[layerType] = cid;
        } catch (error) {
          throw new Error(`Failed to upload ${layerType}: ${error}`);
        }
      }
    });
    
    await Promise.all(uploadPromises);
    
    // Create mural record
    const mural = await enhancedDataManager.createItem('murals', {
      title: sanitizedData.title,
      artist_wallet: sanitizedData.creatorWallet,
      description: sanitizedData.description,
      total_duration: sanitizedData.duration,
      total_frames: sanitizedData.duration * 16,
      frame_rate: 16,
      default_version: sanitizedData.animatorVersion,
      animator_versions: [sanitizedData.animatorVersion],
      status: 'draft',
      metadata: {
        upload_method: 'manual_layers',
        layer_count: Object.keys(layerCids).length
      }
    });
    
    // Create card with layers
    const card = await enhancedDataManager.createItem('cards', {
      mural_id: mural.id,
      title: `${sanitizedData.title} - Main Card`,
      start_frame: 0,
      end_frame: sanitizedData.duration * 16,
      duration: sanitizedData.duration,
      animator_version: sanitizedData.animatorVersion,
      layers: layerCids,
      status: 'completed',
      metadata: {
        confidence: 0.95,
        qc_score: 0.90,
        tags: ['holographic', '2.5d', 'manual-upload']
      }
    });
    
    // MCP Integration - FIXED ENDPOINT
    if (process.env.MCP_ENDPOINT && process.env.MCP_AUTH_TOKEN) {
      try {
        // Process holographic layers
        await fetch(`${process.env.MCP_ENDPOINT}/api/mcp/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MCP_AUTH_TOKEN}`
          },
          body: JSON.stringify({
            task: 'process_holographic_content',
            payload: { 
              muralId: mural.id, 
              cardId: card.id,
              layers: layerCids,
              assetType: 'holographic_mural'
            }
          })
        });

        // Generate ISRC for the mural
        await fetch(`${process.env.MCP_ENDPOINT}/api/mcp/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MCP_AUTH_TOKEN}`
          },
          body: JSON.stringify({
            task: 'generate_isrc',
            payload: { 
              assetId: mural.id,
              contentType: 'video' // Murals are video-like content
            }
          })
        });

        // Quality analysis
        await fetch(`${process.env.MCP_ENDPOINT}/api/mcp/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MCP_AUTH_TOKEN}`
          },
          body: JSON.stringify({
            task: 'analyze_content_quality',
            payload: { 
              assetId: mural.id,
              asset: {
                resolution: '2.5D',
                duration: sanitizedData.duration,
                layer_count: Object.keys(layerCids).length
              }
            }
          })
        });
        
      } catch (mcpError) {
        console.warn('MCP processing failed:', mcpError);
      }
    }

    // n8n webhook notification
    if (process.env.N8N_WEBHOOK_URL) {
      try {
        await fetch(process.env.N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'holographic_mural_created',
            muralId: mural.id,
            cardId: card.id,
            layers: layerCids,
            timestamp: new Date().toISOString()
          })
        });
      } catch (n8nError) {
        console.warn('n8n notification failed:', n8nError);
      }
    }
    
    return NextResponse.json({
      success: true,
      mural,
      card,
      layerCids,
      message: 'Holographic layers uploaded and processed successfully'
    });
    
  } catch (error) {
    console.error('Layer upload failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }, { status: 500 });
  }
}

// READ - Get all murals with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const creatorWallet = searchParams.get('creator');
    const status = searchParams.get('status');
    
    let murals = await enhancedDataManager.getData('murals');
    
    // Filter by creator if specified
    if (creatorWallet && LayerValidator.isValidWallet(creatorWallet)) {
      murals = murals.filter(m => m.artist_wallet?.toLowerCase() === creatorWallet.toLowerCase());
    }
    
    // Filter by status if specified
    if (status && ['draft', 'submitted', 'approved', 'published', 'archived'].includes(status)) {
      murals = murals.filter(m => m.status === status);
    }
    
    // Sort by creation date (newest first)
    murals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // Pagination
    const total = murals.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedMurals = murals.slice(offset, offset + limit);
    
    // Get cards for each mural
    const muralsWithCards = await Promise.all(
      paginatedMurals.map(async (mural) => {
        try {
          const cards = await enhancedDataManager.getData('cards');
          const muralCards = cards.filter(c => c.mural_id === mural.id);
          return { ...mural, cards: muralCards };
        } catch (error) {
          console.warn(`Failed to load cards for mural ${mural.id}:`, error);
          return { ...mural, cards: [] };
        }
      })
    );
    
    return NextResponse.json({
      success: true,
      murals: muralsWithCards,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('Failed to fetch murals:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch murals'
    }, { status: 500 });
  }
}