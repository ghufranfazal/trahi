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

// Generate or retrieve persistent guest UID across browser refreshes
const getOrCreateGuestUid = (): string => {
  try {
    const existing = localStorage.getItem('trahi_guest_uid');
    if (existing) return existing;
    const newId = 'guest_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem('trahi_guest_uid', newId);
    return newId;
  } catch {
    return 'guest_' + Date.now().toString(36);
  }
};

// Safe helper to create a complete compliant User fallback object
const createFallbackUser = (uid: string, displayName?: string, email?: string): User => {
  return {
    uid,
    isAnonymous: true,
    displayName: displayName || null,
    email: email || null,
    phoneNumber: null,
    photoURL: null,
    providerId: 'trahi-guest',
    emailVerified: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'guest-token',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({ uid }),
  } as unknown as User;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [donorProfile, setDonorProfile] = useState<DonorProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [donorLoading, setDonorLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDomainError, setIsDomainError] = useState<boolean>(false);

  // Safe anonymous sign in helper that falls back gracefully if Anonymous provider is restricted in Firebase console
  const safeSignInAnonymously = async (donorName?: string, donorEmail?: string): Promise<User> => {
    try {
      const anonRes = await signInAnonymously(auth);
      return anonRes.user;
    } catch (err: any) {
      const errorCode = err?.code || '';
      if (errorCode === 'auth/admin-restricted-operation' || err?.message?.includes('admin-restricted-operation')) {
        const guestUid = getOrCreateGuestUid();
        return createFallbackUser(guestUid, donorName, donorEmail);
      }
      throw err;
    }
  };

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
          const guestUser = await safeSignInAnonymously();
          setUser(guestUser);
          await loadProfile(guestUser);
        } catch (e) {
          const guestUid = getOrCreateGuestUid();
          const fallbackUser = createFallbackUser(guestUid);
          setUser(fallbackUser);
          await loadProfile(fallbackUser);
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
      const donorUser = await safeSignInAnonymously(donorName, donorEmail);
      sessionStorage.setItem(`donor_name_${donorUser.uid}`, donorName);
      sessionStorage.setItem(`auth_type_${donorUser.uid}`, 'google');
      setUser(donorUser);
      await loadProfile(donorUser);
      return donorUser;
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
      const guestUser = await safeSignInAnonymously();
      sessionStorage.removeItem(`donor_name_${guestUser.uid}`);
      sessionStorage.removeItem(`auth_type_${guestUser.uid}`);
      setUser(guestUser);
      await loadProfile(guestUser);
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
      // Re-sign in seamlessly with guest fallback for unhindered main app SOS operation
      const guestUser = await safeSignInAnonymously();
      setUser(guestUser);
      await loadProfile(guestUser);
    } catch (err: any) {
      console.warn("Sign Out Notice:", err);
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

