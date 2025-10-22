# 支付系统集成指南

## 📋 概述

PomeloX支持两种支付方式：
- **支付宝** (`PaymentMethod.ALIPAY`) - 用于付费活动
- **积分** (`PaymentMethod.POINTS`) - 用于积分商城

## 🎯 支付方式枚举

```typescript
import { PaymentMethod, OrderType } from '../types/order';

// 支付方式
PaymentMethod.ALIPAY = '1'  // 支付宝
PaymentMethod.POINTS = '2'  // 积分

// 订单类型
OrderType.POINTS_MALL = '1'     // 积分商城
OrderType.PAID_ACTIVITY = '2'   // 付费活动
```

## 💳 使用场景

### 场景1: 积分商城商品兑换

**使用**: 积分支付（PaymentMethod.POINTS）

```typescript
import { orderAPI } from '../services/orderAPI';
import { PaymentMethod, OrderType } from '../types/order';

// 创建积分订单
const order = await orderAPI.createOrder({
  goodsId: productId,
  quantity: 1,
  price: product.pointsPrice,      // 积分价格
  addressId: addressId,
  orderType: OrderType.POINTS_MALL,
  payMode: PaymentMethod.POINTS,   // 积分支付
});
```

**已实现**: ✅ OrderConfirmationScreen.tsx (第110-118行)

---

### 场景2: 付费活动报名

**使用**: 支付宝支付（PaymentMethod.ALIPAY）

```typescript
import { createAlipayOrder } from '../utils/paymentHelper';

// 创建支付宝订单
const order = await createAlipayOrder({
  activityId: 123,
  activityName: '中秋晚会',
  price: 29.99,                     // 人民币价格
  addressId: 1,                     // 可选
});

// 后续: 跳转支付宝支付页面
// TODO: 集成支付宝SDK或Web支付
```

**待实现**: ⏳ 需要在ActivityDetailScreen中添加

---

## 🔧 API参数说明

### createOrder 完整参数

```typescript
interface CreateOrderRequest {
  goodsId: number;        // 商品ID (积分商城) 或 活动ID (付费活动)
  quantity: number;       // 购买数量
  price: number;          // 价格 (积分或人民币)
  addressId: number;      // 收货地址ID
  orderType: OrderType;   // 订单类型
  payMode: PaymentMethod; // 支付方式
  remark?: string;        // 备注
}
```

### 后端API接口

```
POST /app/order/createOrder

Query Parameters:
- orderType: '1' | '2'  // 订单类型
- payMode: '1' | '2'    // 支付方式
- price: number         // 价格
- addrId: number        // 地址ID
- num: number           // 数量
- goodsId: number       // 商品/活动ID
- remark?: string       // 备注
```

---

## 📱 集成步骤

### 步骤1: 导入依赖

```typescript
import { orderAPI } from '../services/orderAPI';
import { PaymentMethod, OrderType } from '../types/order';
import { createAlipayOrder, createPointsOrder } from '../utils/paymentHelper';
```

### 步骤2: 选择支付方式

```typescript
// 方式A: 直接使用 orderAPI
const order = await orderAPI.createOrder({
  goodsId: itemId,
  quantity: 1,
  price: itemPrice,
  addressId: addressId,
  orderType: OrderType.PAID_ACTIVITY,
  payMode: PaymentMethod.ALIPAY,
});

// 方式B: 使用辅助函数 (推荐)
const order = await createAlipayOrder({
  activityId: 123,
  activityName: '活动名称',
  price: 29.99,
});
```

### 步骤3: 处理支付结果

```typescript
try {
  const order = await createAlipayOrder(params);

  // 支付宝支付 - 需要跳转
  if (order.orderString) {
    // TODO: 打开支付宝支付页面
    Linking.openURL(order.orderString);
  }

  // 积分支付 - 直接成功
  Alert.alert('兑换成功', '订单已创建');

} catch (error) {
  Alert.alert('支付失败', error.message);
}
```

---

## 🎯 实战示例

### 示例1: 活动详情页添加付费报名

```typescript
// src/screens/activities/ActivityDetailScreen.tsx

const handlePaidRegistration = async () => {
  try {
    // 创建支付宝订单
    const order = await createAlipayOrder({
      activityId: activity.id,
      activityName: activity.title,
      price: activity.price,
    });

    Alert.alert(
      '支付订单已创建',
      `订单号: ${order.orderNo}`,
      [
        {
          text: '去支付',
          onPress: () => {
            // TODO: 跳转支付宝
            // navigation.navigate('AlipayWebView', { orderString: order.orderString });
          },
        },
      ]
    );
  } catch (error) {
    Alert.alert('创建订单失败', error.message);
  }
};
```

### 示例2: 积分商城商品兑换 (已实现)

```typescript
// src/screens/rewards/OrderConfirmationScreen.tsx (第110-118行)

const order = await orderAPI.createOrder({
  goodsId: Number(product.id),
  quantity: 1,
  price: product.pointsPrice,
  addressId: selectedAddress.id,
  orderType: OrderType.POINTS_MALL,
  payMode: PaymentMethod.POINTS,
});
```

---

## ⚠️ 重要注意事项

### 1. 积分商城 vs 付费活动

- **积分商城**: 只能使用积分支付
- **付费活动**: 只能使用支付宝支付
- **不支持混合支付**

### 2. 支付宝集成 (TODO)

当前代码已准备好订单创建流程，但**支付宝SDK集成待完成**：

```typescript
// TODO: 需要集成支付宝SDK
// 1. 安装 react-native-alipay 或使用WebView
// 2. 获取后端返回的 orderString
// 3. 调用支付宝支付
// 4. 处理支付回调
```

### 3. 地址要求

- **积分商城**: 必须提供收货地址
- **付费活动**: 地址可选（视活动类型而定）

### 4. 价格类型

- **积分**: 整数，单位是积分点数
- **支付宝**: 浮点数，单位是人民币元

---

## 📚 相关文件

| 文件 | 说明 |
|------|------|
| `src/types/order.ts` | 订单类型定义、支付方式枚举 |
| `src/services/orderAPI.ts` | 订单API服务 |
| `src/utils/paymentHelper.ts` | 支付辅助工具 |
| `src/screens/rewards/OrderConfirmationScreen.tsx` | 积分商城订单确认页 |

---

## 🔜 待办事项

- [ ] 集成支付宝SDK
- [ ] 创建支付宝WebView支付页面
- [ ] 在ActivityDetailScreen添加付费报名入口
- [ ] 处理支付回调和订单状态更新
- [ ] 添加支付记录查询功能

---

**最后更新**: 2025-10-21
