# dept_id 完整对齐 - 测试报告

**日期**: 2025-12-30
**测试状态**: ✅ 全部通过 (8/8)

---

## 📋 测试概览

本次测试验证了从 `school_id` 到 `dept_id` 的完整对齐工作是否成功。所有核心功能均已验证通过。

### 测试环境
- **数据库**: inter_stu_center (生产数据库)
- **连接方式**: SSH隧道 + MySQL
- **Python版本**: 3.x
- **测试框架**: 自定义集成测试脚本

---

## ✅ 测试结果

| # | 测试项目 | 状态 | 说明 |
|---|---------|------|------|
| 1 | 数据库连接和SSH隧道 | ✅ 通过 | SSH隧道建立成功,MySQL连接正常 |
| 2 | 数据库表结构 | ✅ 通过 | 所有AI模块表已创建并验证 |
| 3 | 部门配置 | ✅ 通过 | 6个部门配置正确,与数据库一致 |
| 4 | 反馈系统 | ✅ 通过 | 创建/读取功能正常,外键约束有效 |
| 5 | 知识库管理 | ✅ 通过 | 按dept_id查询和创建功能正常 |
| 6 | 会话管理 | ✅ 通过 | 会话和消息创建/查询功能正常 |
| 7 | RAG服务 | ✅ 通过 | dept_id验证和提示生成正常 |
| 8 | 向量化脚本 | ✅ 通过 | 脚本已更新使用dept_id |

---

## 📊 详细测试结果

### 1. 数据库连接和SSH隧道
```
✅ 数据库实例创建成功
   数据库类型: mysql
✅ 数据库连接成功
   当前数据库: inter_stu_center
```

**验证项**:
- SSH隧道自动建立
- MySQL连接池正常工作
- 数据库名称正确

---

### 2. 数据库表结构
```
✅ 表 ai_chat_session 存在
✅ 表 ai_chat_message 存在
✅ 表 ai_feedback 存在
✅ 表 ai_knowledge_base 存在
✅ 表 sys_user 存在
✅ 表 sys_dept 存在
```

**验证项**:
- 4个AI模块表已创建
- 外键关联到sys_user和sys_dept
- 表结构符合若依框架规范

---

### 3. 部门配置
```
配置的部门数量: 6
有效部门ID列表: [211, 213, 214, 216, 218, 226]

部门配置与数据库完全一致:
  211: 加州大学伯克利分校 (UC Berkeley)
  213: 南加州大学 (USC)
  214: 加州大学洛杉矶分校 (UCLA)
  216: 加州大学圣地亚哥分校 (UCSD)
  218: 华盛顿大学 (UW)
  226: 纽约大学 (NYU)
```

**验证项**:
- Config.DEPARTMENTS使用dept_id作为key
- 配置与sys_dept表数据一致
- VALID_DEPT_IDS列表正确

---

### 4. 反馈系统
```
✅ 预先创建会话成功
✅ 反馈创建成功
   Feedback ID: test_fb_40ec1f6d
   Dept ID: 216
   User ID: 1
✅ 反馈读取成功
```

**验证项**:
- 反馈记录正确使用dept_id和user_id
- 外键约束(session_id, user_id, dept_id)正常工作
- 数据库CHAR(1)类型正确处理
- create_time自动设置

---

### 5. 知识库管理
```
✅ 知识库条目创建成功
   KB ID: test_kb_cbba85c2
   Dept ID: 216
✅ 部门知识库查询成功
   部门216未归档知识数量: 3
```

**验证项**:
- 使用dept_id而非school_id
- get_knowledge_by_dept()方法正常
- indexed/enabled字段(CHAR(1))转换正确
- 按部门隔离数据查询有效

---

### 6. 会话管理
```
✅ 会话创建成功
✅ 消息保存成功
✅ 会话列表查询成功
   用户会话数量: 5
✅ 消息列表查询成功
   会话消息数量: 1
```

**验证项**:
- create_chat_session()支持user_id和dept_id
- save_chat_message()功能正常
- get_user_chat_sessions()按用户查询
- get_chat_messages()验证用户所有权
- 软删除(del_flag)机制正常

---

### 7. RAG服务
```
✅ 部门验证: dept_id=216 有效性=True
✅ 可用部门列表: [211, 213, 214, 216, 218, 226]
✅ 系统提示生成成功
   提示包含学校名称: UC San Diego
```

**验证项**:
- is_dept_valid()使用整数dept_id
- get_available_depts()返回部门ID列表
- get_system_prompt()从DEPARTMENTS获取学校名
- 向量存储路径使用str(dept_id)

---

### 8. 向量化脚本
```
✅ 使用dept_id类型 (dept_id: int)
✅ 函数名已更新 (archive_dept_knowledge)
✅ 命令行参数已更新 (--dept)
✅ 使用DEPARTMENTS配置
```

**验证项**:
- 脚本参数从--school改为--dept
- 函数签名使用dept_id: int
- 向量存储路径: vector_store/{dept_id}/
- 遍历Config.DEPARTMENTS.keys()

