import {
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  QrCodeIcon,
  TrashIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useBadgeCounts } from '../../hooks/useSocket';

import {
  BanknotesIcon,
  CheckCircleIcon as CheckCircleSolidIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/solid"; // ไอคอนแบบทึบ (ใช้กับ badge สถานะ)

import {
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


// Import components
import ConfirmDialog from "../../components/ConfirmDialog";
import Notification from "../../components/Notification";
import ScannerDialog from "../../components/ScannerDialog";
import ReturnFormDialog from "./dialog/ReturnFormDialog";
import ReturndetailsDialog from "./dialog/ReturndetailsDialog";
import DamageManagementDialog from "./dialog/DamageManagementDialog";




import { UPLOAD_BASE, API_BASE, authFetch } from "../../utils/api";
// Import services
// import { calculateReturnStatus, createNewReturn } from "../../components/returnService";


// กำหนด theme สีพื้นฐานเป็นสีดำ
const theme = {
  typography: {
    defaultProps: {
      color: "black",
      textGradient: false,
    },
  }
};

const TABLE_HEAD = [
  "รหัสการยืม",
  "ผู้ยืม",
  "ครุภัณฑ์",
  "วันที่ยืม",
  "กำหนดคืน",
  "สถานะ",
  "จัดการ"
];

const statusConfig = {
  completed: {
    label: "คืนแล้ว",
    color: "green",
    icon: CheckCircleSolidIcon,
    backgroundColor: "bg-green-50",
    borderColor: "border-green-100"
  },
  overdue: {
    label: "เกินกำหนด",
    color: "red",
    icon: ExclamationTriangleIcon,
    backgroundColor: "bg-red-50",
    borderColor: "border-red-100"
  },
  approved: {
    label: "รอคืน",
    color: "yellow",
    icon: ClockIcon,
    backgroundColor: "bg-yellow-50",
    borderColor: "border-yellow-100"
  },
  waiting_payment: {
    label: "รอชำระเงิน",
    color: "amber",
    icon: ClockIcon,
    backgroundColor: "bg-amber-50",
    borderColor: "border-amber-100"
  }
};

const displayableStatusKeys = ["approved", "overdue", "waiting_payment"];

const FINE_RATE_PER_DAY = 50;
function calculateReturnStatus(borrowedItem) {
  const today = new Date();
  const dueDate = new Date(borrowedItem.due_date);
  // วันถัดจาก dueDate คือวันที่เริ่มคิดค่าปรับ
  const lateStartDate = new Date(dueDate);
  lateStartDate.setDate(lateStartDate.getDate() + 1);
  const msPerDay = 1000 * 60 * 60 * 24;

  if (today >= lateStartDate) {
    // คำนวณจำนวนวันที่เกินกำหนด (เริ่มนับจาก lateStartDate)
    // ถ้าวันนี้คือ lateStartDate จะถือว่าคืนช้า 1 วัน
    const daysLate = Math.floor((today - lateStartDate) / msPerDay) + 1;
    return {
      isOverdue: true,
      overdayCount: daysLate,
      fineAmount: daysLate * FINE_RATE_PER_DAY
    };
  } else {
    return {
      isOverdue: false,
      overdayCount: 0,
      fineAmount: 0
    };
  }
}

const ReturnList = () => {
  const [returns, setReturns] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  // Dialog states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isOpeningScanner, setIsOpeningScanner] = useState(false);
  const [isReturnFormOpen, setIsReturnFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);


  // Payment settings dialog states
  const [isPaymentSettingsOpen, setIsPaymentSettingsOpen] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({
    method: 'promptpay',
    promptpay_number: '',
    bank_name: '',
    account_name: '',
    account_number: ''
  });
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Damage management dialog states
  const [isDamageDialogOpen, setIsDamageDialogOpen] = useState(false);
  const [selectedBorrowForDamage, setSelectedBorrowForDamage] = useState(null);

  // Current data states
  const [selectedBorrowedItem, setSelectedBorrowedItem] = useState(null);
  const [selectedReturnItem, setSelectedReturnItem] = useState(null);
  const [selectedReturnId, setSelectedReturnId] = useState(null);

  // Return processing states
  const [returnStatus, setReturnStatus] = useState({
    isOverdue: false,
    overdayCount: 0,
    fineAmount: 0
  });

  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success"
  });

  // เพิ่ม state สำหรับ refresh
  const [refreshFlag, setRefreshFlag] = useState(0);
  const { subscribeToBadgeCounts } = useBadgeCounts();

  // ฟังก์ชัน fetch returns ใหม่ (ใช้ทั้งใน useEffect และหลังคืนของ)
  const fetchReturns = async () => {
    const res = await authFetch(`${API_BASE}/returns`);
    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }
    const data = await res.json();

    if (!Array.isArray(data)) {
      setReturns([]);
      return;
    }

    // Debug: Check first item for signature_image, handover_photo, and important_documents

    // Mapping: ให้แน่ใจว่ามี field borrower และ equipment เป็น array
    const mapped = data.map(item => {
      return {
        ...item,
        borrower: item.borrower
          ? item.borrower
          : {
              name: item.fullname,
              position: item.position_name,
              department: item.branch_name,
              avatar: item.avatar,
              role: item.role_name,
            },
        equipment: Array.isArray(item.equipment)
          ? item.equipment
          : item.equipment
            ? [item.equipment]
            : [],
      };
    });

    // Mapped data first item

    setReturns(mapped);
  };

  useEffect(() => {
    fetchReturns();
  }, [refreshFlag]);

  // อัปเดตรายการแบบเรียลไทม์เมื่อได้รับ badgeCountsUpdated
  useEffect(() => {
    const unsubscribe = subscribeToBadgeCounts(() => {
      fetchReturns();
    });
    return unsubscribe;
  }, [subscribeToBadgeCounts]);

  // ฟังอีเวนต์ให้รีเฟรชเมื่อ dialog อนุมัติสลิป
  useEffect(() => {
    const handler = () => {
      fetchReturns();
      setNotification({ show: true, message: 'การชำระเงินเสร็จสิ้น', type: 'success' });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 2500);
    };
    window.addEventListener('returnsRefreshRequested', handler);
    return () => window.removeEventListener('returnsRefreshRequested', handler);
  }, []);

  // ฟังอีเวนต์การแจ้งเตือนกลาง เพื่อเรียกใช้ Notification.jsx ในหน้านี้
  useEffect(() => {
    const notifyHandler = (e) => {
      const { type = 'info', message = '' } = e.detail || {};
      setNotification({ show: true, message, type });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 2500);
    };
    window.addEventListener('appNotify', notifyHandler);
    return () => window.removeEventListener('appNotify', notifyHandler);
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const fetchReturnDetails = async (borrow_id) => {
    const res = await authFetch(`${API_BASE}/returns/by-borrow/${borrow_id}`);
    if (!res.ok) return null;
    const data = await res.json();
    // คืน return ล่าสุด (ถ้ามีหลาย record)
    if (Array.isArray(data) && data.length > 0) {
      // เลือกล่าสุดโดยใช้ updated_at > created_at > return_date
      return data.sort((a, b) => {
        const ta = new Date(b.updated_at || b.created_at || b.return_date || 0).getTime();
        const tb = new Date(a.updated_at || a.created_at || a.return_date || 0).getTime();
        return ta - tb;
      })[0];
    }
    return null;
  };

  const handleScanComplete = async (code) => {
    setIsScannerOpen(false);
    let borrowedItem = returns.find(item =>
      item.borrow_code === code || item.equipment.code === code
    );
    if (borrowedItem) {
      if (!borrowedItem.user_id && borrowedItem.borrower?.user_id) {
        borrowedItem = { ...borrowedItem, user_id: borrowedItem.borrower.user_id };
      }
      let paymentDetails = null;
      if (borrowedItem.status === 'waiting_payment') {
        paymentDetails = await fetchReturnDetails(borrowedItem.borrow_id);
      }
      const status = calculateReturnStatus(borrowedItem);
      setReturnStatus(status);
      setSelectedBorrowedItem(borrowedItem);
      setSelectedReturnItem({ ...borrowedItem, paymentDetails });
      setIsReturnFormOpen(true);
    } else {
      showNotification('ไม่พบข้อมูลการยืมที่ตรงกับรหัสที่สแกน', 'error');
    }
  };

  const handleManualSearch = async (code) => {
    setIsScannerOpen(false);
    if (!code.trim()) return;
    let borrowedItem = returns.find(item =>
      (item.borrow_code && item.borrow_code.toLowerCase() === code.toLowerCase()) ||
      (item.equipment?.code && String(item.equipment.code).toLowerCase() === code.toLowerCase())
    );
    if (borrowedItem) {
      if (!borrowedItem.user_id && borrowedItem.borrower?.user_id) {
        borrowedItem = { ...borrowedItem, user_id: borrowedItem.borrower.user_id };
      }
      let paymentDetails = null;
      if (borrowedItem.status === 'waiting_payment') {
        paymentDetails = await fetchReturnDetails(borrowedItem.borrow_id);
      }
      const status = calculateReturnStatus(borrowedItem);
      setReturnStatus(status);
      setSelectedBorrowedItem(borrowedItem);
      setSelectedReturnItem({ ...borrowedItem, paymentDetails });
      setIsReturnFormOpen(true);
    } else {
      showNotification('ไม่พบข้อมูลการยืมที่ตรงกับรหัสที่ค้นหา', 'error');
    }
  };

  // --- Payment Settings handlers ---
  const openPaymentSettings = async () => {
    try {
      setPaymentLoading(true);
      const res = await authFetch(`${API_BASE}/payment-settings`);
      const data = await res.json();
      if (data?.success && data?.data) {
        setPaymentSettings({
          method: data.data.method || 'promptpay',
          promptpay_number: data.data.promptpay_number || '',
          bank_name: data.data.bank_name || '',
          account_name: data.data.account_name || '',
          account_number: data.data.account_number || ''
        });
      }
      setIsPaymentSettingsOpen(true);
    } catch (e) {
      showNotification('ไม่สามารถดึงการตั้งค่าชำระเงินได้', 'error');
    } finally {
      setPaymentLoading(false);
    }
  };

  const savePaymentSettings = async () => {
    try {
      setPaymentLoading(true);
      // basic validation
      if (paymentSettings.method === 'promptpay') {
        if (!paymentSettings.promptpay_number?.trim()) {
          showNotification('กรุณากรอกหมายเลข PromptPay', 'error');
          setPaymentLoading(false);
          return;
        }
      } else if (paymentSettings.method === 'bank') {
        if (!paymentSettings.bank_name?.trim() || !paymentSettings.account_name?.trim() || !paymentSettings.account_number?.trim()) {
          showNotification('กรุณากรอกข้อมูลบัญชีธนาคารให้ครบถ้วน', 'error');
          setPaymentLoading(false);
          return;
        }
      }

      const res = await authFetch(`${API_BASE}/payment-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentSettings)
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        showNotification('บันทึกการตั้งค่าชำระเงินสำเร็จ', 'success');
        setIsPaymentSettingsOpen(false);
      } else {
        showNotification(data?.message || 'บันทึกการตั้งค่าชำระเงินไม่สำเร็จ', 'error');
      }
    } catch (e) {
      showNotification('เกิดข้อผิดพลาดในการบันทึกการตั้งค่าชำระเงิน', 'error');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Damage management handlers
  const handleManageDamage = (borrowItem) => {
    setSelectedBorrowForDamage(borrowItem);
    setIsDamageDialogOpen(true);
  };

  const handleDamageSubmit = async (damageData) => {
    try {
      // เรียก API เพื่อบันทึกข้อมูลความเสียหาย
      const res = await authFetch(`${API_BASE}/damage-levels/${damageData.damage_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: damageData.name,
          fine_percent: damageData.fine_percent,
          detail: damageData.detail
        })
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        showNotification('บันทึกข้อมูลความเสียหายสำเร็จ', 'success');
        setIsDamageDialogOpen(false);
        // รีเฟรชข้อมูล
        fetchReturns();
      } else {
        showNotification(data?.message || 'บันทึกข้อมูลความเสียหายไม่สำเร็จ', 'error');
      }
    } catch (error) {
      showNotification('เกิดข้อผิดพลาดในการบันทึกข้อมูลความเสียหาย', 'error');
    }
  };

  // เพิ่มฟังก์ชันนี้เพื่อให้ ReturnFormDialog เรียกเมื่อยืนยันการคืน
  const handleReturnConfirm = async (returnData) => {
    await fetchReturns(); // ดึงข้อมูลใหม่ทันทีหลังคืนของ
    setRefreshFlag(f => f + 1); // trigger useEffect (optional)
    setIsReturnFormOpen(false);
    showNotification('บันทึกข้อมูลการคืนสำเร็จ', 'success');
  };

  const handleViewDetails = async (returnItem) => {
    // Debug returnItem
    let enriched = returnItem;
    try {
      if (returnItem?.status === 'waiting_payment') {
        const paymentDetails = await fetchReturnDetails(returnItem.borrow_id);
        enriched = { ...returnItem, paymentDetails, proof_image: paymentDetails?.proof_image || returnItem.proof_image };
      }
    } catch (e) {
      // ignore, open dialog anyway
    }
    setSelectedReturnItem(enriched);
    setIsDetailsOpen(true);
  };

  const handleDeleteReturn = (returnId) => {
    setSelectedReturnId(returnId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    // Find the deleted return item
    const deletedItem = returns.find(item => item.borrow_id === selectedReturnId);

    // Filter out the deleted item
    const updatedReturns = returns.filter(item => item.borrow_id !== selectedReturnId);
    setReturns(updatedReturns);

    // Close confirm dialog
    setIsDeleteConfirmOpen(false);

    // Show success notification
    showNotification("ลบรายการคืนเรียบร้อยแล้ว", "success");
  };



  const showNotification = (message, type) => {
    setNotification({
      show: true,
      message,
      type
    });

    // Auto hide notification after 5 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <div className="inline-flex items-center gap-1 rounded-lg bg-green-100 px-2 py-1 text-green-700 text-xs font-semibold">
            <CheckCircleSolidIcon className="w-4 h-4" /> คืนแล้ว
          </div>
        );
      case "overdue":
        return (
          <div className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2 py-1 text-red-700 text-xs font-semibold">
            <ExclamationTriangleIcon className="w-4 h-4" /> เกินกำหนด
          </div>
        );
      case "approved":
        return (
          <div className="inline-flex items-center gap-1 rounded-lg bg-yellow-100 px-2 py-1 text-yellow-800 text-xs font-semibold">
            <ClockIcon className="w-4 h-4" /> รอคืน
          </div>
        );
      case "waiting_payment":
        return (
          <div className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-2 py-1 text-blue-800 text-xs font-semibold animate-pulse border border-blue-200">
            <BanknotesIcon className="w-4 h-4" /> รอชำระเงิน
          </div>
        );
      default:
        return <div className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-gray-700 text-xs font-semibold">ไม่ทราบสถานะ</div>;
    }
  };

  // ลบ badge รอยืนยันชำระแบบพิเศษออก ใช้สถานะหลักเดิมเท่านั้น

  const handleStatusFilter = (status) => setStatusFilter(status);
  const countByStatus = returns.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  const filteredReturns = returns.filter(item => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch =
      (item.borrow_code && item.borrow_code.toLowerCase().includes(searchTermLower)) ||
      (item.borrower?.name && item.borrower.name.toLowerCase().includes(searchTermLower)) ||
      (item.borrower?.department && item.borrower.department.toLowerCase().includes(searchTermLower)) ||
      (Array.isArray(item.equipment) && item.equipment.some(
        eq => (eq.name && eq.name.toLowerCase().includes(searchTermLower)) ||
              (eq.code && String(eq.code).toLowerCase().includes(searchTermLower))
      ));
    const matchesStatus = statusFilter === "ทั้งหมด" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const totalPages = Math.ceil(filteredReturns.length / rowsPerPage);
  const paginatedReturns = filteredReturns.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // กรองข้อมูลก่อน render เฉพาะที่ยังไม่คืนสำเร็จ
  const displayableStatus = ["approved", "overdue", "waiting_payment"];
  const displayReturns = returns.filter(item => displayableStatus.includes(item.status));

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
              <div className="flex items-center gap-3">
                <Typography variant="h5" className="text-gray-900 font-semibold tracking-tight">
                  รายการคืนครุภัณฑ์
                </Typography>
                {/* Badge แสดงจำนวนรายการที่คืนแล้ว */}
                <div className="flex items-center gap-2">
                </div>
              </div>
              <Typography color="gray" className="mt-1 font-normal text-sm text-gray-600">
                จัดการและติดตามการคืนครุภัณฑ์ทั้งหมดภายในระบบ
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
                  <Button variant="outlined" className="border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm rounded-full flex items-center gap-2 px-4 py-2 text-sm font-medium normal-case">
                    <FunnelIcon className="h-4 w-4" />
                    ตัวกรอง
                    {statusFilter !== "ทั้งหมด" && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full ml-1.5">
                        {statusConfig[statusFilter]?.label || statusFilter} ({countByStatus[statusFilter] || 0})
                      </span>
                    )}
                  </Button>
                </MenuHandler>
                <MenuList className="min-w-[200px] bg-white text-gray-800 rounded-lg border border-gray-100 p-2">
                  <MenuItem
                    className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-gray-100 transition-colors duration-200 ${statusFilter === "ทั้งหมด" ? "bg-blue-50 text-blue-700 font-semibold" : "font-normal"}`}
                    onClick={() => handleStatusFilter("ทั้งหมด")}
                  >
                    <span>ทั้งหมด</span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                      {returns.filter(r => displayableStatusKeys.includes(r.status)).length}
                    </span>
                  </MenuItem>
                  {displayableStatusKeys.map(statusKey => {
                    const config = statusConfig[statusKey];
                    if (!config) return null; // Should not happen
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
              <Button
                className="flex items-center gap-2 px-4 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 disabled:opacity-60"
                onClick={() => { if (!isScannerOpen && !isOpeningScanner) { setIsOpeningScanner(true); setIsScannerOpen(true); setTimeout(()=>setIsOpeningScanner(false), 200); } }}
                disabled={isScannerOpen || isOpeningScanner}
              >
                {isScannerOpen || isOpeningScanner ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    กำลังเปิดสแกนเนอร์...
                  </>
                ) : (
                  <>
                    <QrCodeIcon strokeWidth={2} className="h-4 w-4" /> สแกนเพื่อคืน
                  </>
                )}
              </Button>
              <Button
                className="flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-60"
                onClick={openPaymentSettings}
                disabled={paymentLoading}
              >
                {paymentLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    กำลังโหลด...
                  </>
                ) : (
                  <>
                    <BanknotesIcon className="h-4 w-4" /> จัดการการชำระเงิน
                  </>
                )}
              </Button>
              <Button
                className="flex items-center gap-2 px-4 py-3 rounded-full bg-orange-600 text-white hover:bg-orange-700 transition-colors duration-200"
                onClick={() => {
                  // เปิด dialog สำหรับจัดการค่าเสียหายแบบ global
                  setSelectedBorrowForDamage({
                    borrow_code: 'GLOBAL',
                    borrower: { name: 'ระบบทั่วไป' },
                    equipment: { name: 'ครุภัณฑ์ทั้งหมด' },
                    borrow_date: new Date().toISOString()
                  });
                  setIsDamageDialogOpen(true);
                }}
              >
                <CurrencyDollarIcon className="h-4 w-4" /> จัดการค่าเสียหาย
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <div className="overflow-x-auto rounded-2xl">
            <table className="min-w-full divide-y divide-gray-200 table-auto">
              <thead className="bg-gradient-to-r from-indigo-950 to-blue-700">
                <tr>
                  {TABLE_HEAD.map((head, index) => (
                    <th
                      key={head}
                      className={`px-4 py-3 text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap ${
                        index === 0 ? "w-24 text-left" : // รหัสการยืม
                        index === 1 ? "w-48 text-left" : // ผู้ยืม
                        index === 2 ? "w-64 text-left" : // ครุภัณฑ์
                        index === 3 ? "w-28 text-left" : // วันที่ยืม
                        index === 4 ? "w-28 text-left" : // กำหนดคืน
                        index === 5 ? "w-32 text-center" : // สถานะ
                        index === 6 ? "w-40 text-center" : ""
                      }`}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedReturns.length > 0 ? (
                  paginatedReturns.map((item, idx) => (
                    <tr key={item.borrow_id} className="hover:bg-gray-50">
                      <td className="w-24 px-4 py-4 whitespace-nowrap font-bold text-gray-900 text-left">{item.borrow_code}</td>
                      <td className="w-48 px-6 py-4 whitespace-nowrap text-left">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              item.borrower.avatar
                                ? item.borrower.avatar.startsWith('http')
                                  ? item.borrower.avatar
                                  : `${UPLOAD_BASE}/uploads/user/${item.borrower.avatar}`
                                : '/profile.png'
                            }
                            alt={item.borrower.name}
                            className="w-10 h-10 rounded-full object-cover bg-white border border-gray-200 shadow-sm flex-shrink-0"
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
                      <td className="w-64 px-4 py-4 whitespace-normal break-words text-left">
                        <div className="space-y-1 overflow-hidden">
                          {Array.isArray(item.equipment) ? (
                            <>
                              <div className="flex items-center">
                                <Typography variant="small" className="font-semibold text-black-900 break-words">
                                  {item.equipment[0]?.name || '-'}
                                </Typography>
                                {item.equipment.length > 1 &&
                                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                                    +{item.equipment.length - 1} รายการ
                                  </span>
                                }
                              </div>
                              <Typography variant="small" className="font-normal text-gray-600 text-xs">
                                รวม {item.equipment.reduce((total, eq) => total + (eq.quantity || 1), 0)} ชิ้น
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="small" className="font-normal text-gray-900">{item.equipment?.name || '-'}</Typography>
                          )}
                        </div>
                      </td>
                      <td className="w-28 px-4 py-4 whitespace-nowrap text-gray-900 text-left">{item.borrow_date ? new Date(item.borrow_date).toLocaleDateString('th-TH') : "-"}</td>
                      <td className="w-28 px-4 py-4 whitespace-nowrap text-gray-900 text-left">{item.due_date ? new Date(item.due_date).toLocaleDateString('th-TH') : "-"}</td>
                      <td className="w-32 px-4 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="w-40 px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {item.status === 'waiting_payment' && (
                            <Tooltip content="ตรวจสอบการชำระเงิน" placement="top">
                              <IconButton
                                variant="text"
                                color="blue"
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 p-2 animate-pulse border-2 border-white"
                                onClick={() => handleViewDetails(item)}
                              >
                                <BanknotesIcon className="h-4 w-4" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {item.status !== 'waiting_payment' && (
                            <Tooltip content="คืนครุภัณฑ์" placement="top">
                              <IconButton variant="text" color="green" className="bg-green-50 hover:bg-green-100 shadow-sm transition-all duration-200 p-2" onClick={() => {
                                const status = calculateReturnStatus(item);
                                setReturnStatus(status);
                                setSelectedBorrowedItem(item);
                                setIsReturnFormOpen(true);
                              }}>
                                <CheckCircleSolidIcon className="h-4 w-4" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip content="ลบ" placement="top">
                            <IconButton variant="text" color="red" className="bg-red-50 hover:bg-red-100 shadow-sm transition-all duration-200 p-2" onClick={() => handleDeleteReturn(item.borrow_id)}>
                              <TrashIcon className="h-4 w-4" />
                            </IconButton>
                          </Tooltip>
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
                        ไม่พบรายการคืนที่ตรงกับการค้นหา
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
            แสดง {filteredReturns.length === 0 ? 0 : ((page - 1) * rowsPerPage + 1)} ถึง {filteredReturns.length === 0 ? 0 : Math.min(page * rowsPerPage, filteredReturns.length)} จากทั้งหมด {filteredReturns.length} รายการ
          </Typography>
          <div className="flex gap-2">
            <Button
              variant="outlined"
              size="sm"
              className="text-gray-700 border-gray-300 hover:bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium normal-case"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              ก่อนหน้า
            </Button>
            <span className="text-gray-700 text-sm px-2 py-1">{page} / {totalPages || 1}</span>
            <Button
              variant="outlined"
              size="sm"
              className="text-gray-700 border-gray-300 hover:bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium normal-case"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages || totalPages === 0}
            >
              ถัดไป
            </Button>
          </div>
        </CardFooter>
        {/* Scanner Dialog */}
        <ScannerDialog
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanComplete={handleScanComplete}
          onManualInput={handleManualSearch}
        />

        {/* Return Form Dialog */}
        <ReturnFormDialog
          borrowedItem={selectedBorrowedItem}
          isOpen={isReturnFormOpen}
          onClose={() => setIsReturnFormOpen(false)}
          onConfirm={handleReturnConfirm}
          isOverdue={returnStatus.isOverdue}
          overdayCount={returnStatus.overdayCount}
          fineAmount={returnStatus.fineAmount}
          setFineAmount={(amount) => setReturnStatus(prev => ({ ...prev, fineAmount: amount }))}
          showNotification={showNotification}
          paymentDetails={selectedReturnItem?.paymentDetails}
          onViewStatus={() => {
            setIsReturnFormOpen(false);
            setIsDetailsOpen(true);
          }}
        />

        {/* Return Details Dialog */}
        <ReturndetailsDialog
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          returnItem={selectedReturnItem}
          paymentDetails={selectedReturnItem?.paymentDetails}
        />

        {/* Delete Confirm Dialog */}
        <ConfirmDialog
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={confirmDelete}
          title="ยืนยันการลบ"
          message="คุณต้องการลบรายการคืนนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        />

        {/* Payment Settings Dialog (inline) */}
        {isPaymentSettingsOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <Typography variant="h6" className="font-semibold text-gray-800">จัดการการชำระเงิน</Typography>
                <button
                  onClick={() => setIsPaymentSettingsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="ปิด"
                >✕</button>
              </div>
              <div className="px-6 py-5 space-y-5">
                {/* Method */}
                <div>
                  <label className="text-sm font-semibold text-gray-700">วิธีชำระเงิน</label>
                  <div className="mt-2 flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="method"
                        checked={paymentSettings.method === 'promptpay'}
                        onChange={() => setPaymentSettings(ps => ({ ...ps, method: 'promptpay' }))}
                      />
                      PromptPay
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="method"
                        checked={paymentSettings.method === 'bank'}
                        onChange={() => setPaymentSettings(ps => ({ ...ps, method: 'bank' }))}
                      />
                      โอนผ่านบัญชีธนาคาร
                    </label>
                  </div>
                </div>

                {paymentSettings.method === 'promptpay' ? (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">หมายเลข PromptPay</label>
                    <input
                      type="text"
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="เช่น 0812345678 / 1xxxxxxxxxxxxx"
                      value={paymentSettings.promptpay_number}
                      onChange={(e) => setPaymentSettings(ps => ({ ...ps, promptpay_number: e.target.value }))}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">ธนาคาร</label>
                      <input
                        type="text"
                        className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="เช่น KBANK / SCB"
                        value={paymentSettings.bank_name}
                        onChange={(e) => setPaymentSettings(ps => ({ ...ps, bank_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">ชื่อบัญชี</label>
                      <input
                        type="text"
                        className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="ชื่อบัญชีธนาคาร"
                        value={paymentSettings.account_name}
                        onChange={(e) => setPaymentSettings(ps => ({ ...ps, account_name: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm font-semibold text-gray-700">เลขที่บัญชี</label>
                      <input
                        type="text"
                        className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="เช่น 123-4-56789-0"
                        value={paymentSettings.account_number}
                        onChange={(e) => setPaymentSettings(ps => ({ ...ps, account_number: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <Button
                  variant="outlined"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsPaymentSettingsOpen(false)}
                  disabled={paymentLoading}
                >
                  ปิด
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={savePaymentSettings}
                  disabled={paymentLoading}
                >
                  {paymentLoading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Damage Management Dialog */}
        <DamageManagementDialog
          isOpen={isDamageDialogOpen}
          onClose={() => setIsDamageDialogOpen(false)}
          borrowItem={selectedBorrowForDamage}
          onSubmit={handleDamageSubmit}
        />

        
      </Card>
    </ThemeProvider>
  );
};

export default ReturnList;