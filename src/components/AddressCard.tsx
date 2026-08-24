import React, { useState } from 'react';
import { Pencil, Check, MapPin } from 'lucide-react';

interface AddressCardProps {
  initialAddress?: string;
  onAddressChange?: (address: string) => void;
}

export const AddressCard: React.FC<AddressCardProps> = ({
  initialAddress = "12 Anywhere Street, Off Bulaba Estate, Ikeja, Lagos State, Nigeria.",
  onAddressChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [address, setAddress] = useState(initialAddress);
  const [tempAddress, setTempAddress] = useState(initialAddress);

  const handleSave = () => {
    setAddress(tempAddress);
    setIsEditing(false);
    if (onAddressChange) {
      onAddressChange(tempAddress);
    }
  };

  const handleCancel = () => {
    setTempAddress(address);
    setIsEditing(false);
  };

  return (
    <div id="address-card-container" className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto">
      <div 
        id="user-address-card"
        className="w-full bg-white rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 transition-all duration-200"
      >
        {/* Top row: 'Your address is' + 'Edit' action */}
        <div className="flex justify-between items-center mb-2 sm:mb-2.5">
          <span id="address-card-label" className="text-sm sm:text-base font-bold text-gray-900">
            Your address is
          </span>

          {!isEditing ? (
            <button
              id="edit-address-button"
              onClick={() => {
                setTempAddress(address);
                setIsEditing(true);
              }}
              className="flex items-center gap-1 text-[#0F9D8F] font-bold text-xs sm:text-sm hover:text-[#0c8579] active:opacity-75 transition-colors cursor-pointer py-0.5 px-1.5 rounded-md hover:bg-teal-50/50"
            >
              <Pencil size={13} className="stroke-[3]" />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="text-xs sm:text-sm font-medium text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#0F9D8F] hover:text-[#0c8579] bg-teal-50 px-2.5 py-1 rounded-md transition cursor-pointer"
              >
                <Check size={13} className="stroke-[3]" />
                <span>Save</span>
              </button>
            </div>
          )}
        </div>

        {/* Address Content */}
        {!isEditing ? (
          <p id="user-address-display" className="text-left text-xs sm:text-sm text-gray-400 leading-relaxed font-medium">
            {address}
          </p>
        ) : (
          <div className="mt-2">
            <textarea
              id="edit-address-textarea"
              value={tempAddress}
              onChange={(e) => setTempAddress(e.target.value)}
              rows={2}
              className="w-full text-xs sm:text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/30 focus:border-[#0F9D8F] resize-none font-medium"
              placeholder="Enter your current location / landmark..."
              autoFocus
            />
            <div className="mt-2 flex items-center justify-between text-[11px] sm:text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-[#0F9D8F]" /> GPS Auto-detect available
              </span>
              <button
                type="button"
                onClick={() => setTempAddress("12 Anywhere Street, Off Bulaba Estate, Ikeja, Lagos State, Nigeria.")}
                className="text-[#0F9D8F] hover:underline cursor-pointer"
              >
                Reset Default
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

