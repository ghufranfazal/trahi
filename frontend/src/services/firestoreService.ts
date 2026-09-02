import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase.ts';
import { SOSReport, Donation, UserProfile, DonationStatus, DonorProfile, SafetyCircleMember, SafetyStatus } from '../types.ts';

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

// Initial sample SOS distress beacons across India
const INITIAL_SAMPLE_SOS_REPORTS: Omit<SOSReport, 'id'>[] = [
  {
    userId: "trahi_anon_wayanad_01",
    voiceUrl: null,
    transcript: "Flash flood water reached 1st floor near Meppadi bridge. 14 residents including children need immediate inflatable boat evacuation.",
    latitude: 11.5540,
    longitude: 76.1264,
    timestamp: Date.now() - 1000 * 60 * 45, // 45 mins ago
    status: "active",
    userAddress: "Meppadi Bridge Sector 3, Wayanad, Kerala - 673577"
  },
  {
    userId: "trahi_anon_assam_02",
    voiceUrl: null,
    transcript: "Brahmaputra overflow breached protective bund. 40 families stranded on high embankment, clean drinking water & dry rations needed.",
    latitude: 26.5775,
    longitude: 93.1711,
    timestamp: Date.now() - 1000 * 60 * 180, // 3 hours ago
    status: "responding",
    userAddress: "Kaziranga North Sector, Golaghat, Assam - 785609"
  },
  {
    userId: "trahi_anon_mumbai_03",
    voiceUrl: null,
    transcript: "Severe urban waterlogging near Kurla railway line, 3 feet standing water. Urgent insulin & medical assistance needed for elderly citizen.",
    latitude: 19.0657,
    longitude: 72.8794,
    timestamp: Date.now() - 1000 * 60 * 300, // 5 hours ago
    status: "active",
    userAddress: "LBS Marg near Kurla Depot, Mumbai, Maharashtra - 400070"
  },
  {
    userId: "trahi_anon_delhi_04",
    voiceUrl: null,
    transcript: "Yamuna floodplain relief shelter flooded. Requesting urgent emergency blankets, tarpaulins, and pediatric oral rehydration packets.",
    latitude: 28.6180,
    longitude: 77.2650,
    timestamp: Date.now() - 1000 * 60 * 720, // 12 hours ago
    status: "responding",
    userAddress: "Yamuna Khadar Relief Camp, East Delhi - 110091"
  },
  {
    userId: "trahi_anon_mandi_05",
    voiceUrl: null,
    transcript: "Heavy rainfall triggered rockfall blocking access road. Local clinic running low on first-aid trauma supplies.",
    latitude: 31.7087,
    longitude: 76.9320,
    timestamp: Date.now() - 1000 * 60 * 1440, // 24 hours ago
    status: "resolved",
    userAddress: "Pandoh Valley Road, Mandi, Himachal Pradesh - 175001"
  },
  {
    userId: "trahi_anon_cuttack_06",
    voiceUrl: null,
    transcript: "Mahanadi canal overflow in low-lying settlement. Community kitchen requiring grain supplies and solar emergency lights.",
    latitude: 20.4625,
    longitude: 85.8828,
    timestamp: Date.now() - 1000 * 60 * 90, // 1.5 hours ago
    status: "active",
    userAddress: "Jobra Barrage Lowland Colony, Cuttack, Odisha - 753003"
  }
];

// Seed SOS reports if collection is empty
export async function seedSOSReportsIfEmpty(): Promise<void> {
  try {
    const sosRef = collection(db, 'sos_reports');
    const snapshot = await getDocs(sosRef);
    if (snapshot.empty) {
      for (const item of INITIAL_SAMPLE_SOS_REPORTS) {
        await addDoc(sosRef, item);
      }
    }
  } catch (error) {
    console.error("Failed to seed initial SOS reports:", error);
  }
}

// Realtime subscription to SOS distress reports collection
export function subscribeToSOSReports(callback: (reports: SOSReport[]) => void): () => void {
  seedSOSReportsIfEmpty();
  const sosRef = collection(db, 'sos_reports');
  const q = query(sosRef, orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items: SOSReport[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      items.push({
        id: doc.id,
        userId: data.userId || 'anonymous',
        voiceUrl: data.voiceUrl || null,
        transcript: data.transcript || '',
        category: data.category || 'Other',
        latitude: typeof data.latitude === 'number' ? data.latitude : parseFloat(data.latitude) || 0,
        longitude: typeof data.longitude === 'number' ? data.longitude : parseFloat(data.longitude) || 0,
        timestamp: data.timestamp || Date.now(),
        status: data.status || 'active',
        userAddress: data.userAddress || ''
      });
    });
    callback(items);
  }, (err) => {
    console.error("Error subscribing to sos_reports:", err);
  });
}

