/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../lib/firebase';
import { firebaseService } from '../services/firebaseService';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      try {
        setUser(u);
        if (u) {
          try {
            let p = await firebaseService.getUserProfile(u.uid);
            if (!p) {
              const newProfile = {
                userId: u.uid,
                displayName: u.displayName || '',
                email: u.email || '',
                photoURL: u.photoURL || '',
                interests: [],
                preferredLanguages: [],
                createdAt: Date.now(),
              };
              await firebaseService.saveUserProfile(newProfile);
              p = await firebaseService.getUserProfile(u.uid);
            }
            setProfile(p);
          } catch (error) {
            console.error("Firestore unreachable, logging in with local-only user:", error);
            // Fallback: use basic user info as profile if firestore is down
            setProfile({
              userId: u.uid,
              displayName: u.displayName || 'User',
              email: u.email || '',
              photoURL: u.photoURL || '',
              interests: [],
              preferredLanguages: [],
              createdAt: Date.now()
            });
          }
        } else {
          setProfile(null);
        }
      } catch (authError) {
        console.error("Auth state change error:", authError);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        alert(`Sign in failed: This domain (${domain}) is not authorized in your Firebase Console.\n\nPlease add "${domain}" to "Authorized domains" under Authentication > Settings in the Firebase Console.`);
      }
      console.error("Sign in failed", error);
    }
  };

  const signInWithGithub = async () => {
    try {
      await signInWithPopup(auth, githubProvider);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        alert(`GitHub Sign in failed: This domain (${domain}) is not authorized in your Firebase Console.\n\nPlease add "${domain}" to "Authorized domains" under Authentication > Settings in the Firebase Console.`);
      }
      console.error("GitHub Sign in failed", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    await firebaseService.saveUserProfile(data);
    const p = await firebaseService.getUserProfile(user.uid);
    setProfile(p);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signInWithGithub, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
