
import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  type DimensionValue,
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
} from '../services/quizEngine';

import {
  completeQuizAndSave,
  loadQuizProgress,
} from '../services/quizService';

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

// CREATE A UNIQUE SESSION ID
function uniqueId(): string {
  return (
    String(Date.now()) +
    '-' +
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

  const [
    startingProgress,
    setStartingProgress,
  ] = useState<CategoryQuizProgress>(
    emptyProgress(),
  );

  const [
    draftProgress,
    setDraftProgress,
  ] = useState<CategoryQuizProgress>(
    emptyProgress(),
  );

  const [saveState, setSaveState] =
    useState<SaveState>('idle');

  const [saveError, setSaveError] =
    useState('');

  const savingLock = useRef(false);

  const sessionId = useRef(uniqueId());

  // LOAD FIREBASE LEARNING PROGRESS
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
        const progress =
          await loadQuizProgress(
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
            'Not enough words for four answer options.',
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
        if (!active) {
          return;
        }

        setLoadError(
          error?.message ||
            'Could not load learning progress.',
        );

        setPhase('error');
      }
    };

    void begin();

    return () => {
      active = false;
    };
  }, [uid, categoryId, retryNumber]);

  // CURRENT SCORE
  const score = answers.filter(
    answer => answer.correct,
  ).length;

  const rewards =
    calculateRewards(score);

  const answeredThisQuestion =
    selectedId !== null;

  const isCurrentCorrect = Boolean(
    current &&
    selectedId === current.id,
  );

  // USER SELECTS AN ANSWER
  const chooseAnswer = (id: string) => {
    if (
      !current ||
      selectedId !== null ||
      phase !== 'playing'
    ) {
      return;
    }

    const correct =
      id === current.id;

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

  // SAVE COMPLETED QUIZ TO FIREBASE
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
          'Could not save your quiz.',
      );

      setSaveState('error');

    } finally {
      savingLock.current = false;
    }
  };

  // NEXT QUESTION OR RESULTS
  const nextQuestion = () => {
    if (
      !answeredThisQuestion ||
      !current ||
      phase !== 'playing'
    ) {
      return;
    }

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

  // LEAVE QUIZ
  const back = () => {
    if (
      phase === 'results' &&
      saveState !== 'saved'
    ) {
      Alert.alert(
        'Save Incomplete',
        'Please save your quiz progress before leaving.',
      );
      return;
    }

    if (phase !== 'playing') {
      onExit();
      return;
    }

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
          onPress: onExit,
        },
      ],
    );
  };

  // PLAY AGAIN
  const restart = () => {
    setRetryNumber(value => value + 1);
  };

  // WORDS TO DISPLAY ON RESULTS PAGE
  const wordResults =
    QUIZ_WORDS[categoryId].filter(
      w =>
        answers.some(
          a => a.wordId === w.id,
        ),
    );

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* DARK GREEN HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={back}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Back to Learning">

          <Text style={styles.backText}>
            ‹
          </Text>
        </TouchableOpacity>

        <View style={{flex: 1}}>
          <Text style={styles.headerTitle}>
            {QUIZ_CATEGORY_NAMES[categoryId]}
          </Text>

          <Text style={styles.headerSub}>
            Ojibwe learning game
          </Text>
        </View>

        {phase === 'playing' && (
          <Text style={styles.counter}>
            {Math.min(
              answers.length +
                (selectedId ? 0 : 1),
              7,
            )}{' / 7'}
          </Text>
        )}
      </View>

      {/* LOADING */}
      {phase === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#089BA1"
          />

          <Text style={styles.small}>
            Loading your learning progress...
          </Text>
        </View>
      )}

      {/* LOAD ERROR */}
      {phase === 'error' && (
        <View style={styles.center}>
          <Text style={styles.title}>
            Could not start quiz
          </Text>

          <Text style={styles.paragraph}>
            {loadError}
          </Text>

          <TouchableOpacity
            style={styles.primary}
            onPress={restart}>

            <Text style={styles.primaryText}>
              Try Again
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineButton}
            onPress={onExit}>

            <Text style={styles.outlineText}>
              Back to Learning
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* QUIZ QUESTIONS */}
      {phase === 'playing' && current && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}>

          {/* PROGRESS BAR */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: (
                    (
                      (answers.length / 7) *
                      100
                    ) + '%'
                  ) as DimensionValue,
                },
              ]}
            />
          </View>

          <Text style={styles.eyebrow}>
            QUESTION{' '}
            {Math.min(
              answers.length +
                (selectedId ? 0 : 1),
              7,
            )}{' OF 7'}
          </Text>

          <Text style={styles.title}>
            Choose the Ojibwe word for:
          </Text>

          {/* ENGLISH QUESTION */}
          <View style={styles.promptCard}>
            <Text style={styles.prompt}>
              {current.word_english}
            </Text>

            <Text style={styles.audioNote}>
              Text mode
              {' · '}
              Audio will be added when
              recordings are approved
            </Text>
          </View>

          {/* FOUR ANSWERS */}
          <View style={styles.answers}>
            {options.map(
              (option, index) => {
                const isCorrectOption =
                  option.id === current.id;

                const isSelected =
                  option.id === selectedId;

                const showCorrect =
                  answeredThisQuestion &&
                  isCorrectOption;

                const showWrong =
                  answeredThisQuestion &&
                  isSelected &&
                  !isCorrectOption;

                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() =>
                      chooseAnswer(option.id)
                    }
                    disabled={answeredThisQuestion}
                    accessibilityRole="button"
                    style={[
                      styles.answer,
                      showCorrect &&
                        styles.correctAnswer,
                      showWrong &&
                        styles.wrongAnswer,
                    ]}>

                    <Text
                      style={styles.optionLetter}>

                      {
                        ['A', 'B', 'C', 'D'][
                          index
                        ]
                      }
                    </Text>

                    <Text style={styles.answerText}>
                      {option.word_ojibwe}
                    </Text>

                    {showCorrect && (
                      <Text
                        style={styles.answerMark}>
                        ✓
                      </Text>
                    )}

                    {showWrong && (
                      <Text
                        style={styles.answerMark}>
                        ✕
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              },
            )}
          </View>

          {/* CORRECT/INCORRECT FEEDBACK */}
          {answeredThisQuestion && (
            <View
              style={[
                styles.feedback,

                isCurrentCorrect
                  ? styles.feedbackGood
                  : styles.feedbackBad,
              ]}>

              <Text style={styles.feedbackTitle}>
                {isCurrentCorrect
                  ? 'Great job!'
                  : 'Keep practicing!'}
              </Text>

              <Text style={styles.feedbackText}>
                {current.word_ojibwe}
                {' = '}
                {current.word_english}
              </Text>
            </View>
          )}

          {/* NEXT BUTTON */}
          <TouchableOpacity
            style={[
              styles.next,

              !answeredThisQuestion &&
                styles.disabled,
            ]}
            disabled={!answeredThisQuestion}
            onPress={nextQuestion}>

            <Text style={styles.nextText}>
              {answers.length === 7
                ? 'See Results'
                : 'Next Question  →'}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      )}

      {/* RESULTS PAGE */}
      {phase === 'results' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}>

          <Text style={styles.eyebrow}>
            SESSION COMPLETE
          </Text>

          <Text style={styles.title}>
            You spent time learning
            with Esiban!
          </Text>

          {/* SCORE */}
          <View style={styles.scoreCard}>
            <Text style={styles.scoreBig}>
              {score} / 7
            </Text>

            <Text style={styles.scoreLabel}>
              Correct answers
            </Text>
          </View>

          {/* XP, COINS, FRIENDSHIP */}
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

          {/* WORD MASTERY */}
          <Text style={styles.sectionHeading}>
            Words Practiced
          </Text>

          {wordResults.map(word => (
            <View
              style={styles.wordRow}
              key={word.id}>

              <Text style={styles.wordTitle}>
                {word.word_ojibwe}
                {' = '}
                {word.word_english}
              </Text>

              <Text style={styles.mastery}>
                {tierLabel(
                  startingProgress.words[
                    word.id
                  ]?.tier ?? 'new',
                )}
                {' → '}
                {tierLabel(
                  draftProgress.words[
                    word.id
                  ]?.tier ?? 'new',
                )}
              </Text>
            </View>
          ))}

          {/* FIREBASE SAVE STATUS */}
          {saveState === 'saving' && (
            <Text style={styles.small}>
              Saving rewards and progress
              to Firebase...
            </Text>
          )}

          {saveState === 'saved' && (
            <Text style={styles.savedText}>
              ✓ Progress saved successfully
            </Text>
          )}

          {saveState === 'error' && (
            <View style={styles.feedbackBad}>
              <Text style={styles.feedbackTitle}>
                Save not complete
              </Text>

              <Text style={styles.paragraph}>
                {saveError}
              </Text>

              <TouchableOpacity
                style={styles.next}
                onPress={() =>
                  void saveFinishedQuiz(
                    answers,
                    draftProgress,
                  )
                }>

                <Text style={styles.nextText}>
                  Retry Save
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* PLAY AGAIN */}
          <TouchableOpacity
            style={[
              styles.primary,
              saveState !== 'saved' &&
                styles.disabled,
            ]}
            disabled={saveState !== 'saved'}
            onPress={restart}>

            <Text style={styles.primaryText}>
              Play Again
            </Text>
          </TouchableOpacity>

          {/* BACK TO LEARNING */}
          <TouchableOpacity
            style={[
              styles.outlineButton,
              saveState !== 'saved' &&
                styles.disabled,
            ]}
            disabled={saveState !== 'saved'}
            onPress={onExit}>

            <Text style={styles.outlineText}>
              Back to Learning
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFBEF',
  },

  header: {
    minHeight: 80,
    backgroundColor: '#035643',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  back: {
    width: 38,
    paddingVertical: 8,
  },

  backText: {
    fontSize: 35,
    color: '#FFFBEF',
  },

  headerTitle: {
    fontSize: 23,
    color: '#FFFBEF',
    fontWeight: 'bold',
  },

  headerSub: {
    fontSize: 12,
    color: '#D8ECE5',
    marginTop: 2,
  },

  counter: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFBEF',
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    padding: 26,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },

  small: {
    fontSize: 13,
    color: '#6E6151',
    marginVertical: 12,
    textAlign: 'center',
  },

  progressTrack: {
    height: 10,
    borderRadius: 10,
    backgroundColor: '#F3E9CF',
    overflow: 'hidden',
    marginBottom: 16,
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#EC6E00',
  },

  eyebrow: {
    fontSize: 13,
    color: '#08797A',
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 12,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#035643',
    lineHeight: 31,
    marginBottom: 12,
  },

  paragraph: {
    fontSize: 15,
    color: '#292521',
    lineHeight: 22,
    textAlign: 'center',
  },

  promptCard: {
    borderWidth: 1,
    borderColor: '#E3DACB',
    borderRadius: 15,
    padding: 18,
    backgroundColor: '#FFFBF0',
    alignItems: 'center',
    marginBottom: 18,
  },

  prompt: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#035643',
    marginBottom: 10,
    textAlign: 'center',
  },

  audioNote: {
    color: '#6E6151',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },

  answers: {
    gap: 11,
  },

  answer: {
    backgroundColor: '#089BA1',
    borderRadius: 10,
    minHeight: 57,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 3,
    borderBottomColor: '#08797A',
  },

  correctAnswer: {
    backgroundColor: '#168600',
    borderBottomColor: '#126500',
  },

  wrongAnswer: {
    backgroundColor: '#B23F38',
    borderBottomColor: '#922A26',
  },

  optionLetter: {
    width: 30,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },

  answerText: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },

  answerMark: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },

  feedback: {
    marginTop: 17,
    borderRadius: 10,
    padding: 13,
  },

  feedbackGood: {
    backgroundColor: '#E8F6DF',
  },

  feedbackBad: {
    backgroundColor: '#FBE7E5',
    borderRadius: 10,
    padding: 13,
    marginTop: 17,
  },

  feedbackTitle: {
    color: '#292521',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  feedbackText: {
    fontSize: 15,
    color: '#292521',
  },

  next: {
    backgroundColor: '#EC6E00',
    borderRadius: 10,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 19,
  },

  nextText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  primary: {
    backgroundColor: '#089BA1',
    borderRadius: 10,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    alignSelf: 'stretch',
  },

  primaryText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  outlineButton: {
    borderColor: '#089BA1',
    borderWidth: 2,
    borderRadius: 10,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    alignSelf: 'stretch',
  },

  outlineText: {
    color: '#035643',
    fontWeight: 'bold',
    fontSize: 16,
  },

  disabled: {
    opacity: 0.45,
  },

  scoreCard: {
    backgroundColor: '#035643',
    padding: 25,
    alignItems: 'center',
    borderRadius: 14,
    marginVertical: 10,
  },

  scoreBig: {
    fontSize: 43,
    color: '#FFFBEF',
    fontWeight: 'bold',
  },

  scoreLabel: {
    fontSize: 16,
    color: '#FFFBEF',
  },

  rewardRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 13,
    marginBottom: 22,
  },

  rewardCard: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E3DACB',
    borderRadius: 10,
    backgroundColor: '#FFFBF0',
    paddingVertical: 14,
  },

  rewardBig: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#035643',
  },

  rewardLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#6E6151',
  },

  sectionHeading: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#035643',
    marginBottom: 9,
  },

  wordRow: {
    padding: 12,
    borderColor: '#E3DACB',
    borderWidth: 1,
    backgroundColor: '#FFFBF0',
    borderRadius: 9,
    marginBottom: 7,
  },

  wordTitle: {
    fontSize: 15,
    color: '#292521',
    fontWeight: '600',
  },

  mastery: {
    fontSize: 13,
    color: '#0372DA',
    marginTop: 5,
  },

  savedText: {
    color: '#168600',
    fontWeight: 'bold',
    fontSize: 15,
    marginVertical: 12,
    textAlign: 'center',
  },
});
