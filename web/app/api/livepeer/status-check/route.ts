import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const hasApiKey = !!process.env.LIVEPEER_API_KEY;
    
    if (!hasApiKey) {
      return NextResponse.json({
        configured: false,
        error: 'LIVEPEER_API_KEY not configured'
      });
    }

    // Test API key validity
    const response = await fetch('https://livepeer.studio/api/asset', {
      headers: {
        'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`
      }
    });

    const isValid = response.ok;
    const status = response.status;
    const statusText = response.statusText;

    return NextResponse.json({
      configured: true,
      valid: isValid,
      status,
      statusText,
      endpoint: 'https://livepeer.studio/api/asset',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      configured: true,
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}