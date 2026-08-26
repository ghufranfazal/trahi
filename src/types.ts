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

export interface SOSReport {
  id?: string;
  userId: string;
  voiceUrl: string | null;
  transcript: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  status: SOSStatus;
  userAddress?: string;
}

export type DonationStatus = 
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
  amount: number;
  status: DonationStatus;
  timestamp: number;
  sosLocationName?: string;
  purpose?: string;
  proofNote?: string;
  paymentMethod?: string;
}