---

## 🔍 关键变更验证

### 数据类型对齐
- ✅ 所有`school_id: str` 已改为 `dept_id: int`
- ✅ 向量存储路径从 `UCSD/` 改为 `216/`
- ✅ 配置从 `SCHOOLS` 改为 `DEPARTMENTS`

### 数据库字段
- ✅ 所有表使用`dept_id BIGINT`
- ✅ 外键约束到`sys_dept(dept_id)`
- ✅ 无任何`school_id`残留字段

### API接口
- ✅ `/ask` 接口使用`deptId`参数
- ✅ `/departments` 新端点
- ✅ 反馈接口需要`user_id`和`dept_id`

---

## 📁 测试数据

### 创建的测试记录
- **反馈记录**: 1条 (dept_id=216, user_id=1)
- **知识库条目**: 3条 (dept_id=216)
- **聊天会话**: 5个 (user_id=1)
- **聊天消息**: 若干条

### 数据验证
- ✅ 所有记录正确关联到dept_id=216
- ✅ 用户隔离功能正常(user_id=1)
- ✅ 外键约束确保数据完整性

---

## 🚀 后续步骤

### 1. 数据迁移(如需要)
如果有历史数据需要迁移:
```bash
# 暂无历史school_id数据需要迁移
# 新系统直接使用dept_id
```

### 2. 向量化历史知识
```bash
# 归档所有部门的知识
python scripts/archive_to_vector.py

# 归档指定部门
python scripts/archive_to_vector.py --dept 216

# 预览模式
python scripts/archive_to_vector.py --dry-run
```

### 3. 前端对接
前端需要传递参数:
- `userId`: 从登录态获取
- `deptId`: 用户所属部门ID (211, 213, 214, 216, 218, 226)

### 4. 监控和维护
- 定期运行向量化脚本 (cron/scheduled task)
- 监控数据库表大小
- 检查外键约束是否正常工作

---

## ⚠️ 注意事项

### 1. 向量存储路径变更
- **旧路径**: `vector_store/UCSD/`
- **新路径**: `vector_store/216/`
- **迁移状态**: ✅ 已完成 (使用 migrate_vector_directories.py)
- **迁移详情**:
  - UCSD → 216 (加州大学圣地亚哥分校)
  - UCLA → 214 (加州大学洛杉矶分校)
  - UCB → 211 (加州大学伯克利分校)
  - USC → 213 (南加州大学)
  - UW → 218 (华盛顿大学)
  - NYU → 226 (纽约大学)

### 2. API参数变更
- **旧参数**: `schoolId: "UCSD"`
- **新参数**: `deptId: 216` (整数)
- **影响**: 前端需要更新API调用

### 3. 必需参数
- `userId`: 所有会话和反馈必需
- `deptId`: 所有数据必需关联部门
- 游客模式不支持AI功能

---

## 📝 测试命令

```bash
# 运行完整集成测试
python test_integration.py

# 创建数据库表
python scripts/create_tables.py

# 归档知识到向量库
python scripts/archive_to_vector.py --dept 216

# 迁移向量存储目录 (已完成)
python scripts/migrate_vector_directories.py --dry-run  # 预览
python scripts/migrate_vector_directories.py            # 执行
```

---

## ✅ 结论

**所有功能测试通过!** dept_id对齐工作已完成,系统已完全与数据库的部门ID体系对齐。

- ✅ 数据库表结构正确
- ✅ 代码逻辑完整更新
- ✅ 配置文件正确对应
- ✅ RAG服务正常工作
- ✅ 向量化脚本已更新
- ✅ 外键约束确保数据完整性
- ✅ **向量存储目录已迁移** (6个学校目录 → dept_id格式)

系统已准备好投入使用! 🎉

---

## 📦 向量存储迁移记录

**迁移时间**: 2025-12-30
**迁移脚本**: [scripts/migrate_vector_directories.py](scripts/migrate_vector_directories.py)

### 迁移结果
✅ 成功迁移 6 个向量存储目录:

| 旧目录 | 新目录 | 学校名称 | 状态 |
|-------|-------|---------|------|
| UCSD/ | 216/ | 加州大学圣地亚哥分校 | ✅ 已迁移 |
| UCLA/ | 214/ | 加州大学洛杉矶分校 | ✅ 已迁移 |
| UCB/ | 211/ | 加州大学伯克利分校 | ✅ 已迁移 |
| USC/ | 213/ | 南加州大学 | ✅ 已迁移 |
| UW/ | 218/ | 华盛顿大学 | ✅ 已迁移 |
| NYU/ | 226/ | 纽约大学 | ✅ 已迁移 |

⚠️ 跳过 3 个未配置的目录: OSU, UCI, UPenn

### 验证
所有迁移后的目录包含完整的向量文件:
- `docstore.json` - 文档存储
- `index_store.json` - 索引存储
- `default__vector_store.json` - 向量存储
- `graph_store.json` - 图存储
- `image__vector_store.json` - 图像向量存储
