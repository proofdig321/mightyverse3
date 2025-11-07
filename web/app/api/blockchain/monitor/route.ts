import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

interface Transaction {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: number;
  gasPrice?: string;
  blockNumber?: number;
  confirmations: number;
  createdAt: Date;
  updatedAt: Date;
}

const transactions = new Map<string, Transaction>();

export async function POST(request: NextRequest) {
  const { txHash } = await request.json();
  
  if (!txHash) {
    return NextResponse.json({ error: 'Transaction hash required' }, { status: 400 });
  }

  transactions.set(txHash, {
    hash: txHash,
    status: 'pending',
    confirmations: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Start monitoring
  monitorTransaction(txHash);

  return NextResponse.json({ 
    hash: txHash, 
    status: 'monitoring_started',
    estimatedConfirmationTime: '2-5 minutes'
  });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const txHash = url.searchParams.get('hash');
  
  if (!txHash) {
    return NextResponse.json({ error: 'Transaction hash required' }, { status: 400 });
  }

  const tx = transactions.get(txHash);
  if (!tx) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  return NextResponse.json(tx);
}

async function monitorTransaction(txHash: string) {
  const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
  
  try {
    const receipt = await provider.waitForTransaction(txHash, 1);
    const tx = transactions.get(txHash);
    
    if (tx) {
      tx.status = receipt.status === 1 ? 'confirmed' : 'failed';
      tx.gasUsed = receipt.gasUsed.toNumber();
      tx.blockNumber = receipt.blockNumber;
      tx.confirmations = 1;
      tx.updatedAt = new Date();
      
      // Continue monitoring for more confirmations
      setTimeout(() => updateConfirmations(txHash), 30000);
    }
  } catch (error) {
    const tx = transactions.get(txHash);
    if (tx) {
      tx.status = 'failed';
      tx.updatedAt = new Date();
    }
  }
}

async function updateConfirmations(txHash: string) {
  const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
  const tx = transactions.get(txHash);
  
  if (!tx || tx.status !== 'confirmed') return;

  try {
    const currentBlock = await provider.getBlockNumber();
    if (tx.blockNumber) {
      tx.confirmations = currentBlock - tx.blockNumber + 1;
      tx.updatedAt = new Date();
      
      // Continue monitoring until 12 confirmations
      if (tx.confirmations < 12) {
        setTimeout(() => updateConfirmations(txHash), 30000);
      }
    }
  } catch (error) {
    console.error('Error updating confirmations:', error);
  }
}