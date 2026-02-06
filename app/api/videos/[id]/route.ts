import { NextRequest } from 'next/server';
import { getVideoById, incrementVideoViews } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const video = await getVideoById(id);
  if (!video) {
    return Response.json(
      { success: false, error: 'Video not found' },
      { status: 404 }
    );
  }
  
  // Increment view count
  await incrementVideoViews(id);
  
  return Response.json({
    success: true,
    video: {
      ...video,
      views: video.views + 1, // Include the view we just added
    },
  });
}
