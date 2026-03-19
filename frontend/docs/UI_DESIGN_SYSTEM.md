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

---

## Apple HIG 组件设计规范

本章节基于 Apple Human Interface Guidelines，**只收录 PomeloX 实际用到的组件和模式**，跳过 SplitView、Sidebar、Popover 等不相关的内容。所有数值单位为 pt (RN 的 dp)。

### 1. 屏幕布局与边距 (Layout & Margins)

基于 Apple HIG 的 Content Margins + Safe Areas，映射到 `CORE_LAYOUT.margins`：

```
屏幕水平边距 (Content Margin):
  - 标准: 16pt (CORE_LAYOUT.margins.default) — 适用于大部分内容区域
  - 宽松: 20pt (CORE_SPACING['5']) — 用于表单页、详情页等需要呼吸感的场景
  - 紧凑: 12pt (CORE_LAYOUT.margins.compact) — 仅用于全宽卡片内的次级内容

安全区域 (Safe Areas):
  - 顶部: 始终使用 useSafeAreaInsets().top，不硬编码
  - 底部: Tab 页使用 Tab Bar 自带安全区; 非 Tab 页用 useSafeAreaInsets().bottom
  - Home Indicator 区域: 底部按钮需额外 34pt 底部间距 (Face ID 设备)

内容区最大宽度:
  - 手机: 全宽减去两侧边距 (screenWidth - 32 或 screenWidth - 40)
  - 不设置 maxWidth，因为当前不支持 iPad 分栏
```

### 2. 排版层级与使用场景 (Typography Hierarchy)

基于 Apple HIG Dynamic Type Scale，映射到 `src/theme/typography.ts` 的 `typeScale` 和 `CORE_TYPOGRAPHY`：

```
Large Title (34pt, bold)     → 不使用 (App 不需要超大标题)
Title 1 (28pt, bold)         → 不使用
Title 2 (22pt, bold)         → 页面主标题 (如 "探索", "社区", "我的")
                               对应 CORE_TYPOGRAPHY.fontSize.title (22pt)
Title 3 (20pt, semibold)     → 弹窗标题、Section 标题
                               对应 typeScale.titleMd (20pt, semibold)
Headline (17pt, semibold)    → 卡片标题、列表项主文字、按钮文字
                               对应 typeScale.button (17pt, semibold)
Body (17pt, regular)         → 正文内容、表单输入文字
                               对应 typeScale.body (17pt, regular)
Callout (16pt, regular)      → 次级说明文字、筛选标签
                               对应 CORE_TYPOGRAPHY.fontSize.bodySmall (16pt)
Subhead (15pt, regular)      → 列表项副标题、时间/地点等辅助信息
                               对应 CORE_TYPOGRAPHY.fontSize.caption (15pt)
Footnote (13pt, regular)     → 底部注释、Tab Bar 标签、Badge 文字
                               对应 typography.styles.caption (12pt) — 实际用 13pt
Caption 1 (12pt, regular)    → 时间戳、最小辅助文字
                               对应 typeScale.badge (12pt)
Caption 2 (11pt, regular)    → 不使用 (太小, 中文不友好)

中文适配:
  - 中文 Body 建议不小于 15pt (HIG 的 17pt 对中文偏大, 但不应低于 15pt)
  - 中文行高建议 1.5-1.6 (对应 CORE_TYPOGRAPHY.lineHeight.normal = 1.5)
  - 英文行高 1.2-1.3 (对应 CORE_TYPOGRAPHY.lineHeight.tight = 1.3)

文字截断规则:
  - 卡片标题: 最多 2 行, 超出用 ellipsis (numberOfLines={2})
  - 列表项标题: 最多 1 行
  - 列表项副标题: 最多 2 行
  - 正文段落: 不截断, 完整展示
```

### 3. 导航栏 (Navigation Bar)

```
标准高度: 44pt (不含状态栏)
大标题模式: 不使用 (App 使用自定义 Header)

自定义 Header 规范:
  - 高度: 44-56pt (含内边距)
  - 标题字号: Title 3 (20pt, semibold), 居中或居左
  - 左侧返回按钮: 44×44pt 触摸区域, 图标 24pt
  - 右侧操作按钮: 44×44pt 触摸区域, 图标 22-24pt
  - 底部分割线: StyleSheet.hairlineWidth (0.5pt), 颜色 border.secondary
  - 水平内边距: 16pt (CORE_SPACING.md)

返回手势:
  - iOS 全局启用右滑返回 (React Navigation 默认行为)
  - 不阻止返回手势, 除非有未保存的表单数据
```

