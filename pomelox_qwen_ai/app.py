import os
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
import dashscope
import uuid
from rag_service import retrieve, get_system_prompt

# 初始化Flask应用
app = Flask(__name__, static_folder='.')
CORS(app)  # 允许跨域请求

# 设置千问API密钥
dashscope.api_key = Config.DASHSCOPE_API_KEY

# 存储会话记录的字典
# 结构: {session_id: {'school_id': str, 'messages': list}}
sessions = {}


# 根路径路由 - 提供前端页面
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


# 静态文件路由
@app.route('/<path:path>')
def static_files(path):
    if os.path.exists(os.path.join('.', path)):
        return send_from_directory('.', path)
    else:
        return jsonify({'error': 'File not found'}), 404


def call_ai_with_web_search(messages, enable_search=False, search_strategy='standard'):
    """
    调用千问API，支持联网搜索功能

    Args:
        messages: 消息列表
        enable_search: 是否启用联网搜索
        search_strategy: 搜索策略 ('standard' 或 'pro')

    Returns:
        tuple: (answer, sources) - 回答内容和来源信息
    """
    call_params = {
        'model': 'qwen-plus',
        'messages': messages,
        'result_format': 'message'
    }

    if enable_search:
        call_params['enable_search'] = True
        call_params['search_options'] = {
            'search_strategy': search_strategy,
            'enable_source': True,
            'enable_citation': True
        }

    # 调用API并处理响应
    response = dashscope.Generation.call(**call_params)
    
    # 根据文档，response可能是GenerationResponse或Generator[GenerationResponse, None, None]
    # 我们需要正确处理这两种情况
    if hasattr(response, 'status_code'):
        # 直接是GenerationResponse对象
        if response.status_code == 200:
            answer = response.output.choices[0].message.content
            sources = None
            try:
                if enable_search and hasattr(response.output, 'search_info'):
                    sources = response.output.search_info
            except Exception:
                pass
            return answer, sources
        else:
            raise Exception(f'API调用失败: {response.message}')
    else:
        # 可能是生成器对象，我们需要遍历它
        # 但根据文档，即使是流式输出也应该返回最后一个完整的响应
        final_response = None
        try:
            for r in response:
                final_response = r
        except TypeError:
            # 如果response不是可迭代对象，直接使用它
            final_response = response
        
        # 处理最终响应
        if final_response and final_response.status_code == 200:
            answer = final_response.output.choices[0].message.content
            sources = None
            try:
                if enable_search and hasattr(final_response.output, 'search_info'):
                    sources = final_response.output.search_info
            except Exception:
                pass
            return answer, sources
        elif final_response:
            raise Exception(f'API调用失败: {final_response.message}')
        else:
            raise Exception('API调用失败: 未收到有效响应')


