import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { PVSAStepProps } from '../../../types/certificate';
import { theme } from '../../../theme';
import { useTheme } from '../../../context/ThemeContext';

/**
 * Extended props for Step 4 include a callback to jump to a previous step for editing.
 */
interface PVSAStep4Props extends PVSAStepProps {
  onEditStep: (stepIndex: number) => void;
}

/**
 * PVSAStep4Review - Step 4 (final) of the PVSA Certificate wizard.
 *
 * Displays:
 * - Read-only review of all form data across steps 1-3
 * - "Edit" text button on each section to navigate back
 * - Terms / agreement checkbox at the bottom
 */
const PVSAStep4ReviewComponent: React.FC<PVSAStep4Props> = ({
  formState,
  dispatch,
  errors,
  setErrors,
  onEditStep,
}) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  // ------ Helpers ------

  const formatDate = useCallback((isoString: string): string => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleDateString();
    } catch {
      return isoString;
    }
  }, []);

  const translateJobTitle = useCallback(
    (key: string): string => {
      if (!key) return '-';
      const map: Record<string, string> = {
        student: t('profile.certificate.pvsa.step1.job_student'),
        staff: t('profile.certificate.pvsa.step1.job_staff'),
        volunteer: t('profile.certificate.pvsa.step1.job_volunteer'),
        other: t('profile.certificate.pvsa.step1.job_other'),
      };
      return map[key] || key;
    },
    [t],
  );

  const translatePayment = useCallback(
    (key: string): string => {
      if (!key) return '-';
      const map: Record<string, string> = {
        stripe: t('profile.certificate.pvsa.step2.payment_stripe'),
        alipay: t('profile.certificate.pvsa.step2.payment_alipay'),
      };
      return map[key] || key;
    },
    [t],
  );

  const translateMailing = useCallback(
    (key: string): string => {
      if (!key) return '-';
      const map: Record<string, string> = {
        domestic: t('profile.certificate.pvsa.step2.mailing_domestic'),
        international: t('profile.certificate.pvsa.step2.mailing_international'),
        pickup: t('profile.certificate.pvsa.step2.mailing_pickup'),
      };
      return map[key] || key;
    },
    [t],
  );

  const translatePostage = useCallback(
    (key: string): string => {
      if (!key) return '-';
      const map: Record<string, string> = {
        standard: t('profile.certificate.pvsa.step2.postage_standard'),
        express: t('profile.certificate.pvsa.step2.postage_express'),
      };
      return map[key] || key;
    },
    [t],
  );

  const translateAwardLevel = useCallback(
    (key: string): string => {
      if (!key) return '-';
      return t(`profile.certificate.pvsa.step3.${key}`);
    },
    [t],
  );

  const translatePackage = useCallback(
    (key: string): string => {
      if (!key) return '-';
      return t(`profile.certificate.pvsa.step3.package_${key}`);
    },
    [t],
  );

  // ------ Section renderer ------

  const renderField = (label: string, value: string) => (
    <View style={styles.fieldRow} key={label}>
      <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>{label}</Text>
      <Text style={[styles.fieldValue, isDarkMode && styles.fieldValueDark]} numberOfLines={3}>
        {value || '-'}
      </Text>
    </View>
  );

  const renderSectionCard = (
    title: string,
    stepIndex: number,
    children: React.ReactNode,
  ) => (
    <View style={[styles.sectionCard, isDarkMode && styles.sectionCardDark]}>
      <View style={styles.sectionCardHeader}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
          {title}
        </Text>
        <TouchableOpacity
          onPress={() => onEditStep(stepIndex)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.editButton, isDarkMode && styles.editButtonDark]}>
            {t('profile.certificate.pvsa.step4.edit')}
          </Text>
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );

  // ------ Build full address string ------

  const fullAddress = [
    formState.addressLine1,
    formState.addressLine2,
    formState.city,
    formState.state,
    formState.zipCode,
    formState.country,
  ]
    .filter(Boolean)
    .join(', ');

  // ------ Render ------

  return (
    <ScrollView
      style={[styles.container, isDarkMode && styles.containerDark]}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Review Title */}
      <Text style={[styles.reviewTitle, isDarkMode && styles.reviewTitleDark]}>
        {t('profile.certificate.pvsa.step4.review_title')}
      </Text>
      <Text style={[styles.reviewDesc, isDarkMode && styles.reviewDescDark]}>
        {t('profile.certificate.pvsa.step4.review_desc')}
      </Text>

      {/* Section: Basic Info (Step 0) */}
      {renderSectionCard(
        t('profile.certificate.pvsa.step4.section_basic'),
        0,
        <>
          {renderField(
            t('profile.certificate.pvsa.step1.legal_name'),
            formState.legalName,
          )}
          {renderField(
            t('profile.certificate.pvsa.step1.school'),
            formState.schoolName,
          )}
          {renderField(
            t('profile.certificate.pvsa.step1.job_title'),
            translateJobTitle(formState.jobTitle),
          )}
          {renderField(
            t('profile.certificate.pvsa.step1.join_date'),
            formatDate(formState.joinDate),
          )}
          {formState.resignationDate
            ? renderField(
                t('profile.certificate.pvsa.step1.resignation_date'),
                formatDate(formState.resignationDate),
              )
            : null}
          {renderField(
            t('profile.certificate.pvsa.step1.email'),
            formState.email,
          )}
          {renderField(
            t('profile.certificate.pvsa.step1.phone'),
            formState.phone,
          )}
        </>,
      )}

      {/* Section: Membership (Step 1) */}
      {renderSectionCard(
        t('profile.certificate.pvsa.step4.section_membership'),
        1,
        <>
          {formState.hasVitaMemberId && formState.vitaMemberId
            ? renderField(
                t('profile.certificate.pvsa.step2.member_id'),
                formState.vitaMemberId,
              )
            : null}
          {renderField(
            t('profile.certificate.pvsa.step2.payment_method'),
            translatePayment(formState.paymentMethod),
          )}
          {renderField(
            t('profile.certificate.pvsa.step2.mailing_option'),
            translateMailing(formState.mailingOption),
          )}
          {formState.mailingOption !== 'pickup' && formState.postageOption
            ? renderField(
                t('profile.certificate.pvsa.step2.postage'),
                translatePostage(formState.postageOption),
              )
            : null}
          {formState.mailingOption !== 'pickup' && fullAddress
            ? renderField(
                t('profile.certificate.pvsa.step2.address'),
                fullAddress,
              )
            : null}
        </>,
      )}

      {/* Section: Award (Step 2) */}
      {renderSectionCard(
        t('profile.certificate.pvsa.step4.section_award'),
        2,
        <>
          {renderField(
            t('profile.certificate.pvsa.step3.award_level'),
            translateAwardLevel(formState.awardLevel),
          )}
          {renderField(
            t('profile.certificate.pvsa.step3.contribution_essay'),
            formState.contributionEssay.length > 100
              ? formState.contributionEssay.substring(0, 100) + '...'
              : formState.contributionEssay,
          )}
          {formState.proofFileUrl
            ? renderField(
                t('profile.certificate.pvsa.step3.proof_upload'),
                '\u2705', // checkmark emoji to indicate uploaded
              )
            : null}
        </>,
      )}

      {/* Section: Package (Step 2 - same step but separate section) */}
      {renderSectionCard(
        t('profile.certificate.pvsa.step4.section_package'),
        2,
        <>
          {renderField(
            t('profile.certificate.pvsa.step3.package_selection'),
            translatePackage(formState.packageType),
          )}
        </>,
      )}

      {/* Terms Checkbox */}
      <TouchableOpacity
        style={styles.termsRow}
        onPress={() => {
          const newValue = !formState.termsAccepted;
          dispatch({ type: 'SET_FIELD', field: 'termsAccepted', value: newValue });
          if (errors.termsAccepted) {
            setErrors({ ...errors, termsAccepted: '' });
          }
        }}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: formState.termsAccepted }}
      >
        <View
          style={[
            styles.checkbox,
            isDarkMode && styles.checkboxDark,
            formState.termsAccepted && styles.checkboxChecked,
          ]}
        >
          {formState.termsAccepted && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
        <Text style={[styles.termsText, isDarkMode && styles.termsTextDark]}>
          {t('profile.certificate.pvsa.step4.terms_agree')}
        </Text>
      </TouchableOpacity>
      {errors.termsAccepted ? (
        <Text style={styles.errorText}>{errors.termsAccepted}</Text>
      ) : null}
    </ScrollView>
  );
};

export const PVSAStep4Review = React.memo(PVSAStep4ReviewComponent);
export default PVSAStep4Review;

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

  // Review header
  reviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  reviewTitleDark: {
    color: '#FFFFFF',
  },
  reviewDesc: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 18,
    lineHeight: 20,
  },
  reviewDescDark: {
    color: '#EBEBF599',
  },

  // Section card
  sectionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  sectionCardDark: {
    backgroundColor: '#1C1C1E',
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },

  // Edit button
  editButton: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  editButtonDark: {
    color: '#FF8A65',
  },

  // Field row
  fieldRow: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  fieldLabelDark: {
    color: '#8E8E93',
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.colors.text.primary,
    lineHeight: 21,
  },
  fieldValueDark: {
    color: '#FFFFFF',
  },

  // Terms checkbox
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
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
  termsText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  termsTextDark: {
    color: '#EBEBF599',
  },

  // Error text
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
});
