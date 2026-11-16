
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  SafeAreaView,
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
            width: `${safe}%` as DimensionValue,
          },
        ]}
      />
    </View>
  );
}

export default function HomeScreen({uid}: Props) {
  const [game, setGame] = useState<GameData | null>(null);
  const [now, setNow] = useState(Date.now());
  const [errorText, setErrorText] = useState('');
  const [feeding, setFeeding] = useState(false);
  const [dialogueNumber, setDialogueNumber] = useState(0);
  const [feedSpeech, setFeedSpeech] = useState<string | null>(null);
  const [lastQuizAt, setLastQuizAt] = useState(0);

  // LOAD FIREBASE DATA AND UPDATE PET CARE
  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    ensureGameData(uid)
      .then(() => {
        if (!active) return;

        unsubscribe = subscribeGameData(
          uid,
          saved => {
            if (!active) return;

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
            error?.message || 'Unable to load Esiban.',
          );
        }
      });

    // DECAY UPDATES WHILE THE APP IS OPEN
    const timer = setInterval(
      () => setNow(Date.now()),
      5000,
    );

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

  // QUIZ COMPLETION MESSAGE
  useEffect(() => {
    const reference = doc(
      getFirestore(),
      'users',
      uid,
    );

    const unsubscribe = onSnapshot(
      reference,
      snapshot => {
        const event = snapshot.data()?.lastQuizEvent;

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

  // CLEAR FEEDING MESSAGE
  useEffect(() => {
    if (!feedSpeech) return;

    const timer = setTimeout(
      () => setFeedSpeech(null),
      FEED_SPEECH_MS,
    );

    return () => clearTimeout(timer);
  }, [feedSpeech]);

  // FEED ESIBAN
  const handleFeed = async (item: Food) => {
    if (!game || feeding) return;

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

  if (errorText) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          Unable to load pet data
        </Text>
        <Text style={styles.helper}>{errorText}</Text>
        <Text style={styles.helper}>
          Check your internet and Firestore connection.
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

  const stats = getCurrentStats(game, now);
  const level = getLevel(game.xp);
  const normalSpeech = getPetSpeech(stats, dialogueNumber);

  const recentQuiz =
    lastQuizAt > 0 &&
    now >= lastQuizAt &&
    now - lastQuizAt < QUIZ_SPEECH_MS;

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
        Math.max(1, level.xpForNext)) * 100,
    ),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.page}>

        {/* HEADER */}
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

          <View style={styles.xpTrack}>
            <View
              style={[
                styles.xpFill,
                {
                  width: `${xpPercentage}%` as DimensionValue,
                },
              ]}
            />
          </View>

          <Text style={styles.xpLabel}>
            {level.xpIntoLevel} / {level.xpForNext}
            {' XP to next level'}
          </Text>
        </View>

        {/* SPEECH */}
        <TouchableOpacity
          style={styles.speechBubble}
          onPress={() =>
            setDialogueNumber(number => number + 1)
          }
          accessibilityRole="button"
          accessibilityLabel="Next Esiban message">

          <Text style={styles.speechText}>
            {speech}
          </Text>

          <View style={styles.speechPointer} />
        </TouchableOpacity>

        {/* RACCOON SCENE */}
        <View style={styles.scene}>
          <View style={styles.ground} />

          <Image
            source={require('../../assets/images/esiban.png')}
            style={styles.petImage}
            resizeMode="contain"
            accessibilityLabel="Esiban raccoon"
          />
        </View>

        {/* FOOD BUTTONS */}
        <View style={styles.foodRow}>
          {FOODS.map(item => {
            const cannotAfford =
              game.coins < item.cost;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.foodCard,
                  cannotAfford && styles.disabled,
                ]}
                onPress={() => void handleFeed(item)}
                disabled={feeding || cannotAfford}
                accessibilityRole="button"
                accessibilityLabel={
                  `Feed ${item.name} for ${item.cost} coins`
                }>

                <Image
                  source={FOOD_IMAGES[item.id]}
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
              {Math.round(stats.friendship)}%
            </Text>
          </View>

          <Bar value={stats.friendship} />
        </View>
      </View>
    </SafeAreaView>
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
    paddingBottom: 5,
    gap: 7,
  },

  center: {
    flex: 1,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.green,
  },

  helper: {
    fontSize: 13,
    color: COLORS.brown,
    textAlign: 'center',
    marginTop: 10,
  },

  header: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  brand: {
    color: COLORS.cream,
    fontSize: 20,
    fontWeight: 'bold',
  },

  headerSmall: {
    color: COLORS.cream,
    fontSize: 12,
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
    marginTop: 7,
    overflow: 'hidden',
  },

  xpFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
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
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
  },

  speechText: {
    fontSize: 13,
    color: '#292521',
    textAlign: 'center',
    lineHeight: 18,
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

  // FLEXIBLE SCENE WITH SMALLER RACCOON
  scene: {
    flex: 1,
    minHeight: 115,
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
    width: '70%',
    height: '88%',
    maxHeight: 195,
    marginBottom: 2,
  },

  foodRow: {
    flexDirection: 'row',
    gap: 7,
  },

  foodCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomWidth: 2,
    borderRadius: 9,
    paddingVertical: 5,
    minHeight: 68,
  },

  disabled: {
    opacity: 0.55,
  },

  foodImage: {
    width: 43,
    height: 32,
  },

  foodName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#484139',
    marginTop: 2,
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
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  statHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  friendshipHeading: {
    marginTop: 8,
  },

  statName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.brown,
  },

  statValue: {
    fontSize: 13,
    color: COLORS.brown,
  },

  barTrack: {
    height: 7,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.track,
    marginTop: 4,
  },

  barFill: {
    height: '100%',
    backgroundColor: COLORS.orange,
    borderRadius: 8,
  },
});