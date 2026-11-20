
import React, {useEffect, useRef, useState} from 'react';

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type DimensionValue,
} from 'react-native';

import {
  QUIZ_CATEGORY_NAMES,
  QUIZ_WORDS,
  type QuizCategoryId,
  type QuizWord,
} from '../data/quizWords';

import {
  answerOptions,
  calculateRewards,
  emptyProgress,
  pickQuestionWord,
  QUESTIONS_PER_SESSION,
  recordAnswer,
  sessionPool,
  tierLabel,
  type AnswerEvent,
  type CategoryQuizProgress,
  type MasteryTier,
} from '../services/quizEngine';

import {
  completeQuizAndSave,
  loadQuizProgress,
} from '../services/quizService';

import {
  playWordAudio,
  stopWordAudio,
} from '../services/audioService';

// SVG VOLUME ICON
import VolumeIcon from '../../assets/icons/volume-icon.svg';

type Props = {
  uid: string;
  categoryId: QuizCategoryId;
  onExit: () => void;
};

type Phase =
  | 'loading'
  | 'playing'
  | 'results'
  | 'error';

type SaveState =
  | 'idle'
  | 'saving'
  | 'saved'
  | 'error';

const COLORS = {
  green: '#035643',
  teal: '#089BA1',
  cream: '#FFFBEF',
  card: '#FFFBF0',
  border: '#E3DACB',
  brown: '#554E43',
  orange: '#EC6E00',
};

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

function uniqueId(): string {
  return (
    `${Date.now()}-` +
    Math.random().toString(36).slice(2, 12)
  );
}

