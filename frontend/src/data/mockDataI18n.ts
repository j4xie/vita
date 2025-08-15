/**
 * 国际化Mock数据生成器
 * 为所有Mock数据提供多语言支持
 */

import { TFunction } from 'react-i18next';

// 学校数据生成器
export const generateMockSchools = (t: TFunction) => [
  { 
    id: 'all', 
    name: t('explore.schools.all'), 
    shortName: t('explore.schools.all_short'), 
    color: '#FF6B35', 
    activities: 30 
  },
  { 
    id: 'berkeley', 
    name: t('mockData.schools.berkeley'), 
    shortName: 'UC Berkeley', 
    color: '#003262', 
    activities: 12 
  },
  { 
    id: 'ucla', 
    name: t('mockData.schools.ucla'), 
    shortName: 'UCLA', 
    color: '#2774AE', 
    activities: 8 
  },
];

// 活动分类生成器  
export const generateMockCategories = (t: TFunction) => [
  { id: 'academic', name: t('categories.academic'), icon: 'library-outline', count: 8 },
  { id: 'social', name: t('categories.social'), icon: 'people-outline', count: 12 },
  { id: 'career', name: t('categories.career'), icon: 'briefcase-outline', count: 6 },
  { id: 'culture', name: t('categories.culture'), icon: 'color-palette-outline', count: 9 },
  { id: 'sports', name: t('categories.sports'), icon: 'fitness-outline', count: 5 },
];

// 活动数据生成器
export const generateMockActivities = (t: TFunction) => [
  {
    id: '1',
    title: t('mockData.activities.springConcert.title'),
    subtitle: t('mockData.activities.springConcert.subtitle'),
    location: 'Student Center, Room 301',
    date: '2025-02-14',
    time: '18:00',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f',
    attendees: 45,
    maxAttendees: 100,
    status: 'upcoming',
    category: t('categories.social'),
    organizer: {
      name: t('mockData.organizers.chineseStudentAssociation'),
      verified: true
    }
  },
  {
    id: '2', 
    title: t('mockData.activities.careerLecture.title'),
    subtitle: t('mockData.activities.careerLecture.subtitle'),
    location: 'Business School, Room 205',
    date: '2025-02-16',
    time: '14:00',
    image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0',
    attendees: 120,
    maxAttendees: 150,
    status: 'upcoming',
    category: t('categories.career'),
    organizer: {
      name: t('mockData.organizers.businessCareerCenter'),
      verified: true
    }
  }
];

// 志愿者数据生成器
export const generateMockVolunteers = (t: TFunction) => [
  {
    id: '1',
    name: t('mockData.volunteers.chen'),
    studentId: 'CS2023001',
    email: 'chen.volunteer@berkeley.edu',
    phone: '+1-555-0101',
    university: 'UC Berkeley',
    status: 'active' as const,
    totalHours: 25.5,
    lastActivity: new Date('2025-01-15'),
    activities: ['volunteer1', 'volunteer2'],
    skills: ['photography', 'translation'],
    checkIns: []
  },
  {
    id: '2',
    name: t('mockData.volunteers.li'),
    studentId: 'CS2023002', 
    email: 'li.volunteer@berkeley.edu',
    phone: '+1-555-0102',
    university: 'UC Berkeley',
    status: 'active' as const,
    totalHours: 18.0,
    lastActivity: new Date('2025-01-14'),
    activities: ['volunteer3'],
    skills: ['design', 'social_media'],
    checkIns: []
  }
];

// 组织数据生成器
export const generateMockOrganizers = (t: TFunction) => [
  {
    id: 'cssa',
    name: t('mockData.organizers.chineseStudentAssociation'),
    verified: true,
    description: t('mockData.organizers.cssa.description'),
    contactEmail: 'info@cssa.berkeley.edu'
  },
  {
    id: 'career_center',
    name: t('mockData.organizers.careerCenter'),
    verified: true,
    description: t('mockData.organizers.careerCenter.description'),
    contactEmail: 'career@berkeley.edu'
  }
];