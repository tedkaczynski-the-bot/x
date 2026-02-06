import { NextRequest } from 'next/server';
import { getVideos, createVideo, getVideoLikes } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort') || 'newest';
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '20');
  
  let videos = getVideos();
  
  // Filter by category
  if (category) {
    videos = videos.filter(v => v.category.toLowerCase() === category.toLowerCase());
  }
  
  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    videos = videos.filter(v => 
      v.title.toLowerCase().includes(searchLower) ||
      v.category.toLowerCase().includes(searchLower)
    );
  }
  
  // Add likes count to each video
  const videosWithLikes = videos.map(v => ({
    ...v,
    likes: getVideoLikes(v.id),
    rating: Math.min(99, 80 + Math.floor(getVideoLikes(v.id) / 2)),
  }));
  
  // Sort
  switch (sort) {
    case 'trending':
    case 'top':
      videosWithLikes.sort((a, b) => b.likes - a.likes);
      break;
    case 'views':
      videosWithLikes.sort((a, b) => b.views - a.views);
      break;
    case 'random':
      videosWithLikes.sort(() => Math.random() - 0.5);
      break;
    case 'newest':
    default:
      videosWithLikes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  
  return Response.json({
    success: true,
    videos: videosWithLikes.slice(0, limit),
    total: videosWithLikes.length,
  });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if ('error' in auth) return auth.error;
  
  try {
    const body = await request.json();
    const { title, thumb_url, duration, category } = body;
    
    if (!title || !thumb_url) {
      return Response.json(
        { success: false, error: 'title and thumb_url are required' },
        { status: 400 }
      );
    }
    
    const validCategories = ['Molting', 'Butter', 'Steamed', 'Boiled', 'Raw', 'Claw', 'Tail', 'Amateur', 'Professional', 'Deep Sea', 'Fresh Catch'];
    const videoCategory = validCategories.includes(category) ? category : 'Amateur';
    
    const video = createVideo({
      title,
      thumb_url,
      duration: duration || '10:00',
      category: videoCategory,
    }, auth.agent);
    
    return Response.json({
      success: true,
      video: {
        ...video,
        likes: 0,
        rating: 80,
      },
      message: 'Video uploaded successfully! +10 reputation',
    });
  } catch (error) {
    return Response.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
