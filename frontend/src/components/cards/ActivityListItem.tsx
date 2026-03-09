import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { FrontendActivity } from '../../utils/activityAdapter';

interface ActivityListItemProps {
    activity: FrontendActivity;
    onPress: () => void;
}

export const ActivityListItem: React.FC<ActivityListItemProps> = ({ activity, onPress }) => {
    // Format date/time
    const formatDate = (dateStr: string, timeStr?: string) => {
        try {
            // Assuming dateStr is YYYY-MM-DD
            const date = new Date(dateStr);
            // Format to YYYY/MM/DD
            const formattedDate = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;

            let display = formattedDate;
            if (timeStr) {
                // Simple time formatting if needed, trusting input for now
                display += `  ${timeStr}`;
            }
            return display;
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Left: School/Organizer Logo */}
            <View style={styles.logoContainer}>
                {activity.organizer?.avatar ? (
                    <Image
                        source={{ uri: activity.organizer.avatar }}
                        style={styles.logo}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.logo, { backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="school-outline" size={24} color="#999" />
                    </View>
                )}
            </View>

            {/* Middle: Content */}
            <View style={styles.contentContainer}>
                <Text style={styles.organizerName} numberOfLines={1}>
                    {activity.organizer?.name || 'Organizer'}
                </Text>
                <Text style={styles.title} numberOfLines={2}>
                    {activity.title}
                </Text>
                <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={12} color="#909399" style={{ marginRight: 4 }} />
                    <Text style={styles.dateText}>
                        {formatDate(activity.date, activity.time)}
                    </Text>
                </View>
            </View>

            {/* Right: Arrow Action */}
            <View style={styles.actionContainer}>
                <View style={styles.arrowButton}>
                    <Ionicons name="arrow-forward" size={18} color="#1A1A1A" style={{ transform: [{ rotate: '-45deg' }] }} />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 12,
        borderRadius: 16,
        // Soft shadow like in the screenshot
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    logoContainer: {
        marginRight: 16,
    },
    logo: {
        width: 56,
        height: 56,
        borderRadius: 28, // Circle
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    organizerName: {
        fontSize: 12,
        color: '#909399',
        marginBottom: 4,
        fontWeight: '400',
    },
    title: {
        fontSize: 16,
        color: '#1A1A1A',
        fontWeight: 'bold',
        marginBottom: 6,
        lineHeight: 22,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 12,
        color: '#909399',
        fontWeight: '400',
    },
    actionContainer: {
        marginLeft: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrowButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F5F5F5',
    },
});