### 4. Tab Bar

```
高度: 49pt (不含 Home Indicator 安全区)
图标尺寸: 24-28pt (推荐 25pt, Apple 标准)
标签文字: 10pt medium — Apple 标准
图标与标签间距: 2pt
选中状态: 品牌色 (#FF6B35 = CORE_COLORS.primary)
未选中状态: #8E8E93 (Apple 标准 systemGray)

Badge:
  - 位置: 图标右上角偏移 (-6, -3)
  - 最小尺寸: 18pt 圆形 (无数字) 或 自适应宽度 (有数字)
  - 背景: #FF3B30 (Apple 标准红)
  - 文字: 13pt, white, bold

中央突出按钮 (Rewards Tab):
  - 遵循现有设计, 但触摸区域不小于 48×48pt (CORE_TOUCH_TARGET.minimum)
```

### 5. 列表行 (List Rows / Table Cells)

这是 App 中使用最频繁的模式（活动列表、优惠券列表、订单列表、设置列表等）：

```
标准行高:
  - 单行文字: 44pt (Apple 最小标准, 同 CORE_TOUCH_TARGET.minimum - 4)
  - 双行文字 (标题+副标题): 60-72pt
  - 三行文字 (标题+副标题+描述): 88pt
  - 带缩略图 (图+文): 72-88pt (图片 40-60pt)
  - 设置项行: 44pt (单行, 带右侧 chevron)

内边距:
  - 水平: 16pt (CORE_SPACING.md, 与屏幕边距一致)
  - 垂直: 12pt (CORE_SPACING['3']) 上下
  - 图标/缩略图与文字间距: 12pt (CORE_SPACING['3'])
  - 文字与右侧附件间距: 8pt (CORE_SPACING.sm)

分割线:
  - 位置: 与主文字左对齐 (不与屏幕左边缘对齐)
  - 粗细: StyleSheet.hairlineWidth (约 0.5pt)
  - 颜色: rgba(0,0,0,0.12) light / rgba(255,255,255,0.12) dark
  - 左缩进: 有图标时 = 16 + 图标宽 + 12; 无图标时 = 16pt

右侧附件:
  - Disclosure (箭头): chevron-forward, 14pt, #C7C7CC
  - Detail: 辅助文字 15pt tertiary (CORE_COLORS.text.tertiary) + chevron
  - Switch: 标准 Switch 组件, 51×31pt

列表间距:
  - 同组内行间: 无额外间距 (只有分割线)
  - 不同 Section 间: 24-32pt (CORE_SPACING.lg ~ CORE_SPACING.xl)
  - Section Header: 13pt uppercase secondary 色, 上方 24pt, 下方 8pt
```

### 6. 卡片 (Cards)

```
活动卡片 (ActivityCard / GridActivityCard):
  - 圆角: 16pt (CORE_BORDER_RADIUS.card)
  - 内边距: 12-16pt (CORE_SPACING['3'] ~ CORE_SPACING.md)
  - 图片圆角: 12pt (CORE_BORDER_RADIUS.base) — 比卡片小 4pt
  - 图片高度: 固定比例 16:9 或 4:3
  - 标题与图片间距: 12pt
  - 标题与副信息间距: 4-6pt
  - 阴影: CORE_SHADOWS.sm

Featured 卡片 (FeaturedActivityCard):
  - 圆角: 20pt (CORE_BORDER_RADIUS.lg) — 更大, 突出层级
  - 宽度: screenWidth * 0.56 (约 220pt)
  - 卡片间距: 12pt (carousel gap)

商户卡片 (MerchantCard):
  - 与活动卡片一致的间距规范
  - Logo: 48pt 圆形 avatar (CORE_BORDER_RADIUS.avatar)

统一规则:
  - 卡片与屏幕边缘: 16pt (与 content margin 一致)
  - 卡片之间垂直间距: 12pt (CORE_SPACING['3'])
  - 卡片内文字不超过 3 行 (标题 2 行 + 副信息 1 行)
```

