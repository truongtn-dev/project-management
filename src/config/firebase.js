// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
export const firebaseConfig = {
    apiKey: "AIzaSyAKSNs-jaZupTBHr_Xyo_9CHvGuX8CqRcQ",
    authDomain: "orcax-group.firebaseapp.com",
    projectId: "orcax-group",
    storageBucket: "orcax-group.firebasestorage.app",
    messagingSenderId: "338750600369",
    appId: "1:338750600369:web:b6f6880931c98450d19e90"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
