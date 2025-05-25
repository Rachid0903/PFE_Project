
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAsDe3wHsE1Xbki3Csggqd5r8FojFnE6-c",
  authDomain: "iot-rachid-default-rtdb.europe-west1.firebasedatabase.app",
  databaseURL: "https://iot-rachid-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "iot-rachid",
  storageBucket: "iot-rachid.appspot.com",
  messagingSenderId: "your-messaging-sender-id", // Replace if you have this
  appId: "your-app-id" // Replace if you have this
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export { database, auth };