### 7. 按钮 (Buttons)

```
主按钮 (Primary / CTA):
  - 高度: 50pt (CORE_TOUCH_TARGET.button.minHeight + 2)
  - 圆角: 12pt (CORE_BORDER_RADIUS.button)
  - 字号: Headline (17pt, semibold)
  - 水平内边距: 24pt (文字按钮) / 全宽 (底部操作栏)
  - 底部操作栏按钮: 全宽, 左右 16pt margin

次按钮 (Secondary):
  - 高度: 44pt
  - 圆角: 10pt
  - 字号: Body (16pt, medium)
  - 边框: 1pt, 品牌色 (#FF6B35)

文字按钮 (Tertiary / Text Button):
  - 无背景, 无边框
  - 字号: 15-16pt (Callout / Subhead)
  - 颜色: 品牌色 (#FF6B35)
  - 触摸区域: 至少 44×44pt (即使视觉面积更小, 用 hitSlop 扩展)

小按钮 (Compact):
  - 高度: 32-36pt
  - 圆角: 8pt (CORE_BORDER_RADIUS.input)
  - 字号: 15pt (Subhead)
  - 用于: 卡片内操作、筛选标签

按钮状态:
  - Normal: opacity 1.0
  - Pressed: opacity 0.7 或 背景加深 10% (CORE_COLORS.primaryPressed)
  - Disabled: opacity 0.4 (CORE_COLORS.primaryDisabled), 不响应点击
  - Loading: 显示 ActivityIndicator, 禁用点击

按钮间距:
  - 同级按钮水平间距: 12pt
  - 同级按钮垂直间距: 12pt
  - 按钮与上方内容间距: 24pt (CORE_SPACING.lg)
```

### 8. 文本输入 (Text Fields)

```
标准输入框:
  - 高度: 48pt (CORE_TOUCH_TARGET.button.minHeight)
  - 圆角: 8pt (CORE_BORDER_RADIUS.input)
  - 内边距: 水平 16pt, 垂直 12pt
  - 字号: Body (17pt)
  - 占位符: Body (17pt), tertiary 色 (CORE_COLORS.text.tertiary)
  - 边框: 1pt, idle 状态 border.secondary; focus 状态品牌色
  - 左侧图标: 20pt, 与文字间距 12pt

多行输入框 (TextArea):
  - 最小高度: 100pt
  - 其他同标准输入框

标签 (Label):
  - 字号: 15pt medium (Subhead)
  - 颜色: CORE_COLORS.text.secondary
  - 与输入框间距: 6pt
  - 必填标识: 红色圆点 (6pt) 或 "*"

错误状态:
  - 边框变红: #EF4444 (CORE_COLORS.danger)
  - 错误文字: 12pt, #EF4444
  - 与输入框间距: 4pt

表单间距:
  - 字段之间: 16pt (CORE_SPACING.md)
  - 分组之间: 24pt (CORE_SPACING.lg)
  - 提交按钮与最后一个字段: 32pt (CORE_SPACING.xl)
```

### 9. 弹窗与底部面板 (Modals & Bottom Sheets)

```
底部面板 (Bottom Sheet):
  - 顶部圆角: 16pt — 参见 CORE_LAYOUT.bottomSheet.cornerRadius (24pt 用于大面板)
  - 拖拽指示条: 36×5pt (CORE_LAYOUT.bottomSheet.handle), 圆角 2.5pt, 居中
  - 指示条颜色: rgba(0,0,0,0.3)
  - 指示条与内容间距: 12pt
  - 内边距: 水平 16pt
  - 底部安全区: useSafeAreaInsets().bottom
  - 遮罩层: rgba(0,0,0,0.35) (Apple 标准 dimming)
  - 弹簧阻尼: CORE_ANIMATIONS.springs.appear

对话框 (Alert / Confirmation):
  - 宽度: 270pt (Apple 标准) 或 screenWidth - 48
  - 圆角: 14pt (Apple 标准)
  - 内边距: 20pt
  - 标题: Title 3 (20pt, semibold), 居中
  - 消息: Body (16pt), 居中, secondary 色 (CORE_COLORS.text.secondary)
  - 标题与消息间距: 8pt
  - 消息与按钮间距: 20pt
  - 按钮: 全宽, 44pt 高, 分割线分隔
  - 双按钮: 左取消 (regular weight) / 右确认 (semibold, 品牌色)

成功弹窗 (LiquidSuccessModal):
  - 保持现有 Liquid Glass 设计
  - 自动关闭: 2-3 秒
  - 触觉反馈: Haptics.notificationAsync(Success)
```

