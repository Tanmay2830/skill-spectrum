
export enum ViewMode {
  LOGIN = 'LOGIN',
  UNIVERSE = 'UNIVERSE',
  SIMULATION = 'SIMULATION',
}

export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  HR_ADMIN = 'HR_ADMIN',
}

export interface SkillNode {
  id: string;
  name: string;
  type: 'GALAXY' | 'PLANET' | 'MOON' | 'TEAM' | 'USER';
  description: string;
  parentId?: string;
  radius: number;
  color: string;
  readiness: number; // 0-100
  demand: number; // 0-100 (Gravity)
  decay?: number; // 0-100, where 100 is fully decayed/forgotten
  teamStats?: { subject: string; A: number; fullMark: number }[]; // For Radar Chart
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface SimulationMessage {
  role: 'user' | 'system' | 'ai';
  content: string;
  timestamp: Date;
  type?: 'text' | 'code' | 'alert' | 'image' | 'video' | 'map' | 'search';
  metadata?: any;
}

export interface SimulationScenario {
  title: string;
  objective: string;
  difficulty: 'Junior' | 'Mid' | 'Senior';
  initialContext: string;
}

export interface UserState {
  role: UserRole;
  name: string;
  title: string;
  level: number;
  xp: number;
}

export interface LearningResource {
  id: string;
  title: string;
  provider: 'YOUTUBE' | 'UDEMY' | 'DOCS' | 'INTERNAL';
  url: string; // ID for youtube, full URL for others
  description: string;
  relevance: string; // AI generated explanation of why this matters for the task
  tags: string[];
  thumbnail?: string;
  viewCount?: string;
  publishedAt?: string;
  pathStep?: string; // e.g. "Phase 1: Foundations"
}
