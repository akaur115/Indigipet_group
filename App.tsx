
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import type {
  MultiFactorResolver,
  User,
} from '@react-native-firebase/auth';

// AUTHENTICATION SCREENS
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import MFASetupScreen from './src/screens/MFASetupScreen';
import MFAVerifyScreen from './src/screens/MFAVerifyScreen';

// MAIN APP SCREENS
import HomeScreen from './src/screens/HomeScreen';
import LearningScreen from './src/screens/LearningScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// TERMS OF SERVICE
import TermsAcceptanceScreen from './src/screens/TermsAcceptanceScreen';

// FIREBASE AUTHENTICATION
import {
  getCurrentUser,
  listenToAuthState,
  logoutUser,
  userHasMFA,
} from './src/services/authService';

// SCREEN TYPES
type Screen =
  | 'welcome'
  | 'login'
  | 'register'
  | 'verifyEmail'
  | 'mfaSetup'
  | 'mfaVerify'
  | 'home'
  | 'learning'
  | 'settings';

type MainTab =
  | 'home'
  | 'learning'
  | 'settings';

// BOTTOM NAVIGATION BUTTONS
const TABS: {
  id: MainTab;
  icon: string;
  label: string;
}[] = [
  {
    id: 'home',
    icon: '🐾',
    label: 'Home',
  },
  {
    id: 'learning',
    icon: '📖',
    label: 'Learning',
  },
  {
    id: 'settings',
    icon: '⚙️',
    label: 'Settings',
  },
];

