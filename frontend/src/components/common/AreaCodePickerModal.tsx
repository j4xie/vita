import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';

interface AreaCodeOption {
  code: '86' | '1';
  flag: string;
  label: string;
  labelEn: string;
  placeholder: string;
}

const AREA_CODE_OPTIONS: AreaCodeOption[] = [
  { code: '86', flag: '\u{1F1E8}\u{1F1F3}', label: '\u4E2D\u56FD', labelEn: 'China', placeholder: '13812345678' },
  { code: '1', flag: '\u{1F1FA}\u{1F1F8}', label: '\u7F8E\u56FD', labelEn: 'United States', placeholder: '2025550123' },
];

interface AreaCodePickerModalProps {
  visible: boolean;
  selectedCode: '86' | '1';
  onSelect: (code: '86' | '1') => void;
  onClose: () => void;
}

export const AreaCodePickerModal: React.FC<AreaCodePickerModalProps> = ({
  visible,
  selectedCode,
  onSelect,
  onClose,
}) => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.title}>
                {isZh ? '\u9009\u62E9\u56FD\u9645\u533A\u53F7' : 'Select Area Code'}
              </Text>

              {AREA_CODE_OPTIONS.map((option) => {
                const isSelected = selectedCode === option.code;
                return (
                  <TouchableOpacity
                    key={option.code}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => {
                      onSelect(option.code);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.flag}>{option.flag}</Text>
                    <View style={styles.optionInfo}>
                      <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                        +{option.code}
                      </Text>
                      <Text style={styles.optionCountry}>
                        {isZh ? option.label : option.labelEn}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

/** Helper to get placeholder for a given area code */
export const getPhonePlaceholder = (code: '86' | '1'): string => {
  return AREA_CODE_OPTIONS.find((o) => o.code === code)?.placeholder ?? '';
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: theme.spacing[5],
    paddingBottom: theme.spacing[8],
    paddingTop: theme.spacing[3],
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
    ...theme.shadows[LIQUID_GLASS_LAYERS.L1.shadow.light],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border.primary,
    alignSelf: 'center',
    marginBottom: theme.spacing[4],
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[4],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing[2],
    backgroundColor: theme.colors.background.secondary,
  },
  optionSelected: {
    backgroundColor: 'rgba(255, 123, 0, 0.08)',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  flag: {
    fontSize: 28,
    marginRight: theme.spacing[3],
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  optionLabelSelected: {
    color: theme.colors.primary,
  },
  optionCountry: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  cancelButton: {
    marginTop: theme.spacing[3],
    paddingVertical: theme.spacing[3],
    alignItems: 'center',
  },
  cancelText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
});

export default AreaCodePickerModal;
