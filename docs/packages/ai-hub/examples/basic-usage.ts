/**
 * @file YYC³ AI Hub 基础使用示例
 * @description 演示如何使用 YYC³ AI Hub
 * @author YYC³ AI Team
 * @version 1.0.0
 */

import { YYC3AIHub } from '../src';

async function main() {
  console.log('🚀 YYC³ AI Hub 示例程序\n');

  const hub = new YYC3AIHub({
    authType: 'auto'
  });

  await hub.initialize();

  console.log('\n📊 可用组件:');
  console.log(`   Agents: ${hub.getAgents().slice(0, 5).join(', ')}...`);
  console.log(`   Skills: ${hub.getSkills().slice(0, 5).join(', ')}...`);
  console.log(`   MCP Servers: ${hub.getMCPServers().slice(0, 5).join(', ')}...`);

  const result = await hub.execute('创建一个用户认证API', {
    agent: 'backend-development',
    skills: ['unit-tests']
  });

  console.log('\n📝 执行结果:');
  console.log('成功:', result.success);
  console.log('输出:', result.output?.substring(0, 200) + '...');
  console.log('耗时:', result.metrics?.duration + 'ms');
}

main().catch(console.error);