### 10. 搜索栏 (Search Bar)

```
高度: 36pt (Apple 标准搜索框)
圆角: 10pt
背景: rgba(142,142,147,0.12) — Apple 标准 searchBar 背景
内边距: 左 36pt (含搜索图标), 右 8pt
搜索图标: 15pt, #8E8E93
占位符文字: 15pt (Subhead), #8E8E93
取消按钮: 17pt (Body), 品牌色 (#FF6B35), 距搜索框 8pt
```

### 11. 分段控件 (Segmented Control)

```
高度: 32pt (Apple 标准)
圆角: 8pt (整体), 7pt (选中块)
字号: 13pt medium (Subhead)
选中块: 白色背景 + CORE_SHADOWS.sm
未选中: 透明背景, secondary 文字色
最小段宽: 按文字自适应, 不小于 60pt

自定义 Tab (如优惠券 Unused/Used/Expired):
  - 可使用更高的变体: 36-40pt
  - 字号: 15-16pt (Callout)
```

### 12. 图片与头像 (Images & Avatars)

```
头像尺寸:
  - 小 (列表): 32-40pt, 圆形 (CORE_BORDER_RADIUS.avatar)
  - 中 (卡片/详情): 48-56pt, 圆形
  - 大 (个人主页): 80-96pt, 圆形
  - 边框: 2pt white (在复杂背景上)

内容图片:
  - 卡片封面: 16:9 或 4:3 比例, 圆角 12pt (CORE_BORDER_RADIUS.base)
  - 详情页 Banner: 全宽, 高度 200-250pt
  - 缩略图: 固定宽高, 圆角 8pt (CORE_BORDER_RADIUS.sm)

占位 & 加载:
  - 加载中: Skeleton 占位 (与最终尺寸一致)
  - 骨架屏显示阈值: 300ms (performance.image.loadingTimeout)
  - 失败: 纯色背景 (#F3F4F6 = CORE_COLORS.background.tertiary) + 居中图标
  - 渐进加载: 先模糊后清晰 (FastImage 支持)
```

### 13. 触摸目标与可点击区域 (Touch Targets)

```
最小触摸区域: 44×44pt (Apple HIG 强制要求)
推荐触摸区域: 48×48pt (CORE_TOUCH_TARGET.minimum, WCAG 2.1 AAA)

相邻触摸目标间距: ≥8pt (CORE_SPACING.sm, 避免误触)

实现方式:
  - hitSlop: 视觉面积不够 44pt 时, 用 hitSlop 扩展
  - 例: 24pt 图标按钮 → hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}

特殊场景:
  - 卡片整体可点击时, 内部子按钮需有足够区分
  - 列表密集排列时, 行高不低于 44pt
```

### 14. 加载与空状态 (Loading & Empty States)

```
加载状态:
  - 首次加载: Skeleton Screen (骨架屏), 与内容布局匹配
  - 刷新加载: Pull-to-Refresh (原生 RefreshControl)
  - 翻页加载: 底部 ActivityIndicator, 40pt 高度
  - 操作加载: 按钮内 Spinner 替换文字

空状态:
  - 图标: 64pt, tertiary 色 (CORE_COLORS.text.tertiary)
  - 标题: Headline (17pt, semibold), 居中, 图标下方 16pt
  - 描述: Body (16pt, regular), 居中, secondary 色, 标题下方 8pt
  - 操作按钮 (可选): 标题下方 24pt, Secondary 按钮样式
  - 整体垂直居中于可用区域
```

---

### 15. 卡片变体规格矩阵

本节列出所有卡片组件的**实际样式值**，对照推荐 theme token，供后续统一迁移参考。

#### 15.1 变体对照表

