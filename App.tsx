import React, {useEffect, useState} from 'react';

import {
  StatusBar,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

import {
  getCurrentUser,
  listenToAuthState,
  logoutUser,
} from './src/services/authService';

type Screen = 'welcome' | 'login' | 'register' | 'home';

function App() {
  const [currentScreen, setCurrentScreen] =
    useState<Screen>('welcome');

  const [checkingLogin, setCheckingLogin] =
    useState(true);

  // Check if Firebase already has a logged-in user
  useEffect(() => {
    const unsubscribe = listenToAuthState(user => {
      if (user) {
        console.log('SAVED LOGIN FOUND:', user.email);

        setCurrentScreen('home');
      } else {
        console.log('NO SAVED LOGIN');

        setCurrentScreen('welcome');
      }

      setCheckingLogin(false);
    });

    return unsubscribe;
  }, []);

  // Logout user
  const handleLogout = async () => {
    try {
      await logoutUser();

      setCurrentScreen('welcome');
    } catch (error) {
      console.log('LOGOUT ERROR:', error);
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

      case 'home':
        const user = getCurrentUser();

        return (
          <View style={styles.homeContainer}>
            <Text style={styles.logo}>
              IndigiPet
            </Text>

            <Text style={styles.raccoon}>
              🦝
            </Text>

            <Text style={styles.title}>
              Welcome!
            </Text>

            <Text style={styles.message}>
              You are logged in.
            </Text>

            <Text style={styles.savedMessage}>
              Your login is saved on this device.
            </Text>

            <Text style={styles.email}>
              {user?.email}
            </Text>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}>
              <Text style={styles.logoutText}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        );

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

  // Wait while Firebase checks saved login
  if (checkingLogin) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />

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
      <StatusBar barStyle="dark-content" />

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

  logoutButton: {
    backgroundColor: '#035643',
    paddingVertical: 15,
    paddingHorizontal: 55,
    borderRadius: 14,
    marginTop: 30,
  },

  logoutText: {
    color: '#FFFBEF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default App;