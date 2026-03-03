import { useReducer, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';
import {
  PVSAFormState,
  PVSAFormAction,
  PVSAFormErrors,
  PVSAStepIndex,
} from '../types/certificate';

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialFormState: PVSAFormState = {
  // Step 1 - Basic Info
  disclaimerAccepted: false,
  legalName: '',
  schoolId: '',
  schoolName: '',
  jobTitle: '',
  joinDate: '',
  resignationDate: '',
  email: '',
  phone: '',
  hasVitaMemberId: null,

  // Step 2 - Membership & Mailing
  vitaMemberId: '',
  paymentMethod: '',
  mailingOption: '',
  postageOption: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',

  // Step 3 - Award & Contribution
  awardLevel: '',
  contributionEssay: '',
  proofFileUrl: '',
  packageType: '',

  // Step 4 - Review
  termsAccepted: false,
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function pvsaFormReducer(
  state: PVSAFormState,
  action: PVSAFormAction,
): PVSAFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };

    case 'SET_STEP1':
    case 'SET_STEP2':
    case 'SET_STEP3':
      return { ...state, ...action.payload };

    case 'RESET':
      return { ...initialFormState };

    case 'AUTO_FILL':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Email validation helper
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePVSAForm() {
  const { t } = useTranslation();
  const { user } = useUser();

  const [formState, dispatch] = useReducer(pvsaFormReducer, initialFormState);
  const [errors, setErrors] = useState<PVSAFormErrors>({});
  const [currentStep, setCurrentStep] = useState<PVSAStepIndex>(0);

  // -----------------------------------------------------------------------
  // Auto-fill from user context on mount
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!user) return;

    const autoFillPayload: Partial<PVSAFormState> = {};

    if (user.legalName) {
      autoFillPayload.legalName = user.legalName;
    }
    if (user.email) {
      autoFillPayload.email = user.email;
    }
    if (user.phonenumber) {
      autoFillPayload.phone = user.phonenumber;
    }
    if (user.dept?.deptName) {
      autoFillPayload.schoolName = user.dept.deptName;
    }
    if (user.dept?.deptId) {
      autoFillPayload.schoolId = String(user.dept.deptId);
    }

    if (Object.keys(autoFillPayload).length > 0) {
      dispatch({ type: 'AUTO_FILL', payload: autoFillPayload });
    }
  }, [user]);

  // -----------------------------------------------------------------------
  // Per-step validation
  // -----------------------------------------------------------------------

  const validateStep1 = useCallback((): PVSAFormErrors => {
    const errs: PVSAFormErrors = {};

    if (!formState.disclaimerAccepted) {
      errs.disclaimerAccepted = t(
        'profile.certificate.pvsa.validation.disclaimer_required',
      );
    }
    if (!formState.legalName.trim()) {
      errs.legalName = t(
        'profile.certificate.pvsa.validation.legal_name_required',
      );
    }
    if (!formState.schoolName.trim()) {
      errs.schoolName = t(
        'profile.certificate.pvsa.validation.school_required',
      );
    }
    if (!formState.jobTitle) {
      errs.jobTitle = t(
        'profile.certificate.pvsa.validation.job_title_required',
      );
    }
    if (!formState.joinDate) {
      errs.joinDate = t(
        'profile.certificate.pvsa.validation.join_date_required',
      );
    }
    if (!formState.email.trim()) {
      errs.email = t('profile.certificate.pvsa.validation.email_required');
    } else if (!isValidEmail(formState.email.trim())) {
      errs.email = t('profile.certificate.pvsa.validation.email_invalid');
    }
    if (!formState.phone.trim()) {
      errs.phone = t('profile.certificate.pvsa.validation.phone_required');
    }

    return errs;
  }, [formState, t]);

  const validateStep2 = useCallback((): PVSAFormErrors => {
    const errs: PVSAFormErrors = {};

    if (formState.hasVitaMemberId === true && !formState.vitaMemberId.trim()) {
      errs.vitaMemberId = t(
        'profile.certificate.pvsa.validation.member_id_required',
      );
    }
    if (!formState.paymentMethod) {
      errs.paymentMethod = t(
        'profile.certificate.pvsa.validation.payment_required',
      );
    }
    if (!formState.mailingOption) {
      errs.mailingOption = t(
        'profile.certificate.pvsa.validation.mailing_required',
      );
    }

    // Address fields required unless pickup
    if (formState.mailingOption && formState.mailingOption !== 'pickup') {
      if (!formState.postageOption) {
        errs.postageOption = t(
          'profile.certificate.pvsa.validation.postage_required',
        );
      }
      if (!formState.addressLine1.trim()) {
        errs.addressLine1 = t(
          'profile.certificate.pvsa.validation.address_required',
        );
      }
      if (!formState.city.trim()) {
        errs.city = t('profile.certificate.pvsa.validation.city_required');
      }
      if (!formState.state.trim()) {
        errs.state = t('profile.certificate.pvsa.validation.state_required');
      }
      if (!formState.zipCode.trim()) {
        errs.zipCode = t(
          'profile.certificate.pvsa.validation.zip_code_required',
        );
      }
      if (!formState.country.trim()) {
        errs.country = t(
          'profile.certificate.pvsa.validation.country_required',
        );
      }
    }

    return errs;
  }, [formState, t]);

  const validateStep3 = useCallback((): PVSAFormErrors => {
    const errs: PVSAFormErrors = {};

    if (!formState.awardLevel) {
      errs.awardLevel = t(
        'profile.certificate.pvsa.validation.award_level_required',
      );
    }
    if (!formState.contributionEssay.trim()) {
      errs.contributionEssay = t(
        'profile.certificate.pvsa.validation.essay_required',
      );
    } else if (formState.contributionEssay.trim().length < 10) {
      errs.contributionEssay = t(
        'profile.certificate.pvsa.validation.essay_too_short',
      );
    }
    if (!formState.packageType) {
      errs.packageType = t(
        'profile.certificate.pvsa.validation.package_required',
      );
    }

    return errs;
  }, [formState, t]);

  const validateStep4 = useCallback((): PVSAFormErrors => {
    const errs: PVSAFormErrors = {};

    if (!formState.termsAccepted) {
      errs.termsAccepted = t(
        'profile.certificate.pvsa.validation.terms_required',
      );
    }

    return errs;
  }, [formState, t]);

  // -----------------------------------------------------------------------
  // Unified step validation
  // -----------------------------------------------------------------------

  const validateStep = useCallback(
    (step: PVSAStepIndex): PVSAFormErrors => {
      switch (step) {
        case 0:
          return validateStep1();
        case 1:
          return validateStep2();
        case 2:
          return validateStep3();
        case 3:
          return validateStep4();
        default:
          return {};
      }
    },
    [validateStep1, validateStep2, validateStep3, validateStep4],
  );

  // -----------------------------------------------------------------------
  // Submit data helper
  // -----------------------------------------------------------------------

  const getPackagePrice = useCallback((): number => {
    const priceMap: Record<string, number> = { basic: 3000, standard: 5000, premium: 8000 };
    return priceMap[formState.packageType] || 0;
  }, [formState.packageType]);

  const getSubmitData = useCallback((): Record<string, string> => {
    const data: Record<string, string> = {};

    // Step 1
    data.disclaimerAccepted = String(formState.disclaimerAccepted);
    data.legalName = formState.legalName;
    data.schoolId = formState.schoolId;
    data.schoolName = formState.schoolName;
    data.jobTitle = formState.jobTitle;
    data.joinDate = formState.joinDate;
    data.resignationDate = formState.resignationDate;
    data.email = formState.email;
    data.phone = formState.phone;
    data.hasVitaMemberId = String(formState.hasVitaMemberId ?? false);

    // Step 2
    data.vitaMemberId = formState.vitaMemberId;
    data.paymentMethod = formState.paymentMethod;
    data.mailingOption = formState.mailingOption;
    data.postageOption = formState.postageOption;
    data.addressLine1 = formState.addressLine1;
    data.addressLine2 = formState.addressLine2;
    data.city = formState.city;
    data.state = formState.state;
    data.zipCode = formState.zipCode;
    data.country = formState.country;

    // Step 3
    data.awardLevel = formState.awardLevel;
    data.contributionEssay = formState.contributionEssay;
    data.proofFileUrl = formState.proofFileUrl;
    data.packageType = formState.packageType;

    // Step 4
    data.termsAccepted = String(formState.termsAccepted);

    return data;
  }, [formState]);

  // -----------------------------------------------------------------------
  // Return
  // -----------------------------------------------------------------------

  return {
    formState,
    dispatch,
    errors,
    setErrors,
    validateStep,
    getSubmitData,
    getPackagePrice,
    currentStep,
    setCurrentStep,
  };
}
