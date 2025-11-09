import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    services: {} as any
  };

  // 1. Supabase Connection
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      results.services.supabase = {
        status: 'FAILED',
        error: 'Missing configuration',
        config: { url: !!supabaseUrl, key: !!supabaseKey }
      };
    } else {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.from('assets').select('id').limit(1);
      
      results.services.supabase = {
        status: error ? 'FAILED' : 'SUCCESS',
        error: error?.message,
        url: supabaseUrl,
        keyFormat: supabaseKey.startsWith('sb_') ? 'NEW' : 'LEGACY'
      };
    }
  } catch (error) {
    results.services.supabase = {
      status: 'FAILED',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // 2. Pinata Connection
  try {
    const pinataJWT = process.env.PINATA_JWT;
    if (!pinataJWT) {
      results.services.pinata = { status: 'FAILED', error: 'Missing PINATA_JWT' };
    } else {
      const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
        headers: { 'Authorization': `Bearer ${pinataJWT}` }
      });
      
      results.services.pinata = {
        status: response.ok ? 'SUCCESS' : 'FAILED',
        statusCode: response.status,
        authenticated: response.ok
      };
    }
  } catch (error) {
    results.services.pinata = {
      status: 'FAILED',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // 3. Livepeer Connection
  try {
    const livepeerKey = process.env.LIVEPEER_API_KEY;
    if (!livepeerKey) {
      results.services.livepeer = { status: 'FAILED', error: 'Missing LIVEPEER_API_KEY' };
    } else {
      const response = await fetch('https://livepeer.studio/api/asset', {
        headers: { 'Authorization': `Bearer ${livepeerKey}` }
      });
      
      results.services.livepeer = {
        status: response.ok ? 'SUCCESS' : 'FAILED',
        statusCode: response.status,
        authenticated: response.ok
      };
    }
  } catch (error) {
    results.services.livepeer = {
      status: 'FAILED',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // 4. ThirdWeb Connection
  try {
    const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
    const secretKey = process.env.THIRDWEB_SECRET_KEY;
    
    results.services.thirdweb = {
      status: (clientId && secretKey) ? 'CONFIGURED' : 'MISSING',
      hasClientId: !!clientId,
      hasSecretKey: !!secretKey
    };
  } catch (error) {
    results.services.thirdweb = {
      status: 'FAILED',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // 5. Environment Summary
  results.environment = {
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    appUrl: process.env.NEXT_PUBLIC_APP_URL
  };

  // Overall Status
  const allServices = Object.values(results.services);
  const successCount = allServices.filter((s: any) => s.status === 'SUCCESS' || s.status === 'CONFIGURED').length;
  const totalCount = allServices.length;
  
  results.overall = {
    status: successCount === totalCount ? 'ALL_CONNECTED' : 'PARTIAL_FAILURE',
    connected: successCount,
    total: totalCount,
    percentage: Math.round((successCount / totalCount) * 100)
  };

  return NextResponse.json(results, { 
    status: results.overall.status === 'ALL_CONNECTED' ? 200 : 207 
  });
}