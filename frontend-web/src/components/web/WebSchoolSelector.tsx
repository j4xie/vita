import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { SchoolData } from '../../utils/schoolData';

interface WebSchoolSelectorProps {
  schools: SchoolData[];
  selectedSchool: SchoolData | null;
  onSchoolSelect: (school: SchoolData | null) => void;
  placeholder: string;
  loading?: boolean;
  error?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export const WebSchoolSelector: React.FC<WebSchoolSelectorProps> = ({
  schools,
  selectedSchool,
  onSchoolSelect,
  placeholder,
  loading = false,
  error = false,
  disabled = false,
  accessibilityLabel,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const openModal = () => {
    if (disabled || loading) return;
    setIsModalVisible(true);
  };

  const selectSchool = (school: SchoolData | null) => {
    onSchoolSelect(school);
    setIsModalVisible(false);
  };

  return (
    <>
      {/* Selector Button */}
      <TouchableOpacity
        style={[
          styles.selectorButton,
          error && styles.selectorButtonError,
          disabled && styles.selectorButtonDisabled,
        ]}
        onPress={openModal}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Opens school selection modal"
      >
        <View style={styles.selectorContent}>
          <Text
            style={[
              styles.selectorText,
              !selectedSchool && styles.placeholderText,
              disabled && styles.selectorTextDisabled,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {loading ? 'Loading schools...' : selectedSchool ? `${selectedSchool.abbreviation} - ${selectedSchool.name}` : placeholder}
          </Text>
          
          <Ionicons
            name="chevron-down"
            size={20}
            color={disabled ? theme.colors.text.disabled : theme.colors.text.secondary}
          />
        </View>
      </TouchableOpacity>

      {/* Selection Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay} {...(Platform.OS === 'web' && { className: 'school-selector-modal' })}>
          <SafeAreaView style={styles.modalContainer} {...(Platform.OS === 'web' && { className: 'modal-container' })}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select University</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Schools List - 使用简单的ScrollView替代WebFlatList */}
            <ScrollView
              style={styles.schoolsList}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {schools.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.schoolOption,
                    selectedSchool?.id === item.id && styles.schoolOptionSelected,
                  ]}
                  onPress={() => selectSchool(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${item.name}`}
                >
                  <View style={styles.schoolInfo}>
                    <Text style={styles.schoolText}>
                      {item.abbreviation} - {item.name}
                    </Text>
                  </View>
                  {selectedSchool?.id === item.id && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Clear Selection Option */}
            {selectedSchool && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => selectSchool(null)}
                accessibilityRole="button"
                accessibilityLabel="Clear school selection"
              >
                <Ionicons name="close-circle" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.clearButtonText}>Clear Selection</Text>
              </TouchableOpacity>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selectorButton: {
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderRadius: LIQUID_GLASS_LAYERS.L1.borderRadius.input,
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
    minHeight: 52,
    ...theme.shadows[LIQUID_GLASS_LAYERS.L1.shadow],
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      userSelect: 'none',
    }),
  },
  selectorButtonError: {
    borderColor: theme.colors.danger,
  },
  selectorButtonDisabled: {
    opacity: 0.6,
    backgroundColor: theme.colors.background.disabled,
    ...(Platform.OS === 'web' && {
      cursor: 'not-allowed',
    }),
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginRight: theme.spacing[2],
  },
  placeholderText: {
    color: theme.colors.text.disabled,
    fontWeight: theme.typography.fontWeight.normal,
  },
  selectorTextDisabled: {
    color: theme.colors.text.disabled,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(4px)',
    }),
  },
  modalContainer: {
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderRadius: LIQUID_GLASS_LAYERS.L1.borderRadius.card,
    padding: 0,
    maxHeight: '85%', // 增加Modal高度
    minHeight: 400, // 确保最小高度
    width: '90%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    ...theme.shadows[LIQUID_GLASS_LAYERS.L1.shadow],
    ...(Platform.OS === 'web' && {
      // Web端Modal优化
      overflow: 'hidden',
      position: 'relative' as any,
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  modalCloseButton: {
    padding: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  schoolsList: {
    flex: 1,
    maxHeight: 400, // 增加最大高度
    ...(Platform.OS === 'web' && {
      // Web端确保滚动正常
      overflowY: 'auto' as any,
      WebkitOverflowScrolling: 'touch' as any,
      scrollBehavior: 'smooth' as any,
    }),
  },
  schoolOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[4],
    minHeight: 60, // Larger touch target for modal
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  schoolOptionSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  schoolInfo: {
    flex: 1,
    marginRight: theme.spacing[2],
  },
  schoolText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.normal,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background.tertiary,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  clearButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[2],
  },
});

// Web端CSS优化 - 修复Modal内滚动问题
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    /* 修复学校选择器Modal滚动问题 */
    .school-selector-modal {
      pointer-events: auto !important;
    }

    .school-selector-modal .modal-container {
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      max-height: 85vh !important;
    }

    .school-selector-modal .schools-list {
      flex: 1 !important;
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch !important;
      scroll-behavior: smooth !important;
      max-height: 400px !important;
      /* 确保能够滚动 */
      touch-action: pan-y !important;
    }

    .school-selector-modal .school-option {
      border-bottom: 1px solid #e5e5e7 !important;
      transition: background-color 0.2s ease !important;
    }

    .school-selector-modal .school-option:hover {
      background-color: rgba(0, 0, 0, 0.05) !important;
    }

    /* 确保Modal内容不被截断 */
    .school-selector-modal .modal-header {
      flex-shrink: 0 !important;
    }

    .school-selector-modal .clear-button {
      flex-shrink: 0 !important;
    }
  `;
  document.head.appendChild(style);
}