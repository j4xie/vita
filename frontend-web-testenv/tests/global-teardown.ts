import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Playwright 全局清理
 * 在所有测试运行结束后执行的清理操作
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 开始 PomeloX 网页端监控清理...');
  
  const sessionEnd = new Date().toISOString();
  const sessionStart = process.env.PLAYWRIGHT_MONITORING_SESSION;
  const logFile = process.env.PLAYWRIGHT_LOG_FILE;
  
  // 完成监控日志
  if (logFile && fs.existsSync(logFile)) {
    fs.appendFileSync(logFile, `=== PomeloX 监控会话结束 ${sessionEnd} ===\n`);
    
    if (sessionStart) {
      const duration = Date.parse(sessionEnd) - Date.parse(sessionStart);
      fs.appendFileSync(logFile, `监控持续时间: ${Math.round(duration / 1000)}秒\n`);
    }
    
    console.log(`📋 监控日志已保存: ${logFile}`);
  }
  
  // 生成监控摘要报告
  const summaryFile = path.join(process.cwd(), 'monitoring-logs', 'summary.json');
  const summary = {
    sessionStart,
    sessionEnd,
    duration: sessionStart ? Date.parse(sessionEnd) - Date.parse(sessionStart) : 0,
    testsRun: true,
    timestamp: sessionEnd,
  };
  
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  console.log(`📊 监控摘要已生成: ${summaryFile}`);
  
  // 清理临时文件（可选）
  const tempDir = path.join(process.cwd(), 'temp');
  if (fs.existsSync(tempDir)) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('🗑️  临时文件已清理');
    } catch (error) {
      console.warn('⚠️  临时文件清理失败:', error.message);
    }
  }
  
  console.log('✅ 全局清理完成');
}

export default globalTeardown;