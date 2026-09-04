import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Siren, 
  Radio, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Volume2, 
  RefreshCw, 
  Search,
  Filter,
  User,
  ShieldAlert,
  ChevronRight,
  Activity
} from 'lucide-react';
import { SOSReport } from '../../types.ts';
import { subscribeToSOSReports, updateSOSStatus } from '../../services/firestoreService.ts';
import { formatTimeAgo } from '../../services/earthquakeService.ts';
import { getCategoryConfig } from '../donor/DonorCrisisMapTab.tsx';
import { ProfileViewButton } from '../profile/ProfileViewButton.tsx';

interface AuthorityPortalProps {
  onClose?: () => void;
}

export const AuthorityPortal: React.FC<AuthorityPortalProps> = ({ onClose }) => {
  const [reports, setReports] = useState<SOSReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToSOSReports((data) => {
      setReports(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (reportId: string, newStatus: 'responding' | 'resolved' | 'active') => {
    try {
      setUpdatingId(reportId);
      await updateSOSStatus(reportId, newStatus);
    } catch (err) {
      console.error("Failed to update SOS status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesStatus = filterStatus === 'all' || (r.status || 'active') === filterStatus;
    const matchesSearch = searchQuery.trim() === '' || 
      (r.transcript && r.transcript.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.userAddress && r.userAddress.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.category && r.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.userId && r.userId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div id="authority-portal-container" className="w-full bg-white rounded-3xl border border-gray-200/80 shadow-md p-5 sm:p-6 space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/20 shrink-0">
            <ShieldAlert size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-gray-900 leading-tight">
                Authority Dispatch Portal
              </h3>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 uppercase">
                NDRF / Emergency Command
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Live ground SOS dispatch queue with instant victim identity & vitals lookup
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer self-start sm:self-auto"
          >
            Close Authority View
          </button>
        )}
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search address, category, or user ID..."
            className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-gray-400 shrink-0 flex items-center gap-1">
            <Filter size={12} /> Filter Status:
          </span>
          {[
            { id: 'all', label: 'All Incidents' },
            { id: 'active', label: 'Active' },
            { id: 'responding', label: 'Responding' },
            { id: 'resolved', label: 'Resolved' },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setFilterStatus(st.id)}
              className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                filterStatus === st.id
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* SOS Dispatch Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-gray-400 space-y-2">
          <RefreshCw size={24} className="animate-spin text-red-600 mx-auto" />
          <p className="text-xs font-semibold">Syncing Authority Dispatch Feed...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="py-12 text-center bg-gray-50 rounded-2xl border border-gray-200/60 text-gray-500 text-xs">
          No dispatch cases match your filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.map((report) => {
            const config = getCategoryConfig(report.category);
            const isResolved = report.status === 'resolved';
            const isResponding = report.status === 'responding';

            return (
              <div
                key={report.id || report.timestamp}
                className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200 hover:border-gray-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <span 
                    className={`text-xs font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 ${config.bgBadgeClass}`}
                  >
                    <span 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: config.color }} 
                    />
                    <span>{config.label}</span>
                  </span>

                  <span 
                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      isResolved 
                        ? 'bg-gray-100 text-gray-700' 
                        : isResponding 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-red-100 text-red-700 animate-pulse'
                    }`}
                  >
                    {report.status || 'Active Dispatch'}
                  </span>
                </div>

                {/* Voice Transcript Quote */}
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-1">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                    Distress Signal Transcript
                  </span>
                  <p className="text-xs font-semibold text-gray-900 italic line-clamp-2">
                    "{report.transcript || 'Emergency audio distress call recorded.'}"
                  </p>
                </div>

                {/* Location & Time info */}
                <div className="text-xs text-gray-500 space-y-1 pt-1 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800">
                    <MapPin size={13} className="text-red-500 shrink-0" />
                    <span className="truncate">{report.userAddress || 'Ground Beacon Location'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-gray-400">
                      GPS: {report.latitude?.toFixed(4)}°N, {report.longitude?.toFixed(4)}°E
                    </span>
                    <span className="text-gray-400 font-medium">
                      {formatTimeAgo(report.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Authority Action Buttons including ProfileViewButton */}
                <div className="pt-2 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* REUSABLE VICTIM PROFILE BUTTON */}
                  <ProfileViewButton
                    userId={report.userId}
                    variant="outline"
                    size="sm"
                    className="w-full"
                    customLabel="Victim Profile"
                  />

                  {/* Dispatch Status Action */}
                  {report.id && (
                    <div className="flex items-center gap-1">
                      {!isResponding && !isResolved && (
                        <button
                          type="button"
                          disabled={updatingId === report.id}
                          onClick={() => handleStatusUpdate(report.id!, 'responding')}
                          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                        >
                          Dispatch Units
                        </button>
                      )}
                      {!isResolved && (
                        <button
                          type="button"
                          disabled={updatingId === report.id}
                          onClick={() => handleStatusUpdate(report.id!, 'resolved')}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                        >
                          Mark Resolved
                        </button>
                      )}
                      {isResolved && (
                        <button
                          type="button"
                          disabled={updatingId === report.id}
                          onClick={() => handleStatusUpdate(report.id!, 'active')}
                          className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                        >
                          Reopen Case
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