// Fetch SOS reports once
export async function fetchSOSReports(): Promise<SOSReport[]> {
  try {
    seedSOSReportsIfEmpty();
    const sosRef = collection(db, 'sos_reports');
    const q = query(sosRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const items: SOSReport[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      items.push({
        id: doc.id,
        userId: data.userId || 'anonymous',
        voiceUrl: data.voiceUrl || null,
        transcript: data.transcript || '',
        category: data.category || 'Other',
        latitude: typeof data.latitude === 'number' ? data.latitude : parseFloat(data.latitude) || 0,
        longitude: typeof data.longitude === 'number' ? data.longitude : parseFloat(data.longitude) || 0,
        timestamp: data.timestamp || Date.now(),
        status: data.status || 'active',
        userAddress: data.userAddress || ''
      });
    });
    return items;
  } catch (error) {
    console.error("Failed to fetch SOS reports:", error);
    return [];
  }
}

// Create an SOS distress report in Firestore
export async function createSOSReport(report: Omit<SOSReport, 'id'>): Promise<string> {
  const sosCollection = collection(db, 'sos_reports');
  const docRef = await addDoc(sosCollection, {
    userId: report.userId,
    voiceUrl: report.voiceUrl || null,
    transcript: report.transcript || 'Emergency voice distress signal',
    category: report.category || 'Other',
    latitude: report.latitude,
    longitude: report.longitude,
    timestamp: report.timestamp || Date.now(),
    status: report.status || 'active',
    userAddress: report.userAddress || ''
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

// ============================================================================
// FEATURE 3: SAFETY CIRCLE & FAMILY PINGS FIRESTORE SERVICES
// ============================================================================

/**
 * Add a new family member to user's safety circle
 */
export async function addSafetyCircleMember(member: Omit<SafetyCircleMember, 'id'>): Promise<string> {
  const circlesRef = collection(db, 'safety_circles');
  const docRef = await addDoc(circlesRef, {
    ...member,
    createdAt: member.createdAt || new Date().toISOString(),
  });
  return docRef.id;
}

/**
 * Realtime subscription to members added by the current user
 */
export function subscribeToMySafetyCircle(
  userUid: string, 
  callback: (members: SafetyCircleMember[]) => void
): () => void {
  if (!userUid) return () => {};
  const circlesRef = collection(db, 'safety_circles');
  const q = query(circlesRef, where('addedByUid', '==', userUid));

  return onSnapshot(q, (snapshot) => {
    const items: SafetyCircleMember[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as SafetyCircleMember);
    });
    callback(items);
  }, (err) => {
    console.warn("Safety circle subscription warning:", err);
  });
}

/**
 * Realtime subscription to incoming family links where current user's email was added by someone else
 */
export function subscribeToIncomingFamilyLinks(
  userEmail: string, 
  callback: (links: SafetyCircleMember[]) => void
): () => void {
  if (!userEmail) return () => {};
  const circlesRef = collection(db, 'safety_circles');
  const q = query(circlesRef, where('familyMemberEmail', '==', userEmail.toLowerCase().trim()));

  return onSnapshot(q, (snapshot) => {
    const items: SafetyCircleMember[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as SafetyCircleMember);
    });
    callback(items);
  }, (err) => {
    console.warn("Incoming family links subscription warning:", err);
  });
}

/**
 * Delete a safety circle family member
 */
export async function deleteSafetyCircleMember(memberDocId: string): Promise<void> {
  const memberDocRef = doc(db, 'safety_circles', memberDocId);
  await deleteDoc(memberDocRef);
}

/**
 * Update user's live safety status ("SAFE" or "DISTRESS") and location in Firestore
 */
export async function updateUserSafetyStatus(
  uid: string, 
  status: 'SAFE' | 'DISTRESS',
  locationData?: { latitude: number; longitude: number; address: string },
  batteryLevel?: number | string
): Promise<void> {
  if (!uid) return;
  const userDocRef = doc(db, 'users', uid);
  
  const payload: any = {
    lastSafetyStatus: status,
    lastStatusTimestamp: Date.now(),
    updatedAt: Date.now(),
  };

  if (locationData) {
    payload.lastKnownLocation = {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      address: locationData.address || '',
    };
  }

  if (batteryLevel !== undefined) {
    payload.batteryLevel = batteryLevel;
  }

  await setDoc(userDocRef, payload, { merge: true });
}

