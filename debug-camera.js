const BrowserTools = require('./browser-tools.js');

async function debugCamera() {
  const tools = new BrowserTools();
  
  try {
    console.log('🔍 检查摄像头状态...');
    await tools.init();
    
    // 导航到localhost:8090查看摄像头状态
    console.log('🌐 导航到PomeloX应用...');
    await tools.navigate('http://localhost:8090');
    
    // 等待页面加载
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 截图当前状态
    console.log('📸 截图当前摄像头状态...');
    await tools.screenshot('camera-debug-screenshot.png');
    
    // 获取控制台日志查看错误
    console.log('📋 获取控制台日志...');
    const logs = await tools.getConsoleLogs();
    console.log('🔍 最近的控制台日志:');
    logs.slice(-10).forEach(log => {
      console.log(`[${log.type}] ${log.text}`);
    });
    
    // 检查摄像头权限状态
    console.log('🔐 检查摄像头权限...');
    const cameraInfo = await tools.executeScript(() => {
      return new Promise((resolve) => {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            const videoTracks = stream.getVideoTracks();
            resolve({
              success: true,
              trackCount: videoTracks.length,
              tracks: videoTracks.map(track => ({
                label: track.label,
                enabled: track.enabled,
                readyState: track.readyState,
                settings: track.getSettings()
              }))
            });
            // 停止流
            stream.getTracks().forEach(track => track.stop());
          })
          .catch(error => {
            resolve({
              success: false,
              error: error.name,
              message: error.message
            });
          });
      });
    });
    
    console.log('🎥 摄像头权限检查结果:');
    console.log(JSON.stringify(cameraInfo, null, 2));
    
    // 检查页面上的video元素
    console.log('📺 检查页面video元素...');
    const videoElements = await tools.executeScript(() => {
      const videos = document.querySelectorAll('video');
      return Array.from(videos).map(video => ({
        src: video.src,
        srcObject: video.srcObject ? 'MediaStream' : null,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        paused: video.paused,
        muted: video.muted,
        autoplay: video.autoplay,
        style: {
          display: video.style.display,
          width: video.style.width,
          height: video.style.height,
          background: video.style.background
        }
      }));
    });
    
    console.log('📺 页面video元素信息:');
    console.log(JSON.stringify(videoElements, null, 2));
    
    // 保持浏览器开启供观察
    console.log('⏰ 保持浏览器开启10秒供观察...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ 调试过程中出错:', error);
  } finally {
    await tools.close();
    console.log('✅ 摄像头调试完成');
  }
}

debugCamera();