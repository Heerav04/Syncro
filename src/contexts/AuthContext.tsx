'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { CustomClaims, UserRole } from '@/types';

interface AuthContextType {
  user: FirebaseUser | null;
  claims: CustomClaims | null;
  loading: boolean;
  idToken: string | null;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [claims, setClaims] = useState<CustomClaims | null>(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          setIdToken(token);

          // Extract custom claims from the token
          const decodedToken = await firebaseUser.getIdTokenResult();
          const role = decodedToken.claims.role as UserRole | undefined;
          const tokenCompanyId = decodedToken.claims.companyId as string | undefined;

          if (tokenCompanyId) {
            setClaims({
              companyId: tokenCompanyId,
              role: role || 'member',
              teamId: (decodedToken.claims.teamId as string) || undefined,
            });
            return;
          }

          const fallbackCompanyId = window.localStorage.getItem('collabwork.companyId');
          if (fallbackCompanyId) {
            const profile = await getDoc(
              doc(db, 'companies', fallbackCompanyId, 'users', firebaseUser.uid)
            );
            if (profile.exists()) {
              const data = profile.data() as CustomClaims;
              setClaims({
                companyId: fallbackCompanyId,
                role: data.role || 'member',
                teamId: data.teamId || undefined,
              });
              return;
            }
          }

          setClaims(null);
        } catch (error) {
          console.error('Error getting token:', error);
          setClaims(null);
          setIdToken(null);
        }
      } else {
        setClaims(null);
        setIdToken(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      const token = await user.getIdToken(true);
      setIdToken(token);
      return token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setClaims(null);
      setIdToken(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, claims, loading, idToken, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 * Must be used inside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
