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
        try {
            cacheElements();
            initMobileNavigation();
            initSmoothScrolling();
            initFAQ();
            initFormValidation();
            initAnalytics();
            console.log('西柚网站初始化完成');
        } catch (error) {
            console.error('网站初始化错误:', error);
        }
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
            const toggle = item.querySelector('.faq-toggle');
            
            if (!question || !answer) return;
            
            question.addEventListener('click', function() {
                const isActive = item.classList.contains('active');
                
                // 关闭其他FAQ项
                elements.faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        const otherAnswer = otherItem.querySelector('.faq-answer');
                        const otherToggle = otherItem.querySelector('.faq-toggle');
                        if (otherAnswer) {
                            otherAnswer.style.maxHeight = '0';
                        }
                        if (otherToggle) {
                            otherToggle.textContent = '+';
                        }
                    }
                });
                
                // 切换当前FAQ项
                item.classList.toggle('active', !isActive);
                
                if (!isActive) {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                    if (toggle) toggle.textContent = '×';
                } else {
                    answer.style.maxHeight = '0';
                    if (toggle) toggle.textContent = '+';
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
     * 创建移动端粘性CTA
     */
    function createMobileStickyCTA() {
        try {
            // 只在移动端显示
            if (window.innerWidth > 768) return;
            
            const stickyCTA = document.getElementById('mobile-sticky-cta');
            if (!stickyCTA) return;

            // 滚动显示/隐藏逻辑
            const scrollHandler = throttle(() => {
                try {
                    const safetySection = document.getElementById('safety');
                    if (!safetySection) return;

                    const safetyTop = safetySection.offsetTop;
                    const safetyBottom = safetyTop + safetySection.offsetHeight;
                    const currentScroll = window.pageYOffset;
                    const windowHeight = window.innerHeight;

                    // 在安心计划section可见时显示粘性CTA
                    if (currentScroll + windowHeight > safetyTop + 200 && currentScroll < safetyBottom) {
                        stickyCTA.style.display = 'block';
                        stickyCTA.classList.add('visible');
                    } else {
                        stickyCTA.classList.remove('visible');
                        setTimeout(() => {
                            if (!stickyCTA.classList.contains('visible')) {
                                stickyCTA.style.display = 'none';
                            }
                        }, 300);
                    }
                } catch (error) {
                    console.error('Sticky CTA scroll error:', error);
                }
            }, 100);

            window.addEventListener('scroll', scrollHandler, { passive: true });
            
            // 窗口大小变化时重新检查
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    stickyCTA.style.display = 'none';
                }
            });
        } catch (error) {
            console.error('Mobile sticky CTA initialization error:', error);
        }
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

    /**
     * 安心计划模态框功能
     */
    function initSafetyModal() {
        // 添加全局函数
        window.openSafetyModal = function() {
            const modal = document.getElementById('safety-modal');
            if (modal) {
                modal.classList.add('active');
                modal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
                
                // 聚焦到模态框
                setTimeout(() => {
                    modal.querySelector('.modal-close').focus();
                }, 100);
            }
        };

        window.closeSafetyModal = function() {
            const modal = document.getElementById('safety-modal');
            if (modal) {
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }
        };

        // ESC键关闭模态框
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                window.closeSafetyModal();
            }
        });
    }

    /**
     * 语言切换功能
     */
    function initLanguageSwitcher() {
        const langButtons = document.querySelectorAll('.lang-btn');
        
        langButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const targetLang = this.getAttribute('data-lang');
                const currentPath = window.location.pathname;
                const currentHash = window.location.hash;
                
                // 检查是否已经在目标语言版本
                const isCurrentlyEnglish = currentPath.includes('/en/');
                if ((targetLang === 'en' && isCurrentlyEnglish) || (targetLang === 'zh' && !isCurrentlyEnglish)) {
                    return; // 已经在目标语言版本
                }
                
                let targetUrl = '';
                const currentPage = getCurrentPageName(currentPath);
                
                if (targetLang === 'en') {
                    // 切换到英文版本
                    targetUrl = `en/${currentPage}`;
                } else {
                    // 切换到中文版本 - 使用绝对路径避免相对路径问题
                    targetUrl = `/${currentPage}`;
                }
                
                // 保持锚点（如果存在）
                if (currentHash) {
                    targetUrl += currentHash;
                }
                
                // 记录语言切换事件
                console.log('Language switching:', {
                    from: isCurrentlyEnglish ? 'en' : 'zh',
                    to: targetLang,
                    currentPath: currentPath,
                    targetUrl: targetUrl,
                    preservedHash: currentHash
                });
                
                // 执行跳转
                window.location.href = targetUrl;
            });
        });
    }
    
    /**
     * 获取当前页面名称
     */
    function getCurrentPageName(path) {
        if (path.includes('privacy.html')) {
            return 'privacy.html';
        } else if (path.includes('support.html')) {
            return 'support.html';
        } else if (path.includes('terms.html')) {
            return 'terms.html';
        } else if (path.includes('404.html')) {
            return '404.html';
        } else {
            return 'index.html';
        }
    }

    /**
     * 价格切换功能
     */
    function initPricingSwitcher() {
        // 周期切换 (月付/年付)
        const periodButtons = document.querySelectorAll('.period-btn');
        const priceAmount = document.querySelector('.price-amount');
        const pricePeriod = document.querySelector('.price-period');
        const priceSubtitle = document.querySelector('.price-subtitle');
        
        const pricingData = {
            year: { 
                cny: '¥365', 
                usd: '$52', 
                period: '/年', 
                subtitle: '≈ ¥30.4/月（按年付折算）',
                savings: '较月付节省 ¥103/年 (22%)'
            },
            month: { 
                cny: '¥39', 
                usd: '$5.5', 
                period: '/月', 
                subtitle: '随时可取消，灵活订阅',
                savings: ''
            }
        };
        
        periodButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const period = this.getAttribute('data-period');
                const currency = document.querySelector('.currency-btn.active').getAttribute('data-currency');
                
                // 更新按钮状态
                periodButtons.forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'transparent';
                    b.style.color = 'var(--text-secondary)';
                });
                
                this.classList.add('active');
                this.style.background = 'var(--bg-gradient)';
                this.style.color = 'white';
                
                // 更新价格显示
                const currentCurrency = currency === 'cny' ? 'cny' : 'usd';
                if (priceAmount) priceAmount.textContent = pricingData[period][currentCurrency];
                if (pricePeriod) pricePeriod.textContent = pricingData[period].period;
                if (priceSubtitle) priceSubtitle.textContent = pricingData[period].subtitle;
                
                // 更新省钱显示
                const priceSavings = document.querySelector('.price-savings');
                if (priceSavings) {
                    if (pricingData[period].savings) {
                        priceSavings.textContent = pricingData[period].savings;
                        priceSavings.style.display = 'block';
                    } else {
                        priceSavings.style.display = 'none';
                    }
                }
            });
        });
        
        // 币种切换 (¥/$)
        const currencyButtons = document.querySelectorAll('.currency-btn');
        
        currencyButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const currency = this.getAttribute('data-currency');
                const period = document.querySelector('.period-btn.active').getAttribute('data-period');
                
                // 更新按钮状态
                currencyButtons.forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'transparent';
                    b.style.borderColor = 'var(--text-light)';
                    b.style.color = 'var(--text-light)';
                });
                
                this.classList.add('active');
                this.style.background = 'var(--primary-color)';
                this.style.borderColor = 'var(--primary-color)';
                this.style.color = 'white';
                
                // 更新价格显示
                if (priceAmount) priceAmount.textContent = pricingData[period][currency];
            });
        });
    }

    // 页面加载完成后的初始化
    document.addEventListener('DOMContentLoaded', function() {
        try {
            createBackToTopButton();
            // createMobileStickyCTA(); // 暂时禁用，可能导致刷新问题
            enhanceAccessibility();
            enhanceFormAccessibility();
            initAnalytics();
            initKeyboardShortcuts();
            initABTesting();
            initSafetyModal();
            initLanguageSwitcher();
            initPricingSwitcher();
        } catch (error) {
            console.error('页面初始化错误:', error);
        }
    });

    // 导出部分函数供外部使用
    window.PomeloApp = {
        toggleMobileMenu: toggleMobileMenu,
        scrollToTop: scrollToTop,
        showMessage: showMessage,
        openSafetyModal: function() { window.openSafetyModal(); },
        closeSafetyModal: function() { window.closeSafetyModal(); },
        // Analytics预留接口
        trackEvent: function(action, data) {
            console.log('Manual Analytics Event:', action, data);
        }
    };

    // 启动应用
    init();

})();