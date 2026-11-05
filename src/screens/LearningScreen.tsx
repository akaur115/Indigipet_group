
import React, {useEffect, useState} from 'react';

import {
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
  getFirestore,
  onSnapshot,
} from '@react-native-firebase/firestore';

import {getLevel} from '../services/gameService';
import {QUIZ_WORDS} from '../data/quizWords';
import QuizScreen from './QuizScreen';

type Props = {
  uid: string;
  onReturnHome: () => void;
};

type CategoryId =
  | 'numbers'
  | 'food'
  | 'animals'
  | 'winter';

type Category = {
  id: CategoryId;
  title: string;
  total: number;
  unlockLevel: number;
  available: boolean;
};

const COLORS = {
  cream: '#FFFBEF',
  cream2: '#FFFBF0',
  green: '#035643',
  teal: '#089BA1',
  tealShadow: '#08797A',
  brown: '#6E6151',
  border: '#E5DAC8',
};

const CATEGORIES: Category[] = [
  {
    id: 'numbers',
    title: 'Numbers',
    total: QUIZ_WORDS.numbers.length,
    unlockLevel: 1,
    available: true,
  },
  {
    id: 'food',
    title: 'Food',
    total: QUIZ_WORDS.food.length,
    unlockLevel: 1,
    available: true,
  },
  {
    id: 'animals',
    title: 'Animals',
    total: 10,
    unlockLevel: 1,
    available: false,
  },
  {
    id: 'winter',
    title: 'Winter',
    total: 10,
    unlockLevel: 6,
    available: false,
  },
];