export default function QuizScreen({
  uid,
  categoryId,
  onExit,
}: Props) {
  const [phase, setPhase] =
    useState<Phase>('loading');

  const [loadError, setLoadError] =
    useState('');

  const [retryNumber, setRetryNumber] =
    useState(0);

  const [pool, setPool] =
    useState<QuizWord[]>([]);

  const [current, setCurrent] =
    useState<QuizWord | null>(null);

  const [options, setOptions] =
    useState<QuizWord[]>([]);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [answers, setAnswers] =
    useState<AnswerEvent[]>([]);

  const [startingProgress, setStartingProgress] =
    useState<CategoryQuizProgress>(
      emptyProgress(),
    );

  const [draftProgress, setDraftProgress] =
    useState<CategoryQuizProgress>(
      emptyProgress(),
    );

  const [saveState, setSaveState] =
    useState<SaveState>('idle');

  const [saveError, setSaveError] =
    useState('');

  const [playingAudio, setPlayingAudio] =
    useState(false);

  const savingLock = useRef(false);
  const sessionId = useRef(uniqueId());
  const audioRequest = useRef(0);

  // LOAD QUIZ FROM FIREBASE
  useEffect(() => {
    let active = true;

    const begin = async () => {
      setPhase('loading');
      setLoadError('');
      setAnswers([]);
      setSelectedId(null);
      setSaveState('idle');
      setSaveError('');

      savingLock.current = false;
      sessionId.current = uniqueId();

      try {
        const progress = await loadQuizProgress(
          uid,
          categoryId,
        );

        const nextPool = sessionPool(
          categoryId,
          progress,
          Date.now(),
        );

        if (nextPool.length < 4) {
          throw new Error(
            'Not enough words for this quiz.',
          );
        }

        const first = pickQuestionWord(
          nextPool,
          [],
          null,
        );

        if (!active) {
          return;
        }

        setStartingProgress(progress);
        setDraftProgress(progress);
        setPool(nextPool);
        setCurrent(first);
        setOptions(answerOptions(first));
        setPhase('playing');
      } catch (error: any) {
        if (active) {
          setLoadError(
            error?.message ||
              'Could not load quiz.',
          );

          setPhase('error');
        }
      }
    };

    void begin();

    return () => {
      active = false;
    };
  }, [uid, categoryId, retryNumber]);

  // STOP AUDIO WHEN QUIZ CLOSES
  useEffect(() => {
    return () => {
      audioRequest.current += 1;
      stopWordAudio();
    };
  }, []);

  const stopAudio = () => {
    audioRequest.current += 1;
    stopWordAudio();
    setPlayingAudio(false);
  };

  // PLAY WORD AUDIO
  const handleAudio = async () => {
    if (
      !current ||
      !current.audio_file_path
    ) {
      Alert.alert(
        'Audio unavailable',
        'This word does not have a recording yet.',
      );
      return;
    }

    if (playingAudio) {
      stopAudio();
      return;
    }

    const request = ++audioRequest.current;

    setPlayingAudio(true);

    try {
      await playWordAudio(current);
    } catch (error: any) {
      if (request === audioRequest.current) {
        Alert.alert(
          'Audio Error',
          error?.message ||
            'Could not play recording.',
        );
      }
    } finally {
      if (request === audioRequest.current) {
        setPlayingAudio(false);
      }
    }
  };

  // CALCULATE SCORE
  const score = answers.filter(
    answer => answer.correct,
  ).length;

  const rewards = calculateRewards(score);

  const answered =
    selectedId !== null;

  const isCorrect = Boolean(
    current &&
    selectedId === current.id,
  );

  const questionNumber = Math.min(
    answers.length + (answered ? 0 : 1),
    QUESTIONS_PER_SESSION,
  );

  // CHOOSE ANSWER
  const chooseAnswer = (id: string) => {
    if (
      !current ||
      answered ||
      phase !== 'playing'
    ) {
      return;
    }

    const correct = id === current.id;

    setSelectedId(id);

    setAnswers(previous => [
      ...previous,
      {
        wordId: current.id,
        correct,
      },
    ]);

    setDraftProgress(previous =>
      recordAnswer(
        previous,
        current.id,
        correct,
        Date.now(),
      ),
    );
  };

  // SAVE QUIZ RESULTS
  const saveFinishedQuiz = async (
    finalAnswers: AnswerEvent[],
    finalProgress: CategoryQuizProgress,
  ) => {
    if (savingLock.current) {
      return;
    }

    savingLock.current = true;
    setSaveState('saving');
    setSaveError('');

    const correct = finalAnswers.filter(
      answer => answer.correct,
    ).length;

    try {
      await completeQuizAndSave(
        uid,
        categoryId,
        sessionId.current,
        finalProgress,
        correct,
      );

      setSaveState('saved');
    } catch (error: any) {
      setSaveError(
        error?.message ||
          'Could not save progress.',
      );

      setSaveState('error');
    } finally {
      savingLock.current = false;
    }
  };

  // NEXT QUESTION
  const nextQuestion = () => {
    if (
      !answered ||
      !current ||
      phase !== 'playing'
    ) {
      return;
    }

    stopAudio();

    if (
      answers.length ===
      QUESTIONS_PER_SESSION
    ) {
      setPhase('results');

      void saveFinishedQuiz(
        answers,
        draftProgress,
      );

      return;
    }

    const next = pickQuestionWord(
      pool,
      answers,
      current.id,
    );

    setCurrent(next);
    setOptions(answerOptions(next));
    setSelectedId(null);
  };

  // GO BACK
  const goBack = () => {
    if (
      phase === 'results' &&
      saveState !== 'saved'
    ) {
      Alert.alert(
        'Save incomplete',
        'Please save your progress before leaving.',
      );
      return;
    }

    if (phase === 'playing') {
      Alert.alert(
        'Leave Quiz?',
        'Your unfinished answers will not be saved.',
        [
          {
            text: 'Stay',
            style: 'cancel',
          },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              stopAudio();
              onExit();
            },
          },
        ],
      );

      return;
    }

    stopAudio();
    onExit();
  };

  // PLAY AGAIN
  const restart = () => {
    stopAudio();
    setRetryNumber(value => value + 1);
  };

  const wordResults = QUIZ_WORDS[
    categoryId
  ].filter(word =>
    answers.some(
      answer => answer.wordId === word.id,
    ),
  );

  return (
    <View style={styles.screen}>

      {/* QUIZ HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={goBack}>
          <Text style={styles.backText}>
            ‹
          </Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {QUIZ_CATEGORY_NAMES[categoryId]}
          </Text>

          <Text style={styles.headerSub}>
            Ojibwe learning game
          </Text>
        </View>

        {phase === 'playing' && (
          <Text style={styles.counter}>
            {questionNumber} /{' '}
            {QUESTIONS_PER_SESSION}
          </Text>
        )}
      </View>

      {/* LOADING */}
      {phase === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={COLORS.teal}
          />

          <Text style={styles.info}>
            Loading quiz...
          </Text>
        </View>
      )}

      {/* ERROR SCREEN */}
      {phase === 'error' && (
        <View style={styles.center}>
          <Text style={styles.sectionHeading}>
            Could not start quiz
          </Text>

          <Text style={styles.info}>
            {loadError}
          </Text>

          <TouchableOpacity
            style={styles.primary}
            onPress={restart}>
            <Text style={styles.buttonText}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* QUESTION SCREEN */}
      {phase === 'playing' && current && (
        <ScrollView
          style={styles.playScroll}
          contentContainerStyle={styles.playArea}
          showsVerticalScrollIndicator={false}>

          {/* PROGRESS */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    (
                      answers.length /
                      QUESTIONS_PER_SESSION
                    ) * 100
                  }%` as DimensionValue,
                },
              ]}
            />
          </View>

          <Text style={styles.eyebrow}>
            QUESTION {questionNumber} OF{' '}
            {QUESTIONS_PER_SESSION}
          </Text>

          <Text style={styles.questionTitle}>
            Choose the Ojibwe word for:
          </Text>

          {/* WORD AND SPEAKER */}
          <View style={styles.promptCard}>
            <Text style={styles.prompt}>
              {current.word_english}
            </Text>

            <TouchableOpacity
              style={[
                styles.audioButton,
                playingAudio &&
                  styles.audioButtonActive,
              ]}
              onPress={() =>
                void handleAudio()
              }
              accessibilityRole="button"
              accessibilityLabel="Play Ojibwe pronunciation">

              <VolumeIcon
                width={20}
                height={18}
              />

              <Text style={styles.audioButtonText}>
                {playingAudio
                  ? 'Stop audio'
                  : 'Listen'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ANSWER OPTIONS */}
          <View style={styles.answers}>
            {options.map((option, index) => {
              const showCorrect =
                answered &&
                option.id === current.id;

              const showWrong =
                answered &&
                selectedId === option.id &&
                option.id !== current.id;

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.answer,
                    showCorrect &&
                      styles.correctAnswer,
                    showWrong &&
                      styles.wrongAnswer,
                  ]}
                  disabled={answered}
                  onPress={() =>
                    chooseAnswer(option.id)
                  }>

                  <Text style={styles.optionLetter}>
                    {['A', 'B', 'C', 'D'][index]}
                  </Text>

                  <Text style={styles.answerText}>
                    {option.word_ojibwe}
                  </Text>

                  {showCorrect && (
                    <Text style={styles.answerMark}>
                      ✓
                    </Text>
                  )}

                  {showWrong && (
                    <Text style={styles.answerMark}>
                      ✕
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ANSWER FEEDBACK */}
          <View
            style={[
              styles.feedback,
              answered
                ? isCorrect
                  ? styles.feedbackGood
                  : styles.feedbackBad
                : styles.feedbackIdle,
            ]}>

            {answered ? (
              <>
                <Text style={styles.feedbackTitle}>
                  {isCorrect
                    ? 'Great job!'
                    : 'Keep practicing!'}
                </Text>

                <Text style={styles.feedbackText}>
                  {current.word_ojibwe}
                  {' = '}
                  {current.word_english}
                </Text>
              </>
            ) : (
              <Text style={styles.feedbackHint}>
                Select one answer to continue.
              </Text>
            )}
          </View>

          {/* NEXT BUTTON */}
          <TouchableOpacity
            style={[
              styles.next,
              !answered &&
                styles.disabled,
            ]}
            disabled={!answered}
            onPress={nextQuestion}>

            <Text style={styles.buttonText}>
              {answers.length ===
              QUESTIONS_PER_SESSION
                ? 'See Results'
                : 'Next Question →'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* RESULTS SCREEN */}
      {phase === 'results' && (
        <ScrollView
          style={styles.resultsScroll}
          contentContainerStyle={
            styles.resultsContent
          }
          showsVerticalScrollIndicator={false}>

          {/* SCORE */}
          <View style={styles.scoreCard}>
            <View>
              <Text style={styles.scoreBig}>
                {score} /{' '}
                {QUESTIONS_PER_SESSION}
              </Text>

              <Text style={styles.scoreLabel}>
                Correct answers
              </Text>
            </View>

            <View style={styles.scoreRight}>
              <Text style={styles.completeLabel}>
                SESSION COMPLETE
              </Text>

              <Text style={styles.completeText}>
                Great learning with Esiban!
              </Text>
            </View>
          </View>

          {/* REWARDS */}
          <View style={styles.rewardRow}>
            <View style={styles.rewardCard}>
              <Text style={styles.rewardBig}>
                +{rewards.xp}
              </Text>
              <Text style={styles.rewardLabel}>
                XP
              </Text>
            </View>

            <View style={styles.rewardCard}>
              <Text style={styles.rewardBig}>
                +{rewards.coins}
              </Text>
              <Text style={styles.rewardLabel}>
                Coins
              </Text>
            </View>

            <View style={styles.rewardCard}>
              <Text style={styles.rewardBig}>
                +{rewards.friendship}%
              </Text>
              <Text style={styles.rewardLabel}>
                Friendship
              </Text>
            </View>
          </View>

          <Text style={styles.sectionHeading}>
            Words practiced
          </Text>

          {/* BIGGER WORD CARDS */}
          <View style={styles.wordGrid}>
            {wordResults.map(word => {
              const before: MasteryTier =
                startingProgress.words[
                  word.id
                ]?.tier ?? 'new';

              const after: MasteryTier =
                draftProgress.words[
                  word.id
                ]?.tier ?? 'new';

              return (
                <View
                  key={word.id}
                  style={styles.wordCard}>

                  <Text style={styles.wordTitle}>
                    {word.word_ojibwe}
                  </Text>

                  <Text style={styles.wordEnglish}>
                    {word.word_english}
                  </Text>

                  <View style={styles.masteryRow}>
                    <View
                      style={[
                        styles.tierBadge,
                        {
                          backgroundColor:
                            TIER_COLORS[before]
                              .background,
                        },
                      ]}>

                      <Text
                        style={[
                          styles.tierText,
                          {
                            color:
                              TIER_COLORS[before]
                                .color,
                          },
                        ]}>
                        {tierLabel(before)}
                      </Text>
                    </View>

                    <Text style={styles.tierArrow}>
                      →
                    </Text>

                    <View
                      style={[
                        styles.tierBadge,
                        {
                          backgroundColor:
                            TIER_COLORS[after]
                              .background,
                        },
                      ]}>

                      <Text
                        style={[
                          styles.tierText,
                          {
                            color:
                              TIER_COLORS[after]
                                .color,
                          },
                        ]}>
                        {tierLabel(after)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* SAVE PROGRESS */}
          <View style={styles.saveArea}>
            {saveState === 'saving' && (
              <Text style={styles.info}>
                Saving progress...
              </Text>
            )}

            {saveState === 'saved' && (
              <Text style={styles.savedText}>
                ✓ Progress saved successfully
              </Text>
            )}

            {saveState === 'error' && (
              <>
                <Text style={styles.errorText}>
                  {saveError}
                </Text>

                <TouchableOpacity
                  style={styles.primary}
                  onPress={() =>
                    void saveFinishedQuiz(
                      answers,
                      draftProgress,
                    )
                  }>

                  <Text style={styles.buttonText}>
                    Retry Save
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* RESULT ACTIONS */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.primary,
                styles.actionHalf,
                saveState !== 'saved' &&
                  styles.disabled,
              ]}
              disabled={saveState !== 'saved'}
              onPress={restart}>

              <Text style={styles.buttonText}>
                Play Again
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.outlineButton,
                styles.actionHalf,
                saveState !== 'saved' &&
                  styles.disabled,
              ]}
              disabled={saveState !== 'saved'}
              onPress={onExit}>

              <Text style={styles.outlineText}>
                Back to Learning
              </Text>
            </TouchableOpacity>
          </View>
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

  // HEADER
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
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 11,
    color: '#D8ECE5',
  },
  counter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // LOADING
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  info: {
    fontSize: 13,
    color: COLORS.brown,
    textAlign: 'center',
  },

  // QUESTION SCREEN
  playScroll: {
    flex: 1,
  },
  playArea: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  progressTrack: {
    height: 7,
    backgroundColor: '#F3E9CF',
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 9,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.orange,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    color: '#08797A',
    marginBottom: 5,
  },
  questionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.green,
    marginBottom: 9,
  },

  // QUESTION WORD AND SPEAKER
  promptCard: {
    minHeight: 100,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  prompt: {
    fontSize: 25,
    fontWeight: 'bold',
    color: COLORS.green,
    textAlign: 'center',
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DFEFE7',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 7,
    marginTop: 9,
    gap: 7,
    minHeight: 36,
  },
  audioButtonActive: {
    backgroundColor: '#A5DDD4',
  },
  audioButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.green,
  },

  // ANSWER BUTTONS
  answers: {
    gap: 10,
    marginTop: 13,
    marginBottom: 11,
  },
  answer: {
    minHeight: 47,
    borderRadius: 9,
    backgroundColor: COLORS.teal,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  correctAnswer: {
    backgroundColor: '#168600',
  },
  wrongAnswer: {
    backgroundColor: '#B23F38',
  },
  optionLetter: {
    width: 29,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  answerText: {
    flex: 1,
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  answerMark: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 5,
  },

  // FEEDBACK
  feedback: {
    minHeight: 49,
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 7,
    justifyContent: 'center',
  },
  feedbackIdle: {
    backgroundColor: '#F5F0E7',
  },
  feedbackGood: {
    backgroundColor: '#E8F6DF',
  },
  feedbackBad: {
    backgroundColor: '#FBE7E5',
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#292521',
  },
  feedbackText: {
    fontSize: 13,
    color: '#292521',
    marginTop: 2,
  },
  feedbackHint: {
    fontSize: 13,
    color: COLORS.brown,
    textAlign: 'center',
  },
  next: {
    height: 44,
    backgroundColor: COLORS.orange,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 9,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.45,
  },

  // RESULTS SCREEN
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    flexGrow: 1,
    paddingHorizontal: 11,
    paddingTop: 9,
    paddingBottom: 11,
  },
  scoreCard: {
    minHeight: 68,
    backgroundColor: COLORS.green,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreBig: {
    fontSize: 30,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: COLORS.cream,
    marginTop: 2,
  },
  scoreRight: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  completeLabel: {
    fontSize: 11,
    color: '#C8EDE0',
    fontWeight: 'bold',
  },
  completeText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#FFFFFF',
    textAlign: 'right',
    marginTop: 3,
  },

  // REWARDS
  rewardRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 8,
    marginBottom: 11,
  },
  rewardCard: {
    flex: 1,
    minHeight: 57,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  rewardBig: {
    fontSize: 19,
    fontWeight: 'bold',
    color: COLORS.green,
  },
  rewardLabel: {
    fontSize: 12,
    color: COLORS.brown,
    marginTop: 3,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.green,
    marginBottom: 9,
  },

  // WORDS PRACTICED
  wordGrid: {
    flexGrow: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'stretch',
    columnGap: 7,
    rowGap: 8,
  },
  wordCard: {
    width: '48.5%',
    minHeight: 84,
    paddingHorizontal: 9,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
  },
  wordTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: 'bold',
    color: '#292521',
  },
  wordEnglish: {
    fontSize: 13,
    color: COLORS.brown,
    marginTop: 3,
  },
  masteryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  tierBadge: {
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 4,
  },
  tierText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  tierArrow: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.brown,
  },

  // FIREBASE SAVE STATUS
  saveArea: {
    minHeight: 29,
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  savedText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#168600',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#B23F38',
    textAlign: 'center',
  },

  // RESULT BUTTONS
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionHalf: {
    flex: 1,
  },
  primary: {
    minHeight: 44,
    backgroundColor: COLORS.teal,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    paddingVertical: 8,
  },
  outlineButton: {
    minHeight: 44,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.teal,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    paddingVertical: 8,
  },
  outlineText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.green,
    textAlign: 'center',
  },
});