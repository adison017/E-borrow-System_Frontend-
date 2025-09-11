import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  QrCodeIcon,
  XMarkIcon,
  XCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { getEquipment, UPLOAD_BASE } from '../../utils/api';
import EquipmentDetailDialog from './dialogs/EquipmentDetailDialog';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Import the QRScannerDialog component
import QRScannerDialog from '../admin/dialog/QRScannerDialog';

// กำหนดสีและไอคอนตามสถานะ
const statusConfig = {
  "ชำรุด": {
    color: "red",
    icon: XCircleIcon,
    backgroundColor: "bg-red-50",
    borderColor: "border-red-100"
  },
  "กำลังซ่อม": {
    color: "amber",
    icon: ClockIcon,
    backgroundColor: "bg-amber-50",
    borderColor: "border-amber-100"
  },
  "รออนุมัติซ่อม": {
    color: "blue",
    icon: ClockIcon,
    backgroundColor: "bg-blue-50",
    borderColor: "border-blue-100"
  },
  "ไม่อนุมัติซ่อม": {
    color: "orange",
    icon: XCircleIcon,
    backgroundColor: "bg-orange-50",
    borderColor: "border-orange-100"
  },
  "พร้อมใช้งาน": {
    color: "green",
    icon: CheckCircleIcon,
    backgroundColor: "bg-green-50",
    borderColor: "border-green-100"
  },
  "ถูกยืม": {
    color: "purple",
    icon: ExclamationCircleIcon,
    backgroundColor: "bg-purple-50",
    borderColor: "border-purple-100"
  }
};

