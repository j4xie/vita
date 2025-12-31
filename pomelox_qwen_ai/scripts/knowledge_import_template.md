# Excel知识库导入模板说明

## 📋 Excel格式要求

创建Excel文件(.xlsx),包含以下列:

| 问题 | 答案 | 分类 | 质量分数 |
|------|------|------|---------|
| 如何申请宿舍? | 新生可以通过学校官网housing portal申请宿舍... | 校园生活 | 0.9 |
| 图书馆开放时间? | 图书馆周一至周五8:00-22:00开放,周末9:00-18:00 | 校园服务 | 0.85 |

### 列名说明

支持中英文列名(任选其一即可):

| 中文列名 | 英文列名 | 是否必需 | 说明 |
|---------|---------|---------|------|
| 问题 | Question | ✅ 必需 | 学生可能提出的问题 |
| 答案 | Answer | ✅ 必需 | 对应的详细答案 |
| 分类 | Category | ⭕ 可选 | 知识分类(如"校园生活"、"学术"、"住宿") |
| 质量分数 | Quality Score | ⭕ 可选 | 0.0-1.0之间,默认0.7 |

### 质量分数参考

- **0.9-1.0**: 官方权威信息,非常准确
- **0.7-0.9**: 经验总结,较为准确
- **0.5-0.7**: 一般性建议
- **< 0.5**: 不建议导入

## 🚀 使用方法

### 1. 准备Excel文件

创建Excel文件,例如 `UCSD新知识.xlsx`:

```
问题 | 答案 | 分类 | 质量分数
如何申请I-20? | I-20申请流程:1. 登录portal... | 国际学生 | 0.95
选课截止时间? | 每学期选课截止日期为... | 学术 | 0.9
```

### 2. 预览导入(推荐)

先预览,确认数据正确:

```bash
python scripts/import_knowledge_from_excel.py --file UCSD新知识.xlsx --dept 216 --dry-run
```

### 3. 正式导入

确认无误后正式导入:

```bash
# 仅导入到数据库
python scripts/import_knowledge_from_excel.py --file UCSD新知识.xlsx --dept 216

# 导入并自动归档到向量库(推荐)
python scripts/import_knowledge_from_excel.py --file UCSD新知识.xlsx --dept 216 --archive
```

### 4. 手动归档(如未使用--archive)

如果导入时没有使用`--archive`,需要手动归档:

```bash
python scripts/archive_to_vector.py --dept 216
```

## 📊 部门ID对照表

| 部门ID | 学校名称 | 英文缩写 |
|-------|---------|---------|
| 211 | 加州大学伯克利分校 | UC Berkeley |
| 213 | 南加州大学 | USC |
| 214 | 加州大学洛杉矶分校 | UCLA |
| 216 | 加州大学圣地亚哥分校 | UCSD |
| 218 | 华盛顿大学 | UW |
| 226 | 纽约大学 | NYU |

## ⚠️ 注意事项

1. **编码格式**: Excel保存时使用UTF-8编码
2. **空行处理**: 问题或答案为空的行会自动跳过
3. **去重**: 相同问题会被重复导入,建议先检查数据库
4. **质量控制**: 建议人工审核后再批量导入
5. **分类一致**: 同一学校的分类名称保持一致(如都用"校园生活"或都用"Campus Life")

## 📝 示例工作流

### 场景1: 新学校上线,批量导入基础知识

```bash
# 1. 准备Excel: NYU基础知识.xlsx (200条)
# 2. 预览
python scripts/import_knowledge_from_excel.py --file NYU基础知识.xlsx --dept 226 --dry-run

# 3. 确认无误,导入并归档
python scripts/import_knowledge_from_excel.py --file NYU基础知识.xlsx --dept 226 --archive

# 4. 验证
python test_vector_migration.py  # 测试检索
```

### 场景2: 更新现有知识

```bash
# 1. 准备更新内容: UCSD更新202501.xlsx (50条)
# 2. 导入(不归档,等待批量归档)
python scripts/import_knowledge_from_excel.py --file UCSD更新202501.xlsx --dept 216

# 3. 继续导入其他学校...
python scripts/import_knowledge_from_excel.py --file UCLA更新202501.xlsx --dept 214

# 4. 统一归档所有部门
python scripts/archive_to_vector.py
```

## 🔧 高级用法

### 从CSV导入

将CSV转换为Excel,或修改脚本支持CSV:

```python
# 在import_knowledge_from_excel.py中
df = pd.read_csv(file_path)  # 替换read_excel
```

### 批量导入多个文件

```bash
# Linux/Mac
for file in data/*.xlsx; do
    python scripts/import_knowledge_from_excel.py --file "$file" --dept 216
done

# Windows PowerShell
Get-ChildItem data\*.xlsx | ForEach-Object {
    python scripts/import_knowledge_from_excel.py --file $_.FullName --dept 216
}
```

## ✅ 完成后验证

1. **检查数据库**:
   ```sql
   SELECT COUNT(*) FROM ai_knowledge_base WHERE dept_id = 216 AND indexed = '0';
   ```

2. **测试检索**:
   ```bash
   python test_vector_migration.py
   ```

3. **查看向量文件**:
   ```bash
   dir vector_store\216
   ```
