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
import { getBorrowById } from "../../../utils/api";
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
    returned: "bg-indigo-100 text-indigo-800 border-indigo-200"
  };

  const statusTranslation = {
    pending_approval: "รออนุมัติ",
    carry: "รอส่งมอบ",
    approved: "อนุมัติแล้ว",
    rejected: "ปฏิเสธ",
    borrowing: "กำลังยืม",
    returned: "คืนแล้ว"
  };

  const statusIcons = {
    pending_approval: <ClockIcon className="w-4 h-4" />,
    carry: <ClockIcon className="w-4 h-4" />,
    approved: <CheckCircleIcon className="w-4 h-4" />,
    rejected: <XCircleIcon className="w-4 h-4" />,
    borrowing: <ArrowPathIcon className="w-4 h-4" />,
    returned: <DocumentCheckIcon className="w-4 h-4" />
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
    if (open && borrowRequest?.borrow_id) {
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
  }, [open, borrowRequest?.borrow_id]);

  if (!open) return null;

  // SectionHeader: static header, no expand/collapse, no click
  const SectionHeader = ({ title, icon }) => (
    <div className="flex items-center gap-2 px-3 py-2">
      <span className="text-gray-500">{icon}</span>
      <h4 className="text-sm font-semibold text-gray-600">{title}</h4>
    </div>
  );

  // Helper: ใช้ borrowDetails ถ้ามี, fallback เป็น borrowRequest
  const data = borrowDetails || borrowRequest;

  const API_BASE = "http://localhost:5000";
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
      <div data-theme="light" className="modal-box max-w-[95vw] w-full h-full max-h-[95vh] rounded-xl shadow-lg ">
        {detailsLoading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <span className="loading loading-spinner loading-lg mb-4 "></span>
            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        ) : data ? (
          <div className="flex flex-col h-full ">
            <div className="sticky top-0 z-10 p-5 rounded-full bg-blue-700 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-start gap-3 px-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2 ">
                      {getDialogTitle(data.status)}
                    </h2>

                    <p className="text-xs text-white mt-1">
                      รหัสคำขอ: <span className="font-medium">{data.borrow_code || '-'}</span>
                      {borrowDate && <span> | วันที่ขอ: {new Date(borrowDate).toLocaleDateString('th-TH')}</span>}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-black bg-white hover:text-white p-3 rounded-full hover:bg-black/50 transition-colors duration-150"
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-6 flex-grow">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* ข้อมูลผู้ขอยืมและช่วงเวลา */}
                <div>
                  <SectionHeader
                    title="ข้อมูลผู้ขอยืม"
                    icon={<UserIcon className="h-5 w-5 text-gray-500" />}
                  />
                  {borrower && (
                    <div className="flex flex-col items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg mt-3 shadow-sm">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                        <img
                          src={borrower.avatar ? (borrower.avatar.startsWith('http') ? borrower.avatar : `${API_BASE}/uploads/user/${borrower.avatar}`) : "/profile.png"}
                          alt={borrower.name}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.onerror = null; e.target.src = '/profile.png'; }}
                        />
                      </div>
                      <div className="text-center">
                        {borrower.student_id && <p className="text-gray-500 "><span className="font-mono">{borrower.student_id}</span></p>}
                        <p className="font-bold text-lg text-gray-800">{borrower.name}</p>
                        {borrower.position && <p className="text-gray-500 ">{borrower.position}</p>}
                        {borrower.department && <p className="text-gray-500 mt-1">{borrower.department}</p>}
                      </div>
                    </div>
                  )}
                  <div className="mt-5">
                    <SectionHeader
                      title="ข้อมูลการยืม"
                      icon={<CalendarIcon className="h-5 w-5 text-gray-500" />}
                    />
                    <div className="grid grid-cols-2 gap-4 p-4 bg-white border border-gray-200 rounded-lg mt-3 shadow-sm">
                      <div className="border-r border-gray-200 pr-4">
                        <p className="text-sm text-gray-600 mb-1">วันที่ต้องการยืม:</p>
                        <p className="font-medium text-base text-gray-800">{borrowDate ? new Date(borrowDate).toLocaleDateString('th-TH') : '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">กำหนดคืน:</p>
                        <p className="font-medium text-base text-gray-800">{dueDate ? new Date(dueDate).toLocaleDateString('th-TH') : '-'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5">
                    <SectionHeader
                      title="วัตถุประสงค์"
                      icon={<TagIcon className="h-5 w-5 text-gray-500" />}
                    />
                    <div className="p-4 bg-white border border-gray-200 rounded-lg mt-3 shadow-sm">
                      <p className="text-sm leading-relaxed text-gray-700">{data.purpose}</p>
                    </div>
                  </div>

                  {/* Important Documents Section */}
                  {data.important_documents && data.important_documents.length > 0 && (
                    <div className="mt-5">
                      <DocumentViewer
                        documents={data.important_documents}
                        title="เอกสารสำคัญที่แนบ"
                      />
                    </div>
                  )}
                </div>
                {/* ข้อมูลอุปกรณ์ */}
                <div>
                  <SectionHeader
                    title="รายการครุภัณฑ์ที่ยืม"
                    icon={<CubeIcon className="h-5 w-5 text-gray-500" />}
                  />
                  <div className="shadow-sm mt-3">
                    <div className="overflow-x-auto  rounded-lg">
                      <div className="min-w-[340px]">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-blue-700">
                            <tr>
                              <th className="px-2 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">รูป</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-white  uppercase tracking-wider">ครุภัณฑ์</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-white  uppercase tracking-wider">จำนวน</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {equipmentList.length > 0 ? equipmentList.map((item, index) => (
                              <tr key={item.item_id || index} className="hover:bg-gray-50">
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
                                  <div className="text-xs text-gray-500 italic mt-1 leading-tight">{item.item_code}</div>
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
                  {showConfirm && (
                  <div className="w-full mt-5">
                    <div
                      className={`p-4 rounded-lg shadow-sm border ${
                        actionType === "approve"
                          ? "bg-green-50 border-green-200 text-green-700"
                          : "bg-red-50 border-red-200 text-red-700"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {actionType === "approve" ? (
                          <InformationCircleIcon className="h-5 w-5 flex-shrink-0 text-green-500 mt-0.5" />
                        ) : (
                          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
                        )}
                        <div>
                          <h4 className="text-sm font-medium">
                            {actionType === "approve"
                              ? "ยืนยันการอนุมัติคำขอยืม"
                              : "ยืนยันการปฏิเสธคำขอยืม"}
                          </h4>
                          <p className="text-sm mt-1">
                            {actionType === "approve"
                              ? "คุณกำลังจะอนุมัติคำขอยืมนี้"
                              : "คุณกำลังจะปฏิเสธคำขอยืมนี้"}
                          </p>
                          {approvalNotes && (
                            <div className="mt-3 px-5 py-2 bg-red-600 rounded-full text-sm border border-gray-300">
                              <p className="font-medium text-white">หมายเหตุ</p>
                              <p className="mt-1 text-white">{approvalNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                  {/* หมายเหตุการอนุมัติ */}
                  {data.approvalNotes && (
                    <div className="mt-5">
                      <SectionHeader
                        title="หมายเหตุการอนุมัติ"
                        icon={<InformationCircleIcon className="h-5 w-5 text-gray-500" />}
                      />
                      <div className="mt-3">
                        <div
                          className={`p-4 rounded-lg shadow-sm border ${
                            data.status === "rejected"
                              ? "bg-red-50 border-red-200 text-red-700"
                              : "bg-green-50 border-green-200 text-green-700"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {data.status === "rejected" ? (
                              <XCircleIcon className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
                            ) : (
                              <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-green-500 mt-0.5" />
                            )}
                            <div>
                              <p className="text-sm mb-1 font-medium">
                                {data.status === "rejected" ? "คำขอถูกปฏิเสธ" : "คำขอได้รับการอนุมัติ"}
                              </p>
                              <p className="text-sm leading-relaxed">{data.approvalNotes}</p>
                              {data.approvalDate && (
                                <p className="text-xs text-gray-500 mt-2">วันที่: {data.approvalDate}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 mt-auto px-6">
              {/* ยืนยันการดำเนินการ (footer, align left, same row as buttons, ปุ่มอยู่ขวาเสมอ) */}
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex justify-end gap-3 w-full md:w-auto md:ml-auto">
                  {!showConfirm ? (
                    <>
                      {(borrowRequest.status === "carry" || borrowRequest.status === "pending_approval") && (
                        <>
                          <button
                            className="btn bg-red-600 hover:bg-red-700 hover:opacity-90 text-white rounded-2xl"
                            onClick={() => handleAction("reject")}
                          >
                            <XCircleIcon className="w-4 h-4" />
                            ปฏิเสธ
                          </button>
                          <button
                            className="btn bg-green-600 hover:bg-green-700 hover:opacity-90 text-white rounded-2xl"
                            onClick={() => handleAction("approve")}
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                            อนุมัติ
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        className="btn btn-ghost hover:opacity-90 text-black rounded-2xl border-2 border-gray-300"
                        onClick={handleCancelConfirm}
                        disabled={isSubmitting}
                      >
                        ยกเลิก
                      </button>
                      <button
                        className={`btn btn-ghost hover:opacity-90 text-white rounded-2xl
                          ${actionType === "approve"
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "bg-red-600 hover:bg-red-700"
                          }`}
                        onClick={confirmAction}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="loading loading-spinner loading-xs"></span>
                            กำลังดำเนินการ...
                          </>
                        ) : actionType === "approve" ? (
                          <>
                            ยืนยันการอนุมัติ
                          </>
                        ) : (
                          <>
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
          <div className="fixed inset-0 bg-black/50 bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-lg transform transition-all duration-300 overflow-hidden">
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
                          className={`flex items-start gap-2.5 p-3 cursor-pointer transition-colors duration-150 rounded-lg border
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

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-5">
                    <button
                      onClick={handleCancelReject}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors duration-150 text-sm"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleConfirmReject}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-150 flex items-center gap-1.5 text-sm"
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