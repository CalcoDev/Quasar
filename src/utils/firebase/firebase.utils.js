import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAU6p_V8CJ69QegoN0zlgnNpc7NIICs0JA",
  authDomain: "quasar-73bd6.firebaseapp.com",
  projectId: "quasar-73bd6",
  storageBucket: "quasar-73bd6.appspot.com",
  messagingSenderId: "211126134976",
  appId: "1:211126134976:web:8b653c5b8b931914dfe525",
  measurementId: "G-5CC44JH7WR",
};

const app = initializeApp(firebaseConfig);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export const auth = getAuth();
export const db = getFirestore();

export const signInWithGooglePopup = async (setUser) => {
  let a = await signInWithPopup(auth, googleProvider);

  if (a.user) {
    setUser({
      loggedIn: true,
      currentUser: {
        name: a.user.displayName,
        id: a.user.uid,
        imageUrl: a.user.photoURL,
      },
    });

    const usersRef = collection(db, "users");
    const userDoc = doc(db, "users", a.user.uid);

    if (!(await getDoc(userDoc)).exists()) {
      await setDoc(userDoc, {
        name: a.user.displayName,
        id: a.user.uid,
        imageUrl: a.user.photoURL,
        decks: [],
      });
    }

    return true;
  }

  return false;
};
export const signInWithGoogleRedirect = async (setUser) => {
  let a = await signInWithRedirect(auth, googleProvider);

  setUser(a);
};

export const signOutUser = async (setUser) => {
  console.log("Trying to sign out.");

  await signOut(auth);

  setUser({
    loggedIn: false,
    currentUser: {
      name: "",
      id: "",
      imageUrl: "",
    },
  });
};
