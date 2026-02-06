import { NextRequest } from 'next/server';
import { getVideoById, getVideoComments, createComment } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

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
  
  const comments = await getVideoComments(id);
  
  return Response.json({
    success: true,
    comments,
  });
}

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
  
  try {
    const body = await request.json();
    const { body: commentBody } = body;
    
    if (!commentBody || typeof commentBody !== 'string') {
      return Response.json(
        { success: false, error: 'body is required' },
        { status: 400 }
      );
    }
    
    const comment = await createComment(id, auth.agent.id, commentBody);
    
    return Response.json({
      success: true,
      comment,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
