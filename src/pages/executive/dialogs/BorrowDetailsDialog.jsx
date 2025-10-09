import {
  ArrowPathIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  CubeIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TagIcon,
  UserIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import { getBorrowById, API_BASE, UPLOAD_BASE } from "../../../utils/api";
import DocumentViewer from '../../../components/DocumentViewer';

export default function BorrowDetailsDialog({
  open,
  onClose,
  borrowRequest,
  onApprove,
  onReject
}) {
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [formErrors, setFormErrors] = useState({ rejectReason: "" });
  const [borrowDetails, setBorrowDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const rejectReasonOptions = [
    "อุปกรณ์ไม่ว่างในช่วงเวลาดังกล่าว",
    "วัตถุประสงค์ไม่ชัดเจน",
    "ระยะเวลาการยืมไม่เหมาะสม",
    "ผู้ขอยืมมีประวัติการคืนล่าช้า",
    "อื่นๆ (โปรดระบุในหมายเหตุ)"
  ];

  const statusBadgeStyle = {
    pending_approval: "bg-orange-100 text-orange-800 border-orange-200",
    carry: "bg-amber-100 text-amber-800 border-amber-200",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    borrowing: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-indigo-100 text-indigo-800 border-indigo-200"
  };

  const statusTranslation = {
    pending_approval: "รออนุมัติ",
    carry: "รอส่งมอบ",
    approved: "อนุมัติแล้ว",
    rejected: "ปฏิเสธ",
    borrowing: "กำลังยืม",
    completed: "คืนแล้ว"
  };

  const statusIcons = {
    pending_approval: <ClockIcon className="w-4 h-4" />,
    carry: <ClockIcon className="w-4 h-4" />,
    approved: <CheckCircleIcon className="w-4 h-4" />,
    rejected: <XCircleIcon className="w-4 h-4" />,
    borrowing: <ArrowPathIcon className="w-4 h-4" />,
    completed: <DocumentCheckIcon className="w-4 h-4" />
  };

  const handleClose = () => {
    setApprovalNotes("");
    setActionType(null);
    setShowConfirm(false);
    setShowRejectDialog(false);
    setRejectReason("");
    setFormErrors({ rejectReason: "" });
    onClose();
  };

  const handleAction = (type) => {
    setActionType(type);
    if (type === "reject") {
      setShowRejectDialog(true);
    } else {
      setShowConfirm(true);
    }
  };

  const handleCancelReject = () => {
    setShowRejectDialog(false);
    setRejectReason("");
    setFormErrors({ rejectReason: "" });
  };

  // Reset confirmation state when canceling confirm dialog
  const handleCancelConfirm = () => {
    setShowConfirm(false);
    setApprovalNotes("");
    setRejectReason("");
    setFormErrors({ rejectReason: "" });
    setActionType(null);
  };

  const handleConfirmReject = () => {
    if (!rejectReason) {
      setFormErrors({ rejectReason: "โปรดเลือกเหตุผลในการปฏิเสธ" });
      return;
    }

    if (rejectReason === "อื่นๆ (โปรดระบุในหมายเหตุ)" && !approvalNotes.trim()) {
      setFormErrors({ rejectReason: "โปรดระบุเหตุผลเพิ่มเติม" });
      return;
    }

    const finalNotes = rejectReason.includes("อื่นๆ")
      ? approvalNotes
      : `${rejectReason}. ${approvalNotes || ''}`.trim();

    setApprovalNotes(finalNotes);
    setShowRejectDialog(false);
    setShowConfirm(true);
    setFormErrors({ rejectReason: "" });
  };

  const confirmAction = async () => {
    if (!actionType) return;
    setIsSubmitting(true);

    const actionData = {
      ...borrowRequest,
      approvalNotes,
      approvalDate: new Date().toISOString().split('T')[0]
    };

    try {
      if (actionType === "approve") {
        await onApprove(actionData);
      } else if (actionType === "reject") {
        await onReject({ ...actionData, rejectReason });
      }
      handleClose();
    } catch (error) {
      // สามารถแจ้ง error เพิ่มเติมได้ที่นี่
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBadge = (status) => (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadgeStyle[status]}`}>
      <span className="mr-1">{statusIcons[status]}</span>
      <span>{statusTranslation[status]}</span>
    </div>
  );

  const getDialogTitle = () => {
    const titles = {
      pending_approval: "อนุมัติคำขอยืมอุปกรณ์",
      carry: "รอส่งมอบอุปกรณ์",
      approved: "รายละเอียดคำขอยืม (อนุมัติแล้ว)",
      rejected: "รายละเอียดคำขอยืม (ปฏิเสธ)",
      borrowing: "รายละเอียดคำขอยืม (กำลังยืม)",
      returned: "รายละเอียดคำขอยืม (คืนแล้ว)"
    };
    return titles[borrowRequest?.status] || "รายละเอียดคำขอยืมครุภัณฑ์";
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      if (borrowRequest?.borrow_id) {
        setApprovalNotes("");
        setIsSubmitting(false);
        setActionType(null);
        setShowConfirm(false);
        setShowRejectDialog(false);
        setRejectReason("");
        setFormErrors({ rejectReason: "" });
        setDetailsLoading(true);
        getBorrowById(borrowRequest.borrow_id)
          .then(data => {
            setBorrowDetails(data);
            setDetailsLoading(false);
          })
          .catch(() => setDetailsLoading(false));
      } else {
        setBorrowDetails(null);
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open, borrowRequest?.borrow_id]);

  if (!open) return null;

  // Enhanced SectionHeader with gradient and better styling
  const SectionHeader = ({ title, icon }) => (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-blue-500  rounded-xl shadow-md">
        <span className="text-white">{icon}</span>
      </div>
      <div>
        <h4 className="text-lg font-bold text-gray-800">{title}</h4>
        <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
      </div>
    </div>
  );

  // Helper: ใช้ borrowDetails ถ้ามี, fallback เป็น borrowRequest
  const data = borrowDetails || borrowRequest;

  // User info mapping (ใช้เฉพาะข้อมูลจาก backend เท่านั้น)
  let borrower = null;
  if (data?.borrower && typeof data.borrower === 'object' && Object.keys(data.borrower).length > 0) {
    borrower = {
      name: data.borrower.name || data.borrower.Fullname || data.borrower.fullname || data.borrower.username || '-',
      avatar: data.borrower.avatar || '',
      student_id: data.borrower.student_id || data.borrower.user_code || data.borrower.user_id || '',
      position: data.borrower.position || data.borrower.position_name || '',
      department: data.borrower.department || data.borrower.branch_name || '',
    };
  } else if (data?.user_fullname || data?.Fullname || data?.username || data?.name) {
    borrower = {
      name: data.user_fullname || data.Fullname || data.username || data.name || '-',
      avatar: data.avatar || '',
      student_id: data.student_id || data.user_code || data.user_id || '',
      position: data.position || data.position_name || '',
      department: data.department || data.branch_name || '',
    };
  }
  // Equipment mapping (ใช้เฉพาะข้อมูลจาก backend เท่านั้น)
  let equipmentList = Array.isArray(data?.equipment) ? data.equipment : [];

  const borrowDate = data.borrow_date || data.created_at || data.request_date || null;
  const dueDate = data.due_date || data.return_date || data.due || null;
  const approvalDate = data.approval_date || data.approvalDate || null;
  const returnDate = data.return_date || data.returned_date || null;
  const borrowingDate = data.borrowing_date || data.borrowed_date || null;

  return (
    <div className="modal modal-open">
      <div data-theme="light" className="max-w-8xl w-full h-full max-h-[95vh] rounded-2xl shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-50">
        {detailsLoading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{animationDelay: '0.15s'}}></div>
            </div>
            <p className="text-blue-600 font-medium mt-4">กำลังโหลดข้อมูล...</p>
          </div>
        ) : data ? (
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
                          {getDialogTitle(data.status)}
                        </h2>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-white">
                        <span className="flex items-center gap-1">
                          <TagIcon className="w-4 h-4" />
                          รหัส: <span className="font-mono font-semibold text-white">{data.borrow_code || '-'}</span>
                        </span>
                        {borrowDate && (
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            วันที่ขอ: <span className="font-semibold text-white">{new Date(borrowDate).toLocaleDateString('th-TH')}</span>
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
                  {borrower && (
                    <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="p-6">
                        <div className="flex flex-col items-center gap-4">
                          <div className="relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-200 shadow-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                              <img
                                src={borrower.avatar ? (typeof borrower.avatar === 'string' && borrower.avatar.startsWith('http') ? borrower.avatar : `${UPLOAD_BASE}/uploads/user/${borrower.avatar}`) : "/profile.png"}
                                alt={borrower.name}
                                className="w-full h-full object-cover"
                                onError={e => { e.target.onerror = null; e.target.src = '/profile.png'; }}
                              />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                              <CheckCircleIcon className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          <div className="text-center space-y-2">
                            {borrower.student_id && (
                              <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-mono">
                                {borrower.student_id}
                              </div>
                            )}
                            <h3 className="font-bold text-xl text-gray-800">{borrower.name}</h3>
                            {borrower.position && (
                              <p className="text-blue-600 font-medium">{borrower.position}</p>
                            )}
                            {borrower.department && (
                              <p className="text-gray-600 text-sm bg-gray-100 px-3 py-1 rounded-full inline-block">{borrower.department}</p>
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
                              <p className="font-bold text-lg text-gray-800">{borrowDate ? new Date(borrowDate).toLocaleDateString('th-TH') : '-'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-4xl">
                            <div className="p-3 bg-orange-500 rounded-full">
                              <ClockIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="text-sm text-orange-600 font-medium mb-1">กำหนดคืน</p>
                              <p className="font-bold text-lg text-gray-800">{dueDate ? new Date(dueDate).toLocaleDateString('th-TH') : '-'}</p>
                            </div>
                          </div>
                        </div>
                        {/* Duration indicator */}
                        {borrowDate && dueDate && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                              <ArrowPathIcon className="w-4 h-4" />
                              <span>ระยะเวลาการยืม: <span className="font-semibold text-blue-600">{Math.ceil((new Date(dueDate) - new Date(borrowDate)) / (1000 * 60 * 60 * 24))} วัน</span></span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <SectionHeader
                      title="วัตถุประสงค์"
                      icon={<TagIcon className="h-5 w-5 text-white" />}
                    />
                    <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <p className="text-gray-700 leading-relaxed">{data.purpose}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Important Documents Section */}
                  {data.important_documents && data.important_documents.length > 0 && (
                    <div>
                      <SectionHeader
                        title="เอกสารสำคัญที่แนบ"
                        icon={<DocumentCheckIcon className="h-5 w-5 text-white" />}
                      />
                      <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="p-6">
                          <DocumentViewer
                            documents={data.important_documents}
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
                        <div className="text-3xl font-bold">{equipmentList.length}</div>
                        <div className="text-sm text-white">รายการ</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-4xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="overflow-x-auto">
                      <div className="min-w-[340px]">
                        <table className="min-w-full">
                          <thead className="bg-blue-500 ">
                            <tr>
                              <th className="px-4 py-4 text-center text-sm font-semibold text-white uppercase tracking-wider">รูป</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">ครุภัณฑ์</th>
                              <th className="px-6 py-4 text-center text-sm font-semibold text-white uppercase tracking-wider">จำนวน</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-blue-100">
                            {equipmentList.length > 0 ? equipmentList.map((item, index) => (
                              <tr key={item.item_id || index} className="hover:bg-blue-50/50 transition-colors duration-200">
                                <td className="px-4 py-4 text-center">
                                  <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center mx-auto border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
                                    <img
                                      src={item.pic ? (typeof item.pic === 'string' && item.pic.startsWith('http') ? item.pic : `${UPLOAD_BASE}/uploads/equipment/${item.item_code || item.code}.jpg`) : "/lo.png"}
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
                  {showConfirm && (
                    <div className="w-full">
                      <div
                        className={`p-6 rounded-4xl shadow-lg border-2 ${
                          actionType === "approve"
                            ? "bg-green-50  border-green-200"
                            : "bg-red-50  border-red-200"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${
                            actionType === "approve" ? "bg-green-500" : "bg-red-500"
                          }`}>
                            {actionType === "approve" ? (
                              <CheckCircleIcon className="h-6 w-6 text-white" />
                            ) : (
                              <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className={`text-lg font-semibold mb-2 ${
                              actionType === "approve" ? "text-green-800" : "text-red-800"
                            }`}>
                              {actionType === "approve"
                                ? "ยืนยันการอนุมัติคำขอยืม"
                                : "ยืนยันการปฏิเสธคำขอยืม"}
                            </h4>
                            <p className={`text-sm mb-3 ${
                              actionType === "approve" ? "text-green-700" : "text-red-700"
                            }`}>
                              {actionType === "approve"
                                ? "คุณกำลังจะอนุมัติคำขอยืมนี้ ระบบจะส่งการแจ้งเตือนไปยังผู้ขอยืม"
                                : "คุณกำลังจะปฏิเสธคำขอยืมนี้ ระบบจะส่งการแจ้งเตือนไปยังผู้ขอยืม"}
                            </p>
                            {approvalNotes && (
                              <div className={`mt-4 p-4 rounded-xl border-2 ${
                                actionType === "approve" 
                                  ? "bg-green-100 border-green-200" 
                                  : "bg-red-100 border-red-200"
                              }`}>
                                <div className="flex items-start gap-2">
                                  <InformationCircleIcon className={`w-5 h-5 mt-0.5 ${
                                    actionType === "approve" ? "text-green-600" : "text-red-600"
                                  }`} />
                                  <div>
                                    <p className={`font-medium text-sm ${
                                      actionType === "approve" ? "text-green-800" : "text-red-800"
                                    }`}>หมายเหตุ</p>
                                    <p className="mt-1 text-gray-700 text-sm leading-relaxed">{approvalNotes}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* หมายเหตุการอนุมัติ */}
                  {data.approvalNotes && (
                    <div>
                      <SectionHeader
                        title="หมายเหตุการอนุมัติ"
                        icon={<InformationCircleIcon className="h-5 w-5 text-white" />}
                      />
                      <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="p-6">
                          <div
                            className={`p-6 rounded-xl border-2 ${
                              data.status === "rejected"
                                ? "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
                                : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-xl ${
                                data.status === "rejected" ? "bg-red-500" : "bg-green-500"
                              }`}>
                                {data.status === "rejected" ? (
                                  <XCircleIcon className="h-6 w-6 text-white" />
                                ) : (
                                  <CheckCircleIcon className="h-6 w-6 text-white" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <h4 className={`text-lg font-semibold ${
                                    data.status === "rejected" ? "text-red-800" : "text-green-800"
                                  }`}>
                                    {data.status === "rejected" ? "คำขอถูกปฏิเสธ" : "คำขอได้รับการอนุมัติ"}
                                  </h4>
                                  {data.approvalDate && (
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                      data.status === "rejected" 
                                        ? "bg-red-100 text-red-800" 
                                        : "bg-green-100 text-green-800"
                                    }`}>
                                      <CalendarIcon className="w-3 h-3 mr-1" />
                                      {data.approvalDate}
                                    </span>
                                  )}
                                </div>
                                <div className="bg-white/80 p-4 rounded-lg border border-gray-200">
                                  <p className="text-gray-700 leading-relaxed">{data.approvalNotes}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Footer */}
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
                      {renderStatusBadge(data.status)}
                    </div>
                  </div>
                </div>
                
                {/* Action buttons on right */}
                <div className="flex justify-end gap-3">
                  {!showConfirm ? (
                    <>
                      {(borrowRequest.status === "carry" || borrowRequest.status === "pending_approval") && (
                        <>
                          <button
                            className="btn bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-transparent"
                            onClick={() => handleAction("reject")}
                          >
                            <XCircleIcon className="w-5 h-5" />
                            ปฏิเสธ
                          </button>
                          <button
                            className="btn bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-transparent"
                            onClick={() => handleAction("approve")}
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                            อนุมัติ
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        className="btn bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-gray-400 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
                        onClick={handleCancelConfirm}
                        disabled={isSubmitting}
                      >
                        ยกเลิก
                      </button>
                      <button
                        className={`btn text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-transparent ${
                          actionType === "approve"
                            ? "bg-gradient-to-r bg-green-600 hover:bg-green-700"
                            : "bg-gradient-to-r bg-red-600 hover:bg-red-700"
                        }`}
                        onClick={confirmAction}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 bg-gray-200  border-transparent rounded-full animate-spin"></div>
                            กำลังดำเนินการ...
                          </>
                        ) : actionType === "approve" ? (
                          <>
                            <CheckCircleIcon className="w-5 h-5" />
                            ยืนยันการอนุมัติ
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="w-5 h-5" />
                            ยืนยันการปฏิเสธ
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100">
              <InformationCircleIcon
                className="h-8 w-8 text-gray-400"
                aria-hidden="true"
              />
            </div>
            <h3 className="mt-4 text-base font-medium text-gray-800">
              ไม่พบข้อมูลคำขอยืม
            </h3>
            <div className="mt-6">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-150 text-sm"
                onClick={handleClose}
              >
                ปิด
              </button>
            </div>
          </div>
        )}

        {/* Reject Confirmation Dialog */}
        {showRejectDialog && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-30 flex items-center justify-center z-50 ">
            <div className="bg-white w-full max-w-lg transform transition-all duration-300 overflow-hidden rounded-4xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                    <span>ปฏิเสธคำขอยืม</span>
                  </h3>
                  <button
                    onClick={handleCancelReject}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors duration-150"
                  >
                    <MdClose className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      โปรดเลือกเหตุผลในการปฏิเสธ
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="space-y-2 overflow-y-auto pr-2">
                      {rejectReasonOptions.map((reason) => (
                        <label
                          key={reason}
                          className={`flex items-start gap-2.5 p-3 cursor-pointer transition-colors duration-150 rounded-lg 
                            ${
                              rejectReason === reason
                                ? 'bg-red-50 border-red-300 shadow-sm'
                                : 'border-gray-200 hover:bg-red-50 hover:border-red-200'
                            }`}
                        >
                          <input
                            type="radio"
                            name="rejectReason"
                            value={reason}
                            checked={rejectReason === reason}
                            onChange={() => setRejectReason(reason)}
                            className="mt-0.5 form-radio accent-red-500"
                          />
                          <span className="text-sm text-gray-700">{reason}</span>
                        </label>
                      ))}
                    </div>
                    {formErrors.rejectReason && !rejectReason && (
                      <p className="mt-1.5 text-sm text-red-600">{formErrors.rejectReason}</p>
                    )}
                  </div>

                  {/* Additional notes for "Other" reason */}
                  {rejectReason === "อื่นๆ (โปรดระบุในหมายเหตุ)" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        ระบุเหตุผลเพิ่มเติม
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-sm"
                        placeholder="โปรดระบุเหตุผลในการปฏิเสธ"
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        required
                      />
                      {formErrors.rejectReason && rejectReason === "อื่นๆ (โปรดระบุในหมายเหตุ)" && !approvalNotes.trim() && (
                        <p className="mt-1.5 text-sm text-red-600">{formErrors.rejectReason}</p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 mt-2">
                    <button
                      onClick={handleCancelReject}
                      className="px-4 py-2 border border-gray-300 rounded-4xl text-gray-700 font-medium hover:bg-gray-100 transition-colors duration-150 text-sm"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleConfirmReject}
                      className="px-4 py-2 bg-red-600 text-white rounded-4xl font-medium hover:bg-red-700 transition-colors duration-150 flex items-center gap-1.5 text-sm"
                      disabled={!rejectReason || (rejectReason === "อื่นๆ (โปรดระบุในหมายเหตุ)" && !approvalNotes.trim())}
                    >
                      <XCircleIcon className="w-4 h-4" />
                      ยืนยัน
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}