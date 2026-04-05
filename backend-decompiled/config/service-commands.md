# PomeloX 服务器服务管理命令

## 生产服务器 (101.132.17.37)

### SSH 连接
```bash
ssh -i ~/.ssh/id_ed25519_prod root@101.132.17.37
```

### Java Spring Boot (端口 8082)
- **JAR 路径**: `/www/wwwroot/project/xiyou-admin8082.jar`
- **Java**: `/www/server/java/jdk-15.0.2/bin/java`
- **启动**: 
  ```bash
  cd /www/wwwroot/project && nohup /www/server/java/jdk-15.0.2/bin/java -jar xiyou-admin8082.jar > /tmp/java_app.log 2>&1 &
  ```
- **停止**: `kill $(pgrep -f 'java.*xiyou-admin8082')`
- **日志**: `/tmp/java_app.log` 和 `/www/wwwroot/project/admin8082.log`
- **更新JAR内JS**: 
  ```bash
  /www/server/java/jdk-15.0.2/bin/jar uf xiyou-admin8082.jar -C /www/wwwroot/project BOOT-INF/classes/static/js/ai-form-assistant.js
  ```

### Python AI 服务 (端口 8087)
- **路径**: `/www/wwwroot/project/ai/pomelox_qwen_ai/`
- **Python**: `/www/server/pyporject_evn/ai-fastApi/bin/python` (Python 3.8 virtualenv)
- **启动**: 
  ```bash
  cd /www/wwwroot/project/ai/pomelox_qwen_ai && nohup /www/server/pyporject_evn/ai-fastApi/bin/python app.py > /tmp/ai_form.log 2>&1 &
  ```
- **停止**: `fuser -k 8087/tcp`
- **日志**: `/tmp/ai_form.log`

### MySQL
- **连接**: `mysql -u inter_stu_center -p'66nx7ywet3jcPZxt' inter_stu_center`
- **数据库**: `inter_stu_center`

### Redis
- **地址**: `127.0.0.1:6379`

### Nginx 路由规则
- `/ai/*` → 代理到 Python 8087
- 其他所有请求 → 代理到 Java 8082
- HTTPS: 443 端口, 证书在宝塔管理

### 管理后台
- **URL**: `https://www.vitaglobal.icu/static/web/index.html#/login`
- **账号**: admin / 123456

---

## 测试服务器 (106.14.165.234)

### SSH 连接
```bash
ssh root@106.14.165.234
```

### Java Spring Boot (端口 8085)
- **JAR 路径**: `/www/wwwroot/project/xiyou-admin8085.jar`
- **Java**: `/www/server/java/jdk-14.0.2/bin/java`
- **启动参数**: `-Xmx1024M -Xms256M`
- **启动**: 
  ```bash
  nohup /www/server/java/jdk-14.0.2/bin/java -jar -Xmx1024M -Xms256M /www/wwwroot/project/xiyou-admin8085.jar > /tmp/java_app.log 2>&1 &
  ```

### Python AI 服务 (端口 8087)
- 同生产服务器结构

### MySQL
- **连接**: `mysql -u test_inter_stu_center -p'4hFjHxnm6MrLWT2b' -h 127.0.0.1 test_inter_stu_center`
- **数据库**: `test_inter_stu_center`

### 额外服务
- **Tomcat (禅道)**: 端口 8231, JDK 14
- **宝塔面板**: 端口 8888

---

## 端口映射总览

| 服务 | 生产 | 测试 |
|------|------|------|
| Java API | 8082 | 8085 |
| Python AI | 8087 | 8087 |
| MySQL | 3306 | 3306 |
| Redis | 6379 | 6379 |
| Nginx HTTP | 80 | 80 |
| Nginx HTTPS | 443 | 443 |
| 宝塔面板 | 8888 | 8888 |
| H5 (Nginx) | 8086 | 8086 |
