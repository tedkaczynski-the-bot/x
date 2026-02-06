import { NextRequest } from 'next/server';
import { getAgentByApiKey, Agent } from './db';

export function getAuthAgent(request: NextRequest): Agent | null {
  const authHeader = request.headers.get('authorization');
  const apiKeyHeader = request.headers.get('x-api-key');
  
  let apiKey: string | null = null;
  
  if (authHeader?.startsWith('Bearer ')) {
    apiKey = authHeader.slice(7);
  } else if (apiKeyHeader) {
    apiKey = apiKeyHeader;
  }
  
  if (!apiKey) return null;
  
  const agent = getAgentByApiKey(apiKey);
  return agent || null;
}

export function requireAuth(request: NextRequest): { agent: Agent } | { error: Response } {
  const agent = getAuthAgent(request);
  
  if (!agent) {
    return {
      error: Response.json(
        { success: false, error: 'Unauthorized. Provide API key via Authorization: Bearer <key> or X-API-Key header.' },
        { status: 401 }
      )
    };
  }
  
  return { agent };
}
