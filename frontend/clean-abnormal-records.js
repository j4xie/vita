#!/usr/bin/env node

/**
 * 清理异常的志愿者记录
 * 专门处理 startTime 为 null 的异常记录
 */

const BASE_URL = 'https://www.vitaglobal.icu';

// 管理员账号
const ADMIN_CREDENTIALS = {
  username: 'stevenj4xie',
  password: '123456'
};

let authToken = null;
let adminUserId = null;

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
    const token = data.token || data.data?.token;
    const userId = data.user?.userId || data.data?.userId || data.userId;

    if (token) {
      authToken = token;
      adminUserId = userId;
      console.log('✅ 登录成功');
      console.log('  管理员ID:', adminUserId);
      return true;
    } else {
      console.error('❌ 登录失败');
      return false;
    }
  } catch (error) {
    console.error('❌ 登录请求失败:', error.message);
    return false;
  }
}

/**
 * 获取用户857的异常记录
 */
async function getAbnormalRecord() {
  console.log('\n========== 2. 检查异常记录 ==========');

  try {
    const response = await fetch(`${BASE_URL}/app/hour/lastRecordList?userId=857`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (data.code === 200 && data.data) {
      const record = data.data;
      console.log('找到记录:');
      console.log('  记录ID:', record.id);
      console.log('  用户ID:', record.userId);
      console.log('  开始时间:', record.startTime || '❌ NULL（异常）');
      console.log('  结束时间:', record.endTime || '未签退');
      console.log('  状态:', record.status);
      console.log('  类型:', record.type);

      if (record.startTime === null) {
        console.log('\n⚠️  检测到异常记录：startTime为null');
        return record;
      } else {
        console.log('\n✅ 记录正常，无需清理');
        return null;
      }
    } else {
      console.log('无记录');
      return null;
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    return null;
  }
}

/**
 * 方案1：尝试强制签退异常记录
 */
async function forceCheckOutAbnormalRecord(record) {
  console.log('\n========== 3. 尝试强制签退 ==========');

  const now = new Date();
  // 如果没有开始时间，使用创建时间
  const startTime = record.createTime || now.toISOString();
  const endTime = now.toISOString();

  console.log('签退参数:');
  console.log('  记录ID:', record.id);
  console.log('  使用开始时间:', startTime);
  console.log('  签退时间:', endTime);

  try {
    const formData = new URLSearchParams({
      userId: String(record.userId),
      type: '2', // 签退
      operateUserId: String(adminUserId),
      operateLegalName: 'Admin',
      endTime: endTime,
      startTime: startTime, // 补充开始时间
      id: String(record.id),
      remark: '管理员修复异常记录'
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
      return false;
    }
  } catch (error) {
    console.error('❌ 签退请求失败:', error.message);
    return false;
  }
}

/**
 * 方案2：创建新的完整记录替代异常记录
 */
async function createNewCompleteRecord(userId) {
  console.log('\n========== 4. 创建新的完整记录 ==========');

  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60000);

  console.log('创建参数:');
  console.log('  用户ID:', userId);
  console.log('  开始时间:', oneMinuteAgo.toISOString());
  console.log('  结束时间:', now.toISOString());

  try {
    // 先签到
    const signInData = new URLSearchParams({
      userId: String(userId),
      type: '1', // 签到
      operateUserId: String(adminUserId),
      operateLegalName: 'Admin',
      startTime: oneMinuteAgo.toISOString(),
      remark: '管理员创建补充记录（签到）'
    });

    const signInRes = await fetch(`${BASE_URL}/app/hour/signRecord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${authToken}`,
      },
      body: signInData.toString()
    });

    const signInResult = await signInRes.json();

    if (signInResult.code === 200) {
      console.log('✅ 创建签到记录成功');

      // 立即签退
      const signOutData = new URLSearchParams({
        userId: String(userId),
        type: '2', // 签退
        operateUserId: String(adminUserId),
        operateLegalName: 'Admin',
        endTime: now.toISOString(),
        remark: '管理员创建补充记录（签退）'
      });

      const signOutRes = await fetch(`${BASE_URL}/app/hour/signRecord`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${authToken}`,
        },
        body: signOutData.toString()
      });

      const signOutResult = await signOutRes.json();

      if (signOutResult.code === 200) {
        console.log('✅ 创建签退记录成功');
        return true;
      } else {
        console.error('❌ 创建签退记录失败:', signOutResult.msg);
        return false;
      }
    } else {
      console.error('❌ 创建签到记录失败:', signInResult.msg);
      return false;
    }
  } catch (error) {
    console.error('❌ 创建记录失败:', error.message);
    return false;
  }
}

/**
 * 验证清理结果
 */
async function verifyCleanup() {
  console.log('\n========== 5. 验证清理结果 ==========');

  const record = await getAbnormalRecord();

  if (!record) {
    console.log('✅ 用户857没有异常记录了');
    return true;
  }

  if (record.startTime !== null) {
    console.log('✅ 记录已修复，startTime不再为null');
    return true;
  } else {
    console.log('❌ 仍然存在异常记录');
    return false;
  }
}

/**
 * 主流程
 */
async function main() {
  console.log('🔧 异常记录清理工具');
  console.log('当前时间:', new Date().toLocaleString());
  console.log('API地址:', BASE_URL);
  console.log('目标用户: 857（谢杰涛）');
  console.log('==================================\n');

  // 1. 管理员登录
  const loginSuccess = await adminLogin();
  if (!loginSuccess) {
    console.error('终止：管理员登录失败');
    process.exit(1);
  }

  // 2. 检查异常记录
  const abnormalRecord = await getAbnormalRecord();

  if (!abnormalRecord) {
    console.log('\n✅ 该用户没有异常记录，可以正常使用');
    return;
  }

  // 3. 尝试修复
  console.log('\n开始修复异常记录...');

  // 先尝试强制签退
  let fixSuccess = await forceCheckOutAbnormalRecord(abnormalRecord);

  if (!fixSuccess) {
    console.log('\n强制签退失败，尝试创建新记录...');
    fixSuccess = await createNewCompleteRecord(857);
  }

  // 4. 验证结果
  if (fixSuccess) {
    const verified = await verifyCleanup();
    if (verified) {
      console.log('\n✅ ✅ ✅ 异常记录已清理！用户现在可以正常签到了');
    } else {
      console.log('\n⚠️  清理可能未完全成功，请手动检查');
    }
  } else {
    console.log('\n❌ 清理失败，可能需要直接操作数据库');
    console.log('建议联系后端开发人员：');
    console.log('1. 删除ID为', abnormalRecord.id, '的记录');
    console.log('2. 或将其startTime字段设置为有效时间');
  }

  console.log('\n========== 清理任务结束 ==========');
}

// 运行主流程
main().catch(error => {
  console.error('程序异常:', error);
  process.exit(1);
});