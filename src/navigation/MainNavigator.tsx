import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, CardStyleInterpolators, TransitionPresets } from '@react-navigation/stack';
import { View, Easing } from 'react-native';
import { colors } from '../theme';
import { CustomTabBar } from '../components/navigation';

// Screens
import TodayScreen from '../screens/home/TodayScreen';
import InsightsScreen from '../screens/insights/InsightsScreen';
import SocialScreen from '../screens/social/SocialScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AddHabitScreen from '../screens/habits/AddHabitScreen';
import EditHabitScreen from '../screens/habits/EditHabitScreen';
import PremiumScreen from '../screens/premium/PremiumScreen';

// Types
export type MainTabParamList = {
  TodayTab: undefined;
  Insights: undefined;
  AddHabitPlaceholder: undefined;
  Social: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  AddHabit: undefined;
  EditHabit: { habitId: string };
  Premium: undefined;
};

// For backwards compatibility
export type HomeStackParamList = RootStackParamList;

const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

// Placeholder for Add screen (never shown, intercepted by listener)
const AddPlaceholder = () => <View style={{ flex: 1, backgroundColor: colors.background.primary }} />;

// Custom transition config for modal with scale + slide
const modalTransitionConfig = {
  animation: 'spring' as const,
  config: {
    stiffness: 200,
    damping: 25,
    mass: 0.8,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
};

// Custom screen options for modals with beautiful transitions
const modalScreenOptions = {
  headerShown: false,
  presentation: 'modal' as const,
  gestureEnabled: true,
  cardOverlayEnabled: true,
  cardStyle: {
    backgroundColor: 'transparent',
  },
  cardStyleInterpolator: ({ current, layouts }: any) => {
    const translateY = current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [layouts.screen.height, 0],
    });
    
    const scale = current.progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.9, 0.95, 1],
    });
    
    const opacity = current.progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.5, 1],
    });
    
    const borderRadius = current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [40, 20],
    });

    return {
      cardStyle: {
        transform: [
          { translateY },
          { scale },
        ],
        opacity,
        borderTopLeftRadius: borderRadius,
        borderTopRightRadius: borderRadius,
        overflow: 'hidden' as const,
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.6],
        }),
        backgroundColor: colors.background.primary,
      },
    };
  },
  transitionSpec: {
    open: modalTransitionConfig,
    close: modalTransitionConfig,
  },
};

// Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="TodayTab" component={TodayScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="AddHabitPlaceholder" component={AddPlaceholder} />
      <Tab.Screen name="Social" component={SocialScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Root Stack with Tabs + Modal screens
export default function MainNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={TabNavigator} />
      <RootStack.Group screenOptions={modalScreenOptions}>
        <RootStack.Screen name="AddHabit" component={AddHabitScreen} />
        <RootStack.Screen name="EditHabit" component={EditHabitScreen} />
        <RootStack.Screen name="Premium" component={PremiumScreen} />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}
