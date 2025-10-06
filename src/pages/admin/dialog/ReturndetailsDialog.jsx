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
import { createPortal } from 'react-dom';
import DocumentViewer from '../../../components/DocumentViewer';
import { UPLOAD_BASE } from '../../../utils/api';
import { API_BASE, authFetch } from '../../../utils/api';

const ReturnDetailsDialog = ({ returnItem, isOpen, onClose, paymentDetails }) => {
  if (!isOpen || !returnItem) return null;

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
  const [showProofImage, setShowProofImage] = useState(false);
  const [showBorrowImages, setShowBorrowImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

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

  const slipImage = returnItem.proof_image || (paymentDetails && paymentDetails.proof_image);
  const slipDisplayUrl = slipImage
    ? (String(slipImage).startsWith('http') ? slipImage : `${UPLOAD_BASE}/uploads/pay_slip/${slipImage}`)
    : null;


    const handleViewImage = (imagePath, title) => {
    if (!imagePath) return;

    console.log('handleViewImage called with:', { imagePath, title });

    let fullImageUrl;
    if (imagePath.startsWith('http')) {
      fullImageUrl = imagePath;
    } else if (title.trim() === 'รูปถ่ายภาพบัตรนักศึกษา') {
      fullImageUrl = `${UPLOAD_BASE}/uploads/signature/${imagePath}`;
    } else if (title === 'สลิป/หลักฐานการโอน') {
      fullImageUrl = `${UPLOAD_BASE}/uploads/pay_slip/${imagePath}`;
    } else if (title === 'รูปถ่ายส่งมอบครุภัณฑ์') {
      fullImageUrl = `${UPLOAD_BASE}/uploads/handover/${imagePath}`;
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
      case "approved":
        return <span className="inline-flex items-center gap-1 rounded-lg bg-yellow-100 px-2 py-1 text-yellow-800 text-xs font-semibold"><ClockIcon className="w-4 h-4" /> รอคืน</span>;
      case "completed":
        return <span className="inline-flex items-center gap-1 rounded-lg bg-green-100 px-2 py-1 text-green-700 text-xs font-semibold"><CheckCircleSolidIcon className="w-4 h-4" /> คืนแล้ว</span>;
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

  const equipmentItems = Array.isArray(returnItem.equipment) ? returnItem.equipment : [returnItem.equipment];

  const handleApprove = async () => {
    const returnId = returnItem?.return_id || (paymentDetails && paymentDetails.return_id);
    if (!returnId) return;
    setIsSubmitting(true);
    try {
      const res = await authFetch(`${API_BASE}/returns/${returnId}/admin-approve-slip`, { method: 'POST' });
      if (!res.ok) throw new Error('อนุมัติไม่สำเร็จ');
      // แจ้งเตือน (ใช้ Notification.jsx ผ่านหน้า ReturnList)
             window.dispatchEvent(new CustomEvent('appNotify', { detail: { type: 'success', message: 'การชำระเงินเสร็จสิ้น' } }));
       window.dispatchEvent(new Event('badgeCountsUpdated'));
       window.dispatchEvent(new Event('returnsRefreshRequested'));
       // ปิด dialog ทั้งสองเมื่ออนุมัติสลิป
       setShowRejectDialog(false);
       setRejectReason('');
       onClose();
    } catch (e) {
      window.dispatchEvent(new CustomEvent('appNotify', { detail: { type: 'error', message: e.message || 'อนุมัติสลิปไม่สำเร็จ' } }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setShowRejectDialog(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      window.dispatchEvent(new CustomEvent('appNotify', { detail: { type: 'error', message: 'กรุณาระบุเหตุผลการปฏิเสธ' } }));
      return;
    }

    const returnId = returnItem?.return_id || (paymentDetails && paymentDetails.return_id);
    if (!returnId) return;

    setIsRejecting(true);
    try {
      const res = await authFetch(`${API_BASE}/returns/${returnId}/admin-reject-slip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() })
      });
      if (!res.ok) throw new Error('ปฏิเสธไม่สำเร็จ');



       window.dispatchEvent(new CustomEvent('appNotify', { detail: { type: 'warning', message: '⚠️ รอการดำเนินการ - รอผู้ใช้งานทำรายการใหม่' } }));
       window.dispatchEvent(new Event('badgeCountsUpdated'));
       window.dispatchEvent(new Event('returnsRefreshRequested'));

       setShowRejectDialog(false);
       setRejectReason('');
       // ปิด dialog รายละเอียดด้วย
       onClose();
    } catch (e) {
      window.dispatchEvent(new CustomEvent('appNotify', { detail: { type: 'error', message: e.message || 'ปฏิเสธสลิปไม่สำเร็จ' } }));
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCancelReject = () => {
    setShowRejectDialog(false);
    setRejectReason('');
  };

  return (
    <>
      <div className="modal modal-open">
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
                          รายละเอียดการคืนครุภัณฑ์
                        </h2>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-white">
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          รหัส: <span className="font-mono font-semibold text-white">{returnItem.borrow_code || '-'}</span>
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

          {/* Content */}
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
                            returnItem.borrower?.avatar
                              ? returnItem.borrower.avatar.startsWith('http')
                                ? returnItem.borrower.avatar
                                : `${UPLOAD_BASE}/uploads/user/${returnItem.borrower.avatar}`
                              : '/profile.png'
                          }
                          alt={returnItem.borrower?.name}
                          className="w-full h-full object-cover"
                          onClick={() => handleViewImage(
                            returnItem.borrower?.avatar
                              ? returnItem.borrower.avatar.startsWith('http')
                                ? returnItem.borrower.avatar
                                : `${UPLOAD_BASE}/uploads/user/${returnItem.borrower.avatar}`
                              : null,
                            `รูปภาพนิสิต - ${returnItem.borrower?.name}`
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
                      <h3 className="font-bold text-xl text-gray-800">{returnItem.borrower.name}</h3>
                      {returnItem.borrower.position && (
                        <p className="text-blue-600 font-medium">{returnItem.borrower.position}</p>
                      )}
                      {returnItem.borrower.department && (
                        <p className="text-gray-600 text-sm bg-gray-100 px-3 py-1 rounded-full inline-block">{returnItem.borrower.department}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between items-center bg-white px-4 py-2 rounded-full border border-blue-200 shadow-sm">
                      <span className="text-sm font-medium text-gray-600">รหัสการยืม</span>
                      <span className="text-sm font-medium text-blue-700">{returnItem.borrow_code}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2 bg-white px-3 py-2 rounded-full border border-blue-200 shadow-sm">
                        <span className="text-gray-500">วันที่ยืม</span>
                        <span className="text-blue-700 text-sm font-medium">
                          {returnItem.borrow_date ? new Date(returnItem.borrow_date).toLocaleDateString('th-TH') :
                           returnItem.borrowDate ? new Date(returnItem.borrowDate).toLocaleDateString('th-TH') : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2 bg-white px-3 py-2 rounded-full border border-blue-200 shadow-sm">
                        <span className="text-gray-500">กำหนดคืน</span>
                        <span className=" text-blue-700 text-sm font-medium">
                          {returnItem.due_date ? new Date(returnItem.due_date).toLocaleDateString('th-TH') :
                           returnItem.dueDate ? new Date(returnItem.dueDate).toLocaleDateString('th-TH') : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-white px-3 py-2 rounded-full border border-blue-200 shadow-sm">
                        <span className="text-sm font-medium text-gray-700">วันที่คืน</span>
                        <span className="text-sm font-medium text-blue-700">{(paymentDetails?.return_date || returnItem?.return_date) ? new Date(paymentDetails?.return_date || returnItem?.return_date).toLocaleString('th-TH') : '-'}</span>
                      </div>
                    <div className="flex justify-between items-center bg-white px-4 py-2 rounded-full border border-blue-200 shadow-sm">
                      <span className="text-sm font-medium text-gray-600">สถานะ</span>
                      {getStatusBadge(returnItem.status)}
                    </div>
                  </div>
                </div>
              </div>



               {/* Fine and Notes Box - Moved to left column */}
               {(returnItem.fine_amount > 0 || returnItem.notes) && (
                 <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                   <div className="p-6">
                     <div className="flex items-center gap-3 mb-4">
                       <div className={`p-2 rounded-xl shadow-md ${returnItem.fine_amount > 0 ? 'bg-amber-500' : 'bg-blue-500'}`}>
                         {returnItem.fine_amount > 0 ? (
                           <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                         ) : (
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                           </svg>
                         )}
                       </div>
                       <div>
                         <h4 className="text-lg font-bold text-gray-800">
                           {returnItem.fine_amount > 0 ? 'รายละเอียดค่าปรับ' : 'หมายเหตุ'}
                         </h4>
                         <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
                       </div>
                     </div>

                     {returnItem.fine_amount > 0 && (
                       <div className="flex items-center justify-between px-4 py-2 bg-amber-50 rounded-full border border-amber-200 shadow-sm mb-3">
                         <span className="font-medium text-amber-800">จำนวนค่าปรับ</span>
                         <span className="text-amber-800 font-semibold">{returnItem.fine_amount} บาท</span>
                       </div>
                     )}

                     {returnItem.notes && (
                       <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                         <p className="text-gray-700 whitespace-pre-line">{returnItem.notes}</p>
                       </div>
                     )}
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
                    {returnItem?.signature_image && (
                      <div className="relative group">
                        <div
                          className="w-full h-32 bg-gray-100 rounded-lg border border-gray-300 overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                          onClick={() => handleViewImage(returnItem.signature_image, '  รูปถ่ายภาพบัตรนักศึกษา')}
                        >
                          <img
                            src={returnItem.signature_image.startsWith('http') ? returnItem.signature_image : `${UPLOAD_BASE}/uploads/signature/${returnItem.signature_image}`}
                            alt="Student ID Photo Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/placeholder-image.png';
                            }}
                          />
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          บัตรนักศึกษา
                        </div>
                      </div>
                    )}

                    {returnItem?.handover_photo && (
                      <div className="relative group">
                        <div
                          className="w-full h-32 bg-gray-100 rounded-lg border border-gray-300 overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                          onClick={() => handleViewImage(returnItem.handover_photo, 'รูปถ่ายส่งมอบครุภัณฑ์')}
                        >
                          <img
                            src={returnItem.handover_photo.startsWith('http') ? returnItem.handover_photo : `${UPLOAD_BASE}/uploads/handover/${returnItem.handover_photo}`}
                            alt="Handover Photo Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/placeholder-image.png';
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
                  {!returnItem?.signature_image && !returnItem?.handover_photo && (
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
                        documents={returnItem.important_documents || []}
                        title="เอกสารสำคัญที่แนบ"
                      />
                    </div>
                </div>
                </div>
              </div>

              {/* Damage Photos Section - Display damage photos from return_items */}
              {returnItem?.return_items && returnItem.return_items.some(item => item.damage_photos && item.damage_photos.length > 0) && (
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

                    <div className="space-y-6">
                      {returnItem.return_items.map((item, index) => {
                        // Check if this item has damage photos
                        if (!item.damage_photos || !Array.isArray(item.damage_photos) || item.damage_photos.length === 0) {
                          return null;
                        }

                        return (
                          <div key={item.item_id || index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="font-semibold text-gray-800">{item.equipment_name || item.name}</div>
                              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs font-mono rounded-md">
                                {item.item_code}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {item.damage_photos.map((photoUrl, photoIndex) => {
                                // Construct full URL if needed
                                let fullPhotoUrl;
                                if (photoUrl && photoUrl.startsWith('http')) {
                                  fullPhotoUrl = photoUrl;
                                } else if (photoUrl) {
                                  fullPhotoUrl = `${UPLOAD_BASE}${photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`}`;
                                } else {
                                  fullPhotoUrl = '/placeholder-image.png';
                                }

                                return (
                                  <div
                                    key={photoIndex}
                                    onClick={() => {
                                      // Get all damage photos for this item
                                      const allPhotos = item.damage_photos.map(photoUrl => {
                                        if (photoUrl && photoUrl.startsWith('http')) {
                                          return photoUrl;
                                        } else if (photoUrl) {
                                          return `${UPLOAD_BASE}${photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`}`;
                                        } else {
                                          return '/placeholder-image.png';
                                        }
                                      });
                                      handleViewDamagePhotos(allPhotos, `ภาพความเสียหายของ ${item.equipment_name || item.name}`);
                                    }}
                                    className="flex items-center justify-center w-24 h-24 bg-gray-100 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors overflow-hidden"
                                  >
                                    <img
                                      src={fullPhotoUrl}
                                      alt={`Damage ${photoIndex + 1} for ${item.equipment_name || item.name}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/placeholder-image.png';
                                      }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
                    <h4 className="text-lg font-bold text-gray-800">รายการครุภัณฑ์ที่คืน</h4>
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
                                    onClick={() => handleViewImage(
                                      item.pic?.startsWith('http') ? item.pic : `${UPLOAD_BASE}/equipment/${item.item_code || item.code}.jpg`,
                                      `รูปภาพครุภัณฑ์ - ${item.name}`
                                    )}
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
                      <div className="flex justify-between items-center bg-white px-3 py-2 rounded-full border border-blue-200 shadow-sm font-medium text-sm">
                        <span className="text-sm text-gray-600">สถานะชำระเงิน</span>
                        {(() => {
                          const payStatus = (paymentDetails && paymentDetails.pay_status) || returnItem.pay_status;
                          let badgeClass = 'bg-yellow-100 text-yellow-800 text-sm p-2';
                          let label = 'รอยืนยันชำระ';
                          if (payStatus === 'paid') { badgeClass = 'bg-green-100 text-green-700 text-sm p-2'; label = 'ชำระแล้ว'; }
                          if (payStatus === 'failed') { badgeClass = 'bg-red-100 text-red-700 text-sm p-2'; label = 'การชำระผิดพลาด'; }
                          return (
                            <span className={`font-semibold px-2 py-1 rounded-full ${badgeClass}`}>{label}</span>
                          );
                        })()}
                      </div>
                      <div className="flex justify-between items-center bg-white px-3 py-2 rounded-full border border-blue-200 shadow-sm">
                        <span className="text-sm font-medium text-gray-700">วิธีชำระเงิน</span>
                        <span className="font-semibold text-blue-700">{paymentDetails?.payment_method || returnItem?.payment_method || '-'}</span>
                      </div>
                      {(paymentDetails?.fine_amount || returnItem?.fine_amount) > 0 && (
                        <div className="flex justify-between items-center bg-white px-3 py-2 rounded-full border border-amber-200 shadow-sm">
                          <span className="text-sm text-gray-600">จำนวนค่าปรับ</span>
                          <span className="font-medium text-amber-800">{(paymentDetails?.fine_amount || returnItem?.fine_amount)} บาท</span>
                        </div>
                      )}
                      {slipImage && (
                        <div className="mt-3 bg-white rounded-xl p-3 border border-blue-200 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-800">สลิป/หลักฐานการโอน</span>
                            {slipDisplayUrl ? (
                              <img
                                src={slipDisplayUrl}
                                alt="สลิป/หลักฐานการโอน"
                                className="w-20 h-20 object-cover rounded border border-gray-200 cursor-pointer"
                                onClick={() => handleViewImage(slipImage, 'สลิป/หลักฐานการโอน')}
                                title="คลิกเพื่อดูภาพเต็ม"
                              />
                            ) : (
                              <span className="text-gray-400 text-xs">ไม่มีสลิป</span>
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
              <p className="text-sm font-medium text-white">รายละเอียดการคืนครุภัณฑ์</p>
              <p className="text-xs text-white">
                {returnItem.status === 'waiting_payment' && slipImage ? 'รอการตรวจสอบสลิป' : 'ข้อมูลการคืนครุภัณฑ์'}
              </p>
            </div>
          </div>

          {/* Action buttons on right */}
          <div className="flex justify-end gap-2">

            {/* Conditional action buttons for waiting payment status */}
            {returnItem.status === 'waiting_payment' && slipImage && (paymentDetails?.pay_status !== 'failed' && returnItem.pay_status !== 'failed') && (
              <>
                <button
                  onClick={handleReject}
                  disabled={isSubmitting}
                  className={`btn rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-transparent ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 bg-gray-200 border-transparent rounded-full animate-spin"></div>
                      <span> กำลังปฏิเสธ...</span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="w-5 h-5" />
                      <span> ปฏิเสธ/ให้แนบใหม่</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className={`btn rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-transparent ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 bg-gray-200 border-transparent rounded-full animate-spin"></div>
                      <span> กำลังอนุมัติ...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleSolidIcon className="w-5 h-5" />
                      <span> อนุมัติสลิป</span>
                    </>
                  )}
                </button>
              </>
            )}
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
                    e.target.src = '/placeholder-image.png';
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
                  e.target.src = '/placeholder-image.png';
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

    {/* Reject Reason Dialog */}
    {showRejectDialog && (
      <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl transform transition-all duration-300 overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <XCircleIcon className="w-6 h-6 text-red-600" />
                </div>
                <span>ปฏิเสธสลิปการชำระเงิน</span>
              </h3>
              <button
                onClick={handleCancelReject}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors duration-150"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-800 mb-1">คำเตือน</h4>
                    <p className="text-sm text-red-700">
                      การปฏิเสธสลิปจะทำให้ผู้ใช้ต้องอัปโหลดสลิปใหม่ กรุณาระบุเหตุผลที่ชัดเจน
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  เหตุผลการปฏิเสธ <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="กรุณาระบุเหตุผลที่ปฏิเสธสลิป เช่น สลิปไม่ชัดเจน, จำนวนเงินไม่ตรง, วันที่ไม่ตรง, ฯลฯ"
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none transition-all duration-200"
                  disabled={isRejecting}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500">
                  จำนวนตัวอักษร: {rejectReason.length}/500
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  onClick={handleCancelReject}
                  disabled={isRejecting}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={isRejecting || !rejectReason.trim()}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {isRejecting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      กำลังปฏิเสธ...
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="w-4 h-4" />
                      ปฏิเสธสลิป
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
);
}

export default ReturnDetailsDialog;