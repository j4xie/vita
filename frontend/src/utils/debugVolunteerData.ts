/**
 * 志愿者数据调试工具
 * 在应用内直接验证后端数据
 */

import { getCurrentToken } from '../services/authAPI';
import { getApiUrl } from './environment';

const BASE_URL = getApiUrl();

export interface DebugResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * 验证志愿者后端数据
 * @param userId 用户ID
 * @returns 验证结果
 */
export const debugVolunteerData = async (userId: number): Promise<DebugResult> => {
  try {
    console.log(`🔍 [DEBUG] 开始验证用户 ${userId} 的志愿者数据...`);

    const token = await getCurrentToken();
    if (!token) {
      return {
        success: false,
        message: '❌ 未获取到有效Token，请先登录'
      };
    }

    const results: any = {
      userId,
      timestamp: new Date().toISOString(),
      records: null,
      lastRecord: null,
      hours: null,
      analysis: {}
    };

    // 1. 获取记录列表
    try {
      console.log('📋 [DEBUG] 获取记录列表...');
      const recordsResponse = await fetch(`${BASE_URL}/app/hour/recordList?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json();
        results.records = recordsData;

        if (recordsData.code === 200 && recordsData.rows) {
          const records = recordsData.rows;
          console.log(`✅ [DEBUG] 获取到 ${records.length} 条记录`);

          // 分析记录
          const pendingRecords = records.filter((r: any) => r.startTime && !r.endTime);
          const completedRecords = records.filter((r: any) => r.startTime && r.endTime);

          // 查找最近的签退记录
          const recentCheckouts = completedRecords
            .filter((record: any) => {
              const endTime = new Date(record.endTime);
              const now = new Date();
              const diffMinutes = (now.getTime() - endTime.getTime()) / (1000 * 60);
              return diffMinutes <= 60; // 最近1小时内
            })
            .sort((a: any, b: any) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());

          results.analysis = {
            totalRecords: records.length,
            pendingRecords: pendingRecords.length,
            completedRecords: completedRecords.length,
            recentCheckouts: recentCheckouts.length,
            latestRecord: records.length > 0 ? records.sort((a: any, b: any) => b.id - a.id)[0] : null
          };

          console.log('📊 [DEBUG] 记录分析:', results.analysis);

          // 输出最新的几条记录
          const latest = records.sort((a: any, b: any) => b.id - a.id).slice(0, 3);
          console.log('📄 [DEBUG] 最新3条记录:');
          latest.forEach((record: any, index: number) => {
            console.log(`  ${index + 1}. ID: ${record.id}, 签到: ${record.startTime || '未签到'}, 签退: ${record.endTime || '未签退'}`);
          });
        }
      } else {
        console.warn(`⚠️ [DEBUG] Records API失败: ${recordsResponse.status}`);
      }
    } catch (error) {
      console.error('❌ [DEBUG] Records API错误:', error);
    }

    // 2. 获取最后一条记录
    try {
      console.log('📋 [DEBUG] 获取最后一条记录...');
      const lastRecordResponse = await fetch(`${BASE_URL}/app/hour/lastRecordList?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (lastRecordResponse.ok) {
        const lastRecordData = await lastRecordResponse.json();
        results.lastRecord = lastRecordData;
        console.log('✅ [DEBUG] 最后记录:', {
          code: lastRecordData.code,
          hasData: !!lastRecordData.data,
          recordId: lastRecordData.data?.id
        });
      } else {
        console.warn(`⚠️ [DEBUG] Last Record API失败: ${lastRecordResponse.status}`);
      }
    } catch (error) {
      console.error('❌ [DEBUG] Last Record API错误:', error);
    }

    // 3. 获取工时统计
    try {
      console.log('📋 [DEBUG] 获取工时统计...');
      const hoursResponse = await fetch(`${BASE_URL}/app/hour/userHour?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (hoursResponse.ok) {
        const hoursData = await hoursResponse.json();
        results.hours = hoursData;
        console.log('✅ [DEBUG] 工时数据:', {
          code: hoursData.code,
          totalHours: hoursData.data?.totalHours || 0
        });
      } else {
        console.warn(`⚠️ [DEBUG] Hours API失败: ${hoursResponse.status}`);
      }
    } catch (error) {
      console.error('❌ [DEBUG] Hours API错误:', error);
    }

    // 生成分析报告
    const analysis = results.analysis || {};
    let statusMessage = '✅ 数据验证完成\n\n';
    statusMessage += `📊 统计信息:\n`;
    statusMessage += `   总记录数: ${analysis.totalRecords || 0}\n`;
    statusMessage += `   进行中: ${analysis.pendingRecords || 0}\n`;
    statusMessage += `   已完成: ${analysis.completedRecords || 0}\n`;
    statusMessage += `   最近1小时签退: ${analysis.recentCheckouts || 0}\n\n`;

    if (analysis.latestRecord) {
      const latest = analysis.latestRecord;
      statusMessage += `🕐 最新记录 (ID: ${latest.id}):\n`;
      statusMessage += `   签到: ${latest.startTime || '未签到'}\n`;
      statusMessage += `   签退: ${latest.endTime || '未签退'}\n`;
      // 更新状态显示逻辑
      let recordStatus = '进行中';
      if (latest.endTime) {
        if (latest.status === 1) {
          recordStatus = '已审核';
        } else if (latest.status === 2) {
          recordStatus = '已拒绝';
        } else {
          recordStatus = '待审核'; // 默认为待审核
        }
      }
      statusMessage += `   状态: ${recordStatus}\n`;
      statusMessage += `   审核状态码: ${latest.status ?? '未设置'}\n`;
      statusMessage += `   备注: ${latest.remark || '无'}\n\n`;
    }

    if (analysis.recentCheckouts > 0) {
      statusMessage += `✅ 检测到最近的签退记录，数据正常\n`;
    } else if (analysis.pendingRecords > 0) {
      statusMessage += `⚠️ 有进行中的记录，可能需要签退\n`;
    } else {
      statusMessage += `ℹ️ 没有最近的签退记录\n`;
    }

    statusMessage += `\n📄 详细数据请查看控制台日志`;

    return {
      success: true,
      message: statusMessage,
      data: results
    };

  } catch (error) {
    const errorMessage = `❌ 验证失败: ${error instanceof Error ? error.message : '未知错误'}`;
    console.error('[DEBUG] 验证过程出错:', error);
    return {
      success: false,
      message: errorMessage
    };
  }
};

/**
 * 快速检查最新签退记录
 * @param userId 用户ID
 * @returns 最新签退记录信息
 */
export const checkLatestCheckout = async (userId: number): Promise<DebugResult> => {
  try {
    const token = await getCurrentToken();
    if (!token) {
      return { success: false, message: '❌ 未获取到Token' };
    }

    const response = await fetch(`${BASE_URL}/app/hour/recordList?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, message: `❌ API调用失败: ${response.status}` };
    }

    const data = await response.json();
    if (data.code !== 200 || !data.rows) {
      return { success: false, message: `❌ 数据格式错误: ${data.msg}` };
    }

    const completedRecords = data.rows.filter((record: any) =>
      record.startTime && record.endTime
    );

    if (completedRecords.length === 0) {
      return { success: true, message: '📄 没有已完成的签退记录', data: null };
    }

    const latestCheckout = completedRecords
      .sort((a: any, b: any) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())[0];

    const endTime = new Date(latestCheckout.endTime);
    const minutesAgo = Math.floor((new Date().getTime() - endTime.getTime()) / (1000 * 60));

    return {
      success: true,
      message: `✅ 最新签退: ${minutesAgo}分钟前\n时间: ${latestCheckout.endTime}\n备注: ${latestCheckout.remark || '无'}`,
      data: latestCheckout
    };

  } catch (error) {
    return {
      success: false,
      message: `❌ 检查失败: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
};