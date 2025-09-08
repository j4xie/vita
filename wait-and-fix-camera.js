const BrowserTools = require('./browser-tools.js');

async function waitAndFixCamera() {
  const tools = new BrowserTools();
  
  try {
    console.log('⏰ 等待并修复摄像头...');
    await tools.init();
    
    await tools.navigate('http://localhost:8090');
    
    // 等待页面基本加载
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔍 等待video元素出现...');
    
    // 轮询等待video元素出现
    let videoFound = false;
    let attempts = 0;
    const maxAttempts = 20; // 最多等待20次，每次1秒
    
    while (!videoFound && attempts < maxAttempts) {
      attempts++;
      
      const checkResult = await tools.executeScript(() => {
        const videos = document.querySelectorAll('video');
        return {
          hasVideo: videos.length > 0,
          count: videos.length,
          title: document.title
        };
      });
      
      console.log(`第${attempts}次检查: video元素=${checkResult.count}个, 标题=${checkResult.title}`);
      
      if (checkResult.hasVideo) {
        videoFound = true;
        console.log('✅ 找到video元素！');
        break;
      }
      
      // 等待1秒后再次检查
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (!videoFound) {
      console.log('❌ 等待超时，没有找到video元素');
      return;
    }
    
    console.log('🔧 开始修复video元素...');
    
    // 等待一下让组件完全渲染
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const detailedFix = await tools.executeScript(() => {
      const video = document.querySelector('video');
      if (!video) return { success: false, error: '没有video元素' };
      
      console.log('🔍 当前video状态检查:');
      console.log('- srcObject:', video.srcObject ? 'MediaStream存在' : '空');
      console.log('- videoWidth:', video.videoWidth);
      console.log('- videoHeight:', video.videoHeight);
      console.log('- readyState:', video.readyState);
      console.log('- paused:', video.paused);
      
      const fixes = [];
      
      try {
        // 如果没有srcObject，立即获取摄像头
        if (!video.srcObject || video.videoWidth === 0) {
          console.log('🔧 立即获取摄像头流...');
          
          navigator.mediaDevices.getUserMedia({
            video: { 
              width: { ideal: 1280 }, 
              height: { ideal: 720 },
              facingMode: 'environment' // 后摄像头通常效果更好
            }
          }).then(stream => {
            console.log('✅ 实时获取摄像头流成功:', stream.id);
            
            // 停止任何现有流
            if (video.srcObject) {
              video.srcObject.getTracks().forEach(track => track.stop());
            }
            
            // 立即设置新流
            video.srcObject = stream;
            
            // 确保所有播放属性正确
            video.muted = true;
            video.autoplay = true;
            video.playsInline = true;
            
            // 强制播放
            video.play().then(() => {
              console.log('🎉 视频播放成功! 当前尺寸:', video.videoWidth, 'x', video.videoHeight);
            }).catch(playErr => {
              console.error('播放失败:', playErr);
              
              // 如果播放失败，尝试用户交互方式
              if (playErr.name === 'NotAllowedError') {
                console.log('需要用户点击页面任意位置来触发播放');
                
                // 创建一个全屏透明的点击区域
                const clickOverlay = document.createElement('div');
                clickOverlay.style.cssText = `
                  position: fixed;
                  top: 0; left: 0; right: 0; bottom: 0;
                  background: transparent;
                  z-index: 9999;
                  cursor: pointer;
                `;
                clickOverlay.innerHTML = '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.7); color: white; padding: 20px; border-radius: 10px; text-align: center;">点击此处启动摄像头</div>';
                
                clickOverlay.onclick = () => {
                  video.play();
                  document.body.removeChild(clickOverlay);
                };
                
                document.body.appendChild(clickOverlay);
                console.log('✅ 已添加用户交互触发器');
              }
            });
            
            fixes.push('重新获取摄像头流 - 成功');
            
          }).catch(streamErr => {
            console.error('❌ 获取摄像头流失败:', streamErr);
            fixes.push('获取摄像头流失败: ' + streamErr.message);
          });
          
        } else {
          console.log('✅ 已有MediaStream，检查播放状态');
          
          if (video.paused) {
            video.play().then(() => {
              console.log('✅ 恢复播放成功');
              fixes.push('恢复播放 - 成功');
            }).catch(err => {
              console.error('恢复播放失败:', err);
              fixes.push('恢复播放失败: ' + err.message);
            });
          }
        }
        
        // 强制样式修复
        video.style.cssText = `
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          background-color: #000 !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: relative !important;
          z-index: 5 !important;
          transform: translateZ(0) !important;
        `;
        fixes.push('强制样式修复 - 完成');
        
        return { success: true, fixes: fixes };
        
      } catch (error) {
        return { success: false, error: error.message, fixes: fixes };
      }
    });
    
    console.log('🛠️ 修复结果:');
    console.log(JSON.stringify(detailedFix, null, 2));
    
    // 等待足够的时间让摄像头流生效
    console.log('⏰ 等待摄像头流稳定（10秒）...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 最终验证
    const finalStatus = await tools.executeScript(() => {
      const video = document.querySelector('video');
      if (!video) return { hasVideo: false };
      
      const stream = video.srcObject;
      
      return {
        hasVideo: true,
        hasStream: !!stream,
        streamActive: stream ? stream.active : false,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        paused: video.paused,
        currentTime: video.currentTime,
        isPlaying: !video.paused && video.currentTime > 0,
        
        // 流轨道详情
        tracks: stream ? stream.getTracks().map(track => ({
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState,
          settings: track.getSettings ? track.getSettings() : null
        })) : []
      };
    });
    
    console.log('🎯 最终验证结果:');
    console.log(JSON.stringify(finalStatus, null, 2));
    
    if (finalStatus.hasStream && finalStatus.streamActive && finalStatus.videoWidth > 0) {
      console.log('🎉 摄像头修复成功！应该可以看到画面了！');
    } else if (finalStatus.hasStream && finalStatus.streamActive) {
      console.log('⚠️ 摄像头流活跃，但视频尺寸为0，可能需要更多时间');
    } else if (finalStatus.hasStream) {
      console.log('⚠️ 有摄像头流但不活跃，可能被停止了');
    } else {
      console.log('❌ 仍然没有摄像头流，可能需要用户手动授权');
    }
    
    // 截图最终结果
    await tools.screenshot('wait-and-fix-final.png');
    
    console.log('⏰ 保持连接观察...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ 等待修复失败:', error);
  } finally {
    await tools.close();
    console.log('✅ 等待修复过程完成');
  }
}

waitAndFixCamera();