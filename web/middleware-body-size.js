// This file should be placed in the root directory as middleware.js
// to handle large file uploads globally

import { NextResponse } from 'next/server';

export function middleware(request) {
  // Only apply to upload routes
  if (request.nextUrl.pathname.includes('/upload')) {
    const contentLength = request.headers.get('content-length');
    
    if (contentLength && parseInt(contentLength) > 200 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 200MB.' },
        { status: 413 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/livepeer/upload', '/api/ipfs/upload']
};