import {
    CheckCircleIcon as CheckCircleSolidIcon,
    ClockIcon,
    DocumentCheckIcon,
    ExclamationTriangleIcon,
    UserCircleIcon
} from "@heroicons/react/24/solid";
import { MdClose } from "react-icons/md";
import { useState, useEffect } from "react";
import DocumentViewer from '../../../components/DocumentViewer';

const ReturnDetailsDialog = ({ returnItem, isOpen, onClose, paymentDetails }) => {
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    imageUrl: '',
    title: ''
  });
  const [showProofImage, setShowProofImage] = useState(false);
  const [showBorrowImages, setShowBorrowImages] = useState(false);

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

  return (
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
              className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Right/Borrower Info (1/3) */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <UserCircleIcon className="h-6 w-6 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">ข้อมูลผู้ยืม</h3>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    <img
                      src={
                        returnItem.borrower.avatar
                          ? returnItem.borrower.avatar.startsWith('http')
                            ? returnItem.borrower.avatar
                            : `http://localhost:5000/uploads/user/${returnItem.borrower.avatar}`
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
                  <div className="flex justify-between items-center bg-white px-4 py-2 rounded-full border border-gray-200">
                    <span className="text-sm font-medium text-gray-600">รหัสการยืม</span>
                    <span className="font-mono text-blue-700">{returnItem.borrow_code}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white px-4 py-2 rounded-full border border-gray-200">
                    <span className="text-sm font-medium text-gray-600">สถานะ</span>
                    {console.log('DEBUG returnItem.status:', returnItem.status)}
                    {getStatusBadge(returnItem.status)}
                  </div>
                </div>
              </div>



               {/* Fine and Notes Box - Moved to left column */}
               {(returnItem.fine_amount > 0 || returnItem.notes) && (
                 <div className={`rounded-xl p-5 space-y-3 ${returnItem.fine_amount > 0 ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200' : 'bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200'}`}>
                   <div className="flex items-center gap-2">
                     {returnItem.fine_amount > 0 ? (
                       <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
                     ) : (
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                       </svg>
                     )}
                     <h3 className={`font-semibold ${returnItem.fine_amount > 0 ? 'text-amber-800' : 'text-gray-800'}`}>
                       {returnItem.fine_amount > 0 ? 'รายละเอียดค่าปรับ' : 'หมายเหตุ'}
                     </h3>
                   </div>

                   {returnItem.fine_amount > 0 && (
                     <div className="flex items-center justify-between px-4 py-2 bg-white rounded-full border border-amber-100">
                       <span className="font-medium text-amber-800">จำนวนค่าปรับ</span>
                       <span className="text-amber-800 font-semibold">{returnItem.fine_amount} บาท</span>
                     </div>
                   )}

                   {returnItem.notes && (
                     <div className="p-3 bg-white rounded-full border border-gray-200">
                       <p className="text-gray-700 whitespace-pre-line">{returnItem.notes}</p>
                     </div>
                   )}
                 </div>
               )}

               {/* รูปภาพการยืม - ย้ายมาด้านล่างข้อมูลผู้ยืม */}
               {(returnItem?.signature_image || returnItem?.handover_photo) && (
                 <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-xl p-4 shadow-lg border border-emerald-200/50 relative overflow-hidden">
                   {/* Background Pattern */}
                   <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 to-transparent"></div>
                   <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full -translate-y-16 translate-x-16"></div>

                   <div className="relative z-10">
                     {/* Header */}
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-3">
                         <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-lg shadow-lg">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                           </svg>
                         </div>
                         <div>
                           <h3 className="text-lg font-bold text-gray-800">รูปภาพการยืม</h3>
                           <p className="text-xs text-emerald-600 font-medium">หลักฐานการยืมครุภัณฑ์</p>
                         </div>
                       </div>
                       <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                         หลักฐาน
                       </span>
                     </div>

                     {/* Images Grid - Show directly */}
                     {(
                       <div className="relative">
                         <div className="bg-white rounded-xl p-4 shadow-md border border-emerald-100 hover:shadow-lg transition-all duration-300">


                                                       <div className="space-y-3">
                               {/* ลายเซ็นการยืม */}
                               {returnItem?.signature_image && (
                                 <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-emerald-200 shadow-sm hover:shadow-md transition-all duration-200">
                                   <div className="flex items-center gap-3">
                                     <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-lg shadow-sm">
                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                       </svg>
                                     </div>
                                     <h4 className="font-semibold text-gray-800 text-sm">ลายเซ็นการยืม</h4>
                                   </div>
                                   <button
                                     onClick={() => handleViewImage(returnItem.signature_image, 'ลายเซ็นการยืม')}
                                     className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 flex items-center gap-1 font-medium text-xs"
                                     title="ดูภาพ"
                                   >
                                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                     </svg>
                                     ดูภาพ
                                   </button>
                                 </div>
                               )}

                               {/* รูปถ่ายส่งมอบครุภัณฑ์ */}
                               {returnItem?.handover_photo && (
                                 <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-emerald-200 shadow-sm hover:shadow-md transition-all duration-200">
                                   <div className="flex items-center gap-3">
                                     <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-lg shadow-sm">
                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                       </svg>
                                     </div>
                                     <h4 className="font-semibold text-gray-800 text-sm">รูปถ่ายส่งมอบครุภัณฑ์</h4>
                                   </div>
                                   <button
                                     onClick={() => handleViewImage(returnItem.handover_photo, 'รูปถ่ายส่งมอบครุภัณฑ์')}
                                     className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 flex items-center gap-1 font-medium text-xs"
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  รายการครุภัณฑ์ที่คืน
                </h3>

                <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">รหัสการยืม:</span>
                      <span className="font-mono text-gray-800 font-medium">{returnItem.borrow_code}</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="min-w-[340px]">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">รูป</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ครุภัณฑ์</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">จำนวน</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {equipmentItems.length > 0 ? equipmentItems.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-2 py-3 align-middle text-center">
                                <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mx-auto border border-gray-200 bg-white">
                                  {item.pic ? (
                                    <img
                                      src={item.pic}
                                      alt={item.name}
                                      className="max-w-full max-h-full object-contain p-1"
                                      style={{ display: 'block', margin: 'auto' }}
                                      onError={e => { e.target.onerror = null; e.target.src = '/lo.png'; }}
                                    />
                                  ) : (
                                    <div className="bg-gray-100 w-full h-full flex items-center justify-center text-gray-400">
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
                <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="font-semibold text-gray-700">ข้อมูลการยืม-คืน</h3>
                  </div>

                                     <div className="space-y-3">
                     <div className="flex items-center gap-2">
                       <span className="text-gray-500">วันที่ยืม:</span>
                       <span className="font-mono text-gray-800 font-medium">
                         {returnItem.borrow_date ? new Date(returnItem.borrow_date).toLocaleDateString('th-TH') :
                          returnItem.borrowDate ? new Date(returnItem.borrowDate).toLocaleDateString('th-TH') : '-'}
                       </span>
                     </div>
                     <div className="flex items-center gap-2">
                       <span className="text-gray-500">กำหนดคืน:</span>
                       <span className="font-mono text-gray-800 font-medium">
                         {returnItem.due_date ? new Date(returnItem.due_date).toLocaleDateString('th-TH') :
                          returnItem.dueDate ? new Date(returnItem.dueDate).toLocaleDateString('th-TH') : '-'}
                       </span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-sm text-gray-600">วันที่คืนจริง</span>
                       <span className="font-medium text-gray-800">
                         {returnItem.return_date ? new Date(returnItem.return_date).toLocaleString('th-TH') : '-'}
                       </span>
                     </div>
                   </div>

                   {/* เอกสารสำคัญที่แนบ */}
                   <div className="mt-4 pt-3 border-t border-gray-200">
                     <DocumentViewer
                       documents={returnItem.important_documents || []}
                       title="เอกสารสำคัญที่แนบ"
                     />
                   </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="font-semibold text-gray-700">สถานะการคืน</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">สภาพที่คืน</span>
                      <span className="font-medium text-gray-800">{returnItem.condition || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">ค่าปรับ</span>
                      <span className="font-medium text-gray-800">
                        {returnItem.fine_amount > 0 ? `${returnItem.fine_amount} บาท` : '-'}
                      </span>
                    </div>

                    {/* หลักฐานการชำระเงิน */}
                    {returnItem.proof_image && (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-1.5 rounded-lg shadow-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800 text-xs">หลักฐานการชำระเงิน</h4>
                              <p className="text-xs text-gray-500">สลิป/หลักฐานการโอนเงิน</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleViewImage(returnItem.proof_image, 'สลิป/หลักฐานการโอน')}
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-2 py-1 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 flex items-center gap-1 font-medium text-xs"
                            title="ดูภาพ"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                            ดูภาพ
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section: Payment Details */}
                {paymentDetails && (
                  <div className="bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-200">
                    <div className="flex items-center gap-2 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-4.41 0-8-1.79-8-4V6c0-2.21 3.59-4 8-4s8 1.79 8 4v8c0 2.21-3.59 4-8 4z" />
                      </svg>
                      <h3 className="font-semibold text-blue-700">สถานะการชำระเงิน</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">สถานะชำระเงิน</span>
                        <span className={`font-semibold px-2 py-1 rounded-full ${paymentDetails.pay_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800 animate-pulse'}`}>
                          {paymentDetails.pay_status === 'paid' ? 'ชำระแล้ว' : 'รอชำระเงิน'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">วิธีชำระเงิน</span>
                        <span className="font-medium text-gray-800">{paymentDetails.paymentMethod || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">วันที่คืน</span>
                        <span className="font-medium text-gray-800">{paymentDetails.return_date ? new Date(paymentDetails.return_date).toLocaleString('th-TH') : '-'}</span>
                      </div>
                      {paymentDetails.fine_amount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">จำนวนค่าปรับ</span>
                          <span className="font-medium text-amber-800">{paymentDetails.fine_amount} บาท</span>
                        </div>
                      )}
                      {paymentDetails.notes && (
                        <div className="bg-white rounded-lg p-2 border border-gray-200 mt-2">
                          <span className="text-sm text-gray-600">หมายเหตุ</span>
                          <div className="text-gray-800 text-sm mt-1 whitespace-pre-line">{paymentDetails.notes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}


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
                className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-3 rounded-full hover:bg-gray-100 hover:scale-110 shadow-sm"
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
    </div>
  );
};

export default ReturnDetailsDialog;