function AppContent() {
  // REAL ANDROID SCREEN INSETS
  const insets = useSafeAreaInsets();

  // KEEP CONTENT BELOW ANDROID CLOCK
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android'
      ? StatusBar.currentHeight ?? 24
      : 0,
  );

  // KEEP NAVIGATION ABOVE ANDROID BUTTONS
  const bottomInset = Math.max(
    insets.bottom,
    Platform.OS === 'android' ? 24 : 0,
  );

  // CURRENT SCREEN
  const [
    currentScreen,
    setCurrentScreen,
  ] = useState<Screen>('welcome');

  // LOGIN CHECK
  const [
    checkingLogin,
    setCheckingLogin,
  ] = useState(true);

  // MFA RESOLVER
  const [
    mfaResolver,
    setMFAResolver,
  ] = useState<MultiFactorResolver | null>(
    null,
  );

  // TERMS ACCEPTANCE
  const [
    termsAcceptedUid,
    setTermsAcceptedUid,
  ] = useState<string | null>(null);

  const goToLoginAfterSignOut =
    useRef(false);

  // CALLED AFTER USER ACCEPTS TERMS
  const handleTermsAccepted = useCallback(
    (uid: string) => {
      setTermsAcceptedUid(uid);
    },
    [],
  );

  // LISTEN FOR FIREBASE AUTHENTICATION
  useEffect(() => {
    const unsubscribe =
      listenToAuthState(
        (user: User | null) => {
          // NOT LOGGED IN
          if (!user) {
            setTermsAcceptedUid(null);

            if (
              goToLoginAfterSignOut.current
            ) {
              goToLoginAfterSignOut.current =
                false;

              setCurrentScreen('login');
            } else {
              setCurrentScreen('welcome');
            }
          }

          // EMAIL NOT VERIFIED
          else if (!user.emailVerified) {
            setCurrentScreen('verifyEmail');
          }

          // MFA NOT SET UP
          else if (!userHasMFA(user)) {
            setCurrentScreen('mfaSetup');
          }

          // READY TO ENTER MAIN APP
          else {
            setCurrentScreen('home');
          }

          setCheckingLogin(false);
        },
      );

    return unsubscribe;
  }, []);

  // SIGN OUT
  const handleLogout = async () => {
    try {
      goToLoginAfterSignOut.current =
        false;

      setTermsAcceptedUid(null);

      await logoutUser();

      setMFAResolver(null);

      setCurrentScreen('welcome');
    } catch (error) {
      console.log(
        'LOGOUT ERROR:',
        error,
      );

      throw error;
    }
  };

  // RENDER CURRENT SCREEN
  const renderScreen = () => {
    switch (currentScreen) {

      // WELCOME SCREEN
      case 'welcome':
        return (
          <WelcomeScreen
            onLogin={() =>
              setCurrentScreen('login')
            }
            onRegister={() =>
              setCurrentScreen('register')
            }
          />
        );

      // LOGIN SCREEN
      case 'login':
        return (
          <LoginScreen
            onRegister={() =>
              setCurrentScreen('register')
            }
            onBack={() =>
              setCurrentScreen('welcome')
            }
            onMFARequired={resolver => {
              setMFAResolver(resolver);

              setCurrentScreen(
                'mfaVerify',
              );
            }}
          />
        );

      // REGISTRATION SCREEN
      case 'register':
        return (
          <RegisterScreen
            onLogin={() =>
              setCurrentScreen('login')
            }
            onBack={() =>
              setCurrentScreen('welcome')
            }
          />
        );

      // VERIFY EMAIL
      case 'verifyEmail':
        return (
          <VerifyEmailScreen
            onVerified={() =>
              setCurrentScreen('mfaSetup')
            }
            onBack={() =>
              setCurrentScreen('login')
            }
          />
        );

      // MFA SETUP SCREEN
      case 'mfaSetup':
        return (
          <MFASetupScreen
            onComplete={async () => {
              try {
                goToLoginAfterSignOut.current =
                  true;

                await logoutUser();

                setMFAResolver(null);

                setTermsAcceptedUid(null);

                setCurrentScreen('login');
              } catch (error) {
                goToLoginAfterSignOut.current =
                  false;

                console.log(
                  'AUTO LOGOUT ERROR:',
                  error,
                );

                Alert.alert(
                  'Setup Complete',
                  'MFA setup completed, but automatic logout failed. Please log out from Settings.',
                );

                setCurrentScreen('home');
              }
            }}
          />
        );

      // MFA VERIFICATION SCREEN
      case 'mfaVerify':
        if (!mfaResolver) {
          return (
            <LoginScreen
              onRegister={() =>
                setCurrentScreen('register')
              }
              onBack={() =>
                setCurrentScreen('welcome')
              }
              onMFARequired={resolver => {
                setMFAResolver(resolver);

                setCurrentScreen(
                  'mfaVerify',
                );
              }}
            />
          );
        }

        return (
          <MFAVerifyScreen
            resolver={mfaResolver}
            onComplete={() => {
              setMFAResolver(null);

              setCurrentScreen('home');
            }}
            onCancel={() => {
              setMFAResolver(null);

              setCurrentScreen('login');
            }}
          />
        );

      // MAIN APP SCREENS
      case 'home':
      case 'learning':
      case 'settings': {
        const user = getCurrentUser();

        // USER MUST BE LOGGED IN
        if (!user) {
          return (
            <View
              style={styles.loadingContainer}>

              <ActivityIndicator
                size="large"
                color="#035643"
              />
            </View>
          );
        }

        // TERMS ACCEPTANCE REQUIRED
        if (
          termsAcceptedUid !== user.uid
        ) {
          return (
            <TermsAcceptanceScreen
              uid={user.uid}
              onAccepted={
                handleTermsAccepted
              }
              onDecline={handleLogout}
            />
          );
        }

        // MAIN APP LAYOUT
        return (
          <View style={styles.mainLayout}>

            {/* CURRENT MAIN SCREEN */}
            <View style={styles.mainContent}>
              {currentScreen === 'home' ? (
                <HomeScreen
                  uid={user.uid}
                />
              ) : currentScreen ===
                'learning' ? (
                <LearningScreen
                  uid={user.uid}
                  onReturnHome={() =>
                    setCurrentScreen('home')
                  }
                />
              ) : (
                <SettingsScreen
                  email={
                    user.email ?? ''
                  }
                  onLogout={
                    handleLogout
                  }
                  onReturnHome={() =>
                    setCurrentScreen('home')
                  }
                />
              )}
            </View>

            {/* BOTTOM NAVIGATION */}
            <View style={styles.bottomBar}>
              {TABS.map(tab => {
                const selected =
                  currentScreen === tab.id;

                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      styles.bottomItem,
                      selected &&
                        styles.bottomItemSelected,
                    ]}
                    onPress={() =>
                      setCurrentScreen(tab.id)
                    }
                    accessibilityRole="tab"
                    accessibilityState={{
                      selected,
                    }}>

                    {/* SMALL ICON */}
                    <Text
                      style={styles.bottomIcon}>
                      {tab.icon}
                    </Text>

                    {/* VISIBLE LABEL */}
                    <Text
                      style={[
                        styles.bottomText,
                        selected &&
                          styles.bottomTextSelected,
                      ]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      }

      // DEFAULT
      default:
        return (
          <WelcomeScreen
            onLogin={() =>
              setCurrentScreen('login')
            }
            onRegister={() =>
              setCurrentScreen('register')
            }
          />
        );
    }
  };

  // APP ROOT
  return (
    <View style={styles.container}>

      {/* ANDROID STATUS BAR */}
      <StatusBar
        barStyle="light-content"
      />

      {/* TOP SAFE AREA */}
      <View
        style={[
          styles.topSafeArea,
          {
            height: topInset,
          },
        ]}
      />

      {/* APP CONTENT */}
      <View style={styles.appContent}>
        {checkingLogin ? (
          <View
            style={styles.loadingContainer}>

            <ActivityIndicator
              size="large"
              color="#035643"
            />

            <Text
              style={styles.loadingText}>
              Loading IndigiPet...
            </Text>
          </View>
        ) : (
          renderScreen()
        )}
      </View>

      {/* BOTTOM SAFE AREA */}
      <View
        style={[
          styles.bottomSafeArea,
          {
            height: bottomInset,
          },
        ]}
      />
    </View>
  );
}

// STYLES
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#035643',
  },

  // AREA BEHIND ANDROID CLOCK
  topSafeArea: {
    backgroundColor: '#035643',
  },

  // AREA BEHIND ANDROID SYSTEM BUTTONS
  bottomSafeArea: {
    backgroundColor: '#FFFBF0',
  },

  // SCREEN CONTENT
  appContent: {
    flex: 1,
    backgroundColor: '#FFFBEF',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFBEF',
  },

  loadingText: {
    color: '#035643',
    marginTop: 12,
    fontSize: 15,
  },

  mainLayout: {
    flex: 1,
    backgroundColor: '#FFFBEF',
  },

  mainContent: {
    flex: 1,
    minHeight: 0,
  },

  // SMALL BOTTOM NAVIGATION
  bottomBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBF0',
    borderTopWidth: 1,
    borderTopColor: '#E5DAC8',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  bottomItem: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    marginHorizontal: 3,
  },

  // SELECTED TAB COLOUR
  bottomItemSelected: {
    backgroundColor: '#DFEFE7',
  },

  // SMALLER ICONS
  bottomIcon: {
    fontSize: 18,
    includeFontPadding: false,
  },

  // CLEAR TEXT
  bottomText: {
    fontSize: 11,
    color: '#484139',
    marginTop: 3,
    includeFontPadding: false,
  },

  bottomTextSelected: {
    color: '#035643',
    fontWeight: 'bold',
  },
});

// WRAP APP WITH SAFE AREA PROVIDER
export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
