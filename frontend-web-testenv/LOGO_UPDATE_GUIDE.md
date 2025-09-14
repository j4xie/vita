# PomeloX Logo更换指南

## 📱 需要替换的文件

请将新的柚子logo图片保存为以下文件名和尺寸：

### 1. 应用图标 (App Icons)
- `assets/icon.png` - 1024x1024px - 主应用图标
- `assets/adaptive-icon.png` - 1024x1024px - Android自适应图标
- `assets/splash-icon.png` - 512x512px - 启动屏图标
- `assets/favicon.png` - 32x32px - Web图标

### 2. 应用内Logo (In-App Logos)
- `assets/logos/pomelo-logo.png` - 512x512px - 登录/注册页面主Logo
- `assets/logos/pomelo-logo-small.png` - 128x128px - 小尺寸版本
- `assets/logos/pomelo-logo-white.png` - 512x512px - 白色/透明版本

## 🎨 图片规格要求

### Logo特征描述
- **背景**: 橙色渐变 (#FF6B35 → #FF4757)
- **主图案**: 白色柚子分瓣图案
- **装饰**: 右上角绿色叶子
- **风格**: 现代扁平化设计

### 技术规格
- **格式**: PNG (保持透明背景支持)
- **圆角**: 应用图标需要iOS标准圆角 (约22% radius)
- **分辨率**: 高分辨率，适配Retina显示
- **压缩**: 优化文件大小但保持质量

## 📋 操作步骤

### 第1步: 准备图片文件
1. 从原始logo创建不同尺寸版本
2. 确保所有版本视觉一致
3. 为应用图标添加适当圆角

### 第2步: 替换文件
```bash
# 直接替换现有文件，保持文件名不变
cp 新logo文件 assets/icon.png
cp 新logo文件 assets/adaptive-icon.png  
cp 新logo文件 assets/splash-icon.png
cp 新logo文件 assets/favicon.png
cp 新logo文件 assets/logos/pomelo-logo.png
cp 新logo文件 assets/logos/pomelo-logo-small.png
cp 新logo文件 assets/logos/pomelo-logo-white.png
```

### 第3步: 验证更新
- 重新启动应用查看启动屏
- 检查登录页面logo显示
- 检查注册页面logo显示
- 验证应用图标更新

## ✅ 完成后效果

替换完成后，应用将在以下位置显示新的PomeloX柚子logo：
- 📱 手机桌面的应用图标
- 🚀 应用启动屏
- 🔐 登录页面顶部
- 📝 注册选择页面顶部

## 注意事项

- 保持现有文件名，代码无需修改
- 确保图片质量适配不同屏幕密度
- 测试在不同设备上的显示效果