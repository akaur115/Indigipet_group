import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
  // Create an account using Firebase Authentication
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password,
  );

  const user = userCredential.user;

  // Save the user's information in Firestore
  await setDoc(doc(database, 'users', user.uid), {
    name: name.trim(),
    username: username.trim(),
    email: user.email,
    createdAt: serverTimestamp(),
  });

  return user;
};

// Login an existing user
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