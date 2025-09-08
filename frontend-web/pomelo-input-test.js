// PomeloX Web端表单输入调试脚本
// 用法：在浏览器控制台中运行此脚本来诊断表单输入问题

(function() {
    'use strict';
    
    console.log('🚀 PomeloX表单输入调试器启动...');
    
    // 全局调试对象
    window.PomeloXInputDebugger = {
        version: '1.0.0',
        debugMode: true,
        testResults: {},
        inputElements: [],
        
        // 初始化调试器
        init() {
            console.log('🔧 初始化PomeloX输入调试器...');
            this.detectInputElements();
            this.setupGlobalEventListeners();
            this.runInitialTests();
            this.setupMutationObserver();
            console.log('✅ 调试器初始化完成');
        },
        
        // 检测所有输入元素
        detectInputElements() {
            console.log('🔍 检测输入元素...');
            
            // 检测所有可能的输入元素
            const selectors = [
                'input[type="text"]',
                'input[type="email"]', 
                'input[type="password"]',
                'input[type="tel"]',
                'input[type="phone"]',
                'textarea',
                '[role="textbox"]',
                '[contenteditable="true"]',
                // React Native Web 特定选择器
                'input[data-focusable="true"]',
                'input[class*="TextInput"]',
                'div[class*="TextInput"]'
            ];
            
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    if (!this.inputElements.includes(element)) {
                        this.inputElements.push(element);
                        console.log(`📍 发现输入元素: ${selector}`, element);
                    }
                });
            });
            
            console.log(`📊 总共发现 ${this.inputElements.length} 个输入元素`);
            return this.inputElements;
        },
        
        // 运行初始测试
        runInitialTests() {
            console.log('🧪 运行初始输入测试...');
            
            this.inputElements.forEach((element, index) => {
                const testId = `input-${index}`;
                console.log(`🔍 测试输入元素 ${index + 1}:`, element);
                
                this.testResults[testId] = {
                    element,
                    canFocus: this.testFocus(element),
                    styles: this.analyzeStyles(element),
                    events: this.testEvents(element),
                    accessibility: this.testAccessibility(element),
                    position: this.getElementPosition(element)
                };
            });
            
            this.printTestSummary();
        },
        
        // 测试焦点功能
        testFocus(element) {
            try {
                const originalActiveElement = document.activeElement;
                element.focus();
                const focusWorked = document.activeElement === element;
                
                // 恢复原来的焦点
                if (originalActiveElement && originalActiveElement.focus) {
                    originalActiveElement.focus();
                }
                
                console.log(`${focusWorked ? '✅' : '❌'} 焦点测试:`, element);
                return focusWorked;
            } catch (error) {
                console.log('❌ 焦点测试异常:', error, element);
                return false;
            }
        },
        
        // 分析元素样式
        analyzeStyles(element) {
            const computedStyle = window.getComputedStyle(element);
            const criticalStyles = {
                display: computedStyle.display,
                visibility: computedStyle.visibility,
                opacity: computedStyle.opacity,
                pointerEvents: computedStyle.pointerEvents,
                position: computedStyle.position,
                zIndex: computedStyle.zIndex,
                cursor: computedStyle.cursor,
                userSelect: computedStyle.userSelect,
                WebkitUserSelect: computedStyle.WebkitUserSelect,
                backgroundColor: computedStyle.backgroundColor,
                borderWidth: computedStyle.borderWidth,
                borderColor: computedStyle.borderColor,
                padding: computedStyle.padding,
                margin: computedStyle.margin,
                width: computedStyle.width,
                height: computedStyle.height
            };
            
            // 检查潜在问题
            const issues = [];
            if (computedStyle.pointerEvents === 'none') issues.push('pointerEvents设置为none');
            if (parseFloat(computedStyle.opacity) < 0.1) issues.push('透明度过低');
            if (computedStyle.display === 'none') issues.push('元素被隐藏');
            if (computedStyle.visibility === 'hidden') issues.push('可见性被隐藏');
            
            return { styles: criticalStyles, issues };
        },
        
        // 测试事件响应
        testEvents(element) {
            const events = {};
            const testEvents = ['click', 'focus', 'blur', 'input', 'change', 'keydown', 'keyup'];
            
            testEvents.forEach(eventName => {
                try {
                    const testEvent = new Event(eventName, { bubbles: true });
                    let eventFired = false;
                    
                    const handler = () => { eventFired = true; };
                    element.addEventListener(eventName, handler, { once: true });
                    
                    element.dispatchEvent(testEvent);
                    
                    events[eventName] = eventFired;
                    
                    // 清理
                    element.removeEventListener(eventName, handler);
                } catch (error) {
                    events[eventName] = false;
                    console.warn(`事件测试失败 ${eventName}:`, error);
                }
            });
            
            return events;
        },
        
        // 测试可访问性
        testAccessibility(element) {
            return {
                hasAriaLabel: element.hasAttribute('aria-label'),
                hasAriaLabelledBy: element.hasAttribute('aria-labelledby'),
                hasRole: element.hasAttribute('role'),
                tabIndex: element.tabIndex,
                isDisabled: element.disabled,
                isReadOnly: element.readOnly,
                hasPlaceholder: element.hasAttribute('placeholder')
            };
        },
        
        // 获取元素位置信息
        getElementPosition(element) {
            const rect = element.getBoundingClientRect();
            return {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                visible: rect.width > 0 && rect.height > 0,
                inViewport: rect.top >= 0 && rect.left >= 0 && 
                           rect.bottom <= window.innerHeight && 
                           rect.right <= window.innerWidth
            };
        },
        
        // 设置全局事件监听
        setupGlobalEventListeners() {
            console.log('👂 设置全局事件监听器...');
            
            // 监听所有输入相关事件
            const eventTypes = ['focus', 'blur', 'input', 'change', 'click', 'keydown'];
            
            eventTypes.forEach(eventType => {
                document.addEventListener(eventType, (e) => {
                    if (this.isInputElement(e.target)) {
                        console.log(`🎯 [${eventType.toUpperCase()}]`, {
                            element: e.target,
                            value: e.target.value || '',
                            timestamp: new Date().toLocaleTimeString(),
                            elementInfo: this.getElementInfo(e.target)
                        });
                    }
                }, true); // 使用捕获阶段
            });
        },
        
        // 检查是否为输入元素
        isInputElement(element) {
            const inputTags = ['input', 'textarea'];
            const inputTypes = ['text', 'email', 'password', 'tel', 'search'];
            
            return inputTags.includes(element.tagName.toLowerCase()) ||
                   element.contentEditable === 'true' ||
                   element.role === 'textbox' ||
                   (element.tagName.toLowerCase() === 'input' && 
                    inputTypes.includes(element.type));
        },
        
        // 获取元素信息
        getElementInfo(element) {
            return {
                tagName: element.tagName,
                type: element.type,
                id: element.id,
                className: element.className,
                placeholder: element.placeholder,
                name: element.name
            };
        },
        
        // 设置DOM变化监听器
        setupMutationObserver() {
            console.log('👀 设置DOM变化监听器...');
            
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                this.checkNewElements(node);
                            }
                        });
                    }
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },
        
        // 检查新增元素
        checkNewElements(element) {
            if (this.isInputElement(element)) {
                console.log('🆕 发现新的输入元素:', element);
                this.inputElements.push(element);
            }
            
            // 检查子元素
            const childInputs = element.querySelectorAll('input, textarea, [role="textbox"], [contenteditable="true"]');
            childInputs.forEach(child => {
                if (!this.inputElements.includes(child)) {
                    console.log('🆕 发现新的子输入元素:', child);
                    this.inputElements.push(child);
                }
            });
        },
        
        // 打印测试摘要
        printTestSummary() {
            console.log('📋 测试结果摘要:');
            console.table(
                Object.entries(this.testResults).map(([id, result]) => ({
                    ID: id,
                    CanFocus: result.canFocus ? '✅' : '❌',
                    Issues: result.styles.issues.length,
                    Visible: result.position.visible ? '✅' : '❌',
                    InViewport: result.position.inViewport ? '✅' : '❌'
                }))
            );
        },
        
        // 手动测试特定输入框
        testInput(selector) {
            console.log(`🧪 手动测试输入框: ${selector}`);
            const element = document.querySelector(selector);
            
            if (!element) {
                console.error('❌ 未找到元素:', selector);
                return false;
            }
            
            console.log('📍 找到元素:', element);
            
            // 尝试聚焦
            element.focus();
            console.log('🎯 聚焦结果:', document.activeElement === element);
            
            // 尝试输入文本
            const testText = 'test-' + Math.random().toString(36).substring(7);
            element.value = testText;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('📝 输入测试:', testText, '当前值:', element.value);
            
            return true;
        },
        
        // 测试所有发现的输入框
        testAllInputs() {
            console.log('🧪 测试所有输入框...');
            this.detectInputElements();
            
            this.inputElements.forEach((element, index) => {
                console.log(`\n🔍 测试输入框 ${index + 1}:`);
                
                // 测试聚焦
                element.focus();
                const canFocus = document.activeElement === element;
                console.log(`${canFocus ? '✅' : '❌'} 聚焦测试`);
                
                // 测试输入
                if (canFocus) {
                    const testValue = `test-${index}-${Date.now()}`;
                    element.value = testValue;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`✅ 输入测试: "${testValue}"`);
                    
                    // 清空输入
                    setTimeout(() => {
                        element.value = '';
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                    }, 1000);
                }
            });
        },
        
        // 获取诊断报告
        getDiagnosticReport() {
            const report = {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                viewport: `${window.innerWidth}x${window.innerHeight}`,
                url: window.location.href,
                inputElements: this.inputElements.length,
                testResults: this.testResults,
                commonIssues: this.analyzeCommonIssues()
            };
            
            console.log('📊 诊断报告:', report);
            return report;
        },
        
        // 分析常见问题
        analyzeCommonIssues() {
            const issues = {
                focusIssues: 0,
                styleIssues: 0,
                positionIssues: 0,
                eventIssues: 0
            };
            
            Object.values(this.testResults).forEach(result => {
                if (!result.canFocus) issues.focusIssues++;
                if (result.styles.issues.length > 0) issues.styleIssues++;
                if (!result.position.visible || !result.position.inViewport) issues.positionIssues++;
                
                const eventCount = Object.values(result.events).filter(Boolean).length;
                if (eventCount < 3) issues.eventIssues++;
            });
            
            return issues;
        },
        
        // 监控特定表单
        monitorForm(formSelector = 'form') {
            const form = document.querySelector(formSelector);
            if (!form) {
                console.warn('⚠️ 未找到指定表单:', formSelector);
                return;
            }
            
            console.log('👀 开始监控表单:', form);
            
            const formInputs = form.querySelectorAll('input, textarea');
            console.log(`📋 表单包含 ${formInputs.length} 个输入字段`);
            
            formInputs.forEach((input, index) => {
                console.log(`📍 输入字段 ${index + 1}:`, {
                    type: input.type,
                    name: input.name,
                    id: input.id,
                    placeholder: input.placeholder,
                    required: input.required
                });
            });
        }
    };
    
    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.PomeloXInputDebugger.init();
        });
    } else {
        window.PomeloXInputDebugger.init();
    }
    
    // 暴露便捷方法到控制台
    window.testPomeloInputs = () => window.PomeloXInputDebugger.testAllInputs();
    window.testInput = (selector) => window.PomeloXInputDebugger.testInput(selector);
    window.getPomeloReport = () => window.PomeloXInputDebugger.getDiagnosticReport();
    window.monitorPomeloForm = (selector) => window.PomeloXInputDebugger.monitorForm(selector);
    
    console.log(`
🎉 PomeloX输入调试器加载完成！

可用命令：
- testPomeloInputs() - 测试所有输入框
- testInput('selector') - 测试特定输入框
- getPomeloReport() - 获取诊断报告
- monitorPomeloForm() - 监控表单

调试器已自动开始监控...
    `);

})();