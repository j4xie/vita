// 校徽图片映射 - Glass组件专用
export const schoolLogos = {
  'uw': require('../../../assets/images/schools/uw-logo.png'),
  'usc': require('../../../assets/images/schools/usc-logo.png'),
  'ucd': require('../../../assets/images/schools/ucd-logo.png'),
  'ucsc': require('../../../assets/images/schools/ucsc-logo.png'),
  'ucla': require('../../../assets/images/schools/ucla-logo.png'),
  'uci': require('../../../assets/images/schools/uci-logo.png'),
  'ucsb': require('../../../assets/images/schools/ucsb-logo.png'),
  'umn': require('../../../assets/images/schools/umn-logo.png'),
  'ucsd': require('../../../assets/images/schools/ucsd-logo.png'),
  'ucb': require('../../../assets/images/schools/ucb-logo.png'),
} as const;

export const getSchoolLogo = (schoolId: string) => {
  return schoolLogos[schoolId as keyof typeof schoolLogos] || null;
};

export default schoolLogos;