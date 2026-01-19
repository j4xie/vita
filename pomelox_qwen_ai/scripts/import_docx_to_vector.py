"""
增量导入docx到向量库脚本
将docx文件内容增量添加到现有向量索引，不会删除已有数据

目录结构:
  school_data/
    ├── UCSD/           # 学校简写作为文件夹名
    │   ├── 新生指南.docx
    │   ├── 签证FAQ_processed.docx  # 已处理的文件
    │   └── 图书馆介绍.docx
    └── ...

使用方法:
  python scripts/import_docx_to_vector.py --school UCSD
  python scripts/import_docx_to_vector.py --all
  python scripts/import_docx_to_vector.py --school UCSD --dry-run
"""
import os
import sys

# 解决PyTorch DLL加载顺序问题 - 必须在其他导入之前
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
os.environ['OMP_NUM_THREADS'] = '1'
import torch  # 必须先导入torch

import argparse
import shutil
from datetime import datetime

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from config import Config
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext, load_index_from_storage, Settings
from llama_index.embeddings.dashscope import (
    DashScopeEmbedding,
    DashScopeTextEmbeddingModels,
    DashScopeTextEmbeddingType,
)

# 配置嵌入模型
EMBED_MODEL = DashScopeEmbedding(
    model_name=DashScopeTextEmbeddingModels.TEXT_EMBEDDING_V2,
    text_type=DashScopeTextEmbeddingType.TEXT_TYPE_DOCUMENT,
)
Settings.embed_model = EMBED_MODEL

# 学校简写 -> dept_id 映射
SCHOOL_TO_DEPT = {
    'UCD': 210,      # 加州大学戴维斯分校
    'UCB': 211,      # 加州大学伯克利分校
    'UCSC': 212,     # 加州大学圣克鲁兹分校
    'USC': 213,      # 南加州大学
    'UCLA': 214,     # 加州大学洛杉矶分校
    'UCI': 215,      # 加州大学欧文分校
    'UCSD': 216,     # 加州大学圣地亚哥分校
    'UMN': 217,      # 明尼苏达大学
    'UW': 218,       # 华盛顿大学
    'Berklee': 219,  # 伯克利音乐学院
    'UCSB': 220,     # 加州大学圣塔芭芭拉分校
    'Rutgers': 224,  # 罗格斯大学
    'NYU': 226,      # 纽约大学
    'Cornell': 230,  # 康奈尔大学
    'OSU': 231,      # 俄亥俄州立大学
    'UPenn': 232,    # 宾夕法尼亚大学
}

# school_data 目录路径
SCHOOL_DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
    'school_data'
)


def get_school_folder(school_code):
    return os.path.join(SCHOOL_DATA_PATH, school_code)


def get_unprocessed_docx(school_code):
    folder = get_school_folder(school_code)
    if not os.path.exists(folder):
        return []
    return [
        os.path.join(folder, f) for f in os.listdir(folder)
        if f.endswith('.docx') and not f.endswith('_processed.docx')
    ]


def mark_as_processed(docx_path):
    base, ext = os.path.splitext(docx_path)
    new_path = f"{base}_processed{ext}"
    shutil.move(docx_path, new_path)
    return new_path


