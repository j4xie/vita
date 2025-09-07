#!/usr/bin/env node

/**
 * PomeloX 实时 Console 监控器
 * 使用 Chrome DevTools Protocol 直接连接到浏览器实例
 * 实时捕获网页端的 console 输出、错误和网络请求
 */

const CDP = require('chrome-remote-interface');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class PomeloXConsoleMonitor {
  constructor(options = {}) {
    this.options = {
      url: options.url || 'http://localhost:8081',
      port: options.port || 9222,
      enableConsole: options.enableConsole !== false,
      enableNetwork: options.enableNetwork !== false,
      enableErrors: options.enableErrors !== false,
      enablePerformance: options.enablePerformance || false,
      logFile: options.logFile,
      autoLaunch: options.autoLaunch !== false,
      ...options
    };
    
    this.client = null;
    this.chromeProcess = null;
    this.isConnected = false;
    this.logs = [];
    
    // 颜色输出
    this.colors = {
      reset: '\x1b[0m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      gray: '\x1b[90m'
    };
  }

  /**
   * 启动 Chrome 浏览器实例
   */
  async launchChrome() {
    if (!this.options.autoLaunch) {
      console.log('📌 请手动启动 Chrome 并开启远程调试:');
      console.log(`   "/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome" --remote-debugging-port=${this.options.port} --user-data-dir=/tmp/chrome-debug`);
      return;
    }

    console.log('🚀 启动 Chrome 浏览器...');
    
    const chromeArgs = [
      '--remote-debugging-port=' + this.options.port,
      '--user-data-dir=/tmp/chrome-debug-' + Date.now(),
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-ipc-flooding-protection',
      this.options.url
    ];

    this.chromeProcess = spawn('/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome', chromeArgs, {
      stdio: 'ignore',
      detached: false
    });

    this.chromeProcess.on('error', (error) => {
      console.error('❌ Chrome 启动失败:', error.message);
    });

    // 等待 Chrome 启动
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ Chrome 已启动');
  }

  /**
   * 连接到 Chrome DevTools
   */
  async connect() {
    try {
      console.log('🔌 连接到 Chrome DevTools...');
      
      this.client = await CDP({ port: this.options.port });
      const { Network, Page, Runtime, Console, Log } = this.client;

      // 启用所需的域
      if (this.options.enableNetwork) {
        await Network.enable();
        console.log('✅ 网络监控已启用');
      }
      
      if (this.options.enableConsole) {
        await Runtime.enable();
        await Console.enable();
        await Log.enable();
        console.log('✅ 控制台监控已启用');
      }

      await Page.enable();
      
      this.isConnected = true;
      console.log('🎯 连接成功，开始监控...\n');

      // 设置事件监听器
      this.setupEventListeners();

      // 导航到目标页面（如果需要）
      if (this.options.url && !this.options.autoLaunch) {
        await Page.navigate({ url: this.options.url });
        console.log(`🌐 导航到: ${this.options.url}`);
      }

    } catch (error) {
      console.error('❌ 连接失败:', error.message);
      console.log('💡 请确保 Chrome 已启动并开启了远程调试');
      throw error;
    }
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    if (!this.client) return;

    const { Network, Runtime, Console, Log, Page } = this.client;

    // 控制台消息监听
    if (this.options.enableConsole) {
      Console.messageAdded((params) => {
        this.handleConsoleMessage(params.message);
      });

      Runtime.consoleAPICalled((params) => {
        this.handleConsoleAPI(params);
      });

      Runtime.exceptionThrown((params) => {
        this.handleException(params);
      });

      Log.entryAdded((params) => {
        this.handleLogEntry(params.entry);
      });
    }

    // 网络请求监听
    if (this.options.enableNetwork) {
      Network.requestWillBeSent((params) => {
        this.handleNetworkRequest(params);
      });

      Network.responseReceived((params) => {
        this.handleNetworkResponse(params);
      });

      Network.loadingFailed((params) => {
        this.handleNetworkError(params);
      });
    }

    // 页面事件监听
    Page.loadEventFired(() => {
      this.log('info', '🚀 页面加载完成');
    });

    Page.domContentEventFired(() => {
      this.log('info', '📄 DOM 内容加载完成');
    });

    // JavaScript 错误监听
    Runtime.exceptionThrown((params) => {
      const exception = params.exceptionDetails;
      this.log('error', `💥 JavaScript 错误: ${exception.text}`);
      if (exception.stackTrace) {
        exception.stackTrace.callFrames.forEach((frame, index) => {
          if (index < 3) { // 只显示前3层堆栈
            this.log('error', `    at ${frame.functionName || '<anonymous>'} (${frame.url}:${frame.lineNumber}:${frame.columnNumber})`);
          }
        });
      }
    });
  }

  /**
   * 处理控制台消息
   */
  handleConsoleMessage(message) {
    const level = message.level;
    const text = message.text;
    const source = message.source;
    
    this.log(level, `💬 [${source}] ${text}`);
  }

  /**
   * 处理控制台API调用
   */
  handleConsoleAPI(params) {
    const { type, args, timestamp } = params;
    
    // 解析参数
    let message = '';
    if (args && args.length > 0) {
      const values = args.map(arg => {
        if (arg.value !== undefined) {
          return arg.value;
        } else if (arg.description) {
          return arg.description;
        } else {
          return '[Object]';
        }
      });
      message = values.join(' ');
    }
    
    this.log(type, `🖥️  console.${type}(${message})`);
  }

  /**
   * 处理异常
   */
  handleException(params) {
    const { exceptionDetails } = params;
    const { text, lineNumber, columnNumber, url } = exceptionDetails;
    
    this.log('error', `🚨 异常: ${text}`);
    if (url) {
      this.log('error', `   位置: ${url}:${lineNumber}:${columnNumber}`);
    }
  }

  /**
   * 处理日志条目
   */
  handleLogEntry(entry) {
    const { level, text, source } = entry;
    this.log(level, `📋 [${source}] ${text}`);
  }

  /**
   * 处理网络请求
   */
  handleNetworkRequest(params) {
    const { request } = params;
    const { method, url } = request;
    
    // 只显示 API 请求
    if (url.includes('vitaglobal.icu') || url.includes('/api/')) {
      this.log('info', `🌐 ${method} ${url}`);
    }
  }

  /**
   * 处理网络响应
   */
  handleNetworkResponse(params) {
    const { response } = params;
    const { status, url, mimeType } = response;
    
    if (url.includes('vitaglobal.icu') || url.includes('/api/')) {
      const statusColor = status >= 400 ? 'red' : status >= 300 ? 'yellow' : 'green';
      this.log('info', `📨 ${status} ${url}`, statusColor);
      
      if (status >= 400) {
        this.log('error', `❌ API 错误: ${status} ${url}`);
      }
    }
  }

  /**
   * 处理网络错误
   */
  handleNetworkError(params) {
    const { errorText, request } = params;
    this.log('error', `🚫 网络错误: ${errorText} - ${request.url}`);
  }

  /**
   * 统一日志输出
   */
  log(level, message, forceColor = null) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      timestamp,
      level,
      message
    };
    
    this.logs.push(logEntry);
    
    // 控制台输出with 颜色
    let color = forceColor ? this.colors[forceColor] : this.colors.white;
    switch (level) {
      case 'error':
        color = this.colors.red;
        break;
      case 'warn':
      case 'warning':
        color = this.colors.yellow;
        break;
      case 'info':
        color = this.colors.cyan;
        break;
      case 'log':
        color = this.colors.green;
        break;
      case 'debug':
        color = this.colors.gray;
        break;
    }
    
    console.log(`${this.colors.gray}[${timestamp}]${this.colors.reset} ${color}${message}${this.colors.reset}`);
    
    // 写入日志文件
    if (this.options.logFile) {
      this.writeToLogFile(logEntry);
    }
  }

  /**
   * 写入日志文件
   */
  writeToLogFile(logEntry) {
    const logLine = `[${logEntry.timestamp}] ${logEntry.level.toUpperCase()}: ${logEntry.message}\n`;
    
    try {
      fs.appendFileSync(this.options.logFile, logLine);
    } catch (error) {
      // 忽略文件写入错误
    }
  }

  /**
   * 执行JavaScript代码
   */
  async evaluate(expression) {
    if (!this.client || !this.isConnected) {
      throw new Error('未连接到浏览器');
    }

    try {
      const result = await this.client.Runtime.evaluate({
        expression,
        returnByValue: true
      });
      
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.text);
      }
      
      return result.result.value;
    } catch (error) {
      this.log('error', `代码执行错误: ${error.message}`);
      throw error;
    }
  }

  /**
   * 注入监控脚本到页面
   */
  async injectMonitoringScript() {
    const script = `
      // PomeloX 页面监控脚本
      (function() {
        console.log('🎭 PomeloX 监控脚本已注入');
        
        // 监控未捕获的错误
        window.addEventListener('error', function(e) {
          console.error('🚨 页面错误:', e.message, 'at', e.filename + ':' + e.lineno);
        });
        
        // 监控未处理的Promise错误
        window.addEventListener('unhandledrejection', function(e) {
          console.error('🚨 未处理的Promise错误:', e.reason);
        });
        
        // 监控Ajax请求 (如果使用jQuery)
        if (window.jQuery) {
          $(document).ajaxError(function(event, xhr, settings, thrownError) {
            console.error('🚨 Ajax错误:', xhr.status, settings.url, thrownError);
          });
        }
        
        // 监控fetch请求
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          console.log('🌐 Fetch请求:', args[0]);
          return originalFetch.apply(this, args).then(response => {
            if (!response.ok) {
              console.error('🚨 Fetch错误:', response.status, response.url);
            }
            return response;
          }).catch(error => {
            console.error('🚨 Fetch异常:', error.message);
            throw error;
          });
        };
        
        // 定期发送心跳
        setInterval(() => {
          console.log('💓 PomeloX 监控心跳 -', new Date().toLocaleTimeString());
        }, 30000);
      })();
    `;

    await this.evaluate(script);
    this.log('info', '✅ 监控脚本已注入到页面');
  }

  /**
   * 获取页面信息
   */
  async getPageInfo() {
    try {
      const title = await this.evaluate('document.title');
      const url = await this.evaluate('window.location.href');
      const userAgent = await this.evaluate('navigator.userAgent');
      
      this.log('info', `📄 页面标题: ${title}`);
      this.log('info', `🌐 页面URL: ${url}`);
      this.log('info', `🖥️  用户代理: ${userAgent}`);
      
      return { title, url, userAgent };
    } catch (error) {
      this.log('error', `获取页面信息失败: ${error.message}`);
    }
  }

  /**
   * 开始监控
   */
  async start() {
    try {
      console.log('🎭 PomeloX Console 监控器启动中...\n');
      
      if (this.options.autoLaunch) {
        await this.launchChrome();
      }
      
      await this.connect();
      await this.getPageInfo();
      await this.injectMonitoringScript();
      
      console.log('\n✅ 监控已启动，实时显示 console 数据...');
      console.log('💡 按 Ctrl+C 停止监控\n');
      
      // 保持程序运行
      process.on('SIGINT', () => {
        this.stop();
      });
      
    } catch (error) {
      console.error('❌ 启动失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 停止监控
   */
  async stop() {
    console.log('\n🛑 正在停止监控...');
    
    if (this.client) {
      try {
        await this.client.close();
      } catch (error) {
        // 忽略关闭错误
      }
    }
    
    if (this.chromeProcess) {
      this.chromeProcess.kill();
    }
    
    console.log('📊 监控统计:');
    console.log(`   总日志条数: ${this.logs.length}`);
    console.log(`   错误数: ${this.logs.filter(log => log.level === 'error').length}`);
    console.log(`   警告数: ${this.logs.filter(log => log.level === 'warn' || log.level === 'warning').length}`);
    
    if (this.options.logFile) {
      console.log(`📝 日志已保存到: ${this.options.logFile}`);
    }
    
    console.log('👋 监控已停止');
    process.exit(0);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  // 解析命令行参数
  const args = process.argv.slice(2);
  let url = 'http://localhost:8081';
  let port = 9222;
  let autoLaunch = true;
  
  args.forEach(arg => {
    if (arg.startsWith('http')) {
      url = arg;
    } else if (arg.startsWith('--port=')) {
      port = parseInt(arg.split('=')[1]);
    } else if (arg === '--no-auto-launch') {
      autoLaunch = false;
    }
  });
  
  console.log('🎯 配置参数:');
  console.log(`   URL: ${url}`);
  console.log(`   端口: ${port}`);
  console.log(`   自动启动: ${autoLaunch ? '是' : '否'}`);
  console.log('');
  
  const monitor = new PomeloXConsoleMonitor({
    url: url,
    port: port,
    logFile: 'pomelox-console.log',
    autoLaunch: autoLaunch
  });
  
  monitor.start();
}

module.exports = PomeloXConsoleMonitor;