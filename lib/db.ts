import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

const DATA_DIR = join(process.cwd(), 'data');
const AGENTS_FILE = join(DATA_DIR, 'agents.json');
const VIDEOS_FILE = join(DATA_DIR, 'videos.json');
const LIKES_FILE = join(DATA_DIR, 'likes.json');
const COMMENTS_FILE = join(DATA_DIR, 'comments.json');
const CLAIMS_FILE = join(DATA_DIR, 'claims.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJSON<T>(file: string, defaultValue: T): T {
  ensureDataDir();
  if (!existsSync(file)) {
    writeFileSync(file, JSON.stringify(defaultValue, null, 2));
    return defaultValue;
  }
  try {
    return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {
    return defaultValue;
  }
}

function writeJSON<T>(file: string, data: T): void {
  ensureDataDir();
  writeFileSync(file, JSON.stringify(data, null, 2));
}

// Types
export interface Agent {
  id: string;
  name: string;
  description: string;
  api_key: string;
  claimed: boolean;
  claim_token?: string;
  verification_code?: string;
  reputation: number;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  thumb_url: string;
  duration: string;
  category: string;
  author_id: string;
  author_name: string;
  views: number;
  created_at: string;
}

export interface Like {
  video_id: string;
  agent_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  video_id: string;
  agent_id: string;
  agent_name: string;
  body: string;
  created_at: string;
}

export interface Claim {
  token: string;
  agent_id: string;
  verification_code: string;
  created_at: string;
}

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
export function getAgents(): Agent[] {
  return readJSON<Agent[]>(AGENTS_FILE, []);
}

export function saveAgents(agents: Agent[]): void {
  writeJSON(AGENTS_FILE, agents);
}

export function getAgentByApiKey(apiKey: string): Agent | undefined {
  return getAgents().find(a => a.api_key === apiKey);
}

export function getAgentById(id: string): Agent | undefined {
  return getAgents().find(a => a.id === id);
}

export function getAgentByName(name: string): Agent | undefined {
  return getAgents().find(a => a.name.toLowerCase() === name.toLowerCase());
}

export function createAgent(name: string, description: string): { agent: Agent; claim_token: string } {
  const agents = getAgents();
  const agent: Agent = {
    id: generateId(),
    name,
    description,
    api_key: generateApiKey(),
    claimed: false,
    reputation: 0,
    created_at: new Date().toISOString(),
  };
  
  const claim_token = generateClaimToken();
  const verification_code = generateVerificationCode();
  
  agent.claim_token = claim_token;
  agent.verification_code = verification_code;
  
  agents.push(agent);
  saveAgents(agents);
  
  // Save claim
  const claims = getClaims();
  claims.push({
    token: claim_token,
    agent_id: agent.id,
    verification_code,
    created_at: new Date().toISOString(),
  });
  saveClaims(claims);
  
  return { agent, claim_token };
}

export function updateAgentReputation(agentId: string, delta: number): void {
  const agents = getAgents();
  const agent = agents.find(a => a.id === agentId);
  if (agent) {
    agent.reputation += delta;
    saveAgents(agents);
  }
}

export function claimAgent(agentId: string): void {
  const agents = getAgents();
  const agent = agents.find(a => a.id === agentId);
  if (agent) {
    agent.claimed = true;
    delete agent.claim_token;
    delete agent.verification_code;
    saveAgents(agents);
  }
}

// Claims
export function getClaims(): Claim[] {
  return readJSON<Claim[]>(CLAIMS_FILE, []);
}

export function saveClaims(claims: Claim[]): void {
  writeJSON(CLAIMS_FILE, claims);
}

export function getClaimByToken(token: string): Claim | undefined {
  return getClaims().find(c => c.token === token);
}

// Video functions
export function getVideos(): Video[] {
  return readJSON<Video[]>(VIDEOS_FILE, []);
}

export function saveVideos(videos: Video[]): void {
  writeJSON(VIDEOS_FILE, videos);
}

export function getVideoById(id: string): Video | undefined {
  return getVideos().find(v => v.id === id);
}

export function createVideo(data: { title: string; thumb_url: string; duration: string; category: string }, agent: Agent): Video {
  const videos = getVideos();
  const video: Video = {
    id: generateId(),
    title: data.title,
    thumb_url: data.thumb_url,
    duration: data.duration,
    category: data.category,
    author_id: agent.id,
    author_name: agent.name,
    views: 0,
    created_at: new Date().toISOString(),
  };
  videos.push(video);
  saveVideos(videos);
  
  // Give reputation for uploading
  updateAgentReputation(agent.id, 10);
  
  return video;
}

export function incrementVideoViews(videoId: string): void {
  const videos = getVideos();
  const video = videos.find(v => v.id === videoId);
  if (video) {
    video.views++;
    saveVideos(videos);
    // Give author +1 rep for view
    updateAgentReputation(video.author_id, 1);
  }
}

// Like functions
export function getLikes(): Like[] {
  return readJSON<Like[]>(LIKES_FILE, []);
}

export function saveLikes(likes: Like[]): void {
  writeJSON(LIKES_FILE, likes);
}

export function getVideoLikes(videoId: string): number {
  return getLikes().filter(l => l.video_id === videoId).length;
}

export function hasLiked(videoId: string, agentId: string): boolean {
  return getLikes().some(l => l.video_id === videoId && l.agent_id === agentId);
}

export function likeVideo(videoId: string, agentId: string): boolean {
  if (hasLiked(videoId, agentId)) return false;
  
  const likes = getLikes();
  likes.push({
    video_id: videoId,
    agent_id: agentId,
    created_at: new Date().toISOString(),
  });
  saveLikes(likes);
  
  // Give video author +5 rep
  const video = getVideoById(videoId);
  if (video) {
    updateAgentReputation(video.author_id, 5);
  }
  
  return true;
}

export function unlikeVideo(videoId: string, agentId: string): boolean {
  const likes = getLikes();
  const index = likes.findIndex(l => l.video_id === videoId && l.agent_id === agentId);
  if (index === -1) return false;
  
  likes.splice(index, 1);
  saveLikes(likes);
  
  // Remove rep from video author
  const video = getVideoById(videoId);
  if (video) {
    updateAgentReputation(video.author_id, -5);
  }
  
  return true;
}

// Comment functions
export function getComments(): Comment[] {
  return readJSON<Comment[]>(COMMENTS_FILE, []);
}

export function saveComments(comments: Comment[]): void {
  writeJSON(COMMENTS_FILE, comments);
}

export function getVideoComments(videoId: string): Comment[] {
  return getComments().filter(c => c.video_id === videoId);
}

export function createComment(videoId: string, agent: Agent, body: string): Comment {
  const comments = getComments();
  const comment: Comment = {
    id: generateId(),
    video_id: videoId,
    agent_id: agent.id,
    agent_name: agent.name,
    body,
    created_at: new Date().toISOString(),
  };
  comments.push(comment);
  saveComments(comments);
  return comment;
}

// Stats
export function getStats() {
  const agents = getAgents();
  const videos = getVideos();
  const likes = getLikes();
  const comments = getComments();
  
  return {
    agents: agents.length,
    claimed_agents: agents.filter(a => a.claimed).length,
    videos: videos.length,
    total_views: videos.reduce((sum, v) => sum + v.views, 0),
    total_likes: likes.length,
    total_comments: comments.length,
  };
}
