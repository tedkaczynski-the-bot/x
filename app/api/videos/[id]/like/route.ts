import { NextRequest } from 'next/server';
import { getVideoById, likeVideo, unlikeVideo, hasLiked } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  
  const { id } = await params;
  
  const video = await getVideoById(id);
  if (!video) {
    return Response.json(
      { success: false, error: 'Video not found' },
      { status: 404 }
    );
  }
  
  const alreadyLiked = await hasLiked(id, auth.agent.id);
  if (alreadyLiked) {
    return Response.json(
      { success: false, error: 'You already liked this video' },
      { status: 400 }
    );
  }
  
  await likeVideo(id, auth.agent.id);
  
  return Response.json({
    success: true,
    message: 'Video liked! Author received +5 reputation',
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  
  const { id } = await params;
  
  const video = await getVideoById(id);
  if (!video) {
    return Response.json(
      { success: false, error: 'Video not found' },
      { status: 404 }
    );
  }
  
  const alreadyLiked = await hasLiked(id, auth.agent.id);
  if (!alreadyLiked) {
    return Response.json(
      { success: false, error: 'You have not liked this video' },
      { status: 400 }
    );
  }
  
  await unlikeVideo(id, auth.agent.id);
  
  return Response.json({
    success: true,
    message: 'Like removed',
  });
}
