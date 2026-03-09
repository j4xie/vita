import React, { useState, useEffect, useRef } from 'react';
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
import { FormFieldSchema, FormFieldOption } from '../../types/form';

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

// 2. Selection Card Component (Radio/Checkbox)
const SelectionCard = ({
    label,
    selected,
    onPress,
    type = 'radio',
    disabled = false
}: {
    label: string,
    selected: boolean,
    onPress: () => void,
    type: 'radio' | 'checkbox',
    disabled?: boolean
}) => {
    const scale = useSharedValue(1);

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
            <Animated.View style={[styles.selectionCard, animatedStyle]}>
                <View style={[
                    type === 'radio' ? styles.radioOuter : styles.checkboxOuter,
                    disabled && { borderColor: '#9CA3AF', backgroundColor: '#E5E7EB' }
                ]}>
                    {selected && (
                        type === 'radio' ? (
                            <View style={[styles.radioInner, { backgroundColor: disabled ? '#9CA3AF' : theme.colors.primary }]} />
                        ) : (
                            <Ionicons name="checkmark" size={14} color={disabled ? '#9CA3AF' : "#FFFFFF"} />
                        )
                    )}
                </View>
                <Text style={[
                    styles.optionText, 
                    selected && styles.optionTextSelected,
                    disabled && { color: '#9CA3AF' }
                ]}>{label}</Text>
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
                if (parsed.fields && Array.isArray(parsed.fields)) {
                    // Normalize: move slot.options to field.options if not already set
                    const normalizedFields = parsed.fields.map((f: any) => {
                        if (!f.options && f.slot?.options) {
                            return { ...f, options: f.slot.options };
                        }
                        return f;
                    });
                    setFields(normalizedFields);
                    
                    // Initialize default values if not present in initialData
                    const defaultValues: any = {};
                    normalizedFields.forEach((field: FormFieldSchema) => {
                        if (field.defaultValue !== undefined && initialData[field.vModel] === undefined) {
                            defaultValues[field.vModel] = field.defaultValue;
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
    const handleChange = (vModel: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [vModel]: value }));
        // 清除该字段的错误
        if (errors[vModel]) {
            setErrors(prev => ({ ...prev, [vModel]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        let isValid = true;
        let firstErrorModel = '';

        fields.forEach(field => {
            const val = formData[field.vModel];

            // 1. Required Check
            if (field.required) {
                if (val === undefined || val === null || (typeof val === 'string' && !val.trim()) || (Array.isArray(val) && val.length === 0)) {
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

        setErrors(newErrors);

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
    };

    const handleSubmit = () => {
        if (validate()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSubmit(formData);
        } else {
            triggerShake();
        }
    };

    // ... (renderField same as before)

    const getDatePickerValue = (): Date => {
        const fieldVal = showDatePicker.fieldModel ? formData[showDatePicker.fieldModel] : null;
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
            const field = fields.find(f => f.vModel === showDatePicker.fieldModel);
            if (field) {
                // Simple format based on mode
                let formattedValue = '';
                if (showDatePicker.mode === 'date') {
                    formattedValue = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
                } else {
                    // HH:mm
                    const hours = selectedDate.getHours().toString().padStart(2, '0');
                    const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
                    formattedValue = `${hours}:${minutes}`;
                }
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

            case 'el-radio-group':
                return (
                    <View key={index} style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{field.label}</Text>
                            {field.required && <View style={styles.requiredDot} />}
                        </View>
                        <View style={styles.gridContainer}>
                            {(field.options || []).map((opt, i) => (
                                <View key={i} style={styles.gridItem}>
                                    <SelectionCard
                                        label={opt.label}
                                        selected={value === opt.value}
                                        onPress={() => handleChange(field.vModel, opt.value)}
                                        type="radio"
                                        disabled={isDisabled}
                                    />
                                </View>
                            ))}
                        </View>
                        {errors[field.vModel] && (
                            <Animated.View entering={FadeInUp.duration(300)} style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={14} color={theme.colors.danger} />
                                <Text style={styles.errorText}>{errors[field.vModel]}</Text>
                            </Animated.View>
                        )}
                    </View>
                );

            case 'el-checkbox-group':
                const currentValues = Array.isArray(value) ? value : [];
                return (
                    <View key={index} style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{field.label}</Text>
                            {field.required && <View style={styles.requiredDot} />}
                            {currentValues.length > 0 &&
                                <Text style={styles.selectedCount}>已选 {currentValues.length} 项</Text>
                            }
                        </View>
                        <View style={styles.gridContainer}>
                            {(field.options || []).map((opt, i) => {
                                const isSelected = currentValues.includes(opt.value);
                                return (
                                    <View key={i} style={styles.gridItem}>
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

            case 'upload':
                const uploadType = field.accept || (field.label.includes('视频') || field.label.includes('Video') ? 'video' : 'image');

                return (
                    <View key={index} style={[styles.fieldContainer, isDisabled && { opacity: 0.6 }]} pointerEvents={isDisabled ? 'none' : 'auto'}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{field.label}</Text>
                            {field.required && <View style={styles.requiredDot} />}
                        </View>
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
            case 'el-input-number':
                const numValue = typeof value === 'number' ? value : 0;
                return (
                    <View key={index} style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{field.label}</Text>
                            {field.required && <View style={styles.requiredDot} />}
                        </View>
                        <View style={[styles.numberInputContainer, isDisabled && { backgroundColor: '#F3F4F6' }]}>
                            <TouchableOpacity
                                style={styles.numberButton}
                                onPress={() => handleChange(field.vModel, Math.max(0, numValue - 1))}
                                disabled={isDisabled}
                            >
                                <Ionicons name="remove" size={20} color={isDisabled ? '#9CA3AF' : theme.colors.text.primary} />
                            </TouchableOpacity>
                            <Text style={[styles.numberValue, isDisabled && { color: '#9CA3AF' }]}>{numValue}</Text>
                            <TouchableOpacity
                                style={styles.numberButton}
                                onPress={() => handleChange(field.vModel, numValue + 1)}
                                disabled={isDisabled}
                            >
                                <Ionicons name="add" size={20} color={isDisabled ? '#9CA3AF' : theme.colors.text.primary} />
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

            default:
                return null;
        }
    };

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
                    {fields.map((field, index) => renderFieldWithLayout(field, index))}

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
        paddingBottom: 40,
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
        fontSize: 16,
        color: theme.colors.text.primary,
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
});
