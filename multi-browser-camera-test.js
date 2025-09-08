const BrowserTools = require('./browser-tools.js');

async function multiBrowserCameraTest() {
  const tools = new BrowserTools();
  
  try {
    console.log('🔍 诊断多浏览器摄像头冲突问题...');
    await tools.init();
    
    await tools.navigate('http://localhost:8090');
    
    // 等待页面加载
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('📊 检查摄像头设备占用情况...');
    
    const deviceDiagnosis = await tools.executeScript(() => {
      return new Promise((resolve) => {
        const results = {
          timestamp: new Date().toISOString(),
          browser: navigator.userAgent,
          
          // 检查摄像头权限状态
          permissionCheck: null,
          
          // 检查可用设备
          availableDevices: null,
          
          // 尝试获取摄像头
          cameraTest: null,
          
          // 检查当前是否有活跃流
          activeStreams: null
        };
        
        // 1. 检查权限状态
        if (navigator.permissions) {
          navigator.permissions.query({ name: 'camera' })
            .then(permissionStatus => {
              results.permissionCheck = {
                state: permissionStatus.state,
                supported: true
              };
            })
            .catch(err => {
              results.permissionCheck = {
                state: 'unknown',
                error: err.message,
                supported: false
              };
            });
        } else {
          results.permissionCheck = {
            state: 'unknown',
            supported: false,
            message: '浏览器不支持权限查询API'
          };
        }
        
        // 2. 检查可用设备
        navigator.mediaDevices.enumerateDevices()
          .then(devices => {
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            results.availableDevices = {
              total: devices.length,
              videoDevices: videoDevices.length,
              devices: videoDevices.map(d => ({
                deviceId: d.deviceId,
                label: d.label,
                groupId: d.groupId
              }))
            };
            console.log(`📱 检测到 ${videoDevices.length} 个摄像头设备`);
          })
          .catch(err => {
            results.availableDevices = {
              error: err.message
            };
          });
        
        // 3. 尝试获取摄像头（检测占用情况）
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            const tracks = stream.getVideoTracks();
            
            results.cameraTest = {
              success: true,
              streamId: stream.id,
              streamActive: stream.active,
              trackCount: tracks.length,
              trackDetails: tracks.map(track => ({
                id: track.id,
                label: track.label,
                enabled: track.enabled,
                readyState: track.readyState,
                settings: track.getSettings(),
                constraints: track.getConstraints()
              }))
            };
            
            console.log('✅ 摄像头访问成功:', stream.id);
            
            // 立即释放流以避免占用
            stream.getTracks().forEach(track => track.stop());
            
          })
          .catch(err => {
            results.cameraTest = {
              success: false,
              errorName: err.name,
              errorMessage: err.message,
              errorCode: err.code || 'unknown'
            };
            
            console.error('❌ 摄像头访问失败:', err.name, err.message);
          });
        
        // 4. 检查是否有其他活跃的摄像头流
        const videos = document.querySelectorAll('video');
        results.activeStreams = {
          videoElementCount: videos.length,
          streamsFound: Array.from(videos).map((video, index) => ({
            index,
            hasSrcObject: !!video.srcObject,
            streamId: video.srcObject ? video.srcObject.id : null,
            streamActive: video.srcObject ? video.srcObject.active : false,
            isPlaying: !video.paused && video.currentTime > 0 && !video.ended,
            videoSize: {
              width: video.videoWidth,
              height: video.videoHeight
            }
          }))
        };
        
        // 等待异步操作完成
        setTimeout(() => {
          resolve(results);
        }, 2000);
      });
    });
    
    console.log('📊 多浏览器摄像头诊断结果:');
    console.log(JSON.stringify(await deviceDiagnosis, null, 2));
    
    // 检查摄像头独占性问题
    console.log('\n🔍 检查摄像头独占性问题...');
    
    const exclusivityTest = await tools.executeScript(() => {
      console.log('🧪 测试摄像头独占性...');
      
      let firstStream = null;
      let secondStream = null;
      
      return navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream1 => {
          firstStream = stream1;
          console.log('✅ 第一个流获取成功:', stream1.id);
          
          // 立即尝试获取第二个流
          return navigator.mediaDevices.getUserMedia({ video: true });
        })
        .then(stream2 => {
          secondStream = stream2;
          console.log('✅ 第二个流也获取成功:', stream2.id);
          
          const result = {
            canGetMultipleStreams: true,
            firstStreamId: firstStream.id,
            secondStreamId: secondStream.id,
            streamsAreIdentical: firstStream.id === secondStream.id,
            message: '此浏览器支持多个摄像头流'
          };
          
          // 清理流
          if (firstStream) firstStream.getTracks().forEach(track => track.stop());
          if (secondStream) secondStream.getTracks().forEach(track => track.stop());
          
          return result;
        })
        .catch(err => {
          console.error('❌ 第二个流获取失败:', err);
          
          // 清理第一个流
          if (firstStream) firstStream.getTracks().forEach(track => track.stop());
          
          return {
            canGetMultipleStreams: false,
            error: err.name + ': ' + err.message,
            message: '摄像头可能被独占，无法同时在多个地方使用'
          };
        });
    });
    
    console.log('🧪 摄像头独占性测试结果:');
    console.log(JSON.stringify(await exclusivityTest, null, 2));
    
    // 提供解决方案
    const diagnosis = await exclusivityTest;
    
    console.log('\n💡 问题分析和解决方案:');
    
    if (!diagnosis.canGetMultipleStreams) {
      console.log('🎯 问题确认: 摄像头设备独占');
      console.log('📋 可能的原因:');
      console.log('  1. 其他浏览器标签页正在使用摄像头');
      console.log('  2. 其他应用程序占用了摄像头');
      console.log('  3. 浏览器会话冲突');
      console.log('  4. 系统级摄像头锁定');
      
      console.log('\n🛠️ 解决方案:');
      console.log('  1. 关闭所有其他使用摄像头的浏览器标签页');
      console.log('  2. 关闭其他可能使用摄像头的应用（如视频通话软件）');
      console.log('  3. 重启浏览器清除会话');
      console.log('  4. 检查macOS系统的摄像头权限设置');
      
    } else {
      console.log('🤔 摄像头独占不是问题，可能是其他原因');
      console.log('📋 其他可能的原因:');
      console.log('  1. 不同浏览器的安全策略差异');
      console.log('  2. 浏览器版本兼容性问题');
      console.log('  3. 扩展程序冲突');
      console.log('  4. 缓存或localStorage冲突');
    }
    
    // 截图当前状态
    await tools.screenshot('multi-browser-diagnosis.png');
    
    console.log('\n🔧 建议的调试步骤:');
    console.log('1. 在Activity Monitor中查看哪些进程正在使用摄像头');
    console.log('2. 关闭所有浏览器，重新打开一个新窗口');
    console.log('3. 检查浏览器设置中的摄像头权限');
    console.log('4. 尝试在无痕模式下打开应用');
    
  } catch (error) {
    console.error('❌ 多浏览器诊断失败:', error);
  } finally {
    await tools.close();
    console.log('✅ 多浏览器摄像头诊断完成');
  }
}

multiBrowserCameraTest();