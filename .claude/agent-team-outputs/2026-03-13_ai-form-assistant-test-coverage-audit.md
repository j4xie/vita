# AI Form Assistant v46 — 测试覆盖率与潜在问题评估报告

> Agent Team Full Mode | 2026-03-13
> 3 Researchers + Analyst + Critic + Integrator

---

## Executive Summary

优先修复 SSE buffer 未 flush 的确定性 bug（影响摘要和主流程），然后处理 removeComponent 悬空引用和 FIELDS parser 偏移问题。安全类问题在当前认证架构下风险可控。关键风险：SSE 流式响应末尾数据静默丢失，可能导致 AI 回复截断或摘要压缩失败。

---

## 团队共识与分歧

| 议题 | 最终裁定 | 置信度 |
|------|----------|--------|
| **S5 SSE buffer 末尾不 flush** | **确认 — 高优先级**。L428 和 L3951 `buffer = lines.pop()` 在 `done=true` 后残留 buffer 从未处理 | ★★★★★ |
| **S6 removeComponent 空列表悬空引用** | **确认 — Medium**。L2780 `if (dl.length > 0)` 缺少 else 分支 | ★★★★☆ |
| **S8 FIELDS parser fullTagEnd 偏移** | **确认 — Medium**。L4204 `fullTagEnd` 多跳 1 字符 | ★★★☆☆ |
| **S1 renderMd 白名单含 div/span** | **降级 Critical→Medium**。白名单过宽，但 escHtml 路径已转义 bold 内容，利用需突破 AI 对齐+管理员认证 | ★★★★☆ |
| ~~S2 二阶 XSS (fieldFormName)~~ | **驳回**。renderMd L1728 对 bold 内容执行 escHtml()，漏洞不成立 | ★★★★★ |
| ~~S3 retryBtn 双重请求~~ | **驳回**。三层防护 (aiIsTyping+sendChat 守卫+disabled) 完全阻止 | ★★★★☆ |
| ~~S7 autoCompact off-by-one~~ | **驳回**。40 触发/20 守卫是有意的分层设计 | ★★★★★ |
| S4 compactHistory 并发 | **降级 High→Low**。仅手动触发，管理后台低频操作 | ★★★★☆ |

---

## 需修复的真实问题（按优先级排序）

### P0 — 立即修复

#### 1. SSE buffer 末尾数据丢失 (S5)
- **位置**: `ai-form-assistant.js` L428 (`callAIForSummary`) + L3951 (`sendChat`)
- **问题**: `while(true)` 循环在 `done=true` 后 break，`buffer` 中残留的最后一行 SSE 数据永远不处理
- **影响**: AI 回复末尾截断、摘要压缩失败走 fallback
- **修复**: 循环结束后 `if (buffer.trim()) { /* 解析最后一行 */ }`

#### 2. removeComponent 删除最后组件后悬空引用 (S6)
- **位置**: `ai-form-assistant.js` L2780-2788
- **问题**: `if (dl.length > 0)` 无 else 分支，删除最后一个组件后 `vm.activeData` 仍指向已删组件
- **影响**: 后续 prop 操作访问已删除的组件对象
- **修复**: 添加 `else { vm.activeData = null; vm.activeId = null; }`

### P1 — 本周修复

#### 3. renderMd 白名单收窄 (S1)
- **位置**: `ai-form-assistant.js` L1738
- **问题**: 白名单含 `div|span`，允许带事件属性的标签通过
- **修复**: 移除 `div|span`，仅保留 markdown 生成的标签

#### 4. FIELDS parser fullTagEnd 偏移 (S8)
- **位置**: `ai-form-assistant.js` L4204
- **问题**: `fullTagEnd = fieldsIdx + fieldsMarker.length + endIdx + 2` 多跳 1 字符
- **影响**: FIELDS 标签后紧随的文字首字符丢失
- **修复**: 需构造测试用例验证后调整偏移计算

### P2 — 低优先级改进

| 问题 | 位置 | 说明 |
|------|------|------|
| keydown 监听器无去重守卫 | L3048 | 添加类似 `_submitWatcherInstalled` 的标志 |
| setInterval 后台标签无节流 | L4398 | `if (document.hidden) return;` |
| condition 静默 fallback | L2713 | 找不到目标时 return false 而非 fallback 到 activeData |
| localStorage 二次写入静默失败 | L89-94 | 添加 console.warn + UI 状态提示 |
| placeholder 多重 setTimeout 冲突 | L2022+L2274 | 统一为单一修复机制 |
| vueInstance 陈旧引用检测 | L1787 | 除 `_isDestroyed` 外增加更多验证 |

---

## 测试覆盖率评估

| 维度 | 现状 | 评估 |
|------|------|------|
| 函数覆盖率 | ~65 个函数中约 40% 被间接覆盖 | 核心交互路径已覆盖，辅助函数大量未测 |
| 分支覆盖率 | sendChat 11 分支测 8 个，executeActions 12 case 测 ~8 个 | 正常路径好，错误/边缘路径弱 |
| 安全测试 | XSS 仅 P03/P07 两条 | renderMd 白名单、AI 响应注入完全未测 |
| 并发测试 | E05 并发保护 1 条 | compactHistory 并发、abort 路径 timer 清理未测 |
| 自学习子系统 | N04 仅 1 条 | 6 个函数几乎无覆盖 |

### 建议新增的测试用例

1. **SSE 末尾 buffer**: 模拟不以 `\n` 结尾的 SSE chunk，验证内容完整
2. **removeComponent 空列表**: 添加一个组件后删除，验证 activeData 被清空
3. **renderMd 白名单**: 输入含 `<div onclick="...">` 的文本，验证被转义
4. **FIELDS 后续文本**: 构造 `[[FIELDS:name|[...]]]后续文字`，验证"后"字不丢失
5. **sendChat abort 后 timer 清理**: 停止生成后验证 renderTimer 不再触发

---

## Open Questions

1. 后端 SSE 输出是否总以换行结尾？（决定 S5 实际触发频率）
2. FIELDS parser 偏移是否在生产中触发过？（检查日志中 `FIELDS JSON parse error`）
3. sendChat 中 abort 场景的 renderTimer 清理是否完整？
4. 自学习子系统是否被实际使用？（决定测试投入优先级）

---

### Process Note
- Mode: Full
- Researchers deployed: 3 (代码覆盖率 / 安全稳定性 / 引擎边缘案例)
- Total findings: 24 (去重后 ~18 个独立问题)
- Key disagreements: 3 resolved (S2/S3/S7 被 Critic 驳回)，1 unresolved (S8 触发频率)
- Phases completed: Research → Analysis → Critique → Integration → Heal
- Fact-check: disabled (100% codebase evidence)
- Healer: All checks passed ✅
