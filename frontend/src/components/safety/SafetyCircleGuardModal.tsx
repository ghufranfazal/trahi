import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Users, X, UserPlus, ArrowRight } from 'lucide-react';

interface SafetyCircleGuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddMember: () => void;
}

export const SafetyCircleGuardModal: React.FC<SafetyCircleGuardModalProps> = ({
  isOpen,
  onClose,
  onOpenAddMember,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="safety-guard-modal-backdrop"
        className="fixed inset-0 z-[1200] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          id="safety-guard-modal-box"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-white w-full max-w-sm sm:max-w-md rounded-3xl shadow-2xl border border-amber-200 overflow-hidden my-auto text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-br from-amber-500 to-orange-600 text-white relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-white/20 text-white flex items-center justify-center mx-auto mb-3 backdrop-blur-xs shadow-inner">
              <Users size={32} className="stroke-[2.5]" />
            </div>

            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-white tracking-wider">
              Safety Circle Required
            </span>
            <h3 className="text-xl font-black text-white mt-1">
              No Safety Contacts Found
            </h3>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 text-left">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm leading-relaxed">
              <strong>No Safety Circle Contacts Found</strong> — Please add at least one family member or emergency contact to send safety updates.
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Your Safety Circle ensures your family receives your real-time GPS location, battery percentage, and distress status during emergencies via Cloud, SMS, and WhatsApp.
            </p>

            {/* Direct CTA Button */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddMember();
                }}
                className="w-full py-3.5 bg-[#0F9D8F] hover:bg-[#0c8579] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#0F9D8F]/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <UserPlus size={16} />
                <span>Add Family Member Now</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer text-center"
              >
                Dismiss
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