| 变体 | 组件文件 | 圆角 | 内边距 | 阴影 (透明度/半径) | 背景色 | 边框 | 用途 |
|------|----------|-------------|---------|------------------------|------------|--------|------|
| 标准卡片 | `ActivityCard.tsx` | 20 (`lg`) | 16 (`md`) | 自定义 (0.15/12) | `rgba(255,255,255,0.85)` | 1.5px `rgba(255,255,255,0.8)` | 全宽详情卡片 |
| 网格卡片 | `GridActivityCard.tsx` | 16 (`card`) | 8 (信息区) | `sm` (0.06/3) | `#FFFFFF` | 无 | 瀑布流浏览 |
| 精选卡片 | `FeaturedActivityCard.tsx` | 20 | 16 (内容区) | 无 (图片主导) | `rgba(255,255,255,0.80)` 底栏 | 无 | 横向轮播 |
| 列表项 | `ActivityListItem.tsx` | 16 | 16 | 极轻 (0.03/8) | `#FFFFFF` | 1px `#f0f0f0` 仅logo | 纵向列表 |
| 紧凑卡片 | `SmallActivityCard.tsx` | 无 (透明) | 0 | 仅箭头圆 (0.08/8) | 透明 | 无 | 缩略横排 |
| 商户卡片 | `MerchantCard.tsx` | 20 | 16 | 0.08/12 | `#FFFFFF` | 1px `rgba(0,0,0,0.03)` | 商户展示 |
| 统计卡片 | `StatCard.tsx` | 16 | 16 | 0.05/8 | `#FFFFFF` / `#2C2C2E`(暗色) | 无 | 数据指标 |
| 商品卡片 | `ProductCard.tsx` | 16 | 12 | 0.08/8 | `#FFFFFF` | 无 | 积分商城 |

#### 15.2 选型决策树

```
需要展示卡片？
├── 全宽单列详情 → ActivityCard (圆角: lg=20, 阴影: 自定义)
├── 瀑布流/网格 → GridActivityCard (圆角: card=16, 阴影: sm)
├── 横向轮播精选 → FeaturedActivityCard (圆角: 20, 无独立阴影)
├── 纵向列表行 → ActivityListItem (圆角: 16, 极轻阴影)
├── 紧凑缩略 → SmallActivityCard (透明, 无容器阴影)
├── 商户/商品展示 → MerchantCard / ProductCard (圆角: 16-20)
└── 数据统计 → StatCard (圆角: 16, 轻阴影)
```

#### 15.3 规范化建议 (后续代码统一参考)

**阴影统一**：以下自定义阴影应迁移到 `CORE_SHADOWS` token：
- `ActivityCard` 阴影 (0.15/12) → 建议统一到 `CORE_SHADOWS.md` (0.08/6)，当前值偏重
- `MerchantCard` 阴影 (0.08/12) → 建议统一到 `CORE_SHADOWS.md`
- `ActivityListItem` 阴影 (0.03/8) → 建议统一到 `CORE_SHADOWS.sm` (0.06/3) 或 `xs`
- `SmallActivityCard` 箭头圆阴影 (0.08/8) → 建议统一到 `CORE_SHADOWS.sm`
- `ProductCard` 阴影 (0.08/8) → 建议统一到 `CORE_SHADOWS.sm`

**圆角统一**：
- 圆角 20pt 的卡片 (ActivityCard, FeaturedActivityCard, MerchantCard) 使用 `theme.borderRadius.lg`
- 圆角 16pt 的卡片 (GridActivityCard, ActivityListItem, StatCard, ProductCard) 使用 `theme.borderRadius.card`

---

### 16. 胶囊/药丸/徽章规格

#### 16.1 变体对照表

| 变体 | 高度 | 圆角 | 水平/垂直内边距 | 字号 | 背景色 | 文字色 | 用途 |
|------|------|------|---------------|------|--------|--------|------|
| 状态药丸 | 自适应 | 20 | 8/4 | 12 | 按状态动态 (颜色见下) | `#FFFFFF` | ActivityCard 状态标识 |
| 活动标签 | 自适应 | 8 | 6/2 | 9 | 按状态动态 (见下表) | `#FFFFFF` | GridActivityCard 右上角 |
| 筛选标签 | 44(最小) | 20 | 12/8 | 13 | L2 玻璃效果 | `#FFFFFF` | 筛选条件选中态 |
| 信息徽章 | 自适应 | 6 | 10/6 | 12 | 紫色 (积分专用) | `#FFFFFF` | 积分/数量显示 |
| 分类标签 | 自适应 | 8 | 10/4 | 10 | `rgba(0,0,0,0.6)` | `#FFFFFF` | 商户类别 |
| 奖励药丸 | 自适应 | 20 | 10/4 | 12 | `#FFF9F0` | 品牌色 `#FF6B35` | 优惠/奖励提示 |

