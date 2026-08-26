import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase.ts';
import { SOSReport, Donation, UserProfile, DonationStatus, DonorProfile } from '../types.ts';

// Initial dummy donations to seed the Firestore database
export const SEED_DONATIONS: Omit<Donation, 'id'>[] = [
  {
    sosReportId: "SOS-2026-MUM-0891",
    donorName: "Ananya Sharma",
    amount: 5000,
    status: "Utilization Proof",
    timestamp: Date.now() - 3600 * 1000 * 28, // 28 hours ago
    sosLocationName: "Kurla West, Mumbai Flood Rescue",
    purpose: "Lifeboat fuel & emergency dry ration packets for 12 families",
    proofNote: "Invoices verified & geotagged ration drop photo submitted to NDRF portal.",
    paymentMethod: "UPI (Google Pay)"
  },
  {
    sosReportId: "SOS-2026-DEL-1042",
    donorName: "Vikram Malhotra",
    amount: 15000,
    status: "Transferred",
    timestamp: Date.now() - 3600 * 1000 * 14, // 14 hours ago
    sosLocationName: "Yamuna Floodplain Camp, Delhi",
    purpose: "Portable water purifiers & pediatric medical kits",
    proofNote: "Funds transferred to Delhi Red Cross emergency ledger.",
    paymentMethod: "NetBanking (HDFC)"
  },
  {
    sosReportId: "SOS-2026-BLR-0419",
    donorName: "Pooja Reddy",
    amount: 2500,
    status: "Approved",
    timestamp: Date.now() - 3600 * 1000 * 6, // 6 hours ago
    sosLocationName: "Outer Ring Road, Bengaluru",
    purpose: "Emergency ambulance transport & blood oxygen canisters",
    proofNote: "Verified by Trahi Local Volunteer Lead.",
    paymentMethod: "UPI (PhonePe)"
  },
  {
    sosReportId: "SOS-2026-HYD-0723",
    donorName: "Rohan Varma",
    amount: 8000,
    status: "Verifying",
    timestamp: Date.now() - 3600 * 1000 * 2, // 2 hours ago
    sosLocationName: "Old City Urban Waterlogging, Hyderabad",
    purpose: "Emergency tarpaulins and power generators",
    proofNote: "Bank transaction verification in progress.",
    paymentMethod: "Credit Card (ICICI)"
  },
  {
    sosReportId: "SOS-2026-KOL-0211",
    donorName: "Sneha Mukherjee",
    amount: 3500,
    status: "Received",
    timestamp: Date.now() - 600 * 1000 * 15, // 15 mins ago
    sosLocationName: "Howrah Emergency Shelter Ward 4",
    purpose: "Infant nutrition powder & oral rehydration solutions",
    proofNote: "Awaiting gateway reconciliation & local authority clearance.",
    paymentMethod: "UPI (Paytm)"
  }
];

// Seed donations if collection is empty
export async function seedDonationsIfEmpty(): Promise<void> {
  try {
    const donationsRef = collection(db, 'donations');
    const snapshot = await getDocs(donationsRef);
    if (snapshot.empty) {
      console.log("Seeding initial demo donations into Firestore...");
      const batch = writeBatch(db);
      for (const item of SEED_DONATIONS) {
        const newDoc = doc(donationsRef);
        batch.set(newDoc, item);
      }
      await batch.commit();
      console.log("Seeded 5 dummy donations successfully.");
    }
  } catch (error) {
    console.warn("Could not auto-seed donations (permissions or network):", error);
  }
}

