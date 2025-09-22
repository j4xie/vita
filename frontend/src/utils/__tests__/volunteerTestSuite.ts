/**
 * 志愿者签到签退自动化测试套件
 * 用于验证多人同时签到签退的数据一致性和后端计算正确性
 */

import { volunteerSignRecord, getLastVolunteerRecord, getVolunteerHours, getVolunteerRecords } from '../../services/volunteerAPI';
import { getCurrentToken, getCurrentUserId } from '../../services/authAPI';
import { pomeloXAPI } from '../../services/PomeloXAPI';

interface TestUser {
  userId: number;
  userName: string;
  legalName: string;
  deptId: number;
  school: string;
}

// 测试用户配置（基于真实用户数据）
const TEST_USERS: TestUser[] = [
  { userId: 102, userName: 'admin', legalName: '管理员', deptId: 223, school: 'CU总部' },
  { userId: 120, userName: 'test001', legalName: 'test001', deptId: 210, school: 'UC Davis' },
  // 如果有更多用户可以添加
];

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  timestamp: string;
}

interface TestSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  results: TestResult[];
  users: TestUser[];
}

export class VolunteerTestSuite {
  private static currentSession: TestSession | null = null;
  
  /**
   * 开始新的测试会话
   */
  static async startTestSession(users: TestUser[] = TEST_USERS): Promise<string> {
    const sessionId = `test_${Date.now()}`;
    this.currentSession = {
      sessionId,
      startTime: new Date(),
      results: [],
      users,
    };
    
    console.log(`🧪 开始测试会话: ${sessionId}`);
    console.log(`📋 测试用户: ${users.map(u => `${u.userName}(${u.userId})`).join(', ')}`);
    
    return sessionId;
  }

