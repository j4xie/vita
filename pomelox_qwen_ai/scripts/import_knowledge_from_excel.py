"""
从Excel批量导入知识库

Excel格式要求:
列名: 问题 | 答案 | 分类 | 质量分数
     Question | Answer | Category | Quality Score

使用方法:
    # 导入知识到指定部门
    python scripts/import_knowledge_from_excel.py --file UCSD知识库.xlsx --dept 216

    # 预览模式(不实际导入)
    python scripts/import_knowledge_from_excel.py --file UCSD知识库.xlsx --dept 216 --dry-run

    # 导入后自动归档到向量库
    python scripts/import_knowledge_from_excel.py --file UCSD知识库.xlsx --dept 216 --archive
"""
import sys
import os
import argparse
import pandas as pd
import uuid
from datetime import datetime

# 设置UTF-8编码输出
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from config import Config
from database import get_database
from models.knowledge import KnowledgeEntry, KnowledgeSource


def read_excel_knowledge(file_path: str) -> list:
    """
    从Excel读取知识库数据

    Args:
        file_path: Excel文件路径

    Returns:
        知识条目列表
    """
    try:
        # 读取Excel
        df = pd.read_excel(file_path)

        # 支持中英文列名
        column_mapping = {
            '问题': 'question',
            'Question': 'question',
            '答案': 'answer',
            'Answer': 'answer',
            '分类': 'category',
            'Category': 'category',
            '质量分数': 'quality_score',
            'Quality Score': 'quality_score',
            'Quality': 'quality_score',
        }

        # 重命名列
        df.rename(columns=column_mapping, inplace=True)

        # 验证必需列
        required_columns = ['question', 'answer']
        missing_columns = [col for col in required_columns if col not in df.columns]

        if missing_columns:
            print(f"❌ Excel缺少必需列: {missing_columns}")
            print(f"   当前列: {list(df.columns)}")
            print(f"   支持的列名: 问题/Question, 答案/Answer, 分类/Category, 质量分数/Quality Score")
            return []

        # 转换为字典列表
        knowledge_list = []
        for idx, row in df.iterrows():
            # 跳过空行
            if pd.isna(row['question']) or pd.isna(row['answer']):
                continue

            knowledge_list.append({
                'question': str(row['question']).strip(),
                'answer': str(row['answer']).strip(),
                'category': str(row.get('category', '未分类')).strip() if pd.notna(row.get('category')) else '未分类',
                'quality_score': float(row.get('quality_score', 0.7)) if pd.notna(row.get('quality_score')) else 0.7
            })

        return knowledge_list

    except Exception as e:
        print(f"❌ 读取Excel失败: {e}")
        import traceback
        traceback.print_exc()
        return []


def import_knowledge_to_database(knowledge_list: list, dept_id: int, dry_run: bool = False) -> int:
    """
    导入知识到数据库

    Args:
        knowledge_list: 知识列表
        dept_id: 部门ID
        dry_run: 仅预览,不实际导入

    Returns:
        成功导入的数量
    """
    if not knowledge_list:
        print("❌ 没有可导入的知识")
        return 0

    dept_info = Config.DEPARTMENTS.get(dept_id, {})
    dept_name = dept_info.get('name_cn', f'Department {dept_id}')

    print(f"\n{'='*60}")
    print(f"准备导入到部门: {dept_id} ({dept_name})")
    print(f"知识条目数量: {len(knowledge_list)}")
    if dry_run:
        print("[预览模式] 不会实际导入")
    print(f"{'='*60}\n")

    # 预览前5条
    print("前5条知识预览:")
    for i, item in enumerate(knowledge_list[:5], 1):
        print(f"\n[{i}] 问题: {item['question'][:50]}...")
        print(f"    答案: {item['answer'][:80]}...")
        print(f"    分类: {item['category']}")
        print(f"    质量: {item['quality_score']}")

    if len(knowledge_list) > 5:
        print(f"\n... 还有 {len(knowledge_list) - 5} 条")

    if dry_run:
        print(f"\n[预览模式] 跳过实际导入")
        return 0

    # 实际导入
    db = get_database()
    success_count = 0

    print(f"\n开始导入...")
    for i, item in enumerate(knowledge_list, 1):
        try:
            # 创建知识条目
            knowledge = KnowledgeEntry(
                kb_id=f"import_{uuid.uuid4().hex[:12]}",
                question=item['question'],
                answer=item['answer'],
                dept_id=dept_id,
                category=item['category'],
                source=KnowledgeSource.MANUAL.value,  # 人工导入
                quality_score=item['quality_score'],
                enabled=True,
                indexed=False  # 未归档,等待向量化
            )

            # 保存到数据库
            if db.create_knowledge(knowledge):
                success_count += 1
                if i % 10 == 0:
                    print(f"  已导入 {i}/{len(knowledge_list)}...")
            else:
                print(f"  ⚠ 第 {i} 条导入失败: {item['question'][:30]}...")

        except Exception as e:
            print(f"  ❌ 第 {i} 条导入异常: {e}")

    print(f"\n{'='*60}")
    print(f"导入完成!")
    print(f"成功导入: {success_count}/{len(knowledge_list)} 条")
    print(f"{'='*60}")

    return success_count


def main():
    parser = argparse.ArgumentParser(description='从Excel批量导入知识库')
    parser.add_argument('--file', required=True, help='Excel文件路径')
    parser.add_argument('--dept', type=int, required=True, help='部门ID (211/213/214/216/218/226)')
    parser.add_argument('--dry-run', action='store_true', help='预览模式,不实际导入')
    parser.add_argument('--archive', action='store_true', help='导入后自动归档到向量库')
    args = parser.parse_args()

    # 验证部门ID
    if args.dept not in Config.VALID_DEPT_IDS:
        print(f"❌ 无效的部门ID: {args.dept}")
        print(f"   可用部门ID: {Config.VALID_DEPT_IDS}")
        sys.exit(1)

    # 验证文件存在
    if not os.path.exists(args.file):
        print(f"❌ 文件不存在: {args.file}")
        sys.exit(1)

    print(f"{'='*60}")
    print(f"Excel知识库导入工具")
    print(f"时间: {datetime.now()}")
    print(f"{'='*60}")

    # 读取Excel
    knowledge_list = read_excel_knowledge(args.file)

    if not knowledge_list:
        print("❌ 未读取到有效知识,退出")
        sys.exit(1)

    # 导入到数据库
    success_count = import_knowledge_to_database(knowledge_list, args.dept, args.dry_run)

    # 是否自动归档
    if args.archive and success_count > 0 and not args.dry_run:
        print(f"\n{'='*60}")
        print("开始自动归档到向量库...")
        print(f"{'='*60}")

        import subprocess
        result = subprocess.run(
            [sys.executable, 'scripts/archive_to_vector.py', '--dept', str(args.dept)],
            cwd=os.path.dirname(os.path.dirname(__file__))
        )

        if result.returncode == 0:
            print("\n✅ 归档完成!")
        else:
            print("\n⚠ 归档失败,请手动运行:")
            print(f"   python scripts/archive_to_vector.py --dept {args.dept}")

    print(f"\n{'='*60}")
    print(f"任务完成!")
    if not args.dry_run:
        print(f"✅ 成功导入 {success_count} 条知识")
        if not args.archive:
            print(f"\n💡 提示: 运行以下命令归档到向量库:")
            print(f"   python scripts/archive_to_vector.py --dept {args.dept}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
