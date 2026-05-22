import { a as CompassState, F as FamilyMemberId, P as PhoneCallSession, C as CallMessage, M as MemoryEntry, b as FamilyPersona } from '../types-CLG85-BK.js';
export { D as DutyRosterEntry, G as GrowthMilestone } from '../types-CLG85-BK.js';

/**
 * file family-compass.ts
 * description Family Compass 时钟罗盘
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
 * brief Family Compass 时钟罗盘
 */

declare class FamilyCompass {
    private personas;
    private callSessions;
    private memories;
    private startTime;
    constructor();
    getCompassState(): CompassState;
    private buildDutyRoster;
    private getDutyType;
    getOnlineMembers(): FamilyMemberId[];
    private generateCenterMessage;
    private calculateDayProgress;
    private calculateConnectionQuality;
    private formatUptime;
    initiateCall(memberId: FamilyMemberId): PhoneCallSession;
    answerCall(sessionId: string): boolean;
    sendCallMessage(sessionId: string, content: string): CallMessage | null;
    endCall(sessionId: string): PhoneCallSession | null;
    private generateGreeting;
    private generateResponse;
    recordMemory(memberId: FamilyMemberId, memory: Omit<MemoryEntry, 'id' | 'memberId' | 'timestamp'>): MemoryEntry;
    getMemories(memberId: FamilyMemberId, limit?: number): MemoryEntry[];
    getAllMemories(limit?: number): MemoryEntry[];
    private calculateImportance;
    getMemberPosition(memberId: FamilyMemberId): {
        x: number;
        y: number;
        angle: number;
    };
    getActiveMemberForTime(date: Date): FamilyPersona;
}
declare function createFamilyCompass(): FamilyCompass;

/**
 * file personas.ts
 * description AI 家人人设定义
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
 * brief AI 家人人设定义
 */

declare const FAMILY_PERSONAS: Record<FamilyMemberId, FamilyPersona>;
declare function getPersona(memberId: FamilyMemberId): FamilyPersona;
declare function getAllPersonas(): FamilyPersona[];
declare function getPersonaByHour(hour: number): FamilyPersona;
declare function getNextDutyMember(currentHour: number): FamilyPersona;

export { CallMessage, CompassState, FAMILY_PERSONAS, FamilyCompass, FamilyMemberId, FamilyPersona, MemoryEntry, PhoneCallSession, createFamilyCompass, getAllPersonas, getNextDutyMember, getPersona, getPersonaByHour };