// User Profile Firestore Sync & Fetch
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        userId: data.userId || userId,
        uid: userId,
        name: data.name || 'Trahi User',
        age: data.age !== undefined ? data.age : '',
        gender: data.gender || '',
        bloodGroup: data.bloodGroup || '',
        profilePictureUrl: data.profilePictureUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${userId}`,
        phone: data.phone || '',
        email: data.email || '',
        authType: data.authType || 'anonymous',
        location: data.location || {
          latitude: 0,
          longitude: 0,
          district: '',
          block: '',
          pincode: '',
          state: ''
        },
        profileCompleted: Boolean(data.profileCompleted),
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || undefined,
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch user profile from Firestore:", error);
    return null;
  }
}

// User Profile Firestore Initial Sync (called after auth state is established)
export async function syncUserProfile(profile: Partial<UserProfile> & { userId: string; uid?: string }): Promise<UserProfile> {
  const effectiveUid = profile.userId || profile.uid || '';
  try {
    const userDocRef = doc(db, 'users', effectiveUid);
    const existing = await getDoc(userDocRef);

    if (existing.exists()) {
      const data = existing.data();
      return {
        userId: effectiveUid,
        uid: effectiveUid,
        name: data.name || profile.name || 'Trahi User',
        age: data.age !== undefined ? data.age : '',
        gender: data.gender || '',
        bloodGroup: data.bloodGroup || '',
        profilePictureUrl: data.profilePictureUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${effectiveUid}`,
        phone: data.phone || profile.phone || '',
        email: data.email || profile.email || '',
        authType: data.authType || profile.authType || 'anonymous',
        location: data.location || profile.location || {
          latitude: 0,
          longitude: 0,
          district: '',
          block: '',
          pincode: '',
          state: ''
        },
        profileCompleted: Boolean(data.profileCompleted),
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || undefined,
      };
    } else {
      const defaultProfile: UserProfile = {
        userId: effectiveUid,
        uid: effectiveUid,
        name: profile.name || 'Trahi User',
        age: profile.age || '',
        gender: profile.gender || '',
        bloodGroup: profile.bloodGroup || '',
        profilePictureUrl: profile.profilePictureUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${effectiveUid}`,
        phone: profile.phone || '',
        email: profile.email || '',
        authType: profile.authType || 'anonymous',
        location: profile.location || {
          latitude: 0,
          longitude: 0,
          district: '',
          block: '',
          pincode: '',
          state: ''
        },
        profileCompleted: false, // Default false
        createdAt: profile.createdAt || Date.now(),
      };

      await setDoc(userDocRef, {
        userId: effectiveUid,
        name: defaultProfile.name,
        age: defaultProfile.age ? Number(defaultProfile.age) : 0,
        gender: defaultProfile.gender,
        bloodGroup: defaultProfile.bloodGroup,
        profilePictureUrl: defaultProfile.profilePictureUrl,
        location: defaultProfile.location,
        profileCompleted: false,
        authType: defaultProfile.authType,
        createdAt: defaultProfile.createdAt,
      });

      return defaultProfile;
    }
  } catch (error) {
    console.error("Failed to sync user profile in Firestore:", error);
    return {
      userId: effectiveUid,
      uid: effectiveUid,
      name: profile.name || 'Trahi User',
      profileCompleted: false,
      createdAt: Date.now(),
      authType: profile.authType || 'anonymous',
    };
  }
}

// Explicitly save/update user profile in Firestore
export async function saveUserProfileToFirestore(
  profileData: Partial<UserProfile> & { userId: string }
): Promise<void> {
  const userDocRef = doc(db, 'users', profileData.userId);
  
  const payload: any = {
    userId: profileData.userId,
    name: profileData.name || 'Trahi User',
    age: profileData.age ? Number(profileData.age) : 0,
    gender: profileData.gender || '',
    bloodGroup: profileData.bloodGroup || '',
    profilePictureUrl: profileData.profilePictureUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${profileData.userId}`,
    location: {
      latitude: profileData.location?.latitude ? Number(profileData.location.latitude) : 0,
      longitude: profileData.location?.longitude ? Number(profileData.location.longitude) : 0,
      district: profileData.location?.district || '',
      block: profileData.location?.block || '',
      pincode: profileData.location?.pincode || '',
      state: profileData.location?.state || '',
    },
    profileCompleted: true,
    updatedAt: Date.now(),
  };

  if (profileData.phone !== undefined) payload.phone = profileData.phone;
  if (profileData.email !== undefined) payload.email = profileData.email;
  if (profileData.authType !== undefined) payload.authType = profileData.authType;

  // Use setDoc with merge: true to avoid deleting createdAt if document exists
  await setDoc(userDocRef, payload, { merge: true });
}

// Create an SOS distress report in Firestore
export async function createSOSReport(report: Omit<SOSReport, 'id'>): Promise<string> {
  const sosCollection = collection(db, 'sos_reports');
  const docRef = await addDoc(sosCollection, {
    ...report,
    voiceUrl: null, // As requested: leave voiceUrl as null for now
    timestamp: report.timestamp || Date.now()
  });
  return docRef.id;
}

// Create a new donation record
export async function createDonation(donation: Omit<Donation, 'id'>): Promise<string> {
  const donationsRef = collection(db, 'donations');
  const docRef = await addDoc(donationsRef, {
    ...donation,
    timestamp: donation.timestamp || Date.now()
  });
  return docRef.id;
}

// Update donation status
export async function updateDonationStatus(donationId: string, newStatus: DonationStatus): Promise<void> {
  const donationRef = doc(db, 'donations', donationId);
  await updateDoc(donationRef, {
    status: newStatus
  });
}

// Realtime subscription to donations collection
export function subscribeToDonations(callback: (donations: Donation[]) => void): () => void {
  seedDonationsIfEmpty();
  const donationsRef = collection(db, 'donations');
  const q = query(donationsRef, orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items: Donation[] = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as Donation);
    });
    callback(items);
  }, (err) => {
    console.error("Error subscribing to donations:", err);
  });
}

// Fetch verified donor profile from Firestore
export async function fetchDonorProfile(userId: string): Promise<DonorProfile | null> {
  try {
    const donorDocRef = doc(db, 'donors', userId);
    const snap = await getDoc(donorDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: snap.id,
        userId: data.userId || userId,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        city: data.city || '',
        state: data.state || '',
        preferredCauses: data.preferredCauses || [],
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || undefined,
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch donor profile from Firestore:", error);
    return null;
  }
}

// Save or update verified donor profile in Firestore
export async function saveDonorProfile(donor: DonorProfile): Promise<void> {
  const donorDocRef = doc(db, 'donors', donor.userId);
  const payload: any = {
    userId: donor.userId,
    name: donor.name,
    email: donor.email,
    phone: donor.phone,
    city: donor.city || '',
    state: donor.state || '',
    preferredCauses: donor.preferredCauses || [],
    createdAt: donor.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  await setDoc(donorDocRef, payload, { merge: true });
}
