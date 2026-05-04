import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { firebaseService } from '../services/firebaseService';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
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
      setUser(u);
      if (u) {
        let p = await firebaseService.getUserProfile(u.uid);
        if (!p) {
          const newProfile = {
            userId: u.uid,
            displayName: u.displayName,
            email: u.email,
            photoURL: u.photoURL,
            interests: [],
            preferredLanguages: [],
            createdAt: Date.now(),
          };
          await firebaseService.saveUserProfile(newProfile);
          p = await firebaseService.getUserProfile(u.uid);
        }
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign in failed", error);
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
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout, updateProfile }}>
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
