/**
 * 🕐 时区修复验证测试
 *
 * 测试目的：验证签到签退时间格式的一致性
 * 修复问题：解决时区混淆导致的时间存储不一致
 */

import { formatVolunteerTime, getCurrentLocalTimestamp, validateAndFormatTime } from '../screens/wellbeing/utils/timeFormatter';

export const testTimezoneConsistency = () => {
  console.log('🧪 [TIMEZONE-TEST] 开始时区一致性测试...');

  // 测试1：验证格式化时间的一致性
  const testDate = new Date('2025-09-19T19:36:27.000Z');
  const formattedTime = formatVolunteerTime(testDate);
  console.log('📅 [TEST-1] 时间格式化测试:', {
    originalUTC: testDate.toISOString(),
    formatted: formattedTime,
    localTime: testDate.toLocaleString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  // 测试2：验证当前时间格式
  const currentFormatted = formatVolunteerTime();
  const currentTimestamp = getCurrentLocalTimestamp();
  console.log('📅 [TEST-2] 当前时间格式测试:', {
    formatted: currentFormatted,
    timestamp: currentTimestamp,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  // 测试3：验证时间验证函数
  try {
    const validatedTime = validateAndFormatTime('2025-09-19 19:36:27');
    console.log('📅 [TEST-3] 时间验证测试成功:', validatedTime);
  } catch (error) {
    console.error('❌ [TEST-3] 时间验证测试失败:', error);
  }

  // 测试4：对比新旧格式
  const oldFormat = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const newFormat = formatVolunteerTime();

  console.log('📊 [TEST-4] 格式对比:', {
    oldFormat: oldFormat,
    newFormat: newFormat,
    formatMatches: oldFormat === newFormat,
    message: oldFormat === newFormat ? '✅ 格式匹配' : '❌ 格式不匹配'
  });

  console.log('✅ [TIMEZONE-TEST] 时区一致性测试完成');
};

export const simulateCheckinCheckout = () => {
  console.log('🧪 [CHECKIN-CHECKOUT-TEST] 模拟签到签退流程...');

  // 模拟签到时间
  const checkinTime = formatVolunteerTime();
  console.log('📥 [CHECKIN] 签到时间:', checkinTime);

  // 模拟工作2小时后签退
  const checkoutDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const checkoutTime = formatVolunteerTime(checkoutDate);
  console.log('📤 [CHECKOUT] 签退时间:', checkoutTime);

  // 计算工作时长
  const startMs = new Date(checkinTime).getTime();
  const endMs = new Date(checkoutTime).getTime();
  const durationHours = (endMs - startMs) / (1000 * 60 * 60);

  console.log('⏱️ [DURATION] 工作时长:', {
    checkinTime,
    checkoutTime,
    durationHours: durationHours.toFixed(2) + ' 小时',
    expectedDuration: '2.00 小时',
    calculationCorrect: Math.abs(durationHours - 2) < 0.1 ? '✅ 正确' : '❌ 错误'
  });

  console.log('✅ [CHECKIN-CHECKOUT-TEST] 签到签退测试完成');
};

// 导出主测试函数
export const runTimezoneTests = () => {
  console.log('🚀 [TIMEZONE-FIX] 开始全面时区修复测试...');
  testTimezoneConsistency();
  console.log('---');
  simulateCheckinCheckout();
  console.log('🎉 [TIMEZONE-FIX] 全部测试完成');
};