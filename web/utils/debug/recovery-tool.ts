/**
 * Data Recovery Tool - Search for lost IPFS data
 */

export class DataRecovery {
  private gateway = 'https://gateway.pinata.cloud/ipfs/';

  // Known CIDs that might contain data (from git history or logs)
  private knownCIDs = [
    'QmVkvoPGi9jvvuxsHDVJDgzPEzagBaWSZRYoRDzU244HjZ', // Current empty
    'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn', // Empty array
    // Add any CIDs from browser history or logs
  ];

  async searchForData(): Promise<any> {
    const results = {
      timestamp: new Date().toISOString(),
      searchResults: [] as any[],
      possibleRecovery: [] as any[]
    };

    // Test known CIDs
    for (const cid of this.knownCIDs) {
      try {
        const response = await fetch(`${this.gateway}${cid}`);
        if (response.ok) {
          const data = await response.json();
          results.searchResults.push({
            cid,
            accessible: true,
            data,
            isArray: Array.isArray(data),
            length: Array.isArray(data) ? data.length : 0
          });

          if (Array.isArray(data) && data.length > 0) {
            results.possibleRecovery.push({ cid, data });
          }
        }
      } catch (error) {
        results.searchResults.push({
          cid,
          accessible: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  async testCID(cid: string): Promise<any> {
    try {
      const response = await fetch(`${this.gateway}${cid}`);
      if (!response.ok) {
        return { accessible: false, error: `HTTP ${response.status}` };
      }
      
      const data = await response.json();
      return { 
        accessible: true, 
        data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 0,
        hasAssets: Array.isArray(data) && data.some((item: any) => item.fileCid || item.type)
      };
    } catch (error) {
      return { 
        accessible: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Generate test data to verify upload still works
  generateTestAsset() {
    return {
      id: Date.now().toString(),
      name: "Test Recovery Animation",
      description: "Test to verify upload system works",
      type: "animation",
      status: "approved",
      fileCid: "QmTestCID123", // Fake CID for testing
      thumbnailCid: null,
      fileName: "test.mp4",
      fileSize: 1024000,
      mimeType: "video/mp4",
      metadata: {
        duration: 30,
        format: "video/mp4"
      },
      creator: "recovery-test",
      uploadedAt: new Date().toISOString(),
      uploadedBy: "recovery-test",
      createdAt: new Date().toISOString()
    };
  }
}

export const dataRecovery = new DataRecovery();