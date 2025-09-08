# PomeloX UI 设计系统指南

## 设计语言 - Liquid Glass (Apple WWDC 2025 风格)

### 视觉系统
- **主要设计模式**: Liquid Glass 带模糊效果和半透明
- **颜色系统**: PomeloX/Pomelo 品牌色调配暖色渐变
  - Primary: #FF6B35 (活力橙) - CTA和激活状态
  - Secondary: #FF4757 (珊瑚红) - 次要操作和渐变
  - Accent: #FF8A65 (浅橙) - 高亮和悬停状态
  - Success: #2ED573 (新鲜绿) - 确认和积极状态
  - Warning: #FFA726 (暖琥珀) - 警告和紧急指示

### 阴影系统
- **多层次高度**: xs, sm, base, md, lg, xl
- **卡片**: 4dp高度带彩色阴影
- **浮动元素**: 12dp高度带发光效果  
- **模态框**: 16dp高度带重阴影

## 核心组件库

### Activity Card (EventCard)
- **布局**: 180px高度带渐变叠加
- **动画**: 
  - 按压弹簧动画 (缩放0.98)
  - 滚动可见时淡入
  - 滚动时图片视差效果
- **交互元素**:
  - 浮动心形图标 (右上角) 带脉冲动画
  - 快速注册按钮带主色背景
  - 状态徽章根据可用性动态变色
- **渐变叠加**: 双色调渐变从30%到80%透明度

### 浮动操作按钮 (FAB)
- **位置**: 右下角，距边缘16dp
- **行为**:
  - 向下滚动自动隐藏，向上滚动显示
  - 按压缩放动画 (1.0 → 1.1)
  - 主要操作脉冲阴影效果
- **类型**:
  - 主FAB: 创建活动 (仅管理员)
  - 次FAB: 过滤/排序选项
  - 迷你FAB: 快速操作 (40dp直径)

### Bottom Sheets
- **实现**: react-native-bottom-sheet
- **捕捉点**: [25%, 50%, 90%]
- **内容类型**:
  - 快速注册表单
  - 活动过滤器
  - 用户资料快速查看
- **动画**: 弹簧物理 0.8阻尼

## 动画框架

### 核心动画 (React Native Reanimated 3)
```javascript
// 标准动画配置
const springConfig = {
  damping: 15,
  mass: 1,
  stiffness: 150,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 2,
};
```

### 动画模式
1. **入场动画**: 淡入+向上滑动 (300ms, 错开50ms)
2. **交互动画**: 按钮按压缩放到0.95带弹簧
3. **导航转场**: 图片共享元素转场
4. **微交互**: 心形动画缩放+旋转点赞

## 性能优化

### 图片处理
- **库**: react-native-fast-image
- **缓存**: 内存+磁盘缓存 (100MB限制)
- **懒加载**: 基于视口200px阈值
- **格式**: WebP优先，JPEG备用

### 列表优化
```javascript
const listConfig = {
  removeClippedSubviews: true,
  maxToRenderPerBatch: 10,
  initialNumToRender: 10,
  windowSize: 10,
};
```

## 手势交互

### 滑动手势 (react-native-gesture-handler)
- **水平滑动**: 
  - 左: 显示快速操作 (收藏, 分享)
  - 右: 标记感兴趣
- **垂直滑动**: 下拉刷新带自定义动画

### 长按操作
- **卡片**: 在模态框中显示预览
- **图片**: 保存到相册选项
- **文本**: 复制到剪贴板

## 无障碍功能

### 触摸目标
- **最小尺寸**: 44x44点 (iOS), 48x48dp (Android)
- **间距**: 交互元素间最小8dp
- **命中区域**: 小按钮扩展触摸区域

### 屏幕阅读器支持
- **标签**: 所有交互元素有accessibilityLabel
- **提示**: 复杂交互有accessibilityHint
- **角色**: 语义意义的正确accessibilityRole
- **实时区域**: 动态内容更新播报

## 响应式设计

### 断点
- **小屏**: < 375px宽度
- **中屏**: 375-414px
- **大屏**: > 414px

### 平台适配
#### iOS专用
- **导航**: iOS风格后退滑动手势
- **触觉**: 重要操作触觉反馈
- **滚动**: 边界弹跳效果

#### Android专用
- **导航**: Material Design底部导航
- **涟漪**: 按钮触摸涟漪效果
- **返回**: 硬件返回键支持

## CategoryBar 位置规范

### 固定位置配置 (严禁修改)
```typescript
fixedCategoryBar: {
  position: 'absolute',
  top: 120, // 确保不被header遮挡
  left: 0,
  right: 0,
  zIndex: 999,
  paddingHorizontal: theme.spacing.md,
  paddingVertical: 4,
  backgroundColor: 'rgba(255, 255, 255, 0.001)',
}
```

### 列表内容间距
```typescript
contentContainerStyle: {
  paddingTop: 45 + insets.top, // 与CategoryBar最佳间距
  paddingBottom: 120 + insets.bottom,
}
```

## ⚠️ 重要注意事项

### React Native Reanimated 限制
**🚫 绝对禁止**: 在FlatList, SectionList, ScrollView中使用`useAnimatedScrollHandler`

**✅ 正确做法**: 使用`useCallback`处理滚动
```typescript
const handleScroll = useCallback((event: any) => {
  const scrollY = event.nativeEvent.contentOffset.y;
  animatedValue.value = scrollY;
}, [animatedValue]);
```

### 性能基准
- **列表滚动FPS**: ≥55fps
- **图片加载时间**: <2秒  
- **页面切换**: <300ms
- **内存使用**: 无泄漏警告