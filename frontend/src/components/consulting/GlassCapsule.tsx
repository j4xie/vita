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
        <BlurView intensity={performance.blurIntensity} tint="light" style={styles.wrap}>
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
          backgroundColor: performance.fallbackBackground,
          borderWidth: 1,
          borderColor: performance.fallbackBorder,
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
    backgroundColor: 'rgba(255, 255, 255, 0.001)', // Nearly invisible but solid for shadow calculation
  },
  
  wrap: { 
    borderRadius: Glass.radius.capsule, 
    overflow: 'hidden',
    backgroundColor: '#FFFFFF', // 白色背景确保阴影渲染
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