import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

interface StepIndicatorProps {
  currentStep: number; // 0-3
  totalSteps: number;  // 4
  stepLabels: string[];
}

/**
 * StepIndicator - Horizontal 4-step progress indicator for the PVSA Certificate wizard.
 *
 * States:
 * - Completed: filled primary circle with checkmark icon
 * - Active: primary color outline with step number
 * - Future: gray outline with step number
 *
 * Connecting lines change color based on completion.
 */
const StepIndicatorComponent: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
}) => {
  const { isDarkMode } = useTheme();

  const getStepState = (index: number): 'completed' | 'active' | 'future' => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'active';
    return 'future';
  };

  const renderStep = (index: number) => {
    const state = getStepState(index);
    const label = stepLabels[index] ?? '';

    return (
      <View key={index} style={styles.stepWrapper}>
        {/* Circle */}
        <View
          style={[
            styles.circle,
            state === 'completed' && styles.circleCompleted,
            state === 'completed' && isDarkMode && styles.circleCompletedDark,
            state === 'active' && styles.circleActive,
            state === 'active' && isDarkMode && styles.circleActiveDark,
            state === 'future' && styles.circleFuture,
            state === 'future' && isDarkMode && styles.circleFutureDark,
          ]}
        >
          {state === 'completed' ? (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.stepNumber,
                state === 'active' && styles.stepNumberActive,
                state === 'active' && isDarkMode && styles.stepNumberActiveDark,
                state === 'future' && styles.stepNumberFuture,
                state === 'future' && isDarkMode && styles.stepNumberFutureDark,
              ]}
            >
              {index + 1}
            </Text>
          )}
        </View>

        {/* Label */}
        <Text
          style={[
            styles.label,
            state === 'completed' && styles.labelCompleted,
            state === 'active' && styles.labelActive,
            state === 'active' && isDarkMode && styles.labelActiveDark,
            state === 'future' && styles.labelFuture,
            state === 'future' && isDarkMode && styles.labelFutureDark,
            isDarkMode && styles.labelDark,
          ]}
          numberOfLines={1}
          allowFontScaling
          maxFontSizeMultiplier={1.3}
        >
          {label}
        </Text>
      </View>
    );
  };

  const renderLine = (index: number) => {
    const isCompleted = index < currentStep;

    return (
      <View
        key={`line-${index}`}
        style={[
          styles.line,
          isCompleted && styles.lineCompleted,
          isCompleted && isDarkMode && styles.lineCompletedDark,
          !isCompleted && styles.lineIncomplete,
          !isCompleted && isDarkMode && styles.lineIncompleteDark,
        ]}
      />
    );
  };

  const elements: React.ReactNode[] = [];
  for (let i = 0; i < totalSteps; i++) {
    elements.push(renderStep(i));
    if (i < totalSteps - 1) {
      elements.push(renderLine(i));
    }
  }

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {elements}
    </View>
  );
};

export const StepIndicator = React.memo(StepIndicatorComponent);
export default StepIndicator;

const CIRCLE_SIZE = 32;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  containerDark: {
    // Dark mode container adjustments if needed
  },

  // Step wrapper (circle + label stacked)
  stepWrapper: {
    alignItems: 'center',
    width: CIRCLE_SIZE + 24,
  },

  // Circle base
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },

  // Completed circle: filled primary
  circleCompleted: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  circleCompletedDark: {
    backgroundColor: '#FF8A65',
    borderColor: '#FF8A65',
  },

  // Active circle: primary outline, transparent fill
  circleActive: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.primary,
  },
  circleActiveDark: {
    borderColor: '#FF8A65',
  },

  // Future circle: gray outline
  circleFuture: {
    backgroundColor: 'transparent',
    borderColor: '#D1D5DB',
  },
  circleFutureDark: {
    borderColor: '#48484A',
  },

  // Step number text
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepNumberActive: {
    color: theme.colors.primary,
  },
  stepNumberActiveDark: {
    color: '#FF8A65',
  },
  stepNumberFuture: {
    color: '#9CA3AF',
  },
  stepNumberFutureDark: {
    color: '#636366',
  },

  // Label below circle
  label: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    color: theme.colors.text.secondary,
  },
  labelDark: {
    color: '#EBEBF599',
  },
  labelCompleted: {
    color: theme.colors.primary,
  },
  labelActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  labelActiveDark: {
    color: '#FF8A65',
  },
  labelFuture: {
    color: '#9CA3AF',
  },
  labelFutureDark: {
    color: '#636366',
  },

  // Connecting line
  line: {
    flex: 1,
    height: 2,
    marginTop: CIRCLE_SIZE / 2 - 1, // vertically center with circle
    borderRadius: 1,
  },
  lineCompleted: {
    backgroundColor: theme.colors.primary,
  },
  lineCompletedDark: {
    backgroundColor: '#FF8A65',
  },
  lineIncomplete: {
    backgroundColor: '#E5E7EB',
  },
  lineIncompleteDark: {
    backgroundColor: '#38383A',
  },
});
