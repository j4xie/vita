import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  Keyboard,
  Image,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { uploadAvatar, getUserAvatarUrl, checkAvatarExists } from '../../services/imageUploadService';
import { updateUserProfile, getUserInfo, getCurrentToken, getCurrentUserId } from '../../services/authAPI';

// 定义可编辑字段 - 控制字段权限
const EDITABLE_FIELDS = [
  'nickName',       // 昵称可编辑
  'gender',         // 性别可编辑（发送时映射为sex）
  'email',          // 主邮箱可编辑（修改时同步更新userName）
  'alternateEmail', // 第二邮箱可编辑（仅限权限用户）
  'phonenumber',    // 手机号可编辑（需要验证）
  'areaCode',       // 区号可编辑
  'university',     // 学校可编辑（暂时不发送，需要deptId映射）
  // 不可编辑：legalName (法定姓名), userName (自动与email同步，不单独编辑)
  // 已删除：bio, location (后端不支持)
];

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  isLast?: boolean;
  editable?: boolean;
  multiline?: boolean;
  fieldKey?: string; // 新增：字段标识，用于判断是否可编辑
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  isLast = false,
  editable = true,
  multiline = false,
  fieldKey,
}) => {
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;

  // 根据字段标识判断是否可编辑
  const isFieldEditable = fieldKey ? EDITABLE_FIELDS.includes(fieldKey) : editable;
  const showLockIcon = fieldKey && !EDITABLE_FIELDS.includes(fieldKey);

  const fieldStyles = StyleSheet.create({
    fieldContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: isLast ? 0 : Platform.select({
        ios: StyleSheet.hairlineWidth,
        android: 0.5,
      }),
      borderBottomColor: isDarkMode ? 'rgba(84, 84, 88, 0.6)' : '#c6c6c8',
    },
    labelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    label: {
      fontSize: 15,
      fontWeight: '500',
      color: isDarkMode ? '#ffffff' : '#000000',
      flex: 1,
    },
    lockIcon: {
      marginLeft: 8,
      opacity: 0.6,
    },
    input: {
      fontSize: 17,
      color: isFieldEditable ? (isDarkMode ? '#ffffff' : '#000000') : (isDarkMode ? '#8e8e93' : '#8e8e93'),
      backgroundColor: 'transparent',
      minHeight: multiline ? 80 : 44,
      textAlignVertical: multiline ? 'top' : 'center',
      paddingVertical: multiline ? 8 : 0,
    },
  });

  return (
    <View style={fieldStyles.fieldContainer}>
      <View style={fieldStyles.labelContainer}>
        <Text style={fieldStyles.label}>{label}</Text>
        {showLockIcon && (
          <Ionicons
            name="lock-closed"
            size={16}
            color={isDarkMode ? '#8e8e93' : '#8e8e93'}
            style={fieldStyles.lockIcon}
          />
        )}
      </View>
      <TextInput
        style={fieldStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDarkMode ? '#8e8e93' : '#8e8e93'}
        editable={isFieldEditable}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        allowFontScaling={true}
        maxFontSizeMultiplier={1.4}
      />
    </View>
  );
};

