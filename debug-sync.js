const fs = require('fs');
require('dotenv').config({ path: './web/.env.local' });

async function debugSync() {
  console.log('🔍 Debugging Livepeer sync...\n');
  
  // 1. Check Livepeer API
  console.log('1. Fetching Livepeer assets...');
  const response = await fetch('https://livepeer.studio/api/asset', {
    headers: {
      'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`
    }
  });
  
  const livepeerAssets = await response.json();
  console.log(`Total assets: ${livepeerAssets.length}`);
  
  // 2. Filter ready assets
  const readyAssets = livepeerAssets.filter(asset => asset.status?.phase === 'ready');
  console.log(`Ready assets: ${readyAssets.length}`);
  
  // 3. Show ready assets details
  readyAssets.forEach((asset, i) => {
    console.log(`\n📹 Asset ${i + 1}:`);
    console.log(`  ID: ${asset.id}`);
    console.log(`  Name: ${asset.name}`);
    console.log(`  Status: ${asset.status?.phase}`);
    console.log(`  Playback ID: ${asset.playbackId}`);
    console.log(`  Size: ${asset.size} bytes`);
    console.log(`  Created: ${asset.createdAt}`);
  });
  
  // 4. Check existing assets in our system
  console.log('\n4. Checking existing assets in our system...');
  try {
    const assetsData = fs.readFileSync('./web/data/assets.json', 'utf8');
    const existingAssets = JSON.parse(assetsData);
    console.log(`Existing assets in system: ${existingAssets.length}`);
    
    // Check for duplicates
    const livepeerIds = existingAssets
      .filter(a => a.livepeer_asset_id)
      .map(a => a.livepeer_asset_id);
    
    console.log(`Assets with Livepeer IDs: ${livepeerIds.length}`);
    console.log('Livepeer IDs in system:', livepeerIds);
    
    // Check which ready assets would be synced
    const toSync = readyAssets.filter(asset => !livepeerIds.includes(asset.id));
    console.log(`\n🔄 Assets that would be synced: ${toSync.length}`);
    toSync.forEach(asset => {
      console.log(`  - ${asset.name} (${asset.id})`);
    });
    
  } catch (error) {
    console.log('No existing assets file or error reading:', error.message);
  }
}

debugSync().catch(console.error);