# 支付宝SDK集成完整指南

## 📋 概述

本文档说明如何在PomeloX React Native应用中集成支付宝iOS SDK进行支付。

### SDK集成 vs URL Scheme

| 特性 | SDK集成 | URL Scheme |
|------|---------|------------|
| 集成难度 | ⭐⭐⭐⭐ 较复杂 | ⭐⭐ 简单 |
| 支付稳定性 | ⭐⭐⭐⭐⭐ 非常稳定 | ⭐⭐⭐ 一般 |
| 功能支持 | ✅ 完整功能 | ⚠️ 基础功能 |
| 错误处理 | ✅ 详细错误信息 | ⚠️ 有限 |
| SDK大小 | ~3MB | 0KB |
| 适用场景 | 生产环境 | 快速原型 |

**推荐**: 生产环境使用SDK集成方式。

## 🏗️ 架构设计

### 技术栈

```
┌─────────────────────────────────────────┐
│         React Native (JavaScript)       │
├─────────────────────────────────────────┤
│     RNAlipayModule (Native Bridge)      │
├─────────────────────────────────────────┤
│        AlipaySDK (Native iOS)          │
├─────────────────────────────────────────┤
│      支付宝客户端 or H5 WebView          │
└─────────────────────────────────────────┘
```

### 文件结构

```
frontend/
├── ios/
│   ├── Podfile                          # ✅ 添加AlipaySDK依赖
│   └── Pomelo/
│       ├── RNAlipayModule.h            # ✅ 原生模块头文件
│       ├── RNAlipayModule.m            # ✅ 原生模块实现
│       ├── AppDelegate.mm              # ✅ 处理支付回调
│       └── Info.plist                  # ✅ URL Scheme配置
└── src/
    └── services/
        └── alipayService.ts            # ✅ 前端服务
```

## 🚀 快速开始

### 步骤1: 安装依赖

```bash
cd /Users/jietaoxie/pomeloX/frontend/ios
pod install
```

输出应该包含:
```
Installing AlipaySDK-iOS (15.8.16)
```

### 步骤2: 重新构建项目

```bash
cd /Users/jietaoxie/pomeloX/frontend
npx expo prebuild --clean
```

### 步骤3: 在代码中使用

```typescript
import { createAndPayAlipayOrder, isPaymentSuccess } from '../services/alipayService';
import { OrderType } from '../types/order';

// 创建订单并支付
const { order, paymentResult } = await createAndPayAlipayOrder({
  itemId: 123,
  itemName: '中秋晚会',
  price: 29.99,
  orderType: OrderType.PAID_ACTIVITY,
});

// 检查支付结果
if (isPaymentSuccess(paymentResult.resultStatus)) {
  Alert.alert('支付成功', `订单号: ${order.orderNo}`);
} else {
  Alert.alert('支付失败', paymentResult.memo);
}
```

## 📱 完整使用示例

### 示例1: 基础支付流程

```typescript
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { createAndPayAlipayOrder, isPaymentSuccess } from '../services/alipayService';
import { OrderType } from '../types/order';

export const PaymentExample: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // 创建订单并唤起支付宝
      const { order, paymentResult } = await createAndPayAlipayOrder({
        itemId: 123,
        itemName: '中秋晚会报名',
        price: 29.99,
        orderType: OrderType.PAID_ACTIVITY,
      });

      // 检查支付结果
      if (isPaymentSuccess(paymentResult.resultStatus)) {
        Alert.alert('支付成功', `订单号: ${order.orderNo}\n恭喜您报名成功！`);
      } else {
        Alert.alert('支付失败', paymentResult.memo || '支付未完成');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity onPress={handlePayment} disabled={loading}>
      {loading ? <ActivityIndicator /> : <Text>支付 ¥29.99</Text>}
    </TouchableOpacity>
  );
};
```

### 示例2: 带事件监听的支付（可选）

