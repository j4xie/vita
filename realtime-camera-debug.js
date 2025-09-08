const BrowserTools = require('./browser-tools.js');

async function realtimeCameraDebug() {
  const tools = new BrowserTools();
  
  try {
    console.log('🔧 实时摄像头调试（页面已在QR扫描模式）...');
    await tools.init();
    
    // 连接到正在运行的QR页面
    await tools.navigate('http://localhost:8090');
    
    // 稍等一下让页面稳定
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔍 检查当前video元素状态...');
    
    const realTimeStatus = await tools.executeScript(() => {
      const videos = document.querySelectorAll('video');
      
      if (videos.length === 0) {
        return { error: '没有找到video元素', needsAction: 'navigate_to_qr' };
      }
      
      const video = videos[0];
      const stream = video.srcObject;
      
      // 获取详细信息
      const status = {
        hasVideo: true,
        
        // Video元素基本信息
        video: {
          srcObject: stream ? `MediaStream(id: ${stream.id})` : null,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState, // 0=HAVE_NOTHING, 1=HAVE_METADATA, 2=HAVE_CURRENT_DATA, 3=HAVE_FUTURE_DATA, 4=HAVE_ENOUGH_DATA
          paused: video.paused,
          muted: video.muted,
          autoplay: video.autoplay,
          currentTime: video.currentTime,
          duration: video.duration,
          ended: video.ended,
          seeking: video.seeking,
          
          // 元素尺寸和位置
          rect: (() => {
            const rect = video.getBoundingClientRect();
            return {
              x: rect.x, y: rect.y,
              width: rect.width, height: rect.height,
              visible: rect.width > 0 && rect.height > 0
            };
          })(),
          
          // 计算样式
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
              position: style.position,
              width: style.width,
              height: style.height
            };
          })()
        },
        
        // MediaStream信息
        stream: stream ? {
          id: stream.id,
          active: stream.active,
          
          // 轨道信息
          tracks: stream.getTracks().map(track => ({
            kind: track.kind,
            id: track.id,
            label: track.label,
            enabled: track.enabled,
            readyState: track.readyState,
            muted: track.muted,
            
            // 视频轨道特定信息
            settings: track.kind === 'video' ? track.getSettings() : null,
            constraints: track.kind === 'video' ? track.getConstraints() : null,
            capabilities: track.kind === 'video' ? track.getCapabilities() : null
          }))
        } : null,
        
        // 页面信息
        page: {
          title: document.title,
          url: window.location.href,
          isQRPage: document.title.includes('QR') || document.title.includes('Scanner')
        }
      };
      
      return status;
    });
    
    console.log('📊 实时摄像头状态:');
    console.log(JSON.stringify(realTimeStatus, null, 2));
    
    if (realTimeStatus.hasVideo) {
      // 分析具体问题
      const video = realTimeStatus.video;
      const stream = realTimeStatus.stream;
      
      console.log('\n🔍 问题分析:');
      
      if (!stream) {
        console.log('❌ 主要问题: 没有MediaStream - video.srcObject为空');
        console.log('💡 解决方案: 需要重新获取摄像头流');
      } else if (!stream.active) {
        console.log('❌ 主要问题: MediaStream存在但不活跃');
        console.log('💡 解决方案: 流可能被停止，需要重启');
      } else if (video.readyState === 0) {
        console.log('❌ 主要问题: video元素readyState为0 (HAVE_NOTHING)');
        console.log('💡 解决方案: 流设置有问题，需要重新设置srcObject');
      } else if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('❌ 主要问题: video尺寸为0x0');
        console.log('💡 解决方案: 可能是编解码器问题或硬件问题');
      } else if (video.paused) {
        console.log('❌ 主要问题: video元素暂停状态');
        console.log('💡 解决方案: 需要调用play()');
      } else {
        console.log('🤔 奇怪: 所有状态看起来正常，但显示黑屏');
        console.log('💡 可能是: CSS问题、硬件加速问题或浏览器兼容性问题');
      }
      
      console.log('\n🛠️ 开始实时修复...');
      
      const fixResult = await tools.executeScript(() => {
        const video = document.querySelector('video');
        if (!video) return { success: false, error: '没有video元素' };
        
        const fixes = [];
        
        try {
          // 修复1: 强制重新获取摄像头流并立即设置
          console.log('🔧 [修复1] 立即重新获取摄像头流...');
          
          navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'environment'
            }
          }).then(newStream => {
            console.log('✅ 获取到全新摄像头流:', newStream.id);
            
            // 立即停止所有旧流
            if (video.srcObject) {
              video.srcObject.getTracks().forEach(track => {
                track.stop();
                console.log('🛑 停止旧track:', track.kind, track.id);
              });
            }
            
            // 立即设置新流
            video.srcObject = newStream;
            
            // 强制所有属性
            video.muted = true;
            video.autoplay = true;
            video.playsInline = true;
            video.controls = false;
            
            // 强制重新设置关键属性
            video.setAttribute('muted', 'true');
            video.setAttribute('autoplay', 'true');
            video.setAttribute('playsinline', 'true');
            
            // 强制播放
            const playPromise = video.play();
            if (playPromise) {
              playPromise.then(() => {
                console.log('🎉 视频播放成功! 尺寸:', video.videoWidth, 'x', video.videoHeight);
                fixes.push('重新获取流并播放 - 成功');
              }).catch(err => {
                console.error('❌ 播放失败:', err);
                fixes.push('重新获取流 - 播放失败: ' + err.message);
              });
            }
            
            // 监听关键事件
            video.onloadedmetadata = () => {
              console.log('📐 metadata加载完成:', video.videoWidth, 'x', video.videoHeight);
            };
            
            video.oncanplay = () => {
              console.log('▶️ 可以播放了');
            };
            
            video.onplaying = () => {
              console.log('✅ 正在播放');
            };
            
          }).catch(err => {
            console.error('❌ 获取摄像头失败:', err);
            fixes.push('获取摄像头失败: ' + err.message);
          });
          
          // 修复2: 强制样式重置（立即执行）
          console.log('🔧 [修复2] 强制样式重置...');
          video.style.cssText = `
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            background-color: black !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            z-index: 10 !important;
            transform: translateZ(0) !important;
          `;
          fixes.push('强制样式重置 - 完成');
          
          // 修复3: 强制触发重绘
          console.log('🔧 [修复3] 强制重绘...');
          const parent = video.parentElement;
          const display = video.style.display;
          video.style.display = 'none';
          
          setTimeout(() => {
            video.style.display = display || 'block';
            fixes.push('强制重绘 - 完成');
          }, 100);
          
          return { success: true, fixes: fixes };
          
        } catch (error) {
          return { success: false, error: error.message, fixes: fixes };
        }
      });
      
      console.log('🛠️ 修复执行结果:');
      console.log(JSON.stringify(fixResult, null, 2));
      
      // 等待修复生效
      console.log('⏰ 等待修复生效（8秒）...');
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // 检查修复效果
      const postFixStatus = await tools.executeScript(() => {
        const video = document.querySelector('video');
        if (!video) return { hasVideo: false };
        
        return {
          hasVideo: true,
          srcObject: video.srcObject ? 'MediaStream存在' : '无MediaStream',
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState,
          paused: video.paused,
          currentTime: video.currentTime,
          isActuallyPlaying: !video.paused && video.currentTime > 0 && !video.ended,
          streamActive: video.srcObject ? video.srcObject.active : false
        };
      });
      
      console.log('📊 修复后状态:');
      console.log(JSON.stringify(postFixStatus, null, 2));
      
      // 截图验证
      await tools.screenshot('realtime-camera-fix.png');
      
      if (postFixStatus.streamActive && postFixStatus.videoWidth > 0) {
        console.log('🎉 修复成功！摄像头应该正常显示了！');
      } else {
        console.log('⚠️ 修复可能还需要时间生效或存在其他问题');
      }
      
    } else {
      console.log('❌ 没有找到video元素，可能需要重新进入QR页面');
    }
    
    console.log('⏰ 保持连接10秒供观察...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ 实时调试失败:', error);
  } finally {
    await tools.close();
    console.log('✅ 实时摄像头调试完成');
  }
}

realtimeCameraDebug();