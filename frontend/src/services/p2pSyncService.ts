import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.ts';

export interface SafetyPacket {
  userId: string;
  status: 'SAFE' | 'DISTRESS';
  latitude: number;
  longitude: number;
  battery: number;
  timestamp: number;
  address?: string;
}

export const OFFLINE_PACKET_KEY = 'trahi_offline_safety_packet';

/**
 * Save safety packet locally to LocalStorage when offline
 */
export const cacheSafetyStatusLocally = (packet: SafetyPacket): void => {
  try {
    localStorage.setItem(OFFLINE_PACKET_KEY, JSON.stringify(packet));
  } catch (err) {
    console.warn('LocalStorage error while caching safety packet:', err);
  }
};

/**
 * Get cached safety packet from LocalStorage if present
 */
export const getCachedSafetyPacket = (): SafetyPacket | null => {
  try {
    const raw = localStorage.getItem(OFFLINE_PACKET_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Push cached packet to Firestore when online connectivity returns
 */
export const syncOfflinePacketToCloud = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !navigator.onLine) return false;

  const packet = getCachedSafetyPacket();
  if (!packet || !packet.userId) return false;

  const userRef = doc(db, 'users', packet.userId);

  try {
    await setDoc(
      userRef,
      {
        lastSafetyStatus: packet.status,
        batteryLevel: `${packet.battery}%`,
        lastKnownLocation: {
          latitude: packet.latitude,
          longitude: packet.longitude,
          address: packet.address || 'Offline P2P Synced Location',
        },
        lastStatusTimestamp: Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    localStorage.removeItem(OFFLINE_PACKET_KEY);
    return true;
  } catch (error) {
    console.error('Failed to sync offline safety packet to cloud:', error);
    return false;
  }
};

// Global automatic sync recovery when internet reconnects
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncOfflinePacketToCloud();
  });
}
