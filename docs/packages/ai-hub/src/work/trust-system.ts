/**
 * file trust-system.ts
 * description 信任系统
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 信任系统
 */
import {
  TrustRecord,
  TrustLevel,
  TrustEvent,
  FamilyMemberWorkProfile,
} from './types';

export class TrustSystem {
  private trustRecords: Map<string, TrustRecord>;
  private accessOrder: string[] = [];
  private readonly maxRecords: number;
  private readonly maxHistoryPerRecord: number = 100;

  constructor(maxRecords: number = 10000) {
    this.trustRecords = new Map();
    this.maxRecords = maxRecords;
  }

  getTrustLevel(userId: string, memberId: string): TrustLevel {
    const record = this.trustRecords.get(`${userId}-${memberId}`);
    return record?.level || 1;
  }

  recordTrustEvent(
    userId: string,
    memberId: string,
    event: Omit<TrustEvent, 'timestamp'>
  ): void {
    const key = `${userId}-${memberId}`;
    
    this.updateAccessOrder(key);
    
    if (this.trustRecords.size >= this.maxRecords) {
      this.evictOldestRecord();
    }

    let record = this.trustRecords.get(key);

    if (!record) {
      record = {
        userId,
        familyMemberId: memberId,
        level: 1,
        history: [],
        lastUpdated: new Date(),
      };
      this.trustRecords.set(key, record);
    }

    const trustEvent: TrustEvent = {
      ...event,
      timestamp: new Date(),
    };

    record.history.push(trustEvent);
    
    if (record.history.length > this.maxHistoryPerRecord) {
      record.history = record.history.slice(-this.maxHistoryPerRecord);
    }
    
    this.recalculateTrustLevel(record);
    record.lastUpdated = new Date();
  }
  
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }
  
  private evictOldestRecord(): void {
    const oldestKey = this.accessOrder.shift();
    if (oldestKey && this.trustRecords.has(oldestKey)) {
      this.trustRecords.delete(oldestKey);
    }
  }

  private recalculateTrustLevel(record: TrustRecord): void {
    const recentEvents = record.history.slice(-50);
    
    if (recentEvents.length < 5) {
      record.level = 1;
      return;
    }

    const avgRating = recentEvents.reduce((sum, e) => sum + e.rating, 0) / recentEvents.length;
    const positiveRate = recentEvents.filter(e => e.action === 'positive').length / recentEvents.length;

    if (avgRating >= 4.8 && positiveRate >= 0.95 && recentEvents.length >= 100) {
      record.level = 5;
    } else if (avgRating >= 4.5 && positiveRate >= 0.90 && recentEvents.length >= 50) {
      record.level = 4;
    } else if (avgRating >= 4.0 && positiveRate >= 0.80 && recentEvents.length >= 10) {
      record.level = 3;
    } else if (positiveRate >= 0.70 && recentEvents.length >= 3) {
      record.level = 2;
    } else {
      record.level = 1;
    }
  }

  getTrustPermissions(level: TrustLevel): string[] {
    switch (level) {
      case 1:
        return ['basic_chat', 'simple_tasks'];
      case 2:
        return [...this.getTrustPermissions(1), 'complex_tasks', 'autonomous_decisions'];
      case 3:
        return [...this.getTrustPermissions(2), 'sensitive_operations', 'batch_tasks'];
      case 4:
        return [...this.getTrustPermissions(3), 'advanced_permissions', 'system_config'];
      case 5:
        return [...this.getTrustPermissions(4), 'full_access', 'represent_family'];
      default:
        return [];
    }
  }

  getMemberTrustSummary(memberId: string): {
    avgLevel: number;
    totalInteractions: number;
    satisfactionRate: number;
  } {
    let totalLevel = 0;
    let count = 0;
    let totalRating = 0;
    let ratingCount = 0;

    this.trustRecords.forEach(record => {
      if (record.familyMemberId === memberId) {
        totalLevel += record.level;
        count++;
        
        record.history.forEach(event => {
          totalRating += event.rating;
          ratingCount++;
        });
      }
    });

    return {
      avgLevel: count > 0 ? totalLevel / count : 1,
      totalInteractions: ratingCount,
      satisfactionRate: ratingCount > 0 ? (totalRating / ratingCount) * 100 : 0,
    };
  }
}
