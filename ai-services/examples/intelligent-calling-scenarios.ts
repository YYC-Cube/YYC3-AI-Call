/**
 * @fileoverview 智能外呼核心场景实现
 * @description 展示ASR→NLP→TTS完整链路的实际应用
 * @module ai-services/examples
 * @author YYC³
 * @version 2.0.0
 * @created 2026-05-01
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 *
 * 场景覆盖：
 * 1. 产品介绍外呼 - 自动化产品推广
 * 2. 客户回访跟进 - 满意度调查与需求挖掘
 * 3. 预约提醒服务 - 预约确认与时间安排
 * 4. 投诉处理流程 - 问题识别与解决方案推荐
 * 5. 销售转化引导 - 意向识别与成交推进
 */

import AIPlatform from '../ai-platform';
import { IntelligentCallContext, CallAnalysisResult } from '../ai-platform';

export class IntelligentCallingScenarios {
  private platform: AIPlatform;

  constructor(platform: AIPlatform) {
    this.platform = platform;
  }

  async scenario1_ProductIntroduction(
    audioBuffer: ArrayBuffer,
    customerId: string,
    productName: string
  ): Promise<{
    analysis: CallAnalysisResult;
    audioResponse?: ArrayBuffer;
    nextStep: string;
  }> {
    console.log(`\n🎯 场景1: 产品介绍外呼`);
    console.log(`   客户ID: ${customerId}`);
    console.log(`   产品: ${productName}`);

    const context: IntelligentCallContext = {
      customerId,
      callId: `call-${Date.now()}`,
      stage: 'introduction',
      customerProfile: `潜在客户，对${productName}感兴趣`,
      metadata: {
        scenario: 'product_introduction',
        productName,
      },
    };

    const analysis = await this.platform.analyzeCallAudio(audioBuffer, context);

    console.log(`\n📊 分析结果:`);
    console.log(`   意图: ${analysis.intent.intent} (${(analysis.intent.confidence * 100).toFixed(1)}%)`);
    console.log(`   情感: ${analysis.sentiment.sentiment} (分数: ${analysis.sentiment.score.toFixed(2)})`);
    console.log(`   建议回复: ${analysis.suggestedResponse.slice(0, 100)}...`);
    console.log(`   下一步行动: ${analysis.suggestedAction.action}`);

    if (analysis.suggestedAction.priority === 'high') {
      const audioResponse = await this.platform.synthesizeSpeech(
        analysis.suggestedResponse,
        { emotion: 'happy', voiceId: 'female-warm' }
      );

      return {
        analysis,
        audioResponse: audioResponse.audioBuffer,
        nextStep: analysis.suggestedAction.action,
      };
    }

    return {
      analysis,
      nextStep: analysis.suggestedAction.action,
    };
  }

  async scenario2_CustomerFollowUp(
    audioBuffer: ArrayBuffer,
    customerId: string,
    previousPurchase?: string
  ): Promise<CallAnalysisResult> {
    console.log(`\n🎯 场景2: 客户回访跟进`);
    console.log(`   客户ID: ${customerId}`);
    console.log(`   历史购买: ${previousPurchase || '无'}`);

    const context: IntelligentCallContext = {
      customerId,
      callId: `followup-${Date.now()}`,
      stage: 'needs_analysis',
      customerProfile: `老客户${previousPurchase ? `，曾购买${previousPurchase}` : ''}`,
      previousTranscripts: [
        { role: 'agent', text: '您好，我是YYC³的客服，想了解一下您对我们产品的使用体验', timestamp: new Date(Date.now() - 60000) },
      ],
      metadata: {
        scenario: 'customer_follow_up',
        previousPurchase,
      },
    };

    return await this.platform.analyzeCallAudio(audioBuffer, context);
  }

  async scenario3_AppointmentReminder(
    audioBuffer: ArrayBuffer,
    customerId: string,
    appointmentDetails: {
      date: string;
      time: string;
      service: string;
      location?: string;
    }
  ): Promise<CallAnalysisResult> {
    console.log(`\n🎯 场景3: 预约提醒服务`);
    console.log(`   客户ID: ${customerId}`);
    console.log(`   预约: ${appointmentDetails.date} ${appointmentDetails.time} - ${appointmentDetails.service}`);

    const context: IntelligentCallContext = {
      customerId,
      callId: `appointment-${Date.now()}`,
      stage: 'greeting',
      customerProfile: `已预约客户`,
      metadata: {
        scenario: 'appointment_reminder',
        appointmentDetails,
      },
    };

    return await this.platform.analyzeCallAudio(audioBuffer, context);
  }

  async scenario4_ComplaintHandling(
    audioBuffer: ArrayBuffer,
    customerId: string,
    complaintCategory?: string
  ): Promise<{
    analysis: CallAnalysisResult;
    resolutionSteps: string[];
    escalationNeeded: boolean;
  }> {
    console.log(`\n🎯 场景4: 投诉处理流程`);
    console.log(`   客户ID: ${customerId}`);
    console.log(`   投诉类别: ${complaintCategory || '未知'}`);

    const context: IntelligentCallContext = {
      customerId,
      callId: `complaint-${Date.now()}`,
      stage: 'handling_objections',
      customerProfile: `投诉客户${complaintCategory ? `，问题类型：${complaintCategory}` : ''}`,
      metadata: {
        scenario: 'complaint_handling',
        complaintCategory,
      },
    };

    const analysis = await this.platform.analyzeCallAudio(audioBuffer, context);

    const isEscalationNeeded = 
      analysis.sentiment.sentiment === 'very_negative' ||
      analysis.intent.intent === 'complaint';

    const resolutionSteps = this.generateResolutionSteps(analysis);

    return {
      analysis,
      resolutionSteps,
      escalationNeeded: isEscalationNeeded,
    };
  }

