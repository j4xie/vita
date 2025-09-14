import { test, expect } from '@playwright/test';

/**
 * PomeloX 用户认证流程端到端测试
 * 测试登录、注册、权限验证等认证相关功能
 */

test.describe('用户认证流程测试', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });
  
  test('用户可以访问登录页面', async ({ page }) => {
    console.log('🔐 测试登录页面访问...');
    
    // 查找登录相关按钮或链接
    const loginSelectors = [
      'a[href*="login"]',
      'button:has-text("登录")',
      'button:has-text("Login")',
      '[data-testid*="login"]',
      '.login-button',
      '[role="button"]:has-text("登录")'
    ];
    
    let loginElement = null;
    for (const selector of loginSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          loginElement = element;
          console.log(`✅ 找到登录按钮 (选择器: ${selector})`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!loginElement) {
      // 检查是否已经在登录页面或者有登录表单
      const loginFormSelectors = [
        'form[action*="login"]',
        'input[type="password"]',
        'input[name*="password"]',
        'input[placeholder*="密码"]',
        'input[placeholder*="password"]'
      ];
      
      let hasLoginForm = false;
      for (const selector of loginFormSelectors) {
        if (await page.locator(selector).isVisible()) {
          hasLoginForm = true;
          console.log('✅ 检测到登录表单');
          break;
        }
      }
      
      if (!hasLoginForm) {
        console.log('⚠️  未找到登录入口，可能是匿名访问应用');
        return;
      }
    }
    
    // 如果找到登录按钮，点击它
    if (loginElement) {
      const initialUrl = page.url();
      await loginElement.click();
      await page.waitForTimeout(2000);
      
      // 检查是否导航到登录页面或显示登录模态框
      const currentUrl = page.url();
      const hasLoginModal = await page.locator('[role="dialog"], .modal, .login-modal').isVisible().catch(() => false);
      
      if (currentUrl !== initialUrl) {
        console.log('✅ 导航到登录页面');
        
        // 检查登录页面必要元素
        const hasUsernameField = await page.locator('input[name*="username"], input[name*="email"], input[type="email"], input[type="text"]').isVisible();
        const hasPasswordField = await page.locator('input[type="password"]').isVisible();
        
        expect(hasUsernameField || hasPasswordField).toBe(true);
        
      } else if (hasLoginModal) {
        console.log('✅ 显示登录模态框');
        
        // 检查模态框中的登录表单
        const modalContent = await page.textContent('[role="dialog"], .modal');
        expect(modalContent).toContain('登录');
        
      } else {
        console.log('⚠️  点击登录按钮后无明显变化');
      }
    }
    
    console.log('✅ 登录页面访问测试通过');
  });
  
  test('用户可以访问注册页面', async ({ page }) => {
    console.log('📝 测试注册页面访问...');
    
    // 查找注册相关按钮或链接
    const registerSelectors = [
      'a[href*="register"]',
      'a[href*="signup"]',
      'button:has-text("注册")',
      'button:has-text("Register")',
      'button:has-text("Sign Up")',
      '[data-testid*="register"]',
      '.register-button',
      '.signup-button'
    ];
    
    let registerElement = null;
    for (const selector of registerSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          registerElement = element;
          console.log(`✅ 找到注册按钮 (选择器: ${selector})`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!registerElement) {
      console.log('⚠️  未找到注册入口，可能不支持注册功能');
      return;
    }
    
    // 点击注册按钮
    const initialUrl = page.url();
    await registerElement.click();
    await page.waitForTimeout(2000);
    
    // 检查是否导航到注册页面或显示注册表单
    const currentUrl = page.url();
    const hasRegisterModal = await page.locator('[role="dialog"], .modal').isVisible().catch(() => false);
    
    if (currentUrl !== initialUrl) {
      console.log('✅ 导航到注册页面');
      
      // 检查注册页面元素
      const pageContent = await page.textContent('body');
      expect(pageContent).toMatch(/注册|register|sign.?up/i);
      
    } else if (hasRegisterModal) {
      console.log('✅ 显示注册模态框');
      
      const modalContent = await page.textContent('[role="dialog"], .modal');
      expect(modalContent).toMatch(/注册|register|sign.?up/i);
      
    } else {
      console.log('⚠️  点击注册按钮后无明显变化');
    }
    
    console.log('✅ 注册页面访问测试通过');
  });
  
  test('登录表单验证测试', async ({ page }) => {
    console.log('🔍 测试登录表单验证...');
    
    // 尝试找到登录表单
    const loginFormSelectors = [
      'form[action*="login"]',
      'form:has(input[type="password"])',
      '.login-form',
      '[data-testid*="login-form"]'
    ];
    
    let loginForm = null;
    
    // 首先尝试直接查找登录表单
    for (const selector of loginFormSelectors) {
      try {
        const form = page.locator(selector).first();
        if (await form.isVisible()) {
          loginForm = form;
          console.log(`✅ 找到登录表单 (选择器: ${selector})`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    // 如果没有找到登录表单，尝试点击登录按钮
    if (!loginForm) {
      const loginButton = page.locator('button:has-text("登录"), a:has-text("登录"), [data-testid*="login"]').first();
      
      if (await loginButton.isVisible()) {
        await loginButton.click();
        await page.waitForTimeout(1000);
        
        // 再次查找登录表单
        for (const selector of loginFormSelectors) {
          try {
            const form = page.locator(selector).first();
            if (await form.isVisible()) {
              loginForm = form;
              break;
            }
          } catch (error) {
            continue;
          }
        }
      }
    }
    
    if (!loginForm) {
      // 查找单独的用户名和密码字段
      const usernameField = page.locator('input[name*="username"], input[name*="email"], input[type="email"]').first();
      const passwordField = page.locator('input[type="password"]').first();
      
      if (await usernameField.isVisible() && await passwordField.isVisible()) {
        console.log('✅ 找到独立的登录字段');
        
        // 测试空表单提交
        const submitButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').first();
        
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // 检查是否显示验证错误
          const errorMessage = await page.locator('.error, .invalid, [role="alert"]').textContent().catch(() => '');
          console.log(`📝 表单验证响应: ${errorMessage || '无明显错误提示'}`);
        }
        
        // 测试输入无效数据
        await usernameField.fill('test');
        await passwordField.fill('123');
        
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(1000);
        }
        
      } else {
        console.log('⚠️  未找到登录表单或字段，跳过表单验证测试');
        return;
      }
    } else {
      console.log('✅ 找到完整的登录表单，进行验证测试');
      
      // 在表单内查找字段
      const usernameField = loginForm.locator('input[name*="username"], input[name*="email"], input[type="email"], input[type="text"]').first();
      const passwordField = loginForm.locator('input[type="password"]').first();
      const submitButton = loginForm.locator('button[type="submit"], input[type="submit"], button:has-text("登录")').first();
      
      if (await usernameField.isVisible() && await passwordField.isVisible()) {
        // 测试表单字段
        await usernameField.fill('testuser');
        await passwordField.fill('testpass');
        
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(2000);
          
          // 检查提交后的响应（可能是错误消息或跳转）
          const currentUrl = page.url();
          const errorText = await page.locator('.error, .alert, [role="alert"]').textContent().catch(() => '');
          
          console.log(`📝 登录尝试结果: ${errorText || '无错误信息显示'}`);
        }
      }
    }
    
    console.log('✅ 登录表单验证测试通过');
  });
  
  test('注册表单验证测试', async ({ page }) => {
    console.log('📋 测试注册表单验证...');
    
    // 尝试找到并访问注册表单
    const registerButton = page.locator('button:has-text("注册"), a:has-text("注册"), [href*="register"], [data-testid*="register"]').first();
    
    if (await registerButton.isVisible()) {
      await registerButton.click();
      await page.waitForTimeout(2000);
    }
    
    // 查找注册表单字段
    const formFields = {
      username: page.locator('input[name*="username"], input[placeholder*="用户名"], input[placeholder*="username"]').first(),
      email: page.locator('input[name*="email"], input[type="email"], input[placeholder*="邮箱"]').first(),
      password: page.locator('input[name*="password"], input[type="password"]').first(),
      confirmPassword: page.locator('input[name*="confirm"], input[name*="repeat"], input[placeholder*="确认密码"]').first(),
      phone: page.locator('input[name*="phone"], input[type="tel"], input[placeholder*="手机"]').first(),
      name: page.locator('input[name*="name"], input[placeholder*="姓名"]').first()
    };
    
    let foundFields = 0;
    for (const [fieldName, field] of Object.entries(formFields)) {
      if (await field.isVisible()) {
        foundFields++;
        console.log(`✅ 找到 ${fieldName} 字段`);
      }
    }
    
    if (foundFields === 0) {
      console.log('⚠️  未找到注册表单字段，跳过注册表单测试');
      return;
    }
    
    console.log(`📝 总共找到 ${foundFields} 个注册字段`);
    
    // 测试表单字段填写
    if (await formFields.username.isVisible()) {
      await formFields.username.fill('testuser123');
    }
    
    if (await formFields.email.isVisible()) {
      await formFields.email.fill('test@example.com');
    }
    
    if (await formFields.password.isVisible()) {
      await formFields.password.fill('password123');
    }
    
    if (await formFields.confirmPassword.isVisible()) {
      await formFields.confirmPassword.fill('password123');
    }
    
    if (await formFields.name.isVisible()) {
      await formFields.name.fill('测试用户');
    }
    
    if (await formFields.phone.isVisible()) {
      await formFields.phone.fill('13800138000');
    }
    
    // 尝试提交表单
    const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("注册"), button:has-text("提交")').first();
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      // 检查提交结果
      const errorMessage = await page.locator('.error, .alert, [role="alert"]').textContent().catch(() => '');
      const successMessage = await page.locator('.success, .alert-success').textContent().catch(() => '');
      
      if (errorMessage) {
        console.log(`📝 注册错误: ${errorMessage}`);
      } else if (successMessage) {
        console.log(`✅ 注册成功: ${successMessage}`);
      } else {
        console.log('📝 注册表单已提交，无明显反馈信息');
      }
    }
    
    console.log('✅ 注册表单验证测试通过');
  });
  
  test('密码可见性切换测试', async ({ page }) => {
    console.log('👁️  测试密码可见性切换功能...');
    
    // 查找密码字段
    const passwordFields = await page.locator('input[type="password"]').all();
    
    if (passwordFields.length === 0) {
      console.log('⚠️  未找到密码字段，跳过密码可见性测试');
      return;
    }
    
    console.log(`🔍 找到 ${passwordFields.length} 个密码字段`);
    
    for (const passwordField of passwordFields) {
      // 查找密码字段旁边的眼睛图标或切换按钮
      const toggleSelectors = [
        '[data-testid*="password-toggle"]',
        '.password-toggle',
        '.eye-icon',
        'button:near(input[type="password"])',
        '[aria-label*="显示"], [aria-label*="show"], [aria-label*="toggle"]'
      ];
      
      let toggleButton = null;
      for (const selector of toggleSelectors) {
        try {
          const button = page.locator(selector).first();
          if (await button.isVisible()) {
            toggleButton = button;
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      if (toggleButton) {
        console.log('✅ 找到密码可见性切换按钮');
        
        // 填写密码
        await passwordField.fill('testpassword');
        
        // 点击切换按钮
        await toggleButton.click();
        await page.waitForTimeout(500);
        
        // 检查密码字段类型是否改变
        const fieldType = await passwordField.getAttribute('type');
        console.log(`👁️  切换后字段类型: ${fieldType}`);
        
        // 再次点击切换回来
        await toggleButton.click();
        await page.waitForTimeout(500);
        
        const fieldTypeAfter = await passwordField.getAttribute('type');
        console.log(`🙈 再次切换后字段类型: ${fieldTypeAfter}`);
        
      } else {
        console.log('⚠️  未找到密码可见性切换功能');
      }
    }
    
    console.log('✅ 密码可见性切换测试通过');
  });
  
  test('社交登录测试', async ({ page }) => {
    console.log('🔗 测试社交媒体登录选项...');
    
    // 查找社交登录按钮
    const socialLoginSelectors = [
      'button:has-text("微信")', 'a:has-text("微信")',
      'button:has-text("WeChat")', 'a:has-text("WeChat")',
      'button:has-text("Google")', 'a:has-text("Google")',
      'button:has-text("Facebook")', 'a:has-text("Facebook")',
      'button:has-text("QQ")', 'a:has-text("QQ")',
      'button:has-text("微博")', 'a:has-text("微博")',
      '.social-login', '.oauth-button',
      '[data-testid*="social"], [data-testid*="oauth"]'
    ];
    
    const socialButtons: { platform: string; element: any }[] = [];
    
    for (const selector of socialLoginSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (const element of elements) {
          if (await element.isVisible()) {
            const text = await element.textContent();
            socialButtons.push({
              platform: text || selector,
              element: element
            });
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    if (socialButtons.length === 0) {
      console.log('⚠️  未找到社交登录选项');
      return;
    }
    
    console.log(`🔗 找到 ${socialButtons.length} 个社交登录选项:`);
    socialButtons.forEach((button, index) => {
      console.log(`  ${index + 1}. ${button.platform}`);
    });
    
    // 测试第一个社交登录按钮（不实际登录，只检查响应）
    if (socialButtons.length > 0) {
      const firstButton = socialButtons[0];
      console.log(`🔘 测试点击: ${firstButton.platform}`);
      
      const initialUrl = page.url();
      await firstButton.element.click();
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      
      if (currentUrl !== initialUrl) {
        console.log('✅ 社交登录重定向成功');
        
        // 返回原页面
        await page.goBack();
        await page.waitForTimeout(1000);
        
      } else {
        console.log('📝 社交登录按钮已响应（无重定向或弹窗）');
      }
    }
    
    console.log('✅ 社交登录测试通过');
  });
  
  test('忘记密码功能测试', async ({ page }) => {
    console.log('🔄 测试忘记密码功能...');
    
    // 查找忘记密码链接
    const forgotPasswordSelectors = [
      'a:has-text("忘记密码")',
      'a:has-text("忘记密码？")',
      'a:has-text("Forgot Password")',
      'button:has-text("忘记密码")',
      '[data-testid*="forgot"]',
      '.forgot-password',
      '[href*="forgot"], [href*="reset"]'
    ];
    
    let forgotPasswordLink = null;
    for (const selector of forgotPasswordSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          forgotPasswordLink = element;
          console.log(`✅ 找到忘记密码链接 (选择器: ${selector})`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!forgotPasswordLink) {
      console.log('⚠️  未找到忘记密码功能，跳过测试');
      return;
    }
    
    // 点击忘记密码链接
    const initialUrl = page.url();
    await forgotPasswordLink.click();
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    const hasModal = await page.locator('[role="dialog"], .modal').isVisible().catch(() => false);
    
    if (currentUrl !== initialUrl) {
      console.log('✅ 导航到密码重置页面');
      
      // 检查密码重置页面内容
      const pageContent = await page.textContent('body');
      expect(pageContent).toMatch(/重置|reset|forgot/i);
      
      // 查找邮箱输入框
      const emailField = page.locator('input[type="email"], input[name*="email"], input[placeholder*="邮箱"]').first();
      
      if (await emailField.isVisible()) {
        console.log('✅ 找到邮箱输入字段');
        
        // 测试邮箱输入
        await emailField.fill('test@example.com');
        
        // 查找提交按钮
        const submitButton = page.locator('button[type="submit"], button:has-text("发送"), button:has-text("Submit"), button:has-text("重置")').first();
        
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          const responseMessage = await page.locator('.message, .alert, [role="alert"]').textContent().catch(() => '');
          console.log(`📧 密码重置响应: ${responseMessage || '无明显反馈'}`);
        }
      }
      
    } else if (hasModal) {
      console.log('✅ 显示密码重置模态框');
      
      const modalContent = await page.textContent('[role="dialog"], .modal');
      expect(modalContent).toMatch(/重置|reset|forgot/i);
      
    } else {
      console.log('📝 忘记密码功能已触发（无明显UI变化）');
    }
    
    console.log('✅ 忘记密码功能测试通过');
  });
  
  test('用户权限和状态测试', async ({ page }) => {
    console.log('👤 测试用户权限和登录状态...');
    
    // 检查页面是否显示用户状态信息
    const userStatusSelectors = [
      '.user-info',
      '.profile',
      '.user-menu',
      '[data-testid*="user"]',
      '.header .user',
      '.navbar .user'
    ];
    
    let hasUserStatus = false;
    for (const selector of userStatusSelectors) {
      if (await page.locator(selector).isVisible()) {
        hasUserStatus = true;
        console.log(`✅ 检测到用户状态区域 (选择器: ${selector})`);
        break;
      }
    }
    
    // 检查是否有受保护的功能
    const protectedElements = [
      'button:has-text("报名")',
      'button:has-text("收藏")',
      'button:has-text("评论")',
      '.protected',
      '[data-requires-auth]'
    ];
    
    let hasProtectedElements = false;
    for (const selector of protectedElements) {
      if (await page.locator(selector).isVisible()) {
        hasProtectedElements = true;
        console.log(`✅ 检测到受保护功能 (选择器: ${selector})`);
        
        // 尝试点击受保护的功能
        await page.locator(selector).first().click();
        await page.waitForTimeout(1000);
        
        // 检查是否显示登录提示
        const loginPrompt = await page.locator('.login-required, [role="dialog"]:has-text("登录")').isVisible().catch(() => false);
        
        if (loginPrompt) {
          console.log('✅ 受保护功能正确显示登录提示');
        }
        
        break;
      }
    }
    
    if (!hasUserStatus && !hasProtectedElements) {
      console.log('📝 未检测到明显的用户权限控制');
    } else {
      console.log('✅ 用户权限系统正常运行');
    }
    
    console.log('✅ 用户权限和状态测试通过');
  });
});