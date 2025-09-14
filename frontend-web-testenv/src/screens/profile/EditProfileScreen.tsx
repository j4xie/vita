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
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';
import * as ImagePicker from 'expo-image-picker';

import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { uploadAvatar, getUserAvatarUrl, checkAvatarExists } from '../../services/imageUploadService';
import { updateUserProfile } from '../../services/authAPI';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  isLast?: boolean;
  editable?: boolean;
  multiline?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  isLast = false,
  editable = true,
  multiline = false,
}) => {
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;

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
    label: {
      fontSize: 15,
      fontWeight: '500',
      color: isDarkMode ? '#ffffff' : '#000000',
      marginBottom: 8,
    },
    input: {
      fontSize: 17,
      color: editable ? (isDarkMode ? '#ffffff' : '#000000') : (isDarkMode ? '#8e8e93' : '#8e8e93'),
      backgroundColor: 'transparent',
      minHeight: multiline ? 80 : 44,
      textAlignVertical: multiline ? 'top' : 'center',
      paddingVertical: multiline ? 8 : 0,
    },
  });

  return (
    <View style={fieldStyles.fieldContainer}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={fieldStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDarkMode ? '#8e8e93' : '#8e8e93'}
        editable={editable}
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

  // Form state - 使用真实用户数据
  const [formData, setFormData] = useState({
    name: user?.legalName || '',
    email: user?.email || '',
    phone: user?.phonenumber || '',
    university: user?.dept?.deptName || '',
    bio: '',
    location: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);


  // 当用户数据加载后更新表单
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.legalName || '',
        email: user.email || '',
        phone: user.phonenumber || '',
        university: user.dept?.deptName || '',
        bio: '',
        location: '',
      });
    }
  }, [user]);

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
      // 准备更新数据
      const updateData = {
        legalName: formData.name,
        nickName: formData.name, // 使用相同名称作为昵称
        phonenumber: formData.phone,
        bio: formData.bio,
        location: formData.location,
        avatar: avatarUri || undefined,
      };

      // 调用API更新用户资料
      const response = await updateUserProfile(updateData);
      
      if (response.code === 200) {
        // 刷新用户信息
        await refreshUserInfo();
        
        Alert.alert(
          t('profile.edit.saveSuccess'),
          t('profile.edit.saveSuccessMessage'),
          [
            {
              text: t('profile.edit.confirm'),
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error(response.msg || 'Update failed');
      }
    } catch (error) {
      console.error('保存用户资料失败:', error);
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : 'Save failed'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

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
                  uri={avatarUri }
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
            <Text style={styles.sectionTitle}>{t('form.steps.basicInfo')}</Text>
            <View style={styles.formContainer}>
              <FormField
                label={t('profile.edit.name')}
                value={formData.name}
                onChangeText={(text) => updateField('name', text)}
                placeholder={t('profile.edit.namePlaceholder')}
              />
              <FormField
                label={t('profile.edit.email')}
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                placeholder={t('profile.edit.emailPlaceholder')}
                editable={false}
              />
              <FormField
                label={t('profile.edit.phone')}
                value={formData.phone}
                onChangeText={(text) => updateField('phone', text)}
                placeholder={t('profile.edit.phonePlaceholder')}
                isLast
              />
            </View>
          </View>

          {/* Academic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('form.steps.contact')}</Text>
            <View style={styles.formContainer}>
              <FormField
                label={t('profile.edit.university')}
                value={formData.university}
                onChangeText={(text) => updateField('university', text)}
                placeholder={t('profile.edit.universityPlaceholder')}
              />
              <FormField
                label={t('profile.edit.location')}
                value={formData.location}
                onChangeText={(text) => updateField('location', text)}
                placeholder={t('profile.edit.locationPlaceholder')}
                isLast
              />
            </View>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.edit.bio')}</Text>
            <View style={styles.formContainer}>
              <FormField
                label={t('profile.edit.bio')}
                value={formData.bio}
                onChangeText={(text) => updateField('bio', text)}
                placeholder={t('profile.edit.bioPlaceholder')}
                multiline
                isLast
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              activeOpacity={0.6}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              activeOpacity={0.6}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>
                {isLoading ? t('profile.edit.saving') : t('profile.edit.save')}
              </Text>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </View>
  );
};

export default EditProfileScreen;