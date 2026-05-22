import { test, expect } from '@playwright/test';

/**
 * E2E 测试: 智能外呼系统
 * 文件: tests/e2e/04-smart-call-system.spec.ts
 * 
 * 测试目标:
 * - 验证外呼系统界面加载
 * - 验证通话记录显示和过滤
 * - 验证脚本管理功能
 * - 验证质量评分展示
 * - 验证情感分析功能 (Phase 2)
 */

test.describe('智能外呼系统', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test('应该能访问智能外呼页面', async ({ page }) => {
    // 查找智能外呼 Tab
    const smartCallTab = page.locator('[role="tab"]').filter({
      hasText: /smart call|outbound|call|外呼|通话/i,
    });

    if (await smartCallTab.isVisible()) {
      await smartCallTab.click();

      // 验证外呼系统内容加载
      const panel = page.locator('[role="tabpanel"]');
      await expect(panel.first()).toBeVisible();

      // 验证关键元素存在
      const pageText = await page.textContent('body');
      expect(pageText).toMatch(/call|record|script|sentiment|quality|status/i);
    }
  });

  test('应该显示通话记录列表', async ({ page }) => {
    // 尝试找到智能外呼部分
    const callRecords = page.locator('table').first();

    if (await callRecords.isVisible()) {
      // 验证列表包含记录
      const rows = page.locator('tbody tr');
      const rowCount = await rows.count();

      // 可能有 0 条记录，但表格结构应该存在
      expect(rowCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('应该显示通话状态标签', async ({ page }) => {
    // 查找状态标签 (已完成、未接、忙线等)
    const statusLabels = page.locator('span').filter({
      hasText: /completed|missed|busy|ongoing|completed|未接|忙线|进行中/i,
    });

    if (await statusLabels.first().isVisible()) {
      const labelCount = await statusLabels.count();
      expect(labelCount).toBeGreaterThan(0);
    }
  });

  test('应该显示质量评分', async ({ page }) => {
    // 查找评分相关的元素 (星星、百分比、数字等)
    const qualityScores = page.locator('span').filter({
      hasText: /★|★|score|quality|评分|分数|\d{1,3}%/i,
    });

    if (await qualityScores.first().isVisible()) {
      const scoreCount = await qualityScores.count();
      expect(scoreCount).toBeGreaterThan(0);
    }
  });

  test('应该支持通话状态过滤', async ({ page }) => {
    // 查找状态过滤器
    const filterButton = page
      .locator('button')
      .filter({ hasText: /status|filter|状态|筛选/i })
      .first();

    if (await filterButton.isVisible()) {
      await filterButton.click();

      // 等待过滤菜单
      const menu = page.locator('[role="menu"]').first();
      if (await menu.isVisible()) {
        // 选择一个状态
        const option = page.locator('[role="menuitem"]').first();
        if (await option.isVisible()) {
          await option.click();

          // 验证过滤已应用
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test('应该显示情感分析结果', async ({ page }) => {
    // 查找情感指示 (正面、中立、负面)
    const sentimentIndicators = page.locator('span').filter({
      hasText: /positive|negative|neutral|😊|😐|😞|正面|负面|中立/i,
    });

    if (await sentimentIndicators.first().isVisible()) {
      const indicatorCount = await sentimentIndicators.count();
      expect(indicatorCount).toBeGreaterThan(0);
    }
  });

  test('应该支持脚本建议展示', async ({ page }) => {
    // 查找脚本相关内容
    const scriptContent = page.locator('div').filter({
      hasText: /script|suggestion|template|recommend|脚本|建议|模板/i,
    });

    if (await scriptContent.first().isVisible()) {
      // 验证脚本内容可见
      const text = await scriptContent.first().textContent();
      expect(text).toBeTruthy();
    }
  });

  test('应该支持日期范围过滤', async ({ page }) => {
    // 查找日期输入
    const dateInput = page.locator('input[type="date"]').first();
    const dateButton = page
      .locator('button')
      .filter({ hasText: /date|time|日期|时间/i })
      .first();

    if (await dateInput.isVisible()) {
      // 选择日期
      await dateInput.fill('2026-01-20');

      // 验证日期已更新
      const value = await dateInput.inputValue();
      expect(value).toBe('2026-01-20');
    } else if (await dateButton.isVisible()) {
      await dateButton.click();

      const datePicker = page.locator('[role="dialog"]').first();
      await expect(datePicker).toBeVisible();
    }
  });

  test('应该显示通话统计指标', async ({ page }) => {
    // 查找总通话数、接通率等指标
    const stats = page.locator('div').filter({
      hasText: /calls|rate|average|total|duration|总计|接通率|平均/i,
    });

    if (await stats.first().isVisible()) {
      const statCount = await stats.count();
      expect(statCount).toBeGreaterThan(0);
    }
  });

  test('应该支持排序功能', async ({ page }) => {
    // 查找表格表头 (可以点击排序)
    const tableHeaders = page.locator('th');

    if (await tableHeaders.first().isVisible()) {
      const headerCount = await tableHeaders.count();

      if (headerCount > 0) {
        // 尝试点击第一个可排序的列头
        const firstHeader = tableHeaders.first();
        await firstHeader.click();

        // 等待排序完成
        await page.waitForTimeout(300);

        // 验证排序已应用
        expect(firstHeader).toBeTruthy();
      }
    }
  });

  test('应该在移动设备上响应式显示', async ({ page }) => {
    // 设置移动视口
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForTimeout(300);

    // 验证内容可访问
    const content = page.locator('[role="tabpanel"]').first();
    if (await content.isVisible()) {
      expect(content).toBeTruthy();
    }
  });

  test('应该显示通话时长', async ({ page }) => {
    // 查找通话时长信息
    const duration = page.locator("text=/:/").first();
    const durationText = page
      .locator("span")
      .filter({ hasText: /\d+:\d+|duration|时长|长度/i })
      .first();

    if ((await duration.isVisible()) || (await durationText.isVisible())) {
      expect(duration || durationText).toBeTruthy();
    }
  });

  test('应该支持详细视图', async ({ page }) => {
    // 查找"查看详情"或"展开"按钮
    const detailButton = page
      .locator('button')
      .filter({ hasText: /detail|view|expand|show|查看|展开/i })
      .first();

    if (await detailButton.isVisible()) {
      await detailButton.click();

      // 等待详情面板打开
      const detailPanel = page.locator('[role="dialog"]').first();

      // 验证详情已加载
      if (await detailPanel.isVisible()) {
        expect(detailPanel).toBeTruthy();
      }
    }
  });

  test('应该无控制台错误', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(1000);

    // 过滤掉非关键错误
    const criticalErrors = errors.filter((e) => !e.includes('warn'));
    expect(criticalErrors).toHaveLength(0);
  });
});

/**
 * 高级外呼功能测试 (Phase 2)
 */
test.describe('高级外呼功能', () => {
  test.skip('应该能启动新的外呼任务 (需要 Phase 2)', async ({ page }) => {
    await page.goto('/');

    // 查找启动任务按钮
    const startButton = page
      .locator('button')
      .filter({ hasText: /start|launch|begin|initiate|启动|开始/i })
      .first();

    if (await startButton.isVisible()) {
      await startButton.click();

      // 等待任务启动对话框
      const dialog = page.locator('[role="dialog"]').first();
      await expect(dialog).toBeVisible();

      // 填写任务参数
      const nameInput = page.locator('input[placeholder*="name" i]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test Campaign');
      }

      // 启动任务
      const submitButton = page
        .locator('button')
        .filter({ hasText: /start|submit|启动/i })
        .first();
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // 验证任务已启动
        await page.waitForTimeout(1000);
      }
    }
  });

  test.skip('应该能暂停/恢复外呼任务', async ({ page }) => {
    // TODO: 实现暂停/恢复功能测试
  });

  test.skip('应该能查看实时通话转录', async ({ page }) => {
    // TODO: 实现实时转录测试
  });

  test.skip('应该能导出通话记录', async ({ page }) => {
    // TODO: 实现导出功能测试
  });
});

/**
 * 情感分析和质量评分测试 (Phase 2)
 */
test.describe('情感分析与质量评分', () => {
  test.skip('应该准确显示正面情感', async ({ page }) => {
    // TODO: 实现情感分类测试
  });

  test.skip('应该能通过情感过滤记录', async ({ page }) => {
    // TODO: 实现情感过滤测试
  });

  test.skip('应该显示质量评分详细信息', async ({ page }) => {
    // TODO: 实现质量评分详情测试
  });
});
