
import React, {useEffect, useState} from 'react';

import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type DimensionValue,
  type ImageSourcePropType,
} from 'react-native';

import {
  doc,
  getFirestore,
  onSnapshot,
} from '@react-native-firebase/firestore';

import {
  ensureGameData,
  feedPet,
  FOODS,
  getCurrentStats,
  getLevel,
  getPetSpeech,
  subscribeGameData,
  type GameData,
} from '../services/gameService';

import CoinIcon from '../../assets/icons/coin-icon.svg';

type Props = {
  uid: string;
};

type Food = (typeof FOODS)[number];

const COLORS = {
  cream: '#FFFBEF',
  green: '#035643',
  card: '#FFFBF0',
  brown: '#484139',
  orange: '#EC6E00',
  gold: '#FFAE33',
  track: '#F3E9CF',
  border: '#E5DAC8',
};

const FOOD_IMAGES: Record<string, ImageSourcePropType> = {
  cookie: require('../../assets/images/cookie.png'),
  corn: require('../../assets/images/corn.png'),
  rice: require('../../assets/images/rice.png'),
};

const FOOD_SPEECH: Record<string, string> = {
  cookie: 'Yummy! Thank you for the cookie!',
  corn: 'That corn was delicious! Thank you!',
  rice: "My tummy is full! You're the best!",
};

function ProgressBar({value}: {value: number}) {
  const safe = Math.max(
    0,
    Math.min(100, Number(value) || 0),
  );

  return (
    <View style={styles.barTrack}>
      <View
        style={[
          styles.barFill,
          {
            width: `${safe}%` as DimensionValue,
          },
        ]}
      />
    </View>
  );
}

function CoinAmount({
  amount,
  small = false,
}: {
  amount: number;
  small?: boolean;
}) {
  return (
    <View style={styles.coinRow}>
      <CoinIcon
        width={small ? 15 : 20}
        height={small ? 18 : 22}
      />

      <Text
        style={
          small
            ? styles.foodCost
            : styles.coins
        }>
        {amount}
      </Text>
    </View>
  );
}

