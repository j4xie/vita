// 测试API是否正常返回活动数据
const API_URL = 'https://www.vitaglobal.icu';

async function testActivityList() {
  console.log('🌐 测试活动列表API...');
  console.log(`📍 API地址: ${API_URL}`);

  try {
    const url = `${API_URL}/app/activity/list?pageNum=1&pageSize=10`;
    console.log(`\n🔗 请求URL: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`\n✅ 响应状态: ${response.status}`);

    const data = await response.json();

    console.log('\n📊 API响应数据:');
    console.log(`- 状态码: ${data.code}`);
    console.log(`- 消息: ${data.msg}`);
    console.log(`- 总数: ${data.total}`);
    console.log(`- 返回数量: ${data.rows?.length || 0}`);

    if (data.rows && data.rows.length > 0) {
      console.log('\n📋 前3个活动:');
      data.rows.slice(0, 3).forEach((activity, index) => {
        console.log(`\n${index + 1}. ${activity.name}`);
        console.log(`   - ID: ${activity.id}`);
        console.log(`   - 地址: ${activity.address}`);
        console.log(`   - 时间: ${activity.startTime}`);
        console.log(`   - 报名人数: ${activity.registerCount || 0}`);
      });
    }

    console.log('\n✅ API测试成功！');
    return true;
  } catch (error) {
    console.error('\n❌ API测试失败:');
    console.error(`错误类型: ${error.name}`);
    console.error(`错误信息: ${error.message}`);
    if (error.stack) {
      console.error(`错误堆栈: ${error.stack.substring(0, 200)}...`);
    }
    return false;
  }
}

// 运行测试
testActivityList();