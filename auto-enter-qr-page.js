const BrowserTools = require('./browser-tools.js');

async function autoEnterQRPage() {
  const tools = new BrowserTools();
  
  try {
    console.log('🎯 自动进入QR扫描页面...');
    await tools.init();
    
    await tools.navigate('http://localhost:8090');
    
    // 等待页面完全加载
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔍 查找并点击扫码入口...');
    
    // 尝试多种方式找到扫码按钮
    const clickResult = await tools.executeScript(() => {
      const attempts = [];
      let success = false;
      
      // 方法1: 查找包含"扫"字的可点击元素
      const elementsWithScan = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || '';
        return (text.includes('扫') || text.includes('Scan') || text.includes('QR')) && 
               (el.tagName === 'BUTTON' || el.role === 'button' || 
                el.onclick || el.style.cursor === 'pointer' ||
                el.className.includes('touch') || el.className.includes('pressable'));
      });
      
      if (elementsWithScan.length > 0) {
        elementsWithScan[0].click();
        attempts.push('点击包含"扫"字的按钮 - 成功');
        success = true;
      } else {
        attempts.push('未找到包含"扫"字的按钮');
      }
      
      // 方法2: 查找可能的QR图标按钮
      if (!success) {
        const iconButtons = Array.from(document.querySelectorAll('*')).filter(el => {
          const className = el.className || '';
          return (className.includes('qr') || className.includes('scan') || 
                  className.includes('camera')) && 
                 (el.tagName === 'BUTTON' || el.role === 'button' ||
                  className.includes('button') || className.includes('touch'));
        });
        
        if (iconButtons.length > 0) {
          iconButtons[0].click();
          attempts.push('点击QR图标按钮 - 成功');
          success = true;
        } else {
          attempts.push('未找到QR图标按钮');
        }
      }
      
      // 方法3: 查找TabBar中可能的扫码入口
      if (!success) {
        const tabButtons = Array.from(document.querySelectorAll('[role="button"], button')).filter(el => {
          const text = (el.textContent || '').toLowerCase();
          const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
          return text.includes('scan') || ariaLabel.includes('scan') || 
                 text.includes('qr') || ariaLabel.includes('qr');
        });
        
        if (tabButtons.length > 0) {
          tabButtons[0].click();
          attempts.push('点击Tab中的扫码按钮 - 成功');
          success = true;
        } else {
          attempts.push('未找到Tab中的扫码按钮');
        }
      }
      
      // 方法4: 检查右上角搜索按钮区域
      if (!success) {
        // 从日志看到有showSearchButton: true，可能右上角有按钮
        const headerButtons = Array.from(document.querySelectorAll('header *, .header *, [class*="header"] *')).filter(el => 
          el.tagName === 'BUTTON' || el.role === 'button' || el.onclick
        );
        
        if (headerButtons.length > 0) {
          headerButtons[0].click();
          attempts.push('点击header区域按钮 - 成功');
          success = true;
        } else {
          attempts.push('未找到header区域按钮');
        }
      }
      
      // 方法5: 直接通过React Navigation触发
      if (!success) {
        // 尝试触发导航事件
        const navigationEvent = new CustomEvent('navigate-to-qr', { detail: { route: 'QRScanner' } });
        window.dispatchEvent(navigationEvent);
        attempts.push('触发自定义导航事件 - 已发送');
      }
      
      return { attempts, success, currentUrl: window.location.href };
    });
    
    console.log('🔍 点击尝试结果:');
    console.log(JSON.stringify(clickResult, null, 2));
    
    // 等待导航
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 检查是否成功进入QR页面
    const pageStatus = await tools.executeScript(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasVideo: document.querySelectorAll('video').length > 0,
        pageContent: document.body.textContent.includes('QR') || document.body.textContent.includes('扫'),
        visibleElements: Array.from(document.querySelectorAll('*')).filter(el => {
          const rect = el.getBoundingClientRect();
          const text = el.textContent || '';
          return rect.width > 0 && rect.height > 0 && 
                 (text.includes('QR') || text.includes('扫') || text.includes('Camera'));
        }).length
      };
    });
    
    console.log('📊 页面状态检查:');
    console.log(JSON.stringify(pageStatus, null, 2));
    
    if (pageStatus.hasVideo || pageStatus.title.includes('QR')) {
      console.log('✅ 成功进入QR扫描页面！');
      
      // 等待摄像头组件加载
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 检查摄像头状态
      const cameraStatus = await tools.executeScript(() => {
        const videos = document.querySelectorAll('video');
        if (videos.length === 0) return { hasVideo: false };
        
        const video = videos[0];
        return {
          hasVideo: true,
          srcObject: video.srcObject ? 'MediaStream存在' : '无MediaStream',
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState,
          paused: video.paused
        };
      });
      
      console.log('📹 摄像头状态:');
      console.log(JSON.stringify(cameraStatus, null, 2));
      
      // 截图最终状态
      await tools.screenshot('auto-qr-entry-success.png');
      
    } else {
      console.log('❌ 未能进入QR扫描页面，尝试手动方式...');
      
      // 截图当前状态供分析
      await tools.screenshot('qr-entry-failed.png');
      
      console.log('💡 请手动在页面上找到"扫一扫"或"扫码"按钮点击');
      console.log('💡 可能的位置：');
      console.log('   - 右上角搜索/扫码图标');
      console.log('   - 底部导航栏');
      console.log('   - 浮动按钮');
      console.log('   - 活动卡片上的扫码按钮');
    }
    
    console.log('⏰ 保持浏览器开启15秒供手动操作...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('❌ 自动进入QR页面失败:', error);
  } finally {
    await tools.close();
    console.log('✅ 自动进入QR页面过程完成');
  }
}

autoEnterQRPage();