
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
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

// MAIN SCREENS
import HomeScreen from './src/screens/HomeScreen';
import LearningScreen from './src/screens/LearningScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// TERMS ACCEPTANCE
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

// BOTTOM NAVIGATION ICONS
const TAB_ICONS: Record<
  MainTab,
  ImageSourcePropType
> = {
  home: require('./assets/icons/paw-icon.png'),
  learning: require('./assets/icons/book-icon.png'),
  settings: require('./assets/icons/cog-icon.png'),
};

const TABS: {
  id: MainTab;
  label: string;
}[] = [
  {
    id: 'home',
    label: 'Home',
  },
  {
    id: 'learning',
    label: 'Learning',
  },
  {
    id: 'settings',
    label: 'Settings',
  },
];

function AppContent() {
  // ANDROID SAFE AREA
  const insets = useSafeAreaInsets();

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android'
      ? StatusBar.currentHeight ?? 24
      : 0,
  );

  const bottomInset = Math.max(
    insets.bottom,
    Platform.OS === 'android'
      ? 24
      : 0,
  );

  // CURRENT SCREEN
  const [
    currentScreen,
    setCurrentScreen,
  ] = useState<Screen>('welcome');

  // CHECK SAVED LOGIN
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

  // LOGIN AFTER MFA SETUP
  const goToLoginAfterSignOut =
    useRef(false);

  // TERMS ACCEPTED CALLBACK
  const handleTermsAccepted =
    useCallback(
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
          } else if (!user.emailVerified) {
            setCurrentScreen(
              'verifyEmail',
            );
          } else if (!userHasMFA(user)) {
            setCurrentScreen('mfaSetup');
          } else {
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

  // SCREEN NAVIGATION
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

      // REGISTRATION
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

      // MFA SETUP
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

      // MFA VERIFICATION
      case 'mfaVerify':
        if (!mfaResolver) {
          return (
            <LoginScreen
              onRegister={() =>
                setCurrentScreen(
                  'register',
                )
              }
              onBack={() =>
                setCurrentScreen(
                  'welcome',
                )
              }
              onMFARequired={resolver => {
                setMFAResolver(
                  resolver,
                );

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

      // MAIN APPLICATION
      case 'home':
      case 'learning':
      case 'settings': {
        const user = getCurrentUser();

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

        // TERMS MUST BE ACCEPTED
        // BEFORE OPENING MAIN APP
        if (
          termsAcceptedUid !== user.uid
        ) {
          return (
            <TermsAcceptanceScreen
              uid={user.uid}
              onAccepted={
                handleTermsAccepted
              }
              onDecline={
                handleLogout
              }
            />
          );
        }

        // MAIN SCREEN WITH BOTTOM TABS
        return (
          <View style={styles.mainLayout}>

            {/* ACTIVE SCREEN */}
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
                    setCurrentScreen(
                      'home',
                    )
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
                    setCurrentScreen(
                      'home',
                    )
                  }
                />
              )}

            </View>

            {/* BOTTOM NAVIGATION */}
            <View style={styles.bottomBar}>

              {TABS.map(tab => {
                const selected =
                  currentScreen ===
                  tab.id;

                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      styles.bottomItem,
                      selected &&
                        styles.bottomItemSelected,
                    ]}
                    onPress={() =>
                      setCurrentScreen(
                        tab.id,
                      )
                    }
                    accessibilityRole="tab"
                    accessibilityState={{
                      selected,
                    }}
                    accessibilityLabel={
                      tab.label
                    }>

                    {/* ICON */}
                    <Image
                      source={
                        TAB_ICONS[
                          tab.id
                        ]
                      }
                      style={[
                        styles.bottomIcon,
                        {
                          tintColor:
                            selected
                              ? '#035643'
                              : '#777777',
                        },
                      ]}
                      resizeMode="contain"
                    />

                    {/* LABEL */}
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

      // FALLBACK
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

  return (
    <View style={styles.container}>

      <StatusBar
        barStyle="light-content"
      />

      {/* STATUS BAR SAFE AREA */}
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

      {/* ANDROID NAVIGATION SAFE AREA */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#035643',
  },

  topSafeArea: {
    backgroundColor: '#035643',
  },

  bottomSafeArea: {
    backgroundColor: '#FFFBF0',
  },

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

  // BOTTOM NAVIGATION
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

  bottomItemSelected: {
    backgroundColor: '#DFEFE7',
  },

  bottomIcon: {
    width: 22,
    height: 22,
  },

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

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
