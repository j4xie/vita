# Gunicorn configuration for PomeloX AI Service
# Usage: gunicorn -c gunicorn.conf.py app:app

bind = "0.0.0.0:8087"
workers = 2
worker_class = "gevent"
timeout = 120  # Allow long LLM requests
graceful_timeout = 30
keepalive = 5

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Performance
worker_connections = 50
max_requests = 1000  # Restart workers periodically to prevent memory leaks
max_requests_jitter = 100
