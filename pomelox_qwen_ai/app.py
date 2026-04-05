from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from config import Config
try:
    import dashscope
except ImportError:
    dashscope = None
    print("Warning: dashscope module not available. AI features will be disabled.")
import uuid
import json
import os
import time
import signal
import threading
import fcntl
from core.rag_service import retrieve, get_system_prompt
from core.cache_service import get_cached_response, set_cached_response, get_cache_stats, clear_all_cache, clear_cache_by_dept, reset_stats
from core.scope_filter import is_off_topic, get_off_topic_reply, classify_simple_chat, get_simple_reply
from core.form_knowledge_service import match_forms, build_form_designer_prompt, get_kb_stats, format_form_examples
from database import get_database
from core.approval_routes import approval_bp
from core.exchange_rate_routes import exchange_rate_bp, start_rate_scheduler

# Initialize Flask application
app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Register blueprints for new features
app.register_blueprint(approval_bp)
app.register_blueprint(exchange_rate_bp)

# Set Qwen API key (from Config if available, otherwise from env)
if dashscope is not None:
    dashscope.api_key = getattr(Config, 'DASHSCOPE_API_KEY', None) or os.environ.get('DASHSCOPE_API_KEY', '')

# Chat history storage path
CHAT_HISTORY_PATH = os.path.join(os.path.dirname(__file__), 'data', 'chat_history.json')

# Session storage — Redis-backed for multi-worker (Gunicorn) compatibility
from core.session_store import (
    ensure_session, append_messages,
    get_session_messages as get_store_messages,
    get_session, delete_session as delete_store_session,
    get_session_dept_id, set_session
)


# ==================== Chat History File Storage (with file locking) ====================
_chat_history_lock = threading.Lock()


def load_chat_history():
    """Load chat history from file (thread-safe with file lock)"""
    if os.path.exists(CHAT_HISTORY_PATH):
        try:
            with _chat_history_lock:
                with open(CHAT_HISTORY_PATH, 'r', encoding='utf-8') as f:
                    fcntl.flock(f, fcntl.LOCK_SH)
                    try:
                        return json.load(f)
                    finally:
                        fcntl.flock(f, fcntl.LOCK_UN)
        except Exception as e:
            print(f"Failed to load chat history: {e}")
            return []
    return []


def save_chat_history(history):
    """Save chat history to file (thread-safe with file lock)"""
    try:
        with _chat_history_lock:
            with open(CHAT_HISTORY_PATH, 'w', encoding='utf-8') as f:
                fcntl.flock(f, fcntl.LOCK_EX)
                try:
                    json.dump(history, f, ensure_ascii=False, indent=2)
                finally:
                    fcntl.flock(f, fcntl.LOCK_UN)
        return True
    except Exception as e:
        print(f"Failed to save chat history: {e}")
        return False


@app.route('/chat-history', methods=['GET'])
def get_chat_history():
    """Get all chat history"""
    history = load_chat_history()
    return jsonify({'chats': history})


