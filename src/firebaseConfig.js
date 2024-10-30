// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
    apiKey: "AIzaSyDC__zZlDtQET57C2t-H_oAvZc8WgpWDD8",
    authDomain: "project-dm-helper.firebaseapp.com",
    projectId: "project-dm-helper",
    storageBucket: "project-dm-helper.firebasestorage.app",
    messagingSenderId: "803001985782",
    appId: "1:803001985782:web:d233ad4ae12d83ab519ad7",
    measurementId: "G-RQYRM1GX9R"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
