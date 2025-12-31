"""
知识库归档脚本
将数据库中未归档的知识加入向量索引

使用方法:
    python scripts/archive_to_vector.py           # 归档所有部门
    python scripts/archive_to_vector.py --dept 216  # 归档指定部门
    python scripts/archive_to_vector.py --dry-run  # 仅预览,不实际执行

定时任务配置:
    # Linux crontab (每天凌晨2点执行)
    0 2 * * * cd /path/to/pomelox_qwen_ai && python scripts/archive_to_vector.py >> logs/archive.log 2>&1

    # Windows 任务计划程序
    schtasks /create /tn "知识库归档" /tr "python E:\\工作项目\\西柚\\pomelox_qwen_ai\\scripts\\archive_to_vector.py" /sc daily /st 02:00
"""
import os
import sys
import argparse
from datetime import datetime

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from config import Config
from database import get_database
from llama_index.core import (
    VectorStoreIndex,
    Document,
    StorageContext,
    load_index_from_storage,
    Settings
)
from llama_index.embeddings.dashscope import (
    DashScopeEmbedding,
    DashScopeTextEmbeddingModels,
    DashScopeTextEmbeddingType,
)


def format_knowledge_to_document(entry) -> str:
    """
    将知识库条目格式化为文档文本

    Args:
        entry: KnowledgeEntry 对象

    Returns:
        格式化后的文档文本
    """
    return f"""问题: {entry.question}

答案: {entry.answer}

[元数据]
来源: {entry.source}
类别: {entry.category or '未分类'}
质量评分: {entry.quality_score}
录入时间: {entry.created_at}
"""


def update_vector_index(dept_id: int, new_documents: list):
    """
    更新部门的向量索引

    Args:
        dept_id: 部门ID
        new_documents: 新文档列表
    """
    index_path = os.path.join(Config.VECTOR_STORE_PATH, str(dept_id))

    if os.path.exists(index_path):
        # 加载现有索引
        print(f"  加载现有索引: {index_path}")
        storage_context = StorageContext.from_defaults(persist_dir=index_path)
        index = load_index_from_storage(storage_context)

        # 增量添加文档
        print(f"  增量添加 {len(new_documents)} 个文档...")
        for doc in new_documents:
            index.insert(doc)

    else:
        # 首次创建索引
        print(f"  创建新索引: {index_path}")
        index = VectorStoreIndex.from_documents(new_documents)
        os.makedirs(index_path, exist_ok=True)

    # 保存索引
    index.storage_context.persist(index_path)
    print(f"  索引已保存")


def archive_dept_knowledge(dept_id: int, db, dry_run: bool = False) -> dict:
    """
    归档指定部门的知识到向量库

    Args:
        dept_id: 部门ID
        db: 数据库实例
        dry_run: 仅预览,不实际执行

    Returns:
        处理结果 {
            'success': bool,
            'archived_count': int,
            'deleted_count': int,
            'error': str (如果失败)
        }
    """
    print(f"\n{'='*60}")
    dept_info = Config.DEPARTMENTS.get(dept_id, {})
    dept_name = dept_info.get('name', f'Department {dept_id}')
    print(f"开始归档部门: {dept_id} ({dept_name})")
    if dry_run:
        print("[预览模式] 不会实际修改数据")
    print(f"{'='*60}")

    # 1. 获取未归档的知识
    unindexed = db.get_unindexed_knowledge(dept_id)

    if not unindexed:
        print(f"  没有需要归档的新知识")
        return {'success': True, 'archived_count': 0, 'deleted_count': 0}

    print(f"  发现 {len(unindexed)} 条新知识需要归档")

    # 预览模式: 显示详情
    if dry_run:
        for i, entry in enumerate(unindexed[:5], 1):  # 只显示前5条
            print(f"\n  [{i}] ID: {entry.kb_id}")
            print(f"      问题: {entry.question[:50]}...")
            print(f"      来源: {entry.source}")
            print(f"      创建: {entry.created_at}")

        if len(unindexed) > 5:
            print(f"\n  ... 还有 {len(unindexed) - 5} 条")

        print(f"\n  [预览模式] 跳过实际归档操作")
        return {'success': True, 'archived_count': 0, 'deleted_count': 0}

    # 实际执行归档
    try:
        # 2. 转换为文档
        documents = []
        kb_ids = []

        for entry in unindexed:
            doc_text = format_knowledge_to_document(entry)
            documents.append(Document(
                text=doc_text,
                metadata={
                    'kb_id': entry.kb_id,
                    'dept_id': entry.dept_id,
                    'source': entry.source,
                    'created_at': str(entry.created_at)
                }
            ))
            kb_ids.append(entry.kb_id)

        # 3. 更新向量索引
        update_vector_index(dept_id, documents)
        print(f"  ✅ 向量索引更新成功")

        # 4. 标记为已归档(或删除)
        if Config.ARCHIVE_DELETE_AFTER_INDEX:
            deleted_count = db.bulk_delete_knowledge(kb_ids)
            print(f"  ✅ 已从数据库删除 {deleted_count} 条记录")
        else:
            for kb_id in kb_ids:
                db.update_knowledge(kb_id, {'indexed': True})
            deleted_count = 0
            print(f"  ✅ 已标记 {len(kb_ids)} 条记录为已归档")

        return {
            'success': True,
            'archived_count': len(documents),
            'deleted_count': deleted_count
        }

    except Exception as e:
        print(f"  ❌ 归档失败: {e}")
        import traceback
        traceback.print_exc()

        return {
            'success': False,
            'archived_count': 0,
            'deleted_count': 0,
            'error': str(e)
        }


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='知识库归档工具')
    parser.add_argument('--dept', type=int, help='指定部门ID')
    parser.add_argument('--dry-run', action='store_true', help='预览模式,不实际执行')
    args = parser.parse_args()

    # 初始化数据库
    db = get_database()

    # 配置 embedding 模型
    Settings.embed_model = DashScopeEmbedding(
        model_name=DashScopeTextEmbeddingModels.TEXT_EMBEDDING_V2,
        text_type=DashScopeTextEmbeddingType.TEXT_TYPE_DOCUMENT,
    )

    print(f"\n{'='*60}")
    print(f"知识库归档任务开始")
    print(f"时间: {datetime.now()}")
    if args.dry_run:
        print("[预览模式] 不会实际修改数据")
    print(f"{'='*60}")

    total_archived = 0
    total_deleted = 0

    if args.dept:
        # 归档指定部门
        if args.dept not in Config.DEPARTMENTS:
            print(f"错误: 部门 {args.dept} 不存在")
            print(f"可用部门ID: {Config.VALID_DEPT_IDS}")
            sys.exit(1)

        result = archive_dept_knowledge(args.dept, db, args.dry_run)
        if result['success']:
            total_archived = result['archived_count']
            total_deleted = result['deleted_count']
    else:
        # 归档所有部门
        for dept_id in Config.DEPARTMENTS.keys():
            result = archive_dept_knowledge(dept_id, db, args.dry_run)
            if result['success']:
                total_archived += result['archived_count']
                total_deleted += result['deleted_count']

    print(f"\n{'='*60}")
    print(f"归档任务完成")
    print(f"总计归档: {total_archived} 条知识")
    if Config.ARCHIVE_DELETE_AFTER_INDEX:
        print(f"总计删除: {total_deleted} 条数据库记录")
    else:
        print(f"总计标记: {total_archived} 条记录为已归档")
    print(f"{'='*60}\n")


if __name__ == '__main__':
    main()
