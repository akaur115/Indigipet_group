import {
  getFunctions,
  httpsCallable,
} from '@react-native-firebase/functions';

import {
  getApp,
} from '@react-native-firebase/app';

export type AccountDeletionStatus = {
  status: 'none' | 'pending' | 'deleting';
  deleteAt: string | null;
  cancellationAllowed: boolean;
};

const functions = getFunctions(
  getApp(),
  'us-central1',
);

// REQUEST DELETION
export async function requestAccountDeletion():
  Promise<AccountDeletionStatus> {
  const callable = httpsCallable<
    undefined,
    AccountDeletionStatus
  >(
    functions,
    'requestAccountDeletion',
  );

  const result = await callable();

  return result.data;
}

// CHECK IF USER IS PENDING DELETION
export async function getAccountDeletionStatus():
  Promise<AccountDeletionStatus> {
  const callable = httpsCallable<
    undefined,
    AccountDeletionStatus
  >(
    functions,
    'getAccountDeletionStatus',
  );

  const result = await callable();

  return result.data;
}

// OPTIONAL: CANCEL REQUEST
export async function cancelAccountDeletion():
  Promise<void> {
  const callable = httpsCallable<
    undefined,
    {cancelled: boolean}
  >(
    functions,
    'cancelAccountDeletion',
  );

  await callable();
}
