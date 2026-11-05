
import {
  QUIZ_WORDS,
  type QuizCategoryId,
  type QuizWord,
} from '../data/quizWords';

// CLIENT QUIZ REQUIREMENTS
export const QUESTIONS_PER_SESSION = 7;
export const DAILY_NEW_WORD_CAP = 5;

// WORD MASTERY LEVELS
export type MasteryTier =
  | 'new'
  | 'learning'
  | 'known';

export type WordMastery = {
  tier: MasteryTier;
  streak: number;
  attempts: number;
  correctAnswers: number;
  introducedOn: string;
  nextReviewAt: number;
};

export type CategoryQuizProgress = {
  words: Record<string, WordMastery>;
  gamesPlayed: number;
  lastSessionId?: string;
  completedSessionIds?: string[];
};

export type AnswerEvent = {
  wordId: string;
  correct: boolean;
};

// EMPTY PROGRESS FOR NEW USERS
export function emptyProgress():
  CategoryQuizProgress {
  return {
    words: {},
    gamesPlayed: 0,
  };
}

// GET CURRENT DATE
export function localDay(
  timestamp: number,
): string {
  const d = new Date(timestamp);

  return (
    String(d.getFullYear()) +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

// SELECT WORDS AVAILABLE FOR THE QUIZ
export function sessionPool(
  category: QuizCategoryId,
  progress: CategoryQuizProgress,
  now: number,
): QuizWord[] {
  const vocabulary = QUIZ_WORDS[category];

  const today = localDay(now);

  // COUNT HOW MANY NEW WORDS
  // WERE INTRODUCED TODAY
  const introducedToday = vocabulary.filter(
    word =>
      progress.words[word.id]?.introducedOn ===
      today,
  ).length;

  // MAXIMUM FIVE NEW WORDS PER DAY
  const newRemaining = Math.max(
    0,
    DAILY_NEW_WORD_CAP - introducedToday,
  );

  // WORDS READY FOR REVIEW
  const due = vocabulary.filter(word => {
    const memory = progress.words[word.id];

    return (
      memory !== undefined &&
      memory.nextReviewAt <= now
    );
  });

  // NEW WORDS NOT PRACTICED BEFORE
  const fresh = vocabulary
    .filter(
      word => !progress.words[word.id],
    )
    .slice(0, newRemaining);

  // WORDS ALREADY LEARNED
  // BUT NOT CURRENTLY DUE
  const otherSeen = vocabulary.filter(
    word =>
      Boolean(progress.words[word.id]) &&
      !due.some(
        dueWord =>
          dueWord.id === word.id,
      ),
  );

  // COMBINE REVIEW AND NEW WORDS
  return [
    ...due,
    ...fresh,
    ...otherSeen,
  ];
}

// SELECT THE NEXT QUIZ QUESTION
// FIXED TO PREVENT EXCESSIVE REPETITION
export function pickQuestionWord(
  pool: QuizWord[],
  answers: AnswerEvent[],
  lastWordId: string | null,
): QuizWord {
  if (pool.length === 0) {
    throw new Error(
      'No quiz words are available.',
    );
  }

  // AVOID THE SAME WORD TWICE IN A ROW
  const candidates = pool.filter(
    word =>
      word.id !== lastWordId,
  );

  const available =
    candidates.length > 0
      ? candidates
      : pool;

  // GET PREVIOUS ANSWERS FOR A WORD
  const history = (wordId: string) =>
    answers.filter(
      answer =>
        answer.wordId === wordId,
    );

  // FIND WORDS NOT ASKED THIS SESSION
  const unseen = available.filter(
    word =>
      history(word.id).length === 0,
  );

  // FIND WORDS THAT NEED MORE PRACTICE
  const incorrect = available.filter(
    word => {
      const previous = history(word.id);

      if (previous.length === 0) {
        return false;
      }

      return !previous[
        previous.length - 1
      ].correct;
    },
  );

  // NUMBER OF QUESTIONS LEFT
  const remaining =
    QUESTIONS_PER_SESSION -
    answers.length;

  // SHOW UNSEEN WORDS BEFORE
  // RUNNING OUT OF QUESTION SLOTS
  if (
    unseen.length > 0 &&
    remaining <= unseen.length
  ) {
    return unseen[0];
  }

  // RETRY AN INCORRECTLY ANSWERED WORD
  if (incorrect.length > 0) {
    const sorted = [...incorrect].sort(
      (a, b) =>
        history(a.id).length -
        history(b.id).length,
    );

    return sorted[0];
  }

  // INTRODUCE A WORD NOT YET ASKED
  if (unseen.length > 0) {
    return unseen[0];
  }

  // ALL AVAILABLE WORDS WERE ASKED
  // REPEAT THE LEAST PRACTICED ONE
  const sorted = [...available].sort(
    (a, b) =>
      history(a.id).length -
      history(b.id).length,
  );

  return sorted[0];
}

// SHUFFLE THE ANSWER OPTIONS
export function shuffle<T>(
  items: readonly T[],
): T[] {
  const result = [...items];

  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {
    const j = Math.floor(
      Math.random() * (i + 1),
    );

    [result[i], result[j]] = [
      result[j],
      result[i],
    ];
  }

  return result;
}

// GENERATE FOUR MULTIPLE-CHOICE OPTIONS
export function answerOptions(
  word: QuizWord,
): QuizWord[] {
  const vocabulary =
    QUIZ_WORDS[word.category];

  // PICK THREE INCORRECT ANSWERS
  const distractors = shuffle(
    vocabulary.filter(
      item =>
        item.id !== word.id,
    ),
  ).slice(0, 3);

  // INCLUDE ONE CORRECT ANSWER
  return shuffle([
    word,
    ...distractors,
  ]);
}

// UPDATE LEARNING PROGRESS
// AFTER EACH ANSWER
export function recordAnswer(
  progress: CategoryQuizProgress,
  wordId: string,
  correct: boolean,
  now: number,
): CategoryQuizProgress {
  const before =
    progress.words[wordId];

  // CORRECT ANSWERS IN A ROW
  const streak = correct
    ? (before?.streak ?? 0) + 1
    : 0;

  // MASTERY TIERS
  const tier: MasteryTier =
    streak >= 5
      ? 'known'
      : streak >= 2
        ? 'learning'
        : 'new';

  const minute = 60_000;
  const day = 24 * 60 * minute;

  // SPACED REPETITION REVIEW TIME
  const reviewDelay = !correct
    ? 0
    : streak === 1
      ? 5 * minute
      : streak === 2
        ? day
        : streak < 5
          ? 3 * day
          : 7 * day;

  return {
    ...progress,

    words: {
      ...progress.words,

      [wordId]: {
        tier,
        streak,

        attempts:
          (before?.attempts ?? 0) + 1,

        correctAnswers:
          (before?.correctAnswers ?? 0) +
          (correct ? 1 : 0),

        introducedOn:
          before?.introducedOn ??
          localDay(now),

        nextReviewAt:
          now + reviewDelay,
      },
    },
  };
}

// CALCULATE REWARDS
// BASED ON CLIENT REQUIREMENTS
export function calculateRewards(
  correctAnswers: number,
) {
  if (
    !Number.isInteger(correctAnswers) ||
    correctAnswers < 0 ||
    correctAnswers > QUESTIONS_PER_SESSION
  ) {
    throw new Error(
      'Quiz score must be between 0 and 7.',
    );
  }

  const xp =
    correctAnswers * 10;

  const coins =
    correctAnswers * 3 +
    (correctAnswers === 7 ? 4 : 0);

  return {
    xp,
    coins,
    friendship: 30,
  };
}

// DISPLAY THE WORD MASTERY LEVEL
export function tierLabel(
  tier: MasteryTier,
): string {
  if (tier === 'learning') {
    return 'Practicing';
  }

  if (tier === 'known') {
    return 'Known';
  }

  return 'New';
}
