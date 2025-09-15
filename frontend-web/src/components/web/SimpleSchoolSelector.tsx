// 简化的学校选择器 - 解决Web端兼容性问题
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { SchoolData } from '../../utils/schoolData';

interface SimpleSchoolSelectorProps {
  schools: SchoolData[];
  selectedSchool: SchoolData | null;
  onSchoolSelect: (school: SchoolData | null) => void;
  placeholder: string;
  loading?: boolean;
  error?: boolean;
  disabled?: boolean;
}

export const SimpleSchoolSelector: React.FC<SimpleSchoolSelectorProps> = ({
  schools,
  selectedSchool,
  onSchoolSelect,
  placeholder,
  loading = false,
  error = false,
  disabled = false,
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
      >
        <View style={styles.selectorContent}>
          <Text style={[
            styles.selectorText,
            !selectedSchool && styles.selectorPlaceholder,
          ]}>
            {selectedSchool
              ? `${selectedSchool.abbreviation} - ${selectedSchool.name}`
              : placeholder
            }
          </Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={20}
          color={theme.colors.text.secondary}
        />
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
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

            {/* Simple Schools List */}
            <View style={styles.schoolsContainer}>
              {schools.length > 0 ? (
                schools.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.schoolOption,
                      selectedSchool?.id === item.id && styles.schoolOptionSelected,
                    ]}
                    onPress={() => selectSchool(item)}
                  >
                    <Text style={styles.schoolText}>
                      {item.abbreviation} - {item.name}
                    </Text>
                    {selectedSchool?.id === item.id && (
                      <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No schools available</Text>
                </View>
              )}
            </View>

            {/* Clear Selection */}
            {selectedSchool && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => selectSchool(null)}
              >
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
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e7',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  selectorButtonError: {
    borderColor: theme.colors.danger,
  },
  selectorButtonDisabled: {
    opacity: 0.6,
    backgroundColor: '#f0f0f0',
  },
  selectorContent: {
    flex: 1,
  },
  selectorText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  selectorPlaceholder: {
    color: theme.colors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '80%',
    minHeight: 400,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  modalCloseButton: {
    padding: 4,
  },
  schoolsContainer: {
    flex: 1,
    maxHeight: 400,
    ...(Platform.OS === 'web' && {
      overflowY: 'auto' as any,
      WebkitOverflowScrolling: 'touch' as any,
    }),
  },
  schoolOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e7',
    backgroundColor: '#ffffff',
  },
  schoolOptionSelected: {
    backgroundColor: '#f0f9ff',
  },
  schoolText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    flex: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  clearButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e7',
  },
  clearButtonText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
});

export default SimpleSchoolSelector;