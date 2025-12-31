"""
创建AI模块数据库表
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import get_database

SQL_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'schema_inter_stu_center.sql')

def create_tables():
    """创建所有AI模块表"""
    print("="*60)
    print("  创建AI模块数据库表")
    print("="*60)

    try:
        # 读取SQL文件
        with open(SQL_FILE, 'r', encoding='utf-8') as f:
            sql_content = f.read()

        print(f"\n读取SQL文件: {SQL_FILE}")

        # 获取数据库连接
        db = get_database()
        print("数据库连接成功")

        # 分割SQL语句并执行
        with db._get_connection() as conn:
            cursor = conn.cursor()

            # 分割SQL语句 (按照CREATE TABLE语句分割)
            statements = []
            current_statement = []

            for line in sql_content.split('\n'):
                # 跳过注释和空行
                line = line.strip()
                if not line or line.startswith('--'):
                    continue

                current_statement.append(line)

                # 如果遇到分号,说明一个语句结束
                if line.endswith(';'):
                    stmt = ' '.join(current_statement)
                    if stmt.strip() and stmt.strip() != ';':
                        statements.append(stmt)
                    current_statement = []

            print(f"\n找到 {len(statements)} 个SQL语句")

            # 执行每个语句
            for i, stmt in enumerate(statements, 1):
                try:
                    # 提取表名
                    if 'CREATE TABLE' in stmt.upper():
                        table_name = stmt.split('CREATE TABLE')[1].split('IF NOT EXISTS')[1].split('(')[0].strip()
                        print(f"\n[{i}/{len(statements)}] 创建表: {table_name}...")
                        cursor.execute(stmt)
                        print(f"  成功!")
                    else:
                        cursor.execute(stmt)
                except Exception as e:
                    print(f"  失败: {e}")
                    # 继续执行其他语句

        print("\n" + "="*60)
        print("  表创建完成!")
        print("="*60)

        # 验证表是否创建成功
        with db._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SHOW TABLES LIKE 'ai_%'")
            tables = cursor.fetchall()

            print("\n创建的AI模块表:")
            for table in tables:
                table_name = table[list(table.keys())[0]]
                cursor.execute(f"SELECT COUNT(*) as count FROM {table_name}")
                count = cursor.fetchone()['count']
                print(f"  - {table_name} (当前记录数: {count})")

        return True

    except Exception as e:
        print(f"\n创建表失败: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = create_tables()
    sys.exit(0 if success else 1)
