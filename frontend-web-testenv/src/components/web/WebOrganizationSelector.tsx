import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { OrganizationData } from '../../types/registration';

interface WebOrganizationSelectorProps {
  organizations: OrganizationData[];
  selectedOrganization: OrganizationData | null;
  onOrganizationSelect: (organization: OrganizationData | null) => void;
  placeholder: string;
  loading?: boolean;
  error?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export const WebOrganizationSelector: React.FC<WebOrganizationSelectorProps> = ({
  organizations,
  selectedOrganization,
  onOrganizationSelect,
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

  const selectOrganization = (organization: OrganizationData | null) => {
    onOrganizationSelect(organization);
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
        accessibilityHint="Opens organization selection modal"
      >
        <View style={styles.selectorContent}>
          <Text
            style={[
              styles.selectorText,
              !selectedOrganization && styles.placeholderText,
              disabled && styles.selectorTextDisabled,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {loading ? 'Loading organizations...' : selectedOrganization ? selectedOrganization.name : placeholder}
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
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Organization</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Organizations List */}
            <FlatList
              data={organizations}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.organizationOption,
                    selectedOrganization?.id === item.id && styles.organizationOptionSelected,
                  ]}
                  onPress={() => selectOrganization(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${item.name}`}
                >
                  <View style={styles.organizationInfo}>
                    <Text style={styles.organizationText}>
                      {item.name}
                    </Text>
                  </View>
                  {selectedOrganization?.id === item.id && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              style={styles.organizationsList}
            />

            {/* Clear Selection Option */}
            {selectedOrganization && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => selectOrganization(null)}
                accessibilityRole="button"
                accessibilityLabel="Clear organization selection"
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
    maxHeight: '80%',
    width: '90%',
    maxWidth: 400,
    ...theme.shadows[LIQUID_GLASS_LAYERS.L1.shadow],
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
  organizationsList: {
    maxHeight: 300,
  },
  organizationOption: {
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
  organizationOptionSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  organizationInfo: {
    flex: 1,
    marginRight: theme.spacing[2],
  },
  organizationText: {
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