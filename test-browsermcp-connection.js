#!/usr/bin/env node

// 测试Browser MCP连接的简单脚本
console.log('🔗 测试Browser MCP连接状态...\n');

// 检查环境
console.log('📋 环境检查:');
console.log('- Node.js版本:', process.version);
console.log('- 工作目录:', process.cwd());

// 尝试连接Browser MCP
console.log('\n🚀 启动Browser MCP服务器...');

const { spawn } = require('child_process');

const mcpProcess = spawn('npx', ['@browsermcp/mcp@latest'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

mcpProcess.on('error', (error) => {
  console.error('❌ Browser MCP启动失败:', error);
});

mcpProcess.on('close', (code) => {
  console.log(`\n✅ Browser MCP进程退出，代码: ${code}`);
});

// 监听进程信号
process.on('SIGINT', () => {
  console.log('\n🛑 收到中断信号，关闭Browser MCP...');
  mcpProcess.kill();
  process.exit(0);
});

console.log('\n💡 提示: 按 Ctrl+C 停止服务器');
console.log('🔄 请重启Cursor以加载新的MCP配置');