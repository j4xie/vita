import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { getUserPermissionLevel } from '../../types/userPermissions';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const PermissionDebugModal: React.FC<Props> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const { user, permissions, permissionLevel, forceRefreshPermissions } = useUser();
  
  const [refreshing, setRefreshing] = useState(false);

  const handleForceRefresh = async () => {
    setRefreshing(true);
    try {
      await forceRefreshPermissions();
      Alert.alert(t('common.permission_refreshed'), t('common.permission_refresh_success_msg'));
    } catch (error) {
      Alert.alert(t('common.refresh_failed'), t('common.refresh_error', { error }));
    } finally {
      setRefreshing(false);
    }
  };

  const debugData = {
    // 基本用户信息
    userId: user?.id,
    userName: user?.userName,
    legalName: user?.legalName,
    
    // 权限相关
    permissionLevel,
    hasVolunteerAccess: permissions?.hasVolunteerManagementAccess(),
    canCheckInOut: permissions?.canCheckInOut(),
    isAdmin: permissions?.isAdmin(),
    isPartManager: permissions?.isPartManager(),
    isStaff: permissions?.isStaff(),
    
    // 原始角色数据
    roles: user?.roles?.map((r: any) => ({
      id: r.id,
      name: r.name || r.roleName,
      key: r.key,
      roleKey: r.roleKey,
    })) || [],
    
    // 其他数据
    deptId: user?.deptId,
    school: user?.school,
    
    // 测试不同roleKey的权限级别
    roleKeyTests: [
      { roleKey: 'manage', level: getUserPermissionLevel({ roles: [{ key: 'manage' }] }) },
      { roleKey: 'part_manage', level: getUserPermissionLevel({ roles: [{ key: 'part_manage' }] }) },
      { roleKey: 'staff', level: getUserPermissionLevel({ roles: [{ key: 'staff' }] }) },
      { roleKey: 'common', level: getUserPermissionLevel({ roles: [{ key: 'common' }] }) },
    ]
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🔍 权限调试工具</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>关闭</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 当前用户权限状态</Text>
            <Text style={styles.item}>权限级别: {debugData.permissionLevel}</Text>
            <Text style={styles.item}>志愿者功能: {debugData.hasVolunteerAccess ? '✅ 可访问' : '❌ 不可访问'}</Text>
            <Text style={styles.item}>签到操作: {debugData.canCheckInOut ? '✅ 可操作' : '❌ 不可操作'}</Text>
            <Text style={styles.item}>总管理员: {debugData.isAdmin ? '✅' : '❌'}</Text>
            <Text style={styles.item}>分管理员: {debugData.isPartManager ? '✅' : '❌'}</Text>
            <Text style={styles.item}>内部员工: {debugData.isStaff ? '✅' : '❌'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 用户基本信息</Text>
            <Text style={styles.item}>用户ID: {debugData.userId}</Text>
            <Text style={styles.item}>用户名: {debugData.userName}</Text>
            <Text style={styles.item}>法定姓名: {debugData.legalName}</Text>
            <Text style={styles.item}>部门ID: {debugData.deptId}</Text>
            <Text style={styles.item}>学校: {debugData.school}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔑 角色数据 (关键!)</Text>
            {debugData.roles.length > 0 ? (
              debugData.roles.map((role, index) => (
                <View key={index} style={styles.roleItem}>
                  <Text style={styles.item}>角色 {index + 1}:</Text>
                  <Text style={styles.subItem}>  • ID: {role.id}</Text>
                  <Text style={styles.subItem}>  • 名称: {role.name}</Text>
                  <Text style={styles.subItem}>  • key: {role.key}</Text>
                  <Text style={styles.subItem}>  • roleKey: {role.roleKey}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.error}>❌ 没有角色数据！这是问题所在！</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🧪 roleKey权限映射测试</Text>
            {debugData.roleKeyTests.map((test, index) => (
              <Text key={index} style={styles.item}>
                {test.roleKey}: {test.level}
              </Text>
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.refreshButton, refreshing && styles.refreshButtonDisabled]}
            onPress={handleForceRefresh}
            disabled={refreshing}
          >
            <Text style={styles.refreshText}>
              {refreshing ? '🔄 刷新中...' : '🔄 强制刷新权限'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    color: '#007AFF',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  item: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  subItem: {
    fontSize: 12,
    marginLeft: 10,
    marginBottom: 3,
    color: '#888',
  },
  roleItem: {
    marginBottom: 10,
  },
  error: {
    color: '#ff4444',
    fontWeight: 'bold',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  refreshButtonDisabled: {
    backgroundColor: '#ccc',
  },
  refreshText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});