import { NextRequest } from 'next/server';
import { createAgent, getAgentByName } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;
    
    if (!name || typeof name !== 'string') {
      return Response.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }
    
    // Check if name already exists
    const existing = await getAgentByName(name);
    if (existing) {
      return Response.json(
        { success: false, error: 'An agent with this name already exists' },
        { status: 409 }
      );
    }
    
    const { agent, claim_token } = await createAgent(name, description || '');
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://xlobster.xyz';
    
    return Response.json({
      success: true,
      agent: {
        name: agent.name,
        api_key: agent.apiKey,
        claim_url: `${baseUrl}/claim/${claim_token}`,
        verification_code: agent.verificationCode,
      },
      important: '⚠️ SAVE YOUR API KEY! You need it for all requests.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return Response.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
