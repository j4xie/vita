// Web输入框修复工具 - 专门解决React Native Web输入问题
import { Platform } from 'react-native';

/**
 * Web环境下强制修复输入框的全局方法
 * 这个方法会在页面加载后自动运行，修复所有输入框的交互问题
 */
export class WebInputFix {
  private static isInitialized = false;
  private static observers: MutationObserver[] = [];
  
  /**
   * 初始化Web输入修复
   * 应该在App启动时调用
   */
  static init() {
    if (Platform.OS !== 'web' || this.isInitialized) {
      return;
    }
    
    console.log('🔧 [WebInputFix] 初始化Web输入修复工具...');
    
    // 等待DOM准备就绪
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupFixing();
      });
    } else {
      this.setupFixing();
    }
    
    this.isInitialized = true;
  }
  
  /**
   * 设置输入框修复
   */
  private static setupFixing() {
    console.log('🛠️ [WebInputFix] 开始设置输入框修复...');
    
    // 修复现有的输入框
    this.fixExistingInputs();
    
    // 监听新增的输入框
    this.observeNewInputs();
    
    // 全局事件修复
    this.setupGlobalEventFixes();
    
    console.log('✅ [WebInputFix] Web输入修复设置完成');
  }
  
  /**
   * 修复现有的输入框
   */
  private static fixExistingInputs() {
    const inputSelectors = [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="password"]',
      'input[type="tel"]',
      'input[type="number"]',
      'textarea'
    ];
    
    inputSelectors.forEach(selector => {
      const inputs = document.querySelectorAll(selector);
      inputs.forEach(input => this.fixSingleInput(input as HTMLInputElement));
    });
    
    console.log(`🔍 [WebInputFix] 已修复 ${document.querySelectorAll('input, textarea').length} 个输入框`);
  }
  
  /**
   * 修复单个输入框
   */
  private static fixSingleInput(input: HTMLInputElement) {
    if (!input || input.getAttribute('data-web-fixed') || input.getAttribute('data-force-native')) {
      return; // 已经修复过的或ForceNativeInput跳过
    }
    
    // 检查是否为ForceNativeInput创建的元素，如果是则跳过
    if (input.closest('[data-force-native-container]')) {
      return;
    }
    
    console.log('🔧 [WebInputFix] 修复输入框:', input);
    
    // 标记为已修复
    input.setAttribute('data-web-fixed', 'true');
    
    // 强制设置关键样式
    const criticalStyles = {
      cursor: 'text',
      userSelect: 'text',
      WebkitUserSelect: 'text',
      pointerEvents: 'auto',
      zIndex: '10',
      position: 'relative',
      WebkitAppearance: 'none',
      MozAppearance: 'textfield',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
      // outline: 'none', // React Native Web 不支持这个属性
      boxSizing: 'border-box'
    };
    
    Object.assign(input.style, criticalStyles);
    
    // 确保属性设置正确
    input.readOnly = false;
    input.disabled = false;
    input.tabIndex = input.tabIndex || 0;
    
    // 移除可能干扰的属性
    input.removeAttribute('readonly');
    input.removeAttribute('disabled');
    
    // 强制设置事件监听器
    this.forceEventListeners(input);
  }
  
  /**
   * 强制为输入框设置事件监听器
   */
  private static forceEventListeners(input: HTMLInputElement) {
    // 移除所有可能干扰的事件监听器
    const newInput = input.cloneNode(true) as HTMLInputElement;
    input.parentNode?.replaceChild(newInput, input);
    
    // 重新应用样式
    this.fixSingleInput(newInput);
    
    // 添加调试事件监听器
    ['focus', 'blur', 'input', 'change', 'click', 'keydown', 'keyup'].forEach(eventName => {
      newInput.addEventListener(eventName, (e) => {
        console.log(`🎯 [WebInputFix] ${eventName}事件:`, {
          target: e.target,
          value: (e.target as HTMLInputElement).value,
          timestamp: new Date().toLocaleTimeString()
        });
      }, { passive: false });
    });
    
    // 特殊处理点击事件 - 确保能够聚焦
    newInput.addEventListener('click', (e) => {
      e.stopPropagation();
      if (document.activeElement !== newInput) {
        newInput.focus();
      }
    }, { passive: false });
    
    // 特殊处理键盘事件 - 确保输入正常
    newInput.addEventListener('keydown', (e) => {
      console.log(`⌨️ [WebInputFix] 按键:`, e.key, e.code);
    }, { passive: false });
  }
  
  /**
   * 监听新增的输入框
   */
  private static observeNewInputs() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // 检查新增的输入框
              if (element.matches && element.matches('input, textarea')) {
                this.fixSingleInput(element as HTMLInputElement);
              }
              
              // 检查子元素中的输入框
              const childInputs = element.querySelectorAll?.('input, textarea');
              childInputs?.forEach(input => this.fixSingleInput(input as HTMLInputElement));
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    this.observers.push(observer);
    console.log('👀 [WebInputFix] 已设置DOM变化监听器');
  }
  
  /**
   * 设置全局事件修复
   */
  private static setupGlobalEventFixes() {
    // 阻止可能干扰的全局事件
    document.addEventListener('touchstart', (e) => {
      if (e.target && (e.target as Element).matches?.('input, textarea')) {
        console.log('👆 [WebInputFix] 输入框触摸事件');
      }
    }, { passive: true });
    
    // 全局点击事件处理
    document.addEventListener('click', (e) => {
      if (e.target && (e.target as Element).matches?.('input, textarea')) {
        const input = e.target as HTMLInputElement;
        console.log('🖱️ [WebInputFix] 输入框点击事件，强制聚焦');
        
        // 延迟聚焦，确保其他事件处理完成
        setTimeout(() => {
          if (document.activeElement !== input) {
            input.focus();
          }
        }, 10);
      }
    }, true); // 使用捕获阶段
    
    console.log('🌍 [WebInputFix] 全局事件修复已设置');
  }
  
  /**
   * 手动触发输入框修复（用于调试）
   */
  static manualFix() {
    if (Platform.OS !== 'web') return;
    
    console.log('🔧 [WebInputFix] 手动触发输入框修复...');
    this.fixExistingInputs();
  }
  
  /**
   * 清理资源
   */
  static cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isInitialized = false;
    console.log('🧹 [WebInputFix] 已清理资源');
  }
  
  /**
   * 获取诊断信息
   */
  static getDiagnostics() {
    const inputs = document.querySelectorAll('input, textarea');
    const fixedInputs = document.querySelectorAll('input[data-web-fixed], textarea[data-web-fixed]');
    
    const diagnostics = {
      totalInputs: inputs.length,
      fixedInputs: fixedInputs.length,
      isInitialized: this.isInitialized,
      observers: this.observers.length,
      platform: Platform.OS,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };
    
    console.log('📊 [WebInputFix] 诊断信息:', diagnostics);
    return diagnostics;
  }
}

// 暴露到全局对象供调试使用
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  (window as any).WebInputFix = WebInputFix;
}