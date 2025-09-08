// 测试修复后的QR扫描功能
console.log('🔍 测试修复后的QR扫描器');

// 等待页面完全加载
function waitForPageLoad() {
    return new Promise((resolve) => {
        if (document.readyState === 'complete') {
            resolve();
        } else {
            window.addEventListener('load', resolve);
        }
    });
}

// 等待元素出现
function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const checkElement = () => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            } else {
                setTimeout(checkElement, 100);
            }
        };
        checkElement();
    });
}

// 检查QR扫描器状态
async function checkQRScannerStatus() {
    console.log('📊 检查QR扫描器状态');
    
    // 检查QrScanner库
    console.log('QrScanner库状态:', typeof globalThis.QrScanner !== 'undefined' ? '✅ 已加载' : '❌ 未加载');
    
    // 检查视频元素
    const videos = document.querySelectorAll('video');
    console.log(`📹 视频元素数量: ${videos.length}`);
    
    videos.forEach((video, index) => {
        console.log(`Video ${index}:`, {
            srcObject: !!video.srcObject,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            readyState: video.readyState,
            paused: video.paused,
            currentTime: video.currentTime
        });
    });
    
    // 检查摄像头权限
    if (navigator.mediaDevices) {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            console.log(`📷 摄像头设备数量: ${videoDevices.length}`);
        } catch (error) {
            console.error('获取设备信息失败:', error);
        }
    }
}

// 监控console日志中的QR相关信息
const originalLog = console.log;
const originalError = console.error;

console.log = function(...args) {
    const message = args.join(' ');
    if (message.includes('QR') || message.includes('扫描') || message.includes('camera') || message.includes('video')) {
        originalLog('🎯 [QR监控]', ...args);
    } else {
        originalLog(...args);
    }
};

console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('QR') || message.includes('扫描') || message.includes('camera') || message.includes('video')) {
        originalError('❌ [QR监控]', ...args);
    } else {
        originalError(...args);
    }
};

// 主测试函数
async function testQRScanner() {
    try {
        await waitForPageLoad();
        console.log('✅ 页面加载完成');
        
        // 等待2秒让React组件渲染
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await checkQRScannerStatus();
        
        // 持续监控30秒
        console.log('🔄 开始30秒监控...');
        let monitorCount = 0;
        const monitorInterval = setInterval(() => {
            monitorCount++;
            console.log(`⏰ 监控第${monitorCount}次 (每3秒)`);
            checkQRScannerStatus();
            
            if (monitorCount >= 10) {
                clearInterval(monitorInterval);
                console.log('✅ 监控完成');
            }
        }, 3000);
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

// 启动测试
testQRScanner();