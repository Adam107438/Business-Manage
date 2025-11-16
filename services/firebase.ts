// This file configures the connection to your Firebase project.
// Firebase is a backend-as-a-service platform from Google that provides
// features like authentication, cloud database (Firestore), and more.
// By using Firebase, this app can sync your data across all your devices in real-time.

// --- ACTION REQUIRED ---
// To enable cloud data synchronization, you need to:
// 1. Create a FREE Firebase project at https://firebase.google.com/
// 2. In your project, go to Project Settings > General.
// 3. Under "Your apps", click the web icon (</>) to create a new web app.
// 4. Give it a name and Firebase will provide you with a `firebaseConfig` object.
// 5. Copy that object and paste it below, replacing the placeholder values.

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfKQE6LpDgqKEX4LPc_ZMuweWjSRcOMbg",
  authDomain: "my-inventory-app-9c421.firebaseapp.com",
  projectId: "my-inventory-app-9c421",
  storageBucket: "my-inventory-app-9c421.appspot.com",
  messagingSenderId: "1049180648295",
  appId: "1:1049180648295:web:4ac20fb91b83825142f5c2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the auth service
export const auth = getAuth(app);

// Get a reference to the Firestore database service
export const db = getFirestore(app);