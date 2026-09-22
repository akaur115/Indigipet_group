import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';

type LoginScreenProps = {
  onRegister: () => void;
  onBack: () => void;
};

export default function LoginScreen({
  onRegister,
  onBack,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Information', 'Please enter your email and password.');
      return;
    }

    // Firebase Authentication will be connected later.
    Alert.alert('Login', 'Login functionality will be connected to Firebase.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        <Text style={styles.logo}>IndigiPet</Text>

        <Text style={styles.raccoon}>🦝</Text>

        <Text style={styles.heading}>Welcome Back!</Text>

        <Text style={styles.description}>
          Esiban missed you! Log in to continue your learning journey.
        </Text>

        <Text style={styles.label}>Email</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#999999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <Text style={styles.label}>Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#999999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
        />

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onRegister}>
          <Text style={styles.link}>
            Don't have an account? Create Account
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backLink}>Back to Welcome</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBEF',
  },

  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 25,
  },

  logo: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#035643',
    textAlign: 'center',
    marginBottom: 20,
  },

  raccoon: {
    fontSize: 75,
    textAlign: 'center',
    marginBottom: 20,
  },

  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#035643',
    textAlign: 'center',
    marginBottom: 10,
  },

  description: {
    fontSize: 15,
    color: '#6E6151',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 23,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#035643',
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#B8CFC5',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 15,
    color: '#035643',
  },

  loginButton: {
    backgroundColor: '#035643',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },

  link: {
    color: '#089BA1',
    textAlign: 'center',
    marginTop: 25,
    fontSize: 14,
    fontWeight: '600',
  },

  backLink: {
    color: '#6E6151',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});