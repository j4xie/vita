/**
 * 西柚 Pomelo 移动端专用JavaScript
 * 基于移动优先设计，优化触摸交互体验
 */

(function() {
    'use strict';

    // 移动端应用状态
    const MobileApp = {
        currentLang: 'zh',
        isMenuOpen: false,
        elements: {},
        utils: {}
    };

    /**
     * 设备检测和重定向系统
     */
    const DeviceDetection = {
        // 检测是否为移动设备
        isMobile() {
            const userAgent = navigator.userAgent;
            const mobileRegex = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
            const screenWidth = window.innerWidth || document.documentElement.clientWidth;
            
            return mobileRegex.test(userAgent) || screenWidth <= 768;
        },

        // 检测当前页面语言
        getCurrentLang() {
            const pathname = window.location.pathname;
            return pathname.includes('/en/') || pathname.includes('lang=en') ? 'en' : 'zh';
        },

        // 获取当前页面名称
        getCurrentPage() {
            const pathname = window.location.pathname;
            if (pathname.includes('privacy')) return 'privacy.html';
            if (pathname.includes('support')) return 'support.html';
            if (pathname.includes('terms')) return 'terms.html';
            if (pathname.includes('404')) return '404.html';
            return 'index.html';
        },

        // 自动重定向到移动端
        autoRedirect() {
            // 如果已经在移动端，跳过
            if (window.location.pathname.includes('/mobile/')) return;
            
            // 如果不是移动设备，跳过
            if (!this.isMobile()) return;

            // 构建移动端URL
            const currentLang = this.getCurrentLang();
            const currentPage = this.getCurrentPage();
            const currentHash = window.location.hash;
            const currentSearch = window.location.search;
            
            let mobileUrl = '/mobile/';
            if (currentLang === 'en') {
                mobileUrl += 'en/';
            }
            mobileUrl += currentPage;
            
            // 保持语言参数和锚点
            const params = new URLSearchParams(currentSearch);
            params.set('lang', currentLang);
            params.set('from', 'auto');
            
            mobileUrl += '?' + params.toString() + currentHash;
            
            console.log('Mobile redirect:', {
                from: window.location.pathname,
                to: mobileUrl,
                device: 'mobile'
            });
            
            window.location.href = mobileUrl;
        }
    };

    /**
     * 移动端导航管理
     */
    const MobileNavigation = {
        init() {
            this.bindEvents();
            this.updateActiveNav();
        },

        bindEvents() {
            // 汉堡菜单切换
            const menuToggle = document.querySelector('.mobile-menu-toggle');
            if (menuToggle) {
                menuToggle.addEventListener('click', this.toggleMenu.bind(this));
            }

            // 导航链接点击
            const navLinks = document.querySelectorAll('.mobile-nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', this.handleNavClick.bind(this));
            });

            // 底部TabBar
            const tabItems = document.querySelectorAll('.mobile-tabbar-item');
            tabItems.forEach(item => {
                item.addEventListener('click', this.handleTabClick.bind(this));
            });
        },

        toggleMenu() {
            const menu = document.querySelector('.mobile-nav-menu');
            const toggle = document.querySelector('.mobile-menu-toggle');
            
            MobileApp.isMenuOpen = !MobileApp.isMenuOpen;
            
            if (menu) {
                menu.classList.toggle('active', MobileApp.isMenuOpen);
            }
            
            if (toggle) {
                toggle.setAttribute('aria-expanded', MobileApp.isMenuOpen);
            }

            // 防止背景滚动
            document.body.style.overflow = MobileApp.isMenuOpen ? 'hidden' : '';
        },

        handleNavClick(e) {
            // 平滑滚动到锚点
            const href = e.target.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerHeight = 56; // 移动端导航栏高度
                    const targetPosition = target.offsetTop - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
                
                // 关闭菜单
                if (MobileApp.isMenuOpen) {
                    this.toggleMenu();
                }
            }
        },

        handleTabClick(e) {
            // TabBar切换逻辑
            const tabItems = document.querySelectorAll('.mobile-tabbar-item');
            tabItems.forEach(item => item.classList.remove('active'));
            e.currentTarget.classList.add('active');
        },

        updateActiveNav() {
            // 根据当前页面更新导航状态
            const currentPath = window.location.pathname;
            const navLinks = document.querySelectorAll('.mobile-nav-link');
            
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && currentPath.includes(href.replace('.html', ''))) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        }
    };

    /**
     * 移动端语言切换
     */
    const MobileLanguage = {
        init() {
            this.bindEvents();
            this.updateLangState();
        },

        bindEvents() {
            const langButtons = document.querySelectorAll('.mobile-lang-btn');
            langButtons.forEach(btn => {
                btn.addEventListener('click', this.handleLangSwitch.bind(this));
            });
        },

        handleLangSwitch(e) {
            const targetLang = e.target.getAttribute('data-lang');
            const currentPath = window.location.pathname;
            const currentHash = window.location.hash;
            const currentSearch = window.location.search;
            
            if (targetLang === MobileApp.currentLang) return;
            
            let targetUrl = '';
            const currentPage = DeviceDetection.getCurrentPage();
            
            if (targetLang === 'en') {
                // 切换到英文移动端
                targetUrl = currentPath.includes('/mobile/') 
                    ? currentPath.replace('/mobile/', '/mobile/en/')
                    : '/mobile/en/' + currentPage;
            } else {
                // 切换到中文移动端
                targetUrl = currentPath.includes('/mobile/en/') 
                    ? currentPath.replace('/mobile/en/', '/mobile/')
                    : '/mobile/' + currentPage;
            }
            
            // 保持URL参数和锚点
            const params = new URLSearchParams(currentSearch);
            params.set('lang', targetLang);
            targetUrl += '?' + params.toString() + currentHash;
            
            console.log('Mobile language switch:', {
                from: MobileApp.currentLang,
                to: targetLang,
                targetUrl: targetUrl
            });
            
            window.location.href = targetUrl;
        },

        updateLangState() {
            MobileApp.currentLang = DeviceDetection.getCurrentLang();
            
            const langButtons = document.querySelectorAll('.mobile-lang-btn');
            langButtons.forEach(btn => {
                const btnLang = btn.getAttribute('data-lang');
                btn.classList.toggle('active', btnLang === MobileApp.currentLang);
            });
        }
    };

    /**
     * 移动端表单优化
     */
    const MobileForm = {
        init() {
            this.optimizeInputs();
            this.bindFormEvents();
        },

        optimizeInputs() {
            // 优化iOS输入体验
            const inputs = document.querySelectorAll('.mobile-form-input, .mobile-form-textarea');
            inputs.forEach(input => {
                // 防止iOS自动缩放
                input.style.fontSize = '16px';
                
                // 优化键盘类型
                if (input.type === 'email') {
                    input.setAttribute('inputmode', 'email');
                }
                if (input.type === 'tel') {
                    input.setAttribute('inputmode', 'tel');
                }
                if (input.type === 'number') {
                    input.setAttribute('inputmode', 'numeric');
                }
            });
        },

        bindFormEvents() {
            const forms = document.querySelectorAll('.mobile-form');
            forms.forEach(form => {
                form.addEventListener('submit', this.handleSubmit.bind(this));
            });

            // 实时验证
            const inputs = document.querySelectorAll('.mobile-form-input');
            inputs.forEach(input => {
                input.addEventListener('blur', this.validateInput.bind(this));
            });
        },

        handleSubmit(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            // 移动端友好的提交反馈
            this.showToast('提交中...', 'loading');
            
            // 模拟提交
            setTimeout(() => {
                this.showToast('提交成功！我们会尽快联系您。', 'success');
                e.target.reset();
            }, 1500);
        },

        validateInput(e) {
            const input = e.target;
            const value = input.value.trim();
            
            // 简单验证逻辑
            if (input.required && !value) {
                this.showFieldError(input, '此字段为必填项');
            } else if (input.type === 'email' && value && !this.isValidEmail(value)) {
                this.showFieldError(input, '请输入有效的邮箱地址');
            } else {
                this.clearFieldError(input);
            }
        },

        isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },

        showFieldError(input, message) {
            input.style.borderColor = 'var(--danger-color)';
            // 可以添加错误提示显示逻辑
        },

        clearFieldError(input) {
            input.style.borderColor = 'var(--border-color)';
        },

        showToast(message, type = 'info') {
            // 简单的移动端Toast实现
            const toast = document.createElement('div');
            toast.className = 'mobile-toast';
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: ${type === 'success' ? 'var(--success-color)' : 
                           type === 'error' ? 'var(--danger-color)' : 
                           'var(--text-primary)'};
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 2000;
                max-width: 80%;
                text-align: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            
            document.body.appendChild(toast);
            
            // 显示动画
            setTimeout(() => {
                toast.style.opacity = '1';
            }, 100);
            
            // 自动消失
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, 2000);
        }
    };

    /**
     * 移动端性能优化
     */
    const MobilePerformance = {
        init() {
            this.initLazyLoading();
            this.optimizeImages();
            this.preventBounce();
        },

        initLazyLoading() {
            // 图片懒加载
            const images = document.querySelectorAll('img[data-src]');
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.getAttribute('data-src');
                        img.removeAttribute('data-src');
                        img.classList.add('loaded');
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        },

        optimizeImages() {
            // WebP支持检测
            const supportsWebP = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = 1;
                return canvas.toDataURL('image/webp').indexOf('webp') !== -1;
            };

            if (supportsWebP()) {
                document.documentElement.classList.add('webp-support');
            }
        },

        preventBounce() {
            // 防止iOS橡皮筋滚动
            document.addEventListener('touchmove', function(e) {
                if (e.target.closest('.mobile-page')) {
                    const scrollContainer = e.target.closest('.mobile-page');
                    const scrollTop = scrollContainer.scrollTop;
                    const scrollHeight = scrollContainer.scrollHeight;
                    const clientHeight = scrollContainer.clientHeight;
                    
                    if ((scrollTop === 0 && e.deltaY < 0) || 
                        (scrollTop + clientHeight >= scrollHeight && e.deltaY > 0)) {
                        e.preventDefault();
                    }
                }
            }, { passive: false });
        }
    };

    /**
     * 移动端工具函数
     */
    MobileApp.utils = {
        // 节流函数
        throttle(func, limit) {
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
        },

        // 防抖函数
        debounce(func, wait) {
            let timeout;
            return function() {
                const context = this;
                const args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    func.apply(context, args);
                }, wait);
            };
        },

        // 获取URL参数
        getUrlParam(name) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(name);
        },

        // 设置URL参数
        setUrlParam(name, value) {
            const url = new URL(window.location);
            url.searchParams.set(name, value);
            window.history.replaceState({}, '', url);
        },

        // 振动反馈（如果支持）
        vibrate(pattern = [50]) {
            if ('vibrate' in navigator) {
                navigator.vibrate(pattern);
            }
        },

        // 复制到剪贴板
        async copyToClipboard(text) {
            try {
                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(text);
                    MobileForm.showToast('已复制到剪贴板', 'success');
                } else {
                    // 兼容方案
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    MobileForm.showToast('已复制到剪贴板', 'success');
                }
            } catch (err) {
                console.error('复制失败:', err);
                MobileForm.showToast('复制失败', 'error');
            }
        },

        // 检测网络状态
        getNetworkStatus() {
            return {
                online: navigator.onLine,
                connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection
            };
        }
    };

    /**
     * 移动端分析和统计
     */
    const MobileAnalytics = {
        init() {
            this.trackPageView();
            this.bindAnalyticsEvents();
        },

        trackPageView() {
            // 移动端页面访问统计
            const pageData = {
                page: window.location.pathname,
                title: document.title,
                language: MobileApp.currentLang,
                device: 'mobile',
                timestamp: new Date().toISOString(),
                referrer: document.referrer,
                userAgent: navigator.userAgent.substring(0, 200) // 截取防止过长
            };

            console.log('Mobile page view:', pageData);
            
            // 这里可以集成实际的分析服务
            if (typeof gtag !== 'undefined') {
                gtag('event', 'page_view', {
                    page_title: pageData.title,
                    page_location: window.location.href,
                    custom_map: {
                        'device_type': 'mobile',
                        'language': pageData.language
                    }
                });
            }
        },

        bindAnalyticsEvents() {
            // 监听所有带data-analytics的元素
            document.addEventListener('click', (e) => {
                const target = e.target.closest('[data-analytics]');
                if (target) {
                    const analyticsData = target.getAttribute('data-analytics');
                    this.trackEvent('click', analyticsData, {
                        element: target.tagName.toLowerCase(),
                        text: target.textContent.trim().substring(0, 50),
                        href: target.getAttribute('href')
                    });
                }
            });
        },

        trackEvent(action, category, data = {}) {
            const eventData = {
                action,
                category,
                ...data,
                device: 'mobile',
                language: MobileApp.currentLang,
                timestamp: new Date().toISOString()
            };

            console.log('Mobile analytics event:', eventData);
            
            // 集成实际分析服务
            if (typeof gtag !== 'undefined') {
                gtag('event', action, {
                    event_category: category,
                    event_label: data.text || '',
                    custom_map: {
                        'device_type': 'mobile',
                        'language': eventData.language
                    }
                });
            }
        }
    };

    /**
     * 移动端初始化
     */
    function initMobileApp() {
        // 检测当前语言
        MobileApp.currentLang = DeviceDetection.getCurrentLang();
        
        // 缓存DOM元素
        MobileApp.elements = {
            navbar: document.querySelector('.mobile-navbar'),
            tabbar: document.querySelector('.mobile-tabbar'),
            content: document.querySelector('.mobile-content'),
            menu: document.querySelector('.mobile-nav-menu')
        };

        // 初始化各个模块
        MobileNavigation.init();
        MobileLanguage.init();
        MobileForm.init();
        MobilePerformance.init();
        MobileAnalytics.init();

        // 添加页面加载动画
        document.body.classList.add('mobile-fade-in');
        
        console.log('Mobile app initialized:', {
            language: MobileApp.currentLang,
            userAgent: navigator.userAgent,
            screen: `${window.innerWidth}x${window.innerHeight}`,
            safeArea: {
                top: getComputedStyle(document.documentElement).getPropertyValue('--safe-area-top'),
                bottom: getComputedStyle(document.documentElement).getPropertyValue('--safe-area-bottom')
            }
        });
    }

    /**
     * 自动设备检测（如果需要）
     */
    function autoDeviceDetection() {
        // 只在非移动端页面执行自动检测
        if (!window.location.pathname.includes('/mobile/')) {
            // 延迟检测，避免影响页面加载
            setTimeout(() => {
                DeviceDetection.autoRedirect();
            }, 100);
        }
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileApp);
    } else {
        initMobileApp();
    }

    // 自动设备检测（可选）
    autoDeviceDetection();

    // 导出移动端API
    window.MobileApp = MobileApp;
    window.DeviceDetection = DeviceDetection;

})();