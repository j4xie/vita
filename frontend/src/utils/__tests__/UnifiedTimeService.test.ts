/**
 * UnifiedTimeService 单元测试
 *
 * 测试覆盖：
 * 1. 解析后端时间
 * 2. 格式化为API格式
 * 3. 前端显示格式化
 * 4. 时长计算
 * 5. 边界情况和异常处理
 */

import { UnifiedTimeService } from '../UnifiedTimeService';

describe('UnifiedTimeService', () => {
  let service: UnifiedTimeService;

  beforeEach(() => {
    service = new UnifiedTimeService();
    // Mock 当前时间为 2025-01-25 14:30:00 (北京时间)
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-25T06:30:00Z')); // UTC时间
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('parseServerTime', () => {
    it('应该正确解析标准格式的后端时间', () => {
      const serverTime = '2025-01-25 14:30:00';
      const result = service.parseServerTime(serverTime);

      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('2025-01-25T06:30:00.000Z');
    });

    it('应该处理空值输入', () => {
      expect(service.parseServerTime(null)).toBeNull();
      expect(service.parseServerTime(undefined)).toBeNull();
      expect(service.parseServerTime('')).toBeNull();
    });

    it('应该处理无效格式', () => {
      const invalidTime = 'invalid-time';
      const result = service.parseServerTime(invalidTime);
      expect(result).toBeNull();
    });

    it('应该正确解析不同时间', () => {
      const testCases = [
        { input: '2025-01-01 00:00:00', expected: '2024-12-31T16:00:00.000Z' },
        { input: '2025-12-31 23:59:59', expected: '2025-12-31T15:59:59.000Z' },
        { input: '2025-06-15 12:00:00', expected: '2025-06-15T04:00:00.000Z' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = service.parseServerTime(input);
        expect(result?.toISOString()).toBe(expected);
      });
    });
  });

  describe('formatForServer', () => {
    it('应该格式化当前时间为北京时间', () => {
      const now = new Date('2025-01-25T06:30:00Z');
      const result = service.formatForServer(now);

      expect(result).toBe('2025-01-25 14:30:00');
    });

    it('应该处理空值输入', () => {
      const result = service.formatForServer(null);
      // 应该返回当前时间
      expect(result).toBe('2025-01-25 14:30:00');
    });

    it('应该正确格式化不同时区的时间', () => {
      const testCases = [
        { input: new Date('2025-01-01T00:00:00Z'), expected: '2025-01-01 08:00:00' },
        { input: new Date('2025-06-15T12:00:00Z'), expected: '2025-06-15 20:00:00' },
        { input: new Date('2025-12-31T15:59:59Z'), expected: '2025-12-31 23:59:59' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = service.formatForServer(input);
        expect(result).toBe(expected);
      });
    });

    it('应该处理无效的Date对象', () => {
      const invalidDate = new Date('invalid');
      const result = service.formatForServer(invalidDate);
      // 应该返回当前时间
      expect(result).toBe('2025-01-25 14:30:00');
    });
  });

  describe('formatForDisplay', () => {
    it('应该默认只显示时间', () => {
      const date = new Date('2025-01-25T06:30:00Z');
      const result = service.formatForDisplay(date);

      // 这里会根据测试环境的时区而变化
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('应该支持显示日期和时间', () => {
      const date = new Date('2025-01-25T06:30:00Z');
      const result = service.formatForDisplay(date, {
        showDate: true,
        showTime: true
      });

      expect(result).toMatch(/\d{4}\/\d{2}\/\d{2}/);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('应该支持相对时间（今日）', () => {
      const today = new Date('2025-01-25T06:30:00Z');
      const result = service.formatForDisplay(today, { relative: true });

      expect(result).toContain('今日');
    });

    it('应该处理空值输入', () => {
      expect(service.formatForDisplay(null)).toBe('--:--');
      expect(service.formatForDisplay(undefined)).toBe('--:--');
    });

    it('应该处理无效的Date对象', () => {
      const invalidDate = new Date('invalid');
      const result = service.formatForDisplay(invalidDate);
      expect(result).toBe('--:--');
    });
  });

  describe('calculateDuration', () => {
    it('应该正确计算时长', () => {
      const start = new Date('2025-01-25T00:00:00Z');
      const end = new Date('2025-01-25T08:30:00Z');
      const result = service.calculateDuration(start, end);

      expect(result).toEqual({
        minutes: 510,
        display: '8小时30分钟',
        isValid: true,
        isOvertime: false
      });
    });

    it('应该检测超时（>12小时）', () => {
      const start = new Date('2025-01-25T00:00:00Z');
      const end = new Date('2025-01-25T13:00:00Z');
      const result = service.calculateDuration(start, end);

      expect(result).toEqual({
        minutes: 780,
        display: '13小时 (超时)',
        isValid: true,
        isOvertime: true
      });
    });

    it('应该处理负时长', () => {
      const start = new Date('2025-01-25T10:00:00Z');
      const end = new Date('2025-01-25T08:00:00Z');
      const result = service.calculateDuration(start, end);

      expect(result).toEqual({
        minutes: 0,
        display: '结束时间早于开始时间',
        isValid: false,
        isOvertime: false
      });
    });

    it('应该处理空值输入', () => {
      const result1 = service.calculateDuration(null, new Date());
      const result2 = service.calculateDuration(new Date(), null);

      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
      expect(result1.display).toBe('无效时长');
      expect(result2.display).toBe('无效时长');
    });

    it('应该处理少于1分钟的时长', () => {
      const start = new Date('2025-01-25T00:00:00Z');
      const end = new Date('2025-01-25T00:00:30Z');
      const result = service.calculateDuration(start, end);

      expect(result).toEqual({
        minutes: 0,
        display: '少于1分钟',
        isValid: true,
        isOvertime: false
      });
    });

    it('应该正确格式化不同时长', () => {
      const testCases = [
        {
          start: '2025-01-25T00:00:00Z',
          end: '2025-01-25T00:30:00Z',
          display: '30分钟'
        },
        {
          start: '2025-01-25T00:00:00Z',
          end: '2025-01-25T01:00:00Z',
          display: '1小时'
        },
        {
          start: '2025-01-25T00:00:00Z',
          end: '2025-01-25T02:45:00Z',
          display: '2小时45分钟'
        },
      ];

      testCases.forEach(({ start, end, display }) => {
        const result = service.calculateDuration(
          new Date(start),
          new Date(end)
        );
        expect(result.display).toBe(display);
      });
    });
  });

  describe('getCurrentBeijingTime', () => {
    it('应该返回当前北京时间的API格式', () => {
      const result = service.getCurrentBeijingTime();
      expect(result).toBe('2025-01-25 14:30:00');
    });
  });

  describe('isReasonableTime', () => {
    it('应该验证合理的时间范围', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastMonth = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      expect(service.isReasonableTime(now)).toBe(true);
      expect(service.isReasonableTime(yesterday)).toBe(true);
      expect(service.isReasonableTime(lastMonth)).toBe(false);
      expect(service.isReasonableTime(tomorrow)).toBe(false);
    });

    it('应该处理空值和无效日期', () => {
      expect(service.isReasonableTime(null)).toBe(false);
      expect(service.isReasonableTime(undefined)).toBe(false);
      expect(service.isReasonableTime(new Date('invalid'))).toBe(false);
    });
  });

  describe('formatRelativeTime', () => {
    it('应该格式化相对时间', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      expect(service.formatRelativeTime(now)).toBe('刚刚');
      expect(service.formatRelativeTime(oneMinuteAgo)).toBe('1分钟前');
      expect(service.formatRelativeTime(oneHourAgo)).toBe('1小时前');
      expect(service.formatRelativeTime(oneDayAgo)).toBe('1天前');
    });

    it('应该处理空值输入', () => {
      expect(service.formatRelativeTime(null)).toBe('未知时间');
      expect(service.formatRelativeTime(undefined)).toBe('未知时间');
    });
  });

  describe('边界测试和兼容性', () => {
    it('应该正确处理跨年时间', () => {
      const newYear = '2025-01-01 00:00:00';
      const parsed = service.parseServerTime(newYear);
      const formatted = service.formatForServer(parsed!);

      expect(formatted).toBe(newYear);
    });

    it('应该保持时间转换的一致性', () => {
      const testTimes = [
        '2025-01-25 00:00:00',
        '2025-06-15 12:30:45',
        '2025-12-31 23:59:59',
      ];

      testTimes.forEach(time => {
        const parsed = service.parseServerTime(time);
        const formatted = service.formatForServer(parsed!);
        expect(formatted).toBe(time);
      });
    });

    it('应该兼容现有的API格式', () => {
      // 模拟志愿者签到场景
      const checkInTime = service.getCurrentBeijingTime();
      expect(checkInTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

      // 模拟接收后端数据
      const serverResponse = '2025-01-25 09:00:00';
      const parsedTime = service.parseServerTime(serverResponse);
      expect(parsedTime).toBeInstanceOf(Date);

      // 模拟前端显示
      const display = service.formatForDisplay(parsedTime!, { relative: true });
      expect(display).toBeTruthy();
    });
  });
});