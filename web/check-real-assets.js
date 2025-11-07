#!/usr/bin/env node

/**
 * Check Real Assets in Browser localStorage
 * This will show what's actually stored from your uploads
 */

console.log('To check your real "Test 2" asset data:');
console.log('1. Open browser dev tools (F12)');
console.log('2. Go to Application/Storage tab');
console.log('3. Look at Local Storage for localhost:3000');
console.log('4. Find key: mighty_assets');
console.log('5. Check the JSON data for your real "Test 2" asset');
console.log('');
console.log('Or run this in browser console:');
console.log('JSON.parse(localStorage.getItem("mighty_assets"))');
console.log('');
console.log('This will show if your "Test 2" has:');
console.log('- livepeer_asset_id (if Livepeer worked)');
console.log('- file_cid (if IPFS fallback worked)');
console.log('- upload_method (livepeer_direct vs ipfs_direct)');