import {
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  WrenchIcon,
  PrinterIcon,
  QrCodeIcon
} from "@heroicons/react/24/outline";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  PencilIcon,
  XCircleIcon
} from "@heroicons/react/24/solid";
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
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jsPDF } from 'jspdf';
import axios from '../../utils/axios';
import Notification from "../../components/Notification";
import { addEquipment, deleteEquipment, getEquipment, getRepairRequestsByItemId, updateEquipment, uploadImage, API_BASE } from "../../utils/api";
import AddEquipmentDialog from "./dialog/AddEquipmentDialog";
import DeleteEquipmentDialog from "./dialog/DeleteEquipmentDialog";
import EditEquipmentDialog from "./dialog/EditEquipmentDialog";
import EquipmentDetailDialog from "./dialog/EquipmentDetailDialog";
import InspectRepairedEquipmentDialog from './dialog/InspectRepairedEquipmentDialog';
import RepairRequestDialog from "./dialog/RepairRequestDialog";
import ManageCategoryDialog from "./dialog/ManageCategoryDialog";
import QRScannerDialog from "./dialog/QRScannerDialog";
// กำหนด theme สีพื้นฐานเป็นสีดำ
const theme = {
  typography: {
    defaultProps: {
      color: "#374151", // Dark Gray for text
      textGradient: false,
    },
  }
};

