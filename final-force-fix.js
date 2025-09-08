const BrowserTools = require('./browser-tools.js');

async function finalForceFix() {
  const tools = new BrowserTools();
  
  try {
    console.log('💪 最终强力修复摄像头黑屏...');
    await tools.init();
    
    await tools.navigate('http://localhost:8090');
    
    // 等待页面加载
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🎯 立即强力修复...');
    
    const forceFixResult = await tools.executeScript(() => {
      console.log('🔧 开始强力修复...');
      
      // 等待video元素
      let video = document.querySelector('video');
      let waitCount = 0;
      
      const waitForVideo = () => {
        return new Promise((resolve) => {
          const checkVideo = () => {
            video = document.querySelector('video');
            if (video) {
              console.log('✅ 找到video元素');
              resolve(video);
            } else if (waitCount < 10) {
              waitCount++;
              console.log(`等待video元素... ${waitCount}/10`);
              setTimeout(checkVideo, 500);
            } else {
              resolve(null);
            }
          };
          checkVideo();
        });
      };
      
      return waitForVideo().then((foundVideo) => {
        if (!foundVideo) {
          return { success: false, error: '等待超时，没有video元素' };
        }
        
        video = foundVideo;
        
        console.log('🔧 [强力修复] 当前video状态:');
        console.log('- srcObject:', video.srcObject ? 'MediaStream存在' : '无');
        console.log('- 尺寸:', video.videoWidth, 'x', video.videoHeight);
        console.log('- readyState:', video.readyState);
        console.log('- paused:', video.paused);
        
        // 强力修复步骤
        const fixes = [];
        
        // 1. 立即获取摄像头并强制设置
        navigator.mediaDevices.getUserMedia({
          video: {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 }
          }
        }).then(stream => {
          console.log('🎉 强力获取摄像头成功:', stream.id);
          
          // 立即停止所有旧流
          if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
          }
          
          // 强制设置新流
          video.srcObject = stream;
          
          // 重新设置所有关键属性
          video.muted = true;
          video.defaultMuted = true;
          video.autoplay = true;
          video.playsInline = true;
          video.controls = false;
          
          // DOM属性设置
          video.setAttribute('muted', '');
          video.setAttribute('autoplay', '');
          video.setAttribute('playsinline', '');
          
          // 强制样式
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.objectFit = 'cover';
          video.style.backgroundColor = '#000';
          video.style.display = 'block';
          video.style.visibility = 'visible';
          video.style.opacity = '1';
          video.style.zIndex = '10';
          
          // 立即播放
          const playVideo = async () => {
            try {
              await video.play();
              console.log('🎉 强力播放成功! 尺寸:', video.videoWidth, 'x', video.videoHeight);
              fixes.push('强力播放 - 成功');
            } catch (playErr) {
              console.log('⚠️ 自动播放失败，需要用户交互:', playErr.message);
              
              // 创建用户交互触发器
              const overlay = document.createElement('div');
              overlay.innerHTML = `
                <div style="
                  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                  background: rgba(0,0,0,0.8); z-index: 99999;
                  display: flex; align-items: center; justify-content: center;
                  cursor: pointer; color: white; text-align: center;
                ">
                  <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px;">
                    <h2>🎥 点击启动摄像头</h2>
                    <p>浏览器需要用户交互才能播放视频</p>
                  </div>
                </div>
              `;
              
              overlay.onclick = () => {
                video.play().then(() => {
                  console.log('🎉 用户交互播放成功!');
                  document.body.removeChild(overlay);
                }).catch(e => {
                  console.error('用户交互播放也失败:', e);
                });
              };
              
              document.body.appendChild(overlay);
              fixes.push('需要用户交互 - 已添加触发器');
            }
          };
          
          playVideo();
          
        }).catch(streamErr => {
          console.error('❌ 强力获取摄像头失败:', streamErr);
          fixes.push('摄像头获取失败: ' + streamErr.message);
        });
        
        // 2. DOM强制刷新
        const parent = video.parentElement;
        const rect = video.getBoundingClientRect();
        console.log('video元素位置:', rect);
        
        // 强制触发重绘
        video.style.display = 'none';
        setTimeout(() => {
          video.style.display = 'block';
          fixes.push('DOM强制刷新 - 完成');
        }, 100);
        
        // 3. 创建备用video元素
        const backupVideo = document.createElement('video');
        backupVideo.muted = true;
        backupVideo.autoplay = true;
        backupVideo.playsInline = true;
        backupVideo.style.cssText = `
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          width: 100%; height: 100%; object-fit: cover;
          background: #000; z-index: 5;
        `;
        
        // 也为备用video获取摄像头
        navigator.mediaDevices.getUserMedia({ video: true }).then(backupStream => {
          backupVideo.srcObject = backupStream;
          backupVideo.play().then(() => {
            console.log('🔄 备用video播放成功');
            // 如果主video失败，用备用的替换
            if (video.videoWidth === 0) {
              parent.appendChild(backupVideo);
              fixes.push('备用video激活 - 成功');
            }
          });
        });
        
        fixes.push('创建备用video - 完成');
        
        return { success: true, fixes: fixes, message: '强力修复执行中...' };
        
      }).catch(err => {
        return { success: false, error: err.message };
      });
    });
    
    console.log('💪 强力修复结果:');
    console.log(JSON.stringify(await forceFixResult, null, 2));
    
    // 等待修复生效
    console.log('⏰ 等待强力修复生效...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // 检查修复效果
    const checkResult = await tools.executeScript(() => {
      const videos = document.querySelectorAll('video');
      
      if (videos.length === 0) {
        return { hasVideo: false, message: '没有video元素' };
      }
      
      const results = Array.from(videos).map((video, index) => ({
        index,
        srcObject: video.srcObject ? 'MediaStream存在' : '无',
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        paused: video.paused,
        currentTime: video.currentTime,
        isPlaying: !video.paused && video.currentTime > 0,
        rect: (() => {
          const rect = video.getBoundingClientRect();
          return { width: rect.width, height: rect.height, visible: rect.width > 0 && rect.height > 0 };
        })()
      }));
      
      return {
        hasVideo: true,
        videoCount: videos.length,
        videos: results,
        anyWorking: results.some(v => v.isPlaying && v.videoWidth > 0)
      };
    });
    
    console.log('📊 修复效果检查:');
    console.log(JSON.stringify(checkResult, null, 2));
    
    // 截图验证
    await tools.screenshot('final-force-fix-result.png');
    
    if (checkResult.anyWorking) {
      console.log('🎉 强力修复成功！至少有一个video正在工作！');
    } else {
      console.log('⚠️ 可能还需要用户手动点击页面来触发播放');
    }
    
    console.log('⏰ 保持连接供观察...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('❌ 强力修复失败:', error);
  } finally {
    await tools.close();
    console.log('✅ 强力修复完成');
  }
}

finalForceFix();