function EquipmentList() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [categoryFilter, setCategoryFilter] = useState("ทั้งหมด");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const itemsPerPage = 5;

  // ฟังก์ชันการแจ้งเตือน
  const notifyEquipmentAction = (action, extra) => {
    let message = "";
    let type = "info";
    switch (action) {
      case "success":
        message = extra || "ดำเนินการสำเร็จ";
        type = "success";
        break;
      case "error":
        message = extra || "เกิดข้อผิดพลาด";
        type = "error";
        break;
      case "info":
        message = extra || "ข้อมูล";
        type = "info";
        break;
      default:
        message = extra || "ดำเนินการเสร็จสิ้น";
        type = "info";
    }
    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else {
      toast.info(message);
    }
  };

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        const data = await getEquipment();
        setEquipment(data || []);
      } catch (error) {
        console.error('Error fetching equipment:', error);
        notifyEquipmentAction("error", "ไม่สามารถโหลดข้อมูลครุภัณฑ์ได้");
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, []);

  // Get unique categories
  const uniqueCategories = [...new Set(equipment.map(item => item.category).filter(Boolean))];

  // ฟังก์ชั่นสำหรับกรอง/ค้นหา/เรียงลำดับ
  const filteredEquipment = equipment
    .filter(item => {
      const codeSafe = typeof item.item_code === 'string' ? item.item_code : String(item.item_code ?? "");
      const nameSafe = typeof item.name === 'string' ? item.name : String(item.name ?? "");
      const descSafe = typeof item.description === 'string' ? item.description : String(item.description ?? "");
      return (
        codeSafe.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nameSafe.toLowerCase().includes(searchTerm.toLowerCase()) ||
        descSafe.toLowerCase().includes(searchTerm.toLowerCase())
      ) &&
      (statusFilter === "ทั้งหมด" || item.status === statusFilter) &&
      (categoryFilter === "ทั้งหมด" || item.category === categoryFilter);
    })
    .sort((a, b) => {
      // กำหนดลำดับความสำคัญของสถานะตามที่ต้องการ
      const statusPriority = {
        "ไม่อนุมัติซ่อม": 1,
        "ชำรุด": 2,
        "รออนุมัติซ่อม": 3,
        "กำลังซ่อม": 4,
        "พร้อมใช้งาน": 5,
        "ถูกยืม": 6
      };

      const aPriority = statusPriority[a.status] || 999;
      const bPriority = statusPriority[b.status] || 999;

      // เรียงตามลำดับความสำคัญของสถานะ
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // ถ้าสถานะเท่ากัน ให้เรียงตาม item_code
      const aCode = typeof a.item_code === 'string' ? a.item_code : String(a.item_code ?? '');
      const bCode = typeof b.item_code === 'string' ? b.item_code : String(b.item_code ?? '');
      return aCode.localeCompare(bCode);
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);
  const paginatedEquipment = filteredEquipment.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (category) => {
    setCategoryFilter(category);
    setCurrentPage(1);
  };

  const handleEquipmentClick = (item) => {
    setSelectedEquipment(item);
    setShowDetailDialog(true);
  };

  const handleQRScan = (itemCode) => {
    if (!itemCode.trim()) {
      notifyEquipmentAction("error", "กรุณาป้อนรหัสครุภัณฑ์");
      return;
    }

    const foundEquipment = equipment.find(
      item => item.item_code === itemCode.trim()
    );

    if (foundEquipment) {
      setSelectedEquipment(foundEquipment);
      setShowDetailDialog(true);
      setShowQRScanner(false);
      notifyEquipmentAction("success", `พบครุภัณฑ์: ${foundEquipment.name}`);
    } else {
      notifyEquipmentAction("error", "ไม่พบครุภัณฑ์ที่มีรหัสนี้");
    }
  };

  // Handle equipment found from QR scanner
  const handleEquipmentFound = (equipment) => {
    setSelectedEquipment(equipment);
    setShowDetailDialog(true);
    setShowQRScanner(false); // Make sure to close the QR scanner
    notifyEquipmentAction("success", `พบครุภัณฑ์: ${equipment.name}`);
  };

  return (
    <div className="container mx-auto max-w-8xl p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">รายการครุภัณฑ์</h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-gray-500 text-sm">ดูข้อมูลครุภัณฑ์ทั้งหมดในระบบ - สำหรับผู้บริหาร</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQRScanner(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl rounded-full flex items-center gap-2 px-6 py-3 text-base font-semibold transition-all duration-200"
          >
            <QrCodeIcon className="w-5 h-5" />
            สแกน QR
          </button>
        </div>
      </div>

      {/* ค้นหาและตัวกรอง */}
      <div className="p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="ค้นหารหัส, ชื่อ, หรือรายละเอียด..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-full text-sm border-gray-200"
            />
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-outline flex items-center gap-2 shadow-lg bg-white rounded-2xl transition-colors border-gray-200 hover:text-white hover:bg-blue-700 hover:border-blue-700"
            >
              <FunnelIcon className="w-4 h-4" />
              <span>กรองข้อมูล</span>
              {showFilters ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>
            
            {showFilters && (
              <div className="absolute right-0 mt-2 min-w-[220px] bg-white rounded-lg shadow-xl z-20 border border-gray-100 p-3">
                <div className="flex flex-col gap-2">
                  {/* Category Filter */}
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">หมวดหมู่</h4>
                    <button
                      type="button"
                      onClick={() => handleCategoryFilter("ทั้งหมด")}
                      className={`flex items-center justify-between w-full gap-2 p-2 text-sm transition-colors duration-200 cursor-pointer text-left font-normal rounded-lg hover:bg-gray-100 ${categoryFilter === "ทั้งหมด" ? "bg-gray-100 text-gray-700 font-semibold" : ""}`}
                    >
                      <span>ทั้งหมด</span>
                      <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{equipment.length}</span>
                    </button>
                    {uniqueCategories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategoryFilter(cat)}
                        className={`flex items-center justify-between w-full gap-2 p-2 text-sm transition-colors duration-200 cursor-pointer text-left font-normal rounded-lg hover:bg-blue-100 ${categoryFilter === cat ? "bg-blue-100 text-blue-700 font-semibold" : ""}`}
                      >
                        <span>{cat}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                          {equipment.filter(item => item.category === cat).length}
                        </span>
                      </button>
                    ))}
                  </div>
                  
                  {/* Status Filter */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">สถานะ</h4>
                    <button
                      type="button"
                      onClick={() => handleStatusFilter("ทั้งหมด")}
                      className={`flex items-center justify-between w-full gap-2 p-2 text-sm transition-colors duration-200 cursor-pointer text-left font-normal rounded-lg hover:bg-gray-100 ${statusFilter === "ทั้งหมด" ? "bg-gray-100 text-gray-700 font-semibold" : ""}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-gray-400"></span>
                        <span>ทั้งหมด</span>
                      </span>
                      <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{equipment.length}</span>
                    </button>
                    {Object.keys(statusConfig).map(statusKey => (
                      <button
                        key={statusKey}
                        type="button"
                        onClick={() => handleStatusFilter(statusKey)}
                        className={`flex items-center justify-between w-full gap-2 p-2 text-sm transition-colors duration-200 cursor-pointer text-left font-normal rounded-lg hover:bg-${statusConfig[statusKey].color}-100 ${statusFilter === statusKey ? `bg-${statusConfig[statusKey].color}-100 text-${statusConfig[statusKey].color}-700 font-semibold` : ""}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full bg-${statusConfig[statusKey].color}-500`}></span>
                          <span>{statusKey}</span>
                        </span>
                        <span className={`text-xs bg-${statusConfig[statusKey].color}-100 text-${statusConfig[statusKey].color}-700 px-1.5 py-0.5 rounded-full`}>
                          {equipment.filter(item => item.status === statusKey).length}
                        </span>
                      </button>
                    ))}
                  </div>
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
        ) : filteredEquipment.length === 0 ? (
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
                    ภาพ
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-white uppercase tracking-wider">
                    รหัส
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-white uppercase tracking-wider">
                    ชื่อครุภัณฑ์
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-white uppercase tracking-wider">
                    หมวดหมู่
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-white uppercase tracking-wider">
                    จำนวน
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-sm font-medium text-white uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-sm font-medium text-white uppercase tracking-wider">
                    รายละเอียด
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedEquipment.map((item) => {
                  const { pic, item_code, name, category, quantity, status, unit } = item;
                  return (
                    <tr key={item_code} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <img
                            className="h-16 w-16 object-cover rounded-lg shadow-sm"
                            src={pic?.startsWith('http') ? pic : `${UPLOAD_BASE}/equipment/${item_code}.jpg`}
                            alt={name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/lo.png';
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900 font-bold">{item_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base text-gray-900 font-medium">{name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base text-gray-900">{category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base text-gray-900">{quantity}{unit ? ` ${unit}` : ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full border ${statusConfig[status]?.backgroundColor || "bg-gray-100"} ${statusConfig[status]?.borderColor || "border-gray-200"} text-${statusConfig[status]?.color || "gray"}-800`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => handleEquipmentClick(item)}
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
                  );
                })}
              </tbody>
              {/* Pagination Footer */}
              <tfoot>
                <tr>
                  <td colSpan={7} className="bg-white px-6 py-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between">
                      <span className="text-gray-600 mb-3 sm:mb-0 text-sm">
                        แสดง {paginatedEquipment.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} ถึง {(currentPage - 1) * itemsPerPage + paginatedEquipment.length} จากทั้งหมด {filteredEquipment.length} รายการ
                      </span>
                      <div className="flex gap-2">
                        <button
                          className="text-gray-700 border border-gray-300 hover:bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium normal-case"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          ก่อนหน้า
                        </button>
                        <button
                          className="text-gray-700 border border-gray-300 hover:bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium normal-case"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
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

      {/* Equipment Detail Dialog */}
      <EquipmentDetailDialog
        open={showDetailDialog}
        onClose={() => {
          setShowDetailDialog(false);
          setSelectedEquipment(null);
        }}
        equipment={selectedEquipment}
      />

      {/* QR Scanner Dialog */}
      <QRScannerDialog
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onEquipmentFound={handleEquipmentFound}
      />

      {/* Toast Container */}
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

export default EquipmentList;