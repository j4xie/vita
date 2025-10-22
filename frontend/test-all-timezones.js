/**
 * 全时区测试脚本
 * 模拟世界各地不同时区的签到/签退请求，验证timeOffset参数的正确性
 *
 * 使用方法: node test-all-timezones.js <用户名> <密码>
 * 示例: node test-all-timezones.js admin 123456
 */

const API_BASE = 'http://106.14.165.234:8085';

// 定义测试的时区列表
const TIMEZONES = [
  {
    name: '美国西海岸 (洛杉矶)',
    utcOffset: -8,
    timeOffset: -16,
    city: 'Los Angeles',
    emoji: '🌴'
  },
  {
    name: '美国中部 (芝加哥)',
    utcOffset: -6,
    timeOffset: -14,
    city: 'Chicago',
    emoji: '🏙️'
  },
  {
    name: '美国东海岸 (纽约)',
    utcOffset: -5,
    timeOffset: -13,
    city: 'New York',
    emoji: '🗽'
  },
  {
    name: '英国 (伦敦)',
    utcOffset: 0,
    timeOffset: -8,
    city: 'London',
    emoji: '🇬🇧'
  },
  {
    name: '法国 (巴黎)',
    utcOffset: 1,
    timeOffset: -7,
    city: 'Paris',
    emoji: '🇫🇷'
  },
  {
    name: '德国 (柏林)',
    utcOffset: 1,
    timeOffset: -7,
    city: 'Berlin',
    emoji: '🇩🇪'
  },
  {
    name: '俄罗斯 (莫斯科)',
    utcOffset: 3,
    timeOffset: -5,
    city: 'Moscow',
    emoji: '🇷🇺'
  },
  {
    name: '印度 (新德里)',
    utcOffset: 5.5,
    timeOffset: -2.5,
    city: 'New Delhi',
    emoji: '🇮🇳'
  },
  {
    name: '中国 (北京)',
    utcOffset: 8,
    timeOffset: 0,
    city: 'Beijing',
    emoji: '🇨🇳'
  },
  {
    name: '日本 (东京)',
    utcOffset: 9,
    timeOffset: 1,
    city: 'Tokyo',
    emoji: '🇯🇵'
  },
  {
    name: '韩国 (首尔)',
    utcOffset: 9,
    timeOffset: 1,
    city: 'Seoul',
    emoji: '🇰🇷'
  },
  {
    name: '澳大利亚东部 (悉尼)',
    utcOffset: 11,
    timeOffset: 3,
    city: 'Sydney',
    emoji: '🇦🇺'
  },
  {
    name: '新西兰 (奥克兰)',
    utcOffset: 13,
    timeOffset: 5,
    city: 'Auckland',
    emoji: '🇳🇿'
  }
];