export const EditProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;
  const insets = useSafeAreaInsets();
  const { user, refreshUserInfo } = useUser();

  // 检查用户是否有权限访问第二邮箱功能（普通用户以上）
  const canUseAlternateEmail = user?.roles?.some(role => role.key !== 'common') || false;

  // 如果用户未登录，返回登录页面
  if (!user) {
    Alert.alert(
      t('auth.login_required'),
      t('auth.login_required_message'),
      [
        {
          text: t('alerts.go_login'),
          onPress: () => navigation.navigate('Login' as never),
        },
      ]
    );
    return null;
  }

  // Form state - 扩展字段支持
  const [formData, setFormData] = useState({
    legalName: user?.legalName || '',
    nickName: user?.nickName || '',
    userName: user?.userName || '', // 保留但不直接编辑，与email同步
    email: user?.email || '',
    alternateEmail: user?.alternateEmail || '', // 🆕 第二邮箱
    phonenumber: user?.phonenumber || '',
    areaCode: user?.areaCode || '86', // 🆕 区号，默认中国+86
    gender: user?.sex || '2', // 0-男 1-女 2-未知 (后端返回sex字段)
    university: user?.dept?.deptName || '',
  });

  // 原始数据状态 - 用于检测变化
  const [originalData, setOriginalData] = useState(null);

  // 是否有更改
  const [hasChanges, setHasChanges] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // 动画状态
  const saveButtonOpacity = useSharedValue(0);
  const saveButtonTranslateY = useSharedValue(50);


  // 加载最新用户数据
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.userId) return;

      try {
        setIsLoadingUserData(true);
        const token = await getCurrentToken();
        const userId = await getCurrentUserId();

        if (token && userId) {
          const response = await getUserInfo(token, userId);

          if (response.code === 200 && response.data) {
            const userData = response.data;
            console.log('📊 后端返回的用户数据:', {
              sex: userData.sex,
              gender: userData.gender, // 应该是undefined
              legalName: userData.legalName
            });

            const newFormData = {
              legalName: userData.legalName || '',
              nickName: userData.nickName || '',
              userName: userData.userName || '',
              email: userData.email || '',
              alternateEmail: userData.alternateEmail || '', // 🆕 第二邮箱
              phonenumber: userData.phonenumber || '',
              areaCode: userData.areaCode || '86', // 🆕 区号
              gender: userData.sex || '2', // 后端返回sex字段，映射为gender
              university: userData.dept?.deptName || '',
            };

            console.log('📝 设置的表单数据:', {
              gender: newFormData.gender,
              genderMeaning: newFormData.gender === '0' ? '男' : newFormData.gender === '1' ? '女' : '其他'
            });

            setFormData(newFormData);
            setOriginalData({ ...newFormData }); // 保存原始数据

            // 设置头像
            if (userData.avatar) {
              setAvatarUri(userData.avatar);
            }
          }
        }
      } catch (error) {
        console.error('加载用户数据失败:', error);
        // 如果加载失败，使用context中的用户数据作为兜底
        if (user) {
          const fallbackData = {
            legalName: user.legalName || '',
            nickName: user.nickName || '',
            userName: user.userName || '',
            email: user.email || '',
            alternateEmail: user.alternateEmail || '', // 🆕 第二邮箱
            phonenumber: user.phonenumber || '',
            areaCode: user.areaCode || '86', // 🆕 区号
            gender: user.sex || '2', // 后端返回sex字段，映射为gender
            university: user.dept?.deptName || '',
          };
          setFormData(fallbackData);
          setOriginalData({ ...fallbackData });
        }
      } finally {
        setIsLoadingUserData(false);
      }
    };

    loadUserData();
  }, [user?.userId]);

  // 检测表单变化和动画效果
  useEffect(() => {
    if (originalData) {
      const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(changed);

      // 保存按钮动画
      if (changed) {
        // 显示保存按钮
        saveButtonOpacity.value = withSpring(1, { damping: 15, stiffness: 300 });
        saveButtonTranslateY.value = withSpring(0, { damping: 15, stiffness: 300 });
      } else {
        // 隐藏保存按钮
        saveButtonOpacity.value = withTiming(0, { duration: 200 });
        saveButtonTranslateY.value = withTiming(50, { duration: 200 });
      }
    }
  }, [formData, originalData, saveButtonOpacity, saveButtonTranslateY]);

  // 初始化时检查用户是否有头像
  useEffect(() => {
    const loadUserAvatar = async () => {
      if (user?.userId) {
        const avatarUrl = getUserAvatarUrl(user.userId);
        const exists = await checkAvatarExists(avatarUrl);
        if (exists) {
          setAvatarUri(avatarUrl);
        }
      }
    };
    
    loadUserAvatar();
  }, [user?.userId]);

  const handleChangeAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t('common.error'),
          'Sorry, we need camera roll permissions to upload avatar!'
        );
        return;
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      };

      Alert.alert(
        t('profile.edit.changeAvatar'),
        'Choose avatar source',
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: 'Camera',
            onPress: async () => {
              const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
              if (cameraPermission.status === 'granted') {
                const result = await ImagePicker.launchCameraAsync(options);
                if (!result.canceled && result.assets[0] && user?.userId) {
                  const localUri = result.assets[0].uri;
                  setAvatarUri(localUri); // 先显示本地图片
                  
                  // 上传到Cloudflare R2
                  const uploadResult = await uploadAvatar(localUri, user.userId);
                  if (uploadResult.success && uploadResult.url) {
                    setAvatarUri(uploadResult.url);
                    Alert.alert(t('common.success'), 'Avatar uploaded successfully!');
                  } else {
                    Alert.alert(t('common.error'), uploadResult.error || 'Upload failed');
                    setAvatarUri(null); // 上传失败则清除
                  }
                }
              }
            },
          },
          {
            text: 'Photo Library',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync(options);
              if (!result.canceled && result.assets[0] && user?.userId) {
                const localUri = result.assets[0].uri;
                setAvatarUri(localUri); // 先显示本地图片
                
                // 上传到Cloudflare R2
                const uploadResult = await uploadAvatar(localUri, user.userId);
                if (uploadResult.success && uploadResult.url) {
                  setAvatarUri(uploadResult.url);
                  Alert.alert(t('common.success'), 'Avatar uploaded successfully!');
                } else {
                  Alert.alert(t('common.error'), uploadResult.error || 'Upload failed');
                  setAvatarUri(null); // 上传失败则清除
                }
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('头像选择失败:', error);
      Alert.alert(t('common.error'), 'Failed to select avatar');
    }
  };

  const handleSave = async () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setIsLoading(true);

    try {
      // 准备更新数据 - 只发送有变化的字段
      const updateData: any = {};

      // 检查每个字段是否有变化 - 只处理可编辑字段
      Object.keys(formData).forEach(key => {
        if (originalData && formData[key] !== originalData[key] && EDITABLE_FIELDS.includes(key)) {
          // 字段映射：前端字段 -> 后端字段
          switch(key) {
            case 'gender':
              // 前端使用gender，后端期望sex
              updateData['sex'] = formData[key];
              break;
            case 'email':
              // email修改时同步更新userName
              updateData['email'] = formData[key];
              updateData['userName'] = formData[key];
              break;
            case 'university':
              // 暂时跳过，因为需要deptId而不是字符串
              // TODO: 未来实现deptId查找机制
              break;
            default:
              // 其他字段直接使用
              updateData[key] = formData[key];
          }
        }
      });

      // 如果头像有变化，也加入更新
      if (avatarUri && avatarUri !== originalData?.avatar) {
        updateData.avatar = avatarUri;
      }

      // 🔧 临时解决方案：保持用户角色信息，避免被后端清空
      // 原因：后端在更新用户信息时会意外清空角色，这是后端的Bug
      if (user?.roles && user.roles.length > 0) {
        try {
          // 方法1：发送角色ID列表
          const roleIds = user.roles.map(r => r.roleId).filter(id => id).join(',');
          if (roleIds) {
            updateData.roleIds = roleIds;
            console.log('🔧 临时方案: 添加roleIds参数:', roleIds);
          }

          // 方法2：发送完整角色信息
          const rolesData = user.roles.map(role => ({
            roleId: role.roleId,
            roleName: role.roleName,
            roleKey: role.roleKey,
            admin: role.admin
          }));
          updateData.roles = JSON.stringify(rolesData);
          console.log('🔧 临时方案: 添加roles参数:', rolesData);

          // 方法3：发送主要角色信息
          const primaryRole = user.roles.find(r => r.admin) || user.roles[0];
          if (primaryRole) {
            updateData.roleId = primaryRole.roleId;
            updateData.roleKey = primaryRole.roleKey;
            console.log('🔧 临时方案: 添加主角色:', primaryRole.roleKey);
          }

        } catch (error) {
          console.warn('⚠️ 角色信息处理失败:', error);
        }
      } else {
        console.warn('⚠️ 用户没有角色信息，无法保持角色');
      }

      // 检查是否有数据需要更新
      if (Object.keys(updateData).length === 0) {
        Alert.alert(
          t('profile.edit.noChanges', '没有更改'),
          t('profile.edit.noChangesMessage', '您没有做任何更改')
        );
        setIsLoading(false);
        return;
      }

      console.log('📝 准备更新的数据:', updateData);
      console.log('📝 发送参数数量:', Object.keys(updateData).length);

      // 显示临时方案状态
      if (updateData.roleIds || updateData.roles || updateData.roleId) {
        console.log('✅ 临时方案已激活：将发送角色信息以避免被清空');
      } else {
        console.log('⚠️ 临时方案未激洺：未找到角色信息');
      }

      // ⚠️ 注意：由于后端暂无用户修改接口，这个调用可能会失败
      // 当后端实现接口后，这个功能将正常工作
      const response = await updateUserProfile(updateData);

      if (response.code === 200) {
        console.log('✅ 用户资料更新成功');

        // 更新原始数据状态，清除hasChanges标记
        setOriginalData({ ...formData });
        setHasChanges(false);

        // 刷新用户信息
        await refreshUserInfo();

        // 检查角色是否保持完整
        setTimeout(async () => {
          try {
            const token = await getCurrentToken();
            const userId = await getCurrentUserId();
            if (token && userId) {
              const updatedUserResponse = await getUserInfo(token, userId);
              if (updatedUserResponse.code === 200 && updatedUserResponse.data?.roles) {
                const currentRoles = updatedUserResponse.data.roles;
                if (currentRoles.length > 0) {
                  console.log('✅ 临时方案成功：角色信息保持完整', currentRoles);
                } else {
                  console.log('❌ 临时方案失败：角色仍被清空');
                }
              }
            }
          } catch (error) {
            console.warn('检查角色状态失败:', error);
          }
        }, 1000);

        Alert.alert(
          t('profile.edit.saveSuccess', '保存成功'),
          t('profile.edit.saveSuccessMessage', '您的资料已更新'),
          [
            {
              text: t('profile.edit.confirm', '确定'),
              // 移除navigation.goBack()，保持在当前页面
            },
          ]
        );
      } else {
        throw new Error(response.msg || 'Update failed');
      }
    } catch (error) {
      console.error('保存用户资料失败:', error);

      // 提供更友好的错误信息
      let errorMessage = '';
      if (error instanceof Error) {
        if (error.message.includes('HTTP error! status: 404')) {
          errorMessage = '后端暂未实现用户资料修改接口，请联系开发团队';
        } else if (error.message.includes('Network')) {
          errorMessage = '网络连接失败，请检查网络设置';
        } else {
          errorMessage = error.message;
        }
      } else {
        errorMessage = '未知错误，请稍后重试';
      }

      Alert.alert(
        t('common.error'),
        errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value,
      };

      // 如果修改的是email，同步更新userName（保持一致）
      if (field === 'email') {
        newData.userName = value;
      }

      return newData;
    });
  };

  // 动画样式
  const animatedSaveButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: saveButtonOpacity.value,
      transform: [{ translateY: saveButtonTranslateY.value }],
    };
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000000' : '#f2f2f7',
    },
    safeArea: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      paddingTop: 20,
      paddingBottom: 56 + 12 + insets.bottom,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '400',
      color: isDarkMode ? '#8e8e93' : '#8e8e93',
      textTransform: 'uppercase',
      marginBottom: 8,
      marginLeft: 32,
    },
    formContainer: {
      backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
      marginHorizontal: 16,
      borderRadius: 14,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    avatarSection: {
      alignItems: 'center',
      paddingVertical: 24,
      paddingHorizontal: 16,
      backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
      marginHorizontal: 16,
      borderRadius: 14,
      marginBottom: 24,
      ...Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    avatarContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      overflow: 'hidden',
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    avatarChangeButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    avatarChangeText: {
      fontSize: 15,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    footer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 20,
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
    },
    buttonText: {
      fontSize: 17,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: isDarkMode ? '#ffffff' : '#000000',
    },
    saveButtonText: {
      color: '#ffffff',
    },
    loadingText: {
      color: '#ffffff',
      opacity: 0.8,
    },

    // 性别选择器样式
    genderContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    genderLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: isDarkMode ? '#ffffff' : '#000000',
      marginBottom: 12,
    },
    genderButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    genderButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(84, 84, 88, 0.6)' : '#c6c6c8',
      backgroundColor: 'transparent',
      alignItems: 'center',
    },
    genderButtonSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '15',
    },
    genderButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: isDarkMode ? '#ffffff' : '#000000',
    },
    genderButtonTextSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },

    // 浮动保存按钮样式
    floatingSaveContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingBottom: insets.bottom + 16,
      paddingTop: 16,
      backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.95)' : 'rgba(242, 242, 247, 0.95)',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDarkMode ? 'rgba(84, 84, 88, 0.6)' : '#c6c6c8',
      // 添加模糊背景效果
      backdropFilter: 'blur(20px)',
    },
    floatingSaveButtonsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    floatingCancelButton: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(84, 84, 88, 0.6)' : '#c6c6c8',
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    floatingSaveButton: {
      flex: 2,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    floatingButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    floatingCancelButtonText: {
      color: isDarkMode ? '#ffffff' : '#000000',
    },
    floatingSaveButtonText: {
      color: '#ffffff',
    },

    // 手机号输入组件样式
    phoneContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: Platform.select({
        ios: StyleSheet.hairlineWidth,
        android: 0.5,
      }),
      borderBottomColor: isDarkMode ? 'rgba(84, 84, 88, 0.6)' : '#c6c6c8',
    },
    phoneLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: isDarkMode ? '#ffffff' : '#000000',
      marginBottom: 8,
    },
    phoneInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    areaCodeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(84, 84, 88, 0.6)' : '#c6c6c8',
      borderRadius: 8,
      backgroundColor: 'transparent',
      minWidth: 70,
    },
    areaCodeText: {
      fontSize: 16,
      color: isDarkMode ? '#ffffff' : '#000000',
      marginRight: 4,
    },
    phoneInput: {
      fontSize: 17,
      color: isDarkMode ? '#ffffff' : '#000000',
      backgroundColor: 'transparent',
      minHeight: 44,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(84, 84, 88, 0.6)' : '#c6c6c8',
      borderRadius: 8,
    },
    phoneHint: {
      fontSize: 12,
      color: isDarkMode ? '#8e8e93' : '#8e8e93',
      marginTop: 4,
      fontStyle: 'italic',
    },
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons
                  name="person"
                  size={50}
                  color={theme.colors.text.inverse}
                />
              )}
            </View>
            <TouchableOpacity
              style={styles.avatarChangeButton}
              onPress={handleChangeAvatar}
              activeOpacity={0.6}
            >
              <Text style={styles.avatarChangeText}>{t('profile.edit.changeAvatar')}</Text>
            </TouchableOpacity>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('form.steps.basicInfo', '基本信息')}</Text>
            <View style={styles.formContainer}>
              <FormField
                label={t('profile.edit.name', '姓名')}
                value={formData.legalName}
                onChangeText={(text) => updateField('legalName', text)}
                placeholder={t('profile.edit.namePlaceholder', '请输入姓名')}
                fieldKey="legalName"
              />
              <FormField
                label={t('profile.edit.nickName', '昵称')}
                value={formData.nickName}
                onChangeText={(text) => updateField('nickName', text)}
                placeholder={t('profile.edit.nickNamePlaceholder', '请输入昵称')}
                fieldKey="nickName"
              />
              <FormField
                label={t('profile.edit.email', '主邮箱')}
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                placeholder={t('profile.edit.emailPlaceholder', '请输入邮箱地址')}
                fieldKey="email"
              />
              {canUseAlternateEmail && (
                <FormField
                  label={t('profile.edit.alternateEmail', '工作邮箱')}
                  value={formData.alternateEmail}
                  onChangeText={(text) => updateField('alternateEmail', text)}
                  placeholder={t('profile.edit.alternateEmailPlaceholder', '请输入工作邮箱')}
                  fieldKey="alternateEmail"
                />
              )}
              {/* 手机号和区号 */}
              <View style={styles.phoneContainer}>
                <Text style={styles.phoneLabel}>{t('profile.edit.phone', '手机号')}</Text>
                <View style={styles.phoneInputRow}>
                  <TouchableOpacity
                    style={styles.areaCodeButton}
                    onPress={() => {
                      // TODO: 添加区号选择器
                      Alert.alert('区号选择', '区号选择功能即将推出');
                    }}
                  >
                    <Text style={styles.areaCodeText}>+{formData.areaCode}</Text>
                    <Ionicons name="chevron-down" size={16} color={isDarkMode ? '#8e8e93' : '#8e8e93'} />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.phoneInput, { flex: 1 }]}
                    value={formData.phonenumber}
                    onChangeText={(text) => updateField('phonenumber', text)}
                    placeholder={t('profile.edit.phonePlaceholder', '请输入手机号')}
                    placeholderTextColor={isDarkMode ? '#8e8e93' : '#8e8e93'}
                    editable={EDITABLE_FIELDS.includes('phonenumber')}
                    keyboardType="phone-pad"
                  />
                </View>
                {!EDITABLE_FIELDS.includes('phonenumber') && (
                  <Text style={styles.phoneHint}>
                    {t('profile.edit.phoneRestrictedMessage', '手机号修改需要验证，功能即将推出')}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Gender Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.edit.personalInfo', '个人信息')}</Text>
            <View style={styles.formContainer}>
              <View style={styles.genderContainer}>
                <Text style={styles.genderLabel}>{t('profile.edit.gender', '性别')}</Text>
                <View style={styles.genderButtons}>
                  {[
                    { value: '0', label: t('profile.edit.male', '男') },
                    { value: '1', label: t('profile.edit.female', '女') },
                    { value: '2', label: t('profile.edit.other', '其他') },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.genderButton,
                        formData.gender === option.value && styles.genderButtonSelected,
                      ]}
                      onPress={() => updateField('gender', option.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.genderButtonText,
                          formData.gender === option.value && styles.genderButtonTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Academic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('form.steps.contact', '学校信息')}</Text>
            <View style={styles.formContainer}>
              <FormField
                label={t('profile.edit.university', '学校')}
                value={formData.university}
                onChangeText={(text) => updateField('university', text)}
                placeholder={t('profile.edit.universityPlaceholder', '请输入您的学校')}
                fieldKey="university"
                isLast
              />
            </View>
          </View>


          {/* 添加额外的底部间距，为浮动按钮留出空间 */}
          <View style={{ height: hasChanges ? 100 : 20 }} />
          </ScrollView>
        </TouchableWithoutFeedback>

        {/* 浮动保存按钮 - 仅在有更改时显示 */}
        <Animated.View style={[styles.floatingSaveContainer, animatedSaveButtonStyle]} pointerEvents={hasChanges ? 'auto' : 'none'}>
          <View style={styles.floatingSaveButtonsRow}>
            <TouchableOpacity
              style={styles.floatingCancelButton}
              onPress={handleCancel}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Text style={[styles.floatingButtonText, styles.floatingCancelButtonText]}>
                {t('common.cancel', '取消')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.floatingSaveButton}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <Text style={[styles.floatingButtonText, styles.floatingSaveButtonText]}>
                {isLoading ? t('profile.edit.saving', '保存中...') : t('profile.edit.save_changes', '保存更改')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

export default EditProfileScreen;