import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';
import { deleteAccount } from '../../services/authAPI';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleClose = () => {
    if (!loading) {
      setEmail('');
      setPassword('');
      setShowPassword(false);
      onClose();
    }
  };

  const handleDeleteAccount = async () => {
    // 验证输入
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('profile.delete_account.enter_email'));
      return;
    }

    if (!password.trim()) {
      Alert.alert(t('common.error'), t('profile.delete_account.enter_password'));
      return;
    }

    // 最终确认
    Alert.alert(
      t('profile.delete_account.final_confirm_title'),
      t('profile.delete_account.final_confirm_message'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.delete_account.confirm_delete'),
          style: 'destructive',
          onPress: performDelete,
        },
      ]
    );
  };

  const performDelete = async () => {
    try {
      setLoading(true);

      // 调用账号注销API
      const result = await deleteAccount(email.trim(), password);

      if (result.code === 200) {
        // 成功
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        Alert.alert(
          t('common.success'),
          t('profile.delete_account.success_message'),
          [
            {
              text: t('common.got_it'),
              onPress: () => {
                handleClose();
                onSuccess();
              },
            },
          ]
        );
      } else {
        // 失败
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        Alert.alert(
          t('common.error'),
          result.msg || t('profile.delete_account.failed_message')
        );
      }
    } catch (error: any) {
      console.error('账号注销失败:', error);

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      Alert.alert(
        t('common.error'),
        error.message || t('profile.delete_account.failed_message')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={loading}
            >
              <Ionicons name="close" size={28} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {t('profile.delete_account.title')}
            </Text>
            <View style={styles.closeButton} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Warning */}
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={24} color={theme.colors.danger} />
              <Text style={styles.warningText}>
                {t('profile.delete_account.warning')}
              </Text>
            </View>

            {/* Consequences */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('profile.delete_account.consequences_title')}
              </Text>
              <Text style={styles.consequence}>
                • {t('profile.delete_account.consequence_1')}
              </Text>
              <Text style={styles.consequence}>
                • {t('profile.delete_account.consequence_2')}
              </Text>
              <Text style={styles.consequence}>
                • {t('profile.delete_account.consequence_3')}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('profile.delete_account.verify_identity')}
              </Text>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={theme.colors.text.secondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.delete_account.email_placeholder')}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.colors.text.secondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.delete_account.password_placeholder')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  disabled={loading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.colors.text.secondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Delete Button */}
            <TouchableOpacity
              style={[
                styles.deleteButton,
                (loading || !email.trim() || !password.trim()) && styles.deleteButtonDisabled,
              ]}
              onPress={handleDeleteAccount}
              disabled={loading || !email.trim() || !password.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.deleteButtonText}>
                  {t('profile.delete_account.delete_button')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3F3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.danger,
    marginLeft: 12,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  consequence: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    height: '100%',
  },
  eyeButton: {
    padding: 8,
  },
  deleteButton: {
    backgroundColor: theme.colors.danger,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  deleteButtonDisabled: {
    backgroundColor: '#FFB3B3',
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '400',
    color: theme.colors.primary,
  },
});
