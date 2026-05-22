/**
 * 数据库连接与数据验证脚本
 * 用于验证 PostgreSQL 连接和 Prisma 配置是否正常
 *
 * 执行方式: pnpm db:verify
 *
 * @fileoverview 数据库健康检查与数据完整性验证
 * @module scripts/verify-db
 * @author YYC³ AI Call Center Team
 * @version 2.0.0
 * @updated 2026-05-01 - 重写以匹配当前简化的Prisma Schema
 */

import { PrismaClient, CustomerStatus, Role } from "@prisma/client";
import prisma from "../lib/db";

const db = prisma || new PrismaClient();

async function checkDBHealth(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("数据库连接失败:", error);
    return false;
  }
}

async function getDBInfo(): Promise<{
  version: string;
  users: number;
  customers: number;
  calls: number;
}> {
  const [result] = await db.$queryRaw`SELECT version()` as any[];
  const version = result?.version || "unknown";

  const [users, customers, calls] = await Promise.all([
    db.user.count(),
    db.customer.count(),
    db.call.count(),
  ]);

  return { version, users, customers, calls };
}

async function verifyTableData() {
  console.log("\n📊 验证表数据...\n");

  const tables = [
    { name: "User", model: db.user },
    { name: "Customer", model: db.customer },
    { name: "Call", model: db.call },
    { name: "Interaction", model: db.interaction },
    { name: "Session", model: db.session },
    { name: "AuditLog", model: db.auditLog },
  ];

  const results = [];

  for (const table of tables) {
    try {
      const count = await (table.model as any).count();
      results.push({ name: table.name, count, status: "✅" });
      console.log(
        `  ${table.name.padEnd(20)} ${count.toString().padStart(5)} 条`,
      );
    } catch (error: any) {
      results.push({
        name: table.name,
        count: 0,
        status: "❌",
        error: error.message,
      });
      console.log(`  ${table.name.padEnd(20)} ❌ 错误`);
    }
  }

  return results;
}

async function verifyRelations() {
  console.log("\n🔗 验证数据关系...\n");

  try {
    const customerWithCalls = await db.customer.findFirst({
      where: { calls: { some: {} } },
      include: { calls: true },
    });

    if (customerWithCalls) {
      console.log(
        `  ✅ 客户-通话记录关系: ${customerWithCalls.name} 有 ${customerWithCalls.calls.length} 条通话记录`,
      );
    } else {
      console.log("  ⚠️  未找到有通话记录的客户");
    }

    const userWithCustomers = await db.user.findFirst({
      where: { customers: { some: {} } },
      include: { customers: true },
    });

    if (userWithCustomers) {
      console.log(
        `  ✅ 用户-客户关系: ${userWithCustomers.name} 管理 ${userWithCustomers.customers.length} 个客户`,
      );
    } else {
      console.log("  ⚠️  未找到管理客户的用户");
    }

    const callWithInteractions = await db.call.findFirst({
      where: { interactions: { some: {} } },
      include: { interactions: true },
    });

    if (callWithInteractions) {
      console.log(
        `  ✅ 通话-交互记录关系: 通话 #${callWithInteractions.id.slice(0, 8)} 有 ${callWithInteractions.interactions.length} 条交互记录`,
      );
    } else {
      console.log("  ⚠️  未找到有交互记录的通话");
    }

    return true;
  } catch (error: any) {
    console.error("  ❌ 关系验证失败:", error.message);
    return false;
  }
}

async function verifyIndexes() {
  console.log("\n🔍 验证数据库索引...\n");

  try {
    const indexes = (await db.$queryRaw`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `) as any[];

    console.log(`  ✅ 找到 ${indexes.length} 个索引`);

    indexes.slice(0, 5).forEach((idx: any) => {
      console.log(`     - ${idx.tablename}.${idx.indexname}`);
    });

    if (indexes.length > 5) {
      console.log(`     ... 还有 ${indexes.length - 5} 个索引`);
    }

    return true;
  } catch (error: any) {
    console.error("  ❌ 索引验证失败:", error.message);
    return false;
  }
}

async function verifyFullTextSearch() {
  console.log("\n🔎 验证全文搜索功能...\n");

  try {
    const searchTerm = "科技";
    const searchResults = await db.customer.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { company: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: 5,
    });

    console.log(
      `  ✅ 全文搜索 "${searchTerm}": 找到 ${searchResults.length} 个结果`,
    );
    searchResults.forEach((r) => {
      console.log(`     - ${r.name} (${r.company})`);
    });

    return true;
  } catch (error: any) {
    console.error("  ❌ 全文搜索验证失败:", error.message);
    return false;
  }
}

async function main() {
  console.log("🔍 开始数据库验证...\n");
  console.log("=".repeat(60));

  console.log("\n💓 数据库健康检查...\n");
  const isHealthy = await checkDBHealth();
  if (isHealthy) {
    console.log("  ✅ 数据库连接正常");
  } else {
    console.error("  ❌ 数据库连接失败");
    process.exit(1);
  }

  const dbInfo = await getDBInfo();
  console.log(`  📦 PostgreSQL 版本: ${dbInfo.version}`);
  console.log(`  📊 表统计:`);
  console.log(`     - 用户: ${dbInfo.users} 条`);
  console.log(`     - 客户: ${dbInfo.customers} 条`);
  console.log(`     - 通话记录: ${dbInfo.calls} 条`);

  const tableResults = await verifyTableData();

  await verifyRelations();

  await verifyIndexes();

  await verifyFullTextSearch();

  console.log("\n" + "=".repeat(60));
  console.log("\n📋 验证总结:\n");

  const totalRecords = tableResults.reduce((sum, r) => sum + r.count, 0);
  const failedTables = tableResults.filter((r) => r.status === "❌");

  if (failedTables.length === 0) {
    console.log(`  ✅ 所有表验证通过`);
    console.log(`  📊 总记录数: ${totalRecords} 条`);
    console.log("\n🎉 数据库验证完成！所有检查通过。\n");
  } else {
    console.error(`  ❌ ${failedTables.length} 个表验证失败:`);
    failedTables.forEach((t: any) => {
      console.error(`     - ${t.name}: ${t.error}`);
    });
    console.log("\n⚠️  数据库验证发现问题，请检查上述错误。\n");
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("\n❌ 验证过程失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
