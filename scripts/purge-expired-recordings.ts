/**
 * @fileoverview 到期录音清理 CLI（幂等，可安全重跑）
 * @description 调度通道：
 *              1. GitHub Actions maintenance.yml（self-hosted LAN runner）
 *              2. 部署环境 crontab：17 3 * * * cd <repo> && pnpm tsx scripts/purge-expired-recordings.ts
 * @module scripts/purge-expired-recordings
 * @author YYC³
 * @version 1.0.0
 * @created 2026-11-20
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { purgeExpiredRecordings } from '../lib/compliance/recording';

async function main() {
  console.log('🧹 开始清理到期录音...');
  const summary = await purgeExpiredRecordings();
  console.log(`✅ 清理完成：扫描 ${summary.scanned} 条，回收 ${summary.purged} 条`);
  process.exitCode = 0;
}

main()
  .catch((error) => {
    console.error('❌ 清理失败:', error);
    process.exitCode = 1;
  });
