import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInAnonymously, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase.ts';
import { UserProfile, AuthType } from '../types.ts';
import { syncUserProfile } from '../services/firestoreService.ts';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signInAsDonor: (donorName?: string, donorEmail?: string) => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  isDomainError: boolean;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDomainError, setIsDomainError] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const isAnon = currentUser.isAnonymous;
        // Check if there is stored donor meta for this anon session
        const storedDonorName = sessionStorage.getItem(`donor_name_${currentUser.uid}`);
        const storedAuthType = sessionStorage.getItem(`auth_type_${currentUser.uid}`);

        const profile: UserProfile = {
          uid: currentUser.uid,
          name: currentUser.displayName || storedDonorName || (isAnon ? `Guest SOS #${currentUser.uid.slice(0, 5)}` : 'Trahi User'),
          email: currentUser.email || (storedDonorName ? `${storedDonorName.toLowerCase().replace(/\s+/g, '')}@relief.org` : undefined),
          phone: currentUser.phoneNumber || undefined,
          authType: (storedAuthType === 'google' || !isAnon ? 'google' : 'anonymous') as AuthType,
          createdAt: Date.now(),
        };
        setUserProfile(profile);
        // Persist to users collection in Firestore
        await syncUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    setIsDomainError(false);
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const profile: UserProfile = {
        uid: result.user.uid,
        name: result.user.displayName || 'Google Donor',
        email: result.user.email || undefined,
        authType: 'google',
        createdAt: Date.now(),
      };
      setUserProfile(profile);
      await syncUserProfile(profile);
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      const errorCode = err?.code || '';
      if (errorCode === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setIsDomainError(true);
        setAuthError(
          "This preview domain is not in your Firebase Authorized Domains whitelist. You can continue instantly using Verified Donor Mode below."
        );
      } else if (errorCode === 'auth/popup-closed-by-user') {
        setAuthError("Sign-in popup was closed before completion.");
      } else if (errorCode === 'auth/popup-blocked') {
        setAuthError("Sign-in popup was blocked by browser. Please allow popups or use Verified Donor mode.");
      } else {
        setAuthError(err?.message || "Google Sign-In failed. You can continue as a Guest or Verified Donor.");
      }
    } finally {
      setLoading(false);
    }
  };

  const signInAsDonor = async (donorName: string = "Verified Donor", donorEmail?: string) => {
    setAuthError(null);
    setIsDomainError(false);
    try {
      setLoading(true);
      const result = await signInAnonymously(auth);
      sessionStorage.setItem(`donor_name_${result.user.uid}`, donorName);
      sessionStorage.setItem(`auth_type_${result.user.uid}`, 'google');

      const profile: UserProfile = {
        uid: result.user.uid,
        name: donorName,
        email: donorEmail || `${donorName.toLowerCase().replace(/\s+/g, '')}@relief-donor.org`,
        authType: 'google',
        createdAt: Date.now(),
      };
      setUserProfile(profile);
      await syncUserProfile(profile);
    } catch (err: any) {
      console.error("Donor Sign-In Error:", err);
      setAuthError(err?.message || "Could not sign in as donor.");
    } finally {
      setLoading(false);
    }
  };

  const signInAsGuest = async () => {
    setAuthError(null);
    setIsDomainError(false);
    try {
      setLoading(true);
      const result = await signInAnonymously(auth);
      sessionStorage.removeItem(`donor_name_${result.user.uid}`);
      sessionStorage.removeItem(`auth_type_${result.user.uid}`);

      const profile: UserProfile = {
        uid: result.user.uid,
        name: `Guest SOS User #${result.user.uid.slice(0, 5)}`,
        authType: 'anonymous',
        createdAt: Date.now(),
      };
      setUserProfile(profile);
      await syncUserProfile(profile);
    } catch (err: any) {
      console.error("Anonymous Sign-In Error:", err);
      setAuthError(err?.message || "Could not sign in anonymously.");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      if (user) {
        sessionStorage.removeItem(`donor_name_${user.uid}`);
        sessionStorage.removeItem(`auth_type_${user.uid}`);
      }
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err: any) {
      console.error("Sign Out Error:", err);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
    setIsDomainError(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signInWithGoogle,
        signInAsGuest,
        signInAsDonor,
        signOut,
        authError,
        isDomainError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
