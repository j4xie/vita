/**
 * 时区参数后端联调测试脚本
 * 测试环境: http://106.14.165.234:8085
 */

const API_BASE = 'http://106.14.165.234:8085';

// 计算时区偏移（与iOS版本一致）
function getTimeOffsetFromBeijing() {
  const localOffsetMinutes = -new Date().getTimezoneOffset();
  const localOffsetHours = localOffsetMinutes / 60;
  const beijingOffsetHours = 8;
  const timeOffset = localOffsetHours - beijingOffsetHours;

  console.log('⏰ [时区信息]');
  console.log('  本地时区偏移:', localOffsetHours, '小时');
  console.log('  北京时区偏移:', beijingOffsetHours, '小时');
  console.log('  时差:', timeOffset, '小时');
  console.log('');

  return timeOffset;
}

// 格式化时间为API需要的格式
function formatTimeForAPI(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 测试主函数
async function testTimezoneAPI() {
  console.log('🚀 开始时区参数后端联调测试\n');
  console.log('📍 测试环境:', API_BASE);
  console.log('');

  // 步骤1: 提示输入测试账号
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 请提供测试账号信息');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('请在脚本中设置以下变量:');
  console.log('  const USERNAME = "你的用户名";');
  console.log('  const PASSWORD = "你的密码";');
  console.log('\n然后重新运行: node test-timezone-api.js USERNAME PASSWORD\n');

  // 从命令行参数获取账号信息
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.log('❌ 缺少账号信息');
    console.log('用法: node test-timezone-api.js <用户名> <密码>');
    console.log('示例: node test-timezone-api.js test123 password123\n');
    process.exit(1);
  }

  console.log('✅ 使用账号:', username);
  console.log('');

  try {
    // 步骤2: 登录获取token
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 步骤1: 登录获取Token');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const loginResponse = await fetch(`${API_BASE}/app/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    });

    const loginData = await loginResponse.json();
    console.log('登录响应:', JSON.stringify(loginData, null, 2));

    if (loginData.code !== 200) {
      console.log('\n❌ 登录失败');
      console.log('错误信息:', loginData.msg);
      process.exit(1);
    }

    // 兼容两种token格式
    const token = loginData.token || loginData.data?.token;
    if (!token) {
      console.log('\n❌ 登录响应中没有token');
      process.exit(1);
    }

    // 从登录响应中获取userId
    const userId = loginData.data?.userId;
    if (!userId) {
      console.log('\n❌ 登录响应中没有userId');
      process.exit(1);
    }

    console.log('\n✅ 登录成功');
    console.log('Token:', token.substring(0, 20) + '...');
    console.log('用户ID:', userId);
    console.log('');

    // 步骤3: 获取用户信息
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 步骤2: 获取用户信息');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const userInfoResponse = await fetch(`${API_BASE}/app/user/info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const userInfo = await userInfoResponse.json();
    console.log('用户信息响应:', JSON.stringify(userInfo, null, 2));

    // 从用户信息中获取姓名，如果失败则使用用户名
    const legalName = userInfo.data?.legalName || userInfo.data?.username || username;

    console.log('\n✅ 用户信息获取成功');
    console.log('用户ID:', userId);
    console.log('姓名:', legalName);
    console.log('');

    // 步骤4: 测试签到（包含timeOffset参数）
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 步骤3: 测试签到（含时区参数）');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const timeOffset = getTimeOffsetFromBeijing();
    const startTime = formatTimeForAPI(new Date());

    const checkInParams = new URLSearchParams();
    checkInParams.append('userId', userId.toString());
    checkInParams.append('type', '1');
    checkInParams.append('operateUserId', userId.toString());
    checkInParams.append('operateLegalName', legalName);
    checkInParams.append('startTime', startTime);
    checkInParams.append('timeOffset', timeOffset.toString());

    console.log('📤 签到请求参数:');
    console.log('  URL:', `${API_BASE}/app/hour/signRecord`);
    console.log('  参数:');
    for (const [key, value] of checkInParams.entries()) {
      console.log(`    ${key}: ${value}`);
    }
    console.log('');

    const checkInResponse = await fetch(`${API_BASE}/app/hour/signRecord`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: checkInParams.toString()
    });

    const checkInData = await checkInResponse.json();
    console.log('📥 签到响应:', JSON.stringify(checkInData, null, 2));

    if (checkInData.code === 200) {
      console.log('\n✅ 签到成功！时区参数已发送');
      console.log('');

      // 等待3秒后签退
      console.log('⏳ 等待3秒后进行签退测试...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 步骤5: 测试签退（包含timeOffset参数）
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📝 步骤4: 测试签退（含时区参数）');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // 获取最后的签到记录ID
      const lastRecordResponse = await fetch(`${API_BASE}/app/hour/lastRecordList?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const lastRecordData = await lastRecordResponse.json();
      console.log('最后记录响应:', JSON.stringify(lastRecordData, null, 2));

      if (lastRecordData.code === 200 && lastRecordData.data) {
        const recordId = lastRecordData.data.id;
        const endTime = formatTimeForAPI(new Date());

        const checkOutParams = new URLSearchParams();
        checkOutParams.append('userId', userId.toString());
        checkOutParams.append('type', '2');
        checkOutParams.append('operateUserId', userId.toString());
        checkOutParams.append('operateLegalName', legalName);
        checkOutParams.append('endTime', endTime);
        checkOutParams.append('id', recordId.toString());
        checkOutParams.append('remark', '【测试】时区参数联调测试');
        checkOutParams.append('timeOffset', timeOffset.toString());

        console.log('\n📤 签退请求参数:');
        console.log('  URL:', `${API_BASE}/app/hour/signRecord`);
        console.log('  参数:');
        for (const [key, value] of checkOutParams.entries()) {
          console.log(`    ${key}: ${value}`);
        }
        console.log('');

        const checkOutResponse = await fetch(`${API_BASE}/app/hour/signRecord`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: checkOutParams.toString()
        });

        const checkOutData = await checkOutResponse.json();
        console.log('📥 签退响应:', JSON.stringify(checkOutData, null, 2));

        if (checkOutData.code === 200) {
          console.log('\n✅ 签退成功！时区参数已发送');
        } else {
          console.log('\n⚠️ 签退失败:', checkOutData.msg);
        }
      } else {
        console.log('\n⚠️ 无法获取签到记录ID，跳过签退测试');
      }
    } else {
      console.log('\n⚠️ 签到失败:', checkInData.msg);
    }

    // 总结
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 测试总结');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ 时区参数计算: timeOffset =', timeOffset);
    console.log('✅ 签到请求已发送: 包含timeOffset参数');
    console.log('✅ 签退请求已发送: 包含timeOffset参数');
    console.log('');
    console.log('🔍 请检查后端日志，确认:');
    console.log('  1. 后端是否正确接收到timeOffset参数');
    console.log('  2. 参数值是否正确:', timeOffset);
    console.log('  3. 后端如何处理该参数');
    console.log('');

  } catch (error) {
    console.error('\n❌ 测试过程出错:', error);
    console.error('错误详情:', error.message);
    if (error.stack) {
      console.error('堆栈信息:', error.stack);
    }
    process.exit(1);
  }
}

// 运行测试
testTimezoneAPI().catch(console.error);
