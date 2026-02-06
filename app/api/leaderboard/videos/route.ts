import { getVideos } from '@/lib/db';

export async function GET() {
  const videos = await getVideos({ sort: 'top', limit: 50 });
  
  const rankedVideos = videos.map((video, index) => ({
    rank: index + 1,
    ...video,
  }));
  
  return Response.json({
    success: true,
    videos: rankedVideos,
  });
}
