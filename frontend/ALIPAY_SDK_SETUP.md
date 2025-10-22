# 支付宝SDK集成 - 快速操作指南

## ✅ 已完成的工作

### 1. iOS原生代码
- ✅ **ios/Podfile** - 添加了AlipaySDK-iOS依赖
- ✅ **ios/Pomelo/RNAlipayModule.h** - 原生模块头文件
- ✅ **ios/Pomelo/RNAlipayModule.m** - 原生模块实现
- ✅ **ios/Pomelo/AppDelegate.mm** - 添加支付回调处理
- ✅ **ios/Pomelo/Info.plist** - URL Scheme配置（已有）

### 2. React Native前端
- ✅ **src/services/alipayService.ts** - 更新为SDK集成方式
- ✅ **src/types/order.ts** - 包含orderString字段（已有）

### 3. 文档
- ✅ **docs/ALIPAY_SDK_INTEGRATION.md** - 完整集成文档
- ✅ **src/examples/AlipayPaymentExample.tsx** - 使用示例（已有）

## 🚀 接下来你需要做什么

### 步骤1: 安装支付宝SDK

在终端执行：

```bash
cd /Users/jietaoxie/pomeloX/frontend/ios
pod install
cd ..
```

**预期输出**:
```
Analyzing dependencies
Downloading dependencies
Installing AlipaySDK-iOS (15.8.16)
Pod installation complete!
```

**如果遇到错误**，尝试：
```bash
cd ios
pod repo update
pod install
cd ..
```

### 步骤2: 重新构建iOS项目

```bash
npx expo prebuild --clean
```

这会重新生成iOS项目文件，确保原生模块正确链接。

### 步骤3: 在Xcode中验证（可选但推荐）

```bash
open ios/Pomelo.xcworkspace
```

在Xcode中检查：
1. **Pods** 目录下应该能看到 AlipaySDK-iOS
2. **Pomelo → 源文件** 中应该有:
   - RNAlipayModule.h
   - RNAlipayModule.m
   - AppDelegate.mm
3. **Build Phases → Link Binary** 中应该有 AlipaySDK.framework

### 步骤4: 运行和测试

```bash
npm run ios
```

或者在Xcode中:
1. 选择目标设备（真机或模拟器）
2. Product → Run (⌘R)

### 步骤5: 测试支付功能

#### 方法A: 使用已有的示例代码

参考 `src/examples/AlipayPaymentExample.tsx` 中的完整示例。

#### 方法B: 在现有页面中集成

例如在 `ActivityDetailScreen.tsx` 中添加：

```typescript
import { createAndPayAlipayOrder, isPaymentSuccess } from '../services/alipayService';
import { OrderType } from '../types/order';

const handlePayment = async () => {
  try {
    setLoading(true);

    const { order, paymentResult } = await createAndPayAlipayOrder({
      itemId: activity.id,
      itemName: activity.title,
      price: activity.price,
      orderType: OrderType.PAID_ACTIVITY,
    });

    if (isPaymentSuccess(paymentResult.resultStatus)) {
      Alert.alert('支付成功', `订单号: ${order.orderNo}`);
      // 刷新活动状态等
    } else {
      Alert.alert('支付失败', paymentResult.memo);
    }
  } catch (error: any) {
    Alert.alert('错误', error.message);
  } finally {
    setLoading(false);
  }
};
```

## 🧪 验证清单

测试前确保：

- [ ] pod install 成功完成
- [ ] npx expo prebuild --clean 成功
- [ ] Xcode可以正常编译项目（无错误）
- [ ] iOS设备/模拟器已安装支付宝客户端
- [ ] 后端API已配置并返回orderString字段

## 📱 测试流程

1. **启动应用** - `npm run ios`
2. **登录账号** - 使用测试账号登录
3. **进入付费活动** - 找到需要付费的活动
4. **点击支付** - 点击支付按钮
5. **观察日志** - 查看控制台日志输出
6. **支付宝界面** - 确认跳转到支付宝客户端
7. **完成支付** - 在支付宝中完成支付（沙箱账号）
8. **返回应用** - 自动返回PomeloX应用
9. **验证结果** - 检查支付结果提示

## 📊 日志监控

关键日志标记：

```
💳 [Alipay SDK] - 支付服务日志
📱 [Alipay iOS SDK] - iOS原生调用
💳 [RNAlipay] - 原生模块日志
📦 [Order API] - 订单API日志
```

**成功的日志流程**：
```
📦 [Alipay SDK] 创建支付宝订单...
✅ [Alipay SDK] 订单创建成功
💳 [Alipay SDK] 准备唤起支付宝...
📱 [Alipay iOS SDK] 调用原生支付模块...
💳 [RNAlipay] 开始支付宝支付...
✅ [RNAlipay] 支付宝回调: {resultStatus: "9000"}
✅ [Alipay SDK] 支付流程完成
```

## ⚠️ 常见问题快速解决

### 问题1: pod install 失败

```bash
# 解决方案
cd ios
rm -rf Pods Podfile.lock
pod repo update
pod install
cd ..
```

### 问题2: Xcode编译错误 "AlipaySDK.h not found"

```bash
# 解决方案
cd ios
pod deintegrate
pod install
cd ..
npx expo prebuild --clean
```

然后在Xcode中:
- Clean Build Folder (⌘⇧K)
- 重新编译

### 问题3: 原生模块未找到

```
❌ [Alipay SDK] 原生模块未找到
```

**原因**: 未重新构建项目

```bash
# 解决方案
npx expo prebuild --clean
npm run ios
```

### 问题4: 支付宝无法唤起

**检查清单**:
1. ✅ iOS设备已安装支付宝app
2. ✅ Info.plist配置了LSApplicationQueriesSchemes
3. ✅ orderString不为空

## 📚 详细文档

- **完整集成文档**: `docs/ALIPAY_SDK_INTEGRATION.md`
- **使用示例**: `src/examples/AlipayPaymentExample.tsx`
- **原始URL Scheme文档**: `docs/ALIPAY_INTEGRATION.md`（已废弃）

## 🎯 下一步

1. **完成步骤1-4** - 安装、构建、验证
2. **测试支付流程** - 按照测试流程操作
3. **集成到实际页面** - 在ActivityDetailScreen等页面添加支付功能
4. **后端对接** - 确保后端正确返回orderString并处理支付回调

## 💡 提示

- SDK集成方式比URL Scheme方式更稳定可靠
- 支付结果通过Promise直接返回，不需要额外的回调监听
- 建议使用沙箱环境测试，避免真实扣款
- 生产环境前务必测试完整的支付→回调→订单更新流程

---

**准备好了吗？** 从步骤1开始吧！

有任何问题，请查看 `docs/ALIPAY_SDK_INTEGRATION.md` 的常见问题部分。
