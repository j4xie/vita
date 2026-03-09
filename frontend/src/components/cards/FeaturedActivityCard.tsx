import React, { memo, useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { FrontendActivity } from '../../utils/activityAdapter';
import { useSchoolLogos, getSchoolLogoSync } from '../../hooks/useSchoolLogos';

interface FeaturedActivityCardProps {
    activity: FrontendActivity;
    onPress: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = Math.round(screenWidth * 0.56);
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.286);

// 底部面板几何参数 - Figma: 34.5%
const BOTTOM_PANEL_HEIGHT = Math.round(CARD_HEIGHT * 0.345);
const PANEL_TOP_Y = CARD_HEIGHT - BOTTOM_PANEL_HEIGHT;

const LOGO_SIZE = 59;
const LOGO_RADIUS = LOGO_SIZE / 2;
const LOGO_LEFT = 13;
const NOTCH_RADIUS = 36;
const CORNER_R = 32;

// Logo 垂直位置：极高位悬浮
const LOGO_CENTER_Y = -7;
const LOGO_BOTTOM_OFFSET = BOTTOM_PANEL_HEIGHT - (LOGO_CENTER_Y + LOGO_RADIUS);

// 计算几何关键点
const NOTCH_CENTER_X = LOGO_LEFT + LOGO_RADIUS;
const INTERCEPT_Y = 10;
const INTERCEPT_X = Math.sqrt(Math.pow(NOTCH_RADIUS, 2) - Math.pow(INTERCEPT_Y - LOGO_CENTER_Y, 2));

const FeaturedActivityCardComponent = ({ activity, onPress }: FeaturedActivityCardProps) => {
    const { t } = useTranslation();
    const { loading: schoolsLoading } = useSchoolLogos();

    const logoUrl = useMemo(() => {
        // 优先：通过活动标题/地点文本匹配（缓存加载后）
        if (!schoolsLoading) {
            const textLogo = getSchoolLogoSync(activity.title || '', activity.location || '');
            if (textLogo) return textLogo;
        }

        // fallback
        const avatar = activity.organizer?.avatar;
        if (avatar && !avatar.includes('ui-avatars.com') && !avatar.includes('americanpromotioncompany.com')) {
            return avatar;
        }

        return 'https://ui-avatars.com/api/?name=CU&background=red&color=fff';
    }, [activity.title, activity.location, activity.organizer?.avatar, schoolsLoading]);

    const imageUrl = activity.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';
    const registeredCount = activity.registeredCount || activity.attendees || 0;
    const maxCount = activity.maxAttendees || 100;
    const progress = maxCount > 0 ? Math.min(registeredCount / maxCount, 1) : 0;

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.95}>
            {/* 【层级 0】 底层背景照片 */}
            <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />

            {/* 【层级 1】 半透明蒙版层 - Figma: 白色 80% */}
            <View style={[styles.bottomPanelContainer, { overflow: 'visible' }]}>
                <Svg height={BOTTOM_PANEL_HEIGHT + 1} width={CARD_WIDTH + 1} style={[StyleSheet.absoluteFill, { left: 0, bottom: -1 }]}>
                    <Path
                        d={`M0,${BOTTOM_PANEL_HEIGHT + 1}
                           L0,0
                           L${Math.max(0, NOTCH_CENTER_X - INTERCEPT_X - CORNER_R)},0
                           Q${NOTCH_CENTER_X - INTERCEPT_X},0 ${NOTCH_CENTER_X - INTERCEPT_X},${INTERCEPT_Y}
                           A ${NOTCH_RADIUS},${NOTCH_RADIUS} 0 0 0 ${NOTCH_CENTER_X + INTERCEPT_X},${INTERCEPT_Y}
                           Q${NOTCH_CENTER_X + INTERCEPT_X},0 ${Math.min(CARD_WIDTH + 1, NOTCH_CENTER_X + INTERCEPT_X + CORNER_R)},0
                           L${CARD_WIDTH + 1},0
                           L${CARD_WIDTH + 1},${BOTTOM_PANEL_HEIGHT + 1} Z`}
                        fill="rgba(255, 255, 255, 0.8)"
                    />
                </Svg>
            </View>

            {/* Logo 徽章 */}
            <View style={styles.logoContainer}>
                <View style={[styles.logoBorder, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Image
                        source={{ uri: logoUrl }}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </View>
            </View>

            {/* 【层级 2】 内容层 */}
            <View style={styles.topRightArrow}>
                <Ionicons name="arrow-up" size={18} color="#111" style={{ transform: [{ rotate: '45deg' }] }} />
            </View>

            <View style={styles.contentOverlay}>
                {/* 左上角：状态提示 - 优先级：活动结束 > 停止报名 > 开放报名 */}
                {(() => {
                    const now = new Date();
                    const regStartTime = activity.registrationStartTime ? new Date(activity.registrationStartTime) : null;
                    const regEndTime = activity.registrationEndTime ? new Date(activity.registrationEndTime) : null;

                    // 计算活动是否已结束 - 基于活动结束时间
                    const activityEndDate = activity.endDate || activity.date;
                    const activityEndTime = activityEndDate ? new Date(activityEndDate.replace(/-/g, '/') + ' 23:59:59') : null;
                    const isActivityEnded = activity.status === 'ended' || (activityEndTime && !isNaN(activityEndTime.getTime()) && now > activityEndTime);

                    // 最高优先级：活动结束
                    if (isActivityEnded) {
                        return (
                            <BlurView intensity={80} tint="light" style={[styles.deadlineTopLeft, styles.deadlineBadge]}>
                                <Text style={styles.activityEndedHint}>{t('activities.activity_ended', '活动结束')}</Text>
                            </BlurView>
                        );
                    }

                    // 第二优先级：停止报名
                    if (regEndTime && now > regEndTime) {
                        return (
                            <BlurView intensity={80} tint="light" style={[styles.deadlineTopLeft, styles.deadlineBadge]}>
                                <Text style={styles.deadlineHint}>{t('activities.status.registration_closed', '停止报名')}</Text>
                            </BlurView>
                        );
                    }

                    // 第三优先级：开放报名（默认状态）
                    return (
                        <BlurView intensity={80} tint="light" style={[styles.deadlineTopLeft, styles.deadlineBadge]}>
                            <Text style={styles.registrationOpenHint}>{t('activities.status.registration_open', '开放报名')}</Text>
                        </BlurView>
                    );
                })()}

                <View style={styles.infoGrid}>
                    {/* 左侧：头像堆（有真实数据时）+ 报名数字和状态栏 */}
                    <View style={styles.leftColumn}>
                        {activity.registeredUserAvatars && activity.registeredUserAvatars.length > 0 && (
                            <View style={styles.avatarStack}>
                                {activity.registeredUserAvatars.slice(0, 3).map((avatarUrl, i) => (
                                    <Image
                                        key={i}
                                        source={{ uri: avatarUrl }}
                                        style={[styles.miniAvatar, { marginLeft: i === 0 ? 0 : -3, zIndex: 3 - i }]}
                                    />
                                ))}
                                {registeredCount > 3 && (
                                    <View style={[styles.miniAvatar, styles.moreAvatar, { marginLeft: -3, zIndex: 0 }]}>
                                        <Text style={styles.moreAvatarText}>+{Math.min(registeredCount - 3, 99)}</Text>
                                    </View>
                                )}
                            </View>
                        )}
                        <View style={styles.registrationSection}>
                            <View style={styles.registrationRow}>
                                <Text style={styles.progressNum}>{registeredCount}/{maxCount}</Text>
                                <Text style={styles.progressLabel}>Registered</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                            </View>
                        </View>
                    </View>

                    {/* 中间和右侧：活动名字、日期、地点 */}
                    <View style={styles.rightColumn}>
                        {/* 活动名字 - 自适应，最多2行 */}
                        <Text style={styles.activityTitle} numberOfLines={2}>
                            {activity.title || "Activity Title"}
                        </Text>

                        {/* 日期 */}
                        <View style={styles.metaRow}>
                            <Ionicons name="calendar-clear-outline" size={14} color="#666" style={{marginRight: 4}} />
                            <Text style={styles.metaText} numberOfLines={2}>{activity.date?.replace(/-/g, '/')}{activity.endDate ? `\n- ${activity.endDate.replace(/-/g, '/')}` : ''}</Text>
                        </View>

                        {/* 地点 */}
                        <View style={[styles.metaRow, {alignItems: 'flex-start'}]}>
                            <Ionicons name="location-outline" size={14} color="#666" style={{marginRight: 4, marginTop: 1}} />
                            <Text style={[styles.metaText, {flexShrink: 1}]} numberOfLines={2}>{activity.location || "Location"}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export const FeaturedActivityCard = memo(FeaturedActivityCardComponent);

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        marginRight: 23,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#eee',
    },
    bottomPanelContainer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: BOTTOM_PANEL_HEIGHT,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    contentOverlay: {
        ...StyleSheet.absoluteFillObject,
        paddingHorizontal: 14,
        paddingBottom: 16,
        paddingTop: 12,
        justifyContent: 'flex-end',
    },
    deadlineTopLeft: {
        position: 'absolute',
        top: 16,
        left: 20,
        zIndex: 25,
    },
    deadlineBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 24,
        overflow: 'hidden',
    },
    topRightArrow: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 41,
        height: 41,
        borderRadius: 20.5,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 30,
    },
    infoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginHorizontal: -13, // extend to near card edges (14-1=13px)
    },
    leftColumn: {
        width: 96,
        alignItems: 'flex-start',
    },
    rightColumn: {
        width: 122,
        alignItems: 'flex-start',
    },
    avatarStack: {
        flexDirection: 'row',
        marginBottom: 4,
        alignItems: 'center',
        paddingLeft: 4,
    },
    miniAvatar: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    moreAvatar: {
        backgroundColor: '#F9A789',
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreAvatarText: {
        fontSize: 6,
        color: '#fff',
        fontWeight: '900',
    },
    registrationSection: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: 84,
        paddingHorizontal: 10,
        paddingVertical: 4,
        width: 96,
    },
    registrationRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 2,
    },
    progressNum: {
        fontSize: 8,
        fontWeight: '400',
        color: '#1a1a1a',
        lineHeight: 12,
    },
    progressLabel: {
        fontSize: 8,
        color: '#939393',
        marginLeft: 4,
        fontWeight: '400',
        lineHeight: 12,
    },
    deadlineHint: {
        fontSize: 12,
        color: '#CC2929',
        fontWeight: '700',
    },
    registrationOpenHint: {
        fontSize: 12,
        color: '#2E8B3D',
        fontWeight: '700',
    },
    activityEndedHint: {
        fontSize: 12,
        color: '#000000',
        fontWeight: '700',
    },
    progressBarBg: {
        height: 5,
        backgroundColor: '#F8F8F8',
        borderRadius: 2.5,
        width: 77,
        overflow: 'hidden',
        marginTop: 2,
    },
    progressBarFill: {
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#2FD573',
    },
    activityTitle: {
        fontSize: 15,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
        lineHeight: 22.5,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    metaText: {
        fontSize: 10,
        fontFamily: 'Poppins-Regular',
        fontWeight: '400',
        color: '#000',
        lineHeight: 15,
    },
    logoContainer: {
        position: 'absolute',
        bottom: LOGO_BOTTOM_OFFSET,
        left: LOGO_LEFT,
        zIndex: 20,
    },
    logoBorder: {
        width: 59,
        height: 59,
        borderRadius: 29.5,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 5,
    },
    logoImage: {
        width: 51,
        height: 49,
        borderRadius: 24.5,
    },
});

