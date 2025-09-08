const BrowserTools = require('./browser-tools.js');

async function triggerScanFunction() {
  const tools = new BrowserTools();
  
  try {
    console.log('🎯 直接触发React Navigation到QR扫描页面...');
    await tools.init();
    
    await tools.navigate('http://localhost:8090');
    
    // 等待页面完全加载
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🔧 直接调用React导航函数...');
    
    // 直接在浏览器控制台中执行React Navigation
    const navigationResult = await tools.executeScript(() => {
      // 尝试获取React Navigation实例
      const reactNavigation = window.__REACT_NAVIGATION__;
      
      // 方法1: 通过全局事件触发导航
      const navigationEvent = new CustomEvent('navigate', {
        detail: { screen: 'QRScanner', params: { purpose: 'scan', returnScreen: 'Explore' } }
      });
      window.dispatchEvent(navigationEvent);
      
      // 方法2: 尝试直接调用React组件的navigation
      let result = { attempts: [] };
      
      try {
        // 查找包含navigation相关的React fiber节点
        const findReactFiber = (dom) => {
          const key = Object.keys(dom).find(key => key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance'));
          return key ? dom[key] : null;
        };
        
        // 递归查找navigation对象
        const findNavigation = (fiber) => {
          if (!fiber) return null;
          
          // 检查当前fiber的props
          if (fiber.memoizedProps && fiber.memoizedProps.navigation) {
            return fiber.memoizedProps.navigation;
          }
          
          // 检查stateNode
          if (fiber.stateNode && fiber.stateNode.props && fiber.stateNode.props.navigation) {
            return fiber.stateNode.props.navigation;
          }
          
          // 递归检查子节点
          let child = fiber.child;
          while (child) {
            const nav = findNavigation(child);
            if (nav) return nav;
            child = child.sibling;
          }
          
          // 检查父节点
          return findNavigation(fiber.return);
        };
        
        // 从根元素开始查找
        const rootElement = document.getElementById('root') || document.body;
        const fiber = findReactFiber(rootElement);
        
        if (fiber) {
          const navigation = findNavigation(fiber);
          
          if (navigation && navigation.navigate) {
            console.log('✅ 找到navigation对象，执行导航...');
            navigation.navigate('QRScanner', {
              purpose: 'scan',
              returnScreen: 'Explore'
            });
            result.attempts.push('React Navigation导航 - 成功执行');
            result.success = true;
          } else {
            result.attempts.push('React Navigation导航 - 未找到navigation对象');
          }
        } else {
          result.attempts.push('React Navigation导航 - 未找到React Fiber');
        }
        
      } catch (error) {
        result.attempts.push('React Navigation导航 - 错误: ' + error.message);
      }
      
      // 方法3: 模拟按钮点击（查找实际的扫码按钮）
      try {
        // 查找可能触发扫码的元素
        const possibleScanElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = (el.textContent || '').toLowerCase();
          const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
          const className = (el.className || '').toLowerCase();
          
          return (text.includes('scan') || text.includes('扫') || text.includes('qr') ||
                  ariaLabel.includes('scan') || ariaLabel.includes('扫') || ariaLabel.includes('qr') ||
                  className.includes('scan') || className.includes('qr')) &&
                 (el.tagName === 'BUTTON' || el.role === 'button' || 
                  el.onclick || el.style.cursor === 'pointer' ||
                  className.includes('touchable') || className.includes('pressable'));
        });
        
        if (possibleScanElements.length > 0) {
          console.log(`找到 ${possibleScanElements.length} 个可能的扫码按钮`);
          
          // 尝试点击每个可能的按钮
          possibleScanElements.forEach((el, index) => {
            try {
              el.click();
              result.attempts.push(`点击扫码按钮[${index}]: ${el.textContent?.substring(0, 20)} - 成功`);
            } catch (clickErr) {
              result.attempts.push(`点击扫码按钮[${index}] - 失败: ${clickErr.message}`);
            }
          });
        } else {
          result.attempts.push('未找到可点击的扫码按钮');
        }
        
      } catch (error) {
        result.attempts.push('按钮点击方法 - 错误: ' + error.message);
      }
      
      // 方法4: 直接修改URL hash或search params触发路由
      try {
        // 尝试修改URL来触发路由变化
        const currentUrl = window.location.href;
        const newUrl = currentUrl + '#QRScanner';
        window.history.pushState({ screen: 'QRScanner' }, '', newUrl);
        
        // 触发popstate事件
        window.dispatchEvent(new PopStateEvent('popstate', { state: { screen: 'QRScanner' } }));
        
        result.attempts.push('URL路由修改 - 已尝试');
        
      } catch (error) {
        result.attempts.push('URL路由修改 - 错误: ' + error.message);
      }
      
      return result;
    });
    
    console.log('📊 导航尝试结果:');
    console.log(JSON.stringify(navigationResult, null, 2));
    
    // 等待导航生效
    console.log('⏰ 等待导航生效...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // 检查是否成功进入QR页面
    const pageCheck = await tools.executeScript(() => {
      const videos = document.querySelectorAll('video');
      
      return {
        title: document.title,
        url: window.location.href,
        hasVideo: videos.length > 0,
        videoDetails: videos.length > 0 ? {
          srcObject: videos[0].srcObject ? 'MediaStream存在' : '无MediaStream',
          videoWidth: videos[0].videoWidth,
          videoHeight: videos[0].videoHeight,
          readyState: videos[0].readyState,
          paused: videos[0].paused
        } : null,
        pageContainsQR: document.body.textContent.includes('QR') || 
                       document.body.textContent.includes('扫') ||
                       document.title.includes('QR') ||
                       document.title.includes('Scanner')
      };
    });
    
    console.log('📊 页面检查结果:');
    console.log(JSON.stringify(pageCheck, null, 2));
    
    if (pageCheck.hasVideo) {
      console.log('🎉 成功进入QR扫描页面!');
      
      // 如果摄像头还是有问题，进行最后的修复
      if (!pageCheck.videoDetails.srcObject || pageCheck.videoDetails.videoWidth === 0) {
        console.log('🔧 摄像头流有问题，进行最后修复...');
        
        const finalFix = await tools.executeScript(() => {
          const video = document.querySelector('video');
          if (!video) return { error: '没有video元素' };
          
          // 强制重新获取摄像头
          navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } }
          }).then(stream => {
            console.log('🔧 获取到新的摄像头流:', stream.id);
            
            // 停止旧流
            if (video.srcObject) {
              video.srcObject.getTracks().forEach(track => track.stop());
            }
            
            // 设置新流
            video.srcObject = stream;
            video.muted = true;
            video.autoplay = true;
            video.play().then(() => {
              console.log('✅ 摄像头修复成功!');
            });
          }).catch(err => {
            console.error('❌ 摄像头修复失败:', err);
          });
          
          return { success: true, message: '已尝试修复摄像头' };
        });
        
        console.log('🔧 最终修复结果:', JSON.stringify(finalFix, null, 2));
        
        // 等待修复生效
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      // 最终截图
      await tools.screenshot('scan-function-trigger-success.png');
      
    } else {
      console.log('❌ 未能成功进入QR扫描页面');
      await tools.screenshot('scan-function-trigger-failed.png');
    }
    
    console.log('⏰ 保持浏览器开启15秒供观察...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('❌ 触发扫描函数失败:', error);
  } finally {
    await tools.close();
    console.log('✅ 触发扫描函数完成');
  }
}

triggerScanFunction();