import React from 'react';
import { MdClose } from 'react-icons/md';
import { MapPinIcon } from '@heroicons/react/24/outline';

const LocationMapDialog = ({ isOpen, onClose, location, borrowerName }) => {
  if (!isOpen || !location) return null;

  const { latitude, longitude, address, timestamp } = location;
  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dpoWe2kVWCyydg&q=${latitude},${longitude}&zoom=15`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-500 to-indigo-600">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl shadow-lg">
              <MapPinIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">ตำแหน่งผู้ยืม</h3>
              <p className="text-sm text-white/80">{borrowerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all duration-200 hover:scale-105"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Map Container */}
        <div className="p-6">
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <MapPinIcon className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-800">ข้อมูลตำแหน่ง</span>
            </div>
            <div className="text-sm text-gray-600">
              <p>📍 {address || 'ไม่ระบุที่อยู่'}</p>
              <p>🌐 ละติจูด: {latitude.toFixed(6)}, ลองจิจูด: {longitude.toFixed(6)}</p>
              <p className="text-xs text-gray-500 mt-1">
                อัพเดทเมื่อ: {new Date(timestamp).toLocaleString('th-TH')}
              </p>
            </div>
          </div>

          {/* Google Maps Embed */}
          <div className="relative w-full h-96 rounded-lg overflow-hidden border border-gray-300 shadow-lg">
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Location Map"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 mt-4">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <MapPinIcon className="w-4 h-4" />
              เปิดใน Google Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationMapDialog;