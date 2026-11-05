
import {
  doc,
  getDoc,
  getFirestore,
  runTransaction,
} from '@react-native-firebase/firestore';

import type {
  QuizCategoryId,
} from '../data/quizWords';

import {
  calculateRewards,
  emptyProgress,
  type CategoryQuizProgress,
  type WordMastery,
} from './quizEngine';

import {
  getCurrentStats,
  type GameData,
} from './gameService';

// READ SAVED QUIZ PROGRESS
function normalizeProgress(
  value: unknown,
): CategoryQuizProgress {
  if (!value || typeof value !== 'object') {
    return emptyProgress();
  }

  const raw =
    value as Partial<CategoryQuizProgress>;

  const words =
    raw.words && typeof raw.words === 'object'
      ? raw.words
      : {};

  return {
    words: words as Record<string, WordMastery>,
    gamesPlayed:
      typeof raw.gamesPlayed === 'number'
        ? raw.gamesPlayed
        : 0,
    lastSessionId:
      typeof raw.lastSessionId === 'string'
        ? raw.lastSessionId
        : undefined,
    completedSessionIds:
      Array.isArray(raw.completedSessionIds)
        ? raw.completedSessionIds.filter(
            (id): id is string =>
              typeof id === 'string',
          )
        : [],
  };
}

// READ EXISTING GAME VALUES
function normalizeGame(
  value: unknown,
  now: number,
): GameData {
  const raw =
    value && typeof value === 'object'
      ? (value as Partial<GameData>)
      : {};

  const numberOr = (
    num: unknown,
    fallback: number,
  ): number =>
    typeof num === 'number' &&
    Number.isFinite(num)
      ? num
      : fallback;

  const clamp = (num: number): number =>
    Math.min(100, Math.max(0, num));

  return {
    xp: Math.max(0, numberOr(raw.xp, 0)),
    coins: Math.max(0, numberOr(raw.coins, 0)),
    hunger: clamp(numberOr(raw.hunger, 100)),
    friendship: clamp(
      numberOr(raw.friendship, 100),
    ),
    hungerUpdatedAt: numberOr(
      raw.hungerUpdatedAt,
      now,
    ),
    friendshipUpdatedAt: numberOr(
      raw.friendshipUpdatedAt,
      now,
    ),
  };
}

// LOAD QUIZ PROGRESS
export async function loadQuizProgress(
  uid: string,
  category: QuizCategoryId,
): Promise<CategoryQuizProgress> {
  const db = getFirestore();
  const userRef = doc(db, 'users', uid);

  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    throw new Error(
      'Your Firebase account record was not found.',
    );
  }

  return normalizeProgress(
    snapshot.data()?.quizProgress?.[category],
  );
}

// SAVE QUIZ REWARDS AND WORD PROGRESS
export async function completeQuizAndSave(
  uid: string,
  category: QuizCategoryId,
  sessionId: string,
  updated: CategoryQuizProgress,
  correctAnswers: number,
): Promise<{alreadySaved: boolean}> {
  const rewards =
    calculateRewards(correctAnswers);

  const db = getFirestore();
  const userRef = doc(db, 'users', uid);

  return runTransaction(
    db,
    async transaction => {
      const snapshot =
        await transaction.get(userRef);

      if (!snapshot.exists()) {
        throw new Error(
          'Your Firebase account record was not found.',
        );
      }

      const data = snapshot.data();

      const currentProgress =
        normalizeProgress(
          data?.quizProgress?.[category],
        );

      // STOP DOUBLE REWARDS FOR SAME SESSION
      if (
        currentProgress.lastSessionId ===
          sessionId ||
        currentProgress.completedSessionIds
          ?.includes(sessionId)
      ) {
        return {alreadySaved: true};
      }

      const now = Date.now();

      const game = normalizeGame(
        data?.game,
        now,
      );

      const friendshipNow =
        getCurrentStats(game, now).friendship;

      const words = {
        ...currentProgress.words,
        ...updated.words,
      };

      const known = Object.values(
        words,
      ).filter(
        word => word.tier === 'known',
      ).length;

      const learning = Object.values(
        words,
      ).filter(
        word => word.tier === 'learning',
      ).length;

      transaction.update(userRef, {
        'game.xp':
          game.xp + rewards.xp,

        'game.coins':
          game.coins + rewards.coins,

        'game.friendship':
          Math.min(
            100,
            friendshipNow + rewards.friendship,
          ),

        'game.friendshipUpdatedAt': now,

        ['quizProgress.' + category]: {
          words,
          gamesPlayed:
            currentProgress.gamesPlayed + 1,
          lastSessionId: sessionId,
          completedSessionIds: [
            ...(currentProgress
              .completedSessionIds ?? []),
            sessionId,
          ].slice(-50),
        },

        ['learningProgress.' + category]: {
          known,
          learning,
        },

        // NEW: TELL HOME A QUIZ JUST FINISHED
        lastQuizEvent: {
          sessionId,
          category,
          at: now,
        },
      });

      return {alreadySaved: false};
    },
  );
}
