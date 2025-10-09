import { BiMessageSquareDetail } from "react-icons/bi";
import {
  BuildingOfficeIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { MdClose } from 'react-icons/md';
import { RiShoppingBasketFill } from "react-icons/ri";
import { API_BASE, UPLOAD_BASE, authFetch } from '../../../utils/api';

const EquipmentDetailDialog = ({ open, onClose, equipment }) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [roomImageModalOpen, setRoomImageModalOpen] = useState(false);
  const [currentRoomImageIndex, setCurrentRoomImageIndex] = useState(0);
  const [borrowHistory, setBorrowHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      if (equipment?.item_code || equipment?.code) {
        fetchBorrowHistory();
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open, equipment?.item_code, equipment?.code]);

  const fetchBorrowHistory = async () => {
    const itemCode = equipment?.item_code || equipment?.code;
    if (!itemCode) return;
    setLoading(true);
    try {
      const response = await authFetch(`${API_BASE}/equipment/${itemCode}/borrow-history`);
      if (response && response.ok) {
        const data = await response.json();
        setBorrowHistory(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching borrow history:', error);
      setBorrowHistory([]);
    } finally {
      setLoading(false);
    }
  };



  // Debug: Log equipment data
  useEffect(() => {
    if (equipment) {
      console.log('Equipment data:', equipment);
      console.log('room_id:', equipment.room_id);
      console.log('room_name:', equipment.room_name);
      console.log('room_image_url:', equipment.room_image_url);
      console.log('room_image_url type:', typeof equipment.room_image_url);
      console.log('Has room_image_url:', !!equipment.room_image_url);
      console.log('location:', equipment.location);
    }
  }, [equipment]);


  
  if (!open || !equipment) return null;

  // Build image list (support multiple images in pic: JSON array or single URL)
  const getImageUrls = () => {
    const fallback = `${UPLOAD_BASE}/equipment/${equipment.item_code || equipment.code}.jpg`;
    const pic = equipment.pic || equipment.image;
    if (!pic) return [fallback];
    if (typeof pic === 'string') {
      // Try parse JSON array
      if (pic.trim().startsWith('[') || pic.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(pic);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed
              .filter(Boolean)
              .map(u => {
                if (typeof u !== 'string') return null;
                if (u.startsWith('http')) return u;
                if (u.startsWith('/uploads')) return `${UPLOAD_BASE}${u}`;
                // Normalize common local uploads patterns
                const clean = u.replace(/^\/?uploads\//, '');
                return `${UPLOAD_BASE}/uploads/${clean}`;
              })
              .filter(Boolean);
          }
        } catch (e) {
          // fallthrough
        }
      }
      // Single string URL or local path
      if (pic.startsWith('http')) return [pic];
      if (pic.startsWith('/uploads')) return [`${UPLOAD_BASE}${pic}`];
      return [fallback];
    }
    return [fallback];
  };

  const imageUrls = getImageUrls();

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden transform animate-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="bg-blue-600 py-3 px-4 sm:py-4 sm:px-8 relative rounded-2xl">
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-start gap-3 sm:gap-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full overflow-hidden shadow-lg backdrop-blur-sm border border-white/30">
                <img
                  src={imageUrls[0]}
                  alt={equipment.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/lo.png';
                  }}
                />
              </div>
              <div className="text-white flex-1">
                <h1 className="text-xl sm:text-3xl font-bold drop-shadow-sm ">{equipment.name}</h1>
                <div className="flex items-center gap-2 mb-2 w-fit ml-1">
                  <span className="text-xs sm:text-sm font-mono font-semibold">{equipment.item_code || equipment.code}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {(equipment.category_name || equipment.category) && (
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-2 sm:px-4 py-1 sm:py-2 rounded-full border border-white/30">
                      <BuildingOfficeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm font-medium">{equipment.category_name || equipment.category}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-yellow-400/90 backdrop-blur-sm px-2 sm:px-4 py-1 sm:py-2 rounded-full border-2 border-yellow-300 shadow-lg">
                    <RiShoppingBasketFill className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-900" />
                    <span className="text-xs sm:text-sm font-bold text-yellow-900">{equipment.quantity || equipment.available || 1} {equipment.unit || 'ชิ้น'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={onClose}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-white/30"
              >
                <MdClose className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-140px)] bg-white">
        {/* Image Section */}
              <div className="rounded-2xl p-3 sm:p-6 transition-all duration-300 mb-6 w-full mx-auto shadow-2xl">
                <div className="bg-white rounded-xl overflow-hidden group">
                  {/* Main image area */}
                  <div className="relative h-[260px] sm:h-[340px] md:h-[400px]">
                    <img
                      src={imageUrls[currentImageIndex]}
                      alt={equipment.name}
                      className="w-full h-full object-contain cursor-pointer group-hover:scale-105 transition-all duration-500 filter group-hover:brightness-110"
                      onClick={() => setImageModalOpen(true)}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/lo.png';
                      }}
                    />
                    {/* Status Badge */}
                    <div className="absolute top-1 left-1">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg border ${
                        equipment.status === 'พร้อมใช้งาน' ? 'bg-green-100 text-green-800 border-green-300' :
                        equipment.status === 'ชำรุด' ? 'bg-red-100 text-red-800 border-red-300' :
                        equipment.status === 'กำลังซ่อม' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                        equipment.status === 'รออนุมัติซ่อม' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                        equipment.status === 'ถูกยืม' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-gray-100 text-gray-800 border-gray-300'
                      }`}>
                        {equipment.status || 'ไม่ระบุสถานะ'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom horizontal thumbnails */}
                  {imageUrls.length > 1 && (
                    <div className="bg-white/60 p-2">
                      <div className="flex gap-2 overflow-x-auto justify-center mt-5">
                        {imageUrls.map((url, idx) => (
                          <button
                            key={idx}
                            className={`relative flex-shrink-0 rounded-md overflow-hidden border-2 ${idx === currentImageIndex ? 'border-blue-500' : 'border-gray-200'} hover:border-blue-400 transition-all`}
                            onClick={() => { setCurrentImageIndex(idx); }}
                            title={`ดูภาพที่ ${idx + 1}`}
                          >
                            <img
                              src={url}
                              alt={`preview-${idx + 1}`}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover"
                              onError={(e) => { e.target.onerror = null; e.target.src = '/lo.png'; }}
                            />
                            <span className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1 rounded">{idx + 1}/{imageUrls.length}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600 bg-white px-4 py-2 rounded-full inline-flex items-center gap-2 shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    คลิกเพื่อขยายดูรูปภาพ
                  </p>
                </div>
              </div>

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Left Side - Equipment Details */}
            <div className="flex-1 space-y-4 sm:space-y-6">

              {/* Equipment Information */}
              <div className="bg-white rounded-2xl border-4 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-center gap-2 justify-center bg-blue-600 p-3 rounded-2xl mb-3">
                    <BiMessageSquareDetail className="text-white w-5 h-5" />
                    <h3 className="text-lg font-bold text-white">
                      รายละเอียดครุภัณฑ์
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {/* Price */}
                    {equipment.price && (
                      <div className="px-4">
                        <div className="flex items-center gap-3 mb-1">
                          <CurrencyDollarIcon className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-800">มูลค่า</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900 ml-8 ">฿{Number(equipment.price).toLocaleString('th-TH')}</p>
                      </div>
                    )}

                    {/* Purchase Date */}
                    {equipment.purchaseDate && (
                      <div className="px-4">
                        <div className="flex items-center gap-3 mb-2">
                          <CalendarIcon className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-800">วันที่จัดซื้อ</span>
                        </div>
                        <p className="text-base font-semibold text-blue-900 ml-8">
                          {new Date(equipment.purchaseDate).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    )}

                    {/* Description */}
                    {(equipment.description || equipment.specifications) && (
                      <div className="px-4">
                        <div className="flex items-center gap-3 mb-3">
                          <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-800">รายละเอียด</span>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed ml-8">{equipment.description || equipment.specifications}</p>
                      </div>
                    )}

                    {/* Storage Location */}
                    {(equipment.room_name || equipment.location) && (
                      <div className="px-4 pt-4 bg-blue-50 p-5 rounded-4xl shadow-lg border-2 border-blue-200">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <MapPinIcon className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-800">สถานที่จัดเก็บ</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-blue-200 shadow-md mb-3">
                            <img
                              src={(() => {
                                if (!equipment.room_image_url) return "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
                                try {
                                  const urls = JSON.parse(equipment.room_image_url);
                                  return Array.isArray(urls) && urls[0]
                                    ? (urls[0].startsWith('http') ? urls[0] : `${UPLOAD_BASE}${urls[0]}`)
                                    : "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
                                } catch {
                                  return equipment.room_image_url.startsWith('http')
                                    ? equipment.room_image_url
                                    : `${UPLOAD_BASE}${equipment.room_image_url}`;
                                }
                              })()}
                              alt="room"
                              className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-300"
                              onClick={() => { setCurrentRoomImageIndex(0); setRoomImageModalOpen(true); }}
                              onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3474/3474360.png"; }}
                            />
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-blue-900 text-base">{equipment.room_name || equipment.location}</p>
                            {equipment.room_address && (
                              <p className="text-sm text-blue-700 mt-1">{equipment.room_address}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Borrow History */}
            <div className="flex-1 lg:flex-2 space-y-4 sm:space-y-6">
              {/* Borrow History Section */}
              <div className="bg-blue-50 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                    <h3 className="text-base sm:text-lg font-bold text-blue-900 flex items-center gap-2 sm:gap-3">
                      <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      ผู้ยืมปัจจุบัน
                    </h3>
                  </div>
            
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-3 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3 shadow-lg"></div>
                      <p className="text-blue-700 text-sm font-medium bg-white/60 px-4 py-2 rounded-full inline-block">กำลังโหลด...</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 sm:max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
                      {/* แสดงเฉพาะสถานะที่กำลังดำเนินการ ไม่รวม completed */}
                      {borrowHistory.filter(item => ['pending', 'pending_approval', 'approved', 'carry', 'waiting_payment'].includes(item.status)).length > 0 ? (
                        borrowHistory.filter(item => ['pending', 'pending_approval', 'approved', 'carry', 'waiting_payment'].includes(item.status)).map((item, index) => (
                          <div 
                            key={item.borrow_id || index}
                            className="bg-white px-3 sm:px-7 py-3 sm:py-4 rounded-2xl sm:rounded-4xl border border-blue-200 hover:border-blue-300 transition-all duration-300"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <img
                                    src={item.borrower?.avatar ? 
                                      (item.borrower.avatar.startsWith('http') ? item.borrower.avatar : `${UPLOAD_BASE}/uploads/user/${item.borrower.avatar}`) 
                                      : '/profile.png'
                                    }
                                    alt={item.borrower?.name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                                    onError={(e) => { e.target.src = '/profile.png'; }}
                                  />
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 text-sm">{item.borrower?.name || 'ไม่ระบุ'}</p>
                                  <p className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full font-mono">{item.borrow_code}</p>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs mb-3">
                              <div className="bg-blue-50 px-7 sm:px-7 py-2 sm:py-3 rounded-full border border-blue-200">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="text-blue-700 font-semibold">วันที่ยืม</span>
                                </div>
                                <span className="font-semibold text-blue-900">{new Date(item.borrow_date).toLocaleDateString('th-TH')}</span>
                              </div>
                              <div className="bg-amber-50 px-7 sm:px-7 py-2 sm:py-3 rounded-full border border-amber-200">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                  <span className="text-amber-700 font-semibold">กำหนดคืน</span>
                                </div>
                                <span className="font-semibold text-blue-900">{new Date(item.due_date).toLocaleDateString('th-TH')}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <ClockIcon className="w-8 h-8 text-blue-600" />
                          </div>
                          <p className="text-blue-700 text-base font-semibold mb-2">ไม่มีผู้ยืมในขณะนี้</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
            {/* Carousel controls */}
            <button
              className="absolute left-0 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 p-2 rounded-full"
              onClick={() => setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length)}
              aria-label="previous"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <img
              src={imageUrls[currentImageIndex]}
              alt={equipment.name}
              className="max-w-[85vw] max-h-[75vh] object-contain rounded-lg shadow-2xl"
              onError={(e) => { e.target.onerror = null; e.target.src = '/lo.png'; }}
            />
            <button
              className="absolute right-0 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 p-2 rounded-full"
              onClick={() => setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length)}
              aria-label="next"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
            <div className="absolute -bottom-16 left-0 right-0 text-center">
              <p className="text-white text-lg font-medium">{equipment.name}</p>
              <p className="text-gray-300 text-sm">{equipment.item_code || equipment.code} • ภาพ {currentImageIndex + 1}/{imageUrls.length}</p>
            </div>
          </div>
          {/* Click outside to close */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setImageModalOpen(false)}
          />
          {/* Thumbnails in modal */}
          {imageUrls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 rounded-xl p-2 flex gap-2 max-w-[90vw] overflow-x-auto">
              {imageUrls.map((url, idx) => (
                <button
                  key={idx}
                  className={`w-14 h-14 rounded-md overflow-hidden border ${idx === currentImageIndex ? 'border-white' : 'border-transparent'} hover:opacity-80`}
                  onClick={() => setCurrentImageIndex(idx)}
                >
                  <img src={url} alt={`thumb-${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Room Image Modal */}
      {roomImageModalOpen && (() => {
        const getRoomImageUrls = () => {
          if (!equipment.room_image_url) return ["https://cdn-icons-png.flaticon.com/512/3474/3474360.png"];
          try {
            const urls = JSON.parse(equipment.room_image_url);
            if (Array.isArray(urls) && urls.length > 0) {
              return urls.map(u => u.startsWith('http') ? u : `${UPLOAD_BASE}${u}`);
            }
          } catch {}
          return equipment.room_image_url.startsWith('http') 
            ? [equipment.room_image_url] 
            : [`${UPLOAD_BASE}${equipment.room_image_url}`];
        };
        const roomImageUrls = getRoomImageUrls();
        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
            <div className="relative max-w-[90vw] max-h-[90vh] mb-10">
              <button
                onClick={() => setRoomImageModalOpen(false)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-white/20"
              >
                <MdClose className="w-8 h-8" />
              </button>
              <img
                src={roomImageUrls[currentRoomImageIndex]}
                alt={equipment.room_name || equipment.location}
                className="max-w-[85vw] max-h-[75vh] object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
                }}
              />
              <div className="absolute -bottom-16 left-0 right-0 text-center">
                <p className="text-white text-lg font-medium">ห้องจัดเก็บ: {equipment.room_name || equipment.location}</p>
                {equipment.room_address && (
                  <p className="text-gray-300 text-sm">{equipment.room_address}</p>
                )}
                {roomImageUrls.length > 1 && (
                  <p className="text-gray-300 text-sm">ภาพ {currentRoomImageIndex + 1}/{roomImageUrls.length}</p>
                )}
              </div>
            </div>
            <div 
              className="absolute inset-0 -z-10" 
              onClick={() => setRoomImageModalOpen(false)}
            />
            {roomImageUrls.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 rounded-xl p-2 flex gap-2 max-w-[90vw] overflow-x-auto">
                {roomImageUrls.map((url, idx) => (
                  <button
                    key={idx}
                    className={`w-14 h-14 rounded-md overflow-hidden border ${idx === currentRoomImageIndex ? 'border-white' : 'border-transparent'} hover:opacity-80`}
                    onClick={() => setCurrentRoomImageIndex(idx)}
                  >
                    <img src={url} alt={`room-thumb-${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default EquipmentDetailDialog;