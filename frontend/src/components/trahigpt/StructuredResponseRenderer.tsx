import React from 'react';
import {
  PhoneCall,
  HeartPulse,
  Flame,
  ShieldAlert,
  Droplets,
  AlertTriangle,
  User,
  Activity,
  CheckCircle2,
  Siren,
  Sparkles,
  Info,
} from 'lucide-react';
import { TrahiGPTStructuredResponse } from '../../services/trahiGPTService.ts';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';

interface StructuredResponseRendererProps {
  data: TrahiGPTStructuredResponse;
}

export const StructuredResponseRenderer: React.FC<StructuredResponseRendererProps> = ({ data }) => {
  if (!data) return null;

  const renderIcon = (iconName?: string) => {
    switch (iconName?.toLowerCase()) {
      case 'phone':
        return <PhoneCall size={16} className="text-[#0F9D8F]" />;
      case 'heart':
        return <HeartPulse size={16} className="text-red-500" />;
      case 'flame':
        return <Flame size={16} className="text-orange-500" />;
      case 'shield':
        return <ShieldAlert size={16} className="text-amber-500" />;
      case 'droplet':
        return <Droplets size={16} className="text-blue-500" />;
      case 'alert':
        return <AlertTriangle size={16} className="text-red-600" />;
      case 'user':
        return <User size={16} className="text-indigo-500" />;
      case 'activity':
        return <Activity size={16} className="text-emerald-500" />;
      case 'check':
      default:
        return <CheckCircle2 size={16} className="text-teal-600" />;
    }
  };

  const urgencyConfig = {
    critical: {
      badgeBg: 'bg-red-600 text-white',
      border: 'border-red-200',
      icon: <Siren size={14} className="animate-pulse" />,
      label: 'CRITICAL EMERGENCY',
    },
    high: {
      badgeBg: 'bg-orange-600 text-white',
      border: 'border-orange-200',
      icon: <AlertTriangle size={14} />,
      label: 'HIGH URGENCY',
    },
    moderate: {
      badgeBg: 'bg-amber-600 text-white',
      border: 'border-amber-200',
      icon: <ShieldAlert size={14} />,
      label: 'MODERATE PRIORITY',
    },
    info: {
      badgeBg: 'bg-[#0F9D8F] text-white',
      border: 'border-teal-200',
      icon: <Sparkles size={14} />,
      label: 'FIRST-AID GUIDANCE',
    },
  };

  const urgency = data.urgency && urgencyConfig[data.urgency] ? urgencyConfig[data.urgency] : urgencyConfig.info;

  return (
    <div className="space-y-4 w-full text-gray-900 font-sans">
      {/* 1. Protocol Title & Urgency Badge Header */}
      {data.title && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
          <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>{data.title}</span>
          </h3>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase shrink-0 ${urgency.badgeBg}`}
          >
            {urgency.icon}
            <span>{urgency.label}</span>
          </span>
        </div>
      )}

      {/* 2. Summary Overview Banner */}
      {data.summary && (
        <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-100/90 text-xs sm:text-sm text-teal-950 font-medium leading-relaxed shadow-2xs">
          <MarkdownRenderer content={data.summary} />
        </div>
      )}

      {/* 3. Highlighted Stat Boxes Grid */}
      {data.stats && data.stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3">
          {data.stats.map((stat, i) => (
            <div
              key={i}
              className="p-3 rounded-2xl bg-white border border-teal-200/70 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700">
                  {stat.label}
                </span>
                <p className="text-sm sm:text-base font-black text-[#0F9D8F] mt-0.5">{stat.value}</p>
              </div>
              {stat.subtext && <p className="text-[10px] text-gray-400 font-medium mt-1">{stat.subtext}</p>}
            </div>
          ))}
        </div>
      )}

      {/* 4. Numbered Step Cards with Icons */}
      {data.steps && data.steps.length > 0 && (
        <div className="space-y-2.5 my-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
            Step-by-Step Action Plan
          </h4>
          <div className="space-y-2.5">
            {data.steps.map((step, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-gray-50/90 border border-gray-200/80 flex items-start gap-3 shadow-2xs hover:bg-gray-100/60 transition"
              >
                <div className="w-7 h-7 rounded-xl bg-[#0F9D8F] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  {step.stepNumber || i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0">{renderIcon(step.icon)}</span>
                    <h5 className="font-bold text-xs sm:text-sm text-gray-900">{step.title}</h5>
                  </div>
                  <div className="text-xs text-gray-600 leading-relaxed font-medium mt-1">
                    <MarkdownRenderer content={step.description} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Tappable Contact Chips */}
      {data.contacts && data.contacts.length > 0 && (
        <div className="space-y-2 my-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-red-600 flex items-center gap-1.5">
            <PhoneCall size={13} />
            <span>Emergency Contacts & Hotlines</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.contacts.map((contact, i) => (
              <a
                key={i}
                href={`tel:${contact.number}`}
                className="p-3 rounded-2xl bg-red-50/90 hover:bg-red-100/90 border border-red-200 text-red-950 flex items-center justify-between transition cursor-pointer group shadow-2xs active:scale-95"
              >
                <div>
                  <div className="text-[11px] font-bold text-red-800">{contact.name}</div>
                  {contact.category && (
                    <div className="text-[10px] text-red-600/80 font-medium">{contact.category}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-[#DC2626] font-mono">{contact.number}</span>
                  <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition">
                    <PhoneCall size={13} />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 6. Critical Warnings Banner */}
      {data.warnings && data.warnings.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-red-50/90 border border-red-200 text-red-950 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-red-800">
            <AlertTriangle size={15} className="text-red-600 shrink-0" />
            <span>CRITICAL WARNINGS & DON'TS</span>
          </div>
          <ul className="space-y-1 pl-5 list-disc text-xs font-medium text-red-900 leading-relaxed">
            {data.warnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 7. Additional Safety Notes Footer */}
      {data.notes && (
        <div className="p-3 rounded-xl bg-gray-100/80 border border-gray-200/60 text-[11px] text-gray-600 font-medium flex items-start gap-2">
          <Info size={14} className="text-gray-400 shrink-0 mt-0.5" />
          <div>{data.notes}</div>
        </div>
      )}
    </div>
  );
};