export default function LearningScreen({
  uid,
  onReturnHome,
}: Props) {
  const [xp, setXp] = useState(0);

  const [knownCounts, setKnownCounts] = useState<
    Record<string, number>
  >({});

  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  const [mode, setMode] =
    useState<'play' | 'view' | null>(null);

  // READ XP AND WORD PROGRESS FROM FIREBASE
  useEffect(() => {
    const db = getFirestore();

    const reference = doc(
      db,
      'users',
      uid,
    );

    const unsubscribe = onSnapshot(
      reference,
      snapshot => {
        const data = snapshot.data();

        const savedXp = data?.game?.xp;

        setXp(
          typeof savedXp === 'number'
            ? savedXp
            : 0,
        );

        const savedProgress =
          data?.learningProgress || {};

        const nextCounts: Record<
          string,
          number
        > = {};

        CATEGORIES.forEach(category => {
          const count =
            savedProgress?.[category.id]?.known;

          nextCounts[category.id] =
            typeof count === 'number'
              ? Math.max(
                  0,
                  Math.min(
                    category.total,
                    count,
                  ),
                )
              : 0;
        });

        setKnownCounts(nextCounts);
      },
      error => {
        console.log(
          'LEARNING PROGRESS ERROR:',
          error.message,
        );
      },
    );

    return unsubscribe;
  }, [uid]);

  const playerLevel = getLevel(xp).level;

  // OPEN A CATEGORY
  const openCategory = (
    category: Category,
    action: 'play' | 'view',
  ) => {
    if (playerLevel < category.unlockLevel) {
      Alert.alert(
        'Category Locked',
        'Reach XP level ' +
          String(category.unlockLevel) +
          ' to unlock this category.',
      );

      return;
    }

    if (!category.available) {
      Alert.alert(
        'Coming Soon',
        category.title +
          ' is planned for a future update.',
      );

      return;
    }

    setSelectedCategory(category);
    setMode(action);
  };

  // RETURN TO CATEGORY LIST
  const returnToCategories = () => {
    setSelectedCategory(null);
    setMode(null);
  };

  // DISPLAY CATEGORY CARD
  const renderCategory = (category: Category) => {
    const levelLocked =
      playerLevel < category.unlockLevel;

    const unavailable =
      levelLocked || !category.available;

    const known =
      knownCounts[category.id] ?? 0;

    return (
      <View
        key={category.id}
        style={styles.categoryCard}>

        {unavailable ? (
          <View style={styles.lockedRow}>
            <Text style={styles.lockIcon}>
              🔒
            </Text>

            <View style={styles.lockedDetails}>
              <Text style={styles.lockedTitle}>
                {category.title}
              </Text>

              <Text style={styles.lockedSubtitle}>
                {levelLocked
                  ? 'Unlocks at XP level ' +
                    String(category.unlockLevel)
                  : 'Coming soon'}
              </Text>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.categoryTitle}>
              {category.title}
            </Text>

            <Text style={styles.knownText}>
              {known} / {category.total} known
            </Text>

            <View style={styles.buttonRow}>
              {/* PLAY REAL QUIZ */}
              <TouchableOpacity
                style={styles.playButton}
                onPress={() =>
                  openCategory(
                    category,
                    'play',
                  )
                }
                accessibilityRole="button"
                accessibilityLabel={
                  'Play ' + category.title
                }>

                <Text style={styles.playIcon}>
                  ▶
                </Text>

                <Text style={styles.buttonLabel}>
                  Play
                </Text>
              </TouchableOpacity>

              {/* VIEW WORD LIST */}
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() =>
                  openCategory(
                    category,
                    'view',
                  )
                }
                accessibilityRole="button"
                accessibilityLabel={
                  'View ' +
                  category.title +
                  ' words'
                }>

                <Text style={styles.viewIcon}>
                  ▣
                </Text>

                <Text style={styles.buttonLabel}>
                  View
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  // DISPLAY VOCABULARY WORDS
  const renderWordList = (
    category: Category,
  ) => {
    const words =
      category.id === 'numbers' ||
      category.id === 'food'
        ? QUIZ_WORDS[category.id]
        : [];

    return (
      <ScrollView
        contentContainerStyle={
          styles.detailsContent
        }
        showsVerticalScrollIndicator={false}>

        <Text style={styles.detailsTitle}>
          {category.title}
        </Text>

        <Text
          style={styles.detailsDescription}>
          Learn these Ojibwe words and their
          English meanings.
        </Text>

        <View style={styles.wordList}>
          {words.map((word, index) => (
            <View
              key={word.id}
              style={styles.wordRow}>

              <View style={styles.wordNumber}>
                <Text
                  style={
                    styles.wordNumberText
                  }>
                  {index + 1}
                </Text>
              </View>

              <View style={styles.wordDetails}>
                <Text style={styles.ojibweWord}>
                  {word.word_ojibwe}
                </Text>

                <Text style={styles.englishWord}>
                  {word.word_english}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.previewNote}>
          Vocabulary from the client's
          reference document. Play a quiz
          to save your word mastery.
          Audio will be added after
          approved recordings are available.
        </Text>
      </ScrollView>
    );
  };

  // OPEN THE REAL QUIZ
  // NO EXTRA LEARNING HEADER
  if (
    selectedCategory &&
    mode === 'play' &&
    (
      selectedCategory.id === 'numbers' ||
      selectedCategory.id === 'food'
    )
  ) {
    return (
      <QuizScreen
        uid={uid}
        categoryId={selectedCategory.id}
        onExit={returnToCategories}
      />
    );
  }

  // MAIN LEARNING PAGE
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* DARK GREEN HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={
            selectedCategory
              ? returnToCategories
              : onReturnHome
          }
          accessibilityRole="button"
          accessibilityLabel="Go back">

          <Text style={styles.backArrow}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {selectedCategory
            ? selectedCategory.title
            : 'Learning'}
        </Text>
      </View>

      {/* CATEGORY OR WORD LIST */}
      {selectedCategory &&
      mode === 'view' ? (
        renderWordList(selectedCategory)
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={false}>

          {CATEGORIES.map(renderCategory)}

        </ScrollView>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  header: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  backButton: {
    width: 32,
    height: 42,
    justifyContent: 'center',
  },

  backArrow: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '300',
    marginTop: -4,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 30,
  },

  categoryCard: {
    backgroundColor: COLORS.cream2,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 19,
    paddingVertical: 12,
    marginBottom: 12,
  },

  categoryTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.brown,
  },

  knownText: {
    fontSize: 13,
    color: COLORS.brown,
    marginTop: 4,
    marginBottom: 7,
  },

  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  playButton: {
    flex: 2,
    height: 47,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cream2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  viewButton: {
    flex: 1,
    height: 47,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cream2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  playIcon: {
    color: COLORS.teal,
    fontSize: 18,
    fontWeight: 'bold',
  },

  viewIcon: {
    color: COLORS.teal,
    fontSize: 23,
    fontWeight: 'bold',
    lineHeight: 25,
  },

  buttonLabel: {
    color: COLORS.teal,
    fontSize: 12,
    marginTop: 1,
  },

  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 42,
  },

  lockIcon: {
    fontSize: 19,
    marginRight: 13,
  },

  lockedDetails: {
    flex: 1,
  },

  lockedTitle: {
    color: COLORS.brown,
    fontWeight: 'bold',
    fontSize: 16,
  },

  lockedSubtitle: {
    color: COLORS.brown,
    fontSize: 12,
    marginTop: 3,
  },

  detailsContent: {
    padding: 18,
    paddingBottom: 35,
  },

  detailsTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: COLORS.green,
    marginBottom: 9,
  },

  detailsDescription: {
    fontSize: 14,
    color: COLORS.brown,
    marginBottom: 18,
    lineHeight: 21,
  },

  wordList: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },

  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.cream2,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
  },

  wordNumber: {
    backgroundColor: '#F3E9CF',
    borderRadius: 20,
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  wordNumberText: {
    color: COLORS.brown,
    fontWeight: 'bold',
    fontSize: 13,
  },

  wordDetails: {
    flex: 1,
  },

  ojibweWord: {
    color: COLORS.green,
    fontWeight: 'bold',
    fontSize: 17,
  },

  englishWord: {
    color: COLORS.brown,
    fontSize: 13,
    marginTop: 3,
  },

  previewNote: {
    color: COLORS.brown,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 16,
  },
});