**活动标签颜色映射** (GridActivityCard)：
- `registered`: `#10B981` (绿)
- `checked_in`: `#059669` (深绿)
- `today`: `#EF4444` (红)
- `upcoming`: `#F59E0B` (橙)

**状态药丸颜色映射** (ActivityCard)：
- `available`: `BRAND_INTERACTIONS.navigation.active.text` (品牌色)
- `registered` / `checked_in`: `theme.colors.success` (#2ED573)
- `almost_full`: `theme.colors.warning` (#FFA726)
- `full`: `theme.colors.text.secondary`
- `ended`: `theme.colors.text.disabled`

#### 16.2 与 DAWN_PILL 定义的对照

`DAWN_PILL` 定义了 3 档尺寸 (small/medium/large)，但当前组件**极少使用** DAWN_PILL token：

| DAWN_PILL 档位 | 高度 | 圆角 | 字号 | 背景色 | 边框 |
|---------------|------|------|------|--------|------|
| small | 20 | 10 | 10 | `rgba(255,107,53,0.14)` | `rgba(255,107,53,0.22)` |
| medium | 24 | 12 | 12 | `rgba(255,107,53,0.14)` | `rgba(255,107,53,0.22)` |
| large | 32 | 16 | 14 | `rgba(255,107,53,0.14)` | `rgba(255,107,53,0.22)` |

**迁移建议**：
- **状态药丸** (圆角: 20, 字号: 12) → 接近 DAWN_PILL.medium，但颜色动态变化，不适合直接迁移。保持独立实现，属合理偏差。
- **活动标签** (圆角: 8, 字号: 9) → 尺寸远小于 DAWN_PILL.small，属紧凑场景，合理偏差。
- **筛选标签** (圆角: 20, 字号: 13) → 可考虑迁移到 DAWN_PILL.large (圆角: 16, 字号: 14)，需微调。
- **奖励药丸** (圆角: 20, 字号: 12) → 尺寸匹配 DAWN_PILL.medium，但颜色体系不同 (#FFF9F0 暖底)，可扩展 DAWN_PILL 的颜色变体。

---

### 17. 输入框状态矩阵

基于 `LoginScreen.tsx` 实际实现，与 `BRAND_INTERACTIONS.form` token 对照。

#### 17.1 标准输入框规格

```
高度: 52pt (最小高度)
圆角: 12pt (CORE_BORDER_RADIUS.base)
内边距: 水平 16pt, 垂直 16pt
边框宽度: 1.5pt
```

#### 17.2 状态矩阵

| 状态 | 边框色 | 背景色 | 阴影 | 文字色 |
|------|--------|--------|------|--------|
| 默认 | `rgba(255,255,255,0.30)` | `rgba(255,255,255,0.5)` | 无 | `text.primary` (#111827) |
| 聚焦 | `#FF6B35` (品牌色) | `rgba(255,255,255,0.5)` | 橙色光晕 (0.3/8) | `text.primary` |
| 错误 | `#EF4444` (危险色) | `rgba(251,84,84,0.05)` | 无 | `text.primary` |
| 成功 | `rgba(46,213,115,0.3)` | `rgba(46,213,115,0.05)` | 无 | `text.primary` |
| 禁用 | `border.secondary` | `background.tertiary` | 无 | `text.disabled` |

#### 17.3 代码实现与 Token 定义的差异

| 状态 | 属性 | 代码实际值 | BRAND_INTERACTIONS.form token | 差异说明 |
|------|------|-----------|------------------------------|---------|
| 默认 | 背景色 | `rgba(255,255,255,0.5)` | `rgba(255,255,255,0.85)` | 代码透明度更低，视觉更轻 |
| 默认 | 边框色 | `rgba(255,255,255,0.30)` | `rgba(255,255,255,0.3)` | ✅ 一致 |
| 默认 | 文字色 | `#374151` (隐含) | `#374151` | ✅ 一致 |
| 聚焦 | 边框色 | `#FF6B35` | `rgba(255,107,53,0.22)` | 代码用实色，token 用低透明度 |
| 聚焦 | 背景色 | 同默认 | `rgba(255,255,255,0.95)` | 代码未变化背景色 |
| 聚焦 | 阴影 | `shadowColor: #FF6B35, opacity: 0.3, radius: 8` | 光晕效果 (定义模糊) | 代码实现了光晕，与 token 意图一致 |
| 错误 | 边框色 | `#EF4444` | `rgba(239,68,68,0.3)` | 代码用实色，token 用低透明度 |
| 错误 | 背景色 | `rgba(251,84,84,0.05)` | `rgba(239,68,68,0.05)` | 基本一致 (色值差 12) |

**建议**：聚焦和错误状态的边框色差异最大——代码用实色更醒目，token 用低透明度更柔和。建议统一为代码的实色方案，并更新 `BRAND_INTERACTIONS.form` token 以匹配实际视觉效果。

---

### 18. 灰度色值查找表

开发者在写样式时查找正确 token 的速查表。

#### 18.1 核心映射表

| 使用场景 | 正确 Token | 值 | 需替换的硬编码 |
|---------|-----------|---|--------------|
| 页面/卡片标题 | `text.primary` | `#111827` | `#1A1A1A`, `#000`, `#000000` |
| 副标题/描述 | `text.secondary` | `#4B5563` | `#6B7280`, `#666`, `#666666`, `#333` |
| 辅助信息/时间/地点 | `text.tertiary` | `#9CA3AF` | `#949494`, `#8E8E93`, `#909399`, `#999`, `#939393` |
| 禁用/占位 | `text.disabled` | `#D1D5DB` | `#C7C7CC`, `#CCC` |
| 主背景 | `background.primary` | `#FFFFFF` | `#fff`, `#FFF` |
| 次级背景 | `background.secondary` | `#F9FAFB` | `#FAFAFA`, `#F8F8F8`, `#F5F5F7` |
| 三级背景 | `background.tertiary` | `#F3F4F6` | `#F0F0F0`, `#F5F5F5`, `#EEE`, `#eee` |
| 浅边框 | `border.secondary` | `rgba(209,213,219,0.5)` | `#f0f0f0`, `#E0E0E0`, `#E5E7EB`, `#F5F5F5` (作为边框时) |

#### 18.2 豁免清单 (以下硬编码值属合理使用，无需替换)

| 硬编码值 | 使用位置 | 理由 |
|---------|---------|------|
| `#8E8E93` | Tab Bar 未选中态 | Apple HIG 标准 systemGray，Section 4 已规定 |
| `rgba(0,0,0,0.12)` | 列表分割线 (light mode) | Section 5 规定的标准分割线色 |
| `rgba(255,255,255,0.x)` | 图片 overlay、玻璃效果 | Liquid Glass 特效需要精确透明度控制 |
| `rgba(0,0,0,0.x)` | 渐变遮罩、阴影 | 视觉效果层，非语义色 |
| `#1A1A1A` | 仅在 overlay 上的文字 | 视觉近似 `text.primary`，但用于深色背景上时可接受 |

#### 18.3 按优先级的替换计划

```
P0 (高频+高视觉影响):
  - #666 / #666666 → text.secondary — 出现在 ActivityCard, GridActivityCard 等核心组件
  - #1A1A1A → text.primary — 出现在卡片标题、列表标题
  - #999 → text.tertiary — 出现在辅助信息

P1 (中频):
  - #909399 → text.tertiary — 出现在 ActivityListItem, SmallActivityCard
  - #949494 → text.tertiary — 出现在 SmallActivityCard organizer/meta
  - #333 → text.secondary — 出现在 GridActivityCard organizerName
  - #F0F0F0 → border.secondary — 出现在分割线、logo边框

P2 (低频/背景):
  - #F8F8F8 → background.secondary — 出现在操作按钮背景
  - #F5F5F5 → background.tertiary — 出现在箭头按钮边框
  - #000 (非overlay) → text.primary — 出现在 FeaturedActivityCard 标题
```