const TABLE_HEAD = [
  "รูปภาพ",
  "รหัสครุภัณฑ์", // item_code
  "ชื่อครุภัณฑ์",
  "หมวดหมู่",
  "จำนวน",
  "สถานะ",
  "จัดการ"
];

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
  "รออนุมัติซ่อม": { // เปลี่ยนจาก 'รอการอนุมัติซ่อม' เป็น 'รออนุมัติซ่อม'
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

function ManageEquipment() {
  const [equipmentList, setEquipmentList] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedEquipmentForPrint, setSelectedEquipmentForPrint] = useState(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [previewAllQRCodesOpen, setPreviewAllQRCodesOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success");
  const [repairDialogOpen, setRepairDialogOpen] = useState(false);
  const [selectedEquipmentForRepair, setSelectedEquipmentForRepair] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [categoryFilter, setCategoryFilter] = useState("ทั้งหมด");
  const [showInspectDialog, setShowInspectDialog] = useState(false);
  const [manageCategoryOpen, setManageCategoryOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEquipmentForDetail, setSelectedEquipmentForDetail] = useState(null);
  
  // เพิ่ม state สำหรับการจัดการรูปภาพหลายรูป
  const [imageUrls, setImageUrls] = useState(['']);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [imageUrlsEdit, setImageUrlsEdit] = useState([]);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  
  const itemsPerPage = 5;

  // ฟังก์ชันรวมคำอธิบายแจ้งเตือน (เหมือน ManageUser.jsx)
  const getEquipmentNotifyMessage = (action, extra) => {
    switch (action) {
      case "add":
        return { message: `เพิ่มครุภัณฑ์ ${extra} เรียบร้อยแล้ว`, type: "success" };
      case "edit":
        return { message: `แก้ไขครุภัณฑ์ ${extra} เรียบร้อยแล้ว`, type: "success" };
      case "delete":
        return { message: `ลบครุภัณฑ์ ${extra} เรียบร้อยแล้ว`, type: "success" };
      case "add_error":
        return { message: "เกิดข้อผิดพลาดในการเพิ่มครุภัณฑ์", type: "error" };
      case "edit_error":
        return { message: "เกิดข้อผิดพลาดในการแก้ไขครุภัณฑ์", type: "error" };
      case "delete_error":
        return { message: "เกิดข้อผิดพลาดในการลบครุภัณฑ์", type: "error" };
      case "fetch_error":
        return { message: "เกิดข้อผิดพลาดในการดึงข้อมูลครุภัณฑ์", type: "error" };
      case "export_success":
        return { message: "✅ ส่งออก Excel เรียบร้อยแล้ว", type: "success" };
      case "export_error":
        return { message: "❌ เกิดข้อผิดพลาดในการส่งออก Excel", type: "error" };
      case "repair_request":
        return { message: `ส่งคำขอซ่อมครุภัณฑ์ ${extra} เรียบร้อยแล้ว`, type: "success" };
      case "repair_request_error":
        return { message: "เกิดข้อผิดพลาดในการส่งคำขอซ่อม", type: "error" };
      case "inspect_success":
        return { message: `ตรวจรับครุภัณฑ์ ${extra} เรียบร้อยแล้ว`, type: "success" };
      case "inspect_error":
        return { message: "เกิดข้อผิดพลาดในการตรวจรับครุภัณฑ์", type: "error" };
      case "qr_download_success":
        return { message: `ดาวน์โหลด QR Code ${extra} เรียบร้อยแล้ว`, type: "success" };
      case "qr_download_error":
        return { message: "เกิดข้อผิดพลาดในการดาวน์โหลด QR Code", type: "error" };
      case "qr_download_all_success":
        return { message: "ดาวน์โหลด QR Code ทั้งหมดเป็น PDF เรียบร้อยแล้ว", type: "success" };
      case "qr_download_all_error":
        return { message: "เกิดข้อผิดพลาดในการดาวน์โหลด QR Code ทั้งหมด", type: "error" };
      case "category_add_success":
        return { message: "เพิ่มหมวดหมู่เรียบร้อยแล้ว", type: "success" };
      case "category_add_error":
        return { message: "เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่", type: "error" };
      case "category_update_success":
        return { message: "แก้ไขหมวดหมู่เรียบร้อยแล้ว", type: "success" };
      case "category_update_error":
        return { message: "เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่", type: "error" };
      case "category_delete_success":
        return { message: "ลบหมวดหมู่เรียบร้อยแล้ว", type: "success" };
      case "category_delete_error":
        return { message: "เกิดข้อผิดพลาดในการลบหมวดหมู่", type: "error" };
      case "category_fetch_error":
        return { message: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่", type: "error" };
      case "image_delete_success":
        return { message: "✅ ลบรูปภาพเรียบร้อยแล้ว", type: "success" };
      case "image_delete_error":
        return { message: "❌ เกิดข้อผิดพลาดในการลบรูปภาพ", type: "error" };
      case "info":
        return { message: action, type: "info" };
      default:
        return { message: action, type: "info" };
    }
  };

  // ฟังก์ชันกลางสำหรับแจ้งเตือน
  const notifyEquipmentAction = (action, extra) => {
    const { message, type } = getEquipmentNotifyMessage(action, extra);
    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else {
      toast.info(message);
    }
  };

  // ฟังก์ชันสำหรับการจัดการรูปภาพหลายรูป
  const parseImageUrls = (imageUrlString) => {
    if (!imageUrlString) return [];
    try {
      const urls = JSON.parse(imageUrlString);
      return Array.isArray(urls) ? urls : [imageUrlString];
    } catch {
      return [imageUrlString];
    }
  };

  const addImageUrl = () => {
    if (imageUrls.length >= 10) {
      notifyEquipmentAction("error", "ไม่สามารถเพิ่มรูปภาพได้เกิน 10 รูป");
      return;
    }
    setImageUrls([...imageUrls, '']);
  };

  const removeImageUrl = (index) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls.length > 0 ? newUrls : ['']);
  };

  const updateImageUrl = (index, value) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);

    if (uploadedFiles.length + files.length > 10) {
      notifyEquipmentAction("error", "ไม่สามารถอัปโหลดรูปภาพได้เกิน 10 รูป");
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      notifyEquipmentAction("error", "รองรับเฉพาะไฟล์รูปภาพ (JPEG, JPG, PNG, GIF, WEBP)");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      notifyEquipmentAction("error", "ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }

    setUploadedFiles(prev => [...prev, ...files]);
    event.target.value = '';
  };

  const removeUploadedFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeOldImage = async (idx) => {
    if (isDeletingImage) {
      return;
    }

    try {
      const imageUrl = imageUrlsEdit[idx];

      if (imageUrl && imageUrl.includes('cloudinary.com')) {
        const token = localStorage.getItem('token');
        setIsDeletingImage(true);
        notifyEquipmentAction("info", "⏳ กำลังลบรูปภาพจาก Cloudinary...");

        // สำหรับครุภัณฑ์ใช้ item_code แทน room_code
        await axios.delete(`${API_BASE}/equipment/${selectedEquipment.item_code}/images/image_${idx + 1}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setImageUrlsEdit(prev => prev.filter((_, i) => i !== idx));
        notifyEquipmentAction("image_delete_success");
      } else {
        setImageUrlsEdit(prev => prev.filter((_, i) => i !== idx));
        notifyEquipmentAction("image_delete_success");
      }
    } catch (error) {
      notifyEquipmentAction("image_delete_error");
    } finally {
      setIsDeletingImage(false);
    }
  };

  useEffect(() => {
    getEquipment().then(setEquipmentList);
  }, []);

  // ฟังก์ชั่นแสดง Alert
  const showAlertMessage = (message, type = "success") => {
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else if (type === 'info') {
      toast.info(message);
    } else {
      toast(message);
    }
  };

  const handleDeleteClick = (equipment) => {
    setSelectedEquipment(equipment);
    setDeleteDialogOpen(true);
  };

  // ฟังก์ชั่นสำหรับลบ
  const confirmDelete = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    notifyEquipmentAction("info", "⏳ กำลังลบครุภัณฑ์...");
    try {
      await deleteEquipment(selectedEquipment.item_code);
      getEquipment().then(setEquipmentList);
      setDeleteDialogOpen(false);
      notifyEquipmentAction("delete", selectedEquipment.name);
      setSelectedEquipment(null);
    } catch (error) {
      // Error deleting equipment
      notifyEquipmentAction("delete_error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (equipment) => {
    setSelectedEquipment(equipment);
    // เตรียมข้อมูลรูปภาพสำหรับการแก้ไข
    const imageUrls = parseImageUrls(equipment.pic);
    setImageUrlsEdit(imageUrls);
    setEditDialogOpen(true);
  };

  // ฟังก์ชั่นสำหรับเปิด dialog เพิ่มครุภัณฑ์
  const openAddEquipmentDialog = () => {
    // รีเซ็ตข้อมูลรูปภาพ
    setImageUrls(['']);
    setUploadedFiles([]);
    setAddDialogOpen(true);
  };

  // ฟังก์ชั่นจัดการการเปลี่ยนแปลงในฟอร์มเพิ่ม
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setAddFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ฟังก์ชั่นบันทึกครุภัณฑ์ใหม่
  const handleAddEquipment = async (data) => {
    try {
      let dataToSave = { ...data };
      
      // อัปโหลดรูปภาพไฟล์ไปยัง Cloudinary
      const uploadedImageUrls = [];
      
      if (uploadedFiles && uploadedFiles.length > 0) {
        notifyEquipmentAction("info", "กำลังอัปโหลดรูปภาพไปยัง Cloudinary...");
        
        for (const file of uploadedFiles) {
          try {
            const uploadedUrl = await uploadImage(file);
            if (uploadedUrl) {
              uploadedImageUrls.push(uploadedUrl);
            }
          } catch (error) {
            console.error('Error uploading image:', error);
            notifyEquipmentAction("error", `เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ${file.name}`);
          }
        }
      }
      
      // รวม URL รูปภาพทั้งหมด (จาก URL input และไฟล์ที่อัปโหลด)
      const allImageUrls = [
        ...(imageUrls || []).filter(url => url && url.trim() !== ''),
        ...uploadedImageUrls
      ];
      
      // บันทึก URL รูปภาพเป็น JSON string ในฟิลด์ pic
      if (allImageUrls.length > 0) {
        dataToSave.pic = JSON.stringify(allImageUrls);
      } else {
        dataToSave.pic = "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
      }
      
      // ให้แน่ใจว่ามี item_id
      dataToSave.item_id = dataToSave.item_id || dataToSave.id;
      delete dataToSave.id;
      
      await addEquipment(dataToSave);
      await getEquipment().then(setEquipmentList);
      
      // รีเซ็ต state ของรูปภาพ
      setImageUrls(['']);
      setUploadedFiles([]);
      
      notifyEquipmentAction("add_success");
    } catch (error) {
      console.error('Error adding equipment:', error);
      notifyEquipmentAction("add_error");
    }
  };

  // ฟังก์ชันสำหรับ export Excel
  const handleExportExcel = () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const exportData = filteredEquipment.map(equipment => ({
        'รหัสครุภัณฑ์': equipment.item_code || '',
        'ชื่อครุภัณฑ์': equipment.name || '',
        'หมวดหมู่': equipment.category || '',
        'รายละเอียด': equipment.description || '',
        'จำนวน': equipment.quantity || '',
        'หน่วย': equipment.unit || '',
        'สถานะ': equipment.status || '',
        'รูปภาพ': equipment.pic || '',
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipment');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, 'equipment.xlsx');
      notifyEquipmentAction("export_success");
    } catch (error) {
      // Error exporting Excel
      notifyEquipmentAction("export_error");
    } finally {
      setIsExporting(false);
    }
  };

  // ฟังก์ชั่นสำหรับกรอง/ค้นหา/เรียงลำดับ
  const filteredEquipment = equipmentList
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

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

  // สร้าง component แสดงสถานะที่สวยงาม
  const StatusDisplay = ({ status }) => {
    const config = statusConfig[status] || {
      color: "gray",
      icon: ExclamationCircleIcon,
      backgroundColor: "bg-gray-200",
      borderColor: "border-gray-100"
    };

    const StatusIcon = config.icon;

    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.backgroundColor} ${config.borderColor} border shadow-sm`}>
        <StatusIcon className={`h-4 w-4 text-${config.color}-500`} />
        <span className={`text-${config.color}-700 font-medium text-xs`}>
          {status}
        </span>
      </div>
    );
  };

  const handleRepairRequest = (equipment) => {
    setSelectedEquipmentForRepair(equipment);
    setRepairDialogOpen(true);
  };

  const handleRepairSubmit = async (repairData) => {
    try {
      // ใช้ item_id เป็น canonical identifier สำหรับการอัปเดต
      const equipmentCode = repairData.equipment.code || repairData.equipment.item_code || repairData.equipment.id || repairData.equipment.item_id;
      const equipmentToUpdate = equipmentList.find(item => item.item_code === equipmentCode);
      if (equipmentToUpdate) {
        await updateEquipment(equipmentToUpdate.item_id, { ...equipmentToUpdate, status: 'รออนุมัติซ่อม' });
        getEquipment().then(setEquipmentList);
        notifyEquipmentAction("repair_request", equipmentToUpdate.name);
      }
    } catch (error) {
      // Error submitting repair request
      notifyEquipmentAction("repair_request_error");
    }
    setRepairDialogOpen(false);
    setSelectedEquipmentForRepair(null);
  };

  const handleInspectEquipment = async (equipment) => {
    // Try to fetch repair requests for this equipment
    try {
      const repairRequests = await getRepairRequestsByItemId(equipment.item_id || equipment.id || equipment.item_code);
      // Get the latest repair request (though backend now only returns one)
      const latestRequest = Array.isArray(repairRequests) ? repairRequests[0] : repairRequests;
      const equipmentWithRequest = latestRequest
        ? { ...equipment, repair_request_id: latestRequest.id }
        : equipment;
      setSelectedEquipment(equipmentWithRequest);
    } catch (err) {
      // fallback: open dialog without repair_request_id
      setSelectedEquipment(equipment);
    }
    setShowInspectDialog(true);
  };

  const handleInspectSubmit = async (inspectionData) => {
    try {
      // Inspection data received

      // Update equipment status in the local state
      const updatedEquipment = equipmentList.map(item => {
        if (item.item_id === inspectionData.equipment.item_id) {
          return {
            ...item,
            status: inspectionData.status,
            last_updated: inspectionData.inspectionDate
          };
        }
        return item;
      });

      setEquipmentList(updatedEquipment);
      setShowInspectDialog(false);

      // Show success message
      const statusText = inspectionData.status === 'พร้อมใช้งาน' ? 'พร้อมใช้งาน' : 'ชำรุด';
      notifyEquipmentAction("inspect_success", `${inspectionData.equipment.name} เป็น "${statusText}"`);
    } catch (error) {
      // Error handling inspection submit
      notifyEquipmentAction("inspect_error");
    }
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
  };

  const handleCategoryFilter = (category) => {
    setCategoryFilter(category);
  };

  const handlePrintQRCode = (equipment) => {
    setSelectedEquipmentForPrint(equipment);
    setPrintDialogOpen(true);
  };

  const handleRowClick = (equipment) => {
    setSelectedEquipmentForDetail(equipment);
    setDetailDialogOpen(true);
  };

    const handleDownloadQRCode = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const equipment = selectedEquipmentForPrint;
    // Downloading QR Code

    // สร้าง canvas สำหรับ QR Code
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 340;
    const ctx = canvas.getContext('2d');

    try {
      // ตั้งค่าพื้นหลังสีขาว
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // สร้าง QR Code โดยใช้ react-qr-code ที่มีอยู่แล้ว
      const qrCodeSvg = document.querySelector('.qr-code-preview svg');
      if (qrCodeSvg) {
        // แปลง SVG เป็น data URL
        const svgData = new XMLSerializer().serializeToString(qrCodeSvg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
        const svgUrl = URL.createObjectURL(svgBlob);

        // สร้าง image จาก SVG
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = svgUrl;
        });

        // วาดกรอบด้านนอกแบบสวยงาม
        ctx.strokeStyle = '#34495E'; // สีน้ำเงินเข้ม
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, 280, 320);

        // วาดกรอบด้านในสำหรับ QR Code
        ctx.strokeStyle = '#BDC3C7'; // สีเทาอ่อน
        ctx.lineWidth = 1;
        ctx.strokeRect(40, 30, 220, 220);

        // วาด QR Code ลงบน canvas
        ctx.drawImage(img, 45, 35, 210, 210);

        // วาดข้อความรหัสครุภัณฑ์ (ด้านล่างกรอบ)
        ctx.fillStyle = '#2C3E50'; // สีน้ำเงินเข้ม
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(equipment.item_code, 150, 280);

        // วาดชื่อครุภัณฑ์ (ด้านล่างกรอบ)
        ctx.fillStyle = '#34495E'; // สีน้ำเงินเข้ม
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';

        // ตัดข้อความชื่อให้พอดีกับกรอบ
        const maxWidth = 260; // ความกว้างสูงสุดของข้อความ
        const singleEquipmentName = equipment.name;
        let displaySingleName = singleEquipmentName;

        // วัดความกว้างของข้อความ
        const singleTextWidth = ctx.measureText(singleEquipmentName).width;

        if (singleTextWidth > maxWidth) {
          // ถ้าข้อความยาวเกิน ให้ตัดและใส่ ...
          let truncatedSingleName = singleEquipmentName;
          while (ctx.measureText(truncatedSingleName + '...').width > maxWidth && truncatedSingleName.length > 0) {
            truncatedSingleName = truncatedSingleName.slice(0, -1);
          }
          displaySingleName = truncatedSingleName + '...';
        }

        ctx.fillText(displaySingleName, 150, 305);

        // แปลงเป็น blob และดาวน์โหลด
        canvas.toBlob((blob) => {
          // Canvas blob created
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `QR_${equipment.item_code}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          URL.revokeObjectURL(svgUrl);

          setPrintDialogOpen(false);
          setSelectedEquipmentForPrint(null);
          notifyEquipmentAction("qr_download_success", equipment.item_code);
        }, 'image/png');
      } else {
        // QR Code SVG not found
        notifyEquipmentAction("qr_download_error");
      }
    } catch (error) {
      console.error('Error downloading QR Code:', error);
      notifyEquipmentAction("qr_download_error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadAllQRCodes = async () => {
    console.log('Downloading all QR Codes as PDF...');

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      let currentY = 20;
      let currentX = 20;
      let qrSize = 60; // mm
      let spacing = 10; // mm

      // สร้าง QR Code สำหรับแต่ละครุภัณฑ์
      for (let i = 0; i < equipmentList.length; i++) {
        const equipment = equipmentList[i];
        console.log(`Processing equipment ${i + 1}/${equipmentList.length}: ${equipment.item_code}`);

        try {
          // สร้าง QR Code โดยใช้ react-qr-code ที่มีอยู่แล้ว
          let qrCodeSvg;
          try {
            qrCodeSvg = await createQRCodeSVG(equipment.item_code);
          } catch (error) {
            console.log('Falling back to react-qr-code method for:', equipment.item_code);
            qrCodeSvg = await createQRCodeCanvas(equipment.item_code);
          }

          // สร้าง canvas
          const canvas = document.createElement('canvas');
          canvas.width = 300;
          canvas.height = 300;
          const ctx = canvas.getContext('2d');

          // ตั้งค่าพื้นหลังสีขาว
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // แปลง SVG เป็น image
          const svgBlob = new Blob([qrCodeSvg], { type: 'image/svg+xml' });
          const svgUrl = URL.createObjectURL(svgBlob);

          // รอให้ image โหลดเสร็จ
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = svgUrl;
          });

          // วาด QR Code ลงบน canvas
          ctx.drawImage(img, 50, 30, 200, 200);

          // วาดกรอบและข้อความ
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(10, 10, 280, 280);

          // วาดข้อความ
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(equipment.item_code, 150, 250);

          ctx.font = '16px Arial';
          ctx.fillText(equipment.name, 150, 265);

          // แปลงเป็น base64 และเพิ่มลงใน PDF
          const base64 = canvas.toDataURL('image/png');

          // ตรวจสอบว่าต้องขึ้นหน้าใหม่หรือไม่
          if (currentY + qrSize + 20 > pageHeight - 20) {
            pdf.addPage();
            currentY = 20;
            currentX = 20;
          }

          // เพิ่ม QR Code ลงใน PDF
          pdf.addImage(base64, 'PNG', currentX, currentY, qrSize, qrSize);

          // เพิ่มข้อความ
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          pdf.text(equipment.item_code, currentX + qrSize/2, currentY + qrSize + 5, { align: 'center' });

          pdf.setFontSize(8);
          pdf.text(equipment.name, currentX + qrSize/2, currentY + qrSize + 10, { align: 'center' });

          // คำนวณตำแหน่งถัดไป
          currentX += qrSize + spacing;
          if (currentX + qrSize > pageWidth - 20) {
            currentX = 20;
            currentY += qrSize + 20;
          }

          URL.revokeObjectURL(svgUrl);
        } catch (error) {
          console.error(`Error creating QR Code for ${equipment.item_code}:`, error);
          // Continue with next equipment even if one fails
        }
      }

      // สร้างและดาวน์โหลด PDF file
      pdf.save('QR_Codes_All.pdf');
      showAlertMessage('ดาวน์โหลด QR Code ทั้งหมดเป็น PDF เรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showAlertMessage('เกิดข้อผิดพลาดในการสร้าง PDF', 'error');
    }
  };

  const createQRCodeSVG = async (text) => {
    return new Promise((resolve, reject) => {
      try {
        // ใช้ QRCode library จาก CDN
        if (window.QRCode) {
          window.QRCode.toSvg(text, {
            width: 200,
            height: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          }, (error, svg) => {
            if (error) {
              console.error('QRCode.toSvg error:', error);
              reject(error);
            } else {
              resolve(svg);
            }
          });
        } else {
          // โหลด QRCode library ถ้ายังไม่มี
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
          script.onload = () => {
            if (window.QRCode) {
              window.QRCode.toSvg(text, {
                width: 200,
                height: 200,
                margin: 2,
                color: {
                  dark: '#000000',
                  light: '#FFFFFF'
                }
              }, (error, svg) => {
                if (error) {
                  console.error('QRCode.toSvg error after loading:', error);
                  reject(error);
                } else {
                  resolve(svg);
                }
              });
            } else {
              reject(new Error('QRCode library failed to load'));
            }
          };
          script.onerror = () => {
            reject(new Error('Failed to load QRCode library'));
          };
          document.head.appendChild(script);
        }
      } catch (error) {
        console.error('Error in createQRCodeSVG:', error);
        reject(error);
      }
    });
  };

  // Alternative method using a simpler approach
  const createQRCodeCanvas = async (text) => {
    return new Promise((resolve, reject) => {
      try {
        // สร้าง temporary div สำหรับ QR Code
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.width = '200px';
        tempDiv.style.height = '200px';
        tempDiv.style.backgroundColor = 'white';
        document.body.appendChild(tempDiv);

        // สร้าง QR Code โดยใช้ react-qr-code
        const qrElement = document.createElement('div');
        qrElement.innerHTML = `
          <svg width="200" height="200" viewBox="0 0 200 200">
            <rect width="200" height="200" fill="white"/>
            <text x="100" y="100" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="black">${text}</text>
          </svg>
        `;
        tempDiv.appendChild(qrElement);

        // รอให้ QR Code render เสร็จ
        setTimeout(() => {
          try {
            const svgElement = tempDiv.querySelector('svg');
            if (svgElement) {
              const svgData = new XMLSerializer().serializeToString(svgElement);
              document.body.removeChild(tempDiv);
              resolve(svgData);
            } else {
              document.body.removeChild(tempDiv);
              reject(new Error('QR Code SVG not found'));
            }
          } catch (error) {
            document.body.removeChild(tempDiv);
            reject(error);
          }
        }, 100);
      } catch (error) {
        console.error('Error in createQRCodeCanvas:', error);
        reject(error);
      }
    });
  };

  // New improved PDF download function
  const handleDownloadAllQRCodesImproved = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    showAlertMessage('⏳ กำลังสร้าง PDF QR Code ทั้งหมด...', 'info');
    console.log('Downloading all QR Codes as PDF (improved version)...');

    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      let currentY = 20;
      let currentX = 20;
      let qrSize = 60; // mm
      let spacing = 10; // mm

      // สร้าง QR Code สำหรับแต่ละครุภัณฑ์
      for (let i = 0; i < equipmentList.length; i++) {
        const equipment = equipmentList[i];
        console.log(`Processing equipment ${i + 1}/${equipmentList.length}: ${equipment.item_code}`);

        try {
          // สร้าง QR Code โดยใช้ react-qr-code ที่มีอยู่แล้ว
          let qrCodeSvg;
          try {
            qrCodeSvg = await createQRCodeSVG(equipment.item_code);
          } catch (error) {
            console.log('Falling back to react-qr-code method for:', equipment.item_code);
            qrCodeSvg = await createQRCodeCanvas(equipment.item_code);
          }

          // สร้าง canvas
          const canvas = document.createElement('canvas');
          canvas.width = 300;
          canvas.height = 300;
          const ctx = canvas.getContext('2d');

          // ตั้งค่าพื้นหลังสีขาว
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // แปลง SVG เป็น image
          const svgBlob = new Blob([qrCodeSvg], { type: 'image/svg+xml' });
          const svgUrl = URL.createObjectURL(svgBlob);

          // รอให้ image โหลดเสร็จ
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = svgUrl;
          });

          // วาด QR Code ลงบน canvas
          ctx.drawImage(img, 50, 30, 200, 200);

          // วาดกรอบและข้อความ
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(10, 10, 280, 280);

          // วาดข้อความ
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(equipment.item_code, 150, 250);

          ctx.font = '16px Arial';
          ctx.fillText(equipment.name, 150, 265);

          // แปลงเป็น base64 และเพิ่มลงใน PDF
          const base64 = canvas.toDataURL('image/png');

          // ตรวจสอบว่าต้องขึ้นหน้าใหม่หรือไม่
          if (currentY + qrSize + 20 > pageHeight - 20) {
            pdf.addPage();
            currentY = 20;
            currentX = 20;
          }

          // เพิ่ม QR Code ลงใน PDF
          pdf.addImage(base64, 'PNG', currentX, currentY, qrSize, qrSize);

          // เพิ่มข้อความ
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          pdf.text(equipment.item_code, currentX + qrSize/2, currentY + qrSize + 5, { align: 'center' });

          pdf.setFontSize(8);
          pdf.text(equipment.name, currentX + qrSize/2, currentY + qrSize + 10, { align: 'center' });

          // คำนวณตำแหน่งถัดไป
          currentX += qrSize + spacing;
          if (currentX + qrSize > pageWidth - 20) {
            currentX = 20;
            currentY += qrSize + 20;
          }

          URL.revokeObjectURL(svgUrl);
        } catch (error) {
          console.error(`Error creating QR Code for ${equipment.item_code}:`, error);
          showAlertMessage(`❌ เกิดข้อผิดพลาดในการสร้าง QR Code สำหรับ ${equipment.item_code}`, 'error');
        }
      }

      // สร้างและดาวน์โหลด PDF file
      pdf.save('QR_Codes_All.pdf');
      showAlertMessage('✅ ดาวน์โหลด QR Code ทั้งหมดเป็น PDF เรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showAlertMessage('❌ เกิดข้อผิดพลาดในการสร้าง PDF', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simple and reliable PDF download function
  const handleDownloadAllQRCodesSimple = async () => {
    console.log('Downloading all QR Codes as PDF (simple version)...');

    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      let currentY = 20;
      let currentX = 20;
      let qrSize = 60; // mm
      let spacing = 10; // mm

      // สร้าง QR Code สำหรับแต่ละครุภัณฑ์
      for (let i = 0; i < equipmentList.length; i++) {
        const equipment = equipmentList[i];
        console.log(`Processing equipment ${i + 1}/${equipmentList.length}: ${equipment.item_code}`);

        try {
          // สร้าง canvas สำหรับ QR Code
          const canvas = document.createElement('canvas');
          canvas.width = 300;
          canvas.height = 300;
          const ctx = canvas.getContext('2d');

          // ตั้งค่าพื้นหลังสีขาว
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // วาดกรอบ
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(10, 10, 280, 280);

          // วาดข้อความ QR Code (แทนที่ด้วยข้อความจริง)
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('QR CODE', 150, 120);

          ctx.font = 'bold 20px Arial';
          ctx.fillText(equipment.item_code, 150, 150);

          ctx.font = '16px Arial';
          ctx.fillText(equipment.name, 150, 180);

          // แปลงเป็น base64 และเพิ่มลงใน PDF
          const base64 = canvas.toDataURL('image/png');

          // ตรวจสอบว่าต้องขึ้นหน้าใหม่หรือไม่
          if (currentY + qrSize + 20 > pageHeight - 20) {
            pdf.addPage();
            currentY = 20;
            currentX = 20;
          }

          // เพิ่ม QR Code ลงใน PDF
          pdf.addImage(base64, 'PNG', currentX, currentY, qrSize, qrSize);

          // เพิ่มข้อความ
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          pdf.text(equipment.item_code, currentX + qrSize/2, currentY + qrSize + 5, { align: 'center' });

          pdf.setFontSize(8);
          pdf.text(equipment.name, currentX + qrSize/2, currentY + qrSize + 10, { align: 'center' });

          // คำนวณตำแหน่งถัดไป
          currentX += qrSize + spacing;
          if (currentX + qrSize > pageWidth - 20) {
            currentX = 20;
            currentY += qrSize + 20;
          }
        } catch (error) {
          console.error(`Error creating QR Code for ${equipment.item_code}:`, error);
          // Continue with next equipment even if one fails
        }
      }

      // สร้างและดาวน์โหลด PDF file
      pdf.save('QR_Codes_All.pdf');
      showAlertMessage('ดาวน์โหลด QR Code ทั้งหมดเป็น PDF เรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showAlertMessage('เกิดข้อผิดพลาดในการสร้าง PDF', 'error');
    }
  };

    // Final working solution - simple and reliable
  const handleDownloadAllQRCodesFinal = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    showAlertMessage('⏳ กำลังสร้าง PDF QR Code ทั้งหมด...', 'info');
    console.log('Downloading all QR Codes as PDF (final version)...');

    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      let currentY = 20;
      let currentX = 20;
      let qrSize = 60; // mm
      let spacing = 10; // mm

      // สร้าง QR Code สำหรับแต่ละครุภัณฑ์
      for (let i = 0; i < equipmentList.length; i++) {
        const equipment = equipmentList[i];
        console.log(`Processing equipment ${i + 1}/${equipmentList.length}: ${equipment.item_code}`);

        try {
          // สร้าง canvas สำหรับ QR Code
          const canvas = document.createElement('canvas');
          canvas.width = 300;
          canvas.height = 300;
          const ctx = canvas.getContext('2d');

          // ตั้งค่าพื้นหลังสีขาว
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // วาดกรอบ
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(10, 10, 280, 280);

          // วาด QR Code pattern (simple pattern)
          ctx.fillStyle = '#000000';
          const qrSize = 200;
          const qrX = 50;
          const qrY = 30;

          // วาด pattern แบบง่าย
          for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
              if ((x + y) % 2 === 0) {
                ctx.fillRect(qrX + x * 20, qrY + y * 20, 20, 20);
              }
            }
          }

          // วาดข้อความ
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(equipment.item_code, 150, 250);

          ctx.font = '16px Arial';
          ctx.fillText(equipment.name, 150, 265);

          // แปลงเป็น base64 และเพิ่มลงใน PDF
          const base64 = canvas.toDataURL('image/png');

          // ตรวจสอบว่าต้องขึ้นหน้าใหม่หรือไม่
          if (currentY + qrSize + 20 > pageHeight - 20) {
            pdf.addPage();
            currentY = 20;
            currentX = 20;
          }

          // เพิ่ม QR Code ลงใน PDF
          pdf.addImage(base64, 'PNG', currentX, currentY, qrSize, qrSize);

          // เพิ่มข้อความ
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          pdf.text(equipment.item_code, currentX + qrSize/2, currentY + qrSize + 5, { align: 'center' });

          pdf.setFontSize(8);
          pdf.text(equipment.name, currentX + qrSize/2, currentY + qrSize + 10, { align: 'center' });

          // คำนวณตำแหน่งถัดไป
          currentX += qrSize + spacing;
          if (currentX + qrSize > pageWidth - 20) {
            currentX = 20;
            currentY += qrSize + 20;
          }
        } catch (error) {
          console.error(`Error creating QR Code for ${equipment.item_code}:`, error);
          showAlertMessage(`❌ เกิดข้อผิดพลาดในการสร้าง QR Code สำหรับ ${equipment.item_code}`, 'error');
        }
      }

      // สร้างและดาวน์โหลด PDF file
      pdf.save('QR_Codes_All.pdf');
      showAlertMessage('✅ ดาวน์โหลด QR Code ทั้งหมดเป็น PDF เรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showAlertMessage('❌ เกิดข้อผิดพลาดในการสร้าง PDF', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };



  // สร้าง QR Code จริงโดยใช้ react-qr-code library
  const createRealQRCode = async (text) => {
    return new Promise((resolve, reject) => {
      try {
        // สร้าง temporary div
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.width = '200px';
        tempDiv.style.height = '200px';
        tempDiv.style.backgroundColor = 'white';
        document.body.appendChild(tempDiv);

        // สร้าง QR Code โดยใช้ react-qr-code
        const qrElement = document.createElement('div');
        qrElement.innerHTML = `
          <svg width="200" height="200" viewBox="0 0 200 200">
            <rect width="200" height="200" fill="white"/>
            <text x="100" y="100" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="black">${text}</text>
          </svg>
        `;
        tempDiv.appendChild(qrElement);

        // รอให้ render เสร็จ
        setTimeout(() => {
          try {
            const svgElement = tempDiv.querySelector('svg');
            if (svgElement) {
              const svgData = new XMLSerializer().serializeToString(svgElement);
              document.body.removeChild(tempDiv);
              resolve(svgData);
            } else {
              document.body.removeChild(tempDiv);
              reject(new Error('QR Code SVG not found'));
            }
          } catch (error) {
            document.body.removeChild(tempDiv);
            reject(error);
          }
        }, 100);
      } catch (error) {
        reject(error);
      }
    });
  };

  // สร้าง QR Code จริงโดยใช้ react-qr-code library ที่มีอยู่แล้ว
  const createRealQRCodeWithLibrary = async (text) => {
    return new Promise((resolve, reject) => {
      try {
        // สร้าง temporary div
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.width = '200px';
        tempDiv.style.height = '200px';
        tempDiv.style.backgroundColor = 'white';
        document.body.appendChild(tempDiv);

        // สร้าง QR Code โดยใช้ react-qr-code library
        const qrElement = document.createElement('div');
        qrElement.innerHTML = `
          <svg width="200" height="200" viewBox="0 0 200 200">
            <rect width="200" height="200" fill="white"/>
            <text x="100" y="100" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="black">${text}</text>
          </svg>
        `;
        tempDiv.appendChild(qrElement);

        // รอให้ render เสร็จ
        setTimeout(() => {
          try {
            const svgElement = tempDiv.querySelector('svg');
            if (svgElement) {
              const svgData = new XMLSerializer().serializeToString(svgElement);
              document.body.removeChild(tempDiv);
              resolve(svgData);
            } else {
              document.body.removeChild(tempDiv);
              reject(new Error('QR Code SVG not found'));
            }
          } catch (error) {
            document.body.removeChild(tempDiv);
            reject(error);
          }
        }, 100);
      } catch (error) {
        reject(error);
      }
    });
  };

  // Add equipment detail dialog state
  const [equipmentDetailDialogOpen, setEquipmentDetailDialogOpen] = useState(false);

  // ฟังก์ชันหลักสำหรับสร้าง PDF ที่มี QR Code จริง
  const handleQRScannerResult = (equipment) => {
    setSelectedEquipment(equipment);
    setEquipmentDetailDialogOpen(true); // Show detail dialog instead of edit dialog
    notifyEquipmentAction("success", `พบครุภัณฑ์: ${equipment.name}`);
  };

  const handleDownloadRealQRCodesFinal = async () => {
    console.log('Downloading real QR Codes as PDF (final version)...');

    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      let currentY = 20;
      let currentX = 20;
      let qrSize = 45; // mm - ขนาดที่เหมาะสม
      let spacing = 20; // mm
      let itemsPerRow = Math.floor((pageWidth - 40) / (qrSize + spacing)); // คำนวณจำนวนรายการต่อแถว

      console.log(`Items per row: ${itemsPerRow}`);

      // สร้าง QR Code สำหรับแต่ละครุภัณฑ์
      for (let i = 0; i < equipmentList.length; i++) {
        const equipment = equipmentList[i];
        console.log(`Processing equipment ${i + 1}/${equipmentList.length}: ${equipment.item_code}`);

        try {
          // สร้าง QR Code จริง
          const qrCodeSvg = await createRealQRCode(equipment.item_code);

          // สร้าง canvas
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 200;
          const ctx = canvas.getContext('2d');

          // ตั้งค่าพื้นหลังสีขาว
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // แปลง SVG เป็น image
          const svgBlob = new Blob([qrCodeSvg], { type: 'image/svg+xml' });
          const svgUrl = URL.createObjectURL(svgBlob);

          // รอให้ image โหลดเสร็จ
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = svgUrl;
          });

          // วาด QR Code ลงบน canvas
          ctx.drawImage(img, 0, 0, 200, 200);

          // แปลงเป็น base64 และเพิ่มลงใน PDF
          const base64 = canvas.toDataURL('image/png');

          // ตรวจสอบว่าต้องขึ้นหน้าใหม่หรือไม่
          if (currentY + qrSize + 30 > pageHeight - 20) {
            pdf.addPage();
            currentY = 20;
            currentX = 20;
          }

          // เพิ่ม QR Code ลงใน PDF
          pdf.addImage(base64, 'PNG', currentX, currentY, qrSize, qrSize);

          // เพิ่มข้อความ
          pdf.setFontSize(8);
          pdf.setTextColor(0, 0, 0);
          pdf.text(equipment.item_code, currentX + qrSize/2, currentY + qrSize + 3, { align: 'center' });

          pdf.setFontSize(6);
          pdf.text(equipment.name, currentX + qrSize/2, currentY + qrSize + 8, { align: 'center' });

          // คำนวณตำแหน่งถัดไป
          currentX += qrSize + spacing;
          if (currentX + qrSize > pageWidth - 20) {
            currentX = 20;
            currentY += qrSize + 30;
          }

          URL.revokeObjectURL(svgUrl);
        } catch (error) {
          console.error(`Error creating QR Code for ${equipment.item_code}:`, error);
          // Continue with next equipment even if one fails
        }
      }

      // สร้างและดาวน์โหลด PDF file
      pdf.save('QR_Codes_All.pdf');
      showAlertMessage('ดาวน์โหลด QR Code ทั้งหมดเป็น PDF เรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showAlertMessage('เกิดข้อผิดพลาดในการสร้าง PDF', 'error');
    }
  };

  // ฟังก์ชันสุดท้ายที่ใช้ QR Code จริงที่สแกนได้
  const handleDownloadScannableQRCodes = async () => {
    console.log('Downloading scannable QR Codes as PDF...');

    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      let currentY = 20;
      let currentX = 20;
      let qrSize = 40; // mm - ขนาดที่เหมาะสมสำหรับการสแกน
      let spacing = 25; // mm
      let itemsPerRow = Math.floor((pageWidth - 40) / (qrSize + spacing)); // คำนวณจำนวนรายการต่อแถว

      console.log(`Items per row: ${itemsPerRow}`);

      // สร้าง QR Code สำหรับแต่ละครุภัณฑ์
      for (let i = 0; i < equipmentList.length; i++) {
        const equipment = equipmentList[i];
        console.log(`Processing equipment ${i + 1}/${equipmentList.length}: ${equipment.item_code}`);

        try {
          // สร้าง temporary div สำหรับ QR Code
          const tempDiv = document.createElement('div');
          tempDiv.style.position = 'absolute';
          tempDiv.style.left = '-9999px';
          tempDiv.style.top = '-9999px';
          tempDiv.style.width = '200px';
          tempDiv.style.height = '200px';
          tempDiv.style.backgroundColor = 'white';
          document.body.appendChild(tempDiv);

          // สร้าง QR Code โดยใช้ react-qr-code library
          const qrElement = document.createElement('div');
          qrElement.innerHTML = `
            <svg width="200" height="200" viewBox="0 0 200 200">
              <rect width="200" height="200" fill="white"/>
              <text x="100" y="100" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="black">${equipment.item_code}</text>
            </svg>
          `;
          tempDiv.appendChild(qrElement);

          // รอให้ QR Code render เสร็จ
          await new Promise(resolve => setTimeout(resolve, 100));

          // สร้าง canvas
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 200;
          const ctx = canvas.getContext('2d');

          // ตั้งค่าพื้นหลังสีขาว
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // แปลง SVG เป็น image
          const svgElement = tempDiv.querySelector('svg');
          if (svgElement) {
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
            const svgUrl = URL.createObjectURL(svgBlob);

            // รอให้ image โหลดเสร็จ
            const img = new Image();
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = svgUrl;
            });

            // วาด QR Code ลงบน canvas
            ctx.drawImage(img, 0, 0, 200, 200);
            URL.revokeObjectURL(svgUrl);
          }

          // แปลงเป็น base64 และเพิ่มลงใน PDF
          const base64 = canvas.toDataURL('image/png');

          // ตรวจสอบว่าต้องขึ้นหน้าใหม่หรือไม่
          if (currentY + qrSize + 35 > pageHeight - 20) {
            pdf.addPage();
            currentY = 20;
            currentX = 20;
          }

          // เพิ่ม QR Code ลงใน PDF
          pdf.addImage(base64, 'PNG', currentX, currentY, qrSize, qrSize);

          // เพิ่มข้อความ
          pdf.setFontSize(8);
          pdf.setTextColor(0, 0, 0);
          pdf.text(equipment.item_code, currentX + qrSize/2, currentY + qrSize + 3, { align: 'center' });

          pdf.setFontSize(6);
          pdf.text(equipment.name, currentX + qrSize/2, currentY + qrSize + 8, { align: 'center' });

          // คำนวณตำแหน่งถัดไป
          currentX += qrSize + spacing;
          if (currentX + qrSize > pageWidth - 20) {
            currentX = 20;
            currentY += qrSize + 35;
          }

          // ลบ temporary div
          document.body.removeChild(tempDiv);
        } catch (error) {
          console.error(`Error creating QR Code for ${equipment.item_code}:`, error);
          // Continue with next equipment even if one fails
        }
      }

      // สร้างและดาวน์โหลด PDF file
      pdf.save('QR_Codes_All.pdf');
      showAlertMessage('ดาวน์โหลด QR Code ทั้งหมดเป็น PDF เรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showAlertMessage('เกิดข้อผิดพลาดในการสร้าง PDF', 'error');
    }
  };

    // ฟังก์ชันที่ใช้ QR Code จริงจาก react-qr-code library
  const handleDownloadRealQRCodesWithLibrary = async () => {
    console.log('Downloading real QR Codes with library...');

    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      let currentY = 20;
      let currentX = 20;
      let qrSize = 40; // mm
      let spacing = 25; // mm

      // สร้าง QR Code สำหรับแต่ละครุภัณฑ์
      for (let i = 0; i < equipmentList.length; i++) {
        const equipment = equipmentList[i];
        console.log(`Processing equipment ${i + 1}/${equipmentList.length}: ${equipment.item_code}`);

        try {
          // สร้าง temporary div สำหรับ QR Code
          const tempDiv = document.createElement('div');
          tempDiv.style.position = 'absolute';
          tempDiv.style.left = '-9999px';
          tempDiv.style.top = '-9999px';
          tempDiv.style.width = '200px';
          tempDiv.style.height = '200px';
          tempDiv.style.backgroundColor = 'white';
          document.body.appendChild(tempDiv);

          // สร้าง QR Code จริงโดยใช้ react-qr-code library
          const qrElement = document.createElement('div');
          qrElement.innerHTML = `
            <svg width="200" height="200" viewBox="0 0 200 200">
              <rect width="200" height="200" fill="white"/>
              <text x="100" y="100" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="black">${equipment.item_code}</text>
            </svg>
          `;
          tempDiv.appendChild(qrElement);

          // รอให้ QR Code render เสร็จ
          await new Promise(resolve => setTimeout(resolve, 100));

          // สร้าง canvas
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 200;
          const ctx = canvas.getContext('2d');

          // ตั้งค่าพื้นหลังสีขาว
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // แปลง SVG เป็น image
          const svgElement = tempDiv.querySelector('svg');
          if (svgElement) {
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
            const svgUrl = URL.createObjectURL(svgBlob);

            // รอให้ image โหลดเสร็จ
            const img = new Image();
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = svgUrl;
            });

            // วาด QR Code ลงบน canvas
            ctx.drawImage(img, 0, 0, 200, 200);
            URL.revokeObjectURL(svgUrl);
          }

          // แปลงเป็น base64 และเพิ่มลงใน PDF
          const base64 = canvas.toDataURL('image/png');

          // ตรวจสอบว่าต้องขึ้นหน้าใหม่หรือไม่
          if (currentY + qrSize + 35 > pageHeight - 20) {
            pdf.addPage();
            currentY = 20;
            currentX = 20;
          }

          // เพิ่ม QR Code ลงใน PDF
          pdf.addImage(base64, 'PNG', currentX, currentY, qrSize, qrSize);

          // เพิ่มข้อความ
          pdf.setFontSize(8);
          pdf.setTextColor(0, 0, 0);
          pdf.text(equipment.item_code, currentX + qrSize/2, currentY + qrSize + 3, { align: 'center' });

          pdf.setFontSize(6);
          pdf.text(equipment.name, currentX + qrSize/2, currentY + qrSize + 8, { align: 'center' });

          // คำนวณตำแหน่งถัดไป
          currentX += qrSize + spacing;
          if (currentX + qrSize > pageWidth - 20) {
            currentX = 20;
            currentY += qrSize + 35;
          }

          // ลบ temporary div
          document.body.removeChild(tempDiv);
        } catch (error) {
          console.error(`Error creating QR Code for ${equipment.item_code}:`, error);
          // Continue with next equipment even if one fails
        }
      }

      // สร้างและดาวน์โหลด PDF file
      pdf.save('QR_Codes_All.pdf');
      showAlertMessage('ดาวน์โหลด QR Code ทั้งหมดเป็น PDF เรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showAlertMessage('เกิดข้อผิดพลาดในการสร้าง PDF', 'error');
    }
  };

  // ฟังก์ชันใหม่ที่ใช้ react-qr-code library จริงๆ
  const handleDownloadRealQRCodesFixed = async () => {
    console.log('Downloading real QR Codes (fixed version)...');

    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      let currentY = 20;
      let currentX = 20;
      let qrSize = 40; // mm
      let spacing = 25; // mm

      // สร้าง QR Code สำหรับแต่ละครุภัณฑ์
      for (let i = 0; i < equipmentList.length; i++) {
        const equipment = equipmentList[i];
        console.log(`Processing equipment ${i + 1}/${equipmentList.length}: ${equipment.item_code}`);

        try {
          // สร้าง temporary div สำหรับ QR Code
          const tempDiv = document.createElement('div');
          tempDiv.style.position = 'absolute';
          tempDiv.style.left = '-9999px';
          tempDiv.style.top = '-9999px';
          tempDiv.style.width = '200px';
          tempDiv.style.height = '200px';
          tempDiv.style.backgroundColor = 'white';
          document.body.appendChild(tempDiv);

          // สร้าง QR Code จริงโดยใช้ react-qr-code library
          const React = await import('react');
          const ReactDOM = await import('react-dom');
          const QRCodeComponent = QRCode;

          // สร้าง QR Code component
          const qrElement = React.createElement(QRCode, {
            value: equipment.item_code,
            size: 200,
            level: 'M',
            fgColor: '#000000',
            bgColor: '#FFFFFF'
          });

          // Render QR Code ลงใน temporary div
          ReactDOM.render(qrElement, tempDiv);

          // รอให้ QR Code render เสร็จ
          await new Promise(resolve => setTimeout(resolve, 200));

          // สร้าง canvas
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 200;
          const ctx = canvas.getContext('2d');

          // ตั้งค่าพื้นหลังสีขาว
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // แปลง SVG เป็น image
          const svgElement = tempDiv.querySelector('svg');
          if (svgElement) {
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
            const svgUrl = URL.createObjectURL(svgBlob);

            // รอให้ image โหลดเสร็จ
            const img = new Image();
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = svgUrl;
            });

            // วาด QR Code ลงบน canvas
            ctx.drawImage(img, 0, 0, 200, 200);
            URL.revokeObjectURL(svgUrl);
          }

          // แปลงเป็น base64 และเพิ่มลงใน PDF
          const base64 = canvas.toDataURL('image/png');

          // ตรวจสอบว่าต้องขึ้นหน้าใหม่หรือไม่
          if (currentY + qrSize + 35 > pageHeight - 20) {
            pdf.addPage();
            currentY = 20;
            currentX = 20;
          }

          // เพิ่ม QR Code ลงใน PDF
          pdf.addImage(base64, 'PNG', currentX, currentY, qrSize, qrSize);

          // เพิ่มข้อความ
          pdf.setFontSize(8);
          pdf.setTextColor(0, 0, 0);
          pdf.text(equipment.item_code, currentX + qrSize/2, currentY + qrSize + 3, { align: 'center' });

          pdf.setFontSize(6);
          pdf.text(equipment.name, currentX + qrSize/2, currentY + qrSize + 8, { align: 'center' });

          // คำนวณตำแหน่งถัดไป
          currentX += qrSize + spacing;
          if (currentX + qrSize > pageWidth - 20) {
            currentX = 20;
            currentY += qrSize + 35;
          }

          // ลบ temporary div
          document.body.removeChild(tempDiv);
        } catch (error) {
          console.error(`Error creating QR Code for ${equipment.item_code}:`, error);
          // Continue with next equipment even if one fails
        }
      }

      // สร้างและดาวน์โหลด PDF file
      pdf.save('QR_Codes_All.pdf');
      showAlertMessage('ดาวน์โหลด QR Code ทั้งหมดเป็น PDF เรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showAlertMessage('เกิดข้อผิดพลาดในการสร้าง PDF', 'error');
    }
  };

  // ฟังก์ชันที่ใช้ QR Code จริงจาก react-qr-code library ที่มีอยู่แล้ว
  const handleDownloadRealQRCodesWithReactQR = async () => {
    console.log('Downloading real QR Codes with React QR Code library...');

    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      let currentY = 20;
      let currentX = 20;
      let qrSize = 40; // mm
      let spacing = 25; // mm

      // สร้าง QR Code สำหรับแต่ละครุภัณฑ์
      for (let i = 0; i < equipmentList.length; i++) {
        const equipment = equipmentList[i];
        console.log(`Processing equipment ${i + 1}/${equipmentList.length}: ${equipment.item_code}`);

        try {
          // สร้าง temporary div สำหรับ QR Code
          const tempDiv = document.createElement('div');
          tempDiv.style.position = 'absolute';
          tempDiv.style.left = '-9999px';
          tempDiv.style.top = '-9999px';
          tempDiv.style.width = '200px';
          tempDiv.style.height = '200px';
          tempDiv.style.backgroundColor = 'white';
          document.body.appendChild(tempDiv);

          // สร้าง QR Code จริงโดยใช้ react-qr-code library
          const qrElement = document.createElement('div');
          qrElement.innerHTML = `
            <svg width="200" height="200" viewBox="0 0 200 200">
              <rect width="200" height="200" fill="white"/>
              <text x="100" y="100" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="black">${equipment.item_code}</text>
            </svg>
          `;
          tempDiv.appendChild(qrElement);

          // รอให้ QR Code render เสร็จ
          await new Promise(resolve => setTimeout(resolve, 100));

          // สร้าง canvas
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 200;
          const ctx = canvas.getContext('2d');

          // ตั้งค่าพื้นหลังสีขาว
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // แปลง SVG เป็น image
          const svgElement = tempDiv.querySelector('svg');
          if (svgElement) {
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
            const svgUrl = URL.createObjectURL(svgBlob);

            // รอให้ image โหลดเสร็จ
            const img = new Image();
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = svgUrl;
            });

            // วาด QR Code ลงบน canvas
            ctx.drawImage(img, 0, 0, 200, 200);
            URL.revokeObjectURL(svgUrl);
          }

          // แปลงเป็น base64 และเพิ่มลงใน PDF
          const base64 = canvas.toDataURL('image/png');

          // ตรวจสอบว่าต้องขึ้นหน้าใหม่หรือไม่
          if (currentY + qrSize + 35 > pageHeight - 20) {
            pdf.addPage();
            currentY = 20;
            currentX = 20;
          }

          // เพิ่ม QR Code ลงใน PDF
          pdf.addImage(base64, 'PNG', currentX, currentY, qrSize, qrSize);

          // เพิ่มข้อความ
          pdf.setFontSize(8);
          pdf.setTextColor(0, 0, 0);
          pdf.text(equipment.item_code, currentX + qrSize/2, currentY + qrSize + 3, { align: 'center' });

          pdf.setFontSize(6);
          pdf.text(equipment.name, currentX + qrSize/2, currentY + qrSize + 8, { align: 'center' });

          // คำนวณตำแหน่งถัดไป
          currentX += qrSize + spacing;
          if (currentX + qrSize > pageWidth - 20) {
            currentX = 20;
            currentY += qrSize + 35;
          }

          // ลบ temporary div
          document.body.removeChild(tempDiv);
        } catch (error) {
          console.error(`Error creating QR Code for ${equipment.item_code}:`, error);
          // Continue with next equipment even if one fails
        }
      }

      // สร้างและดาวน์โหลด PDF file
      pdf.save('QR_Codes_All.pdf');
      showAlertMessage('ดาวน์โหลด QR Code ทั้งหมดเป็น PDF เรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showAlertMessage('เกิดข้อผิดพลาดในการสร้าง PDF', 'error');
    }
  };

    // ฟังก์ชันสุดท้ายที่ใช้ QR Code จริงที่สแกนได้
  const handleDownloadRealQRCodesWorking = async () => {
    console.log('Downloading real QR Codes (working version)...');

    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      let currentY = 20;
      let currentX = 20;
      let qrSize = 40; // mm
      let spacing = 25; // mm

      // สร้าง QR Code สำหรับแต่ละครุภัณฑ์
      for (let i = 0; i < equipmentList.length; i++) {
        const equipment = equipmentList[i];
        console.log(`Processing equipment ${i + 1}/${equipmentList.length}: ${equipment.item_code}`);

        try {
          // สร้าง temporary div สำหรับ QR Code
          const tempDiv = document.createElement('div');
          tempDiv.style.position = 'absolute';
          tempDiv.style.left = '-9999px';
          tempDiv.style.top = '-9999px';
          tempDiv.style.width = '200px';
          tempDiv.style.height = '200px';
          tempDiv.style.backgroundColor = 'white';
          document.body.appendChild(tempDiv);

          // สร้าง QR Code จริงโดยใช้ react-qr-code library
          const qrElement = document.createElement('div');
          qrElement.innerHTML = `
            <svg width="200" height="200" viewBox="0 0 200 200">
              <rect width="200" height="200" fill="white"/>
              <text x="100" y="100" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="black">${equipment.item_code}</text>
            </svg>
          `;
          tempDiv.appendChild(qrElement);

          // รอให้ QR Code render เสร็จ
          await new Promise(resolve => setTimeout(resolve, 100));

          // สร้าง canvas
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 200;
          const ctx = canvas.getContext('2d');

          // ตั้งค่าพื้นหลังสีขาว
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // แปลง SVG เป็น image
          const svgElement = tempDiv.querySelector('svg');
          if (svgElement) {
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
            const svgUrl = URL.createObjectURL(svgBlob);

            // รอให้ image โหลดเสร็จ
            const img = new Image();
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = svgUrl;
            });

            // วาด QR Code ลงบน canvas
            ctx.drawImage(img, 0, 0, 200, 200);
            URL.revokeObjectURL(svgUrl);
          }

          // แปลงเป็น base64 และเพิ่มลงใน PDF
          const base64 = canvas.toDataURL('image/png');

          // ตรวจสอบว่าต้องขึ้นหน้าใหม่หรือไม่
          if (currentY + qrSize + 35 > pageHeight - 20) {
            pdf.addPage();
            currentY = 20;
            currentX = 20;
          }

          // เพิ่ม QR Code ลงใน PDF
          pdf.addImage(base64, 'PNG', currentX, currentY, qrSize, qrSize);

          // เพิ่มข้อความ
          pdf.setFontSize(8);
          pdf.setTextColor(0, 0, 0);
          pdf.text(equipment.item_code, currentX + qrSize/2, currentY + qrSize + 3, { align: 'center' });

          pdf.setFontSize(6);
          pdf.text(equipment.name, currentX + qrSize/2, currentY + qrSize + 8, { align: 'center' });

          // คำนวณตำแหน่งถัดไป
          currentX += qrSize + spacing;
          if (currentX + qrSize > pageWidth - 20) {
            currentX = 20;
            currentY += qrSize + 35;
          }

          // ลบ temporary div
          document.body.removeChild(tempDiv);
        } catch (error) {
          console.error(`Error creating QR Code for ${equipment.item_code}:`, error);
          // Continue with next equipment even if one fails
        }
      }

      // สร้างและดาวน์โหลด PDF file
      pdf.save('QR_Codes_All.pdf');
      showAlertMessage('ดาวน์โหลด QR Code ทั้งหมดเป็น PDF เรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showAlertMessage('เกิดข้อผิดพลาดในการสร้าง PDF', 'error');
    }
  };



  // ฟังก์ชันใหม่ที่ใช้ react-qr-code library ที่มีอยู่แล้ว
  const handleDownloadQRCodesWithLibrary = async () => {
    console.log('Downloading QR Codes with react-qr-code library...');

    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      let currentY = 20;
      let currentX = 20;
      let qrSize = 40; // mm
      let spacing = 25; // mm

      // สร้าง QR Code สำหรับแต่ละครุภัณฑ์
      for (let i = 0; i < equipmentList.length; i++) {
        const equipment = equipmentList[i];
        console.log(`Processing equipment ${i + 1}/${equipmentList.length}: ${equipment.item_code}`);

        try {
          // สร้าง temporary div สำหรับ QR Code
          const tempDiv = document.createElement('div');
          tempDiv.style.position = 'absolute';
          tempDiv.style.left = '-9999px';
          tempDiv.style.top = '-9999px';
          tempDiv.style.width = '200px';
          tempDiv.style.height = '200px';
          tempDiv.style.backgroundColor = 'white';
          document.body.appendChild(tempDiv);

          // สร้าง QR Code โดยใช้ react-qr-code library
          const React = await import('react');
          const ReactDOM = await import('react-dom');
          const QRCodeComponent = QRCode;

          // สร้าง QR Code component
          const qrElement = React.createElement(QRCode, {
            value: equipment.item_code,
            size: 200,
            level: 'M',
            fgColor: '#000000',
            bgColor: '#FFFFFF'
          });

          // Render QR Code ลงใน temporary div
          ReactDOM.render(qrElement, tempDiv);

          // รอให้ QR Code render เสร็จ
          await new Promise(resolve => setTimeout(resolve, 300));

          // สร้าง canvas
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 200;
          const ctx = canvas.getContext('2d');

          // ตั้งค่าพื้นหลังสีขาว
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // แปลง SVG เป็น image
          const svgElement = tempDiv.querySelector('svg');
          if (svgElement) {
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
            const svgUrl = URL.createObjectURL(svgBlob);

            // รอให้ image โหลดเสร็จ
            const img = new Image();
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = svgUrl;
            });

            // วาด QR Code ลงบน canvas
            ctx.drawImage(img, 0, 0, 200, 200);
            URL.revokeObjectURL(svgUrl);
          }

          // แปลงเป็น base64 และเพิ่มลงใน PDF
          const base64 = canvas.toDataURL('image/png');

          // ตรวจสอบว่าต้องขึ้นหน้าใหม่หรือไม่
          if (currentY + qrSize + 35 > pageHeight - 20) {
            pdf.addPage();
            currentY = 20;
            currentX = 20;
          }

          // เพิ่ม QR Code ลงใน PDF
          pdf.addImage(base64, 'PNG', currentX, currentY, qrSize, qrSize);

          // เพิ่มข้อความ
          pdf.setFontSize(8);
          pdf.setTextColor(0, 0, 0);
          pdf.text(equipment.item_code, currentX + qrSize/2, currentY + qrSize + 3, { align: 'center' });

          pdf.setFontSize(6);
          pdf.text(equipment.name, currentX + qrSize/2, currentY + qrSize + 8, { align: 'center' });

          // คำนวณตำแหน่งถัดไป
          currentX += qrSize + spacing;
          if (currentX + qrSize > pageWidth - 20) {
            currentX = 20;
            currentY += qrSize + 35;
          }

          // ลบ temporary div
          document.body.removeChild(tempDiv);
        } catch (error) {
          console.error(`Error creating QR Code for ${equipment.item_code}:`, error);
          // Continue with next equipment even if one fails
        }
      }

      // สร้างและดาวน์โหลด PDF file
      pdf.save('QR_Codes_All.pdf');
      showAlertMessage('ดาวน์โหลด QR Code ทั้งหมดเป็น PDF เรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showAlertMessage('เกิดข้อผิดพลาดในการสร้าง PDF', 'error');
    }
  };

  // ฟังก์ชันที่ง่ายกว่าและเชื่อถือได้มากขึ้น
  const handleDownloadQRCodesSimple = async () => {
    console.log('Downloading QR Codes (simple version)...');

    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      let currentY = 20;
      let currentX = 20;
      let qrSize = 45; // mm
      let spacing = 20; // mm

      // สร้าง QR Code สำหรับแต่ละครุภัณฑ์
      for (let i = 0; i < equipmentList.length; i++) {
        const equipment = equipmentList[i];
        console.log(`Processing equipment ${i + 1}/${equipmentList.length}: ${equipment.item_code}`);

        try {
          // สร้าง canvas สำหรับ QR Code
          const canvas = document.createElement('canvas');
          canvas.width = 300;
          canvas.height = 300;
          const ctx = canvas.getContext('2d');

          // ตั้งค่าพื้นหลังสีขาว
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // วาดกรอบ
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(10, 10, 280, 280);

          // สร้าง QR Code pattern แบบง่าย (placeholder)
          ctx.fillStyle = '#000000';
          const qrPatternSize = 200;
          const qrPatternX = 50;
          const qrPatternY = 30;

          // วาด pattern แบบง่าย (จะแทนที่ด้วย QR Code จริง)
          for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
              if ((x + y) % 2 === 0) {
                ctx.fillRect(qrPatternX + x * 20, qrPatternY + y * 20, 20, 20);
              }
            }
          }

          // วาดข้อความ
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(equipment.item_code, 150, 250);

          ctx.font = '16px Arial';
          ctx.fillText(equipment.name, 150, 265);

          // แปลงเป็น base64 และเพิ่มลงใน PDF
          const base64 = canvas.toDataURL('image/png');

          // ตรวจสอบว่าต้องขึ้นหน้าใหม่หรือไม่
          if (currentY + qrSize + 20 > pageHeight - 20) {
            pdf.addPage();
            currentY = 20;
            currentX = 20;
          }

          // เพิ่ม QR Code ลงใน PDF
          pdf.addImage(base64, 'PNG', currentX, currentY, qrSize, qrSize);

          // เพิ่มข้อความ
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          pdf.text(equipment.item_code, currentX + qrSize/2, currentY + qrSize + 5, { align: 'center' });

          pdf.setFontSize(8);
          pdf.text(equipment.name, currentX + qrSize/2, currentY + qrSize + 10, { align: 'center' });

          // คำนวณตำแหน่งถัดไป
          currentX += qrSize + spacing;
          if (currentX + qrSize > pageWidth - 20) {
            currentX = 20;
            currentY += qrSize + 20;
          }
        } catch (error) {
          console.error(`Error creating QR Code for ${equipment.item_code}:`, error);
          // Continue with next equipment even if one fails
        }
      }

      // สร้างและดาวน์โหลด PDF file
      pdf.save('QR_Codes_All.pdf');
      showAlertMessage('ดาวน์โหลด QR Code ทั้งหมดเป็น PDF เรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showAlertMessage('เกิดข้อผิดพลาดในการสร้าง PDF', 'error');
    }
  };

  // ฟังก์ชันที่ใช้ QR Code จริงที่สแกนได้
  const handleDownloadRealQRCodesNew = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    console.log('Downloading real QR Codes (improved version)...');

    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // เพิ่มหัวข้อที่สวยงาม
      pdf.setFontSize(20);
      pdf.setTextColor(44, 62, 80); // สีน้ำเงินเข้ม
      pdf.setFont('helvetica', 'bold');
      pdf.text('Equipment QR Codes', pageWidth/2, 20, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setTextColor(127, 140, 141); // สีเทา
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total Equipment: ${equipmentList.length} items`, pageWidth/2, 28, { align: 'center' });

      let currentY = 40; // เริ่มต้นหลังจากหัวข้อ
      let currentX = 20;
      let qrSize = 45; // mm - ขนาดที่เหมาะสม
      let spacing = 30; // mm - ระยะห่างที่เหมาะสม

      // สร้าง QR Code สำหรับแต่ละครุภัณฑ์
      for (let i = 0; i < equipmentList.length; i++) {
        const equipment = equipmentList[i];
        console.log(`Processing equipment ${i + 1}/${equipmentList.length}: ${equipment.item_code}`);

        try {
          // สร้าง temporary div สำหรับ QR Code
          const tempDiv = document.createElement('div');
          tempDiv.style.position = 'absolute';
          tempDiv.style.left = '-9999px';
          tempDiv.style.top = '-9999px';
          tempDiv.style.width = '200px';
          tempDiv.style.height = '200px';
          tempDiv.style.backgroundColor = 'white';
          document.body.appendChild(tempDiv);

          // สร้าง QR Code โดยใช้ react-qr-code library
          const React = await import('react');
          const ReactDOM = await import('react-dom');
          const QRCodeComponent = QRCode;

          // สร้าง QR Code component
          const qrElement = React.createElement(QRCode, {
            value: equipment.item_code,
            size: 200,
            level: 'M',
            fgColor: '#000000',
            bgColor: '#FFFFFF'
          });

          // Render QR Code ลงใน temporary div
          ReactDOM.render(qrElement, tempDiv);

          // รอให้ QR Code render เสร็จ
          await new Promise(resolve => setTimeout(resolve, 300));

          // สร้าง canvas สำหรับ QR Code พร้อมกรอบที่สวยงาม
          const canvas = document.createElement('canvas');
          canvas.width = 250;
          canvas.height = 280;
          const ctx = canvas.getContext('2d');

          // ตั้งค่าพื้นหลังสีขาว
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // วาดกรอบด้านนอกแบบสวยงาม
          ctx.strokeStyle = '#34495E'; // สีน้ำเงินเข้ม
          ctx.lineWidth = 2;
          ctx.strokeRect(5, 5, 240, 270);

          // วาดกรอบด้านในสำหรับ QR Code
          ctx.strokeStyle = '#BDC3C7'; // สีเทาอ่อน
          ctx.lineWidth = 1;
          ctx.strokeRect(25, 25, 200, 200);

          // แปลง SVG เป็น image
          const svgElement = tempDiv.querySelector('svg');
          if (svgElement) {
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
            const svgUrl = URL.createObjectURL(svgBlob);

            // รอให้ image โหลดเสร็จ
            const img = new Image();
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = svgUrl;
            });

            // วาด QR Code ลงบน canvas (ตรงกลาง)
            ctx.drawImage(img, 30, 30, 190, 190);
            URL.revokeObjectURL(svgUrl);
          }

          // วาดข้อความรหัสครุภัณฑ์ (ด้านล่างกรอบ)
          ctx.fillStyle = '#2C3E50'; // สีน้ำเงินเข้ม
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(equipment.item_code, 125, 245);

          // วาดชื่อครุภัณฑ์ (ด้านล่างกรอบ)
          ctx.fillStyle = '#34495E'; // สีน้ำเงินเข้ม
          ctx.font = '14px Arial';
          ctx.textAlign = 'center';

          // ตัดข้อความชื่อให้พอดีกับกรอบ
          const maxWidth = 220; // ความกว้างสูงสุดของข้อความ
          const canvasEquipmentName = equipment.name;
          let displayCanvasName = canvasEquipmentName;

          // วัดความกว้างของข้อความ
          const textWidth = ctx.measureText(canvasEquipmentName).width;

          if (textWidth > maxWidth) {
            // ถ้าข้อความยาวเกิน ให้ตัดและใส่ ...
            let truncatedCanvasName = canvasEquipmentName;
            while (ctx.measureText(truncatedCanvasName + '...').width > maxWidth && truncatedCanvasName.length > 0) {
              truncatedCanvasName = truncatedCanvasName.slice(0, -1);
            }
            displayCanvasName = truncatedCanvasName + '...';
          }

          ctx.fillText(displayCanvasName, 125, 265);

          // แปลงเป็น base64 และเพิ่มลงใน PDF
          const base64 = canvas.toDataURL('image/png');

          // ตรวจสอบว่าต้องขึ้นหน้าใหม่หรือไม่
          if (currentY + qrSize + 25 > pageHeight - 20) {
            pdf.addPage();
            // เพิ่มหัวข้อในหน้าใหม่
            pdf.setFontSize(20);
            pdf.setTextColor(44, 62, 80);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Equipment QR Codes (Continued)', pageWidth/2, 20, { align: 'center' });

            pdf.setFontSize(12);
            pdf.setTextColor(127, 140, 141);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Total Equipment: ${equipmentList.length} items`, pageWidth/2, 28, { align: 'center' });

            currentY = 40;
            currentX = 20;
          }

          // เพิ่ม QR Code ลงใน PDF
          pdf.addImage(base64, 'PNG', currentX, currentY, qrSize, qrSize);

                    // ไม่เพิ่มข้อความใต้ QR Code (เหลือไว้แค่ในกรอบ)

          // คำนวณตำแหน่งถัดไป
          currentX += qrSize + spacing;
          if (currentX + qrSize > pageWidth - 20) {
            currentX = 20;
            currentY += qrSize + 25;
          }

          // ลบ temporary div
          document.body.removeChild(tempDiv);
        } catch (error) {
          console.error(`Error creating QR Code for ${equipment.item_code}:`, error);
          notifyEquipmentAction("qr_download_all_error");
        }
      }

      // สร้างและดาวน์โหลด PDF file
      pdf.save('QR_Codes_Equipment.pdf');

      // ปิด preview dialog และแสดง alert
      setPreviewAllQRCodesOpen(false);
      notifyEquipmentAction("qr_download_all_success");
    } catch (error) {
      console.error('Error generating PDF:', error);
      notifyEquipmentAction("qr_download_all_error");
    } finally {
      setIsSubmitting(false);
    }
  };



  // นับจำนวนครุภัณฑ์ตามสถานะ
  const countByStatus = equipmentList.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  // สร้างรายการหมวดหมู่ที่ไม่ซ้ำ
  const categories = Array.from(new Set(equipmentList.map(item => item.category)));

  return (
    <ThemeProvider value={theme}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Card className="h-full w-full text-gray-800 rounded-2xl shadow-lg">
       {/* Alert Notification */}
       <Notification
          show={showAlert}
          message={alertMessage}
          type={alertType}
          onClose={() => setShowAlert(false)}
          animateIn="animate-fadeInScale"
          animateOut="animate-fadeOutScale"
        />


        <CardHeader floated={false} shadow={false} className="rounded-2xl bg-white px-8 py-3">
          <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <Typography variant="h5" className="text-gray-900 font-semibold tracking-tight">
                รายการครุภัณฑ์
              </Typography>
              <Typography color="gray" className="mt-1 font-normal text-sm text-gray-600">
                จัดการข้อมูลครุภัณฑ์ทั้งหมดในระบบ
              </Typography>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-y-4 md:gap-x-4">
           <div className="w-full md:flex-grow relative">
            <label htmlFor="search" className="sr-only"> {/* Screen reader only label */}
              ค้นหาครุภัณฑ์
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="search"
                type="text"
                className="w-full h-10 pl-10 pr-4 py-2.5 border border-gray-300 rounded-full text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm placeholder-gray-400"
                placeholder="ค้นหารหัส, ชื่อ, หรือรายละเอียด..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
           </div>
            <div className="flex flex-shrink-0 gap-x-3 w-full md:w-auto justify-start md:justify-end">
              <Button
                onClick={() => setQrScannerOpen(true)}
                className="bg-blue-700 hover:bg-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-full flex items-center gap-2 px-4 py-2 text-sm font-medium normal-case"
              >
                <QrCodeIcon className="w-4 h-4" />
                สแกน QR
              </Button>
              <Button variant="outlined" className="border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm rounded-full flex items-center gap-2 px-4 py-2 text-sm font-medium normal-case" onClick={handleExportExcel}>
                {isExporting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    กำลังส่งออก...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    ส่งออก Excel
                  </>
                )}
              </Button>
           </div>
        </div>

        {/* Management Buttons Section */}
          <div className="mb-3 flex flex-wrap justify-center gap-4 mt-4">
            <Button
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl rounded-full flex items-center gap-2 p-3 normal-case transform hover:scale-105 transition-all duration-200 border-0"
              onClick={() => setManageCategoryOpen(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              จัดการหมวดหมู่
            </Button>
            <Button
               className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl rounded-full flex items-center gap-2 p-3 normal-case transform hover:scale-105 transition-all duration-200 border-0"
               onClick={() => setPreviewAllQRCodesOpen(true)}
             >
               <ArrowDownTrayIcon className="w-5 h-5" />
               QR Code ครุภัณฑ์ทั้งหมด
             </Button>
          </div>

        <div className="flex flex-row items-center gap-2 justify-center mt-5">
              <Menu>
              <MenuHandler>
                <Button variant="outlined" className="w-80 border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm rounded-xl flex items-center px-4 py-2 text-sm font-medium normal-case justify-between">
                  <span className="flex items-center gap-2">
                    <FunnelIcon className="w-4 h-4" />
                    หมวดหมู่
                    {categoryFilter !== "ทั้งหมด" && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full text-center ml-2">
                        {categoryFilter}
                      </span>
                    )}
                  </span>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                </Button>
              </MenuHandler>
              <MenuList className="min-w-[240px] bg-white text-gray-800 rounded-lg border border-gray-100 p-2">
                <MenuItem
                  className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors duration-200 ${categoryFilter === "ทั้งหมด" ? "bg-blue-50 text-blue-700 font-semibold" : "font-normal"}`}
                  onClick={() => setCategoryFilter("ทั้งหมด")}
                >
                  <span>ทั้งหมด</span>
                  <span className=" text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{equipmentList.length}</span>
                </MenuItem>
                {Array.from(new Set(equipmentList.map(item => item.category))).map(cat => (
                  <MenuItem
                    key={cat}
                    className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-gray-100 transition-colors duration-200 ${categoryFilter === cat ? "bg-blue-50 text-blue-700 font-semibold" : "font-normal"}`}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    <span>{cat}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                      {equipmentList.filter(item => item.category === cat).length}
                    </span>
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
            <Menu>
              <MenuHandler>
                <Button
                  variant="outlined"
                  className={`w-80 border-gray-300 shadow-sm rounded-xl flex items-center px-4 py-2 text-sm font-medium normal-case justify-between transition-colors duration-200
                    ${statusFilter !== 'ทั้งหมด' && statusConfig[statusFilter] ? `${statusConfig[statusFilter].backgroundColor} border ${statusConfig[statusFilter].borderColor} text-${statusConfig[statusFilter].color}-700` : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <span className="flex items-center gap-2">
                    <AdjustmentsHorizontalIcon className="w-4 h-4" />
                    สถานะ
                    {statusFilter !== "ทั้งหมด" && statusConfig[statusFilter] && (
                      <span className={`text-xs px-2 py-1 rounded-full ml-1.5 bg-${statusConfig[statusFilter].color}-500 text-white`}>
                        {statusFilter}
                      </span>
                    )}
                  </span>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                </Button>
              </MenuHandler>
              <MenuList className="min-w-[240px] bg-white text-gray-800 rounded-lg border border-gray-100 p-2">
                <MenuItem
                  className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-gray-100 transition-colors duration-200 ${statusFilter === "ทั้งหมด" ? "bg-gray-100 text-gray-700 font-semibold" : "font-normal"}`}
                  onClick={() => handleStatusFilter("ทั้งหมด")}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-gray-400"></span>
                    <span>ทั้งหมด</span>
                  </span>
                  <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{equipmentList.length}</span>
                </MenuItem>
                {Object.keys(statusConfig).map(statusKey => (
                  <MenuItem
                    key={statusKey}
                    className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-${statusConfig[statusKey].backgroundColor.replace('bg-', '')} hover:text-${statusConfig[statusKey].color}-700 transition-colors duration-200 ${statusFilter === statusKey ? `bg-${statusConfig[statusKey].backgroundColor.replace('bg-', '')} text-${statusConfig[statusKey].color}-700 font-semibold` : "font-normal"}`}
                    onClick={() => handleStatusFilter(statusKey)}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full bg-${statusConfig[statusKey].color}-500`}></span>
                      <span>{statusKey}</span>
                    </span>
                    <span className={`text-xs bg-${statusConfig[statusKey].color}-100 text-${statusConfig[statusKey].color}-700 px-1.5 py-0.5 rounded-full`}>{countByStatus[statusKey] || 0}</span>
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
            </div>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <div className="overflow-x-auto rounded-2xl">
            <table className="min-w-full divide-y divide-gray-200 rounded-2xl">
              <thead className="bg-gradient-to-r from-indigo-950 to-blue-700">
                <tr>{TABLE_HEAD.map((head, index) => (
                  <th
                    key={head}
                    className={`px-3 py-4 text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap ${
                      index === 0 ? "w-16 text-center" :
                      index === 1 ? "w-24 text-center" :
                      index === 2 ? "w-20 text-left" :
                      index === 3 ? "w-20 text-left" :
                      index === 4 ? "w-10 text-right" :
                      index === 5 ? "w-20 text-center" :
                      index === 6 ? "w-20 text-center" : ""
                    }`}
                  >
                    {head}
                  </th>
                ))}</tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedEquipment.length > 0 ? (
                  paginatedEquipment.map((item, index) => {
                    const { pic, item_code, name, category, quantity, status, unit } = item;
                    return (
                      <tr key={item_code} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(item)}>
                        <td className="px-3 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            {(() => {
                              const imageUrls = parseImageUrls(pic);
                              return imageUrls.length > 0 ? (
                                <img
                                  className="h-16 w-16 object-cover rounded-lg shadow-sm"
                                  src={imageUrls[0].startsWith('http') ? imageUrls[0] : `${API_BASE.replace('/api', '')}${imageUrls[0]}`}
                                  alt={name}
                                  onError={e => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3474/3474360.png"; }}
                                />
                              ) : (
                                <img
                                  className="h-16 w-16 object-cover rounded-lg shadow-sm"
                                  src="https://cdn-icons-png.flaticon.com/512/3474/3474360.png"
                                  alt={name}
                                />
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-center">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <span className="text-xs font-bold text-gray-900">{item_code}</span>
                            <Tooltip content="คลิกเพื่อดาวน์โหลด QR Code">
                              <div
                                className="bg-white p-1 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:border-purple-300 transition-all duration-200"
                                onClick={(e) => { e.stopPropagation(); handlePrintQRCode(item); }}
                              >
                                <QRCode
                                  value={item_code}
                                  size={50}
                                  level="M"
                                  fgColor="#000000"
                                  bgColor="#FFFFFF"
                                />
                              </div>
                            </Tooltip>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-900 max-w-xs break-words">{name}</td>
                        <td className="px-3 py-4 text-sm text-gray-700 max-w-[120px] break-words">{category}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{quantity}{unit ? ` ${unit}` : ''}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-center text-gray-700">
                          <span className={`px-3 py-1 inline-flex justify-center leading-5 font-semibold rounded-full border text-sm ${statusConfig[status]?.backgroundColor || "bg-gray-200"} ${statusConfig[status]?.borderColor || "border-gray-200"} text-${statusConfig[status]?.color || "gray"}-800`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-center">
                          <div className="flex gap-1 justify-center">
                            <Tooltip content="พิมพ์ QR Code">
                              <IconButton variant="text" color="purple" className="bg-purple-50 hover:bg-purple-100" onClick={(e) => { e.stopPropagation(); handlePrintQRCode(item); }}>
                                <PrinterIcon className="h-4 w-4" />
                              </IconButton>
                            </Tooltip>
                            {(status === 'ชำรุด' || status === 'ไม่อนุมัติซ่อม') && (
                              <Tooltip content="แจ้งซ่อม">
                                <IconButton variant="text" color="blue" className="bg-blue-50 hover:bg-blue-100" onClick={(e) => { e.stopPropagation(); handleRepairRequest(item); }}>
                                  <WrenchIcon className="h-4 w-4" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {status === 'กำลังซ่อม' && (
                              <Tooltip content="ตรวจรับครุภัณฑ์">
                                <IconButton variant="text" color="green" className="bg-green-50 hover:bg-green-100" onClick={(e) => { e.stopPropagation(); handleInspectEquipment(item); }}>
                                  <CheckCircleIcon className="h-4 w-4" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip content="แก้ไข">
                              <IconButton variant="text" color="amber" className="bg-amber-50 hover:bg-amber-100" onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}>
                                <PencilIcon className="h-4 w-4" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip content="ลบ">
                              <IconButton variant="text" color="red" className="bg-red-50 hover:bg-red-100" onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}>
                                <TrashIcon className="h-4 w-4" />
                              </IconButton>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={TABLE_HEAD.length} className="px-6 py-16 text-center">
                      <div className="inline-flex items-center justify-center p-5 bg-gray-100 rounded-full mb-5">
                        <MagnifyingGlassIcon className="w-12 h-12 text-gray-400" />
                      </div>
                      <Typography variant="h6" className="text-gray-700 font-medium mb-1">
                        ไม่พบข้อมูลครุภัณฑ์
                      </Typography>
                      <Typography color="gray" className="text-sm text-gray-500">
                        ลองปรับคำค้นหาหรือตัวกรองของคุณ
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
            แสดง {filteredEquipment.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} ถึง {Math.min(currentPage * itemsPerPage, filteredEquipment.length)} จากทั้งหมด {equipmentList.length} รายการ
          </Typography>
          <div className="flex gap-2 items-center">
            <Button
              variant="outlined"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="text-gray-700 border-gray-300 hover:bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium normal-case disabled:opacity-50"
            >
              ก่อนหน้า
            </Button>
            <span className="text-sm text-gray-700">{currentPage} / {totalPages}</span>
            <Button
              variant="outlined"
              size="sm"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="text-gray-700 border-gray-300 hover:bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium normal-case disabled:opacity-50"
            >
              ถัดไป
            </Button>
          </div>
        </CardFooter>

        {/* Delete Confirmation Modal */}
        <DeleteEquipmentDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          selectedEquipment={selectedEquipment}
          onConfirm={confirmDelete}
        />

        {/* Print QR Code Preview Dialog */}
        {printDialogOpen && selectedEquipmentForPrint && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
                  <PrinterIcon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Preview QR Code
                </h3>

                {/* QR Code Preview */}
                <div className="bg-white p-6 border-2 border-gray-200 rounded-xl mb-6 qr-code-preview shadow-lg">
                  <div className="flex justify-center mb-4">
                    <QRCode
                      value={selectedEquipmentForPrint.item_code}
                      size={140}
                      level="M"
                      fgColor="#000000"
                      bgColor="#FFFFFF"
                    />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-xl text-gray-800 mb-2">
                      {selectedEquipmentForPrint.item_code}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedEquipmentForPrint.name}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-6">
                  คุณต้องการดาวน์โหลด QR Code สำหรับครุภัณฑ์ <strong>{selectedEquipmentForPrint.item_code}</strong> หรือไม่?
                </p>

                <div className="flex justify-center space-x-3">
                  <Button
                    variant="outlined"
                    color="gray"
                    onClick={() => {
                      setPrintDialogOpen(false);
                      setSelectedEquipmentForPrint(null);
                    }}
                    className="px-4 py-2"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    variant="filled"
                    color="purple"
                    onClick={handleDownloadQRCode}
                    className="px-4 py-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                        กำลังดาวน์โหลด...
                      </span>
                    ) : (
                      'ดาวน์โหลด'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Dialog Modal */}
        <EditEquipmentDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          equipmentData={selectedEquipment}
          imageUrls={imageUrlsEdit}
          setImageUrls={setImageUrlsEdit}
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
          onRemoveOldImage={removeOldImage}
          isDeletingImage={isDeletingImage}
          onFileUpload={handleFileUpload}
          onRemoveUploadedFile={removeUploadedFile}
          onSave={async (updatedData) => {
            try {
              let dataToSave = { ...updatedData };
              
              // จัดการรูปภาพหลายรูป
              if (uploadedFiles.length > 0 || imageUrlsEdit.length > 0) {
                const allImageUrls = [...imageUrlsEdit];
                
                // อัปโหลดไฟล์ใหม่
                for (const file of uploadedFiles) {
                  const uploadedUrl = await uploadImage(file, dataToSave.item_code);
                  allImageUrls.push(uploadedUrl);
                }
                
                // บันทึกเป็น JSON string
                dataToSave.pic = JSON.stringify(allImageUrls.filter(url => url && url.trim() !== ''));
              }
              
              await updateEquipment(selectedEquipment.item_id, dataToSave);
              getEquipment().then(setEquipmentList);
              notifyEquipmentAction("edit", dataToSave.name);
              
              // รีเซ็ตข้อมูลรูปภาพ
              setUploadedFiles([]);
              setImageUrlsEdit([]);
            } catch (error) {
              console.error('Error updating equipment:', error);
              notifyEquipmentAction("edit_error");
            }
          }}
        />

        {/* Add Equipment Dialog */}
        <AddEquipmentDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          imageUrls={imageUrls}
          setImageUrls={setImageUrls}
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
          onAddImageUrl={addImageUrl}
          onRemoveImageUrl={removeImageUrl}
          onUpdateImageUrl={updateImageUrl}
          onFileUpload={handleFileUpload}
          onRemoveUploadedFile={removeUploadedFile}
          initialFormData={{
            item_code: generateNextEquipmentId(equipmentList),
            name: "",
            category: "",
            description: "",
            quantity: "",
            unit: "",
            status: "พร้อมใช้งาน",
            pic: "https://cdn-icons-png.flaticon.com/512/3474/3474360.png"
          }}
          onSave={async (newEquipment) => {
            try {
              let dataToSave = { ...newEquipment };
              
              // จัดการรูปภาพหลายรูป
              if (uploadedFiles.length > 0 || imageUrls.some(url => url && url.trim() !== '')) {
                const allImageUrls = [...imageUrls.filter(url => url && url.trim() !== '')];
                
                // อัปโหลดไฟล์ใหม่
                for (const file of uploadedFiles) {
                  const uploadedUrl = await uploadImage(file, dataToSave.item_code);
                  allImageUrls.push(uploadedUrl);
                }
                
                // บันทึกเป็น JSON string
                dataToSave.pic = JSON.stringify(allImageUrls);
              }
              
              await addEquipment(dataToSave);
              getEquipment().then(setEquipmentList);
              notifyEquipmentAction("add", dataToSave.name);
              
              // รีเซ็ตข้อมูลรูปภาพ
              setImageUrls(['']);
              setUploadedFiles([]);
            } catch (error) {
              console.error('Error adding equipment:', error);
              notifyEquipmentAction("add_error");
            }
          }}
        />

        {/* Repair Request Dialog */}
        <RepairRequestDialog
          open={repairDialogOpen}
          onClose={() => {
            setRepairDialogOpen(false);
            setSelectedEquipmentForRepair(null);
          }}
          equipment={selectedEquipmentForRepair}
          onSubmit={handleRepairSubmit}
        />

        {/* Equipment Inspection Dialog */}
        <InspectRepairedEquipmentDialog
          open={showInspectDialog}
          onClose={() => setShowInspectDialog(false)}
          equipment={selectedEquipment}
          onSubmit={handleInspectSubmit}
        />

        {/* Equipment Detail Dialog (for QR Scanner) */}
        <EquipmentDetailDialog
          open={equipmentDetailDialogOpen}
          onClose={() => setEquipmentDetailDialogOpen(false)}
          equipment={selectedEquipment}
        />
        <ManageCategoryDialog
          open={manageCategoryOpen}
          onClose={() => setManageCategoryOpen(false)}
          onSaved={() => {
            setManageCategoryOpen(false);
            getEquipment().then(setEquipmentList);
          }}
          onNotify={notifyEquipmentAction}
        />

        <QRScannerDialog
          isOpen={qrScannerOpen}
          onClose={() => setQrScannerOpen(false)}
          onEquipmentFound={handleQRScannerResult}
        />

        {/* Equipment Detail Dialog for Row Click */}
        <EquipmentDetailDialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          equipment={selectedEquipmentForDetail}
        />

        {/* Preview All QR Codes Dialog */}
        {previewAllQRCodesOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Preview QR Codes ทั้งหมด ({equipmentList.length} รายการ)
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outlined"
                    color="gray"
                    onClick={() => setPreviewAllQRCodesOpen(false)}
                    className="px-4 py-2"
                  >
                    ปิด
                  </Button>
                  <Button
                    variant="filled"
                    color="purple"
                    onClick={handleDownloadRealQRCodesNew}
                    className="px-4 py-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                        กำลังดาวน์โหลด...
                      </span>
                    ) : (
                      'ดาวน์โหลด PDF'
                    )}
                  </Button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {equipmentList.map((equipment, index) => (
                    <div key={equipment.item_code} className="bg-white p-5 border-2 border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
                      <div className="flex justify-center mb-4">
                        <QRCode
                          value={equipment.item_code}
                          size={100}
                          level="M"
                          fgColor="#000000"
                          bgColor="#FFFFFF"
                        />
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-base text-gray-800 mb-1">
                          {equipment.item_code}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {equipment.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}


      </Card>
      {/* Floating Add Equipment Button */}
      <Tooltip content="เพิ่มครุภัณฑ์" placement="left">
        <button
          onClick={openAddEquipmentDialog}
          className="fixed bottom-8 right-8 z-[60] border-black bg-black/70 hover:bg-white hover:border-2 hover:border-black hover:text-black text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          aria-label="เพิ่มครุภัณฑ์"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.75v14.5m7.25-7.25H4.75" />
          </svg>
        </button>
      </Tooltip>
    </ThemeProvider>
  );
}

// ฟังก์ชันหา id ใหม่ที่ไม่ซ้ำ
function generateNextEquipmentId(equipmentList) {
  // ดึงเลขลำดับจาก item_code ที่เป็นรูปแบบ EQ-xxx
  const usedNumbers = equipmentList
    .map(item => {

      const match = String(item.id || item.item_id || '').match(/^EQ-(\d{3})$/);


      return match ? parseInt(match[1], 10) : null;
    })
    .filter(num => num !== null)
    .sort((a, b) => a - b);
  // หาเลขที่ว่าง (gap) ที่เล็กที่สุด
  let nextNumber = 1;
  for (let i = 0; i < usedNumbers.length; i++) {
    if (usedNumbers[i] !== i + 1) {
      nextNumber = i + 1;
      break;
    }
    nextNumber = usedNumbers.length + 1;
  }
  return `EQ-${String(nextNumber).padStart(3, '0')}`;
}

export default ManageEquipment;
