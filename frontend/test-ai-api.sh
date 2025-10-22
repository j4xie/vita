#!/bin/bash

# AI API 测试脚本
# 用于测试PomeloX的AI接口连通性

BASE_URL="http://106.14.165.234:8085"
CONTENT_TYPE="Content-Type: application/json"

echo "========================================="
echo "PomeloX AI API 测试脚本"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试函数
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    local description=$5

    echo -e "${YELLOW}测试: ${description}${NC}"
    echo "请求: ${method} ${endpoint}"

    if [ -z "$token" ]; then
        # 无认证
        if [ "$method" = "GET" ]; then
            response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X ${method} "${BASE_URL}${endpoint}" -H "${CONTENT_TYPE}")
        else
            response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X ${method} "${BASE_URL}${endpoint}" -H "${CONTENT_TYPE}" -d "${data}")
        fi
    else
        # 带认证
        if [ "$method" = "GET" ]; then
            response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X ${method} "${BASE_URL}${endpoint}" -H "${CONTENT_TYPE}" -H "Authorization: Bearer ${token}")
        else
            response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X ${method} "${BASE_URL}${endpoint}" -H "${CONTENT_TYPE}" -H "Authorization: Bearer ${token}" -d "${data}")
        fi
    fi

    # 提取HTTP状态码
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d':' -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS:/d')

    # 判断结果
    if [ "$http_status" = "200" ]; then
        echo -e "${GREEN}✅ 成功 (HTTP ${http_status})${NC}"
        echo "响应: ${body}" | head -3
    elif [ "$http_status" = "401" ]; then
        echo -e "${YELLOW}🔐 需要认证 (HTTP ${http_status})${NC}"
        echo "响应: ${body}"
    else
        echo -e "${RED}❌ 失败 (HTTP ${http_status})${NC}"
        echo "响应: ${body}"
    fi
    echo ""
}

# 1. 测试健康检查（无认证）
echo "========================================="
echo "步骤 1: 测试AI服务健康检查"
echo "========================================="
test_endpoint "GET" "/app/ai/check" "" "" "AI健康检查"

# 2. 测试登录获取token
echo "========================================="
echo "步骤 2: 登录获取认证token"
echo "========================================="
echo -e "${YELLOW}请输入测试账号用户名:${NC}"
read -r USERNAME
echo -e "${YELLOW}请输入测试账号密码:${NC}"
read -rs PASSWORD
echo ""

login_response=$(curl -s -X POST "${BASE_URL}/app/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${USERNAME}&password=${PASSWORD}")

echo "登录响应: ${login_response}"
echo ""

# 提取token
TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
USER_ID=$(echo "$login_response" | grep -o '"userId":[0-9]*' | cut -d':' -f2)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ 登录失败，无法获取token${NC}"
    echo "请检查账号密码是否正确"
    exit 1
else
    echo -e "${GREEN}✅ 登录成功${NC}"
    echo "Token: ${TOKEN:0:20}..."
    echo "User ID: ${USER_ID}"
    echo ""
fi

# 3. 测试AI聊天接口
echo "========================================="
echo "步骤 3: 测试AI聊天接口"
echo "========================================="
CHAT_DATA='{"message":"你好，这是一个测试消息","userId":"'${USER_ID}'"}'
test_endpoint "POST" "/app/ai/chat" "${CHAT_DATA}" "${TOKEN}" "发送AI聊天消息"

# 4. 测试获取聊天历史
echo "========================================="
echo "步骤 4: 测试获取聊天历史"
echo "========================================="
test_endpoint "GET" "/app/ai/chatHistory?userId=${USER_ID}" "" "${TOKEN}" "获取聊天历史"

# 5. 测试获取问题列表
echo "========================================="
echo "步骤 5: 测试获取AI问题列表"
echo "========================================="
test_endpoint "GET" "/app/aiQuestion/list" "" "${TOKEN}" "获取问题列表"

# 6. 测试删除聊天历史
echo "========================================="
echo "步骤 6: 测试删除聊天历史"
echo "========================================="
DELETE_DATA='{"userId":"'${USER_ID}'"}'
test_endpoint "POST" "/app/ai/delete" "${DELETE_DATA}" "${TOKEN}" "删除聊天历史"

echo "========================================="
echo "测试完成！"
echo "========================================="
echo ""
echo "总结："
echo "- API基础地址: ${BASE_URL}"
echo "- 所有AI接口需要Bearer Token认证"
echo "- 建议在前端代码中添加详细的错误处理"
echo ""
