/**
 * FormPreviewCard Component
 * 表单预览卡片 - 显示已填写的表单数据
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { FormField } from '../../hooks/useAIFormFilling';

// ==================== 类型定义 ====================

interface FormPreviewCardProps {
  formSchema: FormField[];
  formData: Record<string, unknown>;
  autoFilledData: Record<string, unknown>;
  onEdit?: (fieldName: string) => void;
  showEditButtons?: boolean;
}

// ==================== 组件实现 ====================

export const FormPreviewCard: React.FC<FormPreviewCardProps> = ({
  formSchema,
  formData,
  autoFilledData,
  onEdit,
  showEditButtons = false,
}) => {
  const { t } = useTranslation();

  // 合并数据
  const allData = { ...autoFilledData, ...formData };

  /**
   * 格式化显示值
   */
  const formatValue = (field: FormField, value: unknown): string => {
    if (value === undefined || value === null || value === '') {
      return '-';
    }

    // 如果是选项类型，查找对应的 label
    if (field.options && field.options.length > 0) {
      const option = field.options.find(opt => opt.value === value);
      if (option) {
        return option.label;
      }
    }

    return String(value);
  };

  /**
   * 判断是否是自动填充的字段
   */
  const isAutoFilled = (fieldName: string): boolean => {
    return fieldName in autoFilledData;
  };

  /**
   * 判断是否是 AI 填写的字段
   */
  const isAIFilled = (fieldName: string): boolean => {
    return fieldName in formData && !(fieldName in autoFilledData);
  };

  return (
    <View style={styles.container}>
      {/* 标题 */}
      <View style={styles.header}>
        <Ionicons name="document-text" size={20} color={theme.colors.primary} />
        <Text style={styles.title}>{t('ai_form.preview_title')}</Text>
      </View>

      {/* 字段列表 */}
      <ScrollView style={styles.fieldList} showsVerticalScrollIndicator={false}>
        {formSchema.map((field) => {
          const value = allData[field.vModel];
          const displayValue = formatValue(field, value);
          const autoFilled = isAutoFilled(field.vModel);
          const aiFilled = isAIFilled(field.vModel);
          const hasValue = value !== undefined && value !== null && value !== '';

          return (
            <View key={field.vModel} style={styles.fieldItem}>
              <View style={styles.fieldHeader}>
                <Text style={styles.fieldLabel}>
                  {field.label}
                  {field.required && <Text style={styles.required}> *</Text>}
                </Text>

                <View style={styles.badges}>
                  {autoFilled && (
                    <View style={[styles.badge, styles.autoFilledBadge]}>
                      <Ionicons name="checkmark-circle" size={12} color={theme.colors.success} />
                      <Text style={styles.autoFilledBadgeText}>
                        {t('ai_form.auto_filled')}
                      </Text>
                    </View>
                  )}
                  {aiFilled && (
                    <View style={[styles.badge, styles.aiFilledBadge]}>
                      <Ionicons name="sparkles" size={12} color={theme.colors.primary} />
                      <Text style={styles.aiFilledBadgeText}>
                        {t('ai_form.ai_filled')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.fieldValueRow}>
                <Text
                  style={[
                    styles.fieldValue,
                    !hasValue && styles.fieldValueEmpty,
                  ]}
                  numberOfLines={3}
                >
                  {displayValue}
                </Text>

                {showEditButtons && onEdit && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => onEdit(field.vModel)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="pencil" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ==================== 样式 ====================

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.secondary,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  fieldList: {
    maxHeight: 400,
  },
  fieldItem: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    flex: 1,
  },
  required: {
    color: theme.colors.danger,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  autoFilledBadge: {
    backgroundColor: theme.colors.success + '15',
  },
  autoFilledBadgeText: {
    fontSize: 10,
    color: theme.colors.success,
    marginLeft: 4,
    fontWeight: '500',
  },
  aiFilledBadge: {
    backgroundColor: theme.colors.primary + '15',
  },
  aiFilledBadgeText: {
    fontSize: 10,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  fieldValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  fieldValue: {
    fontSize: 15,
    color: theme.colors.text.primary,
    flex: 1,
    lineHeight: 22,
  },
  fieldValueEmpty: {
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});

export default FormPreviewCard;
