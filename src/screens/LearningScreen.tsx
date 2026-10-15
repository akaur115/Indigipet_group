import React, {useState} from 'react';

import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  completeGameSession,
} from '../services/gameService';

type Props = {
  uid: string;
  onReturnHome: () => void;
};

export default function LearningScreen({
  uid,
  onReturnHome,
}: Props) {
  const [busy, setBusy] = useState(false);

  // Developer-only game reward test
  const testSession = async () => {
    if (busy) {
      return;
    }

    setBusy(true);

    try {
      await completeGameSession(
        uid,
        7,
        7,
      );

      Alert.alert(
        'Development Test Complete',
        '+70 XP, +25 coins and +30% friendship saved to Firebase.',
        [
          {
            text: 'See Home',
            onPress: onReturnHome,
          },
        ],
      );
    } catch (error: any) {
      Alert.alert(
        'Test failed',
        error?.message || 'Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}>

        <Text style={styles.title}>
          Learning
        </Text>

        <Text style={styles.subtitle}>
          Choose a category and practise
          Anishinaabemowin with Esiban.
        </Text>

        {/* NUMBERS CATEGORY */}

        <View style={styles.category}>
          <Text style={styles.categoryIcon}>
            🔢
          </Text>

          <View style={styles.categoryDetails}>
            <Text style={styles.categoryTitle}>
              Numbers
            </Text>

            <Text style={styles.categorySubtitle}>
              Lessons and games — being built
              by your team
            </Text>
          </View>
        </View>

        {/* FOOD CATEGORY */}

        <View style={styles.category}>
          <Text style={styles.categoryIcon}>
            🍲
          </Text>

          <View style={styles.categoryDetails}>
            <Text style={styles.categoryTitle}>
              Food
            </Text>

            <Text style={styles.categorySubtitle}>
              Lessons and games — being built
              by your team
            </Text>
          </View>
        </View>

        {/* DEVELOPMENT TEST */}

        {__DEV__ ? (
          <View style={styles.developmentBox}>
            <Text style={styles.developmentTitle}>
              Developer Test Only
            </Text>

            <Text style={styles.developmentInfo}>
              This does not play a real lesson.
              It simulates completing 7 correct
              answers so you can test the Home
              bars and coins.
            </Text>

            <TouchableOpacity
              onPress={testSession}
              disabled={busy}
              style={styles.testButton}>

              {busy ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text style={styles.testText}>
                  Test game rewards (+70 XP)
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.developmentInfo}>
            Games will appear here after
            the lesson content is connected.
          </Text>
        )}

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
    padding: 20,
  },

  title: {
    fontSize: 28,
    color: '#035643',
    fontWeight: 'bold',
  },

  subtitle: {
    fontSize: 15,
    color: '#6E6151',
    marginTop: 10,
    marginBottom: 20,
  },

  category: {
    backgroundColor: '#FFFBF0',
    borderColor: '#E5DAC8',
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  categoryIcon: {
    fontSize: 28,
    marginRight: 12,
  },

  categoryDetails: {
    flex: 1,
  },

  categoryTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#035643',
  },

  categorySubtitle: {
    fontSize: 12,
    color: '#6E6151',
    marginTop: 5,
  },

  developmentBox: {
    marginTop: 30,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#F3E9CF',
  },

  developmentTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#035643',
  },

  developmentInfo: {
    fontSize: 13,
    color: '#6E6151',
    marginTop: 8,
  },

  testButton: {
    marginTop: 15,
    backgroundColor: '#089BA1',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
  },

  testText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});