```typescript
import React, { useEffect, useState } from 'react';
import { addPaymentResultListener, payWithAlipay } from '../services/alipayService';

export const PaymentWithListener: React.FC = () => {
  useEffect(() => {
    // 添加支付结果监听器（备用方案）
    const removeListener = addPaymentResultListener((result) => {
      console.log('支付结果事件:', result);
      // 处理支付结果
    });

    return removeListener; // 组件卸载时清理
  }, []);

  const handlePay = async () => {
    // 直接调用支付（不等待结果）
    await payWithAlipay(orderString);
    // 结果会通过事件监听器接收
  };

  return <TouchableOpacity onPress={handlePay}>...</TouchableOpacity>;
};
```

### 示例3: 获取SDK版本（调试用）

```typescript
import { getAlipaySDKVersion } from '../services/alipayService';

const checkSDK = async () => {
  const version = await getAlipaySDKVersion();
  console.log('支付宝SDK版本:', version);
  // 输出: "15.8.16"
};
```

## 🔧 API参考

### createAndPayAlipayOrder()

创建订单并唤起支付宝，等待支付结果。

```typescript
const { order, paymentResult } = await createAndPayAlipayOrder({
  itemId: number;          // 活动/商品ID
  itemName: string;        // 名称
  price: number;           // 价格（元）
  orderType: OrderType;    // 订单类型
  addressId?: number;      // 可选：地址ID
  quantity?: number;       // 可选：数量，默认1
});
```

**返回值**:
```typescript
{
  order: Order;            // 订单信息
  paymentResult: {
    resultStatus: string;  // 状态码
    result?: string;       // 详细结果
    memo?: string;         // 备注信息
  }
}
```

### payWithAlipay()

直接唤起支付宝支付（需要先创建订单）。

```typescript
const result = await payWithAlipay(
  orderString: string,     // 订单字符串（从后端获取）
  scheme?: string          // 可选：URL Scheme，默认"pomelox"
);
```

### isPaymentSuccess()

检查支付是否成功。

```typescript
const success = isPaymentSuccess(resultStatus: string);
```

### 支付结果状态码

| 状态码 | 常量 | 说明 | 处理建议 |
|--------|------|------|----------|
| 9000 | AlipayResultStatus.SUCCESS | 支付成功 | 跳转成功页面 |
| 8000 | AlipayResultStatus.PROCESSING | 处理中 | 提示用户稍后查询 |
| 4000 | AlipayResultStatus.FAILED | 支付失败 | 提示重试 |
| 6001 | AlipayResultStatus.CANCELLED | 用户取消 | 返回订单页 |
| 6002 | AlipayResultStatus.NETWORK_ERROR | 网络错误 | 检查网络 |

## 🧪 测试步骤

### 前置条件

1. ✅ iOS设备已安装支付宝客户端
2. ✅ 已运行 `pod install`
3. ✅ 已重新构建项目
4. ✅ 后端API已配置并返回orderString

### 测试流程

```bash
# 1. 安装依赖
cd ios && pod install && cd ..

# 2. 重新构建
npx expo prebuild --clean

# 3. 启动应用
npm run ios

# 4. 测试支付流程
# - 进入付费活动详情页
# - 点击"支付"按钮
# - 观察日志输出
# - 在支付宝中完成支付
# - 验证支付结果
```

### 关键日志

成功的日志输出应该类似：

```
💳 [Alipay SDK] 准备唤起支付宝...
📱 [Alipay iOS SDK] 调用原生支付模块...
💳 [RNAlipay] 开始支付宝支付...
✅ [RNAlipay] 支付宝回调: {resultStatus: "9000", ...}
✅ [Alipay iOS SDK] 支付结果: {resultStatus: "9000"}
✅ [Alipay SDK] 支付流程完成
```

## 📝 原生代码说明

### RNAlipayModule.h

定义React Native桥接模块接口。

```objective-c
@interface RNAlipayModule : RCTEventEmitter <RCTBridgeModule>
+ (BOOL)handleOpenURL:(NSURL *)url;
@end
```

### RNAlipayModule.m

实现支付功能和事件发送。

**核心方法**:
- `pay:scheme:` - 调用支付宝SDK发起支付
- `getVersion:` - 获取SDK版本
- `handleOpenURL:` - 处理支付回调URL

