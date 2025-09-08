// 立即修复QR扫描器 - 在浏览器控制台中运行
console.log('🚀 立即修复QR扫描器');

// 1. 强制加载QR Scanner库
function forceLoadLibrary() {
    return new Promise((resolve) => {
        if (window.QrScanner) {
            console.log('✅ QR Scanner库已存在');
            resolve(true);
            return;
        }
        
        console.log('📚 加载QR Scanner库...');
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qr-scanner@1.4.2/qr-scanner.umd.min.js';
        script.onload = () => {
            console.log('✅ QR Scanner库加载完成');
            window.QrScanner.WORKER_PATH = 'https://cdn.jsdelivr.net/npm/qr-scanner@1.4.2/qr-scanner-worker.min.js';
            resolve(true);
        };
        script.onerror = () => {
            console.error('❌ QR Scanner库加载失败');
            resolve(false);
        };
        document.head.appendChild(script);
    });
}

// 2. 立即创建QR扫描器
async function createQRScanner() {
    console.log('🔧 开始创建QR扫描器...');
    
    // 加载库
    const loaded = await forceLoadLibrary();
    if (!loaded) {
        console.error('❌ 无法加载QR Scanner库');
        return false;
    }
    
    // 找到视频元素
    const videos = document.querySelectorAll('video');
    console.log(`📹 找到 ${videos.length} 个video元素`);
    
    if (videos.length === 0) {
        console.error('❌ 没有找到video元素');
        return false;
    }
    
    const video = videos[0];
    console.log('📹 video元素状态:', {
        width: video.videoWidth,
        height: video.videoHeight,
        readyState: video.readyState,
        paused: video.paused,
        srcObject: !!video.srcObject
    });
    
    try {
        // 停止现有扫描器（如果存在）
        if (window.currentQRScanner) {
            console.log('🛑 停止现有扫描器');
            window.currentQRScanner.stop();
            window.currentQRScanner.destroy();
        }
        
        // 创建新的扫描器
        const scanner = new window.QrScanner(
            video,
            (result) => {
                console.log('🎯 QR码检测成功:', result.data);
                alert(`QR码扫描成功！\n内容：${result.data}`);
                
                // 振动反馈
                if ('vibrate' in navigator) {
                    navigator.vibrate([100, 50, 100]);
                }
            },
            {
                highlightScanRegion: true,
                highlightCodeOutline: true,
                maxScansPerSecond: 10,
                returnDetailedScanResult: false,
            }
        );
        
        // 启动扫描器
        await scanner.start();
        console.log('✅ QR扫描器启动成功！');
        
        // 保存扫描器引用
        window.currentQRScanner = scanner;
        
        // 状态检查
        setTimeout(() => {
            console.log('🔍 扫描器状态检查:', {
                hasScanner: !!window.currentQRScanner,
                videoReady: video.readyState >= 2,
                videoSize: `${video.videoWidth}x${video.videoHeight}`
            });
        }, 2000);
        
        return true;
        
    } catch (error) {
        console.error('❌ QR扫描器创建失败:', error);
        return false;
    }
}

// 3. 执行修复
createQRScanner().then(success => {
    if (success) {
        console.log('🎉 QR扫描器修复成功！现在可以扫描QR码了');
        console.log('💡 提示：将QR码放在摄像头前，应该会有弹窗显示结果');
    } else {
        console.log('❌ QR扫描器修复失败');
    }
});

// 4. 暴露控制函数
window.fixQR = createQRScanner;
window.stopQR = () => {
    if (window.currentQRScanner) {
        window.currentQRScanner.stop();
        window.currentQRScanner.destroy();
        window.currentQRScanner = null;
        console.log('🛑 QR扫描器已停止');
    }
};

console.log('💡 提示：如果需要重新尝试，请在控制台运行: fixQR()');
console.log('💡 停止扫描器: stopQR()');