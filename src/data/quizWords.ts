
export type QuizCategoryId = 'numbers' | 'food';

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
  audioFile: string | null,
): QuizWord {
  return {
    id: `${category}_${index}`,
    word_english: english,
    word_ojibwe: ojibwe,
    category,
    audio_file_path: audioFile,
    image_path: null,
    speaker_credit: null,
    unlock_level: 1,
    games: ['multiple-choice'],
  };
}

export const QUIZ_WORDS: Record<
  QuizCategoryId,
  QuizWord[]
> = {
  numbers: [
    word(
      'numbers', 1, 'one', 'bezhig',
      'asset:/numbers/number_0001_cw.wav',
    ),
    word(
      'numbers', 2, 'two', 'niizh',
      'asset:/numbers/number_0002_cw.wav',
    ),
    word(
      'numbers', 3, 'three', 'niswi',
      'asset:/numbers/number_0003_cw.wav',
    ),
    word(
      'numbers', 4, 'four', 'niiwin',
      'asset:/numbers/number_0004_cw.wav',
    ),
    word(
      'numbers', 5, 'five', 'naanan',
      'asset:/numbers/number_0005_cw.wav',
    ),
    word(
      'numbers', 6, 'six', 'ningodwaaswi',
      'asset:/numbers/number_0006_cw.mp3',
    ),
    word(
      'numbers', 7, 'seven', 'niizhwaaswi',
      'asset:/numbers/number_0007_cw.wav',
    ),
    word(
      'numbers', 8, 'eight', 'nishwaaswi',
      'asset:/numbers/number_0008_cw.wav',
    ),
    word(
      'numbers', 9, 'nine', 'zhaangaswi',
      'asset:/numbers/number_0009_cw.wav',
    ),
  ],

  food: [
    word(
      'food', 1, 'Bread', 'Bakwezhigan',
      'asset:/food/food_0001_sn.mp3',
    ),
    word(
      'food', 2, 'Cherry', 'Ookwemin',
      'asset:/food/food_0002_sn.mp3',
    ),
    word(
      'food', 3, 'Cookie', 'Bakwezhiganenz',
      'asset:/food/food_0003_sn.mp3',
    ),
    word(
      'food', 4, 'Corn', 'Mandaamin',
      'asset:/food/food_0004_cw.wav',
    ),
    word(
      'food', 5, 'Meat', 'Wiiyaas',
      'asset:/food/food_0005_sn.mp3',
    ),
    word(
      'food', 6, 'Milk', 'Doodooshaaboo',
      'asset:/food/food_0006_sn.mp3',
    ),
    word(
      'food', 7, 'Raspberry', 'Miskomin',
      'asset:/food/food_0007_sn.mp3',
    ),
    word(
      'food', 8, 'Strawberry', 'Ode’min',
      'asset:/food/food_0008_sn.mp3',
    ),
    word(
      'food', 9, 'Wild Rice', 'Manoomin',
      'asset:/food/food_0009_cw.wav',
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