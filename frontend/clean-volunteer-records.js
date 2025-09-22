#!/usr/bin/env node

/**
 * 清理未签退的志愿者记录
 * 用于管理员清理异常的签到记录
 */

const BASE_URL = 'https://www.vitaglobal.icu';

// 需要提供管理员账号
const ADMIN_CREDENTIALS = {
  username: process.argv[2],
  password: process.argv[3],
  targetUserId: process.argv[4] // 要清理记录的用户ID
};

if (process.argv.length < 5) {
  console.log('用法: node clean-volunteer-records.js <管理员用户名> <管理员密码> <目标用户ID>');
  console.log('示例: node clean-volunteer-records.js admin 123456 291');
  process.exit(1);
}

let authToken = null;
let adminUserId = null;
let adminName = null;

/**
 * 管理员登录
 */
async function adminLogin() {
  console.log('\n========== 1. 管理员登录 ==========');
  console.log('账号:', ADMIN_CREDENTIALS.username);

  try {
    const response = await fetch(`${BASE_URL}/app/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: ADMIN_CREDENTIALS.username,
        password: ADMIN_CREDENTIALS.password
      }).toString()
    });

    const data = await response.json();
    console.log('登录响应:', JSON.stringify(data, null, 2));

    // 修正：后端返回 code:200 和 msg:"操作成功" 时，token可能在data字段内
    const token = data.token || data.data?.token;
    const userId = data.user?.userId || data.data?.userId || data.userId;
    const userName = data.user?.legalName || data.user?.userName || data.data?.legalName || data.data?.userName || 'Admin';
    const permission = data.user?.permission || data.data?.permission || data.permission;

    if ((data.code === 200 || data.msg === '操作成功') && token) {
      authToken = token;
      adminUserId = userId;
      adminName = userName;
      console.log('✅ 登录成功');
      console.log('  管理员ID:', adminUserId);
      console.log('  管理员姓名:', adminName);
      console.log('  权限等级:', permission);
      return true;
    } else {
      console.error('❌ 登录失败');
      console.error('  返回码:', data.code);
      console.error('  消息:', data.msg);
      console.error('  是否有token:', !!token);
      return false;
    }
  } catch (error) {
    console.error('❌ 登录请求失败:', error.message);
    return false;
  }
}

/**
 * 获取指定用户的最后签到记录
 */
async function getTargetUserLastRecord(targetUserId) {
  console.log('\n========== 2. 获取用户签到记录 ==========');
  console.log('目标用户ID:', targetUserId);

  try {
    const response = await fetch(`${BASE_URL}/app/hour/lastRecordList?userId=${targetUserId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (data.code === 200 && data.data) {
      const record = data.data;
      console.log('✅ 找到签到记录:');
      console.log('  记录ID:', record.id);
      console.log('  用户ID:', record.userId);
      console.log('  开始时间:', record.startTime);
      console.log('  结束时间:', record.endTime || '未签退');

      if (!record.endTime) {
        console.log('⚠️  检测到未签退记录，需要清理');
      }

      return record;
    } else if (data.code === 500) {
      console.log('📝 该用户无签到记录');
      return null;
    } else {
      console.error('❌ 获取记录失败:', data.msg);
      return null;
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    return null;
  }
}

/**
 * 强制签退未完成的记录
 */
async function forceCheckOut(record) {
  console.log('\n========== 3. 执行强制签退 ==========');

  if (!record || record.endTime) {
    console.log('无需签退：记录不存在或已签退');
    return false;
  }

  const now = new Date();
  const endTime = now.toISOString();

  console.log('签退参数:');
  console.log('  记录ID:', record.id);
  console.log('  用户ID:', record.userId);
  console.log('  签退时间:', endTime);
  console.log('  操作员:', adminName);

  try {
    const formData = new URLSearchParams({
      userId: String(record.userId),
      type: '2', // 签退
      operateUserId: String(adminUserId),
      operateLegalName: adminName,
      endTime: endTime,
      id: String(record.id),
      remark: '管理员清理异常记录'
    });

    const response = await fetch(`${BASE_URL}/app/hour/signRecord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData.toString()
    });

    const data = await response.json();

    if (data.code === 200) {
      console.log('✅ 强制签退成功');
      return true;
    } else {
      console.error('❌ 强制签退失败:', data.msg);

      // 如果失败，尝试直接删除记录（需要API支持）
      console.log('\n尝试其他方法...');
      return await tryAlternativeCleanup(record);
    }
  } catch (error) {
    console.error('❌ 签退请求失败:', error.message);
    return false;
  }
}

/**
 * 尝试其他清理方法
 */
async function tryAlternativeCleanup(record) {
  console.log('\n========== 4. 尝试备用清理方案 ==========');

  // 方案1: 尝试使用较早的时间签退（比签到时间晚1分钟）
  const startTime = new Date(record.startTime);
  const earlyEndTime = new Date(startTime.getTime() + 60000); // 加1分钟

  console.log('尝试使用较早的签退时间:', earlyEndTime.toISOString());

  try {
    const formData = new URLSearchParams({
      userId: String(record.userId),
      type: '2',
      operateUserId: String(adminUserId),
      operateLegalName: adminName,
      endTime: earlyEndTime.toISOString(),
      id: String(record.id),
      remark: '系统自动清理（最小时长）'
    });

    const response = await fetch(`${BASE_URL}/app/hour/signRecord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData.toString()
    });

    const data = await response.json();

    if (data.code === 200) {
      console.log('✅ 备用方案签退成功（使用最小时长）');
      return true;
    } else {
      console.error('❌ 备用方案失败:', data.msg);

      // 最终方案：建议手动处理
      console.log('\n⚠️  自动清理失败，可能需要：');
      console.log('1. 直接在数据库中更新记录');
      console.log('2. 联系后端开发人员添加管理员清理API');
      console.log('3. 使用后台管理系统手动处理');

      return false;
    }
  } catch (error) {
    console.error('❌ 备用方案请求失败:', error.message);
    return false;
  }
}

/**
 * 验证清理结果
 */
async function verifyCleanup(targetUserId) {
  console.log('\n========== 5. 验证清理结果 ==========');

  const record = await getTargetUserLastRecord(targetUserId);

  if (!record) {
    console.log('✅ 用户现在没有活动的签到记录');
    return true;
  }

  if (record.endTime) {
    console.log('✅ 最后的记录已经签退');
    console.log('  签到时间:', record.startTime);
    console.log('  签退时间:', record.endTime);
    return true;
  } else {
    console.log('❌ 仍然存在未签退的记录');
    return false;
  }
}

/**
 * 主流程
 */
async function main() {
  console.log('🧹 志愿者记录清理工具');
  console.log('当前时间:', new Date().toLocaleString());
  console.log('API地址:', BASE_URL);
  console.log('==================================\n');

  // 1. 管理员登录
  const loginSuccess = await adminLogin();
  if (!loginSuccess) {
    console.error('终止：管理员登录失败');
    process.exit(1);
  }

  // 2. 获取目标用户记录
  const targetUserId = ADMIN_CREDENTIALS.targetUserId;
  const record = await getTargetUserLastRecord(targetUserId);

  if (!record || record.endTime) {
    console.log('\n✅ 该用户没有需要清理的记录');
    return;
  }

  // 3. 执行清理
  const cleanupSuccess = await forceCheckOut(record);

  // 4. 验证结果
  if (cleanupSuccess) {
    const verified = await verifyCleanup(targetUserId);
    if (verified) {
      console.log('\n✅ ✅ ✅ 清理完成！用户现在可以正常签到了');
    } else {
      console.log('\n⚠️  清理可能未完全成功，请手动检查');
    }
  } else {
    console.log('\n❌ 清理失败，请尝试手动处理或联系技术支持');
  }

  console.log('\n========== 清理任务结束 ==========');
}

// 运行主流程
main().catch(error => {
  console.error('程序异常:', error);
  process.exit(1);
});