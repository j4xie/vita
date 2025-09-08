const BrowserTools = require('./browser-tools.js');

async function fixCameraRealtime() {
  const tools = new BrowserTools();
  
  try {
    console.log('🔧 实时修复摄像头黑屏问题...');
    await tools.init();
    
    // 连接到当前正在运行的页面
    await tools.navigate('http://localhost:8090');
    
    // 等待页面稳定
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔍 诊断当前摄像头状态...');
    
    // 详细诊断当前video元素状态
    const diagnosis = await tools.executeScript(() => {
      const videos = document.querySelectorAll('video');
      
      if (videos.length === 0) {
        return { error: '没有找到video元素', hasVideo: false };
      }
      
      const video = videos[0];
      const stream = video.srcObject;
      
      return {
        hasVideo: true,
        diagnosis: {
          // 基本状态
          srcObject: stream ? 'MediaStream存在' : '无MediaStream',
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState,
          paused: video.paused,
          muted: video.muted,
          autoplay: video.autoplay,
          
          // 流状态
          streamActive: stream ? stream.active : false,
          streamId: stream ? stream.id : null,
          streamTracks: stream ? stream.getTracks().length : 0,
          videoTracks: stream ? stream.getVideoTracks().length : 0,
          
          // 元素样式
          rect: (() => {
            const rect = video.getBoundingClientRect();
            return { width: rect.width, height: rect.height, visible: rect.width > 0 && rect.height > 0 };
          })(),
          
          // 计算样式
          computedStyle: (() => {
            const style = getComputedStyle(video);
            return {
              display: style.display,
              visibility: style.visibility,
              opacity: style.opacity,
              backgroundColor: style.backgroundColor
            };
          })()
        }
      };
    });
    
    console.log('📊 诊断结果:');
    console.log(JSON.stringify(diagnosis, null, 2));
    
    if (!diagnosis.hasVideo) {
      console.log('❌ 没有找到video元素，无法修复');
      return;
    }
    
    // 根据诊断结果进行实时修复
    console.log('🛠️ 开始实时修复...');
    
    const fixResults = await tools.executeScript(() => {
      const video = document.querySelector('video');
      if (!video) return { success: false, message: '找不到video元素' };
      
      const fixes = [];
      
      try {
        // 修复1: 强制重新获取摄像头权限和流
        console.log('🔧 [修复1] 重新获取摄像头流...');
        
        navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        }).then(stream => {
          console.log('✅ [修复1] 获取到新的摄像头流:', stream.id);
          
          // 停止之前的流
          if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
          }
          
          // 设置新流
          video.srcObject = stream;
          
          // 强制设置属性
          video.muted = true;
          video.autoplay = true;
          video.playsInline = true;
          
          // 重新播放
          video.play().then(() => {
            console.log('✅ [修复1] 视频播放成功');
            fixes.push('重新获取摄像头流 - 成功');
          }).catch(err => {
            console.log('❌ [修复1] 视频播放失败:', err.message);
            fixes.push('重新获取摄像头流 - 播放失败');
          });
          
        }).catch(err => {
          console.log('❌ [修复1] 获取摄像头流失败:', err.message);
          fixes.push('重新获取摄像头流 - 失败: ' + err.message);
        });
        
        // 修复2: 强制样式重置
        console.log('🔧 [修复2] 重置video元素样式...');
        video.style.cssText = `
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          background-color: black !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: relative !important;
          z-index: 1 !important;
        `;
        fixes.push('重置样式 - 完成');
        
        // 修复3: 移除和重新添加video元素
        console.log('🔧 [修复3] 重新创建video元素...');
        const parent = video.parentNode;
        const newVideo = video.cloneNode(true);
        
        // 复制所有属性
        newVideo.muted = true;
        newVideo.autoplay = true;
        newVideo.playsInline = true;
        newVideo.controls = false;
        
        // 设置样式
        newVideo.style.cssText = video.style.cssText;
        
        parent.replaceChild(newVideo, video);
        fixes.push('重新创建video元素 - 完成');
        
        // 修复4: 检查并修复React组件状态
        console.log('🔧 [修复4] 触发React组件重新渲染...');
        
        // 触发窗口resize事件，可能会触发组件重新渲染
        window.dispatchEvent(new Event('resize'));
        fixes.push('触发组件重新渲染 - 完成');
        
        return { success: true, fixes: fixes };
        
      } catch (error) {
        return { success: false, message: error.message, fixes: fixes };
      }
    });
    
    console.log('🛠️ 修复结果:');
    console.log(JSON.stringify(fixResults, null, 2));
    
    // 等待修复生效
    console.log('⏰ 等待修复生效...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 再次诊断修复效果
    console.log('🔍 检查修复效果...');
    const postFixDiagnosis = await tools.executeScript(() => {
      const videos = document.querySelectorAll('video');
      if (videos.length === 0) return { hasVideo: false };
      
      const video = videos[0];
      return {
        hasVideo: true,
        srcObject: video.srcObject ? 'MediaStream存在' : '无MediaStream',
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        paused: video.paused,
        isPlaying: !video.paused && video.currentTime > 0 && !video.ended,
        currentTime: video.currentTime
      };
    });
    
    console.log('📊 修复后状态:');
    console.log(JSON.stringify(postFixDiagnosis, null, 2));
    
    // 截图验证
    console.log('📸 截图验证修复效果...');
    await tools.screenshot('camera-realtime-fix.png');
    
    console.log('⏰ 保持连接10秒供观察...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ 实时修复过程出错:', error);
  } finally {
    await tools.close();
    console.log('✅ 实时修复完成');
  }
}

fixCameraRealtime();