
import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  StatusBar,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import type {
  MultiFactorResolver,
  User,
} from '@react-native-firebase/auth';

// EXISTING AUTHENTICATION SCREENS
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import MFASetupScreen from './src/screens/MFASetupScreen';
import MFAVerifyScreen from './src/screens/MFAVerifyScreen';

// NEW SCREENS
import HomeScreen from './src/screens/HomeScreen';
import LearningScreen from './src/screens/LearningScreen';
import SettingsScreen from './src/screens/SettingsScreen';

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

// BOTTOM NAVIGATION
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

function App() {
  const [currentScreen, setCurrentScreen] =
    useState<Screen>('welcome');

  const [checkingLogin, setCheckingLogin] =
    useState(true);

  const [mfaResolver, setMFAResolver] =
    useState<MultiFactorResolver | null>(null);

  // New users should return to Login after MFA setup
  const goToLoginAfterSignOut = useRef(false);


  const routeUser = (user: User | null) => {
    if (!user) {
      console.log('NO SAVED LOGIN');

      if (goToLoginAfterSignOut.current) {
        goToLoginAfterSignOut.current = false;

        console.log(
          'ACCOUNT SETUP COMPLETE - GOING TO LOGIN',
        );

        setCurrentScreen('login');
      } else {
        setCurrentScreen('welcome');
      }


      return;
    }

    console.log('SIGNED IN USER:', user.email);

    // Check email verification
    if (!user.emailVerified) {
      console.log('EMAIL NOT VERIFIED');

      setCurrentScreen('verifyEmail');
      return;
    }

    // Check MFA setup
    if (!userHasMFA(user)) {
      console.log('MFA NOT SET UP');

      setCurrentScreen('mfaSetup');
      return;
    }

    // Authentication completed
    console.log('LOGIN COMPLETE - OPEN HOME');

    setCurrentScreen('home');
  };


  useEffect(() => {
    const unsubscribe = listenToAuthState(user => {
      routeUser(user);

      setCheckingLogin(false);
    });

    return unsubscribe;
  }, []);


  const handleLogout = async () => {
    try {
      goToLoginAfterSignOut.current = false;

      await logoutUser();

      setMFAResolver(null);

      setCurrentScreen('welcome');

      console.log('USER LOGGED OUT');
    } catch (error) {
      console.log('LOGOUT ERROR:', error);
      throw error;
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {


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
              console.log('MFA REQUIRED FOR LOGIN');

              setMFAResolver(resolver);

              setCurrentScreen('mfaVerify');
            }}
          />
        );


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

      case 'verifyEmail':
        return (
          <VerifyEmailScreen
            onVerified={() => {
              console.log('EMAIL VERIFIED');

              setCurrentScreen('mfaSetup');
            }}
            onBack={() =>
              setCurrentScreen('login')
            }
          />
        );

      case 'mfaSetup':
        return (
          <MFASetupScreen
            onComplete={async () => {
              console.log('MFA SETUP COMPLETE');

              try {
                // Automatically sign out after setup
                goToLoginAfterSignOut.current = true;

                await logoutUser();

                setMFAResolver(null);

                // User must log in after registering
                setCurrentScreen('login');

              } catch (error) {
                console.log(
                  'AUTO LOGOUT ERROR:',
                  error,
                );

                goToLoginAfterSignOut.current = false;

                Alert.alert(
                  'Setup Complete',
                  'MFA setup completed, but automatic logout failed. Please log out from Settings.',
                );

                setCurrentScreen('home');
              }
            }}
          />
        );


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

                setCurrentScreen('mfaVerify');
              }}
            />
          );
        }

        return (
          <MFAVerifyScreen
            resolver={mfaResolver}
            onComplete={() => {
              console.log('MFA LOGIN SUCCESS');

              setMFAResolver(null);

              // NEW HOME SCREEN OPENS HERE
              setCurrentScreen('home');
            }}
            onCancel={() => {
              setMFAResolver(null);

              setCurrentScreen('login');
            }}
          />
        );


      case 'home':
      case 'learning':
      case 'settings': {
        const user = getCurrentUser();

        if (!user) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color="#035643"
              />
            </View>
          );
        }

        return (
          <View style={styles.mainLayout}>

            {/* MAIN SCREEN CONTENT */}

            <View style={styles.mainContent}>

              {currentScreen === 'home' ? (

                <HomeScreen
                  uid={user.uid}
                />

              ) : currentScreen === 'learning' ? (

                <LearningScreen
                  uid={user.uid}
                  onReturnHome={() =>
                    setCurrentScreen('home')
                  }
                />

              ) : (

                <SettingsScreen
                  email={user.email ?? ''}
                  onLogout={handleLogout}
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
                    style={styles.bottomItem}
                    onPress={() =>
                      setCurrentScreen(tab.id)
                    }
                    accessibilityRole="tab"
                    accessibilityState={{
                      selected,
                    }}>

                    <Text style={styles.bottomIcon}>
                      {tab.icon}
                    </Text>

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


  if (checkingLogin) {
    return (
      <View style={styles.loadingContainer}>

        <StatusBar
          barStyle="dark-content"
        />

        <ActivityIndicator
          size="large"
          color="#035643"
        />

        <Text style={styles.loadingText}>
          Loading IndigiPet...
        </Text>

      </View>
    );
  }


  return (
    <View style={styles.container}>

      <StatusBar
        barStyle="dark-content"
      />

      {renderScreen()}

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
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
  },

  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFBF0',
    borderTopWidth: 1,
    borderTopColor: '#E5DAC8',
    paddingVertical: 9,
    paddingBottom: 13,
  },

  bottomItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomIcon: {
    fontSize: 24,
  },

  bottomText: {
    fontSize: 11,
    color: '#6E6151',
    marginTop: 3,
  },

  bottomTextSelected: {
    color: '#035643',
    fontWeight: 'bold',
  },

});

export default App;
