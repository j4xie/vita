/**
 * 🔍 精确定位扫码按钮
 * 
 * 重新确认扫码按钮的确切位置和属性
 */

import { test, expect } from '@playwright/test';

test.describe('扫码按钮位置确认', () => {
  test('🔍 精确定位扫码按钮的位置', async ({ page }) => {
    console.log('🎯 开始精确定位扫码按钮...');

    // 导航到首页
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('🚀 页面加载完成');

    // 截图当前页面状态
    await page.screenshot({
      path: '/Users/jietaoxie/pomeloX/frontend-web/test-results/page-full-view.png',
      fullPage: true
    });
    console.log('📸 全页面截图已保存');

    // 方法1: 查找所有可能的扫码相关元素
    console.log('\n📋 方法1: 查找所有扫码相关的元素');
    
    const scanElements = await page.evaluate(() => {
      const results = [];
      
      // 查找所有SVG元素
      const svgs = document.querySelectorAll('svg');
      svgs.forEach((svg, index) => {
        const rect = svg.getBoundingClientRect();
        const parent = svg.parentElement;
        
        if (rect.width > 0 && rect.height > 0) { // 只考虑可见的SVG
          results.push({
            type: 'svg',
            index,
            name: svg.getAttribute('name') || 'unnamed',
            position: {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            },
            parentTag: parent?.tagName || 'none',
            parentClass: parent?.className || '',
            isClickable: !!(
              parent?.onclick || 
              parent?.getAttribute('role') === 'button' ||
              parent?.tagName === 'BUTTON' ||
              parent?.style?.cursor === 'pointer'
            ),
            innerHTML: svg.outerHTML.slice(0, 100)
          });
        }
      });
      
      return results;
    });

    console.log(`🔍 找到 ${scanElements.length} 个可见的SVG元素:`);
    scanElements.forEach(el => {
      console.log(`  ${el.index}: ${el.name} - 位置:(${el.position.x},${el.position.y}) - 大小:(${el.position.width}x${el.position.height}) - 可点击:${el.isClickable} - 父元素:${el.parentTag}`);
    });

    // 方法2: 专门查找scan-outline图标
    console.log('\n📋 方法2: 专门查找scan-outline图标');
    
    const scanOutlineElements = await page.locator('svg[name="scan-outline"]').all();
    console.log(`🔍 找到 ${scanOutlineElements.length} 个scan-outline图标`);
    
    for (let i = 0; i < scanOutlineElements.length; i++) {
      const svg = scanOutlineElements[i];
      const boundingBox = await svg.boundingBox();
      const isVisible = await svg.isVisible();
      
      if (boundingBox && isVisible) {
        console.log(`  scan-outline ${i+1}: 位置:(${Math.round(boundingBox.x)},${Math.round(boundingBox.y)}) - 大小:(${Math.round(boundingBox.width)}x${Math.round(boundingBox.height)})`);
        
        // 检查父元素
        const parentInfo = await svg.evaluate(el => {
          const parent = el.parentElement;
          return parent ? {
            tagName: parent.tagName,
            className: parent.className || '',
            onclick: !!parent.onclick,
            role: parent.getAttribute('role') || '',
            style: parent.getAttribute('style') || '',
            dataTestId: parent.getAttribute('data-testid') || ''
          } : null;
        });
        
        console.log(`    父元素信息:`, parentInfo);
      }
    }

    // 方法3: 查找category bar及其右侧按钮
    console.log('\n📋 方法3: 分析category bar结构');
    
    const categoryBarInfo = await page.evaluate(() => {
      // 查找包含All, Upcoming, Ended的容器
      const allDivs = document.querySelectorAll('div');
      let categoryBar = null;
      
      for (const div of allDivs) {
        const text = div.textContent || '';
        if (text.includes('All') && text.includes('Upcoming') && text.includes('Ended')) {
          categoryBar = div;
          break;
        }
      }
      
      if (!categoryBar) return null;
      
      const rect = categoryBar.getBoundingClientRect();
      const children = Array.from(categoryBar.children);
      
      return {
        categoryBar: {
          position: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          childrenCount: children.length,
          textContent: categoryBar.textContent?.slice(0, 100) || ''
        },
        children: children.map((child, index) => {
          const childRect = child.getBoundingClientRect();
          const hasSVG = child.querySelector('svg') !== null;
          const svg = child.querySelector('svg');
          
          return {
            index,
            tagName: child.tagName,
            className: child.className || '',
            position: {
              x: Math.round(childRect.x),
              y: Math.round(childRect.y),
              width: Math.round(childRect.width),
              height: Math.round(childRect.height)
            },
            hasSVG,
            svgName: svg?.getAttribute('name') || 'none',
            isVisible: childRect.width > 0 && childRect.height > 0,
            textContent: child.textContent?.slice(0, 30) || '',
            isAtRightEdge: Math.abs(childRect.right - rect.right) < 50 // 判断是否在右边缘
          };
        })
      };
    });

    if (categoryBarInfo) {
      console.log('✅ 找到category bar容器:');
      console.log(`  位置: (${categoryBarInfo.categoryBar.position.x}, ${categoryBarInfo.categoryBar.position.y})`);
      console.log(`  大小: ${categoryBarInfo.categoryBar.position.width}x${categoryBarInfo.categoryBar.position.height}`);
      console.log(`  子元素数量: ${categoryBarInfo.categoryBar.childrenCount}`);
      
      console.log('\n🔍 Category bar子元素详情:');
      categoryBarInfo.children.forEach(child => {
        console.log(`  ${child.index}: ${child.tagName} - 位置:(${child.position.x},${child.position.y}) - 大小:(${child.position.width}x${child.position.height})`);
        console.log(`    包含SVG: ${child.hasSVG} (${child.svgName}) - 在右边缘: ${child.isAtRightEdge} - 文字: "${child.textContent}"`);
      });
      
      // 找到最右侧且包含SVG的元素
      const rightMostSVGElement = categoryBarInfo.children
        .filter(child => child.hasSVG && child.isVisible)
        .sort((a, b) => b.position.x - a.position.x)[0]; // 按x坐标倒序排列，取第一个
      
      if (rightMostSVGElement) {
        console.log('\n✅ 识别的扫码按钮:');
        console.log(`  索引: ${rightMostSVGElement.index}`);
        console.log(`  SVG名称: ${rightMostSVGElement.svgName}`);
        console.log(`  位置: (${rightMostSVGElement.position.x}, ${rightMostSVGElement.position.y})`);
        console.log(`  大小: ${rightMostSVGElement.position.width}x${rightMostSVGElement.position.height}`);
        console.log(`  是否在右边缘: ${rightMostSVGElement.isAtRightEdge}`);
      }
    } else {
      console.log('❌ 未找到category bar容器');
    }

    // 方法4: 查找所有圆形按钮（可能的扫码按钮特征）
    console.log('\n📋 方法4: 查找圆形按钮');
    
    const roundButtons = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const roundElements = [];
      
      for (const el of allElements) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        
        // 判断是否为圆形（width ≈ height 且有border-radius）
        if (rect.width > 20 && rect.height > 20 && 
            Math.abs(rect.width - rect.height) < 5 &&
            (style.borderRadius.includes('%') || 
             parseInt(style.borderRadius) > rect.width * 0.4)) {
          
          const hasSVG = el.querySelector('svg') !== null;
          const svg = el.querySelector('svg');
          
          roundElements.push({
            tagName: el.tagName,
            className: el.className || '',
            position: {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            },
            borderRadius: style.borderRadius,
            hasSVG,
            svgName: svg?.getAttribute('name') || 'none',
            backgroundColor: style.backgroundColor,
            isClickable: !!(
              el.onclick || 
              el.getAttribute('role') === 'button' ||
              el.tagName === 'BUTTON' ||
              style.cursor === 'pointer'
            )
          });
        }
      }
      
      return roundElements;
    });

    console.log(`🔍 找到 ${roundButtons.length} 个圆形元素:`);
    roundButtons.forEach((btn, index) => {
      console.log(`  ${index+1}: ${btn.tagName} - 位置:(${btn.position.x},${btn.position.y}) - 大小:(${btn.position.width}x${btn.position.height})`);
      console.log(`    SVG: ${btn.hasSVG} (${btn.svgName}) - 可点击: ${btn.isClickable} - 圆角: ${btn.borderRadius}`);
    });

    // 基于所有信息进行最终确认
    console.log('\n🎯 最终确认扫码按钮位置:');
    
    const finalScanButton = await page.locator('div').filter({
      has: page.locator('svg[name="scan-outline"]')
    }).first();
    
    if (await finalScanButton.isVisible()) {
      const boundingBox = await finalScanButton.boundingBox();
      if (boundingBox) {
        console.log('✅ 确认找到扫码按钮:');
        console.log(`  精确位置: (${boundingBox.x}, ${boundingBox.y})`);
        console.log(`  精确大小: ${boundingBox.width}x${boundingBox.height}`);
        
        // 高亮显示这个按钮
        await finalScanButton.evaluate(el => {
          el.style.border = '3px solid red';
          el.style.boxShadow = '0 0 10px red';
        });
        
        // 截图高亮状态
        await page.screenshot({
          path: '/Users/jietaoxie/pomeloX/frontend-web/test-results/scan-button-highlighted.png'
        });
        console.log('📸 高亮扫码按钮的截图已保存');
        
        // 取消高亮
        await finalScanButton.evaluate(el => {
          el.style.border = '';
          el.style.boxShadow = '';
        });
      }
    } else {
      console.log('❌ 最终确认：未找到扫码按钮');
    }

    console.log('✅ 扫码按钮位置确认完成');
  });
});







