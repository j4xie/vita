const BrowserTools = require('./browser-tools.js');

async function diagnoseFormInputs() {
  const tools = new BrowserTools();
  
  try {
    console.log('🔍 诊断表单输入不可用问题...');
    await tools.init();
    
    await tools.navigate('http://localhost:8090');
    
    // 等待页面加载
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('📝 查找注册和报名入口...');
    
    // 查找注册/报名相关的按钮或链接
    const formsInfo = await tools.executeScript(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      
      // 查找可能的表单入口
      const formEntries = [];
      
      elements.forEach(el => {
        const text = (el.textContent || '').trim();
        const isClickable = el.tagName === 'BUTTON' || el.role === 'button' || 
                           el.onclick || el.style.cursor === 'pointer' ||
                           el.tagName === 'A' || el.className.includes('touch') ||
                           el.className.includes('pressable');
        
        if (isClickable && (
          text.includes('注册') || text.includes('Register') ||
          text.includes('报名') || text.includes('Sign up') ||
          text.includes('登录') || text.includes('Login') ||
          text.includes('填写') || text.includes('Form')
        )) {
          const rect = el.getBoundingClientRect();
          formEntries.push({
            text: text.substring(0, 50),
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            rect: { width: rect.width, height: rect.height, visible: rect.width > 0 && rect.height > 0 },
            href: el.href || null
          });
        }
      });
      
      // 查找现有的表单输入框
      const inputs = Array.from(document.querySelectorAll('input, textarea, select')).map(input => {
        const rect = input.getBoundingClientRect();
        const computedStyle = getComputedStyle(input);
        
        return {
          tagName: input.tagName,
          type: input.type || 'text',
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          disabled: input.disabled,
          readOnly: input.readOnly,
          value: input.value,
          className: input.className,
          
          rect: {
            width: rect.width,
            height: rect.height,
            x: rect.x,
            y: rect.y,
            visible: rect.width > 0 && rect.height > 0
          },
          
          style: {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            pointerEvents: computedStyle.pointerEvents,
            zIndex: computedStyle.zIndex
          },
          
          // 事件监听器检查
          hasEventListeners: {
            onclick: !!input.onclick,
            onchange: !!input.onchange,
            oninput: !!input.oninput,
            onfocus: !!input.onfocus,
            onblur: !!input.onblur
          }
        };
      });
      
      return {
        formEntries,
        existingInputs: inputs,
        pageTitle: document.title,
        url: window.location.href
      };
    });
    
    console.log('📊 表单诊断结果:');
    console.log('找到的表单入口:', formsInfo.formEntries.length);
    formsInfo.formEntries.forEach((entry, index) => {
      console.log(`  ${index + 1}. [${entry.tagName}] "${entry.text}" (${entry.className})`);
    });
    
    console.log('\n现有输入框:', formsInfo.existingInputs.length);
    formsInfo.existingInputs.forEach((input, index) => {
      console.log(`  ${index + 1}. [${input.tagName}] type=${input.type}, disabled=${input.disabled}, visible=${input.rect.visible}`);
      console.log(`     pointerEvents=${input.style.pointerEvents}, opacity=${input.style.opacity}`);
    });
    
    // 尝试进入注册页面
    if (formsInfo.formEntries.length > 0) {
      console.log('\n🎯 尝试进入第一个表单页面...');
      
      const clickResult = await tools.executeScript((entryIndex) => {
        const elements = Array.from(document.querySelectorAll('*'));
        const formEntries = [];
        
        elements.forEach(el => {
          const text = (el.textContent || '').trim();
          const isClickable = el.tagName === 'BUTTON' || el.role === 'button' || 
                             el.onclick || el.style.cursor === 'pointer' ||
                             el.tagName === 'A' || el.className.includes('touch');
          
          if (isClickable && (
            text.includes('注册') || text.includes('Register') ||
            text.includes('报名') || text.includes('Sign up') ||
            text.includes('登录') || text.includes('Login')
          )) {
            formEntries.push(el);
          }
        });
        
        if (formEntries.length > entryIndex) {
          try {
            formEntries[entryIndex].click();
            console.log('✅ 点击了表单入口:', formEntries[entryIndex].textContent);
            return { success: true, clicked: formEntries[entryIndex].textContent };
          } catch (e) {
            console.log('❌ 点击失败:', e.message);
            return { success: false, error: e.message };
          }
        }
        
        return { success: false, error: '没有找到表单入口' };
      }, 0);
      
      console.log('点击结果:', JSON.stringify(clickResult, null, 2));
      
      // 等待页面跳转
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 检查是否成功进入表单页面
      console.log('\n📋 检查表单页面输入框状态...');
      
      const inputsStatus = await tools.executeScript(() => {
        const inputs = document.querySelectorAll('input, textarea');
        
        const inputDetails = Array.from(inputs).map((input, index) => {
          const rect = input.getBoundingClientRect();
          const style = getComputedStyle(input);
          
          return {
            index,
            tagName: input.tagName,
            type: input.type,
            name: input.name,
            id: input.id,
            placeholder: input.placeholder,
            disabled: input.disabled,
            readOnly: input.readOnly,
            value: input.value,
            
            // 关键状态检查
            canFocus: {
              tabIndex: input.tabIndex,
              pointerEvents: style.pointerEvents,
              display: style.display,
              visibility: style.visibility,
              opacity: style.opacity
            },
            
            rect: {
              width: rect.width,
              height: rect.height,
              visible: rect.width > 0 && rect.height > 0
            },
            
            // 尝试测试焦点
            focusTest: (() => {
              try {
                const originalValue = input.value;
                input.focus();
                const canReceiveFocus = document.activeElement === input;
                input.blur();
                return { canFocus: canReceiveFocus, activeElement: document.activeElement?.tagName };
              } catch (e) {
                return { canFocus: false, error: e.message };
              }
            })()
          };
        });
        
        return {
          pageTitle: document.title,
          inputCount: inputs.length,
          inputs: inputDetails,
          activeElement: document.activeElement?.tagName || 'none'
        };
      });
      
      console.log('📊 表单输入框详细状态:');
      console.log(JSON.stringify(inputsStatus, null, 2));
      
      // 如果找到了输入框，测试输入功能
      if (inputsStatus.inputCount > 0) {
        console.log('\n🧪 测试输入框功能...');
        
        const inputTest = await tools.executeScript(() => {
          const inputs = document.querySelectorAll('input, textarea');
          const testResults = [];
          
          inputs.forEach((input, index) => {
            try {
              console.log(`🧪 测试输入框[${index}]: ${input.type || input.tagName}`);
              
              // 测试1: 聚焦
              input.focus();
              const canFocus = document.activeElement === input;
              
              // 测试2: 输入
              const originalValue = input.value;
              input.value = 'test123';
              const canSetValue = input.value === 'test123';
              
              // 测试3: 事件触发
              const inputEvent = new Event('input', { bubbles: true });
              const changeEvent = new Event('change', { bubbles: true });
              input.dispatchEvent(inputEvent);
              input.dispatchEvent(changeEvent);
              
              // 恢复原值
              input.value = originalValue;
              
              testResults.push({
                index,
                canFocus,
                canSetValue,
                tagName: input.tagName,
                type: input.type,
                disabled: input.disabled,
                readOnly: input.readOnly
              });
              
              input.blur();
              
            } catch (error) {
              testResults.push({
                index,
                error: error.message,
                tagName: input.tagName
              });
            }
          });
          
          return testResults;
        });
        
        console.log('🧪 输入框功能测试结果:');
        inputTest.forEach(result => {
          if (result.error) {
            console.log(`❌ 输入框[${result.index}] 错误: ${result.error}`);
          } else {
            console.log(`📝 输入框[${result.index}] [${result.tagName}]:`, 
                       `焦点=${result.canFocus}, 设值=${result.canSetValue}, 禁用=${result.disabled}`);
          }
        });
      }
      
    } else {
      console.log('❌ 没有找到表单入口按钮');
    }
    
    // 截图当前状态
    await tools.screenshot('form-inputs-diagnosis.png');
    
    console.log('\n⏰ 保持浏览器开启供手动测试...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ 表单诊断失败:', error);
  } finally {
    await tools.close();
    console.log('✅ 表单诊断完成');
  }
}

diagnoseFormInputs();