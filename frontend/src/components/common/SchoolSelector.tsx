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
import { vitaGlobalAPI } from '../../services/VitaGlobalAPI';

interface School {
  deptId: number;
  deptName: string;
  parentId: number;
  ancestors: string;
  orderNum: number;
  status: string;
}

interface SchoolSelectorProps {
  value: string;
  selectedId: string;
  onSelect: (school: School) => void;
  placeholder?: string;
  error?: string;
}

export const SchoolSelector: React.FC<SchoolSelectorProps> = ({
  value,
  selectedId,
  onSelect,
  placeholder = "选择学校",
  error,
}) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const result = await vitaGlobalAPI.getSchoolList();
      
      if (result.code === 200 && result.data) {
        // 过滤出实际的学校（排除主分类）
        const actualSchools = result.data.filter((school: School) => 
          school.parentId !== 1 && school.deptName !== '学校A' && school.deptName !== '学校B'
        );
        
        setSchools(actualSchools);
        setFilteredSchools(actualSchools);
      } else {
        Alert.alert('错误', '获取学校列表失败');
      }
    } catch (error) {
      console.error('获取学校列表错误:', error);
      Alert.alert('错误', '网络连接失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (modalVisible && schools.length === 0) {
      fetchSchools();
    }
  }, [modalVisible]);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredSchools(schools);
    } else {
      const filtered = schools.filter(school =>
        school.deptName.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredSchools(filtered);
    }
  }, [searchText, schools]);

  const handleSelectSchool = (school: School) => {
    onSelect(school);
    setModalVisible(false);
    setSearchText('');
  };

  const renderSchoolItem = ({ item }: { item: School }) => (
    <TouchableOpacity
      style={[
        styles.schoolItem,
        selectedId === item.deptId.toString() && styles.schoolItemSelected
      ]}
      onPress={() => handleSelectSchool(item)}
    >
      <Text style={[
        styles.schoolName,
        selectedId === item.deptId.toString() && styles.schoolNameSelected
      ]}>
        {item.deptName}
      </Text>
      {selectedId === item.deptId.toString() && (
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
          {value || placeholder}
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
            <Text style={styles.modalTitle}>选择学校</Text>
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
              placeholder="搜索学校..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={theme.colors.text.disabled}
            />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>加载学校列表...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredSchools}
              renderItem={renderSchoolItem}
              keyExtractor={(item) => item.deptId.toString()}
              style={styles.schoolList}
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
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'transparent',
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
    backgroundColor: theme.colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
  schoolList: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
  },
  schoolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.secondary,
  },
  schoolItemSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  schoolName: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    flex: 1,
  },
  schoolNameSelected: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
});