**关键代码**:
```objective-c
RCT_EXPORT_METHOD(pay:(NSString *)orderString
                  scheme:(NSString *)scheme
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  [[AlipaySDK defaultService] payOrder:orderString
                            fromScheme:scheme
                              callback:^(NSDictionary *resultDic) {
    // 发送事件
    [self sendEventWithName:@"AlipayPaymentResult" body:resultDic];
    // 返回Promise
    resolve(resultDic);
  }];
}
```

### AppDelegate.mm

处理URL回调并转发给原生模块。

```objective-c
- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  // 处理支付宝回调
  if ([RNAlipayModule handleOpenURL:url]) {
    return YES;
  }

  return [super application:application openURL:url options:options] ||
         [RCTLinkingManager application:application openURL:url options:options];
}
```

## ⚠️ 常见问题

### 1. pod install 失败

**症状**:
```
[!] Unable to find a specification for `AlipaySDK-iOS`
```

**解决方案**:
```bash
pod repo update
pod install
```

### 2. 原生模块未找到

**症状**:
```
❌ [Alipay SDK] 原生模块未找到
```

**可能原因**:
- Podfile未正确配置
- 未运行 `pod install`
- 未重新构建项目

**解决方案**:
```bash
cd ios
pod install
cd ..
npx expo prebuild --clean
npm run ios
```

### 3. Xcode编译错误

**症状**:
```
'AlipaySDK/AlipaySDK.h' file not found
```

**解决方案**:
1. 打开 `ios/Pomelo.xcworkspace` (注意是.xcworkspace，不是.xcodeproj)
2. Clean Build Folder: Product → Clean Build Folder
3. 重新编译

### 4. 支付后无回调

**症状**: 支付完成返回app，但没有收到结果

**可能原因**:
- URL Scheme配置错误
- AppDelegate未正确处理回调

**检查清单**:
- ✅ Info.plist中配置了`pomelox`scheme
- ✅ AppDelegate.mm导入了`RNAlipayModule.h`
- ✅ openURL方法调用了`[RNAlipayModule handleOpenURL:url]`

### 5. Promise一直不resolve

**症状**: await payWithAlipay() 一直等待

**原因**: 用户在支付宝中取消了支付，但没有返回app

**解决方案**: 添加超时处理
```typescript
const paymentPromise = createAndPayAlipayOrder(params);
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('支付超时')), 5 * 60 * 1000)
);

try {
  const result = await Promise.race([paymentPromise, timeoutPromise]);
} catch (error) {
  // 处理超时或错误
}
```

## 🔒 安全注意事项

### 1. 前端验证仅用于UI

```typescript
// ❌ 错误 - 前端验证作为最终判断
if (isPaymentSuccess(result.resultStatus)) {
  // 直接发放商品 - 不安全！
  unlockPremiumFeature();
}

// ✅ 正确 - 前端仅用于UI提示
if (isPaymentSuccess(result.resultStatus)) {
  Alert.alert('支付成功', '订单处理中...');
  // 等待后端异步通知确认
  await pollOrderStatus(order.id);
}
```

### 2. 后端验签

后端必须验证支付宝的异步通知签名：

```python
# 后端示例 (FastAPI)
from alipay import AliPay

@app.post("/alipay/notify")
async def alipay_notify(request: Request):
    data = await request.form()

    # 验证签名
    is_valid = alipay.verify(data, data["sign"])

    if is_valid:
        # 更新订单状态
        update_order_status(data["out_trade_no"], "paid")
        return "success"

    return "fail"
```

### 3. 防重复支付

```typescript
// 添加支付中状态
const [isPaying, setIsPaying] = useState(false);

const handlePay = async () => {
  if (isPaying) {
    Alert.alert('提示', '支付正在处理中，请勿重复点击');
    return;
  }

  setIsPaying(true);
  try {
    await createAndPayAlipayOrder(params);
  } finally {
    setIsPaying(false);
  }
};
```

## 📚 参考资源

- [支付宝iOS SDK官方文档](https://opendocs.alipay.com/open/204/105295)
- [React Native原生模块文档](https://reactnative.dev/docs/native-modules-ios)
- [CocoaPods官方网站](https://cocoapods.org/)

## 🔄 更新日志

- **2025-01-21** - 完成SDK集成方案，支持iOS平台
- **待添加** - Android平台支持

---

**最后更新**: 2025-01-21
**维护者**: PomeloX开发团队
