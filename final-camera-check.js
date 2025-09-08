const BrowserTools = require('./browser-tools.js');

async function finalCameraCheck() {
  const tools = new BrowserTools();
  
  try {
    console.log('🎯 最终摄像头状态检查...');
    await tools.init();
    
    await tools.navigate('http://localhost:8090');
    
    // 等待一段时间让摄像头组件完全加载
    console.log('⏰ 等待摄像头组件完全加载...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // 截图当前状态
    console.log('📸 截图当前状态...');
    await tools.screenshot('final-camera-check.png');
    
    // 检查video元素详细信息
    console.log('📺 检查video元素详细信息...');
    const videoInfo = await tools.executeScript(() => {
      const videos = document.querySelectorAll('video');
      const videoDetails = Array.from(videos).map(video => {
        const rect = video.getBoundingClientRect();
        const style = window.getComputedStyle(video);
        
        return {
          exists: true,
          src: video.src || 'empty',
          srcObject: video.srcObject ? 'MediaStream present' : 'null',
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState,
          paused: video.paused,
          muted: video.muted,
          autoplay: video.autoplay,
          currentTime: video.currentTime,
          duration: video.duration,
          rect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          },
          computedStyle: {
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            backgroundColor: style.backgroundColor,
            position: style.position,
            zIndex: style.zIndex,
            objectFit: style.objectFit,
            transform: style.transform
          },
          attributes: Array.from(video.attributes).reduce((acc, attr) => {
            acc[attr.name] = attr.value;
            return acc;
          }, {})
        };
      });
      
      return {
        count: videos.length,
        details: videoDetails,
        pageTitle: document.title,
        bodyClass: document.body.className,
        hasStreamActive: window.currentCameraStream ? true : false
      };
    });
    
    console.log('📊 Video元素详细信息:');
    console.log(JSON.stringify(videoInfo, null, 2));
    
    // 如果有video元素但不显示，尝试修复样式
    if (videoInfo.count > 0) {
      console.log('🔧 尝试修复video元素显示问题...');
      
      const fixResult = await tools.executeScript(() => {
        const videos = document.querySelectorAll('video');
        let fixedCount = 0;
        
        videos.forEach((video, index) => {
          try {
            // 强制设置可见性样式
            video.style.visibility = 'visible';
            video.style.opacity = '1';
            video.style.display = 'block';
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.objectFit = 'cover';
            video.style.backgroundColor = 'black';
            video.style.zIndex = '1';
            
            // 确保video属性正确
            video.muted = true;
            video.setAttribute('muted', '');
            video.setAttribute('autoplay', '');
            video.setAttribute('playsinline', '');
            
            console.log(`🔧 修复video[${index}]:`, {
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              readyState: video.readyState,
              paused: video.paused
            });
            
            // 尝试重新播放
            video.play().then(() => {
              console.log(`✅ video[${index}] 播放成功`);
            }).catch(err => {
              console.log(`❌ video[${index}] 播放失败:`, err.message);
            });
            
            fixedCount++;
          } catch (error) {
            console.error(`修复video[${index}]失败:`, error);
          }
        });
        
        return {
          attemptedFixes: fixedCount,
          totalVideos: videos.length
        };
      });
      
      console.log('🔧 修复结果:', JSON.stringify(fixResult, null, 2));
      
      // 等待修复生效
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 再次截图看修复效果
      console.log('📸 截图修复后状态...');
      await tools.screenshot('camera-after-fix.png');
    }
    
    // 获取最新控制台日志
    console.log('📋 获取最新控制台日志...');
    const logs = await tools.getConsoleLogs();
    const recentLogs = logs.slice(-15);
    
    console.log('🔍 最近的控制台日志:');
    recentLogs.forEach(log => {
      console.log(`[${log.type}] ${log.text}`);
    });
    
    console.log('⏰ 保持浏览器开启15秒供手动检查...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('❌ 检查过程出错:', error);
  } finally {
    await tools.close();
    console.log('✅ 最终摄像头检查完成');
  }
}

finalCameraCheck();