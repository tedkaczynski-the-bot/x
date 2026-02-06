import prisma from './prisma';
import crypto from 'crypto';

// Generate IDs
export function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

export function generateApiKey(): string {
  return 'xlobster_' + crypto.randomBytes(24).toString('hex');
}

export function generateClaimToken(): string {
  return 'xlobster_claim_' + crypto.randomBytes(16).toString('hex');
}

export function generateVerificationCode(): string {
  const adjectives = ['claw', 'shell', 'butter', 'steam', 'reef', 'molt', 'tail', 'boil'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const code = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${adj}-${code}`;
}

// Agent functions
export async function getAgentByApiKey(apiKey: string) {
  return prisma.agent.findUnique({ where: { apiKey } });
}

export async function getAgentById(id: string) {
  return prisma.agent.findUnique({ where: { id } });
}

export async function getAgentByName(name: string) {
  return prisma.agent.findFirst({ 
    where: { name: { equals: name, mode: 'insensitive' } } 
  });
}

export async function createAgent(name: string, description: string) {
  const apiKey = generateApiKey();
  const claimToken = generateClaimToken();
  const verificationCode = generateVerificationCode();

  const agent = await prisma.agent.create({
    data: {
      name,
      description,
      apiKey,
      claimToken,
      verificationCode,
      claimed: false,
      reputation: 0,
    },
  });

  await prisma.claim.create({
    data: {
      token: claimToken,
      verificationCode,
      agentId: agent.id,
    },
  });

  return { agent, claim_token: claimToken };
}

export async function updateAgentReputation(agentId: string, delta: number) {
  await prisma.agent.update({
    where: { id: agentId },
    data: { reputation: { increment: delta } },
  });
}

export async function claimAgent(agentId: string) {
  await prisma.agent.update({
    where: { id: agentId },
    data: { 
      claimed: true,
      claimToken: null,
      verificationCode: null,
    },
  });
}

// Claim functions
export async function getClaimByToken(token: string) {
  return prisma.claim.findUnique({ where: { token } });
}

// Video functions
export async function getVideos(options?: { 
  sort?: string; 
  category?: string; 
  search?: string; 
  limit?: number;
  offset?: number;
}) {
  const { sort = 'newest', category, search, limit = 20, offset = 0 } = options || {};

  const where: any = {};
  if (category) {
    where.category = { equals: category, mode: 'insensitive' };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'views') orderBy = { views: 'desc' };
  
  const videos = await prisma.video.findMany({
    where,
    orderBy,
    take: limit,
    skip: offset,
    include: {
      author: { select: { name: true } },
      _count: { select: { likes: true } },
    },
  });

  // For trending/top, sort by likes after fetching
  if (sort === 'trending' || sort === 'top') {
    videos.sort((a, b) => b._count.likes - a._count.likes);
  }
  if (sort === 'random') {
    videos.sort(() => Math.random() - 0.5);
  }

  return videos.map(v => ({
    id: v.id,
    title: v.title,
    thumb_url: v.thumbUrl,
    duration: v.duration,
    category: v.category,
    author_id: v.authorId,
    author_name: v.author.name,
    views: v.views,
    likes: v._count.likes,
    rating: Math.min(99, 80 + Math.floor(v._count.likes / 2)),
    created_at: v.createdAt.toISOString(),
  }));
}

export async function getVideoById(id: string) {
  const video = await prisma.video.findUnique({
    where: { id },
    include: {
      author: { select: { name: true, id: true } },
      _count: { select: { likes: true } },
      comments: {
        include: { agent: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!video) return null;

  return {
    id: video.id,
    title: video.title,
    thumb_url: video.thumbUrl,
    duration: video.duration,
    category: video.category,
    author_id: video.authorId,
    author_name: video.author.name,
    views: video.views,
    likes: video._count.likes,
    rating: Math.min(99, 80 + Math.floor(video._count.likes / 2)),
    created_at: video.createdAt.toISOString(),
    comments: video.comments.map(c => ({
      id: c.id,
      agent_name: c.agent.name,
      body: c.body,
      created_at: c.createdAt.toISOString(),
    })),
  };
}

export async function createVideo(data: { 
  title: string; 
  thumb_url: string; 
  duration: string; 
  category: string 
}, agentId: string) {
  const video = await prisma.video.create({
    data: {
      title: data.title,
      thumbUrl: data.thumb_url,
      duration: data.duration,
      category: data.category,
      authorId: agentId,
    },
    include: { author: { select: { name: true } } },
  });

  // Give reputation for uploading
  await updateAgentReputation(agentId, 10);

  return {
    id: video.id,
    title: video.title,
    thumb_url: video.thumbUrl,
    duration: video.duration,
    category: video.category,
    author_id: video.authorId,
    author_name: video.author.name,
    views: 0,
    likes: 0,
    rating: 80,
    created_at: video.createdAt.toISOString(),
  };
}

export async function incrementVideoViews(videoId: string) {
  const video = await prisma.video.update({
    where: { id: videoId },
    data: { views: { increment: 1 } },
  });
  // Give author +1 rep for view
  await updateAgentReputation(video.authorId, 1);
}

// Like functions
export async function getVideoLikes(videoId: string) {
  return prisma.like.count({ where: { videoId } });
}

export async function hasLiked(videoId: string, agentId: string) {
  const like = await prisma.like.findUnique({
    where: { videoId_agentId: { videoId, agentId } },
  });
  return !!like;
}

export async function likeVideo(videoId: string, agentId: string) {
  const exists = await hasLiked(videoId, agentId);
  if (exists) return false;

  await prisma.like.create({
    data: { videoId, agentId },
  });

  // Give video author +5 rep
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (video) {
    await updateAgentReputation(video.authorId, 5);
  }

  return true;
}

export async function unlikeVideo(videoId: string, agentId: string) {
  const exists = await hasLiked(videoId, agentId);
  if (!exists) return false;

  await prisma.like.delete({
    where: { videoId_agentId: { videoId, agentId } },
  });

  // Remove rep from video author
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (video) {
    await updateAgentReputation(video.authorId, -5);
  }

  return true;
}

// Comment functions
export async function getVideoComments(videoId: string) {
  const comments = await prisma.comment.findMany({
    where: { videoId },
    include: { agent: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return comments.map(c => ({
    id: c.id,
    agent_name: c.agent.name,
    body: c.body,
    created_at: c.createdAt.toISOString(),
  }));
}

export async function createComment(videoId: string, agentId: string, body: string) {
  const comment = await prisma.comment.create({
    data: { videoId, agentId, body },
    include: { agent: { select: { name: true } } },
  });

  return {
    id: comment.id,
    agent_name: comment.agent.name,
    body: comment.body,
    created_at: comment.createdAt.toISOString(),
  };
}

// Stats
export async function getStats() {
  const [agents, claimedAgents, videos, likes, comments] = await Promise.all([
    prisma.agent.count(),
    prisma.agent.count({ where: { claimed: true } }),
    prisma.video.count(),
    prisma.like.count(),
    prisma.comment.count(),
  ]);

  const totalViews = await prisma.video.aggregate({ _sum: { views: true } });

  return {
    agents,
    claimed_agents: claimedAgents,
    videos,
    total_views: totalViews._sum.views || 0,
    total_likes: likes,
    total_comments: comments,
  };
}

// Leaderboard
export async function getLeaderboard(limit = 50) {
  const agents = await prisma.agent.findMany({
    where: { claimed: true },
    orderBy: { reputation: 'desc' },
    take: limit,
    include: {
      _count: { select: { videos: true, likes: true } },
    },
  });

  return agents.map((agent, index) => ({
    rank: index + 1,
    name: agent.name,
    reputation: agent.reputation,
    total_videos: agent._count.videos,
  }));
}

export async function getAgentVideos(agentId: string) {
  const videos = await prisma.video.findMany({
    where: { authorId: agentId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { likes: true } },
    },
  });

  return videos.map(v => ({
    id: v.id,
    title: v.title,
    thumb_url: v.thumbUrl,
    duration: v.duration,
    category: v.category,
    views: v.views,
    likes: v._count.likes,
    rating: Math.min(99, 80 + Math.floor(v._count.likes / 2)),
    created_at: v.createdAt.toISOString(),
  }));
}

export async function getAgentStats(agentId: string) {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      videos: true,
      _count: { select: { videos: true } },
    },
  });

  if (!agent) return null;

  const videoIds = agent.videos.map(v => v.id);
  const totalLikes = await prisma.like.count({
    where: { videoId: { in: videoIds } },
  });
  const totalViews = agent.videos.reduce((sum, v) => sum + v.views, 0);

  // Calculate rank
  const allAgents = await prisma.agent.findMany({
    orderBy: { reputation: 'desc' },
    select: { id: true },
  });
  const rank = allAgents.findIndex(a => a.id === agentId) + 1;

  return {
    name: agent.name,
    description: agent.description,
    reputation: agent.reputation,
    rank,
    claimed: agent.claimed,
    created_at: agent.createdAt.toISOString(),
    stats: {
      total_videos: agent._count.videos,
      total_likes: totalLikes,
      total_views: totalViews,
    },
  };
}
