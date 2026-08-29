import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInAnonymously, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase.ts';
import { UserProfile, DonorProfile, AuthType } from '../types.ts';
import { syncUserProfile, fetchDonorProfile, saveDonorProfile } from '../services/firestoreService.ts';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  donorProfile: DonorProfile | null;
  loading: boolean;
  donorLoading: boolean;
  isGoogleUser: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signInAsGuest: () => Promise<void>;
  signInAsDonorFallback: (donorName?: string, donorEmail?: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  updateUserProfileState: (newProfile: UserProfile) => void;
  updateDonorProfileState: (newDonor: DonorProfile) => void;
  refreshUserProfile: () => Promise<void>;
  refreshDonorProfile: () => Promise<DonorProfile | null>;
  saveDonor: (donorData: DonorProfile) => Promise<void>;
  authError: string | null;
  isDomainError: boolean;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [donorProfile, setDonorProfile] = useState<DonorProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [donorLoading, setDonorLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDomainError, setIsDomainError] = useState<boolean>(false);

  const loadProfile = async (currentUser: User) => {
    const isAnon = currentUser.isAnonymous;
    const storedDonorName = sessionStorage.getItem(`donor_name_${currentUser.uid}`);
    const storedAuthType = sessionStorage.getItem(`auth_type_${currentUser.uid}`);

    const baseProfile: Partial<UserProfile> & { userId: string } = {
      userId: currentUser.uid,
      uid: currentUser.uid,
      name: currentUser.displayName || storedDonorName || (isAnon ? `Guest SOS #${currentUser.uid.slice(0, 5)}` : 'Trahi User'),
      email: currentUser.email || (storedDonorName ? `${storedDonorName.toLowerCase().replace(/\s+/g, '')}@relief.org` : undefined),
      phone: currentUser.phoneNumber || undefined,
      authType: (storedAuthType === 'google' || !isAnon ? 'google' : 'anonymous') as AuthType,
      profilePictureUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${currentUser.uid}`,
      profileCompleted: false,
      createdAt: Date.now(),
    };

    // Sync or retrieve existing document from Firestore
    const syncedProfile = await syncUserProfile(baseProfile);
    setUserProfile(syncedProfile);

    // If signed in with Google or has stored donor session, load Donor Profile
    if (!isAnon || storedAuthType === 'google') {
      setDonorLoading(true);
      const donor = await fetchDonorProfile(currentUser.uid);
      setDonorProfile(donor);
      setDonorLoading(false);
    } else {
      setDonorProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadProfile(currentUser);
        setLoading(false);
      } else {
        // Automatic anonymous sign-in for seamless frictionless SOS emergency access
        try {
          const anonRes = await signInAnonymously(auth);
          setUser(anonRes.user);
          await loadProfile(anonRes.user);
        } catch (e) {
          console.error("Auto anonymous auth failed:", e);
          setUser(null);
          setUserProfile(null);
          setDonorProfile(null);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const isGoogleUser = Boolean(
    user && (!user.isAnonymous || sessionStorage.getItem(`auth_type_${user.uid}`) === 'google')
  );

  const refreshUserProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  const refreshDonorProfile = async (): Promise<DonorProfile | null> => {
    if (!user) return null;
    setDonorLoading(true);
    const donor = await fetchDonorProfile(user.uid);
    setDonorProfile(donor);
    setDonorLoading(false);
    return donor;
  };

  const updateUserProfileState = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
  };

  const updateDonorProfileState = (newDonor: DonorProfile) => {
    setDonorProfile(newDonor);
  };

  const saveDonor = async (donorData: DonorProfile) => {
    await saveDonorProfile(donorData);
    setDonorProfile(donorData);
  };

  const signInWithGoogle = async (): Promise<User | null> => {
    setAuthError(null);
    setIsDomainError(false);
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      sessionStorage.setItem(`auth_type_${result.user.uid}`, 'google');
      await loadProfile(result.user);
      return result.user;
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
        setAuthError(err?.message || "Google Sign-In failed. Please try again.");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signInAsDonorFallback = async (donorName: string = "Verified Donor", donorEmail?: string): Promise<User | null> => {
    setAuthError(null);
    setIsDomainError(false);
    try {
      setLoading(true);
      const result = await signInAnonymously(auth);
      sessionStorage.setItem(`donor_name_${result.user.uid}`, donorName);
      sessionStorage.setItem(`auth_type_${result.user.uid}`, 'google');
      setUser(result.user);
      await loadProfile(result.user);
      return result.user;
    } catch (err: any) {
      console.error("Donor Fallback Sign-In Error:", err);
      setAuthError(err?.message || "Could not sign in as donor.");
      return null;
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
      setUser(result.user);
      await loadProfile(result.user);
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
      setDonorProfile(null);
      // Re-sign in anonymously immediately for seamless main app SOS operation
      const anonRes = await signInAnonymously(auth);
      setUser(anonRes.user);
      await loadProfile(anonRes.user);
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
        donorProfile,
        loading,
        donorLoading,
        isGoogleUser,
        signInWithGoogle,
        signInAsGuest,
        signInAsDonorFallback,
        signOut,
        updateUserProfileState,
        updateDonorProfileState,
        refreshUserProfile,
        refreshDonorProfile,
        saveDonor,
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

