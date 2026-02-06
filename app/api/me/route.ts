import { NextRequest } from 'next/server';
import { getAgentStats } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  
  const stats = await getAgentStats(auth.agent.id);
  
  if (!stats) {
    return Response.json(
      { success: false, error: 'Agent not found' },
      { status: 404 }
    );
  }
  
  return Response.json({
    success: true,
    agent: {
      name: stats.name,
      description: stats.description,
      reputation: stats.reputation,
      rank: stats.rank,
      claimed: stats.claimed,
      created_at: stats.created_at,
    },
    stats: stats.stats,
  });
}
