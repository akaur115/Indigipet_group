
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
): QuizWord {
  return {
    id: category + '_' + String(index),
    word_english: english,
    word_ojibwe: ojibwe,
    category: category,
    audio_file_path: null,
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
    word('numbers', 1, 'one', 'bezhig'),
    word('numbers', 2, 'two', 'niizh'),
    word('numbers', 3, 'three', 'niswi'),
    word('numbers', 4, 'four', 'niiwin'),
    word('numbers', 5, 'five', 'naanan'),
    word('numbers', 6, 'six', 'ningodwaaswi'),
    word('numbers', 7, 'seven', 'niizhwaaswi'),
    word('numbers', 8, 'eight', 'nishwaaswi'),
    word('numbers', 9, 'nine', 'zhaangaswi'),
  ],

  food: [
    word('food', 1, 'Bread', 'Bakwezhigan'),
    word('food', 2, 'Cherry', 'Ookwemin'),
    word('food', 3, 'Cookie', 'Bakwezhiganenz'),
    word('food', 4, 'Corn', 'Mandaamin'),
    word('food', 5, 'Meat', 'Wiiyaas'),
    word('food', 6, 'Milk', 'Doodooshaaboo'),
    word('food', 7, 'Raspberry', 'Miskomin'),
    word('food', 8, 'Strawberry', 'Ode’min'),
    word('food', 9, 'Wild Rice', 'Manoomin'),
  ],
};

export const QUIZ_CATEGORY_NAMES: Record<
  QuizCategoryId,
  string
> = {
  numbers: 'Numbers',
  food: 'Food',
};
