import {
    ArrowPathIcon,
    CheckCircleIcon as CheckCircleSolidIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    DocumentTextIcon,
    UserCircleIcon,
    XCircleIcon
} from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import { updateBorrowStatus } from '../../../utils/api';
import DocumentViewer from '../../../components/DocumentViewer';

const API_BASE = "http://localhost:5000";

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
            setRejectReason("");
            setShowRejectReason(false);
        }
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

    return (
        isOpen && (
            <div className="modal modal-open">
                <div className="modal-box bg-white rounded-xl shadow-xl w-full max-w-8xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2.5 rounded-lg shadow-sm">
                                    <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">รายละเอียดการยืมครุภัณฑ์</h2>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="text-sm font-mono font-medium text-blue-600">รหัสการยืม: {borrow.borrow_code}</span>
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

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="space-y-6">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <UserCircleIcon className="h-6 w-6 text-blue-600" />
                                        <h3 className="font-semibold text-gray-800">ข้อมูลผู้ยืม</h3>
                                    </div>

                                    <div className="flex flex-col items-center gap-4">
                                        {borrow.borrower?.avatar && (
                                            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                                <img
                                                    src={borrow.borrower.avatar.startsWith('http') ? borrow.borrower.avatar : `${API_BASE}/uploads/user/${borrow.borrower.avatar}`}
                                                    alt={borrow.borrower.name}
                                                    className="w-full h-full object-cover"
                                                    onError={e => { e.target.onerror = null; e.target.src = '/profile.png'; }}
                                                />
                                            </div>
                                        )}
                                        <div className="text-center">
                                            <p className="text-gray-500 "><span className="font-mono">{borrow.borrower.student_id}</span></p>
                                            <p className="font-bold text-lg text-gray-800">{borrow.borrower.name}</p>
                                            <p className="text-gray-500 ">{borrow.borrower.position}</p>
                                            <p className="text-gray-500 mt-1">{borrow.borrower.department}</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 space-y-3">
                                        <div className="flex justify-between items-center bg-white px-4 py-2 rounded-full border border-gray-200">
                                            <span className="text-sm font-medium text-gray-600">สถานะการยืม</span>
                                            {getStatusBadge(borrow.status)}
                                        </div>
                                        <div className="flex justify-between items-center bg-white px-4 py-2 rounded-full border border-gray-200">
                                            <span className="text-sm font-medium text-gray-600">ระยะเวลายืม</span>
                                            <span className="font-semibold text-gray-800">{borrowDates}</span>
                                        </div>
                                    </div>
                                </div>

                                {borrow.purpose && (
                                    <div className={'rounded-xl p-5 space-y-3 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200'}>
                                        <div className="flex items-center gap-2">
                                            <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
                                            <h3 className={'font-semibold text-gray-800'}>
                                                วัตถุประสงค์
                                            </h3>
                                        </div>
                                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                                            <p className="text-gray-700 whitespace-pre-line">{borrow.purpose}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Important Documents Section */}
                                <DocumentViewer
                                    documents={borrow.important_documents}
                                    title="เอกสารสำคัญที่แนบ"
                                />


                            </div>

                            <div className="lg:col-span-2 space-y-6">
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        รายการครุภัณฑ์ที่ยืม
                                    </h3>

                                    <div className="bg-gray-50 rounded-2xl p-4 shadow-sm">
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
                                                                        <img
                                                                            src={item.pic?.startsWith('http') ? item.pic : `${API_BASE}/uploads/equipment/${item.item_code || item.code}.jpg`}
                                                                            alt={item.name}
                                                                            className="max-w-full max-h-full object-contain p-1"
                                                                            style={{ display: 'block', margin: 'auto' }}
                                                                            onError={e => { e.target.onerror = null; e.target.src = '/lo.png'; }}
                                                                        />
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
                                                {showRejectReason && (
                                                    <div className={'rounded-2xl p-5 mt-5 space-y-3 bg-red-50 border border-red-200'}>
                                                        <div className="flex items-center gap-2">
                                                            <XCircleIcon className="h-6 w-6 text-red-600" />
                                                            <h3 className={'font-semibold text-red-800'}>
                                                                เหตุผลที่ไม่อนุมัติ
                                                            </h3>
                                                        </div>
                                                        <div className="p-1 bg-white rounded-lg border border-gray-200">
                                                            <textarea
                                                                className="w-full px-3 py-2 border-0 rounded-lg focus:outline-none focus:ring-0 text-sm"
                                                                rows={3}
                                                                value={rejectReason}
                                                                onChange={(e) => setRejectReason(e.target.value)}
                                                                placeholder="ระบุเหตุผลที่ไม่อนุมัติ..."
                                                                required
                                                            />
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

                    {borrow.status === "pending" && (
                        <div className="px-6 py-5 mt-auto">
                            <div className="flex flex-col sm:flex-row justify-end gap-3">
                                {!showRejectReason ? (
                                    <>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 shadow-sm"
                                            onClick={() => setShowRejectReason(true)}
                                            disabled={isSubmitting}
                                        >
                                            <XCircleIcon className="h-5 w-5 mr-2" />
                                            ไม่อนุมัติ
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm disabled:opacity-70"
                                            onClick={handleApprove}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                                                    กำลังประมวลผล...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircleSolidIcon className="h-5 w-5 mr-2" />
                                                    อนุมัติการยืม
                                                </>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors duration-200 shadow-sm"
                                            onClick={() => setShowRejectReason(false)}
                                            disabled={isSubmitting}
                                        >
                                            ยกเลิก
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 shadow-sm disabled:opacity-70"
                                            onClick={handleReject}
                                            disabled={isSubmitting || !rejectReason}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                                                    กำลังประมวลผล...
                                                </>
                                            ) : (
                                                <>
                                                    <XCircleIcon className="h-5 w-5 mr-2" />
                                                    ยืนยันไม่อนุมัติ
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <form method="dialog" className="modal-backdrop">
                  <button onClick={onClose}>close</button>
                </form>
            </div>
        )
    );
};

export default BorrowDetailsDialog;