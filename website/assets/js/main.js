/**
 * 西柚 (Grapefruit) 留学生平台 - 轻量级交互脚本
 * 仅包含必要的移动端导航、平滑滚动和细节微交互
 */

(function() {
    'use strict';

    // DOM 元素缓存
    const elements = {
        navToggle: null,
        navLinks: null,
        faqItems: null,
        form: null
    };

    /**
     * 初始化应用
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setup);
        } else {
            setup();
        }
    }

    /**
     * 设置应用功能
     */
    function setup() {
        cacheElements();
        initMobileNavigation();
        initSmoothScrolling();
        initFAQ();
        initFormValidation();
        initAnalytics();
        console.log('西柚网站初始化完成');
    }

    /**
     * 缓存DOM元素
     */
    function cacheElements() {
        elements.navToggle = document.querySelector('.nav-toggle');
        elements.navLinks = document.getElementById('nav-links');
        elements.faqItems = document.querySelectorAll('.faq-item');
        elements.form = document.querySelector('.form');
    }

    /**
     * 移动端导航折叠功能
     */
    function initMobileNavigation() {
        if (!elements.navToggle || !elements.navLinks) return;

        elements.navToggle.addEventListener('click', toggleMobileMenu);
        
        // 点击导航链接后关闭菜单
        const navLinkItems = elements.navLinks.querySelectorAll('a');
        navLinkItems.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        // 点击外部区域关闭菜单
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.nav') && isMenuOpen()) {
                closeMobileMenu();
            }
        });
    }

    /**
     * 切换移动端菜单
     */
    function toggleMobileMenu() {
        const isExpanded = elements.navToggle.getAttribute('aria-expanded') === 'true';
        const newState = !isExpanded;
        
        elements.navToggle.setAttribute('aria-expanded', newState);
        elements.navLinks.classList.toggle('active', newState);
        
        // 更新图标
        const icon = elements.navToggle.querySelector('use');
        if (icon) {
            icon.setAttribute('href', newState ? 
                'assets/icons/sprite.svg#close' : 
                'assets/icons/sprite.svg#menu'
            );
        }
    }

    /**
     * 关闭移动端菜单
     */
    function closeMobileMenu() {
        if (!isMenuOpen()) return;
        
        elements.navToggle.setAttribute('aria-expanded', false);
        elements.navLinks.classList.remove('active');
        
        const icon = elements.navToggle.querySelector('use');
        if (icon) {
            icon.setAttribute('href', 'assets/icons/sprite.svg#menu');
        }
    }

    /**
     * 检查菜单是否打开
     */
    function isMenuOpen() {
        return elements.navToggle.getAttribute('aria-expanded') === 'true';
    }

    /**
     * 锚点平滑滚动
     */
    function initSmoothScrolling() {
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        
        anchorLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                const target = document.querySelector(href);
                if (!target) return;
                
                e.preventDefault();
                
                const headerHeight = document.querySelector('.header')?.offsetHeight || 80;
                const targetPosition = target.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // 关闭移动端菜单
                closeMobileMenu();
            });
        });
    }

    /**
     * FAQ 交互功能
     */
    function initFAQ() {
        elements.faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            
            if (!question || !answer) return;
            
            question.addEventListener('click', function() {
                const isActive = item.classList.contains('active');
                
                // 关闭其他FAQ项
                elements.faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        const otherAnswer = otherItem.querySelector('.faq-answer');
                        if (otherAnswer) {
                            otherAnswer.style.maxHeight = '0';
                        }
                    }
                });
                
                // 切换当前FAQ项
                item.classList.toggle('active', !isActive);
                
                if (!isActive) {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                } else {
                    answer.style.maxHeight = '0';
                }
            });
        });
    }

    /**
     * 表单验证和提交
     */
    function initFormValidation() {
        if (!elements.form) return;

        elements.form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 获取表单数据
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // 验证必填字段
            if (!data.name || !data.email || !data.type) {
                showMessage('请填写所有必填项', 'error');
                return;
            }
            
            // 验证邮箱格式
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                showMessage('请输入有效的邮箱地址', 'error');
                return;
            }
            
            // 验证隐私政策同意
            if (!data['privacy-agree']) {
                showMessage('请同意隐私政策和服务条款', 'error');
                return;
            }
            
            // 禁用提交按钮
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = '提交中...';
            
            // 模拟提交过程
            setTimeout(() => {
                showMessage('感谢您的申请！我们会尽快与您联系。', 'success');
                this.reset();
                
                // 恢复按钮
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }, 1500);
        });
    }

    /**
     * 显示消息提示
     */
    function showMessage(message, type = 'info') {
        // 移除现有消息
        const existingMessage = document.querySelector('.message-toast');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `message-toast message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'error' ? '#EF4444' : type === 'success' ? '#10B981' : '#FF6B35'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            font-weight: 500;
            max-width: 300px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(messageEl);
        
        // 显示动画
        setTimeout(() => {
            messageEl.style.transform = 'translateX(0)';
        }, 100);
        
        // 自动移除
        setTimeout(() => {
            messageEl.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 节流函数
     */
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 防抖函数
     */
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    }

    /**
     * 滚动到顶部功能
     */
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    /**
     * 创建返回顶部按钮
     */
    function createBackToTopButton() {
        if (document.querySelector('.back-to-top')) return;
        
        const button = document.createElement('button');
        button.className = 'back-to-top';
        button.setAttribute('aria-label', '返回顶部');
        button.innerHTML = '↑';
        button.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #FF6B35, #FF8E53);
            color: white;
            border: none;
            border-radius: 50%;
            font-size: 1.2rem;
            font-weight: bold;
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 999;
            box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
        `;

        button.addEventListener('click', scrollToTop);
        document.body.appendChild(button);

        // 滚动显示/隐藏
        const scrollHandler = throttle(() => {
            if (window.pageYOffset > 300) {
                button.style.opacity = '1';
                button.style.visibility = 'visible';
            } else {
                button.style.opacity = '0';
                button.style.visibility = 'hidden';
            }
        }, 100);

        window.addEventListener('scroll', scrollHandler, { passive: true });
    }

    /**
     * 增强可访问性
     */
    function enhanceAccessibility() {
        // 键盘导航支持
        document.addEventListener('keydown', function(e) {
            // ESC 关闭移动菜单
            if (e.key === 'Escape' && isMenuOpen()) {
                closeMobileMenu();
            }
        });

        // 焦点管理
        const focusableElements = 'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])';
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                const focusable = Array.from(document.querySelectorAll(focusableElements))
                    .filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
                
                const firstFocusable = focusable[0];
                const lastFocusable = focusable[focusable.length - 1];
                
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        lastFocusable.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        firstFocusable.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }

    /**
     * 初始化Analytics事件委托
     */
    function initAnalytics() {
        document.addEventListener('click', function(e) {
            const target = e.target.closest('[data-analytics]');
            if (!target) return;

            const analyticsData = target.getAttribute('data-analytics');
            const targetHref = target.getAttribute('href');
            const targetText = target.textContent.trim();

            // 记录analytics事件
            console.log('Analytics Event:', {
                action: analyticsData,
                target: targetHref,
                text: targetText,
                timestamp: new Date().toISOString(),
                page: window.location.pathname
            });

            // 预留给真实analytics服务
            if (typeof window.dispatchAnalytics === 'function') {
                window.dispatchAnalytics(analyticsData, {
                    target: targetHref,
                    text: targetText
                });
            }
        });
    }

    /**
     * 创建固定CTA按钮（滚动时显示）
     */
    function createFixedCTA() {
        // 只在首页显示
        if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
            return;
        }

        const fixedCTA = document.createElement('a');
        fixedCTA.href = '#contact';
        fixedCTA.className = 'fixed-cta btn btn-primary btn-sm';
        fixedCTA.setAttribute('data-analytics', 'cta:fixed:beta');
        fixedCTA.setAttribute('aria-label', '预约内测 - 固定按钮');
        fixedCTA.innerHTML = `
            <svg class="icon" aria-hidden="true">
                <use href="assets/icons/sprite.svg#external"></use>
            </svg>
            预约内测
        `;

        document.body.appendChild(fixedCTA);

        // 滚动显示/隐藏逻辑
        const scrollHandler = throttle(() => {
            const heroSection = document.getElementById('hero');
            if (!heroSection) return;

            const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
            const currentScroll = window.pageYOffset;

            if (currentScroll > heroBottom - 100) {
                fixedCTA.classList.add('visible');
            } else {
                fixedCTA.classList.remove('visible');
            }
        }, 100);

        window.addEventListener('scroll', scrollHandler, { passive: true });
    }

    /**
     * 增强表单可访问性
     */
    function enhanceFormAccessibility() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            // 为所有input添加错误状态支持
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('invalid', function(e) {
                    e.preventDefault();
                    this.setAttribute('aria-invalid', 'true');
                    
                    // 添加错误样式
                    this.style.borderColor = 'var(--danger-color)';
                    this.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                });

                input.addEventListener('input', function() {
                    if (this.getAttribute('aria-invalid') === 'true') {
                        this.removeAttribute('aria-invalid');
                        this.style.borderColor = '';
                        this.style.boxShadow = '';
                    }
                });
            });
        });
    }

    /**
     * 键盘快捷键支持
     */
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + K 聚焦到联系表单
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const contactSection = document.getElementById('contact');
                const firstInput = contactSection?.querySelector('input');
                if (firstInput) {
                    firstInput.focus();
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                }
            }

            // Ctrl/Cmd + H 返回首页
            if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                e.preventDefault();
                window.location.href = 'index.html';
            }
        });
    }

    /**
     * A/B测试预留功能
     */
    function initABTesting() {
        // 检查A/B测试变体
        const variantElements = document.querySelectorAll('[data-variant]');
        variantElements.forEach(element => {
            const variant = element.getAttribute('data-variant');
            console.log('A/B Test Variant detected:', variant, element);
            
            // 预留: 实际A/B测试逻辑将在这里实现
        });
    }

    // 页面加载完成后的初始化
    document.addEventListener('DOMContentLoaded', function() {
        createBackToTopButton();
        createFixedCTA();
        enhanceAccessibility();
        enhanceFormAccessibility();
        initAnalytics();
        initKeyboardShortcuts();
        initABTesting();
    });

    // 导出部分函数供外部使用
    window.GrapefruitApp = {
        toggleMobileMenu: toggleMobileMenu,
        scrollToTop: scrollToTop,
        showMessage: showMessage,
        // Analytics预留接口
        trackEvent: function(action, data) {
            console.log('Manual Analytics Event:', action, data);
        }
    };

    // 启动应用
    init();

})();