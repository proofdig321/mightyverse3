require('dotenv').config({ path: './web/.env.local' });

async function testSyncDirect() {
  console.log('🔍 Testing sync endpoint directly...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/livepeer/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('Sync response:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      console.error('Sync failed with status:', response.status);
    }
    
  } catch (error) {
    console.error('Sync request failed:', error.message);
  }
}

testSyncDirect();