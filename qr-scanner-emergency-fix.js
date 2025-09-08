// QR扫描器紧急修复脚本
console.log('🚑 QR扫描器紧急修复脚本启动');

// 等待页面加载完成
function waitForLoad() {
    return new Promise(resolve => {
        if (document.readyState === 'complete') {
            resolve();
        } else {
            window.addEventListener('load', resolve);
        }
    });
}

// 强制加载QR Scanner库
async function forceLoadQRLibrary() {
    console.log('📚 强制加载QR Scanner库...');
    
    // 检查是否已经加载
    if (globalThis.QrScanner) {
        console.log('✅ QrScanner库已存在');
        return true;
    }
    
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qr-scanner@1.4.2/qr-scanner.umd.min.js';
        script.onload = () => {
            console.log('✅ QR Scanner库加载成功');
            if (globalThis.QrScanner) {
                globalThis.QrScanner.WORKER_PATH = 'https://cdn.jsdelivr.net/npm/qr-scanner@1.4.2/qr-scanner-worker.min.js';
                console.log('✅ Worker路径设置完成');
            }
            resolve(true);
        };
        script.onerror = () => {
            console.error('❌ QR Scanner库加载失败');
            resolve(false);
        };
        document.head.appendChild(script);
    });
}

// 手动创建QR扫描器
async function manualCreateQRScanner() {
    console.log('🔧 手动创建QR扫描器...');
    
    // 确保库已加载
    const libraryLoaded = await forceLoadQRLibrary();
    if (!libraryLoaded) {
        console.error('❌ 无法加载QR Scanner库');
        return false;
    }
    
    // 查找视频元素
    const videos = document.querySelectorAll('video');
    console.log(`📹 找到 ${videos.length} 个video元素`);
    
    if (videos.length === 0) {
        console.error('❌ 没有找到video元素');
        return false;
    }
    
    // 选择最合适的视频元素
    let targetVideo = null;
    for (const video of videos) {
        if (video.srcObject && video.readyState > 0) {
            targetVideo = video;
            break;
        }
    }
    
    if (!targetVideo) {
        targetVideo = videos[0]; // 使用第一个视频元素
        console.warn('⚠️ 使用第一个video元素，可能还没完全就绪');
    }
    
    console.log('📹 选择的video元素状态:', {
        videoWidth: targetVideo.videoWidth,
        videoHeight: targetVideo.videoHeight,
        readyState: targetVideo.readyState,
        paused: targetVideo.paused,
        srcObject: !!targetVideo.srcObject
    });
    
    try {
        // 创建QR扫描器
        const scanner = new globalThis.QrScanner(
            targetVideo,
            (result) => {
                console.log('🎯 手动QR扫描器检测到二维码:', result.data);
                
                // 振动反馈
                if ('vibrate' in navigator) {
                    navigator.vibrate(100);
                }
                
                // 显示结果
                alert(`QR码扫描成功！内容：${result.data}`);
            },
            {
                highlightScanRegion: true,
                highlightCodeOutline: true,
                maxScansPerSecond: 5,
            }
        );
        
        // 启动扫描器
        await scanner.start();
        console.log('✅ 手动QR扫描器启动成功');
        
        // 保存到全局变量以便后续操作
        window.emergencyQRScanner = scanner;
        
        return true;
    } catch (error) {
        console.error('❌ 手动创建QR扫描器失败:', error);
        return false;
    }
}

// 监控函数
function startMonitoring() {
    console.log('🔄 开始监控QR扫描器状态...');
    
    const monitorInterval = setInterval(() => {
        console.log('--- QR扫描器状态监控 ---');
        console.log('QrScanner库:', typeof globalThis.QrScanner !== 'undefined' ? '✅' : '❌');
        console.log('紧急扫描器:', window.emergencyQRScanner ? '✅' : '❌');
        
        const videos = document.querySelectorAll('video');
        console.log(`视频元素: ${videos.length}个`);
        videos.forEach((video, i) => {
            console.log(`Video ${i}: ${video.videoWidth}x${video.videoHeight}, readyState=${video.readyState}`);
        });
        console.log('---');
    }, 5000);
    
    // 30秒后停止监控
    setTimeout(() => {
        clearInterval(monitorInterval);
        console.log('🛑 停止监控');
    }, 30000);
}

// 主函数
async function emergencyFix() {
    try {
        await waitForLoad();
        console.log('✅ 页面加载完成');
        
        // 等待React组件渲染
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 尝试手动创建QR扫描器
        const success = await manualCreateQRScanner();
        
        if (success) {
            console.log('✅ 紧急修复成功！QR扫描器已启动');
        } else {
            console.error('❌ 紧急修复失败');
        }
        
        // 开始监控
        startMonitoring();
        
    } catch (error) {
        console.error('❌ 紧急修复过程中出错:', error);
    }
}

// 启动紧急修复
emergencyFix();

// 暴露手动触发函数
window.fixQRScanner = emergencyFix;
window.stopQRScanner = () => {
    if (window.emergencyQRScanner) {
        window.emergencyQRScanner.stop();
        window.emergencyQRScanner.destroy();
        window.emergencyQRScanner = null;
        console.log('🛑 QR扫描器已停止');
    }
};

console.log('💡 提示：');
console.log('- 输入 fixQRScanner() 来手动修复');
console.log('- 输入 stopQRScanner() 来停止扫描器');