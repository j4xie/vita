import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { PVSAStepProps, PVSAPaymentMethod, PVSAMailingOption, PVSAPostageOption } from '../../../types/certificate';
import { theme } from '../../../theme';
import { useTheme } from '../../../context/ThemeContext';

/**
 * PVSAStep2Membership - Step 2 of the PVSA Certificate wizard.
 *
 * Collects:
 * - Vita Member ID (conditional on step1 answer)
 * - Payment method (3 radio options)
 * - Mailing option (3 radio options)
 * - Postage option (conditional, 2 radio options)
 * - Full address fields (conditional, not shown for pickup)
 */
const PVSAStep2MembershipComponent: React.FC<PVSAStepProps> = ({
  formState,
  dispatch,
  errors,
  setErrors,
}) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const showMemberId = formState.hasVitaMemberId === true;
  const showAddress = formState.mailingOption !== '' && formState.mailingOption !== 'pickup';
  const showPostage = formState.mailingOption !== '' && formState.mailingOption !== 'pickup';

  // ------ Helpers ------

  const setField = useCallback(
    (field: string, value: any) => {
      dispatch({ type: 'SET_FIELD', field: field as any, value });
      if (errors[field]) {
        setErrors({ ...errors, [field]: '' });
      }
    },
    [dispatch, errors, setErrors],
  );

  // ------ Options ------

  const paymentOptions: { key: PVSAPaymentMethod; labelKey: string }[] = useMemo(
    () => [
      { key: 'stripe', labelKey: 'profile.certificate.pvsa.step2.payment_stripe' },
      { key: 'alipay', labelKey: 'profile.certificate.pvsa.step2.payment_alipay' },
    ],
    [],
  );

  const mailingOptions: { key: PVSAMailingOption; labelKey: string }[] = useMemo(
    () => [
      { key: 'domestic', labelKey: 'profile.certificate.pvsa.step2.mailing_domestic' },
      { key: 'international', labelKey: 'profile.certificate.pvsa.step2.mailing_international' },
      { key: 'pickup', labelKey: 'profile.certificate.pvsa.step2.mailing_pickup' },
    ],
    [],
  );

  const postageOptions: { key: PVSAPostageOption; labelKey: string }[] = useMemo(
    () => [
      { key: 'standard', labelKey: 'profile.certificate.pvsa.step2.postage_standard' },
      { key: 'express', labelKey: 'profile.certificate.pvsa.step2.postage_express' },
    ],
    [],
  );

  // ------ Shared radio renderer ------

  const renderRadioGroup = (
    options: { key: string; labelKey: string }[],
    selectedValue: string,
    fieldName: string,
  ) => (
    <View style={styles.radioGroup}>
      {options.map((option) => {
        const isSelected = selectedValue === option.key;
        return (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.radioOption,
              isDarkMode && styles.radioOptionDark,
              isSelected && styles.radioOptionSelected,
              isSelected && isDarkMode && styles.radioOptionSelectedDark,
            ]}
            onPress={() => setField(fieldName, option.key)}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
          >
            <View
              style={[
                styles.radioCircle,
                isDarkMode && styles.radioCircleDark,
                isSelected && styles.radioCircleSelected,
              ]}
            >
              {isSelected && <View style={styles.radioCircleInner} />}
            </View>
            <Text style={[styles.radioLabel, isDarkMode && styles.radioLabelDark]}>
              {t(option.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ------ Render ------

  return (
    <ScrollView
      style={[styles.container, isDarkMode && styles.containerDark]}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Vita Member ID (conditional) */}
      {showMemberId && (
        <>
          <Text style={[styles.sectionHeader, isDarkMode && styles.sectionHeaderDark]}>
            {t('profile.certificate.pvsa.step2.member_id')}
          </Text>
          <TextInput
            style={[
              styles.input,
              isDarkMode && styles.inputDark,
              errors.vitaMemberId ? styles.inputError : null,
            ]}
            value={formState.vitaMemberId}
            onChangeText={(text) => setField('vitaMemberId', text)}
            placeholder={t('profile.certificate.pvsa.step2.member_id_placeholder')}
            placeholderTextColor={isDarkMode ? '#636366' : theme.colors.text.disabled}
            autoCapitalize="none"
          />
          {errors.vitaMemberId ? (
            <Text style={styles.errorText}>{errors.vitaMemberId}</Text>
          ) : null}
        </>
      )}

      {/* Payment Method */}
      <Text style={[styles.sectionHeader, isDarkMode && styles.sectionHeaderDark]}>
        {t('profile.certificate.pvsa.step2.payment_method')}
      </Text>
      {renderRadioGroup(paymentOptions, formState.paymentMethod, 'paymentMethod')}
      {errors.paymentMethod ? (
        <Text style={styles.errorText}>{errors.paymentMethod}</Text>
      ) : null}

      {/* Mailing Option */}
      <Text style={[styles.sectionHeader, isDarkMode && styles.sectionHeaderDark]}>
        {t('profile.certificate.pvsa.step2.mailing_option')}
      </Text>
      {renderRadioGroup(mailingOptions, formState.mailingOption, 'mailingOption')}
      {errors.mailingOption ? (
        <Text style={styles.errorText}>{errors.mailingOption}</Text>
      ) : null}

      {/* Postage Option (conditional) */}
      {showPostage && (
        <>
          <Text style={[styles.sectionHeader, isDarkMode && styles.sectionHeaderDark]}>
            {t('profile.certificate.pvsa.step2.postage')}
          </Text>
          {renderRadioGroup(postageOptions, formState.postageOption, 'postageOption')}
          {errors.postageOption ? (
            <Text style={styles.errorText}>{errors.postageOption}</Text>
          ) : null}
        </>
      )}

      {/* Address Fields (conditional) */}
      {showAddress && (
        <>
          <Text style={[styles.sectionHeader, isDarkMode && styles.sectionHeaderDark]}>
            {t('profile.certificate.pvsa.step2.address')}
          </Text>

          {/* Address Line 1 */}
          <TextInput
            style={[
              styles.input,
              isDarkMode && styles.inputDark,
              errors.addressLine1 ? styles.inputError : null,
            ]}
            value={formState.addressLine1}
            onChangeText={(text) => setField('addressLine1', text)}
            placeholder={t('profile.certificate.pvsa.step2.address_line1_placeholder')}
            placeholderTextColor={isDarkMode ? '#636366' : theme.colors.text.disabled}
          />
          {errors.addressLine1 ? (
            <Text style={styles.errorText}>{errors.addressLine1}</Text>
          ) : null}

          {/* Address Line 2 */}
          <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>
            {t('profile.certificate.pvsa.step2.address_line2')}
          </Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={formState.addressLine2}
            onChangeText={(text) => setField('addressLine2', text)}
            placeholder={t('profile.certificate.pvsa.step2.address_line2_placeholder')}
            placeholderTextColor={isDarkMode ? '#636366' : theme.colors.text.disabled}
          />

          {/* City and State in a row */}
          <View style={styles.rowFields}>
            <View style={styles.halfField}>
              <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>
                {t('profile.certificate.pvsa.step2.city')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isDarkMode && styles.inputDark,
                  errors.city ? styles.inputError : null,
                ]}
                value={formState.city}
                onChangeText={(text) => setField('city', text)}
                placeholder={t('profile.certificate.pvsa.step2.city')}
                placeholderTextColor={isDarkMode ? '#636366' : theme.colors.text.disabled}
              />
              {errors.city ? (
                <Text style={styles.errorText}>{errors.city}</Text>
              ) : null}
            </View>

            <View style={styles.halfField}>
              <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>
                {t('profile.certificate.pvsa.step2.state')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isDarkMode && styles.inputDark,
                  errors.state ? styles.inputError : null,
                ]}
                value={formState.state}
                onChangeText={(text) => setField('state', text)}
                placeholder={t('profile.certificate.pvsa.step2.state')}
                placeholderTextColor={isDarkMode ? '#636366' : theme.colors.text.disabled}
              />
              {errors.state ? (
                <Text style={styles.errorText}>{errors.state}</Text>
              ) : null}
            </View>
          </View>

          {/* ZIP Code and Country in a row */}
          <View style={styles.rowFields}>
            <View style={styles.halfField}>
              <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>
                {t('profile.certificate.pvsa.step2.zip_code')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isDarkMode && styles.inputDark,
                  errors.zipCode ? styles.inputError : null,
                ]}
                value={formState.zipCode}
                onChangeText={(text) => setField('zipCode', text)}
                placeholder={t('profile.certificate.pvsa.step2.zip_code')}
                placeholderTextColor={isDarkMode ? '#636366' : theme.colors.text.disabled}
                keyboardType="default"
              />
              {errors.zipCode ? (
                <Text style={styles.errorText}>{errors.zipCode}</Text>
              ) : null}
            </View>

            <View style={styles.halfField}>
              <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>
                {t('profile.certificate.pvsa.step2.country')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isDarkMode && styles.inputDark,
                  errors.country ? styles.inputError : null,
                ]}
                value={formState.country}
                onChangeText={(text) => setField('country', text)}
                placeholder={t('profile.certificate.pvsa.step2.country')}
                placeholderTextColor={isDarkMode ? '#636366' : theme.colors.text.disabled}
              />
              {errors.country ? (
                <Text style={styles.errorText}>{errors.country}</Text>
              ) : null}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
};

export const PVSAStep2Membership = React.memo(PVSAStep2MembershipComponent);
export default PVSAStep2Membership;

// ------ Styles ------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },

  // Section header
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
    marginTop: 18,
  },
  sectionHeaderDark: {
    color: '#FFFFFF',
  },

  // Field label (sub-label for grouped fields)
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: 6,
    marginTop: 12,
  },
  fieldLabelDark: {
    color: '#EBEBF599',
  },

  // Input field
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  inputDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#38383A',
    color: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },

  // Error text
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },

  // Radio group
  radioGroup: {
    gap: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  radioOptionDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#38383A',
  },
  radioOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(255, 107, 53, 0.06)',
  },
  radioOptionSelectedDark: {
    borderColor: '#FF8A65',
    backgroundColor: 'rgba(255, 138, 101, 0.10)',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleDark: {
    borderColor: '#48484A',
  },
  radioCircleSelected: {
    borderColor: theme.colors.primary,
  },
  radioCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  radioLabel: {
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  radioLabelDark: {
    color: '#FFFFFF',
  },

  // Row layout for side-by-side fields
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
});
