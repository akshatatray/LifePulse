import { NavigationContainer, Theme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { syncManager } from '../services/sync';
import { useAuthStore } from '../stores/authStore';
import { useHabitStore } from '../stores/habitStore';
import { useSocialStore } from '../stores/socialStore';
import { colors, fontFamily } from '../theme';

// Navigators
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
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
  const { setHabits, setLogs, setLoading } = useHabitStore();
  const { clearSocialData } = useSocialStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Track the previous user ID to detect user changes
  const previousUserIdRef = useRef<string | null>(null);

  // Initialize Firebase auth listener
  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, []);

  // Handle user changes - clear data and sync from Firebase
  useEffect(() => {
    const handleUserChange = async () => {
      const currentUserId = user?.uid || null;
      const previousUserId = previousUserIdRef.current;

      // Check if user has changed (including login/logout)
      if (currentUserId !== previousUserId) {
        console.log('[RootNavigator] User changed:', previousUserId, '->', currentUserId);

        if (currentUserId) {
          // New user logged in
          console.log('[RootNavigator] New user, clearing and syncing data...');

          // Clear local data first
          setHabits([]);
          setLogs([]);
          clearSocialData();

          // Initialize sync manager
          syncManager.init(currentUserId);

          // Fetch fresh data from Firebase
          setIsSyncing(true);
          setLoading(true);

          try {
            const data = await syncManager.fullSync();
            if (data) {
              console.log('[RootNavigator] Synced habits:', data.habits.length, 'logs:', data.logs.length);
              setHabits(data.habits);
              setLogs(data.logs);
            }
          } catch (error) {
            console.error('[RootNavigator] Failed to sync data:', error);
          } finally {
            setLoading(false);
            setIsSyncing(false);
          }
        } else {
          // User logged out
          console.log('[RootNavigator] User logged out, clearing all data');
          syncManager.cleanup();
          setHabits([]);
          setLogs([]);
          clearSocialData();
        }

        // Update the previous user ID reference
        previousUserIdRef.current = currentUserId;
      }
    };

    if (isHydrated && isInitialized) {
      handleUserChange();
    }
  }, [isAuthenticated, user?.uid, isHydrated, isInitialized]);

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

  return (
    <NavigationContainer theme={lifePulseTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
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
