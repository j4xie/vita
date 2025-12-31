"""
集成测试脚本 - 测试dept_id完整对齐后的所有功能
"""
import sys
import os

# 设置UTF-8编码输出
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(__file__))

from database import get_database
from models.feedback import FeedbackRecord, FeedbackStatus
from models.knowledge import KnowledgeEntry, KnowledgeSource
from config import Config
import uuid
from datetime import datetime

def print_section(title):
    """打印分节标题"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def test_database_connection():
    """测试1: 数据库连接和SSH隧道"""
    print_section("测试1: 数据库连接和SSH隧道")

    try:
        db = get_database()
        print("✅ 数据库实例创建成功")
        print(f"   数据库类型: {Config.DATABASE_TYPE}")

        # 测试连接
        with db._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT DATABASE()")
            db_name = cursor.fetchone()
            print(f"✅ 数据库连接成功")
            print(f"   当前数据库: {db_name['DATABASE()']}")

        return True
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_database_tables():
    """测试2: 检查数据库表是否存在"""
    print_section("测试2: 检查数据库表")

    try:
        db = get_database()
        with db._get_connection() as conn:
            cursor = conn.cursor()

            # 检查必需的表
            required_tables = [
                'ai_chat_session',
                'ai_chat_message',
                'ai_feedback',
                'ai_knowledge_base',
                'sys_user',
                'sys_dept'
            ]

            cursor.execute("SHOW TABLES")
            existing_tables = [row[list(row.keys())[0]] for row in cursor.fetchall()]

            all_exist = True
            for table in required_tables:
                if table in existing_tables:
                    print(f"✅ 表 {table} 存在")
                else:
                    print(f"❌ 表 {table} 不存在")
                    all_exist = False

            return all_exist
    except Exception as e:
        print(f"❌ 检查表失败: {e}")
        return False

def test_departments_config():
    """测试3: 部门配置"""
    print_section("测试3: 部门配置")

    try:
        print(f"配置的部门数量: {len(Config.DEPARTMENTS)}")
        print(f"有效部门ID列表: {Config.VALID_DEPT_IDS}")

        for dept_id, info in Config.DEPARTMENTS.items():
            print(f"\n部门 {dept_id}:")
            print(f"  名称: {info.get('name')}")
            print(f"  中文名: {info.get('name_cn')}")
            print(f"  文件标识: {info.get('file')}")

        # 验证dept_id是否在数据库中存在
        db = get_database()
        with db._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT dept_id, dept_name FROM sys_dept WHERE dept_id IN (%s, %s, %s, %s, %s, %s)",
                         tuple(Config.VALID_DEPT_IDS))
            db_depts = cursor.fetchall()

            print(f"\n数据库中的部门:")
            for dept in db_depts:
                print(f"  {dept['dept_id']}: {dept['dept_name']}")

        return True
    except Exception as e:
        print(f"❌ 测试部门配置失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_feedback_creation():
    """测试4: 创建反馈记录"""
    print_section("测试4: 创建反馈记录")

    try:
        db = get_database()

        # 先创建会话(满足外键约束)
        session_id = f"test_sess_{uuid.uuid4().hex[:8]}"
        db.create_chat_session(
            session_id=session_id,
            user_id=1,
            dept_id=216,
            title="测试会话"
        )
        print(f"✅ 预先创建会话成功 (session_id={session_id})")

        # 创建测试反馈
        feedback = FeedbackRecord(
            feedback_id=f"test_fb_{uuid.uuid4().hex[:8]}",
            session_id=session_id,  # 使用刚创建的会话ID
            message_id=f"test_msg_{uuid.uuid4().hex[:8]}",
            question="测试问题 - 如何申请宿舍?",
            answer="测试回答 - 请访问学校官网...",
            rating=1,
            source_type="knowledge_base",
            rag_score=0.85,
            dept_id=216,  # UCSD
            user_id=1,
            status=FeedbackStatus.PENDING.value
        )

        success = db.create_feedback(feedback)
        if success:
            print(f"✅ 反馈创建成功")
            print(f"   Feedback ID: {feedback.feedback_id}")
            print(f"   Dept ID: {feedback.dept_id}")
            print(f"   User ID: {feedback.user_id}")

            # 验证读取
            read_feedback = db.get_feedback_by_id(feedback.feedback_id)
            if read_feedback:
                print(f"✅ 反馈读取成功")
                print(f"   问题: {read_feedback.question[:30]}...")
                return True
            else:
                print(f"❌ 反馈读取失败")
                return False
        else:
            print(f"❌ 反馈创建失败")
            return False

    except Exception as e:
        print(f"❌ 测试反馈失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_knowledge_creation():
    """测试5: 创建知识库条目"""
    print_section("测试5: 创建知识库条目")

    try:
        db = get_database()

        # 创建测试知识
        knowledge = KnowledgeEntry(
            kb_id=f"test_kb_{uuid.uuid4().hex[:8]}",
            question="测试问题 - 图书馆开放时间?",
            answer="测试答案 - 图书馆周一至周五8:00-22:00开放",
            dept_id=216,  # UCSD
            category="校园服务",
            source=KnowledgeSource.MANUAL.value,
            quality_score=0.9,
            enabled=True,
            indexed=False
        )

        success = db.create_knowledge(knowledge)
        if success:
            print(f"✅ 知识库条目创建成功")
            print(f"   KB ID: {knowledge.kb_id}")
            print(f"   Dept ID: {knowledge.dept_id}")
            print(f"   问题: {knowledge.question}")

            # 验证按部门查询
            dept_knowledge = db.get_knowledge_by_dept(
                dept_id=216,
                indexed=False,
                enabled_only=True
            )
            print(f"✅ 部门知识库查询成功")
            print(f"   部门216未归档知识数量: {len(dept_knowledge)}")

            return True
        else:
            print(f"❌ 知识库条目创建失败")
            return False

    except Exception as e:
        print(f"❌ 测试知识库失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_chat_session():
    """测试6: 聊天会话管理"""
    print_section("测试6: 聊天会话管理")

    try:
        db = get_database()

        # 创建会话
        session_id = f"test_session_{uuid.uuid4().hex[:8]}"
        user_id = 1
        dept_id = 216

        success = db.create_chat_session(
            session_id=session_id,
            user_id=user_id,
            dept_id=dept_id,
            title="测试对话"
        )

        if success:
            print(f"✅ 会话创建成功")
            print(f"   Session ID: {session_id}")

            # 保存消息
            msg_success = db.save_chat_message(
                message_id=f"msg_{uuid.uuid4().hex[:8]}",
                session_id=session_id,
                user_id=user_id,
                role="user",
                content="测试问题",
                rag_score=None,
                source_type=None
            )

            if msg_success:
                print(f"✅ 消息保存成功")

                # 查询会话列表
                sessions = db.get_user_chat_sessions(user_id=user_id, offset=0, limit=10)
                print(f"✅ 会话列表查询成功")
                print(f"   用户会话数量: {len(sessions)}")

                # 查询消息
                messages = db.get_chat_messages(session_id=session_id, user_id=user_id)
                print(f"✅ 消息列表查询成功")
                print(f"   会话消息数量: {len(messages)}")

                return True
            else:
                print(f"❌ 消息保存失败")
                return False
        else:
            print(f"❌ 会话创建失败")
            return False

    except Exception as e:
        print(f"❌ 测试会话管理失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_rag_service():
    """测试7: RAG服务使用dept_id"""
    print_section("测试7: RAG服务")

    try:
        from core.rag_service import is_dept_valid, get_available_depts, get_system_prompt

        # 测试部门验证
        valid = is_dept_valid(216)
        print(f"✅ 部门验证: dept_id=216 有效性={valid}")

        # 测试获取部门列表
        depts = get_available_depts()
        print(f"✅ 可用部门列表: {depts}")

        # 测试生成系统提示
        prompt = get_system_prompt(216, "", False)
        if "UC San Diego" in prompt or "Department 216" in prompt:
            print(f"✅ 系统提示生成成功")
            print(f"   提示包含学校名称")
            return True
        else:
            print(f"❌ 系统提示未包含正确的学校名称")
            return False

    except Exception as e:
        print(f"❌ 测试RAG服务失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_archive_script():
    """测试8: 向量化脚本配置"""
    print_section("测试8: 向量化脚本")

    try:
        # 检查脚本文件
        script_path = os.path.join(os.path.dirname(__file__), 'scripts', 'archive_to_vector.py')
        if not os.path.exists(script_path):
            print(f"❌ 脚本文件不存在: {script_path}")
            return False

        # 读取脚本内容检查
        with open(script_path, 'r', encoding='utf-8') as f:
            content = f.read()

        checks = [
            ('dept_id: int' in content, "使用dept_id类型"),
            ('archive_dept_knowledge' in content, "函数名已更新"),
            ('--dept' in content, "命令行参数已更新"),
            ('Config.DEPARTMENTS' in content, "使用DEPARTMENTS配置"),
        ]

        all_passed = True
        for check, desc in checks:
            if check:
                print(f"✅ {desc}")
            else:
                print(f"❌ {desc}")
                all_passed = False

        return all_passed

    except Exception as e:
        print(f"❌ 测试向量化脚本失败: {e}")
        return False

def run_all_tests():
    """运行所有测试"""
    print("\n" + "="*60)
    print("  dept_id 完整对齐 - 集成测试")
    print("="*60)

    tests = [
        ("数据库连接", test_database_connection),
        ("数据库表", test_database_tables),
        ("部门配置", test_departments_config),
        ("反馈创建", test_feedback_creation),
        ("知识库创建", test_knowledge_creation),
        ("会话管理", test_chat_session),
        ("RAG服务", test_rag_service),
        ("向量化脚本", test_archive_script),
    ]

    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n测试 {name} 发生异常: {e}")
            results.append((name, False))

    # 汇总结果
    print_section("测试结果汇总")
    passed = sum(1 for _, r in results if r)
    total = len(results)

    for name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{status}  {name}")

    print(f"\n总计: {passed}/{total} 测试通过")

    if passed == total:
        print("\n🎉 所有测试通过! dept_id对齐成功!")
    else:
        print(f"\n⚠️  还有 {total - passed} 个测试失败,请检查")

    return passed == total

if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)
