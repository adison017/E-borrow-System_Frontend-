import { BiMessageSquareDetail } from "react-icons/bi"; 
import {
  ArrowPathIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  FunnelIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import {
  BanknotesIcon,
  CheckCircleIcon as CheckCircleSolidIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';
import { MdClose } from 'react-icons/md';
import { RiShoppingBasketFill } from "react-icons/ri";
import { API_BASE, UPLOAD_BASE, authFetch } from '../../../utils/api';
import BorrowDetailsViewDialog from './BorrowDetailsViewDialog';
import RepairApprovalDialog from './RepairApprovalDialog';

const EquipmentDetailDialog = ({ open, onClose, equipment }) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [roomImageModalOpen, setRoomImageModalOpen] = useState(false);
  const [borrowHistory, setBorrowHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [borrowerFilter, setBorrowerFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [showBorrowDialog, setShowBorrowDialog] = useState(false);
  const [repairHistory, setRepairHistory] = useState([]);
  const [loadingRepair, setLoadingRepair] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [showRepairDialog, setShowRepairDialog] = useState(false);
  const [repairStatusFilter, setRepairStatusFilter] = useState('all');
  const [showRepairFilters, setShowRepairFilters] = useState(false);

  useEffect(() => {
    if (open && equipment?.item_code) {
      fetchBorrowHistory();
      fetchRepairHistory();
    }
  }, [open, equipment?.item_code]);

  const fetchBorrowHistory = async () => {
    if (!equipment?.item_code) return;

    setLoading(true);
    try {
      const protectedUrl = `${API_BASE}/equipment/${equipment.item_code}/borrow-history`;

      // Use shared authFetch which attaches the JWT token and credentials
      let response = await authFetch(protectedUrl);

      // If protected route fails (unauthorized/not found), try the temporary public diagnostic endpoint
      if (!response.ok && (response.status === 401 || response.status === 403 || response.status === 404)) {
        const publicUrl = `${API_BASE}/equipment/public/borrow-history/${equipment.item_code}`;
        try {
          response = await fetch(publicUrl, { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
          console.error('Public fallback fetch failed:', err);
        }
      }

      if (response && response.ok) {
        const data = await response.json();
        setBorrowHistory(Array.isArray(data) ? data : []);
      } else {
        console.warn('Failed to fetch borrow history', response && response.status);
        setBorrowHistory([]);
      }
    } catch (error) {
      console.error('Error fetching borrow history:', error);
      setBorrowHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-4 font-semibold rounded-full border bg-green-50 text-green-800 border-green-200">
            <CheckCircleSolidIcon className="w-3 h-3" /> เสร็จสิ้น
          </span>
        );
      case "overdue":
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-4 font-semibold rounded-full border bg-red-50 text-red-800 border-red-200">
            <ExclamationTriangleIcon className="w-3 h-3" /> เกินกำหนด
          </span>
        );
      case "approved":
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-4 font-semibold rounded-full border bg-green-50 text-green-800 border-green-200">
            <CheckCircleSolidIcon className="w-3 h-3" /> ส่งมอบแล้ว
          </span>
        );
      case "carry":
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-4 font-semibold rounded-full border bg-yellow-50 text-yellow-800 border-yellow-200">
            <ClockIcon className="w-3 h-3" /> รอส่งมอบ
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-4 font-semibold rounded-full border bg-red-50 text-red-800 border-red-200">
            <ExclamationTriangleIcon className="w-3 h-3" /> ไม่อนุมัติ
          </span>
        );
      case "waiting_payment":
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-4 font-semibold rounded-full border bg-blue-50 text-blue-800 border-blue-200 animate-pulse">
            <BanknotesIcon className="w-3 h-3" /> รอชำระเงิน
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full border bg-gray-50 text-gray-800 border-gray-200">
            {status}
          </span>
        );
    }
  };

  const filterHistory = (history) => {
    let filtered = [...history];
    
    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(item => {
        const borrowDate = new Date(item.borrow_date);
        
        switch (timeFilter) {
          case 'day':
            return borrowDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return borrowDate >= weekAgo;
          case 'month':
            return borrowDate.getMonth() === now.getMonth() && borrowDate.getFullYear() === now.getFullYear();
          case 'year':
            return borrowDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    // Borrower filter
    if (borrowerFilter.trim()) {
      filtered = filtered.filter(item => 
        item.borrower?.name?.toLowerCase().includes(borrowerFilter.toLowerCase()) ||
        item.borrow_code?.toLowerCase().includes(borrowerFilter.toLowerCase())
      );
    }
    
    // Date range filter
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Include the entire end date
      
      filtered = filtered.filter(item => {
        const borrowDate = new Date(item.borrow_date);
        return borrowDate >= startDate && borrowDate <= endDate;
      });
    }
    
    return filtered;
  };

  const clearFilters = () => {
    setTimeFilter('all');
    setStatusFilter('all');
    setBorrowerFilter('');
    setDateRange({ start: '', end: '' });
  };

  const getUniqueStatuses = () => {
    const statuses = [...new Set(borrowHistory.map(item => item.status))];
    return statuses.filter(status => status);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (timeFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (borrowerFilter.trim()) count++;
    if (dateRange.start && dateRange.end) count++;
    return count;
  };

  const handleBorrowClick = (borrowItem) => {
    setSelectedBorrow(borrowItem);
    setShowBorrowDialog(true);
  };

  const fetchRepairHistory = async () => {
    if (!equipment?.item_code) return;

    setLoadingRepair(true);
    try {
      const url = `${API_BASE}/equipment/${equipment.item_code}/repair-history`;
      const response = await authFetch(url);

      if (response && response.ok) {
        const data = await response.json();
        setRepairHistory(Array.isArray(data) ? data : []);
      } else {
        console.warn('Failed to fetch repair history', response && response.status);
        setRepairHistory([]);
      }
    } catch (error) {
      console.error('Error fetching repair history:', error);
      setRepairHistory([]);
    } finally {
      setLoadingRepair(false);
    }
  };

  const handleRepairClick = (repairItem) => {
    setSelectedRepair(repairItem);
    setShowRepairDialog(true);
  };

  const getRepairStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-4 font-semibold rounded-full border bg-blue-50 text-blue-800 border-blue-200">
            <ArrowPathIcon className="w-3 h-3" /> กำลังซ่อม
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-4 font-semibold rounded-full border bg-green-50 text-green-800 border-green-200">
            <CheckCircleSolidIcon className="w-3 h-3" /> เสร็จสิ้น
          </span>
        );
      case "incomplete":
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-4 font-semibold rounded-full border bg-gray-50 text-gray-800 border-gray-200">
            <ExclamationTriangleIcon className="w-3 h-3" /> ไม่สำเร็จ
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-4 font-semibold rounded-full border bg-red-50 text-red-800 border-red-200">
            <ExclamationTriangleIcon className="w-3 h-3" /> ปฏิเสธ
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full border bg-gray-50 text-gray-800 border-gray-200">
            {status}
          </span>
        );
    }
  };

  if (!open || !equipment) return null;

  // Build image list (support multiple images in pic: JSON array or single URL)
  const getImageUrls = () => {
    const fallback = `${UPLOAD_BASE}/equipment/${equipment.item_code}.jpg`;
    const pic = equipment.pic;
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
                  src={equipment.pic?.startsWith('http')
                    ? equipment.pic
                    : `${UPLOAD_BASE}/equipment/${equipment.item_code}.jpg`
                  }
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
                  <span className="text-xs sm:text-sm font-mono font-semibold">{equipment.item_code}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {equipment.category_name && (
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-2 sm:px-4 py-1 sm:py-2 rounded-full border border-white/30">
                      <BuildingOfficeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm font-medium">{equipment.category_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-yellow-400/90 backdrop-blur-sm px-2 sm:px-4 py-1 sm:py-2 rounded-full border-2 border-yellow-300 shadow-lg">
                    <RiShoppingBasketFill className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-900" />
                    <span className="text-xs sm:text-sm font-bold text-yellow-900">{equipment.quantity || 1} {equipment.unit || 'ชิ้น'}</span>
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
                <div className="bg-white rounded-xl overflow-hidden group relative h-[260px] sm:h-[340px] md:h-[400px] flex">
                  {/* Left vertical thumbnails */}
                  {imageUrls.length > 1 && (
                    <div className="w-20 sm:w-24 md:w-28 h-full border-r border-gray-200 bg-white/60 p-2 overflow-y-auto">
                      <div className="flex flex-col gap-2">
                        {imageUrls.map((url, idx) => (
                          <button
                            key={idx}
                            className={`relative group rounded-md overflow-hidden border ${idx === currentImageIndex ? 'border-blue-500' : 'border-gray-200'} hover:border-blue-400`}
                            onClick={() => { setCurrentImageIndex(idx); }}
                            title={`ดูภาพที่ ${idx + 1}`}
                          >
                            <img
                              src={url}
                              alt={`preview-${idx + 1}`}
                              className="w-full h-14 object-cover"
                              onError={(e) => { e.target.onerror = null; e.target.src = '/lo.png'; }}
                            />
                            <span className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1 rounded">{idx + 1}/{imageUrls.length}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Main image area */}
                  <div className="flex-1 relative">
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
                        equipment.status === 'รออนุมัติซ่อม' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                        equipment.status === 'ถูกยืม' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-gray-100 text-gray-800 border-gray-300'
                      }`}>
                        {equipment.status || 'ไม่ระบุสถานะ'}
                      </span>
                    </div>
                    {/* Borrow Count Badge */}
                    <div className="absolute top-1 right-1">
                      <div className="bg-white px-3 py-1.5 rounded-full shadow-lg border border-gray-200 flex items-center gap-2">
                        <p className="text-xs font-semibold text-gray-800">จำนวนการยืม</p>
                        <span className="text-xs font-semibold text-gray-800">{borrowHistory.filter(item => item.status === 'completed').length}</span>
                      </div>
                    </div>
                  </div>
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
                    {equipment.description && (
                      <div className="px-4">
                        <div className="flex items-center gap-3 mb-3">
                          <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-800">รายละเอียด</span>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed ml-8">{equipment.description}</p>
                      </div>
                    )}

                    {/* Storage Location - Moved to bottom */}
                    {equipment.room_name && (
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
                                  return equipment.room_image_url && equipment.room_image_url.startsWith('http')
                                    ? equipment.room_image_url
                                    : `${UPLOAD_BASE}${equipment.room_image_url}`;
                                }
                              })()}
                              alt="room"
                              className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-300"
                              onClick={() => setRoomImageModalOpen(true)}
                              onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3474/3474360.png"; }}
                            />
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-blue-900 text-base">{equipment.room_name}</p>
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

            {/* Right Side - Borrow & Repair History */}
            <div className="flex-1 lg:flex-2 space-y-4 sm:space-y-6">
              {/* Borrow History Section */}
              <div className="bg-blue-50 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                    <h3 className="text-base sm:text-lg font-bold text-blue-900 flex items-center gap-2 sm:gap-3">
                      <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      ประวัติการยืม
                    </h3>
                    <div className="relative">
                      <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className="bg-white border border-blue-300 hover:border-blue-400 hover:bg-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-blue-800 flex items-center gap-2 relative shadow-md hover:shadow-lg transition-all duration-300 group"
                      >
                        <FunnelIcon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        กรอง
                        {getActiveFiltersCount() > 0 && (
                          <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center shadow-lg animate-pulse">
                            {getActiveFiltersCount()}
                          </span>
                        )}
                        {showFilters ? <ChevronUpIcon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" /> : <ChevronDownIcon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />}
                      </button>
                
                      {showFilters && (
                        <div className="absolute  sm:left-auto sm:right-0 mt-3 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-blue-200 z-10 animate-in slide-in-from-top-2 duration-300">
                          <div className="p-6 space-y-4">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-blue-200 pb-3">
                              <h4 className="font-bold text-blue-900 text-lg flex items-center gap-2">
                                <FunnelIcon className="w-4 h-4 text-blue-600" />
                                ตัวกรอง
                              </h4>
                              <button
                                onClick={clearFilters}
                                className="text-sm text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-full transition-all duration-200 font-medium"
                              >
                                ล้างทั้งหมด
                              </button>
                            </div>
                      
                      {/* Time Filter */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                          ช่วงเวลา
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'all', label: 'ทั้งหมด' },
                            { value: 'day', label: 'วันนี้' },
                            { value: 'week', label: 'สัปดาห์นี้' },
                            { value: 'month', label: 'เดือนนี้' },
                            { value: 'year', label: 'ปีนี้' },
                            { value: 'custom', label: 'กำหนดเอง' }
                          ].map(option => (
                            <button
                              key={option.value}
                              onClick={() => setTimeFilter(option.value)}
                              className={`px-3 py-2 text-xs rounded-xl border transition-all duration-200 font-medium hover:scale-105 ${
                                timeFilter === option.value 
                                  ? 'bg-blue-100 text-blue-700 border-blue-300 shadow-md' 
                                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:shadow-sm'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Custom Date Range */}
                      {timeFilter === 'custom' && (
                        <div className="grid grid-cols-2 gap-3 bg-blue-50 p-3 rounded-xl border border-blue-200">
                          <div>
                            <label className="block text-xs font-semibold text-blue-700 mb-2">วันที่เริ่มต้น</label>
                            <input
                              type="date"
                              value={dateRange.start}
                              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                              className="w-full px-3 py-2 text-xs border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-blue-700 mb-2">วันที่สิ้นสุด</label>
                            <input
                              type="date"
                              value={dateRange.end}
                              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                              className="w-full px-3 py-2 text-xs border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
                            />
                          </div>
                        </div>
                      )}
                      {/* Borrower Filter */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 pb-3 flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                          ผู้ยืม / รหัสการยืม
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="ค้นหาชื่อผู้ยืมหรือรหัสการยืม..."
                            value={borrowerFilter}
                            onChange={(e) => setBorrowerFilter(e.target.value)}
                            className="w-full px-4 py-3 pl-10 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 hover:shadow-md"
                          />
                          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
            
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-3 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3 shadow-lg"></div>
                      <p className="text-blue-700 text-sm font-medium bg-white/60 px-4 py-2 rounded-full inline-block">กำลังโหลดประวัติ...</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 sm:max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
                      {filterHistory(borrowHistory).filter(item => item.status === 'completed').length > 0 ? (
                        filterHistory(borrowHistory).filter(item => item.status === 'completed').map((item, index) => (
                          <div 
                            key={item.borrow_id || index}
                            onClick={() => handleBorrowClick(item)}
                            className="bg-white px-3 sm:px-7 py-3 sm:py-4 rounded-2xl sm:rounded-4xl border border-blue-200 hover:border-blue-300 transition-all duration-300 cursor-pointer group "
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
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md group-hover:scale-110 transition-transform duration-300"
                                    onError={(e) => { e.target.src = '/profile.png'; }}
                                  />
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors duration-300">{item.borrower?.name || 'ไม่ระบุ'}</p>
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
                          <p className="text-blue-700 text-base font-semibold mb-2">ไม่พบประวัติการยืม</p>
                          <p className="text-blue-600 text-sm mb-4">ลองปรับตัวกรองหรือเพิ่มข้อมูลใหม่</p>
                          {getActiveFiltersCount() > 0 && (
                            <button
                              onClick={clearFilters}
                              className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                              ล้างตัวกรอง
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
              </div>

              {/* Repair History Section */}
              <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                    <h3 className="text-base sm:text-lg font-bold text-amber-900 flex items-center gap-2 sm:gap-3">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      ประวัติการซ่อม
                    </h3>
                    <div className="relative">
                      <button 
                        onClick={() => setShowRepairFilters(!showRepairFilters)}
                        className="bg-white border border-amber-300 hover:border-amber-400 hover:bg-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-amber-800 flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-300 group"
                      >
                        <FunnelIcon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        กรอง
                        {showRepairFilters ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                      </button>
                      
                      {showRepairFilters && (
                        <div className="absolute sm:left-auto sm:right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-amber-200 z-10 animate-in slide-in-from-top-2 duration-300">
                          <div className="p-4 space-y-2">
                            <div className="flex items-center justify-between border-b border-amber-200 pb-2 mb-2">
                              <h4 className="font-bold text-amber-900 text-sm">สถานะ</h4>
                              {repairStatusFilter !== 'all' && (
                                <button
                                  onClick={() => setRepairStatusFilter('all')}
                                  className="text-xs text-amber-600 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-full transition-all duration-200"
                                >
                                  ล้าง
                                </button>
                              )}
                            </div>
                            {[
                              { value: 'all', label: 'ทั้งหมด', color: 'gray' },
                              { value: 'approved', label: 'กำลังซ่อม', color: 'blue' },
                              { value: 'completed', label: 'เสร็จสิ้น', color: 'green' },
                              { value: 'incomplete', label: 'ไม่สำเร็จ', color: 'gray' }
                            ].map(option => (
                              <button
                                key={option.value}
                                onClick={() => setRepairStatusFilter(option.value)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl transition-all duration-200 hover:scale-105 ${
                                  repairStatusFilter === option.value 
                                    ? `bg-${option.color}-100 text-${option.color}-700 font-semibold shadow-md` 
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                <span className={`h-2.5 w-2.5 rounded-full bg-${option.color}-500`}></span>
                                <span>{option.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
            
                  {loadingRepair ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-3 border-amber-300 border-t-amber-600 rounded-full animate-spin mx-auto mb-3 shadow-lg"></div>
                      <p className="text-amber-700 text-sm font-medium bg-white/60 px-4 py-2 rounded-full inline-block">กำลังโหลดประวัติ...</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 sm:max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-amber-100">
                      {repairHistory.filter(item => {
                        const validStatuses = ['approved', 'completed', 'incomplete'].includes(item.status);
                        const matchesFilter = repairStatusFilter === 'all' || item.status === repairStatusFilter;
                        return validStatuses && matchesFilter;
                      }).length > 0 ? (
                        repairHistory.filter(item => {
                          const validStatuses = ['approved', 'completed', 'incomplete'].includes(item.status);
                          const matchesFilter = repairStatusFilter === 'all' || item.status === repairStatusFilter;
                          return validStatuses && matchesFilter;
                        }).map((item, index) => (
                          <div 
                            key={item.id || index}
                            onClick={() => handleRepairClick(item)}
                            className="bg-white px-3 sm:px-7 py-3 sm:py-4 rounded-2xl sm:rounded-4xl border border-amber-200 hover:border-amber-300 transition-all duration-300 cursor-pointer group "
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <img
                                    src={item.requester?.avatar ? 
                                      (item.requester.avatar.startsWith('http') ? item.requester.avatar : `${UPLOAD_BASE}/uploads/user/${item.requester.avatar}`) 
                                      : '/profile.png'
                                    }
                                    alt={item.requester?.name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md group-hover:scale-110 transition-transform duration-300"
                                    onError={(e) => { e.target.src = '/profile.png'; }}
                                  />
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white"></div>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 text-sm group-hover:text-amber-700 transition-colors duration-300">{item.requester?.name || 'ไม่ระบุ'}</p>
                                  <p className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full font-mono">{item.repair_code}</p>
                                </div>
                              </div>
                              {getRepairStatusBadge(item.status)}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs mb-3">
                              <div className="bg-amber-50 px-7 sm:px-7 py-2 sm:py-3 rounded-full border border-amber-200">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                  <span className="text-amber-700 font-semibold">วันที่แจ้งซ่อม</span>
                                </div>
                                <span className="font-semibold text-amber-900">{new Date(item.request_date).toLocaleDateString('th-TH')}</span>
                              </div>
                              <div className="bg-green-50 px-7 sm:px-7 py-2 sm:py-3 rounded-full border border-green-200">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-green-700 font-semibold">ค่าใช้จ่าย</span>
                                </div>
                                <span className="font-semibold text-green-900">฿{Number(item.estimated_cost || 0).toLocaleString('th-TH')}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <p className="text-amber-700 text-base font-semibold mb-2">ไม่พบประวัติการซ่อม</p>
                          <p className="text-amber-600 text-sm">ครุภัณฑ์นี้ยังไม่เคยมีการแจ้งซ่อม</p>
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
              <p className="text-gray-300 text-sm">{equipment.item_code} • ภาพ {currentImageIndex + 1}/{imageUrls.length}</p>
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
                if (!equipment.room_image_url) return "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
                try {
                  const urls = JSON.parse(equipment.room_image_url);
                  return Array.isArray(urls) && urls[0]
                    ? (urls[0].startsWith('http') ? urls[0] : `${UPLOAD_BASE}${urls[0]}`)
                    : "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
                } catch {
                  return equipment.room_image_url && equipment.room_image_url.startsWith('http')
                    ? equipment.room_image_url
                    : `${UPLOAD_BASE}${equipment.room_image_url}`;
                }
              })()}
              alt={equipment.room_name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
              }}
            />
            <div className="absolute -bottom-16 left-0 right-0 text-center">
              <p className="text-white text-lg font-medium">ห้องจัดเก็บ: {equipment.room_name}</p>
              {equipment.room_address && (
                <p className="text-gray-300 text-sm">{equipment.room_address}</p>
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

      {/* Borrow Details Dialog */}
      <BorrowDetailsViewDialog
        borrowItem={selectedBorrow}
        isOpen={showBorrowDialog}
        onClose={() => {
          setShowBorrowDialog(false);
          setSelectedBorrow(null);
        }}
      />

      {/* Repair Details Dialog */}
      <RepairApprovalDialog
        open={showRepairDialog}
        onClose={() => {
          setShowRepairDialog(false);
          setSelectedRepair(null);
        }}
        repairRequest={selectedRepair}
        onApprove={() => {
          fetchRepairHistory();
          setShowRepairDialog(false);
        }}
        onReject={() => {
          fetchRepairHistory();
          setShowRepairDialog(false);
        }}
      />
      </div>
      </div>
  );
};

export default EquipmentDetailDialog;