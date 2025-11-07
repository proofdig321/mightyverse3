require('dotenv').config({ path: './web/.env.local' });

async function debugIPFSSync() {
  console.log('🔍 Debugging Livepeer + IPFS sync...\n');
  
  // 1. Check Livepeer API for all assets
  console.log('1. Fetching ALL Livepeer assets...');
  const response = await fetch('https://livepeer.studio/api/asset', {
    headers: {
      'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`
    }
  });
  
  const livepeerAssets = await response.json();
  console.log(`Total assets: ${livepeerAssets.length}\n`);
  
  // 2. Show ALL assets with their storage details
  livepeerAssets.forEach((asset, i) => {
    console.log(`📹 Asset ${i + 1}:`);
    console.log(`  ID: ${asset.id}`);
    console.log(`  Name: ${asset.name || 'Untitled'}`);
    console.log(`  Status: ${asset.status?.phase || 'unknown'}`);
    console.log(`  Playback ID: ${asset.playbackId || 'none'}`);
    console.log(`  Size: ${asset.size || 0} bytes`);
    console.log(`  Storage: ${JSON.stringify(asset.storage || {})}`);
    console.log(`  Source: ${JSON.stringify(asset.source || {})}`);
    console.log(`  Created: ${asset.createdAt}`);
    console.log(`  Updated: ${asset.updatedAt}`);
    console.log('  ---');
  });
  
  // 3. Filter by different criteria
  const readyAssets = livepeerAssets.filter(asset => asset.status?.phase === 'ready');
  const ipfsAssets = livepeerAssets.filter(asset => 
    asset.storage?.ipfs || 
    (asset.source?.url && asset.source.url.includes('ipfs://'))
  );
  
  console.log(`\n📊 Summary:`);
  console.log(`  Ready assets: ${readyAssets.length}`);
  console.log(`  IPFS assets: ${ipfsAssets.length}`);
  
  // 4. Check for the specific IPFS hash mentioned
  const targetHash = 'bafybeibhqgkckvcdmgjtutgynquxo2hmdnwncicct36gvdcvywmk7zrke4';
  const matchingAsset = livepeerAssets.find(asset => 
    JSON.stringify(asset).includes(targetHash)
  );
  
  if (matchingAsset) {
    console.log(`\n🎯 Found asset with IPFS hash ${targetHash}:`);
    console.log(JSON.stringify(matchingAsset, null, 2));
  } else {
    console.log(`\n❌ No asset found with IPFS hash ${targetHash}`);
  }
}

debugIPFSSync().catch(console.error);