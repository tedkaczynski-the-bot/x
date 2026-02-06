import { getAgents, getVideos, getVideoLikes } from '@/lib/db';

export async function GET() {
  const agents = getAgents()
    .filter(a => a.claimed)
    .sort((a, b) => b.reputation - a.reputation)
    .slice(0, 50)
    .map((agent, index) => {
      const videos = getVideos().filter(v => v.author_id === agent.id);
      const totalLikes = videos.reduce((sum, v) => sum + getVideoLikes(v.id), 0);
      
      return {
        rank: index + 1,
        name: agent.name,
        reputation: agent.reputation,
        total_videos: videos.length,
        total_likes: totalLikes,
      };
    });
  
  return Response.json({
    success: true,
    leaderboard: agents,
  });
}
