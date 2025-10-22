# 支付宝iOS支付集成指南

## 📋 概述

本文档说明如何在PomeloX React Native应用中集成支付宝iOS支付功能。

### 支付流程图

```
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│ 用户点击 │      │ 创建订单 │      │ 唤起支付宝│      │ 支付结果 │
│ 支付按钮 │ ---> │ 获取orderStr│ ---> │ 收银台   │ ---> │ URL回调 │
└─────────┘      └─────────┘      └─────────┘      └─────────┘
     │                │                │                │
     │                │                │                │
     v                v                v                v
  前端UI         后端API         系统跳转         前端处理
```

## 🏗️ 架构设计

### 核心文件

| 文件 | 作用 | 说明 |
|------|------|------|
| `src/services/alipayService.ts` | 支付宝支付服务 | 订单创建、支付唤起 |
| `src/utils/paymentCallback.ts` | 支付回调处理 | URL Scheme回调监听 |
| `src/types/order.ts` | 订单类型定义 | 包含orderString字段 |
| `ios/Pomelo/Info.plist` | iOS配置 | URL Scheme配置 |
| `src/examples/AlipayPaymentExample.tsx` | 集成示例 | 完整使用示例 |

### 数据流

```typescript
// 1. 前端创建订单请求
createAndPayAlipayOrder({
  itemId: 123,
  itemName: '中秋晚会',
  price: 29.99,
  orderType: OrderType.PAID_ACTIVITY,
})

// 2. 后端返回订单数据 (包含orderStr)
{
  id: 456,
  orderNo: 'ORD20250101123456',
  orderString: 'alipay_sdk=...',  // 关键字段
  ...
}

// 3. 前端唤起支付宝
alipays://platformapi/startapp?appId=20000125&orderSuffix={orderString}

// 4. 支付宝支付完成后回调
pomelox://payment?resultStatus=9000&result=...

// 5. 前端处理支付结果
if (isPaymentSuccess(result.resultStatus)) {
  // 支付成功
}
```

## 🚀 快速集成 (3步完成)

### 步骤1: 设置支付回调监听

在需要支付的页面组件中添加：

```typescript
import { useEffect } from 'react';
import { setupPaymentCallback } from '../utils/paymentCallback';
import { isPaymentSuccess, getAlipayResultMessage } from '../services/alipayService';

useEffect(() => {
  // 设置支付回调监听
  const cleanup = setupPaymentCallback((result) => {
    console.log('支付结果:', result);

    if (isPaymentSuccess(result.resultStatus)) {
      Alert.alert('支付成功', '订单支付成功');
      // TODO: 刷新订单状态、跳转页面等
    } else {
      const message = getAlipayResultMessage(result.resultStatus);
      Alert.alert('支付未完成', message);
    }
  });

  // 组件卸载时清理监听
  return cleanup;
}, []);
```

### 步骤2: 创建支付函数

```typescript
import { createAndPayAlipayOrder } from '../services/alipayService';
import { OrderType } from '../types/order';

const handlePayment = async () => {
  try {
    setLoading(true);

    // 创建订单并唤起支付宝
    const order = await createAndPayAlipayOrder({
      itemId: activity.id,          // 活动/商品ID
      itemName: activity.title,      // 活动/商品名称
      price: activity.price,         // 价格（元）
      orderType: OrderType.PAID_ACTIVITY,  // 订单类型
      addressId: 1,                  // 可选：收货地址ID
    });

    console.log('订单已创建，等待支付:', order.orderNo);
    // 此时app已跳转到支付宝，等待用户支付

  } catch (error) {
    Alert.alert('支付失败', error.message);
  } finally {
    setLoading(false);
  }
};
```

### 步骤3: 添加UI按钮

```tsx
<TouchableOpacity
  style={styles.payButton}
  onPress={handlePayment}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator color="#fff" />
  ) : (
    <Text style={styles.payButtonText}>
      ¥{activity.price.toFixed(2)} 立即支付
    </Text>
  )}
</TouchableOpacity>
```

## 📱 iOS配置说明

### Info.plist 配置

已在 `ios/Pomelo/Info.plist` 中配置：

```xml
<!-- 1. URL Scheme (用于支付宝回调) -->
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLName</key>
    <string>alipay</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>pomelox</string>
    </array>
  </dict>
</array>

<!-- 2. 白名单 (允许唤起支付宝app) -->
<key>LSApplicationQueriesSchemes</key>
<array>
  <string>alipay</string>
  <string>alipays</string>
  <string>alipayshare</string>
</array>
```

### URL Scheme 说明

- **pomelox://** - 应用自己的URL Scheme，用于接收支付回调
- **alipays://** - 支付宝客户端URL Scheme，用于唤起支付宝

## 🔧 API接口说明

### 后端API

```
POST /app/order/createOrder

请求参数:
- orderType: '1' | '2'  // 1=积分商城, 2=付费活动
- payMode: '1' | '2'    // 1=支付宝, 2=积分
- price: number         // 价格（元）
- addrId: number        // 地址ID
- num: number           // 数量
- goodsId: number       // 商品/活动ID
- remark?: string       // 备注

响应数据:
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": 456,
    "orderNo": "ORD20250101123456",
    "orderString": "alipay_sdk=...",  // ⭐ 关键字段
    ...
  }
}
```

### 前端API

#### createAndPayAlipayOrder()

创建订单并唤起支付宝（一步到位）

