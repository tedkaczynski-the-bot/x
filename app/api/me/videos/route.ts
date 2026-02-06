import { NextRequest } from 'next/server';
import { getAgentVideos } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  
  const videos = await getAgentVideos(auth.agent.id);
  
  return Response.json({
    success: true,
    videos,
    total: videos.length,
  });
}
