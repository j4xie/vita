# 时间服务迁移指南

## 概述

我们已经将复杂的时间处理逻辑从多个分散的文件整合到一个统一的 `UnifiedTimeService` 中。这个服务大大简化了时间处理，减少了代码重复，并解决了时区转换的各种边界情况。

## 为什么要迁移？

### 之前的问题
- **4个不同的时间处理函数**分散在多个文件中
- **132行复杂的解析逻辑**难以维护
- **时区转换混乱**，容易出现bug
- **代码重复**，不同文件有相似的实现

### 新方案的优势
- **统一接口**：所有时间操作通过一个服务完成
- **代码减少60%**：从611行减少到约250行
- **自动时区处理**：后端北京时间，前端自动转换为本地时间
- **更好的错误处理**：统一的错误返回格式

## 核心功能对照

| 旧函数 | 新服务方法 | 说明 |
|--------|------------|------|
| `parseTimestamp()` | `timeService.parseServerTime()` | 解析后端时间字符串 |
| `safeParseTime()` | `timeService.parseServerTime()` | 安全解析，返回null而非抛错 |
| `formatTimeForAPI()` | `timeService.formatForServer()` | 格式化为API格式（北京时间） |
| `toBeijingTimeString()` | `timeService.formatForServer()` | 转换为北京时间字符串 |
| `formatBeijingTime()` | `timeService.formatForDisplay()` | 显示格式化 |
| `formatLocalTime()` | `timeService.formatForDisplay()` | 本地时间显示 |
| `calculateDuration()` | `timeService.calculateDuration()` | 计算时长 |
| `detectTimeAnomaly()` | `timeService.isReasonableTime()` | 时间合理性检查 |
| `formatVolunteerTime()` | `timeService.formatForDisplay()` | 志愿者时间显示 |

## 迁移示例

### 1. 解析后端时间

**旧代码：**
```typescript
import { parseTimestamp } from '../../utils/timeHelper';

const date = parseTimestamp(backendTime);
```

**新代码：**
```typescript
import { timeService } from '../../utils/UnifiedTimeService';

const date = timeService.parseServerTime(backendTime);
```

### 2. 格式化为API格式

**旧代码：**
```typescript
import { toBeijingTimeString } from '../../utils/timeHelper';

const apiTime = toBeijingTimeString(new Date());
```

**新代码：**
```typescript
const apiTime = timeService.formatForServer(new Date());
// 或者获取当前时间
const now = timeService.getCurrentBeijingTime();
```

### 3. 显示本地时间

**旧代码：**
```typescript
import { formatLocalTime } from '../../utils/timeHelper';

const display = formatLocalTime(date);
```

**新代码：**
```typescript
// 默认只显示时间
const timeOnly = timeService.formatForDisplay(date);

// 显示日期和时间
const full = timeService.formatForDisplay(date, {
  showDate: true,
  showTime: true
});

// 相对时间（今日）
const relative = timeService.formatForDisplay(date, {
  relative: true
});
```

### 4. 计算时长

**旧代码：**
```typescript
import { calculateDuration } from '../../utils/timeHelper';

const duration = calculateDuration(startTime, endTime);
console.log(`${duration.hours}小时${duration.minutes}分钟`);
```

**新代码：**
```typescript
const duration = timeService.calculateDuration(startDate, endDate);
console.log(duration.display); // "8小时30分钟"
console.log(duration.isOvertime); // 是否超时（>12小时）
```

## 重要注意事项

### 1. 时区处理是自动的
- **后端API**：永远使用北京时间 (Asia/Shanghai)
- **前端显示**：自动转换为用户本地时间
- 不需要手动处理时区转换

### 2. 统一的错误处理
- 解析失败返回 `null`
- 显示格式化失败返回 `'--:--'`
- 时长计算失败返回 `isValid: false`

### 3. 向后兼容
- 旧函数标记为 `@deprecated` 但仍可使用
- 建议逐步迁移，不要一次性全部修改
- 计划在3个版本后完全移除旧函数

## 完整的API文档

```typescript
class UnifiedTimeService {
  // 解析后端时间字符串
  parseServerTime(serverTime: string | null | undefined): Date | null;

  // 格式化为后端API格式
  formatForServer(date: Date | null | undefined): string;

  // 前端显示格式化
  formatForDisplay(date: Date | null | undefined, options?: DisplayOptions): string;

  // 计算时长
  calculateDuration(start: Date | null | undefined, end: Date | null | undefined): DurationResult;

  // 获取当前北京时间
  getCurrentBeijingTime(): string;

  // 验证时间合理性
  isReasonableTime(date: Date | null | undefined): boolean;

  // 格式化相对时间
  formatRelativeTime(date: Date | null | undefined): string;
}

interface DisplayOptions {
  showDate?: boolean;  // 是否显示日期
  showTime?: boolean;  // 是否显示时间
  relative?: boolean;  // 是否使用相对时间（今日）
}

interface DurationResult {
  minutes: number;     // 总分钟数
  display: string;     // 格式化显示文本
  isValid: boolean;    // 是否有效
  isOvertime: boolean; // 是否超时（>12小时）
}
```

## 已迁移的文件

✅ 已完成：
- `VolunteerCheckInScreen.tsx`
- `VolunteerCheckOutScreen.tsx`
- `VolunteerSchoolDetailScreen.tsx`
- `volunteerAPI.ts`

⏳ 待迁移：
- `ActivityDetailScreen.tsx`
- `ActivityListScreen.tsx`
- `ProfileHomeScreen.tsx`
- `userAdapter.ts`

## 迁移清单

当你迁移一个文件时，请按照以下步骤：

1. [ ] 替换import语句
2. [ ] 查找所有时间处理函数调用
3. [ ] 使用对照表替换为新方法
4. [ ] 测试功能是否正常
5. [ ] 提交代码

## 联系方式

如有问题，请联系技术团队。