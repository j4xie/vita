/**
 * 后端数据验证脚本
 * 用于检查志愿者签退后的数据是否正确存储在后端
 */

const BASE_URL = 'https://www.vitaglobal.icu';

// 模拟Token (需要替换为实际的有效Token)
const TOKEN = 'YOUR_VALID_TOKEN_HERE';

/**
 * 验证志愿者记录数据
 * @param {number} userId 用户ID
 */
async function verifyVolunteerData(userId) {
  console.log(`🔍 开始验证用户 ${userId} 的志愿者数据...`);

  try {
    // 1. 获取最新的志愿者记录
    console.log('\n📋 1. 检查志愿者记录列表...');
    const recordsResponse = await fetch(`${BASE_URL}/app/hour/recordList?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!recordsResponse.ok) {
      throw new Error(`Records API失败: ${recordsResponse.status} ${recordsResponse.statusText}`);
    }

    const recordsData = await recordsResponse.json();
    console.log('✅ Records API响应:', {
      code: recordsData.code,
      message: recordsData.msg,
      totalRecords: recordsData.rows?.length || 0
    });

    if (recordsData.code === 200 && recordsData.rows && recordsData.rows.length > 0) {
      // 显示最新的几条记录
      const latestRecords = recordsData.rows
        .sort((a, b) => b.id - a.id)  // 按ID降序排列
        .slice(0, 3);  // 取最新的3条

      console.log('\n📊 最新的3条记录:');
      latestRecords.forEach((record, index) => {
        console.log(`  ${index + 1}. ID: ${record.id}`);
        console.log(`     签到时间: ${record.startTime || '未签到'}`);
        console.log(`     签退时间: ${record.endTime || '未签退'}`);
        console.log(`     状态: ${record.endTime ? '已完成' : '进行中'}`);
        console.log(`     备注: ${record.remark || '无'}`);
        console.log(`     ----`);
      });

      // 检查是否有pending状态的记录
      const pendingRecords = recordsData.rows.filter(record =>
        record.startTime && !record.endTime
      );

      const completedRecords = recordsData.rows.filter(record =>
        record.startTime && record.endTime
      );

      console.log(`\n📈 记录统计:`);
      console.log(`   总记录数: ${recordsData.rows.length}`);
      console.log(`   进行中(pending): ${pendingRecords.length}`);
      console.log(`   已完成: ${completedRecords.length}`);

      // 检查最新的签退记录
      const recentCheckouts = completedRecords
        .filter(record => {
          const endTime = new Date(record.endTime);
          const now = new Date();
          const diffMinutes = (now - endTime) / (1000 * 60);
          return diffMinutes <= 60; // 最近1小时内的签退
        })
        .sort((a, b) => new Date(b.endTime) - new Date(a.endTime));

      if (recentCheckouts.length > 0) {
        console.log(`\n🕐 最近1小时内的签退记录:`);
        recentCheckouts.forEach(record => {
          const endTime = new Date(record.endTime);
          const minutesAgo = Math.floor((new Date() - endTime) / (1000 * 60));
          console.log(`   ID: ${record.id}, ${minutesAgo}分钟前签退`);
          console.log(`   签退时间: ${record.endTime}`);
          console.log(`   备注: ${record.remark || '无'}`);
        });
      } else {
        console.log(`\n⚠️  最近1小时内没有签退记录`);
      }
    }

    // 2. 获取最后一条记录
    console.log('\n📋 2. 检查最后一条记录...');
    const lastRecordResponse = await fetch(`${BASE_URL}/app/hour/lastRecordList?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (lastRecordResponse.ok) {
      const lastRecordData = await lastRecordResponse.json();
      console.log('✅ Last Record API响应:', {
        code: lastRecordData.code,
        message: lastRecordData.msg,
        hasData: !!lastRecordData.data
      });

      if (lastRecordData.data) {
        console.log('📄 最后一条记录详情:');
        console.log(`   ID: ${lastRecordData.data.id}`);
        console.log(`   签到时间: ${lastRecordData.data.startTime || '未签到'}`);
        console.log(`   签退时间: ${lastRecordData.data.endTime || '未签退'}`);
        console.log(`   状态: ${lastRecordData.data.endTime ? '已完成' : '进行中'}`);
      }
    } else {
      console.log(`⚠️  Last Record API失败: ${lastRecordResponse.status}`);
    }

    // 3. 获取工时统计
    console.log('\n📋 3. 检查工时统计...');
    const hoursResponse = await fetch(`${BASE_URL}/app/hour/userHour?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (hoursResponse.ok) {
      const hoursData = await hoursResponse.json();
      console.log('✅ Hours API响应:', {
        code: hoursData.code,
        message: hoursData.msg,
        totalHours: hoursData.data?.totalHours || 0
      });
    } else {
      console.log(`⚠️  Hours API失败: ${hoursResponse.status}`);
    }

  } catch (error) {
    console.error('❌ 验证过程中出错:', error.message);
    console.log('\n🔧 可能的原因:');
    console.log('   1. Token已过期 - 需要重新登录获取新Token');
    console.log('   2. 网络连接问题');
    console.log('   3. 后端服务异常');
    console.log('   4. 用户ID不正确');
  }
}

/**
 * 如何使用此脚本:
 *
 * 1. 在React Native应用中获取当前用户的Token:
 *    在开发者工具中执行: AsyncStorage.getItem('token')
 *
 * 2. 将上面的TOKEN变量替换为实际的Token
 *
 * 3. 在Node.js环境中运行:
 *    node verify-backend-data.js
 *
 * 或者在React Native应用中的某个页面调用:
 *    verifyVolunteerData(用户ID)
 */

// 如果在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
  // 需要安装 node-fetch: npm install node-fetch
  // const fetch = require('node-fetch');

  // 示例调用
  if (TOKEN !== 'YOUR_VALID_TOKEN_HERE') {
    verifyVolunteerData(1); // 替换为实际的用户ID
  } else {
    console.log('❌ 请先在脚本中设置有效的TOKEN');
    console.log('💡 在应用中获取Token: AsyncStorage.getItem("token")');
  }
}

// 如果在React Native中使用，可以直接调用函数
module.exports = { verifyVolunteerData };