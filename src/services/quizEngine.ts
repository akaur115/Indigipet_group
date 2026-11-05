
import {
  QUIZ_WORDS,
  type QuizCategoryId,
  type QuizWord,
} from '../data/quizWords';

export const QUESTIONS_PER_SESSION = 7;
export const DAILY_NEW_WORD_CAP = 5;

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

export function emptyProgress():
  CategoryQuizProgress {
  return {
    words: {},
    gamesPlayed: 0,
  };
}

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

// CHOOSE NEW AND REVIEW WORDS
export function sessionPool(
  category: QuizCategoryId,
  progress: CategoryQuizProgress,
  now: number,
): QuizWord[] {
  const vocabulary = QUIZ_WORDS[category];
  const today = localDay(now);

  const introducedToday = Object.values(
    progress.words,
  ).filter(
    item => item.introducedOn === today,
  ).length;

  const newRemaining = Math.max(
    0,
    DAILY_NEW_WORD_CAP - introducedToday,
  );

  const due = vocabulary.filter(w => {
    const memory = progress.words[w.id];

    return (
      memory &&
      memory.nextReviewAt <= now
    );
  });

  const fresh = vocabulary
    .filter(w => !progress.words[w.id])
    .slice(0, newRemaining);

  const otherSeen = vocabulary.filter(
    w =>
      Boolean(progress.words[w.id]) &&
      !due.some(d => d.id === w.id),
  );

  return [
    ...due,
    ...fresh,
    ...otherSeen,
  ];
}

// CHOOSE THE NEXT WORD
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

  const candidates = pool.filter(
    w => w.id !== lastWordId,
  );

  const list = candidates.length
    ? candidates
    : pool;

  const history = (id: string) =>
    answers.filter(
      answer => answer.wordId === id,
    );

  // INCORRECT WORDS RETURN SOONER
  const needsRetry = list.filter(w => {
    const h = history(w.id);

    return (
      h.length > 0 &&
      !h[h.length - 1].correct
    );
  });

  if (needsRetry.length) {
    return needsRetry[0];
  }

  // ASK WORDS NOT YET USED IN THIS ROUND
  const unseenInRound = list.find(
    w => history(w.id).length === 0,
  );

  if (unseenInRound) {
    return unseenInRound;
  }

  // REPEAT THE LEAST PRACTICED WORD
  return [...list].sort(
    (a, b) =>
      history(a.id).length -
      history(b.id).length,
  )[0];
}

// SHUFFLE ANSWER OPTIONS
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

// FOUR MULTIPLE-CHOICE ANSWERS
export function answerOptions(
  word: QuizWord,
): QuizWord[] {
  const vocabulary =
    QUIZ_WORDS[word.category];

  const distractors = shuffle(
    vocabulary.filter(
      w => w.id !== word.id,
    ),
  ).slice(0, 3);

  return shuffle([
    word,
    ...distractors,
  ]);
}

// UPDATE WORD LEARNING PROGRESS
export function recordAnswer(
  progress: CategoryQuizProgress,
  wordId: string,
  correct: boolean,
  now: number,
): CategoryQuizProgress {
  const before = progress.words[wordId];

  const streak = correct
    ? (before?.streak ?? 0) + 1
    : 0;

  const tier: MasteryTier =
    streak >= 5
      ? 'known'
      : streak >= 2
        ? 'learning'
        : 'new';

  const minute = 60_000;
  const day = 24 * 60 * minute;

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

// XP, COINS AND FRIENDSHIP
export function calculateRewards(
  correctAnswers: number,
) {
  if (
    !Number.isInteger(correctAnswers) ||
    correctAnswers < 0 ||
    correctAnswers > 7
  ) {
    throw new Error(
      'Quiz score must be between 0 and 7.',
    );
  }

  return {
    xp: correctAnswers * 10,

    coins:
      correctAnswers * 3 +
      (correctAnswers === 7 ? 4 : 0),

    friendship: 30,
  };
}

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
