import React, { useState, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import { 
  TagIcon,
  CubeIcon,
  InformationCircleIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { UPLOAD_BASE } from '../../../utils/api';
import axios from '../../../utils/axios';

const EquipmentDetailDialog = ({
  showDetailDialog,
  setShowDetailDialog,
  selectedEquipment,
  showImageModal
}) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [roomImageModalOpen, setRoomImageModalOpen] = useState(false);
  const [borrowCount, setBorrowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  if (!showDetailDialog || !selectedEquipment) return null;

  // Fetch borrow count when equipment changes
  useEffect(() => {
    if (selectedEquipment?.item_id) {
      fetchBorrowCount();
    }
  }, [selectedEquipment?.item_id]);

  const fetchBorrowCount = async () => {
    if (!selectedEquipment?.item_id) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${UPLOAD_BASE}/dashboard/top-borrowed-equipment`);
      const equipment = response.data.find(item => item.name === selectedEquipment.name);
      setBorrowCount(equipment ? equipment.count : 0);
    } catch (error) {
      console.error('Error fetching borrow count:', error);
      setBorrowCount(0);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'พร้อมใช้งาน':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ชำรุด':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'กำลังซ่อม':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'รออนุมัติซ่อม':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ถูกยืม':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 to-blue-700 p-4 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <CubeIcon className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">รายละเอียดครุภัณฑ์</h2>
                <p className="text-blue-100 mt-1">ข้อมูลสำหรับผู้ใช้งาน</p>
              </div>
            </div>
            <button
              onClick={() => setShowDetailDialog(false)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Image and Status */}
            <div className="space-y-6">
              {/* Equipment Image */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center relative">
                {/* Status Badge - Top Right */}
                <div className="absolute top-2 right-2 z-10">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(selectedEquipment.status)}`}>
                    {selectedEquipment.status || 'ไม่ระบุสถานะ'}
                  </span>
                </div>
                <img
                  src={selectedEquipment.pic?.startsWith('http') 
                    ? selectedEquipment.pic 
                    : selectedEquipment.image || `${UPLOAD_BASE}/equipment/${selectedEquipment.item_code || selectedEquipment.code}.jpg`
                  }
                  alt={selectedEquipment.name}
                  className="w-full max-w-sm mx-auto h-64 object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setImageModalOpen(true)}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/lo.png';
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">คลิกเพื่อขยายดูรูปภาพ</p>
                
              </div>
              
              {/* Room Image */}
              {selectedEquipment.room_name && selectedEquipment.room_image_url && (
                <div className="bg-orange-50 rounded-xl border border-orange-100 p-4 text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <MapPinIcon className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold text-gray-800">รูปภาพห้องจัดเก็บ</h3>
                  </div>
                  <img
                    src={(() => {
                      if (!selectedEquipment.room_image_url) return "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
                      try {
                        const urls = JSON.parse(selectedEquipment.room_image_url);
                        return Array.isArray(urls) && urls[0] 
                          ? (urls[0].startsWith('http') ? urls[0] : `${UPLOAD_BASE}${urls[0]}`) 
                          : "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
                      } catch {
                        return selectedEquipment.room_image_url && selectedEquipment.room_image_url.startsWith('http') 
                          ? selectedEquipment.room_image_url 
                          : `${UPLOAD_BASE}${selectedEquipment.room_image_url}`;
                      }
                    })()} 
                    alt={selectedEquipment.room_name}
                    className="w-full max-w-sm mx-auto h-48 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity shadow-md"
                    onClick={() => setRoomImageModalOpen(true)}
                    onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3474/3474360.png"; }}
                  />
                  <p className="text-sm text-orange-600 font-medium mt-2">{selectedEquipment.room_name}</p>
                  <p className="text-xs text-gray-500 mt-1">คลิกเพื่อขยายดูรูปภาพห้อง</p>
                </div>
              )}
            </div>

            {/* Right Column - Detailed Information */}
            <div className="space-y-4">
              
              {/* Category */}
              {selectedEquipment.category_name && (
                <div className="bg-purple-50 rounded-xl border border-purple-100 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <BuildingOfficeIcon className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-800">หมวดหมู่</h3>
                  </div>
                  <p className="text-lg text-purple-600 font-medium">
                    {selectedEquipment.category_name}
                  </p>
                </div>
              )}

              {/* Description - Full Width */}
              {(selectedEquipment.description || selectedEquipment.specifications) && (
                <div className=" bg-blue-50 rounded-xl border border-blue-100 p-6">
                  <p className="text-base text-gray-700 font-medium mb-1">{selectedEquipment.name} {selectedEquipment.quantity || selectedEquipment.available || 1} {selectedEquipment.unit || 'ชิ้น'}</p>
                  <p className="text-xs font-mono mb-1">รหัสครุภัณฑ์: {selectedEquipment.item_code || selectedEquipment.code}</p>
                  <p className="text-gray-700 leading-relaxed text-xs">
                    รายละเอียดครุภัณฑ์: {selectedEquipment.description || selectedEquipment.specifications}
                  </p>
                </div>
              )}

              {/* Price */}
              {selectedEquipment.price && (
                <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CurrencyDollarIcon className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-semibold text-gray-800">ราคา</h3>
                  </div>
                  <p className="text-lg text-emerald-600 font-medium">
                    {Number(selectedEquipment.price).toLocaleString('th-TH')} บาท
                  </p>
                </div>
              )}

              {/* Purchase Date */}
              {selectedEquipment.purchaseDate && (
                <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-800">วันที่จัดซื้อ</h3>
                  </div>
                  <p className="text-lg text-blue-600 font-medium">
                    {new Date(selectedEquipment.purchaseDate).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {/* Storage Location */}
              {(selectedEquipment.room_name || selectedEquipment.location) && (
                <div className="bg-orange-50 rounded-xl border border-orange-100 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPinIcon className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold text-gray-800">สถานที่จัดเก็บ</h3>
                  </div>
                  
                  {/* Room Preview with Image */}
                  {selectedEquipment.room_name && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-orange-200 mb-2">
                      <div className="relative">
                        <img
                          src={(() => {
                            // Always show default room icon if no room_image_url
                            if (!selectedEquipment.room_image_url) {
                              return "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
                            }
                            
                            // Try to parse JSON array format
                            try {
                              const urls = JSON.parse(selectedEquipment.room_image_url);
                              if (Array.isArray(urls) && urls.length > 0 && urls[0]) {
                                return urls[0].startsWith('http') ? urls[0] : `${UPLOAD_BASE}${urls[0]}`;
                              }
                            } catch (e) {
                              // If not JSON, treat as direct URL
                              if (selectedEquipment.room_image_url.startsWith('http')) {
                                return selectedEquipment.room_image_url;
                              }
                              return `${UPLOAD_BASE}${selectedEquipment.room_image_url}`;
                            }
                            
                            // Fallback to default icon
                            return "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
                          })()} 
                          alt="room preview"
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setRoomImageModalOpen(true)}
                          onError={(e) => { 
                            e.target.src = "https://cdn-icons-png.flaticon.com/512/3474/3474360.png"; 
                          }}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg text-orange-600 font-medium">
                          {selectedEquipment.room_name}
                        </span>
                        {selectedEquipment.room_address && (
                          <span className="text-xs text-gray-500">
                            {selectedEquipment.room_address}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 mt-1">คลิกรูปเพื่อขยายดู</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Additional Location Info */}
                  {selectedEquipment.location && selectedEquipment.location !== selectedEquipment.room_name && (
                    <div className="bg-orange-25 rounded-lg p-2 border border-orange-100">
                      <span className="text-sm font-medium text-orange-700">
                        ตำแหน่งเพิ่มเติม: 
                      </span>
                      <span className="text-sm text-orange-600">
                        {selectedEquipment.location}
                      </span>
                    </div>
                  )}
                  
                  {/* Room Details */}
                  {selectedEquipment.room_detail && (
                    <div className="mt-2 text-xs text-gray-600">
                      <span className="font-medium">รายละเอียดห้อง: </span>
                      {selectedEquipment.room_detail}
                    </div>
                  )}
                </div>
              )}

              {/* Created Date */}
              {selectedEquipment.created_at && (
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CalendarIcon className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">วันที่เพิ่มเข้าระบบ</h3>
                  </div>
                  <p className="text-lg text-gray-700 font-medium">
                    {new Date(selectedEquipment.created_at).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}

              {/* Total Borrow Count */}
              <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <InformationCircleIcon className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-gray-800">จำนวนครั้งที่ถูกยืม</h3>
                </div>
                <p className="text-lg text-emerald-600 font-medium">
                  {loading ? 'กำลังโหลด...' : `${borrowCount} ครั้ง`}
                </p>
              </div>
            </div>
          </div>

          
        </div>
      </div>

      {/* Image Modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-white/20"
            >
              <MdClose className="w-8 h-8" />
            </button>
            <img
              src={selectedEquipment.pic?.startsWith('http') 
                ? selectedEquipment.pic 
                : selectedEquipment.image || `${UPLOAD_BASE}/equipment/${selectedEquipment.item_code || selectedEquipment.code}.jpg`
              }
              alt={selectedEquipment.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/lo.png';
              }}
            />
            <div className="absolute -bottom-16 left-0 right-0 text-center">
              <p className="text-white text-lg font-medium">{selectedEquipment.name}</p>
              <p className="text-gray-300 text-sm">{selectedEquipment.item_code || selectedEquipment.code}</p>
            </div>
          </div>
          {/* Click outside to close */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setImageModalOpen(false)}
          />
        </div>
      )}

      {/* Room Image Modal */}
      {roomImageModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              onClick={() => setRoomImageModalOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-white/20"
            >
              <MdClose className="w-8 h-8" />
            </button>
            <img
              src={(() => {
                // Always show default room icon if no room_image_url
                if (!selectedEquipment.room_image_url) {
                  return "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
                }
                
                // Try to parse JSON array format
                try {
                  const urls = JSON.parse(selectedEquipment.room_image_url);
                  if (Array.isArray(urls) && urls.length > 0 && urls[0]) {
                    return urls[0].startsWith('http') ? urls[0] : `${UPLOAD_BASE}${urls[0]}`;
                  }
                } catch (e) {
                  // If not JSON, treat as direct URL
                  if (selectedEquipment.room_image_url.startsWith('http')) {
                    return selectedEquipment.room_image_url;
                  }
                  return `${UPLOAD_BASE}${selectedEquipment.room_image_url}`;
                }
                
                // Fallback to default icon
                return "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
              })()} 
              alt={selectedEquipment.room_name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
              }}
            />
            <div className="absolute -bottom-16 left-0 right-0 text-center">
              <p className="text-white text-lg font-medium">ห้องจัดเก็บ: {selectedEquipment.room_name}</p>
              {selectedEquipment.room_address && (
                <p className="text-gray-300 text-sm">{selectedEquipment.room_address}</p>
              )}
            </div>
          </div>
          {/* Click outside to close */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setRoomImageModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

export default EquipmentDetailDialog;