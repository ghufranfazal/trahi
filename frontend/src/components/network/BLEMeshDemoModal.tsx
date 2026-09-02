import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Radio, 
  Smartphone, 
  Cloud, 
  Wifi, 
  WifiOff, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  Activity, 
  Zap, 
  Play, 
  Pause,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext.tsx';

interface MeshNode {
  id: string;
  label: string;
  role: string;
  signalStrength: string;
  status: 'pending' | 'active' | 'relayed';
  distance: string;
}

export const BLEMeshDemoModal: React.FC = () => {
  const { isMeshModalOpen, setIsMeshModalOpen } = useNetwork();
  
  // Animation hop index: 0 (Origin) -> 1 (Peer A) -> 2 (Peer B) -> 3 (Gateway Node)
  const [currentHop, setCurrentHop] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [logs, setLogs] = useState<string[]>([]);
  const timerRef = useRef<any>(null);

  const nodes: MeshNode[] = [
    {
      id: 'node-1',
      label: 'Your Phone',
      role: 'Distress Beacon (Offline)',
      signalStrength: 'Origin',
      status: currentHop >= 0 ? 'relayed' : 'pending',
      distance: '0m',
    },
    {
      id: 'node-2',
      label: 'Peer Citizen #142',
      role: 'Nearby Phone Relay',
      signalStrength: '-68 dBm (BLE 5.0)',
      status: currentHop >= 1 ? 'relayed' : currentHop === 0 ? 'active' : 'pending',
      distance: '35m',
    },
    {
      id: 'node-3',
      label: 'Volunteer Node #88',
      role: 'Mesh Intermediate Forwarder',
      signalStrength: '-74 dBm (P2P)',
      status: currentHop >= 2 ? 'relayed' : currentHop === 1 ? 'active' : 'pending',
      distance: '110m',
    },
    {
      id: 'node-4',
      label: 'Connected Gateway',
      role: 'Connected — Relaying to cloud.',
      signalStrength: 'LTE / Satellite Uplink',
      status: currentHop >= 3 ? 'relayed' : currentHop === 2 ? 'active' : 'pending',
      distance: '240m',
    },
  ];

  // Step-by-step mesh hopping progression
  useEffect(() => {
    if (!isMeshModalOpen || !isPlaying) return;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setCurrentHop((prev) => {
        if (prev < 3) {
          const next = prev + 1;
          addTelemetryLog(next);
          return next;
        } else {
          // Loop after pause at completion
          return 3;
        }
      });
    }, 1400);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isMeshModalOpen, isPlaying]);

  const addTelemetryLog = (hop: number) => {
    const timestamp = new Date().toLocaleTimeString();
    let msg = '';
    if (hop === 1) {
      msg = `[${timestamp}] BLE advertising packet picked up by Peer Citizen #142 (RSSI: -68 dBm)`;
    } else if (hop === 2) {
      msg = `[${timestamp}] Forwarded via flood-routing to Volunteer Node #88 (Hop 2/3)`;
    } else if (hop === 3) {
      msg = `[${timestamp}] Reached Edge Gateway Node! Packet verified & uploaded to Trahi Cloud Server.`;
    }
    if (msg) {
      setLogs((prev) => [...prev.slice(-4), msg]);
    }
  };

  const handleRestart = () => {
    setCurrentHop(0);
    setLogs([`[${new Date().toLocaleTimeString()}] Distress beacon initiated on Origin device (GPS: 26.1445°N, 91.7362°E)`]);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (isMeshModalOpen) {
      handleRestart();
    }
  }, [isMeshModalOpen]);

  if (!isMeshModalOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="ble-mesh-modal-backdrop"
        className="fixed inset-0 z-[1100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        onClick={() => setIsMeshModalOpen(false)}
      >
        <motion.div
          id="ble-mesh-modal-box"
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-slate-900 text-white w-full max-w-lg rounded-3xl shadow-2xl border border-purple-500/30 overflow-hidden my-auto text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-slate-900 border-b border-purple-500/20 relative">
            <button
              type="button"
              onClick={() => setIsMeshModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center shadow-inner">
                <Radio size={24} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-400/40">
                    Tier 3: Vision Demo
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Simulated P2P Mesh
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                  Offline BLE Mesh Relay Demonstration
                </h3>
              </div>
            </div>
          </div>

          {/* Main Visual Concept Animation Canvas */}
          <div className="p-5 sm:p-6 space-y-6">
            {/* Mesh Architecture Diagram Area */}
            <div className="relative bg-slate-950/90 rounded-2xl p-5 border border-purple-500/20 overflow-hidden shadow-inner min-h-[260px] flex flex-col justify-between">
              {/* Subtle Grid Background */}
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(rgba(168, 85, 247, 0.4) 1px, transparent 0)',
                  backgroundSize: '18px 18px'
                }}
              />

              {/* Status Header inside canvas */}
              <div className="relative z-10 flex items-center justify-between text-xs border-b border-purple-900/40 pb-2">
                <span className="text-purple-300/80 font-mono text-[11px]">
                  Protocol: Bluetooth Low Energy (BLE 5.0 Long Range Mesh)
                </span>
                <span className="font-mono text-xs font-bold text-purple-400">
                  Hop {currentHop} of 3
                </span>
              </div>

              {/* 4 Connected Nodes Grid / Flow */}
              <div className="relative z-10 grid grid-cols-4 gap-2 my-6 items-center">
                {/* Connecting Animated Line Layer */}
                <div className="absolute left-[12%] right-[12%] top-6 h-1 bg-slate-800 rounded-full z-0 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-emerald-400 rounded-full"
                    animate={{
                      width: `${(currentHop / 3) * 100}%`,
                    }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                  />
                </div>

                {nodes.map((node, idx) => {
                  const isReached = currentHop >= idx;
                  const isCurrent = currentHop === idx;
                  const isGateway = idx === 3;

                  return (
                    <div key={node.id} className="relative z-10 flex flex-col items-center text-center">
                      {/* Node Icon Circle */}
                      <div className="relative flex items-center justify-center mb-2">
                        {/* Pulse Ring for active node */}
                        {isCurrent && (
                          <motion.div
                            animate={{ scale: [1, 1.6, 1], opacity: [0.7, 0, 0.7] }}
                            transition={{ duration: 1.4, repeat: Infinity }}
                            className={`absolute w-12 h-12 rounded-full pointer-events-none ${
                              isGateway ? 'bg-emerald-500/30' : 'bg-purple-500/40'
                            }`}
                          />
                        )}

                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md border ${
                            isReached
                              ? isGateway
                                ? 'bg-emerald-500 text-white border-emerald-300 shadow-emerald-500/30'
                                : 'bg-purple-600 text-white border-purple-400 shadow-purple-500/30'
                              : 'bg-slate-800 text-slate-500 border-slate-700'
                          }`}
                        >
                          {isGateway ? (
                            <Cloud size={20} className={isReached ? 'animate-bounce' : ''} />
                          ) : idx === 0 ? (
                            <Smartphone size={20} />
                          ) : (
                            <Radio size={18} />
                          )}
                        </div>
                      </div>

                      {/* Node Label */}
                      <span className="text-[11px] font-bold text-white leading-tight line-clamp-1">
                        {node.label}
                      </span>
                      <span className="text-[9px] text-purple-300/70 mt-0.5 line-clamp-1">
                        {node.distance}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Final Hop Outcome Badge */}
              <div className="relative z-10 pt-2 border-t border-purple-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${currentHop === 3 ? 'bg-emerald-400 animate-ping' : 'bg-purple-400'}`} />
                  <span className={`text-xs font-black ${currentHop === 3 ? 'text-emerald-400' : 'text-purple-300'}`}>
                    {currentHop === 3 ? 'Connected — Relaying to cloud.' : `Relaying distress packet (Hop ${currentHop}/3)...`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                    title="Replay packet simulation"
                  >
                    <RotateCcw size={12} />
                    <span>Replay</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Simulated Live Mesh Packet Telemetry Log */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-purple-400 font-bold tracking-wider block">
                Mesh Telemetry & Packet Routing Log
              </span>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-purple-200/90 space-y-1.5 min-h-[70px] max-h-[100px] overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-purple-400 shrink-0">›</span>
                    <span className="leading-snug">{log}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* MANDATORY CAPTION REQUIREMENT FOR STAKEHOLDERS & JUDGES */}
            <div className="p-3.5 bg-purple-950/50 rounded-2xl border border-purple-500/30 text-left space-y-1">
              <div className="flex items-center gap-1.5 text-purple-300 font-bold text-xs">
                <ShieldCheck size={14} className="text-purple-400" />
                <span>Architecture Vision & Native Roadmap:</span>
              </div>
              <p className="text-[11px] text-purple-200/80 leading-relaxed font-normal">
                Concept demonstration — full BLE mesh relay requires native app capabilities beyond browser limitations.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleRestart}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Zap size={14} />
                <span>Simulate Distress Broadcast</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMeshModalOpen(false)}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
