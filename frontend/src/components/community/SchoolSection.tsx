import React, { memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CommunityMerchantCard } from '../cards/CommunityMerchantCard';

interface SchoolSectionProps {
    school: {
        id: string;
        name: string;
        shortName?: string;
        logo?: string | null;
        engName?: string;
    };
    merchants: any[];
    onMerchantPress: (merchantId: string) => void;
    onViewMore?: () => void;
    isDarkMode?: boolean;
}

const SchoolSectionComponent: React.FC<SchoolSectionProps> = ({
    school,
    merchants,
    onMerchantPress,
    onViewMore,
    isDarkMode = false,
}) => {
    const { t } = useTranslation();

    const renderMerchantItem = ({ item }: { item: any }) => (
        <CommunityMerchantCard
            merchant={item}
            onPress={() => onMerchantPress(item.id)}
            isDarkMode={isDarkMode}
        />
    );

    return (
        <View style={styles.container}>
            {/* School Header */}
            <View style={styles.headerRow}>
                {/* School Logo */}
                <View style={styles.logoContainer}>
                    {school.logo ? (
                        <Image source={{ uri: school.logo }} style={styles.schoolLogo} />
                    ) : (
                        <View style={styles.logoPlaceholder}>
                            <Text style={styles.logoText}>
                                {(school.shortName || school.name).charAt(0)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* School Info */}
                <View style={styles.schoolInfo}>
                    <Text style={[styles.schoolName, isDarkMode && styles.textWhite]}>{school.shortName || school.name}</Text>
                    <Text style={[styles.schoolFullName, isDarkMode && styles.secondaryTextDark]} numberOfLines={1}>
                        {school.engName || school.name}
                    </Text>
                </View>

                {/* View More */}
                {onViewMore && merchants.length > 0 && (
                    <TouchableOpacity style={styles.viewMoreButton} onPress={onViewMore}>
                        <Text style={styles.viewMoreText}>VIEW MORE</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Merchants Horizontal List or Empty State */}
            {merchants.length > 0 ? (
                <FlatList
                    data={merchants}
                    renderItem={renderMerchantItem}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={4}
                    windowSize={5}
                />
            ) : (
                <View style={[styles.emptyStateContainer, isDarkMode && styles.emptyStateDark]}>
                    <View style={[styles.emptyStateIcon, isDarkMode && styles.emptyStateIconDark]}>
                        <Ionicons name="storefront-outline" size={28} color={isDarkMode ? '#555' : '#CCCCCC'} />
                    </View>
                    <Text style={[styles.emptyStateText, isDarkMode && styles.secondaryTextDark]}>{t('community.noMerchants')}</Text>
                    <Text style={[styles.emptyStateSubtext, isDarkMode && styles.tertiaryTextDark]}>{t('community.comingSoon')}</Text>
                </View>
            )}
        </View>
    );
};

export const SchoolSection = memo(SchoolSectionComponent);

const styles = StyleSheet.create({
    container: {
        marginBottom: 28,
    },

    // Header
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    logoContainer: {
        marginRight: 12,
    },
    schoolLogo: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F5F5F5',
    },
    logoPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E8E8E8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        fontFamily: 'Poppins-Bold',
        fontSize: 18,
        color: '#666666',
    },
    schoolInfo: {
        flex: 1,
    },
    schoolName: {
        fontFamily: 'Poppins-Bold',
        fontSize: 16,
        color: '#1A1A1A',
    },
    schoolFullName: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: '#999999',
        marginTop: 2,
    },

    // View More
    viewMoreButton: {
        paddingLeft: 8,
    },
    viewMoreText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 12,
        color: '#FF7763',
    },

    // List
    listContent: {
        paddingHorizontal: 16,
    },

    // Empty State
    emptyStateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginHorizontal: 16,
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        borderStyle: 'dashed',
    },
    emptyStateIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    emptyStateText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: '#999999',
    },
    emptyStateSubtext: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: '#CCCCCC',
        marginLeft: 8,
    },

    // Dark mode
    textWhite: {
        color: '#fff',
    },
    secondaryTextDark: {
        color: '#777',
    },
    tertiaryTextDark: {
        color: '#555',
    },
    emptyStateDark: {
        backgroundColor: '#1c1c1e',
        borderColor: '#333',
    },
    emptyStateIconDark: {
        backgroundColor: '#2c2c2e',
    },
});

export default SchoolSection;
