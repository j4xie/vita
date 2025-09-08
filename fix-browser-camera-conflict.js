const BrowserTools = require('./browser-tools.js');

async function fixBrowserCameraConflict() {
  console.log('🔧 修复多浏览器摄像头冲突问题...\n');
  
  // 分析问题
  console.log('📊 问题分析:');
  console.log('从测试结果看，摄像头可以成功获取多个流，说明不是硬件独占问题');
  console.log('更可能是以下原因之一:\n');
  
  console.log('🎯 可能的原因:');
  console.log('1. 🏷️  多个Chrome标签页同时请求摄像头');
  console.log('2. 🔄 React组件重复渲染导致流冲突');
  console.log('3. 🚫 浏览器标签页失焦时自动停止摄像头');
  console.log('4. 🎭 不同浏览器会话的权限状态不同步');
  console.log('5. 📱 移动端兼容性问题（如果在移动浏览器中测试）\n');
  
  // 提供具体解决方案
  console.log('💡 立即解决方案:');
  
  console.log('\n🔥 方案1: 清理Chrome进程和标签页');
  console.log('   执行: pkill -f "Google Chrome" && sleep 2 && open -a "Google Chrome 2"');
  
  console.log('\n🔄 方案2: 重启开发服务器');
  console.log('   1. 停止当前Web服务器');
  console.log('   2. 清理端口占用');
  console.log('   3. 重新启动服务器');
  
  console.log('\n🧹 方案3: 清理浏览器缓存');
  console.log('   Chrome: 设置 > 隐私设置 > 清除浏览数据');
  console.log('   或者: 使用无痕模式打开');
  
  console.log('\n🔐 方案4: 重置摄像头权限');
  console.log('   Chrome: 地址栏 🔒 > 网站设置 > 摄像头 > 重置权限');
  
  console.log('\n🛠️ 推荐的快速修复流程:');
  console.log('1. 关闭所有Chrome窗口');
  console.log('2. 重启Web开发服务器');
  console.log('3. 用一个干净的Chrome窗口打开应用');
  console.log('4. 重新授权摄像头权限');
  
  // 自动执行一些修复步骤
  const tools = new BrowserTools();
  
  try {
    console.log('\n🔧 自动执行部分修复步骤...');
    await tools.init();
    
    await tools.navigate('http://localhost:8090');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 清理当前页面的所有摄像头流
    console.log('🧹 清理当前页面摄像头流...');
    await tools.executeScript(() => {
      // 停止所有video元素的流
      const videos = document.querySelectorAll('video');
      videos.forEach((video, index) => {
        if (video.srcObject) {
          video.srcObject.getTracks().forEach(track => {
            track.stop();
            console.log(`🛑 停止video[${index}]的track:`, track.kind);
          });
          video.srcObject = null;
        }
      });
      
      console.log('✅ 清理了所有video元素的摄像头流');
      
      return { cleaned: videos.length };
    });
    
    // 等待一下然后重新获取
    console.log('⏰ 等待2秒后重新尝试...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 重新获取摄像头（使用更兼容的设置）
    console.log('📷 重新获取摄像头（兼容模式）...');
    const compatResult = await tools.executeScript(() => {
      return navigator.mediaDevices.getUserMedia({
        video: {
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 }, // 降低帧率提高兼容性
          facingMode: 'environment'
        }
      }).then(stream => {
        console.log('✅ 兼容模式摄像头获取成功:', stream.id);
        
        const video = document.querySelector('video');
        if (video) {
          video.srcObject = stream;
          video.muted = true;
          video.autoplay = true;
          video.play().then(() => {
            console.log('🎉 兼容模式播放成功!');
          });
        }
        
        return { 
          success: true, 
          streamId: stream.id,
          tracks: stream.getTracks().length,
          settings: stream.getVideoTracks()[0]?.getSettings()
        };
      }).catch(err => {
        console.error('❌ 兼容模式也失败:', err);
        return { 
          success: false, 
          error: err.name + ': ' + err.message 
        };
      });
    });
    
    console.log('📊 兼容模式结果:', JSON.stringify(await compatResult, null, 2));
    
    await tools.screenshot('browser-conflict-fix-attempt.png');
    
  } catch (error) {
    console.error('❌ 自动修复过程出错:', error);
  } finally {
    await tools.close();
  }
  
  console.log('\n📋 如果问题仍然存在，请按以下顺序尝试:');
  console.log('1. 💀 关闭所有Chrome标签页');
  console.log('2. 🔄 重启Web服务器');
  console.log('3. 🆕 用新的Chrome窗口打开应用');
  console.log('4. 🎯 立即进入QR扫描页面测试');
  
  console.log('\n✅ 冲突修复脚本执行完成');
}

fixBrowserCameraConflict();