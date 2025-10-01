# 活动列表空白问题调试指南

## 🔍 问题诊断工具

我已经为你添加了详细的调试日志和诊断工具。

### 1. 运行诊断脚本

```bash
node diagnose-activity-issue.js
```

这个脚本会：
- ✅ 测试生产环境API (https://www.vitaglobal.icu)
- ✅ 测试测试环境API (http://106.14.165.234:8085)
- ✅ 检查环境配置文件
- ✅ 提供修复建议

### 2. 查看应用日志

现在应用中添加了详细的调试日志，你可以在控制台看到：

```
🔍 [ACTIVITY-LIST] 初始化骨架屏定时器
🚀 [ACTIVITY-LIST] 组件挂载，开始初始数据加载
🌐 [FETCH-ACTIVITIES] ========== 开始获取活动数据 ==========
```

**如何查看日志:**

1. **在终端中查看**: 运行 `npm start` 后，终端会显示所有console.log
2. **在浏览器DevTools中**: 如果用浏览器打开，按F12查看Console
3. **在React Native Debugger**: 使用 React Native Debugger 工具

### 3. 常见问题和解决方法

#### 问题A: 骨架屏一直显示

**症状**: 界面显示加载动画但一直不消失

**日志特征**:
```
🔍 [ACTIVITY-LIST] 初始化骨架屏定时器
[没有后续日志]
```

**解决方法**:
```bash
# 完全清理项目缓存
rm -rf node_modules/.cache .expo
npm run start:cache
```

#### 问题B: 网络请求失败

**症状**: 界面空白或显示错误提示

**日志特征**:
```
❌ [FETCH-ACTIVITIES] ========== 获取活动数据失败 ==========
❌ [FETCH-ACTIVITIES] 错误详情: { name: 'NetworkError', ... }
```

**解决方法**:
1. 检查网络连接
2. 尝试切换到测试环境: `npm run ios:dev`
3. 检查API服务器状态: `curl https://www.vitaglobal.icu/app/activity/list?pageNum=1&pageSize=10`

#### 问题C: 用户未登录

**症状**: 界面显示空列表但没有错误

**日志特征**:
```
🔍 [ACTIVITY-LIST] 用户信息: { hasUser: false, userId: undefined }
📋 [FETCH-ACTIVITIES] 准备获取活动列表: { mode: '访客模式' }
```

**解决方法**:
1. 访客模式也应该能看到活动列表
2. 如果想要个性化数据，请先登录
3. 检查AsyncStorage中的token: 在代码中添加 `AsyncStorage.getItem('@pomelox_token').then(console.log)`

#### 问题D: API返回数据但界面不显示

**症状**: 日志显示获取到数据，但界面仍然空白

**日志特征**:
```
✅ [FETCH-ACTIVITIES] 最终状态: { activitiesCount: 10, hasError: false }
当前活动数据: 10 条活动
```

**解决方法**:
```bash
# 这可能是渲染问题，尝试完全重新加载
npm run start:cache
```

### 4. 快速修复命令总结

```bash
# 方法1: 清理缓存重启 (最常用)
npm run start:cache

# 方法2: 切换到测试环境
npm run ios:dev

# 方法3: 切换回生产环境
npm run ios:prod

# 方法4: 完全清理
rm -rf node_modules/.cache .expo
npm cache clean --force
npm start -- --clear
```

### 5. 如果以上都不行

如果尝试了所有方法都不行，请提供以下信息：

1. **完整的终端日志** (从启动到出现问题)
2. **网络请求日志** (所有带 [FETCH-ACTIVITIES] 的日志)
3. **用户状态** (日志中的 "用户信息" 部分)
4. **API测试结果** (运行 `node diagnose-activity-issue.js` 的输出)

### 6. 临时调试代码

如果需要更深入的调试，可以在 `ActivityListScreen.tsx` 中添加：

```typescript
// 在 useEffect 中添加
useEffect(() => {
  console.log('🔍 DEBUG - 所有状态:', {
    initialLoading,
    loading,
    refreshing,
    activitiesCount: activities.length,
    hasError: !!error,
    errorMessage: error,
    user: user ? { id: user.id, userName: user.userName } : null,
  });
}, [initialLoading, loading, refreshing, activities, error, user]);
```

---

**诊断工具版本**: 1.0.0
**最后更新**: 2025-09-30