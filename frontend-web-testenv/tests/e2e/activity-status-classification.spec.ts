import { test, expect } from '@playwright/test';

/**
 * USC接机活动状态分类专项测试
 * 验证活动时间分类逻辑是否正确工作
 */

test.describe('活动状态分类专项测试', () => {
  
  test.beforeEach(async ({ page }) => {
    // 监听控制台日志
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
      console.log(`🔍 控制台 [${msg.type()}]: ${text}`);
    });
    
    // 导航到应用并等待加载
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    console.log('🚀 已加载 PomeloX 应用页面');
  });

  test('🎯 USC接机活动状态分类验证', async ({ page }) => {
    console.log('🎯 开始测试USC接机活动的状态分类...');
    
    // 等待活动数据加载完成
    await page.waitForTimeout(3000);
    
    // 1. 首先查看所有活动的当前显示状态
    console.log('\n📋 步骤1: 检查当前显示的活动列表');
    
    // 获取页面所有文本内容
    const allPageText = await page.textContent('body');
    
    // 查找USC相关活动
    const hasUSCActivity = allPageText?.includes('USC') || allPageText?.includes('南加州大学');
    console.log(`🔍 页面是否包含USC活动: ${hasUSCActivity}`);
    
    if (hasUSCActivity) {
      // 尝试找到具体的USC活动元素
      const uscElements = page.locator('text=/USC|南加州大学|接机/');
      const uscCount = await uscElements.count();
      console.log(`📊 找到 ${uscCount} 个USC相关元素`);
      
      for (let i = 0; i < Math.min(uscCount, 3); i++) {
        try {
          const element = uscElements.nth(i);
          const text = await element.textContent();
          console.log(`🏫 USC元素 ${i + 1}: "${text}"`);
        } catch (error) {
          console.log(`⚠️  USC元素 ${i + 1} 获取失败`);
        }
      }
    }
    
    // 2. 查找并测试分类按钮
    console.log('\n🔄 步骤2: 测试活动分类功能');
    
    // 查找"已结束"相关的按钮
    const endedButtonSelectors = [
      'button:has-text("已结束")',
      'button:has-text("ended")',
      'button:has-text("Ended")',
      '[data-testid*="ended"]',
      '[aria-label*="已结束"]',
      '.tab:has-text("已结束")',
      '.filter:has-text("已结束")'
    ];
    
    let endedButton = null;
    let endedButtonText = '';
    
    for (const selector of endedButtonSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible()) {
          endedButton = button;
          endedButtonText = await button.textContent() || '';
          console.log(`✅ 找到"已结束"按钮: "${endedButtonText}" (选择器: ${selector})`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!endedButton) {
      console.log('❌ 未找到"已结束"按钮，尝试查找其他分类按钮...');
      
      // 查找任何可能的分类按钮
      const anyFilterButtons = page.locator('button, .tab, [role="tab"]');
      const buttonCount = await anyFilterButtons.count();
      
      console.log(`🔍 找到 ${buttonCount} 个可能的按钮/标签`);
      
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        try {
          const button = anyFilterButtons.nth(i);
          const text = await button.textContent();
          
          if (text && (text.includes('结束') || text.includes('end') || text.includes('过期') || text.includes('expired'))) {
            endedButton = button;
            endedButtonText = text;
            console.log(`✅ 找到疑似"已结束"按钮: "${text}"`);
            break;
          }
        } catch (error) {
          continue;
        }
      }
    }
    
    // 3. 点击"已结束"按钮并验证结果
    if (endedButton) {
      console.log(`\n🔄 步骤3: 点击"已结束"按钮 ("${endedButtonText}")`);
      
      // 记录点击前的页面状态
      const beforeClickText = await page.textContent('body');
      const beforeHasUSC = beforeClickText?.includes('USC') || beforeClickText?.includes('南加州大学');
      
      console.log(`📊 点击前页面是否显示USC: ${beforeHasUSC}`);
      
      // 点击"已结束"按钮
      await endedButton.click();
      await page.waitForTimeout(2000); // 等待筛选生效
      
      // 记录点击后的页面状态
      const afterClickText = await page.textContent('body');
      const afterHasUSC = afterClickText?.includes('USC') || afterClickText?.includes('南加州大学');
      
      console.log(`📊 点击后页面是否显示USC: ${afterHasUSC}`);
      
      // 验证USC活动是否在"已结束"分类中
      if (afterHasUSC) {
        console.log('✅ USC活动正确显示在"已结束"分类中');
        
        // 尝试找到具体的USC活动信息
        const uscActivities = page.locator('text=/USC.*接机|南加州大学.*接机/');
        const uscActivityCount = await uscActivities.count();
        
        for (let i = 0; i < uscActivityCount; i++) {
          try {
            const activity = uscActivities.nth(i);
            const activityText = await activity.textContent();
            console.log(`🎯 已结束的USC活动 ${i + 1}: "${activityText}"`);
          } catch (error) {
            console.log(`⚠️  USC活动 ${i + 1} 获取失败`);
          }
        }
      } else {
        console.log('❌ USC活动没有显示在"已结束"分类中');
        
        // 检查是否有任何活动显示
        const anyActivityCount = (afterClickText?.match(/接机|活动/g) || []).length;
        console.log(`📊 "已结束"分类中显示的活动数量: ${anyActivityCount}`);
        
        if (anyActivityCount === 0) {
          console.log('⚠️  "已结束"分类中没有任何活动显示');
        } else {
          console.log('ℹ️  "已结束"分类中有其他活动，但不包含USC活动');
        }
      }
      
      // 4. 检查ActivityStatusCalculator的日志
      console.log('\n🔍 步骤4: 检查ActivityStatusCalculator相关日志');
      await page.waitForTimeout(1000);
      
      // 检查是否有状态计算相关的日志
      const hasStatusCalculatorLogs = await page.evaluate(() => {
        // 检查是否有ActivityStatusCalculator相关的全局函数或对象
        return {
          hasGlobalStatusCalculator: typeof (window as any).ActivityStatusCalculator !== 'undefined',
          hasStatusCalculationLogs: false, // 这里我们无法直接访问之前的日志
          timestamp: new Date().toISOString()
        };
      });
      
      console.log('🔍 状态计算器检查结果:', hasStatusCalculatorLogs);
      
    } else {
      console.log('❌ 无法找到"已结束"分类按钮，无法测试USC活动分类');
    }
    
    // 5. 手动检查活动时间信息
    console.log('\n⏰ 步骤5: 检查活动时间信息');
    
    // 尝试在页面中执行JavaScript来获取活动数据
    const activityTimeInfo = await page.evaluate(() => {
      try {
        // 尝试从全局变量或React组件状态中获取活动信息
        const body = document.body.innerText;
        
        // 查找时间相关的信息
        const timePatterns = [
          /\d{4}-\d{2}-\d{2}/g,
          /\d{1,2}月\d{1,2}日/g,
          /\d{1,2}:\d{2}/g
        ];
        
        const foundTimes = timePatterns.map(pattern => 
          (body.match(pattern) || []).slice(0, 5)
        ).flat();
        
        return {
          foundTimes,
          hasUSCInBody: body.includes('USC') || body.includes('南加州大学'),
          currentTime: new Date().toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
      } catch (error) {
        return {
          error: error.message,
          currentTime: new Date().toISOString()
        };
      }
    });
    
    console.log('⏰ 活动时间信息检查结果:', activityTimeInfo);
    
    console.log('\n🎉 USC活动状态分类测试完成！');
  });

  test('📊 活动状态计算逻辑验证', async ({ page }) => {
    console.log('🎯 开始验证活动状态计算逻辑...');
    
    // 等待页面完全加载
    await page.waitForTimeout(3000);
    
    // 注入测试函数来检查活动状态计算
    const statusCheckResult = await page.evaluate(() => {
      try {
        // 查找页面中的活动元素
        const activities = Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent && (
            el.textContent.includes('USC') || 
            el.textContent.includes('接机') ||
            el.textContent.includes('活动')
          )
        );
        
        const currentTime = new Date();
        const currentTimeISO = currentTime.toISOString();
        
        console.log(`当前时间: ${currentTimeISO}`);
        
        // 尝试查找时间信息
        const timeElements = activities.map((el, index) => {
          const text = el.textContent || '';
          
          // 查找可能的时间信息
          const timeMatches = text.match(/\d{4}-\d{2}-\d{2}|\d{1,2}月\d{1,2}日|\d{1,2}:\d{2}/g);
          
          return {
            index,
            text: text.substring(0, 100),
            timeMatches,
            isUSC: text.includes('USC') || text.includes('南加州大学')
          };
        }).filter(item => item.timeMatches && item.timeMatches.length > 0);
        
        return {
          currentTime: currentTimeISO,
          activitiesWithTime: timeElements,
          totalActivities: activities.length
        };
        
      } catch (error) {
        return {
          error: error.message,
          currentTime: new Date().toISOString()
        };
      }
    });
    
    console.log('📊 活动状态计算结果:', JSON.stringify(statusCheckResult, null, 2));
    
    console.log('✅ 活动状态计算逻辑验证完成');
  });
});