export default function HomeScreen({uid}: Props) {
  const [game, setGame] =
    useState<GameData | null>(null);

  const [now, setNow] = useState(Date.now());
  const [errorText, setErrorText] = useState('');
  const [feeding, setFeeding] = useState(false);

  const [dialogueNumber, setDialogueNumber] =
    useState(0);

  const [feedSpeech, setFeedSpeech] =
    useState<string | null>(null);

  const [lastQuizAt, setLastQuizAt] =
    useState(0);

  // LOAD AND SUBSCRIBE TO GAME DATA
  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    ensureGameData(uid)
      .then(() => {
        if (!active) {
          return;
        }

        unsubscribe = subscribeGameData(
          uid,
          saved => {
            if (!active) {
              return;
            }

            setGame(saved);
            setErrorText('');
            setNow(Date.now());
          },
          error => {
            if (active) {
              setErrorText(error.message);
            }
          },
        );
      })
      .catch((error: any) => {
        if (active) {
          setErrorText(
            error?.message ||
              'Unable to load Esiban.',
          );
        }
      });

    // REFRESH HUNGER AND FRIENDSHIP
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 5000);

    const subscription = AppState.addEventListener(
      'change',
      state => {
        if (state === 'active') {
          setNow(Date.now());
        }
      },
    );

    return () => {
      active = false;
      unsubscribe();
      clearInterval(timer);
      subscription.remove();
    };
  }, [uid]);

  // RECENT QUIZ SPEECH
  useEffect(() => {
    const reference = doc(
      getFirestore(),
      'users',
      uid,
    );

    const unsubscribe = onSnapshot(
      reference,
      snapshot => {
        const event =
          snapshot.data()?.lastQuizEvent;

        setLastQuizAt(
          typeof event?.at === 'number'
            ? event.at
            : 0,
        );
      },
      error => {
        console.log(
          'Quiz speech error:',
          error.message,
        );
      },
    );

    return unsubscribe;
  }, [uid]);

  // CLEAR TEMPORARY FOOD SPEECH
  useEffect(() => {
    if (!feedSpeech) {
      return;
    }

    const timer = setTimeout(() => {
      setFeedSpeech(null);
    }, 12000);

    return () => clearTimeout(timer);
  }, [feedSpeech]);

  // FEED ESIBAN
  const handleFeed = async (item: Food) => {
    if (!game || feeding) {
      return;
    }

    setFeeding(true);

    try {
      await feedPet(uid, item);

      setFeedSpeech(
        FOOD_SPEECH[item.id] ||
          'Thank you for feeding me!',
      );

      setNow(Date.now());
    } catch (error: any) {
      Alert.alert(
        'Cannot feed Esiban',
        error?.message || 'Please try again.',
      );
    } finally {
      setFeeding(false);
    }
  };

  // ERROR STATE
  if (errorText) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          Unable to load pet data
        </Text>

        <Text style={styles.helper}>
          {errorText}
        </Text>
      </View>
    );
  }

  // LOADING STATE
  if (!game) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={COLORS.green}
        />

        <Text style={styles.helper}>
          Loading Esiban...
        </Text>
      </View>
    );
  }

  const stats = getCurrentStats(game, now);
  const level = getLevel(game.xp);

  const recentQuiz =
    lastQuizAt > 0 &&
    now >= lastQuizAt &&
    now - lastQuizAt < 45000;

  const speech =
    feedSpeech ||
    (recentQuiz
      ? "I loved learning with you! Let's play again soon!"
      : getPetSpeech(stats, dialogueNumber));

  const xpPercentage = Math.max(
    0,
    Math.min(
      100,
      (level.xpIntoLevel /
        Math.max(1, level.xpForNext)) *
        100,
    ),
  );

  return (
    <View style={styles.container}>
      <View style={styles.page}>

        {/* XP HEADER */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.brand}>
                IndigiPet
              </Text>

              <Text style={styles.headerSmall}>
                XP · Level {level.level}
              </Text>
            </View>

            <CoinAmount amount={game.coins} />
          </View>

          <View style={styles.xpTrack}>
            <View
              style={[
                styles.xpFill,
                {
                  width:
                    `${xpPercentage}%` as DimensionValue,
                },
              ]}
            />
          </View>

          <Text style={styles.xpLabel}>
            {level.xpIntoLevel} /{' '}
            {level.xpForNext} XP to next level
          </Text>
        </View>

        {/* PET MESSAGE */}
        <TouchableOpacity
          style={styles.speechBubble}
          onPress={() =>
            setDialogueNumber(value => value + 1)
          }>
          <Text style={styles.speechText}>
            {speech}
          </Text>

          <View style={styles.speechPointer} />
        </TouchableOpacity>

        {/* ORIGINAL RACCOON PICTURE */}
        <View style={styles.scene}>
          <View style={styles.ground} />

          <Image
            source={require('../../assets/images/esiban.png')}
            style={styles.petImage}
            resizeMode="contain"
          />
        </View>

        {/* FOOD CARDS */}
        <View style={styles.foodRow}>
          {FOODS.map(item => {
            const cannotAfford =
              game.coins < item.cost;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.foodCard,
                  cannotAfford &&
                    styles.disabled,
                ]}
                disabled={
                  feeding || cannotAfford
                }
                onPress={() =>
                  void handleFeed(item)
                }>

                <Image
                  source={FOOD_IMAGES[item.id]}
                  style={styles.foodImage}
                  resizeMode="contain"
                />

                <Text style={styles.foodName}>
                  {item.name}
                </Text>

                <CoinAmount
                  amount={item.cost}
                  small
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* HUNGER AND FRIENDSHIP */}
        <View style={styles.statsCard}>
          <View style={styles.statHeading}>
            <Text style={styles.statName}>
              Hunger
            </Text>

            <Text style={styles.statValue}>
              {Math.round(stats.hunger)}%
            </Text>
          </View>

          <ProgressBar value={stats.hunger} />

          <View
            style={[
              styles.statHeading,
              styles.friendshipHeading,
            ]}>
            <Text style={styles.statName}>
              Friendship
            </Text>

            <Text style={styles.statValue}>
              {Math.round(stats.friendship)}%
            </Text>
          </View>

          <ProgressBar value={stats.friendship} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  page: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 8,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.green,
  },
  helper: {
    fontSize: 14,
    color: COLORS.brown,
    textAlign: 'center',
    marginTop: 10,
  },

  // XP HEADER
  header: {
    backgroundColor: COLORS.green,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSmall: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 2,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  coins: {
    fontSize: 16,
    color: COLORS.gold,
    fontWeight: 'bold',
  },
  xpTrack: {
    height: 8,
    backgroundColor: '#064738',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 7,
  },
  xpFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 8,
  },
  xpLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    marginTop: 5,
  },

  // SPEECH
  speechBubble: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
    minHeight: 45,
    justifyContent: 'center',
  },
  speechText: {
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.brown,
    textAlign: 'center',
  },
  speechPointer: {
    position: 'absolute',
    bottom: -7,
    left: '15%',
    width: 13,
    height: 13,
    backgroundColor: COLORS.card,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    transform: [{rotate: '45deg'}],
  },

  // RACCOON SCENE
  scene: {
    flex: 1,
    minHeight: 135,
    backgroundColor: '#8CCEE0',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '25%',
    backgroundColor: '#4B820D',
  },
  petImage: {
    width: '76%',
    height: '88%',
    marginBottom: 3,
  },

  // FOOD CARDS
  foodRow: {
    flexDirection: 'row',
    gap: 7,
  },
  foodCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 9,
    minHeight: 76,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  foodImage: {
    width: 45,
    height: 35,
  },
  foodName: {
    fontSize: 14,
    color: COLORS.brown,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 3,
  },
  foodCost: {
    fontSize: 13,
    color: COLORS.orange,
    fontWeight: 'bold',
  },

  // HUNGER AND FRIENDSHIP
  statsCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 105,
    justifyContent: 'center',
  },
  statHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendshipHeading: {
    marginTop: 12,
  },
  statName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.brown,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.brown,
  },
  barTrack: {
    height: 10,
    backgroundColor: COLORS.track,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 6,
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.orange,
    borderRadius: 10,
  },
});