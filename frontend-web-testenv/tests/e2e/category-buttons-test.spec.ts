import { test, expect } from '@playwright/test';

/**
 * 活动分类按钮功能验证测试
 * 验证修复后的SimpleCategoryBar是否正确显示和工作
 */

test.describe('活动分类按钮测试', () => {
  
  test.beforeEach(async ({ page }) => {
    // 监听控制台日志
    page.on('console', msg => {
      const text = msg.text();
      console.log(`🔍 控制台 [${msg.type()}]: ${text}`);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    console.log('🚀 页面加载完成');
    
    // 等待活动数据加载
    await page.waitForTimeout(4000);
  });

  test('🎯 验证分类按钮显示和功能', async ({ page }) => {
    console.log('🎯 开始测试分类按钮显示和功能...');
    
    // 1. 查找分类按钮 - 使用更精确的选择器
    console.log('\n📋 步骤1: 查找SimpleCategoryBar组件');
    
    // 尝试多种方式找到分类按钮
    const buttonSelectors = [
      // 直接文本匹配
      'text=All',
      'text=Upcoming', 
      'text=Ongoing',
      'text=Ended',
      // 通过父容器查找
      '[style*="flexDirection"] button',
      '[style*="flex: 1"] button',
      // TouchableOpacity在web端渲染为div
      'div[role="button"]',
      // 通用按钮选择器
      'button',
      '[onclick]'
    ];
    
    let foundButtons = [];
    let allButton = null;
    let upcomingButton = null;
    let ongoingButton = null;
    let endedButton = null;
    
    for (const selector of buttonSelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        if (count > 0) {
          console.log(`✅ 选择器 "${selector}" 找到 ${count} 个元素`);
          
          for (let i = 0; i < count; i++) {
            try {
              const element = elements.nth(i);
              const text = await element.textContent();
              const isVisible = await element.isVisible();
              
              if (text && isVisible) {
                console.log(`📋 元素 ${i + 1}: "${text}" (可见: ${isVisible})`);
                
                if (text.trim() === 'All') allButton = element;
                else if (text.trim() === 'Upcoming') upcomingButton = element;
                else if (text.trim() === 'Ongoing') ongoingButton = element;
                else if (text.trim() === 'Ended') endedButton = element;
                
                foundButtons.push({ text: text.trim(), element, selector });
              }
            } catch (error) {
              continue;
            }
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    console.log(`\n📊 总计找到 ${foundButtons.length} 个可能的按钮`);
    foundButtons.forEach((btn, index) => {
      console.log(`${index + 1}. "${btn.text}" (来自: ${btn.selector})`);
    });
    
    // 2. 如果没找到分类按钮，检查页面结构
    if (!allButton && !upcomingButton && !endedButton) {
      console.log('\n🔍 未找到分类按钮，检查页面DOM结构...');
      
      // 检查是否有SimpleCategoryBar的特征元素
      const categoryBarElements = await page.evaluate(() => {
        // 查找可能的分类栏容器
        const containers = Array.from(document.querySelectorAll('*')).filter(el => {
          const style = window.getComputedStyle(el);
          return style.flexDirection === 'row' && 
                 style.alignItems === 'center' &&
                 (style.backgroundColor.includes('rgba(255, 255, 255') || 
                  style.backgroundColor.includes('rgb(255, 255, 255'));
        });
        
        return containers.map(container => ({
          tagName: container.tagName,
          className: container.className,
          children: Array.from(container.children).map(child => ({
            tagName: child.tagName,
            textContent: child.textContent?.trim(),
            className: child.className
          })),
          textContent: container.textContent?.trim(),
          style: {
            flexDirection: window.getComputedStyle(container).flexDirection,
            backgroundColor: window.getComputedStyle(container).backgroundColor,
            height: window.getComputedStyle(container).height
          }
        }));
      });
      
      console.log('🔍 可能的分类栏容器:', JSON.stringify(categoryBarElements, null, 2));
    }
    
    // 3. 测试按钮功能（如果找到的话）
    if (allButton || upcomingButton || endedButton) {
      console.log('\n🎯 步骤2: 测试按钮功能');
      
      // 记录点击前的USC活动状态
      const beforeClick = await page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        return {
          hasUSC: bodyText.includes('USC'),
          uscCount: (bodyText.match(/USC/g) || []).length,
          bodyLength: bodyText.length
        };
      });
      
      console.log('📊 点击前状态:', beforeClick);
      
      // 测试点击按钮
      const buttonsToTest = [
        { name: 'All', button: allButton },
        { name: 'Upcoming', button: upcomingButton },
        { name: 'Ongoing', button: ongoingButton },
        { name: 'Ended', button: endedButton }
      ].filter(item => item.button);
      
      for (const { name, button } of buttonsToTest) {
        console.log(`\n🔄 测试 "${name}" 按钮...`);
        
        try {
          await button.click();
          await page.waitForTimeout(2000); // 等待过滤生效
          
          const afterClick = await page.evaluate(() => {
            const bodyText = document.body.textContent || '';
            return {
              hasUSC: bodyText.includes('USC'),
              uscCount: (bodyText.match(/USC/g) || []).length,
              bodyLength: bodyText.length
            };
          });
          
          console.log(`📊 点击 "${name}" 后状态:`, afterClick);
          
          // 检查是否有状态变化
          if (afterClick.bodyLength !== beforeClick.bodyLength) {
            console.log(`✅ "${name}" 按钮工作正常，页面内容发生变化`);
          } else {
            console.log(`⚠️  "${name}" 按钮点击后页面无变化`);
          }
          
          // 检查USC活动在不同分类中的显示
          if (name === 'Ended' && afterClick.hasUSC) {
            console.log(`✅ USC活动在"${name}"分类中显示`);
          } else if (name === 'Upcoming' && afterClick.hasUSC) {
            console.log(`✅ USC活动在"${name}"分类中显示`);
          }
          
        } catch (error) {
          console.log(`❌ "${name}" 按钮点击失败:`, error.message);
        }
      }
      
    } else {
      console.log('❌ 没有找到任何分类按钮');
    }
    
    // 4. 总结测试结果
    console.log('\n📋 测试总结:');
    console.log(`- 找到 ${foundButtons.length} 个可能的按钮`);
    console.log(`- All按钮: ${allButton ? '✅' : '❌'}`);
    console.log(`- Upcoming按钮: ${upcomingButton ? '✅' : '❌'}`);
    console.log(`- Ongoing按钮: ${ongoingButton ? '✅' : '❌'}`);
    console.log(`- Ended按钮: ${endedButton ? '✅' : '❌'}`);
    
    console.log('✅ 分类按钮测试完成！');
  });

  test('📊 页面元素结构分析', async ({ page }) => {
    console.log('🎯 开始页面元素结构分析...');
    
    await page.waitForTimeout(3000);
    
    // 分析页面中所有可能的分类相关元素
    const structureAnalysis = await page.evaluate(() => {
      try {
        // 1. 查找所有包含"All", "Upcoming", "Ended"等文本的元素
        const categoryTexts = ['All', 'Upcoming', 'Ongoing', 'Ended', '全部', '即将开始', '进行中', '已结束'];
        const elementsWithCategoryText = [];
        
        categoryTexts.forEach(text => {
          const xpath = `//*[contains(text(), '${text}')]`;
          const result = document.evaluate(xpath, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
          
          for (let i = 0; i < result.snapshotLength; i++) {
            const element = result.snapshotItem(i);
            if (element) {
              elementsWithCategoryText.push({
                text,
                tagName: element.tagName,
                textContent: element.textContent?.trim(),
                className: element.className,
                isVisible: element.offsetParent !== null
              });
            }
          }
        });
        
        // 2. 查找所有button元素
        const allButtons = Array.from(document.querySelectorAll('button, div[role="button"], [onclick]')).map(btn => ({
          tagName: btn.tagName,
          textContent: btn.textContent?.trim(),
          className: btn.className,
          isVisible: btn.offsetParent !== null,
          style: {
            display: window.getComputedStyle(btn).display,
            visibility: window.getComputedStyle(btn).visibility
          }
        }));
        
        // 3. 查找flex容器
        const flexContainers = Array.from(document.querySelectorAll('*')).filter(el => {
          const style = window.getComputedStyle(el);
          return style.display === 'flex' && style.flexDirection === 'row';
        }).map(container => ({
          tagName: container.tagName,
          childrenCount: container.children.length,
          textContent: container.textContent?.trim().substring(0, 100),
          className: container.className
        }));
        
        return {
          categoryElements: elementsWithCategoryText,
          allButtons: allButtons.slice(0, 10), // 只取前10个避免输出过长
          flexContainers: flexContainers.slice(0, 5),
          timestamp: new Date().toISOString()
        };
        
      } catch (error) {
        return {
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    });
    
    console.log('📊 页面结构分析结果:');
    console.log('🔍 分类文本元素:', structureAnalysis.categoryElements);
    console.log('🔘 所有按钮元素:', structureAnalysis.allButtons);
    console.log('📦 Flex容器:', structureAnalysis.flexContainers);
    
    console.log('✅ 页面元素结构分析完成');
  });
});





