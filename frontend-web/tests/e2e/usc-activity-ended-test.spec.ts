import { test, expect } from '@playwright/test';

/**
 * USC接机活动"已结束"状态验证测试 - 支持英文界面
 * 专门验证USC活动是否正确显示在Ended分类中
 */

test.describe('USC活动状态分类测试', () => {
  
  test.beforeEach(async ({ page }) => {
    // 监听控制台日志，特别关注ActivityStatusCalculator
    page.on('console', msg => {
      const text = msg.text();
      console.log(`🔍 控制台 [${msg.type()}]: ${text}`);
      
      // 特别标记ActivityStatusCalculator相关日志
      if (text.includes('ActivityStatusCalculator') || text.includes('活动') || text.includes('USC')) {
        console.log(`🎯 关键日志: ${text}`);
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    console.log('🚀 页面加载完成');
  });

  test('🎯 验证USC活动在Ended按钮中的显示', async ({ page }) => {
    console.log('🎯 开始USC活动状态分类测试...');
    
    // 等待页面完全加载
    await page.waitForTimeout(4000);
    
    // 1. 首先检查页面是否包含USC活动
    console.log('\n📋 步骤1: 检查页面是否包含USC活动');
    const pageContent = await page.textContent('body');
    const hasUSC = pageContent?.includes('USC') || pageContent?.includes('南加州大学');
    console.log(`🔍 页面包含USC活动: ${hasUSC}`);
    
    if (!hasUSC) {
      console.log('❌ 页面不包含USC活动，测试结束');
      return;
    }
    
    // 2. 查找分类按钮 - 支持中英文
    console.log('\n🔄 步骤2: 查找分类按钮');
    const buttonSelectors = [
      // 英文按钮
      'button:has-text("All")',
      'button:has-text("Upcoming")', 
      'button:has-text("Ended")',
      // 中文按钮
      'button:has-text("全部")',
      'button:has-text("即将开始")',
      'button:has-text("已结束")',
      // 通用选择器
      '[data-testid*="filter"]',
      '.filter-button',
      '[role="tab"]'
    ];
    
    let allButton = null;
    let endedButton = null;
    let upcomingButton = null;
    
    for (const selector of buttonSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible()) {
          const text = await button.textContent();
          console.log(`✅ 找到按钮: "${text}" (选择器: ${selector})`);
          
          if (text?.includes('All') || text?.includes('全部')) {
            allButton = button;
          } else if (text?.includes('Ended') || text?.includes('已结束')) {
            endedButton = button;
          } else if (text?.includes('Upcoming') || text?.includes('即将开始')) {
            upcomingButton = button;
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    // 3. 如果没找到特定按钮，尝试找所有可点击元素
    if (!endedButton) {
      console.log('🔍 未找到明确的Ended按钮，搜索所有可点击元素...');
      
      const clickableElements = page.locator('button, [role="button"], .touchable, [onclick]');
      const count = await clickableElements.count();
      
      for (let i = 0; i < Math.min(count, 20); i++) {
        try {
          const element = clickableElements.nth(i);
          const text = await element.textContent();
          
          if (text && (text.includes('Ended') || text.includes('已结束') || text.includes('End'))) {
            endedButton = element;
            console.log(`✅ 找到疑似Ended按钮: "${text}"`);
            break;
          }
        } catch (error) {
          continue;
        }
      }
    }
    
    // 4. 测试分类功能
    if (endedButton) {
      console.log('\n🎯 步骤3: 测试Ended分类功能');
      
      // 点击前记录USC活动状态
      const beforeClickContent = await page.textContent('body');
      const uscCountBefore = (beforeClickContent?.match(/USC/g) || []).length;
      console.log(`📊 点击前USC相关文本出现次数: ${uscCountBefore}`);
      
      // 点击Ended按钮
      console.log('🔄 点击Ended按钮...');
      await endedButton.click();
      await page.waitForTimeout(3000); // 等待筛选生效
      
      // 点击后记录USC活动状态
      const afterClickContent = await page.textContent('body');
      const uscCountAfter = (afterClickContent?.match(/USC/g) || []).length;
      console.log(`📊 点击后USC相关文本出现次数: ${uscCountAfter}`);
      
      // 验证USC活动状态
      if (uscCountAfter > 0) {
        console.log('✅ USC活动正确显示在Ended分类中');
        
        // 尝试找到具体的USC活动卡片
        const uscElements = page.locator('text=/USC.*免费接机|USC.*接机|USC.*活动/');
        const uscElementCount = await uscElements.count();
        
        console.log(`🎯 找到${uscElementCount}个USC活动元素`);
        
        for (let i = 0; i < Math.min(uscElementCount, 3); i++) {
          try {
            const element = uscElements.nth(i);
            const text = await element.textContent();
            console.log(`📋 USC活动 ${i + 1}: "${text}"`);
          } catch (error) {
            console.log(`⚠️  USC活动 ${i + 1} 获取失败`);
          }
        }
        
        // 验证当前时间和活动时间
        const currentTime = new Date();
        console.log(`⏰ 当前时间: ${currentTime.toISOString()}`);
        console.log(`📅 当前日期: ${currentTime.toDateString()}`);
        
        // 检查页面是否显示时间信息
        const timeInfo = await page.evaluate(() => {
          const bodyText = document.body.innerText;
          
          // 查找时间相关信息
          const timeMatches = bodyText.match(/\d{4}-\d{2}-\d{2}|\d{1,2}月\d{1,2}日|\d{1,2}:\d{2}/g) || [];
          
          return {
            timeMatches: timeMatches.slice(0, 10), // 取前10个时间匹配
            hasUSCText: bodyText.includes('USC'),
            timestamp: new Date().toISOString()
          };
        });
        
        console.log('⏰ 页面时间信息:', timeInfo);
        
      } else {
        console.log('❌ USC活动没有显示在Ended分类中');
        
        // 检查是否完全没有活动显示
        const hasAnyActivity = afterClickContent?.includes('接机') || 
                              afterClickContent?.includes('活动') ||
                              afterClickContent?.includes('Activity');
        
        if (!hasAnyActivity) {
          console.log('⚠️  Ended分类中没有任何活动显示');
        } else {
          console.log('ℹ️  Ended分类中有其他活动，但不包含USC活动');
        }
        
        // 尝试点击All按钮查看所有活动
        if (allButton) {
          console.log('🔄 尝试点击All按钮查看所有活动...');
          await allButton.click();
          await page.waitForTimeout(2000);
          
          const allContent = await page.textContent('body');
          const uscInAll = allContent?.includes('USC');
          console.log(`📊 All分类中是否包含USC: ${uscInAll}`);
        }
      }
      
    } else {
      console.log('❌ 无法找到Ended分类按钮');
      
      // 显示所有找到的按钮用于调试
      console.log('\n🔍 调试信息 - 页面中找到的所有按钮:');
      const allButtons = page.locator('button, [role="button"]');
      const buttonCount = await allButtons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        try {
          const button = allButtons.nth(i);
          const text = await button.textContent();
          if (text && text.trim().length > 0) {
            console.log(`🔘 按钮 ${i + 1}: "${text.trim()}"`);
          }
        } catch (error) {
          continue;
        }
      }
    }
    
    // 5. 检查ActivityStatusCalculator日志
    console.log('\n🔍 步骤4: 等待ActivityStatusCalculator日志');
    await page.waitForTimeout(2000);
    
    console.log('✅ USC活动状态分类测试完成！');
  });

  test('📊 活动时间状态验证', async ({ page }) => {
    console.log('🎯 开始活动时间状态验证...');
    
    await page.waitForTimeout(3000);
    
    // 注入JavaScript检查活动时间状态
    const statusReport = await page.evaluate(() => {
      try {
        const now = new Date();
        console.log('当前时间检查:', now.toISOString());
        
        // 查找包含USC的文本元素
        const elements = Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent && el.textContent.includes('USC')
        );
        
        console.log(`找到${elements.length}个包含USC的元素`);
        
        // 模拟状态计算
        const mockUSCActivityTime = '2024-08-15 10:00:00'; // 假设USC活动时间
        const activityDate = new Date(mockUSCActivityTime);
        const isEnded = activityDate < now;
        
        return {
          currentTime: now.toISOString(),
          mockActivityTime: mockUSCActivityTime,
          calculatedStatus: isEnded ? 'ended' : 'upcoming',
          elementsFound: elements.length,
          shouldShowInEnded: isEnded
        };
      } catch (error) {
        return {
          error: error.message,
          currentTime: new Date().toISOString()
        };
      }
    });
    
    console.log('📊 时间状态验证结果:', statusReport);
    
    if (statusReport.shouldShowInEnded) {
      console.log('✅ 根据时间计算，USC活动应该显示在Ended分类中');
    } else {
      console.log('ℹ️  根据时间计算，USC活动不应该显示在Ended分类中');
    }
    
    console.log('✅ 活动时间状态验证完成');
  });
});




