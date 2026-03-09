import React from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CARD_HEIGHT = 84;
const CIRCLE_SIZE = 119;
const ARROW_SIZE = 41;

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
    const category = merchant.category || '';
    const distance = merchant.distance || '';
    const earnMultiplier = merchant.earnPoints || 1;

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Circle Image - matching Figma SmallActivityCard Ellipse */}
            <View style={styles.circleWrapper}>
                <Image
                    source={{
                        uri: merchant.image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200',
                    }}
                    style={styles.circleImage}
                    resizeMode="cover"
                />
            </View>

            {/* Text Frame - matching Figma list item layout */}
            <View style={styles.textFrame}>
                {/* Name + Title group */}
                <View style={styles.nameGroup}>
                    {/* Row 1: School/Org info (gray small text) */}
                    <View style={styles.orgRow}>
                        <Ionicons name="school-outline" size={12} color={isDarkMode ? '#777' : '#949494'} />
                        <Text style={[styles.orgText, isDarkMode && styles.orgTextDark]} numberOfLines={1}>
                            {orgName}{distance ? ` · ${distance}` : ''}
                        </Text>
                    </View>

                    {/* Row 2: Merchant Name (bold) */}
                    <Text style={[styles.merchantName, isDarkMode && styles.textWhite]} numberOfLines={2}>
                        {merchantName}
                    </Text>
                </View>

                {/* Row 3: Location + Earn badge */}
                <View style={styles.metaRow}>
                    {merchant.location ? (
                        <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={13} color={isDarkMode ? '#777' : '#949494'} />
                            <Text style={[styles.locationText, isDarkMode && styles.orgTextDark]} numberOfLines={1}>
                                {merchant.location}
                            </Text>
                        </View>
                    ) : (
                        earnMultiplier > 1 ? (
                            <View style={styles.earnBadge}>
                                <Text style={styles.earnText}>Earn x {earnMultiplier}</Text>
                            </View>
                        ) : category ? (
                            <View style={[styles.categoryTag, isDarkMode && styles.categoryTagDark]}>
                                <Text style={[styles.categoryTagText, isDarkMode && styles.categoryTagTextDark]}>{category}</Text>
                            </View>
                        ) : null
                    )}
                </View>
            </View>

            {/* Arrow Button - right side */}
            <View style={styles.arrowWrapper}>
                <View style={[styles.arrowCircle, isDarkMode && styles.arrowCircleDark]}>
                    <Ionicons name="arrow-up" size={18} color={isDarkMode ? '#fff' : '#000'} style={{ transform: [{ rotate: '45deg' }] }} />
                </View>
            </View>
        </TouchableOpacity>
    );
});

CommunityMerchantCard.displayName = 'CommunityMerchantCard';

const styles = StyleSheet.create({
    container: {
        height: CARD_HEIGHT,
        marginBottom: 20,
        overflow: 'hidden',
        backgroundColor: 'transparent',
    },

    // Circle image - matching SmallActivityCard
    circleWrapper: {
        position: 'absolute',
        left: -36,
        top: -19,
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: CIRCLE_SIZE / 2,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    circleImage: {
        ...StyleSheet.absoluteFillObject,
    },

    // Text frame
    textFrame: {
        position: 'absolute',
        left: 98,
        top: 6,
        right: ARROW_SIZE + 12,
        gap: 6,
    },

    nameGroup: {
        gap: 3,
    },

    orgRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    orgText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 11,
        color: '#949494',
        lineHeight: 16,
        flexShrink: 1,
    },

    merchantName: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: '#000',
        lineHeight: 22,
    },

    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    locationText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 11,
        color: '#949494',
        lineHeight: 16,
        flexShrink: 1,
    },
    earnBadge: {
        backgroundColor: '#E8734A',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 20,
    },
    earnText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 11,
        color: '#FFFFFF',
        lineHeight: 16,
    },
    categoryTag: {
        backgroundColor: '#EEEEEE',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 20,
    },
    categoryTagText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 10,
        color: '#949494',
        lineHeight: 15,
    },

    // Arrow button - right side
    arrowWrapper: {
        position: 'absolute',
        right: 0,
        top: 22,
    },
    arrowCircle: {
        width: ARROW_SIZE,
        height: ARROW_SIZE,
        borderRadius: 20.5,
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
