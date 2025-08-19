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
import { UPLOAD_BASE } from '../../../utils/api';
import { API_BASE, authFetch } from '../../../utils/api';

const ReturnDetailsDialog = ({ returnItem, isOpen, onClose, paymentDetails }) => {
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    imageUrl: '',
    title: ''
  });
  const [showProofImage, setShowProofImage] = useState(false);
  const [showBorrowImages, setShowBorrowImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reject dialog states
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // ESC key handler for image modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && imageModal.isOpen) {
        closeImageModal();
      }
    };

    if (imageModal.isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [imageModal.isOpen]);

  if (!isOpen || !returnItem) return null;

  const slipImage = returnItem.proof_image || (paymentDetails && paymentDetails.proof_image);
  const slipDisplayUrl = slipImage
    ? (String(slipImage).startsWith('http') ? slipImage : `${UPLOAD_BASE}/uploads/pay_slip/${slipImage}`)
    : null;





    const handleViewImage = (imagePath, title) => {
    if (!imagePath) return;

    let fullImageUrl;
    if (imagePath.startsWith('http')) {
      fullImageUrl = imagePath;
    } else if (title === 'สลิป/หลักฐานการโอน') {
      fullImageUrl = `/uploads/pay_slip/${imagePath}`;
    } else {
      fullImageUrl = `/uploads/${imagePath}`;
    }

    setImageModal({
      isOpen: true,
      imageUrl: fullImageUrl,
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
      <div className="modal-box bg-white rounded-xl shadow-xl w-full max-w-8xl transform transition-all duration-300 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2.5 rounded-lg shadow-sm">
                <DocumentCheckIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">รายละเอียดการคืนครุภัณฑ์</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-sm font-mono font-medium text-blue-600">รหัสการยืม: {returnItem.borrow_code}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-all duration-200 p-2 rounded-xl hover:bg-gray-100 hover:scale-110 shadow-sm"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Right/Borrower Info (1/3) */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 rounded-xl p-5 shadow-lg border border-blue-200/50">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg shadow-sm">
                    <UserCircleIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800">ข้อมูลผู้ยืม</h3>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    <img
                      src={
                        returnItem.borrower.avatar
                          ? returnItem.borrower.avatar.startsWith('http')
                            ? returnItem.borrower.avatar
                            : `${UPLOAD_BASE}/uploads/user/${returnItem.borrower.avatar}`
                          : '/profile.png'
                      }
                      alt={returnItem.borrower.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="text-center">
                    <p className="text-gray-500 "><span className="font-mono">{returnItem.borrower.student_id}</span></p>
                    <p className="font-bold text-lg text-gray-800">{returnItem.borrower.name}</p>
                    <p className="text-gray-500 ">{returnItem.borrower.position}</p>
                    <p className="text-gray-500 mt-1">{returnItem.borrower.department}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex justify-between items-center bg-white px-4 py-2 rounded-full border border-blue-200 shadow-sm">
                    <span className="text-sm font-medium text-gray-600">รหัสการยืม</span>
                    <span className="font-mono text-blue-700">{returnItem.borrow_code}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white px-4 py-2 rounded-full border border-blue-200 shadow-sm">
                    <span className="text-sm font-medium text-gray-600">สถานะ</span>
                    {console.log('DEBUG returnItem.status:', returnItem.status)}
                    {getStatusBadge(returnItem.status)}
                  </div>
                </div>
              </div>



               {/* Fine and Notes Box - Moved to left column */}
               {(returnItem.fine_amount > 0 || returnItem.notes) && (
                 <div className={`rounded-xl p-5 space-y-3 shadow-lg ${returnItem.fine_amount > 0 ? 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 border border-amber-200/50' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 border border-blue-200/50'}`}>
                   <div className="flex items-center gap-2">
                     {returnItem.fine_amount > 0 ? (
                       <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-2 rounded-lg shadow-sm">
                         <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                       </div>
                     ) : (
                       <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg shadow-sm">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                         </svg>
                       </div>
                     )}
                     <h3 className={`font-semibold ${returnItem.fine_amount > 0 ? 'text-amber-800' : 'text-gray-800'}`}>
                       {returnItem.fine_amount > 0 ? 'รายละเอียดค่าปรับ' : 'หมายเหตุ'}
                     </h3>
                   </div>

                   {returnItem.fine_amount > 0 && (
                     <div className="flex items-center justify-between px-4 py-2 bg-white rounded-full border border-amber-200 shadow-sm">
                       <span className="font-medium text-amber-800">จำนวนค่าปรับ</span>
                       <span className="text-amber-800 font-semibold">{returnItem.fine_amount} บาท</span>
                     </div>
                   )}

                   {returnItem.notes && (
                     <div className="p-3 bg-white rounded-full border border-blue-200 shadow-sm">
                       <p className="text-gray-700 whitespace-pre-line">{returnItem.notes}</p>
                     </div>
                   )}
                 </div>
               )}

               {/* รูปภาพการยืม - ย้ายมาด้านล่างข้อมูลผู้ยืม */}
               {(returnItem?.signature_image || returnItem?.handover_photo) && (
                 <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 rounded-xl p-4 shadow-lg border border-blue-200/50 relative overflow-hidden">
                   {/* Background Pattern */}
                   <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent"></div>
                   <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-full -translate-y-16 translate-x-16"></div>

                   <div className="relative z-10">
                     {/* Header */}
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-3">
                         <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg shadow-lg">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                           </svg>
                         </div>
                         <div>
                           <h3 className="text-lg font-bold text-gray-800">รูปภาพการยืม</h3>
                           <p className="text-xs text-blue-600 font-medium">หลักฐานการยืมครุภัณฑ์</p>
                         </div>
                       </div>
                       <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                         หลักฐาน
                       </span>
                     </div>

                     {/* Images Grid - Show directly */}
                     {(
                       <div className="relative">
                         <div className="bg-white rounded-xl p-4 shadow-md border border-blue-100 hover:shadow-lg transition-all duration-300">


                                                       <div className="space-y-3">
                               {/* ลายเซ็นการยืม */}
                               {returnItem?.signature_image && (
                                 <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
                                   <div className="flex items-center gap-3">
                                     <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg shadow-sm">
                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                       </svg>
                                     </div>
                                     <h4 className="font-semibold text-gray-800 text-sm">ลายเซ็นการยืม</h4>
                                   </div>
                                   <button
                                     onClick={() => handleViewImage(returnItem.signature_image, 'ลายเซ็นการยืม')}
                                     className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center gap-2 font-semibold text-sm"
                                     title="ดูภาพ"
                                   >
                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                     </svg>
                                     ดูภาพ
                                   </button>
                                 </div>
                               )}

                               {/* รูปถ่ายส่งมอบครุภัณฑ์ */}
                               {returnItem?.handover_photo && (
                                 <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
                                   <div className="flex items-center gap-3">
                                     <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg shadow-sm">
                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                       </svg>
                                     </div>
                                     <h4 className="font-semibold text-gray-800 text-sm">รูปถ่ายส่งมอบครุภัณฑ์</h4>
                                   </div>
                                   <button
                                     onClick={() => handleViewImage(returnItem.handover_photo, 'รูปถ่ายส่งมอบครุภัณฑ์')}
                                     className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center gap-2 font-semibold text-sm"
                                     title="ดูภาพ"
                                   >
                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                     </svg>
                                     ดูภาพ
                                   </button>
                                 </div>
                               )}
                             </div>
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               )}
            </div>

            {/* Left/Main Info (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Equipment List */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  รายการครุภัณฑ์ที่คืน
                </h3>

                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 rounded-xl p-5 shadow-lg border border-blue-200/50">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-blue-200 shadow-sm">
                      <span className="text-gray-500">รหัสการยืม:</span>
                      <span className="font-mono text-blue-700 font-medium">{returnItem.borrow_code}</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="min-w-[340px]">
                      <table className="min-w-full divide-y divide-blue-200">
                        <thead className="bg-blue-100/50">
                          <tr>
                            <th className="px-2 py-3 text-center text-xs font-semibold text-blue-700 uppercase tracking-wider">รูป</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">ครุภัณฑ์</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider">จำนวน</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-blue-200">
                          {equipmentItems.length > 0 ? equipmentItems.map((item, index) => (
                            <tr key={index} className="hover:bg-blue-50/50">
                              <td className="px-2 py-3 align-middle text-center">
                                <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mx-auto border border-blue-200 bg-white shadow-sm">
                                  {item.pic ? (
                                    <img
                                      src={item.pic}
                                      alt={item.name}
                                      className="max-w-full max-h-full object-contain p-1"
                                      style={{ display: 'block', margin: 'auto' }}
                                      onError={e => { e.target.onerror = null; e.target.src = '/lo.png'; }}
                                    />
                                  ) : (
                                    <div className="bg-blue-100 w-full h-full flex items-center justify-center text-blue-400">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <span className="font-semibold text-gray-800 text-base leading-tight">{item.name}</span>
                                <div className="text-xs text-gray-500 italic mt-1 leading-tight">{item.code}</div>
                              </td>
                              <td className="px-4 py-3 text-right align-middle">
                                <span className="font-medium text-blue-700 text-base">{item.quantity || 1}</span>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={3} className="p-8 text-center text-gray-400 text-base">ไม่พบข้อมูลครุภัณฑ์</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan Details & Return Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 rounded-xl p-5 shadow-lg border border-blue-200/50">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-700">ข้อมูลการยืม-คืน</h3>
                  </div>

                                     <div className="space-y-3">
                     <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-blue-200 shadow-sm">
                       <span className="text-gray-500">วันที่ยืม:</span>
                       <span className="font-mono text-blue-700 font-medium">
                         {returnItem.borrow_date ? new Date(returnItem.borrow_date).toLocaleDateString('th-TH') :
                          returnItem.borrowDate ? new Date(returnItem.borrowDate).toLocaleDateString('th-TH') : '-'}
                       </span>
                     </div>
                     <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-blue-200 shadow-sm">
                       <span className="text-gray-500">กำหนดคืน:</span>
                       <span className="font-mono text-blue-700 font-medium">
                         {returnItem.due_date ? new Date(returnItem.due_date).toLocaleDateString('th-TH') :
                          returnItem.dueDate ? new Date(returnItem.dueDate).toLocaleDateString('th-TH') : '-'}
                       </span>
                     </div>
                     <div className="flex justify-between items-center bg-white px-3 py-2 rounded-full border border-blue-200 shadow-sm">
                       <span className="text-sm text-gray-600">วันที่คืนจริง</span>
                       <span className="font-medium text-blue-700">
                         {(paymentDetails?.return_date || returnItem?.return_date) ? new Date(paymentDetails?.return_date || returnItem?.return_date).toLocaleString('th-TH') : '-'}
                       </span>
                     </div>
                   </div>

                   {/* เอกสารสำคัญที่แนบ */}
                   <div className="mt-4 pt-3 border-t border-blue-200">
                     <DocumentViewer
                       documents={returnItem.important_documents || []}
                       title="เอกสารสำคัญที่แนบ"
                     />
                   </div>
                </div>

                {/* Section: Payment Details (always show) */}
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 rounded-xl p-5 shadow-lg border border-blue-200/50">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-4.41 0-8-1.79-8-4V6c0-2.21 3.59-4 8-4s8 1.79 8 4v8c0 2.21-3.59 4-8 4z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-blue-700">สถานะการชำระเงิน</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white px-3 py-2 rounded-full border border-blue-200 shadow-sm">
                        <span className="text-sm text-gray-600">สถานะชำระเงิน</span>
                        {(() => {
                          const payStatus = (paymentDetails && paymentDetails.pay_status) || returnItem.pay_status;
                          let badgeClass = 'bg-yellow-100 text-yellow-800';
                          let label = 'รอยืนยันชำระ';
                          if (payStatus === 'paid') { badgeClass = 'bg-green-100 text-green-700'; label = 'ชำระแล้ว'; }
                          if (payStatus === 'failed') { badgeClass = 'bg-red-100 text-red-700'; label = 'การชำระผิดพลาด'; }
                          return (
                            <span className={`font-semibold px-2 py-1 rounded-full ${badgeClass}`}>{label}</span>
                          );
                        })()}
                      </div>
                      <div className="flex justify-between items-center bg-white px-3 py-2 rounded-full border border-blue-200 shadow-sm">
                        <span className="text-sm font-medium text-gray-700">วิธีชำระเงิน</span>
                        <span className="font-semibold text-blue-700">{paymentDetails?.payment_method || returnItem?.payment_method || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white px-3 py-2 rounded-full border border-blue-200 shadow-sm">
                        <span className="text-sm font-medium text-gray-700">วันที่คืน</span>
                        <span className="font-semibold text-blue-700">{(paymentDetails?.return_date || returnItem?.return_date) ? new Date(paymentDetails?.return_date || returnItem?.return_date).toLocaleString('th-TH') : '-'}</span>
                      </div>
                      {(paymentDetails?.fine_amount || returnItem?.fine_amount) > 0 && (
                        <div className="flex justify-between items-center bg-white px-3 py-2 rounded-full border border-amber-200 shadow-sm">
                          <span className="text-sm text-gray-600">จำนวนค่าปรับ</span>
                          <span className="font-medium text-amber-800">{(paymentDetails?.fine_amount || returnItem?.fine_amount)} บาท</span>
                        </div>
                      )}
                      {(paymentDetails?.notes || returnItem?.notes) && (
                        <div className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm mt-2">
                          <span className="text-sm text-gray-600">หมายเหตุ</span>
                          <div className="text-gray-800 text-sm mt-1 whitespace-pre-line">{paymentDetails?.notes || returnItem?.notes}</div>
                        </div>
                      )}
                      {slipImage && (
                        <div className="mt-3 bg-white rounded-xl p-3 border border-blue-200 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-800">สลิป/หลักฐานการโอน</span>
                            <button
                              onClick={() => handleViewImage(slipImage, 'สลิป/หลักฐานการโอน')}
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
                            <img
                              src={slipImage}
                              alt="slip"
                              className="max-h-60 object-contain rounded-lg border"
                              onError={(e) => { e.target.onerror = null; e.target.src = '/lo.png'; }}
                            />
                          </div>
                        </div>
                      )}
                      {returnItem.status === 'waiting_payment' && slipImage && (paymentDetails?.pay_status !== 'failed' && returnItem.pay_status !== 'failed') && (
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={handleApprove}
                            disabled={isSubmitting}
                            className={`px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 transform hover:scale-105 ${
                              isSubmitting
                                ? 'bg-gray-400 cursor-not-allowed shadow-sm'
                                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isSubmitting ? (
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              {isSubmitting ? 'กำลังอนุมัติ...' : 'อนุมัติสลิป'}
                            </div>
                          </button>
                          <button
                            onClick={handleReject}
                            disabled={isSubmitting}
                            className={`px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 transform hover:scale-105 ${
                              isSubmitting
                                ? 'bg-gray-400 cursor-not-allowed shadow-sm'
                                : 'bg-red-500 hover:from-red-600 hover:to-rose-700 shadow-lg hover:shadow-xl'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isSubmitting ? (
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                              <span>{isSubmitting ? 'กำลังปฏิเสธ...' : 'ปฏิเสธ/ให้แนบใหม่'}</span>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>

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
};

export default ReturnDetailsDialog;