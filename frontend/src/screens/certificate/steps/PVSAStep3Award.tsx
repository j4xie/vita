import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import {
  PVSAStepProps,
  PVSAAwardLevel,
  PVSAPackageType,
  AwardLevelInfo,
  PricingInfo,
} from '../../../types/certificate';
import { theme } from '../../../theme';
import { useTheme } from '../../../context/ThemeContext';
import { AwardLevelCard } from '../../../components/certificate/AwardLevelCard';
import { PricingOption } from '../../../components/certificate/PricingOption';
import { MediaUploader } from '../../../components/common/MediaUploader';

/**
 * PVSAStep3Award - Step 3 of the PVSA Certificate wizard.
 *
 * Collects:
 * - Award level selection (Bronze / Silver / Gold / Lifetime)
 * - Contribution essay (multi-line, max 3000 chars)
 * - Proof of service hours upload
 * - Package selection (Basic / Standard / Premium)
 */
const PVSAStep3AwardComponent: React.FC<PVSAStepProps> = ({
  formState,
  dispatch,
  errors,
  setErrors,
}) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

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

  // ------ Award levels ------

  const awardLevels: AwardLevelInfo[] = useMemo(
    () => [
      { level: 'bronze', hoursRequired: 100, color: '#CD7F32', iconName: 'shield-outline' },
      { level: 'silver', hoursRequired: 175, color: '#C0C0C0', iconName: 'shield-half-outline' },
      { level: 'gold', hoursRequired: 250, color: '#FFD700', iconName: 'shield' },
      { level: 'lifetime', hoursRequired: 4000, color: '#8B008B', iconName: 'star' },
    ],
    [],
  );

  // ------ Pricing options ------

  const pricingOptions: PricingInfo[] = useMemo(
    () => [
      {
        type: 'basic',
        priceUSD: 30,
        priceCNY: 200,
        features: ['PVSA Certificate', 'Digital Badge'],
      },
      {
        type: 'standard',
        priceUSD: 50,
        priceCNY: 350,
        features: ['PVSA Certificate', 'Digital Badge', 'Medallion', 'Letter'],
      },
      {
        type: 'premium',
        priceUSD: 80,
        priceCNY: 560,
        features: [
          'PVSA Certificate',
          'Digital Badge',
          'Gold Medallion',
          'Presidential Letter',
          'Lapel Pin',
        ],
      },
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
      {/* Award Info Banner */}
      <View style={[styles.infoBanner, isDarkMode && styles.infoBannerDark]}>
        <Ionicons
          name="information-circle-outline"
          size={22}
          color={isDarkMode ? '#FF8A65' : theme.colors.primary}
          style={styles.infoBannerIcon}
        />
        <View style={styles.infoBannerContent}>
          <Text style={[styles.infoBannerTitle, isDarkMode && styles.infoBannerTitleDark]}>
            {t('profile.certificate.pvsa.step3.award_info')}
          </Text>
          <Text style={[styles.infoBannerDesc, isDarkMode && styles.infoBannerDescDark]}>
            {t('profile.certificate.pvsa.step3.award_info_desc')}
          </Text>
        </View>
      </View>

      {/* Award Level Selection */}
      <Text style={[styles.sectionHeader, isDarkMode && styles.sectionHeaderDark]}>
        {t('profile.certificate.pvsa.step3.award_level')}
      </Text>
      {awardLevels.map((award) => (
        <AwardLevelCard
          key={award.level}
          level={award.level}
          hoursRequired={award.hoursRequired}
          color={award.color}
          isSelected={formState.awardLevel === award.level}
          onSelect={() => setField('awardLevel', award.level)}
        />
      ))}
      {errors.awardLevel ? (
        <Text style={styles.errorText}>{errors.awardLevel}</Text>
      ) : null}

      {/* Contribution Essay */}
      <Text style={[styles.sectionHeader, isDarkMode && styles.sectionHeaderDark]}>
        {t('profile.certificate.pvsa.step3.contribution_essay')}
      </Text>
      <TextInput
        style={[
          styles.input,
          styles.textArea,
          isDarkMode && styles.inputDark,
          errors.contributionEssay ? styles.inputError : null,
        ]}
        value={formState.contributionEssay}
        onChangeText={(text) => setField('contributionEssay', text)}
        placeholder={t('profile.certificate.pvsa.step3.contribution_essay_placeholder')}
        placeholderTextColor={isDarkMode ? '#636366' : theme.colors.text.disabled}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        maxLength={3000}
        testID="contribution-essay-input"
      />
      <Text style={[styles.charCount, isDarkMode && styles.charCountDark]}>
        {formState.contributionEssay.length}/3000
      </Text>
      {errors.contributionEssay ? (
        <Text style={styles.errorText}>{errors.contributionEssay}</Text>
      ) : null}

      {/* Proof Upload */}
      <Text style={[styles.sectionHeader, isDarkMode && styles.sectionHeaderDark]}>
        {t('profile.certificate.pvsa.step3.proof_upload')}
      </Text>
      <Text style={[styles.uploadDesc, isDarkMode && styles.uploadDescDark]}>
        {t('profile.certificate.pvsa.step3.proof_upload_desc')}
      </Text>
      <MediaUploader
        type="image"
        value={formState.proofFileUrl}
        onUploadSuccess={(url) => dispatch({ type: 'SET_FIELD', field: 'proofFileUrl', value: url })}
        label={t('profile.certificate.pvsa.step3.proof_upload')}
      />

      {/* Package Selection */}
      <Text style={[styles.sectionHeader, isDarkMode && styles.sectionHeaderDark]}>
        {t('profile.certificate.pvsa.step3.package_selection')}
      </Text>
      {pricingOptions.map((pkg) => (
        <PricingOption
          key={pkg.type}
          type={pkg.type}
          priceUSD={pkg.priceUSD}
          priceCNY={pkg.priceCNY}
          features={pkg.features}
          isSelected={formState.packageType === pkg.type}
          onSelect={() => setField('packageType', pkg.type)}
        />
      ))}
      {errors.packageType ? (
        <Text style={styles.errorText}>{errors.packageType}</Text>
      ) : null}
    </ScrollView>
  );
};

export const PVSAStep3Award = React.memo(PVSAStep3AwardComponent);
export default PVSAStep3Award;

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

  // Info banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 107, 53, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.15)',
    padding: 14,
    marginBottom: 8,
  },
  infoBannerDark: {
    backgroundColor: 'rgba(255, 138, 101, 0.10)',
    borderColor: 'rgba(255, 138, 101, 0.20)',
  },
  infoBannerIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  infoBannerContent: {
    flex: 1,
  },
  infoBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  infoBannerTitleDark: {
    color: '#FFFFFF',
  },
  infoBannerDesc: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 19,
  },
  infoBannerDescDark: {
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

  // Text area (multi-line)
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 14,
  },

  // Character count
  charCount: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    textAlign: 'right',
    marginTop: 4,
  },
  charCountDark: {
    color: '#636366',
  },

  // Upload description
  uploadDesc: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginBottom: 10,
    lineHeight: 19,
  },
  uploadDescDark: {
    color: '#EBEBF599',
  },

  // Error text
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
});
