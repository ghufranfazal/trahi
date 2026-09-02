import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Heart, 
  Phone, 
  MapPin, 
  Trash2, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Sparkles,
  Link2,
  Calendar,
  Clock,
  Radio
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLocation } from '../../context/LocationContext.tsx';
import { 
  subscribeToMySafetyCircle, 
  subscribeToIncomingFamilyLinks, 
  deleteSafetyCircleMember 
} from '../../services/firestoreService.ts';
import { SafetyCircleMember } from '../../types.ts';
import { AddFamilyMemberModal } from './AddFamilyMemberModal.tsx';
import { FamilySafetyPingWidget } from './FamilySafetyPingWidget.tsx';
import { OfflineFamilySync } from './OfflineFamilySync.tsx';

export const SafetyCircleManager: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { location } = useLocation();

  const [myMembers, setMyMembers] = useState<SafetyCircleMember[]>([]);
  const [incomingLinks, setIncomingLinks] = useState<SafetyCircleMember[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Subscribe to safety circle documents added by current user
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToMySafetyCircle(user.uid, (members) => {
      setMyMembers(members);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Subscribe to incoming family links where current user's email was added by someone else
  useEffect(() => {
    const userEmail = user?.email || userProfile?.email;
    if (!userEmail) return;

    const unsubscribe = subscribeToIncomingFamilyLinks(userEmail, (links) => {
      setIncomingLinks(links);
    });

    return () => unsubscribe();
  }, [user, userProfile]);

  const handleDelete = async (docId?: string) => {
    if (!docId) return;
    if (window.confirm('Remove this family member from your Safety Circle?')) {
      try {
        await deleteSafetyCircleMember(docId);
      } catch (err) {
        console.error('Failed to remove member:', err);
      }
    }
  };

  return (
    <div id="safety-circle-manager" className="space-y-6">
      {/* 1. Quick One-Tap Safety Ping Widget */}
      <FamilySafetyPingWidget 
        familyMembers={myMembers} 
        onOpenAddMember={() => setIsAddModalOpen(true)} 
      />

      {/* 2. My Safety Circle Members Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-[#0F9D8F] flex items-center justify-center shrink-0">
              <Users size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-gray-900">
                  My Safety Circle
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-xs font-black">
                  {myMembers.length} {myMembers.length === 1 ? 'Contact' : 'Contacts'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Family members who receive your 1-tap "I'm Safe" updates & GPS distress beacons.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-[#0F9D8F] hover:bg-[#0c8579] text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <UserPlus size={15} />
            <span>+ Add Family Member</span>
          </button>
        </div>

        {/* Empty State */}
        {myMembers.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-200/70 text-gray-400 flex items-center justify-center mx-auto">
              <Users size={24} />
            </div>
            <p className="text-xs sm:text-sm font-bold text-gray-700">
              No family members added yet
            </p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Add your parents, siblings, or emergency contacts by email. They will automatically receive your live coordinates when you tap "I'm Safe".
            </p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-[#0F9D8F] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
            >
              Add First Family Contact
            </button>
          </div>
        ) : (
          /* Members Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {myMembers.map((member) => (
              <div
                key={member.id}
                className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 hover:border-teal-200 transition flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-teal-100 text-[#0F9D8F] font-black flex items-center justify-center text-xs">
                        {member.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-gray-900 leading-tight">
                          {member.fullName}
                        </h4>
                        <span className="text-[11px] font-bold text-[#0F9D8F]">
                          {member.relation}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ✓ {member.status || 'VERIFIED'}
                    </span>
                  </div>

                  <div className="space-y-0.5 text-xs text-gray-600 pt-1">
                    <p className="flex items-center gap-1.5">
                      <Mail size={12} className="text-gray-400 shrink-0" />
                      <span className="truncate">{member.familyMemberEmail}</span>
                    </p>
                    <p className="flex items-center gap-1.5 font-mono">
                      <Phone size={12} className="text-gray-400 shrink-0" />
                      <span>{member.phone}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                      <MapPin size={12} className="text-gray-400 shrink-0" />
                      <span>{member.city}, {member.state}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-[10px] text-gray-400">
                  <span>Age: {member.age || '24'} • {member.gender || 'Male'}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(member.id)}
                    className="text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer font-semibold"
                    title="Remove member"
                  >
                    <Trash2 size={12} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Bidirectional Links Card ("Safety Circle Links") */}
      {incomingLinks.length > 0 && (
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50/60 rounded-3xl p-6 sm:p-8 border border-teal-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Link2 size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-gray-900">
                Bidirectional Safety Circle Links
              </h3>
              <p className="text-xs text-teal-800">
                You have been added to the following family safety networks:
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {incomingLinks.map((link) => (
              <div
                key={link.id}
                className="p-4 rounded-2xl bg-white border border-teal-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-gray-900">
                      {link.addedByName || link.addedByEmail}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-900">
                      Added you as family ({link.relation})
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Emergency Contact: <strong className="text-gray-800">{link.addedByEmail}</strong>
                  </p>
                  <p className="text-[11px] text-teal-700">
                    📍 Location: {link.city}, {link.state} • Blood Group & Health Triage Linked
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`tel:${link.phone}`}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-2xs transition"
                  >
                    <Phone size={12} />
                    <span>Call Family</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Radar Scan & P2P Offline Mesh Sync Visualizer */}
      <OfflineFamilySync 
        currentUserId={user?.uid || 'user_123'} 
        customFamilyMembers={myMembers} 
      />

      {/* Add Family Member Modal */}
      <AddFamilyMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
