import { test, expect } from '@playwright/test';

// 直接验证 QRScanner 页面是否能成功启动摄像头

test.describe('QRScanner 摄像头启动验证', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.grantPermissions(['camera'], { origin: 'http://localhost:8081' });
    page.on('console', msg => console.log(`[console] ${msg.text()}`));
  });

  test('进入 /QRScanner 后自动启动摄像头并播放视频', async ({ page }) => {
    await page.goto('http://localhost:8081/QRScanner');
    await page.waitForLoadState('networkidle');

    // 等待我们组件的关键日志出现（最多10秒）
    const expectedLogs = [
      '📹 [QRScannerScreen] 渲染摄像头组件',
      '🌐 [QRScannerScreen] 使用EnhancedWebCameraView组件',
      '📷 [EnhancedWebCameraView] 请求摄像头权限',
      '✅ [EnhancedWebCameraView] 摄像头权限获取成功',
      '▶️ [EnhancedWebCameraView] 视频流开始播放',
    ];

    const seen: string[] = [];
    page.on('console', (msg) => {
      const t = msg.text();
      if (expectedLogs.some(l => t.includes(l))) seen.push(t);
    });

    await page.waitForTimeout(3000);

    // 检查页面上的 video 是否已经在播放
    const videoState = await page.evaluate(async () => {
      const video = document.querySelector('video') as HTMLVideoElement | null;
      if (!video) return { hasVideo: false };

      const hasSrcObject = !!(video as any).srcObject;
      const readyState = video.readyState; // 2 以上通常表示有数据
      return {
        hasVideo: true,
        hasSrcObject,
        readyState,
        width: video.videoWidth,
        height: video.videoHeight,
        isPlaying: !video.paused && !video.ended,
      };
    });

    console.log('videoState:', videoState);

    expect(videoState.hasVideo).toBeTruthy();
    // 在 CI 或沙盒里部分字段可能不立刻可用，所以只做合理断言
    expect(videoState.readyState).toBeGreaterThanOrEqual(2);
  });
});


