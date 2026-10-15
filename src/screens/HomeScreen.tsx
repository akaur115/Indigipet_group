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
} from 'react-native';

import {
  ensureGameData,
  feedPet,
  FOODS,
  getCurrentStats,
  getLevel,
  getPetSpeech,
  subscribeGameData,
  type FoodItem,
  type GameData,
} from '../services/gameService';

type Props = {
  uid: string;
};

const COLORS = {
  cream: '#FFFBEF',
  darkGreen: '#035643',
  statBg: '#F3E9CF',
  orange: '#EC6E00',
  accent: '#FFAE33',
  brown: '#6E6151',
  teal: '#089BA1',
};


function Bar({
  value,
  color = COLORS.orange,
}: {
  value: number;
  color?: string;
}) {
  const percent = Math.max(
    0,
    Math.min(100, value),
  );

  return (
    <View style={styles.barTrack}>
      <View
        style={[
          styles.barFill,
          {
            backgroundColor: color,
            width: `${percent}%` as `${number}%`,
          },
        ]}
      />
    </View>
  );
}


export default function HomeScreen({uid}: Props) {
  const [game, setGame] =
    useState<GameData | null>(null);

  const [now, setNow] = useState(Date.now());

  const [dialogueNumber, setDialogueNumber] =
    useState(0);

  const [feeding, setFeeding] =
    useState(false);

  const [errorText, setErrorText] =
    useState('');


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
            if (active) {
              setGame(saved);
              setNow(Date.now());
            }
          },
          error => {
            if (active) {
              setErrorText(error.message);
            }
          },
        );
      })
      .catch(error => {
        if (active) {
          setErrorText(
            error?.message ||
              'Unable to load your saved pet.',
          );
        }
      });

    // Update hunger and friendship every minute
    const ticker = setInterval(
      () => setNow(Date.now()),
      60000,
    );

    // Update when user opens app again
    const subscription =
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
      clearInterval(ticker);
      subscription.remove();
    };
  }, [uid]);


  const handleFeed = async (item: FoodItem) => {
    if (feeding || !game) {
      return;
    }

    setFeeding(true);

    try {
      await feedPet(uid, item);

      setNow(Date.now());
    } catch (error: any) {
      Alert.alert(
        'Cannot feed Esiban',
        error?.message || 'Try again.',
      );
    } finally {
      setFeeding(false);
    }
  };


  if (errorText) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>
          Unable to load pet data
        </Text>

        <Text style={styles.helper}>
          {errorText}
        </Text>

        <Text style={styles.helper}>
          Check your internet connection
          and Firestore rules.
        </Text>
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={COLORS.darkGreen}
        />

        <Text style={styles.helper}>
          Loading Esiban...
        </Text>
      </View>
    );
  }


  const stats = getCurrentStats(game, now);

  const level = getLevel(game.xp);

  const speech = getPetSpeech(
    stats,
    dialogueNumber,
  );

  const xpPercentage = Math.round(
    (level.xpIntoLevel / level.xpForNext) * 100,
  );


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}>

        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.brand}>
                IndigiPet
              </Text>

              <Text style={styles.headerSmall}>
                XP - Level {level.level}
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
                  width:
                    `${xpPercentage}%` as `${number}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.xpLabel}>
            {level.xpIntoLevel} / {level.xpForNext}
            {' '}XP to next level
          </Text>
        </View>

        {/* ESIBAN SPEECH BUBBLE */}

        <TouchableOpacity
          style={styles.speechBubble}
          onPress={() =>
            setDialogueNumber(i => i + 1)
          }
          accessibilityRole="button"
          accessibilityLabel="Hear another Esiban message">

          <Text style={styles.speechText}>
            {speech}
          </Text>

          <View style={styles.speechPointer} />
        </TouchableOpacity>

        {/* FULL BODY RACCOON SCENE */}

        <View style={styles.scene}>

          {/* Background Trees */}

          <Text style={styles.trees}>
            🌲 🌳 🌲 🌳 🌲
          </Text>

          {/* Grass */}

          <View style={styles.ground} />

          {/* FULL BODY RACCOON PNG */}

          <Image
            source={require('../assets/images/raccoon-full.png')}
            style={styles.petImage}
            resizeMode="contain"
            accessibilityLabel="Esiban the raccoon"
          />

        </View>

        {/* FOOD ITEMS */}

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
                    styles.foodDisabled,
                ]}
                onPress={() => handleFeed(item)}
                disabled={feeding || cannotAfford}
                accessibilityRole="button"
                accessibilityLabel={
                  `Feed ${item.name}, costs ${item.cost} coins`
                }>

                <Text style={styles.foodEmoji}>
                  {item.emoji}
                </Text>

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

        {game.coins === 0 ? (
          <Text style={styles.helper}>
            Earn coins through learning
            to buy food for Esiban.
          </Text>
        ) : null}

        {/* HUNGER AND FRIENDSHIP BARS */}

        <View style={styles.statsCard}>

          {/* HUNGER */}

          <View style={styles.statHeading}>
            <Text style={styles.statName}>
              Hunger
            </Text>

            <Text style={styles.statValue}>
              {stats.hunger}%
            </Text>
          </View>

          <Bar value={stats.hunger} />

          {/* FRIENDSHIP */}

          <View
            style={[
              styles.statHeading,
              styles.friendshipHeading,
            ]}>

            <Text style={styles.statName}>
              Friendship
            </Text>

            <Text style={styles.statValue}>
              {stats.friendship}%
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

  page: {
    padding: 15,
    paddingBottom: 25,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream,
    padding: 22,
  },

  title: {
    fontSize: 20,
    color: COLORS.darkGreen,
    fontWeight: 'bold',
  },

  helper: {
    fontSize: 12,
    textAlign: 'center',
    color: COLORS.brown,
    marginTop: 9,
  },

  // HEADER

  header: {
    backgroundColor: COLORS.darkGreen,
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
    fontWeight: 'bold',
    fontSize: 24,
  },

  headerSmall: {
    color: COLORS.cream,
    fontSize: 13,
    marginTop: 2,
  },

  coins: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: 'bold',
  },

  xpTrack: {
    height: 7,
    backgroundColor: '#064738',
    borderRadius: 8,
    marginTop: 12,
    overflow: 'hidden',
  },

  xpFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 8,
  },

  xpLabel: {
    fontSize: 10,
    color: COLORS.cream,
    marginTop: 5,
  },

  // SPEECH BUBBLE

  speechBubble: {
    position: 'relative',
    backgroundColor: '#FFFBF0',
    borderWidth: 1,
    borderColor: '#E5DAC8',
    padding: 13,
    marginTop: 13,
    marginBottom: 13,
    borderRadius: 12,
    minHeight: 55,
    justifyContent: 'center',
  },

  speechText: {
    fontSize: 13,
    color: COLORS.brown,
    textAlign: 'center',
  },

  speechPointer: {
    position: 'absolute',
    bottom: -8,
    left: '15%',
    width: 15,
    height: 15,
    transform: [{rotate: '45deg'}],
    backgroundColor: '#FFFBF0',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5DAC8',
  },

  // FULL BODY RACCOON SCENE

  scene: {
    height: 265,
    backgroundColor: '#8CCEE0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
  },

  trees: {
    position: 'absolute',
    top: 16,
    fontSize: 29,
  },

  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 65,
    backgroundColor: '#4B820D',
  },

  petImage: {
    width: 245,
    height: 245,
    marginBottom: 2,
  },

  // FOOD ITEMS

  foodRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },

  foodCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFBF0',
    borderWidth: 1,
    borderColor: '#E5DAC8',
    borderBottomWidth: 3,
    borderRadius: 10,
    paddingVertical: 9,
  },

  foodDisabled: {
    opacity: 0.65,
  },

  foodEmoji: {
    fontSize: 28,
  },

  foodName: {
    fontSize: 11,
    color: COLORS.brown,
    marginTop: 2,
  },

  foodCost: {
    fontSize: 13,
    color: COLORS.orange,
    fontWeight: 'bold',
  },

  // HUNGER AND FRIENDSHIP

  statsCard: {
    backgroundColor: '#FFFBF0',
    borderColor: '#E5DAC8',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.brown,
  },

  statValue: {
    fontSize: 13,
    color: COLORS.brown,
  },

  barTrack: {
    height: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.statBg,
    marginTop: 6,
  },

  barFill: {
    height: '100%',
    borderRadius: 8,
  },

  footerTip: {
    marginTop: 12,
    color: COLORS.brown,
    fontSize: 12,
    textAlign: 'center',
  },
});
