import React, {useEffect, useState} from 'react';

import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  SafeAreaView,
  ScrollView,
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

type Props = {
  uid: string;
};

type Food = (typeof FOODS)[number];

const COLORS = {
  cream: '#FFFBEF',
  green: '#035643',
  cream2: '#FFFBF0',
  brown: '#6E6151',
  teal: '#089BA1',
  orange: '#EC6E00',
  gold: '#FFAE33',
  track: '#F3E9CF',
  border: '#E5DAC8',
};

const FOOD_IMAGES: Record<
  string,
  ImageSourcePropType
> = {
  cookie: require('../../assets/images/cookie.png'),
  corn: require('../../assets/images/corn.png'),
  rice: require('../../assets/images/rice.png'),
};

const FOOD_SPEECH: Record<string, string> = {
  cookie: 'Yummy! Thank you for the cookie!',
  corn: 'That corn was delicious! Thank you!',
  rice: "My tummy is full! You're the best!",
};

const QUIZ_SPEECH_MS = 45000;
const FEED_SPEECH_MS = 12000;

function Bar({value}: {value: number}) {
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
            width: (
              String(safe) + '%'
            ) as DimensionValue,
          },
        ]}
      />
    </View>
  );
}

export default function HomeScreen({
  uid,
}: Props) {
  const [game, setGame] =
    useState<GameData | null>(null);

  const [now, setNow] =
    useState(Date.now());

  const [errorText, setErrorText] =
    useState('');

  const [feeding, setFeeding] =
    useState(false);

  const [
    dialogueNumber,
    setDialogueNumber,
  ] = useState(0);

  const [feedSpeech, setFeedSpeech] =
    useState<string | null>(null);

  const [lastQuizAt, setLastQuizAt] =
    useState(0);

  // LOAD GAME DATA FROM FIREBASE
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

    // UPDATE HUNGER AND FRIENDSHIP
    // EVERY FIVE SECONDS WHILE OPEN
    const timer = setInterval(
      () => setNow(Date.now()),
      5000,
    );

    // ALSO UPDATE WHEN USER RETURNS
    // TO THE APP
    const appSubscription =
      AppState.addEventListener(
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
      appSubscription.remove();
    };
  }, [uid]);

  // DETECT A COMPLETED QUIZ
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

        setNow(Date.now());
      },
      error => {
        console.log(
          'QUIZ SPEECH ERROR:',
          error.message,
        );
      },
    );

    return unsubscribe;
  }, [uid]);

  // REMOVE FEED MESSAGE AFTER 12 SEC
  useEffect(() => {
    if (!feedSpeech) {
      return;
    }

    const timer = setTimeout(
      () => setFeedSpeech(null),
      FEED_SPEECH_MS,
    );

    return () => clearTimeout(timer);
  }, [feedSpeech]);

  // FEED ESIBAN
  const handleFeed = async (
    item: Food,
  ) => {
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
        error?.message ||
          'Please try again.',
      );
    } finally {
      setFeeding(false);
    }
  };

  if (errorText) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          Unable to load pet data
        </Text>

        <Text style={styles.helper}>
          {errorText}
        </Text>

        <Text style={styles.helper}>
          Check your internet and
          Firestore connection.
        </Text>
      </View>
    );
  }

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

  // CURRENT PET STATISTICS
  const stats = getCurrentStats(
    game,
    now,
  );

  const level = getLevel(game.xp);

  const normalSpeech = getPetSpeech(
    stats,
    dialogueNumber,
  );

  const recentQuiz =
    lastQuizAt > 0 &&
    now >= lastQuizAt &&
    now - lastQuizAt <
      QUIZ_SPEECH_MS;

  // DIFFERENT SPEECH AFTER FEEDING
  // OR COMPLETING A QUIZ
  const speech =
    feedSpeech ||
    (recentQuiz
      ? "I loved learning with you! Let's play again soon!"
      : normalSpeech);

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
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}>

        {/* INDIGIPET HEADER */}
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

            <Text style={styles.coins}>
              🟠 {game.coins}
            </Text>
          </View>

          {/* XP BAR */}
          <View style={styles.xpTrack}>
            <View
              style={[
                styles.xpFill,
                {
                  width: (
                    String(xpPercentage) + '%'
                  ) as DimensionValue,
                },
              ]}
            />
          </View>

          <Text style={styles.xpLabel}>
            {level.xpIntoLevel}
            {' / '}
            {level.xpForNext}
            {' XP to next level'}
          </Text>
        </View>

        {/* ESIBAN SPEECH */}
        <TouchableOpacity
          style={styles.speechBubble}
          onPress={() =>
            setDialogueNumber(i => i + 1)
          }
          accessibilityRole="button"
          accessibilityLabel={
            'See another message from Esiban'
          }>

          <Text style={styles.speechText}>
            {speech}
          </Text>

          <View style={styles.speechPointer} />
        </TouchableOpacity>

        {/* NEW CLIENT ESIBAN IMAGE */}
        <View style={styles.scene}>
          <View style={styles.ground} />

          <Image
            source={require(
              '../../assets/images/esiban.png'
            )}
            style={styles.petImage}
            resizeMode="contain"
            accessibilityLabel={
              'Esiban, the raccoon mascot'
            }
          />
        </View>

        {/* NEW FOOD IMAGES */}
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
                onPress={() =>
                  void handleFeed(item)
                }
                disabled={
                  feeding || cannotAfford
                }
                accessibilityRole="button"
                accessibilityLabel={
                  'Feed ' +
                  item.name +
                  ', costs ' +
                  item.cost +
                  ' coins'
                }>

                <Image
                  source={
                    FOOD_IMAGES[item.id]
                  }
                  style={styles.foodImage}
                  resizeMode="contain"
                />

                <Text style={styles.foodName}>
                  {item.name}
                </Text>

                <Text style={styles.foodCost}>
                  🟠 {item.cost}
                </Text>
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

          <Bar value={stats.hunger} />

          <View
            style={[
              styles.statHeading,
              styles.friendshipHeading,
            ]}>

            <Text style={styles.statName}>
              Friendship
            </Text>

            <Text style={styles.statValue}>
              {Math.round(
                stats.friendship,
              )}%
            </Text>
          </View>

          <Bar value={stats.friendship} />
        </View>

        <Text style={styles.footerTip}>
          Care for Esiban by feeding him
          and completing learning games.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  scroll: {
    flex: 1,
  },

  page: {
    padding: 15,
    paddingBottom: 30,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream,
    padding: 22,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.green,
  },

  helper: {
    fontSize: 13,
    textAlign: 'center',
    color: COLORS.brown,
    marginTop: 10,
  },

  header: {
    backgroundColor: COLORS.green,
    padding: 15,
    borderRadius: 12,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  brand: {
    color: COLORS.cream,
    fontSize: 24,
    fontWeight: 'bold',
  },

  headerSmall: {
    color: COLORS.cream,
    fontSize: 13,
    marginTop: 2,
  },

  coins: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: 'bold',
  },

  xpTrack: {
    height: 8,
    backgroundColor: '#064738',
    borderRadius: 8,
    marginTop: 12,
    overflow: 'hidden',
  },

  xpFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 8,
  },

  xpLabel: {
    fontSize: 11,
    color: COLORS.cream,
    marginTop: 5,
  },

  speechBubble: {
    position: 'relative',
    backgroundColor: COLORS.cream2,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 13,
    marginTop: 13,
    marginBottom: 14,
    borderRadius: 12,
    minHeight: 58,
    justifyContent: 'center',
  },

  speechText: {
    fontSize: 14,
    color: '#292521',
    textAlign: 'center',
    lineHeight: 20,
  },

  speechPointer: {
    position: 'absolute',
    bottom: -8,
    left: '15%',
    width: 15,
    height: 15,
    transform: [{rotate: '45deg'}],
    backgroundColor: COLORS.cream2,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },

  scene: {
    height: 265,
    backgroundColor: '#8CCEE0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },

  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 59,
    backgroundColor: '#4B820D',
  },

  petImage: {
    width: '86%',
    height: 260,
    marginBottom: 0,
  },

  foodRow: {
    flexDirection: 'row',
    marginTop: 9,
    gap: 8,
  },

  foodCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomWidth: 3,
    borderRadius: 10,
    paddingVertical: 9,
    minHeight: 95,
  },

  disabled: {
    opacity: 0.55,
  },

  foodImage: {
    height: 39,
    width: 50,
  },

  foodName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brown,
    marginTop: 3,
  },

  foodCost: {
    fontSize: 13,
    color: COLORS.orange,
    fontWeight: 'bold',
    marginTop: 3,
  },

  statsCard: {
    backgroundColor: COLORS.cream2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 13,
    marginTop: 10,
  },

  statHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontSize: 14,
    color: COLORS.brown,
  },

  barTrack: {
    height: 9,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.track,
    marginTop: 6,
  },

  barFill: {
    height: '100%',
    backgroundColor: COLORS.orange,
    borderRadius: 8,
  },

  footerTip: {
    marginTop: 12,
    color: COLORS.brown,
    fontSize: 12,
    textAlign: 'center',
  },
});
