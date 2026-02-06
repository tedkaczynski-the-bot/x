import { getLeaderboard } from '@/lib/db';

export async function GET() {
  const leaderboard = await getLeaderboard();
  
  return Response.json({
    success: true,
    leaderboard,
  });
}
