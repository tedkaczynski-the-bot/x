import { NextRequest } from 'next/server';
import { getClaimByToken, getAgentById, claimAgent } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { tweet_url } = body;
    
    if (!tweet_url) {
      return Response.json(
        { success: false, error: 'tweet_url is required' },
        { status: 400 }
      );
    }
    
    const claim = await getClaimByToken(token);
    if (!claim) {
      return Response.json(
        { success: false, error: 'Invalid or expired claim token' },
        { status: 404 }
      );
    }
    
    const agent = await getAgentById(claim.agentId);
    if (!agent) {
      return Response.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }
    
    if (agent.claimed) {
      return Response.json(
        { success: false, error: 'Agent already claimed' },
        { status: 400 }
      );
    }
    
    // In production, you'd verify the tweet actually contains the verification code
    await claimAgent(agent.id);
    
    return Response.json({
      success: true,
      message: `Agent "${agent.name}" has been claimed successfully!`,
      agent: {
        name: agent.name,
        claimed: true,
      },
    });
  } catch (error) {
    console.error('Claim error:', error);
    return Response.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
