import React from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DiagonalArrowIcon } from '../common/icons/FilterIcons';
import { SchoolMarkerIcon } from '../common/icons/CommunityIcons';

const IMAGE_SIZE = 90;
const ARROW_SIZE = 38;

interface CommunityMerchantCardProps {
    merchant: {
        id: string;
        merchantId?: number;
        title?: string;
        name?: string;
        location?: string;
        image?: string;
        earnPoints?: number;
        schoolName?: string;
        category?: string;
        rating?: number;
        reviewCount?: number;
        distance?: string;
        tags?: string[];
    };
    onPress: () => void;
    onBookmark?: () => void;
    isDarkMode?: boolean;
}

export const CommunityMerchantCard: React.FC<CommunityMerchantCardProps> = React.memo(({
    merchant,
    onPress,
    isDarkMode = false,
}) => {
    const merchantName = merchant.title || merchant.name || 'Merchant';
    const orgName = merchant.schoolName || '';
    const distance = merchant.distance || '';
    const earnMultiplier = merchant.earnPoints || 1;
    const rating = merchant.rating || 0;
    const reviewCount = merchant.reviewCount || 0;
    const category = merchant.category || '';

    const reviewDisplay = reviewCount > 0 ? `(${reviewCount}+)` : '';

    // Build tags list
    const displayTags: string[] = [];
    if (earnMultiplier >= 1) {
        // Earn tag handled separately with special styling
    }
    if (merchant.tags && merchant.tags.length > 0) {
        displayTags.push(...merchant.tags.slice(0, 2));
    } else if (category) {
        displayTags.push(...category.split(',').map(t => t.trim()).filter(Boolean).slice(0, 2));
    }

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Rectangular Image */}
            <View style={styles.imageWrapper}>
                <Image
                    source={{
                        uri: merchant.image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200',
                    }}
                    style={styles.image}
                    resizeMode="cover"
                />
            </View>

            {/* Text Content */}
            <View style={styles.textFrame}>
                {/* Row 1: School + Distance */}
                <View style={styles.orgRow}>
                    <SchoolMarkerIcon size={12} color={isDarkMode ? '#777' : '#949494'} />
                    <Text style={[styles.orgText, isDarkMode && styles.orgTextDark]} numberOfLines={1}>
                        {orgName}{distance ? ` · ${distance}` : ''}
                    </Text>
                </View>

                {/* Row 2: Name + Rating */}
                <View style={styles.nameRatingRow}>
                    <Text style={[styles.merchantName, isDarkMode && styles.textWhite]} numberOfLines={1}>
                        {merchantName}
                    </Text>
                    {rating > 0 && (
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={14} color="#FFB800" />
                            <Text style={[styles.ratingText, isDarkMode && styles.textWhite]}>
                                {rating.toFixed(1)}
                            </Text>
                            {reviewDisplay ? (
                                <Text style={[styles.reviewCountText, isDarkMode && styles.orgTextDark]}>
                                    {reviewDisplay}
                                </Text>
                            ) : null}
                        </View>
                    )}
                </View>

                {/* Row 3: Tags */}
                <View style={styles.tagsRow}>
                    {earnMultiplier >= 1 && (
                        <View style={[styles.earnTag, earnMultiplier > 1 && styles.earnTagMultiplier]}>
                            <Text style={styles.earnTagText}>
                                {earnMultiplier > 1 ? `Earn × ${earnMultiplier}` : 'Earn'}
                            </Text>
                        </View>
                    )}
                    {displayTags.map((tag, index) => (
                        <View key={`${tag}-${index}`} style={[styles.categoryTag, isDarkMode && styles.categoryTagDark]}>
                            <Text style={[styles.categoryTagText, isDarkMode && styles.categoryTagTextDark]}>{tag}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Arrow Button - right side */}
            <View style={styles.arrowWrapper}>
                <View style={[styles.arrowCircle, isDarkMode && styles.arrowCircleDark]}>
                    <DiagonalArrowIcon size={16} color={isDarkMode ? '#fff' : '#949494'} />
                </View>
            </View>
        </TouchableOpacity>
    );
});

CommunityMerchantCard.displayName = 'CommunityMerchantCard';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: 'transparent',
    },

    // Rectangular image
    imageWrapper: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#eee',
    },
    image: {
        width: '100%',
        height: '100%',
    },

    // Text frame
    textFrame: {
        flex: 1,
        marginLeft: 14,
        marginRight: 8,
        gap: 4,
    },

    orgRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    orgText: {
        fontFamily: 'Poppins_500Medium',
        fontSize: 11,
        color: '#949494',
        lineHeight: 16,
        flexShrink: 1,
    },

    nameRatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    merchantName: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 15,
        color: '#000',
        lineHeight: 22,
        flex: 1,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginLeft: 6,
    },
    ratingText: {
        fontFamily: 'Poppins_600SemiBold',
        fontWeight: '600',
        fontSize: 13,
        color: '#000',
        lineHeight: 18,
    },
    reviewCountText: {
        fontFamily: 'Poppins_400Regular',
        fontWeight: '400',
        fontSize: 11,
        color: '#949494',
        lineHeight: 16,
    },

    tagsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    earnTag: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 20,
    },
    earnTagMultiplier: {
        backgroundColor: '#E8734A',
    },
    earnTagText: {
        fontFamily: 'Poppins_500Medium',
        fontWeight: '500',
        fontSize: 10,
        color: '#FFFFFF',
        lineHeight: 15,
    },
    categoryTag: {
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 20,
    },
    categoryTagText: {
        fontFamily: 'Poppins_500Medium',
        fontSize: 10,
        color: '#949494',
        lineHeight: 15,
    },

    // Arrow button - right side
    arrowWrapper: {
        marginLeft: 'auto',
    },
    arrowCircle: {
        width: ARROW_SIZE,
        height: ARROW_SIZE,
        borderRadius: ARROW_SIZE / 2,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    arrowCircleDark: {
        backgroundColor: '#2c2c2e',
    },

    // Dark mode
    textWhite: {
        color: '#fff',
    },
    orgTextDark: {
        color: '#777',
    },
    categoryTagDark: {
        backgroundColor: '#333',
    },
    categoryTagTextDark: {
        color: '#aaa',
    },
});

export default CommunityMerchantCard;
