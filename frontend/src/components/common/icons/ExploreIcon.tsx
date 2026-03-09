import React from 'react';
import Svg, { Rect, Circle } from 'react-native-svg';

interface ExploreIconProps {
  size?: number;
  color?: string;
  filled?: boolean;
}

export const ExploreIcon: React.FC<ExploreIconProps> = ({
  size = 24,
  color = '#555555',
  filled = false,
}) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
    >
      {/* Rounded diamond (rotated square) */}
      <Rect
        x="4.5"
        y="4.5"
        width="15"
        height="15"
        rx="4"
        ry="4"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={filled ? 0 : 2}
        rotation={45}
        origin="12, 12"
      />
      {/* Center dot */}
      <Circle
        cx="12"
        cy="12"
        r="2"
        fill={filled ? '#FFFFFF' : color}
      />
    </Svg>
  );
};
