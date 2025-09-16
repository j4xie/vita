# PomeloX 性能优化指南

## React 性能优化工具 (强制执行)

### 1. React.memo - 组件缓存优化
```typescript
// ✅ 必须使用：防止列表项不必要重新渲染
const ActivityCard = memo(ActivityCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.activity?.id === nextProps.activity?.id &&
    prevProps.activity?.status === nextProps.activity?.status
  );
});
```

### 2. useMemo - 计算结果缓存
```typescript
// ✅ 必须使用：缓存昂贵的过滤和计算
const filteredData = useMemo(() => {
  return data.filter(/* 复杂筛选逻辑 */);
}, [data, filters]);
```

### 3. useCallback - 函数引用稳定
```typescript
// ✅ 必须使用：避免子组件不必要重新渲染
const handlePress = useCallback((item) => {
  // 处理逻辑
}, [dependencies]);
```

## React Native 性能配置 (强制执行)

### 4. FlatList 性能配置
```typescript
// ✅ 强制配置：大列表必须使用这些优化
<FlatList
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  initialNumToRender={10}
  windowSize={10}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### 5. 图片优化 - react-native-fast-image
```typescript
// ✅ 强制使用：所有网络图片必须使用FastImage
import FastImage from 'react-native-fast-image';

<FastImage
  source={{
    uri: imageUrl,
    priority: FastImage.priority.normal,
  }}
  style={styles.image}
  resizeMode={FastImage.resizeMode.cover}
/>
```

## 内存管理规范 (强制执行)

### 6. useRef 统一管理
```typescript
// ✅ 强制规范：多个ref必须统一管理，避免内存泄漏
const screenStateRef = useRef({
  operationLocks: new Set<number>(),
  pendingOperations: new Map<string, Promise<any>>(),
  cache: new Map<string, any>(),
});

// 必须添加cleanup
useEffect(() => {
  return () => {
    screenStateRef.current.operationLocks.clear();
    screenStateRef.current.pendingOperations.clear();
    screenStateRef.current.cache.clear();
  };
}, []);
```

## TypeScript 类型安全 (强制执行)

### 7. 禁止使用 any 类型
```typescript
// ❌ 禁止使用
const handleData = (data: any) => { /* ... */ }

// ✅ 必须使用具体类型
interface UserData {
  id: number;
  name: string;
  role: UserRole;
}
const handleData = (data: UserData) => { /* ... */ }
```

### 8. API 响应类型定义
```typescript
// ✅ 强制要求：所有API调用必须有明确类型
interface APIResponse<T = any> {
  code: number;
  msg: string;
  data?: T;
  rows?: T[];
  total?: number;
}
```

## 错误处理规范 (强制执行)

### 9. React Error Boundary
```typescript
// ✅ 关键组件必须包装Error Boundary
<ErrorBoundary title="功能加载失败" message="请重试或刷新页面">
  <CriticalComponent />
</ErrorBoundary>
```

### 10. 统一错误处理
```typescript
// ✅ 必须使用统一错误处理工具
import { handleAPIError, logError } from '../utils/errorHandler';

try {
  await apiCall();
} catch (error) {
  handleAPIError(error, { action: '获取数据', component: 'ComponentName' }, Alert.alert);
}
```

## 无障碍功能规范 (强制执行)

### 11. Accessibility 属性
```typescript
// ✅ 所有交互元素必须添加无障碍属性
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="描述性标签"
  accessibilityHint="操作提示"
  accessibilityState={{ disabled: isLoading }}
>
```

## 代码质量检查清单

### 开发前检查：
- [ ] 是否使用了React.memo优化重新渲染？
- [ ] 是否使用了useMemo缓存昂贵计算？
- [ ] 是否配置了FlatList性能选项？
- [ ] 是否使用FastImage而非普通Image？
- [ ] 是否避免了any类型的使用？

### 提交前检查：
- [ ] 是否添加了Error Boundary保护？
- [ ] 是否使用了统一的错误处理？
- [ ] 是否添加了accessibility属性？
- [ ] 是否正确清理了内存引用？
- [ ] 是否遵循了国际化规范？

## 性能基准线

### 必须达到的性能指标：
- 🚀 **列表滚动FPS**: ≥55fps (React.memo + FlatList优化)
- 🖼️ **图片加载时间**: <2秒 (FastImage缓存)
- 🧠 **内存使用**: 无内存泄漏警告 (统一refs管理)
- ⚡ **页面切换**: <300ms (Error Boundary + 优化)
- 🌍 **多语言切换**: <200ms (翻译文件优化)

### 代码质量基准：
- 📊 **TypeScript覆盖率**: >95% (避免any类型)
- 🛡️ **错误边界覆盖**: 100%关键组件 (Error Boundary)
- ♿ **无障碍评分**: Level AA (accessibility属性)
- 🌐 **国际化完整性**: 100% (无硬编码文字)

## 滚动处理安全规范

### React Native Reanimated 限制
**⚠️ 绝对禁止使用 `useAnimatedScrollHandler` 配合 FlatList/SectionList!**

**❌ 错误做法:**
```typescript
const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    'worklet';
    // 这会导致 "onScroll is not a function" 错误
  },
});

<SectionList onScroll={scrollHandler} />
```

**✅ 正确做法:**
```typescript
const handleScroll = useCallback((event: any) => {
  try {
    if (!event || !event.nativeEvent || typeof event.nativeEvent.contentOffset?.y !== 'number') {
      return;
    }
    
    const currentScrollY = event.nativeEvent.contentOffset.y;
    
    if (scrollY && typeof scrollY.value !== 'undefined') {
      scrollY.value = currentScrollY;
    }
  } catch (error) {
    console.warn('Scroll handler error:', error);
  }
}, [dependencies]);

<SectionList onScroll={handleScroll} />
```

## 监控和调试

### 性能监控工具
- **React DevTools Profiler**: 组件渲染分析
- **Flipper Performance**: 内存和CPU使用
- **Metro Bundle Analyzer**: Bundle大小分析
- **Xcode Instruments**: iOS性能分析

### 常见性能问题
1. **过度渲染**: 使用React.memo和useCallback
2. **内存泄漏**: 正确清理事件监听和定时器
3. **图片内存**: 使用FastImage和适当的缓存策略
4. **Bundle过大**: 代码分割和tree shaking

### 调试命令
```bash
# Bundle分析
npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output bundle.js --sourcemap-output bundle.map

# 内存分析
npx flipper

# 性能分析
npx react-native run-ios --configuration Release
```