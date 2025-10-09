import {
    ArrowPathIcon,
    CalendarIcon,
    CheckCircleIcon,
    CheckCircleIcon as CheckCircleSolidIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    CubeIcon,
    DocumentCheckIcon,
    InformationCircleIcon,
    TagIcon,
    UserIcon,
    XCircleIcon
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import { updateBorrowStatus, API_BASE, UPLOAD_BASE } from '../../../utils/api';
import DocumentViewer from '../../../components/DocumentViewer';

const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const BorrowDetailsDialog = ({ borrow, isOpen, onClose, onApprove, onReject }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectReason, setShowRejectReason] = useState(false);

    // Reset rejectReason and showRejectReason when dialog is opened
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setRejectReason("");
            setShowRejectReason(false);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !borrow) return null;

    const borrowDates = `${formatDate(borrow.borrow_date)} ถึง ${formatDate(borrow.due_date)}`;

    const equipmentItems = Array.isArray(borrow.equipment)
        ? borrow.equipment.map(eq => ({
            ...eq,
            code: eq.item_code || eq.code,
            image: eq.image || `/uploads/equipment/${eq.item_code || eq.code}.jpg`,
        }))
        : [borrow.equipment];

    const getStatusBadge = (status) => {
        switch (status) {
            case "approved":
                return (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-green-700 text-sm font-semibold">
                        <CheckCircleSolidIcon className="w-5 h-5" /> อนุมัติ/กำลังยืม
                    </div>
                );
            case "pending_approval":
                 return (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-blue-700 text-sm font-semibold">
                        <ClockIcon className="w-5 h-5" /> รออนุมัติ
                    </div>
                );
            case "pending":
                return (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1.5 text-yellow-800 text-sm font-semibold">
                        <ArrowPathIcon className="w-5 h-5" /> รอตรวจสอบ
                    </div>
                );
            case "rejected":
                return (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-red-700 text-sm font-semibold">
                        <XCircleIcon className="w-5 h-5" /> ไม่อนุมัติ
                    </div>
                );
            default:
                return (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-gray-700 text-sm font-semibold">
                        ไม่ทราบสถานะ
                    </div>
                );
        }
    };

    const handleApprove = async () => {
        setIsSubmitting(true);
        try {
            await updateBorrowStatus(borrow.borrow_id, 'pending_approval');
            if (onApprove) await onApprove();
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason) {
            alert("กรุณาระบุเหตุผลที่ไม่อนุมัติ");
            return;
        }
        setIsSubmitting(true);
        try {
            await updateBorrowStatus(borrow.borrow_id, 'rejected', rejectReason);
            if (onReject) onReject(rejectReason);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    // Enhanced SectionHeader with gradient and better styling
    const SectionHeader = ({ title, icon }) => (
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500 rounded-xl shadow-md">
                <span className="text-white">{icon}</span>
            </div>
            <div>
                <h4 className="text-lg font-bold text-gray-800">{title}</h4>
                <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
            </div>
        </div>
    );

    return (
        isOpen && (
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
                                                    รายละเอียดการยืมครุภัณฑ์
                                                </h2>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-white">
                                                <span className="flex items-center gap-1">
                                                    <TagIcon className="w-4 h-4" />
                                                    รหัส: <span className="font-mono font-semibold text-white">{borrow.borrow_code || '-'}</span>
                                                </span>
                                                {borrow.borrow_date && (
                                                    <span className="flex items-center gap-1">
                                                        <CalendarIcon className="w-4 h-4" />
                                                        วันที่ขอ: <span className="font-semibold text-white">{new Date(borrow.borrow_date).toLocaleDateString('th-TH')}</span>
                                                    </span>
                                                )}
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
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* ข้อมูลผู้ขอยืมและช่วงเวลา */}
                                <div className="space-y-6">
                                    <SectionHeader
                                        title="ข้อมูลผู้ขอยืม"
                                        icon={<UserIcon className="h-5 w-5 text-white" />}
                                    />
                                    {borrow.borrower && (
                                        <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                                            <div className="p-6">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="relative">
                                                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-200 shadow-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                                                            <img
                                                                src={borrow.borrower.avatar ? (borrow.borrower.avatar.startsWith('http') ? borrow.borrower.avatar : `${UPLOAD_BASE}/user/${borrow.borrower.avatar}`) : "/profile.png"}
                                                                alt={borrow.borrower.name}
                                                                className="w-full h-full object-cover"
                                                                onError={e => { e.target.onerror = null; e.target.src = '/profile.png'; }}
                                                            />
                                                        </div>
                                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                                                            <CheckCircleIcon className="w-3 h-3 text-white" />
                                                        </div>
                                                    </div>
                                                    <div className="text-center space-y-2">
                                                        {borrow.borrower.student_id && (
                                                            <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-mono">
                                                                {borrow.borrower.student_id}
                                                            </div>
                                                        )}
                                                        <h3 className="font-bold text-xl text-gray-800">{borrow.borrower.name}</h3>
                                                        {borrow.borrower.position && (
                                                            <p className="text-blue-600 font-medium">{borrow.borrower.position}</p>
                                                        )}
                                                        {borrow.borrower.department && (
                                                            <p className="text-gray-600 text-sm bg-gray-100 px-3 py-1 rounded-full inline-block">{borrow.borrower.department}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <SectionHeader
                                            title="ข้อมูลการยืม"
                                            icon={<CalendarIcon className="h-5 w-5 text-white" />}
                                        />
                                        <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                                            <div className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-4xl">
                                                        <div className="p-3 bg-blue-600 rounded-full">
                                                            <CalendarIcon className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-black font-medium mb-1">วันที่ต้องการยืม</p>
                                                            <p className="font-bold text-lg text-gray-800">{borrow.borrow_date ? new Date(borrow.borrow_date).toLocaleDateString('th-TH') : '-'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-4xl">
                                                        <div className="p-3 bg-orange-500 rounded-full">
                                                            <ClockIcon className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-orange-600 font-medium mb-1">กำหนดคืน</p>
                                                            <p className="font-bold text-lg text-gray-800">{borrow.due_date ? new Date(borrow.due_date).toLocaleDateString('th-TH') : '-'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Duration indicator */}
                                                {borrow.borrow_date && borrow.due_date && (
                                                    <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                                                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                                            <ArrowPathIcon className="w-4 h-4" />
                                                            <span>ระยะเวลาการยืม: <span className="font-semibold text-blue-600">{Math.ceil((new Date(borrow.due_date) - new Date(borrow.borrow_date)) / (1000 * 60 * 60 * 24))} วัน</span></span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {borrow.purpose && (
                                        <div>
                                            <SectionHeader
                                                title="วัตถุประสงค์"
                                                icon={<TagIcon className="h-5 w-5 text-white" />}
                                            />
                                            <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                                                <div className="p-6">
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex-1">
                                                            <p className="text-gray-700 leading-relaxed">{borrow.purpose}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Important Documents Section */}
                                    {borrow.important_documents && borrow.important_documents.length > 0 && (
                                        <div>
                                            <SectionHeader
                                                title="เอกสารสำคัญที่แนบ"
                                                icon={<DocumentCheckIcon className="h-5 w-5 text-white" />}
                                            />
                                            <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                                                <div className="p-6">
                                                    <DocumentViewer
                                                        documents={borrow.important_documents}
                                                        title=""
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ข้อมูลอุปกรณ์ */}
                                <div className="space-y-6">
                                    <SectionHeader
                                        title="รายการครุภัณฑ์ที่ยืม"
                                        icon={<CubeIcon className="h-5 w-5 text-white" />}
                                    />
                                    
                                    {/* Equipment Summary Card */}
                                    <div className="bg-black rounded-4xl p-6 text-white shadow-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold">สรุปรายการ</h3>
                                                <p className="text-white">จำนวนครุภัณฑ์ทั้งหมด</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-bold">{equipmentItems.length}</div>
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
                                                                                {item.item_code || item.code}
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
                                                                        <CubeIcon className="w-12 h-12 text-gray-300" />
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
                                    
                                    {showRejectReason && (
                                        <div className="bg-white/80 backdrop-blur-sm border border-red-200 rounded-2xl shadow-lg">
                                            <div className="p-6">
                                                <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-6">
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-3 bg-red-500 rounded-xl">
                                                            <XCircleIcon className="h-6 w-6 text-white" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="text-lg font-semibold text-red-800 mb-3">เหตุผลที่ไม่อนุมัติ</h4>
                                                            <div className="bg-white/80 p-4 rounded-lg border border-gray-200">
                                                                <textarea
                                                                    className="w-full px-3 py-2 border-0 rounded-lg focus:outline-none focus:ring-0 text-sm resize-none"
                                                                    rows={3}
                                                                    value={rejectReason}
                                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                                    placeholder="ระบุเหตุผลที่ไม่อนุมัติ..."
                                                                    required
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Damage Photos Section - Show only when status is completed */}
                                    {borrow.status === "completed" && equipmentItems && equipmentItems.some(item => item.damage_photos && item.damage_photos.length > 0) && (
                                      <div>
                                        <SectionHeader
                                          title="รูปภาพความเสียหาย"
                                          icon={
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                          }
                                        />
                                        <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                                          <div className="p-6">
                                            <div className="space-y-6">
                                              {equipmentItems.map((item, index) => {
                                                // Check if this item has damage photos
                                                if (!item.damage_photos || !Array.isArray(item.damage_photos) || item.damage_photos.length === 0) {
                                                  return null;
                                                }
                                                
                                                return (
                                                  <div key={item.item_id || index} className="border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-center gap-3 mb-3">
                                                      <div className="font-semibold text-gray-800">{item.name}</div>
                                                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs font-mono rounded-md">
                                                        {item.item_code || item.code}
                                                      </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                                                          <div key={photoIndex} className="relative group">
                                                            <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                                                              <img
                                                                src={fullPhotoUrl}
                                                                alt={`Damage ${photoIndex + 1} for ${item.name}`}
                                                                className="object-cover w-full h-full"
                                                                onError={(e) => {
                                                                  e.target.onerror = null;
                                                                  e.target.src = '/lo.png';
                                                                }}
                                                                onClick={() => window.open(fullPhotoUrl, '_blank')}
                                                              />
                                                            </div>
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                                              <button
                                                                onClick={() => window.open(fullPhotoUrl, '_blank')}
                                                                className="text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
                                                              >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                                </svg>
                                                              </button>
                                                            </div>
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
                                      </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Footer */}
                        {borrow.status === "pending" && (
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 rounded-2xl">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    {/* Status info on left */}
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-full">
                                            <InformationCircleIcon className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">สถานะปัจจุบัน</p>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(borrow.status)}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Action buttons on right */}
                                    <div className="flex justify-end gap-3">
                                        {!showRejectReason ? (
                                            <>
                                                <button
                                                    className="btn bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-transparent"
                                                    onClick={() => setShowRejectReason(true)}
                                                    disabled={isSubmitting}
                                                >
                                                    <XCircleIcon className="w-5 h-5" />
                                                    ไม่อนุมัติ
                                                </button>
                                                <button
                                                    className="btn bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-transparent"
                                                    onClick={handleApprove}
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <div className="w-5 h-5 border-2 bg-gray-200 border-transparent rounded-full animate-spin"></div>
                                                            กำลังดำเนินการ...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircleIcon className="w-5 h-5" />
                                                            อนุมัติการยืม
                                                        </>
                                                    )}
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className="btn bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-gray-400 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
                                                    onClick={() => setShowRejectReason(false)}
                                                    disabled={isSubmitting}
                                                >
                                                    ยกเลิก
                                                </button>
                                                <button
                                                    className="btn bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-transparent"
                                                    onClick={handleReject}
                                                    disabled={isSubmitting || !rejectReason}
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <div className="w-5 h-5 border-2 bg-gray-200 border-transparent rounded-full animate-spin"></div>
                                                            กำลังดำเนินการ...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircleIcon className="w-5 h-5" />
                                                            ยืนยันไม่อนุมัติ
                                                        </>
                                                    )}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>        )
    );
};

export default BorrowDetailsDialog;