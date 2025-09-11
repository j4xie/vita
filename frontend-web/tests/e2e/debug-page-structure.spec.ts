/**
 * 🔍 页面结构调试测试
 * 
 * 详细分析页面结构，找到扫码按钮的确切位置
 */

import { test, expect } from '@playwright/test';

test.describe('页面结构调试', () => {
  test('🔍 详细分析页面结构和扫码按钮', async ({ page }) => {
    console.log('🎯 开始页面结构调试...');

    // 导航到首页
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('🚀 页面加载完成');

    // 步骤1: 分析整体页面结构
    console.log('📋 步骤1: 分析整体页面结构');
    
    const pageStructure = await page.evaluate(() => {
      const getAllElements = (element: Element, depth = 0, maxDepth = 3): any => {
        if (depth > maxDepth) return null;
        
        return {
          tagName: element.tagName,
          className: element.className || '',
          id: element.id || '',
          textContent: element.textContent?.slice(0, 50) || '',
          hasChildren: element.children.length > 0,
          childrenCount: element.children.length,
          children: depth < maxDepth ? Array.from(element.children).map(child => 
            getAllElements(child, depth + 1, maxDepth)
          ).filter(Boolean) : []
        };
      };

      return {
        title: document.title,
        url: window.location.href,
        bodyStructure: getAllElements(document.body),
        totalElements: document.querySelectorAll('*').length,
        totalSVGs: document.querySelectorAll('svg').length,
        totalButtons: document.querySelectorAll('button, [role="button"], div[onclick]').length
      };
    });

    console.log('📊 页面整体结构:', {
      title: pageStructure.title,
      url: pageStructure.url,
      totalElements: pageStructure.totalElements,
      totalSVGs: pageStructure.totalSVGs,
      totalButtons: pageStructure.totalButtons
    });

    // 步骤2: 查找所有SVG元素
    console.log('📋 步骤2: 分析所有SVG元素');
    
    const svgAnalysis = await page.evaluate(() => {
      const svgs = document.querySelectorAll('svg');
      return Array.from(svgs).map((svg, index) => {
        const rect = svg.getBoundingClientRect();
        const parent = svg.parentElement;
        const grandParent = parent?.parentElement;
        
        return {
          index,
          name: svg.getAttribute('name') || '',
          className: svg.className || '',
          visible: svg.offsetParent !== null,
          position: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          parent: {
            tagName: parent?.tagName || '',
            className: parent?.className || '',
            onclick: parent?.onclick ? 'has-onclick' : 'no-onclick',
            role: parent?.getAttribute('role') || ''
          },
          grandParent: {
            tagName: grandParent?.tagName || '',
            className: grandParent?.className || ''
          },
          isClickable: !!svg.closest('button, [role="button"], div[onclick], *[onPress]'),
          nearbyText: svg.closest('div')?.textContent?.slice(0, 100) || ''
        };
      }).filter(svg => svg.visible);
    });

    console.log('📊 所有可见SVG元素:');
    svgAnalysis.forEach((svg, i) => {
      console.log(`  ${i+1}. ${svg.name || '无名称'} - 位置:(${svg.position.x},${svg.position.y}) - 可点击:${svg.isClickable} - 父元素:${svg.parent.tagName}`);
    });

    // 步骤3: 查找包含分类文字的区域
    console.log('📋 步骤3: 查找分类按钮区域');
    
    const categoryAnalysis = await page.evaluate(() => {
      // 查找包含 All, Upcoming, Ended 的元素
      const textElements = document.querySelectorAll('*');
      const categoryElements = Array.from(textElements).filter(el => {
        const text = el.textContent || '';
        return text.includes('All') && text.includes('Upcoming') && text.includes('Ended');
      });

      return categoryElements.map((el, index) => {
        const rect = el.getBoundingClientRect();
        const svgsInside = el.querySelectorAll('svg');
        
        return {
          index,
          tagName: el.tagName,
          className: el.className || '',
          textContent: el.textContent?.slice(0, 100) || '',
          position: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          svgCount: svgsInside.length,
          svgs: Array.from(svgsInside).map(svg => ({
            name: svg.getAttribute('name') || '',
            className: svg.className || ''
          }))
        };
      });
    });

    console.log('📊 分类按钮区域分析:');
    categoryAnalysis.forEach((area, i) => {
      console.log(`  ${i+1}. ${area.tagName} - SVG数量:${area.svgCount} - 文字:${area.textContent.slice(0, 50)}`);
      area.svgs.forEach((svg, j) => {
        console.log(`    SVG ${j+1}: ${svg.name || '无名称'}`);
      });
    });

    // 步骤4: 尝试直接查找具体的扫码相关元素
    console.log('📋 步骤4: 查找扫码相关元素');
    
    const scanRelatedAnalysis = await page.evaluate(() => {
      const results = {
        scanOutlineSVGs: [],
        scanTextElements: [],
        ionicons: [],
        touchableElements: []
      } as any;

      // 查找 scan-outline SVG
      const scanSVGs = document.querySelectorAll('svg[name*="scan"]');
      results.scanOutlineSVGs = Array.from(scanSVGs).map(svg => ({
        name: svg.getAttribute('name'),
        visible: svg.offsetParent !== null,
        parent: svg.parentElement?.tagName,
        clickable: !!svg.closest('button, [role="button"], div[onclick]')
      }));

      // 查找包含"扫"字的元素
      const allElements = document.querySelectorAll('*');
      results.scanTextElements = Array.from(allElements).filter(el => 
        el.textContent?.includes('扫') || el.textContent?.includes('scan')
      ).map(el => ({
        tagName: el.tagName,
        textContent: el.textContent?.slice(0, 50),
        visible: el.offsetParent !== null
      }));

      // 查找所有Ionicons图标
      const ionicons = document.querySelectorAll('svg');
      results.ionicons = Array.from(ionicons).map(svg => ({
        name: svg.getAttribute('name') || 'unnamed',
        visible: svg.offsetParent !== null
      })).filter(icon => icon.visible);

      // 查找可能的TouchableOpacity元素（React Native Web转换）
      const touchables = document.querySelectorAll('div[style*="cursor"], div[onclick], button, [role="button"]');
      results.touchableElements = Array.from(touchables).slice(0, 10).map(el => {
        const rect = el.getBoundingClientRect();
        return {
          tagName: el.tagName,
          className: el.className?.slice(0, 50) || '',
          hasChildren: el.children.length > 0,
          childSVGs: el.querySelectorAll('svg').length,
          position: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          visible: el.offsetParent !== null
        };
      }).filter(el => el.visible);

      return results;
    });

    console.log('📊 扫码相关元素分析:');
    console.log('  scan-outline SVG数量:', scanRelatedAnalysis.scanOutlineSVGs.length);
    console.log('  包含"扫"字的元素:', scanRelatedAnalysis.scanTextElements.length);
    console.log('  可见Ionicons数量:', scanRelatedAnalysis.ionicons.length);
    console.log('  可点击元素数量:', scanRelatedAnalysis.touchableElements.length);

    // 显示详细信息
    if (scanRelatedAnalysis.ionicons.length > 0) {
      console.log('  所有可见图标名称:');
      scanRelatedAnalysis.ionicons.forEach((icon: any, i: number) => {
        console.log(`    ${i+1}. ${icon.name}`);
      });
    }

    // 步骤5: 截图保存当前页面状态
    await page.screenshot({ 
      path: '/Users/jietaoxie/pomeloX/frontend-web/test-results/page-debug-structure.png',
      fullPage: true 
    });
    console.log('📸 页面结构调试截图已保存');

    console.log('✅ 页面结构调试完成');
  });
});




