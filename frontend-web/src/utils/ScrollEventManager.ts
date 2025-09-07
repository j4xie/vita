import { DeviceEventEmitter } from 'react-native';

export interface ScrollEvent {
  scrollY: number;
  direction: 'up' | 'down' | null;
  velocity?: number;
}

class ScrollEventManager {
  private static instance: ScrollEventManager;
  private lastScrollY: number = 0;
  private scrollDirection: 'up' | 'down' | null = null;
  
  static getInstance(): ScrollEventManager {
    if (!ScrollEventManager.instance) {
      ScrollEventManager.instance = new ScrollEventManager();
    }
    return ScrollEventManager.instance;
  }

  // 供ScrollView调用的方法
  public handleScroll = (event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDelta = Math.abs(currentScrollY - this.lastScrollY);
    
    // 防抖：滚动距离小于8px忽略，避免轻微滚动触发AI按钮隐藏
    if (scrollDelta < 8) return;
    
    const direction = currentScrollY > this.lastScrollY ? 'down' : 'up';
    
    // 只有方向改变时才发送事件
    if (direction !== this.scrollDirection) {
      this.scrollDirection = direction;
      this.lastScrollY = currentScrollY;
      
      // 发送全局滚动事件
      DeviceEventEmitter.emit('globalScroll', {
        scrollY: currentScrollY,
        direction,
        velocity: scrollDelta, // 简单的速度计算
      } as ScrollEvent);
    } else {
      this.lastScrollY = currentScrollY;
    }
  };
  
  // 重置滚动状态（用于页面切换等场景）
  public resetScrollState = () => {
    this.lastScrollY = 0;
    this.scrollDirection = null;
  };
}

export default ScrollEventManager;