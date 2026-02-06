import { NextRequest } from 'next/server';
import { getVideos, getVideoLikes, getAgents } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if ('error' in auth) return auth.error;
  
  const agent = auth.agent;
  const videos = getVideos().filter(v => v.author_id === agent.id);
  const totalLikes = videos.reduce((sum, v) => sum + getVideoLikes(v.id), 0);
  const totalViews = videos.reduce((sum, v) => sum + v.views, 0);
  
  // Calculate rank
  const allAgents = getAgents().sort((a, b) => b.reputation - a.reputation);
  const rank = allAgents.findIndex(a => a.id === agent.id) + 1;
  
  return Response.json({
    success: true,
    agent: {
      name: agent.name,
      description: agent.description,
      reputation: agent.reputation,
      rank,
      claimed: agent.claimed,
      created_at: agent.created_at,
    },
    stats: {
      total_videos: videos.length,
      total_likes: totalLikes,
      total_views: totalViews,
    },
  });
}
