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

import {
  QUIZ_WORDS,
} from '../data/quizWords';

import type {
  MasteryTier,
} from '../services/quizEngine';

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

type WordCounts = {
  new: number;
  practicing: number;
  known: number;
};

const COLORS = {
  cream: '#FFFBEF',
  cream2: '#FFFBF0',
  green: '#035643',
  teal: '#089BA1',
  tealShadow: '#08797A',
  brown: '#6E6151',
  border: '#E5DAC8',

  new: '#AC31F3',
  practicing: '#0372DA',
  known: '#168600',

  newBackground: '#F3E6FF',
  practicingBackground: '#E5F1FF',
  knownBackground: '#E4F5DF',
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

function getTierLabel(
  tier: MasteryTier,
): string {
  if (tier === 'known') {
    return 'Known';
  }

  if (tier === 'learning') {
    return 'Practicing';
  }

  return 'New';
}

function getTierColor(
  tier: MasteryTier,
): string {
  if (tier === 'known') {
    return COLORS.known;
  }

  if (tier === 'learning') {
    return COLORS.practicing;
  }

  return COLORS.new;
}

function getTierBackground(
  tier: MasteryTier,
): string {
  if (tier === 'known') {
    return COLORS.knownBackground;
  }

  if (tier === 'learning') {
    return COLORS.practicingBackground;
  }

  return COLORS.newBackground;
}

export default function LearningScreen({
  uid,
  onReturnHome,
}: Props) {
  const [xp, setXp] = useState(0);

  const [wordCounts, setWordCounts] = useState<
    Record<string, WordCounts>
  >({});

  const [wordTiers, setWordTiers] = useState<
    Record<string, Record<string, MasteryTier>>
  >({});

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState<Category | null>(null);

  const [mode, setMode] = useState<
    'play' | 'view' | null
  >(null);

  // READ XP AND MASTERY FROM FIREBASE
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

        const savedLearning =
          data?.learningProgress || {};

        const savedQuiz =
          data?.quizProgress || {};

        const nextCounts: Record<
          string,
          WordCounts
        > = {};

        const nextTiers: Record<
          string,
          Record<string, MasteryTier>
        > = {};

        CATEGORIES.forEach(category => {
          const savedWords =
            savedQuiz?.[category.id]?.words;

          const tiers: Record<
            string,
            MasteryTier
          > = {};

          // GET EACH WORD'S MASTERY TIER
          if (
            savedWords &&
            typeof savedWords === 'object'
          ) {
            Object.entries(savedWords).forEach(
              ([wordId, value]) => {
                const raw = value as {
                  tier?: string;
                } | null;

                if (
                  raw?.tier === 'known' ||
                  raw?.tier === 'learning'
                ) {
                  tiers[wordId] = raw.tier;
                } else {
                  tiers[wordId] = 'new';
                }
              },
            );
          }

          nextTiers[category.id] = tiers;

          let known = 0;
          let practicing = 0;

          const savedWordEntries =
            Object.values(tiers);

          if (savedWordEntries.length > 0) {
            // PREFER ACTUAL WORD PROGRESS
            known = savedWordEntries.filter(
              tier => tier === 'known',
            ).length;

            practicing =
              savedWordEntries.filter(
                tier => tier === 'learning',
              ).length;
          } else {
            // SUPPORT OLDER SAVED PROGRESS
            const summary =
              savedLearning?.[category.id];

            known =
              typeof summary?.known === 'number'
                ? summary.known
                : 0;

            practicing =
              typeof summary?.learning === 'number'
                ? summary.learning
                : 0;
          }

          known = Math.min(
            category.total,
            Math.max(0, known),
          );

          practicing = Math.min(
            category.total - known,
            Math.max(0, practicing),
          );

          const newWords = Math.max(
            0,
            category.total -
              known -
              practicing,
          );

          nextCounts[category.id] = {
            new: newWords,
            practicing,
            known,
          };
        });

        setWordCounts(nextCounts);
        setWordTiers(nextTiers);
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

  // OPEN PLAY OR VIEW
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

  // BACK TO LEARNING CATEGORIES
  const returnToCategories = () => {
    setSelectedCategory(null);
    setMode(null);
  };

  // SMALL MASTERY COUNTER
  const renderProgressBox = (
    number: number,
    label: string,
    color: string,
    backgroundColor: string,
  ) => {
    return (
      <View
        style={[
          styles.progressBox,
          {backgroundColor},
        ]}>

        <Text
          style={[
            styles.progressNumber,
            {color},
          ]}>
          {number}
        </Text>

        <Text
          style={[
            styles.progressLabel,
            {color},
          ]}>
          {label}
        </Text>
      </View>
    );
  };

  // CATEGORY CARD
  const renderCategory = (
    category: Category,
  ) => {
    const levelLocked =
      playerLevel < category.unlockLevel;

    const unavailable =
      levelLocked || !category.available;

    const counts =
      wordCounts[category.id] || {
        new: category.total,
        practicing: 0,
        known: 0,
      };

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
              {counts.known} / {category.total}
              {' known'}
            </Text>

            {/* NEW / PRACTICING / KNOWN */}
            <View style={styles.progressRow}>
              {renderProgressBox(
                counts.new,
                'New',
                COLORS.new,
                COLORS.newBackground,
              )}

              {renderProgressBox(
                counts.practicing,
                'Practicing',
                COLORS.practicing,
                COLORS.practicingBackground,
              )}

              {renderProgressBox(
                counts.known,
                'Known',
                COLORS.known,
                COLORS.knownBackground,
              )}
            </View>

            {/* PLAY AND VIEW */}
            <View style={styles.buttonRow}>
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

  // VOCABULARY LIST WITH MASTERY LEVELS
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

        <Text style={styles.detailsDescription}>
          Practice these Ojibwe words.
          Their learning status updates
          after you complete quizzes.
        </Text>

        <View style={styles.wordList}>
          {words.map((word, index) => {
            const tier: MasteryTier =
              wordTiers[category.id]?.[
                word.id
              ] || 'new';

            return (
              <View
                key={word.id}
                style={styles.wordRow}>

                <View style={styles.wordNumber}>
                  <Text
                    style={styles.wordNumberText}>
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

                {/* INDIVIDUAL WORD STATUS */}
                <View
                  style={[
                    styles.tierBadge,
                    {
                      backgroundColor:
                        getTierBackground(tier),
                    },
                  ]}>

                  <Text
                    style={[
                      styles.tierBadgeText,
                      {
                        color:
                          getTierColor(tier),
                      },
                    ]}>
                    {getTierLabel(tier)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={styles.previewNote}>
          New means the word has not yet
          reached Practicing. Keep answering
          correctly to move words toward
          Known. Progress is saved after
          completing a quiz.
        </Text>
      </ScrollView>
    );
  };

  // REAL QUIZ SCREEN
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
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

      {/* MAIN PAGE OR WORD LIST */}
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
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 13,
  },

  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.green,
  },

  knownText: {
    fontSize: 14,
    color: COLORS.brown,
    marginTop: 4,
    marginBottom: 12,
  },

  // THREE PROGRESS BOXES
  progressRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 13,
  },

  progressBox: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: 10,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 62,
  },

  progressNumber: {
    fontSize: 21,
    fontWeight: 'bold',
  },

  progressLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 3,
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
    fontSize: 13,
    fontWeight: '600',
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

  // WORD LIST
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
    paddingHorizontal: 12,
    paddingVertical: 15,
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
    marginRight: 10,
  },

  wordNumberText: {
    color: COLORS.brown,
    fontWeight: 'bold',
    fontSize: 13,
  },

  wordDetails: {
    flex: 1,
    paddingRight: 8,
  },

  ojibweWord: {
    color: COLORS.green,
    fontWeight: 'bold',
    fontSize: 16,
  },

  englishWord: {
    color: COLORS.brown,
    fontSize: 13,
    marginTop: 3,
  },

  // WORD STATUS BADGE
  tierBadge: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tierBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },

  previewNote: {
    color: COLORS.brown,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 16,
  },
});
