import { NextRequest, NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../../utils/storage/enhanced-data-store';

interface ContentCurationRequest {
  contentId: string;
  contentType: 'asset' | 'mural' | 'card' | 'deck';
  action: 'analyze' | 'approve' | 'reject' | 'enhance';
  metadata?: any;
}

export async function POST(request: NextRequest) {
  try {
    const { contentId, contentType, action, metadata }: ContentCurationRequest = await request.json();

    if (!contentId || !contentType || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: contentId, contentType, action' 
      }, { status: 400 });
    }

    // Get content item
    const table = contentType === 'asset' ? 'assets' : contentType + 's';
    const content = await enhancedDataManager.getItemById(table, contentId);
    
    if (!content) {
      return NextResponse.json({ 
        error: `${contentType} with id ${contentId} not found` 
      }, { status: 404 });
    }

    let result;

    switch (action) {
      case 'analyze':
        result = await analyzeContent(content, contentType);
        break;
      case 'approve':
        result = await approveContent(content, contentType);
        break;
      case 'reject':
        result = await rejectContent(content, contentType, metadata?.reason);
        break;
      case 'enhance':
        result = await enhanceContent(content, contentType);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Create processing job
    await enhancedDataManager.createProcessingJob({
      job_type: `content_${action}`,
      content_id: contentId,
      content_type: contentType,
      status: 'completed',
      progress: 100,
      input_data: { action, metadata },
      output_data: result
    });

    return NextResponse.json({
      success: true,
      action,
      contentId,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Content curation error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Content curation failed'
    }, { status: 500 });
  }
}

async function analyzeContent(content: any, contentType: string) {
  const qualityScore = calculateQualityScore(content);
  const tags = generateTags(content, contentType);
  const issues = identifyIssues(content, qualityScore);
  
  // Store analysis
  await enhancedDataManager.createItem('content_analysis', {
    content_id: content.id,
    content_type: contentType,
    quality_score: qualityScore,
    tags,
    issues,
    analyzed_at: new Date().toISOString()
  });

  return { qualityScore, tags, issues };
}

async function approveContent(content: any, contentType: string) {
  const table = contentType === 'asset' ? 'assets' : contentType + 's';
  await enhancedDataManager.updateItem(table, content.id, {
    status: 'approved',
    approved_at: new Date().toISOString()
  });
  return { status: 'approved' };
}

async function rejectContent(content: any, contentType: string, reason?: string) {
  const table = contentType === 'asset' ? 'assets' : contentType + 's';
  await enhancedDataManager.updateItem(table, content.id, {
    status: 'rejected',
    rejected_at: new Date().toISOString(),
    rejection_reason: reason
  });
  return { status: 'rejected', reason };
}

async function enhanceContent(content: any, contentType: string) {
  const enhancements = [];
  if (!content.thumbnail_cid) enhancements.push('Generate thumbnail');
  if (!content.tags?.length) enhancements.push('Add tags');
  return { enhancements };
}

function calculateQualityScore(content: any): number {
  let score = 0;
  if (content.title || content.name) score += 0.2;
  if (content.description) score += 0.2;
  if (content.file_cid) score += 0.3;
  if (content.metadata) score += 0.2;
  if (content.creator_wallet) score += 0.1;
  return score;
}

function generateTags(content: any, contentType: string): string[] {
  const tags = [contentType];
  if (content.tags) tags.push(...content.tags);
  if (content.asset_type) tags.push(content.asset_type);
  return Array.from(new Set(tags));
}

function identifyIssues(content: any, qualityScore: number): string[] {
  const issues = [];
  if (qualityScore < 0.5) issues.push('Low quality score');
  if (!content.title && !content.name) issues.push('Missing title');
  if (!content.description) issues.push('Missing description');
  return issues;
}