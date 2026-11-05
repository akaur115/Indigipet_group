import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';

import {
  TERMS_OF_SERVICE,
} from './legalDocuments';

// Change this only after the client
// approves a new version of the Terms.
const TERMS_VERSION = '2026-10-26';

type Props = {
  uid: string;
  onAccepted: (uid: string) => void;
  onDecline: () => void | Promise<void>;
};

export default function TermsAcceptanceScreen({
  uid,
  onAccepted,
  onDecline,
}: Props) {
  const [checking, setChecking] =
    useState(true);

  const [checked, setChecked] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [retry, setRetry] =
    useState(0);

  // CHECK WHETHER USER ALREADY ACCEPTED
  // THE CURRENT TERMS VERSION
  useEffect(() => {
    let active = true;

    const checkTerms = async () => {
      setChecking(true);
      setError('');

      try {
        const db = getFirestore();
        const userRef = doc(
          db,
          'users',
          uid,
        );

        const snapshot =
          await getDoc(userRef);

        const acceptedVersion =
          snapshot.data()
            ?.termsConsent?.version;

        if (!active) {
          return;
        }

        if (
          acceptedVersion === TERMS_VERSION
        ) {
          onAccepted(uid);
          return;
        }

        setChecking(false);
      } catch (e: any) {
        if (!active) {
          return;
        }

        setError(
          e?.message ||
            'Could not check Terms acceptance.',
        );

        setChecking(false);
      }
    };

    void checkTerms();

    return () => {
      active = false;
    };
  }, [uid, onAccepted, retry]);

  // ACCEPT AND SAVE TO FIREBASE
  const handleContinue = async () => {
    if (!checked || saving) {
      return;
    }

    setSaving(true);

    try {
      const db = getFirestore();

      const userRef = doc(
        db,
        'users',
        uid,
      );

      await setDoc(
        userRef,
        {
          termsConsent: {
            version: TERMS_VERSION,
            acceptedAt: serverTimestamp(),
          },
        },
        {merge: true},
      );

      onAccepted(uid);
    } catch (e: any) {
      Alert.alert(
        'Could Not Save Acceptance',
        e?.message ||
          'Please check your internet connection.',
      );
    } finally {
      setSaving(false);
    }
  };

  // USER CAN DECLINE AND SIGN OUT
  const handleDecline = () => {
    Alert.alert(
      'Do Not Agree?',
      'You must agree to the Terms of Service to enter IndigiPet.',
      [
        {
          text: 'Keep Reading',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          onPress: () => {
            void onDecline();
          },
        },
      ],
    );
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#035643"
        />

        <Text style={styles.helper}>
          Checking Terms of Service...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>
          Connection Problem
        </Text>

        <Text style={styles.helper}>
          {error}
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            setRetry(value => value + 1)
          }>
          <Text style={styles.buttonText}>
            Try Again
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDecline}>
          <Text style={styles.decline}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Terms of Service
        </Text>

        <Text style={styles.headerSubtitle}>
          Please read before continuing
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator>

        <Text style={styles.title}>
          {TERMS_OF_SERVICE.title}
        </Text>

        <Text style={styles.date}>
          Effective date:{' '}
          {TERMS_OF_SERVICE.effectiveDate}
        </Text>

        {/* CLIENT'S COMPLETE INTRODUCTION */}
        {TERMS_OF_SERVICE.intro.map(
          (paragraph, index) => (
            <Text
              key={'intro-' + index}
              style={styles.paragraph}>
              {paragraph}
            </Text>
          ),
        )}

        {/* CLIENT'S COMPLETE TERMS */}
        {TERMS_OF_SERVICE.sections.map(
          (section, index) => (
            <View
              key={'section-' + index}
              style={styles.section}>

              <Text style={styles.heading}>
                {section.heading}
              </Text>

              {section.paragraphs.map(
                (paragraph, paragraphIndex) => (
                  <Text
                    key={
                      'paragraph-' +
                      paragraphIndex
                    }
                    style={styles.paragraph}>
                    {paragraph}
                  </Text>
                ),
              )}
            </View>
          ),
        )}

        {/* REQUIRED CHECKBOX AT END */}
        <TouchableOpacity
          style={styles.agreementRow}
          onPress={() =>
            setChecked(value => !value)
          }
          accessibilityRole="checkbox"
          accessibilityState={{
            checked,
          }}
          accessibilityLabel={
            'I have read and agree to the Terms of Service'
          }>

          <View
            style={[
              styles.checkbox,
              checked &&
                styles.checkboxChecked,
            ]}>

            {checked && (
              <Text style={styles.checkmark}>
                ✓
              </Text>
            )}
          </View>

          <Text style={styles.agreementText}>
            I have read and agree to
            the Terms of Service.
          </Text>
        </TouchableOpacity>

        {/* CONTINUE BUTTON */}
        <TouchableOpacity
          style={[
            styles.button,
            (!checked || saving) &&
              styles.disabled,
          ]}
          disabled={!checked || saving}
          onPress={() =>
            void handleContinue()
          }>

          {saving ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.buttonText}>
              Agree & Continue
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.declineButton}
          onPress={handleDecline}>

          <Text style={styles.decline}>
            I Do Not Agree - Sign Out
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

  center: {
    flex: 1,
    backgroundColor: '#FFFBEF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },

  header: {
    backgroundColor: '#035643',
    padding: 20,
  },

  headerTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  headerSubtitle: {
    fontSize: 14,
    color: '#D9EEE6',
    marginTop: 6,
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  title: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#035643',
    marginBottom: 8,
  },

  date: {
    fontSize: 14,
    color: '#484139',
    marginBottom: 18,
  },

  section: {
    marginTop: 16,
  },

  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#035643',
    marginBottom: 10,
  },

  paragraph: {
    color: '#292521',
    fontSize: 16,
    lineHeight: 25,
    marginBottom: 12,
  },

  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF5E9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B3D5B0',
    padding: 16,
    marginTop: 28,
  },

  checkbox: {
    width: 27,
    height: 27,
    borderWidth: 2,
    borderColor: '#035643',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  checkboxChecked: {
    backgroundColor: '#035643',
  },

  checkmark: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: 'bold',
  },

  agreementText: {
    color: '#173C33',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    lineHeight: 23,
  },

  button: {
    backgroundColor: '#089BA1',
    minHeight: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 18,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },

  disabled: {
    opacity: 0.45,
  },

  declineButton: {
    marginTop: 20,
    alignItems: 'center',
  },

  decline: {
    color: '#B23F38',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
  },

  helper: {
    color: '#484139',
    fontSize: 15,
    marginTop: 15,
    textAlign: 'center',
  },
});
