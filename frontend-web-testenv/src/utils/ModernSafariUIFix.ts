/**
 * 现代Safari UI控制 - 基于最新研究
 * 参考DealMoon等成功案例的实现方式
 */
import { Platform } from 'react-native';

class ModernSafariUIFix {
  private isInitialized = false;
  private lastScrollY = 0;
  private scrollTimer: NodeJS.Timeout | null = null;

  /**
   * 初始化现代Safari UI控制
   */
  public init() {
    if (Platform.OS !== 'web' || this.isInitialized) return;

    this.setupModernViewport();
    this.setupDynamicViewportHeight();
    this.setupScrollBehavior();
    this.isInitialized = true;

    console.log('🍎 [ModernSafariUI] 现代Safari UI控制已启用');
  }

  /**
   * 设置现代viewport配置
   * 基于最新的PWA最佳实践
   */
  private setupModernViewport() {
    if (!this.isSafari()) return;

    // 设置基础viewport
    let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }

    // 使用最现代的viewport配置
    viewport.content = 'width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no, viewport-fit=cover';

    // 设置PWA相关meta标签
    this.setMetaTag('apple-mobile-web-app-capable', 'yes');
    this.setMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
    this.setMetaTag('mobile-web-app-capable', 'yes');
    this.setMetaTag('apple-touch-fullscreen', 'yes');

    // 添加现代PWA manifest链接
    this.createManifestIfNeeded();
  }

  /**
   * 设置动态视口高度 - 使用现代CSS变量
   */
  private setupDynamicViewportHeight() {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --app-height: 100vh;
        --visual-viewport-height: 100vh;
      }

      /* 使用现代视口单位 */
      html, body {
        margin: 0;
        padding: 0;
        height: 100vh;
        height: 100dvh; /* 动态视口高度 */
        min-height: -webkit-fill-available; /* Safari回退 */
        overflow-x: hidden;
      }

      /* 应用容器 */
      #root {
        height: var(--app-height);
        height: 100dvh;
        min-height: -webkit-fill-available;
        overflow-x: hidden;
        position: relative;
      }

      /* 支持视觉视口变化 */
      @supports (height: 100dvh) {
        .full-height {
          height: 100dvh;
        }
      }
    `;
    document.head.appendChild(style);

    // 监听视觉视口变化
    this.setupVisualViewportListener();
  }

  /**
   * 设置滚动行为以触发Safari UI自动隐藏
   */
  private setupScrollBehavior() {
    // 确保页面有足够的内容高度来触发滚动
    document.body.style.minHeight = '120vh';

    // 监听滚动事件
    let isScrolling = false;

    window.addEventListener('scroll', () => {
      if (isScrolling) return;
      isScrolling = true;

      if (this.scrollTimer) {
        clearTimeout(this.scrollTimer);
      }

      this.scrollTimer = setTimeout(() => {
        isScrolling = false;
        this.handleScrollEnd();
      }, 100);
    }, { passive: true });

    // 监听触摸事件
    this.setupTouchBehavior();
  }

  /**
   * 处理滚动结束
   */
  private handleScrollEnd() {
    const currentScrollY = window.pageYOffset;

    // 当滚动停止时，如果页面滚动超过100px，触发一次微小滚动来确保UI隐藏
    if (currentScrollY > 100) {
      // 微小滚动来维持UI隐藏状态
      window.scrollBy(0, 1);
      setTimeout(() => window.scrollBy(0, -1), 50);
    }
  }

  /**
   * 设置触摸行为
   */
  private setupTouchBehavior() {
    // 禁用双击缩放
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });

    // 优化触摸滚动
    document.addEventListener('touchstart', () => {
      // 触摸开始时的处理
    }, { passive: true });
  }

  /**
   * 监听视觉视口变化
   */
  private setupVisualViewportListener() {
    if (!window.visualViewport) return;

    window.visualViewport.addEventListener('resize', () => {
      const height = window.visualViewport!.height;

      // 更新CSS变量
      document.documentElement.style.setProperty('--visual-viewport-height', `${height}px`);
      document.documentElement.style.setProperty('--app-height', `${height}px`);

      // 通知应用视口变化
      window.dispatchEvent(new CustomEvent('safariUIStateChanged', {
        detail: {
          height,
          isUIHidden: height >= window.innerHeight * 0.95
        }
      }));
    });
  }

  /**
   * 创建PWA manifest（如果不存在）
   */
  private createManifestIfNeeded() {
    if (document.querySelector('link[rel="manifest"]')) return;

    const manifest = {
      name: "PomeloX",
      short_name: "PomeloX",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#FF6B2C",
      icons: [
        {
          src: "/assets/icon.png",
          sizes: "any",
          type: "image/png"
        }
      ]
    };

    // 创建manifest blob
    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(manifestBlob);

    // 添加manifest链接
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = manifestURL;
    document.head.appendChild(link);
  }

  /**
   * 设置meta标签
   */
  private setMetaTag(name: string, content: string) {
    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
  }

  /**
   * 检测Safari浏览器
   */
  private isSafari(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return (ua.includes('safari') && !ua.includes('chrome')) || /ipad|iphone|ipod/.test(ua);
  }

  /**
   * 强制触发Safari UI状态变化（用户手势内调用）
   */
  public triggerUIStateChange() {
    if (!this.isSafari()) return;

    // 通过小幅滚动触发Safari的自然UI行为
    const currentScroll = window.pageYOffset;
    if (currentScroll > 0) {
      window.scrollTo(0, currentScroll + 5);
      setTimeout(() => window.scrollTo(0, currentScroll), 50);
    } else {
      // 如果在顶部，向下滚动一点然后回到顶部
      window.scrollTo(0, 50);
      setTimeout(() => window.scrollTo(0, 0), 50);
    }
  }

  /**
   * 清理资源
   */
  public cleanup() {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
    this.isInitialized = false;
  }
}

// 创建单例
export const modernSafariUIFix = new ModernSafariUIFix();

// 自动初始化
if (Platform.OS === 'web') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => modernSafariUIFix.init());
  } else {
    modernSafariUIFix.init();
  }
}