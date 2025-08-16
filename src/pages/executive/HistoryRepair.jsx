import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import { BsFillFilterCircleFill } from "react-icons/bs";

import axios from "axios";
import { useEffect, useState } from "react";
import { BiSearchAlt2 } from "react-icons/bi";
import RepairApprovalDialog from "./dialogs/RepairApprovalDialog";

export default function HistoryRepair() {
  const [repairRequests, setRepairRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  // Show only approved, completed, incomplete, and rejected
  const [statusFilter, setStatusFilter] = useState(["approved", "completed", "incomplete", "rejected"]); // default: show 4
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success"
  });
  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // สถานะของคำขอซ่อม (ใช้ approved, completed, incomplete, rejected)
  const statusOptions = [
    { value: "approved", label: "กำลังซ่อม", count: 0 },
    { value: "incomplete", label: "ไม่สำเร็จ", count: 0 },
    { value: "completed", label: "เสร็จสิ้น", count: 0 },
    { value: "rejected", label: "ปฏิเสธ", count: 0 }
  ];

  const statusBadgeStyle = {
    approved: "bg-blue-50 text-blue-800 border-blue-200",
    completed: "bg-green-50 text-green-800 border-green-200",
    incomplete: "bg-gray-100 text-gray-800 border-gray-200",
    rejected: "bg-red-100 text-red-800 border-red-300"
  };

  const statusTranslation = {
    approved: "กำลังซ่อม",
    incomplete: "ไม่สำเร็จ",
    completed: "เสร็จสิ้น",
    rejected: "ปฏิเสธ"
  };

  useEffect(() => {
    // ดึงข้อมูลจาก API /api/repair-requests/history (getHistoryRequests)
    const fetchRepairRequests = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/api/repair-requests/history');
        console.log('API DATA:', response.data); // debug log
        // แปลงข้อมูลจาก API ให้ตรงกับรูปแบบที่ใช้ใน component (mapping ให้ตรง backend)
        const formattedData = response.data.map(request => ({
          requestId: request.id?.toString() || request.repair_code || "",
          id: request.id,
          user_id: request.user_id,
          item_id: request.item_id,
          problem_description: request.problem_description,
          request_date: request.request_date,
          estimated_cost: request.estimated_cost,
          status: request.status,
          created_at: request.created_at,
          pic_filename: request.pic_filename,
          repair_code: request.repair_code,
          note: request.note,
          budget: request.budget,
          responsible_person: request.responsible_person,
          approval_date: request.approval_date,
          equipment_code: request.equipment_code || (request.equipment && request.equipment.code),
          images: Array.isArray(request.repair_pic) ? request.repair_pic : [],
          equipment: {
            id: request.item_id,
            code: request.equipment_code,
            name: request.equipment_name,
            category: request.equipment_category,
            image: request.equipment_pic || "/placeholder-equipment.png"
          },
          requester: {
            name: request.requester_name,
            department: request.branch_name,
            avatar: request.avatar ? `http://localhost:5000/uploads/user/${request.avatar}` : "/placeholder-user.png"
          },
          description: request.problem_description,
          requestDate: request.request_date ? new Date(request.request_date).toLocaleDateString('th-TH') : "-",
          estimatedCost: request.estimated_cost,
          // สำหรับ fallback กรณี template ใช้ field เดิม
          equipment_pic: request.equipment_pic,
          equipment_name: request.equipment_name,
          equipment_category: request.equipment_category,
          avatar: request.avatar,
          branch_name: request.branch_name,
          requester_name: request.requester_name,
        }));
        setRepairRequests(formattedData);
      } catch (err) {
        setRepairRequests([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRepairRequests();
  }, []);

  // ส่ง raw request (จาก response.data) ให้ RepairApprovalDialog เพื่อให้มีข้อมูลครบ
  const handleOpenDialog = (request) => {
    // หา raw request object จาก response (ถ้ามี)
    const rawRequest = repairRequests.find(r => r.requestId === request.requestId) || request;
    setSelectedRequest(rawRequest);
    setIsDialogOpen(true);
  };

  const handleApproveRequest = (approvedData) => {
    // ในโปรเจ็กต์จริงควรส่งข้อมูลไปยัง API
    console.log("อนุมัติคำขอซ่อม:", approvedData);

    // อัปเดตสถานะในรายการ
    setRepairRequests(prevRequests =>
      prevRequests.map(req =>
        req.requestId === approvedData.requestId
          ? { ...req, ...approvedData, status: "approved" }
          : req
      )
    );

    // แสดงการแจ้งเตือน
    showNotification("อนุมัติคำขอซ่อมเรียบร้อยแล้ว", "success");
  };

  const handleRejectRequest = (rejectedData) => {
    // ในโปรเจ็กต์จริงควรส่งข้อมูลไปยัง API
    console.log("ปฏิเสธคำขอซ่อม:", rejectedData);

    // อัปเดตสถานะในรายการ
    setRepairRequests(prevRequests =>
      prevRequests.map(req =>
        req.requestId === rejectedData.requestId
          ? { ...req, ...rejectedData, status: "rejected" }
          : req
      )
    );

    // แสดงการแจ้งเตือน
    showNotification("ปฏิเสธคำขอซ่อมเรียบร้อยแล้ว", "error");
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

  // กรองข้อมูลตามการค้นหาและตัวกรองสถานะ (approved, completed, incomplete, rejected)
  const filteredRequests = repairRequests.filter(request => {
    if (!['approved', 'completed', 'incomplete', 'rejected'].includes(request.status)) return false;
    const matchSearch =
      request.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter.includes(request.status);
    return matchSearch && matchStatus;
  });

  // Sort so that: approved > rejected > incomplete > completed
  const statusOrder = ['approved', 'rejected', 'incomplete', 'completed'];
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const aIndex = statusOrder.indexOf(a.status);
    const bIndex = statusOrder.indexOf(b.status);
    return aIndex - bIndex;
  });
  // Pagination logic
  const totalPages = Math.ceil(sortedRequests.length / rowsPerPage);
  const paginatedRequests = sortedRequests.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // When rowsPerPage changes, reset to page 1 if needed
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(prev => 
      prev.includes(status)
        ? prev.filter(s => s !== status) // ถ้ามีอยู่แล้วให้ลบออก
        : [...prev, status] // ถ้าไม่มีให้เพิ่มเข้าไป
    );
  };

  // จำนวนคำขอแต่ละสถานะ (approved, completed, incomplete)
  const countByStatus = repairRequests.reduce((acc, request) => {
    acc[request.status] = (acc[request.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="container mx-auto p-6 max-w-8xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">อนุมัติคำขอแจ้งซ่อม</h1>
          <p className="text-gray-500 text-sm">จัดการคำขอแจ้งซ่อมทั้งหมดขององค์กร</p>
        </div>
      </div>
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
                <div className="flex flex-col gap-1">
                  {statusOptions.map(option => {
                    const active = statusFilter.includes(option.value);
                    const colorMap = {
                      approved: 'blue',
                      incomplete: 'gray',
                      completed: 'green',
                      rejected: 'red',
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
                        <span className={`text-xs px-2 py-0.5 rounded-full ${active ? `bg-${color}-200 text-${color}-700` : 'bg-gray-100 text-gray-500'}`}>{countByStatus[option.value] || 0}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
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
                    ครุภัณฑ์
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-white uppercase tracking-wider">
                    ผู้แจ้งซ่อม
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-white uppercase tracking-wider">
                    วันที่แจ้ง
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-white uppercase tracking-wider">
                    ค่าใช้จ่าย
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
                  <tr key={request.requestId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900 font-bold">{request.repair_code || request.requestId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-15 w-15">
                          <img
                            className="h-full w-full object-contain rounded-lg"
                            src={request.equipment?.image || request.equipment_pic || (request.equipment_pic_filename ? `http://localhost:5000/uploads/${request.equipment_pic_filename}` : "/placeholder-equipment.png")}
                            alt={request.equipment?.name || request.equipment_name}
                            onError={e => { e.target.src = "/placeholder-equipment.png"; }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{request.equipment?.name || request.equipment_name}</div>
                          <div className="text-xs text-gray-500">{request.equipment?.category || request.equipment_category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <img
                            className="h-full w-full rounded-full object-cover"
                            src={request.requester?.avatar ? request.requester.avatar : (request.avatar ? `http://localhost:5000/uploads/user/${request.avatar}` : "/placeholder-user.png")}
                            alt={request.requester?.name || request.requester_name}
                          />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{request.requester?.name || request.requester_name}</div>
                          <div className="text-xs text-gray-500">{request.requester?.department || request.branch_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-base text-gray-900">{request.requestDate || (request.request_date ? new Date(request.request_date).toLocaleDateString('th-TH') : '-')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-base text-gray-900">
                        {request.estimatedCost !== undefined && request.estimatedCost !== null
                          ? `${parseInt(request.estimatedCost).toLocaleString('th-TH', { maximumFractionDigits: 0 })} บาท`
                          : request.estimated_cost !== undefined && request.estimated_cost !== null
                            ? `${parseInt(request.estimated_cost).toLocaleString('th-TH', { maximumFractionDigits: 0 })} บาท`
                            : '-'}
                      </div>
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
                <td colSpan={7} className="bg-white px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <span className="text-gray-600 text-sm">
                      แสดง {paginatedRequests.length > 0 ? (page - 1) * rowsPerPage + 1 : 0} ถึง {(page - 1) * rowsPerPage + paginatedRequests.length} จากทั้งหมด {filteredRequests.length} รายการ
                    </span>
                    <div className="flex items-center gap-2 mb-3 sm:mb-0">
                      <span className="text-gray-600 text-sm">แสดง</span>
                      <select
                        className="border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full "
                        value={rowsPerPage}
                        onChange={handleRowsPerPageChange}
                        style={{ minWidth: 60 }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                      <span className="text-gray-600 text-sm">รายการ</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="text-gray-700 border border-gray-300 rounded-full px-4 py-2 text-sm font-medium normal-case transition-colors hover:text-white hover:bg-blue-600"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        ก่อนหน้า
                      </button>
                      <button
                        className="text-gray-700 border border-gray-300 rounded-full px-4 py-2 text-sm font-medium normal-case transition-colors hover:text-white hover:bg-blue-600"
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
      <RepairApprovalDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        repairRequest={selectedRequest}
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