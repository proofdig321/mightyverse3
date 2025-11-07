import { NextRequest, NextResponse } from 'next/server';
import { jwtAuth } from '@/lib/jwt-auth';

interface ProcessingJob {
  id: string;
  fileHash: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  results: {
    thumbnailCid?: string;
    metadataCid?: string;
    processedCid?: string;
  };
  createdAt: Date;
  completedAt?: Date;
}

const processingJobs = new Map<string, ProcessingJob>();

export async function POST(request: NextRequest) {
  const token = jwtAuth.extractTokenFromHeader(request.headers.get('authorization'));
  const payload = await jwtAuth.verifyToken(token || '');
  
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { fileHash, processingType, options } = await request.json();
  
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const job: ProcessingJob = {
    id: jobId,
    fileHash,
    status: 'queued',
    progress: 0,
    results: {},
    createdAt: new Date()
  };
  
  processingJobs.set(jobId, job);
  
  // Start processing asynchronously
  processFile(jobId, fileHash, processingType, options);
  
  return NextResponse.json({
    jobId,
    status: 'queued',
    estimatedTime: '2-5 minutes'
  });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get('jobId');
  
  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
  }
  
  const job = processingJobs.get(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  
  return NextResponse.json(job);
}

async function processFile(jobId: string, fileHash: string, processingType: string, options: any) {
  const job = processingJobs.get(jobId);
  if (!job) return;
  
  try {
    job.status = 'processing';
    job.progress = 10;
    
    // Simulate file processing steps
    await simulateProcessingStep(job, 'Downloading from IPFS', 30);
    await simulateProcessingStep(job, 'Analyzing content', 50);
    await simulateProcessingStep(job, 'Generating thumbnails', 70);
    await simulateProcessingStep(job, 'Creating metadata', 90);
    await simulateProcessingStep(job, 'Uploading results', 100);
    
    // Generate mock results
    job.results = {
      thumbnailCid: `Qm${Math.random().toString(36).substr(2, 44)}`,
      metadataCid: `Qm${Math.random().toString(36).substr(2, 44)}`,
      processedCid: processingType === 'optimize' ? `Qm${Math.random().toString(36).substr(2, 44)}` : undefined
    };
    
    job.status = 'completed';
    job.completedAt = new Date();
    
  } catch (error) {
    job.status = 'failed';
    console.error('Processing failed:', error);
  }
}

async function simulateProcessingStep(job: ProcessingJob, step: string, progress: number) {
  job.progress = progress;
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
}