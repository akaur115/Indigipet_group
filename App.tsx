import React, {useEffect, useState} from 'react';

import {
  StatusBar,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import type {
  MultiFactorResolver,
  User,
} from '@react-native-firebase/auth';

import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import MFASetupScreen from './src/screens/MFASetupScreen';
import MFAVerifyScreen from './src/screens/MFAVerifyScreen';

import {
  getCurrentUser,
  listenToAuthState,
  logoutUser,
  userHasMFA,
} from './src/services/authService';

type Screen =
  | 'welcome'
  | 'login'
  | 'register'
  | 'verifyEmail'
  | 'mfaSetup'
  | 'mfaVerify'
  | 'home';

function App() {
  const [currentScreen, setCurrentScreen] =
    useState<Screen>('welcome');

  const [checkingLogin, setCheckingLogin] =
    useState(true);

  const [mfaResolver, setMFAResolver] =
    useState<MultiFactorResolver | null>(null);

  
  const routeUser = (user: User | null) => {
    
    if (!user) {
      console.log('NO SAVED LOGIN');

      setCurrentScreen('welcome');
      return;
    }

    console.log('SIGNED IN USER:', user.email);

    // User must verify email before MFA setup
    if (!user.emailVerified) {
      console.log('EMAIL NOT VERIFIED');

      setCurrentScreen('verifyEmail');
      return;
    }

    if (!userHasMFA(user)) {
      console.log('MFA NOT SET UP');

      setCurrentScreen('mfaSetup');
      return;
    }

    console.log('MFA ENABLED');

    setCurrentScreen('home');
  };

  
  useEffect(() => {
    const unsubscribe =
      listenToAuthState(user => {
        routeUser(user);

        setCheckingLogin(false);
      });

    return unsubscribe;
  }, []);

  // Logout
  const handleLogout = async () => {
    try {
      await logoutUser();

      setMFAResolver(null);

      setCurrentScreen('welcome');
    } catch (error) {
      console.log(
        'LOGOUT ERROR:',
        error,
      );
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
              console.log(
                'MFA REQUIRED FOR LOGIN',
              );

              setMFAResolver(resolver);

              setCurrentScreen(
                'mfaVerify',
              );
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
              console.log(
                'EMAIL VERIFIED',
              );

              setCurrentScreen(
                'mfaSetup',
              );
            }}
            onBack={() =>
              setCurrentScreen('login')
            }
          />
        );

      case 'mfaSetup':
        return (
          <MFASetupScreen
            onComplete={() => {
              console.log(
                'MFA SETUP COMPLETE',
              );

              setCurrentScreen('home');
            }}
          />
        );

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
              onMFARequired={
                resolver => {
                  setMFAResolver(
                    resolver,
                  );

                  setCurrentScreen(
                    'mfaVerify',
                  );
                }
              }
            />
          );
        }

        return (
          <MFAVerifyScreen
            resolver={mfaResolver}
            onComplete={() => {
              console.log(
                'MFA LOGIN SUCCESS',
              );

              setMFAResolver(null);

              setCurrentScreen('home');
            }}
            onCancel={() => {
              setMFAResolver(null);

              setCurrentScreen('login');
            }}
          />
        );

      case 'home': {
        const user = getCurrentUser();

        return (
          <View
            style={
              styles.homeContainer
            }>
            <Text style={styles.logo}>
              IndigiPet
            </Text>

            <Text
              style={styles.raccoon}>
              🦝
            </Text>

            <Text style={styles.title}>
              Welcome!
            </Text>

            <Text
              style={styles.message}>
              You are logged in.
            </Text>

            <Text
              style={
                styles.savedMessage
              }>
              Your login is saved on this
              device.
            </Text>

            <Text style={styles.email}>
              {user?.email}
            </Text>

            <Text
              style={styles.mfaStatus}>
              MFA Enabled ✓
            </Text>

            <TouchableOpacity
              style={
                styles.logoutButton
              }
              onPress={handleLogout}>
              <Text
                style={
                  styles.logoutText
                }>
                Logout
              </Text>
            </TouchableOpacity>
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

  // Firebase checks for saved login when app starts
  if (checkingLogin) {
    return (
      <View
        style={
          styles.loadingContainer
        }>
        <StatusBar
          barStyle="dark-content"
        />

        <ActivityIndicator
          size="large"
          color="#035643"
        />

        <Text
          style={styles.loadingText}>
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

  homeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFBEF',
    padding: 25,
  },

  logo: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#035643',
  },

  raccoon: {
    fontSize: 90,
    marginVertical: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#035643',
  },

  message: {
    fontSize: 16,
    color: '#6E6151',
    marginTop: 12,
  },

  savedMessage: {
    fontSize: 14,
    color: '#6E6151',
    marginTop: 8,
  },

  email: {
    color: '#089BA1',
    fontWeight: '600',
    marginTop: 10,
  },

  mfaStatus: {
    color: '#168600',
    fontWeight: 'bold',
    marginTop: 10,
  },

  logoutButton: {
    backgroundColor: '#035643',
    paddingVertical: 15,
    paddingHorizontal: 55,
    borderRadius: 14,
    marginTop: 30,
  },

  logoutText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default App;