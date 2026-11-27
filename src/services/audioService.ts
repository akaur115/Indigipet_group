import Sound from 'react-native-sound';

import type {
  QuizWord,
} from '../data/quizWords';

Sound.setCategory('Playback');

let playbackRequest = 0;

let stopCurrent:
  (() => void) | null = null;

// STOP CURRENT AUDIO
export function stopWordAudio(): void {

  playbackRequest += 1;

  const stop = stopCurrent;

  stopCurrent = null;

  stop?.();
}

// PLAY OJIBWE PRONUNCIATION
export function playWordAudio(
  word: QuizWord,
): Promise<void> {

  // Stop any previously playing word.
  stopWordAudio();

  const filename =
    word.audio_file_path;

  if (!filename) {
    return Promise.reject(
      new Error(
        'No audio recording for this word.',
      ),
    );
  }

  const thisRequest = playbackRequest;

  return new Promise<void>(
    (resolve, reject) => {

      let settled = false;
      let released = false;

      const sound = new Sound(
        filename,
        Sound.MAIN_BUNDLE,
        error => {

          // Another word was requested.
          if (
            thisRequest !== playbackRequest
          ) {
            finish();
            return;
          }

          // AUDIO LOAD ERROR
          if (error) {
            finish(
              new Error(
                `Could not load audio: ${filename}`,
              ),
            );
            return;
          }

          // ALLOW CURRENT AUDIO TO STOP
          stopCurrent = () => {
            sound.stop(() => finish());
          };

          // START PLAYBACK
          sound.play(success => {

            if (
              thisRequest !==
                playbackRequest ||
              success
            ) {
              finish();
            } else {
              finish(
                new Error(
                  `Audio playback failed: ${filename}`,
                ),
              );
            }
          });
        },
      );

      // CLEAN UP AUDIO RESOURCES
      function finish(error?: Error): void {

        if (settled) {
          return;
        }

        settled = true;

        if (
          thisRequest === playbackRequest
        ) {
          stopCurrent = null;
        }

        if (!released) {
          released = true;
          sound.release();
        }

        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }
    },
  );
}