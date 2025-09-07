import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';

interface SchoolLogoProps {
  schoolId: string;
  size?: number;
  showFallback?: boolean;
}

// 暂时禁用logo加载，避免编译错误 - 使用文字显示
const logoMap: Record<string, any> = {};

const getSchoolName = (schoolId: string): string => {
  const nameMap: Record<string, string> = {
    '210': 'UCD', '211': 'UCB', '212': 'UCSC', '213': 'USC',
    '214': 'UCLA', '215': 'UCI', '216': 'UCSD', '217': 'UMN',
    '218': 'UW', '220': 'UCSB',
    'ucd': 'UCD', 'ucb': 'UCB', 'ucsc': 'UCSC', 'usc': 'USC',
    'ucla': 'UCLA', 'uci': 'UCI', 'ucsd': 'UCSD', 'umn': 'UMN',
    'uw': 'UW', 'ucsb': 'UCSB',
  };
  return nameMap[schoolId?.toLowerCase()] || schoolId?.toUpperCase() || 'SCHOOL';
};

export const SchoolLogo: React.FC<SchoolLogoProps> = ({ 
  schoolId, 
  size = 40, 
  showFallback = true 
}) => {
  const logoSource = logoMap[schoolId?.toLowerCase() as keyof typeof logoMap];
  const schoolName = getSchoolName(schoolId);

  if (logoSource) {
    return (
      <Image 
        source={logoSource}
        style={[styles.logo, { width: size, height: size }]}
        resizeMode="contain"
        onError={() => {
          console.warn(`学校logo加载失败: ${schoolId}`);
        }}
      />
    );
  }

  // Fallback: 显示学校缩写
  if (showFallback) {
    return (
      <View style={[styles.fallback, { width: size, height: size }]}>
        <Text style={[styles.fallbackText, { fontSize: size * 0.3 }]}>
          {schoolName}
        </Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  logo: {
    borderRadius: 8,
  },
  fallback: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontWeight: 'bold',
    color: '#6B7280',
  },
});