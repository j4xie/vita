import React, { memo, useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { FrontendActivity } from '../../utils/activityAdapter';
import { useSchoolLogos, getSchoolLogoSync } from '../../hooks/useSchoolLogos';
import { formatDateRange } from '../../utils/cardUtils';
import { CalendarIcon, LocationIcon, ShareIcon } from '../icons/ActivityIcons';
import { useRegisteredAvatars, getAvatarColor } from '../../hooks/useRegisteredAvatars';

interface FeaturedActivityCardProps {
    activity: FrontendActivity;
    onPress: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = Math.round(screenWidth * 0.65);
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.286);

// 底部面板几何参数
const BOTTOM_PANEL_HEIGHT = Math.round(CARD_HEIGHT * 0.30);
const PANEL_TOP_Y = CARD_HEIGHT - BOTTOM_PANEL_HEIGHT;

const LOGO_SIZE = 59;
const LOGO_RADIUS = LOGO_SIZE / 2;
const LOGO_LEFT = 13;
const NOTCH_RADIUS = 36;
const CORNER_R = 32;

// 底部信息区域
const CONTENT_PADDING = 12;

// 两列布局
const COL_GAP = 8;
const LEFT_COL_WIDTH = Math.round((CARD_WIDTH - 2 * CONTENT_PADDING - COL_GAP) * 0.42);

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
    const { users: registeredUsers } = useRegisteredAvatars(activity.id?.toString());

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

    // 是否有真实报名用户数据
    const hasRealUsers = registeredUsers.length > 0;
    const dateDisplay = formatDateRange(activity.date || '', activity.endDate, { padZero: true });
    const timeDisplay = activity.time && activity.time !== '00:00' ? activity.time : '';
    const dateTimeDisplay = timeDisplay ? `${dateDisplay}  ${timeDisplay}` : dateDisplay;

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.95}>
            {/* 【层级 0】 底层背景照片 */}
            <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />

            {/* 【层级 1】 半透明蒙版层 - Figma: 白色 80% */}
            <View style={[styles.bottomPanelContainer, { overflow: 'visible' }]}>
                <Svg height={BOTTOM_PANEL_HEIGHT} width={CARD_WIDTH} style={StyleSheet.absoluteFill}>
                    <Path
                        d={`M${CARD_WIDTH} ${BOTTOM_PANEL_HEIGHT}H0V0H1.19923C3.99109 0 6.366 1.94728 7.33869 4.56422C12.6425 18.8336 26.3839 29 42.5 29C58.6161 29 72.3575 18.8336 77.6613 4.56422C78.634 1.94729 81.0089 0 83.8008 0H${CARD_WIDTH}L${CARD_WIDTH} ${BOTTOM_PANEL_HEIGHT}Z`}
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

            {/* 【层级 2】 右上箭头 */}
            <View style={styles.topRightArrow}>
                <ShareIcon size={20} color="#949494" />
            </View>

            {/* 状态徽章 — 直接在卡片层级，绝对定位 */}
            {(() => {
                const now = new Date();
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

            {/* 【层级 3】 底部内容层 */}
            <View style={styles.bottomContent}>
                {/* 标题 — 固定2行高度，左边界对齐 logo 右侧 */}
                <View style={styles.titleContainer}>
                    <Text style={styles.activityTitle} numberOfLines={2}>
                        {activity.title || 'Activity Title'}
                    </Text>
                </View>

                {/* 两列: 左=头像+胶囊, 右=日期时间+地点 */}
                <View style={styles.infoGrid}>
                    <View style={styles.leftColumn}>
                        {/* 胶囊 + 头像：头像从胶囊垂直中心向上铺开 */}
                        <View style={[styles.registrationWrapper, (hasRealUsers || registeredCount > 0) && styles.registrationWrapperWithAvatars]}>
                            {(hasRealUsers || registeredCount > 0) && (
                                <View style={styles.avatarStack}>
                                    {hasRealUsers ? (
                                        registeredUsers.slice(0, 3).map((user, i) => (
                                            user.avatar ? (
                                                <Image
                                                    key={user.userId}
                                                    source={{ uri: user.avatar }}
                                                    style={[styles.miniAvatar, { marginLeft: i === 0 ? 0 : -5, zIndex: 3 - i }]}
                                                />
                                            ) : (
                                                <View
                                                    key={user.userId}
                                                    style={[styles.miniAvatar, { marginLeft: i === 0 ? 0 : -5, zIndex: 3 - i, backgroundColor: getAvatarColor(user.userId), justifyContent: 'center', alignItems: 'center' }]}
                                                >
                                                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{user.initial}</Text>
                                                </View>
                                            )
                                        ))
                                    ) : (
                                        Array.from({ length: Math.min(registeredCount, 3) }, (_, i) => (
                                            <Image
                                                key={i}
                                                source={{ uri: `https://ui-avatars.com/api/?name=${['A','B','C'][i]}&background=${['FF6B6B','4ECDC4','FFE66D'][i]}&color=fff&size=52&bold=true` }}
                                                style={[styles.miniAvatar, { marginLeft: i === 0 ? 0 : -5, zIndex: 3 - i }]}
                                            />
                                        ))
                                    )}
                                    {registeredCount > 3 && (
                                        <View style={[styles.miniAvatar, styles.moreAvatar, { marginLeft: -5, zIndex: 0 }]}>
                                            <Text style={styles.moreAvatarText}>+{Math.min(registeredCount - 3, 99)}</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                            <View style={styles.registrationSection}>
                                <Text style={styles.registrationText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                                    <Text style={styles.progressNum}>{registeredCount}/{maxCount} </Text>
                                    <Text style={styles.progressLabel}>Registered</Text>
                                </Text>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: progress >= 0.75 ? '#FE654F' : '#2FD573' }]} />
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.rightColumn}>
                        <View style={styles.metaRow}>
                            <View style={styles.metaIcon}>
                                <CalendarIcon />
                            </View>
                            <Text style={styles.dateText} numberOfLines={2}>{dateTimeDisplay}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <View style={styles.metaIcon}>
                                <LocationIcon />
                            </View>
                            <Text style={styles.locationText} numberOfLines={1}>{activity.location || 'Location'}</Text>
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
    bottomContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: BOTTOM_PANEL_HEIGHT,
        paddingHorizontal: CONTENT_PADDING,
        paddingTop: 8,
        paddingBottom: 10,
        overflow: 'hidden',
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
    titleContainer: {
        maxHeight: 40, // 最多2行 × lineHeight 20
        marginLeft: LOGO_LEFT + LOGO_SIZE - CONTENT_PADDING + 19,
        alignItems: 'center',
    },
    infoGrid: {
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: COL_GAP,
        marginTop: 1,
        flex: 1,
    },
    leftColumn: {
        width: LEFT_COL_WIDTH,
        justifyContent: 'center',
    },
    registrationWrapper: {
        position: 'relative',
        alignSelf: 'stretch',
    },
    registrationWrapperWithAvatars: {
        // 头像(26px) + 间距(1px) = 27px 预留空间
        paddingTop: 27,
    },
    rightColumn: {
        flex: 1,
        justifyContent: 'center',
        gap: 6,
    },
    avatarStack: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        // 头像在胶囊上方2px，水平居中
        // 胶囊从 paddingTop(28) 开始，头像底部 = 28 - 2 = 26，头像顶部 = 26 - 26 = 0
        top: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        zIndex: 2,
    },
    miniAvatar: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    moreAvatar: {
        backgroundColor: '#F9A789',
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreAvatarText: {
        fontSize: 8,
        color: '#fff',
        fontWeight: '900',
    },
    registrationSection: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 13,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'stretch',
    },
    registrationText: {
        lineHeight: 18,
    },
    progressNum: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1B1B1B',
        lineHeight: 18,
    },
    progressLabel: {
        fontSize: 12,
        color: '#949494',
        marginLeft: 4,
        fontWeight: '400',
        lineHeight: 18,
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
        width: '100%',
        overflow: 'hidden',
        marginTop: 3,
    },
    progressBarFill: {
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#FE654F',
    },
    activityTitle: {
        fontSize: 15,
        fontFamily: 'Poppins_600SemiBold',
        fontWeight: '600',
        color: '#111827',
        lineHeight: 20,
        textAlign: 'center',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    metaIcon: {
        marginRight: 4,
        marginTop: 1,
    },
    dateText: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        fontWeight: '400',
        color: '#4B5563',
        lineHeight: 16,
        flex: 1,
    },
    locationText: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        fontWeight: '400',
        color: '#4B5563',
        lineHeight: 16,
        flex: 1,
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

