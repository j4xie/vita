# 审批系统 — 缺失接口补充需求

> 更新日期：2026-04-04
> 背景：对比设计方案与测试环境已实现接口，以下为仍需补充的接口

---

## 一、待审批数量接口（高优先级）

**用途**：App Tab Bar 红点/Badge + 审批首页 Tab 角标

```
GET /app/approval/pending/count
```

**请求头**：`Authorization: Bearer {token}`

**响应**：
```json
{
  "code": 200,
  "data": {
    "pendingApproval": 3,
    "pendingSubmit": 1,
    "pendingCc": 2
  }
}
```

| 字段 | 说明 |
|------|------|
| pendingApproval | 待我审批的数量 |
| pendingSubmit | 我发起的、仍在处理中的数量 |
| pendingCc | 抄送我的未读数量 |

**建议**：调用频率高，建议 Redis 缓存，审批状态变更时清除缓存。

---

## 二、催办接口（中优先级）

**用途**：发起人催促当前审批人尽快处理

```
POST /app/approval/urge
```

**请求体**：
```json
{
  "instanceId": 123
}
```

**响应**：
```json
{
  "code": 200,
  "msg": "催办成功"
}
```

**业务规则**：
- 仅发起人可催办
- 仅 `pending` / `processing` 状态可催办
- 同一审批每天最多催办 3 次
- 催办后向当前节点审批人发通知

---

## 三、审批统计接口（低优先级 — Phase 3）

**用途**：管理员审批效率看板

```
GET /app/approval/stats?startDate=2026-01-01&endDate=2026-04-04
```

**响应**：
```json
{
  "code": 200,
  "data": {
    "total": 150,
    "approved": 120,
    "rejected": 15,
    "pending": 10,
    "withdrawn": 5,
    "avgProcessTimeHours": 4.5,
    "byTemplate": [
      {
        "templateId": 1,
        "templateName": "活动审批",
        "count": 80,
        "approved": 70,
        "rejected": 5,
        "pending": 5
      }
    ]
  }
}
```

**权限**：仅 `manage` 角色

---

## 四、汇率自动拉取（中优先级）

**当前**：后台手动配置（1 USD = 6.9134 RMB）

**建议**：添加定时任务，每天自动更新

### 推荐免费汇率 API

| API | 免费额度 | 需要密钥 | 稳定性 |
|-----|---------|---------|--------|
| `https://open.er-api.com/v6/latest/USD` | 无限制 | 不需要 | ⭐⭐⭐⭐ |
| `https://api.exchangerate.host/latest?base=USD&symbols=CNY` | 无限制 | 不需要 | ⭐⭐⭐⭐⭐ |
| `https://api.exchangerate-api.com/v4/latest/USD` | 1500次/月 | 不需要 | ⭐⭐⭐⭐ |

### 实现方式

```java
// 方案A: Spring @Scheduled 定时任务（推荐）
@Scheduled(cron = "0 0 9 * * ?")  // 每天早上9点
public void autoUpdateExchangeRate() {
    String url = "https://open.er-api.com/v6/latest/USD";
    Double cnyRate = restTemplate.getForObject(url, Map.class)
        .get("rates").get("CNY");
    // 更新 sys_config 表
    sysConfigService.updateConfigByKey("exchange.rate.usd.cny", 
        String.valueOf(cnyRate));
}
```

```java
// 方案B: 也可以在现有汇率查询接口中加一个兜底逻辑
// 如果 sys_config 中的汇率超过24小时未更新，自动去拉取最新的
```

---

## 五、现有接口优化建议（可选）

### 5.1 审批操作后返回最新数据
审批通过/拒绝后，响应中直接返回更新后的审批详情，减少一次额外请求。

### 5.2 提交评论接口
开发者提到"最后一个接口暂缓"，前端可先做 UI，等接口好了对接。

---

## 优先级总结

| 接口 | 优先级 | 阶段 | 前端依赖程度 |
|------|--------|------|-------------|
| 待审批数量 | ⭐⭐⭐⭐⭐ | Phase 1 | 阻塞 Tab Badge |
| 催办 | ⭐⭐⭐ | Phase 2 | 不阻塞 |
| 汇率自动拉取 | ⭐⭐⭐ | Phase 2 | 不阻塞（手动可用） |
| 审批统计 | ⭐⭐ | Phase 3 | 不阻塞 |
| 提交评论 | ⭐⭐⭐ | Phase 1 | 可先做 UI |
