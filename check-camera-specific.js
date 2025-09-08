const BrowserTools = require('./browser-tools.js');

async function checkCameraSpecific() {
  const tools = new BrowserTools();
  
  try {
    console.log('🎯 专门检查摄像头状态...');
    await tools.init();
    
    console.log('🌐 导航到QR扫描页面...');
    await tools.navigate('http://localhost:8090');
    
    // 等待页面完全加载
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 点击扫一扫按钮进入摄像头页面
    console.log('🔍 查找扫一扫按钮...');
    try {
      // 查找可能的扫码按钮
      await tools.waitForSelector('[data-testid="scan-button"]', 3000).catch(() => {});
      await tools.click('[data-testid="scan-button"]').catch(() => {});
    } catch (e) {
      console.log('未找到scan-button，尝试其他选择器...');
      
      // 尝试其他可能的扫码入口
      try {
        // 可能是文本包含"扫"的按钮
        const hasManualClick = await tools.executeScript(() => {
          const buttons = Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent && el.textContent.includes('扫')
          );
          if (buttons.length > 0) {
            buttons[0].click();
            return true;
          }
          return false;
        });
        if (hasManualClick) {
          console.log('✅ 通过文本匹配点击了扫码按钮');
        }
      } catch (e2) {
        console.log('手动点击也失败，继续检查当前页面...');
      }
    }
    
    // 再等待一下让摄像头完全启动
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 详细检查video元素和摄像头状态
    console.log('📺 详细检查video元素...');
    const detailedVideoInfo = await tools.executeScript(() => {
      const videos = document.querySelectorAll('video');
      const allElements = document.querySelectorAll('*[style*="video"], *[style*="camera"]');
      
      console.log(`发现 ${videos.length} 个video元素`);
      console.log(`发现 ${allElements.length} 个可能的摄像头相关元素`);
      
      const videoDetails = Array.from(videos).map((video, index) => {
        const rect = video.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(video);
        
        return {
          index,
          tagName: video.tagName,
          src: video.src,
          srcObject: video.srcObject ? 'MediaStream存在' : 'null',
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState,
          paused: video.paused,
          muted: video.muted,
          autoplay: video.autoplay,
          currentTime: video.currentTime,
          duration: video.duration || 'undefined',
          rect: {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
            visible: rect.width > 0 && rect.height > 0
          },
          computedStyle: {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            width: computedStyle.width,
            height: computedStyle.height,
            objectFit: computedStyle.objectFit,
            backgroundColor: computedStyle.backgroundColor
          },
          attributes: {
            id: video.id,
            className: video.className,
            style: video.getAttribute('style')
          }
        };
      });
      
      return {
        videoCount: videos.length,
        relatedElementsCount: allElements.length,
        videoDetails,
        pageTitle: document.title,
        currentUrl: window.location.href
      };
    });
    
    console.log('📊 详细video信息:');
    console.log(JSON.stringify(detailedVideoInfo, null, 2));
    
    // 截图当前状态
    console.log('📸 截图当前摄像头状态...');
    await tools.screenshot('camera-detailed-debug.png');
    
    // 检查是否有JavaScript错误
    console.log('🔍 检查JavaScript错误...');
    const jsErrors = await tools.executeScript(() => {
      // 检查控制台错误（如果有的话）
      const errors = [];
      
      // 尝试获取最近的错误信息
      if (window.console && window.console.error) {
        // 这里我们不能直接访问console历史，但可以检查一些全局错误状态
      }
      
      return {
        userAgent: navigator.userAgent,
        mediaDevicesSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        streamActive: !!window.currentCameraStream,
        timestamp: new Date().toISOString()
      };
    });
    
    console.log('🔧 浏览器环境信息:');
    console.log(JSON.stringify(jsErrors, null, 2));
    
    console.log('⏰ 保持浏览器开启10秒供观察...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ 检查过程中出错:', error);
  } finally {
    await tools.close();
    console.log('✅ 摄像头详细检查完成');
  }
}

checkCameraSpecific();