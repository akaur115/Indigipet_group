import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

type WelcomeScreenProps = {
  onLogin: () => void;
  onRegister: () => void;
};

export default function WelcomeScreen({
  onLogin,
  onRegister,
}: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* Application name */}
        <Text style={styles.logo}>IndigiPet</Text>

        {/* raccoon image */}
        <Text style={styles.raccoon}>🦝</Text>

        {/* Welcome message */}
        <Text style={styles.heading}>Meet Esiban!</Text>

        <Text style={styles.description}>
          Learn Ojibwe while caring for your new little friend.
        </Text>

        {/* Login button */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={onLogin}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        {/* Registration button */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={onRegister}
        >
          <Text style={styles.registerButtonText}>
            Create Account
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBEF',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },

  logo: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#035643',
    marginBottom: 35,
  },

  raccoon: {
    fontSize: 95,
    marginBottom: 25,
  },

  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#035643',
    marginBottom: 15,
  },

  description: {
    fontSize: 16,
    color: '#6E6151',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },

  loginButton: {
    backgroundColor: '#035643',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 15,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },

  registerButton: {
    backgroundColor: '#089BA1',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },

  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});