const BrowserTools = require('./browser-tools.js');

async function releaseCameraForOtherTabs() {
  console.log('🔓 释放摄像头给其他标签页使用...\n');
  
  const tools = new BrowserTools();
  
  try {
    await tools.init();
    await tools.navigate('http://localhost:8090');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🛑 停止当前自动化窗口的摄像头流...');
    
    // 彻底清理摄像头流
    await tools.executeScript(() => {
      // 方法1: 停止所有video元素的流
      const videos = document.querySelectorAll('video');
      videos.forEach((video, index) => {
        if (video.srcObject) {
          console.log(`停止video[${index}]的摄像头流`);
          video.srcObject.getTracks().forEach(track => {
            track.stop();
            console.log(`  - 停止track: ${track.kind} ${track.label}`);
          });
          video.srcObject = null;
        }
      });
      
      // 方法2: 尝试全局清理可能的流引用
      if (window.currentCameraStream) {
        window.currentCameraStream.getTracks().forEach(track => track.stop());
        window.currentCameraStream = null;
        console.log('清理了全局摄像头流引用');
      }
      
      // 方法3: 触发组件的stopCamera方法
      if (window.stopAllCameraStreams) {
        window.stopAllCameraStreams();
        console.log('调用了全局停止摄像头方法');
      }
      
      console.log('✅ 摄像头流清理完成');
      return { success: true, videosCleaned: videos.length };
    });
    
    console.log('✅ 摄像头已释放！\n');
    
  } catch (error) {
    console.error('❌ 释放摄像头失败:', error);
  } finally {
    // 关闭自动化浏览器
    await tools.close();
  }
  
  console.log('🎯 现在你可以在其他浏览器标签页中使用摄像头了！\n');
  
  console.log('📋 使用步骤:');
  console.log('1. 🌐 在任意浏览器中打开: http://localhost:8090');
  console.log('2. 🎯 点击"扫一扫"按钮进入QR页面');
  console.log('3. 📷 允许摄像头权限（如果提示）');
  console.log('4. 🎉 摄像头应该正常显示！');
  
  console.log('\n💡 如果还有问题，请:');
  console.log('1. 🔄 刷新页面');
  console.log('2. 🖱️ 点击页面任意位置触发播放');
  console.log('3. 🔐 重新授权摄像头权限');
}

releaseCameraForOtherTabs();