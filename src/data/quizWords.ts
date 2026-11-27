/**
 * IndigiPet vocabulary.
 *
 * Original word IDs are preserved so existing
 * Firestore learning progress remains compatible.
 *
 * New vocabulary follows the client's
 * Audio update.pdf.
 */

export type QuizCategoryId =
  | 'numbers'
  | 'food';

export type QuizWord = {
  id: string;
  word_english: string;
  word_ojibwe: string;
  category: QuizCategoryId;
  audio_file_path: string | null;
  image_path: string | null;
  speaker_credit: string | null;
  unlock_level: number;
  games: string[];
};

function word(
  category: QuizCategoryId,
  index: number,
  english: string,
  ojibwe: string,
  audioFile?: string,
  speakerCredit: string | null = null,
): QuizWord {

  const number =
    String(index).padStart(4, '0');

  return {
    id: `${category}_${index}`,
    word_english: english,
    word_ojibwe: ojibwe,
    category,

    // Old files use MP3.
    // Newly supplied files use WAV.
    audio_file_path:
      audioFile ??
      `${category}_${number}.mp3`,

    image_path: null,
    speaker_credit: speakerCredit,
    unlock_level: 1,
    games: ['multiple-choice'],
  };
}

const corey = 'Corey Whitford';

export const QUIZ_WORDS: Record<
  QuizCategoryId,
  QuizWord[]
