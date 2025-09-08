// 调试 QR 扫描器问题
console.log('🔍 QR Scanner Debug Script');
console.log('当前页面URL:', window.location.href);
console.log('QrScanner是否存在:', typeof globalThis.QrScanner !== 'undefined');
console.log('摄像头API支持:', !!navigator.mediaDevices?.getUserMedia);
console.log('当前权限状态:', navigator.permissions ? '支持查询' : '不支持查询');

// 检查是否有QR Scanner库
if (typeof globalThis.QrScanner !== 'undefined') {
    console.log('✅ QrScanner库已加载');
} else {
    console.log('❌ QrScanner库未加载');
    console.log('尝试加载QR Scanner库...');
    
    // 动态加载QR Scanner库
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qr-scanner@1.4.2/qr-scanner.umd.min.js';
    script.onload = () => {
        console.log('✅ QrScanner库加载成功');
        console.log('QrScanner:', globalThis.QrScanner);
        
        // 设置worker路径
        globalThis.QrScanner.WORKER_PATH = 'https://cdn.jsdelivr.net/npm/qr-scanner@1.4.2/qr-scanner-worker.min.js';
    };
    script.onerror = () => {
        console.error('❌ QrScanner库加载失败');
    };
    document.head.appendChild(script);
}

// 检查视频元素
setTimeout(() => {
    const videos = document.querySelectorAll('video');
    console.log(`🎬 找到 ${videos.length} 个video元素`);
    videos.forEach((video, index) => {
        console.log(`Video ${index}:`, {
            srcObject: !!video.srcObject,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            readyState: video.readyState,
            paused: video.paused,
            muted: video.muted,
            autoplay: video.autoplay
        });
    });
}, 2000);

// 检查权限
if (navigator.permissions) {
    navigator.permissions.query({ name: 'camera' }).then(result => {
        console.log('📷 摄像头权限状态:', result.state);
    }).catch(err => {
        console.log('权限查询失败:', err.message);
    });
}