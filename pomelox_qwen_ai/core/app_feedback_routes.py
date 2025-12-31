"""
反馈系统路由扩展
将此文件的路由添加到 app.py 中

使用方法:
在 app.py 中添加:
    from app_feedback_routes import register_feedback_routes
    register_feedback_routes(app)
"""
from flask import request, jsonify
from database import get_database
from services.feedback_service import FeedbackService
from services.knowledge_service import KnowledgeService


# 初始化服务 (全局单例)
_db = None
_feedback_service = None
_knowledge_service = None


def get_services():
    """获取服务实例"""
    global _db, _feedback_service, _knowledge_service

    if _db is None:
        _db = get_database()
        _feedback_service = FeedbackService(_db)
        _knowledge_service = KnowledgeService(_db)

    return _feedback_service, _knowledge_service


def register_feedback_routes(app):
    """
    注册反馈系统相关路由

    Args:
        app: Flask 应用实例
    """

    @app.route('/app/ai/feedback', methods=['POST'])
    def submit_feedback():
        """
        提交用户反馈

        请求体:
        {
            "session_id": "sess_xxx",
            "message_id": "msg_xxx",
            "user_id": 123,  # 用户ID (必填)
            "dept_id": 216,  # 部门ID (必填)
            "question": "如何申请宿舍?",
            "answer": "...",
            "rating": 1,  # 1=有帮助, -1=没帮助
            "comment": "" (可选),
            "source_type": "web_search",  # web_search 或 knowledge_base
            "rag_score": 0.32
        }

        响应:
        {
            "success": true,
            "feedback_id": "fb_xxx",
            "status": "auto_approved" | "pending" | "recorded",
            "confidence_score": 0.85,
            "kb_id": "kb_xxx" (如果自动入库),
            "message": "说明文本"
        }
        """
        try:
            data = request.get_json()

            # 验证必填字段
            required = ['session_id', 'message_id', 'question',
                       'answer', 'rating', 'source_type',
                       'rag_score', 'user_id', 'dept_id']
            for field in required:
                if field not in data:
                    return jsonify({'error': f'Missing field: {field}'}), 400

            # 处理反馈
            feedback_service, _ = get_services()
            result = feedback_service.process_feedback(data)

            return jsonify({
                'success': True,
                **result
            })

        except Exception as e:
            print(f"[API错误] 提交反馈失败: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e)}), 500

    @app.route('/app/ai/feedback/pending', methods=['GET'])
    def get_pending_feedbacks():
        """
        获取待审核的反馈列表

        查询参数:
        - dept_id: 部门ID (可选)
        - limit: 数量限制 (默认50)

        响应:
        {
            "feedbacks": [
                {
                    "feedback_id": "fb_xxx",
                    "question": "...",
                    "answer": "...",
                    "dept_id": 216,
                    "confidence_score": 0.65,
                    "created_at": "2025-12-27T10:00:00"
                }
            ],
            "total": 15
        }
        """
        try:
            dept_id_str = request.args.get('dept_id')
            dept_id = int(dept_id_str) if dept_id_str else None
            limit = int(request.args.get('limit', 50))

            feedback_service, _ = get_services()
            feedbacks = feedback_service.get_pending_list(dept_id, limit)

            return jsonify({
                'feedbacks': feedbacks,
                'total': len(feedbacks)
            })

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/app/ai/feedback/<feedback_id>/approve', methods=['POST'])
    def approve_feedback(feedback_id):
        """
        审核通过反馈

        请求体 (可选):
        {
            "reviewer_id": "admin_001"
        }

        响应:
        {
            "success": true,
            "kb_id": "kb_xxx"
        }
        """
        try:
            data = request.get_json() or {}
            reviewer_id = data.get('reviewer_id')

            feedback_service, _ = get_services()
            kb_id = feedback_service.approve_feedback(feedback_id, reviewer_id)

            return jsonify({
                'success': True,
                'kb_id': kb_id
            })

        except ValueError as e:
            return jsonify({'error': str(e)}), 404
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/app/ai/feedback/<feedback_id>/reject', methods=['POST'])
    def reject_feedback(feedback_id):
        """
        审核拒绝反馈

        请求体 (可选):
        {
            "reason": "原因说明"
        }

        响应:
        {
            "success": true
        }
        """
        try:
            data = request.get_json() or {}
            reason = data.get('reason')

            feedback_service, _ = get_services()
            feedback_service.reject_feedback(feedback_id, reason)

            return jsonify({'success': True})

        except ValueError as e:
            return jsonify({'error': str(e)}), 404
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/app/ai/feedback/stats', methods=['GET'])
    def get_feedback_stats():
        """
        获取反馈统计信息

        查询参数:
        - dept_id: 部门ID (可选)

        响应:
        {
            "total": 500,
            "positive": 400,
            "negative": 100,
            "pending": 15,
            "auto_approved": 320,
            "approved": 50,
            "rejected": 15,
            "recorded": 0,
            "knowledge_base_count": 370
        }
        """
        try:
            dept_id_str = request.args.get('dept_id')
            dept_id = int(dept_id_str) if dept_id_str else None

            feedback_service, _ = get_services()
            stats = feedback_service.get_stats(dept_id)

            return jsonify(stats)

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/app/ai/knowledge', methods=['GET'])
    def get_knowledge_list():
        """
        获取知识库列表

        查询参数:
        - dept_id: 部门ID (必填)
        - indexed: true/false (可选, 是否已归档)
        - limit: 数量限制 (默认100)

        响应:
        {
            "knowledge_list": [...]
        }
        """
        try:
            dept_id_str = request.args.get('dept_id')
            if not dept_id_str:
                return jsonify({'error': 'Missing dept_id'}), 400

            dept_id = int(dept_id_str)
            indexed = request.args.get('indexed')
            if indexed is not None:
                indexed = indexed.lower() == 'true'

            limit = int(request.args.get('limit', 100))

            _, knowledge_service = get_services()
            knowledge_list = knowledge_service.get_knowledge_list(
                dept_id,
                indexed=indexed,
                limit=limit
            )

            return jsonify({
                'knowledge_list': knowledge_list,
                'total': len(knowledge_list)
            })

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/app/ai/knowledge/<kb_id>', methods=['GET'])
    def get_knowledge_detail(kb_id):
        """获取知识库条目详情"""
        try:
            _, knowledge_service = get_services()
            knowledge = knowledge_service.get_knowledge_detail(kb_id)

            if not knowledge:
                return jsonify({'error': 'Knowledge not found'}), 404

            return jsonify(knowledge)

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/app/ai/knowledge/<kb_id>', methods=['PUT'])
    def update_knowledge(kb_id):
        """
        更新知识库条目

        请求体:
        {
            "question": "新问题" (可选),
            "answer": "新答案" (可选),
            "category": "分类" (可选),
            "enabled": true/false (可选)
        }
        """
        try:
            data = request.get_json()

            _, knowledge_service = get_services()
            success = knowledge_service.update_knowledge(kb_id, data)

            if not success:
                return jsonify({'error': 'Update failed'}), 400

            return jsonify({'success': True})

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/app/ai/knowledge/<kb_id>', methods=['DELETE'])
    def delete_knowledge(kb_id):
        """删除知识库条目"""
        try:
            _, knowledge_service = get_services()
            success = knowledge_service.delete_knowledge(kb_id)

            if not success:
                return jsonify({'error': 'Delete failed'}), 404

            return jsonify({'success': True})

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    print("[路由注册] 反馈系统路由已注册")
