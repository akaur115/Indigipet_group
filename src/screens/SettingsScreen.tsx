
import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  doc,
  getFirestore,
  onSnapshot,
} from '@react-native-firebase/firestore';

import {
  getCurrentUser,
} from '../services/authService';

import LegalDocumentScreen from './LegalDocumentScreen';

import {
  PRIVACY_POLICY,
} from './legalDocuments';

type Props = {
  email: string;
  onLogout: () => void | Promise<void>;
  onReturnHome?: () => void;
};

type SectionId =
  | 'account'
  | 'notifications'
  | 'sound'
  | 'about'
  | 'legal';

type SectionsState =
  Record<SectionId, boolean>;

const COLORS = {
  darkGreen: '#035643',
  cream: '#FFFBEF',
  cream2: '#FFFBF0',
  text: '#292521',
  secondaryText: '#484139',
  mutedText: '#595147',
  teal: '#089BA1',
  tealShadow: '#08797A',
  red: '#B23F38',
  green: '#168600',
  border: '#D4C7B0',
};

const SUPPORT_EMAIL =
  'support@giigidomikinaak.ca';

export default function SettingsScreen({
  email,
  onLogout,
  onReturnHome,
}: Props) {

  // SETTINGS SECTIONS
  const [sections, setSections] =
    useState<SectionsState>({
      account: false,
      notifications: false,
      sound: false,
      about: false,
      legal: false,
    });

  const [showPrivacy, setShowPrivacy] =
    useState(false);

  const [
    notificationsEnabled,
    setNotificationsEnabled,
  ] = useState(false);

  const [
    soundEnabled,
    setSoundEnabled,
  ] = useState(false);

  const [username, setUsername] =
    useState('Not available');

  const [savingLogout, setSavingLogout] =
    useState(false);

  // LOAD ACCOUNT INFORMATION FROM FIREBASE
  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      return;
    }

    const db = getFirestore();

    const reference = doc(
      db,
      'users',
      user.uid,
    );

    const unsubscribe = onSnapshot(
      reference,
      snapshot => {
        const data = snapshot.data();

        if (data?.username) {
          setUsername(
            String(data.username),
          );
        } else if (data?.name) {
          setUsername(
            String(data.name),
          );
        }
      },
      error => {
        console.log(
          'SETTINGS ACCOUNT ERROR:',
          error.message,
        );
      },
    );

    return unsubscribe;
  }, []);

  // OPEN OR CLOSE SETTINGS SECTIONS
  const toggleSection = (
    id: SectionId,
  ) => {
    setSections(previous => ({
      ...previous,
      [id]: !previous[id],
    }));
  };

  // SIGN OUT
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of IndigiPet?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          onPress: async () => {
            if (savingLogout) {
              return;
            }

            setSavingLogout(true);

            try {
              await onLogout();
            } catch (error: any) {
              Alert.alert(
                'Sign Out Failed',
                error?.message ||
                  'Please try again.',
              );
            } finally {
              setSavingLogout(false);
            }
          },
        },
      ],
    );
  };

  // EMAIL ACCOUNT DELETION REQUEST
  // COMPATIBLE WITH FIREBASE SPARK FREE PLAN
  const handleDeleteAccount = () => {
    Alert.alert(
      'Request Account Deletion',
      'You can request permanent deletion of your IndigiPet account and personal information. Your pet, coins, XP, and learning progress will also be deleted. Requests must be processed within 30 days. Please use your registered email address.',
      [
        {
          text: 'Keep Account',
          style: 'cancel',
        },
        {
          text: 'Email Support',
          onPress: async () => {

            // EMAIL SUBJECT
            const subject =
              encodeURIComponent(
                'IndigiPet Account Deletion Request',
              );

            // EMAIL BODY
            const body =
              encodeURIComponent(
                'Hello IndigiPet Support,\n\n' +
                'I would like to request permanent deletion of my IndigiPet account and all associated personal information.\n\n' +
                'Registered account email: ' +
                (email ||
                  '[Enter registered email]') +
                '\n\n' +
                'I understand that my pet, coins, XP, and learning progress will be permanently removed.\n\n' +
                'Please process my request within 30 days and confirm when deletion is complete.\n\n' +
                'Thank you.',
              );

            // PREPARED EMAIL LINK
            const mailto =
              'mailto:' +
              SUPPORT_EMAIL +
              '?subject=' +
              subject +
              '&body=' +
              body;

            // DIRECTLY OPEN EMAIL APP
            try {
              await Linking.openURL(
                mailto,
              );

            } catch (error) {
              console.log(
                'EMAIL OPEN ERROR:',
                error,
              );

              Alert.alert(
                'Email App Not Available',
                'No compatible email app could be opened. Please install or configure Gmail, or send the request manually from your registered email address to ' +
                  SUPPORT_EMAIL +
                  '.',
                [
                  {
                    text: 'OK',
                    style: 'cancel',
                  },
                ],
              );
            }
          },
        },
      ],
    );
  };

  // SETTINGS SECTION HEADER
  const renderHeader = (
    id: SectionId,
    title: string,
  ) => (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={() =>
        toggleSection(id)
      }
      accessibilityRole="button"
      accessibilityState={{
        expanded: sections[id],
      }}>

      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      <Text style={styles.chevron}>
        {sections[id] ? '⌃' : '⌄'}
      </Text>

    </TouchableOpacity>
  );

  // PRIVACY POLICY SCREEN
  if (showPrivacy) {
    return (
      <LegalDocumentScreen
        document={PRIVACY_POLICY}
        onBack={() =>
          setShowPrivacy(false)
        }
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <StatusBar
        barStyle="light-content"
      />

      {/* HEADER */}
      <View style={styles.header}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={onReturnHome}
          accessibilityRole="button"
          accessibilityLabel="Return to Home">

          <Text style={styles.backArrow}>
            ‹
          </Text>

        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Settings
        </Text>

      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}>

        {/* ACCOUNT */}
        <View style={styles.sectionCard}>

          {renderHeader(
            'account',
            'Account',
          )}

          {sections.account && (
            <View style={styles.sectionBody}>

              <Text style={styles.detailText}>
                Username: {username}
              </Text>

              <Text style={styles.detailText}>
                Email: {email}
              </Text>

            </View>
          )}

        </View>

        {/* NOTIFICATIONS */}
        <View style={styles.sectionCard}>

          {renderHeader(
            'notifications',
            'Notifications',
          )}

          {sections.notifications && (
            <View style={styles.sectionBody}>

              <Text style={styles.description}>
                Esiban will let you know
                when he's hungry or misses you.
              </Text>

              <View style={styles.switchRow}>

                <Switch
                  value={notificationsEnabled}
                  onValueChange={
                    setNotificationsEnabled
                  }
                  trackColor={{
                    false: '#D8D0C5',
                    true: COLORS.green,
                  }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel="Pet notifications"
                />

                <Text style={styles.switchText}>
                  {notificationsEnabled
                    ? 'On'
                    : 'Off'}
                </Text>

              </View>

              <Text style={styles.previewNote}>
                Notification delivery will
                be connected in a future
                update.
              </Text>

            </View>
          )}

        </View>

        {/* SOUND */}
        <View style={styles.sectionCard}>

          {renderHeader(
            'sound',
            'Sound',
          )}

          {sections.sound && (
            <View style={styles.sectionBody}>

              <Text style={styles.description}>
                Enable or disable voice-over
                for learning activities.
              </Text>

              <View style={styles.switchRow}>

                <Switch
                  value={soundEnabled}
                  onValueChange={
                    setSoundEnabled
                  }
                  trackColor={{
                    false: '#D8D0C5',
                    true: COLORS.green,
                  }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel="Voice-over sound"
                />

                <Text style={styles.switchText}>
                  {soundEnabled
                    ? 'On'
                    : 'Off'}
                </Text>

              </View>

              <Text style={styles.previewNote}>
                This switch is a preview
                and does not currently
                control audio playback.
              </Text>

            </View>
          )}

        </View>

        {/* ABOUT */}
        <View style={styles.sectionCard}>

          {renderHeader(
            'about',
            'About',
          )}

          {sections.about && (
            <View style={styles.sectionBody}>

              <Text style={styles.detailText}>
                App Version: Development Preview
              </Text>

              <Text style={styles.creditsTitle}>
                Language Credits
              </Text>

              <Text style={styles.creditsText}>
                Chi-miigwech to Corey Whitford
                for sharing his voice and
                knowledge. Written and audio
                translations were provided by
                Corey Whitford from Sandy Bay
                First Nation. We acknowledge
                that Indigenous languages can
                vary between communities,
                families, and speakers. Some
                words, spellings, or
                translations may differ from
                what you know or use.
              </Text>

            </View>
          )}

        </View>

        {/* PRIVACY AND HELP */}
        <View style={styles.sectionCard}>

          {renderHeader(
            'legal',
            'Legal & Help',
          )}

          {sections.legal && (
            <View style={styles.sectionBody}>

              <TouchableOpacity
                onPress={() =>
                  setShowPrivacy(true)
                }
                accessibilityRole="button">

                <Text style={styles.legalLink}>
                  Privacy Policy  ›
                </Text>

              </TouchableOpacity>

              <Text style={styles.previewNote}>
                Account deletion requests
                can be sent to{' '}
                {SUPPORT_EMAIL}.
              </Text>

            </View>
          )}

        </View>

        {/* SIGN OUT BUTTON */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={savingLogout}
          accessibilityRole="button">

          {savingLogout ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.actionButtonText}>
              Sign Out
            </Text>
          )}

        </TouchableOpacity>

        {/* DELETE ACCOUNT BUTTON */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
          accessibilityRole="button">

          <Text style={styles.actionButtonText}>
            Delete Account
          </Text>

        </TouchableOpacity>

        <Text style={styles.deletionNote}>
          Deletion requests are sent by
          email and processed manually
          within 30 days. The user must
          send the email to submit the
          request.
        </Text>

      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  header: {
    backgroundColor: COLORS.darkGreen,
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 17,
  },

  backButton: {
    width: 38,
    height: 44,
    justifyContent: 'center',
  },

  backArrow: {
    fontSize: 34,
    color: '#FFFFFF',
    fontWeight: '400',
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
    marginLeft: 7,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 17,
    paddingTop: 18,
    paddingBottom: 35,
  },

  sectionCard: {
    backgroundColor: COLORS.cream2,
    borderColor: COLORS.border,
    borderWidth: 1.2,
    borderRadius: 10,
    marginBottom: 13,
    overflow: 'hidden',
  },

  sectionHeader: {
    minHeight: 53,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: 'bold',
    flex: 1,
  },

  chevron: {
    color: COLORS.text,
    fontSize: 27,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  sectionBody: {
    paddingHorizontal: 16,
    paddingBottom: 17,
    paddingTop: 3,
  },

  detailText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    marginTop: 5,
  },

  description: {
    color: COLORS.secondaryText,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 4,
    marginBottom: 9,
  },

  creditsTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginTop: 12,
  },

  creditsText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
    marginTop: 8,
  },

  previewNote: {
    color: COLORS.mutedText,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  switchText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },

  legalLink: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginTop: 8,
    marginBottom: 9,
  },

  signOutButton: {
    backgroundColor: COLORS.teal,
    minHeight: 50,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.tealShadow,
  },

  deleteButton: {
    backgroundColor: COLORS.red,
    minHeight: 50,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },

  deletionNote: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.mutedText,
    textAlign: 'center',
    marginTop: 10,
  },
});
