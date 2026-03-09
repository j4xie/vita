import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useTranslation } from 'react-i18next';
import { uploadMedia } from '../../services/imageUploadService';

interface MediaUploaderProps {
    type: 'image' | 'video';
    value?: string; // URL of the uploaded file
    onUploadSuccess: (url: string) => void;
    label?: string;
    required?: boolean;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
    type,
    value,
    onUploadSuccess,
    label,
    required
}) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<string | undefined>(value);

    const pickMedia = async () => {
        // Request permission
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert(t('common.error'), t('permissions.camera_roll_required') || 'Permission to access camera roll is required!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: type === 'video'
                ? ImagePicker.MediaTypeOptions.Videos
                : ImagePicker.MediaTypeOptions.Images,
            allowsEditing: type === 'image',
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            handleUpload(result.assets[0].uri);
        }
    };

    const handleUpload = async (uri: string) => {
        setLoading(true);
        // Show local preview immediately
        setPreview(uri);

        try {
            const result = await uploadMedia(uri, type);

            if (result.success && result.url) {
                onUploadSuccess(result.url);
            } else {
                Alert.alert(t('common.error'), result.error || t('common.upload_failed'));
                // Revert preview if failed
                if (!value) setPreview(undefined);
            }
        } catch (error) {
            Alert.alert(t('common.error'), t('common.upload_failed'));
            if (!value) setPreview(undefined);
        } finally {
            setLoading(false);
        }
    };

    const clearSelection = () => {
        setPreview(undefined);
        onUploadSuccess('');
    };

    return (
        <View style={styles.container}>
            {label && (
                <Text style={styles.label}>
                    {label} {required && <Text style={styles.required}>*</Text>}
                </Text>
            )}

            {!preview ? (
                <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={pickMedia}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={theme.colors.primary} />
                    ) : (
                        <>
                            <Ionicons
                                name={type === 'video' ? 'videocam-outline' : 'image-outline'}
                                size={32}
                                color={theme.colors.text.secondary}
                            />
                            <Text style={styles.uploadText}>
                                {type === 'video' ? t('common.upload_video') : t('common.upload_image')}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            ) : (
                <View style={styles.previewContainer}>
                    {type === 'image' ? (
                        <Image source={{ uri: preview }} style={styles.previewImage} />
                    ) : (
                        <View style={[styles.previewImage, styles.videoPlaceholder]}>
                            <Ionicons name="videocam" size={40} color="white" />
                        </View>
                    )}

                    <TouchableOpacity style={styles.removeButton} onPress={clearSelection}>
                        <Ionicons name="close-circle" size={24} color={theme.colors.danger} />
                    </TouchableOpacity>

                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator color="white" size="large" />
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text.primary,
        marginBottom: 8,
    },
    required: {
        color: theme.colors.danger,
    },
    uploadButton: {
        width: 120,
        height: 120,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderStyle: 'dashed',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    uploadText: {
        marginTop: 8,
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    previewContainer: {
        width: 120,
        height: 120,
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    videoPlaceholder: {
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButton: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: 'white',
        borderRadius: 12,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
});
