/**
 * FormModeSelector Component
 * 表单填写模式选择器 - AI 智能填表 vs 传统表单
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ==================== 类型定义 ====================

interface FormModeSelectorProps {
  onSelectAI: () => void;
  onSelectTraditional: () => void;
  recommendAI?: boolean;
  autoFilledCount?: number;
  remainingCount?: number;
}

// ==================== 组件实现 ====================

export const FormModeSelector: React.FC<FormModeSelectorProps> = ({
  onSelectAI,
  onSelectTraditional,
  recommendAI = true,
  autoFilledCount = 0,
  remainingCount = 0,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* 标题 */}
      <Text style={styles.title}>{t('ai_form.select_mode')}</Text>

      {/* 自动填充提示 */}
      {autoFilledCount > 0 && (
        <View style={styles.autoFillBadge}>
          <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
          <Text style={styles.autoFillText}>
            {t('ai_form.auto_filled_count', { count: autoFilledCount })}
          </Text>
        </View>
      )}

      {/* 选项卡容器 */}
      <View style={styles.optionsContainer}>
        {/* AI 智能填表选项 */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            recommendAI && styles.optionCardRecommended,
          ]}
          onPress={onSelectAI}
          activeOpacity={0.8}
        >
          {recommendAI && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>{t('ai_form.recommended')}</Text>
            </View>
          )}

          <View style={styles.iconContainer}>
            <Ionicons
              name="sparkles"
              size={32}
              color={recommendAI ? theme.colors.primary : theme.colors.text.secondary}
            />
          </View>

          <Text style={[
            styles.optionTitle,
            recommendAI && styles.optionTitleRecommended,
          ]}>
            {t('ai_form.ai_mode')}
          </Text>

          <Text style={styles.optionDesc}>
            {t('ai_form.ai_mode_desc')}
          </Text>

          {remainingCount > 0 && (
            <Text style={styles.fieldCount}>
              {t('ai_form.remaining', { count: remainingCount })}
            </Text>
          )}
        </TouchableOpacity>

        {/* 传统表单选项 */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            !recommendAI && styles.optionCardRecommended,
          ]}
          onPress={onSelectTraditional}
          activeOpacity={0.8}
        >
          {!recommendAI && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>{t('ai_form.recommended')}</Text>
            </View>
          )}

          <View style={styles.iconContainer}>
            <Ionicons
              name="document-text-outline"
              size={32}
              color={!recommendAI ? theme.colors.primary : theme.colors.text.secondary}
            />
          </View>

          <Text style={[
            styles.optionTitle,
            !recommendAI && styles.optionTitleRecommended,
          ]}>
            {t('ai_form.traditional_mode')}
          </Text>

          <Text style={styles.optionDesc}>
            {t('ai_form.traditional_mode_desc')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ==================== 样式 ====================

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: theme.colors.background.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  autoFillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.success + '15',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 20,
    alignSelf: 'center',
  },
  autoFillText: {
    fontSize: 14,
    color: theme.colors.success,
    marginLeft: 6,
    fontWeight: '500',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    minHeight: 180,
  },
  optionCardRecommended: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '08',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  recommendedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  optionTitleRecommended: {
    color: theme.colors.primary,
  },
  optionDesc: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  fieldCount: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginTop: 8,
  },
});

export default FormModeSelector;
