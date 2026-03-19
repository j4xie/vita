import React, { memo, useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FrontendActivity } from '../../utils/activityAdapter';
import { useSchoolLogos, getSchoolLogoSync } from '../../hooks/useSchoolLogos';
import { formatDateRange } from '../../utils/cardUtils';
import { CalendarIcon, ShareIcon } from '../icons/ActivityIcons';

interface SmallActivityCardProps {
    activity: FrontendActivity;
    onPress: () => void;
}

// Figma: SmallActivityCard 340×84
const CARD_HEIGHT = 84;
const CIRCLE_SIZE = 119;
const ARROW_SIZE = 41;

const SmallActivityCardComponent = ({ activity, onPress }: SmallActivityCardProps) => {
    const { loading: schoolsLoading } = useSchoolLogos();

    const schoolLogo = useMemo(() => {
        if (!schoolsLoading) {
            const textLogo = getSchoolLogoSync(activity.title || '', activity.location || '');
            if (textLogo) return textLogo;
        }

        const avatar = activity.organizer?.avatar;
        if (avatar && !avatar.includes('ui-avatars.com') && !avatar.includes('americanpromotioncompany.com')) {
            return avatar;
        }

        return null;
    }, [activity.title, activity.location, activity.organizer?.avatar, schoolsLoading]);

    const dateDisplay = formatDateRange(activity.date || '', activity.endDate, { padZero: true });
    const timeSuffix = activity.time && activity.time !== '00:00' ? ` ${activity.time}` : '';

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            {/* Frosted Glass Circle — Figma: Ellipse 9, (-36, -19), 119×119 */}
            <View style={styles.circleWrapper}>
                <Image
                    source={{ uri: schoolLogo || activity.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200' }}
                    style={styles.circleImage}
                    resizeMode="cover"
                />
            </View>

            {/* 文案区：组织者、标题、日期 — Figma: Frame 22 */}
            <View style={styles.textFrame}>
                <View style={styles.nameGroup}>
                    <Text style={styles.organizer} numberOfLines={1}>
                        {activity.organizer?.name || 'PomeloX'}
                    </Text>
                    <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75}>
                        {activity.title || ''}
                    </Text>
                </View>
                <View style={styles.dateRow}>
                    <CalendarIcon size={14} color="#949494" />
                    <Text style={styles.metaText} numberOfLines={1}>{dateDisplay}</Text>
                    {timeSuffix ? <Text style={styles.metaText} numberOfLines={1}>{timeSuffix.trim()}</Text> : null}
                </View>
            </View>

            {/* Arrow — Figma: (299, 22), 41×41, borderRadius 25.5 */}
            <View style={styles.arrowWrapper}>
                <View style={styles.arrowCircle}>
                    <ShareIcon size={20} color="#949494" />
                </View>
            </View>
        </TouchableOpacity>
    );
};

export const SmallActivityCard = memo(SmallActivityCardComponent);

const styles = StyleSheet.create({
    // Figma: 340×84, mode: none, fill transparent
    container: {
        height: CARD_HEIGHT,
        marginBottom: 20,
        overflow: 'hidden',
        backgroundColor: 'transparent',
    },
    // Figma: Ellipse 9 at (-36, -19), 119×119
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
    // Figma: Frame 22 at (98, 8), width 180, column, gap 9px
    textFrame: {
        position: 'absolute',
        left: 98,
        top: 8,
        right: ARROW_SIZE + 12,
        gap: 9,
        minWidth: 0,
    },
    nameGroup: {
        gap: 9,
    },
    // Figma: Poppins Medium 12px/18px, #949494
    organizer: {
        fontFamily: 'Poppins_500Medium',
        fontSize: 12,
        lineHeight: 18,
        color: '#949494',
    },
    // Figma: Poppins SemiBold 15px/22px, #000
    title: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 15,
        lineHeight: 22,
        color: '#000',
    },
    // Figma: Frame 14, row, gap 9px
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        minWidth: 0,
    },
    // Figma: Poppins Medium 12px/18px, #949494
    metaText: {
        fontFamily: 'Poppins_500Medium',
        fontSize: 12,
        lineHeight: 18,
        color: '#949494',
        flexShrink: 1,
    },
    // Figma: Frame 24 at (299, 22) → right: 0, top: 22
    arrowWrapper: {
        position: 'absolute',
        right: 0,
        top: 22,
    },
    arrowCircle: {
        width: ARROW_SIZE,
        height: ARROW_SIZE,
        borderRadius: 25.5,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
});
