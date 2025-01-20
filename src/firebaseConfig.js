// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAfxOAYR_vLGR_y0OAVzFb-SHuya2D_sjE",
    authDomain: "project-dm-helper.firebaseapp.com",
    projectId: "project-dm-helper",
    storageBucket: "project-dm-helper.firebasestorage.app",
    messagingSenderId: "803001985782",
    appId: "1:803001985782:web:d233ad4ae12d83ab519ad7",
    measurementId: "G-RQYRM1GX9R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Debug logging
console.log('🔥 Firebase Status:', {
    hasAuth: !!auth,
    hasDB: !!db,
    currentUser: auth.currentUser?.email,
    dbType: db?.type,
    projectId: firebaseConfig.projectId
});

const isInitialized = new Promise(resolve => {
    auth.onAuthStateChanged((user) => {
        console.log('🔥 Auth state changed:', user?.email);
        resolve(true);
    });
});

export { auth, db, isInitialized };
