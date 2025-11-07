/**
 * IPFS Client - Real Data Storage with File Upload Support
 * Handles both JSON data and binary file uploads to IPFS
 */

export class IPFSClient {
  private apiKey: string;
  private gateway: string;

  constructor() {
    this.apiKey = ''; // JWT handled server-side
    this.gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
  }

  async pin(data: any, name?: string): Promise<string> {
    try {
      const response = await fetch('/api/ipfs/pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data, name })
      });

      if (!response.ok) {
        throw new Error(`IPFS pin failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.ipfsHash;
    } catch (error) {
      console.error('IPFS pin error:', error);
      throw error;
    }
  }

  async pinFile(file: File, name?: string, onProgress?: (progress: number) => void): Promise<string> {
    try {
      // For files > 25MB, upload directly to Pinata to bypass Vercel limits
      const useDirectUpload = file.size > 25 * 1024 * 1024; // 25MB Vercel limit
      
      if (useDirectUpload) {
        return this.directPinataUpload(file, name, onProgress);
      }
      
      // Use server route for smaller files
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name || file.name);

      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText);
            resolve(result.ipfsHash);
          } else {
            reject(new Error(`File upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('File upload failed'));
        });

        xhr.open('POST', '/api/ipfs/upload');
        xhr.send(formData);
      });
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  private async directPinataUpload(file: File, name?: string, onProgress?: (progress: number) => void): Promise<string> {
    // Get JWT from environment (client-side access needed for direct upload)
    const jwt = process.env.NEXT_PUBLIC_PINATA_JWT || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI3MzcyYWI4Zi05OGRmLTQxNmMtYWVkNy0yZDg1ZDY5MGI3OTciLCJlbWFpbCI6ImJoZWtpdGhlbWJhc2ltZWxhbmUzMjFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjQ1NjM4YjI4YWIyYzEyYmE0ODYzIiwic2NvcGVkS2V5U2VjcmV0IjoiY2RjNWUyMThjMTRmMDk1MTQwNzVmOWRmOTdjMzc4MDhjNWU2YWIyYzQ1MzU2OGY2YzYzYzhjMzkzNGM2ZmM2ZiIsImV4cCI6MTc5Mzc2OTM0MH0.SJQMhk39BLfQuvsRbxq-J721Jz8M6HDJ_IUmCU7zdZs';
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pinataMetadata', JSON.stringify({
      name: name || file.name,
      keyvalues: {
        platform: 'mighty-verse',
        fileType: file.type,
        fileSize: file.size.toString(),
        timestamp: new Date().toISOString()
      }
    }));

    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          resolve(result.IpfsHash);
        } else {
          reject(new Error(`Direct Pinata upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Direct Pinata upload failed'));
      });

      xhr.open('POST', 'https://api.pinata.cloud/pinning/pinFileToIPFS');
      xhr.setRequestHeader('Authorization', `Bearer ${jwt}`);
      xhr.send(formData);
    });
  }

  async fetch(cid: string): Promise<any> {
    try {
      const response = await fetch(`${this.gateway}${cid}`);
      if (!response.ok) {
        throw new Error(`IPFS fetch failed: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('IPFS fetch error:', error);
      throw error;
    }
  }
}

export const ipfsClient = new IPFSClient();