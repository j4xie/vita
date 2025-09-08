import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface SimpleCategoryBarProps {
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  onScanPress?: () => void;
}

export const SimpleCategoryBar: React.FC<SimpleCategoryBarProps> = ({
  selectedIndex,
  onIndexChange,
  onScanPress,
}) => {
  const { t } = useTranslation();
  
  const segments = [
    t('filters.status.all', 'All'),
    t('filters.status.available', 'Available'), 
    t('filters.status.ended', 'Ended')
  ];


  return (
    <View style={styles.container}>
      
      <View style={styles.segmentContainer}>
        {segments.map((segment, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.segmentButton,
              selectedIndex === index && styles.segmentButtonActive,
            ]}
            onPress={() => onIndexChange(index)}
          >
            <Text
              style={[
                styles.segmentText,
                selectedIndex === index && styles.segmentTextActive,
              ]}
            >
              {segment}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {onScanPress && (
        <TouchableOpacity style={styles.scanButton} onPress={onScanPress}>
          <Ionicons name="scan-outline" size={18} color="#F9A889" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 52, // 再增大高度
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 26, // 对应增大圆角
    marginHorizontal: 0, // 完全占满屏幕宽度，与TabBar一致
    marginVertical: 10,
    paddingHorizontal: 12, // 增加内边距
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  segmentContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 22,
    padding: 4, // 增加内边距
  },
  segmentButton: {
    flex: 1,
    height: 38, // 增大按钮高度
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginHorizontal: 1,
  },
  segmentButtonActive: {
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13, // 减小字体，更精致
    fontWeight: '500',
    color: '#9CA3AF',
  },
  segmentTextActive: {
    fontSize: 13, // 减小字体，更精致
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scanButton: {
    width: 36, // 增大扫码按钮
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#F9A889',
    backgroundColor: 'rgba(249, 168, 137, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    shadowColor: '#F9A889',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
});

export default SimpleCategoryBar;