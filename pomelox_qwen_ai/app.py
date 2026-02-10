from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
import json
import os

# Initialize Flask application
app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Chat history storage path
CHAT_HISTORY_PATH = os.path.join(os.path.dirname(__file__), 'data', 'chat_history.json')

# Mock functions to avoid import issues
def retrieve(dept_id, question):
    return "This is a mock response for testing purposes.", 0.5, False

def get_system_prompt(dept_id, retrieved_content, use_web_search=False):
    return "You are an AI assistant. This is a mock system prompt."

def get_database():
    class MockDB:
        def get_user_chat_sessions(self, user_id, offset, page_size):
            return []
        def get_chat_messages(self, session_id, user_id):
            return []
        def delete_chat_session(self, session_id, user_id):
            pass
        def create_chat_session(self, **kwargs):
            pass
        def save_chat_message(self, **kwargs):
            pass
    return MockDB()

# Mock endpoint to test if server starts
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Server is running'})

# Mock ask endpoint
@app.route('/ask', methods=['POST'])
def ask_ai():
    try:
        data = request.get_json()
        question = data.get('question', 'Hello')
        session_id = data.get('session_id', str(uuid.uuid4()))
        dept_id = data.get('deptId', 211)
        
        # Mock response
        response_data = {
            'session_id': session_id,
            'message_id': f"msg_{uuid.uuid4().hex[:12]}",
            'dept_id': dept_id,
            'question': question,
            'answer': f"Mock response to: {question}",
            'source_type': 'mock',
            'rag_score': 0.5
        }
        
        return jsonify(response_data)
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# Import feedback routes if possible
try:
    from core.app_feedback_routes import register_feedback_routes
    register_feedback_routes(app)
except:
    print("[Warning] Could not import feedback routes")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8087, debug=True)
