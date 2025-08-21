// 活动分类映射表
export interface ActivityCategory {
  id: number;
  key: string;
  name: {
    zh: string;
    en: string;
  };
  icon: string;
  color: string;
}

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  {
    id: 1,
    key: 'social',
    name: {
      zh: '社交活动',
      en: 'Social Events'
    },
    icon: 'people',
    color: '#FF6B35'
  },
  {
    id: 2,
    key: 'academic',
    name: {
      zh: '学术活动', 
      en: 'Academic Events'
    },
    icon: 'school',
    color: '#4ECDC4'
  },
  {
    id: 3,
    key: 'volunteer',
    name: {
      zh: '志愿活动',
      en: 'Volunteer Events'
    },
    icon: 'heart',
    color: '#2ED573'
  },
  {
    id: 4,
    key: 'sports',
    name: {
      zh: '体育活动',
      en: 'Sports Events'
    },
    icon: 'fitness',
    color: '#FF4757'
  },
  {
    id: 5,
    key: 'cultural',
    name: {
      zh: '文化活动',
      en: 'Cultural Events'
    },
    icon: 'library',
    color: '#9C88FF'
  },
  {
    id: 6,
    key: 'career',
    name: {
      zh: '职业发展',
      en: 'Career Development'
    },
    icon: 'briefcase',
    color: '#FFA726'
  }
];

// 分类映射工具函数
export const getCategoryById = (id: number): ActivityCategory | null => {
  return ACTIVITY_CATEGORIES.find(category => category.id === id) || null;
};

export const getCategoryName = (id: number, language: 'zh' | 'en' = 'zh'): string => {
  const category = getCategoryById(id);
  return category ? category.name[language] : '';
};

export const getCategoryKey = (id: number): string => {
  const category = getCategoryById(id);
  return category ? category.key : '';
};

// 获取所有分类用于筛选
export const getAllCategories = () => ACTIVITY_CATEGORIES;

// 用于后端查询的分类ID列表
export const getCategoryIds = (): number[] => {
  return ACTIVITY_CATEGORIES.map(category => category.id);
};