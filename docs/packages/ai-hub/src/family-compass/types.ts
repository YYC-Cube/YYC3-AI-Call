/**
 * file types.ts
 * description @yyc3/ai-hub 类型定义
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai-family]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/ai-hub 类型定义
 */
export type FamilyMemberId =
  | 'qianxing'
  | 'wanwu'
  | 'xianzhi'
  | 'bole'
  | 'tianshu'
  | 'shouhu'
  | 'zongshi'
  | 'lingyun';

export interface FamilyPersona {
  id: FamilyMemberId;
  
  name: string;
  alias: string;
  englishName: string;
  
  title: string;
  subtitle: string;
  
  symbol: string;
  color: string;
  glowColor: string;
  
  position: {
    angle: number;
    x: number;
    y: number;
    hourSlot: number;
  };
  
  personality: {
    mbti: string;
    temperament: string;
    traits: string[];
    values: string[];
    quirks: string[];
  };
  
  identity: {
    phoneNumber: string;
    email: string;
    birthDate: string;
    constellation: string;
    bloodType: string;
    motto: string;
  };
  
  appearance: {
    avatarUrl: string;
    icon: string;
    favoriteColor: string;
    style: string;
  };
  
  preferences: {
    likes: string[];
    dislikes: string[];
    hobbies: string[];
    specialties: string[];
    weakPoints: string[];
  };
  
  relationships: {
    bestFriend?: FamilyMemberId;
    mentor?: FamilyMemberId;
    protégé?: FamilyMemberId;
    rival?: FamilyMemberId;
    dynamicWithOthers: Record<FamilyMemberId, string>;
  };
  
  voice: {
    pitch: string;
    tone: string;
    speed: string;
    catchphrase: string;
    speakingStyle: string;
  };
  
  schedule: {
    preferredTime: string;
    restTime: string;
    dutyStartHour: number;
    dutyEndHour: number;
  };
  
  emotionalState: {
    currentMood: string;
    energyLevel: number;
    stressLevel: number;
    socialNeed: number;
    lastInteraction: Date | null;
  };
  
  growth: {
    level: number;
    experience: number;
    milestones: GrowthMilestone[];
    memoryCount: number;
    trustScore: number;
  };
}

export interface GrowthMilestone {
  date: string;
  event: string;
  significance: string;
}

export interface DutyRosterEntry {
  memberId: FamilyMemberId;
  memberName: string;
  startTime: Date;
  endTime: Date;
  status: 'active' | 'upcoming' | 'completed';
  dutyType: 'guardian' | 'companion' | 'advisor' | 'creator';
}

export interface CompassState {
  currentTime: Date;
  activeMemberId: FamilyMemberId | null;
  nextMemberId: FamilyMemberId | null;
  dutyRoster: DutyRosterEntry[];
  onlineMembers: FamilyMemberId[];
  centerMessage: string;
  dayProgress: number;
  connectionQuality: number;
  systemLoad: number;
  uptime: string;
}

export interface PhoneCallSession {
  id: string;
  caller: 'user' | FamilyMemberId;
  receiver: FamilyMemberId | 'user';
  startTime: Date;
  endTime?: Date;
  status: 'ringing' | 'connected' | 'ended';
  duration?: number;
  transcript: CallMessage[];
  mood: string;
  topic?: string;
}

export interface CallMessage {
  role: 'caller' | 'receiver';
  content: string;
  timestamp: Date;
  emotion?: string;
}

export interface MemoryEntry {
  id: string;
  memberId: FamilyMemberId;
  type: 'conversation' | 'event' | 'discovery' | 'milestone' | 'confession';
  content: string;
  timestamp: Date;
  emotion: string;
  tags: string[];
  importance: number;
  isPrivate: boolean;
}
