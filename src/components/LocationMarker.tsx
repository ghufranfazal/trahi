import React from 'react';

interface LocationMarkerProps {
  avatarUrl?: string;
  name?: string;
}

export const LocationMarker: React.FC<LocationMarkerProps> = ({
  avatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  name = "User Location"
}) => {
  return (
    <div id="location-marker-wrapper" className="relative mb-3 flex items-center justify-center z-10">
      {/* Circular Avatar Container with Teal Border */}
      <div 
        id="location-avatar-frame"
        className="w-12 h-12 rounded-full border-2 border-[#0F9D8F] p-0.5 overflow-hidden bg-white shadow-md flex items-center justify-center"
      >
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Pin Badge on Corner */}
      <div 
        id="location-badge-corner"
        className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0F9D8F] rounded-full border-2 border-white flex items-center justify-center shadow-xs"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
          <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" />
        </svg>
      </div>
    </div>
  );
};

