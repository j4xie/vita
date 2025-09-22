import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { fetchOrganizationList } from '../../services/registrationAPI';

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
  const defaultPlaceholder = placeholder || t('auth.register.form.organization_placeholder');

  const [modalVisible, setModalVisible] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const result = await fetchOrganizationList();

      if (result.code === 200 && result.data) {
        setOrganizations(result.data);
        setFilteredOrganizations(result.data);
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

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredOrganizations(organizations);
    } else {
      const searchLower = searchText.toLowerCase();
      const filtered = organizations.filter(org =>
        org.name.toLowerCase().includes(searchLower)
      );
      setFilteredOrganizations(filtered);
    }
  }, [searchText, organizations]);

  const handleSelectOrganization = (organization: Organization) => {
    onSelect(organization);
    setModalVisible(false);
    setSearchText('');
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
        presentationStyle="formSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('auth.register.form.select_organization')}</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color={theme.colors.text.secondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={t('auth.register.form.search_organizations')}
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={theme.colors.text.disabled}
            />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>{t('auth.register.form.loading_organizations')}</Text>
            </View>
          ) : (
            <FlatList
              data={filteredOrganizations}
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
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: LIQUID_GLASS_LAYERS.L0.light,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing[2],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    marginHorizontal: theme.spacing[4],
    marginVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[3],
  },
  searchIcon: {
    marginRight: theme.spacing[2],
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.secondary,
  },
  organizationItemSelected: {
    backgroundColor: theme.colors.primary + '10',
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