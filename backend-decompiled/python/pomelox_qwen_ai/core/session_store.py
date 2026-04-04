"""
Redis-backed Session Store for AI Chat.
Replaces in-memory sessions dict to support multi-worker (Gunicorn) deployment.
Each session is stored as a Redis key with JSON value and automatic TTL expiry.
"""
import json
import time
import logging

logger = logging.getLogger(__name__)

SESSION_PREFIX = "pomelo:session:"
MAX_SESSION_MESSAGES = 16  # Keep last 8 rounds (8 user + 8 assistant)
SESSION_TTL = 7200  # 2 hours

_redis_client = None
_redis_available = False


def _get_redis():
    """Lazy-init Redis connection (shared with cache_service)."""
    global _redis_client, _redis_available
    if _redis_client is not None:
        return _redis_client if _redis_available else None

    try:
        import redis
        _redis_client = redis.Redis(
            host='127.0.0.1', port=6379, db=0,
            decode_responses=True,
            socket_connect_timeout=2, socket_timeout=2
        )
        _redis_client.ping()
        _redis_available = True
        logger.info("[SessionStore] Redis connected")
        return _redis_client
    except Exception as e:
        _redis_available = False
        logger.warning("[SessionStore] Redis unavailable, falling back to in-memory: %s", e)
        return None


# ==================== Fallback in-memory store ====================
_memory_sessions = {}


def _session_key(session_id):
    return SESSION_PREFIX + session_id


def get_session(session_id):
    """
    Get session data. Returns dict {'dept_id': int, 'messages': list, 'last_accessed': float}
    or None if session does not exist.
    """
    r = _get_redis()
    if r is not None:
        try:
            data = r.get(_session_key(session_id))
            if data:
                session = json.loads(data)
                # Refresh TTL on access
                r.expire(_session_key(session_id), SESSION_TTL)
                return session
            return None
        except Exception as e:
            logger.warning("[SessionStore] Get error: %s", e)
            return _memory_sessions.get(session_id)
    else:
        return _memory_sessions.get(session_id)


def set_session(session_id, session_data):
    """
    Save or update session data.
    session_data: {'dept_id': int, 'messages': list, 'last_accessed': float}
    """
    session_data['last_accessed'] = time.time()

    # Trim messages
    msgs = session_data.get('messages', [])
    if len(msgs) > MAX_SESSION_MESSAGES:
        session_data['messages'] = msgs[-MAX_SESSION_MESSAGES:]

    r = _get_redis()
    if r is not None:
        try:
            r.set(
                _session_key(session_id),
                json.dumps(session_data, ensure_ascii=False),
                ex=SESSION_TTL  # Auto-expire
            )
            return
        except Exception as e:
            logger.warning("[SessionStore] Set error: %s", e)

    # Fallback
    _memory_sessions[session_id] = session_data


def delete_session(session_id):
    """Delete a session."""
    r = _get_redis()
    if r is not None:
        try:
            r.delete(_session_key(session_id))
        except Exception as e:
            logger.warning("[SessionStore] Delete error: %s", e)

    _memory_sessions.pop(session_id, None)


def session_exists(session_id):
    """Check if session exists."""
    return get_session(session_id) is not None


def ensure_session(session_id, dept_id):
    """
    Get or create session for given session_id and dept_id.
    If dept_id changed, resets the session.
    Returns session data dict.
    """
    session = get_session(session_id)
    if session is None or session.get('dept_id') != dept_id:
        session = {
            'dept_id': dept_id,
            'messages': [],
            'last_accessed': time.time()
        }
        set_session(session_id, session)
    return session


def append_messages(session_id, user_msg, assistant_msg):
    """Append a user+assistant message pair to session and save."""
    session = get_session(session_id)
    if session is None:
        return

    session['messages'].append({'role': 'user', 'content': user_msg})
    session['messages'].append({'role': 'assistant', 'content': assistant_msg})
    set_session(session_id, session)


def get_session_messages(session_id):
    """Get messages list from session, or empty list."""
    session = get_session(session_id)
    if session is None:
        return []
    return session.get('messages', [])


def get_session_dept_id(session_id):
    """Get dept_id from session, or None."""
    session = get_session(session_id)
    if session is None:
        return None
    return session.get('dept_id')
