import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../../components/web/WebLinearGradient';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { useUser } from '../../context/UserContext';

interface UserInfoProps {
  variant?: 'header' | 'card' | 'compact';
  showRole?: boolean;
  showStatus?: boolean;
  onPress?: () => void;
}

export const UserInfo: React.FC<UserInfoProps> = ({
  variant = 'header',
  showRole = true,
  showStatus = false,
  onPress,
}) => {
  const { t } = useTranslation();
  const { user } = useUser();
  
  if (!user) {
    return null;
  }

  const getAvatarSize = () => {
    switch (variant) {
      case 'compact': return 32;
      case 'card': return 56;
      default: return 48;
    }
  };

  const getUserRole = () => {
    if (user.permissions.isAdmin) return t('userInfo.roles.admin');
    if (user.permissions.isOrganizer) return t('userInfo.roles.organizer');
    if (user.permissions.canAccessVolunteerFeatures) return t('userInfo.roles.volunteer');
    return t('userInfo.roles.student');
  };

  const getStatusColor = () => {
    if (user.permissions.isAdmin) return theme.colors.danger;
    if (user.permissions.isOrganizer) return theme.colors.primary;
    if (user.permissions.canAccessVolunteerFeatures) return theme.colors.success;
    return theme.colors.text.secondary;
  };

  const renderContent = () => (
    <>
      {/* Avatar */}
      <View style={[styles.avatarContainer, { 
        width: getAvatarSize(), 
        height: getAvatarSize(),
        marginRight: variant === 'compact' ? theme.spacing[2] : theme.spacing[3]
      }]}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryPressed]}
          style={[styles.avatar, { 
            width: getAvatarSize(), 
            height: getAvatarSize(),
            borderRadius: getAvatarSize() / 2
          }]}
        >
          <Text style={[styles.avatarText, { 
            fontSize: variant === 'compact' ? theme.typography.fontSize.sm : theme.typography.fontSize.lg 
          }]}>
            {user.name.substring(0, 1)}
          </Text>
          {user.verified && (
            <View style={[styles.verifiedBadge, { 
              width: getAvatarSize() * 0.3, 
              height: getAvatarSize() * 0.3,
              bottom: -2,
              right: -2
            }]}>
              <Ionicons name="checkmark" size={getAvatarSize() * 0.2} color="white" />
            </View>
          )}
        </LinearGradient>
      </View>

      {/* User Info */}
      <View style={styles.userDetails}>
        <Text style={[styles.userName, { 
          fontSize: variant === 'compact' ? theme.typography.fontSize.base : theme.typography.fontSize.lg 
        }]}>
          {user.name}
        </Text>
        
        {showRole && (
          <View style={styles.roleContainer}>
            <View style={[styles.roleBadge, { backgroundColor: getStatusColor() + '20' }]}>
              <Text style={[styles.roleText, { color: getStatusColor() }]}>
                {getUserRole()}
              </Text>
            </View>
          </View>
        )}
        
        {showStatus && (
          <Text style={styles.statusText}>
            {user.schoolId ? `${user.schoolId.toUpperCase()} ${t('userInfo.student')}` : t('userInfo.user')}
          </Text>
        )}
        
        {variant !== 'compact' && (
          <Text style={styles.userEmail}>
            {user.email}
          </Text>
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        style={[styles.container, styles[`${variant}Container`]]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {renderContent()}
        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, styles[`${variant}Container`]]}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContainer: {
    paddingVertical: theme.spacing[2],
  },
  cardContainer: {
    backgroundColor: theme.liquidGlass.card.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.liquidGlass.card.border,
    ...theme.shadows.card,
  },
  compactContainer: {
    paddingVertical: theme.spacing[1],
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.button,
  },
  avatarText: {
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  verifiedBadge: {
    position: 'absolute',
    backgroundColor: theme.colors.success,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  roleContainer: {
    marginBottom: theme.spacing[1],
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1] / 2,
    borderRadius: theme.borderRadius.badge,
  },
  roleText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
  userEmail: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
});