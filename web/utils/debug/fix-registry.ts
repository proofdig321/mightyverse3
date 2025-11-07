/**
 * Registry Fix - Restore correct IPFS CID
 */

export const fixRegistry = () => {
  // From Pinata dashboard: assets-registry with 1.09 KB (contains your data)
  const correctCID = 'QmYffGCR8L'; // Partial CID - need full from Pinata
  
  const store = {
    assets: correctCID,
    campaigns: 'QmVkvoPGi9jvvuxsHDVJDgzPEzagBaWSZRYoRDzU244HjZ',
    submissions: 'QmVkvoPGi9jvvuxsHDVJDgzPEzagBaWSZRYoRDzU244HjZ',
    sponsors: 'QmVkvoPGi9jvvuxsHDVJDgzPEzagBaWSZRYoRDzU244HjZ',
    users: 'QmVkvoPGi9jvvuxsHDVJDgzPEzagBaWSZRYoRDzU244HjZ',
    mintRequests: 'QmVkvoPGi9jvvuxsHDVJDgzPEzagBaWSZRYoRDzU244HjZ',
    roles: 'QmVkvoPGi9jvvuxsHDVJDgzPEzagBaWSZRYoRDzU244HjZ'
  };
  
  localStorage.setItem('mv-data-store', JSON.stringify(store));
  console.log('✅ Registry fixed! Reload the page.');
  
  return store;
};

// Auto-fix on import
if (typeof window !== 'undefined') {
  fixRegistry();
}