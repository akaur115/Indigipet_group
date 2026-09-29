import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  type User,
} from '@react-native-firebase/auth';

import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';

// Firebase Authentication
const auth = getAuth();

// Firestore Database
const database = getFirestore();

// Register a new user
export const registerUser = async (
  name: string,
  username: string,
  email: string,
  password: string,
) => {
  console.log('STEP 1 - Starting Authentication');

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password,
  );

  console.log('STEP 2 - Authentication SUCCESS');

  const user = userCredential.user;

  console.log('STEP 3 - Starting Firestore save');

  await setDoc(doc(database, 'users', user.uid), {
    name: name.trim(),
    username: username.trim(),
    email: user.email,
    createdAt: serverTimestamp(),
  });

  console.log('STEP 4 - Firestore SUCCESS');

  return user;
};


export const loginUser = async (
  email: string,
  password: string,
) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password,
  );

  return userCredential.user;
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