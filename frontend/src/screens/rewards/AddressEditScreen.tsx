import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { Address, addAddress, updateAddress, AddAddressParams, UpdateAddressParams } from '../../services/addressAPI';

interface RouteParams {
  address?: Address;
}

// 美国各州数据
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
];

/**
 * 地址编辑页面
 * 支持新增和编辑模式
 */
export const AddressEditScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const params = route.params as RouteParams | undefined;
  const existingAddress = params?.address;
  const isEditMode = !!existingAddress;

  // 表单状态
  const [name, setName] = useState(existingAddress?.name || '');
  const [intAreaCode, setIntAreaCode] = useState(existingAddress?.intAreaCode || '1');
  const [mobile, setMobile] = useState(existingAddress?.mobile || '');
  const [address, setAddress] = useState(existingAddress?.address || '');
  const [detailAddr, setDetailAddr] = useState(existingAddress?.detailAddr || '');
  const [city, setCity] = useState(existingAddress?.city || '');
  const [stateCode, setStateCode] = useState(existingAddress?.state || '');
  const [zipCode, setZipCode] = useState(existingAddress?.zipCode || '');
  const [isDefault, setIsDefault] = useState(existingAddress?.isDefault === 1);
  const [loading, setLoading] = useState(false);

  // 获取州名称
  const getStateName = (code: string): string => {
    const state = US_STATES.find(s => s.code === code);
    return state ? state.name : '';
  };

  // 表单验证
  const validateForm = useCallback((): boolean => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('address.validation.name_required', 'Please enter recipient name'));
      return false;
    }
    if (!mobile.trim()) {
      Alert.alert(t('common.error'), t('address.validation.phone_required', 'Please enter phone number'));
      return false;
    }
    if (!/^\d{7,15}$/.test(mobile.trim())) {
      Alert.alert(t('common.error'), t('address.validation.phone_invalid', 'Invalid phone number format'));
      return false;
    }
    if (!address.trim()) {
      Alert.alert(t('common.error'), t('address.validation.address_required', 'Please enter address'));
      return false;
    }
    if (!city.trim()) {
      Alert.alert(t('common.error'), t('address.validation.city_required', 'Please enter city'));
      return false;
    }
    if (!stateCode) {
      Alert.alert(t('common.error'), t('address.validation.state_required', 'Please select state'));
      return false;
    }
    if (!zipCode.trim()) {
      Alert.alert(t('common.error'), t('address.validation.zip_required', 'Please enter zip code'));
      return false;
    }
    if (!/^\d{5}$/.test(zipCode.trim())) {
      Alert.alert(t('common.error'), t('address.validation.zip_invalid', 'Please enter valid 5-digit zip code'));
      return false;
    }
    return true;
  }, [name, mobile, address, city, stateCode, zipCode, t]);

  // 保存地址
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (isEditMode && existingAddress) {
        // 编辑模式
        const params: UpdateAddressParams = {
          id: String(existingAddress.id),
          name: name.trim(),
          intAreaCode: intAreaCode.trim(),
          mobile: mobile.trim(),
          address: address.trim(),
          detailAddr: detailAddr.trim() || undefined,
          city: city.trim(),
          state: stateCode,
          zipCode: zipCode.trim(),
          isDefault: isDefault ? '1' : '-1',
        };

        console.log('[AddressEditScreen] 更新地址:', params);
        const result = await updateAddress(params);

        if (result.code === 200) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          navigation.goBack();
        } else {
          Alert.alert(t('common.error'), result.msg || t('common.operation_failed'));
        }
      } else {
        // 新增模式
        const params: AddAddressParams = {
          name: name.trim(),
          intAreaCode: intAreaCode.trim(),
          mobile: mobile.trim(),
          address: address.trim(),
          detailAddr: detailAddr.trim() || undefined,
          city: city.trim(),
          state: stateCode,
          zipCode: zipCode.trim(),
          isDefault: isDefault ? '1' : '-1',
        };

        console.log('[AddressEditScreen] 添加地址:', params);
        const result = await addAddress(params);

        if (result.code === 200) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          navigation.goBack();
        } else {
          Alert.alert(t('common.error'), result.msg || t('common.operation_failed'));
        }
      }
    } catch (error) {
      console.error('[AddressEditScreen] 保存失败:', error);
      Alert.alert(t('common.error'), t('common.operation_failed'));
    } finally {
      setLoading(false);
    }
  }, [isEditMode, existingAddress, name, intAreaCode, mobile, address, detailAddr, city, stateCode, zipCode, isDefault, validateForm, navigation, t]);

  // 显示州选择器
  const showStateSelector = () => {
    Haptics.selectionAsync();
    // 将州分组显示（每组10个），避免Alert选项过多
    const stateOptions = US_STATES.map(state => ({
      text: `${state.name} (${state.code})`,
      onPress: () => setStateCode(state.code),
    }));

    Alert.alert(
      t('address.select_state', 'Select State'),
      undefined,
      [
        ...stateOptions.slice(0, 10),
        {
          text: t('common.more', 'More...'),
          onPress: () => showMoreStates(),
        },
      ]
    );
  };

  // 显示更多州
  const showMoreStates = () => {
    const remaining = US_STATES.slice(10);
    const options = remaining.map(state => ({
      text: `${state.name} (${state.code})`,
      onPress: () => setStateCode(state.code),
    }));

    Alert.alert(
      t('address.select_state', 'Select State'),
      undefined,
      [
        ...options.slice(0, 15),
        {
          text: t('common.more', 'More...'),
          onPress: () => showEvenMoreStates(),
        },
      ]
    );
  };

  // 显示剩余州
  const showEvenMoreStates = () => {
    const remaining = US_STATES.slice(25);
    const options = remaining.map(state => ({
      text: `${state.name} (${state.code})`,
      onPress: () => setStateCode(state.code),
    }));

    Alert.alert(
      t('address.select_state', 'Select State'),
      undefined,
      options
    );
  };

  // 常用国家代码
  const areaCodes = [
    { code: '1', country: 'US/CA' },
    { code: '86', country: 'China' },
    { code: '44', country: 'UK' },
    { code: '81', country: 'Japan' },
    { code: '82', country: 'Korea' },
    { code: '61', country: 'Australia' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditMode ? t('address.edit') : t('address.add')}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 收件人姓名 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('address.recipient_name')}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('address.form.name_placeholder', 'Enter recipient name')}
              placeholderTextColor="#C7C7CC"
              maxLength={50}
            />
          </View>

          {/* 手机号 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('address.phone')}</Text>
            <View style={styles.phoneRow}>
              <TouchableOpacity
                style={styles.areaCodeButton}
                onPress={() => {
                  Alert.alert(
                    t('address.select_area_code', 'Select Country/Region'),
                    undefined,
                    areaCodes.map(item => ({
                      text: `+${item.code} (${item.country})`,
                      onPress: () => setIntAreaCode(item.code),
                    }))
                  );
                }}
              >
                <Text style={styles.areaCodeText}>+{intAreaCode}</Text>
                <Ionicons name="chevron-down" size={16} color="#8E8E93" />
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                value={mobile}
                onChangeText={setMobile}
                placeholder={t('address.form.phone_placeholder', 'Enter phone number')}
                placeholderTextColor="#C7C7CC"
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>
          </View>

          {/* 地址 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('address.address_line')}</Text>
            <TextInput
              style={[styles.input, styles.addressInput]}
              value={address}
              onChangeText={setAddress}
              placeholder={t('address.form.address_placeholder', 'Street address')}
              placeholderTextColor="#C7C7CC"
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              maxLength={200}
            />
          </View>

          {/* 详细地址 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('address.detail_address')}</Text>
            <TextInput
              style={[styles.input, styles.addressInput]}
              value={detailAddr}
              onChangeText={setDetailAddr}
              placeholder={t('address.form.detail_placeholder', 'Apt, Suite, Unit, etc.')}
              placeholderTextColor="#C7C7CC"
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              maxLength={200}
            />
          </View>

          {/* 城市 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('address.city')}</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder={t('address.placeholder_city', 'City name')}
              placeholderTextColor="#C7C7CC"
              maxLength={100}
            />
          </View>

          {/* 州和邮编在同一行 */}
          <View style={styles.stateZipRow}>
            {/* 州 */}
            <View style={[styles.formGroup, styles.stateField]}>
              <Text style={styles.label}>{t('address.state')}</Text>
              <TouchableOpacity
                style={styles.stateButton}
                onPress={showStateSelector}
              >
                <Text style={[
                  styles.stateButtonText,
                  !stateCode && styles.placeholderText
                ]}>
                  {stateCode ? `${getStateName(stateCode)} (${stateCode})` : t('address.select_state', 'Select State')}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            {/* 邮编 */}
            <View style={[styles.formGroup, styles.zipField]}>
              <Text style={styles.label}>{t('address.zip_code')}</Text>
              <TextInput
                style={styles.input}
                value={zipCode}
                onChangeText={setZipCode}
                placeholder={t('address.placeholder_zip', '5-digit zip')}
                placeholderTextColor="#C7C7CC"
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
          </View>

          {/* 设为默认地址 */}
          <TouchableOpacity
            style={styles.defaultRow}
            onPress={() => {
              Haptics.selectionAsync();
              setIsDefault(!isDefault);
            }}
          >
            <Text style={styles.defaultLabel}>{t('address.set_default')}</Text>
            <View style={[styles.checkbox, isDefault && styles.checkboxChecked]}>
              {isDefault && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* 底部保存按钮 */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>{t('address.save')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3C3C43',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  areaCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginRight: 10,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  areaCodeText: {
    fontSize: 16,
    color: '#000000',
    marginRight: 4,
  },
  phoneInput: {
    flex: 1,
  },
  addressInput: {
    minHeight: 60,
    paddingTop: 14,
  },
  stateZipRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stateField: {
    flex: 1.5,
  },
  zipField: {
    flex: 1,
  },
  stateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  stateButtonText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  placeholderText: {
    color: '#C7C7CC',
  },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  defaultLabel: {
    fontSize: 16,
    color: '#000000',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  saveButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AddressEditScreen;