> = {

  // NUMBERS
  numbers: [

    // ORIGINAL NUMBERS 1–9

    word('numbers', 1, 'one', 'bezhig'),

    word('numbers', 2, 'two', 'niizh'),

    word('numbers', 3, 'three', 'niswi'),

    word('numbers', 4, 'four', 'niiwin'),

    word('numbers', 5, 'five', 'naanan'),

    word(
      'numbers',
      6,
      'six',
      'ningodwaaswi',
    ),

    word(
      'numbers',
      7,
      'seven',
      'niizhwaaswi',
    ),

    word(
      'numbers',
      8,
      'eight',
      'nishwaaswi',
    ),

    word(
      'numbers',
      9,
      'nine',
      'zhaangaswi',
    ),

    // NEW NUMBERS FROM CLIENT

    word(
      'numbers',
      10,
      'ten',
      'Midaaswi',
      'number_0010.wav',
      corey,
    ),

    word(
      'numbers',
      11,
      'eleven',
      'Midaaswi shi bezhig',
      'number_0011.wav',
      corey,
    ),

    word(
      'numbers',
      12,
      'twelve',
      'Midaaswi shi niizh',
      'number_0012.wav',
      corey,
    ),

    word(
      'numbers',
      13,
      'thirteen',
      'Midaaswi shi niswi',
      'number_0013.wav',
      corey,
    ),

    word(
      'numbers',
      14,
      'fourteen',
      'Midaaswi shi niiwin',
      'number_0014.wav',
      corey,
    ),

    word(
      'numbers',
      15,
      'fifteen',
      'Midaaswi shi naanan',
      'number_0015.wav',
      corey,
    ),

    word(
      'numbers',
      16,
      'sixteen',
      'Midaaswi shi ningodwaaswi',
      'number_0016.wav',
      corey,
    ),

    word(
      'numbers',
      17,
      'seventeen',
      'Midaaswi shi niizhwaaswi',
      'number_0017.wav',
      corey,
    ),

    word(
      'numbers',
      18,
      'eighteen',
      'Midaaswi shi nishwaaswi',
      'number_0018.wav',
      corey,
    ),

    word(
      'numbers',
      19,
      'nineteen',
      'Midaaswi shi zhaangaswi',
      'number_0019.wav',
      corey,
    ),

    word(
      'numbers',
      20,
      'twenty',
      'Niizhtana',
      'number_0020.wav',
      corey,
    ),

    word(
      'numbers',
      21,
      'thirty',
      'Niswimidana',
      'number_0021.wav',
      corey,
    ),

    word(
      'numbers',
      22,
      'forty',
      'Niiwimidana',
      'number_0022.wav',
      corey,
    ),

    word(
      'numbers',
      23,
      'fifty',
      'Naananimidana',
      'number_0023.wav',
      corey,
    ),

    word(
      'numbers',
      24,
      'sixty',
      'Ningodwaaswimidana',
      'number_0024.wav',
      corey,
    ),

    word(
      'numbers',
      25,
      'seventy',
      'Niizhtanamidana',
      'number_0025.wav',
      corey,
    ),

    word(
      'numbers',
      26,
      'eighty',
      'Nishtanamidana',
      'number_0026.wav',
      corey,
    ),

    word(
      'numbers',
      27,
      'ninety',
      'Zhaangaswimidana',
      'number_0027.wav',
      corey,
    ),
  ],

  // FOOD
  food: [

    // ORIGINAL FOOD WORDS

    word(
      'food',
      1,
      'Bread',
      'Bakwezhigan',
      'food_0001.wav',
    ),

    word(
      'food',
      2,
      'Cherry',
      'Ookwemin',
    ),

    word(
      'food',
      3,
      'Cookie',
      'Bakwezhiganenz',
      'food_0003.wav',
    ),

    word(
      'food',
      4,
      'Corn',
      'Mandaamin',
    ),

    word(
      'food',
      5,
      'Meat',
      'Wiiyaas',
    ),

    word(
      'food',
      6,
      'Milk',
      'Doodooshaaboo',
      'food_0006.wav',
    ),

    word(
      'food',
      7,
      'Raspberry',
      'Miskomin',
    ),

    word(
      'food',
      8,
      'Strawberry',
      'Ode’min',
      'food_0008.wav',
    ),

    word(
      'food',
      9,
      'Wild Rice',
      'Manoomin',
    ),

    // NEW FOOD WORDS FROM CLIENT

    word(
      'food',
      11,
      'white rice',
      'Waabishki manoomin',
      'food_0011.wav',
      corey,
    ),

    word(
      'food',
      12,
      'berries',
      'Shoominag',
      'food_0012.wav',
      corey,
    ),

    word(
      'food',
      13,
      'blueberries',
      'Miinan',
      'food_0013.wav',
      corey,
    ),

    word(
      'food',
      14,
      'fish',
      'Giingo',
      'food_0014.wav',
      corey,
    ),

    word(
      'food',
      15,
      'moose meat',
      'Moonz waawiiyaas',
      'food_0015.wav',
      corey,
    ),

    word(
      'food',
      16,
      'potato',
      'Opin',
      'food_0016.wav',
      corey,
    ),

    word(
      'food',
      17,
      'apple',
      'Mishiimin',
      'food_0017.wav',
      corey,
    ),

    word(
      'food',
      18,
      'egg',
      'Waawan',
      'food_0018.wav',
      corey,
    ),

    word(
      'food',
      19,
      'soup',
      'Naboop',
      'food_0019.wav',
      corey,
    ),

    word(
      'food',
      20,
      'tea',
      'Aniibiishaboo',
      'food_0020.wav',
      corey,
    ),

    word(
      'food',
      21,
      'water',
      'Nibi',
      'food_0021.wav',
      corey,
    ),

    word(
      'food',
      22,
      'sandwich',
      'Nabonigan',
      'food_0022.wav',
      corey,
    ),

    word(
      'food',
      23,
      'cheese',
      'jiis',
      'food_0023.wav',
      corey,
    ),

    word(
      'food',
      24,
      'yogurt',
      'Mashkwaa doodooshaboo',
      'food_0024.wav',
      corey,
    ),

    word(
      'food',
      25,
      'cereal',
      'Gizhabaa-miijim',
      'food_0025.wav',
      corey,
    ),

    word(
      'food',
      26,
      'noodles',
      'Ginaawbiigi-jiisim',
      'food_0026.wav',
      corey,
    ),

    word(
      'food',
      27,
      'tacos',
      'Mashkwaa nabonigan',
      'food_0027.wav',
      corey,
    ),

    word(
      'food',
      28,
      'spaghetti',
      'ispagedii',
      'food_0028.wav',
      corey,
    ),

    word(
      'food',
      29,
      'stew',
      'Jiibaakwaade',
      'food_0029.wav',
      corey,
    ),

    word(
      'food',
      30,
      'salad',
      'Ginigawibaginigan',
      'food_0030.wav',
      corey,
    ),

    word(
      'food',
      31,
      'chicken',
      'Baakaakwaan',
      'food_0031.wav',
      corey,
    ),

    word(
      'food',
      32,
      'pork',
      'Kookoosh',
      'food_0032.wav',
      corey,
    ),

    word(
      'food',
      33,
      'ground beef',
      'Bizhiki wiiyaas',
      'food_0033.wav',
      corey,
    ),

    word(
      'food',
      34,
      'soda pop',
      'Shiiwaaboo',
      'food_0034.wav',
      corey,
    ),

    word(
      'food',
      35,
      'juice',
      'zhiiwaabo',
      'food_0035.wav',
      corey,
    ),

    word(
      'food',
      36,
      'chocolate',
      'Mashkikiins',
      'food_0036.wav',
      corey,
    ),
  ],
};

export const QUIZ_CATEGORY_NAMES: Record<
  QuizCategoryId,
  string
> = {
  numbers: 'Numbers',
  food: 'Food',
};