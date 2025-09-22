/**
 * 志愿者操作服务
 * 集成VolunteerContext，提供签到签退操作并自动更新UI状态
 */

import { Alert } from 'react-native';
import { performVolunteerCheckIn, performVolunteerCheckOut, getLastVolunteerRecord } from './volunteerAPI';
import { VolunteerRecord } from './volunteerAPI';
import { VolunteerStatus, getStatusFromRecord } from '../context/VolunteerContext';

export interface VolunteerOperationResult {
  success: boolean;
  message: string;
  record?: VolunteerRecord;
  status?: VolunteerStatus;
}

export class VolunteerOperationService {
  /**
   * 执行志愿者签到操作
   * @param userId 志愿者用户ID
   * @param operateUserId 操作者用户ID
   * @param operateLegalName 操作者姓名
   * @param volunteerContext 志愿者Context
   * @param t 翻译函数
   * @returns 操作结果
   */
  static async checkIn(
    userId: number,
    operateUserId: number,
    operateLegalName: string,
    volunteerContext: any,
    t: (key: string, defaultValue?: string) => string
  ): Promise<VolunteerOperationResult> {
    try {
      if (__DEV__) {
        console.log('🔍 [VOLUNTEER-SERVICE] 开始签到操作:', {
          userId,
          operateUserId,
          operateLegalName
        });
      }

      // 设置加载状态
      volunteerContext.setLoading(true);
      volunteerContext.setError(null);

      // 执行签到API调用
      const result = await performVolunteerCheckIn(
        userId,
        operateUserId,
        operateLegalName
      );

      if (result && result.code === 200) {
        // 获取最新的签到记录
        try {
          const recordResponse = await getLastVolunteerRecord(userId);
          if (recordResponse.code === 200 && recordResponse.data) {
            const record = recordResponse.data;
            const status = getStatusFromRecord(record);

            // 更新Context状态
            volunteerContext.updateStatus(status, record);

            if (__DEV__) {
              console.log('✅ [VOLUNTEER-SERVICE] 签到成功，状态已更新:', {
                userId,
                status,
                recordId: record.id
              });
            }

            return {
              success: true,
              message: t('volunteer.checkin_success', '签到成功'),
              record,
              status
            };
          }
        } catch (recordError) {
          // 即使获取记录失败，如果API返回成功，也认为操作成功
          if (__DEV__) {
            console.warn('⚠️ [VOLUNTEER-SERVICE] 获取签到记录失败，但API操作成功:', recordError);
          }
          volunteerContext.updateStatus('signed_in');
        }

        return {
          success: true,
          message: t('volunteer.checkin_success', '签到成功'),
          status: 'signed_in'
        };
      } else {
        const errorMessage = result?.msg || t('volunteer.checkin_failed', '签到失败');
        volunteerContext.setError(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('volunteer.network_error', '网络错误');
      volunteerContext.setError(errorMessage);

      if (__DEV__) {
        console.error('❌ [VOLUNTEER-SERVICE] 签到操作失败:', error);
      }

      return {
        success: false,
        message: errorMessage
      };
    } finally {
      volunteerContext.setLoading(false);
    }
  }

  /**
   * 执行志愿者签退操作
   * @param userId 志愿者用户ID
   * @param operateUserId 操作者用户ID
   * @param operateLegalName 操作者姓名
   * @param volunteerContext 志愿者Context
   * @param t 翻译函数
   * @param remark 签退备注
   * @returns 操作结果
   */
  static async checkOut(
    userId: number,
    operateUserId: number,
    operateLegalName: string,
    volunteerContext: any,
    t: (key: string, defaultValue?: string) => string,
    remark?: string
  ): Promise<VolunteerOperationResult> {
    try {
      if (__DEV__) {
        console.log('🔍 [VOLUNTEER-SERVICE] 开始签退操作:', {
          userId,
          operateUserId,
          operateLegalName,
          remark
        });
      }

      // 设置加载状态
      volunteerContext.setLoading(true);
      volunteerContext.setError(null);

      // 执行签退API调用
      const result = await performVolunteerCheckOut(
        userId,
        operateUserId,
        operateLegalName,
        remark
      );

      if (result && result.code === 200) {
        // 获取最新的签退记录
        try {
          const recordResponse = await getLastVolunteerRecord(userId);
          if (recordResponse.code === 200 && recordResponse.data) {
            const record = recordResponse.data;
            const status = getStatusFromRecord(record);

            // 更新Context状态
            volunteerContext.updateStatus(status, record);

            if (__DEV__) {
              console.log('✅ [VOLUNTEER-SERVICE] 签退成功，状态已更新:', {
                userId,
                status,
                recordId: record.id
              });
            }

            return {
              success: true,
              message: t('volunteer.checkout_success', '签退成功'),
              record,
              status
            };
          }
        } catch (recordError) {
          // 即使获取记录失败，如果API返回成功，也认为操作成功
          if (__DEV__) {
            console.warn('⚠️ [VOLUNTEER-SERVICE] 获取签退记录失败，但API操作成功:', recordError);
          }
          volunteerContext.updateStatus('signed_out');
        }

        return {
          success: true,
          message: t('volunteer.checkout_success', '签退成功'),
          status: 'signed_out'
        };
      } else {
        const errorMessage = result?.msg || t('volunteer.checkout_failed', '签退失败');
        volunteerContext.setError(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('volunteer.network_error', '网络错误');
      volunteerContext.setError(errorMessage);

      if (__DEV__) {
        console.error('❌ [VOLUNTEER-SERVICE] 签退操作失败:', error);
      }

      return {
        success: false,
        message: errorMessage
      };
    } finally {
      volunteerContext.setLoading(false);
    }
  }

  /**
   * 显示操作结果
   * @param result 操作结果
   * @param t 翻译函数
   */
  static showResult(
    result: VolunteerOperationResult,
    t: (key: string, defaultValue?: string) => string
  ): void {
    if (result.success) {
      // 成功时显示简短提示
      Alert.alert(
        t('common.success', '成功'),
        result.message,
        [{ text: t('common.ok', '确定') }]
      );
    } else {
      // 失败时显示错误信息
      Alert.alert(
        t('common.error', '错误'),
        result.message,
        [{ text: t('common.ok', '确定') }]
      );
    }
  }

  /**
   * 获取志愿者当前状态
   * @param userId 志愿者用户ID
   * @param volunteerContext 志愿者Context
   * @returns 当前状态
   */
  static async getCurrentStatus(
    userId: number,
    volunteerContext: any
  ): Promise<VolunteerStatus> {
    try {
      volunteerContext.setLoading(true);

      const recordResponse = await getLastVolunteerRecord(userId);
      if (recordResponse.code === 200 && recordResponse.data) {
        const record = recordResponse.data;
        const status = getStatusFromRecord(record);

        // 更新Context状态
        volunteerContext.updateStatus(status, record);

        return status;
      } else {
        // 没有记录，设置为未签到状态
        volunteerContext.updateStatus('not_signed_in', null);
        return 'not_signed_in';
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [VOLUNTEER-SERVICE] 获取状态失败:', error);
      }
      // 发生错误时，不改变当前状态
      return volunteerContext.currentStatus;
    } finally {
      volunteerContext.setLoading(false);
    }
  }
}

export default VolunteerOperationService;