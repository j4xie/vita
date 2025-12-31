# MySQL + SSH隧道配置指南

本指南介绍如何使用SSH隧道安全连接云服务器上的MySQL数据库。

---

## 📋 目录

1. [为什么使用SSH隧道](#为什么使用ssh隧道)
2. [环境要求](#环境要求)
3. [配置步骤](#配置步骤)
4. [使用方式](#使用方式)
5. [故障排查](#故障排查)

---

## 为什么使用SSH隧道

### 优势
✅ **更安全** - 不需要暴露MySQL 3306端口到公网
✅ **加密传输** - 所有数据通过SSH加密
✅ **灵活性** - 本地开发环境可以直接连接远程数据库
✅ **防火墙友好** - 只需开放SSH 22端口

### 适用场景
- 本地开发环境连接云服务器MySQL
- 测试环境访问生产数据库 (只读)
- 数据库管理和备份操作

---

## 环境要求

### 1. Python依赖包
```bash
pip install pymysql sshtunnel
```

### 2. 云服务器配置
- ✅ SSH访问权限
- ✅ MySQL已安装并运行
- ✅ 防火墙允许SSH连接 (端口22)

### 3. MySQL用户权限
```sql
-- 在云服务器上创建数据库和用户 (localhost即可,因为通过SSH隧道连接)
CREATE DATABASE IF NOT EXISTS pomelox_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建专用用户 (可选,也可以使用root)
CREATE USER 'pomelox_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON pomelox_ai.* TO 'pomelox_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 配置步骤

### 步骤1: 准备SSH认证

#### 方式A: 使用密码认证 (简单但不够安全)
在 `.env` 文件中配置:
```env
USE_SSH_TUNNEL=true
SSH_HOST=123.456.789.0  # 云服务器IP
SSH_PORT=22
SSH_USER=root
SSH_PASSWORD=your_ssh_password
```

#### 方式B: 使用密钥认证 (推荐)

1. **生成SSH密钥对** (如果还没有):
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/pomelox_ai_key
```

2. **上传公钥到服务器**:
```bash
ssh-copy-id -i ~/.ssh/pomelox_ai_key.pub root@your-server.com
```

或手动添加到服务器:
```bash
# 在服务器上
mkdir -p ~/.ssh
echo "your_public_key_content" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

3. **配置.env文件**:
```env
USE_SSH_TUNNEL=true
SSH_HOST=your-server.com
SSH_PORT=22
SSH_USER=root
SSH_KEY_FILE=/path/to/your/pomelox_ai_key  # Windows: C:\Users\YourName\.ssh\pomelox_ai_key
```

### 步骤2: 配置MySQL连接

在 `.env` 文件中添加:
```env
# 数据库类型改为mysql
DATABASE_TYPE=mysql

# MySQL配置 (注意: 使用SSH隧道时,HOST应为localhost)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=pomelox_ai
```

### 步骤3: 初始化数据库表

在**云服务器**上执行:
```bash
# 1. 登录MySQL
mysql -u root -p

# 2. 导入表结构
source /path/to/pomelox_qwen_ai/database/schema.sql

# 或者直接执行
mysql -u root -p < database/schema.sql
```

---

## 使用方式

### 方式1: 在代码中使用

修改 `database/__init__.py`:

```python
import os
from .interface import DatabaseInterface

def get_database() -> DatabaseInterface:
    """获取数据库实例"""
    db_type = os.getenv('DATABASE_TYPE', 'json')

    if db_type == 'mysql':
        from .mysql_impl import MySQLDatabase
        return MySQLDatabase()
    else:
        from .json_impl import JSONDatabase
        return JSONDatabase()
```

### 方式2: 测试连接

创建测试脚本 `test_mysql_ssh.py`:

```python
import os
os.environ['DATABASE_TYPE'] = 'mysql'
os.environ['USE_SSH_TUNNEL'] = 'true'

from database.mysql_impl import MySQLDatabase

# 测试连接
try:
    db = MySQLDatabase()
    print("[SUCCESS] MySQL connection via SSH tunnel established!")

    # 测试查询
    feedbacks = db.get_pending_feedbacks()
    print(f"Found {len(feedbacks)} pending feedbacks")

except Exception as e:
    print(f"[FAIL] Connection failed: {e}")
```

### 方式3: 完整配置示例

**.env 文件完整示例**:

```env
# DashScope API
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxx

# 使用MySQL + SSH隧道
DATABASE_TYPE=mysql
USE_SSH_TUNNEL=true

# SSH配置
SSH_HOST=123.456.789.0
SSH_PORT=22
SSH_USER=root
SSH_KEY_FILE=C:\Users\YourName\.ssh\pomelox_ai_key

# MySQL配置
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=pomelox_user
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=pomelox_ai

# RAG配置
RAG_CHUNK_COUNT=5
RAG_SIMILARITY_THRESHOLD=0.2
RAG_HIGH_QUALITY_THRESHOLD=0.5

# 反馈系统配置
CONFIDENCE_AUTO_APPROVE_THRESHOLD=0.8
CONFIDENCE_PENDING_THRESHOLD=0.5
SIMILAR_QUESTION_THRESHOLD=0.85
```

---

## 故障排查

### 问题1: SSH连接失败
```
[FAIL] Failed to start SSH tunnel: Authentication failed
```

**解决方案**:
1. 检查SSH用户名和密码是否正确
2. 如果使用密钥,确认密钥文件路径正确
3. 测试SSH连接: `ssh -i ~/.ssh/pomelox_ai_key root@your-server.com`
4. 检查服务器防火墙是否允许SSH (22端口)

### 问题2: MySQL连接被拒绝
```
[FAIL] pymysql.err.OperationalError: (1045, "Access denied for user...")
```

**解决方案**:
1. 确认MySQL用户名和密码正确
2. 检查MySQL用户权限:
```sql
SHOW GRANTS FOR 'your_user'@'localhost';
```
3. 确保MySQL允许localhost连接

### 问题3: 找不到数据库
```
[FAIL] pymysql.err.OperationalError: (1049, "Unknown database 'pomelox_ai'")
```

**解决方案**:
```bash
# 在服务器上创建数据库
mysql -u root -p -e "CREATE DATABASE pomelox_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 导入表结构
mysql -u root -p pomelox_ai < database/schema.sql
```

### 问题4: 端口已被占用
```
[FAIL] Address already in use
```

**解决方案**:
- SSH隧道会自动选择可用的本地端口,这个问题很少见
- 如果出现,重启Python程序即可

### 问题5: SSH隧道超时
```
[FAIL] Timeout connecting to server
```

**解决方案**:
1. 检查网络连接
2. 确认服务器IP和端口正确
3. 检查服务器防火墙设置
4. 尝试增加超时时间 (修改 `mysql_impl.py` 中的 `SSHTunnelForwarder` 参数)

---

## 性能优化建议

### 1. 连接池
对于生产环境,建议使用连接池:
```python
from dbutils.pooled_db import PooledDB

pool = PooledDB(
    creator=pymysql,
    maxconnections=10,
    host='127.0.0.1',
    port=tunnel.local_bind_port,
    ...
)
```

### 2. 长连接保持
SSH隧道会自动保持连接,但可以设置心跳:
```python
self.ssh_tunnel = SSHTunnelForwarder(
    ...,
    set_keepalive=60  # 每60秒发送心跳
)
```

### 3. 自动重连
建议在生产环境中添加自动重连逻辑:
```python
def _ensure_tunnel_alive(self):
    if not self.ssh_tunnel or not self.ssh_tunnel.is_alive:
        self._start_ssh_tunnel()
```

---

## 安全建议

1. ✅ **使用密钥认证** 而不是密码
2. ✅ **限制SSH用户权限** - 使用专用账户而非root
3. ✅ **定期轮换密码** 和密钥
4. ✅ **启用SSH日志监控**
5. ✅ **使用VPN** - 对于敏感操作,建议结合VPN使用
6. ✅ **最小权限原则** - MySQL用户只授予必要权限

---

## 附录: 完整部署检查清单

### 云服务器端
- [ ] SSH服务运行中 (`systemctl status sshd`)
- [ ] MySQL服务运行中 (`systemctl status mysql`)
- [ ] 防火墙允许SSH (`ufw allow 22`)
- [ ] MySQL用户已创建并授权
- [ ] 数据库和表已创建 (`schema.sql`)

### 本地开发环境
- [ ] Python依赖已安装 (`pymysql`, `sshtunnel`)
- [ ] `.env` 文件配置正确
- [ ] SSH密钥已配置 (如使用密钥认证)
- [ ] 测试连接成功

### 应用配置
- [ ] `DATABASE_TYPE=mysql`
- [ ] `USE_SSH_TUNNEL=true`
- [ ] 所有环境变量配置完整
- [ ] 日志正常输出连接信息

---

## 相关资源

- [SSH隧道技术详解](https://www.ssh.com/academy/ssh/tunneling)
- [PyMySQL文档](https://pymysql.readthedocs.io/)
- [sshtunnel库文档](https://github.com/pahaz/sshtunnel)
- [MySQL安全最佳实践](https://dev.mysql.com/doc/refman/8.0/en/security-guidelines.html)
