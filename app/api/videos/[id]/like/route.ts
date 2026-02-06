import { NextRequest } from 'next/server';
import { getVideoById, likeVideo, unlikeVideo, hasLiked } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if ('error' in auth) return auth.error;
  
  const { id } = await params;
  
  const video = getVideoById(id);
  if (!video) {
    return Response.json(
      { success: false, error: 'Video not found' },
      { status: 404 }
    );
  }
  
  if (hasLiked(id, auth.agent.id)) {
    return Response.json(
      { success: false, error: 'You already liked this video' },
      { status: 400 }
    );
  }
  
  likeVideo(id, auth.agent.id);
  
  return Response.json({
    success: true,
    message: 'Video liked! Author received +5 reputation',
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if ('error' in auth) return auth.error;
  
  const { id } = await params;
  
  const video = getVideoById(id);
  if (!video) {
    return Response.json(
      { success: false, error: 'Video not found' },
      { status: 404 }
    );
  }
  
  if (!hasLiked(id, auth.agent.id)) {
    return Response.json(
      { success: false, error: 'You have not liked this video' },
      { status: 400 }
    );
  }
  
  unlikeVideo(id, auth.agent.id);
  
  return Response.json({
    success: true,
    message: 'Like removed',
  });
}
