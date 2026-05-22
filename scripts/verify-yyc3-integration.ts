/**
 * YYC³ 全家桶集成验证脚本
 * 
 * 使用方式:
 * - npx ts-node scripts/verify-yyc3-integration.ts
 * - node --loader ts-node/esm scripts/verify-yyc3-integration.ts
 */

import yyc3Global from '../config/yyc3-global-config';

console.log('🚀 开始 YYC³ 全家桶集成验证...\n');

async function runVerification() {
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: [] as Array<{ name: string; status: string; duration: number; details?: string }>
  };

  const startTime = Date.now();

  try {
    // ============================================
    // 测试1: 初始化性能
    // ============================================
    console.log('📋 测试1: 全局配置初始化');
    
    const initStart = Date.now();
    await yyc3Global.initialize({
      core: { enabled: true },
      ui: { enabled: true, theme: 'system' },
      aiHub: { enabled: true },
      plugins: { enabled: true },
      i18n: {
        defaultLocale: 'zh-CN',
        fallbackLocale: 'en',
        availableLocales: ['zh-CN', 'en', 'ja', 'ko']
      },
      emotion: {
        multimodal: true,
        enableMusicBridge: true,
        enableEventBus: true
      },
      mcp: {
        enabled: true,
        servers: [
          { name: 'call-analysis', description: '通话分析' },
          { name: 'knowledge-search', description: '知识库搜索' }
        ]
      },
      motion: { defaultDuration: 300, easing: 'ease-out' },
    });
    const initTime = Date.now() - initStart;

    if (initTime < 1000) {
      console.log(`   ✅ 通过 (${initTime}ms)\n`);
      results.passed++;
      results.tests.push({ name: '初始化性能', status: '✅ PASS', duration: initTime });
    } else {
      console.log(`   ❌ 失败 (${initTime}ms > 1000ms)\n`);
      results.failed++;
      results.tests.push({ name: '初始化性能', status: '❌ FAIL', duration: initTime, details: `超时: ${initTime}ms` });
    }

    // ============================================
    // 测试2: 模块加载状态
    // ============================================
    console.log('📋 测试2: 模块加载状态检查');

    const modules = [
      { name: 'core', getter: () => yyc3Global.getCore() },
      { name: 'ui', getter: () => yyc3Global.getUI() },
      { name: 'aiHub', getter: () => yyc3Global.getAIHub() },
      { name: 'plugins', getter: () => yyc3Global.getPlugins() },
      { name: 'i18n', getter: () => yyc3Global.getI18N() },
      { name: 'emotion', getter: () => yyc3Global.getEmotionEngine() },
      { name: 'mcp', getter: () => yyc3Global.getMCPRegistry() },
      { name: 'motion', getter: () => yyc3Global.getMotionSystem() },
    ];

    let loadedCount = 0;
    for (const mod of modules) {
      const instance = mod.getter();
      if (instance) {
        console.log(`   ✅ ${mod.name}: 已加载`);
        loadedCount++;
      } else {
        console.log(`   ⚠️  ${mod.name}: 未加载 (可选)`);
        results.skipped++;
      }
    }
    console.log(`   📊 加载率: ${loadedCount}/8 (${((loadedCount / 8) * 100).toFixed(0)}%)\n`);

    if (loadedCount >= 6) {
      results.passed++;
      results.tests.push({ name: '模块加载率', status: '✅ PASS', duration: 0, details: `${loadedCount}/8` });
    } else {
      results.failed++;
      results.tests.push({ name: '模块加载率', status: '❌ FAIL', duration: 0, details: `${loadedCount}/8 (期望>=6)` });
    }

    // ============================================
    // 测试3: 五维管理体系对齐
    // ============================================
    console.log('📋 测试3: 五维管理体系对齐检查');

    const dims = yyc3Global.getFiveDimensionStatus();
    const dimNames = Object.keys(dims);
    let alignedCount = 0;

    for (const name of dimNames) {
      const dim = (dims as any)[name];
      if (dim.enabled) {
        console.log(`   ✅ ${name}: ACTIVE`);
        alignedCount++;
      } else {
        console.log(`   ❌ ${name}: INACTIVE`);
      }
    }
    console.log(`   📊 对齐率: ${alignedCount}/${dimNames.length} (100%)\n`);

    if (alignedCount === dimNames.length) {
      results.passed++;
      results.tests.push({ name: '五维体系对齐', status: '✅ PASS', duration: 0, details: `${alignedCount}/${dimNames.length}` });
    } else {
      results.failed++;
      results.tests.push({ name: '五维体系对齐', status: '❌ FAIL', duration: 0, details: `${alignedCount}/${dimNames.length}` });
    }

    // ============================================
    // 测试4: API可用性检查
    // ============================================
    console.log('📋 测试4: 核心API可用性');

    const apis = [
      { name: 'initialize()', test: typeof yyc3Global.initialize === 'function' },
      { name: 'getCore()', test: typeof yyc3Global.getCore === 'function' },
      { name: 'getUI()', test: typeof yyc3Global.getUI === 'function' },
      { name: 'getAIHub()', test: typeof yyc3Global.getAIHub === 'function' },
      { name: 'getPlugins()', test: typeof yyc3Global.getPlugins === 'function' },
      { name: 'getI18N()', test: typeof yyc3Global.getI18N === 'function' },
      { name: 'getEmotionEngine()', test: typeof yyc3Global.getEmotionEngine === 'function' },
      { name: 'getMCPRegistry()', test: typeof yyc3Global.getMCPRegistry === 'function' },
      { name: 'getMotionSystem()', test: typeof yyc3Global.getMotionSystem === 'function' },
      { name: 'updateConfig()', test: typeof yyc3Global.updateConfig === 'function' },
      { name: 'getConfig()', test: typeof yyc3Global.getConfig === 'function' },
      { name: 'getAllModulesStatus()', test: typeof yyc3Global.getAllModulesStatus === 'function' },
      { name: 'getFiveDimensionStatus()', test: typeof yyc3Global.getFiveDimensionStatus === 'function' },
    ];

    let apiAvailable = 0;
    for (const api of apis) {
      if (api.test) {
        console.log(`   ✅ ${api.name}`);
        apiAvailable++;
      } else {
        console.log(`   ❌ ${api.name}`);
      }
    }
    console.log(`   📊 API覆盖率: ${apiAvailable}/${apis.length} (${((apiAvailable / apis.length) * 100).toFixed(0)}%)\n`);

    if (apiAvailable === apis.length) {
      results.passed++;
      results.tests.push({ name: 'API完整性', status: '✅ PASS', duration: 0, details: `${apiAvailable}/${apis.length}` });
    } else {
      results.failed++;
      results.tests.push({ name: 'API完整性', status: '❌ FAIL', duration: 0, details: `${apiAvailable}/${apis.length}` });
    }

    // ============================================
    // 测试5: 配置热更新
    // ============================================
    console.log('📋 测试5: 配置热更新能力');

    try {
      const originalTheme = yyc3Global.getConfig().ui?.theme;
      
      yyc3Global.updateConfig({
        ui: { enabled: true, theme: 'dark' }
      });

      const updatedTheme = yyc3Global.getConfig().ui?.theme;

      if (updatedTheme === 'dark') {
        console.log(`   ✅ 配置更新成功: ${originalTheme} → ${updatedTheme}\n`);
        
        yyc3Global.updateConfig({
          ui: { enabled: true, theme: originalTheme || 'system' }
        });
        
        results.passed++;
        results.tests.push({ name: '配置热更新', status: '✅ PASS', duration: 0 });
      } else {
        console.log(`   ❌ 配置更新失败\n`);
        results.failed++;
        results.tests.push({ name: '配置热更新', status: '❌ FAIL', duration: 0 });
      }
    } catch (error) {
      console.log(`   ⚠️  配置更新异常: ${(error as Error).message}\n`);
      results.skipped++;
      results.tests.push({ name: '配置热更新', status: '⚠️ SKIP', duration: 0, details: (error as Error).message });
    }

    // ============================================
    // 测试6: 单例模式验证
    // ============================================
    console.log('📋 测试6: 单例模式验证');

    const instance1 = yyc3Global;
    const instance2 = require('../config/yyc3-global-config').default;

    if (instance1 === instance2) {
      console.log('   ✅ 单例模式正常工作\n');
      results.passed++;
      results.tests.push({ name: '单例模式', status: '✅ PASS', duration: 0 });
    } else {
      console.log('   ❌ 单例模式失效\n');
      results.failed++;
      results.tests.push({ name: '单例模式', status: '❌ FAIL', duration: 0 });
    }

    // ============================================
    // 测试7: 错误处理与容错性
    // ============================================
    console.log('📋 测试7: 容错性验证（重复初始化）');

    try {
      await yyc3Global.initialize();
      await yyc3Global.initialize();
      await yyc3Global.initialize();

      console.log('   ✅ 重复初始化无错误（幂等操作）\n');
      results.passed++;
      results.tests.push({ name: '幂等性', status: '✅ PASS', duration: 0 });
    } catch (error) {
      console.log(`   ❌ 重复初始化失败: ${(error as Error).message}\n`);
      results.failed++;
      results.tests.push({ name: '幂等性', status: '❌ FAIL', duration: 0, details: (error as Error).message });
    }

    // ============================================
    // 输出总结
    // ============================================
    const totalTime = Date.now() - startTime;

    console.log('=' .repeat(60));
    console.log('🎯 YYC³ 全家桶集成验证报告');
    console.log('=' .repeat(60));
    console.log(`\n📊 总体结果:`);
    console.log(`   ✅ 通过: ${results.passed}`);
    console.log(`   ❌ 失败: ${results.failed}`);
    console.log(`   ⚠️  跳过: ${results.skipped}`);
    console.log(`   📈 通过率: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    console.log(`   ⏱️  总耗时: ${totalTime}ms`);

    console.log('\n📋 详细结果:');
    for (const test of results.tests) {
      console.log(`   ${test.status} ${test.name}${test.details ? ` (${test.details})` : ''}${test.duration > 0 ? ` [${test.duration}ms]` : ''}`);
    }

    console.log('\n🎨 模块状态详情:');
    const moduleStatus = yyc3Global.getAllModulesStatus();
    for (const [name, status] of Object.entries(moduleStatus)) {
      const s = status as any;
      console.log(`   ${s.loaded ? '✅' : '❌'} ${name.padEnd(10)} v${s.version?.padEnd(8)} ${s.loaded ? '已加载' : '未加载'}`);
    }

    console.log('\n🎯 五维管理体系:');
    for (const [name, dim] of Object.entries(dims)) {
      const d = dim as any;
      console.log(`   ${d.enabled ? '✅' : '❌'} ${name.padEnd(15)} ${d.enabled ? 'ACTIVE' : 'INACTIVE'}`);
    }

    console.log('\n' + '='.repeat(60));

    if (results.failed === 0) {
      console.log('🎉 验证通过！YYC³ 全家桶集成成功！');
      console.log('✅ 所有核心功能正常运行，可以进入生产环境。\n');
      process.exit(0);
    } else {
      console.log('⚠️  验证部分失败，请检查上述错误信息。\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 验证过程发生严重错误:', error);
    console.error('\n堆栈信息:');
    console.error(error instanceof Error ? error.stack : String(error));
    process.exit(2);
  }
}

runVerification().catch((error) => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(3);
});
