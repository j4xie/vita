"""
审批系统补充接口
- 待审批数量统计
- 催办功能
- 审批统计看板
"""
import os
import pymysql
from flask import Blueprint, request, jsonify
from contextlib import contextmanager
from sshtunnel import SSHTunnelForwarder
from datetime import datetime, timedelta

approval_bp = Blueprint('approval', __name__)

# ==================== 数据库连接 ====================

_ssh_tunnel = None


def _get_db_config():
    """获取数据库连接配置"""
    return {
        'host': os.getenv('MYSQL_HOST', '127.0.0.1'),
        'port': int(os.getenv('MYSQL_PORT', '3306')),
        'user': os.getenv('MYSQL_USER', 'root'),
        'password': os.getenv('MYSQL_PASSWORD', ''),
        'database': os.getenv('MYSQL_DATABASE', 'test_inter_stu_center'),
        'charset': 'utf8mb4',
        'cursorclass': pymysql.cursors.DictCursor,
    }


def _ensure_ssh_tunnel():
    """确保 SSH 隧道已建立（本地开发用）"""
    global _ssh_tunnel
    use_ssh = os.getenv('USE_SSH_TUNNEL', 'false').lower() == 'true'
    if not use_ssh:
        return

    if _ssh_tunnel and _ssh_tunnel.is_active:
        return

    import paramiko
    ssh_host = os.getenv('SSH_HOST', '106.14.165.234')
    ssh_port = int(os.getenv('SSH_PORT', '22'))
    ssh_user = os.getenv('SSH_USER', 'root')
    ssh_key_file = os.getenv('SSH_KEY_FILE', '')

    ssh_auth = {}
    if ssh_key_file and os.path.exists(os.path.expanduser(ssh_key_file)):
        key_path = os.path.expanduser(ssh_key_file)
        try:
            pkey = paramiko.RSAKey.from_private_key_file(key_path)
        except Exception:
            try:
                pkey = paramiko.Ed25519Key.from_private_key_file(key_path)
            except Exception:
                pkey = paramiko.ECDSAKey.from_private_key_file(key_path)
        ssh_auth['ssh_pkey'] = pkey
    else:
        ssh_auth['ssh_password'] = os.getenv('SSH_PASSWORD', '')

    mysql_host = os.getenv('MYSQL_HOST', '127.0.0.1')
    mysql_port = int(os.getenv('MYSQL_PORT', '3306'))

    _ssh_tunnel = SSHTunnelForwarder(
        (ssh_host, ssh_port),
        ssh_username=ssh_user,
        **ssh_auth,
        remote_bind_address=(mysql_host, mysql_port),
    )
    _ssh_tunnel.start()
    print(f"[Approval] SSH tunnel started: localhost:{_ssh_tunnel.local_bind_port} -> {mysql_host}:{mysql_port}")


@contextmanager
def get_connection():
    """获取数据库连接（支持 SSH 隧道）"""
    _ensure_ssh_tunnel()
    config = _get_db_config()

    if _ssh_tunnel and _ssh_tunnel.is_active:
        config['host'] = '127.0.0.1'
        config['port'] = _ssh_tunnel.local_bind_port

    conn = pymysql.connect(**config)
    try:
        yield conn
    finally:
        conn.close()


# ==================== 接口实现 ====================

@approval_bp.route('/approval/pending/count', methods=['GET'])
def get_pending_count():
    """
    获取待审批数量
    GET /ai/approval/pending/count?userId=123
    """
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({'code': 400, 'msg': '缺少 userId 参数'}), 400

    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                # 待我审批: 我是审批节点的 operate_id，且节点状态为待处理
                cursor.execute("""
                    SELECT COUNT(*) as cnt FROM sys_progress_node n
                    JOIN sys_progress_instance i ON n.instance_id = i.id
                    WHERE n.operate_id = %s
                    AND n.status = 0
                    AND i.status IN (0, 1)
                """, (user_id,))
                pending_approval = cursor.fetchone()['cnt']

                # 我发起的待处理: 我是发起人，审批还在进行中
                cursor.execute("""
                    SELECT COUNT(*) as cnt FROM sys_progress_instance
                    WHERE promoter_user_id = %s
                    AND status IN (0, 1)
                """, (user_id,))
                pending_submit = cursor.fetchone()['cnt']

                # 抄送我的 (如果有抄送节点类型)
                cursor.execute("""
                    SELECT COUNT(*) as cnt FROM sys_progress_node n
                    JOIN sys_progress_instance i ON n.instance_id = i.id
                    WHERE n.operate_id = %s
                    AND n.type = 'cc'
                    AND n.status = 0
                """, (user_id,))
                pending_cc = cursor.fetchone()['cnt']

        return jsonify({
            'code': 200,
            'data': {
                'pendingApproval': pending_approval,
                'pendingSubmit': pending_submit,
                'pendingCc': pending_cc
            }
        })
    except Exception as e:
        return jsonify({'code': 500, 'msg': f'查询失败: {str(e)}'}), 500


