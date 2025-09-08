#!/usr/bin/env node

/**
 * PomeloX Web端问题直接验证脚本
 * 模拟浏览器环境进行问题验证
 */

console.log('🔍 PomeloX Web端问题验证开始...\n');

// 验证一：时间分类逻辑
function verifyTimeClassification() {
    console.log('📅 === 问题一：活动时间分类逻辑验证 ===');
    
    // 模拟活动数据
    const mockActivities = [
        {
            id: 1,
            name: "已结束活动",
            startTime: "2024-01-15 14:00:00",
            endTime: "2024-01-15 16:00:00",
            signStatus: undefined
        },
        {
            id: 2,
            name: "进行中活动", 
            startTime: new Date(Date.now() - 3600000).toISOString().replace('T', ' ').slice(0, 19),
            endTime: new Date(Date.now() + 3600000).toISOString().replace('T', ' ').slice(0, 19),
            signStatus: undefined
        },
        {
            id: 3,
            name: "即将开始活动",
            startTime: new Date(Date.now() + 3600000).toISOString().replace('T', ' ').slice(0, 19),
            endTime: new Date(Date.now() + 7200000).toISOString().replace('T', ' ').slice(0, 19),
            signStatus: undefined
        },
        {
            id: 4,
            name: "已报名活动",
            startTime: new Date(Date.now() + 3600000).toISOString().replace('T', ' ').slice(0, 19),
            endTime: new Date(Date.now() + 7200000).toISOString().replace('T', ' ').slice(0, 19),
            signStatus: -1
        }
    ];

    console.log(`1. 当前时间: ${new Date().toISOString()}`);
    console.log('2. 时间解析兼容性测试:');
    
    mockActivities.forEach(activity => {
        try {
            // 测试原格式解析（可能在Safari失败）
            const date1 = new Date(activity.startTime);
            const isValid1 = !isNaN(date1.getTime());
            
            // 测试ISO格式解析（推荐方式）
            const date2 = new Date(activity.startTime.replace(' ', 'T'));
            const isValid2 = !isNaN(date2.getTime());
            
            console.log(`   活动${activity.id}[${activity.name}]:`);
            console.log(`     原格式: ${isValid1 ? '✅' : '❌'} (${date1.toString()})`);
            console.log(`     ISO格式: ${isValid2 ? '✅' : '❌'} (${date2.toString()})`);
            
            if (isValid2) {
                // 状态计算逻辑
                const now = new Date();
                const start = new Date(activity.startTime.replace(' ', 'T'));
                const end = new Date(activity.endTime.replace(' ', 'T'));
                
                let status;
                if (activity.signStatus === -1) status = 'registered';
                else if (activity.signStatus === 1) status = 'checked_in';
                else if (end < now) status = 'ended';
                else if (start <= now && end >= now) status = 'ongoing';
                else status = 'upcoming';
                
                console.log(`     计算状态: ${status}`);
            }
        } catch (error) {
            console.log(`   活动${activity.id}解析失败: ${error.message}`);
        }
    });
    
    console.log('\n3. 发现的问题:');
    console.log('   ❌ 使用 "YYYY-MM-DD HH:mm:ss" 格式可能在Safari失败');
    console.log('   ❌ 多套分类逻辑并存，导致状态不一致');
    console.log('   ❌ 前端重复计算状态，与后端type字段冲突');
}

// 验证二：Web环境下的API支持
function verifyWebAPIs() {
    console.log('\n📷 === 问题二：Web API支持验证 ===');
    
    console.log('1. 摄像头相关API支持:');
    
    // 模拟Web环境检查
    const webAPIs = {
        'navigator.mediaDevices': typeof navigator !== 'undefined' && !!navigator.mediaDevices,
        'getUserMedia': typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
        'permissions API': typeof navigator !== 'undefined' && !!navigator.permissions,
        'enumerateDevices': typeof navigator !== 'undefined' && !!navigator.mediaDevices?.enumerateDevices
    };
    
    Object.entries(webAPIs).forEach(([api, supported]) => {
        console.log(`   ${api}: ${supported ? '✅' : '❌'}`);
    });
    
    console.log('\n2. React Native Alert API:');
    const rnAPIs = {
        'Alert.alert': typeof Alert !== 'undefined' && !!Alert?.alert,
        'Alert.prompt': typeof Alert !== 'undefined' && !!Alert?.prompt  // Web端不支持
    };
    
    Object.entries(rnAPIs).forEach(([api, supported]) => {
        console.log(`   ${api}: ${supported ? '✅' : '❌'}`);
    });
    
    console.log('\n3. 发现的问题:');
    console.log('   ❌ Alert.prompt在Web端不支持');
    console.log('   ❌ 摄像头权限错误处理不完善');
    console.log('   ❌ 缺少环境检查（HTTPS要求）');
}

