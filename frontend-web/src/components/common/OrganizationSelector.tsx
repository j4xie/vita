/* Web端特定版本 - 与App端隔离 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { pomeloXAPI } from '../../services/PomeloXAPI';

interface Organization {
  id: number;
  name: string;
  createTime?: string;
}

interface OrganizationSelectorProps {
  value: string;
  selectedId: string;
  onSelect: (organization: Organization) => void;
  placeholder?: string;
  error?: string;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  value,
  selectedId,
  onSelect,
  placeholder,
  error,
}) => {
  const { t } = useTranslation();
  const defaultPlaceholder = placeholder || t('common.select_organization');
  const [modalVisible, setModalVisible] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || "https://www.vitaglobal.icu"}/app/organization/list`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.code === 200 && result.rows) {
        setOrganizations(result.rows);
      } else {
        Alert.alert(t('common.error'), t('auth.register.errors.organization_load_failed'));
      }
    } catch (error) {
      console.error('获取组织列表错误:', error);
      Alert.alert(t('common.error'), t('common.network_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (modalVisible && organizations.length === 0) {
      fetchOrganizations();
    }
  }, [modalVisible]);

  const handleSelectOrganization = (organization: Organization) => {
    onSelect(organization);
    setModalVisible(false);
  };

  const renderOrganizationItem = ({ item }: { item: Organization }) => (
    <TouchableOpacity
      style={[
        styles.organizationItem,
        selectedId === item.id.toString() && styles.organizationItemSelected
      ]}
      onPress={() => handleSelectOrganization(item)}
    >
      <Text style={[
        styles.organizationName,
        selectedId === item.id.toString() && styles.organizationNameSelected
      ]}>
        {item.name}
      </Text>
      {selectedId === item.id.toString() && (
        <Ionicons 
          name="checkmark" 
          size={20} 
          color={theme.colors.primary} 
        />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, error && styles.selectorError]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[
          styles.selectorText,
          !value && styles.selectorPlaceholder
        ]}>
          {value || defaultPlaceholder}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={theme.colors.text.secondary} 
        />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('common.select_organization')}</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>{t('auth.register.form.loading_organizations')}</Text>
            </View>
          ) : (
            <FlatList
              data={organizations}
              renderItem={renderOrganizationItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.organizationList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderRadius: LIQUID_GLASS_LAYERS.L1.borderRadius.card,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
    ...theme.shadows[LIQUID_GLASS_LAYERS.L1.shadow],
  },
  selectorError: {
    borderColor: theme.colors.danger,
  },
  selectorText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    flex: 1,
  },
  selectorPlaceholder: {
    color: theme.colors.text.disabled,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.danger,
    marginTop: theme.spacing[1],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: LIQUID_GLASS_LAYERS.L2.background.light,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    borderBottomColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing[2],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing[3],
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.base,
  },
  organizationList: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
  },
  organizationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[3],
    borderBottomWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    borderBottomColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
    backgroundColor: 'transparent',
  },
  organizationItemSelected: {
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing[2],
    ...theme.shadows.sm,
  },
  organizationName: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    flex: 1,
  },
  organizationNameSelected: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
});