import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  WifiOff, 
  Radio, 
  CheckCircle2, 
  Smartphone, 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  MapPin, 
  Battery, 
  Activity,
  Layers
} from 'lucide-react';
import { 
  cacheSafetyStatusLocally, 
  syncOfflinePacketToCloud, 
  getCachedSafetyPacket,
  SafetyPacket 
} from '../../services/p2pSyncService.ts';
import { useLocation } from '../../context/LocationContext.tsx';
import { SafetyCircleMember } from '../../types.ts';

interface FamilyPeer {
  id: string;
  name: string;
  relation: string;
  distance: string;
  signalStrength: string;
  status: 'SAFE' | 'DISTRESS' | 'SYNCING';
  battery: string;
}

interface OfflineFamilySyncProps {
  currentUserId: string;
  customFamilyMembers?: SafetyCircleMember[];
}

export const OfflineFamilySync: React.FC<OfflineFamilySyncProps> = ({ 
  currentUserId, 
  customFamilyMembers 
}) => {
  const { location } = useLocation();
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [hasCachedPacket, setHasCachedPacket] = useState<boolean>(Boolean(getCachedSafetyPacket()));
  const [hopIndex, setHopIndex] = useState<number>(-1);
  const [broadcastType, setBroadcastType] = useState<'SAFE' | 'DISTRESS'>('SAFE');

  // Default demo peers or generated from customFamilyMembers
  const [peers, setPeers] = useState<FamilyPeer[]>(() => {
    if (customFamilyMembers && customFamilyMembers.length > 0) {
      return customFamilyMembers.map((m, idx) => ({
        id: m.id || `peer-${idx}`,
        name: m.fullName,
        relation: m.relation || 'Family',
        distance: `${12 + idx * 18}m away`,
        signalStrength: `${-62 - idx * 7} dBm`,
        status: 'SAFE',
        battery: `${88 - idx * 6}%`,
      }));
    }

    return [
      { id: '1', name: 'Elder Brother', relation: 'Brother', distance: '12m away', signalStrength: '-64 dBm', status: 'SAFE', battery: '92%' },
      { id: '2', name: 'Mummy', relation: 'Mother', distance: '35m away', signalStrength: '-72 dBm', status: 'SYNCING', battery: '76%' },
      { id: '3', name: 'Papa', relation: 'Father', distance: '48m away', signalStrength: '-79 dBm', status: 'SAFE', battery: '84%' },
    ];
  });

  // Keep peers synced if customFamilyMembers change
  useEffect(() => {
    if (customFamilyMembers && customFamilyMembers.length > 0) {
      setPeers(customFamilyMembers.map((m, idx) => ({
        id: m.id || `peer-${idx}`,
        name: m.fullName,
        relation: m.relation || 'Family',
        distance: `${12 + idx * 18}m away`,
        signalStrength: `${-62 - idx * 7} dBm`,
        status: 'SAFE',
        battery: `${88 - idx * 6}%`,
      })));
    }
  }, [customFamilyMembers]);

  // Online / Offline event listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncOfflinePacketToCloud().then((synced) => {
        if (synced) setHasCachedPacket(false);
      });
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleBroadcastSafety = (status: 'SAFE' | 'DISTRESS' = 'SAFE') => {
    setIsScanning(true);
    setBroadcastType(status);
    setHopIndex(0);

    // Set all peers to SYNCING temporarily
    setPeers((prev) => prev.map((p) => ({ ...p, status: 'SYNCING' })));

    const lat = location?.latitude || 28.5355;
    const lon = location?.longitude || 77.3910;
    const addr = location?.formattedAddress || location?.city || 'Delhi, Sector 62';

    const packet: SafetyPacket = {
      userId: currentUserId || 'user_demo_123',
      status: status,
      latitude: lat,
      longitude: lon,
      battery: 90,
      timestamp: Date.now(),
      address: addr,
    };

    // Store in LocalStorage
    cacheSafetyStatusLocally(packet);
    setHasCachedPacket(true);

    // Step-by-step mesh hop progression (Hop 0 -> Hop 1 -> Hop 2 -> Done)
    const hopTimer1 = setTimeout(() => {
      setHopIndex(1);
    }, 700);

    const hopTimer2 = setTimeout(() => {
      setHopIndex(2);
    }, 1400);

    // Complete P2P mesh relay over 2 seconds
    const finishTimer = setTimeout(() => {
      setPeers((prev) =>
        prev.map((peer) => ({ ...peer, status: status }))
      );
      setHopIndex(3);
      setIsScanning(false);

      // If online, also flush to Firestore immediately
      if (navigator.onLine) {
        syncOfflinePacketToCloud().then(() => setHasCachedPacket(false));
      }
    }, 2100);

    return () => {
      clearTimeout(hopTimer1);
      clearTimeout(hopTimer2);
      clearTimeout(finishTimer);
    };
  };

  return (
    <div id="p2p-offline-family-sync" className="p-5 sm:p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl space-y-5 text-left">
      {/* Header Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <Radio className={`w-5 h-5 ${isScanning ? 'animate-pulse text-teal-300' : 'text-teal-400'}`} />
          </div>
          <div>
            <h3 className="font-black text-base sm:text-lg text-white leading-tight">
              P2P Offline Family Sync
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Bluetooth Low Energy (BLE) Mesh & LocalStorage Queue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasCachedPacket && (
            <span className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              ⚡ 1 Cached Packet
            </span>
          )}

          <span
            className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 border ${
              isOffline
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-teal-500/20 text-teal-400 border-teal-500/30'
            }`}
          >
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
            <span>{isOffline ? 'Mesh Mode (Offline)' : 'Cloud Synced'}</span>
          </span>
        </div>
      </div>

      {/* Peer Discovery Radar Display */}
      <div className="relative p-6 sm:p-8 bg-slate-950 rounded-2xl flex flex-col items-center justify-center min-h-[220px] overflow-hidden border border-slate-800 shadow-inner">
        {/* Radar Circular Grid Lines */}
        <div className="absolute w-56 h-56 border border-slate-800/80 rounded-full pointer-events-none" />
        <div className="absolute w-40 h-40 border border-slate-800/80 rounded-full pointer-events-none" />
        <div className="absolute w-24 h-24 border border-teal-500/20 rounded-full pointer-events-none" />

        {/* Animated Scanning Radar Pulse */}
        {isScanning && (
          <>
            <motion.div
              animate={{ scale: [0.8, 1.8], opacity: [0.6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
              className="absolute w-44 h-44 border-2 border-teal-400/40 rounded-full pointer-events-none"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute w-64 h-64 border-t-2 border-teal-400/30 rounded-full pointer-events-none"
            />
          </>
        )}

        {/* Center Node (Your Phone) */}
        <div className="relative z-10 text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-mono font-bold mb-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
            <span>Origin Beacon Node (You)</span>
          </div>
          <p className="text-xs text-slate-400">
            {isScanning ? 'Transmitting P2P distress packets to nearby peers...' : 'Family mesh nodes listening on 2.4GHz BLE'}
          </p>
        </div>

        {/* Discovered Nearby Family Peer Cards */}
        <div className="relative z-10 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {peers.map((peer, idx) => {
              const isCurrentHop = isScanning && hopIndex === idx;

              return (
                <div
                  key={peer.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                    isCurrentHop
                      ? 'bg-teal-950/80 border-teal-400 ring-2 ring-teal-400/30 scale-[1.03]'
                      : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      peer.status === 'SAFE' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : peer.status === 'DISTRESS'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      <Smartphone size={16} />
                    </div>

                    <div className="text-left">
                      <p className="font-extrabold text-xs text-slate-100 leading-tight truncate max-w-[90px]">
                        {peer.name}
                      </p>
                      <p className="text-[10px] text-teal-400 font-semibold">{peer.distance}</p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        peer.status === 'SAFE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : peer.status === 'DISTRESS'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                      }`}
                    >
                      {peer.status}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5">{peer.signalStrength}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action CTAs: Broadcast Safe & Distress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Broadcast Safe */}
        <button
          type="button"
          onClick={() => handleBroadcastSafety('SAFE')}
          disabled={isScanning}
          className="py-3 px-4 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-teal-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Radio size={15} />
          <span>{isScanning && broadcastType === 'SAFE' ? 'Broadcasting Mesh Hop...' : "Broadcast 'I'm Safe' to Mesh"}</span>
        </button>

        {/* Broadcast Distress */}
        <button
          type="button"
          onClick={() => handleBroadcastSafety('DISTRESS')}
          disabled={isScanning}
          className="py-3 px-4 bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <AlertTriangle size={15} />
          <span>{isScanning && broadcastType === 'DISTRESS' ? 'Broadcasting Mesh SOS...' : 'Broadcast Distress SOS to Mesh'}</span>
        </button>
      </div>

      {/* Mandatory Presentation Footnote */}
      <p className="text-[11px] text-slate-400 text-center leading-relaxed">
        *Offline mode caches updates locally and broadcasts via peer-to-peer Bluetooth mesh simulation. When online connection returns, packets automatically flush to Firestore.
      </p>
    </div>
  );
};
