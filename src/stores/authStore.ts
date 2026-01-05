import AsyncStorage from '@react-native-async-storage/async-storage';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// User type
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt: Date;
}

// Auth state interface
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasSeenOnboarding: boolean;
  isInitialized: boolean;
  isCheckingVerification: boolean;

  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithApple: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
  checkEmailVerification: () => Promise<boolean>;
  setHasSeenOnboarding: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  initializeAuth: () => () => void;
}

// Convert Firebase User to our User type
const mapFirebaseUser = (firebaseUser: FirebaseAuthTypes.User): User => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email || '',
  displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
  photoURL: firebaseUser.photoURL || undefined,
  emailVerified: firebaseUser.emailVerified,
  createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
});

// Create user document in Firestore
const createUserDocument = async (user: User) => {
  console.log('[Auth] Creating user document for:', user.uid, user.email);
  try {
    const userRef = firestore().collection('users').doc(user.uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data();

    // Check if document is missing OR if it exists but doesn't have email (empty document from subcollection)
    if (!userSnap.exists || !userData?.email) {
      console.log('[Auth] User document missing or empty, creating/updating...');
      await userRef.set({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        displayNameLower: user.displayName.toLowerCase(), // For case-insensitive search
        photoURL: user.photoURL || null,
        createdAt: firestore.FieldValue.serverTimestamp(),
        settings: {
          soundEnabled: true,
          hapticsEnabled: true,
          notificationsEnabled: false,
        },
        currentScore: 0,
        totalStreaks: 0,
        gamificationPoints: 0,
        streakFreezes: 0,
      }, { merge: true }); // merge: true preserves existing subcollections
      console.log('[Auth] User document created/updated successfully!');
    } else {
      console.log('[Auth] User document exists with email:', userData.email);
      // If user exists but doesn't have displayNameLower, add it
      if (!userData?.displayNameLower) {
        await userRef.update({
          displayNameLower: (userData?.displayName || user.displayName).toLowerCase(),
        });
        console.log('[Auth] Added displayNameLower to existing user');
      }
    }
  } catch (error) {
    console.error('[Auth] Error creating user document:', error);
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      hasSeenOnboarding: false,
      isInitialized: false,
      isCheckingVerification: false,

      initializeAuth: () => {
        // Listen to Firebase auth state changes
        const unsubscribe = auth().onAuthStateChanged((firebaseUser) => {
          if (firebaseUser) {
            const user = mapFirebaseUser(firebaseUser);
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
            });
          }
        });

        return unsubscribe;
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });

        try {
          const userCredential = await auth().signInWithEmailAndPassword(email, password);
          const user = mapFirebaseUser(userCredential.user);

          // Ensure user document exists and has required fields (like displayNameLower for search)
          await createUserDocument(user);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error: any) {
          set({ isLoading: false });

          // Map Firebase error codes to user-friendly messages
          let errorMessage = 'Login failed. Please try again.';
          switch (error.code) {
            case 'auth/invalid-email':
              errorMessage = 'Invalid email address.';
              break;
            case 'auth/user-disabled':
              errorMessage = 'This account has been disabled.';
              break;
            case 'auth/user-not-found':
              errorMessage = 'No account found with this email.';
              break;
            case 'auth/wrong-password':
              errorMessage = 'Incorrect password.';
              break;
            case 'auth/invalid-credential':
              errorMessage = 'Invalid email or password.';
              break;
            case 'auth/too-many-requests':
              errorMessage = 'Too many attempts. Please try again later.';
              break;
          }

          return { success: false, error: errorMessage };
        }
      },

      signUp: async (email: string, password: string, displayName: string) => {
        set({ isLoading: true });

        try {
          const userCredential = await auth().createUserWithEmailAndPassword(email, password);

          // Update the user's display name
          await userCredential.user.updateProfile({ displayName });

          // Send email verification
          await userCredential.user.sendEmailVerification();
          console.log('[Auth] Verification email sent to:', email);

          const user = mapFirebaseUser(userCredential.user);
          user.displayName = displayName; // Use the provided displayName

          // Create user document in Firestore
          await createUserDocument(user);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error: any) {
          set({ isLoading: false });

          // Map Firebase error codes to user-friendly messages
          let errorMessage = 'Sign up failed. Please try again.';
          switch (error.code) {
            case 'auth/email-already-in-use':
              errorMessage = 'An account with this email already exists.';
              break;
            case 'auth/invalid-email':
              errorMessage = 'Invalid email address.';
              break;
            case 'auth/operation-not-allowed':
              errorMessage = 'Email/password accounts are not enabled.';
              break;
            case 'auth/weak-password':
              errorMessage = 'Password is too weak. Use at least 6 characters.';
              break;
          }

          return { success: false, error: errorMessage };
        }
      },

      loginWithGoogle: async () => {
        // Google Sign-In requires additional setup with @react-native-google-signin
        return {
          success: false,
          error: 'Google Sign-In requires additional configuration. Use email/password for now.'
        };
      },

      loginWithApple: async () => {
        // Apple Sign-In requires additional setup
        return {
          success: false,
          error: 'Apple Sign-In requires additional configuration. Use email/password for now.'
        };
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          await auth().signOut();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          console.error('Logout error:', error);
          set({ isLoading: false });
        }
      },

      sendVerificationEmail: async () => {
        const currentUser = auth().currentUser;
        if (!currentUser) {
          return { success: false, error: 'No user logged in' };
        }

        try {
          await currentUser.sendEmailVerification();
          console.log('[Auth] Verification email sent');
          return { success: true };
        } catch (error: any) {
          console.error('[Auth] Error sending verification email:', error);
          
          let errorMessage = 'Failed to send verification email.';
          if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many requests. Please wait a moment before trying again.';
          }
          
          return { success: false, error: errorMessage };
        }
      },

      checkEmailVerification: async () => {
        const currentUser = auth().currentUser;
        if (!currentUser) {
          return false;
        }

        set({ isCheckingVerification: true });

        try {
          // Reload user to get latest emailVerified status
          await currentUser.reload();
          const refreshedUser = auth().currentUser;
          
          if (refreshedUser?.emailVerified) {
            console.log('[Auth] Email verified!');
            const user = mapFirebaseUser(refreshedUser);
            set({
              user,
              isCheckingVerification: false,
            });
            return true;
          }
          
          set({ isCheckingVerification: false });
          return false;
        } catch (error) {
          console.error('[Auth] Error checking email verification:', error);
          set({ isCheckingVerification: false });
          return false;
        }
      },

      setHasSeenOnboarding: (value: boolean) => {
        set({ hasSeenOnboarding: value });
      },

      setLoading: (value: boolean) => {
        set({ isLoading: value });
      },
    }),
    {
      name: 'lifepulse-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasSeenOnboarding: state.hasSeenOnboarding,
        // Don't persist user/isAuthenticated - Firebase handles auth state
      }),
    }
  )
);
