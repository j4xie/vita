export interface Activity {
  id: string;
  title: string;
  subtitle?: string;
  location: string;
  date: string;
  time: string;
  image: string;
  attendees: number;
  maxAttendees: number;
  status: 'upcoming' | 'ongoing' | 'ended';
  category: string;
  description: string;
  organizer: {
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  price?: number;
  isFree?: boolean;
}

export const mockActivities: Activity[] = [
  {
    id: '1',
    title: 'CU 2025 春季迎新派对',
    location: 'Student Center, Room 301',
    date: '2025-02-15',
    time: '18:00',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=600&fit=crop',
    attendees: 45,
    maxAttendees: 100,
    status: 'upcoming',
    category: '社交活动',
    description: '欢迎新同学，结识新朋友，享受美食和游戏！',
    organizer: {
      name: 'CU中国学生学者联合会',
      verified: true
    },
    price: 0,
    isFree: true,
  },
  {
    id: '2',
    title: '中国新年庆祝晚会',
    location: 'Main Auditorium',
    date: '2025-02-10',
    time: '19:00',
    image: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800&h=600&fit=crop',
    attendees: 120,
    maxAttendees: 150,
    status: 'upcoming',
    category: '文化活动',
    description: '舞龙舞狮、传统表演、美食品尝，共度新春佳节！',
    organizer: {
      name: 'CU中国学生学者联合会',
      verified: true
    },
    price: 5,
    isFree: false,
  },
  {
    id: '3',
    title: '职业发展工作坊：简历优化',
    location: 'Career Center',
    date: '2025-02-08',
    time: '14:00',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
    attendees: 30,
    maxAttendees: 50,
    status: 'ongoing',
    category: '职业发展',
    description: '资深HR教你如何打造完美简历，提高面试机会！',
    organizer: {
      name: '职业发展中心',
      verified: true
    },
    price: 0,
    isFree: true,
  },
  {
    id: '4',
    title: '留学生税务讲座',
    location: 'Online (Zoom)',
    date: '2025-03-01',
    time: '10:00',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop',
    attendees: 75,
    maxAttendees: 200,
    status: 'upcoming',
    category: '学术讲座',
    description: '专业税务师讲解F1/OPT学生报税注意事项',
    organizer: {
      name: '国际学生服务中心',
      verified: true
    },
    price: 0,
    isFree: true,
  },
  {
    id: '5',
    title: '篮球友谊赛：CU vs NYU',
    location: 'Sports Complex',
    date: '2025-02-20',
    time: '15:00',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop',
    attendees: 85,
    maxAttendees: 100,
    status: 'upcoming',
    category: '体育活动',
    description: '为母校加油！精彩的篮球对决，不容错过！',
    organizer: {
      name: '体育协会',
      verified: false
    },
    price: 0,
    isFree: true,
  },
  {
    id: '6',
    title: '亚洲美食节',
    location: 'University Plaza',
    date: '2025-02-25',
    time: '11:00',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
    attendees: 200,
    maxAttendees: 300,
    status: 'upcoming',
    category: '文化活动',
    description: '品尝来自亚洲各国的地道美食，体验多元文化！',
    organizer: {
      name: '国际学生联合会',
      verified: true
    },
    price: 10,
    isFree: false,
  },
  {
    id: '7',
    title: '求职面试技巧分享会',
    location: 'Business School, Room 205',
    date: '2025-02-18',
    time: '16:00',
    image: 'https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=800&h=600&fit=crop',
    attendees: 42,
    maxAttendees: 60,
    status: 'upcoming',
    category: '职业发展',
    description: '科技公司面试官分享面试技巧和经验',
    organizer: {
      name: '商学院职业服务',
      verified: true
    },
    price: 0,
    isFree: true,
  },
  {
    id: '8',
    title: '期末复习小组：微积分',
    location: 'Library Study Room 3A',
    date: '2025-02-12',
    time: '19:00',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop',
    attendees: 15,
    maxAttendees: 20,
    status: 'ongoing',
    category: '学习互助',
    description: '一起复习，互相答疑，冲刺期末考试！',
    organizer: {
      name: '数学系学生会',
      verified: false
    },
    price: 0,
    isFree: true,
  },
  {
    id: '9',
    title: '春游踏青：中央公园野餐',
    location: 'Central Park',
    date: '2025-03-15',
    time: '12:00',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    attendees: 60,
    maxAttendees: 80,
    status: 'upcoming',
    category: '户外活动',
    description: '春暖花开，一起去公园野餐踏青吧！',
    organizer: {
      name: '户外运动俱乐部',
      verified: false
    },
    price: 5,
    isFree: false,
  },
  {
    id: '10',
    title: '摄影爱好者聚会',
    location: 'Art Building Gallery',
    date: '2025-02-22',
    time: '14:00',
    image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=600&fit=crop',
    attendees: 25,
    maxAttendees: 40,
    status: 'upcoming',
    category: '兴趣社交',
    description: '分享摄影作品，交流拍摄技巧，结识同好！',
    organizer: {
      name: '摄影协会',
      verified: false
    },
    price: 0,
    isFree: true,
  },
  {
    id: '11',
    title: 'Python编程入门工作坊',
    location: 'Computer Lab 101',
    date: '2025-02-17',
    time: '10:00',
    image: 'https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=800&h=600&fit=crop',
    attendees: 35,
    maxAttendees: 45,
    status: 'upcoming',
    category: '技能培训',
    description: '零基础学Python，开启编程之旅！',
    organizer: {
      name: '计算机科学系',
      verified: true
    },
    price: 0,
    isFree: true,
  },
  {
    id: '12',
    title: '电影之夜：流浪地球2',
    location: 'Student Theater',
    date: '2025-02-14',
    time: '20:00',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=600&fit=crop',
    attendees: 90,
    maxAttendees: 120,
    status: 'upcoming',
    category: '娱乐活动',
    description: '情人节特别放映，免费爆米花和饮料！',
    organizer: {
      name: '电影社',
      verified: false
    },
    price: 3,
    isFree: false,
  },
  {
    id: '13',
    title: '创业分享会：从0到1',
    location: 'Innovation Hub',
    date: '2025-02-26',
    time: '18:30',
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=600&fit=crop',
    attendees: 55,
    maxAttendees: 70,
    status: 'upcoming',
    category: '创业交流',
    description: '成功创业者分享创业经历和心得',
    organizer: {
      name: '创业孵化中心',
      verified: true
    },
    price: 0,
    isFree: true,
  },
  {
    id: '14',
    title: '瑜伽放松课程',
    location: 'Gym Studio B',
    date: '2025-02-08',
    time: '07:00',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop',
    attendees: 18,
    maxAttendees: 25,
    status: 'ongoing',
    category: '健康生活',
    description: '清晨瑜伽，放松身心，开启美好一天！',
    organizer: {
      name: '健康生活社',
      verified: false
    },
    price: 0,
    isFree: true,
  },
  {
    id: '15',
    title: '二手书交易市集',
    location: 'Student Union Building',
    date: '2025-02-05',
    time: '10:00',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop',
    attendees: 150,
    maxAttendees: 200,
    status: 'ended',
    category: '交易市集',
    description: '买卖二手教材，环保又省钱！',
    organizer: {
      name: '学生会',
      verified: true
    },
    price: 0,
    isFree: true,
  },
];

// 用户mock数据
export const mockUser = {
  id: 'user_001',
  email: 'student@columbia.edu',
  legalName: '张三',
  englishNickname: 'John Zhang',
  university: 'Columbia University',
  phoneType: 'US' as const,
  phoneNumber: '2125551234',
  avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop',
  registeredActivities: ['1', '3', '5'],
  favoriteActivities: ['2', '4', '6'],
};

// 组织者mock数据
export const mockOrganizers = [
  {
    id: 'org_001',
    name: 'CU中国学生学者联合会',
    verified: true,
    logo: 'https://via.placeholder.com/100x100/FFA500/FFFFFF?text=CSSA',
    description: '哥伦比亚大学官方中国学生组织',
    followers: 1250,
  },
  {
    id: 'org_002',
    name: '职业发展中心',
    verified: true,
    logo: 'https://via.placeholder.com/100x100/4ECDC4/FFFFFF?text=CDC',
    description: '为学生提供职业规划和就业指导',
    followers: 890,
  },
  {
    id: 'org_003',
    name: '国际学生服务中心',
    verified: true,
    logo: 'https://via.placeholder.com/100x100/95E77E/FFFFFF?text=ISS',
    description: '服务国际学生，提供各类支持',
    followers: 2100,
  },
];

// 推荐码mock数据
export const mockReferralCodes = [
  'VG_REF_SPRING2025',
  'VG_REF_WELCOME',
  'VG_REF_CSSA2025',
  'VG_REF_STUDENT',
];

// 活动分类
export const activityCategories = [
  { id: 'all', label: '全部', icon: 'apps' },
  { id: 'social', label: '社交活动', icon: 'people' },
  { id: 'career', label: '职业发展', icon: 'briefcase' },
  { id: 'culture', label: '文化活动', icon: 'globe' },
  { id: 'sports', label: '体育活动', icon: 'basketball' },
  { id: 'academic', label: '学术讲座', icon: 'school' },
  { id: 'outdoor', label: '户外活动', icon: 'leaf' },
  { id: 'entertainment', label: '娱乐活动', icon: 'game-controller' },
];

// 学校数据
export interface School {
  id: string;
  name: string;
  englishName: string;
  location: string;
  logo: string;
  color: string;
  studentCount: number;
}

export const mockSchools: School[] = [
  {
    id: 'ucb',
    name: '加州大学伯克利分校',
    englishName: 'UC Berkeley',
    location: 'Berkeley, CA',
    logo: 'https://images.unsplash.com/photo-1576200320295-2e724bf9b9bb?w=200&h=200&fit=crop',
    color: '#003262',
    studentCount: 456,
  },
  {
    id: 'uw',
    name: '华盛顿大学',
    englishName: 'University of Washington',
    location: 'Seattle, WA',
    logo: 'https://images.unsplash.com/photo-1595889570768-fb3ee8e8eb5f?w=200&h=200&fit=crop',
    color: '#4B2E83',
    studentCount: 523,
  },
  {
    id: 'ucla',
    name: '加州大学洛杉矶分校',
    englishName: 'UCLA',
    location: 'Los Angeles, CA',
    logo: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=200&h=200&fit=crop',
    color: '#2774AE',
    studentCount: 678,
  },
  {
    id: 'ucsb',
    name: '加州大学圣巴巴拉分校',
    englishName: 'UC Santa Barbara',
    location: 'Santa Barbara, CA',
    logo: 'https://images.unsplash.com/photo-1523996565297-64b24ed96ed0?w=200&h=200&fit=crop',
    color: '#003660',
    studentCount: 342,
  },
  {
    id: 'ucsd',
    name: '加州大学圣迭戈分校',
    englishName: 'UC San Diego',
    location: 'San Diego, CA',
    logo: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=200&h=200&fit=crop',
    color: '#182B49',
    studentCount: 489,
  },
  {
    id: 'uci',
    name: '加州大学尔湾分校',
    englishName: 'UC Irvine',
    location: 'Irvine, CA',
    logo: 'https://images.unsplash.com/photo-1607013251379-e6eadbd67ff4?w=200&h=200&fit=crop',
    color: '#0064A4',
    studentCount: 412,
  },
  {
    id: 'umn',
    name: '明尼苏达大学',
    englishName: 'University of Minnesota',
    location: 'Minneapolis, MN',
    logo: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=200&h=200&fit=crop',
    color: '#7A0019',
    studentCount: 287,
  },
  {
    id: 'usc',
    name: '南加州大学',
    englishName: 'USC',
    location: 'Los Angeles, CA',
    logo: 'https://images.unsplash.com/photo-1502780402662-acc01917238e?w=200&h=200&fit=crop',
    color: '#990000',
    studentCount: 567,
  },
  {
    id: 'ucsc',
    name: '加州大学圣克鲁兹分校',
    englishName: 'UC Santa Cruz',
    location: 'Santa Cruz, CA',
    logo: 'https://images.unsplash.com/photo-1576200320295-2e724bf9b9bb?w=200&h=200&fit=crop',
    color: '#003C6C',
    studentCount: 234,
  },
  {
    id: 'ucd',
    name: '加州大学戴维斯分校',
    englishName: 'UC Davis',
    location: 'Davis, CA',
    logo: 'https://images.unsplash.com/photo-1595889570768-fb3ee8e8eb5f?w=200&h=200&fit=crop',
    color: '#002855',
    studentCount: 398,
  },
];