@approval_bp.route('/approval/urge', methods=['POST'])
def urge_approval():
    """
    催办审批
    POST /ai/approval/urge
    Body: { "instanceId": 123, "userId": 456 }
    """
    data = request.get_json()
    instance_id = data.get('instanceId')
    user_id = data.get('userId')

    if not instance_id or not user_id:
        return jsonify({'code': 400, 'msg': '缺少 instanceId 或 userId'}), 400

    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                # 验证: 只有发起人可以催办
                cursor.execute("""
                    SELECT id, status, promoter_user_id FROM sys_progress_instance
                    WHERE id = %s
                """, (instance_id,))
                instance = cursor.fetchone()

                if not instance:
                    return jsonify({'code': 404, 'msg': '审批不存在'}), 404

                if str(instance['promoter_user_id']) != str(user_id):
                    return jsonify({'code': 403, 'msg': '只有发起人可以催办'}), 403

                if instance['status'] not in (0, 1):  # pending, processing
                    return jsonify({'code': 400, 'msg': '当前状态不可催办'}), 400

                # TODO: 检查今天催办次数 (需要催办记录表，暂时跳过)
                # TODO: 发送通知给当前审批人 (需要推送服务集成)

        return jsonify({'code': 200, 'msg': '催办成功'})
    except Exception as e:
        return jsonify({'code': 500, 'msg': f'催办失败: {str(e)}'}), 500


@approval_bp.route('/approval/stats', methods=['GET'])
def get_approval_stats():
    """
    审批统计
    GET /ai/approval/stats?startDate=2026-01-01&endDate=2026-04-04
    """
    start_date = request.args.get('startDate', '2026-01-01')
    end_date = request.args.get('endDate', datetime.now().strftime('%Y-%m-%d'))

    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                # 总体统计
                cursor.execute("""
                    SELECT
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as approved,
                        SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) as rejected,
                        SUM(CASE WHEN status IN (0, 1) THEN 1 ELSE 0 END) as pending,
                        SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) as withdrawn,
                        AVG(TIMESTAMPDIFF(HOUR, create_time, COALESCE(finish_time, NOW()))) as avg_hours
                    FROM sys_progress_instance
                    WHERE create_time BETWEEN %s AND %s
                """, (start_date, end_date + ' 23:59:59'))
                stats = cursor.fetchone()

                # 按模板分组
                cursor.execute("""
                    SELECT
                        i.template_id,
                        t.progress_name as template_name,
                        COUNT(*) as count,
                        SUM(CASE WHEN i.status = 2 THEN 1 ELSE 0 END) as approved,
                        SUM(CASE WHEN i.status = 3 THEN 1 ELSE 0 END) as rejected,
                        SUM(CASE WHEN i.status IN (0, 1) THEN 1 ELSE 0 END) as pending
                    FROM sys_progress_instance i
                    LEFT JOIN sys_progress_template t ON i.template_id = t.id
                    WHERE i.create_time BETWEEN %s AND %s
                    GROUP BY i.template_id, t.progress_name
                """, (start_date, end_date + ' 23:59:59'))
                by_template = cursor.fetchall()

        return jsonify({
            'code': 200,
            'data': {
                'total': stats['total'] or 0,
                'approved': stats['approved'] or 0,
                'rejected': stats['rejected'] or 0,
                'pending': stats['pending'] or 0,
                'withdrawn': stats['withdrawn'] or 0,
                'avgProcessTimeHours': round(float(stats['avg_hours'] or 0), 1),
                'byTemplate': [
                    {
                        'templateId': t['template_id'],
                        'templateName': t['template_name'],
                        'count': t['count'],
                        'approved': t['approved'] or 0,
                        'rejected': t['rejected'] or 0,
                        'pending': t['pending'] or 0,
                    }
                    for t in by_template
                ]
            }
        })
    except Exception as e:
        return jsonify({'code': 500, 'msg': f'统计查询失败: {str(e)}'}), 500
