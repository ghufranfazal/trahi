import React, { createContext, useContext, useState, useEffect } from 'react';

export type NetworkMode = 'online' | 'sms' | 'mesh';

export interface SMSDispatchPayload {
  category?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  transcript?: string;
  recipient?: string;
}

interface NetworkContextType {
  networkMode: NetworkMode;
  setNetworkMode: (mode: NetworkMode) => void;
  isOnlineAuto: boolean;
  isManualOverride: boolean;
  resetToAutoDetection: () => void;
  generateSMSPayload: (payload: SMSDispatchPayload) => string;
  dispatchNativeSMS: (payload: SMSDispatchPayload) => void;
  isMeshModalOpen: boolean;
  setIsMeshModalOpen: (open: boolean) => void;
  isSMSModalOpen: boolean;
  setIsSMSModalOpen: (open: boolean) => void;
  activeSMSPayload: SMSDispatchPayload | null;
  setActiveSMSPayload: (payload: SMSDispatchPayload | null) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Real browser online/offline auto-detection
  const [isOnlineAuto, setIsOnlineAuto] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  
  // Active mode: 'online' (Cloud) | 'sms' (No Internet SMS) | 'mesh' (BLE Mesh Demo)
  const [networkMode, setNetworkModeState] = useState<NetworkMode>(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'sms';
    }
    return 'online';
  });

  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);

  // Modals
  const [isMeshModalOpen, setIsMeshModalOpen] = useState<boolean>(false);
  const [isSMSModalOpen, setIsSMSModalOpen] = useState<boolean>(false);
  const [activeSMSPayload, setActiveSMSPayload] = useState<SMSDispatchPayload | null>(null);

  // Auto-detect browser online and offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnlineAuto(true);
      if (!isManualOverride) {
        setNetworkModeState('online');
      }
    };

    const handleOffline = () => {
      setIsOnlineAuto(false);
      if (!isManualOverride) {
        setNetworkModeState('sms');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isManualOverride]);

  const setNetworkMode = (mode: NetworkMode) => {
    setNetworkModeState(mode);
    setIsManualOverride(true);
  };

  const resetToAutoDetection = () => {
    setIsManualOverride(false);
    setNetworkModeState(navigator.onLine ? 'online' : 'sms');
  };

  /**
   * Programmatically assemble an emergency text payload
   */
  const generateSMSPayload = (payload: SMSDispatchPayload): string => {
    const category = payload.category || 'EMERGENCY DISTRESS';
    const lat = payload.latitude !== undefined ? payload.latitude.toFixed(5) : 'Unknown';
    const lon = payload.longitude !== undefined ? payload.longitude.toFixed(5) : 'Unknown';
    const loc = payload.address ? `\nLocation: ${payload.address}` : '';
    const details = payload.transcript ? `\nDetails: "${payload.transcript}"` : '\nImmediate rescue/medical assistance required.';
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    return `[TRAHI SOS] ${category.toUpperCase()}\nGPS: ${lat}, ${lon}${loc}${details}\nTime: ${timestamp}\n(Sent via Trahi Offline SMS Dispatch)`;
  };

  /**
   * Trigger native SMS dispatch via sms: URI scheme
   */
  const dispatchNativeSMS = (payload: SMSDispatchPayload) => {
    const recipient = payload.recipient || '112';
    const message = generateSMSPayload(payload);
    setActiveSMSPayload(payload);
    setIsSMSModalOpen(true);

    // Encode message properly for iOS and Android
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const smsUrl = isIOS
      ? `sms:${recipient}&body=${encodeURIComponent(message)}`
      : `sms:${recipient}?body=${encodeURIComponent(message)}`;

    try {
      window.location.href = smsUrl;
    } catch (err) {
      console.warn('Could not launch native SMS composer:', err);
    }
  };

  return (
    <NetworkContext.Provider
      value={{
        networkMode,
        setNetworkMode,
        isOnlineAuto,
        isManualOverride,
        resetToAutoDetection,
        generateSMSPayload,
        dispatchNativeSMS,
        isMeshModalOpen,
        setIsMeshModalOpen,
        isSMSModalOpen,
        setIsSMSModalOpen,
        activeSMSPayload,
        setActiveSMSPayload,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
