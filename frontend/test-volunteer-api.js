#!/usr/bin/env node

/**
 * 测试志愿者API是否已修复
 */

const fetch = require('node-fetch');

// 测试配置 - 请根据实际情况修改
const API_URL = 'https://www.vitaglobal.icu';
const TEST_USER_ID = 6; // 测试用户ID，你可以修改为实际的用户ID
const TOKEN = ''; // 需要一个有效的token

async function testVolunteerAPI() {
  console.log('========================================');
  console.log('测试志愿者状态API');
  console.log('========================================\n');

  // 测试 lastRecordList 接口
  console.log('1. 测试 /app/hour/lastRecordList 接口:');
  console.log(`   URL: ${API_URL}/app/hour/lastRecordList?userId=${TEST_USER_ID}`);

  try {
    const response = await fetch(`${API_URL}/app/hour/lastRecordList?userId=${TEST_USER_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const status = response.status;
    const data = await response.json();

    console.log(`   状态码: ${status}`);
    console.log(`   响应数据:`, JSON.stringify(data, null, 2));

    if (status === 500) {
      console.log('\n   ❌ 错误：后端返回500错误');
      if (data.msg && data.msg.includes('ambiguous')) {
        console.log('   ⚠️  检测到SQL歧义错误 - 后端还未修复');
      }
    } else if (status === 200) {
      console.log('\n   ✅ 成功：API正常返回数据');
      if (data.data) {
        console.log('   志愿者记录:', data.data);
      }
    }
  } catch (error) {
    console.log(`   ❌ 网络错误:`, error.message);
  }

  console.log('\n========================================');
  console.log('2. 测试备用接口 /app/hour/recordList:');
  console.log(`   URL: ${API_URL}/app/hour/recordList?userId=${TEST_USER_ID}`);

  try {
    const response = await fetch(`${API_URL}/app/hour/recordList?userId=${TEST_USER_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const status = response.status;
    const data = await response.json();

    console.log(`   状态码: ${status}`);

    if (status === 200 && data.rows && data.rows.length > 0) {
      console.log(`   ✅ 成功：找到 ${data.rows.length} 条记录`);
      console.log(`   最新记录:`, data.rows[0]);
    } else if (status === 200 && (!data.rows || data.rows.length === 0)) {
      console.log('   ℹ️  没有找到记录');
    } else {
      console.log(`   ❌ 错误：`, data.msg || '未知错误');
    }
  } catch (error) {
    console.log(`   ❌ 网络错误:`, error.message);
  }

  console.log('\n========================================');
  console.log('测试结论:');
  console.log('如果 lastRecordList 返回500错误且包含 "ambiguous"，说明后端SQL问题还未修复');
  console.log('如果 lastRecordList 返回200并有数据，说明后端已修复');
  console.log('========================================');
}

// 无需token的测试
async function testWithoutAuth() {
  console.log('\n测试无认证情况下的API响应：');

  try {
    const response = await fetch(`${API_URL}/app/hour/lastRecordList?userId=${TEST_USER_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const status = response.status;
    const text = await response.text();

    console.log(`状态码: ${status}`);

    try {
      const data = JSON.parse(text);
      console.log('响应:', JSON.stringify(data, null, 2));

      // 检查是否是SQL错误
      if (status === 500 && data.msg) {
        if (data.msg.includes('ambiguous') || data.msg.includes('Column')) {
          console.log('\n🔴 检测到SQL歧义错误 - 后端未修复');
          console.log('错误详情:', data.msg);
        }
      }
    } catch (e) {
      console.log('响应文本:', text);
    }
  } catch (error) {
    console.log('请求失败:', error.message);
  }
}

// 执行测试
if (TOKEN) {
  testVolunteerAPI();
} else {
  console.log('未提供TOKEN，执行无认证测试...');
  testWithoutAuth();
}