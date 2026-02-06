import { getVideos, getVideoLikes } from '@/lib/db';

export async function GET() {
  const videos = getVideos()
    .map(v => ({
      ...v,
      likes: getVideoLikes(v.id),
      rating: Math.min(99, 80 + Math.floor(getVideoLikes(v.id) / 2)),
    }))
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 50)
    .map((video, index) => ({
      rank: index + 1,
      ...video,
    }));
  
  return Response.json({
    success: true,
    videos,
  });
}