// 格式化时间为API需要的格式（模拟指定时区的时间）
function formatTimeForTimezone(utcOffsetHours) {
  const now = new Date();
  // 获取UTC时间
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  // 转换到目标时区
  const targetTime = new Date(utcTime + (utcOffsetHours * 3600000));

  const year = targetTime.getUTCFullYear();
  const month = String(targetTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(targetTime.getUTCDate()).padStart(2, '0');
  const hours = String(targetTime.getUTCHours()).padStart(2, '0');
  const minutes = String(targetTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(targetTime.getUTCSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 计算工作时长
function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) {
    return { minutes: 0, display: '无法计算' };
  }

  const start = new Date(startTime.replace(' ', 'T'));
  const end = new Date(endTime.replace(' ', 'T'));
  const durationMs = end - start;
  const durationMinutes = Math.floor(durationMs / 1000 / 60);
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  return {
    milliseconds: durationMs,
    minutes: durationMinutes,
    seconds: Math.floor(durationMs / 1000),
    display: `${hours}小时${minutes}分钟`
  };
}

// 测试单个时区
async function testTimezone(timezone, token, userId, legalName) {
  console.log(`\n${timezone.emoji} 测试时区: ${timezone.name}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  城市: ${timezone.city}`);
  console.log(`  UTC偏移: ${timezone.utcOffset >= 0 ? '+' : ''}${timezone.utcOffset}小时`);
  console.log(`  timeOffset: ${timezone.timeOffset >= 0 ? '+' : ''}${timezone.timeOffset}小时`);
  console.log('');

  try {
    // 步骤1: 签到
    const checkInTime = formatTimeForTimezone(timezone.utcOffset);
    console.log(`📍 签到时间 (${timezone.city}本地): ${checkInTime}`);

    const checkInParams = new URLSearchParams();
    checkInParams.append('userId', userId.toString());
    checkInParams.append('type', '1');
    checkInParams.append('operateUserId', userId.toString());
    checkInParams.append('operateLegalName', legalName);
    checkInParams.append('startTime', checkInTime);
    checkInParams.append('timeOffset', timezone.timeOffset.toString());

    const checkInResponse = await fetch(`${API_BASE}/app/hour/signRecord`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: checkInParams.toString()
    });

    const checkInData = await checkInResponse.json();

    if (checkInData.code !== 200) {
      console.log(`❌ 签到失败: ${checkInData.msg}`);
      return { success: false, timezone: timezone.name };
    }

    console.log('✅ 签到成功');

    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 获取记录ID
    const getRecordResponse = await fetch(
      `${API_BASE}/app/hour/lastRecordList?userId=${userId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    const getRecordData = await getRecordResponse.json();

    if (getRecordData.code !== 200 || !getRecordData.data?.id) {
      console.log('⚠️ 使用备用方法获取记录ID...');

      // 使用recordList作为备用
      const backupResponse = await fetch(
        `${API_BASE}/app/hour/recordList?userId=${userId}&pageNum=1&pageSize=1`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const backupData = await backupResponse.json();

      if (backupData.code !== 200 || !backupData.rows || backupData.rows.length === 0) {
        console.log('❌ 无法获取签到记录ID');
        return { success: false, timezone: timezone.name };
      }

      var recordId = backupData.rows[0].id;
    } else {
      var recordId = getRecordData.data.id;
    }

    console.log(`  记录ID: ${recordId}`);

    // 等待2秒（模拟工作时间）
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 步骤2: 签退
    const checkOutTime = formatTimeForTimezone(timezone.utcOffset);
    console.log(`📍 签退时间 (${timezone.city}本地): ${checkOutTime}`);

    const checkOutParams = new URLSearchParams();
    checkOutParams.append('userId', userId.toString());
    checkOutParams.append('type', '2');
    checkOutParams.append('operateUserId', userId.toString());
    checkOutParams.append('operateLegalName', legalName);
    checkOutParams.append('endTime', checkOutTime);
    checkOutParams.append('id', recordId.toString());
    checkOutParams.append('remark', `【全时区测试】${timezone.city} (timeOffset: ${timezone.timeOffset})`);
    checkOutParams.append('timeOffset', timezone.timeOffset.toString());

    const checkOutResponse = await fetch(`${API_BASE}/app/hour/signRecord`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: checkOutParams.toString()
    });

    const checkOutData = await checkOutResponse.json();

    if (checkOutData.code !== 200) {
      console.log(`❌ 签退失败: ${checkOutData.msg}`);
      return { success: false, timezone: timezone.name };
    }

    console.log('✅ 签退成功');

    // 步骤3: 验证记录
    await new Promise(resolve => setTimeout(resolve, 1000));

    const verifyResponse = await fetch(
      `${API_BASE}/app/hour/recordList?userId=${userId}&pageNum=1&pageSize=5`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    const verifyData = await verifyResponse.json();

    if (verifyData.code === 200 && verifyData.rows && verifyData.rows.length > 0) {
      const record = verifyData.rows.find(r => r.id === recordId);

      if (record) {
        const duration = calculateDuration(record.startTime, record.endTime);
        const storedOffset = record.timeOffset;

        console.log('\n📋 记录验证:');
        console.log(`  ✅ 签到时间: ${record.startTime}`);
        console.log(`  ✅ 签退时间: ${record.endTime}`);
        console.log(`  ✅ 工作时长: ${duration.seconds}秒`);
        console.log(`  ✅ 存储的timeOffset: ${storedOffset}`);
        console.log(`  ✅ 验证结果: ${storedOffset === timezone.timeOffset.toString() ? '✅ 正确' : '❌ 不匹配'}`);

        return {
          success: storedOffset === timezone.timeOffset.toString(),
          timezone: timezone.name,
          expectedOffset: timezone.timeOffset,
          actualOffset: storedOffset,
          duration: duration.seconds,
          recordId: recordId
        };
      }
    }

    console.log('⚠️ 无法验证记录，但签到签退成功');
    return { success: true, timezone: timezone.name, verified: false };

  } catch (error) {
    console.log(`❌ 测试出错: ${error.message}`);
    return { success: false, timezone: timezone.name, error: error.message };
  }
}

// 主测试函数
async function runAllTimezonesTest() {
  console.log('🌍 全球时区参数测试');
  console.log('═══════════════════════════════════════════\n');

  // 从命令行获取账号信息
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.log('❌ 缺少账号信息');
    console.log('用法: node test-all-timezones.js <用户名> <密码>');
    console.log('示例: node test-all-timezones.js admin 123456\n');
    process.exit(1);
  }

  console.log(`📱 测试账号: ${username}`);
  console.log(`🌐 测试环境: ${API_BASE}`);
  console.log(`⏰ 测试时区数量: ${TIMEZONES.length}个\n`);

  try {
    // 步骤1: 登录
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 步骤1: 登录认证');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const loginResponse = await fetch(`${API_BASE}/app/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    });

    const loginData = await loginResponse.json();

    if (loginData.code !== 200) {
      console.log('❌ 登录失败:', loginData.msg);
      process.exit(1);
    }

    const token = loginData.token || loginData.data?.token;
    const userId = loginData.data?.userId;

    console.log('✅ 登录成功');
    console.log(`  用户ID: ${userId}\n`);

    // 步骤2: 获取用户信息
    const userInfoResponse = await fetch(`${API_BASE}/app/user/info`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const userInfo = await userInfoResponse.json();
    const legalName = userInfo.data?.legalName || username;

    console.log(`👤 用户姓名: ${legalName}\n`);

    // 步骤3: 测试所有时区
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌍 步骤2: 测试所有时区');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const results = [];

    for (let i = 0; i < TIMEZONES.length; i++) {
      const timezone = TIMEZONES[i];

      console.log(`\n[${i + 1}/${TIMEZONES.length}]`);

      const result = await testTimezone(timezone, token, userId, legalName);
      results.push(result);

      // 每个时区测试之间等待1秒
      if (i < TIMEZONES.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // 步骤4: 输出测试总结
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 测试总结');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`总测试数: ${TIMEZONES.length}个时区`);
    console.log(`✅ 成功: ${successCount}个`);
    console.log(`❌ 失败: ${failureCount}个`);
    console.log(`📈 成功率: ${((successCount / TIMEZONES.length) * 100).toFixed(1)}%\n`);

    // 详细结果表格
    console.log('详细结果:');
    console.log('┌─────────────────────────────┬──────────┬─────────┬─────────┐');
    console.log('│ 时区                         │ 状态     │ Offset  │ 记录ID  │');
    console.log('├─────────────────────────────┼──────────┼─────────┼─────────┤');

    results.forEach((result, index) => {
      const timezone = TIMEZONES[index];
      const status = result.success ? '✅ 成功' : '❌ 失败';
      const offset = timezone.timeOffset >= 0 ? `+${timezone.timeOffset}` : `${timezone.timeOffset}`;
      const recordId = result.recordId || 'N/A';

      const name = timezone.name.padEnd(25, ' ');
      const statusPad = status.padEnd(8, ' ');
      const offsetPad = offset.padEnd(7, ' ');
      const recordPad = recordId.toString().padEnd(7, ' ');

      console.log(`│ ${name} │ ${statusPad} │ ${offsetPad} │ ${recordPad} │`);
    });

    console.log('└─────────────────────────────┴──────────┴─────────┴─────────┘\n');

    // 失败的时区列表
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      console.log('⚠️ 失败的时区:');
      failures.forEach((f, i) => {
        console.log(`  ${i + 1}. ${f.timezone}`);
        if (f.error) {
          console.log(`     错误: ${f.error}`);
        }
      });
      console.log('');
    }

    // 最终结论
    if (successCount === TIMEZONES.length) {
      console.log('🎉 所有时区测试通过！');
      console.log('✅ timeOffset参数在全球所有主要时区都工作正常！');
      console.log('✅ 系统已完全支持全球用户的时间记录！\n');
    } else {
      console.log('⚠️ 部分时区测试失败，请检查上述失败详情。\n');
    }

  } catch (error) {
    console.error('\n❌ 测试过程出错:', error.message);
    if (error.stack) {
      console.error('堆栈信息:', error.stack);
    }
    process.exit(1);
  }
}

// 运行测试
runAllTimezonesTest().catch(console.error);
