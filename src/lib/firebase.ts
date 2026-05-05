import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings that are more robust in browser environments
// Long polling can help when websockets are blocked or unstable in iframes
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export const auth = getAuth(app);

// Log the current domain to help user configure Firebase authorized domains
if (typeof window !== 'undefined') {
  console.info(`[Firebase Config] Current domain: ${window.location.hostname}`);
  console.info(`[Firebase Config] If you see 'unauthorized-domain' error, add '${window.location.hostname}' to 'Authorized domains' in your Firebase Console (Authentication > Settings).`);
}

export const analytics = typeof window !== 'undefined' ? (() => {
  try {
    return getAnalytics(app);
  } catch (e) {
    console.warn("Analytics initialization failed:", e);
    return null;
  }
})() : null;

export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
