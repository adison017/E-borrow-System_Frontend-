import React, { useEffect, useRef } from 'react';
import { MdClose } from 'react-icons/md';
import { MapPinIcon } from '@heroicons/react/24/outline';

const LocationMapDialog = ({ isOpen, onClose, location, borrowerName }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !location) return;

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    
    script.onload = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const { L } = window;
      const { latitude, longitude } = location;

      // สร้างแผนที่
      const map = L.map(mapRef.current).setView([latitude, longitude], 15);
      mapInstanceRef.current = map;

      // เพิ่ม OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      // เพิ่ม marker
      const marker = L.marker([latitude, longitude]).addTo(map);
      
      // เพิ่ม popup
      marker.bindPopup(`
        <div style="text-align: center;">
          <strong>${borrowerName}</strong><br>
          📍 ${location.address || 'ไม่ระบุที่อยู่'}<br>
          🌐 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
        </div>
      `).openPopup();

      // ปรับ zoom ให้เห็น marker ชัดเจน
      map.fitBounds(marker.getLatLng().toBounds(100));
    };

    document.head.appendChild(script);

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      // ลบ script และ CSS ที่เพิ่มเข้าไป
      const scripts = document.querySelectorAll('script[src*="leaflet"]');
      const links = document.querySelectorAll('link[href*="leaflet"]');
      scripts.forEach(s => s.remove());
      links.forEach(l => l.remove());
    };
  }, [isOpen, location, borrowerName]);

  if (!isOpen || !location) return null;

  const { latitude, longitude, address, timestamp } = location;

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

          {/* OpenStreetMap Container */}
          <div className="relative w-full h-96 rounded-lg overflow-hidden border border-gray-300 shadow-lg">
            <div 
              ref={mapRef} 
              className="w-full h-full"
              style={{ minHeight: '384px' }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 mt-4">
            <a
              href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <MapPinIcon className="w-4 h-4" />
              เปิดใน OpenStreetMap
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationMapDialog;