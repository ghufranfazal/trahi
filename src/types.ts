export type TabType = 'home' | 'trahigpt' | 'sos' | 'donate' | 'profile';

export type AuthType = 'google' | 'anonymous';

export interface UserProfile {
  uid: string;
  name: string;
  phone?: string;
  email?: string;
  authType: AuthType;
  createdAt: number;
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
