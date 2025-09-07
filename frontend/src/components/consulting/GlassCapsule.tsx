import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Glass } from '../../ui/glass/GlassTheme';
import { useGlassPerformance } from '../../hooks/useGlassPerformance';

interface GlassCapsuleProps {
  items: {
    value: string;
    label: string;
  }[];
}

export const GlassCapsule: React.FC<GlassCapsuleProps> = ({ items }) => {
  const performance = useGlassPerformance();
  
  const containerContent = (
    <>
      {/* 顶部1px高光分隔线 */}
      {performance.shouldUseGradients && (
        <LinearGradient 
          colors={[Glass.hairlineFrom, Glass.hairlineTo]}
          start={{ x: 0, y: 0 }} 
          end={{ x: 0, y: 1 }} 
          style={styles.hairline}
        />
      )}
      
      {/* 白系叠色渐变或降级背景 */}
      {performance.shouldUseGradients ? (
        <LinearGradient 
          colors={[Glass.overlayTop, Glass.overlayBottom]}
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }}
          style={styles.overlay}
        />
      ) : (
        <View style={[styles.overlay, { backgroundColor: performance.fallbackBackground }]} />
      )}
      
      <View style={styles.row}>
        {items.map((item, index) => (
          <View key={index} style={styles.item}>
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        ))}
      </View>
    </>
  );

  if (performance.shouldUseBlur) {
    return (
      <View style={[
        styles.shadowContainer,
        // 增强阴影让胶囊浮起来
        Glass.shadows.sm.ios,
        { elevation: Glass.shadows.sm.android.elevation }
      ]}>
        <BlurView intensity={80} tint="extraLight" style={styles.wrap}>
          {/* 多层次的液体玻璃效果 */}
          <View style={styles.glassBase} />
          <View style={styles.glassHighlight} />
          <View style={styles.glassBorder} />
          {containerContent}
        </BlurView>
      </View>
    );
  } else {
    // Android降级版本 - 纯色背景
    return (
      <View style={[
        styles.wrap, 
        { 
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.3)',
        },
        // Android也添加阴影
        { elevation: Glass.shadows.sm.android.elevation }
      ]}>
        {containerContent}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  shadowContainer: {
    borderRadius: Glass.radius.capsule,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    // 增强阴影效果
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  
  wrap: { 
    borderRadius: Glass.radius.capsule, 
    overflow: 'hidden',
    backgroundColor: 'transparent', // 透明，让模糊效果显示
  },

  // 多层次液体玻璃效果
  glassBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: Glass.radius.capsule,
  },

  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderTopLeftRadius: Glass.radius.capsule,
    borderTopRightRadius: Glass.radius.capsule,
  },

  glassBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: Glass.radius.capsule,
  },
  
  hairline: { 
    height: 1 
  },
  
  overlay: { 
    ...StyleSheet.absoluteFillObject 
  },
  
  row: { 
    flexDirection: 'row', 
    paddingVertical: 12, 
    paddingHorizontal: 14 
  },
  
  item: { 
    flex: 1, 
    alignItems: 'center' 
  },
  
  value: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: Glass.textMain 
  },
  
  label: { 
    marginTop: 2, 
    fontSize: 12, 
    color: Glass.textWeak 
  }
});

export default GlassCapsule;