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
import { SOSReport, Donation, UserProfile, DonationStatus } from '../types.ts';

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

// User Profile Firestore Sync
export async function syncUserProfile(profile: UserProfile): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', profile.uid);
    const existing = await getDoc(userDocRef);
    if (!existing.exists()) {
      await setDoc(userDocRef, {
        name: profile.name,
        phone: profile.phone || '',
        authType: profile.authType,
        createdAt: profile.createdAt || Date.now()
      });
    }
  } catch (error) {
    console.error("Failed to sync user profile in Firestore:", error);
  }
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