@app.route('/ask', methods=['POST'])
def ask_ai():
    """提问AI回答的接口（集成RAG功能）"""
    try:
        # 检查请求内容类型
        if not request.is_json:
            return jsonify({'error': '请求必须是JSON格式'}), 400

        # 获取JSON数据
        data = request.get_json(force=True, silent=True)

        # 检查数据是否为空
        if data is None:
            if not request.data or len(request.data) == 0:
                return jsonify({'error': '请求体不能为空'}), 400
            else:
                return jsonify({'error': '请求体必须是有效的JSON格式'}), 400

        # 获取参数
        session_id = data.get('session_id', str(uuid.uuid4()))
        question = data.get('question', '')
        dept_id = data.get('deptId') or data.get('dept_id')  # 支持驼峰和下划线两种格式

        # 验证问题参数
        if not question or not isinstance(question, str):
            return jsonify({'error': '问题不能为空且必须是字符串'}), 400

        # 验证 deptId 参数
        if not dept_id:
            return jsonify({
                'error': 'deptId 不能为空',
                'available_dept_ids': list(Config.DEPT_TO_SCHOOL.keys())
            }), 400

        # 确保 dept_id 是整数
        try:
            dept_id = int(dept_id)
        except (ValueError, TypeError):
            return jsonify({
                'error': f'无效的部门ID格式: {dept_id}',
                'available_dept_ids': list(Config.DEPT_TO_SCHOOL.keys())
            }), 400

        # 通过 deptId 映射获取 school_id
        # 先从/schools接口获取学校列表
        try:
            schools_response = requests.get('http://106.14.165.234:8085/app/dept/list')
            schools_response.raise_for_status()
            schools_data = schools_response.json()
            
            # 在返回的数据中查找对应的school_id
            school_id = None
            for item in schools_data.get('data', []):
                if item.get('deptId') == dept_id:
                    school_id = item.get('aprName')
                    break
                    
            if not school_id:
                return jsonify({
                    'error': f'未找到部门ID对应的学校: {dept_id}',
                    'available_dept_ids': [item.get('deptId') for item in schools_data.get('data', []) if item.get('deptId')]
                }), 200
            print(f"[Auth] 通过 deptId={dept_id} 匹配到学校: {school_id}")
        except Exception as e:
            return jsonify({
                'error': f'获取学校映射失败: {str(e)}'
            }), 500

        # 如果会话不存在，创建新的会话
        if session_id not in sessions:
            sessions[session_id] = {
                'school_id': school_id,
                'messages': []
            }

        # 检查会话的学校ID是否一致
        if sessions[session_id]['school_id'] != school_id:
            # 学校变更，清空历史记录
            sessions[session_id] = {
                'school_id': school_id,
                'messages': []
            }

        # RAG 检索相关内容，获取内容、分数和质量标志
        retrieved_content, max_score, has_high_quality = retrieve(school_id, question)

        # 判断是否需要启用联网搜索
        use_web_search = False
        if not has_high_quality and Config.ENABLE_WEB_SEARCH_FALLBACK:
            use_web_search = True
            print(f"[RAG] 检索分数: {max_score:.3f}, 低于高质量阈值，启用联网搜索")
        else:
            print(f"[RAG] 检索分数: {max_score:.3f}, 使用知识库内容")

        # 生成 system prompt
        system_prompt = get_system_prompt(school_id, retrieved_content, use_web_search)

        # 构建消息列表
        messages = [{'role': 'system', 'content': system_prompt}]
        messages.extend(sessions[session_id]['messages'])
        messages.append({'role': 'user', 'content': question})

        # 调用千问API（根据需要启用联网搜索）
        answer, sources = call_ai_with_web_search(
            messages,
            enable_search=use_web_search,
            search_strategy=Config.WEB_SEARCH_STRATEGY
        )

        # 保存对话记录（不保存 system prompt，只保存用户对话）
        sessions[session_id]['messages'].append({'role': 'user', 'content': question})
        sessions[session_id]['messages'].append({'role': 'assistant', 'content': answer})

        # 构建响应
        response_data = {
            'session_id': session_id,
            'school_id': school_id,
            'question': question,
            'answer': answer,
            'source_type': 'web_search' if use_web_search else 'knowledge_base',
            'rag_score': round(max_score, 3)
        }

        # 如果有联网搜索来源，添加到响应中
        if sources:
            response_data['web_sources'] = sources

        return jsonify(response_data)

    except Exception as e:
        # 捕获所有异常并返回适当的错误信息
        error_msg = str(e)
        if "Failed to decode JSON object" in error_msg:
            return jsonify({'error': '请求体必须是有效的JSON格式'}), 400
        return jsonify({'error': f'服务器错误: {error_msg}'}), 500


@app.route('/history/<session_id>', methods=['GET'])
def get_history(session_id):
    """查询对话的接口"""
    try:
        if session_id in sessions:
            return jsonify({
                'session_id': session_id,
                'school_id': sessions[session_id]['school_id'],
                'history': sessions[session_id]['messages']
            })
        else:
            return jsonify({'error': '会话不存在'}), 404
    except Exception as e:
        return jsonify({'error': f'服务器错误: {str(e)}'}), 500


@app.route('/clear/<session_id>', methods=['DELETE'])
def clear_session(session_id):
    """清除会话记录的接口"""
    try:
        if session_id in sessions:
            del sessions[session_id]
            return jsonify({'message': '会话记录已清除'})
        else:
            return jsonify({'error': '会话不存在'}), 404
    except Exception as e:
        return jsonify({'error': f'服务器错误: {str(e)}'}), 500


@app.route('/schools', methods=['GET'])
def list_schools():
    """获取可用学校列表的接口"""
    try:
        # 发起HTTP请求获取学校列表
        response = requests.get('http://106.14.165.234:8085/app/dept/list')
        response.raise_for_status()  # 如果响应状态码不是200，会抛出异常
        api_response = response.json()
        
        # 转换数据格式
        schools = {}
        for item in api_response.get('data', []):
            dept_id = item.get('deptId')
            apr_name = item.get('aprName')
            
            # 只处理有aprName的记录
            if apr_name:
                schools[apr_name] = {
                    'name': item.get('engName', ''),
                    'name_cn': item.get('deptName', ''),
                    'file': apr_name,
                    'deptId': dept_id
                }
        
        # 返回转换后的数据
        return jsonify({'schools': schools})
    except requests.RequestException as e:
        # 如果请求失败，返回错误信息
        return jsonify({'error': f'获取学校列表失败: {str(e)}'}), 500
    except Exception as e:
        # 如果其他异常，返回错误信息
        return jsonify({'error': f'服务器内部错误: {str(e)}'}), 500


@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({'status': 'healthy'})


if __name__ == '__main__':
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
