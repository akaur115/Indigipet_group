import React, {useState} from 'react';

import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';

import {
  startMFAEnrollment,
  confirmMFAEnrollment,
} from '../services/authService';

type Props = {
  onComplete: () => void;
};

export default function MFASetupScreen({
  onComplete,
}: Props) {
  const [phoneNumber, setPhoneNumber] =
    useState('');

  const [code, setCode] =
    useState('');

  const [verificationId, setVerificationId] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] = useState(
    'Add your phone number for extra security.',
  );

  const sendCode = async () => {
    if (!phoneNumber.trim().startsWith('+')) {
      setMessage(
        'Enter the phone number with country code, for example +12045551234.',
      );
      return;
    }

    try {
      setLoading(true);

      const id =
        await startMFAEnrollment(
          phoneNumber,
        );

      setVerificationId(id);

      setMessage(
        'Verification code sent. Enter the 6-digit code.',
      );
    } catch (error: any) {
      setMessage(
        error?.message ||
          'Could not send verification code.',
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.trim().length !== 6) {
      setMessage(
        'Enter the 6-digit verification code.',
      );
      return;
    }

    try {
      setLoading(true);

      await confirmMFAEnrollment(
        verificationId,
        code.trim(),
      );

      setMessage(
        'MFA successfully enabled!',
      );

      onComplete();
    } catch (error: any) {
      setMessage(
        error?.message ||
          'Incorrect verification code.',
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
        Set Up MFA
      </Text>

      <Text style={styles.message}>
        {message}
      </Text>

      {verificationId === '' ? (
        <>
          <Text style={styles.label}>
            Phone Number
          </Text>

          <TextInput
            style={styles.input}
            placeholder="+12045551234"
            placeholderTextColor="#6E6151"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={sendCode}
            disabled={loading}>
            <Text style={styles.buttonText}>
              {loading
                ? 'Sending...'
                : 'Send MFA Code'}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>
            Verification Code
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
            onPress={verifyCode}
            disabled={loading}>
            <Text style={styles.buttonText}>
              {loading
                ? 'Verifying...'
                : 'Verify & Enable MFA'}
            </Text>
          </TouchableOpacity>
        </>
      )}
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
    fontSize: 27,
    fontWeight: 'bold',
    color: '#035643',
    textAlign: 'center',
  },

  message: {
    color: '#6E6151',
    textAlign: 'center',
    marginVertical: 22,
  },

  label: {
    color: '#035643',
    fontWeight: '600',
    marginBottom: 7,
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
});