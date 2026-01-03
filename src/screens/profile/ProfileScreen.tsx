/**
 * ProfileScreen - User profile with gamification features
 */

import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Dimensions, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../components/Button';
import { Badge, BadgeUnlockAnimation } from '../../components/gamification/Badge';
import { LevelProgress, LevelUpAnimation } from '../../components/gamification/LevelProgress';
import { StreakFreezeCard } from '../../components/gamification/StreakFreeze';
import { PremiumStatus } from '../../components/premium';
import { Card } from '../../components/ui';
import { BadgeCategory, BADGES, CATEGORY_ICONS, getBadgesByCategory, sortBadgesByRarity } from '../../data/badges';
import { useAchievements } from '../../hooks/useAchievements';
import { useHaptics } from '../../hooks/useHaptics';
import { useSound } from '../../hooks/useSound';
import { useAuthStore } from '../../stores/authStore';
import { useGamificationStore } from '../../stores/gamificationStore';
import { useHabitStore } from '../../stores/habitStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { borderRadius, colors, fontFamily, fontSize, spacing, textStyles } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BADGE_SIZE = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md * 4) / 5;

// Badge category tabs
const BADGE_CATEGORIES: { key: BadgeCategory; label: string }[] = [
  { key: 'starter', label: 'Starter' },
  { key: 'streak', label: 'Streaks' },
  { key: 'consistency', label: 'Consistency' },
  { key: 'milestone', label: 'Milestones' },
  { key: 'special', label: 'Special' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, isLoading } = useAuthStore();
  const { habits, logs } = useHabitStore();
  const { unlockedBadges, totalPoints, level, streakFreezes } = useGamificationStore();
  
  // Settings state
  const {
    soundEnabled,
    hapticsEnabled,
    notificationsEnabled,
    showStreakBadges,
    setSoundEnabled,
    setHapticsEnabled,
    setNotificationsEnabled,
    setShowStreakBadges,
  } = useSettingsStore();
  
  const haptics = useHaptics();
  const sound = useSound();
  const { newlyUnlockedBadge, dismissBadgeNotification } = useAchievements();
  
  // UI state
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [selectedBadgeCategory, setSelectedBadgeCategory] = useState<BadgeCategory>('starter');
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Calculate stats from real data
  const stats = useMemo(() => {
    const totalHabits = habits.length;
    
    // Calculate best streak across all habits
    const bestStreak = habits.reduce((max, habit) => 
      Math.max(max, habit.longestStreak), 0
    );
    
    // Calculate current streak (days with at least one completion)
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateString = checkDate.toISOString().split('T')[0];
      
      const hasCompletion = logs.some(
        log => log.date === dateString && log.status === 'completed'
      );
      
      if (hasCompletion) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }
    
    // Calculate total completions
    const totalCompletions = logs.filter(log => log.status === 'completed').length;
    
    return {
      totalHabits,
      currentStreak,
      bestStreak,
      totalCompletions,
    };
  }, [habits, logs]);

  // Get badges for selected category
  const categoryBadges = useMemo(() => {
    const badges = getBadgesByCategory(selectedBadgeCategory);
    return sortBadgesByRarity(badges);
  }, [selectedBadgeCategory]);

  // Count unlocked badges
  const unlockedCount = useMemo(() => {
    return unlockedBadges.length;
  }, [unlockedBadges]);

  // Check if badge is unlocked
  const isBadgeUnlocked = useCallback((badgeId: string) => {
    return unlockedBadges.some((b) => b.badgeId === badgeId);
  }, [unlockedBadges]);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            haptics.medium();
            await logout();
          },
        },
      ]
    );
  };

  const handleToggleSound = (value: boolean) => {
    setSoundEnabled(value);
    if (value) {
      sound.pop();
    }
  };

  const handleToggleHaptics = (value: boolean) => {
    setHapticsEnabled(value);
    if (value) {
      haptics.medium();
    }
  };

  const toggleSettings = () => {
    haptics.selection();
    setSettingsExpanded(!settingsExpanded);
  };

  const handleCategoryChange = (category: BadgeCategory) => {
    haptics.selection();
    setSelectedBadgeCategory(category);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card with Level */}
        <Animated.View entering={FadeIn.duration(400)}>
          <Card variant="elevated" style={styles.userCard}>
            <View style={styles.userRow}>
              <View style={styles.avatarContainer}>
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                ) : (
                  <LinearGradient
                    colors={[colors.accent.success, '#059669']}
                    style={styles.avatarPlaceholder}
                  >
                    <Text style={styles.avatarText}>
                      {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </LinearGradient>
                )}
              </View>
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
                <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
              </View>
              
              <Pressable style={styles.editButton}>
                <Feather name="edit-2" size={18} color={colors.text.muted} />
              </Pressable>
            </View>

            {/* Level Progress */}
            <View style={styles.levelSection}>
              <LevelProgress showDetails />
            </View>
          </Card>
        </Animated.View>

        {/* Premium Status */}
        <Animated.View entering={FadeInDown.duration(400).delay(50)}>
          <PremiumStatus />
        </Animated.View>

        {/* Quick Stats Row */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatIcon}>🔥</Text>
              <Text style={styles.quickStatValue}>{stats.currentStreak}</Text>
              <Text style={styles.quickStatLabel}>Streak</Text>
            </View>
            
            <View style={styles.quickStatDivider} />
            
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatIcon}>✅</Text>
              <Text style={styles.quickStatValue}>{stats.totalCompletions}</Text>
              <Text style={styles.quickStatLabel}>Done</Text>
            </View>
            
            <View style={styles.quickStatDivider} />
            
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatIcon}>🏅</Text>
              <Text style={styles.quickStatValue}>{unlockedCount}/{BADGES.length}</Text>
              <Text style={styles.quickStatLabel}>Badges</Text>
            </View>
            
            <View style={styles.quickStatDivider} />
            
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatIcon}>✨</Text>
              <Text style={styles.quickStatValue}>{totalPoints}</Text>
              <Text style={styles.quickStatLabel}>XP</Text>
            </View>
          </View>
        </Animated.View>

        {/* Streak Freeze Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)}>
          <StreakFreezeCard />
        </Animated.View>

        {/* Badges Section */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.sectionSubtitle}>
              {unlockedCount} of {BADGES.length} unlocked
            </Text>
          </View>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryTabs}
          >
            {BADGE_CATEGORIES.map((category, index) => {
              const isActive = selectedBadgeCategory === category.key;
              const categoryUnlocked = getBadgesByCategory(category.key).filter(
                (b) => isBadgeUnlocked(b.id)
              ).length;
              const categoryTotal = getBadgesByCategory(category.key).length;
              
              return (
                <Pressable
                  key={category.key}
                  onPress={() => handleCategoryChange(category.key)}
                  style={[
                    styles.categoryTab,
                    isActive && styles.categoryTabActive,
                  ]}
                >
                  <Text style={styles.categoryIcon}>
                    {CATEGORY_ICONS[category.key]}
                  </Text>
                  <Text
                    style={[
                      styles.categoryTabText,
                      isActive && styles.categoryTabTextActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                  <Text style={[
                    styles.categoryCount,
                    isActive && styles.categoryCountActive,
                  ]}>
                    {categoryUnlocked}/{categoryTotal}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Badge Grid */}
          <Animated.View
            layout={Layout.springify()}
            style={styles.badgeGrid}
          >
            {categoryBadges.map((badge, index) => (
              <Animated.View
                key={badge.id}
                entering={FadeInRight.delay(index * 50).duration(300)}
                style={styles.badgeWrapper}
              >
                <Badge
                  badge={badge}
                  isUnlocked={isBadgeUnlocked(badge.id)}
                  size="medium"
                  showDetails
                  index={index}
                  animateOnMount={false}
                />
              </Animated.View>
            ))}
          </Animated.View>
        </Animated.View>

        {/* Settings Section */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Settings</Text>
          </View>
          
          {/* Sound & Haptics - Expandable */}
          <Pressable onPress={toggleSettings}>
            <Card style={styles.menuItem}>
              <View style={styles.menuItemIcon}>
                <Feather name="volume-2" size={20} color={colors.accent.success} />
              </View>
              <Text style={styles.menuItemText}>Sound & Haptics</Text>
              <Feather 
                name={settingsExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.text.muted} 
              />
            </Card>
          </Pressable>

          {/* Expanded Settings */}
          {settingsExpanded && (
            <Animated.View 
              entering={FadeInDown.duration(200)}
              style={styles.settingsPanel}
            >
              {/* Sound Toggle */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Feather name="music" size={18} color={colors.text.secondary} />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>Sound Effects</Text>
                    <Text style={styles.settingDescription}>Play sounds on completion</Text>
                  </View>
                </View>
                <Switch
                  value={soundEnabled}
                  onValueChange={handleToggleSound}
                  trackColor={{ false: colors.background.elevated, true: colors.accent.success + '60' }}
                  thumbColor={soundEnabled ? colors.accent.success : colors.text.muted}
                  ios_backgroundColor={colors.background.elevated}
                />
              </View>

              {/* Haptics Toggle */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Feather name="smartphone" size={18} color={colors.text.secondary} />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>Haptic Feedback</Text>
                    <Text style={styles.settingDescription}>Vibration on interactions</Text>
                  </View>
                </View>
                <Switch
                  value={hapticsEnabled}
                  onValueChange={handleToggleHaptics}
                  trackColor={{ false: colors.background.elevated, true: colors.accent.success + '60' }}
                  thumbColor={hapticsEnabled ? colors.accent.success : colors.text.muted}
                  ios_backgroundColor={colors.background.elevated}
                />
              </View>

              {/* Streak Badges Toggle */}
              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingEmoji}>🔥</Text>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>Streak Badges</Text>
                    <Text style={styles.settingDescription}>Show streak count on cards</Text>
                  </View>
                </View>
                <Switch
                  value={showStreakBadges}
                  onValueChange={setShowStreakBadges}
                  trackColor={{ false: colors.background.elevated, true: colors.accent.success + '60' }}
                  thumbColor={showStreakBadges ? colors.accent.success : colors.text.muted}
                  ios_backgroundColor={colors.background.elevated}
                />
              </View>
            </Animated.View>
          )}

          {/* Notifications */}
          <Card style={styles.menuItem}>
            <View style={styles.menuItemIcon}>
              <Feather name="bell" size={20} color={colors.text.secondary} />
            </View>
            <Text style={styles.menuItemText}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.background.elevated, true: colors.accent.success + '60' }}
              thumbColor={notificationsEnabled ? colors.accent.success : colors.text.muted}
              ios_backgroundColor={colors.background.elevated}
            />
          </Card>

          {/* Help & Support */}
          <Card style={styles.menuItem}>
            <View style={styles.menuItemIcon}>
              <Feather name="help-circle" size={20} color={colors.text.secondary} />
            </View>
            <Text style={styles.menuItemText}>Help & Support</Text>
            <Feather name="chevron-right" size={20} color={colors.text.muted} />
          </Card>

          {/* Privacy */}
          <Card style={styles.menuItem}>
            <View style={styles.menuItemIcon}>
              <Feather name="shield" size={20} color={colors.text.secondary} />
            </View>
            <Text style={styles.menuItemText}>Privacy Policy</Text>
            <Feather name="chevron-right" size={20} color={colors.text.muted} />
          </Card>
        </Animated.View>

        {/* Logout Button */}
        <Button
          title="Sign Out"
          variant="danger"
          onPress={handleLogout}
          loading={isLoading}
          icon={<Feather name="log-out" size={18} color={colors.text.primary} />}
          style={styles.logoutButton}
        />

        {/* Version */}
        <Text style={styles.versionText}>LifePulse v1.0.0</Text>
        
        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Badge Unlock Animation */}
      {newlyUnlockedBadge && (
        <BadgeUnlockAnimation
          badge={newlyUnlockedBadge}
          visible={!!newlyUnlockedBadge}
          onDismiss={dismissBadgeNotification}
        />
      )}

      {/* Level Up Animation */}
      <LevelUpAnimation
        visible={showLevelUp}
        newLevel={level}
        onDismiss={() => setShowLevelUp(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...textStyles.headlineLarge,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  
  // User Card
  userCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.text.inverse,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...textStyles.titleLarge,
    color: colors.text.primary,
  },
  userEmail: {
    ...textStyles.bodySmall,
    color: colors.text.muted,
    marginTop: 2,
  },
  editButton: {
    padding: spacing.sm,
  },
  levelSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  
  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  quickStatValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
  quickStatLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.subtle,
  },
  
  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
  
  // Category Tabs
  categoryTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  categoryTabActive: {
    backgroundColor: colors.accent.success + '20',
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryTabText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  categoryTabTextActive: {
    color: colors.accent.success,
    fontFamily: fontFamily.semiBold,
  },
  categoryCount: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
  categoryCountActive: {
    color: colors.accent.success,
  },
  
  // Badge Grid
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  badgeWrapper: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md * 4) / 3,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  
  // Menu items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  menuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    ...textStyles.bodyLarge,
    color: colors.text.primary,
    flex: 1,
    marginLeft: spacing.md,
  },
  
  // Settings panel
  settingsPanel: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    marginTop: -spacing.xs,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  settingLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text.primary,
  },
  settingDescription: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  settingEmoji: {
    fontSize: 18,
    width: 18,
    textAlign: 'center',
  },
  
  // Logout
  logoutButton: {
    marginTop: spacing.xl,
  },
  versionText: {
    ...textStyles.bodySmall,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
});
