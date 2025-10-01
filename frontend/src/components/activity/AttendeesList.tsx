import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';

interface AttendeesListProps {
  count: number;
  maxDisplay?: number;
}

export const AttendeesList: React.FC<AttendeesListProps> = ({
  count,
  maxDisplay = 4,
}) => {
  const { t } = useTranslation();

  // 生成Mock头像数据 - 使用UI Avatars API
  const generateMockAvatars = () => {
    const displayCount = Math.min(count, maxDisplay);
    return Array.from({ length: displayCount }).map((_, index) => ({
      id: index,
      avatar: `https://ui-avatars.com/api/?name=User${index + 1}&background=random&color=fff&size=128`,
    }));
  };

  const mockAttendees = generateMockAvatars();
  const remainingCount = Math.max(0, count - maxDisplay);

  if (count === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Going Count */}
      <Text style={styles.goingText}>
        {count} {t('activityDetail.going') || 'Going'}
      </Text>

      {/* Avatar List */}
      <View style={styles.avatarContainer}>
        {mockAttendees.map((attendee, index) => (
          <View
            key={attendee.id}
            style={[
              styles.avatarWrapper,
              index > 0 && { marginLeft: -12 }, // 重叠效果
            ]}
          >
            <Image
              source={{ uri: attendee.avatar }}
              style={styles.avatar}
            />
          </View>
        ))}

        {/* Remaining Count Badge */}
        {remainingCount > 0 && (
          <View style={[styles.avatarWrapper, styles.remainingBadge, { marginLeft: -12 }]}>
            <Text style={styles.remainingText}>+{remainingCount}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  },
  goingText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginBottom: theme.spacing[2],
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  remainingBadge: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
});
