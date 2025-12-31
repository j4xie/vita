"""
向量存储目录迁移脚本
将学校名称目录迁移到dept_id目录

迁移映射:
- UCSD → 216
- UCLA → 214
- UCB → 211
- USC → 213
- UW → 218
- NYU → 226

使用方法:
    python scripts/migrate_vector_directories.py           # 执行迁移
    python scripts/migrate_vector_directories.py --dry-run # 预览模式
"""
import os
import sys
import shutil
import argparse
from pathlib import Path

# 设置UTF-8编码输出
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from config import Config

# 学校名称到dept_id的映射
# 基于Config.DEPARTMENTS中的'file'字段
SCHOOL_NAME_TO_DEPT_ID = {
    'UCSD': 216,      # 加州大学圣地亚哥分校
    'UCLA': 214,      # 加州大学洛杉矶分校
    'UCLACU': 214,    # 别名
    'UCB': 211,       # 加州大学伯克利分校
    'UCBCU': 211,     # 别名
    'USC': 213,       # 南加州大学
    'USCCU': 213,     # 别名
    'UW': 218,        # 华盛顿大学
    'UWCU': 218,      # 别名
    'NYU': 226,       # 纽约大学
    'NYUCU': 226,     # 别名
}


def check_vector_directory(dir_path: str) -> bool:
    """
    检查目录是否是有效的向量存储目录

    Args:
        dir_path: 目录路径

    Returns:
        是否为有效向量目录
    """
    required_files = ['docstore.json', 'index_store.json']

    for file in required_files:
        if not os.path.exists(os.path.join(dir_path, file)):
            return False

    return True


def migrate_vector_directories(dry_run: bool = False):
    """
    迁移向量存储目录

    Args:
        dry_run: 预览模式,不实际执行
    """
    vector_store_path = Config.VECTOR_STORE_PATH

    print("=" * 60)
    print("  向量存储目录迁移")
    if dry_run:
        print("  [预览模式] 不会实际修改文件")
    print("=" * 60)
    print(f"\n向量存储根目录: {vector_store_path}\n")

    if not os.path.exists(vector_store_path):
        print(f"❌ 向量存储目录不存在: {vector_store_path}")
        return False

    # 扫描现有目录
    existing_dirs = [d for d in os.listdir(vector_store_path)
                     if os.path.isdir(os.path.join(vector_store_path, d))]

    print(f"发现 {len(existing_dirs)} 个目录:")
    for dir_name in existing_dirs:
        print(f"  - {dir_name}")

    print("\n" + "=" * 60)

    migrated_count = 0
    skipped_count = 0
    error_count = 0

    for old_name in existing_dirs:
        old_path = os.path.join(vector_store_path, old_name)

        # 检查是否已经是dept_id格式(纯数字)
        if old_name.isdigit():
            dept_id = int(old_name)
            if dept_id in Config.VALID_DEPT_IDS:
                print(f"\n✓ 跳过 {old_name}/ (已经是dept_id格式)")
                skipped_count += 1
                continue

        # 查找对应的dept_id
        dept_id = SCHOOL_NAME_TO_DEPT_ID.get(old_name)

        if dept_id is None:
            print(f"\n⚠ 跳过 {old_name}/ (未找到对应的dept_id)")
            skipped_count += 1
            continue

        # 检查是否是有效的向量目录
        if not check_vector_directory(old_path):
            print(f"\n⚠ 跳过 {old_name}/ (不是有效的向量存储目录)")
            skipped_count += 1
            continue

        new_name = str(dept_id)
        new_path = os.path.join(vector_store_path, new_name)

        print(f"\n{'[预览]' if dry_run else '✓'} 迁移: {old_name}/ → {new_name}/")
        print(f"  源路径: {old_path}")
        print(f"  目标路径: {new_path}")

        # 检查目标是否已存在
        if os.path.exists(new_path):
            print(f"  ⚠ 目标目录已存在,将备份旧目录为 {new_name}.backup/")

            if not dry_run:
                backup_path = os.path.join(vector_store_path, f"{new_name}.backup")
                if os.path.exists(backup_path):
                    shutil.rmtree(backup_path)
                shutil.move(new_path, backup_path)

        # 执行迁移
        if not dry_run:
            try:
                shutil.move(old_path, new_path)
                print(f"  ✅ 迁移成功!")
                migrated_count += 1
            except Exception as e:
                print(f"  ❌ 迁移失败: {e}")
                error_count += 1
        else:
            migrated_count += 1

    # 汇总
    print("\n" + "=" * 60)
    print("  迁移完成")
    print("=" * 60)
    print(f"成功迁移: {migrated_count} 个目录")
    print(f"跳过: {skipped_count} 个目录")
    if error_count > 0:
        print(f"失败: {error_count} 个目录")
    print("=" * 60)

    if dry_run:
        print("\n[预览模式] 请使用 python scripts/migrate_vector_directories.py 执行实际迁移")
    else:
        print("\n✅ 迁移完成! 请运行集成测试验证功能正常")

    return error_count == 0


def main():
    parser = argparse.ArgumentParser(description='向量存储目录迁移工具')
    parser.add_argument('--dry-run', action='store_true', help='预览模式,不实际执行')
    args = parser.parse_args()

    success = migrate_vector_directories(dry_run=args.dry_run)
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
