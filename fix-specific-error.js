const BrowserTools = require('./browser-tools.js');

async function fixSpecificError() {
  const tools = new BrowserTools();
  
  try {
    console.log('🎯 修复具体的摄像头错误...');
    await tools.init();
    
    await tools.navigate('http://localhost:8090');
    
    // 等待页面加载
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 进入QR页面
    console.log('🔧 自动进入QR扫描页面...');
    await tools.executeScript(() => {
      // 查找扫码按钮并点击
      const scanButtons = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || '';
        return (text.includes('扫') || text.includes('Scan')) && 
               (el.tagName === 'BUTTON' || el.role === 'button' || el.onclick);
      });
      
      if (scanButtons.length > 0) {
        scanButtons[0].click();
        console.log('✅ 点击了扫码按钮');
        return true;
      }
      return false;
    });
    
    // 等待QR页面加载
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🔍 检查具体错误信息...');
    
    // 获取所有控制台错误
    const logs = await tools.getConsoleLogs();
    const errors = logs.filter(log => log.type === 'error' || log.text.includes('Error'));
    
    console.log('❌ 发现的错误:');
    errors.forEach((error, index) => {
      console.log(`${index + 1}. [${error.type}] ${error.text}`);
    });
    
    // 检查video元素的详细状态和错误
    const detailedStatus = await tools.executeScript(() => {
      const videos = document.querySelectorAll('video');
      
      if (videos.length === 0) {
        return { error: '没有video元素' };
      }
      
      const video = videos[0];
      const stream = video.srcObject;
      
      // 检查video元素的所有可能错误状态
      const status = {
        hasVideo: true,
        
        // 基本状态
        srcObject: stream ? `Stream(${stream.id})` : null,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        
        // 错误状态
        error: video.error ? {
          code: video.error.code,
          message: video.error.message
        } : null,
        
        // 网络状态
        networkState: video.networkState,
        
        // 播放状态
        paused: video.paused,
        ended: video.ended,
        seeking: video.seeking,
        
        // 流状态
        streamDetails: stream ? {
          id: stream.id,
          active: stream.active,
          tracks: stream.getTracks().map(track => ({
            kind: track.kind,
            enabled: track.enabled,
            readyState: track.readyState,
            muted: track.muted,
            label: track.label
          }))
        } : null,
        
        // DOM状态
        rect: (() => {
          const rect = video.getBoundingClientRect();
          return { width: rect.width, height: rect.height, visible: rect.width > 0 && rect.height > 0 };
        })(),
        
        // 样式状态
        computedStyle: (() => {
          const style = getComputedStyle(video);
          return {
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            backgroundColor: style.backgroundColor
          };
        })()
      };
      
      // 尝试立即修复
      console.log('🔧 尝试立即修复video元素...');
      
      try {
        // 如果没有stream或stream不活跃，立即获取新的
        if (!stream || !stream.active) {
          navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 15 }
            }
          }).then(newStream => {
            console.log('🔧 获取到新的摄像头流:', newStream.id);
            video.srcObject = newStream;
            video.muted = true;
            video.autoplay = true;
            
            video.play().then(() => {
              console.log('✅ 新流播放成功!');
            }).catch(playErr => {
              console.error('播放新流失败:', playErr);
              
              // 如果播放失败，添加点击触发器
              const clickText = document.createElement('div');
              clickText.innerHTML = '点击此处启动摄像头';
              clickText.style.cssText = `
                position: absolute; top: 50%; left: 50%; 
                transform: translate(-50%, -50%); z-index: 999;
                background: rgba(255,255,255,0.9); padding: 15px;
                border-radius: 8px; cursor: pointer;
                color: black; text-align: center;
              `;
              
              clickText.onclick = () => {
                video.play();
                clickText.remove();
              };
              
              video.parentElement.appendChild(clickText);
              console.log('✅ 添加了点击触发器');
            });
          });
        }
        
        // 强制样式修复
        video.style.cssText = `
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          background-color: black !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        `;
        
      } catch (fixError) {
        status.fixError = fixError.message;
      }
      
      return status;
    });
    
    console.log('📊 详细状态和修复结果:');
    console.log(JSON.stringify(await detailedStatus, null, 2));
    
    // 等待修复生效
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 最终截图
    await tools.screenshot('specific-error-fix-result.png');
    
    console.log('⏰ 保持浏览器开启供观察...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ 修复特定错误失败:', error);
  } finally {
    await tools.close();
    console.log('✅ 特定错误修复完成');
  }
}

fixSpecificError();