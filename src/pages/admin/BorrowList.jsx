import {
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import {
  ArrowPathIcon,
  CheckCircleIcon as CheckCircleSolidIcon,
  XCircleIcon
} from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { getAllBorrows } from "../../utils/api";
import { useBadgeCounts } from '../../hooks/useSocket';

// Components
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmDialog from "../../components/ConfirmDialog";
import BorrowDetailsDialog from "./dialog/BorrowDetailsDialog";

import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  IconButton,
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
  ThemeProvider,
  Tooltip,
  Typography
} from "@material-tailwind/react";

const TABLE_HEAD = [
  "รหัสการยืม",
  "ผู้ยืม",
  "ครุภัณฑ์",
  "วันที่ยืม",
  "กำหนดคืน",
  "วัตถุประสงค์",
  "สถานะ",
  "จัดการ"
];

const statusConfig = {
  "pending": {
    label: "รอตรวจสอบ",
    color: "amber",
    icon: ArrowPathIcon,
    backgroundColor: "bg-amber-50",
    borderColor: "border-amber-100"
  },
  "pending_approval": {
    label: "รออนุมัติ",
    color: "blue",
    icon: ClockIcon,
    backgroundColor: "bg-blue-50",
    borderColor: "border-blue-100"
  },
  "approved": {
    label: "อนุมัติ/กำลังยืม",
    color: "green",
    icon: CheckCircleSolidIcon,
    backgroundColor: "bg-green-50",
    borderColor: "border-green-100"
  },
  "rejected": {
    label: "ไม่อนุมัติ",
    color: "red",
    icon: XCircleIcon,
    backgroundColor: "bg-red-50",
    borderColor: "border-red-100"
  }
};

const filterableStatuses = ["under_review", "pending_approval", "rejected"];

// กำหนด theme สีพื้นฐานเป็นสีดำ
const theme = {
  typography: {
    defaultProps: {
      color: "#374151",
      textGradient: false,
    },
  }
};

// ปรับฟังก์ชันช่วย format วันที่ให้แสดงเฉพาะวัน/เดือน/ปี
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const API_BASE = "http://localhost:5000";

