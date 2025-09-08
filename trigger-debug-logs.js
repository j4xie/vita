const BrowserTools = require('./browser-tools.js');

async function triggerDebugLogs() {
  const tools = new BrowserTools();
  
  try {
    console.log('🔍 触发详细调试日志...');
    await tools.init();
    
    await tools.navigate('http://localhost:8090');
    
    // 等待页面加载
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🎯 强制进入QR扫描页面触发所有调试日志...');
    
    // 强制进入QR页面并触发组件重新渲染
    await tools.executeScript(() => {
      // 多种方式尝试进入QR页面
      console.log('🔧 [DEBUG] 开始强制进入QR扫描页面...');
      
      // 方法1: 查找并点击扫码按钮
      const scanButtons = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = (el.textContent || '').trim();
        return text.includes('扫') && (el.tagName === 'BUTTON' || el.onclick || el.role === 'button');
      });
      
      if (scanButtons.length > 0) {
        console.log('🔧 [DEBUG] 找到扫码按钮，点击进入...');
        scanButtons[0].click();
      } else {
        console.log('🔧 [DEBUG] 没找到扫码按钮，使用其他方式...');
        
        // 方法2: 触发事件
        window.dispatchEvent(new CustomEvent('navigate-qr'));
        
        // 方法3: 强制触发React组件重新渲染
        window.dispatchEvent(new Event('resize'));
      }
      
      return { attempted: true, buttonFound: scanButtons.length > 0 };
    });
    
    console.log('⏰ 等待QR页面加载和所有调试日志输出...');
    await new Promise(resolve => setTimeout(resolve, 15000)); // 等待15秒让所有日志输出
    
    // 获取所有相关的控制台日志
    console.log('📋 获取详细调试日志...');
    const logs = await tools.getConsoleLogs();
    
    // 筛选EnhancedWebCameraView相关的日志
    const cameraLogs = logs.filter(log => 
      log.text.includes('EnhancedWebCameraView') ||
      log.text.includes('videoRef') ||
      log.text.includes('srcObject') ||
      log.text.includes('MediaStream') ||
      log.text.includes('CRITICAL')
    );
    
    console.log('🔍 摄像头组件相关日志 (按时间顺序):');
    cameraLogs.forEach((log, index) => {
      console.log(`${index + 1}. [${log.type}] ${log.text}`);
    });
    
    // 检查当前video元素状态
    console.log('\n📊 当前video元素详细状态:');
    const currentStatus = await tools.executeScript(() => {
      const videos = document.querySelectorAll('video');
      
      return {
        videoCount: videos.length,
        pageTitle: document.title,
        url: window.location.href,
        
        videoDetails: Array.from(videos).map((video, index) => ({
          index,
          exists: true,
          tagName: video.tagName,
          srcObject: video.srcObject ? 'MediaStream存在' : null,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState,
          paused: video.paused,
          muted: video.muted,
          autoplay: video.autoplay,
          currentTime: video.currentTime,
          
          rect: (() => {
            const rect = video.getBoundingClientRect();
            return {
              width: rect.width,
              height: rect.height,
              x: rect.x,
              y: rect.y,
              visible: rect.width > 0 && rect.height > 0
            };
          })(),
          
          computedStyle: (() => {
            const style = getComputedStyle(video);
            return {
              display: style.display,
              visibility: style.visibility,
              opacity: style.opacity,
              backgroundColor: style.backgroundColor,
              objectFit: style.objectFit
            };
          })(),
          
          attributes: Array.from(video.attributes).reduce((acc, attr) => {
            acc[attr.name] = attr.value;
            return acc;
          }, {})
        }))
      };
    });
    
    console.log(JSON.stringify(currentStatus, null, 2));
    
    // 截图当前状态
    await tools.screenshot('debug-logs-triggered.png');
    
    console.log('\n🎯 关键调试信息总结:');
    console.log('1. 查看上面的日志，找到 "videoRef.current存在: false" 的时刻');
    console.log('2. 查看是否有 "video元素ref回调执行" 的日志');
    console.log('3. 查看是否有 "CRITICAL ERROR" 的错误');
    console.log('4. 检查延迟重试是否成功执行');
    
  } catch (error) {
    console.error('❌ 触发调试日志失败:', error);
  } finally {
    await tools.close();
    console.log('✅ 调试日志触发完成');
    console.log('\n💡 现在请在你的浏览器控制台中查看详细的调试信息!');
  }
}

triggerDebugLogs();