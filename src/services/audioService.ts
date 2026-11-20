
import Sound from 'react-native-sound';
import type {QuizWord} from '../data/quizWords';

Sound.setCategory('Playback');

let activeSound: Sound | null = null;
let playbackRequest = 0;
let finishPending: (() => void) | null = null;

export function stopWordAudio(): void {
  playbackRequest += 1;

  const finish = finishPending;
  finishPending = null;

  if (activeSound) {
    const sound = activeSound;
    activeSound = null;

    sound.stop(() => {
      sound.release();
    });
  }

  if (finish) {
    finish();
  }
}

export function playWordAudio(
  word: QuizWord,
): Promise<void> {
  stopWordAudio();

  const filename = word.audio_file_path;

  if (!filename) {
    return Promise.reject(
      new Error('Audio is unavailable for this word.'),
    );
  }

  const request = playbackRequest;

  // Support both ordinary filenames and downloaded files
  // that still have "(1)" in their names.
  const alternative = filename.replace(
    /(\.(mp3|wav))$/i,
    '(1)$1',
  );

  const candidates =
    alternative === filename
      ? [filename]
      : [filename, alternative];

  return new Promise<void>((resolve, reject) => {
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) {
        return;
      }

      settled = true;

      if (finishPending === cancelPending) {
        finishPending = null;
      }

      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    const cancelPending = () => finish();
    finishPending = cancelPending;

    const tryLoad = (index: number) => {
      if (settled || request !== playbackRequest) {
        finish();
        return;
      }

      const candidate = candidates[index];

      const sound = new Sound(
        candidate,
        '',
        error => {
          if (settled || request !== playbackRequest) {
            sound.release();
            finish();
            return;
          }

          if (error) {
            sound.release();

            if (index + 1 < candidates.length) {
              tryLoad(index + 1);
            } else {
              finish(
                new Error(
                  `Could not load recording: ${filename}`,
                ),
              );
            }
            return;
          }

          activeSound = sound;

          sound.play(success => {
            if (activeSound === sound) {
              activeSound = null;
              sound.release();
            }

            if (request !== playbackRequest) {
              finish();
            } else if (success) {
              finish();
            } else {
              finish(
                new Error('Audio playback failed.'),
              );
            }
          });
        },
      );
    };

    tryLoad(0);
  });
}