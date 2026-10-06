import React, {useState} from 'react';

import {
  loginUser,
  resetPassword,
} from '../services/authService';

import type {MultiFactorResolver} from '@react-native-firebase/auth';

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
  onMFARequired: (resolver: MultiFactorResolver) => void;
};

export default function LoginScreen({
  onRegister,
  onBack,
  onMFARequired,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);


  const handleLogin = async () => {

    if (!email.trim() || !password) {
      Alert.alert(
        'Missing Information',
        'Please enter your email and password.',
      );
      return;
    }

    if (loading || resetLoading) {
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

        onMFARequired(result.resolver);

        return;
      }

      setPassword('');

      Alert.alert(
        'Login Successful!',
        'Welcome back to IndigiPet!',
      );
    } catch (error: any) {
      console.error('Login error:', error);


      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {
        Alert.alert(
          'Login Failed',
          'Incorrect email or password. Please try again.',
        );
      } else if (
        error.code === 'auth/invalid-email'
      ) {
        Alert.alert(
          'Invalid Email',
          'Please enter a valid email address.',
        );
      } else if (
        error.code === 'auth/network-request-failed'
      ) {
        Alert.alert(
          'Connection Error',
          'Please check your internet connection and try again.',
        );
      } else {
        Alert.alert(
          'Login Error',
          'Unable to log in. Please try again later.',
        );
      }
    } finally {

      setLoading(false);
    }
  };


  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        'Email Required',
        'Enter your email address above first, then press Forgot Password.',
      );

      return;
    }

    if (loading || resetLoading) {
      return;
    }

    setResetLoading(true);

    try {
      await resetPassword(email);

      Alert.alert(
        'Reset Email Sent',
        'A password reset link has been sent to your email. Please check your inbox.',
      );
    } catch (error: any) {
      console.error(
        'Password reset error:',
        error,
      );

      if (
        error.code === 'auth/invalid-email'
      ) {
        Alert.alert(
          'Invalid Email',
          'Please enter a valid email address.',
        );
      } else if (
        error.code === 'auth/network-request-failed'
      ) {
        Alert.alert(
          'Connection Error',
          'Please check your internet connection and try again.',
        );
      } else if (
        error.code === 'auth/too-many-requests'
      ) {
        Alert.alert(
          'Too Many Requests',
          'Please wait a little while and try again.',
        );
      } else {
        Alert.alert(
          'Password Reset',
          'Unable to send the password reset email. Please try again.',
        );
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">


        <Text style={styles.logo}>
          IndigiPet
        </Text>


        <Text style={styles.raccoon}>
          🦝
        </Text>


        <Text style={styles.heading}>
          Welcome Back!
        </Text>

        <Text style={styles.description}>
          Esiban missed you! Log in to continue your learning journey.
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
          editable={
            !loading &&
            !resetLoading
          }
        />

        {/* Password */}

        <Text style={styles.label}>
          Password
        </Text>

        <TextInput
          style={styles.passwordInput}
          placeholder="Enter your password"
          placeholderTextColor="#999999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          editable={
            !loading &&
            !resetLoading
          }
        />

        {/* Forgot Password */}

        <TouchableOpacity
          onPress={handleForgotPassword}
          disabled={
            loading ||
            resetLoading
          }>
          <Text style={styles.forgotPassword}>
            {resetLoading
              ? 'Sending Reset Email...'
              : 'Forgot Password?'}
          </Text>
        </TouchableOpacity>

        {/* Login */}

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={
            loading ||
            resetLoading
          }>
          <Text style={styles.buttonText}>
            {loading
              ? 'Logging In...'
              : 'Login'}
          </Text>
        </TouchableOpacity>

        {/* Register */}

        <TouchableOpacity
          onPress={onRegister}
          disabled={
            loading ||
            resetLoading
          }>
          <Text style={styles.link}>
            Don't have an account? Create Account
          </Text>
        </TouchableOpacity>

        {/* Back */}

        <TouchableOpacity
          onPress={onBack}
          disabled={
            loading ||
            resetLoading
          }>
          <Text style={styles.backLink}>
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

  passwordInput: {
    height: 52,
    borderWidth: 1,
    borderColor: '#B8CFC5',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    marginBottom: 8,
    fontSize: 15,
    color: '#035643',
  },

  forgotPassword: {
    color: '#089BA1',
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
  },

  loginButton: {
    backgroundColor: '#035643',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 5,
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