import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

/**
 * WaveBackgroundPattern - 波浪线条纹理背景
 *
 * 参考酒店会员系统设计
 * - 米色背景
 * - 多层波浪线条（类似地形图等高线）
 * - 半透明白色线条
 */
export const WaveBackgroundPattern: React.FC = () => {
  // 生成波浪路径
  const generateWavePath = (yOffset: number, amplitude: number = 15) => {
    const segments = 4;
    const segmentWidth = SCREEN_WIDTH / segments;
    let path = `M 0,${yOffset}`;

    for (let i = 0; i < segments; i++) {
      const x1 = i * segmentWidth;
      const x2 = (i + 0.5) * segmentWidth;
      const x3 = (i + 1) * segmentWidth;
      const y1 = yOffset + (i % 2 === 0 ? amplitude : -amplitude);
      const y2 = yOffset;

      path += ` Q ${x2},${y1} ${x3},${y2}`;
    }

    return path;
  };

  return (
    <View style={styles.container}>
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={styles.svg}>
        {/* 生成多层波浪线 */}
        {Array.from({ length: 25 }).map((_, index) => {
          const yOffset = index * 35 + 80;
          const opacity = 0.18 + (Math.sin(index * 0.3) * 0.08);
          const amplitude = 12 + (Math.sin(index * 0.5) * 8);

          return (
            <Path
              key={`wave-${index}`}
              d={generateWavePath(yOffset, amplitude)}
              stroke={`rgba(255, 255, 255, ${opacity})`}
              strokeWidth={1.3}
              fill="none"
            />
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E8DCC8', // 更柔和的米色背景
  },

  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
