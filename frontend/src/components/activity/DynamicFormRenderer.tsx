import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    LayoutAnimation,
    Platform,
    UIManager,
    Switch,
    PanResponder,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Modal,
    Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { MediaUploader } from '../common/MediaUploader';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    withSequence,
    withRepeat,
    FadeIn,
    FadeInUp
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { FormFieldSchema, FormFieldOption, FormStepConfig } from '../../types/form';
import { KeyboardDoneAccessory, KEYBOARD_ACCESSORY_ID } from '../common/KeyboardDismissWrapper';
import { StepIndicator } from '../certificate/StepIndicator';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DynamicFormRendererProps {
    modelContent: string;
    onSubmit: (data: any) => void;
    submitLabel?: string;
    loading?: boolean;
    initialData?: any;
    headerComponent?: React.ReactNode;
    wizardMode?: boolean;
}

// === Sub-components ===

// 1. Input Field Component
const FormInput = ({ field, value, onChange, error, isAutoFilled }: {
    field: FormFieldSchema,
    value: any,
    onChange: (text: string) => void,
    error?: string,
    isAutoFilled?: boolean,
}) => {
    const { t } = useTranslation();
    const [isFocused, setIsFocused] = useState(false);
    const [secureTextEntry, setSecureTextEntry] = useState(field.type === 'password');
    const [touched, setTouched] = useState(false);
    const showAutoFillBadge = isAutoFilled && !touched && !!value;
    
    const isTextArea = field.tag === 'el-textarea' || field.type === 'textarea';
    const isDisabled = field.disabled || field.readonly;

    const getIconName = () => {
        if (field.prefixIcon) return field.prefixIcon as any;
        if (field.type === 'email') return 'mail-outline';
        if (field.type === 'phone') return 'call-outline';
        if (field.type === 'password') return 'lock-closed-outline';
        if (isTextArea) return 'document-text-outline';
        // default icon removed to match generic input unless specified
        return undefined;
    };

    const iconName = getIconName();

    const animatedStyle = useAnimatedStyle(() => {
        return {
            borderColor: withTiming(
                error 
                    ? theme.colors.danger 
                    : (isFocused ? theme.colors.primary : '#E5E7EB')
            ),
            borderWidth: withTiming(isFocused ? 1.5 : 1),
            transform: [{ scale: withSpring(isFocused ? 1.01 : 1) }],
            backgroundColor: withTiming(field.disabled ? '#F9FAFB' : '#FFFFFF')
        };
    });

    return (
        <View style={styles.fieldContainer}>
            <View style={styles.labelContainer}>
                <Text style={styles.label}>{field.label}</Text>
                {field.required && <View style={styles.requiredDot} />}
                {showAutoFillBadge && (
                    <View style={styles.autoFillBadge}>
                        <Ionicons name="flash" size={10} color={theme.colors.primary} />
                        <Text style={styles.autoFillText}>{t('form.auto_filled', 'Auto-filled')}</Text>
                    </View>
                )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Prepend */}
                {field.prepend && (
                    <View style={styles.prependContainer}>
                        <Text style={styles.addonText}>{field.prepend}</Text>
                    </View>
                )}

                <Animated.View style={[
                    styles.inputWrapper,
                    isTextArea && styles.textAreaWrapper,
                    field.prepend && styles.inputWrapperWithPrepend,
                    field.append && styles.inputWrapperWithAppend,
                    animatedStyle,
                    { flex: 1 }
                ]}>
                    {iconName && (
                        <View style={[styles.iconContainer, isTextArea && { paddingTop: 12 }]}>
                            <Ionicons name={iconName} size={20} color={isFocused ? theme.colors.primary : '#9CA3AF'} />
                        </View>
                    )}

                    <TextInput
                        style={[
                            styles.input,
                            iconName && styles.inputWithIcon,
                            isTextArea && styles.textArea,
                            isDisabled && styles.inputDisabled
                        ]}
                        value={value}
                        onChangeText={(text) => {
                            if (!touched) setTouched(true);
                            onChange(text);
                        }}
                        placeholder={field.placeholder || t('form.placeholder_input', { label: field.label, defaultValue: `Enter ${field.label}` })}
                        placeholderTextColor="#9CA3AF"
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        multiline={isTextArea}
                        numberOfLines={isTextArea ? 4 : 1}
                        textAlignVertical={isTextArea ? 'top' : 'center'}
                        secureTextEntry={secureTextEntry}
                        keyboardType={field.type === 'phone' ? 'phone-pad' : field.type === 'email' ? 'email-address' : 'default'}
                        maxLength={field.maxlength}
                        editable={!isDisabled}
                        returnKeyType={isTextArea ? 'default' : 'done'}
                        blurOnSubmit={!isTextArea}
                        onSubmitEditing={() => !isTextArea && Keyboard.dismiss()}
                        inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
                    />

                    {/* Clearable */}
                    {field.clearable && value && !isDisabled && (
                        <TouchableOpacity onPress={() => { setTouched(true); onChange(''); }} style={styles.clearIcon}>
                            <Ionicons name="close-circle" size={16} color="#D1D5DB" />
                        </TouchableOpacity>
                    )}

                    {/* Password Toggle */}
                    {field.type === 'password' && (
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setSecureTextEntry(!secureTextEntry)}
                        >
                            <Ionicons name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                    
                    {/* Word Limit */}
                    {field.showWordLimit && field.maxlength && (
                        <Text style={styles.wordLimitText}>
                            {value ? value.length : 0}/{field.maxlength}
                        </Text>
                    )}
                </Animated.View>

                {/* Append */}
                {field.append && (
                    <View style={styles.appendContainer}>
                        <Text style={styles.addonText}>{field.append}</Text>
                    </View>
                )}
            </View>

            {error && (
                <Animated.View entering={FadeInUp.duration(300)} style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={14} color={theme.colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
            )}
        </View>
    );
};

// Parse option labels that contain embedded descriptions (e.g. "Bronze — A minimum of 100 hours...")
const parseOptionLabel = (label: string): { title: string; description?: string } => {
    // Split on " — " (em dash with spaces) or " - " (hyphen with spaces)
    const separators = [' — ', ' – ', ' - '];
    for (const sep of separators) {
        const idx = label.indexOf(sep);
        if (idx > 0) {
            const desc = label.substring(idx + sep.length).trim();
            if (desc.length > 20) {
                return { title: label.substring(0, idx).trim(), description: desc };
            }
        }
    }
    return { title: label };
};

// Detect if a radio/checkbox option is a "fill-in" type that should reveal a text input when selected
// e.g. "Other (please specify)" or "If the title is spelled differently, please enter..."
const isFillInOption = (label: string): boolean => {
    const lower = label.toLowerCase();
    return /please enter|please specify|please type|其他.*请输入|请填写|如.*不同.*请输入|spelled differently/.test(lower);
};

// 2. Selection Card Component (Radio/Checkbox)
const SelectionCard = ({
    label,
    selected,
    onPress,
    type = 'radio',
    disabled = false,
    description,
}: {
    label: string,
    selected: boolean,
    onPress: () => void,
    type: 'radio' | 'checkbox',
    disabled?: boolean,
    description?: string,
}) => {
    const scale = useSharedValue(1);
    const parsed = useMemo(() => parseOptionLabel(label), [label]);
    const displayDesc = description || parsed.description;

    const handlePressIn = () => {
        if (!disabled) scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        if (!disabled) scale.value = withSpring(1);
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            backgroundColor: withTiming(selected ? `${theme.colors.primary}10` : (disabled ? '#F3F4F6' : '#FFFFFF')),
            borderColor: withTiming(selected ? theme.colors.primary : '#E5E7EB'),
            opacity: withTiming(disabled ? 0.6 : 1)
        };
    });

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPress={disabled ? undefined : onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
        >
            <Animated.View style={[styles.selectionCard, displayDesc && styles.selectionCardWithDesc, animatedStyle]}>
                <View style={[
                    type === 'radio' ? styles.radioOuter : styles.checkboxOuter,
                    selected && type === 'checkbox' && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                    disabled && { borderColor: '#9CA3AF', backgroundColor: '#E5E7EB' },
                    displayDesc && { marginTop: 2 },
                ]}>
                    {selected && (
                        type === 'radio' ? (
                            <View style={[styles.radioInner, { backgroundColor: disabled ? '#9CA3AF' : theme.colors.primary }]} />
                        ) : (
                            <Ionicons name="checkmark" size={14} color={disabled ? '#9CA3AF' : "#FFFFFF"} />
                        )
                    )}
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[
                        styles.optionText,
                        { marginLeft: 0 },
                        selected && styles.optionTextSelected,
                        disabled && { color: '#9CA3AF' }
                    ]}>{parsed.title}</Text>
                    {displayDesc && (
                        <Text style={[
                            styles.optionDescription,
                            selected && { color: theme.colors.primary + 'AA' },
                            disabled && { color: '#9CA3AF' }
                        ]}>{displayDesc}</Text>
                    )}
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

// 3. Slider Component
const FormSlider = ({ value, min = 0, max = 100, step = 1, onChange, disabled = false }: {
    value: number,
    min?: number,
    max?: number,
    step?: number,
    onChange: (val: number) => void,
    disabled?: boolean
}) => {
    const [width, setWidth] = useState(0);
    const safeValue = isNaN(value) ? min : Math.min(Math.max(value, min), max);
    
    const getPercentage = (val: number) => {
        return ((val - min) / (max - min)) * 100;
    };

    const handleTouch = (evt: any) => {
        if (width === 0 || disabled) return;
        const locationX = evt.nativeEvent.locationX;
        const percentage = Math.min(Math.max(locationX / width, 0), 1);
        const rawValue = min + percentage * (max - min);
        // Apply step
        const steppedValue = Math.round(rawValue / step) * step;
        const finalValue = Math.min(Math.max(steppedValue, min), max);
        onChange(finalValue);
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => !disabled,
            onMoveShouldSetPanResponder: () => !disabled,
            onPanResponderGrant: (evt) => handleTouch(evt),
            onPanResponderMove: (evt) => handleTouch(evt),
            onPanResponderRelease: () => {
                // End interaction
            }
        })
    ).current;

    return (
        <View 
            style={[styles.sliderContainer, disabled && { opacity: 0.5 }]} 
            onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
            {...panResponder.panHandlers}
        >
            <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${getPercentage(safeValue)}%` }, disabled && { backgroundColor: '#9CA3AF' }]} />
            </View>
            <View style={[styles.sliderThumb, { left: `${getPercentage(safeValue)}%` }, disabled && { backgroundColor: '#F3F4F6' }]} />
            <Text style={[styles.sliderValue, disabled && { color: '#9CA3AF' }]}>{safeValue}</Text>
        </View>
    );
};

// 4. Color Picker Component
const FormColorPicker = ({ value, onChange, colors, disabled = false }: {
    value: string,
    onChange: (val: string) => void,
    colors?: string[],
    disabled?: boolean
}) => {
    const presetColors = colors || [
        '#FF453A', '#FF9F0A', '#FFD60A', '#32D74B', '#64D2FF', '#0A84FF', 
        '#5E5CE6', '#BF5AF2', '#FF375F', '#AC8E68', '#FFFFFF', '#000000'
    ];

    return (
        <View style={[styles.colorGrid, disabled && { opacity: 0.5 }]}>
            {presetColors.map((color, index) => (
                <TouchableOpacity
                    key={index}
                    style={[
                        styles.colorItem,
                        { backgroundColor: color },
                        value === color && styles.colorItemSelected
                    ]}
                    onPress={() => !disabled && onChange(color)}
                    disabled={disabled}
                >
                    {value === color && (
                        <Ionicons 
                            name="checkmark" 
                            size={16} 
                            color={['#FFFFFF', '#FFD60A', '#32D74B', '#64D2FF'].includes(color) ? '#000' : '#FFF'} 
                        />
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );
};

// 5. Rate Component
const FormRate = ({ value, max = 5, onChange, allowHalf = false, disabled = false }: {
    value: number,
    max?: number,
    onChange: (val: number) => void,
    allowHalf?: boolean,
    disabled?: boolean
}) => {
    const stars = Array.from({ length: max }, (_, i) => i + 1);
    
    return (
        <View style={[styles.rateContainer, disabled && { opacity: 0.6 }]}>
            {stars.map((star) => (
                <TouchableOpacity
                    key={star}
                    onPress={() => !disabled && onChange(star)}
                    style={styles.starItem}
                    disabled={disabled}
                >
                    <Ionicons 
                        name={value >= star ? "star" : (value >= star - 0.5 && allowHalf ? "star-half" : "star-outline")} 
                        size={32} 
                        color={value >= star - 0.5 ? (disabled ? "#9CA3AF" : "#FFD60A") : "#E5E7EB"} 
                    />
                </TouchableOpacity>
            ))}
            <Text style={[styles.rateText, disabled && { color: '#9CA3AF' }]}>{value > 0 ? `${value}分` : '未评分'}</Text>
        </View>
    );
};

// === Wizard Step Grouping ===

// Merged step definitions: combine related sections to keep step count at ~4
// terms+personal → "personal", payment+address → "payment", award+essay → "award"
const MERGED_SECTION_ORDER = ['personal', 'contact', 'payment', 'award'] as const;

const SECTION_ICONS: Record<string, string> = {
    personal: 'person-outline',
    contact: 'mail-outline',
    payment: 'card-outline',
    award: 'ribbon-outline',
};

const SECTION_TITLE_KEYS: Record<string, string> = {
    personal: 'form.wizard.steps.personal',
    contact: 'form.wizard.steps.contact',
    payment: 'form.wizard.steps.payment',
    award: 'form.wizard.steps.award',
};

const SECTION_FALLBACKS: Record<string, string> = {
    personal: 'Personal Info',
    contact: 'Contact',
    payment: 'Payment & Address',
    award: 'Award & Documents',
};

function classifyField(field: FormFieldSchema): string {
    if (field.section) return field.section;
    const key = (field.vModel || '').toLowerCase();
    const label = (field.label || '').toLowerCase();

    // terms → merge into personal
    if (/disclaimer|termsconfirm|agree|terms|条款|免责/.test(key + label)) return 'personal';
    if (/legalname|school|jobtitle|joindate|resignationdate|legal_name|姓名|学校|职位/.test(key + label)) return 'personal';
    if (/email|phone|vitamember|联系|邮箱|电话/.test(key + label)) return 'contact';
    // payment + address → merged into payment
    if (/paymentmethod|mailingoption|postageoption|payment|支付|邮寄/.test(key + label)) return 'payment';
    if (/addressline|city|state|zipcode|country|地址|城市|州|邮编/.test(key + label)) return 'payment';
    // award + essay → merged into award
    if (/awardlevel|packagetype|package|award|奖项|套餐/.test(key + label)) return 'award';
    if (/contributionessay|proofdocument|essay|proof|文书|证明/.test(key + label)) return 'award';
    // hasvitamember belongs in contact
    if (/hasvitamember|vita|member|会员/.test(key + label)) return 'contact';
    return 'award'; // default: put remaining fields in last step
}

function groupFieldsIntoSteps(fields: FormFieldSchema[]): FormStepConfig[] {
    if (fields.length <= 5) {
        return [{ id: 'all', titleKey: 'form.wizard.steps.other', iconName: 'list-outline', fields }];
    }

    const groups: Record<string, FormFieldSchema[]> = {};
    fields.forEach(field => {
        const section = classifyField(field);
        if (!groups[section]) groups[section] = [];
        groups[section].push(field);
    });

    const steps: FormStepConfig[] = [];
    for (const sectionId of MERGED_SECTION_ORDER) {
        if (groups[sectionId] && groups[sectionId].length > 0) {
            steps.push({
                id: sectionId,
                titleKey: SECTION_TITLE_KEYS[sectionId] || `form.wizard.steps.${sectionId}`,
                iconName: SECTION_ICONS[sectionId],
                fields: groups[sectionId],
            });
        }
    }

    // If only 1 step, no wizard needed
    if (steps.length <= 1) {
        return [{ id: 'all', titleKey: 'form.wizard.steps.other', iconName: 'list-outline', fields }];
    }

    return steps;
}

// === Main Component ===

import * as Haptics from 'expo-haptics';

// ... (previous imports)

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
    modelContent,
    onSubmit,
    submitLabel = '提交',
    loading = false,
    initialData = {},
    headerComponent,
    wizardMode = false,
}) => {
    const { t } = useTranslation();
    const scrollViewRef = useRef<ScrollView>(null);
    const fieldLayoutMap = useRef<Record<string, number>>({});
    const autoFilledKeys = useRef<Set<string>>(new Set(Object.keys(initialData).filter(k => initialData[k] !== undefined && initialData[k] !== '')));

    const [fields, setFields] = useState<FormFieldSchema[]>([]);
    const [formData, setFormData] = useState<any>(initialData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showDatePicker, setShowDatePicker] = useState<{ visible: boolean, fieldModel: string, mode: 'date' | 'time' }>({ visible: false, fieldModel: '', mode: 'date' });
    const [selectModalField, setSelectModalField] = useState<FormFieldSchema | null>(null);
    const [currentStep, setCurrentStep] = useState(0);

    // Wizard steps — filter always-hidden fields before grouping so we don't get empty steps
    const steps = useMemo(() => {
        if (!wizardMode || fields.length === 0) return [];
        const alwaysHidden = new Set(['postageOption', 'packageType', 'package']);
        const filteredFields = fields.filter(f => !alwaysHidden.has(f.vModel));
        return groupFieldsIntoSteps(filteredFields);
    }, [wizardMode, fields]);

    const isWizardActive = wizardMode && steps.length > 1;

    // Animation value for shake effect
    const buttonShake = useSharedValue(0);

    const buttonAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: buttonShake.value }]
        };
    });

    const triggerShake = () => {
        buttonShake.value = withSequence(
            withTiming(-10, { duration: 50 }),
            withRepeat(withTiming(10, { duration: 100 }), 3, true),
            withTiming(0, { duration: 50 })
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    };

    // 🔧 解析 modelContent JSON 字符串为 fields 数组
    useEffect(() => {
        if (modelContent) {
            try {
                const parsed = JSON.parse(modelContent);
                // Support both { fields: [...] } and { pages: [{ components: [...] }] } formats
                const rawFields = parsed.fields
                    || (parsed.pages && parsed.pages[0] && parsed.pages[0].components)
                    || [];
                if (Array.isArray(rawFields) && rawFields.length > 0) {
                    // Normalize fields recursively (handles row container children)
                    const normalizeField = (f: any): any => {
                        const normalized = (!f.options && f.slot?.options)
                            ? { ...f, options: f.slot.options }
                            : { ...f };
                        // Remap date/time range: backend uses el-date-picker+type=daterange
                        // but renderer expects el-date-range / el-time-range tags
                        if (normalized.tag === 'el-date-picker' && (normalized.type === 'daterange' || normalized.tagIcon === 'date-range')) {
                            normalized.tag = 'el-date-range';
                        }
                        if (normalized.tag === 'el-time-picker' && (normalized['is-range'] || normalized.tagIcon === 'time-range')) {
                            normalized.tag = 'el-time-range';
                        }
                        // Normalize kebab-case props to camelCase
                        if (normalized['allow-half'] !== undefined) normalized.allowHalf = normalized['allow-half'];
                        if (normalized['show-word-limit'] !== undefined) normalized.showWordLimit = normalized['show-word-limit'];
                        if (normalized['show-password'] !== undefined) normalized.showPassword = normalized['show-password'];
                        if (normalized['prefix-icon'] !== undefined) normalized.prefixIcon = normalized['prefix-icon'];
                        if (normalized['active-text'] !== undefined) normalized.activeText = normalized['active-text'];
                        if (normalized['inactive-text'] !== undefined) normalized.inactiveText = normalized['inactive-text'];
                        // Recursively normalize row container children
                        if (normalized.children && Array.isArray(normalized.children)) {
                            normalized.children = normalized.children.map(normalizeField);
                        }
                        return normalized;
                    };
                    const normalizedFields = rawFields.map(normalizeField);
                    setFields(normalizedFields);
                    
                    // Initialize default values if not present in initialData
                    const defaultValues: any = {};
                    normalizedFields.forEach((field: FormFieldSchema) => {
                        if (field.defaultValue !== undefined && initialData[field.vModel] === undefined) {
                            defaultValues[field.vModel] = field.defaultValue;
                        }
                        // Initialize el-input-number fields with min value if not set
                        if (field.tag === 'el-input-number' && initialData[field.vModel] === undefined && defaultValues[field.vModel] === undefined) {
                            defaultValues[field.vModel] = typeof field.min === 'number' ? field.min : 0;
                        }
                    });
                    
                    if (Object.keys(defaultValues).length > 0) {
                        setFormData((prev: any) => ({ ...prev, ...defaultValues }));
                    }
                }
            } catch (error) {
                console.error('解析 modelContent 失败:', error);
            }
        }
    }, [modelContent]);

    // 🔧 处理表单字段值变化
    // Check if form has ticketQty + unitPrice combo for auto-calculation
    const hasTicketPricing = useMemo(() => {
        const vModels = fields.map(f => f.vModel);
        return vModels.includes('ticketQty') && vModels.includes('unitPrice');
    }, [fields]);

    const handleChange = (vModel: string, value: any) => {
        setFormData((prev: any) => {
            const next = { ...prev, [vModel]: value };
            // Auto-calculate totalAmount when ticketQty or unitPrice changes
            if (hasTicketPricing && (vModel === 'ticketQty' || vModel === 'unitPrice')) {
                const qty = Number(vModel === 'ticketQty' ? value : next.ticketQty) || 0;
                const price = Number(vModel === 'unitPrice' ? value : next.unitPrice) || 0;
                next.totalAmount = Math.round(qty * price * 100) / 100;
            }
            return next;
        });
        // 清除该字段的错误
        if (errors[vModel]) {
            setErrors(prev => ({ ...prev, [vModel]: '' }));
        }
    };

    const validateFields = useCallback((fieldsToValidate: FormFieldSchema[]) => {
        const newErrors: Record<string, string> = {};
        let isValid = true;
        let firstErrorModel = '';

        // Flatten row container children into validation list
        const flatFields: FormFieldSchema[] = [];
        fieldsToValidate.forEach(field => {
            if ((field.layout === 'rowFormItem' || (field.children && Array.isArray(field.children))) && field.children) {
                field.children.forEach(child => flatFields.push(child));
            } else {
                flatFields.push(field);
            }
        });

        flatFields.forEach(field => {
            // Skip hidden/invisible fields
            if (HIDDEN_FIELDS.has(field.vModel)) return;

            // Schema-driven condition check
            if (field.changeTag && typeof field.changeTag === 'string') {
                const eqIdx = field.changeTag.indexOf('=');
                if (eqIdx > 0) {
                    const depField = field.changeTag.substring(0, eqIdx);
                    const showVal = field.changeTag.substring(eqIdx + 1);
                    if (formData[depField] !== showVal) return;
                }
            }

            // Legacy hardcoded condition check
            const hardcoded = HARDCODED_CONDITIONALS[field.vModel];
            if (hardcoded && formData[hardcoded.dependsOn] !== hardcoded.showWhen) return;

            const effectiveRequired = patchFieldRequiredness(field).required;

            const val = formData[field.vModel];

            // 1. Required Check
            if (effectiveRequired) {
                if (val === undefined || val === null || (typeof val === 'string' && !val.trim()) || (Array.isArray(val) && (val.length === 0 || val.every((v: any) => !v)))) {
                    newErrors[field.vModel] = t('form.validation.required', { label: field.label, defaultValue: `${field.label} is required` });
                    if (!firstErrorModel) firstErrorModel = field.vModel;
                    isValid = false;
                }
            }

            // 2. RegExp Check
            if (!newErrors[field.vModel] && field.regList && field.regList.length > 0 && val) {
                for (const reg of field.regList) {
                    if (reg.pattern) {
                        try {
                            let pattern = reg.pattern;
                            if (pattern.startsWith('/') && pattern.lastIndexOf('/') > 0) {
                                pattern = pattern.substring(1, pattern.lastIndexOf('/'));
                            }

                            const regex = new RegExp(pattern);
                            if (!regex.test(String(val))) {
                                newErrors[field.vModel] = reg.message || t('form.validation.format_error', { label: field.label, defaultValue: `${field.label} format is incorrect` });
                                if (!firstErrorModel) firstErrorModel = field.vModel;
                                isValid = false;
                                break;
                            }
                        } catch (e) {
                            console.warn('Regex validation error:', e);
                        }
                    }
                }
            }
        });

        // Merge errors: clear errors for validated fields, set new ones
        setErrors(prev => {
            const updated = { ...prev };
            fieldsToValidate.forEach(f => { delete updated[f.vModel]; });
            return { ...updated, ...newErrors };
        });

        // Scroll to first error field
        if (!isValid && firstErrorModel && fieldLayoutMap.current[firstErrorModel] !== undefined) {
            setTimeout(() => {
                scrollViewRef.current?.scrollTo({
                    y: Math.max(0, fieldLayoutMap.current[firstErrorModel] - 20),
                    animated: true,
                });
            }, 350);
        }

        return isValid;
    }, [formData, t]);

    const validate = useCallback(() => {
        return validateFields(fields);
    }, [validateFields, fields]);

    const handleSubmit = () => {
        if (validate()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSubmit(formData);
        } else {
            triggerShake();
        }
    };

    const handleWizardNext = useCallback(() => {
        if (!isWizardActive) return;
        const currentFields = steps[currentStep].fields;
        if (validateFields(currentFields)) {
            if (currentStep < steps.length - 1) {
                Haptics.selectionAsync();
                setCurrentStep(prev => prev + 1);
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            } else {
                // Last step — full validate and submit
                if (validate()) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onSubmit(formData);
                } else {
                    triggerShake();
                }
            }
        } else {
            triggerShake();
        }
    }, [isWizardActive, steps, currentStep, validateFields, validate, onSubmit, formData, triggerShake]);

    const handleWizardPrevious = useCallback(() => {
        if (currentStep > 0) {
            Haptics.selectionAsync();
            setCurrentStep(prev => prev - 1);
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }
    }, [currentStep]);

    // ... (renderField same as before)

    // Helper: resolve range field model (e.g. "dateRange__start" → { baseModel: "dateRange", rangeIdx: 0 })
    const parseRangeFieldModel = (fieldModel: string): { baseModel: string; rangeIdx: number } | null => {
        if (fieldModel.endsWith('__start')) return { baseModel: fieldModel.slice(0, -7), rangeIdx: 0 };
        if (fieldModel.endsWith('__end')) return { baseModel: fieldModel.slice(0, -5), rangeIdx: 1 };
        return null;
    };

    const getDatePickerValue = (): Date => {
        const fieldModel = showDatePicker.fieldModel;
        if (!fieldModel) return new Date();

        // Check if this is a range sub-field
        const rangeParts = parseRangeFieldModel(fieldModel);
        let fieldVal: any;
        if (rangeParts) {
            const rangeArr = formData[rangeParts.baseModel];
            fieldVal = Array.isArray(rangeArr) ? rangeArr[rangeParts.rangeIdx] : null;
        } else {
            fieldVal = formData[fieldModel];
        }

        if (fieldVal) {
            try {
                const parsed = new Date(fieldVal);
                if (!isNaN(parsed.getTime())) return parsed;
            } catch {}
        }
        return new Date();
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(prev => ({ ...prev, visible: false }));
        }

        if (selectedDate && showDatePicker.fieldModel) {
            // Simple format based on mode
            let formattedValue = '';
            if (showDatePicker.mode === 'date') {
                formattedValue = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
            } else {
                const hours = selectedDate.getHours().toString().padStart(2, '0');
                const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
                formattedValue = `${hours}:${minutes}`;
            }

            // Check if this is a range sub-field
            const rangeParts = parseRangeFieldModel(showDatePicker.fieldModel);
            if (rangeParts) {
                const currentRange = Array.isArray(formData[rangeParts.baseModel])
                    ? [...formData[rangeParts.baseModel]]
                    : ['', ''];
                currentRange[rangeParts.rangeIdx] = formattedValue;
                handleChange(rangeParts.baseModel, currentRange);
            } else {
                handleChange(showDatePicker.fieldModel, formattedValue);
            }
        }
    };

    const renderFieldWithLayout = (field: FormFieldSchema, index: number) => {
        return (
            <View
                key={field.vModel || index}
                onLayout={(e) => {
                    fieldLayoutMap.current[field.vModel] = e.nativeEvent.layout.y;
                }}
            >
                {renderField(field, index)}
            </View>
        );
    };

    const renderField = (field: FormFieldSchema, index: number) => {
        const value = formData[field.vModel];
        const isDisabled = field.disabled || field.readonly;

        switch (field.tag) {
            case 'el-input':
            case 'el-textarea':
                return (
                    <FormInput
                        key={index}
                        field={field}
                        value={value}
                        onChange={(text) => handleChange(field.vModel, text)}
                        error={errors[field.vModel]}
                        isAutoFilled={autoFilledKeys.current.has(field.vModel)}
                    />
                );

            case 'el-radio-group': {
                // Check if any option has a long description or only 1 option — use full-width layout
                const optionCount = (field.options || []).length;
                const hasLongLabels = optionCount <= 1 || (field.options || []).some(opt => {
                    const parsed = parseOptionLabel(opt.label);
                    return !!parsed.description || opt.label.length > 30;
                });
                // Check if any option is a fill-in type
                const fillInOpts = (field.options || []).filter(opt => isFillInOption(opt.label));
                const selectedFillIn = fillInOpts.find(opt => value === opt.value);
                const customKey = `${field.vModel}_custom`;

                return (
                    <View key={index} style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{field.label}</Text>
                            {field.required && <View style={styles.requiredDot} />}
                        </View>
                        <View style={hasLongLabels ? styles.fullWidthContainer : styles.gridContainer}>
                            {(field.options || []).map((opt, i) => (
                                <View key={i} style={hasLongLabels ? styles.fullWidthItem : styles.gridItem}>
                                    <SelectionCard
                                        label={opt.label}
                                        selected={value === opt.value}
                                        onPress={() => handleChange(field.vModel, opt.value)}
                                        type="radio"
                                        disabled={isDisabled}
                                        description={field.description}
                                    />
                                </View>
                            ))}
                        </View>
                        {/* Conditional text input for fill-in options */}
                        {selectedFillIn && (
                            <Animated.View entering={FadeInUp.duration(250)} style={styles.fillInInputWrap}>
                                <TextInput
                                    style={styles.fillInInput}
                                    value={formData[customKey] || ''}
                                    onChangeText={(text) => handleChange(customKey, text)}
                                    placeholder={t('form.fill_in_placeholder', { defaultValue: 'Please enter...' })}
                                    placeholderTextColor="#9CA3AF"
                                    returnKeyType="done"
                                    blurOnSubmit
                                    onSubmitEditing={() => Keyboard.dismiss()}
                                    inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
                                />
                            </Animated.View>
                        )}
                        {errors[field.vModel] && (
                            <Animated.View entering={FadeInUp.duration(300)} style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color={theme.colors.danger} />
                                <Text style={styles.errorText}>{errors[field.vModel]}</Text>
                            </Animated.View>
                        )}
                    </View>
                );
            }

            case 'el-checkbox-group': {
                const currentValues = Array.isArray(value) ? value : [];
                const cbHasLongLabels = (field.options || []).some(opt => {
                    const parsed = parseOptionLabel(opt.label);
                    return !!parsed.description || opt.label.length > 30;
                });
                // Single-option checkboxes (e.g. terms agreement) always full-width
                const cbFullWidth = cbHasLongLabels || (field.options || []).length === 1;
                return (
                    <View key={index} style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{field.label}</Text>
                            {field.required && <View style={styles.requiredDot} />}
                            {currentValues.length > 0 &&
                                <Text style={styles.selectedCount}>已选 {currentValues.length} 项</Text>
                            }
                        </View>
                        <View style={cbFullWidth ? styles.fullWidthContainer : styles.gridContainer}>
                            {(field.options || []).map((opt, i) => {
                                const isSelected = currentValues.includes(opt.value);
                                return (
                                    <View key={i} style={cbFullWidth ? styles.fullWidthItem : styles.gridItem}>
                                        <SelectionCard
                                            label={opt.label}
                                            selected={isSelected}
                                            onPress={() => {
                                                const newVals = isSelected
                                                    ? currentValues.filter((v: string) => v !== opt.value)
                                                    : [...currentValues, opt.value];
                                                handleChange(field.vModel, newVals);
                                            }}
                                            type="checkbox"
                                            disabled={isDisabled}
                                        />
                                    </View>
                                )
                            })}
                        </View>
                        {errors[field.vModel] && (
                            <Animated.View entering={FadeInUp.duration(300)} style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color={theme.colors.danger} />
                                <Text style={styles.errorText}>{errors[field.vModel]}</Text>
                            </Animated.View>
                        )}
                    </View>
                );
            }

            case 'upload':
                const uploadType = field.accept || (field.label.includes('视频') || field.label.includes('Video') ? 'video' : 'image');
                // Show helper description for proof/evidence upload fields
                const isProofField = /proof|证明|材料|evidence/i.test((field.vModel || '') + (field.label || ''));

                return (
                    <View key={index} style={[styles.fieldContainer, isDisabled && { opacity: 0.6 }]} pointerEvents={isDisabled ? 'none' : 'auto'}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{field.label}</Text>
                            {field.required && <View style={styles.requiredDot} />}
                        </View>
                        {(field.description || isProofField) && (
                            <Text style={styles.fieldHelperText}>
                                {field.description || t('form.proof_upload_hint', { defaultValue: 'Please ask your club/division president for a screenshot of your service record or other supporting documents.' })}
                            </Text>
                        )}
                        <View style={[
                            styles.uploadWrapper,
                            errors[field.vModel] && { borderColor: theme.colors.danger }
                        ]}>
                            <MediaUploader
                                type={uploadType === 'video' ? 'video' : 'image'}
                                label={field.label}
                                required={field.required}
                                value={value}
                                onUploadSuccess={(url) => handleChange(field.vModel, url)}
                            />
                        </View>
                        {errors[field.vModel] && (
                            <Animated.View entering={FadeInUp.duration(300)} style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color={theme.colors.danger} />
                                <Text style={styles.errorText}>{errors[field.vModel]}</Text>
                            </Animated.View>
                        )}
                    </View>
                );

            // 🔧 新增：计数器类型支持
            case 'el-input-number': {
                const numMin = typeof field.min === 'number' ? field.min : 0;
                const numMax = typeof field.max === 'number' ? field.max : Infinity;
                const numStep = typeof field.step === 'number' ? field.step : 1;
                const numValue = typeof value === 'number' ? value : (numMin || 0);

                // Disabled number field → show as price tag (e.g. unitPrice)
                if (isDisabled) {
                    const isPrice = field.vModel === 'unitPrice' || (field.label || '').toLowerCase().includes('price') || (field.label || '').includes('单价');
                    return (
                        <View key={index} style={styles.fieldContainer}>
                            <View style={styles.labelContainer}>
                                <Text style={styles.label}>{field.label}</Text>
                            </View>
                            <View style={{ backgroundColor: '#FFF7ED', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FFEDD5' }}>
                                {isPrice && <Text style={{ fontSize: 18, fontWeight: '700', color: '#FF6B35', marginRight: 2 }}>$</Text>}
                                <Text style={{ fontSize: 18, fontWeight: '700', color: '#FF6B35' }}>{numValue}</Text>
                                {isPrice && <Text style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 8 }}>{t('activities.ticket.per_ticket', '/ ticket')}</Text>}
                            </View>
                        </View>
                    );
                }

                return (
                    <View key={index} style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{field.label}</Text>
                            {field.required && <View style={styles.requiredDot} />}
                        </View>
                        <View style={styles.numberInputContainer}>
                            <TouchableOpacity
                                style={styles.numberButton}
                                onPress={() => handleChange(field.vModel, Math.max(numMin, numValue - numStep))}
                                disabled={numValue <= numMin}
                            >
                                <Ionicons name="remove" size={20} color={numValue <= numMin ? '#9CA3AF' : theme.colors.text.primary} />
                            </TouchableOpacity>
                            <Text style={styles.numberValue}>{numValue}</Text>
                            <TouchableOpacity
                                style={styles.numberButton}
                                onPress={() => handleChange(field.vModel, Math.min(numMax, numValue + numStep))}
                                disabled={numValue >= numMax}
                            >
                                <Ionicons name="add" size={20} color={numValue >= numMax ? '#9CA3AF' : theme.colors.text.primary} />
                            </TouchableOpacity>
                        </View>
                        {errors[field.vModel] && (
                            <Animated.View entering={FadeInUp.duration(300)} style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color={theme.colors.danger} />
                                <Text style={styles.errorText}>{errors[field.vModel]}</Text>
                            </Animated.View>
                        )}
                    </View>
                );
            }

            case 'el-select': {
                const selectedOption = (field.options || []).find(o => o.value === value);
                return (
                    <View key={index} style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{field.label}</Text>
                            {field.required && <View style={styles.requiredDot} />}
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.selectTrigger,
                                errors[field.vModel] && { borderColor: theme.colors.danger },
                                isDisabled && { backgroundColor: '#F9FAFB', opacity: 0.6 },
                            ]}
                            onPress={() => !isDisabled && setSelectModalField(field)}
                            disabled={isDisabled}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.selectTriggerText,
                                !selectedOption && { color: '#9CA3AF' },
                            ]}>
                                {selectedOption?.label || field.placeholder || t('form.placeholder_select', { label: field.label, defaultValue: `Select ${field.label}` })}
                            </Text>
                            <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                        {errors[field.vModel] && (
                            <Animated.View entering={FadeInUp.duration(300)} style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color={theme.colors.danger} />
                                <Text style={styles.errorText}>{errors[field.vModel]}</Text>
                            </Animated.View>
                        )}
                    </View>
                );
            }

            // 🔧 新增：开关 Switch
            case 'el-switch':
                return (
                    <View key={index} style={styles.fieldContainer}>
                        <View style={[styles.switchContainer, isDisabled && { backgroundColor: '#F3F4F6' }]}>
                            <View>
                                <View style={styles.labelContainer}>
                                    <Text style={styles.label}>{field.label}</Text>
                                    {field.required && <View style={styles.requiredDot} />}
                                </View>
                                {(field.activeText || field.inactiveText) && (
                                    <Text style={styles.switchDesc}>
                                        {value ? field.activeText : field.inactiveText}
                                    </Text>
                                )}
                            </View>
                            <Switch
                                value={!!value}
                                onValueChange={(val) => handleChange(field.vModel, val)}
                                trackColor={{ false: '#E5E7EB', true: theme.colors.primary }}
                                thumbColor={'#FFFFFF'}
                                disabled={isDisabled}
                            />
                        </View>
                        {errors[field.vModel] && (
                            <Animated.View entering={FadeInUp.duration(300)} style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color={theme.colors.danger} />
                                <Text style={styles.errorText}>{errors[field.vModel]}</Text>
                            </Animated.View>
                        )}
                    </View>
                );

            // 🔧 新增：滑块 Slider
            case 'el-slider':
                return (
                    <View key={index} style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{field.label}</Text>
                            {field.required && <View style={styles.requiredDot} />}
                        </View>
                        <FormSlider
                            value={typeof value === 'number' ? value : (field.min || 0)}
                            min={field.min || 0}
                            max={field.max || 100}
                            step={field.step || 1}
                            onChange={(val) => handleChange(field.vModel, val)}
                            disabled={isDisabled}
                        />
                        {errors[field.vModel] && (
                            <Animated.View entering={FadeInUp.duration(300)} style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color={theme.colors.danger} />
                                <Text style={styles.errorText}>{errors[field.vModel]}</Text>
                            </Animated.View>
                        )}
                    </View>
                );

            // 🔧 新增：评分 Rate
            case 'el-rate':
                return (
                    <View key={index} style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{field.label}</Text>
                            {field.required && <View style={styles.requiredDot} />}
                        </View>
                        <FormRate
                            value={typeof value === 'number' ? value : 0}
                            max={field.max || 5}
                            allowHalf={field.allowHalf}
                            onChange={(val) => handleChange(field.vModel, val)}
                            disabled={isDisabled}
                        />
                        {errors[field.vModel] && (
                            <Animated.View entering={FadeInUp.duration(300)} style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color={theme.colors.danger} />
                                <Text style={styles.errorText}>{errors[field.vModel]}</Text>
                            </Animated.View>
                        )}
                    </View>
                );

            // 🔧 新增：颜色选择 ColorPicker
            case 'el-color-picker':
                return (
                    <View key={index} style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{field.label}</Text>
                            {field.required && <View style={styles.requiredDot} />}
                        </View>
                        <FormColorPicker
                            value={value || ''}
                            onChange={(val) => handleChange(field.vModel, val)}
                            colors={field.colors}
                            disabled={isDisabled}
                        />
                        {errors[field.vModel] && (
                            <Animated.View entering={FadeInUp.duration(300)} style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color={theme.colors.danger} />
                                <Text style={styles.errorText}>{errors[field.vModel]}</Text>
                            </Animated.View>
                        )}
                    </View>
                );

            // 🔧 新增：日期/时间选择
            case 'el-date-picker':
            case 'el-time-picker':
                const isTime = field.tag === 'el-time-picker';
                return (
                    <View key={index} style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{field.label}</Text>
                            {field.required && <View style={styles.requiredDot} />}
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.inputWrapper,
                                { paddingVertical: 14, paddingHorizontal: 16 },
                                isDisabled && { backgroundColor: '#F3F4F6' }
                            ]}
                            onPress={() => !isDisabled && setShowDatePicker({ 
                                visible: true, 
                                fieldModel: field.vModel, 
                                mode: isTime ? 'time' : 'date' 
                            })}
                            disabled={isDisabled}
                        >
                            <Ionicons 
                                name={isTime ? "time-outline" : "calendar-outline"} 
                                size={20} 
                                color={theme.colors.text.secondary} 
                                style={{ marginRight: 10 }}
                            />
                            <Text style={[
                                styles.input, 
                                { paddingVertical: 0, paddingRight: 0 },
                                !value && { color: '#9CA3AF' }
                            ]}>
                                {value || (field.placeholder || t('form.placeholder_select', { label: field.label, defaultValue: `Select ${field.label}` }))}
                            </Text>
                        </TouchableOpacity>
                        
                        {errors[field.vModel] && (
                            <Animated.View entering={FadeInUp.duration(300)} style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color={theme.colors.danger} />
                                <Text style={styles.errorText}>{errors[field.vModel]}</Text>
                            </Animated.View>
                        )}
                    </View>
                );

            // 🔧 新增：日期范围选择
            case 'el-date-range': {
                const rangeValue = Array.isArray(value) ? value : ['', ''];
                return (
                    <View key={index} style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{field.label}</Text>
                            {field.required && <View style={styles.requiredDot} />}
                        </View>
                        <View style={styles.rangePickerRow}>
                            <TouchableOpacity
                                style={[styles.rangePickerHalf, isDisabled && { backgroundColor: '#F3F4F6' }]}
                                onPress={() => !isDisabled && setShowDatePicker({
                                    visible: true,
                                    fieldModel: `${field.vModel}__start`,
                                    mode: 'date'
                                })}
                                disabled={isDisabled}
                            >
                                <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} style={{ marginRight: 6 }} />
                                <Text style={[styles.rangePickerText, !rangeValue[0] && { color: '#9CA3AF' }]}>
                                    {rangeValue[0] || t('form.start_date', { defaultValue: 'Start date' })}
                                </Text>
                            </TouchableOpacity>
                            <Text style={styles.rangeSeparator}>—</Text>
                            <TouchableOpacity
                                style={[styles.rangePickerHalf, isDisabled && { backgroundColor: '#F3F4F6' }]}
                                onPress={() => !isDisabled && setShowDatePicker({
                                    visible: true,
                                    fieldModel: `${field.vModel}__end`,
                                    mode: 'date'
                                })}
                                disabled={isDisabled}
                            >
                                <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} style={{ marginRight: 6 }} />
                                <Text style={[styles.rangePickerText, !rangeValue[1] && { color: '#9CA3AF' }]}>
                                    {rangeValue[1] || t('form.end_date', { defaultValue: 'End date' })}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {errors[field.vModel] && (
                            <Animated.View entering={FadeInUp.duration(300)} style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color={theme.colors.danger} />
                                <Text style={styles.errorText}>{errors[field.vModel]}</Text>
                            </Animated.View>
                        )}
                    </View>
                );
            }

            // 🔧 新增：时间范围选择
            case 'el-time-range': {
                const timeRangeValue = Array.isArray(value) ? value : ['', ''];
                return (
                    <View key={index} style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{field.label}</Text>
                            {field.required && <View style={styles.requiredDot} />}
                        </View>
                        <View style={styles.rangePickerRow}>
                            <TouchableOpacity
                                style={[styles.rangePickerHalf, isDisabled && { backgroundColor: '#F3F4F6' }]}
                                onPress={() => !isDisabled && setShowDatePicker({
                                    visible: true,
                                    fieldModel: `${field.vModel}__start`,
                                    mode: 'time'
                                })}
                                disabled={isDisabled}
                            >
                                <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} style={{ marginRight: 6 }} />
                                <Text style={[styles.rangePickerText, !timeRangeValue[0] && { color: '#9CA3AF' }]}>
                                    {timeRangeValue[0] || t('form.start_time', { defaultValue: 'Start time' })}
                                </Text>
                            </TouchableOpacity>
                            <Text style={styles.rangeSeparator}>—</Text>
                            <TouchableOpacity
                                style={[styles.rangePickerHalf, isDisabled && { backgroundColor: '#F3F4F6' }]}
                                onPress={() => !isDisabled && setShowDatePicker({
                                    visible: true,
                                    fieldModel: `${field.vModel}__end`,
                                    mode: 'time'
                                })}
                                disabled={isDisabled}
                            >
                                <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} style={{ marginRight: 6 }} />
                                <Text style={[styles.rangePickerText, !timeRangeValue[1] && { color: '#9CA3AF' }]}>
                                    {timeRangeValue[1] || t('form.end_time', { defaultValue: 'End time' })}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {errors[field.vModel] && (
                            <Animated.View entering={FadeInUp.duration(300)} style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color={theme.colors.danger} />
                                <Text style={styles.errorText}>{errors[field.vModel]}</Text>
                            </Animated.View>
                        )}
                    </View>
                );
            }

            // 🔧 新增：级联选择器 (降级为多级 select)
            case 'el-cascader': {
                const cascaderValue = Array.isArray(value) ? value.join(' / ') : (value || '');
                return (
                    <View key={index} style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{field.label}</Text>
                            {field.required && <View style={styles.requiredDot} />}
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.selectTrigger,
                                errors[field.vModel] && { borderColor: theme.colors.danger },
                                isDisabled && { backgroundColor: '#F9FAFB', opacity: 0.6 },
                            ]}
                            onPress={() => !isDisabled && setSelectModalField(field)}
                            disabled={isDisabled}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.selectTriggerText,
                                !cascaderValue && { color: '#9CA3AF' },
                            ]}>
                                {cascaderValue || field.placeholder || t('form.placeholder_select', { label: field.label, defaultValue: `Select ${field.label}` })}
                            </Text>
                            <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                        {errors[field.vModel] && (
                            <Animated.View entering={FadeInUp.duration(300)} style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color={theme.colors.danger} />
                                <Text style={styles.errorText}>{errors[field.vModel]}</Text>
                            </Animated.View>
                        )}
                    </View>
                );
            }

            case 'text-display': {
                // 只读文本展示
                return (
                    <View key={index} style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{field.label}</Text>
                        </View>
                        <Text style={{ fontSize: 15, color: '#374151', lineHeight: 22, paddingVertical: 8 }}>
                            {String(field.defaultValue ?? value ?? '')}
                        </Text>
                    </View>
                );
            }

            case 'price': {
                // 价格输入 - 数字输入 + 货币符号
                const currencySymbol = field.prepend === '¥' || field.prepend === 'CNY' ? '¥' : '$';
                return (
                    <View key={index} style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{field.label}</Text>
                            {field.required && <View style={styles.requiredDot} />}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151', marginRight: 6 }}>
                                {currencySymbol}
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    { flex: 1 },
                                    errors[field.vModel] && { borderColor: theme.colors.danger },
                                    isDisabled && { backgroundColor: '#F9FAFB', opacity: 0.6 },
                                ]}
                                value={value != null ? String(value) : ''}
                                onChangeText={(text) => {
                                    const numeric = text.replace(/[^0-9.]/g, '');
                                    handleChange(field.vModel, numeric);
                                }}
                                keyboardType="decimal-pad"
                                placeholder={field.placeholder || '0.00'}
                                placeholderTextColor="#9CA3AF"
                                editable={!isDisabled}
                                inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
                            />
                        </View>
                        {errors[field.vModel] && (
                            <Animated.View entering={FadeInUp.duration(300)} style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color={theme.colors.danger} />
                                <Text style={styles.errorText}>{errors[field.vModel]}</Text>
                            </Animated.View>
                        )}
                    </View>
                );
            }

            case 'image-display': {
                // 只读图片展示
                const imageUrl = String(field.defaultValue ?? value ?? '');
                return (
                    <View key={index} style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{field.label}</Text>
                        </View>
                        {imageUrl ? (
                            <Image
                                source={{ uri: imageUrl }}
                                style={{ width: '100%', height: 200, borderRadius: 12 }}
                                resizeMode="contain"
                            />
                        ) : (
                            <Text style={{ fontSize: 14, color: '#9CA3AF', paddingVertical: 8 }}>
                                {t('form.no_image', { defaultValue: 'No image' })}
                            </Text>
                        )}
                    </View>
                );
            }

            // Desc / span: pure text display component (notices, disclaimers, etc.)
            case 'span':
            case 'desc': {
                const descText = field.defaultValue || field.label || '';
                if (!descText) return null;
                return (
                    <View key={index} style={styles.fieldContainer}>
                        {field.label && field.tag !== 'span' && (
                            <Text style={styles.label}>{field.label}</Text>
                        )}
                        {field.label && field.tag === 'span' && (
                            <Text style={[styles.label, { marginBottom: 8 }]}>{field.label}</Text>
                        )}
                        <View style={{ backgroundColor: '#F9F9F9', borderRadius: 10, padding: 12 }}>
                            <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 20 }}>{field.defaultValue || ''}</Text>
                        </View>
                    </View>
                );
            }

            default: {
                // 🔧 Row container: detect by layout or children presence
                if (field.layout === 'rowFormItem' || (field.children && Array.isArray(field.children) && field.children.length > 0)) {
                    const children = field.children || [];
                    const totalSpan = children.reduce((sum: number, c: FormFieldSchema) => sum + (c.span || 12), 0);
                    return (
                        <View key={field.vModel || `row-${index}`} style={styles.rowContainer}>
                            {children.filter(isFieldVisible).map((child: FormFieldSchema, ci: number) => {
                                const childSpan = child.span || 12;
                                const widthPercent = Math.min((childSpan / Math.max(totalSpan, 24)) * 100, 100);
                                return (
                                    <View
                                        key={child.vModel || `row-child-${ci}`}
                                        style={[styles.rowChild, { width: `${widthPercent}%` as any }]}
                                        onLayout={(e) => {
                                            if (child.vModel) {
                                                fieldLayoutMap.current[child.vModel] = e.nativeEvent.layout.y;
                                            }
                                        }}
                                    >
                                        {renderField(patchFieldRequiredness(child), ci)}
                                    </View>
                                );
                            })}
                        </View>
                    );
                }
                return null;
            }
        }
    };

    // Fields to always hide
    const HIDDEN_FIELDS = new Set(['postageOption', 'packageType', 'package']);

    // Hardcoded conditional visibility rules (legacy fallback)
    const HARDCODED_CONDITIONALS: Record<string, { dependsOn: string; showWhen: string }> = {
        vitaMemberId: { dependsOn: 'hasVitaMemberId', showWhen: 'yes' },
    };

    // Parse schema-driven changeTag condition (format: "vModel=value")
    const parseChangeTag = useCallback((changeTag?: string | boolean): { dependsOn: string; showWhen: string } | null => {
        if (!changeTag || typeof changeTag !== 'string') return null;
        const eqIdx = changeTag.indexOf('=');
        if (eqIdx <= 0) return null;
        return { dependsOn: changeTag.substring(0, eqIdx), showWhen: changeTag.substring(eqIdx + 1) };
    }, []);

    // Check if a field should be visible based on condition display rules
    const isFieldVisible = useCallback((field: FormFieldSchema): boolean => {
        const key = field.vModel;
        if (HIDDEN_FIELDS.has(key)) return false;

        // Schema-driven condition (from changeTag property)
        const schemaCondition = parseChangeTag(field.changeTag);
        if (schemaCondition) {
            return formData[schemaCondition.dependsOn] === schemaCondition.showWhen;
        }

        // Legacy hardcoded conditions
        const hardcoded = HARDCODED_CONDITIONALS[key];
        if (hardcoded) {
            return formData[hardcoded.dependsOn] === hardcoded.showWhen;
        }

        return true;
    }, [formData, parseChangeTag]);

    // Filter fields: remove hidden ones and apply conditional visibility
    const filterVisibleFields = useCallback((fieldsToFilter: FormFieldSchema[]) => {
        return fieldsToFilter.filter(isFieldVisible);
    }, [isFieldVisible]);

    // Patch required based on visibility (conditional fields only required when visible)
    const patchFieldRequiredness = useCallback((field: FormFieldSchema): FormFieldSchema => {
        // Schema-driven condition
        const schemaCondition = parseChangeTag(field.changeTag);
        if (schemaCondition) {
            const isVisible = formData[schemaCondition.dependsOn] === schemaCondition.showWhen;
            if (field.required && !isVisible) return { ...field, required: false };
            return field;
        }
        // Legacy hardcoded
        if (field.vModel === 'vitaMemberId') {
            return { ...field, required: formData['hasVitaMemberId'] === 'yes' };
        }
        return field;
    }, [formData, parseChangeTag]);

    // Determine which fields to render
    const rawVisibleFields = isWizardActive ? steps[currentStep]?.fields || [] : fields;
    const visibleFields = filterVisibleFields(rawVisibleFields).map(patchFieldRequiredness);
    const isLastStep = isWizardActive && currentStep === steps.length - 1;
    const stepLabels = isWizardActive ? steps.map(s => t(s.titleKey, { defaultValue: SECTION_FALLBACKS[s.id] || s.id })) : [];

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {headerComponent}

                    {/* Wizard Step Indicator */}
                    {isWizardActive && (
                        <View style={styles.wizardHeader}>
                            <StepIndicator
                                currentStep={currentStep}
                                totalSteps={steps.length}
                                stepLabels={stepLabels}
                            />
                            {/* Step title card */}
                            <Animated.View entering={FadeIn.duration(300)} style={styles.stepTitleCard}>
                                <View style={styles.stepTitleIconWrap}>
                                    <Ionicons
                                        name={(steps[currentStep]?.iconName || 'list-outline') as any}
                                        size={18}
                                        color={theme.colors.primary}
                                    />
                                </View>
                                <Text style={styles.stepTitleText}>
                                    {t(steps[currentStep]?.titleKey || '', { defaultValue: SECTION_FALLBACKS[steps[currentStep]?.id] || steps[currentStep]?.id || '' })}
                                </Text>
                                <Text style={styles.stepCounter}>
                                    {t('form.wizard.step_of', { current: currentStep + 1, total: steps.length, defaultValue: `Step ${currentStep + 1} of ${steps.length}` })}
                                </Text>
                            </Animated.View>
                        </View>
                    )}

                    {/* Render visible fields */}
                    {isWizardActive ? (
                        <Animated.View key={`step-${currentStep}`} entering={FadeIn.duration(250)}>
                            {visibleFields.map((field, index) => renderFieldWithLayout(field, index))}
                        </Animated.View>
                    ) : (
                        fields.map((field, index) => renderFieldWithLayout(field, index))
                    )}

                    {/* Navigation buttons */}
                    {isWizardActive ? (
                        <View style={styles.wizardNavRow}>
                            {currentStep > 0 ? (
                                <TouchableOpacity
                                    style={styles.wizardPrevButton}
                                    onPress={handleWizardPrevious}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="chevron-back" size={18} color={theme.colors.text.secondary} />
                                    <Text style={styles.wizardPrevText}>{t('form.wizard.previous', { defaultValue: 'Previous' })}</Text>
                                </TouchableOpacity>
                            ) : <View />}

                            <TouchableOpacity
                                onPress={() => {
                                    Keyboard.dismiss();
                                    handleWizardNext();
                                }}
                                disabled={loading}
                                activeOpacity={0.8}
                                style={{ flex: 1, marginLeft: currentStep > 0 ? 12 : 0 }}
                            >
                                <Animated.View style={[
                                    styles.submitButton,
                                    !isLastStep && styles.wizardNextButton,
                                    loading && styles.submitButtonDisabled,
                                    buttonAnimatedStyle
                                ]}>
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.submitButtonText}>
                                            {isLastStep ? submitLabel : t('form.wizard.next', { defaultValue: 'Next' })}
                                        </Text>
                                    )}
                                </Animated.View>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => {
                                Keyboard.dismiss();
                                handleSubmit();
                            }}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <Animated.View style={[
                                styles.submitButton,
                                loading && styles.submitButtonDisabled,
                                buttonAnimatedStyle
                            ]}>
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.submitButtonText}>{submitLabel}</Text>
                                )}
                            </Animated.View>
                        </TouchableOpacity>
                    )}

                    {/* Date Time Picker */}
                    {showDatePicker.visible && Platform.OS === 'android' && (
                        <DateTimePicker
                            value={getDatePickerValue()}
                            mode={showDatePicker.mode}
                            display="default"
                            onChange={handleDateChange}
                        />
                    )}
                </ScrollView>
            </TouchableWithoutFeedback>

            {/* iOS Date Picker Modal */}
            {Platform.OS === 'ios' && (
                <Modal
                    visible={showDatePicker.visible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowDatePicker(prev => ({ ...prev, visible: false }))}
                >
                    <TouchableWithoutFeedback onPress={() => setShowDatePicker(prev => ({ ...prev, visible: false }))}>
                        <View style={styles.iosDatePickerOverlay}>
                            <TouchableWithoutFeedback>
                                <View style={styles.iosDatePickerContainer}>
                                    <View style={styles.iosDatePickerHeader}>
                                        <TouchableOpacity onPress={() => setShowDatePicker(prev => ({ ...prev, visible: false }))}>
                                            <Text style={styles.iosDatePickerButton}>{t('common.done', 'Done')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <DateTimePicker
                                        value={getDatePickerValue()}
                                        mode={showDatePicker.mode}
                                        display="spinner"
                                        onChange={handleDateChange}
                                        style={{ height: 200 }}
                                    />
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            )}

            {/* Select Picker Modal */}
            <Modal
                visible={!!selectModalField}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setSelectModalField(null)}
            >
                <TouchableWithoutFeedback onPress={() => setSelectModalField(null)}>
                    <View style={styles.selectModalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.selectModalContainer}>
                                <View style={styles.selectModalHeader}>
                                    <Text style={styles.selectModalTitle}>{selectModalField?.label || ''}</Text>
                                    <TouchableOpacity onPress={() => setSelectModalField(null)}>
                                        <Text style={styles.iosDatePickerButton}>{t('common.done', 'Done')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView style={styles.selectModalList} bounces={false}>
                                    {(selectModalField?.options || []).map((opt, i) => {
                                        const isSelected = formData[selectModalField?.vModel || ''] === opt.value;
                                        return (
                                            <TouchableOpacity
                                                key={i}
                                                style={[
                                                    styles.selectOption,
                                                    isSelected && styles.selectOptionSelected,
                                                ]}
                                                onPress={() => {
                                                    if (selectModalField) {
                                                        handleChange(selectModalField.vModel, opt.value);
                                                    }
                                                    setSelectModalField(null);
                                                }}
                                            >
                                                <Text style={[
                                                    styles.selectOptionText,
                                                    isSelected && styles.selectOptionTextSelected,
                                                ]}>
                                                    {opt.label}
                                                </Text>
                                                {isSelected && (
                                                    <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 120,
        paddingHorizontal: 20,
    },
    fieldContainer: {
        marginBottom: 24,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
        letterSpacing: 0.5,
    },
    requiredDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.danger,
        marginLeft: 4,
        marginTop: 2,
    },
    selectedCount: {
        fontSize: 12,
        color: theme.colors.primary,
        marginLeft: 'auto',
        fontWeight: '500',
    },
    autoFillBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
        backgroundColor: `${theme.colors.primary}15`,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 3,
    },
    autoFillText: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    textAreaWrapper: {
        alignItems: 'flex-start',
    },
    iconContainer: {
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        paddingRight: 16,
        paddingLeft: 16,
        fontSize: 16,
        color: theme.colors.text.primary,
    },
    inputWithIcon: {
        paddingLeft: 0,
    },
    textArea: {
        minHeight: 120,
        textAlignVertical: 'top',
        paddingTop: 16,
    },
    eyeIcon: {
        paddingHorizontal: 16,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    gridItem: {
        width: '50%',
        paddingHorizontal: 6,
        marginBottom: 12,
    },
    fullWidthContainer: {
        // Stack options vertically for long-label items
    },
    fullWidthItem: {
        marginBottom: 10,
    },
    selectionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    selectionCardWithDesc: {
        alignItems: 'flex-start',
    },
    optionText: {
        fontSize: 15,
        color: theme.colors.text.primary,
        marginLeft: 10,
        flex: 1,
    },
    optionTextSelected: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    optionDescription: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        lineHeight: 17,
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    checkboxOuter: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    checkboxInner: {
        // Handled by icon
    },
    uploadWrapper: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        marginLeft: 4,
    },
    errorText: {
        fontSize: 12,
        color: theme.colors.danger,
        marginLeft: 6,
    },
    submitButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 24,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    submitButtonDisabled: {
        backgroundColor: '#D1D5DB',
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    // 🔧 新增：计数器样式
    numberInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    numberButton: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    numberValue: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    // Select trigger (tap to open modal)
    selectTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingVertical: 14,
        paddingHorizontal: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    selectTriggerText: {
        fontSize: 16,
        color: theme.colors.text.primary,
        flex: 1,
    },
    // Select modal
    selectModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    selectModalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '60%',
        paddingBottom: 20,
    },
    selectModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    selectModalTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    selectModalList: {
        maxHeight: 400,
    },
    selectOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    selectOptionSelected: {
        backgroundColor: '#FFF7ED',
    },
    selectOptionText: {
        fontSize: 15,
        color: theme.colors.text.primary,
    },
    selectOptionTextSelected: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    // 🔧 Switch Styles
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    switchDesc: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 4,
    },
    // 🔧 Slider Styles
    sliderContainer: {
        paddingHorizontal: 10,
        paddingVertical: 20,
    },
    sliderTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#E5E7EB',
        width: '100%',
        position: 'relative',
    },
    sliderFill: {
        height: '100%',
        borderRadius: 3,
        backgroundColor: theme.colors.primary,
        position: 'absolute',
        left: 0,
        top: 0,
    },
    sliderThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        position: 'absolute',
        top: -9,
        marginLeft: -12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    sliderValue: {
        textAlign: 'center',
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    // 🔧 Rate Styles
    rateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    starItem: {
        padding: 4,
    },
    rateText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#F59E0B',
        fontWeight: '600',
    },
    // 🔧 Color Picker Styles
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    colorItem: {
        width: 40,
        height: 40,
        borderRadius: 20,
        margin: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorItemSelected: {
        borderColor: theme.colors.primary,
        borderWidth: 2,
        transform: [{ scale: 1.1 }],
    },
    // 🔧 iOS DatePicker Styles
    iosDatePickerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
        zIndex: 1000,
    },
    iosDatePickerContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20, // Add padding for home indicator
    },
    iosDatePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    iosDatePickerButton: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    // 🔧 Input Addons
    prependContainer: {
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 12,
        justifyContent: 'center',
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
        borderWidth: 1,
        borderRightWidth: 0,
        borderColor: '#E5E7EB',
        height: 54,
    },
    appendContainer: {
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 12,
        justifyContent: 'center',
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        borderWidth: 1,
        borderLeftWidth: 0,
        borderColor: '#E5E7EB',
        height: 54,
    },
    addonText: {
        fontSize: 14,
        color: '#6B7280',
    },
    inputWrapperWithPrepend: {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
    },
    inputWrapperWithAppend: {
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
    },
    clearIcon: {
        padding: 10,
    },
    wordLimitText: {
        fontSize: 12,
        color: '#9CA3AF',
        paddingRight: 12,
        paddingLeft: 4,
    },
    inputDisabled: {
        color: '#9CA3AF',
    },
    selectionCardDisabled: {
        // Handled via dynamic styles but good to have base if needed
    },
    // Wizard styles
    wizardHeader: {
        marginBottom: 8,
    },
    stepTitleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7ED',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 16,
    },
    stepTitleIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: `${theme.colors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    stepTitleText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
        flex: 1,
    },
    stepCounter: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    wizardNavRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 24,
    },
    wizardPrevButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    wizardPrevText: {
        fontSize: 15,
        color: theme.colors.text.secondary,
        fontWeight: '500',
        marginLeft: 4,
    },
    wizardNextButton: {
        // Same as submitButton but can be customized
    },
    // Fill-in conditional input
    fillInInputWrap: {
        marginTop: 12,
    },
    fillInInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        color: theme.colors.text.primary,
    },
    fieldHelperText: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
        marginBottom: 10,
        paddingHorizontal: 2,
    },
    // 🔧 Row container styles
    rowContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4,
        marginBottom: 0,
    },
    rowChild: {
        paddingHorizontal: 4,
    },
    // 🔧 Range picker styles (date-range / time-range)
    rangePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rangePickerHalf: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingVertical: 14,
        paddingHorizontal: 12,
    },
    rangePickerText: {
        fontSize: 15,
        color: theme.colors.text.primary,
        flex: 1,
    },
    rangeSeparator: {
        marginHorizontal: 8,
        fontSize: 16,
        color: '#9CA3AF',
    },
});
