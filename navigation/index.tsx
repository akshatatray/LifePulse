import { NavigationContainer, Theme } from '@react-navigation/native';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import Overview from '../screens/overview';
import Details from '../screens/details';
import { BackButton } from '../components/BackButton';
import { colors, fontFamily } from '../src/theme';

// Define the param list for type safety
export type RootStackParamList = {
  Overview: undefined;
  Details: { name: string };
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
    interface RootParamList extends RootStackParamList {}
  }
}

export default function Navigation() {
  return (
    <NavigationContainer theme={lifePulseTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background.primary,
          },
          headerTintColor: colors.text.primary,
          headerTitleStyle: {
            fontFamily: fontFamily.bold,
          },
          headerShadowVisible: false,
          cardStyle: {
            backgroundColor: colors.background.primary,
          },
        }}
      >
        <Stack.Screen
          name="Overview"
          component={Overview}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Details"
          component={Details}
          options={({ navigation }) => ({
            headerLeft: () => <BackButton onPress={navigation.goBack} />,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Export screen props types for use in screens
export type OverviewScreenProps = StackScreenProps<RootStackParamList, 'Overview'>;
export type DetailsScreenProps = StackScreenProps<RootStackParamList, 'Details'>;
