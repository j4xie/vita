/**
 * Safari浏览器UI自动隐藏工具
 * 处理Safari移动端地址栏和底部工具栏的自动显示/隐藏
 */
import { Platform } from 'react-native';

class SafariUIFix {
  private lastScrollY: number = 0;
  private isScrolling: boolean = false;
  private scrollTimeout: NodeJS.Timeout | null = null;
  private initialized: boolean = false;

  /**
   * 初始化Safari UI控制
   */
  public init() {
    if (Platform.OS !== 'web' || this.initialized) return;

    this.setupViewportMeta();
    this.setupScrollHandling();
    this.setupTouchHandling();
    this.initialized = true;

    console.log('🍎 [SafariUIFix] Safari UI自动隐藏已启用');
  }

  /**
   * 设置视口元标签以启用全屏体验
   */
  private setupViewportMeta() {
    // 检查是否为Safari浏览器
    if (!this.isSafari()) return;

    // 添加或更新viewport meta标签
    let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;

    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }

    // 设置viewport以支持Safari的全屏模式和UI自动隐藏
    viewportMeta.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, minimal-ui';

    // 添加Safari专用的全屏元标签
    this.addMetaTag('apple-mobile-web-app-capable', 'yes');
    this.addMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
    this.addMetaTag('apple-touch-fullscreen', 'yes');
    this.addMetaTag('mobile-web-app-capable', 'yes');

