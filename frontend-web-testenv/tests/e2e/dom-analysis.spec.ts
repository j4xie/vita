/**
 * 🔍 详细DOM结构分析
 * 
 * 深入分析页面DOM结构来找到真正的扫码按钮
 */

import { test, expect } from '@playwright/test';

test.describe('DOM结构分析', () => {
  test('🔍 深入分析页面DOM找到扫码按钮', async ({ page }) => {
    console.log('🎯 开始详细DOM结构分析...');

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('🚀 页面加载完成');

    // 方法1: 查找真正的SimpleCategoryBar组件
    console.log('\n📋 方法1: 查找SimpleCategoryBar组件');
    
    const categoryBarElements = await page.evaluate(() => {
      // 查找包含特定class或属性的元素
      const selectors = [
        '[class*="categoryBar"]',
        '[class*="CategoryBar"]', 
        '[class*="segmentContainer"]',
        '[style*="categoryBar"]',
        'div:has-text("AllUpcomingEnded")',
        'div:has-text("All"):has-text("Upcoming"):has-text("Ended")'
      ];
      
      const results = [];
      
      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el, index) => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              results.push({
                selector,
                index,
                tagName: el.tagName,
                className: el.className || '',
                position: {
                  x: Math.round(rect.x),
                  y: Math.round(rect.y),
                  width: Math.round(rect.width),
                  height: Math.round(rect.height)
                },
                textContent: (el.textContent || '').slice(0, 100),
                childrenCount: el.children.length
              });
            }
          });
        } catch (e) {
          // 忽略无效选择器
        }
      });
      
      return results;
    });

    console.log(`🔍 找到 ${categoryBarElements.length} 个可能的CategoryBar元素:`);
    categoryBarElements.forEach(el => {
      console.log(`  ${el.selector}[${el.index}]: 位置:(${el.position.x},${el.position.y}) - 大小:(${el.position.width}x${el.position.height}) - 子元素:${el.childrenCount}`);
      console.log(`    文字: "${el.textContent.slice(0, 50)}..."`);
    });

    // 方法2: 查找所有包含Ionicons的元素
    console.log('\n📋 方法2: 查找所有Ionicons元素');
    
    const ioniconsElements = await page.evaluate(() => {
      // 查找Ionicons的可能方式
      const ionSelectors = [
        'svg[name]',
        'div[data-icon-name]', 
        'i[class*="ion"]',
        '[class*="Ionicons"]',
        '*:has(svg[name])',
        'svg'
      ];
      
      const results = [];
      const foundElements = new Set();
      
      ionSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            if (!foundElements.has(el)) {
              foundElements.add(el);
              
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                const svg = el.tagName === 'SVG' ? el : el.querySelector('svg');
                
                results.push({
                  tagName: el.tagName,
                  className: el.className || '',
                  position: {
                    x: Math.round(rect.x),
                    y: Math.round(rect.y),
                    width: Math.round(rect.width),
                    height: Math.round(rect.height)
                  },
                  svgName: svg?.getAttribute('name') || svg?.getAttribute('data-icon-name') || 'unnamed',
                  innerHTML: el.innerHTML.slice(0, 150),
                  parentTag: el.parentElement?.tagName || 'none',
                  parentClass: el.parentElement?.className || ''
                });
              }
            }
          });
        } catch (e) {
          // 忽略
        }
      });
      
      return results;
    });

    console.log(`🔍 找到 ${ioniconsElements.length} 个图标元素:`);
    ioniconsElements.forEach((el, index) => {
      console.log(`  ${index+1}: ${el.tagName} - 位置:(${el.position.x},${el.position.y}) - 名称:"${el.svgName}"`);
      console.log(`    父元素: ${el.parentTag} (${el.parentClass})`);
    });

    // 方法3: 在右上角区域查找可点击元素
    console.log('\n📋 方法3: 查找右上角区域的可点击元素');
    
    const rightTopElements = await page.evaluate(() => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // 定义右上角区域（右侧25%，上侧50%）
      const rightThreshold = windowWidth * 0.75;
      const topThreshold = windowHeight * 0.5;
      
      const allElements = document.querySelectorAll('*');
      const rightTopClickable = [];
      
      allElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        
        // 检查是否在右上角区域
        if (rect.x > rightThreshold && rect.y < topThreshold && 
            rect.width > 0 && rect.height > 0) {
          
          // 检查是否可点击
          const isClickable = !!(
            el.onclick ||
            el.getAttribute('role') === 'button' ||
            el.tagName === 'BUTTON' ||
            style.cursor === 'pointer' ||
            el.getAttribute('onPress') ||
            el.className.includes('TouchableOpacity') ||
            el.className.includes('Pressable')
          );
          
          if (isClickable || el.tagName === 'DIV' || el.tagName === 'SVG') {
            const hasSVG = el.querySelector('svg') !== null;
            const svg = el.querySelector('svg');
            
            rightTopClickable.push({
              tagName: el.tagName,
              className: el.className || '',
              position: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              },
              isClickable,
              hasSVG,
              svgName: svg?.getAttribute('name') || 'none',
              cursor: style.cursor,
              innerHTML: el.innerHTML.slice(0, 100)
            });
          }
        }
      });
      
      return rightTopClickable.sort((a, b) => a.position.x - b.position.x);
    });

    console.log(`🔍 在右上角区域找到 ${rightTopElements.length} 个元素:`);
    rightTopElements.forEach((el, index) => {
      console.log(`  ${index+1}: ${el.tagName} - 位置:(${el.position.x},${el.position.y}) - 大小:(${el.position.width}x${el.position.height})`);
      console.log(`    可点击:${el.isClickable} - SVG:${el.hasSVG}(${el.svgName}) - 鼠标:${el.cursor}`);
    });

    // 方法4: 查找特定的扫码按钮样式
    console.log('\n📋 方法4: 查找扫码按钮特征样式');
    
    const scanButtonStyles = await page.evaluate(() => {
      const allElements = document.querySelectorAll('div');
      const scanCandidates = [];
      
      allElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        
        // 查找符合扫码按钮特征的元素：
        // 1. 圆形或接近圆形
        // 2. 在页面右侧
        // 3. 包含SVG或有特定颜色
        if (rect.width > 20 && rect.height > 20 && rect.x > window.innerWidth * 0.7) {
          const isRoundish = Math.abs(rect.width - rect.height) < 10;
          const hasOrangeColor = style.borderColor.includes('249') || 
                                 style.backgroundColor.includes('249') ||
                                 style.color.includes('249') ||
                                 style.borderColor.includes('#F9') ||
                                 style.backgroundColor.includes('#F9');
          
          const hasSVG = el.querySelector('svg') !== null;
          const svg = el.querySelector('svg');
          
          if (isRoundish || hasOrangeColor || hasSVG) {
            scanCandidates.push({
              position: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              },
              isRoundish,
              hasOrangeColor,
              hasSVG,
              svgName: svg?.getAttribute('name') || 'none',
              borderColor: style.borderColor,
              backgroundColor: style.backgroundColor,
              borderRadius: style.borderRadius,
              className: el.className || ''
            });
          }
        }
      });
      
      return scanCandidates.sort((a, b) => b.position.x - a.position.x); // 按右侧优先排序
    });

    console.log(`🔍 找到 ${scanButtonStyles.length} 个扫码按钮候选元素:`);
    scanButtonStyles.forEach((el, index) => {
      console.log(`  ${index+1}: 位置:(${el.position.x},${el.position.y}) - 大小:(${el.position.width}x${el.position.height})`);
      console.log(`    圆形:${el.isRoundish} - 橙色:${el.hasOrangeColor} - SVG:${el.hasSVG}(${el.svgName})`);
      console.log(`    边框颜色:${el.borderColor} - 背景:${el.backgroundColor}`);
    });

    // 方法5: 尝试直接通过Playwright选择器找到具体的扫码按钮
    console.log('\n📋 方法5: 使用Playwright选择器精确定位');
    
    const possibleSelectors = [
      'div:has(svg[name="scan-outline"])',
      'TouchableOpacity:has(svg[name="scan-outline"])', 
      '[class*="scanButton"]',
      'div[style*="F9A889"]', // 橙色特征
      'div[style*="249, 168, 137"]', // RGB橙色特征
      'div:near(:text("Ended"))', // 在"Ended"附近
      'div:right-of(:text("Ended"))', // 在"Ended"右侧
    ];

    for (const selector of possibleSelectors) {
      try {
        const elements = await page.locator(selector).all();
        if (elements.length > 0) {
          console.log(`✅ 选择器"${selector}"找到 ${elements.length} 个元素:`);
          
          for (let i = 0; i < elements.length; i++) {
            const boundingBox = await elements[i].boundingBox();
            if (boundingBox) {
              console.log(`  ${i+1}: 位置:(${Math.round(boundingBox.x)},${Math.round(boundingBox.y)}) - 大小:(${Math.round(boundingBox.width)}x${Math.round(boundingBox.height)})`);
            }
          }
        }
      } catch (e) {
        console.log(`❌ 选择器"${selector}"失败: ${e.message}`);
      }
    }

    // 最终截图并高亮右上角区域
    await page.evaluate(() => {
      const rightArea = document.createElement('div');
      rightArea.style.position = 'fixed';
      rightArea.style.top = '0';
      rightArea.style.right = '0';
      rightArea.style.width = '25%';
      rightArea.style.height = '50%';
      rightArea.style.border = '3px solid blue';
      rightArea.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
      rightArea.style.zIndex = '9999';
      rightArea.style.pointerEvents = 'none';
      document.body.appendChild(rightArea);
    });

    await page.screenshot({
      path: '/Users/jietaoxie/pomeloX/frontend-web/test-results/dom-analysis-with-highlight.png',
      fullPage: true
    });
    console.log('📸 DOM分析截图已保存（高亮右上角区域）');

    console.log('✅ DOM结构分析完成');
  });
});





