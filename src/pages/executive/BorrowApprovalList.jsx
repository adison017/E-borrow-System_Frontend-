import {
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { IconButton, Tooltip } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { getAllBorrows, updateBorrowStatus } from "../../utils/api";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BorrowDetailsDialog from "./dialogs/BorrowDetailsDialog";
import { useBadgeCounts } from '../../hooks/useSocket';

const API_BASE = "http://localhost:5000";

export default function BorrowApprovalList() {
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending_approval");
  // ไม่ใช้ notification state แบบเดิม ใช้ react-toastify แทน
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // Pagination state
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  // สถานะของคำขอยืม
  const statusOptions = [
    { value: "all", label: "ทั้งหมด", count: 0 },
    { value: "pending_approval", label: "รออนุมัติ (ใหม่)", count: 0 },
    { value: "carry", label: "รอส่งมอบ", count: 0 },
    { value: "approved", label: "อนุมัติแล้ว", count: 0 },
    { value: "rejected", label: "ปฏิเสธ", count: 0 },
    { value: "borrowing", label: "กำลังยืม", count: 0 },
    { value: "returned", label: "คืนแล้ว", count: 0 }
  ];

  const statusBadgeStyle = {
    pending_approval: "bg-orange-50 text-orange-800 border-orange-200",
    carry: "bg-yellow-50 text-yellow-800 border-yellow-200",
    approved: "bg-green-50 text-green-800 border-green-200",
    rejected: "bg-red-50 text-red-800 border-red-200",
    borrowing: "bg-blue-50 text-blue-800 border-blue-200",
    returned: "bg-purple-50 text-purple-800 border-purple-200"
  };

  const statusIconStyle = {
    carry: "text-yellow-500",
    approved: "text-green-500",
    rejected: "text-red-500",
    borrowing: "text-blue-500",
    returned: "text-purple-500"
  };

  const statusTranslation = {
    pending_approval: "รออนุมัติ",
    carry: "รอส่งมอบ",
    approved: "อนุมัติแล้ว",
    rejected: "ปฏิเสธ",
    borrowing: "กำลังยืม",
    returned: "คืนแล้ว"
  };

  const { subscribeToBadgeCounts } = useBadgeCounts();

  useEffect(() => {
    setLoading(true);
    getAllBorrows()
      .then(data => {
        setBorrowRequests(data);
        setLoading(false);
      })
      .catch(err => {
        setLoading(false);
        showNotification("เกิดข้อผิดพลาดในการโหลดข้อมูล", "error");
      });
    // === เพิ่มฟัง event badgeCountsUpdated เพื่ออัปเดต borrow approval list แบบ real-time ===
    const handleBadgeUpdate = () => {
      getAllBorrows().then(data => {
        setBorrowRequests(data);
      });
    };
    const unsubscribe = subscribeToBadgeCounts(handleBadgeUpdate);
    return unsubscribe;
    // === จบ logic ===
  }, [subscribeToBadgeCounts]);

  const handleOpenDialog = (request) => {
    setSelectedRequest(request);
    setIsDialogOpen(false); // ปิด dialog ก่อนเพื่อ reset state
    setTimeout(() => {
      setIsDialogOpen(true); // เปิดใหม่หลังปิด เพื่อ trigger re-mount
    }, 0);
  };

  // ฟังก์ชันกลางสำหรับแจ้งเตือน
  const notifyBorrowAction = (action, extra) => {
    let message = "";
    let type = "info";
    switch (action) {
      case "approve":
        message = "อนุมัติคำขอยืมเรียบร้อยแล้ว (รอส่งมอบ)";
        type = "success";
        break;
      case "reject":
        message = `ปฏิเสธคำขอยืมเรียบร้อยแล้ว${extra ? ` เหตุผล: ${extra}` : ""}`;
        type = "error";
        break;
      case "error":
        message = extra || "เกิดข้อผิดพลาด";
        type = "error";
        break;
      default:
        message = extra || "ดำเนินการสำเร็จ";
        type = "info";
    }
    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else {
      toast(message);
    }
  };

  const handleApproveRequest = async (approvedData) => {
    try {
      await updateBorrowStatus(approvedData.borrow_id, "carry", approvedData.approvalNotes);
      setBorrowRequests(prevRequests =>
        prevRequests.map(req =>
          req.borrow_id === approvedData.borrow_id
            ? { ...req, ...approvedData, status: "carry" }
            : req
        )
      );
      notifyBorrowAction("approve");
    } catch (err) {
      notifyBorrowAction("error", "เกิดข้อผิดพลาดในการอนุมัติ");
    }
  };

  const handleRejectRequest = async (rejectedData) => {
    try {
      await updateBorrowStatus(rejectedData.borrow_id, "rejected", rejectedData.rejectReason);
      setBorrowRequests(prevRequests =>
        prevRequests.map(req =>
          req.borrow_id === rejectedData.borrow_id
            ? { ...req, ...rejectedData, status: "rejected" }
            : req
        )
      );
      notifyBorrowAction("reject", rejectedData.rejectReason);
    } catch (err) {
      notifyBorrowAction("error", "เกิดข้อผิดพลาดในการปฏิเสธ");
    }
  };

  // ไม่ใช้ showNotification แบบเดิม

  // กรองข้อมูลตามการค้นหาและตัวกรองสถานะ
  const filteredRequests = borrowRequests.filter(request => {
    // รองรับ equipment เป็น array หรือ object
    let equipmentNames = [];
    if (Array.isArray(request.equipment)) {
      equipmentNames = request.equipment.map(eq => eq?.name || "");
    } else if (request.equipment && request.equipment.name) {
      equipmentNames = [request.equipment.name];
    }
    const matchSearch =
      (request.borrow_code && request.borrow_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      equipmentNames.some(name => name && name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (request.borrower?.name && request.borrower.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === "all" || request.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / rowsPerPage);
  const paginatedRequests = filteredRequests.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // จำนวนคำขอแต่ละสถานะ
  const countByStatus = borrowRequests.reduce((acc, request) => {
    acc[request.status] = (acc[request.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="container mx-auto p-6 max-w-8xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">อนุมัติคำขอยืมอุปกรณ์</h1>
          <p className="text-gray-500 text-sm">จัดการคำขอยืมอุปกรณ์ทั้งหมดขององค์กร</p>
        </div>
      </div>

      {/* ตารางรายการ */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MagnifyingGlassIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">ไม่พบรายการที่ตรงกับการค้นหา</h3>
            <p className="text-gray-500">ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-indigo-950 to-blue-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-white uppercase tracking-wider">
                    รหัสคำขอ
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-white uppercase tracking-wider">
                    อุปกรณ์
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-white uppercase tracking-wider">
                    ผู้ขอยืม
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-white uppercase tracking-wider">
                    วันที่ยืม
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-white uppercase tracking-wider">
                    กำหนดคืน
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-sm font-medium text-white uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-sm font-medium text-white uppercase tracking-wider">
                    การจัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedRequests.map((request) => (
                  <tr key={request.borrow_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900 font-bold">{request.borrow_code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-15 w-15 rounded-lg">
                          <img
                            className="h-full w-full object-contain"
                            src={Array.isArray(request.equipment) && request.equipment[0]?.pic ? `${request.equipment[0].pic.startsWith('http') ? request.equipment[0].pic : '/lo.png'}` : '/placeholder-equipment.png'}
                            alt={Array.isArray(request.equipment) && request.equipment[0]?.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {Array.isArray(request.equipment) && request.equipment.length > 0 ? request.equipment[0].name : '-'}
                            {Array.isArray(request.equipment) && request.equipment.length > 1 && (
                              <span className="ml-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                                +{request.equipment.length - 1} รายการ
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {Array.isArray(request.equipment) && request.equipment[0]?.item_code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <img
                            className="h-full w-full rounded-full bg-white shadow-sm"
                            src={
                              request.borrower?.avatar
                                ? (request.borrower.avatar.startsWith('http')
                                    ? request.borrower.avatar
                                    : `${API_BASE}/uploads/user/${request.borrower.avatar}`)
                                : "/profile.png"
                            }
                            alt={request.borrower?.name}
                            onError={e => { e.target.onerror = null; e.target.src = '/profile.png'; }}
                          />
                        </div>
                        <div className="ml-3 overflow-hidden">
                          <div className="text-sm font-medium text-gray-900 truncate">{request.borrower?.name}</div>
                          <div className="text-xs text-gray-500">{request.borrower?.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-base text-gray-900">{request.borrow_date ? new Date(request.borrow_date).toLocaleDateString('th-TH') : '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-base text-gray-900">{request.due_date ? new Date(request.due_date).toLocaleDateString('th-TH') : '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 inline-flex text-xs flex-center justify-center leading-5 font-semibold rounded-full border ${statusBadgeStyle[request.status]}`}>
                        {statusTranslation[request.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Tooltip content="ดูรายละเอียด" placement="top">
                          <IconButton
                            variant="text"
                            color="green"
                            className="bg-green-50 hover:bg-green-100 shadow-sm transition-all duration-200 p-2"
                            onClick={() => handleOpenDialog(request)}
                          >
                            <CheckCircleIcon className="h-6 w-6" />
                          </IconButton>
                        </Tooltip>
                        {/* ปุ่มยกเลิกการยืมถูกลบตามคำขอ */}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
            {/* Pagination Footer */}
            <tfoot>
              <tr>
                <td colSpan={7} className="bg-white px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between">
                    <span className="text-gray-600 mb-3 sm:mb-0 text-sm">
                      แสดง {paginatedRequests.length > 0 ? (page - 1) * rowsPerPage + 1 : 0} ถึง {(page - 1) * rowsPerPage + paginatedRequests.length} จากทั้งหมด {filteredRequests.length} รายการ
                    </span>
                    <div className="flex gap-2">
                      <button
                        className="text-gray-700 border border-gray-300 hover:bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium normal-case"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        ก่อนหน้า
                      </button>
                      <button
                        className="text-gray-700 border border-gray-300 hover:bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium normal-case"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                      >
                        ถัดไป
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Dialog สำหรับอนุมัติคำขอ */}
      <BorrowDetailsDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        borrowRequest={selectedRequest}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
      />

      {/* Toast Notification */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}