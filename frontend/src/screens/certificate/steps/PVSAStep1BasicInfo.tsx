import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { PVSAStepProps, PVSAJobTitle } from '../../../types/certificate';
import { theme } from '../../../theme';
import { useTheme } from '../../../context/ThemeContext';
import { SchoolSelector } from '../../../components/common/SchoolSelector';

/**
 * PVSAStep1BasicInfo - Step 1 of the PVSA Certificate wizard.
 *
 * Collects:
 * - Disclaimer acceptance checkbox
 * - Legal name
 * - School (via SchoolSelector)
 * - Job title (4 radio options)
 * - Join date / Resignation date (date pickers)
 * - Email / Phone
 * - Vita Member ID yes/no toggle
 */
const PVSAStep1BasicInfoComponent: React.FC<PVSAStepProps> = ({
  formState,
  dispatch,
  errors,
  setErrors,
}) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  // Date picker visibility
  const [showJoinDatePicker, setShowJoinDatePicker] = useState(false);
  const [showResignationDatePicker, setShowResignationDatePicker] = useState(false);

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

  const formatDate = useCallback(
    (isoString: string): string => {
      if (!isoString) return '';
      try {
        const d = new Date(isoString);
        return d.toLocaleDateString();
      } catch {
        return isoString;
      }
    },
    [],
  );

  // ------ Date Handlers ------

  const handleJoinDateChange = useCallback(
    (_event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        setShowJoinDatePicker(false);
      }
      if (selectedDate) {
        setField('joinDate', selectedDate.toISOString());
      }
    },
    [setField],
  );

  const handleResignationDateChange = useCallback(
    (_event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        setShowResignationDatePicker(false);
      }
      if (selectedDate) {
        setField('resignationDate', selectedDate.toISOString());
      }
    },
    [setField],
  );

  // ------ Job title options ------

  const jobTitleOptions: { key: PVSAJobTitle; labelKey: string }[] = useMemo(
    () => [
      { key: 'student', labelKey: 'profile.certificate.pvsa.step1.job_student' },
      { key: 'staff', labelKey: 'profile.certificate.pvsa.step1.job_staff' },
      { key: 'volunteer', labelKey: 'profile.certificate.pvsa.step1.job_volunteer' },
      { key: 'other', labelKey: 'profile.certificate.pvsa.step1.job_other' },
    ],
    [],
  );

  // ------ Render ------

  return (
    <ScrollView
      style={[styles.container, isDarkMode && styles.containerDark]}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Disclaimer Checkbox */}
      <TouchableOpacity
        style={styles.disclaimerRow}
        onPress={() => setField('disclaimerAccepted', !formState.disclaimerAccepted)}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: formState.disclaimerAccepted }}
      >
        <View
          style={[
            styles.checkbox,
            isDarkMode && styles.checkboxDark,
            formState.disclaimerAccepted && styles.checkboxChecked,
          ]}
        >
          {formState.disclaimerAccepted && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
        <Text style={[styles.disclaimerText, isDarkMode && styles.disclaimerTextDark]}>
          {t('profile.certificate.pvsa.step1.disclaimer')}
        </Text>
      </TouchableOpacity>
      {errors.disclaimerAccepted ? (
        <Text style={styles.errorText}>{errors.disclaimerAccepted}</Text>
      ) : null}

      {/* Legal Name */}
      <Text style={[styles.sectionHeader, isDarkMode && styles.sectionHeaderDark]}>
        {t('profile.certificate.pvsa.step1.legal_name')}
      </Text>
      <TextInput
        style={[
          styles.input,
          isDarkMode && styles.inputDark,
          errors.legalName ? styles.inputError : null,
        ]}
        value={formState.legalName}
        onChangeText={(text) => setField('legalName', text)}
        placeholder={t('profile.certificate.pvsa.step1.legal_name_placeholder')}
        placeholderTextColor={isDarkMode ? '#636366' : theme.colors.text.disabled}
        autoCapitalize="words"
      />
      {errors.legalName ? (
        <Text style={styles.errorText}>{errors.legalName}</Text>
      ) : null}

      {/* School */}
      <Text style={[styles.sectionHeader, isDarkMode && styles.sectionHeaderDark]}>
        {t('profile.certificate.pvsa.step1.school')}
      </Text>
      <SchoolSelector
        value={formState.schoolName}
        selectedId={formState.schoolId}
        onSelect={(school) => {
          dispatch({ type: 'SET_FIELD', field: 'schoolName', value: school.deptName });
          dispatch({ type: 'SET_FIELD', field: 'schoolId', value: String(school.deptId) });
          if (errors.schoolName) {
            setErrors({ ...errors, schoolName: '' });
          }
        }}
        error={errors.schoolName}
      />

      {/* Job Title */}
      <Text style={[styles.sectionHeader, isDarkMode && styles.sectionHeaderDark]}>
        {t('profile.certificate.pvsa.step1.job_title')}
      </Text>
      <View style={styles.radioGroup}>
        {jobTitleOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.radioOption,
              isDarkMode && styles.radioOptionDark,
              formState.jobTitle === option.key && styles.radioOptionSelected,
              formState.jobTitle === option.key && isDarkMode && styles.radioOptionSelectedDark,
            ]}
            onPress={() => setField('jobTitle', option.key)}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityState={{ selected: formState.jobTitle === option.key }}
          >
            <View
              style={[
                styles.radioCircle,
                isDarkMode && styles.radioCircleDark,
                formState.jobTitle === option.key && styles.radioCircleSelected,
              ]}
            >
              {formState.jobTitle === option.key && (
                <View style={styles.radioCircleInner} />
              )}
            </View>
            <Text
              style={[
                styles.radioLabel,
                isDarkMode && styles.radioLabelDark,
              ]}
            >
              {t(option.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.jobTitle ? (
        <Text style={styles.errorText}>{errors.jobTitle}</Text>
      ) : null}

      {/* Join Date */}
      <Text style={[styles.sectionHeader, isDarkMode && styles.sectionHeaderDark]}>
        {t('profile.certificate.pvsa.step1.join_date')}
      </Text>
      <TouchableOpacity
        style={[
          styles.dateButton,
          isDarkMode && styles.dateButtonDark,
          errors.joinDate ? styles.inputError : null,
        ]}
        onPress={() => {
          if (!formState.joinDate) {
            // First tap with no date: set today and show picker
            setField('joinDate', new Date().toISOString());
          }
          setShowJoinDatePicker(!showJoinDatePicker);
        }}
        activeOpacity={0.7}
        testID="join-date-btn"
      >
        <Text
          style={[
            styles.dateButtonText,
            isDarkMode && styles.dateButtonTextDark,
            !formState.joinDate && styles.dateButtonPlaceholder,
          ]}
        >
          {formState.joinDate
            ? formatDate(formState.joinDate)
            : t('profile.certificate.pvsa.step1.join_date')}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={20}
          color={isDarkMode ? '#8E8E93' : theme.colors.text.secondary}
        />
      </TouchableOpacity>
      {errors.joinDate ? (
        <Text style={styles.errorText}>{errors.joinDate}</Text>
      ) : null}
      {showJoinDatePicker && (
        <View style={styles.datePickerContainer}>
          <DateTimePicker
            value={formState.joinDate ? new Date(formState.joinDate) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleJoinDateChange}
            maximumDate={new Date()}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.datePickerDone}
              onPress={() => setShowJoinDatePicker(false)}
              testID="join-date-done-btn"
            >
              <Text style={styles.datePickerDoneText}>
                {t('profile.certificate.pvsa.navigation.next') || 'Done'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Resignation Date (Optional) */}
      <Text style={[styles.sectionHeader, isDarkMode && styles.sectionHeaderDark]}>
        {t('profile.certificate.pvsa.step1.resignation_date')}
      </Text>
      <TouchableOpacity
        style={[styles.dateButton, isDarkMode && styles.dateButtonDark]}
        onPress={() => setShowResignationDatePicker(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.dateButtonText,
            isDarkMode && styles.dateButtonTextDark,
            !formState.resignationDate && styles.dateButtonPlaceholder,
          ]}
        >
          {formState.resignationDate
            ? formatDate(formState.resignationDate)
            : t('profile.certificate.pvsa.step1.resignation_date')}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={20}
          color={isDarkMode ? '#8E8E93' : theme.colors.text.secondary}
        />
      </TouchableOpacity>
      {showResignationDatePicker && (
        <View style={styles.datePickerContainer}>
          <DateTimePicker
            value={
              formState.resignationDate
                ? new Date(formState.resignationDate)
                : new Date()
            }
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleResignationDateChange}
            maximumDate={new Date()}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.datePickerDone}
              onPress={() => setShowResignationDatePicker(false)}
            >
              <Text style={styles.datePickerDoneText}>
                {t('profile.certificate.pvsa.navigation.next') || 'Done'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Email */}
      <Text style={[styles.sectionHeader, isDarkMode && styles.sectionHeaderDark]}>
        {t('profile.certificate.pvsa.step1.email')}
      </Text>
      <TextInput
        style={[
          styles.input,
          isDarkMode && styles.inputDark,
          errors.email ? styles.inputError : null,
        ]}
        value={formState.email}
        onChangeText={(text) => setField('email', text)}
        placeholder={t('profile.certificate.pvsa.step1.email_placeholder')}
        placeholderTextColor={isDarkMode ? '#636366' : theme.colors.text.disabled}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {errors.email ? (
        <Text style={styles.errorText}>{errors.email}</Text>
      ) : null}

      {/* Phone */}
      <Text style={[styles.sectionHeader, isDarkMode && styles.sectionHeaderDark]}>
        {t('profile.certificate.pvsa.step1.phone')}
      </Text>
      <TextInput
        style={[
          styles.input,
          isDarkMode && styles.inputDark,
          errors.phone ? styles.inputError : null,
        ]}
        value={formState.phone}
        onChangeText={(text) => setField('phone', text)}
        placeholder={t('profile.certificate.pvsa.step1.phone_placeholder')}
        placeholderTextColor={isDarkMode ? '#636366' : theme.colors.text.disabled}
        keyboardType="phone-pad"
        testID="phone-input"
      />
      {errors.phone ? (
        <Text style={styles.errorText}>{errors.phone}</Text>
      ) : null}

      {/* Vita Member ID question */}
      <Text style={[styles.sectionHeader, isDarkMode && styles.sectionHeaderDark]}>
        {t('profile.certificate.pvsa.step1.vita_member')}
      </Text>
      <View style={styles.yesNoGroup}>
        <TouchableOpacity
          style={[
            styles.yesNoButton,
            isDarkMode && styles.yesNoButtonDark,
            formState.hasVitaMemberId === true && styles.yesNoButtonSelected,
            formState.hasVitaMemberId === true && isDarkMode && styles.yesNoButtonSelectedDark,
          ]}
          onPress={() => setField('hasVitaMemberId', true)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.yesNoText,
              isDarkMode && styles.yesNoTextDark,
              formState.hasVitaMemberId === true && styles.yesNoTextSelected,
            ]}
          >
            {t('profile.certificate.pvsa.step1.vita_member_yes')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.yesNoButton,
            isDarkMode && styles.yesNoButtonDark,
            formState.hasVitaMemberId === false && styles.yesNoButtonSelected,
            formState.hasVitaMemberId === false && isDarkMode && styles.yesNoButtonSelectedDark,
          ]}
          onPress={() => setField('hasVitaMemberId', false)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.yesNoText,
              isDarkMode && styles.yesNoTextDark,
              formState.hasVitaMemberId === false && styles.yesNoTextSelected,
            ]}
          >
            {t('profile.certificate.pvsa.step1.vita_member_no')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export const PVSAStep1BasicInfo = React.memo(PVSAStep1BasicInfoComponent);
export default PVSAStep1BasicInfo;

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

  // Disclaimer
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxDark: {
    borderColor: '#48484A',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  disclaimerTextDark: {
    color: '#EBEBF599',
  },

  // Radio group (job title)
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    paddingVertical: 10,
    minWidth: '45%',
    flexShrink: 0,
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
    marginRight: 8,
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

  // Date button
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButtonDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#38383A',
  },
  dateButtonText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  dateButtonTextDark: {
    color: '#FFFFFF',
  },
  dateButtonPlaceholder: {
    color: theme.colors.text.disabled,
  },

  // Date picker
  datePickerContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  datePickerDone: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  // Yes / No toggle
  yesNoGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  yesNoButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    alignItems: 'center',
  },
  yesNoButtonDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#38383A',
  },
  yesNoButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(255, 107, 53, 0.06)',
  },
  yesNoButtonSelectedDark: {
    borderColor: '#FF8A65',
    backgroundColor: 'rgba(255, 138, 101, 0.10)',
  },
  yesNoText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  yesNoTextDark: {
    color: '#FFFFFF',
  },
  yesNoTextSelected: {
    color: theme.colors.primary,
  },
});
