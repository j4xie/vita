import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface FloatingFilterButtonProps {
  onPress: () => void;
  bottom: number;
}

export const FloatingFilterButton: React.FC<FloatingFilterButtonProps> = ({
  onPress,
  bottom,
}) => {
  const handlePress = () => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.button, { bottom }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons name="funnel" size={22} color="#007AFF" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // 白色背景，和搜索按钮一致
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 998,
  },
});
