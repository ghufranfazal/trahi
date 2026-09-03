import React from 'react';
import { X, PhoneCall, ShieldAlert, Siren, Flame, HeartPulse, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmergencyContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyContactsModal: React.FC<EmergencyContactsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const helplines = [
    { label: 'National All-in-One', number: '112', desc: 'Police, Fire, Medical, Disaster', icon: <Siren size={18} className="text-red-500" /> },
    { label: 'Ambulance & Paramedic', number: '108', desc: 'Emergency Medical Service', icon: <HeartPulse size={18} className="text-red-600" /> },
    { label: 'Police Control Room', number: '100', desc: 'Direct Police Dispatch', icon: <ShieldAlert size={18} className="text-blue-600" /> },
    { label: 'Fire & Rescue Service', number: '101', desc: 'Fire Department', icon: <Flame size={18} className="text-orange-500" /> },
    { label: 'NDRF Disaster Response', number: '1078', desc: 'Floods, Earthquakes, Cyclones', icon: <Radio size={18} className="text-teal-600" /> },
    { label: 'Women Emergency Helpline', number: '1091', desc: '24x7 Safety & Rescue', icon: <PhoneCall size={18} className="text-rose-500" /> },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-200 space-y-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-red-100 text-[#DC2626] flex items-center justify-center font-bold">
                <PhoneCall size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-gray-900">Emergency Contacts</h3>
                <p className="text-xs text-gray-400 font-medium">Toll-Free National Helplines (India)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Contacts Grid */}
          <div className="grid grid-cols-1 gap-2.5">
            {helplines.map((item) => (
              <a
                key={item.number}
                href={`tel:${item.number}`}
                className="p-3.5 rounded-2xl bg-gray-50 hover:bg-red-50/70 border border-gray-200/80 hover:border-red-200 flex items-center justify-between transition group cursor-pointer shadow-2xs active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white shadow-2xs group-hover:scale-105 transition">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-red-900 transition">
                      {item.label}
                    </h4>
                    <p className="text-[11px] text-gray-500 font-medium">{item.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-base font-black text-gray-900 group-hover:text-red-600 font-mono">
                    {item.number}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition">
                    <PhoneCall size={14} />
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition cursor-pointer"
            >
              Close Contacts Window
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
