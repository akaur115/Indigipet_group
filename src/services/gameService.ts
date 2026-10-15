import {
  getFirestore,
  doc,
  runTransaction,
  onSnapshot,
} from '@react-native-firebase/firestore';

const db = getFirestore();
const userRef = (uid: string) => doc(db, 'users', uid);

export type GameData = {
  xp: number;
  coins: number;
  hunger: number;
  friendship: number;
  hungerUpdatedAt: number;
  friendshipUpdatedAt: number;
};

export type CurrentStats = {
  hunger: number;
  friendship: number;
};

const clamp = (value: number) =>
  Math.max(0, Math.min(100, value));

const freshGame = (): GameData => ({
  xp: 0,
  coins: 0,
  hunger: 100,
  friendship: 100,
  hungerUpdatedAt: Date.now(),
  friendshipUpdatedAt: Date.now(),
});

const readGame = (value: unknown): GameData => {
  const fallback = freshGame();

  if (!value || typeof value !== 'object') {
    return fallback;
  }

  const saved = value as Partial<GameData>;

  const num = (v: unknown, defaultValue: number) =>
    typeof v === 'number' && Number.isFinite(v)
      ? v
      : defaultValue;

  return {
    xp: Math.max(0, num(saved.xp, 0)),
    coins: Math.max(0, num(saved.coins, 0)),
    hunger: clamp(num(saved.hunger, 100)),
    friendship: clamp(num(saved.friendship, 100)),
    hungerUpdatedAt: num(
      saved.hungerUpdatedAt,
      fallback.hungerUpdatedAt,
    ),
    friendshipUpdatedAt: num(
      saved.friendshipUpdatedAt,
      fallback.friendshipUpdatedAt,
    ),
  };
};

// Approximate client playtest decay:
// Hunger ~30% after 12 hours, 0% after 36 hours
// Friendship ~30% after 6 hours, 0% after 24 hours
const lossSince = (
  updatedAt: number,
  lowAfterHours: number,
  emptyAfterHours: number,
  now: number,
) => {
  const hours = Math.max(
    0,
    (now - updatedAt) / 3600000,
  );

  if (hours <= lowAfterHours) {
    return (hours / lowAfterHours) * 70;
  }

  const extra = Math.min(
    1,
    (hours - lowAfterHours) /
      (emptyAfterHours - lowAfterHours),
  );

  return 70 + extra * 30;
};

export const getCurrentStats = (
  saved: GameData,
  now = Date.now(),
): CurrentStats => ({
  hunger: Math.round(
    clamp(
      saved.hunger -
        lossSince(saved.hungerUpdatedAt, 12, 36, now),
    ),
  ),

  friendship: Math.round(
    clamp(
      saved.friendship -
        lossSince(
          saved.friendshipUpdatedAt,
          6,
          24,
          now,
        ),
    ),
  ),
});

// Level 1 starts at 0 XP.
// Level 2 requires 100 XP.
// Subsequent level requirements multiply by 1.25.
export const getLevel = (totalXp: number) => {
  let level = 1;
  let xpIntoLevel = Math.max(0, totalXp);
  let xpForNext = 100;

  while (
    xpIntoLevel >= xpForNext &&
    level < 1000
  ) {
    xpIntoLevel -= xpForNext;
    level += 1;
    xpForNext = Math.ceil(xpForNext * 1.25);
  }

  return {
    level,
    xpIntoLevel,
    xpForNext,
  };
};

// Pet speech from client's game design document
const happyLines = [
  'I never go hungry when you’re around!',
  'You take such good care of me.',
  'You’re my favourite friend!',
];

const hungryLines = [
  'My tummy’s rumbling... got anything to eat?',
  'I could really go for a snack right now.',
];

const lonelyLines = [
  'I missed you. Want to play for a bit?',
  'It’s been quiet around here without you.',
];

export const getPetSpeech = (
  stats: CurrentStats,
  rotation = 0,
) => {
  if (
    stats.hunger <= 30 &&
    stats.friendship <= 30
  ) {
    return (
      'I missed you, and I’m a little hungry too. ' +
      'Can we hang out?'
    );
  }

  if (stats.hunger <= 30) {
    return hungryLines[
      rotation % hungryLines.length
    ];
  }

  if (stats.friendship <= 30) {
    return lonelyLines[
      rotation % lonelyLines.length
    ];
  }

  return happyLines[
    rotation % happyLines.length
  ];
};

// Initialize game fields once per account.
// Does not reset progress on later logins.
export const ensureGameData = async (
  uid: string,
) => {
  await runTransaction(db, async transaction => {
    const reference = userRef(uid);
    const snapshot = await transaction.get(reference);

    const user = snapshot.data();

    if (!user?.game) {
      transaction.set(
        reference,
        {game: freshGame()},
        {merge: true},
      );
    }
  });
};

// Listen to saved game data
export const subscribeGameData = (
  uid: string,
  onChange: (game: GameData) => void,
  onError: (error: Error) => void,
) =>
  onSnapshot(
    userRef(uid),

    snapshot => {
      const data = snapshot.data();

      if (data?.game) {
        onChange(readGame(data.game));
      }
    },

    onError,
  );

// Feeding items
export type FoodItem = {
  id: 'cookie' | 'corn' | 'rice';
  name: string;
  emoji: string;
  cost: number;
  hungerRestore: number;
};

export const FOODS: FoodItem[] = [
  {
    id: 'cookie',
    name: 'Cookie',
    emoji: '🍪',
    cost: 10,
    hungerRestore: 25,
  },
  {
    id: 'corn',
    name: 'Corn',
    emoji: '🌽',
    cost: 25,
    hungerRestore: 60,
  },
  {
    id: 'rice',
    name: 'Rice',
    emoji: '🍚',
    cost: 40,
    hungerRestore: 100,
  },
];

// Feed Esiban and save the changes
export const feedPet = async (
  uid: string,
  food: FoodItem,
) => {
  await runTransaction(db, async transaction => {
    const reference = userRef(uid);
    const snapshot = await transaction.get(reference);

    const current = readGame(
      snapshot.data()?.game,
    );

    const now = Date.now();

    if (current.coins < food.cost) {
      throw new Error(
        'Not enough coins. Complete lessons to earn more!',
      );
    }

    const hungerNow = getCurrentStats(
      current,
      now,
    ).hunger;

    const updated: GameData = {
      ...current,
      coins: current.coins - food.cost,
      hunger: clamp(
        hungerNow + food.hungerRestore,
      ),
      hungerUpdatedAt: now,
    };

    transaction.set(
      reference,
      {game: updated},
      {merge: true},
    );
  });
};

// Give rewards after completing a lesson/game
export const completeGameSession = async (
  uid: string,
  correctAnswers: number,
  totalQuestions = 7,
) => {
  const count = Math.min(
    7,
    Math.max(0, Math.floor(correctAnswers)),
  );

  const perfect =
    count === 7 && totalQuestions === 7;

  await runTransaction(db, async transaction => {
    const reference = userRef(uid);
    const snapshot = await transaction.get(reference);

    const current = readGame(
      snapshot.data()?.game,
    );

    const now = Date.now();

    const friendshipNow = getCurrentStats(
      current,
      now,
    ).friendship;

    const updated: GameData = {
      ...current,
      xp: current.xp + count * 10,
      coins:
        current.coins +
        count * 3 +
        (perfect ? 4 : 0),
      friendship: clamp(friendshipNow + 30),
      friendshipUpdatedAt: now,
    };

    transaction.set(
      reference,
      {game: updated},
      {merge: true},
    );
  });
};