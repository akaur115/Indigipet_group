'use strict';

// IndigiPet: 30-day account deletion workflow.
// Default: NO recovery or cancellation.

const {initializeApp} = require('firebase-admin/app');
const {
  getFirestore,
  Timestamp,
} = require('firebase-admin/firestore');
const {getAuth} = require('firebase-admin/auth');
const {
  onCall,
  HttpsError,
} = require('firebase-functions/v2/https');
const {onSchedule} = require('firebase-functions/v2/scheduler');
const logger = require('firebase-functions/logger');

initializeApp();

const db = getFirestore();
const auth = getAuth();

const REGION = 'us-central1';
const REQUESTS = 'accountDeletionRequests';

const DAY_MS = 24 * 60 * 60 * 1000;

// Run at 29 days, leaving a buffer before Day 30.
const RETENTION_MS = 29 * DAY_MS;

const REQUIRE_RECENT_LOGIN_SECONDS = 5 * 60;

// Only enable if the client approves recovery.
const ALLOW_CANCELLATION = false;

const PROCESSING_RETRY_MS = 20 * 60 * 1000;

// REQUIRE AUTHENTICATED USER
function requireSignedIn(request) {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError(
      'unauthenticated',
      'Please sign in first.',
    );
  }

  return uid;
}

// REQUIRE RECENT SIGN-IN
function requireRecentLogin(request) {
  const authTime = Number(
    request.auth?.token?.auth_time,
  );

  const ageSeconds =
    Math.floor(Date.now() / 1000) - authTime;

  if (
    !Number.isFinite(authTime) ||
    ageSeconds < 0 ||
    ageSeconds > REQUIRE_RECENT_LOGIN_SECONDS
  ) {
    throw new HttpsError(
      'failed-precondition',
      'For security, please sign out and sign back in, then request deletion again.',
    );
  }
}

// DELETION REQUEST DOCUMENT
function requestRef(uid) {
  return db.collection(REQUESTS).doc(uid);
}

// PUBLIC STATUS RESPONSE
function presentStatus(data) {
  return {
    status:
      data?.status === 'deleting'
        ? 'deleting'
        : 'pending',

    deleteAt:
      data?.deleteAt
        ?.toDate()
        ?.toISOString() || null,

    cancellationAllowed:
      ALLOW_CANCELLATION &&
      data?.status === 'pending',
  };
}

// FUNCTION 1: REQUEST ACCOUNT DELETION
exports.requestAccountDeletion = onCall(
  {region: REGION},
  async request => {
    const uid = requireSignedIn(request);

    requireRecentLogin(request);

    const ref = requestRef(uid);
    const now = Date.now();

    const status = await db.runTransaction(
      async tx => {
        const existing = await tx.get(ref);

        if (existing.exists) {
          return presentStatus(
            existing.data(),
          );
        }

        const deleteAt =
          Timestamp.fromMillis(
            now + RETENTION_MS,
          );

        tx.create(ref, {
          status: 'pending',
          requestedAt:
            Timestamp.fromMillis(now),
          deleteAt,
        });

        return {
          status: 'pending',
          deleteAt:
            deleteAt
              .toDate()
              .toISOString(),
          cancellationAllowed:
            ALLOW_CANCELLATION,
        };
      },
    );

    logger.info(
      'Account deletion request registered',
      {uid},
    );

    return status;
  },
);

// FUNCTION 2: CHECK ACCOUNT DELETION STATUS
exports.getAccountDeletionStatus = onCall(
  {region: REGION},
  async request => {
    const uid = requireSignedIn(request);

    const snap = await requestRef(
      uid,
    ).get();

    if (!snap.exists) {
      return {
        status: 'none',
        deleteAt: null,
        cancellationAllowed: false,
      };
    }

    return presentStatus(
      snap.data(),
    );
  },
);

// FUNCTION 3: OPTIONAL CANCELLATION
// Disabled unless approved by client.
exports.cancelAccountDeletion = onCall(
  {region: REGION},
  async request => {
    const uid = requireSignedIn(request);

    requireRecentLogin(request);

    if (!ALLOW_CANCELLATION) {
      throw new HttpsError(
        'failed-precondition',
        'Cancellation is not enabled for this app.',
      );
    }

    const ref = requestRef(uid);

    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);

      if (
        !snap.exists ||
        snap.data().status !== 'pending'
      ) {
        throw new HttpsError(
          'failed-precondition',
          'The request cannot be cancelled.',
        );
      }

      if (
        snap
          .data()
          .deleteAt.toMillis() <=
        Date.now()
      ) {
        throw new HttpsError(
          'failed-precondition',
          'Deletion processing has begun.',
        );
      }

      tx.delete(ref);
    });

    return {cancelled: true};
  },
);

// MARK ACCOUNT FOR DELETION
async function claimForDeletion(ref) {
  return db.runTransaction(async tx => {
    const snap = await tx.get(ref);

    if (!snap.exists) {
      return false;
    }

    const data = snap.data();

    if (
      !data.deleteAt ||
      data.deleteAt.toMillis() >
        Date.now()
    ) {
      return false;
    }

    if (
      data.status !== 'pending' &&
      data.status !== 'deleting'
    ) {
      return false;
    }

    if (
      data.status === 'deleting' &&
      data.processingAt?.toMillis() >
        Date.now() -
          PROCESSING_RETRY_MS
    ) {
      return false;
    }

    tx.update(ref, {
      status: 'deleting',
      processingAt: Timestamp.now(),
    });

    return true;
  });
}

// FUNCTION 4: AUTOMATIC DELETION
// Runs hourly even when the app is closed.
exports.purgeDeletedAccounts = onSchedule(
  {
    region: REGION,
    schedule: 'every 1 hours',
    timeZone: 'Etc/UTC',
    timeoutSeconds: 540,
    memory: '512MiB',
  },
  async () => {
    let cursor = null;

    // Process up to 500 requests per run.
    for (
      let page = 0;
      page < 5;
      page += 1
    ) {
      let query = db
        .collection(REQUESTS)
        .where(
          'deleteAt',
          '<=',
          Timestamp.now(),
        )
        .orderBy('deleteAt')
        .limit(100);

      if (cursor) {
        query = query.startAfter(cursor);
      }

      const batch = await query.get();

      if (batch.empty) {
        break;
      }

      for (const doc of batch.docs) {
        const uid = doc.id;

        try {
          const claimed =
            await claimForDeletion(
              doc.ref,
            );

          if (!claimed) {
            continue;
          }

          // Delete user document and subcollections.
          await db.recursiveDelete(
            db.collection('users').doc(uid),
          );

          // Delete Firebase Authentication account.
          try {
            await auth.deleteUser(uid);
          } catch (error) {
            if (
              error.code !==
              'auth/user-not-found'
            ) {
              throw error;
            }
          }

          // Remove completed deletion request.
          await doc.ref.delete();

          logger.info(
            'Account deletion completed',
            {uid},
          );
        } catch (error) {
          logger.error(
            'Account deletion failed; automatic retry scheduled',
            {
              uid,
              message: error.message,
            },
          );
        }
      }

      cursor =
        batch.docs[
          batch.docs.length - 1
        ];

      if (batch.size < 100) {
        break;
      }
    }
  },
);
