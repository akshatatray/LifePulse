import { NavigationContainer, Theme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import { syncManager } from '../services/sync';
import { useAuthStore } from '../stores/authStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { useHabitStore } from '../stores/habitStore';
import { usePremiumStore } from '../stores/premiumStore';
import { useSocialStore } from '../stores/socialStore';
import { colors, fontFamily } from '../theme';

// Navigators
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
  EmailVerification: undefined;
};

// Custom dark theme aligned with our design system
const lifePulseTheme: Theme = {
  dark: true,
  colors: {
    primary: colors.accent.success,
    background: colors.background.primary,
    card: colors.background.card,
    text: colors.text.primary,
    border: colors.border.default,
    notification: colors.accent.error,
  },
  fonts: {
    regular: {
      fontFamily: fontFamily.regular,
      fontWeight: '400',
    },
    medium: {
      fontFamily: fontFamily.semiBold,
      fontWeight: '500',
    },
    bold: {
      fontFamily: fontFamily.bold,
      fontWeight: '700',
    },
    heavy: {
      fontFamily: fontFamily.extraBold,
      fontWeight: '800',
    },
  },
};

const Stack = createStackNavigator<RootStackParamList>();

// Declare global types for useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}

export default function RootNavigator() {
  const { isAuthenticated, isInitialized, initializeAuth, user } = useAuthStore();
  const { setHabits, setLogs, setLoading, setUserId: setHabitUserId } = useHabitStore();
  const { clearSocialData } = useSocialStore();
  const { setUserId: setGamificationUserId, syncFromFirebase: syncGamificationFromFirebase, clearData: clearGamificationData } = useGamificationStore();
  const { setUserId: setPremiumUserId, syncFromFirebase: syncPremiumFromFirebase, clearData: clearPremiumData, checkSubscriptionValidity } = usePremiumStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Track the previous user ID and verification status to detect changes
  const previousUserIdRef = useRef<string | null>(null);
  const previousVerifiedRef = useRef<boolean>(false);

  // Initialize Firebase auth listener
  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, []);

  // Handle user changes - clear data and sync from Firebase
  // Only sync when email is verified
  useEffect(() => {
    const handleUserChange = async () => {
      const currentUserId = user?.uid || null;
      const currentDisplayName = user?.displayName || 'User';
      const isEmailVerified = user?.emailVerified || false;
      const previousUserId = previousUserIdRef.current;
      const wasVerified = previousVerifiedRef.current;

      // Check if user has changed (including login/logout)
      const userChanged = currentUserId !== previousUserId;
      // Check if verification status changed for the same user
      const verificationChanged = currentUserId && currentUserId === previousUserId && isEmailVerified && !wasVerified;

      if (userChanged) {
        console.log('[RootNavigator] User changed:', previousUserId, '->', currentUserId, 'verified:', isEmailVerified);

        if (currentUserId) {
          // New user logged in - clear local data first
          console.log('[RootNavigator] New user, clearing local data...');
          setHabits([]);
          setLogs([]);
          clearSocialData();
          clearGamificationData();
          clearPremiumData();

          // Only sync data if email is verified
          if (isEmailVerified) {
            await syncUserData(currentUserId, currentDisplayName);
          } else {
            console.log('[RootNavigator] Email not verified, skipping sync');
          }
        } else {
          // User logged out
          console.log('[RootNavigator] User logged out, clearing all data');
          syncManager.cleanup();
          setHabits([]);
          setLogs([]);
          clearSocialData();
          clearGamificationData();
          clearPremiumData();
          setGamificationUserId(null);
          setHabitUserId(null);
          setPremiumUserId(null);
        }

        // Update references
        previousUserIdRef.current = currentUserId;
        previousVerifiedRef.current = isEmailVerified;
      } else if (verificationChanged) {
        // Same user just verified their email - sync data now
        console.log('[RootNavigator] Email just verified, starting sync...');
        await syncUserData(currentUserId, currentDisplayName);
        previousVerifiedRef.current = isEmailVerified;
      }
    };

    // Helper function to sync user data
    const syncUserData = async (userId: string, displayName: string) => {
      console.log('[RootNavigator] Syncing data for verified user...');

      // Set user context for stores that need it
      setGamificationUserId(userId, displayName);
      setHabitUserId(userId);
      setPremiumUserId(userId);

      // Initialize sync manager
      syncManager.init(userId);

      // Fetch fresh data from Firebase
      setIsSyncing(true);
      setLoading(true);

      try {
        // Sync habits and logs
        const data = await syncManager.fullSync();
        if (data) {
          console.log('[RootNavigator] Synced habits:', data.habits.length, 'logs:', data.logs.length);
          setHabits(data.habits);
          setLogs(data.logs);
        }

        // Sync gamification data (XP, badges, stats)
        console.log('[RootNavigator] Syncing gamification data...');
        await syncGamificationFromFirebase();
        console.log('[RootNavigator] Gamification data synced');

        // Sync premium/subscription data
        console.log('[RootNavigator] Syncing premium data...');
        await syncPremiumFromFirebase();
        // Check if subscription is still valid
        await checkSubscriptionValidity();
        console.log('[RootNavigator] Premium data synced');
      } catch (error) {
        console.error('[RootNavigator] Failed to sync data:', error);
      } finally {
        setLoading(false);
        setIsSyncing(false);
      }
    };

    if (isHydrated && isInitialized) {
      handleUserChange();
    }
  }, [isAuthenticated, user?.uid, user?.emailVerified, isHydrated, isInitialized]);

  // Wait for Zustand to rehydrate from AsyncStorage
  useEffect(() => {
    // Small delay to allow Zustand persist to hydrate
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Show loading screen while hydrating, initializing auth, or syncing new user data
  if (!isHydrated || !isInitialized || isSyncing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.success} />
      </View>
    );
  }

  // Determine which screen to show based on auth and verification status
  const isEmailVerified = user?.emailVerified ?? false;
  const needsVerification = isAuthenticated && !isEmailVerified;

  return (
    <NavigationContainer theme={lifePulseTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          needsVerification ? (
            // User is logged in but email not verified - show verification screen
            <Stack.Screen
              name="EmailVerification"
              component={EmailVerificationScreen}
            />
          ) : (
            // User is logged in and verified - show main app
            <Stack.Screen name="Main" component={MainNavigator} />
          )
        ) : (
          // User is not logged in - show auth flow
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{
              animationTypeForReplace: isAuthenticated ? 'push' : 'pop',
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
});
