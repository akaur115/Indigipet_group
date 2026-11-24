
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  cancelAccountDeletion,
  getAccountDeletionStatus,
  type AccountDeletionStatus,
} from '../services/accountDeletionService';

type Props = {
  uid: string;
  onLogout: () => void | Promise<void>;
  children: React.ReactNode;
};

export default function AccountDeletionGate({
  uid,
  onLogout,
  children,
}: Props) {
  const [result, setResult] =
    useState<AccountDeletionStatus | null>(
      null,
    );

  const [error, setError] =
    useState('');

  const [working, setWorking] =
    useState(false);

  const [revision, setRevision] =
    useState(0);

  const retry = useCallback(() => {
    setRevision(n => n + 1);
  }, []);

  // CHECK STATUS WHEN ACCOUNT CHANGES
  useEffect(() => {
    let live = true;

    setResult(null);
    setError('');

    getAccountDeletionStatus()
      .then(status => {
        if (live) {
          setResult(status);
        }
      })
      .catch((e: any) => {
        if (live) {
          setError(
            e?.message ||
              'Unable to check deletion status.',
          );
        }
      });

    return () => {
      live = false;
    };
  }, [uid, revision]);

  // CANCELLATION (ONLY IF ENABLED)
  const cancel = () => {
    Alert.alert(
      'Cancel account deletion?',
      'Only cancel if you want to keep your IndigiPet account and progress.',
      [
        {
          text: 'Keep deletion request',
          style: 'cancel',
        },
        {
          text: 'Cancel deletion',
          onPress: async () => {
            setWorking(true);

            try {
              await cancelAccountDeletion();
              retry();
            } catch (e: any) {
              Alert.alert(
                'Could not cancel',
                e?.message ||
                  'Please try again.',
              );
            } finally {
              setWorking(false);
            }
          },
        },
      ],
    );
  };

  // NORMAL ACCOUNT
  if (result?.status === 'none') {
    return <>{children}</>;
  }

  return (
    <View style={styles.screen}>
      {!result && !error ? (
        <ActivityIndicator
          size="large"
          color="#035643"
        />
      ) : error ? (
        <>
          <Text style={styles.title}>
            Could not check account status
          </Text>

          <Text style={styles.body}>
            {error}
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={retry}>
            <Text style={styles.buttonText}>
              Try again
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.title}>
            {result?.status === 'deleting'
              ? 'Account deletion in progress'
              : 'Account deletion scheduled'}
          </Text>

          <Text style={styles.body}>
            Your IndigiPet account and
            saved progress are scheduled
            for permanent removal.
          </Text>

          {!!result?.deleteAt && (
            <Text style={styles.date}>
              Scheduled by:{' '}
              {new Date(
                result.deleteAt,
              ).toLocaleDateString()}
            </Text>
          )}

          {result?.cancellationAllowed && (
            <TouchableOpacity
              style={styles.button}
              disabled={working}
              onPress={cancel}>
              <Text style={styles.buttonText}>
                Cancel deletion request
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <TouchableOpacity
        style={styles.outline}
        disabled={working}
        onPress={() => void onLogout()}>
        <Text style={styles.outlineText}>
          Sign out
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFBEF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
  },
  title: {
    fontSize: 23,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#035643',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    color: '#484139',
    marginBottom: 14,
  },
  date: {
    fontSize: 15,
    fontWeight: '600',
    color: '#035643',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#035643',
    borderRadius: 9,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 13,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  outline: {
    borderColor: '#035643',
    borderWidth: 1,
    borderRadius: 9,
    paddingVertical: 13,
    paddingHorizontal: 29,
    marginTop: 14,
  },
  outlineText: {
    color: '#035643',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
