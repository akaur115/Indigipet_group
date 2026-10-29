
import React, {useEffect, useState} from 'react';

import {
  ActivityIndicator,
  Alert,
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

type SectionsState = Record<SectionId, boolean>;

// IMPROVED COLOURS FOR BETTER VISIBILITY
const COLORS = {
  darkGreen: '#035643',
  cream: '#FFFBEF',
  cream2: '#FFFBF0',

  // Darker, easier-to-read text
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

  // LOAD ACCOUNT DETAILS FROM FIREBASE
  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      return;
    }

    const db = getFirestore();

    const userReference = doc(
      db,
      'users',
      user.uid,
    );

    const unsubscribe = onSnapshot(
      userReference,
      snapshot => {
        const data = snapshot.data();

        if (data?.username) {
          setUsername(String(data.username));
        } else if (data?.name) {
          setUsername(String(data.name));
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

  // OPEN OR CLOSE SECTIONS
  const toggleSection = (
    section: SectionId,
  ) => {
    setSections(previous => ({
      ...previous,
      [section]: !previous[section],
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

  // DELETE ACCOUNT - PREVIEW ONLY
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your IndigiPet account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Coming Soon',
              'Secure account deletion has not been implemented yet. Your account has not been deleted.',
            );
          },
        },
      ],
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'The approved Privacy Policy will be added here.',
    );
  };

  const handleTerms = () => {
    Alert.alert(
      'Terms of Use',
      'The approved Terms of Use will be added here.',
    );
  };

  // REUSABLE DROPDOWN HEADER
  const renderSectionHeader = (
    id: SectionId,
    title: string,
  ) => {
    const expanded = sections[id];

    return (
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection(id)}
        accessibilityRole="button"
        accessibilityState={{expanded}}>

        <Text style={styles.sectionTitle}>
          {title}
        </Text>

        <Text style={styles.chevron}>
          {expanded ? '⌃' : '⌄'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* GREEN HEADER */}
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ACCOUNT */}
        <View style={styles.sectionCard}>
          {renderSectionHeader(
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
          {renderSectionHeader(
            'notifications',
            'Notifications',
          )}

          {sections.notifications && (
            <View style={styles.sectionBody}>
              <Text style={styles.description}>
                Esiban will let you know when
                he's hungry or misses you.
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
                Notification delivery will be
                connected in a future update.
              </Text>
            </View>
          )}
        </View>

        {/* SOUND */}
        <View style={styles.sectionCard}>
          {renderSectionHeader(
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
                  onValueChange={setSoundEnabled}
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
                Voice-over control will work
                when lesson audio is added.
              </Text>
            </View>
          )}
        </View>

        {/* ABOUT */}
        <View style={styles.sectionCard}>
          {renderSectionHeader(
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
                Approved Ojibwe language
                contributor credits will
                appear here.
              </Text>
            </View>
          )}
        </View>

        {/* LEGAL AND HELP */}
        <View style={styles.sectionCard}>
          {renderSectionHeader(
            'legal',
            'Legal & Help',
          )}

          {sections.legal && (
            <View style={styles.sectionBody}>
              <TouchableOpacity
                onPress={handlePrivacyPolicy}
                accessibilityRole="button">

                <Text style={styles.legalLink}>
                  Privacy Policy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleTerms}
                accessibilityRole="button">

                <Text style={styles.legalLink}>
                  Terms of Use
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* SIGN OUT */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={savingLogout}
          accessibilityRole="button">

          {savingLogout ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.actionButtonText}>
              Sign Out
            </Text>
          )}
        </TouchableOpacity>

        {/* DELETE ACCOUNT */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
          accessibilityRole="button">

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

  // BIGGER AND DARKER SECTION TITLES
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

  // BIGGER ACCOUNT DETAILS
  detailText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    marginTop: 5,
  },

  // MORE READABLE DESCRIPTIONS
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

  // DARKER LEGAL LINKS
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

  // BIGGER BUTTON LETTERS
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    
  },
});
