import { NextRequest } from 'next/server';
import { getVideoById, getVideoLikes, getVideoComments, incrementVideoViews } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const video = getVideoById(id);
  if (!video) {
    return Response.json(
      { success: false, error: 'Video not found' },
      { status: 404 }
    );
  }
  
  // Increment view count
  incrementVideoViews(id);
  
  const likes = getVideoLikes(id);
  const comments = getVideoComments(id);
  
  return Response.json({
    success: true,
    video: {
      ...video,
      views: video.views + 1, // Include the view we just added
      likes,
      rating: Math.min(99, 80 + Math.floor(likes / 2)),
      comments,
    },
  });
}
