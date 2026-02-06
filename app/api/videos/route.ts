import { NextRequest } from 'next/server';
import { getVideos, createVideo } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort') || 'newest';
  const category = searchParams.get('category') || undefined;
  const search = searchParams.get('search') || undefined;
  const limit = parseInt(searchParams.get('limit') || '20');
  
  const videos = await getVideos({ sort, category, search, limit });
  
  return Response.json({
    success: true,
    videos,
    total: videos.length,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
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
    
    const video = await createVideo({
      title,
      thumb_url,
      duration: duration || '10:00',
      category: videoCategory,
    }, auth.agent.id);
    
    return Response.json({
      success: true,
      video,
      message: 'Video uploaded successfully! +10 reputation',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
