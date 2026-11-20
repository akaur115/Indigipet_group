
import React, {useEffect, useState} from 'react';
import {
  Alert,
  ScrollView,
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
  type QuizCategoryId,
} from '../data/quizWords';

import {
  tierLabel,
  type CategoryQuizProgress,
  type MasteryTier,
} from '../services/quizEngine';

import QuizScreen from './QuizScreen';

type Props = {
  uid: string;
  onReturnHome: () => void;
};

type Category = {
  id: 'numbers' | 'food' | 'animals' | 'winter';
  title: string;
  icon: string;
  unlockLevel: number;
  enabled: boolean;
};

const CATEGORIES: Category[] = [
  {
    id: 'numbers',
    title: 'Numbers',
    icon: '🔢',
    unlockLevel: 1,
    enabled: true,
  },
  {
    id: 'food',
    title: 'Food',
    icon: '🍲',
    unlockLevel: 1,
    enabled: true,
  },
  {
    id: 'animals',
    title: 'Animals',
    icon: '🐻',
    unlockLevel: 1,
    enabled: false,
  },
  {
    id: 'winter',
    title: 'Winter',
    icon: '❄️',
    unlockLevel: 6,
    enabled: false,
  },
];

const TIER_COLORS: Record<
  MasteryTier,
  {background: string; color: string}
> = {
  new: {
    background: '#F3E6FF',
    color: '#7F1AC2',
  },
  learning: {
    background: '#E5F1FF',
    color: '#035BAD',
  },
  known: {
    background: '#E4F5DF',
    color: '#168600',
  },
};

