import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyC7IaK8e0JimVT2DeKQovTDLPyufibEu_4",
    authDomain: "sunsar-bingo.firebaseapp.com",
    projectId: "sunsar-bingo",
    storageBucket: "sunsar-bingo.firebasestorage.app",
    messagingSenderId: "256131852935",
    appId: "1:256131852935:web:fe514c1e6758e5af252622"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
