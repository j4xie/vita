import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Address, COUNTRY_CODES } from '../../types/address';
import { addressAPI } from '../../services/addressAPI';

/**
 * AddressFormScreen - 添加/编辑收货地址
 *
 * 功能：
 * - 添加新地址
 * - 编辑已有地址
 * - 表单验证
 * - 国家代码选择
 */
export const AddressFormScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const editingAddress: Address | undefined = route.params?.address;
  const isEditing = !!editingAddress;

  // 表单状态
  const [name, setName] = useState(editingAddress?.name || '');
  const [intAreaCode, setIntAreaCode] = useState(editingAddress?.intAreaCode || '1');
  const [mobile, setMobile] = useState(editingAddress?.mobile || '');
  const [address, setAddress] = useState(editingAddress?.address || '');
  const [detailAddr, setDetailAddr] = useState(editingAddress?.detailAddr || '');
  const [isDefault, setIsDefault] = useState(editingAddress?.isDefault === 1 || false);
  const [submitting, setSubmitting] = useState(false);

  // 表单验证
  const validateForm = useCallback(() => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('address.name_required', '请输入收件人姓名'));
      return false;
    }
    if (!mobile.trim()) {
      Alert.alert(t('common.error'), t('address.mobile_required', '请输入手机号'));
      return false;
    }
    if (!address.trim()) {
      Alert.alert(t('common.error'), t('address.address_required', '请输入地址'));
      return false;
    }
    return true;
  }, [name, mobile, address, t]);

  // 提交表单
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const formData = {
        ...(isEditing && { id: editingAddress.id }),
        name: name.trim(),
        intAreaCode,
        mobile: mobile.trim(),
        address: address.trim(),
        detailAddr: detailAddr.trim() || undefined,
        isDefault: isDefault ? 1 : -1,
      };

      if (isEditing) {
        await addressAPI.editAddress(formData);
      } else {
        await addressAPI.addAddress(formData);
      }

      Alert.alert(
        t('common.success'),
        isEditing ? t('address.edit_success') : t('address.add_success'),
        [
          {
            text: t('common.confirm'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('保存地址失败:', error);
      Alert.alert(t('common.error'), error.message || t('address.save_failed'));
    } finally {
      setSubmitting(false);
    }
  }, [
    validateForm,
    isEditing,
    editingAddress,
    name,
    intAreaCode,
    mobile,
    address,
    detailAddr,
    isDefault,
    t,
    navigation,
  ]);

  // 获取当前选中的国家
  const currentCountry = COUNTRY_CODES.find(c => c.code === intAreaCode) || COUNTRY_CODES[0];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* 顶部导航栏 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? t('address.edit_address') : t('address.add_new')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* 表单内容 */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 收件人姓名 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {t('address.recipient_name')} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('address.recipient_name_placeholder', '请输入收件人姓名')}
            placeholderTextColor="#CCCCCC"
            autoCapitalize="words"
          />
        </View>

        {/* 手机号 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {t('address.mobile')} <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.phoneRow}>
            <TouchableOpacity
              style={styles.countryCodeButton}
              onPress={() => {
                Alert.alert(
                  t('address.select_country_code'),
                  undefined,
                  COUNTRY_CODES.map(country => ({
                    text: `${country.flag} ${i18n.language.startsWith('zh') ? country.nameZh : country.name} (+${country.code})`,
                    onPress: () => setIntAreaCode(country.code),
                  }))
                );
              }}
            >
              <Text style={styles.countryCodeText}>
                {currentCountry.flag} +{currentCountry.code}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#666666" />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, styles.phoneInput]}
              value={mobile}
              onChangeText={setMobile}
              placeholder={t('address.mobile_placeholder', '请输入手机号')}
              placeholderTextColor="#CCCCCC"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* 地址 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {t('address.address')} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={address}
            onChangeText={setAddress}
            placeholder={t('address.address_placeholder', '省/州、城市、区/县等')}
            placeholderTextColor="#CCCCCC"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* 详细地址 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('address.detail_address')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={detailAddr}
            onChangeText={setDetailAddr}
            placeholder={t('address.detail_address_placeholder', '街道、门牌号、楼栋单元等')}
            placeholderTextColor="#CCCCCC"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* 设为默认地址 */}
        <View style={styles.formGroup}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>{t('address.set_as_default')}</Text>
              <Text style={styles.hint}>{t('address.set_as_default_hint')}</Text>
            </View>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: '#E0E0E0', true: '#FF6B6B' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </ScrollView>

      {/* 底部保存按钮 */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.saveButtonText}>
            {submitting ? t('common.saving') : t('common.save')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // 顶部导航栏
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  headerRight: {
    width: 36,
  },

  // 滚动区域
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
  },

  // 表单
  formGroup: {
    marginBottom: 24,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },

  required: {
    color: '#FF3B30',
  },

  hint: {
    fontSize: 13,
    color: '#999999',
    marginTop: 4,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333333',
  },

  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  phoneRow: {
    flexDirection: 'row',
    gap: 8,
  },

  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },

  countryCodeText: {
    fontSize: 15,
    color: '#333333',
  },

  phoneInput: {
    flex: 1,
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // 底部保存按钮
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },

  saveButton: {
    backgroundColor: '#FF6B6B',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },

  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