export default function LearningScreen({
  uid,
  onReturnHome,
}: Props) {
  const [xp, setXp] = useState(0);

  const [progress, setProgress] = useState<
    Record<string, CategoryQuizProgress>
  >({});

  const [category, setCategory] =
    useState<QuizCategoryId | null>(null);

  const [mode, setMode] =
    useState<'view' | 'quiz' | null>(null);

  // LOAD LEARNING PROGRESS
  useEffect(() => {
    const reference = doc(getFirestore(), 'users', uid);

    const unsubscribe = onSnapshot(
      reference,
      snapshot => {
        const data = snapshot.data();

        setXp(
          typeof data?.game?.xp === 'number'
            ? data.game.xp
            : 0,
        );

        setProgress(data?.quizProgress ?? {});
      },
      error => {
        console.log(
          'Learning data error:',
          error.message,
        );
      },
    );

    return unsubscribe;
  }, [uid]);

  const currentLevel = getLevel(xp).level;

  // RETURN TO PREVIOUS SCREEN
  const goBack = () => {
    if (mode === 'quiz' || mode === 'view') {
      setCategory(null);
      setMode(null);
    } else {
      onReturnHome();
    }
  };

  // OPEN CATEGORY
  const enter = (
    item: Category,
    nextMode: 'view' | 'quiz',
  ) => {
    if (currentLevel < item.unlockLevel) {
      Alert.alert(
        'Locked',
        `Reach level ${item.unlockLevel} first.`,
      );
      return;
    }

    if (!item.enabled) {
      Alert.alert(
        'Coming Soon',
        'This category is not ready yet.',
      );
      return;
    }

    setCategory(item.id as QuizCategoryId);
    setMode(nextMode);
  };

  const getTier = (
    cat: QuizCategoryId,
    wordId: string,
  ): MasteryTier => {
    return (
      progress[cat]?.words?.[wordId]?.tier ?? 'new'
    );
  };

  // OPEN THE QUIZ SCREEN
  if (category && mode === 'quiz') {
    return (
      <QuizScreen
        uid={uid}
        categoryId={category}
        onExit={goBack}
      />
    );
  }

  return (
    <View style={styles.screen}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={goBack}>
          <Text style={styles.backText}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {category
            ? category === 'food'
              ? 'Food'
              : 'Numbers'
            : 'Learning'}
        </Text>
      </View>

      {/* VOCABULARY SCREEN */}
      {category && mode === 'view' ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>

          <Text style={styles.intro}>
            Learn and practise your Ojibwe words.
          </Text>

          {QUIZ_WORDS[category].map(word => {
            const tier = getTier(category, word.id);

            return (
              <View
                key={word.id}
                style={styles.wordCard}>

                <Text style={styles.ojibwe}>
                  {word.word_ojibwe}
                </Text>

                <Text style={styles.english}>
                  {word.word_english}
                </Text>

                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        TIER_COLORS[tier].background,
                    },
                  ]}>

                  <Text
                    style={[
                      styles.badgeText,
                      {color: TIER_COLORS[tier].color},
                    ]}>
                    {tierLabel(tier)}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : (

        // LEARNING CATEGORIES
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>

          <Text style={styles.intro}>
            Choose a category to learn with Esiban.
          </Text>

          {CATEGORIES.map(item => {
            const unlocked =
              item.enabled &&
              currentLevel >= item.unlockLevel;

            const valid =
              item.id === 'numbers' ||
              item.id === 'food';

            const vocab = valid
              ? QUIZ_WORDS[item.id as QuizCategoryId]
              : [];

            const counts: Record<MasteryTier, number> = {
              new: 0,
              learning: 0,
              known: 0,
            };

            if (valid) {
              vocab.forEach(word => {
                const tier = getTier(
                  item.id as QuizCategoryId,
                  word.id,
                );

                counts[tier] += 1;
              });
            }

            return (
              <View
                key={item.id}
                style={styles.categoryCard}>

                {/* CATEGORY HEADING */}
                <View style={styles.categoryHeading}>
                  <Text style={styles.categoryIcon}>
                    {item.icon}
                  </Text>

                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryTitle}>
                      {item.title}
                    </Text>

                    <Text style={styles.subtitle}>
                      {unlocked
                        ? `${vocab.length} Ojibwe words`
                        : currentLevel < item.unlockLevel
                        ? `Unlocks at level ${item.unlockLevel}`
                        : 'Coming soon'}
                    </Text>
                  </View>

                  <Text style={styles.categoryStatus}>
                    {unlocked ? 'Available' : 'Locked'}
                  </Text>
                </View>

                {unlocked && (
                  <>
                    {/* WORD MASTERY COUNTS */}
                    <View style={styles.countRow}>
                      {(
                        [
                          'new',
                          'learning',
                          'known',
                        ] as MasteryTier[]
                      ).map(tier => (
                        <View
                          key={tier}
                          style={[
                            styles.countChip,
                            {
                              backgroundColor:
                                TIER_COLORS[tier].background,
                            },
                          ]}>

                          <Text
                            style={[
                              styles.countText,
                              {
                                color:
                                  TIER_COLORS[tier].color,
                              },
                            ]}>
                            {tierLabel(tier)} {counts[tier]}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* PLAY AND VIEW BUTTONS */}
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.playButton}
                        onPress={() =>
                          enter(item, 'quiz')
                        }>
                        <Text style={styles.playText}>
                          ▶ Play
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.viewButton}
                        onPress={() =>
                          enter(item, 'view')
                        }>
                        <Text style={styles.viewText}>
                          📖 View
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFBEF',
  },

  // HEADER
  header: {
    height: 52,
    backgroundColor: '#035643',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  back: {
    width: 34,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 29,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // MAIN SCROLL AREA
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 16,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: '#554E43',
    marginBottom: 11,
  },

  // LEARNING CATEGORY CARDS
  categoryCard: {
    backgroundColor: '#FFFBF0',
    borderWidth: 1,
    borderColor: '#E5DAC8',
    borderRadius: 11,
    padding: 12,
    marginBottom: 11,
  },
  categoryHeading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 27,
    marginRight: 10,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#035643',
  },
  subtitle: {
    fontSize: 13,
    color: '#554E43',
    marginTop: 3,
  },
  categoryStatus: {
    fontSize: 11,
    color: '#08797A',
    fontWeight: 'bold',
  },

  // LEARNING PROGRESS CHIPS
  countRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 11,
  },
  countChip: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 6,
  },
  countText: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  // CATEGORY ACTION BUTTONS
  actions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 11,
  },
  playButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#089BA1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  viewButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#089BA1',
    backgroundColor: '#FFFBEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewText: {
    fontSize: 15,
    color: '#035643',
    fontWeight: 'bold',
  },

  // VOCABULARY CARDS
  wordCard: {
    padding: 13,
    backgroundColor: '#FFFBF0',
    borderWidth: 1,
    borderColor: '#E5DAC8',
    borderRadius: 10,
    marginBottom: 9,
  },
  ojibwe: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#035643',
  },
  english: {
    fontSize: 14,
    color: '#484139',
    marginTop: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 7,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