  async scenario5_SalesConversion(
    audioBuffer: ArrayBuffer,
    customerId: string,
    salesContext: {
      product: string;
      priceRange: string;
      promotion?: string;
      urgency?: string;
    }
  ): Promise<{
    analysis: CallAnalysisResult;
    conversionProbability: number;
    closingStrategy: string;
    shouldOfferDiscount: boolean;
  }> {
    console.log(`\n🎯 场景5: 销售转化引导`);
    console.log(`   客户ID: ${customerId}`);
    console.log(`   产品: ${salesContext.product}`);
    console.log(`   价格区间: ${salesContext.priceRange}`);

    const context: IntelligentCallContext = {
      customerId,
      callId: `sales-${Date.now()}`,
      stage: 'closing',
      customerProfile: `高意向客户，关注${salesContext.product}`,
      metadata: {
        scenario: 'sales_conversion',
        salesContext,
      },
    };

    const analysis = await this.platform.analyzeCallAudio(audioBuffer, context);

    const conversionProbability = this.calculateConversionProbability(analysis);
    const closingStrategy = this.generateClosingStrategy(analysis, salesContext);
    const shouldOfferDiscount = this.shouldOfferDiscount(analysis, conversionProbability);

    return {
      analysis,
      conversionProbability,
      closingStrategy,
      shouldOfferDiscount,
    };
  }

  private generateResolutionSteps(analysis: CallAnalysisResult): string[] {
    const steps: string[] = [];

    steps.push('1. 认可客户感受，表达理解');
    
    if (analysis.intent.entities?.some(e => e.type === 'complaint_type')) {
      steps.push('2. 明确具体问题点');
    }

    if (analysis.knowledgeBaseResults.length > 0) {
      steps.push('3. 提供知识库中的解决方案');
    } else {
      steps.push('3. 记录问题并承诺跟进');
    }

    if (analysis.sentiment.score < -0.5) {
      steps.push('4. 必要时升级至高级客服');
    }

    steps.push('5. 确认解决方案并感谢反馈');

    return steps;
  }

  private calculateConversionProbability(analysis: CallAnalysisResult): number {
    let probability = 0.5;

    if (analysis.intent.intent === 'price_negotiation') probability += 0.15;
    if (analysis.intent.intent === 'product_inquiry') probability += 0.2;
    if (analysis.sentiment.sentiment === 'positive' || analysis.sentiment.sentiment === 'very_positive') {
      probability += 0.2;
    }
    if (analysis.overallConfidence > 0.8) probability += 0.1;

    return Math.min(1, Math.max(0, probability));
  }

  private generateClosingStrategy(
    analysis: CallAnalysisResult,
    salesContext: { product: string; priceRange: string; promotion?: string; urgency?: string }
  ): string {
    if (analysis.intent.intent === 'price_negotiation') {
      return `强调产品价值，提及${salesContext.promotion || '限时优惠'}，提供灵活的付款方案`;
    }

    if (analysis.sentiment.sentiment === 'positive' || analysis.sentiment.sentiment === 'very_positive') {
      return `立即推进成交，强调稀缺性（${salesContext.urgency || '库存有限'}），提供额外激励，建议安排专人跟进`;
    }

    if (analysis.intent.intent === 'product_inquiry') {
      return `详细解答疑问，展示成功案例，安排产品演示`;
    }

    return `继续建立信任，收集更多需求信息，为后续跟进做准备`;
  }

  private shouldOfferDiscount(
    analysis: CallAnalysisResult,
    conversionProbability: number
  ): boolean {
    return (
      analysis.intent.intent === 'price_negotiation' &&
      conversionProbability > 0.6 &&
      conversionProbability < 0.85
    );
  }
}

async function demonstrateIntelligentCalling(): Promise<void> {
  console.log('🚀 启动智能外呼系统演示...\n');

  const platform = AIPlatform.getInstance();

  try {
    await platform.initialize();
    console.log('\n✅ AI平台初始化成功\n');

    const scenarios = new IntelligentCallingScenarios(platform);

    console.log('='.repeat(60));
    console.log('📞 智能外呼五大核心场景演示');
    console.log('='.repeat(60));

    console.log('\n📋 可用场景:');
    console.log('   1. 产品介绍外呼 - 自动化产品推广');
    console.log('   2. 客户回访跟进 - 满意度调查与需求挖掘');
    console.log('   3. 预约提醒服务 - 预约确认与时间安排');
    console.log('   4. 投诉处理流程 - 问题识别与解决方案推荐');
    console.log('   5. 销售转化引导 - 意向识别与成交推进');

    console.log('\n💡 使用方法:');
    console.log('   const result = await scenarios.scenario1_ProductIntroduction(');
    console.log('     audioBuffer,');
    console.log('     "customer-123",');
    console.log('     "AI智能呼叫系统"');
    console.log('   );');

    console.log('\n📊 平台状态:');
    const status = platform.getPlatformStatus();
    console.log(JSON.stringify(status, null, 2));

  } catch (error) {
    console.error('❌ 演示失败:', error);
  }
}

if (require.main === module) {
  demonstrateIntelligentCalling();
}

export default IntelligentCallingScenarios;
