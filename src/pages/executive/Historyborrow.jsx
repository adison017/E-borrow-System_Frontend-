import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import { BsFillFilterCircleFill } from "react-icons/bs";

import { useEffect, useState } from "react";
import { BiSearchAlt2 } from "react-icons/bi";
import { UPLOAD_BASE } from '../../utils/api';
import BorrowDetailsDialog from "./dialogs/BorrowDetailsDialog";

export default function HistoryBorrow() {
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  // Default: show all statuses
  const [statusFilter, setStatusFilter] = useState(["approved", "rejected", "completed", "waiting_payment"]);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success"
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // Pagination state
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  // ...existing code...

  // นับจำนวนแต่ละสถานะจากข้อมูลจริง (ป้องกัน borrowRequests ไม่ใช่ array)
  const statusCounts = Array.isArray(borrowRequests)
    ? borrowRequests.reduce((acc, request) => {
        if (acc[request.status] === undefined) acc[request.status] = 0;
        acc[request.status]++;
        return acc;
      }, {})
    : {};

  // สถานะของคำขอยืม (พร้อม count จริง)
  const statusOptions = [
    { value: "approved", label: "ถูกยืม", count: statusCounts["approved"] || 0 },
    { value: "rejected", label: "ปฏิเสธ", count: statusCounts["rejected"] || 0 },
    { value: "completed", label: "คืนแล้ว", count: statusCounts["completed"] || 0 },
    { value: "waiting_payment", label: "ค้างชำระ", count: statusCounts["waiting_payment"] || 0 }
  ];

  const statusBadgeStyle = {
    approved: "bg-blue-50 text-blue-800 border-blue-200",
    rejected: "bg-red-50 text-red-800 border-red-200",
    completed: "bg-green-50 text-green-800 border-green-200",
    waiting_payment: "bg-yellow-50 text-yellow-800 border-yellow-200"
  };


  const statusTranslation = {
    approved: "ถูกยืม",
    rejected: "ปฏิเสธ",
    completed: "คืนแล้ว",
    waiting_payment: "ค้างชำระ"
  };

  useEffect(() => {
    setLoading(true);
    // ดึง token จาก localStorage (หรือ session/cookie ตามที่ระบบใช้)
    const token = localStorage.getItem('token');
    fetch(`${UPLOAD_BASE}/api/returns/success-borrows`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    })
      .then(async res => {
        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();
        // กรองเฉพาะสถานะที่ต้องการ
        const allowedStatus = ["approved", "rejected", "completed", "waiting_payment"];
        const filtered = Array.isArray(data)
          ? data.filter(item => allowedStatus.includes(item.status))
          : [];
        setBorrowRequests(filtered);
        setLoading(false);
      })
      .catch(err => {
        setBorrowRequests([]);
        setNotification({ show: true, message: "เกิดข้อผิดพลาดในการโหลดข้อมูล (401 Unauthorized)", type: "error" });
        setLoading(false);
      });
  }, []);

  const handleOpenDialog = (request) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };

  const handleApproveRequest = (approvedData) => {
    // ในโปรเจ็กต์จริงควรส่งข้อมูลไปยัง API
    console.log("อนุมัติคำขอยืม:", approvedData);

    // อัปเดตสถานะในรายการ
    setBorrowRequests(prevRequests =>
      prevRequests.map(req =>
        req.borrowId === approvedData.borrowId
          ? { ...req, ...approvedData, status: "approved" }
          : req
      )
    );

    // แสดงการแจ้งเตือน
    showNotification("อนุมัติคำขอยืมเรียบร้อยแล้ว", "success");
  };

  const handleRejectRequest = (rejectedData) => {
    // ในโปรเจ็กต์จริงควรส่งข้อมูลไปยัง API
    console.log("ปฏิเสธคำขอยืม:", rejectedData);

    // อัปเดตสถานะในรายการ
    setBorrowRequests(prevRequests =>
      prevRequests.map(req =>
        req.borrowId === rejectedData.borrowId
          ? { ...req, ...rejectedData, status: "rejected" }
          : req
      )
    );

    // แสดงการแจ้งเตือน
    showNotification("ปฏิเสธคำขอยืมเรียบร้อยแล้ว", "error");
  };

  // แสดงการแจ้งเตือน
  const showNotification = (message, type) => {
    setNotification({
      show: true,
      message,
      type
    });

    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // ฟังก์ชันแปลงวันที่เป็น วัน/เดือน/ปี (ไทย)
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d)) return "-";
    return d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // กรองข้อมูลตามการค้นหาและตัวกรองสถานะ (ป้องกัน borrowRequests ไม่ใช่ array)
  const filteredRequests = Array.isArray(borrowRequests)
    ? borrowRequests.filter(request => {
        // เฉพาะสถานะที่เลือก
        if (!statusFilter.includes(request.status)) return false;
        // ค้นหาด้วยรหัส, อุปกรณ์, หรือชื่อผู้ขอยืม
        const search = searchTerm.toLowerCase();
        return (
          (request.borrow_code && request.borrow_code.toLowerCase().includes(search)) ||
          (Array.isArray(request.equipment) && request.equipment.some(eq => eq.name && eq.name.toLowerCase().includes(search))) ||
          (request.borrower && request.borrower.name && request.borrower.name.toLowerCase().includes(search))
        );
      })
    : [];

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / rowsPerPage);
  const paginatedRequests = filteredRequests.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleStatusFilterChange = (status) => {
    setStatusFilter(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  // จำนวนคำขอแต่ละสถานะ
  const countByStatus = borrowRequests.reduce((acc, request) => {
    acc[request.status] = (acc[request.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="container mx-auto max-w-8xl p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">อนุมัติคำขอยืมอุปกรณ์</h1>
          <p className="text-gray-500 text-sm">จัดการคำขอยืมอุปกรณ์ทั้งหมดขององค์กร</p>
        </div>
      </div>

      {/* ค้นหาและตัวกรอง */}
      <div className="p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BiSearchAlt2 className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="ค้นหาด้วยรหัส อุปกรณ์ ชื่อผู้ขอยืม"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-full text-sm border-gray-200"
            />
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="btn btn-outline flex items-center gap-2 shadow-lg bg-white rounded-2xl transition-colors border-gray-200 hover:text-white hover:bg-blue-700 hover:border-blue-700"
            >
              <BsFillFilterCircleFill className="w-4 h-4" />
              <span>กรองสถานะ</span>
              {isFilterOpen ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>
            
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 min-w-[220px] bg-white rounded-4xl shadow-xl z-20 border border-gray-100 p-3">
                <div className="flex flex-col gap-2">
                  {statusOptions.map(option => (
                    (() => {
                      const active = statusFilter.includes(option.value);
                      const colorMap = {
                        approved: 'blue',
                        rejected: 'red',
                        completed: 'green',
                        waiting_payment: 'yellow',
                      };
                      const color = colorMap[option.value] || 'gray';
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleStatusFilterChange(option.value)}
                          className={`flex items-center justify-between w-full gap-2 p-3 text-sm transition-colors duration-200 cursor-pointer text-left font-normal rounded-full hover:bg-${color}-100 ${active ? `bg-${color}-100 text-${color}-700 font-semibold` : ''}`}
                          style={{ outline: 'none', border: 'none', background: active ? undefined : 'none' }}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full bg-${color}-500`}></span>
                            <span>{option.label}</span>
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${active ? `bg-${color}-200 text-${color}-700` : 'bg-gray-100 text-gray-500'}`}>{option.count}</span>
                        </button>
                      );
                    })()
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* ตารางรายการ + Pagination Footer */}
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
                    ผู้ขอยืม
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-white uppercase tracking-wider">
                    ครุภัณฑ์
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-white uppercase tracking-wider">
                    วันที่ยืม
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-white uppercase tracking-wider">
                    กำหนดคืน
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-white uppercase tracking-wider">
                    วันคืนจริง
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-sm font-medium text-white uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-sm font-medium text-white uppercase tracking-wider">
                    รายละเอียด
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 ">
                {paginatedRequests.map((request) => (
                  <tr key={request.borrow_id || request.borrowId || request.borrow_code} className="hover:bg-gray-50">
                    {/* ...existing table row code... */}
                    <td className="px-6 py-4 whitespace-nowrap ">
                      <div className="text-gray-900 font-bold">{request.borrow_code || request.borrowId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-13 w-13">
                          <img
                            className="h-full w-full rounded-full"
                            src={request.borrower?.avatar ? (request.borrower.avatar.startsWith('http') ? request.borrower.avatar : `${UPLOAD_BASE}/uploads/user/${request.borrower.avatar}`) : "/placeholder-user.png"}
                            alt={request.borrower?.name}
                          />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{request.borrower?.name}</div>
                          <div className="text-xs text-gray-500">{request.borrower?.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 overflow-hidden">
                        {Array.isArray(request.equipment) && request.equipment.length > 0 ? (
                          <>
                            <div className="flex items-center">
                              <span className=" text-gray-900 break-words font-medium">
                                {request.equipment[0]?.name || '-'}
                              </span>
                              {request.equipment.length > 1 &&
                                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                                  +{request.equipment.length - 1} รายการ
                                </span>
                              }
                            </div>
                            <span className="text-xs text-gray-600">
                              รวม {request.equipment.reduce((total, eq) => total + (eq.quantity || 1), 0)} ชิ้น
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-base text-gray-900">{formatDate(request.borrow_date || request.borrowDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-base text-gray-900">{formatDate(request.due_date || request.return_date || request.dueDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-base text-gray-900">{formatDate(request.return_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 inline-flex text-xs flex-center justify-center leading-5 font-semibold rounded-full border ${statusBadgeStyle[request.status]}`}>
                        {statusTranslation[request.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => handleOpenDialog(request)}
                        title="ดูรายละเอียด"
                        className="inline-flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full p-2 transition-all duration-200 shadow-sm"
                        style={{ minWidth: 0 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12C2.25 12 5.25 5.25 12 5.25s9.75 6.75 9.75 6.75-3 6.75-9.75 6.75S2.25 12 2.25 12z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Pagination Footer */}
              <tfoot>
                <tr>
                  <td colSpan={8} className="bg-white px-6 py-4">
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

      {/* Notification Component */}
      {notification.show && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg max-w-md transition-all duration-300 transform ${
          notification.show ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
        } ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
          notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
          'bg-blue-50 border border-blue-200 text-blue-700'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 ${
              notification.type === 'success' ? 'text-green-400' :
              notification.type === 'error' ? 'text-red-400' :
              'text-blue-400'
            }`}>
              {notification.type === 'success' && (
                <CheckCircleIcon className="w-5 h-5" />
              )}
              {notification.type === 'error' && (
                <XCircleIcon className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}