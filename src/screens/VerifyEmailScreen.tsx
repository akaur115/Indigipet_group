import React, {useState} from 'react';

import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';

import {
  checkEmailVerification,
  resendVerificationEmail,
  logoutUser,
} from '../services/authService';

type Props = {
  onVerified: () => void;
  onBack: () => void;
};

export default function VerifyEmailScreen({
  onVerified,
  onBack,
}: Props) {
  const [message, setMessage] = useState(
    'We sent a verification link to your email.',
  );

  const [loading, setLoading] = useState(false);

  const checkVerification = async () => {
    try {
      setLoading(true);
      setMessage('Checking email verification...');

    const verified = await checkEmailVerification();

    if (!verified) {
      setMessage(
        'Your email is not verified yet. Open the verification email and click the link first.',
      );
      return;
    }

    setMessage('Email verified successfully!');

    onVerified();
  } catch (error: any) {
    setMessage(
      error?.message ||
        'Could not check email verification.',
    );
  } finally {
    setLoading(false);
  }
};

  const resend = async () => {
    try {
      await resendVerificationEmail();

      setMessage(
        'Verification email sent again.',
      );
    } catch (error: any) {
      setMessage(
        error?.message ||
          'Could not resend email.',
      );
    }
  };

  const goBack = async () => {
    await logoutUser();
    onBack();
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
        Verify Your Email
      </Text>

      <Text style={styles.message}>
        {message}
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={checkVerification}
        disabled={loading}>
        <Text style={styles.buttonText}>
          {loading
            ? 'Checking...'
            : "I've Verified My Email"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={resend}>
        <Text style={styles.link}>
          Resend Verification Email
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={goBack}>
        <Text style={styles.back}>
          Back to Login
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
    marginVertical: 20,
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
    marginVertical: 25,
  },

  button: {
    backgroundColor: '#035643',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFBEF',
    fontWeight: 'bold',
  },

  link: {
    color: '#089BA1',
    textAlign: 'center',
    marginTop: 25,
    fontWeight: '600',
  },

  back: {
    color: '#6E6151',
    textAlign: 'center',
    marginTop: 20,
  },
});