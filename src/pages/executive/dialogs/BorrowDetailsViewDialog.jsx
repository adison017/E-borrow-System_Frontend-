import {
  CheckCircleIcon as CheckCircleSolidIcon,
  ClockIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/solid";
import { MdClose } from "react-icons/md";
import { useState, useEffect } from "react";
import DocumentViewer from '../../../components/DocumentViewer';
import { UPLOAD_BASE, getBorrowById } from '../../../utils/api';

const BorrowDetailsViewDialog = ({ borrowItem, isOpen, onClose }) => {
  const [detailedBorrowItem, setDetailedBorrowItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    imageUrl: '',
    title: ''
  });
  // Add state for carousel
  const [carouselModal, setCarouselModal] = useState({
    isOpen: false,
    photos: [],
    currentIndex: 0,
    title: ''
  });

  // ESC key handler for image modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (carouselModal.isOpen) {
          closeCarouselModal();
        } else if (imageModal.isOpen) {
          closeImageModal();
        }
      }
    };

    if (imageModal.isOpen || carouselModal.isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [imageModal.isOpen, carouselModal.isOpen]);

  const handleViewImage = (imagePath, title) => {
    if (!imagePath) return;

    console.log('handleViewImage called with:', { imagePath, title });

    let fullImageUrl;
    if (imagePath.startsWith('http')) {
      fullImageUrl = imagePath;
    } else if (title.includes('รูปถ่ายภาพบัตรนักศึกษา')) {
      fullImageUrl = `${UPLOAD_BASE}/uploads/signature/${imagePath}`;
    } else if (title === 'สลิป/หลักฐานการโอน') {
      fullImageUrl = `${UPLOAD_BASE}/uploads/pay_slip/${imagePath}`;
    } else if (title.includes('รูปถ่ายส่งมอบครุภัณฑ์')) {
      fullImageUrl = `${UPLOAD_BASE}/uploads/handover/${imagePath}`;
    } else if (title.includes('ภาพความเสียหาย')) {
      // For damage photos, the imagePath should already be a full URL or relative path
      if (imagePath.startsWith('/')) {
        fullImageUrl = `${UPLOAD_BASE}${imagePath}`;
      } else {
        fullImageUrl = imagePath;
      }
    } else if (imagePath.startsWith('/')) {
      // Handle absolute paths (like those from Cloudinary or damage photos)
      fullImageUrl = imagePath;
    } else {
      // Handle relative paths
      fullImageUrl = `${UPLOAD_BASE}/uploads/${imagePath}`;
    }

    console.log('Constructed fullImageUrl:', fullImageUrl);

    setImageModal({
      isOpen: true,
      imageUrl: fullImageUrl,
      title: title
    });
    console.log('setImageModal called with:', { isOpen: true, imageUrl: fullImageUrl, title });
  };

  // New function to handle carousel view for damage photos
  const handleViewDamagePhotos = (photos, title) => {
    if (!photos || photos.length === 0) return;
    
    setCarouselModal({
      isOpen: true,
      photos: photos,
      currentIndex: 0,
      title: title
    });
  };

  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      imageUrl: '',
      title: ''
    });
  };

  const closeCarouselModal = () => {
    setCarouselModal({
      isOpen: false,
      photos: [],
      currentIndex: 0,
      title: ''
    });
  };

  // Carousel navigation functions
  const nextPhoto = () => {
    setCarouselModal(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.photos.length
    }));
  };

  const prevPhoto = () => {
    setCarouselModal(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? prev.photos.length - 1 : prev.currentIndex - 1
    }));
  };

  // Handle keyboard navigation in carousel
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!carouselModal.isOpen) return;
      
      if (event.key === 'ArrowRight') {
        nextPhoto();
      } else if (event.key === 'ArrowLeft') {
        prevPhoto();
      } else if (event.key === 'Escape') {
        closeCarouselModal();
      }
    };

    if (carouselModal.isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [carouselModal.isOpen, carouselModal.currentIndex]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "carry":
        return <span className="inline-flex items-center gap-1 rounded-lg bg-yellow-100 px-2 py-1 text-yellow-800 text-xs font-semibold"><ClockIcon className="w-4 h-4" /> รอส่งมอบ</span>;
      case "approved":
        return <span className="inline-flex items-center gap-1 rounded-lg bg-green-100 px-2 py-1 text-green-700 text-xs font-semibold"><CheckCircleSolidIcon className="w-4 h-4" /> ส่งมอบแล้ว</span>;
      case "completed":
        return <span className="inline-flex items-center gap-1 rounded-lg bg-purple-100 px-2 py-1 text-purple-700 text-xs font-semibold"><CheckCircleSolidIcon className="w-4 h-4" /> เสร็จสิ้น</span>;
      case "overdue":
        return <span className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2 py-1 text-red-700 text-xs font-semibold"><ExclamationTriangleIcon className="w-4 h-4" /> เกินกำหนด</span>;
      case "rejected":
        return <span className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2 py-1 text-red-700 text-xs font-semibold"><ExclamationTriangleIcon className="w-4 h-4" /> ไม่อนุมัติ</span>;
      case "waiting_payment":
        return <span className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-2 py-1 text-blue-700 text-xs font-semibold animate-pulse border border-blue-200"><CheckCircleSolidIcon className="w-4 h-4" /> รอชำระเงิน</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-gray-700 text-xs font-semibold">-</span>;
    }
  };

  // Fetch detailed borrow data when dialog opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (borrowItem?.borrow_id) {
        setLoading(true);
        getBorrowById(borrowItem.borrow_id)
          .then(data => {
            console.log('Detailed borrow data:', data);
            setDetailedBorrowItem(data);
          })
          .catch(error => {
            console.warn('Could not fetch detailed borrow data:', error);
            setDetailedBorrowItem(borrowItem);
          })
          .finally(() => setLoading(false));
      } else {
        setDetailedBorrowItem(null);
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, borrowItem?.borrow_id]);

  // Move the early return after all hooks and functions are declared
  if (!isOpen || !borrowItem) return null;

  // Use detailed data if available, fallback to original borrowItem
  const displayItem = detailedBorrowItem || borrowItem;
  const equipmentItems = Array.isArray(displayItem.equipment) ? displayItem.equipment : [displayItem.equipment];

  return (
    <>
      <div className="modal modal-open flex items-center justify-center">
      <div data-theme="light" className="max-w-8xl w-full h-full max-h-[95vh] rounded-2xl shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex flex-col h-full">
          {/* Enhanced Header with gradient and status badge */}
          <div className="sticky z-10 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg rounded-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                    <DocumentCheckIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-white">
                        รายละเอียดการยืมครุภัณฑ์
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-white">
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        รหัส: <span className="font-mono font-semibold text-white">{displayItem.borrow_code || '-'}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all duration-200 hover:scale-105"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>
            </div>
            {/* Decorative wave */}
            <div className="h-4 bg-gradient-to-r from-blue-500 to-indigo-600 mb-3">
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="currentColor" className="text-blue-50"></path>
                <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="currentColor" className="text-blue-50"></path>
                <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="currentColor" className="text-blue-50"></path>
              </svg>
            </div>
          </div>
          <div className="overflow-y-auto p-6 flex-grow bg-gradient-to-b from-transparent to-blue-50/30">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-blue-600 font-medium">กำลังโหลดข้อมูลเพิ่มเติม...</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Borrower Info */}
              <div className="space-y-6 lg:order-1">
                {/* SectionHeader component */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500 rounded-xl shadow-md">
                    <span className="text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">ข้อมูลผู้ยืม</h4>
                    <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="p-6">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-200 shadow-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                          <img
                            src={
                              displayItem.borrower?.avatar
                                ? displayItem.borrower.avatar.startsWith('http')
                                  ? displayItem.borrower.avatar
                                  : `${UPLOAD_BASE}/uploads/user/${displayItem.borrower.avatar}`
                                : '/profile.png'
                            }
                            alt={displayItem.borrower?.name}
                            className="w-full h-full object-cover"
                            onClick={() => handleViewImage(
                              displayItem.borrower?.avatar
                                ? displayItem.borrower.avatar.startsWith('http')
                                  ? displayItem.borrower.avatar
                                  : `${UPLOAD_BASE}/uploads/user/${displayItem.borrower.avatar}`
                                : null,
                              `รูปภาพนิสิต - ${displayItem.borrower?.name}`
                            )}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/profile.png';
                            }}
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                          <CheckCircleSolidIcon className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="font-bold text-xl text-gray-800">{displayItem.borrower?.name || '-'}</h3>
                        {displayItem.borrower?.position && (
                          <p className="text-blue-600 font-medium">{displayItem.borrower.position}</p>
                        )}
                        {displayItem.borrower?.department && (
                          <p className="text-gray-600 text-sm bg-gray-100 px-3 py-1 rounded-full inline-block">{displayItem.borrower.department}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 space-y-3">
                      <div className="flex justify-between items-center bg-white px-4 py-2 rounded-full border border-blue-200 shadow-sm">
                        <span className="text-sm font-medium text-gray-600">รหัสการยืม</span>
                        <span className="text-sm font-medium text-blue-700">{displayItem.borrow_code || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2 bg-white px-3 py-2 rounded-full border border-blue-200 shadow-sm">
                        <span className="text-gray-500">วันที่ยืม</span>
                        <span className="text-blue-700 text-sm font-medium">
                          {displayItem.borrow_date ? new Date(displayItem.borrow_date).toLocaleDateString('th-TH') :
                           displayItem.borrowDate ? new Date(displayItem.borrowDate).toLocaleDateString('th-TH') : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2 bg-white px-3 py-2 rounded-full border border-blue-200 shadow-sm">
                        <span className="text-gray-500">กำหนดคืน</span>
                        <span className=" text-blue-700 text-sm font-medium">
                          {displayItem.due_date ? new Date(displayItem.due_date).toLocaleDateString('th-TH') :
                           displayItem.dueDate ? new Date(displayItem.dueDate).toLocaleDateString('th-TH') : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-white px-3 py-2 rounded-full border border-blue-200 shadow-sm">
                        <span className="text-sm font-medium text-gray-700">วันที่คืน</span>
                        <span className="text-sm font-medium text-blue-700">{displayItem.return_date ? new Date(displayItem.return_date).toLocaleString('th-TH') : '-'}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white px-4 py-2 rounded-full border border-blue-200 shadow-sm">
                        <span className="text-sm font-medium text-gray-600">สถานะ</span>
                        {getStatusBadge(displayItem.status)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Purpose Box */}
                {displayItem.purpose && (
                  <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl shadow-md bg-blue-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-800">วัตถุประสงค์</h4>
                          <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-gray-700 whitespace-pre-line">{displayItem.purpose}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* รูปภาพการยืม */}
                <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-sm">รูปภาพการยืม</h3>
                        <p className="text-xs text-gray-500">หลักฐานการยืมครุภัณฑ์</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Preview images section */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {displayItem?.signature_image && (
                          <div className="relative group">
                            <div 
                              className="w-full h-32 bg-gray-100 rounded-lg border border-gray-300 overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                              onClick={() => handleViewImage(displayItem.signature_image, '  รูปถ่ายภาพบัตรนักศึกษา')}
                            >
                              <img 
                                src={displayItem.signature_image.startsWith('http') ? displayItem.signature_image : `${UPLOAD_BASE}/uploads/signature/${displayItem.signature_image}`}
                                alt="Student ID Photo Preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/lo.png';
                                }}
                              />
                            </div>
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                              บัตรนักศึกษา
                            </div>
                          </div>
                        )}
                        
                        {displayItem?.handover_photo && (
                          <div className="relative group">
                            <div 
                              className="w-full h-32 bg-gray-100 rounded-lg border border-gray-300 overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                              onClick={() => handleViewImage(displayItem.handover_photo, 'รูปถ่ายส่งมอบครุภัณฑ์')}
                            >
                              <img 
                                src={displayItem.handover_photo.startsWith('http') ? displayItem.handover_photo : `${UPLOAD_BASE}/uploads/handover/${displayItem.handover_photo}`}
                                alt="Handover Photo Preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/lo.png';
                                }}
                              />
                            </div>
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                              ส่งมอบครุภัณฑ์
                            </div>
                          </div>
                        )}
                      </div>

                      {/* แสดงข้อความเมื่อไม่มีรูปภาพ */}
                      {!displayItem?.signature_image && !displayItem?.handover_photo && (
                        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-emerald-200">
                          <div className="bg-gradient-to-r from-emerald-100 to-teal-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-gray-600">ไม่มีรูปภาพการยืม</p>
                          <p className="text-xs text-gray-400 mt-1">ยังไม่มีการอัปโหลดรูปภาพหลักฐาน</p>
                        </div>
                      )}
                      {/* เอกสารสำคัญที่แนบ */}
                      <div className="mt-4 pt-3">
                        <DocumentViewer
                          documents={displayItem.important_documents || []}
                          title="เอกสารสำคัญที่แนบ"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Damage Photos Section - Show only when status is completed */}
                {displayItem.status === "completed" && (
                  <div className="bg-white/80 backdrop-blur-sm border border-red-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-500 rounded-xl shadow-md">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-800">ภาพความเสียหาย</h4>
                          <div className="w-12 h-1 bg-red-500 rounded-full"></div>
                        </div>
                      </div>

                      {displayItem.return_items && displayItem.return_items.some(item => item.damage_photos && item.damage_photos.length > 0) ? (
                        <div className="space-y-6">
                          {displayItem.return_items.map((item, index) => {
                            // Check if this item has damage photos
                            if (!item.damage_photos || !Array.isArray(item.damage_photos) || item.damage_photos.length === 0) {
                              return null;
                            }
                            
                            // Calculate damage percentage if available
                            const damagePercentage = item.damage_level ? `${item.damage_level}%` : 'ไม่ระบุ';
                            
                            return (
                              <div key={item.item_id || index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center gap-3 mb-3 flex-wrap">
                                  <div className="font-semibold text-gray-800">{item.equipment_name || item.name}</div>
                                  <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs font-mono rounded-md">
                                    {item.item_code}
                                  </span>
                                  {item.damage_level && (
                                    <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-md">
                                      ความเสียหาย: {damagePercentage}
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                  {item.damage_photos.map((photoUrl, photoIndex) => {
                                    // Construct full URL if needed
                                    let fullPhotoUrl;
                                    if (photoUrl && photoUrl.startsWith('http')) {
                                      fullPhotoUrl = photoUrl;
                                    } else if (photoUrl) {
                                      fullPhotoUrl = `${UPLOAD_BASE}${photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`}`;
                                    } else {
                                      fullPhotoUrl = '/lo.png';
                                    }
                                    
                                    return (
                                      <div
                                        key={photoIndex}
                                        className="relative group cursor-pointer"
                                        onClick={() => {
                                          // Get all damage photos for this item
                                          const allPhotos = item.damage_photos.map(photoUrl => {
                                            if (photoUrl && photoUrl.startsWith('http')) {
                                              return photoUrl;
                                            } else if (photoUrl) {
                                              return `${UPLOAD_BASE}${photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`}`;
                                            } else {
                                              return '/lo.png';
                                            }
                                          });
                                          handleViewDamagePhotos(allPhotos, `ภาพความเสียหายของ ${item.equipment_name || item.name}`);
                                        }}
                                      >
                                        <div className="w-full aspect-square bg-gray-100 rounded-lg border border-gray-300 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                                          <img 
                                            src={fullPhotoUrl} 
                                            alt={`Damage ${photoIndex + 1} for ${item.equipment_name || item.name}`}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            onError={(e) => {
                                              e.target.onerror = null;
                                              e.target.src = '/lo.png';
                                            }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-500">ไม่มีภาพความเสียหายสำหรับรายการนี้</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Equipment List and Form */}
              <div className="lg:col-span-2 space-y-6 lg:order-2">
                {/* Equipment List */}
                <div className="space-y-4">
                  {/* SectionHeader for equipment */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500 rounded-xl shadow-md">
                      <span className="text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-800">รายการครุภัณฑ์ที่ยืม</h4>
                      <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                  {/* Equipment Summary Card */}
                  <div className="bg-black rounded-4xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">สรุปรายการ</h3>
                        <p className="text-white">จำนวนครุภัณฑ์ทั้งหมด</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">{equipmentItems?.reduce((total, eq) => total + (eq.quantity || 1), 0) || 0}</div>
                        <div className="text-sm text-white">รายการ</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-4xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="overflow-x-auto">
                      <div className="min-w-[340px]">
                        <table className="min-w-full">
                          <thead className="bg-blue-500">
                            <tr>
                              <th className="px-4 py-4 text-center text-sm font-semibold text-white uppercase tracking-wider">รูป</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">ครุภัณฑ์</th>
                              <th className="px-6 py-4 text-center text-sm font-semibold text-white uppercase tracking-wider">จำนวน</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-blue-100">
                            {equipmentItems.length > 0 ? equipmentItems.map((item, index) => (
                              <tr key={item.item_id || index} className="hover:bg-blue-50/50 transition-colors duration-200">
                                <td className="px-4 py-4 text-center">
                                  <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center mx-auto border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
                                    <img
                                      src={item.pic?.startsWith('http') ? item.pic : `${UPLOAD_BASE}/equipment/${item.item_code || item.code}.jpg`}
                                      alt={item.name}
                                      className="max-w-full max-h-full object-contain p-2"
                                      onError={e => { e.target.onerror = null; e.target.src = '/lo.png'; }}
                                    />
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-gray-800 text-base leading-tight">{item.name}</span>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded-md">
                                        {item.item_code}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white font-bold text-lg rounded-full shadow-md">
                                    {item.quantity || 1}
                                  </div>
                                </td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={3} className="p-12 text-center">
                                  <div className="flex flex-col items-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <p className="text-gray-400 text-lg">ไม่พบข้อมูลครุภัณฑ์</p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loan Details & Return Status */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  {/* Section: Payment Details (always show) */}
                  {(displayItem.fine_amount > 0 || displayItem.pay_status || displayItem.payment_method) && (
                    <div className="bg-blue-50 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 mb-3">
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-500 rounded-xl shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-4.41 0-8-1.79-8-4V6c0-2.21 3.59-4 8-4s8 1.79 8 4v8c0 2.21-3.59 4-8 4z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-black">สถานะการชำระเงิน</h4>
                            <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {displayItem.pay_status && (
                            <div className="flex justify-between items-center bg-white px-3 py-2 rounded-full border border-blue-200 shadow-sm font-medium text-sm">
                              <span className="text-sm text-gray-600">สถานะชำระเงิน</span>
                              {(() => {
                                let badgeClass = 'bg-yellow-100 text-yellow-800 text-sm p-2';
                                let label = 'รอยืนยันชำระ';
                                if (displayItem.pay_status === 'paid') { 
                                  badgeClass = 'bg-green-100 text-green-700 text-sm p-2'; 
                                  label = 'ชำระแล้ว'; 
                                }
                                if (displayItem.pay_status === 'failed') { 
                                  badgeClass = 'bg-red-100 text-red-700 text-sm p-2'; 
                                  label = 'การชำระผิดพลาด'; 
                                }
                                if (displayItem.pay_status === 'pending') { 
                                  badgeClass = 'bg-blue-100 text-blue-700 text-sm p-2'; 
                                  label = 'รอชำระ'; 
                                }
                                return (
                                  <span className={`font-semibold px-2 py-1 rounded-full ${badgeClass}`}>{label}</span>
                                );
                              })()}
                            </div>
                          )}
                          {displayItem.payment_method && (
                            <div className="flex justify-between items-center bg-white px-3 py-2 rounded-full border border-blue-200 shadow-sm">
                              <span className="text-sm font-medium text-gray-700">วิธีชำระเงิน</span>
                              <span className="font-semibold text-blue-700">{displayItem.payment_method}</span>
                            </div>
                          )}
                          {displayItem.fine_amount > 0 && (
                            <div className="flex justify-between items-center bg-white px-3 py-2 rounded-full border border-amber-200 shadow-sm">
                              <span className="text-sm text-gray-600">จำนวนค่าปรับ</span>
                              <span className="font-medium text-amber-800">{displayItem.fine_amount} บาท</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Slip Image Section */}
                  {displayItem.proof_image && (
                    <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-500 rounded-xl shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h4m1 8l-4-4H5a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-black">สลิปการชำระเงิน</h4>
                            <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
                          </div>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-blue-200 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-800">สลิป/หลักฐานการโอน</span>
                            <button
                              onClick={() => handleViewImage(displayItem.proof_image.startsWith('http') ? displayItem.proof_image : `${UPLOAD_BASE}/uploads/pay_slip/${displayItem.proof_image}`, 'สลิป/หลักฐานการโอน')}
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center gap-1 font-semibold text-xs"
                              title="ดูภาพ"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                              ดูภาพ
                            </button>
                          </div>
                          <div className="w-full flex justify-center">
                            <div className="relative group cursor-pointer" onClick={() => handleViewImage(displayItem.proof_image.startsWith('http') ? displayItem.proof_image : `${UPLOAD_BASE}/uploads/pay_slip/${displayItem.proof_image}`, 'สลิป/หลักฐานการโอน')}>
                              <img
                                src={displayItem.proof_image.startsWith('http') ? displayItem.proof_image : `${UPLOAD_BASE}/uploads/pay_slip/${displayItem.proof_image}`}
                                alt="slip"
                                className="max-h-60 object-contain rounded-lg border transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl"
                                onError={(e) => { e.target.onerror = null; e.target.src = '/lo.png'; }}
                              />
                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                                <div className="text-white text-center">
                                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                  </svg>
                                  <p className="text-sm font-semibold">คลิกเพื่อดูขนาดใหญ่</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Approval Notes */}
                  {displayItem.approvalNotes && (
                    <div className="bg-blue-50 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 mb-3">
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-500 rounded-xl shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-4.41 0-8-1.79-8-4V6c0-2.21 3.59-4 8-4s8 1.79 8 4v8c0 2.21-3.59 4-8 4z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-black">หมายเหตุการอนุมัติ</h4>
                            <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                          <p className="text-gray-700 whitespace-pre-line">{displayItem.approvalNotes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            </div>
            )}
          </div>
          
          {/* Enhanced Footer */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 rounded-full sticky bottom-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Status info on left */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">รายละเอียดการยืมครุภัณฑ์</p>
                  <p className="text-xs text-white">
                    ข้อมูลการยืมครุภัณฑ์
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Image Modal */}
      {imageModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="relative max-w-6xl max-h-[95vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{imageModal.title}</h3>
                  <p className="text-sm text-gray-500">คลิกปุ่มปิดหรือกด ESC เพื่อออกจากมุมมอง</p>
                </div>
              </div>
              <button
                onClick={closeImageModal}
                className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-3 rounded-xl hover:bg-gray-100 hover:scale-110 shadow-lg"
              >
                <MdClose className="w-7 h-7" />
              </button>
            </div>

            {/* Image Container */}
            <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="flex justify-center">
                <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200/50 max-w-5xl">
                  <img
                    src={imageModal.imageUrl}
                    alt={imageModal.title}
                    className="max-w-full max-h-[75vh] object-contain rounded-2xl"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/lo.png';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center p-6 border-t border-gray-200/50 bg-gradient-to-r from-white to-gray-50">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>รูปภาพนี้เป็นส่วนหนึ่งของหลักฐานการยืม-คืนครุภัณฑ์</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Carousel Modal for Damage Photos */}
      {carouselModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="relative max-w-6xl max-h-[95vh] w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={closeCarouselModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-all duration-200 p-2 rounded-full hover:bg-white/10 z-10"
            >
              <MdClose className="w-8 h-8" />
            </button>

            {/* Navigation - Previous */}
            {carouselModal.photos.length > 1 && (
              <button
                onClick={prevPhoto}
                className="absolute left-4 text-white hover:text-gray-300 transition-all duration-200 p-3 rounded-full hover:bg-white/10 z-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Main Image */}
            <div className="flex items-center justify-center w-full h-full">
              <div className="relative max-w-5xl max-h-[80vh] flex items-center justify-center">
                <img
                  src={carouselModal.photos[carouselModal.currentIndex]}
                  alt={`${carouselModal.title} ${carouselModal.currentIndex + 1}`}
                  className="max-w-full max-h-[70vh] object-contain rounded-2xl"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/lo.png';
                  }}
                />
              </div>
            </div>

            {/* Navigation - Next */}
            {carouselModal.photos.length > 1 && (
              <button
                onClick={nextPhoto}
                className="absolute right-4 text-white hover:text-gray-300 transition-all duration-200 p-3 rounded-full hover:bg-white/10 z-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Photo Counter */}
            {carouselModal.photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                {carouselModal.currentIndex + 1} / {carouselModal.photos.length}
              </div>
            )}

            {/* Title */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm max-w-md truncate">
              {carouselModal.title}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BorrowDetailsViewDialog;