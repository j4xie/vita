const BrowserTools = require('./browser-tools.js');

async function urgentCameraFix() {
  const tools = new BrowserTools();
  
  try {
    console.log('🚨 紧急修复摄像头显示问题...');
    await tools.init();
    
    await tools.navigate('http://localhost:8090');
    
    // 等待页面加载
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔍 检查当前摄像头详细状态...');
    
    const diagnosis = await tools.executeScript(() => {
      const videos = document.querySelectorAll('video');
      
      if (videos.length === 0) {
        return { 
          error: '没有video元素，可能需要进入QR页面',
          needsNavigation: true 
        };
      }
      
      const video = videos[0];
      const stream = video.srcObject;
      
      return {
        hasVideo: true,
        videoElement: {
          tagName: video.tagName,
          srcObject: stream ? `MediaStream(${stream.id})` : null,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState,
          paused: video.paused,
          muted: video.muted,
          autoplay: video.autoplay,
          currentTime: video.currentTime,
          duration: video.duration,
          
          // 样式检查
          rect: (() => {
            const rect = video.getBoundingClientRect();
            return {
              x: rect.x, y: rect.y,
              width: rect.width, height: rect.height,
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
              objectFit: style.objectFit,
              transform: style.transform,
              zIndex: style.zIndex,
              position: style.position
            };
          })(),
          
          // 属性检查
          attributes: Array.from(video.attributes).reduce((acc, attr) => {
            acc[attr.name] = attr.value;
            return acc;
          }, {})
        },
        
        // 流信息
        streamInfo: stream ? {
          id: stream.id,
          active: stream.active,
          tracks: stream.getTracks().length,
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length,
          trackStates: stream.getTracks().map(track => ({
            kind: track.kind,
            enabled: track.enabled,
            readyState: track.readyState,
            muted: track.muted
          }))
        } : null,
        
        pageInfo: {
          title: document.title,
          url: window.location.href,
          isQRPage: document.title.includes('QR') || document.title.includes('Scanner')
        }
      };
    });
    
    console.log('📊 详细诊断结果:');
    console.log(JSON.stringify(diagnosis, null, 2));
    
    if (diagnosis.needsNavigation) {
      console.log('🔄 需要先进入QR扫描页面...');
      
      // 自动点击进入QR页面
      const clickResult = await tools.executeScript(() => {
        const scanButtons = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = el.textContent || '';
          return (text.includes('扫') || text.includes('Scan') || text.includes('QR')) && 
                 (el.tagName === 'BUTTON' || el.role === 'button' || 
                  el.onclick || el.style.cursor === 'pointer');
        });
        
        if (scanButtons.length > 0) {
          scanButtons[0].click();
          return { success: true, clicked: scanButtons[0].textContent };
        }
        return { success: false };
      });
      
      console.log('🎯 点击结果:', clickResult);
      
      // 等待导航
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 重新诊断
      const newDiagnosis = await tools.executeScript(() => {
        const videos = document.querySelectorAll('video');
        return {
          hasVideo: videos.length > 0,
          title: document.title,
          videoCount: videos.length
        };
      });
      
      console.log('🔄 导航后状态:', newDiagnosis);
    }
    
    console.log('🛠️ 开始强力修复...');
    
    const fixResult = await tools.executeScript(() => {
      const video = document.querySelector('video');
      if (!video) return { error: '没有找到video元素' };
      
      const fixes = [];
      let success = false;
      
      try {
        // 修复1: 立即强制获取新的摄像头流
        console.log('🔧 [修复1] 强制获取摄像头流...');
        
        const constraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'environment'
          }
        };
        
        navigator.mediaDevices.getUserMedia(constraints)
          .then(newStream => {
            console.log('✅ 获取到新流:', newStream.id);
            
            // 立即停止旧流
            if (video.srcObject) {
              video.srcObject.getTracks().forEach(track => {
                track.stop();
                console.log('🛑 停止旧track:', track.kind);
              });
            }
            
            // 设置新流
            video.srcObject = newStream;
            
            // 强制设置所有必要属性
            video.muted = true;
            video.autoplay = true;
            video.playsInline = true;
            
            // 强制样式
            video.style.cssText = `
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              background-color: #000 !important;
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
              position: relative !important;
              z-index: 10 !important;
            `;
            
            // 立即播放
            const playPromise = video.play();
            if (playPromise) {
              playPromise.then(() => {
                console.log('✅ 视频播放成功!');
                success = true;
              }).catch(err => {
                console.error('❌ 播放失败:', err);
              });
            }
            
            fixes.push('强制获取新摄像头流 - 执行中');
            
          })
          .catch(err => {
            console.error('❌ 获取摄像头失败:', err);
            fixes.push('获取摄像头失败: ' + err.message);
          });
        
        // 修复2: DOM强制刷新
        console.log('🔧 [修复2] DOM强制刷新...');
        const parent = video.parentElement;
        const nextSibling = video.nextSibling;
        parent.removeChild(video);
        
        setTimeout(() => {
          parent.insertBefore(video, nextSibling);
          fixes.push('DOM强制刷新 - 完成');
        }, 100);
        
        // 修复3: 触发窗口事件
        console.log('🔧 [修复3] 触发窗口事件...');
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('focus'));
        fixes.push('触发窗口事件 - 完成');
        
        return { success: true, fixes, message: '修复执行完成' };
        
      } catch (error) {
        return { success: false, error: error.message, fixes };
      }
    });
    
    console.log('🛠️ 修复执行结果:');
    console.log(JSON.stringify(fixResult, null, 2));
    
    // 等待修复生效
    console.log('⏰ 等待修复生效...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // 最终检查
    console.log('🔍 最终状态检查...');
    const finalCheck = await tools.executeScript(() => {
      const video = document.querySelector('video');
      if (!video) return { hasVideo: false };
      
      return {
        hasVideo: true,
        srcObject: video.srcObject ? 'MediaStream存在' : '无流',
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        paused: video.paused,
        currentTime: video.currentTime,
        isActuallyPlaying: !video.paused && video.currentTime > 0 && !video.ended,
        rect: (() => {
          const rect = video.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        })()
      };
    });
    
    console.log('📊 最终检查结果:');
    console.log(JSON.stringify(finalCheck, null, 2));
    
    // 截图最终状态
    await tools.screenshot('urgent-camera-fix-final.png');
    
    if (finalCheck.hasVideo && finalCheck.srcObject === 'MediaStream存在') {
      console.log('🎉 修复成功! 摄像头应该可以正常显示了!');
    } else {
      console.log('⚠️ 修复仍有问题，可能需要进一步调试');
    }
    
    console.log('⏰ 保持浏览器开启供观察...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('❌ 紧急修复失败:', error);
  } finally {
    await tools.close();
    console.log('✅ 紧急修复完成');
  }
}

urgentCameraFix();