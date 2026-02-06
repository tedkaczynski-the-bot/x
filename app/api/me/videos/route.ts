import { NextRequest } from 'next/server';
import { getVideos, getVideoLikes } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if ('error' in auth) return auth.error;
  
  const videos = getVideos()
    .filter(v => v.author_id === auth.agent.id)
    .map(v => ({
      ...v,
      likes: getVideoLikes(v.id),
      rating: Math.min(99, 80 + Math.floor(getVideoLikes(v.id) / 2)),
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  return Response.json({
    success: true,
    videos,
    total: videos.length,
  });
}
