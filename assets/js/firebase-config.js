import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBOVvfW63xx10C4_l9obcQMC64cDFGndZ8",
    authDomain: "smart-quiz-system-d59d9.firebaseapp.com",
    databaseURL: "https://smart-quiz-system-d59d9-default-rtdb.firebaseio.com",
    projectId: "smart-quiz-system-d59d9",
    storageBucket: "smart-quiz-system-d59d9.firebasestorage.app",
    messagingSenderId: "38603211706",
    appId: "1:38603211706:web:57b1e7a3d48426544ad383"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

export { app, auth, db, storage };
