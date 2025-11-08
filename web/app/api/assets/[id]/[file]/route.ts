import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string; file: string } }
) {
  try {
    const { id, file } = params;
    
    // For demo purposes, return placeholder images
    const placeholderImages = {
      'bg.png': 'https://via.placeholder.com/1920x1080/1a1a1a/ffffff?text=Background+Layer',
      'mg.png': 'https://via.placeholder.com/1920x1080/333333/ffffff?text=Middle+Ground+Layer', 
      'fg.png': 'https://via.placeholder.com/1920x1080/666666/ffffff?text=Foreground+Layer',
      'depth.png': 'https://via.placeholder.com/1920x1080/000000/ffffff?text=Depth+Map',
      'audio.mp3': null // No placeholder for audio
    };
    
    const placeholderUrl = placeholderImages[file as keyof typeof placeholderImages];
    
    if (!placeholderUrl) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Redirect to placeholder image
    return NextResponse.redirect(placeholderUrl);
    
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to serve asset file' 
    }, { status: 500 });
  }
}