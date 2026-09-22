import React, {useState} from 'react';
import {StatusBar, View, StyleSheet} from 'react-native';

import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

type Screen = 'welcome' | 'login' | 'register';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return (
          <WelcomeScreen
            onLogin={() => setCurrentScreen('login')}
            onRegister={() => setCurrentScreen('register')}
          />
        );

      case 'login':
        return (
          <LoginScreen
            onRegister={() => setCurrentScreen('register')}
            onBack={() => setCurrentScreen('welcome')}
          />
        );

      case 'register':
        return (
          <RegisterScreen
            onLogin={() => setCurrentScreen('login')}
            onBack={() => setCurrentScreen('welcome')}
          />
        );

      default:
        return (
          <WelcomeScreen
            onLogin={() => setCurrentScreen('login')}
            onRegister={() => setCurrentScreen('register')}
          />
        );
    }
  };

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
});

export default App;