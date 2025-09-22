/**
 * 完整的活动排序测试脚本
 * 用于验证所有学校的活动排序是否正确
 */

import { sortActivitiesByLocation, LocationInfo } from './locationUtils';

// 模拟活动数据（基于截图中的实际活动）
const mockActivities = [
  // 未过期活动（截止到2025-09-20）
  {
    id: '1',
    title: 'UCLA 2025新生活动',
    date: '2025-09-28',
    startTime: '2025-09-28',
    endTime: '2025-09-28',
    status: 'available'
  },
  {
    id: '2',
    title: 'UCI house party',
    date: '2025-09-27',
    startTime: '2025-09-27',
    endTime: '2025-09-27',
    status: 'available'
  },
  {
    id: '3',
    title: 'UCSD开学大典',
    date: '2025-09-29 18:00',
    startTime: '2025-09-29 18:00',
    endTime: '2025-09-29 20:00',
    status: 'available'
  },
  // 已过期活动
  {
    id: '4',
    title: 'USC国际学生接机服务',
    date: '2025-08-10',
    startTime: '2025-08-10',
    endTime: '2025-08-21',
    status: 'available'
  },
  {
    id: '5',
    title: 'UCLA国际学生接机服务',
    date: '2025-09-06',
    startTime: '2025-09-06',
    endTime: '2025-09-10',
    status: 'available'
  },
  {
    id: '6',
    title: 'UCI国际学生接机服务',
    date: '2025-09-11',
    startTime: '2025-09-11',
    endTime: '2025-09-17 08:00',
    status: 'available'
  },
  {
    id: '7',
    title: 'UCSD国际学生接机服务',
    date: '2025-09-14',
    startTime: '2025-09-14',
    endTime: '2025-09-18 08:00',
    status: 'available'
  },
  {
    id: '8',
    title: 'UCB国际学生接机服务',
    date: '2025-08-18',
    startTime: '2025-08-18',
    endTime: '2025-08-21',
    status: 'available'
  },
  {
    id: '9',
    title: 'UCSB国际学生接机服务',
    date: '2025-09-18',
    startTime: '2025-09-18',
    endTime: '2025-09-21', // 唯一还没过期的接机服务
    status: 'available'
  },
  {
    id: '10',
    title: 'UCSC国际学生接机服务',
    date: '2025-09-18',
    startTime: '2025-09-18',
    endTime: '2025-09-20 07:00',
    status: 'available'
  },
  {
    id: '11',
    title: 'UCD国际学生接机服务',
    date: '2025-09-15',
    startTime: '2025-09-15',
    endTime: '2025-09-18 08:00',
    status: 'available'
  },
  {
    id: '12',
    title: 'UW国际学生接机服务',
    date: '2025-09-16',
    startTime: '2025-09-16',
    endTime: '2025-09-18 08:00',
    status: 'available'
  },
  {
    id: '13',
    title: 'UMN国际学生接机服务',
    date: '2025-09-17',
    startTime: '2025-09-17',
    endTime: '2025-09-18 08:00',
    status: 'available'
  }
];

// 测试用的学校列表
const testSchools = [
  { name: 'UCLA', city: 'Los Angeles', state: 'CA', lat: 34.0689, lng: -118.4452 },
  { name: 'USC', city: 'Los Angeles', state: 'CA', lat: 34.0224, lng: -118.2851 },
  { name: 'UCI', city: 'Irvine', state: 'CA', lat: 33.6405, lng: -117.8443 },
  { name: 'UCSD', city: 'San Diego', state: 'CA', lat: 32.8801, lng: -117.2340 },
  { name: 'UCB', city: 'Berkeley', state: 'CA', lat: 37.8716, lng: -122.2727 },
  { name: 'UCSB', city: 'Santa Barbara', state: 'CA', lat: 34.4140, lng: -119.8489 },
  { name: 'UCSC', city: 'Santa Cruz', state: 'CA', lat: 36.9914, lng: -122.0609 },
  { name: 'UCD', city: 'Davis', state: 'CA', lat: 38.5382, lng: -121.7617 },
  { name: 'UW', city: 'Seattle', state: 'WA', lat: 47.6553, lng: -122.3035 },
  { name: 'UMN', city: 'Minneapolis', state: 'MN', lat: 44.9778, lng: -93.2650 }
];

/**
 * 执行单个学校的排序测试
 */