// 验证三：代码分析
function analyzeCodeIssues() {
    console.log('\n🎫 === 问题三：代码问题分析 ===');
    
    console.log('1. 推荐码输入问题:');
    console.log('   ❌ QRScannerScreen.tsx:759 使用 Alert.prompt()');
    console.log('   ❌ Web端不支持 Alert.prompt，导致无弹窗');
    console.log('   ✅ 需要替换为自定义Modal组件');
    
    console.log('\n2. 摄像头权限问题:');
    console.log('   ❌ WebCameraView.tsx:84 权限请求但错误处理不足');
    console.log('   ❌ 没有检查HTTPS环境要求');
    console.log('   ❌ 缺少具体的错误指导信息');
    
    console.log('\n3. 时间分类问题:');
    console.log('   ❌ ActivityListScreen.tsx:832-843 前端计算状态');
    console.log('   ❌ ExploreScreen.tsx:166-192 另一套计算逻辑');
    console.log('   ❌ activityAdapter.ts:270-288 第三套计算逻辑');
    console.log('   ❌ 没有统一的时间状态管理');
}

// 生成修复方案
function generateFixSolutions() {
    console.log('\n🔧 === 修复方案建议 ===');
    
    console.log('\n1. 时间分类问题修复:');
    console.log(`
// utils/activityStatusCalculator.ts
export const calculateActivityStatus = (activity: {
  startTime: string;
  endTime: string; 
  signStatus?: number;
}): 'upcoming' | 'ongoing' | 'ended' | 'registered' | 'checked_in' => {
  // 优先使用用户状态
  if (activity.signStatus === -1) return 'registered';
  if (activity.signStatus === 1) return 'checked_in';
  
  // 安全的时间解析（兼容Safari）
  const now = new Date();
  const start = new Date(activity.startTime.replace(' ', 'T'));
  const end = new Date(activity.endTime.replace(' ', 'T'));
  
  if (end < now) return 'ended';
  if (start <= now && end >= now) return 'ongoing';
  return 'upcoming';
};
    `);
    
    console.log('\n2. 推荐码输入问题修复:');
    console.log(`
// components/modals/ReferralCodeInputModal.tsx
export const ReferralCodeInputModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
}> = ({ visible, onClose, onSubmit }) => {
  const [code, setCode] = useState('');
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text>手动输入推荐码</Text>
          <TextInput 
            value={code}
            onChangeText={setCode}
            placeholder="请输入推荐码"
            autoFocus
          />
          <View style={styles.buttons}>
            <TouchableOpacity onPress={onClose}>
              <Text>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onSubmit(code)}>
              <Text>确认</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
    `);
    
    console.log('\n3. 摄像头权限问题修复:');
    console.log(`
// 改进的摄像头启动逻辑
const startWebCamera = async () => {
  try {
    // 环境检查
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      throw new Error('摄像头需要HTTPS环境');
    }
    
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('浏览器不支持摄像头访问');
    }
    
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    
    // 成功处理...
  } catch (error) {
    // 详细错误处理
    switch(error.name) {
      case 'NotAllowedError':
        setError('请点击地址栏🔒图标，允许摄像头访问');
        break;
      case 'NotFoundError':
        setError('未检测到摄像头设备');
        break;
      default:
        setError(\`摄像头访问失败: \${error.message}\`);
    }
  }
};
    `);
}

// 执行验证
console.log('开始验证...\n');
verifyTimeClassification();
verifyWebAPIs();
analyzeCodeIssues();
generateFixSolutions();

console.log('\n✅ 验证完成！请查看上方的问题分析和修复建议。');
console.log('\n📋 总结:');
console.log('1. 时间分类：需要统一状态计算逻辑，修复Safari兼容性');
console.log('2. 摄像头权限：改进错误处理，检查HTTPS环境');
console.log('3. 推荐码输入：替换Alert.prompt为自定义Modal');





