#!/usr/bin/env node

/**
 * Livepeer API Test Script
 * Tests connectivity and basic functionality
 */

const LIVEPEER_API_KEY = "99764289-df40-4cba-ab77-3105df4bf7a9";

async function testLivepeerAPI() {
  console.log('🎬 Testing Livepeer API connectivity...\n');

  try {
    // Test 1: List assets
    console.log('1. Testing asset listing...');
    const listResponse = await fetch('https://livepeer.studio/api/asset', {
      headers: {
        'Authorization': `Bearer ${LIVEPEER_API_KEY}`
      }
    });

    if (!listResponse.ok) {
      throw new Error(`Asset list failed: ${listResponse.status} ${listResponse.statusText}`);
    }

    const assets = await listResponse.json();
    console.log(`✅ Found ${assets.length} existing assets`);
    
    if (assets.length > 0) {
      console.log('Recent assets:');
      assets.slice(0, 3).forEach(asset => {
        console.log(`  - ${asset.name} (${asset.id}) - Status: ${asset.status?.phase || 'unknown'}`);
        if (asset.playbackId) {
          console.log(`    Playback: https://lp-playback.com/hls/${asset.playbackId}/index.m3u8`);
        }
      });
    }

    // Test 2: Request upload URL
    console.log('\n2. Testing upload URL request...');
    const uploadResponse = await fetch('https://livepeer.studio/api/asset/request-upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LIVEPEER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `test-upload-${Date.now()}`,
        storage: { ipfs: true }
      })
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload request failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    const uploadData = await uploadResponse.json();
    console.log(`✅ Upload URL generated for asset: ${uploadData.asset.id}`);
    console.log(`   Upload URL: ${uploadData.url.substring(0, 50)}...`);

    // Test 3: Check asset status
    console.log('\n3. Testing asset status check...');
    const statusResponse = await fetch(`https://livepeer.studio/api/asset/${uploadData.asset.id}`, {
      headers: {
        'Authorization': `Bearer ${LIVEPEER_API_KEY}`
      }
    });

    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.status} ${statusResponse.statusText}`);
    }

    const statusData = await statusResponse.json();
    console.log(`✅ Asset status: ${statusData.status?.phase || 'unknown'}`);

    console.log('\n🎉 All Livepeer API tests passed!');
    console.log('\nNext steps:');
    console.log('1. Upload a test video file via /admin/upload');
    console.log('2. Check processing status in admin dashboard');
    console.log('3. Verify HLS playback URLs are generated');

  } catch (error) {
    console.error('❌ Livepeer API test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check LIVEPEER_API_KEY in .env.local');
    console.log('2. Verify API key has correct permissions');
    console.log('3. Check network connectivity');
  }
}

testLivepeerAPI();