@app.route('/chat-history', methods=['POST'])
def save_chat():
    """Save or update chat record"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body cannot be empty'}), 400

        session_id = data.get('sessionId')
        if not session_id:
            return jsonify({'error': 'sessionId cannot be empty'}), 400

        history = load_chat_history()

        # Check if session already exists
        existing_index = next((i for i, chat in enumerate(history) if chat.get('sessionId') == session_id), -1)

        chat_data = {
            'sessionId': session_id,
            'deptId': data.get('deptId'),
            'schoolId': data.get('schoolId'),
            'schoolName': data.get('schoolName'),
            'title': data.get('title', 'New Chat'),
            'messages': data.get('messages', []),
            'updatedAt': data.get('updatedAt'),
            'createdAt': data.get('createdAt') if existing_index < 0 else history[existing_index].get('createdAt')
        }

        if existing_index >= 0:
            history[existing_index] = chat_data
        else:
            history.insert(0, chat_data)

        if save_chat_history(history):
            return jsonify({'success': True, 'message': 'Save successful'})
        else:
            return jsonify({'error': 'Save failed'}), 500

    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@app.route('/chat-history/<session_id>', methods=['DELETE'])
def delete_chat(session_id):
    """Delete specified chat record"""
    try:
        history = load_chat_history()
        new_history = [chat for chat in history if chat.get('sessionId') != session_id]

        if len(new_history) == len(history):
            return jsonify({'error': 'Session does not exist'}), 404

        if save_chat_history(new_history):
            return jsonify({'success': True, 'message': 'Delete successful'})
        else:
            return jsonify({'error': 'Delete failed'}), 500

    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@app.route('/chat-history/clear', methods=['DELETE'])
def clear_all_chats():
    """Clear all chat history"""
    try:
        if save_chat_history([]):
            return jsonify({'success': True, 'message': 'All history cleared'})
        else:
            return jsonify({'error': 'Clear failed'}), 500
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


DASHSCOPE_TIMEOUT = 30  # seconds


def call_ai_with_web_search(messages, enable_search=False, search_strategy='standard'):
    # Check if dashscope is available
    if dashscope is None:
        return "抱歉，AI服务暂时不可用，请稍后再试。", None
    """
    Call Qwen API with web search support

    Args:
        messages: Message list
        enable_search: Whether to enable web search
        search_strategy: Search strategy ('standard' or 'pro')

    Returns:
        tuple: (answer, sources) - Answer content and source information
    """
    call_params = {
        'model': 'qwen-plus',
        'messages': messages,
        'result_format': 'message',
        'max_tokens': 768
    }

    if enable_search:
        call_params['enable_search'] = True
        call_params['search_options'] = {
            'search_strategy': search_strategy,
            'enable_source': True,
            'enable_citation': True
        }

    # P1: Timeout protection for DashScope API call
    # Use signal.alarm in main thread, threading.Timer as fallback
    response = None
    timeout_error = [False]  # mutable container for closure

    def _timeout_callback():
        timeout_error[0] = True

    timer = threading.Timer(DASHSCOPE_TIMEOUT, _timeout_callback)
    timer.start()
    try:
        response = dashscope.Generation.call(**call_params)
    finally:
        timer.cancel()

    if timeout_error[0]:
        raise TimeoutError(f"DashScope API call timed out after {DASHSCOPE_TIMEOUT}s")

    if response.status_code == 200:
        answer = response.output.choices[0].message.content
        # Get search source information (if available)
        sources = None
        try:
            if enable_search:
                # Check search_info in output (primary location for web search results)
                if hasattr(response.output, 'search_info'):
                    sources = response.output.search_info

                # Check web_search_results in message (alternative location)
                message = response.output.choices[0].message
                if hasattr(message, 'web_search_results'):
                    sources = {'search_results': message.web_search_results}

                # Check web_search in output (another alternative)
                if hasattr(response.output, 'web_search'):
                    sources = response.output.web_search
        except Exception as e:
            print(f"[Web Search] Error getting sources: {e}")
        return answer, sources
    else:
        raise Exception(f'API call failed: {response.message}')


@app.route('/ask', methods=['POST'])
def ask_ai():
    """AI Q&A endpoint (integrated with RAG)"""
    try:
        # Check request content type
        if not request.is_json:
            return jsonify({'error': 'Request must be in JSON format'}), 400

        # Get JSON data
        data = request.get_json(force=True, silent=True)

        # Check if data is empty
        if data is None:
            if not request.data or len(request.data) == 0:
                return jsonify({'error': 'Request body cannot be empty'}), 400
            else:
                return jsonify({'error': 'Request body must be valid JSON format'}), 400

        # Get parameters
        session_id = data.get('session_id', str(uuid.uuid4()))
        question = data.get('question', '')
        dept_id = data.get('deptId') or data.get('dept_id')  # Support both camelCase and snake_case

        # Validate question parameter
        if not question or not isinstance(question, str):
            return jsonify({'error': 'Question cannot be empty and must be a string'}), 400

        # Validate deptId parameter
        if not dept_id:
            return jsonify({
                'error': 'deptId cannot be empty',
                'available_dept_ids': Config.VALID_DEPT_IDS
            }), 400

        # Ensure dept_id is an integer
        try:
            dept_id = int(dept_id)
        except (ValueError, TypeError):
            return jsonify({
                'error': f'Invalid department ID format: {dept_id}',
                'available_dept_ids': Config.VALID_DEPT_IDS
            }), 400

        # Check if dept_id has a dedicated knowledge base
        # Unknown dept_ids are allowed - they will fallback to web search
        dept_info = Config.DEPARTMENTS.get(dept_id, {})
        if dept_id not in Config.DEPARTMENTS:
            print(f"[Auth] Department ID: {dept_id} (no knowledge base, will use web search fallback)")
        else:
            print(f"[Auth] Department ID: {dept_id} ({dept_info.get('name', 'Unknown')})")

        # Ensure session exists (creates if missing, resets if dept changed)
        ensure_session(session_id, dept_id)

        t_start = time.time()

        # Simple chat fast path (FIRST): skip cache, RAG, and LLM for greetings/thanks/confirmations
        simple_intent = classify_simple_chat(question)
        if simple_intent:
            canned = get_simple_reply(simple_intent, dept_id)
            if canned:
                # Canned reply — no cache lookup, no LLM call, instant response
                print(f"[SimpleChat] Canned reply ({simple_intent}): {question[:30]} [{time.time() - t_start:.3f}s]", flush=True)
                append_messages(session_id, question, canned)
                user_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
                return jsonify({
                    'session_id': session_id,
                    'question': question,
                    'answer': canned,
                    'dept_id': dept_id,
                    'rag_score': 0,
                    'source_type': 'simple_chat',
                    'message_id': user_msg_id
                })
            # else: confirm/followup — fall through to LLM-only path below

        # Check cache (exact + semantic match)
        cached = get_cached_response(question, dept_id)
        if cached:
            print(f"[Timing /ask] Cache HIT: {time.time() - t_start:.3f}s", flush=True)
            user_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
            return jsonify({
                'session_id': session_id,
                'question': question,
                'answer': cached['answer'],
                'dept_id': dept_id,
                'rag_score': cached.get('rag_score', 0),
                'source_type': 'cache',
                'message_id': user_msg_id
            })

        # Scope filter: reject off-topic questions before RAG/LLM
        if is_off_topic(question):
            reply = get_off_topic_reply(dept_id)
            print(f"[Scope] OFF-TOPIC rejected: {question[:30]}", flush=True)
            user_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
            return jsonify({
                'session_id': session_id,
                'question': question,
                'answer': reply,
                'dept_id': dept_id,
                'rag_score': 0,
                'source_type': 'scope_filter',
                'message_id': user_msg_id
            })

        # Simple chat LLM-only path (confirm/followup): skip RAG, use LLM with history
        if simple_intent:
            # LLM without RAG — natural continuation with conversation history
            print(f"[SimpleChat] LLM-only ({simple_intent}), skipping RAG: {question[:30]}", flush=True)
            system_prompt = get_system_prompt(dept_id, "", False)
            messages = [{'role': 'system', 'content': system_prompt}]
            messages.extend(get_store_messages(session_id))
            messages.append({'role': 'user', 'content': question})
            t_llm = time.time()
            answer, _ = call_ai_with_web_search(messages, enable_search=False)
            print(f"[Timing /ask] SimpleChat LLM: {time.time() - t_llm:.2f}s | Total: {time.time() - t_start:.2f}s", flush=True)
            append_messages(session_id, question, answer)
            user_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
            return jsonify({
                'session_id': session_id,
                'question': question,
                'answer': answer,
                'dept_id': dept_id,
                'rag_score': 0,
                'source_type': 'simple_chat',
                'message_id': user_msg_id
            })

        # RAG retrieve relevant content, get content, score and quality flag
        t_rag = time.time()
        retrieved_content, max_score, has_high_quality = retrieve(dept_id, question)
        print(f"[Timing /ask] RAG retrieval: {time.time() - t_rag:.2f}s (score={max_score:.2f})", flush=True)

        # Determine if web search should be enabled
        use_web_search = False
        if not has_high_quality and Config.ENABLE_WEB_SEARCH_FALLBACK:
            use_web_search = True
            print(f"[RAG] Retrieval score: {max_score:.3f}, below high-quality threshold, enabling web search")
        else:
            print(f"[RAG] Retrieval score: {max_score:.3f}, using knowledge base content")

        # Generate system prompt
        system_prompt = get_system_prompt(dept_id, retrieved_content, use_web_search)

        # Build message list
        messages = [{'role': 'system', 'content': system_prompt}]
        messages.extend(get_store_messages(session_id))
        messages.append({'role': 'user', 'content': question})

        # Call Qwen API (enable web search if needed)
        t_llm = time.time()
        answer, sources = call_ai_with_web_search(
            messages,
            enable_search=use_web_search,
            search_strategy=Config.WEB_SEARCH_STRATEGY
        )
        t_end = time.time()
        print(f"[Timing /ask] LLM: {t_end - t_llm:.2f}s | Total: {t_end - t_start:.2f}s | Output: {len(answer)} chars", flush=True)

        # Cache the response for future exact-match hits
        source_type = 'web_search' if use_web_search else 'knowledge_base'
        set_cached_response(question, dept_id, answer, rag_score=max_score, source_type=source_type)

        # Save conversation history (Redis-backed, auto-trimmed)
        append_messages(session_id, question, answer)

        # Generate message IDs
        user_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
        assistant_msg_id = f"msg_{uuid.uuid4().hex[:12]}"

        # Save to database (if userId provided)
        user_id = data.get('userId')
        if user_id:
            try:
                user_id = int(user_id)
                db = get_database()

                # Create session if not exists
                db.create_chat_session(
                    session_id=session_id,
                    user_id=user_id,
                    dept_id=dept_id,
                    title=question[:50]  # Use question as title
                )

                # Save user message
                db.save_chat_message(
                    message_id=user_msg_id,
                    session_id=session_id,
                    user_id=user_id,
                    role='user',
                    content=question,
                    rag_score=None,
                    source_type=None
                )

                # Save assistant message
                db.save_chat_message(
                    message_id=assistant_msg_id,
                    session_id=session_id,
                    user_id=user_id,
                    role='assistant',
                    content=answer,
                    rag_score=max_score,
                    source_type='web_search' if use_web_search else 'knowledge_base'
                )

                print(f"[Database] Saved conversation to database: session={session_id}, user={user_id}")

            except Exception as e:
                print(f"[Database] Failed to save conversation: {e}")
                # Continue even if database save fails

        # Build response
        response_data = {
            'session_id': session_id,
            'message_id': assistant_msg_id,
            'dept_id': dept_id,
            'question': question,
            'answer': answer,
            'source_type': 'web_search' if use_web_search else 'knowledge_base',
            'rag_score': round(max_score, 3)
        }

        # If web search sources exist, add to response
        if sources:
            response_data['web_sources'] = sources

        return jsonify(response_data)

    except Exception as e:
        # Catch all exceptions and return appropriate error message
        error_msg = str(e)
        if "Failed to decode JSON object" in error_msg:
            return jsonify({'error': 'Request body must be valid JSON format'}), 400
        return jsonify({'error': f'Server error: {error_msg}'}), 500




@app.route('/history/<session_id>', methods=['GET'])
def get_history(session_id):
    """Query conversation history endpoint"""
    try:
        session = get_session(session_id)
        if session:
            return jsonify({
                'session_id': session_id,
                'dept_id': session.get('dept_id'),
                'history': session.get('messages', [])
            })
        else:
            return jsonify({'error': 'Session does not exist'}), 404
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@app.route('/clear/<session_id>', methods=['DELETE'])
def clear_session(session_id):
    """Clear session records endpoint"""
    try:
        session = get_session(session_id)
        if session:
            delete_store_session(session_id)
            return jsonify({'message': 'Session cleared'})
        else:
            return jsonify({'error': 'Session does not exist'}), 404
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@app.route('/departments', methods=['GET'])
def list_departments():
    """Get available departments list endpoint"""
    return jsonify({
        'departments': Config.DEPARTMENTS
    })

@app.route('/schools', methods=['GET'])
def list_schools():
    """Get available schools list endpoint (deprecated, use /departments)"""
    return jsonify({
        'departments': Config.DEPARTMENTS
    })


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})


@app.route('/cache/stats', methods=['GET'])
def cache_stats():
    """Cache statistics endpoint"""
    return jsonify(get_cache_stats())


@app.route('/cache/clear', methods=['POST'])
def cache_clear():
    """Clear chat cache. Use after updating knowledge base.
    Optional body: {"dept_id": 216} to clear specific school, or empty to clear all."""
    data = request.get_json(force=True, silent=True) or {}
    dept_id = data.get('dept_id')
    if dept_id:
        deleted = clear_cache_by_dept(int(dept_id))
    else:
        deleted = clear_all_cache()
    return jsonify({'cleared': deleted})


# ==================== 会话管理API ====================
@app.route('/api/ai/sessions', methods=['GET'])
def get_user_sessions():
    """获取用户的聊天会话列表"""
    try:
        user_id = request.args.get('userId')
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('pageSize', 20))

        if not user_id:
            return jsonify({'error': '缺少userId参数'}), 400

        user_id = int(user_id)
        offset = (page - 1) * page_size

        db = get_database()
        sessions_list = db.get_user_chat_sessions(user_id, offset, page_size)

        return jsonify({
            'sessions': sessions_list,
            'page': page,
            'pageSize': page_size
        })

    except Exception as e:
        return jsonify({'error': f'服务器错误: {str(e)}'}), 500


@app.route('/api/ai/session/<session_id>/messages', methods=['GET'])
def get_session_messages(session_id):
    """获取会话的消息列表"""
    try:
        user_id = request.args.get('userId')

        if not user_id:
            return jsonify({'error': '缺少userId参数'}), 400

        user_id = int(user_id)
        db = get_database()
        messages = db.get_chat_messages(session_id, user_id)

        return jsonify({
            'session_id': session_id,
            'messages': messages
        })

    except Exception as e:
        return jsonify({'error': f'服务器错误: {str(e)}'}), 500


@app.route('/api/ai/session/<session_id>', methods=['DELETE'])
def delete_user_session(session_id):
    """删除用户会话"""
    try:
        user_id = request.args.get('userId')

        if not user_id:
            return jsonify({'error': '缺少userId参数'}), 400

        user_id = int(user_id)
        db = get_database()
        db.delete_chat_session(session_id, user_id)

        return jsonify({'message': '会话已删除'})

    except Exception as e:
        return jsonify({'error': f'服务器错误: {str(e)}'}), 500




@app.route('/api/ai/chat', methods=['POST'])
def api_ai_chat():
    """Non-streaming AI Chat endpoint (compatible with App)"""
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({'error': 'Request body cannot be empty'}), 400

        message = data.get('message', '') or data.get('question', '')
        session_id = data.get('session_id', str(uuid.uuid4()))
        dept_id = data.get('dept_id') or data.get('deptId')

        if not message:
            return jsonify({'error': 'Message cannot be empty'}), 400
        if not dept_id:
            return jsonify({'error': 'dept_id cannot be empty'}), 400

        dept_id = int(dept_id)

        ensure_session(session_id, dept_id)

        # Simple chat fast path (FIRST): skip cache, RAG, and LLM for canned replies
        simple_intent = classify_simple_chat(message)
        if simple_intent:
            canned = get_simple_reply(simple_intent, dept_id)
            if canned:
                print(f"[SimpleChat] Canned reply ({simple_intent}): {message[:30]}", flush=True)
                append_messages(session_id, message, canned)
                return jsonify({'response': canned, 'session_id': session_id, 'source_type': 'simple_chat'})

        # Scope filter: reject off-topic before RAG/LLM
        if is_off_topic(message):
            reply = get_off_topic_reply(dept_id)
            print("[Scope] OFF-TOPIC rejected (non-stream): %s" % message[:30], flush=True)
            return jsonify({'answer': reply, 'session_id': session_id, 'source_type': 'scope_filter'})

        # Check cache (exact + semantic match)
        cached = get_cached_response(message, dept_id)
        if cached:
            return jsonify({
                'session_id': session_id,
                'response': cached['answer'],
                'source_type': 'cache',
                'message_count': len(get_store_messages(session_id))
            })

        # Simple chat LLM-only path (confirm/followup): skip RAG, use LLM with history
        if simple_intent:
            print(f"[SimpleChat] LLM-only ({simple_intent}): {message[:30]}", flush=True)
            system_prompt = get_system_prompt(dept_id, "", False)
            messages_list = [{'role': 'system', 'content': system_prompt}]
            messages_list.extend(get_store_messages(session_id))
            messages_list.append({'role': 'user', 'content': message})
            answer, _ = call_ai_with_web_search(messages_list, enable_search=False)
            append_messages(session_id, message, answer)
            return jsonify({'response': answer, 'session_id': session_id, 'source_type': 'simple_chat'})

        skip_rag = data.get('skipRag', False)
        if skip_rag:
            retrieved_content, max_score, has_high_quality = "", 0.0, True
            use_web_search = False
            system_prompt = get_system_prompt(dept_id, "", False)
        else:
            retrieved_content, max_score, has_high_quality = retrieve(dept_id, message)
            use_web_search = not has_high_quality and Config.ENABLE_WEB_SEARCH_FALLBACK
            system_prompt = get_system_prompt(dept_id, retrieved_content, use_web_search)

        messages_list = [{'role': 'system', 'content': system_prompt}]
        messages_list.extend(get_store_messages(session_id))
        messages_list.append({'role': 'user', 'content': message})

        answer, sources = call_ai_with_web_search(
            messages_list,
            enable_search=use_web_search,
            search_strategy=Config.WEB_SEARCH_STRATEGY
        )

        # Cache the response
        if not skip_rag:
            src_type = 'web_search' if use_web_search else 'knowledge_base'
            set_cached_response(message, dept_id, answer, rag_score=max_score, source_type=src_type)

        append_messages(session_id, message, answer)

        return jsonify({
            'session_id': session_id,
            'response': answer,
            'message_count': len(get_store_messages(session_id))
        })

    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@app.route('/api/ai/chat/stream', methods=['POST'])
def api_ai_chat_stream():
    """Streaming AI Chat endpoint (SSE)"""
    from flask import Response, stream_with_context
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({'error': 'Request body cannot be empty'}), 400

        message = data.get('message', '') or data.get('question', '')
        session_id = data.get('session_id', str(uuid.uuid4()))
        dept_id = data.get('dept_id') or data.get('deptId')
        model = data.get('model', 'qwen-plus')
        skip_rag = data.get('skipRag', False)

        if not message:
            return jsonify({'error': 'Message cannot be empty'}), 400
        if not dept_id:
            return jsonify({'error': 'dept_id cannot be empty'}), 400

        dept_id = int(dept_id)

        def generate():
            try:
                t_start = time.time()

                # Simple chat fast path (FIRST): instant canned reply, no cache/RAG/LLM
                simple_intent = classify_simple_chat(message)
                if simple_intent:
                    canned = get_simple_reply(simple_intent, dept_id)
                    if canned:
                        print(f"[SimpleChat] Canned reply (stream, {simple_intent}): {message[:30]}", flush=True)
                        ensure_session(session_id, dept_id)
                        append_messages(session_id, message, canned)
                        yield f"data: {json.dumps({'type': 'start', 'session_id': session_id})}\n\n"
                        yield f"data: {json.dumps({'type': 'chunk', 'content': canned})}\n\n"
                        yield f"data: {json.dumps({'type': 'done', 'session_id': session_id, 'full_content': canned})}\n\n"
                        return

                # Scope filter: reject off-topic before RAG/LLM
                if is_off_topic(message):
                    reply = get_off_topic_reply(dept_id)
                    print("[Scope] OFF-TOPIC rejected (stream): %s" % message[:30], flush=True)
                    yield f"data: {json.dumps({'type': 'start', 'session_id': session_id})}\n\n"
                    # Simulate streaming for off-topic replies
                    for i in range(0, len(reply), 30):
                        yield f"data: {json.dumps({'type': 'chunk', 'content': reply[i:i+30]})}\n\n"
                        time.sleep(0.02)
                    yield f"data: {json.dumps({'type': 'done', 'session_id': session_id, 'full_content': reply})}\n\n"
                    return

                # Simple chat LLM-only path (confirm/followup): skip RAG, stream with history
                if simple_intent and not get_simple_reply(simple_intent, dept_id):
                    # LLM without RAG — stream directly, skip retrieval stage
                        print(f"[SimpleChat] LLM-only stream ({simple_intent}): {message[:30]}", flush=True)
                        ensure_session(session_id, dept_id)
                        yield f"data: {json.dumps({'type': 'progress', 'stage': 'generating', 'message': '正在生成回答...'})}\n\n"
                        system_prompt = get_system_prompt(dept_id, "", False)
                        messages_list = [{'role': 'system', 'content': system_prompt}]
                        messages_list.extend(get_store_messages(session_id))
                        messages_list.append({'role': 'user', 'content': message})
                        yield f"data: {json.dumps({'type': 'start', 'session_id': session_id})}\n\n"
                        full_content = ''
                        call_params = {
                            'model': model,
                            'messages': messages_list,
                            'result_format': 'message',
                            'stream': True,
                            'incremental_output': True,
                            'max_tokens': 768
                        }
                        responses = dashscope.Generation.call(**call_params)
                        for response in responses:
                            if response.status_code == 200:
                                if response.output and response.output.choices:
                                    chunk = response.output.choices[0].message.content
                                    if chunk:
                                        full_content += chunk
                                        yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
                            else:
                                yield f"data: {json.dumps({'type': 'error', 'message': response.message})}\n\n"
                                return
                        append_messages(session_id, message, full_content)
                        yield f"data: {json.dumps({'type': 'done', 'session_id': session_id, 'full_content': full_content})}\n\n"
                        return

                # Check cache first (exact match) - stream cached response as chunks
                if not skip_rag:
                    cached = get_cached_response(message, dept_id)
                    if cached:
                        print(f"[Timing] Cache HIT (stream): {time.time() - t_start:.3f}s", flush=True)
                        yield f"data: {json.dumps({'type': 'start', 'session_id': session_id})}\n\n"
                        # Simulate streaming for cached responses
                        answer = cached['answer']
                        for i in range(0, len(answer), 30):
                            yield f"data: {json.dumps({'type': 'chunk', 'content': answer[i:i+30]})}\n\n"
                            time.sleep(0.02)
                        yield f"data: {json.dumps({'type': 'done', 'session_id': session_id, 'full_content': answer})}\n\n"
                        return

                ensure_session(session_id, dept_id)

                # P0: Send progress event — retrieving
                yield f"data: {json.dumps({'type': 'progress', 'stage': 'retrieving', 'message': '正在检索知识库...'})}\n\n"

                if skip_rag:
                    retrieved_content, max_score, has_high_quality = "", 0.0, True
                    use_web_search = False
                    system_prompt = get_system_prompt(dept_id, "", False)
                    print(f"[RAG] Skipped - client provided context (deptId={dept_id})")
                else:
                    t_rag = time.time()
                    retrieved_content, max_score, has_high_quality = retrieve(dept_id, message)
                    print(f"[Timing] RAG retrieval: {time.time() - t_rag:.2f}s (score={max_score:.2f})", flush=True)
                    use_web_search = not has_high_quality and Config.ENABLE_WEB_SEARCH_FALLBACK
                    system_prompt = get_system_prompt(dept_id, retrieved_content, use_web_search)

                # P0: Send progress event — generating
                yield f"data: {json.dumps({'type': 'progress', 'stage': 'generating', 'message': '正在生成回答...'})}\n\n"

                messages_list = [{'role': 'system', 'content': system_prompt}]
                messages_list.extend(get_store_messages(session_id))
                messages_list.append({'role': 'user', 'content': message})

                yield f"data: {json.dumps({'type': 'start', 'session_id': session_id})}\n\n"

                full_content = ''
                t_llm = time.time()
                t_first_chunk = None
                call_params = {
                    'model': model,
                    'messages': messages_list,
                    'result_format': 'message',
                    'stream': True,
                    'incremental_output': True,
                    'max_tokens': 768
                }
                if use_web_search:
                    call_params['enable_search'] = True

                # P1: Streaming timeout — cancel if no chunks received within DASHSCOPE_TIMEOUT
                stream_timeout_flag = [False]
                def _stream_timeout():
                    stream_timeout_flag[0] = True
                stream_timer = threading.Timer(DASHSCOPE_TIMEOUT, _stream_timeout)
                stream_timer.start()

                responses = dashscope.Generation.call(**call_params)
                for response in responses:
                    if stream_timeout_flag[0]:
                        yield f"data: {json.dumps({'type': 'error', 'message': f'DashScope streaming timed out after {DASHSCOPE_TIMEOUT}s'})}\n\n"
                        return
                    if response.status_code == 200:
                        if response.output and response.output.choices:
                            chunk = response.output.choices[0].message.content
                            if chunk:
                                if t_first_chunk is None:
                                    t_first_chunk = time.time()
                                    print(f"[Timing] LLM TTFB: {t_first_chunk - t_llm:.2f}s", flush=True)
                                    # Reset timer after first chunk — LLM is responding
                                    stream_timer.cancel()
                                    stream_timer = threading.Timer(60, _stream_timeout)
                                    stream_timer.start()
                                full_content += chunk
                                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
                    else:
                        stream_timer.cancel()
                        yield f"data: {json.dumps({'type': 'error', 'message': response.message})}\n\n"
                        return

                stream_timer.cancel()
                t_end = time.time()
                # Try to get token usage from last response
                output_tokens = 0
                try:
                    if hasattr(response, 'usage') and response.usage:
                        output_tokens = getattr(response.usage, 'output_tokens', 0)
                except Exception:
                    pass
                print(f"[Timing] LLM total: {t_end - t_llm:.2f}s | Total request: {t_end - t_start:.2f}s | Output: {len(full_content)} chars, {output_tokens} tokens", flush=True)

                # Cache the response
                if not skip_rag:
                    src_type = 'web_search' if use_web_search else 'knowledge_base'
                    set_cached_response(message, dept_id, full_content, rag_score=max_score, source_type=src_type)

                append_messages(session_id, message, full_content)

                yield f"data: {json.dumps({'type': 'done', 'session_id': session_id, 'full_content': full_content})}\n\n"

            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

        return Response(
            stream_with_context(generate()),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'
            }
        )

    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


# ==================== Form Designer Knowledge Base API ====================

@app.route('/api/ai/form-designer/match', methods=['POST'])
def api_form_designer_match():
    """Match user question to relevant real form examples from knowledge base"""
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({'error': 'Request body cannot be empty'}), 400

        question = data.get('question', '')
        top_k = data.get('top_k', 5)

        if not question:
            return jsonify({'error': 'Question cannot be empty'}), 400

        matched = match_forms(question, top_k=int(top_k))
        return jsonify({
            'matched': [{
                'id': f.get('id'),
                'name': f.get('name'),
                'fieldCount': len(f.get('fields', [])),
                'fields': f.get('fields', []),
                'hasPayment': f.get('hasPayment', False),
                'hasSignature': f.get('hasSignature', False),
                'pages': f.get('pages', 1),
            } for f in matched],
            'total_kb': len(match_forms.__globals__.get('_FORM_KB', []))
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ai/form-designer/chat/stream', methods=['POST'])
def api_form_designer_chat_stream():
    """
    Streaming AI Chat endpoint for Form Designer.
    Builds system prompt with knowledge base matching on the backend.
    Frontend sends raw user question + designer context.
    """
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({'error': 'Request body cannot be empty'}), 400

        message = data.get('message', '') or data.get('question', '')
        session_id = data.get('session_id', str(uuid.uuid4()))
        model = data.get('model', 'qwen-plus')
        image_data = data.get('image', None)  # base64 image from frontend (vision model)
        designer_context = data.get('designer_context', '')  # Current form state, type hints, etc.
        system_prompt_override = data.get('system_prompt', '')  # Full system prompt from frontend (existing behavior)
        supported_types = data.get('supported_types', None)  # Frontend-supported component types (dynamic)
        frontend_history = data.get('history', None)  # Recent chat history from frontend as fallback

        if not message:
            return jsonify({'error': 'Message cannot be empty'}), 400

        def generate():
            try:
                session = ensure_session(session_id, 0)

                # If backend session is empty but frontend sent history, seed from it
                if not session.get('messages') and frontend_history:
                    seed_msgs = []
                    for h in frontend_history:
                        if isinstance(h, dict) and h.get('role') and h.get('content'):
                            seed_msgs.append({'role': h['role'], 'content': h['content']})
                    if seed_msgs:
                        session['messages'] = seed_msgs
                        set_session(session_id, session)

                # Build knowledge-enhanced prompt
                if system_prompt_override:
                    # Legacy mode: frontend sends full system prompt, we just append KB examples
                    kb_section = build_form_designer_prompt(message, '', supported_types)
                    full_system_prompt = system_prompt_override + kb_section
                    user_message = message
                else:
                    # New mode: frontend sends raw question + context, we build everything
                    kb_section = build_form_designer_prompt(message, designer_context, supported_types)
                    full_system_prompt = kb_section
                    user_message = message

                messages_list = [{'role': 'system', 'content': full_system_prompt}]
                messages_list.extend(get_store_messages(session_id))
                # Build user message - multimodal if image is present
                use_multimodal = bool(image_data and model.startswith('qwen-vl'))
                if use_multimodal:
                    import tempfile, base64 as b64mod
                    # Strip data URI prefix if present
                    img_b64 = image_data.split(',', 1)[-1] if ',' in image_data else image_data
                    tmp_img = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
                    tmp_img.write(b64mod.b64decode(img_b64))
                    tmp_img.close()
                    # MultiModalConversation requires all content to be list format
                    for msg in messages_list:
                        if isinstance(msg.get('content'), str):
                            msg['content'] = [{'text': msg['content']}]
                    user_content = [
                        {'image': 'file://' + tmp_img.name},
                        {'text': user_message}
                    ]
                    messages_list.append({'role': 'user', 'content': user_content})
                else:
                    messages_list.append({'role': 'user', 'content': user_message})

                yield f"data: {json.dumps({'type': 'start', 'session_id': session_id})}\n\n"

                full_content = ''
                if use_multimodal:
                    responses = dashscope.MultiModalConversation.call(
                        model=model, messages=messages_list,
                        stream=True, incremental_output=True, max_tokens=6000
                    )
                else:
                    call_params = {
                        'model': model,
                        'messages': messages_list,
                        'result_format': 'message',
                        'stream': True,
                        'incremental_output': True,
                        'max_tokens': 6000
                    }
                    responses = dashscope.Generation.call(**call_params)
                for response in responses:
                    if response.status_code == 200:
                        if response.output and response.output.choices:
                            raw_content = response.output.choices[0].message.content
                            # MultiModalConversation returns content as list of dicts
                            if isinstance(raw_content, list):
                                chunk = ''.join(item.get('text', '') for item in raw_content if isinstance(item, dict))
                            else:
                                chunk = raw_content
                            if chunk:
                                full_content += chunk
                                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
                    else:
                        print(f'[FormDesigner ERROR] status={response.status_code} model={model} msg={response.message}', flush=True)
                        yield f"data: {json.dumps({'type': 'error', 'message': response.message})}\n\n"
                        return

                append_messages(session_id, user_message, full_content)

                yield f"data: {json.dumps({'type': 'done', 'session_id': session_id, 'full_content': full_content})}\n\n"

            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

        return Response(
            stream_with_context(generate()),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'
            }
        )

    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@app.route('/api/ai/form-designer/stats', methods=['GET'])
def api_form_designer_stats():
    """Get form knowledge base statistics"""
    return jsonify(get_kb_stats())


# ==================== Embedding 预计算管理 ====================

@app.route('/api/admin/backfill-embeddings', methods=['POST'])
def api_backfill_embeddings():
    """
    Backfill pre-computed embeddings for unindexed knowledge entries.
    This converts N per-query API calls to 0 by pre-computing at write time.
    POST body: {"dept_id": 216} or {} for all departments.
    """
    from core.rag_service import _init_llama_index, _compute_and_store_embeddings

    data = request.get_json(silent=True) or {}
    target_dept = data.get('dept_id')

    StorageContext, load_index_from_storage, Settings, _, _ = _init_llama_index()
    if Settings is None or not hasattr(Settings, 'embed_model'):
        return jsonify({'error': 'Embedding model not available'}), 500

    db = get_database()
    dept_ids = [target_dept] if target_dept else list(Config.DEPARTMENTS.keys())

    total_computed = 0
    results = {}

    for dept_id in dept_ids:
        entries = db.get_knowledge_by_dept(dept_id=dept_id, indexed=False, enabled_only=True)
        need_emb = [e for e in entries if e.question_embedding is None]
        if not need_emb:
            results[str(dept_id)] = {'total': len(entries), 'computed': 0, 'status': 'all_cached'}
            continue

        computed = _compute_and_store_embeddings(need_emb, Settings, db)
        results[str(dept_id)] = {
            'total': len(entries),
            'computed': len(computed),
            'status': 'ok' if computed else 'failed'
        }
        total_computed += len(computed)

    return jsonify({
        'total_computed': total_computed,
        'departments': results
    })


# ==================== 反馈系统路由注册 ====================
# 注册反馈系统的所有API端点
from core.app_feedback_routes import register_feedback_routes
register_feedback_routes(app)


if __name__ == '__main__':
    # Start exchange rate auto-update scheduler (every 6 hours)
    start_rate_scheduler(interval_hours=6)
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