  /**
   * 记录测试结果
   */
  private static addResult(success: boolean, message: string, data?: any) {
    if (!this.currentSession) return;
    
    const result: TestResult = {
      success,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    
    this.currentSession.results.push(result);
    console.log(`${success ? '✅' : '❌'} ${message}`, data ? data : '');
  }

  /**
   * 测试单个用户的签到签退流程
   */
  static async testSingleUserFlow(testUser: TestUser): Promise<boolean> {
    try {
      const { userId, userName, legalName } = testUser;
      const operateUserId = await getCurrentUserId();
      if (!operateUserId) {
        throw new Error('无法获取当前用户ID，请重新登录');
      }
      const operateLegalName = '自动测试';
      
      console.log(`👤 开始测试用户 ${userName}(${userId}) 的签到签退流程`);
      
      // 1. 获取初始状态
      const initialRecord = await getLastVolunteerRecord(userId);
      this.addResult(true, `获取用户${userName}初始状态`, {
        hasRecord: initialRecord.code === 200,
        isCheckedIn: initialRecord.data?.startTime && !initialRecord.data?.endTime
      });

      // 2. 如果已签到，先签退
      if (initialRecord.code === 200 && initialRecord.data?.startTime && !initialRecord.data?.endTime) {
        console.log(`📤 用户${userName}已签到，先执行签退`);
        const checkOutTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
        
        const signOutResult = await volunteerSignRecord(
          userId,
          2, // 签退
          operateUserId,
          operateLegalName,
          undefined,
          checkOutTime,
          initialRecord.data.id
        );
        
        this.addResult(
          signOutResult.code === 200,
          `用户${userName}清理签退`,
          { code: signOutResult.code, msg: signOutResult.msg }
        );
        
        // 等待1秒确保后端处理完成
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 3. 执行签到
      const checkInTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const signInResult = await volunteerSignRecord(
        userId,
        1, // 签到
        operateUserId,
        operateLegalName,
        checkInTime
      );
      
      this.addResult(
        signInResult.code === 200,
        `用户${userName}签到`,
        { code: signInResult.code, msg: signInResult.msg, checkInTime }
      );

      if (signInResult.code !== 200) {
        throw new Error(`签到失败: ${signInResult.msg}`);
      }

      // 4. 等待3秒（模拟工作时间）
      console.log(`⏱️ 用户${userName}工作中，等待3秒...`);
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 5. 获取签到记录ID
      const newRecord = await getLastVolunteerRecord(userId);
      if (newRecord.code !== 200 || !newRecord.data?.id) {
        throw new Error('获取签到记录失败');
      }

      // 6. 执行签退
      const checkOutTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const signOutResult = await volunteerSignRecord(
        userId,
        2, // 签退
        operateUserId,
        operateLegalName,
        undefined,
        checkOutTime,
        newRecord.data.id
      );
      
      this.addResult(
        signOutResult.code === 200,
        `用户${userName}签退`,
        { code: signOutResult.code, msg: signOutResult.msg, checkOutTime }
      );

      // 7. 验证工时计算
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待后端计算
      const hoursResult = await getVolunteerHours();
      const userHours = hoursResult.rows?.find((h: any) => h.userId === userId);
      
      this.addResult(
        !!userHours,
        `用户${userName}工时计算`,
        { 
          totalMinutes: userHours?.totalMinutes,
          totalHours: userHours ? Math.round(userHours.totalMinutes / 60 * 100) / 100 : 0
        }
      );

      return true;
    } catch (error) {
      this.addResult(false, `用户${testUser.userName}测试失败`, { error: error instanceof Error ? error.message : error });
      return false;
    }
  }

  /**
   * 测试多人并发签到签退
   */
  static async testConcurrentOperations(users: TestUser[] = TEST_USERS): Promise<void> {
    console.log(`🚀 开始并发测试，${users.length}个用户同时操作`);
    
    try {
      // 并发执行所有用户的签到签退流程
      const promises = users.map(user => this.testSingleUserFlow(user));
      const results = await Promise.allSettled(promises);
      
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
      const failureCount = results.length - successCount;
      
      this.addResult(
        failureCount === 0,
        `并发测试完成`,
        { 
          totalUsers: users.length,
          successful: successCount,
          failed: failureCount,
          successRate: `${Math.round(successCount / users.length * 100)}%`
        }
      );
      
    } catch (error) {
      this.addResult(false, '并发测试异常', { error: error instanceof Error ? error.message : error });
    }
  }

  /**
   * 验证后端数据一致性
   */
  static async verifyBackendData(): Promise<void> {
    try {
      console.log('🔍 验证后端数据一致性...');
      
      // 1. 获取志愿者记录
      const records = await getVolunteerRecords();
      this.addResult(
        records.code === 200,
        '获取志愿者记录',
        { 
          recordCount: records.rows?.length || 0,
          records: records.rows?.slice(0, 3).map((r: any) => ({
            userId: r.userId,
            startTime: r.startTime,
            endTime: r.endTime,
            type: r.type
          }))
        }
      );

      // 2. 获取工时统计
      const hours = await getVolunteerHours();
      this.addResult(
        hours.code === 200,
        '获取工时统计',
        { 
          userCount: hours.rows?.length || 0,
          totalMinutes: hours.rows?.reduce((sum: number, h: any) => sum + (h.totalMinutes || 0), 0),
          users: hours.rows?.map((h: any) => ({
            userId: h.userId,
            legalName: h.legalName,
            totalMinutes: h.totalMinutes,
            totalHours: Math.round(h.totalMinutes / 60 * 100) / 100
          }))
        }
      );

      // 3. 数据一致性检查
      if (records.code === 200 && hours.code === 200) {
        const recordUserIds = new Set(records.rows?.map((r: any) => r.userId) || []);
        const hoursUserIds = new Set(hours.rows?.map((h: any) => h.userId) || []);
        
        const consistency = {
          recordUsers: recordUserIds.size,
          hoursUsers: hoursUserIds.size,
          commonUsers: [...recordUserIds].filter(id => hoursUserIds.has(id)).length,
          onlyInRecords: [...recordUserIds].filter(id => !hoursUserIds.has(id)),
          onlyInHours: [...hoursUserIds].filter(id => !recordUserIds.has(id)),
        };
        
        this.addResult(
          consistency.commonUsers > 0,
          '数据一致性检查',
          consistency
        );
      }

    } catch (error) {
      this.addResult(false, '后端数据验证失败', { error: error instanceof Error ? error.message : error });
    }
  }

  /**
   * 测试API参数格式
   */
  static async testAPIParameterFormat(): Promise<void> {
    try {
      console.log('📝 测试API参数格式...');
      
      const testUserId = 102; // admin用户
      const operateUserId = testUserId;
      const operateLegalName = '自动测试';
      
      // 测试签到参数格式
      const checkInTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
      console.log('📤 测试签到参数:', {
        userId: testUserId,
        type: 1,
        startTime: checkInTime,
        operateUserId,
        operateLegalName
      });
      
      // 注意：这里只是格式测试，不实际调用API避免产生垃圾数据
      this.addResult(true, 'API参数格式验证', {
        signInFormat: `userId=${testUserId}&type=1&startTime=${checkInTime}&operateUserId=${operateUserId}&operateLegalName=${operateLegalName}`,
        contentType: 'application/x-www-form-urlencoded',
        endpoint: '/app/hour/signRecord'
      });
      
    } catch (error) {
      this.addResult(false, 'API参数格式测试失败', { error: error instanceof Error ? error.message : error });
    }
  }

  /**
   * 运行完整的测试套件
   */
  static async runFullTestSuite(users: TestUser[] = TEST_USERS): Promise<void> {
    const sessionId = await this.startTestSession(users);
    
    try {
      console.log('🎯 开始完整测试套件执行...');
      
      // 1. API参数格式测试
      await this.testAPIParameterFormat();
      
      // 2. 验证初始后端数据状态
      await this.verifyBackendData();
      
      // 3. 单用户流程测试
      if (users.length > 0) {
        console.log('👤 开始单用户测试...');
        await this.testSingleUserFlow(users[0]);
      }
      
      // 4. 多用户并发测试（如果有多个用户）
      if (users.length > 1) {
        console.log('👥 开始多用户并发测试...');
        await this.testConcurrentOperations(users.slice(0, 2)); // 限制并发数量
      }
      
      // 5. 最终数据验证
      await this.verifyBackendData();
      
    } catch (error) {
      this.addResult(false, '测试套件执行异常', { error: error instanceof Error ? error.message : error });
    } finally {
      this.endTestSession();
    }
  }

  /**
   * 结束测试会话并生成报告
   */
  static endTestSession(): TestSession | null {
    if (!this.currentSession) return null;
    
    this.currentSession.endTime = new Date();
    const duration = this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime();
    
    const totalTests = this.currentSession.results.length;
    const successfulTests = this.currentSession.results.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    
    console.log('📊 测试会话完成:', {
      sessionId: this.currentSession.sessionId,
      duration: `${Math.round(duration / 1000)}秒`,
      totalTests,
      successful: successfulTests,
      failed: failedTests,
      successRate: `${Math.round(successfulTests / totalTests * 100)}%`
    });
    
    // 输出详细结果
    console.log('📋 详细测试结果:');
    this.currentSession.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.success ? '✅' : '❌'} ${result.message}`);
      if (result.data) {
        console.log(`   数据:`, result.data);
      }
    });
    
    const session = this.currentSession;
    this.currentSession = null;
    return session;
  }

  /**
   * 快速压力测试 - 测试系统在高并发下的表现
   */
  static async quickStressTest(): Promise<void> {
    const testUser = TEST_USERS[0]; // 使用admin用户
    const { userId } = testUser;
    const operateUserId = await getCurrentUserId();
    if (!operateUserId) {
      throw new Error('无法获取当前用户ID，请重新登录');
    }
    const operateLegalName = '压力测试';
    
    console.log('⚡ 开始快速压力测试...');
    
    try {
      const operations = [];
      
      // 快速连续签到签退操作
      for (let i = 0; i < 3; i++) {
        operations.push(async () => {
          const checkInTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
          
          // 签到
          const signIn = await volunteerSignRecord(userId, 1, operateUserId, operateLegalName, checkInTime);
          console.log(`📍 压力测试签到 ${i+1}:`, signIn.code === 200 ? '成功' : '失败');
          
          // 短暂等待
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 获取记录ID
          const record = await getLastVolunteerRecord(userId);
          if (record.code === 200 && record.data?.id) {
            const checkOutTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
            
            // 签退
            const signOut = await volunteerSignRecord(
              userId, 2, operateUserId, operateLegalName, undefined, checkOutTime, record.data.id
            );
            console.log(`📍 压力测试签退 ${i+1}:`, signOut.code === 200 ? '成功' : '失败');
          }
        });
      }
      
      // 并发执行
      await Promise.all(operations);
      
      // 验证最终状态
      const finalHours = await getVolunteerHours();
      const userFinalHours = finalHours.rows?.find((h: any) => h.userId === userId);
      
      console.log('⚡ 压力测试完成，最终工时:', {
        totalMinutes: userFinalHours?.totalMinutes || 0,
        totalHours: userFinalHours ? Math.round(userFinalHours.totalMinutes / 60 * 100) / 100 : 0
      });
      
    } catch (error) {
      console.error('❌ 压力测试失败:', error);
    }
  }

  /**
   * 获取当前测试状态
   */
  static getCurrentTestStatus(): any {
    return {
      hasActiveSession: !!this.currentSession,
      sessionId: this.currentSession?.sessionId,
      testCount: this.currentSession?.results.length || 0,
      successRate: this.currentSession ? 
        Math.round(this.currentSession.results.filter(r => r.success).length / this.currentSession.results.length * 100) : 0
    };
  }
}

/**
 * 在开发环境下暴露测试函数到全局
 */
if (__DEV__) {
  (global as any).VolunteerTestSuite = VolunteerTestSuite;
  
  // 快捷测试函数
  (global as any).testVolunteerFlow = async () => {
    console.log('🚀 启动志愿者功能测试...');
    await VolunteerTestSuite.runFullTestSuite();
  };
  
  (global as any).stressTestVolunteer = async () => {
    console.log('⚡ 启动志愿者压力测试...');
    await VolunteerTestSuite.quickStressTest();
  };
  
  console.log('🧪 志愿者测试套件已加载');
  console.log('💡 使用 testVolunteerFlow() 运行完整测试');
  console.log('💡 使用 stressTestVolunteer() 运行压力测试');
}

export default VolunteerTestSuite;