function testSchoolSorting(school: typeof testSchools[0], userSchool: string = 'CU总部') {
  console.log('\n' + '='.repeat(60));
  console.log(`🎓 测试学校: ${school.name}`);
  console.log('='.repeat(60));

  const location: LocationInfo = {
    school: school.name,
    city: school.city,
    state: school.state,
    lat: school.lat,
    lng: school.lng,
    source: 'manual'
  };

  // 执行排序
  const sorted = sortActivitiesByLocation(mockActivities, userSchool, location);

  // 分析结果
  const activeActivities = sorted.filter((_, index) => {
    // 根据之前的日志，前3个是未过期活动
    return index < 3 || sorted[index].title.includes('UCSB国际学生接机服务');
  });

  const endedActivities = sorted.filter((_, index) => {
    return index >= 3 && !sorted[index].title.includes('UCSB国际学生接机服务');
  });

  console.log('\n📊 排序结果分析:');
  console.log('未过期活动顺序:');
  activeActivities.forEach((activity, index) => {
    const isSchoolActivity = activity.title.includes(school.name);
    const marker = isSchoolActivity ? '✅' : '  ';
    console.log(`  ${marker} ${index + 1}. ${activity.title}`);
  });

  console.log('\n已过期活动顺序:');
  endedActivities.slice(0, 5).forEach((activity, index) => {
    const isSchoolActivity = activity.title.includes(school.name);
    const marker = isSchoolActivity ? '✅' : '  ';
    console.log(`  ${marker} ${index + 1}. ${activity.title}`);
  });

  // 验证规则
  console.log('\n✅ 验证结果:');

  // 规则1: 选中学校的未过期活动应该排在最前面
  const firstActiveSchoolIndex = sorted.findIndex(a =>
    a.title.includes(school.name) && !a.title.includes('接机服务')
  );
  if (firstActiveSchoolIndex === -1) {
    console.log(`  ⚠️  ${school.name}没有未过期的活动`);
  } else if (firstActiveSchoolIndex === 0) {
    console.log(`  ✅ ${school.name}的未过期活动正确地排在第一位`);
  } else {
    console.log(`  ❌ ${school.name}的未过期活动应该排在第一位，但实际在第${firstActiveSchoolIndex + 1}位`);
  }

  // 规则2: 选中学校的已过期活动应该在已过期组中优先
  const endedStartIndex = sorted.findIndex(a => a.title.includes('国际学生接机服务'));
  if (endedStartIndex !== -1) {
    const firstEndedSchoolIndex = sorted.slice(endedStartIndex).findIndex(a =>
      a.title.includes(school.name) && a.title.includes('接机服务')
    );
    if (firstEndedSchoolIndex === -1) {
      console.log(`  ⚠️  ${school.name}没有已过期的接机服务`);
    } else if (firstEndedSchoolIndex === 0) {
      console.log(`  ✅ ${school.name}的已过期活动在已过期组中正确地优先显示`);
    } else {
      console.log(`  ⚠️  ${school.name}的已过期活动在已过期组中的第${firstEndedSchoolIndex + 1}位`);
    }
  }

  return sorted;
}

/**
 * 运行完整测试
 */
export function runFullSortingTest() {
  console.log('🚀 开始完整的活动排序测试');
  console.log('📅 当前日期: 2025-09-20（用于判断活动是否过期）');
  console.log('👤 用户学校: CU总部（无活动）');

  // 测试所有学校
  testSchools.forEach(school => {
    testSchoolSorting(school);
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ 测试完成！');
  console.log('='.repeat(60));

  // 测试特殊场景
  console.log('\n📌 特殊场景测试:');

  // 场景1: 没有选择学校
  console.log('\n场景1: 未选择任何学校（按距离排序）');
  const noSchoolLocation: LocationInfo = {
    city: 'Los Angeles',
    state: 'CA',
    lat: 34.0522,
    lng: -118.2437,
    source: 'manual'
  };
  const noSchoolSorted = sortActivitiesByLocation(mockActivities, 'CU总部', noSchoolLocation);
  console.log('前3个活动:', noSchoolSorted.slice(0, 3).map(a => a.title));

  // 场景2: 用户有真实学校
  console.log('\n场景2: 用户学校是UCLA，选择UCSD位置');
  const uclaSorted = sortActivitiesByLocation(mockActivities, 'UCLA', testSchools[3]);
  console.log('前3个活动:', uclaSorted.slice(0, 3).map(a => a.title));
}

// 导出测试函数供外部调用
export { testSchoolSorting };