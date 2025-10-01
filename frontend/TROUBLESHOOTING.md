# 活动列表空白问题 - 故障排除指南

## 🚨 当前状态

- ✅ **API服务正常** - 生产和测试环境都能返回数据
- ✅ **网络配置正常** - Info.plist已正确配置
- ✅ **开发服务器运行中** - Metro Bundler正常
- ✅ **代码文件完整** - 所有关键文件都存在
- ❌ **应用界面空白** - 活动列表不显示

## 🔍 可能的原因

根据诊断，问题可能出在以下几个方面：

### 1. 应用端JavaScript执行问题

**症状**: 代码没有错误，但数据不显示

**可能原因**:
- React组件渲染被阻塞
- useEffect钩子没有触发
- 异步数据获取失败但没有错误提示
- 状态更新没有触发重新渲染

**调试方法**:
```bash
# 方法1: 启用Remote JS Debugging
1. 在模拟器中按 Cmd+D
2. 选择 "Enable Remote JS Debugging"
3. 在Chrome DevTools Console查看日志

# 方法2: 使用React Native Debugger
brew install react-native-debugger
open -a "React Native Debugger"
```

### 2. Metro Bundler缓存问题

**症状**: 修改代码后不生效，或者行为异常

**解决方法**:
```bash
# 完全清理并重启
./fix-blank-screen.sh

# 或手动清理
rm -rf node_modules/.cache .expo
watchman watch-del-all
npm start -- --clear --reset-cache
```

### 3. 初始化竞态条件

**症状**: 骨架屏显示后不消失，或者数据加载时机不对

**可能原因**:
- `initialLoading` 状态没有正确更新
- `fetchActivities` 在组件卸载时被调用
- useEffect依赖项导致无限循环

**检查方法**:
```bash
# 运行实时日志监控
./watch-logs.sh
```

查找这些日志：
```
🔍 [ACTIVITY-LIST] 初始化骨架屏定时器
🔍 [ACTIVITY-LIST] 关闭骨架屏，开始加载数据
🚀 [ACTIVITY-LIST] 组件挂载，开始初始数据加载
🌐 [FETCH-ACTIVITIES] ========== 开始获取活动数据 ==========
```

如果这些日志都没有出现，说明组件根本没有加载或执行。

### 4. 用户认证问题

**症状**: API调用因为没有token而失败

**检查方法**:
在代码中临时添加：
```typescript
// 在ActivityListScreen.tsx开头添加
useEffect(() => {
  async function checkAuth() {
    const token = await AsyncStorage.getItem('@pomelox_token');
    console.log('🔐 当前token:', token ? '存在' : '不存在');
  }
  checkAuth();
}, []);
```

### 5. 组件挂载问题

**症状**: ActivityListScreen根本没有被渲染

**检查方法**:
在`ActivityListScreen.tsx`最开头添加：
```typescript
console.log('🎯 [ACTIVITY-LIST] 组件文件被加载');

const ActivityListScreenInternal: React.FC = () => {
  console.log('🎯 [ACTIVITY-LIST] 组件开始渲染');
  // ... 其余代码
```

如果连这个日志都看不到，说明路由配置有问题。

## 📋 系统检查清单

运行以下命令进行完整检查：

```bash
# 1. API连接测试
node test-network.js

# 2. 应用状态检查
./check-app-status.sh

# 3. 完整诊断
node diagnose-activity-issue.js

# 4. 代码检查
node quick-debug.js
```

## 🛠️ 逐步调试流程

### 步骤1: 确认组件是否加载

在`ActivityListScreen.tsx`第67行（组件定义处）后添加：
```typescript
const ActivityListScreenInternal: React.FC = () => {
  alert('组件加载了！');  // 临时添加，用于测试

  // ... 其余代码
```

如果能看到alert，说明组件加载正常。

### 步骤2: 确认数据获取是否触发

在`fetchActivities`函数开头添加：
```typescript
const fetchActivities = useCallback(async (page: number = 1, isRefresh: boolean = false) => {
  alert(`开始获取数据: page=${page}`);  // 临时添加

  // ... 其余代码
```

### 步骤3: 确认数据是否成功返回

在`fetchActivities`的成功处理部分添加：
```typescript
if (adaptedData.success) {
  alert(`数据获取成功: ${adaptedData.activities.length} 个活动`);  // 临时添加

  // ... 其余代码
}
```

### 步骤4: 确认UI是否正确渲染

检查`filteredActivities`的值：
```typescript
// 在render部分添加
console.log('🎨 [RENDER] filteredActivities:', filteredActivities.length);
console.log('🎨 [RENDER] initialLoading:', initialLoading);
console.log('🎨 [RENDER] loading:', loading);
```

## 🚑 应急修复方案

如果以上所有方法都不行，尝试以下应急方案：

### 方案A: 使用简化版本

创建一个最简单的版本来测试：

```typescript
// 创建 src/screens/activities/ActivityListScreenSimple.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';

export const ActivityListScreen = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    console.log('🔥 简化版本: 开始获取数据');

    fetch('https://www.vitaglobal.icu/app/activity/list?pageNum=1&pageSize=10')
      .then(res => res.json())
      .then(data => {
        console.log('🔥 简化版本: 数据获取成功', data.total);
        setActivities(data.rows || []);
      })
      .catch(err => {
        console.error('🔥 简化版本: 获取失败', err);
      });
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>活动数量: {activities.length}</Text>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text>{item.name}</Text>
        )}
      />
    </View>
  );
};
```

如果简化版本能工作，说明问题在复杂的逻辑中。

### 方案B: 切换到测试环境

测试环境响应更快，可能更容易调试：

```bash
npm run ios:dev
```

### 方案C: 重新安装依赖

```bash
rm -rf node_modules
npm install
npm start -- --clear
```

## 📞 获取帮助

如果问题仍然存在，请提供以下信息：

1. **完整的Metro Bundler日志**
   ```bash
   # 将日志保存到文件
   npm start 2>&1 | tee metro.log
   ```

2. **模拟器日志**
   ```bash
   # 运行并保存日志
   ./watch-logs.sh 2>&1 | tee simulator.log
   ```

3. **网络测试结果**
   ```bash
   node test-network.js > network-test.log
   ```

4. **代码检查结果**
   ```bash
   node quick-debug.js > code-check.log
   ```

将这些日志文件发送给开发团队进行进一步分析。

---

**最后更新**: 2025-09-30
**工具版本**: 1.0.0