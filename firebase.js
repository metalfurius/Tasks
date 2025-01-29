// firebase.js
const firebaseConfig = {
    apiKey: "AIzaSyBNEQqC00bAupyv6L_lDJDvvi8vDGU3rO0",
    authDomain: "tasks-dfce4.firebaseapp.com",
    projectId: "tasks-dfce4",
    storageBucket: "tasks-dfce4.firebasestorage.app",
    messagingSenderId: "1010889254813",
    appId: "1:1010889254813:web:bbcb772c978c94816a3174"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db };