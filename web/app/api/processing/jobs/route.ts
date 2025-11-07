import { NextRequest, NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../../utils/storage/enhanced-data-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const contentType = searchParams.get('content_type');
    
    let jobs = await enhancedDataManager.getData('processing_jobs');
    
    if (status) {
      jobs = jobs.filter(job => job.status === status);
    }
    
    if (contentType) {
      jobs = jobs.filter(job => job.content_type === contentType);
    }
    
    return NextResponse.json({
      success: true,
      jobs,
      count: jobs.length
    });
    
  } catch (error) {
    console.error('Failed to fetch processing jobs:', error);
    return NextResponse.json({
      error: 'Failed to fetch processing jobs'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const jobData = await request.json();
    
    const job = await enhancedDataManager.createProcessingJob({
      job_type: jobData.job_type,
      content_id: jobData.content_id,
      content_type: jobData.content_type,
      status: 'queued',
      progress: 0,
      input_data: jobData.input_data || {},
      output_data: jobData.output_data || {}
    });
    
    return NextResponse.json({
      success: true,
      job
    });
    
  } catch (error) {
    console.error('Failed to create processing job:', error);
    return NextResponse.json({
      error: 'Failed to create processing job'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { jobId, progress, status, output_data, error_message } = await request.json();
    
    if (!jobId) {
      return NextResponse.json({
        error: 'Job ID is required'
      }, { status: 400 });
    }
    
    const updates: any = {};
    if (typeof progress === 'number') updates.progress = progress;
    if (status) updates.status = status;
    if (output_data) updates.output_data = output_data;
    if (error_message) updates.error_message = error_message;
    
    if (status === 'processing') updates.started_at = new Date().toISOString();
    if (status === 'completed' || status === 'failed') updates.completed_at = new Date().toISOString();
    
    const job = await enhancedDataManager.updateItem('processing_jobs', jobId, updates);
    
    return NextResponse.json({
      success: true,
      job
    });
    
  } catch (error) {
    console.error('Failed to update processing job:', error);
    return NextResponse.json({
      error: 'Failed to update processing job'
    }, { status: 500 });
  }
}