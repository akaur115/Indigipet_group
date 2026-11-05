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

export default function SettingsScreen({
  email,
  onLogout,
  onReturnHome,
}: Props) {
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

  const [soundEnabled, setSoundEnabled] =
    useState(false);

  const [username, setUsername] =
    useState('Not available');

  const [savingLogout, setSavingLogout] =
    useState(false);

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

  const toggleSection = (id: SectionId) => {
    setSections(previous => ({
      ...previous,
      [id]: !previous[id],
    }));
  };

  // SIGN OUT
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
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
            } catch (e: any) {
              Alert.alert(
                'Sign Out Failed',
                e?.message ||
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
  const handleDeleteAccount = () => {
    Alert.alert(
      'Request Account Deletion',
      'Contact support to request permanent deletion of your account and saved data. This does not delete your account immediately.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Email Support',
          onPress: async () => {
            const subject =
              encodeURIComponent(
                'IndigiPet Account Deletion Request',
              );

            const body =
              encodeURIComponent(
                'Hello,\n\n' +
                'Please delete my IndigiPet account and associated data.\n\n' +
                'Account email: ' +
                email +
                '\n\nThank you.',
              );

            const url =
              'mailto:support@giigidomikinaak.ca' +
              '?subject=' +
              subject +
              '&body=' +
              body;

            try {
              await Linking.openURL(url);
            } catch {
              Alert.alert(
                'Email App Unavailable',
                'Please email support@giigidomikinaak.ca.',
              );
            }
          },
        },
      ],
    );
  };

  const renderHeader = (
    id: SectionId,
    title: string,
  ) => (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={() => toggleSection(id)}
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

  // PRIVACY POLICY ONLY
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
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onReturnHome}
          accessibilityRole="button">

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
                />

                <Text style={styles.switchText}>
                  {notificationsEnabled
                    ? 'On'
                    : 'Off'}
                </Text>
              </View>

              <Text style={styles.previewNote}>
                Notifications will be
                connected in a future update.
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
                for lessons.
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
                />

                <Text style={styles.switchText}>
                  {soundEnabled
                    ? 'On'
                    : 'Off'}
                </Text>
              </View>

              <Text style={styles.previewNote}>
                Audio controls will work
                when lesson recordings are added.
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

              <Text style={styles.detailText}>
                Language Credits
              </Text>

              <Text style={styles.description}>
                Approved language contributor
                credits will appear here.
              </Text>
            </View>
          )}
        </View>

        {/* PRIVACY POLICY */}
        <View style={styles.sectionCard}>
          {renderHeader(
            'legal',
            'Privacy & Help',
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
            </View>
          )}
        </View>

        {/* SIGN OUT */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={savingLogout}>

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

        {/* DELETE ACCOUNT */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}>

          <Text style={styles.actionButtonText}>
            Delete Account
          </Text>
        </TouchableOpacity>

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
});