const BorrowList = () => {
  const [borrows, setBorrows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [selectedBorrowId, setSelectedBorrowId] = useState(null);
  // ลบ state notification เดิม (ใช้ react-toastify แทน)

  const { subscribeToBadgeCounts } = useBadgeCounts();

  useEffect(() => {
    getAllBorrows()
      .then(data => {
        console.log('API /api/borrows response:', data);
        if (Array.isArray(data)) {
          setBorrows(data);
          console.log('setBorrows:', data);
        }
      })
      .catch(err => {
        // สามารถแจ้งเตือนหรือ log error ได้
        console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลการยืม:', err);
      });
    // === เพิ่มฟัง event badgeCountsUpdated เพื่ออัปเดต borrow list แบบ real-time ===
    const handleBadgeUpdate = () => {
      getAllBorrows()
        .then(data => {
          if (Array.isArray(data)) setBorrows(data);
        });
    };
    const unsubscribe = subscribeToBadgeCounts(handleBadgeUpdate);
    return unsubscribe;
    // === จบ logic ===
  }, [subscribeToBadgeCounts]);

  // ฟังก์ชันกลางสำหรับแจ้งเตือน
  const notifyBorrowAction = (action, extra) => {
    let message = "";
    let type = "info";
    switch (action) {
      case "approve":
        message = "ส่งคำขอยืมไปยังผู้บริหารเพื่ออนุมัติเรียบร้อยแล้ว";
        type = "success";
        break;
      case "reject":
        message = `ไม่อนุมัติคำขอยืมเรียบร้อยแล้ว${extra ? `เหตุผล: ${extra}` : ""}`;
        type = "error";
        break;
      case "review":
        message = "ส่งคำขอยืมไปยังผู้บริหารเพื่ออนุมัติเรียบร้อยแล้ว";
        type = "success";
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

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleViewDetails = (borrow) => { setSelectedBorrow(borrow); setIsDetailsOpen(true); };
  const handleReviewRequest = (borrowId) => { setSelectedBorrowId(borrowId); setIsConfirmOpen(true); };
  const confirmReview = () => {
    const updatedBorrows = borrows.map(item =>
      item.borrow_id === selectedBorrowId ? { ...item, status: "pending_approval" } : item
    );
    setBorrows(updatedBorrows);
    setIsConfirmOpen(false);
    notifyBorrowAction("review");
  };
  const handleApproveDetails = () => {
    if (selectedBorrow) {
      const updatedBorrows = borrows.map(item =>
        item.borrow_id === selectedBorrow.borrow_id ? { ...item, status: "pending_approval" } : item
      );
      setBorrows(updatedBorrows);
      notifyBorrowAction("approve");
      return Promise.resolve();
    }
    return Promise.reject();
  };
  const handleReject = (reason) => {
    if (selectedBorrow) {
      const updatedBorrows = borrows.map(item =>
        item.borrow_id === selectedBorrow.borrow_id
          ? { ...item, status: "rejected", notes: reason }
          : item
      );
      setBorrows(updatedBorrows);
      notifyBorrowAction("reject", reason);
    }
  };

  const handleStatusFilter = (status) => setStatusFilter(status);
  const countByStatus = borrows.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredBorrows = borrows
    .filter(borrow => {
      let equipmentNames = [];
      let equipmentCodes = [];
      if (Array.isArray(borrow.equipment)) {
        equipmentNames = borrow.equipment.map(eq => eq?.name || "");
        equipmentCodes = borrow.equipment.map(eq => eq?.item_code || "");
      } else if (borrow.equipment && borrow.equipment.name) {
        equipmentNames = [borrow.equipment.name];
        equipmentCodes = [borrow.equipment.item_code];
      }

      const matchesSearch =
        (borrow.borrow_code && borrow.borrow_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        equipmentNames.some(name => name && name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        equipmentCodes.some(code => code && code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (borrow.borrower?.name && borrow.borrower.name.toLowerCase().includes(searchTerm.toLowerCase()));

      // แสดงเฉพาะสถานะ pending_approval หรือ pending
      const matchesStatus = borrow.status === "pending_approval" || borrow.status === "pending";
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const statusPriority = {
        "pending": 0,
        "pending_approval": 1,
        "approved": 2,
        "rejected": 3
      };
      if (statusPriority[a.status] !== statusPriority[b.status]) {
        return statusPriority[a.status] - statusPriority[b.status];
      }
      return new Date(b.borrow_date) - new Date(a.borrow_date);
    });

  // Calculate pagination
  const totalPages = Math.ceil(filteredBorrows.length / itemsPerPage);
  const paginatedBorrows = filteredBorrows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset to first page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, borrows.length]);

  return (
    <ThemeProvider value={theme}>
      <Card className="h-full w-full text-gray-800 rounded-2xl shadow-lg">
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
        <CardHeader floated={false} shadow={false} className="rounded-t-2xl bg-white px-8 py-6">
          <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <Typography variant="h5" className="text-gray-900 font-semibold tracking-tight">
                รายการยืมครุภัณฑ์
              </Typography>
              <Typography color="gray" className="mt-1 font-normal text-sm text-gray-600">
                จัดการและติดตามการยืมครุภัณฑ์ทั้งหมดภายในระบบ
              </Typography>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-y-4 md:gap-x-4">
            <div className="w-full md:flex-grow relative">
              <label htmlFor="search" className="sr-only">ค้นหาครุภัณฑ์</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="search"
                  type="text"
                  className="w-full h-10 pl-10 pr-4 py-2.5 border border-gray-300 rounded-2xl text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm placeholder-gray-400"
                  placeholder="ค้นหาผู้ยืม, ครุภัณฑ์, แผนก..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
            <div className="flex flex-shrink-0 gap-x-3 w-full md:w-auto justify-start md:justify-end">
              <Menu>
                <MenuHandler>
                  <Button variant="outlined" className="border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm rounded-xl flex items-center gap-2 px-4 py-2 text-sm font-medium normal-case">
                    <FunnelIcon className="h-4 w-4" />
                    ตัวกรอง
                    {statusFilter !== "ทั้งหมด" && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full ml-1.5">
                        {statusConfig[statusFilter]?.label || statusFilter} ({countByStatus[statusFilter] || 0})
                      </span>
                    )}
                  </Button>
                </MenuHandler>
                <MenuList className="min-w-[240px] bg-white text-gray-800 rounded-lg border border-gray-100 p-2">
                  <MenuItem
                    className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-gray-100 transition-colors duration-200 ${statusFilter === "ทั้งหมด" ? "bg-blue-50 text-blue-700 font-semibold" : "font-normal"}`}
                    onClick={() => handleStatusFilter("ทั้งหมด")}
                  >
                    <span>ทั้งหมด</span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{borrows.length}</span>
                  </MenuItem>
                  {filterableStatuses.map(statusKey => {
                    const config = statusConfig[statusKey];
                    if (!config) return null; // Should not happen if filterableStatuses are valid keys of statusConfig
                    return (
                      <MenuItem
                        key={statusKey}
                        className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-gray-100 transition-colors duration-200 ${statusFilter === statusKey ? "bg-blue-50 text-blue-700 font-semibold" : "font-normal"}`}
                        onClick={() => handleStatusFilter(statusKey)}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full bg-${config.color}-500`}></span>
                          <span>{config.label}</span>
                        </div>
                        <span className={`text-xs bg-${config.color}-100 text-${config.color}-700 px-1.5 py-0.5 rounded-full`}>{countByStatus[statusKey] || 0}</span>
                      </MenuItem>
                    );
                  })}
                </MenuList>
              </Menu>
            </div>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <div className="overflow-x-auto rounded-2xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-indigo-950 to-blue-700">
                <tr>
                  <th className="w-28 px-3 py-2 text-left text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap">รหัสการยืม</th>
                  <th className="w-40 px-3 py-2 text-left text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap">ผู้ยืม</th>
                  <th className="w-56 px-3 py-2 text-left text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap">ครุภัณฑ์</th>
                  <th className="w-28 px-3 py-2 text-left text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap">วันที่ยืม</th>
                  <th className="w-28 px-3 py-2 text-left text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap">กำหนดคืน</th>
                  <th className="w-40 px-3 py-2 text-left text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap">วัตถุประสงค์</th>
                  <th className="w-28 px-3 py-2 text-center text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap">สถานะ</th>
                  <th className="w-28 px-3 py-2 text-center text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap">จัดการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedBorrows.length > 0 ? (
                  paginatedBorrows.map((item, index) => (
                    <tr key={item.borrow_id} className="hover:bg-gray-50">
                      <td className="w-28 px-3 py-3 whitespace-nowrap font-bold text-gray-900">{item.borrow_code}</td>
                      <td className="w-40 px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={item.borrower.avatar?.startsWith('http') ? item.borrower.avatar : `${API_BASE}/uploads/user/${item.borrower.avatar}`}
                            alt={item.borrower.name}
                            size="sm"
                            className="bg-white shadow-sm rounded-full flex-shrink-0"
                          />
                          <div className="overflow-hidden">
                             <Typography variant="small" className="font-semibold text-gray-900 truncate">{item.borrower.name}</Typography>
                            <Typography variant="small" className="font-normal text-gray-600 text-xs">
                              {item.borrower.position}
                            </Typography>
                            <Typography variant="small" className="font-normal text-gray-400 text-xs">
                              {item.borrower.department}
                            </Typography>
                          </div>
                        </div>
                      </td>
                      <td className="w-56 px-3 py-3 whitespace-normal">
                        <div className="space-y-1 overflow-hidden">
                          {Array.isArray(item.equipment) && item.equipment.length > 0 ? (
                            <>
                              <div className="flex items-center justify-between">
                                <Typography variant="small" className="font-semibold text-gray-900 break-words">
                                  {item.equipment[0]?.name || '-'}
                                  {item.equipment.length > 1 &&
                                    <span className="ml-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                                      +{item.equipment.length - 1} รายการ
                                    </span>
                                  }
                                </Typography>
                              </div>
                              <Typography variant="small" className="font-normal text-gray-600 text-xs">
                                รวม {item.equipment.reduce((total, eq) => total + (eq.quantity || 1), 0)} ชิ้น
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="small" className="font-normal text-gray-400">-</Typography>
                          )}
                        </div>
                      </td>
                      <td className="w-28 px-3 py-3 whitespace-nowrap text-gray-900">{formatDate(item.borrow_date)}</td>
                      <td className="w-28 px-3 py-3 whitespace-nowrap text-gray-900">{formatDate(item.due_date)}</td>
                      <td className="w-40 px-3 py-3 whitespace-normal break-words text-xs text-gray-700">
                        <Typography variant="small" className="text-xs text-gray-700 whitespace-pre-line break-words bg-gray-100 rounded-full p-2">
                          {item.purpose}
                        </Typography>
                      </td>
                      <td className="w-28 px-3 py-3 whitespace-nowrap text-center align-middle">
                        <div className="flex items-center justify-center h-full">
                          <span className={`px-3 py-1 inline-flex justify-center items-center leading-5 font-semibold rounded-full border text-xs ${statusConfig[item.status]?.backgroundColor || "bg-gray-200"} ${statusConfig[item.status]?.borderColor || "border-gray-200"} text-${statusConfig[item.status]?.color || "gray"}-800`}>
                            {statusConfig[item.status]?.label || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="w-28 px-3 py-3 whitespace-nowrap text-center">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          {item.status === "pending" && (
                            <Tooltip content="ตรวจสอบข้อมูล" placement="top">
                              <IconButton variant="text" color="green" className="bg-green-50 hover:bg-green-100 shadow-sm transition-all duration-200 p-2" onClick={() => handleViewDetails(item)}>
                                <CheckCircleSolidIcon className="h-6 w-6" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={TABLE_HEAD.length} className="px-6 py-16 text-center">
                      <div className="inline-flex items-center justify-center p-5 bg-gray-100 rounded-full mb-5">
                        <MagnifyingGlassIcon className="w-12 h-12 text-gray-400" />
                      </div>
                      <Typography variant="h6" className="text-gray-700 font-medium mb-1">
                        ไม่พบรายการยืมที่ตรงกับการค้นหา
                      </Typography>
                      <Typography color="gray" className="text-sm text-gray-500">
                        ลองปรับคำค้นหาหรือตัวกรองสถานะของคุณ
                      </Typography>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 p-6 bg-white rounded-b-2xl">
          <Typography variant="small" className="font-normal text-gray-600 mb-3 sm:mb-0 text-sm">
            แสดง {filteredBorrows.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage + 1)} ถึง {filteredBorrows.length === 0 ? 0 : Math.min(currentPage * itemsPerPage, filteredBorrows.length)} จากทั้งหมด {filteredBorrows.length} รายการ
          </Typography>
          <div className="flex gap-2">
            <Button
              variant="outlined"
              size="sm"
              className="text-gray-700 border-gray-300 hover:bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium normal-case"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              ก่อนหน้า
            </Button>
            <span className="text-gray-700 text-sm px-2 py-1">{currentPage} / {totalPages || 1}</span>
            <Button
              variant="outlined"
              size="sm"
              className="text-gray-700 border-gray-300 hover:bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium normal-case"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              ถัดไป
            </Button>
          </div>
        </CardFooter>
        <BorrowDetailsDialog
          borrow={selectedBorrow}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          onApprove={handleApproveDetails}
          onReject={handleReject}
        />
        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={confirmReview}
          title="ยืนยันการอนุมัติ"
          message="คุณแน่ใจหรือไม่ว่าต้องการส่งคำขอยืมไปยังผู้บริหารเพื่ออนุมัติ?"
        />
      </Card>
    </ThemeProvider>
  );
};

export default BorrowList;