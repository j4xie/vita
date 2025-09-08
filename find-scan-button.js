const BrowserTools = require('./browser-tools.js');

async function findScanButton() {
  const tools = new BrowserTools();
  
  try {
    console.log('🔍 查找扫一扫按钮...');
    await tools.init();
    
    await tools.navigate('http://localhost:8090');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 查找所有可能的扫码按钮
    console.log('🔎 搜索页面中所有包含"扫"字的元素...');
    const scanElements = await tools.executeScript(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      const scanRelated = [];
      
      allElements.forEach((el, index) => {
        const text = el.textContent || '';
        const hasClick = el.onclick || el.getAttribute('onclick');
        const isClickable = el.tagName === 'BUTTON' || el.role === 'button' || hasClick ||
                           el.style.cursor === 'pointer' || el.className.includes('touch') ||
                           el.className.includes('button') || el.className.includes('pressable');
        
        if ((text.includes('扫') || text.includes('Scan') || text.includes('QR')) && 
            (isClickable || el.tagName === 'BUTTON' || el.tagName === 'A')) {
          const rect = el.getBoundingClientRect();
          scanRelated.push({
            index,
            tagName: el.tagName,
            text: text.trim().substring(0, 50),
            className: el.className,
            id: el.id,
            isClickable,
            hasClick: !!hasClick,
            rect: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              visible: rect.width > 0 && rect.height > 0
            }
          });
        }
      });
      
      // 也查找可能的图标按钮
      const iconButtons = allElements.filter(el => {
        const className = el.className || '';
        const hasQRIcon = className.includes('qr') || className.includes('scan') || 
                         className.includes('camera') || className.includes('code');
        const isButton = el.tagName === 'BUTTON' || el.role === 'button' ||
                        className.includes('button') || className.includes('touch');
        return hasQRIcon && isButton;
      });
      
      iconButtons.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        scanRelated.push({
          index: 'icon-' + index,
          tagName: el.tagName,
          text: '(图标按钮)',
          className: el.className,
          id: el.id,
          isClickable: true,
          hasClick: !!(el.onclick || el.getAttribute('onclick')),
          rect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            visible: rect.width > 0 && rect.height > 0
          }
        });
      });
      
      return scanRelated;
    });
    
    console.log('📋 找到的扫码相关元素:');
    scanElements.forEach((el, i) => {
      console.log(`${i + 1}. [${el.tagName}] "${el.text}" (${el.className})`);
      console.log(`   位置: ${el.rect.x},${el.rect.y} 尺寸: ${el.rect.width}x${el.rect.height}`);
      console.log(`   可见: ${el.rect.visible}, 可点击: ${el.isClickable}`);
    });
    
    // 如果找到可能的按钮，尝试点击第一个
    if (scanElements.length > 0) {
      console.log('\n🎯 尝试点击第一个扫码按钮...');
      const firstButton = scanElements[0];
      
      try {
        await tools.executeScript((buttonInfo) => {
          const allElements = Array.from(document.querySelectorAll('*'));
          const targetElement = allElements[buttonInfo.index];
          if (targetElement) {
            targetElement.click();
            console.log('✅ 成功点击按钮:', buttonInfo.text);
            return true;
          }
          return false;
        }, firstButton);
        
        console.log('⏰ 等待摄像头页面加载...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 检查是否成功进入摄像头页面
        const hasCamera = await tools.executeScript(() => {
          const videos = document.querySelectorAll('video');
          const title = document.title;
          return {
            videoCount: videos.length,
            title,
            url: window.location.href
          };
        });
        
        console.log('📊 点击后页面状态:');
        console.log(JSON.stringify(hasCamera, null, 2));
        
        // 截图新状态
        await tools.screenshot('after-click-scan-button.png');
        
      } catch (error) {
        console.error('点击按钮失败:', error);
      }
    } else {
      console.log('❌ 未找到明显的扫码按钮');
      
      // 截图当前状态供手动查看
      await tools.screenshot('no-scan-button-found.png');
      console.log('📸 已截图当前页面状态，请手动查看按钮位置');
    }
    
    console.log('⏰ 保持浏览器开启10秒供手动操作...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ 查找过程出错:', error);
  } finally {
    await tools.close();
    console.log('✅ 查找扫码按钮完成');
  }
}

findScanButton();