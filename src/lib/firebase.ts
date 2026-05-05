import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
interface ExtendedConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as ExtendedConfig).firestoreDatabaseId);
export const auth = getAuth(app);

// Validate Connection to Firestore
async function testConnection() {
  if (typeof window === 'undefined') return;
  try {
    // We use a dummy path to test connection
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Firestore connection successful");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firestore Error: The client is offline or misconfigured. Please check your Firebase configuration.");
    } else {
      // Ignore permission errors during connection test if expected
      console.log("Firestore connection test ping finished (may show permissions error which is expected for dummy paths)");
    }
  }
}
testConnection();

// Log the current domain to help user configure Firebase authorized domains
if (typeof window !== 'undefined') {
  console.info(`[Firebase Config] Current domain: ${window.location.hostname}`);
  console.info(`[Firebase Config] If you see 'unauthorized-domain' error, add '${window.location.hostname}' to 'Authorized domains' in your Firebase Console (Authentication > Settings).`);
}

export const analytics = typeof window !== 'undefined' ? (() => {
  try {
    return getAnalytics(app);
  } catch {
    return null;
  }
})() : null;

export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
