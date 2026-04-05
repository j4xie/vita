"""
汇率自动拉取服务
- 从免费 API 获取实时 USD/CNY 汇率
- 自动更新数据库 sys_config 表
- 定时任务支持
"""
import os
import pymysql
import requests
import threading
import time
from flask import Blueprint, jsonify, request
from contextlib import contextmanager
from datetime import datetime

exchange_rate_bp = Blueprint('exchange_rate', __name__)

# 复用 approval_routes 的数据库连接
from core.approval_routes import get_connection

# 汇率缓存
_rate_cache = {
    'rate': None,
    'updated_at': None,
}

# 免费汇率 API（按优先级排列）
RATE_APIS = [
    {
        'name': 'ExchangeRate-API (open)',
        'url': 'https://open.er-api.com/v6/latest/USD',
        'parse': lambda data: data.get('rates', {}).get('CNY'),
    },
    {
        'name': 'ExchangeRate-API v4',
        'url': 'https://api.exchangerate-api.com/v4/latest/USD',
        'parse': lambda data: data.get('rates', {}).get('CNY'),
    },
]


def fetch_live_rate():
    """从免费 API 拉取实时汇率，按优先级尝试"""
    for api in RATE_APIS:
        try:
            resp = requests.get(api['url'], timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                rate = api['parse'](data)
                if rate and float(rate) > 0:
                    print(f"[ExchangeRate] Fetched from {api['name']}: 1 USD = {rate} CNY")
                    return float(rate)
        except Exception as e:
            print(f"[ExchangeRate] {api['name']} failed: {e}")
            continue
    return None


def update_db_rate(rate):
    """将汇率更新到数据库 sys_config 表"""
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                # 检查是否存在汇率配置项
                cursor.execute("""
                    SELECT config_id FROM sys_config
                    WHERE config_key = 'exchange.rate.usd.cny'
                """)
                existing = cursor.fetchone()

                if existing:
                    cursor.execute("""
                        UPDATE sys_config
                        SET config_value = %s, update_time = NOW()
                        WHERE config_key = 'exchange.rate.usd.cny'
                    """, (str(rate),))
                else:
                    cursor.execute("""
                        INSERT INTO sys_config
                        (config_name, config_key, config_value, config_type, create_time, remark)
                        VALUES ('美元兑人民币汇率', 'exchange.rate.usd.cny', %s, 'Y', NOW(), '自动拉取的实时汇率')
                    """, (str(rate),))
                conn.commit()
                print(f"[ExchangeRate] Database updated: 1 USD = {rate} CNY")
                return True
    except Exception as e:
        print(f"[ExchangeRate] DB update failed: {e}")
        return False


def get_db_rate():
    """从数据库读取当前配置的汇率"""
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT config_value, update_time FROM sys_config
                    WHERE config_key = 'exchange.rate.usd.cny'
                """)
                result = cursor.fetchone()
                if result:
                    return {
                        'rate': float(result['config_value']),
                        'updatedAt': result['update_time'].strftime('%Y-%m-%d %H:%M:%S') if result['update_time'] else None,
                        'source': 'database'
                    }
    except Exception as e:
        print(f"[ExchangeRate] DB read failed: {e}")
    return None


# ==================== 定时任务 ====================

_scheduler_started = False


def start_rate_scheduler(interval_hours=6):
    """启动汇率自动更新定时任务"""
    global _scheduler_started
    if _scheduler_started:
        return
    _scheduler_started = True

    def _update_loop():
        while True:
            try:
                rate = fetch_live_rate()
                if rate:
                    update_db_rate(rate)
                    _rate_cache['rate'] = rate
                    _rate_cache['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            except Exception as e:
                print(f"[ExchangeRate] Scheduler error: {e}")
            time.sleep(interval_hours * 3600)

    thread = threading.Thread(target=_update_loop, daemon=True)
    thread.start()
    print(f"[ExchangeRate] Auto-update scheduler started (every {interval_hours}h)")


# ==================== API 接口 ====================

@exchange_rate_bp.route('/exchange-rate/current', methods=['GET'])
def get_current_rate():
    """
    获取当前汇率
    GET /ai/exchange-rate/current
    优先返回缓存，其次数据库，最后实时拉取
    """
    # 1. 内存缓存
    if _rate_cache['rate']:
        return jsonify({
            'code': 200,
            'data': {
                'rate': _rate_cache['rate'],
                'updatedAt': _rate_cache['updated_at'],
                'source': 'cache'
            }
        })

    # 2. 数据库
    db_rate = get_db_rate()
    if db_rate:
        _rate_cache['rate'] = db_rate['rate']
        _rate_cache['updated_at'] = db_rate['updatedAt']
        return jsonify({'code': 200, 'data': db_rate})

    # 3. 实时拉取
    rate = fetch_live_rate()
    if rate:
        _rate_cache['rate'] = rate
        _rate_cache['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        return jsonify({
            'code': 200,
            'data': {
                'rate': rate,
                'updatedAt': _rate_cache['updated_at'],
                'source': 'live'
            }
        })

    return jsonify({'code': 500, 'msg': '无法获取汇率'}), 500


@exchange_rate_bp.route('/exchange-rate/refresh', methods=['POST'])
def refresh_rate():
    """
    手动刷新汇率（拉取最新并更新数据库）
    POST /ai/exchange-rate/refresh
    """
    rate = fetch_live_rate()
    if not rate:
        return jsonify({'code': 500, 'msg': '拉取汇率失败'}), 500

    updated = update_db_rate(rate)
    _rate_cache['rate'] = rate
    _rate_cache['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    return jsonify({
        'code': 200,
        'data': {
            'rate': rate,
            'updatedAt': _rate_cache['updated_at'],
            'dbUpdated': updated
        },
        'msg': '汇率已更新'
    })


@exchange_rate_bp.route('/exchange-rate/convert', methods=['GET'])
def convert_currency():
    """
    汇率换算
    GET /ai/exchange-rate/convert?amount=100&from=USD&to=CNY
    """
    amount = request.args.get('amount', type=float)
    from_currency = request.args.get('from', 'USD').upper()
    to_currency = request.args.get('to', 'CNY').upper()

    if amount is None:
        return jsonify({'code': 400, 'msg': '缺少 amount 参数'}), 400

    # 获取汇率
    rate = _rate_cache.get('rate')
    if not rate:
        db_rate = get_db_rate()
        if db_rate:
            rate = db_rate['rate']
        else:
            rate = fetch_live_rate()

    if not rate:
        return jsonify({'code': 500, 'msg': '无法获取汇率'}), 500

    if from_currency == 'USD' and to_currency == 'CNY':
        result = round(amount * rate, 2)
    elif from_currency == 'CNY' and to_currency == 'USD':
        result = round(amount / rate, 2)
    else:
        return jsonify({'code': 400, 'msg': '仅支持 USD/CNY 互转'}), 400

    return jsonify({
        'code': 200,
        'data': {
            'amount': amount,
            'from': from_currency,
            'to': to_currency,
            'rate': rate,
            'result': result
        }
    })
