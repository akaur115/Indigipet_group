import React, {useState} from 'react';

import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  email: string;
  onLogout: () => Promise<void>;
};

export default function SettingsScreen({
  email,
  onLogout,
}: Props) {
  const [loggingOut, setLoggingOut] =
    useState(false);

  const logout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await onLogout();
    } catch (error: any) {
      Alert.alert(
        'Logout failed',
        error?.message || 'Please try again.',
      );
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <Text style={styles.title}>
          Settings
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>
            Signed in as
          </Text>

          <Text style={styles.email}>
            {email}
          </Text>
        </View>

        <TouchableOpacity
          onPress={logout}
          disabled={loggingOut}
          style={styles.logoutButton}>

          {loggingOut ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.logoutText}>
              Logout
            </Text>
          )}
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBEF',
  },

  content: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#035643',
  },

  card: {
    backgroundColor: '#FFFBF0',
    borderWidth: 1,
    borderColor: '#E5DAC8',
    borderRadius: 12,
    padding: 18,
    marginTop: 22,
  },

  label: {
    fontSize: 13,
    color: '#6E6151',
  },

  email: {
    fontSize: 16,
    color: '#035643',
    marginTop: 5,
  },

  logoutButton: {
    marginTop: 25,
    paddingVertical: 16,
    backgroundColor: '#035643',
    borderRadius: 12,
    alignItems: 'center',
  },

  logoutText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});