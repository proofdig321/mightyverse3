import { NextRequest, NextResponse } from 'next/server';
import { jwtAuth } from '@/lib/jwt-auth';

interface ApprovalWorkflow {
  id: string;
  assetId: string;
  status: 'pending' | 'approved' | 'rejected';
  stages: ApprovalStage[];
  currentStage: number;
  submittedBy: string;
  createdAt: Date;
}

interface ApprovalStage {
  name: string;
  approver: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: Date;
  comments?: string;
}

const workflows = new Map<string, ApprovalWorkflow>();

export async function POST(request: NextRequest) {
  const token = jwtAuth.extractTokenFromHeader(request.headers.get('authorization'));
  const payload = await jwtAuth.verifyToken(token || '');
  
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { assetId, type } = await request.json();
  const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const stages: ApprovalStage[] = type === 'premium' ? [
    { name: 'Quality Check', approver: 'system', status: 'pending' },
    { name: 'Content Review', approver: 'admin', status: 'pending' },
    { name: 'Final Approval', approver: 'super_admin', status: 'pending' }
  ] : [
    { name: 'Auto Review', approver: 'system', status: 'pending' }
  ];

  workflows.set(workflowId, {
    id: workflowId,
    assetId,
    status: 'pending',
    stages,
    currentStage: 0,
    submittedBy: payload.sub,
    createdAt: new Date()
  });

  // Auto-approve system stage for basic assets
  if (type !== 'premium') {
    setTimeout(() => autoApprove(workflowId, 0), 1000);
  }

  return NextResponse.json({ workflowId, status: 'created' });
}

export async function PUT(request: NextRequest) {
  const token = jwtAuth.extractTokenFromHeader(request.headers.get('authorization'));
  const payload = await jwtAuth.verifyToken(token || '');
  
  if (!payload || !payload.roles.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { workflowId, action, comments } = await request.json();
  const workflow = workflows.get(workflowId);
  
  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  const currentStage = workflow.stages[workflow.currentStage];
  currentStage.status = action;
  currentStage.approvedAt = new Date();
  currentStage.comments = comments;

  if (action === 'approved' && workflow.currentStage < workflow.stages.length - 1) {
    workflow.currentStage++;
  } else {
    workflow.status = action;
  }

  return NextResponse.json({ status: 'updated', workflow });
}

function autoApprove(workflowId: string, stageIndex: number) {
  const workflow = workflows.get(workflowId);
  if (workflow && workflow.stages[stageIndex]) {
    workflow.stages[stageIndex].status = 'approved';
    workflow.stages[stageIndex].approvedAt = new Date();
    workflow.status = 'approved';
  }
}