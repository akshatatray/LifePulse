# LifePulse Development Plan

> **"Compassionate Precision"** - A gamified, animation-heavy habit tracking app  
> Tech Stack: React Native (Expo), React Navigation, Firebase (Auth/Firestore)

---

## 📋 Table of Contents

1. [Current Setup Analysis](#current-setup-analysis)
2. [Pre-Development Configuration (YOU DO)](#pre-development-configuration-you-do)
3. [Phase 1: MVP Core](#phase-1-mvp-core)
4. [Phase 2: Advanced Features](#phase-2-advanced-features)
5. [Phase 3: Gamification & Social](#phase-3-gamification--social)
6. [File Structure](#file-structure)
7. [Design System Tokens](#design-system-tokens)
8. [Firebase Schema Reference](#firebase-schema-reference)

---

## Current Setup Analysis

### ✅ Already Configured

| Dependency               | Version | Status                    |
| ------------------------ | ------- | ------------------------- |
| Expo (Managed)           | ^54.0.0 | ✅ Ready                  |
| React Navigation (Stack) | ^7.4.8  | ✅ Ready                  |
| React Native Reanimated  | ~4.1.1  | ✅ Ready                  |
| Gesture Handler          | ~2.28.0 | ✅ Ready                  |
| Firebase SDK             | ^10.5.2 | ✅ Initialized (env vars) |
| Zustand                  | ^4.5.1  | ✅ Ready                  |

### ❌ Missing Dependencies (Will be installed per phase)

| Dependency                                  | Purpose                  | Phase |
| ------------------------------------------- | ------------------------ | ----- |
| `@react-navigation/bottom-tabs`             | Bottom tab navigation    | 1     |
| `@react-native-async-storage/async-storage` | Offline-first storage    | 1     |
| `lottie-react-native`                       | Celebration animations   | 1     |
| `expo-haptics`                              | Tactile feedback         | 1     |
| `expo-av`                                   | Sound effects (ding/pop) | 2     |
| `expo-notifications`                        | Push notifications       | 3     |
| `expo-auth-session`                         | Google/Apple Sign-in     | 1     |
| `react-native-svg`                          | Charts & icons           | 2     |
| `victory-native`                            | Analytics charts         | 2     |

---

## Pre-Development Configuration (YOU DO)

> ⚠️ **ACTION REQUIRED**: Complete these steps before development begins.

### 1. Firebase Project Setup

#### A. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project named **"LifePulse"**
3. Enable **Google Analytics** (optional but recommended)

#### B. Enable Authentication

1. Navigate to **Authentication → Sign-in method**
2. Enable the following providers:
   - ✅ **Email/Password**
   - ✅ **Google** (requires SHA-1 fingerprint for Android)
   - ✅ **Apple** (requires Apple Developer account)

#### C. Create Firestore Database

1. Navigate to **Firestore Database → Create Database**
2. Start in **Production mode**
3. Choose a region close to your users (e.g., `us-central1` or `asia-south1`)
4. Apply these security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Habits belong to users
    match /users/{userId}/habits/{habitId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Logs belong to users
    match /users/{userId}/logs/{logId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Leaderboard is readable by authenticated users
    match /leaderboard/{doc} {
      allow read: if request.auth != null;
      allow write: if false; // Only Cloud Functions can write
    }
  }
}
```

#### D. Get Firebase Config

1. Go to **Project Settings → General → Your apps**
2. Click **Add app → Web** (React Native uses web SDK)
3. Copy the config values

#### E. Create Environment File

Create a `.env` file in the project root:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
EXPO_PUBLIC_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

> ⚠️ Add `.env` to your `.gitignore` file!

### 2. Apple Developer Setup (For Apple Sign-In)

1. Enable **Sign in with Apple** capability in your Apple Developer account
2. Create a **Service ID** for your app
3. Note down the **Team ID** and **Service ID**

### 3. Google Cloud Setup (For Google Sign-In)

1. In Firebase Console → Authentication → Google provider
2. Download the `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
3. For Expo, you'll need to configure OAuth credentials in Google Cloud Console

### 4. Update app.json for Dark Mode Default

The current `app.json` has `"userInterfaceStyle": "light"`. This will be changed to `"dark"` during Phase 1.

### 5. Lottie Animation Assets

Download or create these Lottie JSON files and place them in `assets/animations/`:

- `confetti.json` - For perfect day celebration
- `checkmark.json` - For habit completion
- `streak-fire.json` - For streak milestones
- `welcome-1.json`, `welcome-2.json`, `welcome-3.json` - Onboarding slides

**Free Lottie sources:**

- [LottieFiles](https://lottiefiles.com/)
- [IconScout](https://iconscout.com/lottie-animations)

### 6. Font Assets

Download **Nunito** font family (or your preferred rounded sans-serif):

- Nunito-Regular.ttf
- Nunito-SemiBold.ttf
- Nunito-Bold.ttf
- Nunito-ExtraBold.ttf

Place them in `assets/fonts/`

---

## Phase 1: MVP Core

**Goal**: Working app with Auth → Home (Today) → Basic Habit CRUD → Firebase Sync → Dark Mode

**Estimated Duration**: 2-3 weeks

### 1.1 Project Setup & Design System

#### Tasks:

- [ ] Install Phase 1 dependencies
- [ ] Configure dark theme as default in `app.json`
- [ ] Create design system (colors, typography, spacing)
- [ ] Set up custom fonts (Nunito)
- [ ] Create reusable UI components (Button, Card, Input, etc.)
- [ ] Set up navigation structure (Stack + Bottom Tabs)

#### Dependencies to Install:

```bash
npx expo install @react-navigation/bottom-tabs @react-native-async-storage/async-storage lottie-react-native expo-haptics expo-font expo-splash-screen
```

#### Files to Create:

```
src/
├── theme/
│   ├── colors.ts          # Color palette
│   ├── typography.ts      # Font styles
│   ├── spacing.ts         # Spacing scale
│   └── index.ts           # Theme provider
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── IconButton.tsx
│   │   ├── Checkbox.tsx
│   │   └── ProgressRing.tsx
│   └── shared/
│       ├── SkeletonLoader.tsx
│       └── HapticFeedback.tsx
```

### 1.2 Authentication Flow

#### Tasks:

- [ ] Create Firebase Auth service layer
- [ ] Build Welcome/Splash screen
- [ ] Build Login screen (Email/Password)
- [ ] Build Sign Up screen
- [ ] Implement Google Sign-In
- [ ] Implement Apple Sign-In (iOS only)
- [ ] Create auth state management (Zustand)
- [ ] Set up protected routes

#### Files to Create:

```
src/
├── services/
│   └── auth.ts            # Firebase Auth wrapper
├── stores/
│   └── authStore.ts       # Auth state (Zustand)
├── screens/
│   └── auth/
│       ├── WelcomeScreen.tsx
│       ├── LoginScreen.tsx
│       └── SignUpScreen.tsx
```

#### Key Logic:

```typescript
// Auth state shape
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
}
```

### 1.3 Today Dashboard (Home Screen)

#### Tasks:

- [ ] Create horizontal date strip (scrollable calendar)
- [ ] Build Daily Score Ring (animated circular progress)
- [ ] Create SwipeableHabitCard component
- [ ] Implement swipe gestures (right=complete, left=skip)
- [ ] Add haptic feedback on interactions
- [ ] Build empty state with confetti animation
- [ ] Create "Perfect Day" badge component

#### Files to Create:

```
src/
├── screens/
│   └── home/
│       └── TodayScreen.tsx
├── components/
│   └── habits/
│       ├── DateStrip.tsx
│       ├── DailyScoreRing.tsx
│       ├── SwipeableHabitCard.tsx
│       ├── HabitList.tsx
│       └── PerfectDayBadge.tsx
```

#### Gesture Implementation:

```typescript
// Swipe thresholds
const SWIPE_THRESHOLD = 80;

// Swipe right → Complete (Green glow + heavy haptic)
// Swipe left → Skip (Fade + light haptic)
```

### 1.4 Habit CRUD (Basic - Daily Only)

#### Tasks:

- [ ] Create Add Habit modal/screen
- [ ] Build Icon Picker component
- [ ] Build Color Picker component
- [ ] Implement basic form validation
- [ ] Create Edit Habit screen
- [ ] Implement Delete habit with confirmation

#### Files to Create:

```
src/
├── screens/
│   └── habits/
│       ├── AddHabitScreen.tsx
│       └── EditHabitScreen.tsx
├── components/
│   └── habits/
│       ├── IconPicker.tsx
│       ├── ColorPicker.tsx
│       └── HabitForm.tsx
```

### 1.5 Firebase Integration & Offline-First

#### Tasks:

- [ ] Create Firestore service layer
- [ ] Implement habit CRUD operations
- [ ] Implement log CRUD operations
- [ ] Set up AsyncStorage for local caching
- [ ] Create sync manager (local → Firestore)
- [ ] Handle offline/online state transitions
- [ ] Create habit store (Zustand + persistence)

#### Files to Create:

```
src/
├── services/
│   ├── firestore.ts       # Firestore operations
│   └── sync.ts            # Sync manager
├── stores/
│   ├── habitStore.ts      # Habits state
│   └── logStore.ts        # Logs state
├── utils/
│   └── storage.ts         # AsyncStorage helpers
```

#### Offline-First Logic:

```typescript
// 1. Write to AsyncStorage immediately (instant UI update)
// 2. Queue Firestore write
// 3. On success, mark as synced
// 4. On failure, retry on reconnect
```

### 1.6 Bottom Tab Navigation

#### Tasks:

- [ ] Set up Bottom Tab Navigator
- [ ] Create tab icons (custom or vector icons)
- [ ] Implement tab bar styling (dark theme)
- [ ] Create placeholder screens for other tabs

#### Navigation Structure:

```
BottomTabs
├── Today (Home)
├── Insights (Analytics)
├── Add (Floating Action Button style)
├── Social (Leaderboard/Challenges)
└── Profile (Settings/Rewards)
```

### Phase 1 Deliverables:

- ✅ User can sign up / log in
- ✅ User sees Today dashboard with date strip
- ✅ User can add habits (daily frequency only)
- ✅ User can swipe to complete/skip habits
- ✅ Data syncs to Firebase
- ✅ App works offline
- ✅ Dark mode enabled

---

## Phase 2: Advanced Features

**Goal**: Advanced scheduling, analytics, polished animations

**Estimated Duration**: 2-3 weeks

### 2.1 Advanced Frequency Engine

#### Tasks:

- [ ] Build "Frequency Engine" UI component
- [ ] Implement "Every Day" vs "Custom" toggle
- [ ] Create 7-day bubble selector (M T W T F S S)
- [ ] Implement "X times per week" logic
- [ ] Handle "Except Sunday" streak logic
- [ ] Update daily score calculation for active habits only

#### Logic: "Except Sunday" Implementation

```typescript
interface FrequencyConfig {
  type: 'daily' | 'specific_days' | 'interval' | 'x_times_per_period';
  days?: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[];
  exceptions?: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[];
  interval?: number; // Every X days
  timesPerPeriod?: { times: number; period: 'week' | 'month' };
}

// Streak calculation must check if habit is "active" for that day
function isHabitActiveForDay(habit: Habit, date: Date): boolean {
  // ... logic based on frequencyConfig
}
```

#### Files to Create:

```
src/
├── components/
│   └── habits/
│       ├── FrequencySelector.tsx
│       ├── DayBubbles.tsx
│       └── TimesPerWeekPicker.tsx
├── utils/
│   └── frequency.ts        # Frequency calculation helpers
```

### 2.2 Heatmap Calendar & Analytics

#### Tasks:

- [ ] Install chart dependencies (`react-native-svg`, `victory-native`)
- [ ] Build Heatmap Calendar component
- [ ] Implement cascading animation (squares fade in one-by-one)
- [ ] Create Weekly Bar Chart
- [ ] Implement "Lagging Habit" insight algorithm
- [ ] Build Insights Screen

#### Dependencies to Install:

```bash
npx expo install react-native-svg victory-native
```

#### Files to Create:

```
src/
├── screens/
│   └── insights/
│       └── InsightsScreen.tsx
├── components/
│   └── analytics/
│       ├── HeatmapCalendar.tsx
│       ├── WeeklyBarChart.tsx
│       └── LaggingHabitCard.tsx
├── utils/
│   └── analytics.ts        # Insight calculations
```

#### Heatmap Color Grading:

```typescript
const getHeatmapColor = (percentage: number): string => {
  if (percentage === 0) return '#2C2C2E'; // Empty
  if (percentage <= 20) return '#3D4F3D'; // Pale
  if (percentage <= 40) return '#4A6B4A'; // Light green
  if (percentage <= 60) return '#5A8F5A'; // Medium green
  if (percentage <= 80) return '#6AB06A'; // Bright green
  return '#00FF9D'; // Neon green (100%)
};
```

### 2.3 Animation Polish

#### Tasks:

- [ ] Implement SharedElement transitions (habit card → detail)
- [ ] Add completion animation (scale 1.2 → 1.0 with spring)
- [ ] Create skeleton loaders for all loading states
- [ ] Add chart bar grow-up animations
- [ ] Implement sound effects (ding/pop)
- [ ] Add mute toggle in settings

#### Dependencies to Install:

```bash
npx expo install expo-av
```

#### Animation Configs:

```typescript
// Spring config for completion
const completionSpring = {
  damping: 10,
  stiffness: 100,
  mass: 1,
};

// Skeleton shimmer
// Use react-native-reanimated for smooth shimmer effect
```

### 2.4 Reminders & Time Picker

#### Tasks:

- [ ] Build Time Picker component
- [ ] Store reminder times per habit
- [ ] Prepare notification scheduling (actual notifications in Phase 3)

### Phase 2 Deliverables:

- ✅ User can set custom schedules (specific days, X times/week)
- ✅ "Except Sunday" logic works correctly
- ✅ Heatmap calendar shows habit history
- ✅ Weekly charts with animations
- ✅ "Lagging habit" insights displayed
- ✅ Polished animations throughout
- ✅ Sound effects (with mute option)

---

## Phase 3: Gamification & Social

**Goal**: Badges, streaks, leaderboard, challenges, notifications

**Estimated Duration**: 2-3 weeks

### 3.1 Gamification System

#### Tasks:

- [ ] Design badge/achievement system
- [ ] Create Badge component (locked/unlocked states)
- [ ] Implement streak tracking logic
- [ ] Create "Streak Freeze" item logic
- [ ] Build gamification points system
- [ ] Create Profile/Rewards screen

#### Badge Examples:

```typescript
const BADGES = [
  { id: 'first_habit', name: 'First Step', description: 'Create your first habit' },
  { id: 'week_streak', name: 'Week Warrior', description: '7-day streak' },
  { id: 'month_streak', name: 'Monthly Master', description: '30-day streak' },
  { id: 'perfect_week', name: 'Perfect Week', description: '100% completion for 7 days' },
  { id: 'early_bird', name: 'Early Bird', description: 'Complete all habits before 9 AM' },
  // ... more badges
];
```

#### Files to Create:

```
src/
├── screens/
│   └── profile/
│       ├── ProfileScreen.tsx
│       └── BadgesScreen.tsx
├── components/
│   └── gamification/
│       ├── Badge.tsx
│       ├── StreakCounter.tsx
│       ├── PointsDisplay.tsx
│       └── StreakFreezeCard.tsx
├── stores/
│   └── gamificationStore.ts
├── utils/
│   └── achievements.ts     # Badge unlock logic
```

### 3.2 Social Features

#### Tasks:

- [ ] Build Leaderboard screen (Friends vs Global)
- [ ] Implement friend system (add by email/username)
- [ ] Create Challenge system
- [ ] Build Challenge card component
- [ ] Set up Firebase Cloud Functions for leaderboard calculation

#### Files to Create:

```
src/
├── screens/
│   └── social/
│       ├── SocialScreen.tsx
│       ├── LeaderboardTab.tsx
│       ├── ChallengesTab.tsx
│       └── FriendsScreen.tsx
├── components/
│   └── social/
│       ├── LeaderboardRow.tsx
│       ├── ChallengeCard.tsx
│       └── FriendRequestCard.tsx
├── services/
│   └── social.ts           # Friend/challenge operations
```

#### Firebase Cloud Functions (YOU CONFIGURE):

```javascript
// functions/index.js - Deploy to Firebase

// Calculate weekly leaderboard
exports.calculateLeaderboard = functions.pubsub
  .schedule('every sunday 00:00')
  .onRun(async (context) => {
    // Aggregate scores from all users
    // Write to /leaderboard collection
  });

// Calculate "Lagging Habit" insights
exports.calculateInsights = functions.pubsub.schedule('every day 00:00').onRun(async (context) => {
  // Analyze patterns for each user
  // Write to /users/{uid}/insights subcollection
});
```

### 3.3 Push Notifications

#### Tasks:

- [ ] Install expo-notifications
- [ ] Request notification permissions (during onboarding)
- [ ] Implement local reminder notifications
- [ ] Set up push notification tokens (Firebase Cloud Messaging)
- [ ] Handle notification tap → deep link to habit

#### Dependencies to Install:

```bash
npx expo install expo-notifications expo-device expo-constants
```

#### Files to Create:

```
src/
├── services/
│   └── notifications.ts    # Notification scheduling
├── utils/
│   └── deepLinking.ts      # Handle notification taps
```

### 3.4 Onboarding Flow

#### Tasks:

- [ ] Create Welcome Carousel (3 slides with Lottie)
- [ ] Build "Habit Packs" selection screen
- [ ] Create pre-made habit packs (Morning Routine, Fitness, etc.)
- [ ] Add "pop" animation and sound on pack selection
- [ ] Integrate notification permission request

#### Habit Packs:

```typescript
const HABIT_PACKS = [
  {
    id: 'morning',
    name: 'Morning Routine',
    icon: '🌅',
    habits: [
      { title: 'Wake up early', icon: '⏰', color: '#FFB347' },
      { title: 'Drink water', icon: '💧', color: '#87CEEB' },
      { title: 'Meditate', icon: '🧘', color: '#DDA0DD' },
    ],
  },
  {
    id: 'fitness',
    name: 'Fitness',
    icon: '💪',
    habits: [
      { title: 'Workout', icon: '🏋️', color: '#FF6B6B' },
      { title: 'Stretch', icon: '🤸', color: '#98D8C8' },
      { title: '10k steps', icon: '👟', color: '#F7DC6F' },
    ],
  },
  // ... more packs
];
```

#### Files to Create:

```
src/
├── screens/
│   └── onboarding/
│       ├── WelcomeCarousel.tsx
│       ├── HabitPacksScreen.tsx
│       └── NotificationPermissionScreen.tsx
├── components/
│   └── onboarding/
│       ├── CarouselSlide.tsx
│       └── HabitPackCard.tsx
├── data/
│   └── habitPacks.ts       # Pre-defined habit packs
```

### 3.5 Settings Screen

#### Tasks:

- [ ] Build Settings screen
- [ ] Add sound toggle
- [ ] Add haptic toggle
- [ ] Add notification settings
- [ ] Add account management (change password, delete account)
- [ ] Add data export option

### Phase 3 Deliverables:

- ✅ Badge/achievement system working
- ✅ Streak tracking with streak freeze items
- ✅ Leaderboard (Friends & Global)
- ✅ Challenge system
- ✅ Push notifications for reminders
- ✅ Onboarding flow with habit packs
- ✅ Full settings screen

---

## File Structure

Final project structure after all phases:

```
LifePulse/
├── App.tsx
├── app.json
├── babel.config.js
├── package.json
├── tsconfig.json
├── .env                          # Firebase config (gitignored)
├── assets/
│   ├── fonts/
│   │   ├── Nunito-Regular.ttf
│   │   ├── Nunito-SemiBold.ttf
│   │   ├── Nunito-Bold.ttf
│   │   └── Nunito-ExtraBold.ttf
│   ├── animations/
│   │   ├── confetti.json
│   │   ├── checkmark.json
│   │   ├── streak-fire.json
│   │   └── welcome-*.json
│   ├── sounds/
│   │   ├── complete.mp3
│   │   └── pop.mp3
│   └── images/
│       └── ... (icons, splash, etc.)
├── src/
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── MainNavigator.tsx    # Bottom tabs
│   │   └── types.ts
│   ├── screens/
│   │   ├── auth/
│   │   ├── onboarding/
│   │   ├── home/
│   │   ├── habits/
│   │   ├── insights/
│   │   ├── social/
│   │   └── profile/
│   ├── components/
│   │   ├── ui/
│   │   ├── shared/
│   │   ├── habits/
│   │   ├── analytics/
│   │   ├── gamification/
│   │   ├── social/
│   │   └── onboarding/
│   ├── services/
│   │   ├── auth.ts
│   │   ├── firestore.ts
│   │   ├── sync.ts
│   │   ├── notifications.ts
│   │   └── social.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── habitStore.ts
│   │   ├── logStore.ts
│   │   ├── gamificationStore.ts
│   │   └── settingsStore.ts
│   ├── hooks/
│   │   ├── useHaptics.ts
│   │   ├── useSound.ts
│   │   └── useOfflineSync.ts
│   ├── utils/
│   │   ├── storage.ts
│   │   ├── frequency.ts
│   │   ├── analytics.ts
│   │   ├── achievements.ts
│   │   └── deepLinking.ts
│   ├── data/
│   │   ├── habitPacks.ts
│   │   └── badges.ts
│   └── types/
│       ├── habit.ts
│       ├── user.ts
│       └── index.ts
└── functions/                    # Firebase Cloud Functions
    ├── package.json
    ├── index.js
    └── ...
```

---

## Design System Tokens

### Colors

```typescript
export const colors = {
  // Backgrounds
  background: {
    primary: '#121212', // Deep matte black
    secondary: '#1A1B1E', // Dark gunmetal
    card: '#2C2C2E', // Card background
    elevated: '#3A3A3C', // Elevated surfaces
  },

  // Accents
  accent: {
    success: '#00FF9D', // Neon green (completion)
    warning: '#FFB347', // Amber (streak/fire)
    error: '#FF6B6B', // Soft red (skip/miss)
    info: '#87CEEB', // Sky blue
  },

  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#A0A0A0',
    muted: '#6B6B6B',
  },

  // Borders
  border: {
    default: '#3A3A3C',
    focus: '#00FF9D',
  },
};
```

### Typography

```typescript
export const typography = {
  fontFamily: {
    regular: 'Nunito-Regular',
    semiBold: 'Nunito-SemiBold',
    bold: 'Nunito-Bold',
    extraBold: 'Nunito-ExtraBold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
};
```

### Spacing

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};
```

---

## Firebase Schema Reference

### Collection: `users`

```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;

  // Gamification
  currentScore: number;
  totalStreaks: number;
  gamificationPoints: number;
  streakFreezes: number;

  // Settings
  settings: {
    soundEnabled: boolean;
    hapticsEnabled: boolean;
    notificationsEnabled: boolean;
  };
}
```

### Subcollection: `users/{uid}/habits`

```typescript
interface Habit {
  id: string;
  title: string;
  icon: string; // Emoji or icon name
  color: string; // Hex color
  createdAt: Timestamp;

  // Frequency configuration
  frequencyConfig: {
    type: 'daily' | 'specific_days' | 'interval' | 'x_times_per_period';
    days?: string[]; // ['Mon', 'Wed', 'Fri']
    exceptions?: string[]; // ['Sun']
    interval?: number; // Every X days
    timesPerPeriod?: {
      times: number;
      period: 'week' | 'month';
    };
  };

  // Reminders
  reminders: {
    enabled: boolean;
    times: string[]; // ['08:00', '20:00']
  };

  // Stats (denormalized for quick access)
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
}
```

### Subcollection: `users/{uid}/logs`

```typescript
interface Log {
  id: string;
  habitId: string;
  date: string; // 'YYYY-MM-DD'
  status: 'completed' | 'skipped' | 'failed';
  value?: number; // For numeric habits (e.g., 8 glasses)
  completedAt: Timestamp;

  // Sync metadata
  syncStatus: 'synced' | 'pending';
}
```

### Collection: `leaderboard`

```typescript
interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  photoURL?: string;
  weeklyScore: number;
  weekStartDate: string; // 'YYYY-MM-DD'
}
```

---

## Quick Reference: Edge Cases

| Scenario                           | Expected Behavior                        |
| ---------------------------------- | ---------------------------------------- |
| Habit set to "Daily except Sunday" | Sunday doesn't count; streak preserved   |
| User offline, marks habit complete | Saved locally, synced when online        |
| Missed day with Streak Freeze      | Streak preserved, freeze consumed        |
| All habits completed for day       | Confetti animation + "Perfect Day" badge |
| User on leaderboard page refresh   | Ranks animate (shuffle up/down)          |

---

## Checklist Summary

### Before We Start Coding:

- [ ] Firebase project created
- [ ] Firebase Auth providers enabled (Email, Google, Apple)
- [ ] Firestore database created with security rules
- [ ] `.env` file created with Firebase config
- [ ] Lottie animation files downloaded to `assets/animations/`
- [ ] Nunito font files downloaded to `assets/fonts/`
- [ ] (Optional) Apple Developer account configured for Sign in with Apple
- [ ] (Optional) Google Cloud OAuth credentials configured

### Phase 1 Checklist:

- [ ] Dependencies installed
- [ ] Design system implemented
- [ ] Auth flow complete
- [ ] Today screen with swipeable cards
- [ ] Basic habit CRUD
- [ ] Firebase sync working
- [ ] Offline-first storage working

### Phase 2 Checklist:

- [ ] Advanced frequency selector
- [ ] Heatmap calendar
- [ ] Analytics charts
- [ ] Animation polish
- [ ] Sound effects

### Phase 3 Checklist:

- [ ] Badge/achievement system
- [ ] Leaderboard
- [ ] Challenges
- [ ] Push notifications
- [ ] Onboarding flow
- [ ] Settings screen

---

> **Ready to start?** Complete the [Pre-Development Configuration](#pre-development-configuration-you-do) section, then let me know and we'll begin Phase 1! 🚀
