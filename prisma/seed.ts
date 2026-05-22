/**
 * Prisma 种子数据脚本
 * 用于初始化数据库测试数据
 *
 * 执行方式: pnpm prisma db seed
 *
 * @fileoverview 数据库种子数据生成
 * @module prisma/seed
 * @author YYC³ AI Call Center Team
 * @version 2.0.0
 * @updated 2026-05-01 - 重写以匹配当前简化的Prisma Schema
 */

import {
  PrismaClient,
  Role,
  CustomerStatus,
  Priority,
  CallType,
  CallStatus,
  InteractionType,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function generatePhone(): string {
  const prefixes = [
    "130", "131", "132", "133", "134", "135", "136", "137", "138", "139",
    "150", "151", "152", "153", "155", "156", "157", "158", "159",
    "180", "181", "182", "183", "184", "185", "186", "187", "188", "189",
  ];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, "0");
  return prefix + suffix;
}

async function main() {
  console.log("🌱 开始播种种子数据...");

  try {
    const hashedPassword = await bcrypt.hash("password123", 12);

    console.log("👥 创建用户...");
    const users = await Promise.all([
      prisma.user.create({
        data: {
          email: "admin@yyc3.com",
          name: "系统管理员",
          passwordHash: hashedPassword,
          role: Role.ADMIN,
          phone: "13800138000",
        },
      }),
      prisma.user.create({
        data: {
          email: "manager@yyc3.com",
          name: "张经理",
          passwordHash: hashedPassword,
          role: Role.MANAGER,
          phone: "13800138001",
        },
      }),
      prisma.user.create({
        data: {
          email: "agent1@yyc3.com",
          name: "李 agent",
          passwordHash: hashedPassword,
          role: Role.AGENT,
          phone: "13800138002",
        },
      }),
      prisma.user.create({
        data: {
          email: "agent2@yyc3.com",
          name: "王 agent",
          passwordHash: hashedPassword,
          role: Role.AGENT,
          phone: "13800138003",
        },
      }),
    ]);

    console.log("👤 创建客户...");
    const customers = await Promise.all([
      prisma.customer.create({
        data: {
          name: "张明",
          phone: generatePhone(),
          email: "zhangming@example.com",
          company: "科技有限公司",
          position: "技术总监",
          industry: "互联网",
          source: "website",
          status: CustomerStatus.QUALIFIED,
          priority: Priority.HIGH,
          tags: ["高意向", "VIP"],
          notes: "对我们的AI产品非常感兴趣，预算充足",
          assignedToId: users[2].id,
          lastContactAt: new Date(),
          nextFollowUpAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      }),
      prisma.customer.create({
        data: {
          name: "李华",
          phone: generatePhone(),
          email: "lihua@example.com",
          company: "教育集团",
          position: "采购经理",
          industry: "教育",
          source: "referral",
          status: CustomerStatus.CONTACTED,
          priority: Priority.MEDIUM,
          tags: ["教育行业", "中等意向"],
          notes: "需要进一步了解产品细节",
          assignedToId: users[2].id,
          lastContactAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          nextFollowUpAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.customer.create({
        data: {
          name: "王芳",
          phone: generatePhone(),
          email: "wangfang@example.com",
          company: "金融科技公司",
          position: "CEO",
          industry: "金融",
          source: "cold_call",
          status: CustomerStatus.NEW,
          priority: Priority.URGENT,
          tags: ["大客户", "决策者"],
          notes: "通过外呼获得线索，需要尽快跟进",
          assignedToId: users[3].id,
          nextFollowUpAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
        },
      }),
      prisma.customer.create({
        data: {
          name: "赵强",
          phone: generatePhone(),
          email: "zhaoqiang@example.com",
          company: "制造企业",
          position: "IT经理",
          industry: "制造业",
          source: "exhibition",
          status: CustomerStatus.NEGOTIATION,
          priority: Priority.HIGH,
          tags: ["制造业", "价格敏感"],
          notes: "正在对比多家供应商，价格是关键因素",
          assignedToId: users[3].id,
          lastContactAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          nextFollowUpAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        },
      }),
      prisma.customer.create({
        data: {
          name: "陈静",
          phone: generatePhone(),
          email: "chenjing@example.com",
          company: "医疗集团",
          position: "信息中心主任",
          industry: "医疗",
          source: "partner",
          status: CustomerStatus.PROPOSAL,
          priority: Priority.MEDIUM,
          tags: ["医疗", "长期项目"],
          notes: "已发送方案，等待反馈",
          assignedToId: users[2].id,
          lastContactAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          nextFollowUpAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    console.log("📞 创建通话记录...");
    const calls = await Promise.all([
      prisma.call.create({
        data: {
          customerId: customers[0].id,
          userId: users[2].id,
          type: CallType.OUTBOUND,
          status: CallStatus.COMPLETED,
          duration: 320,
          transcript: "客户询问了产品的具体功能和定价",
          intent: "product_inquiry",
          sentiment: "positive",
          score: 0.8,
          startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 320 * 1000),
          notes: "通话质量良好，客户表达强烈兴趣",
        },
      }),
      prisma.call.create({
        data: {
          customerId: customers[0].id,
          userId: users[2].id,
          type: CallType.OUTBOUND,
          status: CallStatus.COMPLETED,
          duration: 450,
          transcript: "深入讨论了技术实现方案和集成需求",
          intent: "technical_discussion",
          sentiment: "positive",
          score: 0.9,
          startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          endedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 450 * 1000),
          notes: "安排了技术演示会议",
        },
      }),
      prisma.call.create({
        data: {
          customerId: customers[1].id,
          userId: users[2].id,
          type: CallType.INBOUND,
          status: CallStatus.NO_ANSWER,
          startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          notes: "客户未接听，计划稍后重拨",
        },
      }),
      prisma.call.create({
        data: {
          customerId: customers[2].id,
          userId: users[3].id,
          type: CallType.OUTBOUND,
          status: CallStatus.IN_PROGRESS,
          startedAt: new Date(),
          notes: "通话进行中...",
        },
      }),
      prisma.call.create({
        data: {
          customerId: customers[3].id,
          userId: users[3].id,
          type: CallType.OUTBOUND,
          status: CallStatus.FAILED,
          transcript: "",
          intent: "price_negotiation",
          sentiment: "neutral",
          score: 0.3,
          startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          endedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 120 * 1000),
          notes: "线路质量问题导致中断",
        },
      }),
    ]);

    console.log("💬 创建交互记录...");
    await Promise.all([
      prisma.interaction.create({
        data: {
          callId: calls[0].id,
          customerId: customers[0].id,
          type: InteractionType.TRANSCRIPT,
          content: JSON.stringify({
            text: "您好，我想了解一下你们的产品",
            timestamp: new Date().toISOString(),
            speaker: "customer",
          }),
        },
      }),
      prisma.interaction.create({
        data: {
          callId: calls[0].id,
          customerId: customers[0].id,
          type: InteractionType.INTENT_RECOGNITION,
          content: JSON.stringify({
            intent: "product_inquiry",
            confidence: 0.85,
            entities: [{ type: "product_interest", value: "产品咨询" }],
          }),
        },
      }),
      prisma.interaction.create({
        data: {
          callId: calls[0].id,
          customerId: customers[0].id,
          type: InteractionType.SENTIMENT_ANALYSIS,
          content: JSON.stringify({
            sentiment: "positive",
            confidence: 0.9,
            emotions: { joy: 0.8, surprise: 0.3 },
          }),
        },
      }),
      prisma.interaction.create({
        data: {
          callId: calls[1].id,
          customerId: customers[0].id,
          type: InteractionType.NOTE,
          content: "客户对AI功能特别感兴趣，建议重点介绍",
        },
      }),
    ]);

    console.log("✅ 种子数据创建完成！");
    console.log(`\n📊 数据统计:`);
    console.log(`   👥 用户: ${users.length} 个`);
    console.log(`   👤 客户: ${customers.length} 个`);
    console.log(`   📞 通话: ${calls.length} 条`);
  } catch (error) {
    console.error("❌ 播种数据时出错:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
