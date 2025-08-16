import {
  EyeIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import {
  CheckCircleIcon as CheckCircleSolidIcon
} from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import { UPLOAD_BASE, authFetch } from '../../utils/api';

// Components
import Notification from "../../components/Notification";
import ReturnDetailsDialog from "./dialog/ReturndetailsDialog";

import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  IconButton,
  ThemeProvider,
  Tooltip,
  Typography
} from "@material-tailwind/react";

const TABLE_HEAD = [
  "รหัสการยืม",
  "ผู้ยืม",
  "ครุภัณฑ์",
  "วันที่ยืม",
  "วันที่คืน",
  "สถานะ",
  "จัดการ"
];

// กำหนด theme สีพื้นฐานเป็นสีดำ
const theme = {
  typography: {
    defaultProps: {
      color: "black",
      textGradient: false,
    },
  }
};

const statusConfig = {
  completed: {
    label: "เสร็จสิ้น",
    color: "green",
    icon: CheckCircleSolidIcon,
    backgroundColor: "bg-green-50",
    borderColor: "border-green-100"
  },
  rejected: {
    label: "ไม่อนุมัติ",
    color: "red",
    icon: EyeIcon, // หรือเปลี่ยนเป็น icon อื่นที่เหมาะสม
    backgroundColor: "bg-red-50",
    borderColor: "border-red-100"
  }
};

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d)) return "-";
  return d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function Success() {
  const [borrows, setBorrows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    authFetch(`${UPLOAD_BASE}/api/returns/success-borrows`)
      .then(async res => {
        if (res.status === 401) {
          setNotification({ show: true, message: "หมดเวลาการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่อีกครั้ง", type: "error" });
          setBorrows([]);
          return;
        }
        if (!res.ok) {
          setNotification({ show: true, message: "เกิดข้อผิดพลาดในการโหลดข้อมูล", type: "error" });
          setBorrows([]);
          return;
        }
        const data = await res.json();
        setBorrows(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        setNotification({ show: true, message: "เกิดข้อผิดพลาดในการโหลดข้อมูล", type: "error" });
        setBorrows([]);
      });
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleViewDetails = (borrow) => {
    // Transform borrow data to match ReturnDetailsDialog format
    const returnItem = {
      return_code: borrow.borrow_code,
      borrow_code: borrow.borrow_code,
      equipment: borrow.equipment,
      borrower: borrow.borrower,
      borrow_date: borrow.borrow_date,
      due_date: borrow.due_date,
      return_date: borrow.return_date,
      status: borrow.status,
      condition: "good",
      fine_amount: 0,
      signature_image: borrow.signature_image,
      handover_photo: borrow.handover_photo,
      proof_image: borrow.proof_image,
      important_documents: borrow.important_documents || []
    };

    setSelectedBorrow(returnItem);
    setIsDetailsOpen(true);
  };

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

  const getStatusBadge = (status) => {
    const config = statusConfig[status];
    if (!config) return (
      <div className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-gray-700 text-xs font-semibold">
        ไม่ทราบสถานะ
      </div>
    );
    const Icon = config.icon;
    return (
      <div className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${config.backgroundColor} text-${config.color}-700`}>
        <Icon className="w-4 h-4" /> {config.label}
      </div>
    );
  };

  // Compute filtered borrows
  const filteredBorrows = Array.isArray(borrows)
    ? borrows.filter(borrow => ['completed', 'rejected'].includes(borrow.status))
      .filter(borrow => {
        const searchTermLower = searchTerm.toLowerCase();
        const matchesSearch =
          (borrow.borrow_code && borrow.borrow_code.toLowerCase().includes(searchTermLower)) ||
          (borrow.borrower?.name && borrow.borrower.name.toLowerCase().includes(searchTermLower)) ||
          (borrow.borrower?.department && borrow.borrower.department.toLowerCase().includes(searchTermLower)) ||
          (Array.isArray(borrow.equipment) && borrow.equipment.some(
            eq => (eq.name && eq.name.toLowerCase().includes(searchTermLower)) ||
                  (eq.code && String(eq.code).toLowerCase().includes(searchTermLower))
          ));
        return matchesSearch;
      })
    : [];

  const totalPages = Math.ceil(filteredBorrows.length / rowsPerPage);
  const paginatedBorrows = filteredBorrows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <ThemeProvider value={theme}>
      <Card className="h-full w-full text-gray-800 rounded-2xl shadow-lg">
        <Notification
          show={notification.show}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(prev => ({ ...prev, show: false }))}
        />
        <CardHeader floated={false} shadow={false} className="rounded-t-2xl bg-white px-8 py-6">
          <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <Typography variant="h5" className="text-gray-900 font-semibold tracking-tight">
                รายการการเสร็จสิ้น
              </Typography>
              <Typography color="gray" className="mt-1 font-normal text-sm text-gray-600">
                ดูรายการการยืม-คืนที่เสร็จสิ้นแล้ว
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
          </div>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <div className="overflow-x-auto rounded-2xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-indigo-950 to-blue-700">
                <tr>
                  {TABLE_HEAD.map((head, index) => (
                    <th
                      key={head}
                      className={`px-4 py-3 text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap ${
                        index === 0 ? "w-28 text-left" : // รหัสการยืม
                        index === 1 ? "w-48 text-left" : // ผู้ยืม
                        index === 2 ? "w-64 text-left" : // ครุภัณฑ์
                        index === 3 ? "w-32 text-left" : // วันที่ยืม
                        index === 4 ? "w-32 text-left" : // วันที่คืน
                        index === 5 ? "w-32 text-center" : // สถานะ
                        index === 6 ? "w-32 text-center" : ""
                      }`}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedBorrows.length > 0 ? (
                  paginatedBorrows.map((borrow, idx) => (
                    (console.log('DEBUG borrow.status:', borrow.status),
                    <tr key={borrow.borrow_id} className="hover:bg-gray-50">
                      <td className="w-28 px-4 py-4 whitespace-nowrap font-bold text-gray-900 text-left">{borrow.borrow_code}</td>
                      <td className="w-48 px-4 py-4 whitespace-nowrap text-left">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={borrow.borrower.avatar
                              ? borrow.borrower.avatar.startsWith('http')
                                ? borrow.borrower.avatar
                                : `${UPLOAD_BASE}/uploads/user/${borrow.borrower.avatar}`
                              : '/profile.png'}
                            alt={borrow.borrower.name}
                            size="sm"
                            className="bg-white shadow-sm rounded-full flex-shrink-0"
                          />
                          <div className="overflow-hidden">
                            <Typography variant="small" className="font-semibold text-gray-900 truncate">
                              {borrow.borrower.name}
                            </Typography>
                            <Typography variant="small" className="font-normal text-gray-600 text-xs">
                              {borrow.borrower.position}
                            </Typography>
                            <Typography variant="small" className="font-normal text-gray-400 text-xs">
                              {borrow.borrower.department}
                            </Typography>
                          </div>
                        </div>
                      </td>
                      <td className="w-64 px-4 py-4 whitespace-normal text-left">
                        <div className="space-y-1 overflow-hidden">
                          {Array.isArray(borrow.equipment) && borrow.equipment.length > 0 ? (
                            <>
                              <div className="flex items-center">
                                <Typography variant="small" className="font-semibold text-gray-900 break-words">
                                  {borrow.equipment[0]?.name || '-'}
                                </Typography>
                                {borrow.equipment.length > 1 &&
                                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                                    +{borrow.equipment.length - 1} รายการ
                                  </span>
                                }
                              </div>
                              <Typography variant="small" className="font-normal text-gray-600 text-xs">
                                รวม {borrow.equipment.reduce((total, eq) => total + (eq.quantity || 1), 0)} ชิ้น
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="small" className="font-normal text-gray-400">-</Typography>
                          )}
                        </div>
                      </td>
                      <td className="w-32 px-4 py-4 whitespace-nowrap text-gray-900 text-left">{formatDate(borrow.borrow_date)}</td>
                      <td className="w-32 px-4 py-4 whitespace-nowrap text-gray-900 text-left">{formatDate(borrow.return_date)}</td>
                      <td className="w-32 px-4 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(borrow.status)}
                      </td>
                      <td className="w-32 px-4 py-4 whitespace-nowrap text-center">
                        <Tooltip content="ดูรายละเอียด" placement="top">
                          <IconButton variant="text" color="blue" className="bg-blue-50 hover:bg-blue-100 shadow-sm transition-all duration-200 p-2" onClick={() => handleViewDetails(borrow)}>
                            <EyeIcon className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                      </td>
                    </tr>)
                  ))
                ) : (
                  <tr>
                    <td colSpan={TABLE_HEAD.length} className="px-6 py-16 text-center">
                      <div className="inline-flex items-center justify-center p-5 bg-gray-100 rounded-full mb-5">
                        <MagnifyingGlassIcon className="w-12 h-12 text-gray-400" />
                      </div>
                      <Typography variant="h6" className="text-gray-700 font-medium mb-1">
                        ไม่พบรายการที่ตรงกับการค้นหา
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
            แสดง {paginatedBorrows.length > 0 ? '1' : '0'} ถึง {paginatedBorrows.length} จากทั้งหมด {filteredBorrows.length} รายการ
          </Typography>
          <div className="flex gap-2">
            <Button variant="outlined" size="sm" className="text-gray-700 border-gray-300 hover:bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium normal-case" onClick={() => setPage(page - 1)} disabled={page === 1}>
              ก่อนหน้า
            </Button>
            <Button variant="outlined" size="sm" className="text-gray-700 border-gray-300 hover:bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium normal-case" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
              ถัดไป
            </Button>
          </div>
        </CardFooter>
        {/* Return Details Dialog */}
        {selectedBorrow && (
          <ReturnDetailsDialog
            returnItem={selectedBorrow}
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
          />
        )}
      </Card>
    </ThemeProvider>
  );
}

export default Success;