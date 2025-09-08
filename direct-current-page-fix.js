const BrowserTools = require('./browser-tools.js');

async function directCurrentPageFix() {
  const tools = new BrowserTools();
  
  try {
    console.log('🎯 直接修复你当前打开的QR页面...');
    await tools.init();
    
    // 直接连接到你正在查看的页面
    await tools.navigate('http://localhost:8090');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('💪 强制进入QR扫描页面并修复摄像头...');
    
    const ultimateFix = await tools.executeScript(() => {
      console.log('🔧 开始终极修复...');
      
      // 首先强制导航到QR页面
      const navigateToQR = () => {
        // 尝试多种方式进入QR页面
        const methods = [
          // 方法1: 查找并点击扫码按钮
          () => {
            const scanButtons = Array.from(document.querySelectorAll('*')).filter(el => {
              const text = (el.textContent || '').trim();
              return text.includes('扫') && (el.tagName === 'BUTTON' || el.onclick || el.role === 'button');
            });
            if (scanButtons.length > 0) {
              scanButtons[0].click();
              console.log('✅ 点击了扫码按钮:', scanButtons[0].textContent);
              return true;
            }
            return false;
          },
          
          // 方法2: 触发React Navigation事件
          () => {
            window.dispatchEvent(new CustomEvent('navigate-to-qr'));
            return true;
          },
          
          // 方法3: 直接修改URL触发路由
          () => {
            window.location.hash = '#QRScanner';
            return true;
          }
        ];
        
        methods.forEach((method, index) => {
          try {
            const result = method();
            console.log(`导航方法${index + 1}:`, result ? '成功' : '失败');
          } catch (e) {
            console.log(`导航方法${index + 1}: 错误 -`, e.message);
          }
        });
      };
      
      navigateToQR();
      
      // 等待一下让导航生效
      return new Promise((resolve) => {
        setTimeout(() => {
          // 现在尝试修复摄像头
          const videos = document.querySelectorAll('video');
          
          if (videos.length === 0) {
            console.log('❌ 仍然没有video元素，可能导航失败');
            resolve({ success: false, error: '导航到QR页面失败' });
            return;
          }
          
          const video = videos[0];
          console.log('✅ 找到video元素，开始修复...');
          
          // 立即强制修复
          const fixCamera = async () => {
            try {
              // 获取摄像头流
              const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                  width: { ideal: 640 },
                  height: { ideal: 480 },
                  frameRate: { ideal: 30 }
                }
              });
              
              console.log('📷 获取到摄像头流:', stream.id);
              
              // 停止旧流
              if (video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
              }
              
              // 设置新流
              video.srcObject = stream;
              
              // 确保所有属性正确
              video.muted = true;
              video.autoplay = true;
              video.playsInline = true;
              
              // 强制样式
              video.style.cssText = `
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                background: black !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                position: relative !important;
                z-index: 10 !important;
              `;
              
              // 立即播放
              await video.play();
              console.log('🎉 摄像头修复成功! 尺寸:', video.videoWidth, 'x', video.videoHeight);
              
              resolve({ 
                success: true, 
                streamId: stream.id,
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight 
              });
              
            } catch (error) {
              console.error('❌ 摄像头修复失败:', error);
              
              // 如果失败，创建点击触发器
              const overlay = document.createElement('div');
              overlay.innerHTML = `
                <div style="
                  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                  background: rgba(0,0,0,0.8); color: white;
                  display: flex; align-items: center; justify-content: center;
                  z-index: 9999; cursor: pointer; text-align: center;
                ">
                  <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px;">
                    <h2>🎥 点击启动摄像头</h2>
                    <p>需要用户交互来启动摄像头</p>
                    <p style="font-size: 14px; opacity: 0.8;">错误: ${error.message}</p>
                  </div>
                </div>
              `;
              
              overlay.onclick = () => {
                fixCamera().then(() => {
                  document.body.removeChild(overlay);
                });
              };
              
              document.body.appendChild(overlay);
              
              resolve({ 
                success: false, 
                error: error.message,
                needsUserInteraction: true 
              });
            }
          };
          
          fixCamera();
          
        }, 3000); // 3秒后执行修复
      });
    });
    
    console.log('🛠️ 终极修复结果:');
    console.log(JSON.stringify(await ultimateFix, null, 2));
    
    // 等待修复生效
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // 最终验证
    const finalCheck = await tools.executeScript(() => {
      const video = document.querySelector('video');
      if (!video) return { hasVideo: false };
      
      return {
        hasVideo: true,
        hasStream: !!video.srcObject,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        paused: video.paused,
        isPlaying: !video.paused && video.currentTime > 0,
        pageTitle: document.title
      };
    });
    
    console.log('📊 最终检查:');
    console.log(JSON.stringify(finalCheck, null, 2));
    
    await tools.screenshot('direct-page-fix-final.png');
    
    if (finalCheck.hasStream && finalCheck.videoWidth > 0) {
      console.log('🎉 摄像头修复成功！');
    } else {
      console.log('⚠️ 可能需要在页面上点击触发器来启动摄像头');
    }
    
  } catch (error) {
    console.error('❌ 直接修复失败:', error);
  } finally {
    await tools.close();
    console.log('✅ 直接修复完成');
  }
}

directCurrentPageFix();