    // 设置主题色匹配应用
    this.addMetaTag('theme-color', '#ffffff');
    this.addMetaTag('apple-mobile-web-app-title', 'PomeloX');
  }

  /**
   * 添加meta标签的辅助函数
   */
  private addMetaTag(name: string, content: string) {
    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;

    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }

    meta.content = content;
  }

  /**
   * 设置滚动处理以控制Safari UI
   */
  private setupScrollHandling() {
    if (!this.isSafari()) return;

    // 监听页面滚动
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });

    // 监听触摸开始事件
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
  }

  /**
   * 滚动事件处理 - 增强版
   */
  private handleScroll() {
    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
    const scrollDelta = currentScrollY - this.lastScrollY;

    // 检测滚动方向和强度
    const scrollDirection = scrollDelta > 0 ? 'down' : 'up';
    const scrollSpeed = Math.abs(scrollDelta);

    // 更敏感的滚动检测
    if (scrollDirection === 'down' && scrollSpeed > 3 && currentScrollY > 30) {
      // 向下滚动超过30px且有一定速度时隐藏
      this.triggerSafariUIHide();
    } else if (scrollDirection === 'up' && scrollSpeed > 3) {
      // 向上滚动有一定速度时显示
      this.triggerSafariUIShow();
    }

    this.lastScrollY = currentScrollY;
    this.isScrolling = true;

    // 滚动结束后的处理
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
    }, 100);
  }

  /**
   * 触发Safari UI隐藏
   */
  private triggerSafariUIHide() {
    // 多重方法确保隐藏
    this.hideSafariUI();

    // 设置视口以触发全屏模式
    const viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (viewport) {
      viewport.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, minimal-ui';
    }
  }

  /**
   * 触发Safari UI显示
   */
  private triggerSafariUIShow() {
    this.showSafariUI();

    // 恢复标准视口设置
    const viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (viewport) {
      viewport.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no';
    }
  }

  /**
   * 触摸开始事件处理
   */
  private handleTouchStart() {
    // 触摸开始时尝试隐藏Safari UI
    this.hideSafariUI();
  }

  /**
   * 设置触摸处理以改善用户体验
   */
  private setupTouchHandling() {
    if (!this.isSafari()) return;

    // 阻止双击缩放
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });

    // 优化滚动体验
    document.addEventListener('touchmove', (event) => {
      // 允许滚动，但优化性能
      event.stopPropagation();
    }, { passive: true });
  }

  /**
   * 隐藏Safari UI (地址栏和底部工具栏)
   */
  private hideSafariUI() {
    if (!this.isSafari()) return;

    try {
      // 方法1: 快速小幅滚动触发Safari UI隐藏
      const currentScroll = window.pageYOffset;

      // 向下滚动少量像素来触发隐藏
      window.scrollTo({
        top: currentScroll + 50,
        behavior: 'smooth'
      });

      // 100ms后回到原位置
      setTimeout(() => {
        window.scrollTo({
          top: currentScroll,
          behavior: 'smooth'
        });
      }, 100);

      // 方法2: 触发页面重新布局
      document.body.style.height = '100.1vh';
      setTimeout(() => {
        document.body.style.height = '';
      }, 50);

    } catch (error) {
      console.warn('🍎 [SafariUIFix] 隐藏Safari UI时出错:', error);
    }
  }

  /**
   * 显示Safari UI
   */
  private showSafariUI() {
    if (!this.isSafari()) return;

    try {
      // 滚动到顶部附近以显示Safari UI
      if (window.pageYOffset <= 50) {
        window.scrollTo(0, 0);
      }
    } catch (error) {
      console.warn('🍎 [SafariUIFix] 显示Safari UI时出错:', error);
    }
  }

  /**
   * 调整视口高度以适应Safari UI变化
   */
  private adjustViewportHeight() {
    // 获取视觉视口高度（不包括Safari UI）
    const visualViewportHeight = window.visualViewport?.height || window.innerHeight;
    const documentHeight = document.documentElement.clientHeight;

    // 如果视觉视口高度小于文档高度，说明Safari UI可能是显示的
    if (visualViewportHeight < documentHeight) {
      // 动态调整根元素高度
      document.documentElement.style.setProperty(
        '--safari-viewport-height',
        `${visualViewportHeight}px`
      );
    }
  }

  /**
   * 检测是否为Safari浏览器
   */
  private isSafari(): boolean {
    if (typeof window === 'undefined') return false;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome') && !userAgent.includes('firefox');
    const isIOS = /ipad|iphone|ipod/.test(userAgent);

    return isSafari || isIOS;
  }

  /**
   * 监听视觉视口变化（Safari UI显示/隐藏时触发）
   */
  private setupVisualViewportListener() {
    if (!this.isSafari() || !window.visualViewport) return;

    window.visualViewport.addEventListener('resize', () => {
      console.log('🍎 [SafariUIFix] 视觉视口变化，高度:', window.visualViewport?.height);
      this.adjustViewportHeight();

      // 通知应用视口变化
      window.dispatchEvent(new CustomEvent('safariUIChanged', {
        detail: {
          height: window.visualViewport?.height,
          isUIVisible: window.visualViewport!.height < window.innerHeight
        }
      }));
    });
  }

  /**
   * 强制隐藏Safari UI（用户手势触发后调用）
   */
  public forceHideSafariUI() {
    if (!this.isSafari()) return;

    // 必须在用户手势内调用
    setTimeout(() => {
      this.hideSafariUI();
      // 滚动到稍微下方的位置以确保UI隐藏
      if (window.pageYOffset < 100) {
        window.scrollTo(0, 100);
      }
    }, 100);
  }

  /**
   * 设置CSS变量以适应Safari UI
   */
  private setupCSSVariables() {
    if (!this.isSafari()) return;

    const style = document.createElement('style');
    style.textContent = `
      :root {
        --safari-top-padding: env(safe-area-inset-top, 0px);
        --safari-bottom-padding: env(safe-area-inset-bottom, 0px);
        --safari-viewport-height: 100vh;
      }

      /* 全屏容器样式 */
      .safari-fullscreen-container {
        height: var(--safari-viewport-height);
        padding-top: var(--safari-top-padding);
        padding-bottom: var(--safari-bottom-padding);
      }

      /* 防止Safari UI影响固定定位元素 */
      .safari-fixed-bottom {
        bottom: calc(var(--safari-bottom-padding) + 10px);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 清理资源
   */
  public cleanup() {
    if (!this.initialized) return;

    window.removeEventListener('scroll', this.handleScroll.bind(this));
    document.removeEventListener('touchstart', this.handleTouchStart.bind(this));

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }

    this.initialized = false;
    console.log('🍎 [SafariUIFix] Safari UI控制已清理');
  }
}

// 创建单例实例
export const safariUIFix = new SafariUIFix();

// 自动初始化（在Web环境下）
if (Platform.OS === 'web') {
  // 等待DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      safariUIFix.init();
    });
  } else {
    safariUIFix.init();
  }
}