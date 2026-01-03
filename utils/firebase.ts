import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Export Firebase services
// React Native Firebase automatically initializes from native config files
// (google-services.json for Android, GoogleService-Info.plist for iOS)

export { auth, firestore };
export default auth;
