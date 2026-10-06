import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  multiFactor,
  getMultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  type User,
  type MultiFactorError,
  type MultiFactorResolver,
} from '@react-native-firebase/auth';

import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';

// Firebase Authentication
const auth = getAuth();

// Disable real app verification while developing/testing MFA
if (__DEV__) {
  auth.settings.appVerificationDisabledForTesting = true;
}

// Firestore Database
const database = getFirestore();




export const registerUser = async (

  name: string,
  username: string,
  email: string,
  password: string,
) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password,
  );

  
  const user = userCredential.user;

  // Save user information in Firestore
  await setDoc(doc(database, 'users', user.uid), {
    name: name.trim(),
    username: username.trim(),
    email: user.email,
    createdAt: serverTimestamp(),
  });



  // Send email verification
  await sendEmailVerification(user);

  return user;
};



export const resendVerificationEmail = async () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No user is currently signed in.');
  }

  await sendEmailVerification(user);
};

export const checkEmailVerification = async () => {
  const user = auth.currentUser;

  if (!user) {
    return false;
  }

  await reload(user);

  return auth.currentUser?.emailVerified ?? false;
};


export type LoginResult =
  | {
      mfaRequired: false;
      user: User;
    }
  | {
      mfaRequired: true;
      resolver: MultiFactorResolver;
    };

export const loginUser = async (
  email: string,
  password: string,
): Promise<LoginResult> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password,
    );

    return {
      mfaRequired: false,
      user: userCredential.user,
    };
  } catch (error: any) {
    if (error?.code === 'auth/multi-factor-auth-required') {
      const resolver = getMultiFactorResolver(
        auth,
        error as MultiFactorError,
      );

      return {
        mfaRequired: true,
        resolver,
      };
    }

    throw error;
  }
};



export const resetPassword = async (email: string) => {
  const cleanedEmail = email.trim().toLowerCase();

  if (!cleanedEmail) {
    throw new Error('Please enter your email address.');
  }

  await sendPasswordResetEmail(auth, cleanedEmail);
};


export const userHasMFA = (user: User) => {
  return multiFactor(user).enrolledFactors.length > 0;
};


export const startMFAEnrollment = async (
  phoneNumber: string,
) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No user is signed in.');
  }

  await reload(user);

  const refreshedUser = auth.currentUser;

  if (!refreshedUser) {
    throw new Error('Unable to load the current user.');
  }

  if (!refreshedUser.emailVerified) {
    throw new Error(
      'Please verify your email before setting up MFA.',
    );
  }

  const session =
    await multiFactor(refreshedUser).getSession();

  const phoneProvider = new PhoneAuthProvider(auth);

  const verificationId =
    await phoneProvider.verifyPhoneNumber({
      phoneNumber: phoneNumber.trim(),
      session,
    });

  return verificationId;
};

export const confirmMFAEnrollment = async (
  verificationId: string,
  verificationCode: string,
) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No user is signed in.');
  }

  const credential = PhoneAuthProvider.credential(
    verificationId,
    verificationCode.trim(),
  );

  const assertion =
    PhoneMultiFactorGenerator.assertion(credential);


  await multiFactor(user).enroll(
    assertion,
    'IndigiPet Phone',
  );

};


export const startMFALogin = async (
  resolver: MultiFactorResolver,
) => {
  if (resolver.hints.length === 0) {
    throw new Error(
      'No MFA method is available for this account.',
    );
  }

  const phoneProvider = new PhoneAuthProvider(auth);

  
  const verificationId =
    await phoneProvider.verifyPhoneNumber({
      multiFactorHint: resolver.hints[0],
      session: resolver.session,
    });

  return verificationId;
};


export const confirmMFALogin = async (
  resolver: MultiFactorResolver,
  verificationId: string,
  verificationCode: string,
) => {
  const credential = PhoneAuthProvider.credential(
    verificationId,
    verificationCode.trim(),
  );

  const assertion =
    PhoneMultiFactorGenerator.assertion(credential);

  const result =
    await resolver.resolveSignIn(assertion);


  return result.user;
};


export const listenToAuthState = (
  callback: (user: User | null) => void,
) => {
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = () => {
  return auth.currentUser;
};


export const logoutUser = async () => {
  await signOut(auth);
};