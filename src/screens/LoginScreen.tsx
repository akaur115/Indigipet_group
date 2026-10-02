import React, {useState} from 'react';

import type {
  MultiFactorResolver,
} from '@react-native-firebase/auth';

import {loginUser} from '../services/authService';

import {

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

  // Open MFA verification screen
  onMFARequired: (
    resolver: MultiFactorResolver,
  ) => void;
};

export default function LoginScreen({
  onRegister,
  onBack,
  onMFARequired,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] =
    useState('');
  const [loading, setLoading] =
    useState(false);

  // Login using Firebase Authentication
  const handleLogin = async () => {
    // Check required fields
    if (!email.trim() || !password) {
      Alert.alert(
        'Missing Information',
        'Please enter your email and password.',
      );
      return;
    }

    // Prevent multiple login requests
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      
      const result = await loginUser(
        email,
        password,
      );

      if (result.mfaRequired) {
        setPassword('');

        onMFARequired(
          result.resolver,
        );

        return;
      }
      setPassword('');

      console.log(
        'FIRST FACTOR LOGIN SUCCESS',
        result.user.email,
      );
    } catch (error: any) {
      console.log(
        'Login error:',
        error,
      );

      
      if (
        error?.code ===
          'auth/invalid-credential' ||
        error?.code ===
          'auth/wrong-password' ||
        error?.code ===
          'auth/user-not-found'
      ) {
        Alert.alert(
          'Login Failed',
          'Incorrect email or password. Please try again.',
        );
      }

      
      else if (
        error?.code ===
        'auth/invalid-email'
      ) {
        Alert.alert(
          'Invalid Email',
          'Please enter a valid email address.',
        );
      }

      // Network connection error
      else if (
        error?.code ===
        'auth/network-request-failed'
      ) {
        Alert.alert(
          'Connection Error',
          'Please check your internet connection and try again.',
        );
      }

      // Other Firebase errors
      else {
        Alert.alert(
          'Login Error',
          error?.message ||
            'Unable to log in. Please try again later.',
        );
      }
    } finally {
      
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.container}>
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled">

        {/* Application name */}
        <Text style={styles.logo}>
          IndigiPet
        </Text>

        {/* Temporary raccoon image */}
        <Text style={styles.raccoon}>
          🦝
        </Text>

        {/* Welcome message */}
        <Text style={styles.heading}>
          Welcome Back!
        </Text>

        <Text
          style={styles.description}>
          Esiban missed you! Log in to
          continue your learning journey.
        </Text>

        {/* Email */}
        <Text style={styles.label}>
          Email
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#999999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          editable={!loading}
        />

        {/* Password */}
        <Text style={styles.label}>
          Password
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#999999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          editable={!loading}
        />

        {/* Login button */}
        <TouchableOpacity
          style={[
            styles.loginButton,
            loading &&
              styles.disabledButton,
          ]}
          onPress={handleLogin}
          disabled={loading}>
          <Text
            style={styles.buttonText}>
            {loading
              ? 'Logging In...'
              : 'Login'}
          </Text>
        </TouchableOpacity>

        {/* Registration link */}
        <TouchableOpacity
          onPress={onRegister}
          disabled={loading}>
          <Text style={styles.link}>
            Don't have an account?
            Create Account
          </Text>
        </TouchableOpacity>

        {/* Back to Welcome */}
        <TouchableOpacity
          onPress={onBack}
          disabled={loading}>
          <Text
            style={styles.backLink}>
            Back to Welcome
          </Text>
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

  disabledButton: {
    opacity: 0.6,
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