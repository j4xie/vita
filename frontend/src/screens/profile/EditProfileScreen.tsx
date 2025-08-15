import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Platform,
  useColorScheme,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';

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
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

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
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  // Form state - 这里使用模拟数据，实际应用中应该从用户context或props获取
  const [formData, setFormData] = useState({
    name: t('userInfo.user'),
    email: 'user@example.com',
    phone: '+86 138 0013 8000',
    university: 'UCLA',
    bio: '',
    location: 'Los Angeles, CA',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setIsLoading(true);

    // 模拟保存过程
    setTimeout(() => {
      setIsLoading(false);
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
    }, 1000);
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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Ionicons
                name="person"
                size={50}
                color={theme.colors.text.inverse}
              />
            </View>
            <TouchableOpacity
              style={styles.avatarChangeButton}
              onPress={() => Alert.alert(t('profile.edit.changeAvatar'), t('profile.edit.changeAvatarMessage'))}
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
      </SafeAreaView>
    </View>
  );
};

export default EditProfileScreen;