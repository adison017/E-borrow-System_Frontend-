import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import {
  BanknotesIcon,
  CheckCircleIcon as CheckCircleSolidIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/solid";
import { BsFillFilterCircleFill } from "react-icons/bs";

import { useEffect, useState } from "react";
import { BiSearchAlt2 } from "react-icons/bi";
import { UPLOAD_BASE } from '../../utils/api';
import { useBadgeCounts, useSocket } from '../../hooks/useSocket';

// Add this import for the new dialog
import BorrowDetailsViewDialog from "./dialogs/BorrowDetailsViewDialog";

export default function HistoryBorrow() {
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Add new state for the view dialog
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  // Default: show all statuses
  const [statusFilter, setStatusFilter] = useState(["approved", "carry", "rejected", "completed", "waiting_payment", "overdue"]);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success"
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // Pagination state
  const [page, setPage] = useState(1);
  const rowsPerPage = 5; // Fixed: Added 'const' declaration
  // Real-time update states
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const { subscribeToBadgeCounts } = useBadgeCounts();
  const { on, off, isConnected, isAuthenticated } = useSocket();

  // นับจำนวนแต่ละสถานะจากข้อมูลจริง (ป้องกัน borrowRequests ไม่ใช่ array)
  const statusCounts = Array.isArray(borrowRequests)
    ? borrowRequests.reduce((acc, request) => {
        if (acc[request.status] === undefined) acc[request.status] = 0;
        acc[request.status]++;
        return acc;
      }, {})
    : {};

  // สถานะของคำขอยืม (พร้อม count จริง) - ไม่รวม pending และ pending_approval
  const statusOptions = [
    { value: "carry", label: "รอส่งมอบ", count: statusCounts.carry || 0 },
    { value: "approved", label: "ส่งมอบแล้ว", count: statusCounts.approved || 0 },
    { value: "rejected", label: "ไม่อนุมัติ", count: statusCounts.rejected || 0 },
    { value: "completed", label: "เสร็จสิ้น", count: statusCounts.completed || 0 },
    { value: "waiting_payment", label: "รอชำระเงิน", count: statusCounts.waiting_payment || 0 },
    { value: "overdue", label: "เกินกำหนด", count: statusCounts.overdue || 0 }
  ];

  const statusBadgeStyle = {
    carry: "bg-yellow-50 text-yellow-800 border-yellow-200",
    approved: "bg-green-50 text-green-800 border-green-200",
    rejected: "bg-red-50 text-red-800 border-red-200",
    completed: "bg-purple-50 text-purple-800 border-purple-200",
    waiting_payment: "bg-blue-50 text-blue-800 border-blue-200",
    overdue: "bg-orange-50 text-orange-800 border-orange-200"
  };

  const statusTranslation = {
    carry: "รอส่งมอบ",
    approved: "ส่งมอบแล้ว",
    rejected: "ไม่อนุมัติ",
    completed: "เสร็จสิ้น",
    waiting_payment: "รอชำระเงิน",
    overdue: "เกินกำหนด"
  };

  // ฟังก์ชันสร้าง status badge ที่ตรงกับ ReturnList.jsx
  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-3 py-1 inline-flex items-center gap-1 text-xs flex-center justify-center leading-5 font-semibold rounded-full border bg-green-50 text-green-800 border-green-200">
            <CheckCircleSolidIcon className="w-3 h-3" /> เสร็จสิ้น
          </span>
        );
      case "overdue":
        return (
          <span className="px-3 py-1 inline-flex items-center gap-1 text-xs flex-center justify-center leading-5 font-semibold rounded-full border bg-red-50 text-red-800 border-red-200">
            <ExclamationTriangleIcon className="w-3 h-3" /> เกินกำหนด
          </span>
        );
      case "approved":
        return (
          <span className="px-3 py-1 inline-flex items-center gap-1 text-xs flex-center justify-center leading-5 font-semibold rounded-full border bg-green-50 text-green-800 border-green-200">
            <CheckCircleSolidIcon className="w-3 h-3" /> ส่งมอบแล้ว
          </span>
        );
      case "carry":
        return (
          <span className="px-3 py-1 inline-flex items-center gap-1 text-xs flex-center justify-center leading-5 font-semibold rounded-full border bg-yellow-50 text-yellow-800 border-yellow-200">
            <ClockIcon className="w-3 h-3" /> รอส่งมอบ
          </span>
        );
      case "rejected":
        return (
          <span className="px-3 py-1 inline-flex items-center gap-1 text-xs flex-center justify-center leading-5 font-semibold rounded-full border bg-red-50 text-red-800 border-red-200">
            <XCircleIcon className="w-3 h-3" /> ไม่อนุมัติ
          </span>
        );
      case "waiting_payment":
        return (
          <span className="px-3 py-1 inline-flex items-center gap-1 text-xs flex-center justify-center leading-5 font-semibold rounded-full border bg-blue-50 text-blue-800 border-blue-200 animate-pulse">
            <BanknotesIcon className="w-3 h-3" /> รอชำระเงิน
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 inline-flex text-xs flex-center justify-center leading-5 font-semibold rounded-full border bg-gray-50 text-gray-800 border-gray-200">
            {statusTranslation[status] || status}
          </span>
        );
    }
  };

  const fetchHistoryData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Add a small delay to prevent concurrent requests from overwhelming the rate limiter
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const fetchBorrows = fetch(`${UPLOAD_BASE}/api/borrows?status=carry,approved`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const fetchReturns = fetch(`${UPLOAD_BASE}/api/returns`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const fetchSuccessBorrows = fetch(`${UPLOAD_BASE}/api/returns/success-borrows`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      const [borrowsRes, returnsRes, successRes] = await Promise.all([
        fetchBorrows,
        fetchReturns,
        fetchSuccessBorrows
      ]);
      
      const borrowsData = borrowsRes.ok ? await borrowsRes.json() : [];
      const returnsData = returnsRes.ok ? await returnsRes.json() : [];
      const successData = successRes.ok ? await successRes.json() : [];
      
      // ใช้ Map เพื่อไม่ให้ข้อมูลซ้ำ
      const dataMap = new Map();
      
      // เพิ่มข้อมูลจาก borrows endpoint (carry, approved) - สำหรับสถานะ carry
      if (Array.isArray(borrowsData)) {
        borrowsData.forEach(item => {
          // กรองเฉพาะสถานะ carry และ approved จาก borrows
          if (['carry', 'approved'].includes(item.status)) {
            // คำนวณสถานะ overdue
            let finalStatus = item.status;
            if ((item.status === 'approved' || item.status === 'carry') && item.due_date) {
              const currentDate = new Date();
              const dueDate = new Date(item.due_date);
              if (currentDate > dueDate) {
                finalStatus = 'overdue';
              }
            }
            dataMap.set(item.borrow_id, { ...item, status: finalStatus, original_status: item.status });
          }
        });
      }
      
      // เพิ่มข้อมูลจาก returns endpoint (waiting_payment และอื่นๆ)
      if (Array.isArray(returnsData)) {
        returnsData.forEach(item => {
          // เพิ่มสถานะ waiting_payment จาก returns
          if (['waiting_payment'].includes(item.status)) {
            dataMap.set(item.borrow_id, item);
          }
        });
      }
      
      // เพิ่มข้อมูลจาก success-borrows endpoint (completed, rejected)
      if (Array.isArray(successData)) {
        successData.forEach(item => {
          // เพิ่มทั้ง completed และ rejected จาก success-borrows
          if (['completed', 'rejected'].includes(item.status)) {
            dataMap.set(item.borrow_id, item);
          }
        });
      }
      
      // แปลง Map กลับเป็น Array
      const allData = Array.from(dataMap.values());
      
      setBorrowRequests(allData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setBorrowRequests([]);
      setNotification({ show: true, message: "เกิดข้อผิดพลาดในการโหลดข้อมูล", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
    
    // === Enhanced real-time updates ===
    const handleBadgeUpdate = () => {
      console.log('Badge counts updated, refreshing history data...');
      fetchHistoryData();
      setLastUpdated(new Date());
    };
    
    // Subscribe to multiple socket events for comprehensive real-time updates
    const handleBorrowUpdate = (data) => {
      console.log('Borrow status updated:', data);
      fetchHistoryData();
      setLastUpdated(new Date());
      showNotification(`รายการยืมได้รับการอัปเดต: ${data.borrow_code}`, "info");
    };
    
    const handleReturnUpdate = (data) => {
      console.log('Return status updated:', data);
      fetchHistoryData();
      setLastUpdated(new Date());
      showNotification(`รายการคืนได้รับการอัปเดต: ${data.borrow_code}`, "info");
    };
    
    const handleStatusChange = (data) => {
      console.log('Status changed:', data);
      fetchHistoryData();
      setLastUpdated(new Date());
    };
    
    // Monitor connection status
    const checkConnectionStatus = () => {
      const connected = isConnected() && isAuthenticated();
      setIsRealTimeConnected(connected);
      if (!connected) {
        console.log('Real-time connection lost, attempting to reconnect...');
      }
    };
    
    // Set up event listeners
    const unsubscribeBadge = subscribeToBadgeCounts(handleBadgeUpdate);
    on('borrowStatusUpdated', handleBorrowUpdate);
    on('returnStatusUpdated', handleReturnUpdate);
    on('statusChanged', handleStatusChange);
    
    // Check connection status initially and periodically
    checkConnectionStatus();
    const connectionInterval = setInterval(checkConnectionStatus, 10000); // Check every 10 seconds
    
    // Auto-refresh fallback when real-time is not connected
    let autoRefreshInterval;
    if (autoRefreshEnabled) {
      autoRefreshInterval = setInterval(() => {
        if (!isRealTimeConnected) {
          console.log('Auto-refreshing data (fallback for real-time)...');
          fetchHistoryData();
          setLastUpdated(new Date());
        }
      }, 30000); // Auto-refresh every 30 seconds when not connected
    }
    
    // Cleanup function
    return () => {
      unsubscribeBadge();
      off('borrowStatusUpdated', handleBorrowUpdate);
      off('returnStatusUpdated', handleReturnUpdate);
      off('statusChanged', handleStatusChange);
      clearInterval(connectionInterval);
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }
    };
    // === จบ enhanced real-time logic ===
  }, [subscribeToBadgeCounts, on, off, isConnected, isAuthenticated]);

  const handleOpenDialog = (request) => {
    setSelectedRequest(request);
    // Open the view dialog instead of the approval dialog
    setIsViewDialogOpen(true);
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">อนุมัติคำขอยืมอุปกรณ์</h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-gray-500 text-sm">จัดการคำขอยืมอุปกรณ์ทั้งหมดขององค์กร</p>
          </div>
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
                        approved: 'green',
                        carry: 'indigo',
                        rejected: 'red',
                        completed: 'purple',
                        waiting_payment: 'yellow',
                        overdue: 'orange',
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
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    รหัสคำขอ
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    ผู้ขอยืม
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    ครุภัณฑ์
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider hidden md:table-cell">
                    วันที่ยืม
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider hidden md:table-cell">
                    กำหนดคืน
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider hidden md:table-cell">
                    วันคืนจริง
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                    รายละเอียด
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 ">
                {paginatedRequests.map((request) => (
                  <tr key={request.borrow_id || request.borrowId || request.borrow_code} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap ">
                      <div className="text-gray-900 font-medium text-sm">{request.borrow_code || request.borrowId}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 overflow-hidden rounded-full bg-gray-100">
                          <img
                            className="h-full w-full object-cover"
                            src={request.borrower?.avatar ? (typeof request.borrower.avatar === 'string' && request.borrower.avatar.startsWith('http') ? request.borrower.avatar : `${UPLOAD_BASE}/uploads/user/${request.borrower.avatar}`) : "/profile.png"}
                            alt={request.borrower?.name}
                            onError={e => { e.target.onerror = null; e.target.src = '/profile.png'; }}
                          />
                        </div>
                        <div className="ml-2 overflow-hidden">
                          <div className="text-sm font-medium text-gray-900 truncate">{request.borrower?.name}</div>
                          <div className="text-xs text-gray-500 truncate">{request.borrower?.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1 overflow-hidden">
                        {Array.isArray(request.equipment) && request.equipment.length > 0 ? (
                          <>
                            <div className="flex items-center">
                              <span className=" text-gray-900 break-words font-medium text-sm max-w-xs truncate">
                                {request.equipment[0]?.name || '-'}
                              </span>
                              {request.equipment.length > 1 &&
                                <span className="ml-1 bg-blue-100 text-blue-800 text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0">
                                  +{request.equipment.length - 1} รายการ
                                </span>
                              }
                            </div>
                            <span className="text-xs text-gray-600">
                              รวม {request.equipment.reduce((total, eq) => total + (eq.quantity || 1), 0)} ชิ้น
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">{formatDate(request.borrow_date || request.borrowDate)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">{formatDate(request.due_date || request.return_date || request.dueDate)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">{formatDate(request.return_date)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex justify-center">
                        {getStatusBadge(request.status)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
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
                  <td colSpan={8} className="bg-white px-4 py-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between">
                      <span className="text-gray-600 mb-2 sm:mb-0 text-xs">
                        แสดง {paginatedRequests.length > 0 ? (page - 1) * rowsPerPage + 1 : 0} ถึง {(page - 1) * rowsPerPage + paginatedRequests.length} จากทั้งหมด {filteredRequests.length} รายการ
                      </span>
                      <div className="flex gap-1">
                        <button
                          className="text-gray-700 border border-gray-300 hover:bg-gray-100 rounded-md px-3 py-1.5 text-xs font-medium normal-case"
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                        >
                          ก่อนหน้า
                        </button>
                        <button
                          className="text-gray-700 border border-gray-300 hover:bg-gray-100 rounded-md px-3 py-1.5 text-xs font-medium normal-case"
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
      {/* Replace the existing dialog with the new view dialog */}
      <BorrowDetailsViewDialog
        borrowItem={selectedRequest}
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
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