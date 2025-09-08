const BrowserTools = require('./browser-tools.js');

async function testFixedCamera() {
  const tools = new BrowserTools();
  
  try {
    console.log('🎯 测试修复后的摄像头显示...');
    await tools.init();
    
    await tools.navigate('http://localhost:8090');
    
    // 等待应用启动和摄像头组件加载
    console.log('⏰ 等待应用完全加载...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // 检查修复后的状态
    console.log('📊 检查修复后的video元素状态...');
    const videoStatus = await tools.executeScript(() => {
      const videos = document.querySelectorAll('video');
      
      if (videos.length === 0) {
        return { 
          hasVideo: false, 
          message: '没有找到video元素 - 可能还没有进入QR扫描页面' 
        };
      }
      
      const video = videos[0];
      const rect = video.getBoundingClientRect();
      
      return {
        hasVideo: true,
        count: videos.length,
        details: {
          srcObject: video.srcObject ? '有MediaStream' : '无MediaStream',
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState,
          paused: video.paused,
          muted: video.muted,
          autoplay: video.autoplay,
          currentTime: video.currentTime,
          rect: {
            width: rect.width,
            height: rect.height,
            visible: rect.width > 0 && rect.height > 0
          },
          computedStyle: {
            display: getComputedStyle(video).display,
            visibility: getComputedStyle(video).visibility,
            opacity: getComputedStyle(video).opacity,
            backgroundColor: getComputedStyle(video).backgroundColor,
            transform: getComputedStyle(video).transform
          }
        },
        pageTitle: document.title,
        isQRPage: document.title.includes('QR') || document.title.includes('Scanner')
      };
    });
    
    console.log('📋 修复后的video状态:');
    console.log(JSON.stringify(videoStatus, null, 2));
    
    // 截图当前状态
    console.log('📸 截图修复后状态...');
    await tools.screenshot('camera-fixed-test.png');
    
    // 如果仍然有问题，尝试手动触发修复
    if (videoStatus.hasVideo && (videoStatus.details.readyState === 0 || !videoStatus.details.srcObject)) {
      console.log('🔧 检测到问题，尝试手动修复...');
      
      const fixResult = await tools.executeScript(() => {
        const video = document.querySelector('video');
        if (!video) return { success: false, message: '没有video元素' };
        
        try {
          // 手动触发重新获取媒体流
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
              .then(stream => {
                console.log('🔧 手动获取到媒体流，设置到video元素');
                video.srcObject = stream;
                video.muted = true;
                video.autoplay = true;
                video.play().then(() => {
                  console.log('✅ 手动播放成功');
                }).catch(e => {
                  console.log('❌ 手动播放失败:', e.message);
                });
              })
              .catch(error => {
                console.error('❌ 手动获取媒体流失败:', error);
              });
            
            return { success: true, message: '已尝试手动修复' };
          }
          
          return { success: false, message: '不支持getUserMedia' };
        } catch (error) {
          return { success: false, message: error.message };
        }
      });
      
      console.log('🔧 手动修复结果:', JSON.stringify(fixResult, null, 2));
      
      // 等待修复生效
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 再次截图
      await tools.screenshot('camera-after-manual-fix.png');
    }
    
    // 获取最新的控制台日志
    console.log('📋 获取最新控制台日志...');
    const logs = await tools.getConsoleLogs();
    const recentLogs = logs.filter(log => 
      log.text.includes('EnhancedWebCameraView') || 
      log.text.includes('video') || 
      log.text.includes('camera') ||
      log.text.includes('MediaStream') ||
      log.text.includes('srcObject')
    ).slice(-10);
    
    console.log('🔍 相关的最新日志:');
    recentLogs.forEach(log => {
      console.log(`[${log.type}] ${log.text}`);
    });
    
    console.log('⏰ 保持浏览器开启10秒供观察效果...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ 测试过程出错:', error);
  } finally {
    await tools.close();
    console.log('✅ 修复后测试完成');
  }
}

testFixedCamera();