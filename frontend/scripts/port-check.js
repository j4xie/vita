#!/usr/bin/env node
/**
 * 端口检查和清理工具
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const EXPO_PORTS = [8081, 8082, 8083, 8084, 8085, 19000, 19001, 19002];

async function checkPort(port) {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port}`);
    const pids = stdout.trim().split('\n').filter(pid => pid);
    return pids.length > 0 ? pids : null;
  } catch (error) {
    return null; // 端口未被使用
  }
}

async function killPort(port) {
  try {
    const pids = await checkPort(port);
    if (pids) {
      for (const pid of pids) {
        await execAsync(`kill -9 ${pid}`);
        console.log(`${COLORS.yellow}  └─ 已终止进程 ${pid}${COLORS.reset}`);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.log(`${COLORS.red}  └─ 清理端口 ${port} 失败: ${error.message}${COLORS.reset}`);
    return false;
  }
}

async function checkAllPorts() {
  console.log(`${COLORS.blue}📊 检查开发服务器端口使用情况...${COLORS.reset}`);
  console.log(''.padEnd(50, '='));
  
  const occupiedPorts = [];
  
  for (const port of EXPO_PORTS) {
    const pids = await checkPort(port);
    if (pids) {
      console.log(`${COLORS.red}❌ 端口 ${port}: 被占用 (PID: ${pids.join(', ')})${COLORS.reset}`);
      occupiedPorts.push(port);
    } else {
      console.log(`${COLORS.green}✅ 端口 ${port}: 可用${COLORS.reset}`);
    }
  }
  
  return occupiedPorts;
}

async function cleanupPorts(ports = EXPO_PORTS) {
  console.log(`${COLORS.yellow}🧹 清理端口进程...${COLORS.reset}`);
  
  let cleaned = 0;
  for (const port of ports) {
    const pids = await checkPort(port);
    if (pids) {
      console.log(`${COLORS.yellow}清理端口 ${port}...${COLORS.reset}`);
      const success = await killPort(port);
      if (success) cleaned++;
    }
  }
  
  // 额外清理 Expo 和 Metro 相关进程
  try {
    console.log(`${COLORS.yellow}清理 Expo 和 Metro 进程...${COLORS.reset}`);
    await execAsync(`pkill -f "expo start" || true`);
    await execAsync(`pkill -f "metro" || true`);
    await execAsync(`pkill -f "node.*expo" || true`);
  } catch (error) {
    // 忽略错误，继续执行
  }
  
  console.log(`${COLORS.green}✅ 清理完成，共处理 ${cleaned} 个端口${COLORS.reset}`);
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'check':
      await checkAllPorts();
      break;
      
    case 'clean':
    case 'cleanup':
      await cleanupPorts();
      break;
      
    case 'restart':
      await cleanupPorts();
      console.log(`${COLORS.blue}等待 2 秒后重启...${COLORS.reset}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`${COLORS.green}可以启动新的开发服务器了！${COLORS.reset}`);
      break;
      
    default:
      console.log(`${COLORS.blue}端口管理工具使用说明:${COLORS.reset}`);
      console.log('  node scripts/port-check.js check   - 检查端口占用');
      console.log('  node scripts/port-check.js clean   - 清理所有占用的端口');
      console.log('  node scripts/port-check.js restart - 清理并准备重启');
      console.log('');
      await checkAllPorts();
      break;
  }
}

// 处理 Ctrl+C 退出
process.on('SIGINT', () => {
  console.log(`\n${COLORS.yellow}工具已退出${COLORS.reset}`);
  process.exit(0);
});

main().catch(error => {
  console.error(`${COLORS.red}错误: ${error.message}${COLORS.reset}`);
  process.exit(1);
});