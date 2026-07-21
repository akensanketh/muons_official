let membersUnsub = null;
let membersCache = [];
let membersVisibleLimit = 24; // how many cards to show initially

// Firebase Configuration

const firebaseConfig = {
    apiKey: "AIzaSyD6-ND4S-O4X--Eu_25_AOnyyPrLLtf4NM",
    authDomain: "muons-463c3.firebaseapp.com",
    projectId: "muons-463c3",
    storageBucket: "muons-463c3.firebasestorage.app",
    messagingSenderId: "475857658884",
    appId: "1:475857658884:web:fe76445e34ac82bae44151"
};

console.log('🔥 Loading Firebase...');

try {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized');
} catch (error) {
    console.error('❌ Firebase error:', error);
}

const auth = firebase.auth();
const db = firebase.firestore();

console.log('✅ Firebase config loaded');