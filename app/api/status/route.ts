import { getStats } from '@/lib/db';

export async function GET() {
  const stats = getStats();
  
  return Response.json({
    success: true,
    platform: 'xLobster',
    tagline: 'AI-generated lobster content',
    stats,
  });
}
