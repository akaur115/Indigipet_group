import React, {
  useEffect,
  useState,
} from 'react';

import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';

import type {
  MultiFactorResolver,
} from '@react-native-firebase/auth';

import {
  startMFALogin,
  confirmMFALogin,
} from '../services/authService';

type Props = {
  resolver: MultiFactorResolver;
  onComplete: () => void;
  onCancel: () => void;
};

export default function MFAVerifyScreen({
  resolver,
  onComplete,
  onCancel,
}: Props) {
  const [verificationId, setVerificationId] =
    useState('');

  const [code, setCode] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState('Sending MFA code...');

  useEffect(() => {
    const sendCode = async () => {
      try {
        const id =
          await startMFALogin(
            resolver,
          );

        setVerificationId(id);

        setMessage(
          'Enter the verification code sent to your phone.',
        );
      } catch (error: any) {
        setMessage(
          error?.message ||
            'Could not send MFA code.',
        );
      } finally {
        setLoading(false);
      }
    };

    sendCode();
  }, [resolver]);

  const verify = async () => {
    if (code.trim().length !== 6) {
      setMessage(
        'Enter the 6-digit verification code.',
      );
      return;
    }

    try {
      setLoading(true);

      await confirmMFALogin(
        resolver,
        verificationId,
        code.trim(),
      );

      onComplete();
    } catch (error: any) {
      setMessage(
        error?.message ||
          'Incorrect MFA code.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>
        IndigiPet
      </Text>

      <Text style={styles.raccoon}>
        🦝
      </Text>

      <Text style={styles.title}>
        MFA Verification
      </Text>

      <Text style={styles.message}>
        {message}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="6-digit code"
        placeholderTextColor="#6E6151"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={verify}
        disabled={
          loading ||
          verificationId === ''
        }>
        <Text style={styles.buttonText}>
          {loading
            ? 'Please Wait...'
            : 'Verify'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onCancel}>
        <Text style={styles.cancel}>
          Cancel
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 25,
    backgroundColor: '#FFFBEF',
  },

  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#035643',
    textAlign: 'center',
  },

  raccoon: {
    fontSize: 70,
    textAlign: 'center',
    marginVertical: 18,
  },

  title: {
    color: '#035643',
    fontSize: 27,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  message: {
    color: '#6E6151',
    textAlign: 'center',
    marginVertical: 22,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#035643',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 18,
    color: '#035643',
  },

  button: {
    backgroundColor: '#035643',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFBEF',
    fontWeight: 'bold',
  },

  cancel: {
    textAlign: 'center',
    color: '#6E6151',
    marginTop: 20,
  },
});