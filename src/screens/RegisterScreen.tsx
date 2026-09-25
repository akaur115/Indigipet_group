import React, { useState } from 'react';
import { registerUser } from '../services/authService';

import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';

type RegisterScreenProps = {
  onLogin: () => void;
  onBack: () => void;
};

export default function RegisterScreen({
  onLogin,
  onBack,
}: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Check empty fields
    if (
      !name.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password
    ) {
      Alert.alert(
        'Missing Information',
        'Please complete all the fields.',
      );
      return;
    }

    // Check email
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert(
        'Invalid Email',
        'Please enter a valid email address.',
      );
      return;
    }

    // Check password
    if (password.length < 6) {
      Alert.alert(
        'Invalid Password',
        'Password must contain at least 6 characters.',
      );
      return;
    }

    try {
      setLoading(true);

      console.log('Creating Firebase account...');

      // Matches authService.ts:
      // registerUser(name, username, email, password)
      await registerUser(
        name,
        username,
        email,
        password,
      );

      console.log('ACCOUNT CREATED SUCCESSFULLY');

      Alert.alert(
        'Account Created',
        'Your IndigiPet account was created successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              setName('');
              setUsername('');
              setEmail('');
              setPassword('');
              onLogin();
            },
          },
        ],
      );
    } catch (error: any) {
      console.log('REGISTER ERROR CODE:', error?.code);
      console.log('REGISTER ERROR MESSAGE:', error?.message);

      const errorText =
        String(error?.code || 'Unknown error') +
        '\n\n' +
        String(error?.message || 'Unknown error');

      Alert.alert(
        'Registration Failed',
        errorText,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Application name */}
        <Text style={styles.logo}>IndigiPet</Text>

        {/* Temporary raccoon */}
        <Text style={styles.raccoon}>🦝</Text>

        <Text style={styles.heading}>
          Create Account
        </Text>

        <Text style={styles.description}>
          Start your learning journey with Esiban!
        </Text>

        {/* Name */}
        <Text style={styles.label}>Name</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#999999"
          value={name}
          onChangeText={setName}
          autoComplete="name"
          editable={!loading}
        />

        {/* Username */}
        <Text style={styles.label}>Username</Text>

        <TextInput
          style={styles.input}
          placeholder="Choose a username"
          placeholderTextColor="#999999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        {/* Email */}
        <Text style={styles.label}>Email</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#999999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          editable={!loading}
        />

        {/* Password */}
        <Text style={styles.label}>Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Create a password"
          placeholderTextColor="#999999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          editable={!loading}
        />

        {/* Register button */}
        <TouchableOpacity
          style={[
            styles.registerButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>
            {loading
              ? 'Creating Account...'
              : 'Register'}
          </Text>
        </TouchableOpacity>

        {/* Login link */}
        <TouchableOpacity
          onPress={onLogin}
          disabled={loading}
        >
          <Text style={styles.link}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>

        {/* Back button */}
        <TouchableOpacity
          onPress={onBack}
          disabled={loading}
        >
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
    paddingVertical: 40,
  },

  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#035643',
    textAlign: 'center',
    marginBottom: 12,
  },

  raccoon: {
    fontSize: 65,
    textAlign: 'center',
    marginBottom: 12,
  },

  heading: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#035643',
    textAlign: 'center',
    marginBottom: 10,
  },

  description: {
    fontSize: 15,
    color: '#6E6151',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 23,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#035643',
    marginBottom: 7,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#B8CFC5',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    marginBottom: 16,
    fontSize: 15,
    color: '#035643',
  },

  registerButton: {
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
    marginTop: 24,
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