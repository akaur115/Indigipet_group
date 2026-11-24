
import React, {useEffect, useRef, useState} from 'react';

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Svg, {Path} from 'react-native-svg';

import {
  doc,
  getFirestore,
  onSnapshot,
} from '@react-native-firebase/firestore';

import {getLevel} from '../services/gameService';

import {
  QUIZ_WORDS,
  type QuizCategoryId,
  type QuizWord,
} from '../data/quizWords';

import {
  tierLabel,
  type CategoryQuizProgress,
  type MasteryTier,
} from '../services/quizEngine';

import {
  playWordAudio,
  stopWordAudio,
} from '../services/audioService';

import QuizScreen from './QuizScreen';

import PlayIcon from '../../assets/icons/play-icon.svg';
import ReadingIcon from '../../assets/icons/reading-icon.svg';

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

const COLORS = {
  green: '#035643',
  audioGreen: '#087D69',
  audioPressed: '#023B30',
  cream: '#FFFBEF',
  brown: '#484139',
  border: '#E5DAC8',
};

// CLEAR WHITE SPEAKER SYMBOL
function SpeakerIcon() {
  return (
    <Svg
      width={25}
      height={25}
      viewBox="0 0 24 24"
      fill="none">

      <Path
        d="M11 5L6 9H3V15H6L11 19V5Z"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Path
        d="M15.5 8.5C17.2 10.4 17.2 13.6 15.5 15.5"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
      />

      <Path
        d="M18.5 5.5C22 9 22 15 18.5 18.5"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

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

  const [playingId, setPlayingId] =
    useState<string | null>(null);

  const audioRequest = useRef(0);

  // LOAD FIREBASE PROGRESS
  useEffect(() => {
    const reference = doc(
      getFirestore(),
      'users',
      uid,
    );

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

  // RELEASE AUDIO
  useEffect(() => {
    return () => {
      audioRequest.current += 1;
      stopWordAudio();
    };
  }, []);

  const currentLevel = getLevel(xp).level;

  const stopAudio = () => {
    audioRequest.current += 1;
    stopWordAudio();
    setPlayingId(null);
  };

  const goBack = () => {
    stopAudio();

    if (mode === 'quiz' || mode === 'view') {
      setCategory(null);
      setMode(null);
    } else {
      onReturnHome();
    }
  };

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

    stopAudio();
    setCategory(item.id as QuizCategoryId);
    setMode(nextMode);
  };

  const getTier = (
    cat: QuizCategoryId,
    wordId: string,
  ): MasteryTier => {
    return (
      progress[cat]?.words?.[wordId]?.tier ??
      'new'
    );
  };

  // AUDIO PLAYBACK
  const handlePlayAudio = async (
    word: QuizWord,
  ) => {
    if (playingId === word.id) {
      stopAudio();
      return;
    }

    stopAudio();

    if (!word.audio_file_path) {
      Alert.alert(
        'Audio unavailable',
        'There is no recording for this word yet.',
      );
      return;
    }

    const request = ++audioRequest.current;

    setPlayingId(word.id);

    try {
      await playWordAudio(word);
    } catch (error: any) {
      if (request === audioRequest.current) {
        Alert.alert(
          'Audio Error',
          error?.message ||
            'Could not play the recording.',
        );
      }
    } finally {
      if (request === audioRequest.current) {
        setPlayingId(null);
      }
    }
  };

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

      {/* VOCABULARY VIEW */}
      {category && mode === 'view' ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>

          <Text style={styles.intro}>
            Learn Ojibwe words and listen to
            their pronunciation.
          </Text>

          {QUIZ_WORDS[category].map(word => {
            const tier = getTier(
              category,
              word.id,
            );

            const isPlaying =
              playingId === word.id;

            return (
              <View
                key={word.id}
                style={styles.wordCard}>

                <View style={styles.wordRow}>

                  <View style={styles.wordInfo}>
                    <Text style={styles.ojibwe}>
                      {word.word_ojibwe}
                    </Text>

                    <Text style={styles.english}>
                      {word.word_english}
                    </Text>
                  </View>

                  {/* NEW DARK GREEN SOUND BUTTON */}
                  <Pressable
                    style={({pressed}) => [
                      styles.audioButton,
                      (pressed || isPlaying) &&
                        styles.audioButtonActive,
                    ]}
                    onPress={() =>
                      void handlePlayAudio(word)
                    }
                    accessibilityRole="button"
                    accessibilityLabel={
                      `Play pronunciation of ${word.word_ojibwe}`
                    }>

                    <SpeakerIcon />

                  </Pressable>
                </View>

                {/* MASTERY BADGE */}
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
                      {
                        color:
                          TIER_COLORS[tier].color,
                      },
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
              ? QUIZ_WORDS[
                  item.id as QuizCategoryId
                ]
              : [];

            const counts: Record<
              MasteryTier,
              number
            > = {
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
                        : currentLevel <
                            item.unlockLevel
                          ? `Unlocks at level ${item.unlockLevel}`
                          : 'Coming soon'}
                    </Text>
                  </View>

                  <Text style={styles.categoryStatus}>
                    {unlocked
                      ? 'Available'
                      : 'Locked'}
                  </Text>
                </View>

                {unlocked && (
                  <>
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
                            {tierLabel(tier)}{' '}
                            {counts[tier]}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.playButton}
                        onPress={() =>
                          enter(item, 'quiz')
                        }>

                        <View style={styles.playIconHolder}>
                          <PlayIcon
                            width={13}
                            height={16}
                          />
                        </View>

                        <Text style={styles.playText}>
                          Play
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.viewButton}
                        onPress={() =>
                          enter(item, 'view')
                        }>

                        <ReadingIcon
                          width={19}
                          height={19}
                        />

                        <Text style={styles.viewText}>
                          View
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
    backgroundColor: COLORS.cream,
  },
  header: {
    height: 52,
    backgroundColor: COLORS.green,
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

  categoryCard: {
    backgroundColor: '#FFFBF0',
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: COLORS.green,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playIconHolder: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: COLORS.cream,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewText: {
    fontSize: 15,
    color: COLORS.green,
    fontWeight: 'bold',
  },

  wordCard: {
    padding: 13,
    backgroundColor: '#FFFBF0',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    marginBottom: 9,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  wordInfo: {
    flex: 1,
  },
  ojibwe: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.green,
  },
  english: {
    fontSize: 14,
    color: COLORS.brown,
    marginTop: 4,
  },

  // UPDATED SOUND BUTTON
  audioButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.audioGreen,
    borderWidth: 1,
    borderColor: '#056C59',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioButtonActive: {
    backgroundColor: COLORS.audioPressed,
    borderColor: '#012E25',
  },

  badge: {
    alignSelf: 'flex-start',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