def import_school_docx(school_code, dry_run=False):
    if school_code not in SCHOOL_TO_DEPT:
        print(f"[ERROR] Unknown school: {school_code}")
        print(f"Available: {', '.join(SCHOOL_TO_DEPT.keys())}")
        return {'success': 0, 'failed': 0, 'skipped': 0}

    dept_id = SCHOOL_TO_DEPT[school_code]
    index_path = os.path.join(Config.VECTOR_STORE_PATH, str(dept_id))

    print(f"\n{'='*60}")
    print(f"Processing: {school_code} (dept_id: {dept_id})")
    print(f"{'='*60}")

    # Get unprocessed files
    unprocessed = get_unprocessed_docx(school_code)
    if not unprocessed:
        folder = get_school_folder(school_code)
        print(f"[INFO] No unprocessed docx files in {folder}")
        return {'success': 0, 'failed': 0, 'skipped': 0}

    print(f"[INFO] Found {len(unprocessed)} files:")
    for f in unprocessed:
        print(f"  - {os.path.basename(f)}")

    if dry_run:
        print(f"\n[DRY RUN] Preview mode, no changes made")
        return {'success': 0, 'failed': 0, 'skipped': len(unprocessed)}

    # Load existing index
    print(f"\n[Step 1] Loading existing index...")
    existing_index = None
    if os.path.exists(index_path):
        try:
            storage_context = StorageContext.from_defaults(persist_dir=index_path)
            existing_index = load_index_from_storage(storage_context)
            print(f"  [OK] Loaded index from {index_path}")
        except Exception as e:
            print(f"  [WARN] Could not load index: {e}")

    # Read documents
    print(f"\n[Step 2] Reading docx files...")
    all_documents = []
    stats = {'success': 0, 'failed': 0, 'skipped': 0}

    for docx_path in unprocessed:
        filename = os.path.basename(docx_path)
        try:
            reader = SimpleDirectoryReader(input_files=[docx_path])
            docs = reader.load_data()
            for doc in docs:
                doc.metadata['source_file'] = filename
                doc.metadata['import_time'] = datetime.now().isoformat()
            all_documents.extend(docs)
            print(f"  [OK] {filename}: {len(docs)} segments")
        except Exception as e:
            print(f"  [FAIL] {filename}: {e}")
            stats['failed'] += 1

    if not all_documents:
        print(f"[WARN] No documents loaded")
        return stats

    # Update index
    print(f"\n[Step 3] Updating vector index...")
    try:
        if existing_index is not None:
            for doc in all_documents:
                existing_index.insert(doc)
            index = existing_index
            print(f"  [OK] Added {len(all_documents)} segments to existing index")
        else:
            if not os.path.exists(index_path):
                os.makedirs(index_path)
            index = VectorStoreIndex.from_documents(all_documents)
            print(f"  [OK] Created new index with {len(all_documents)} segments")

        # Save index
        print(f"\n[Step 4] Saving index...")
        index.storage_context.persist(index_path)
        print(f"  [OK] Saved to {index_path}")

        # Mark files as processed
        print(f"\n[Step 5] Marking files as processed...")
        for docx_path in unprocessed:
            if os.path.exists(docx_path):
                try:
                    new_path = mark_as_processed(docx_path)
                    print(f"  [OK] {os.path.basename(docx_path)} -> {os.path.basename(new_path)}")
                    stats['success'] += 1
                except Exception as e:
                    print(f"  [FAIL] Rename failed: {e}")
                    stats['failed'] += 1

    except Exception as e:
        print(f"  [FAIL] Vectorization failed: {e}")
        import traceback
        traceback.print_exc()
        stats['failed'] += len(unprocessed)

    return stats


def create_school_folders():
    print(f"\nCreating school folders in {SCHOOL_DATA_PATH}")
    if not os.path.exists(SCHOOL_DATA_PATH):
        os.makedirs(SCHOOL_DATA_PATH)
    for school_code in SCHOOL_TO_DEPT.keys():
        folder = get_school_folder(school_code)
        if not os.path.exists(folder):
            os.makedirs(folder)
            print(f"  [NEW] {school_code}/")
        else:
            print(f"  [OK] {school_code}/")


def list_schools():
    print(f"\n{'='*60}")
    print(f"School Status")
    print(f"{'='*60}")
    print(f"{'Code':<10} {'dept_id':<8} {'Pending':<8} {'Done':<8}")
    print(f"{'-'*40}")

    for school_code, dept_id in SCHOOL_TO_DEPT.items():
        folder = get_school_folder(school_code)
        pending = 0
        done = 0
        if os.path.exists(folder):
            for f in os.listdir(folder):
                if f.endswith('_processed.docx'):
                    done += 1
                elif f.endswith('.docx'):
                    pending += 1
        print(f"{school_code:<10} {dept_id:<8} {pending if pending else '-':<8} {done if done else '-':<8}")


def main():
    parser = argparse.ArgumentParser(description='Import docx to vector store')
    parser.add_argument('--school', type=str, help='School code (e.g., UCSD)')
    parser.add_argument('--all', action='store_true', help='Process all schools')
    parser.add_argument('--dry-run', action='store_true', help='Preview mode')
    parser.add_argument('--list', action='store_true', help='List all schools')
    parser.add_argument('--init', action='store_true', help='Create school folders')

    args = parser.parse_args()

    if args.init:
        create_school_folders()
        return

    if args.list:
        list_schools()
        return

    if args.all:
        total = {'success': 0, 'failed': 0, 'skipped': 0}
        for school_code in SCHOOL_TO_DEPT.keys():
            stats = import_school_docx(school_code, args.dry_run)
            total['success'] += stats['success']
            total['failed'] += stats['failed']
            total['skipped'] += stats['skipped']
        print(f"\n{'='*60}")
        print(f"Total: {total['success']} success, {total['failed']} failed, {total['skipped']} skipped")
        return

    if args.school:
        stats = import_school_docx(args.school.upper(), args.dry_run)
        print(f"\n{'='*60}")
        print(f"Done: {stats['success']} success, {stats['failed']} failed, {stats['skipped']} skipped")
        return

    print("Usage:")
    print("  python scripts/import_docx_to_vector.py --init        # Create folders")
    print("  python scripts/import_docx_to_vector.py --list        # List schools")
    print("  python scripts/import_docx_to_vector.py --school UCSD # Process one school")
    print("  python scripts/import_docx_to_vector.py --all         # Process all")
    print(f"\nAvailable schools: {', '.join(SCHOOL_TO_DEPT.keys())}")


if __name__ == "__main__":
    main()