```typescript
import { createAndPayAlipayOrder } from '../services/alipayService';

const order = await createAndPayAlipayOrder({
  itemId: 123,              // 活动/商品ID
  itemName: '中秋晚会',      // 名称
  price: 29.99,            // 价格（元）
  orderType: OrderType.PAID_ACTIVITY,  // 订单类型
  addressId?: 1,           // 可选：地址ID
  quantity?: 1,            // 可选：数量，默认1
});
```

#### setupPaymentCallback()

设置支付回调监听

```typescript
import { setupPaymentCallback } from '../utils/paymentCallback';

const cleanup = setupPaymentCallback((result) => {
  console.log('支付结果:', result);
  // result.resultStatus: '9000' = 成功
});

// 清理监听
cleanup();
```

#### isPaymentSuccess()

检查支付是否成功

```typescript
import { isPaymentSuccess } from '../services/alipayService';

if (isPaymentSuccess(result.resultStatus)) {
  console.log('支付成功');
}
```

## 🎯 支付结果状态码

| 状态码 | 说明 | 处理建议 |
|--------|------|----------|
| 9000 | 支付成功 | 跳转成功页面 |
| 8000 | 订单处理中 | 提示用户稍后查询 |
| 4000 | 支付失败 | 提示用户重试 |
| 6001 | 用户取消支付 | 返回订单页面 |
| 6002 | 网络连接出错 | 检查网络后重试 |

## 📝 完整示例代码

参考文件: `src/examples/AlipayPaymentExample.tsx`

该文件包含3个示例:
1. **完整流程示例** - 包含UI、支付、回调处理
2. **简化组件示例** - 可复用的支付按钮组件
3. **集成指南** - 如何在现有页面中集成

## 🧪 测试步骤

### 前置条件

1. ✅ 手机已安装支付宝客户端
2. ✅ Info.plist已正确配置
3. ✅ 后端API已部署并返回orderString
4. ✅ 测试账号有可用额度

### 测试流程

```bash
# 1. 启动应用
npm run ios

# 2. 登录测试账号

# 3. 进入付费活动详情页

# 4. 点击"支付"按钮

# 5. 观察日志输出
# 应该看到:
# 💳 [Alipay] 准备唤起支付宝...
# 📱 [Alipay iOS] 支付宝已安装，正在唤起...
# ✅ [Alipay iOS] 支付宝已唤起

# 6. 在支付宝中完成支付

# 7. 自动返回app

# 8. 观察回调日志
# 应该看到:
# 🔗 [Payment Callback] 收到URL回调: pomelox://...
# ✅ [Payment Callback] 回调结果: {resultStatus: '9000'}
```

### 调试日志

关键日志标签:
- `[Alipay]` - 支付宝服务相关
- `[Payment Callback]` - 回调处理相关
- `[Order API]` - 订单API相关

## ⚠️ 常见问题

### 1. 支付宝无法唤起

**症状**: 点击支付按钮后无反应

**可能原因**:
- Info.plist未配置LSApplicationQueriesSchemes
- 手机未安装支付宝客户端

**解决方案**:
```typescript
// 检查支付宝是否已安装
const canOpen = await Linking.canOpenURL('alipays://');
if (!canOpen) {
  Alert.alert('提示', '请先安装支付宝客户端');
}
```

### 2. 支付成功但未收到回调

**症状**: 支付完成返回app，但没有弹出成功提示

**可能原因**:
- URL Scheme配置错误
- 回调监听未设置

**解决方案**:
```typescript
// 确保在useEffect中设置了回调监听
useEffect(() => {
  const cleanup = setupPaymentCallback(handleResult);
  return cleanup;
}, []);
```

### 3. orderString未返回

**症状**: 后端返回的订单数据中没有orderString字段

**可能原因**:
- 后端未配置支付宝SDK
- payMode参数错误（应该是'1'）

**解决方案**:
```typescript
// 检查订单创建参数
const order = await createAndPayAlipayOrder({
  payMode: PaymentMethod.ALIPAY,  // 必须是'1'
  orderType: OrderType.PAID_ACTIVITY,
  ...
});

// 检查后端返回
if (!order.orderString && !order.orderStr) {
  throw new Error('后端未返回支付宝订单字符串');
}
```

### 4. 回调URL格式错误

**症状**: 收到回调但参数解析失败

**解决方案**:
```typescript
// paymentCallback.ts 已处理两种格式:
// 1. pomelox://payment?resultStatus=9000&result=...
// 2. pomelox://payment#resultStatus=9000&result=...
```

## 🔒 安全注意事项

1. **❌ 前端不验证支付结果** - 仅用于UI展示
2. **✅ 后端验证** - 支付宝异步通知到后端，后端验签后更新订单
3. **✅ 查询确认** - 前端支付成功后，可调用后端API查询订单状态
4. **⚠️ 防重复提交** - 支付按钮添加loading状态，防止重复点击

```typescript
// 推荐做法: 支付成功后查询订单状态
const handlePaymentResult = async (result: AlipayResult) => {
  if (isPaymentSuccess(result.resultStatus)) {
    // ✅ 调用后端验证订单状态
    const order = await orderAPI.getOrderDetail(orderId);

    if (order.status === OrderStatus.COMPLETED) {
      Alert.alert('支付成功', '订单已确认');
    }
  }
};
```

## 📚 相关文档

- [支付宝iOS集成文档](https://opendocs.alipay.com/open/204/105295)
- [订单系统集成](./PAYMENT_INTEGRATION.md)
- [API完整文档](./API_GUIDE.md)

## 🔄 更新日志

- **2025-01-21** - 初始版本，支持iOS支付宝支付
- 待添加: Android支付宝支付支持

---

**最后更新**: 2025-01-21
**维护者**: PomeloX开发团队
