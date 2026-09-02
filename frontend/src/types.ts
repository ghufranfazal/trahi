export type TabType = 'home' | 'trahigpt' | 'sos' | 'donate' | 'profile';

export type DonorTabType = 'back' | 'map' | 'donate' | 'history' | 'profile';

export interface DonorProfile {
  id?: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  state?: string;
  preferredCauses?: string[];
  createdAt: number;
  updatedAt?: number;
}

export type AuthType = 'google' | 'anonymous';

export interface UserLocationDetails {
  latitude: number;
  longitude: number;
  district: string;
  block: string;
  pincode: string;
  state: string;
}

export type SafetyStatus = 'SAFE' | 'DISTRESS' | 'UNKNOWN';

export interface SafetyCircleMember {
  id?: string;
  addedByUid: string;
  addedByEmail: string;
  addedByName?: string;
  familyMemberEmail: string;
  familyMemberUid?: string;
  status: 'VERIFIED' | 'PENDING';
  fullName: string;
  gender: 'Male' | 'Female' | 'Other' | string;
  age: number | string;
  phone: string;
  city: string;
  state: string;
  pincode: string;
  relation: string;
  createdAt: string | number;
}

export interface UserProfile {
  userId: string;
  uid?: string; // backwards compatibility alias for userId
  name: string;
  age?: number | string;
  gender?: string;
  bloodGroup?: string;
  profilePictureUrl?: string;
  phone?: string;
  email?: string;
  authType?: AuthType;
  location?: UserLocationDetails;
  profileCompleted: boolean;
  lastSafetyStatus?: SafetyStatus | string;
  lastStatusTimestamp?: number;
  lastKnownLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  batteryLevel?: number | string;
  createdAt: number;
  updatedAt?: number;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  city?: string;
  state?: string;
  district?: string;
  block?: string;
  postcode?: string;
  formattedAddress: string;
  lastUpdated: number;
}

export type SOSStatus = 'active' | 'responding' | 'resolved' | 'cancelled';

export type EmergencyCategory = 
  | 'Flood'
  | 'Fire'
  | 'Earthquake'
  | 'Medical Emergency'
  | 'Crime/Violence'
  | 'Building Collapse'
  | 'Accident'
  | 'Other';

export interface SOSReport {
  id?: string;
  userId: string;
  voiceUrl: string | null;
  transcript: string;
  category?: EmergencyCategory | string;
  latitude: number;
  longitude: number;
  timestamp: number;
  status: SOSStatus;
  userAddress?: string;
}

export type DonationStatus = 
  | 'Donation Received'
  | 'Received' 
  | 'Verifying' 
  | 'Approved' 
  | 'Transferred' 
  | 'Utilization Proof' 
  | 'Closed';

export interface Donation {
  id?: string;
  sosReportId: string;
  donorName: string;
  donorUserId?: string;
  donorId?: string;
  donorEmail?: string;
  amount: number;
  razorpayPaymentId?: string;
  status: DonationStatus;
  timestamp: number;
  sosLocationName?: string;
  purpose?: string;
  proofNote?: string;
  paymentMethod?: string;
}
