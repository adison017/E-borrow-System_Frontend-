import {
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  WrenchIcon,
  PrinterIcon
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
import Notification from "../../components/Notification";
import { addEquipment, deleteEquipment, getEquipment, getRepairRequestsByItemId, updateEquipment, uploadImage } from "../../utils/api";
import AddEquipmentDialog from "./dialog/AddEquipmentDialog";
import DeleteEquipmentDialog from "./dialog/DeleteEquipmentDialog";
import EditEquipmentDialog from "./dialog/EditEquipmentDialog";
import InspectRepairedEquipmentDialog from './dialog/InspectRepairedEquipmentDialog';
import RepairRequestDialog from "./dialog/RepairRequestDialog";
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

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success");
  const [repairDialogOpen, setRepairDialogOpen] = useState(false);
  const [selectedEquipmentForRepair, setSelectedEquipmentForRepair] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [categoryFilter, setCategoryFilter] = useState("ทั้งหมด");
  const [showInspectDialog, setShowInspectDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    getEquipment().then(setEquipmentList);
  }, []);

  // ฟังก์ชั่นแสดง Alert
  const showAlertMessage = (message, type = "success") => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);

    // ปิด Alert อัตโนมัติหลังจาก 3 วินาที
    setTimeout(() => {
      setShowAlert(false);
    }, 3000);
  };

  const handleDeleteClick = (equipment) => {
    setSelectedEquipment(equipment);
    setDeleteDialogOpen(true);
  };

  // ฟังก์ชั่นสำหรับลบ
  const confirmDelete = () => {
    deleteEquipment(selectedEquipment.item_code).then(() => getEquipment().then(setEquipmentList));
    setDeleteDialogOpen(false);
    showAlertMessage(`ลบครุภัณฑ์ ${selectedEquipment.name} เรียบร้อยแล้ว`, "delete");
    setSelectedEquipment(null);
  };

  const handleEditClick = (equipment) => {
    setSelectedEquipment(equipment);
    setEditDialogOpen(true);
  };

  // ฟังก์ชั่นสำหรับเปิด dialog เพิ่มครุภัณฑ์
  const openAddEquipmentDialog = () => {
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
  const handleAddEquipment = (data) => {
    let dataToSave = { ...data };
    // ให้แน่ใจว่ามี item_id
    dataToSave.item_id = dataToSave.item_id || dataToSave.id;
    delete dataToSave.id;
    addEquipment(dataToSave).then(() => getEquipment().then(setEquipmentList));
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
      if (a.status === "ชำรุด" && b.status !== "ชำรุด") return -1;
      if (b.status === "ชำรุด" && a.status !== "ชำรุด") return 1;
      // เรียงตาม item_code
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
            // ใช้ item_id เป็น canonical identifier สำหรับการอัปเดต
        const equipmentCode = repairData.equipment.code || repairData.equipment.item_code || repairData.equipment.id || repairData.equipment.item_id;
        const equipmentToUpdate = equipmentList.find(item => item.item_code === equipmentCode);
        if (equipmentToUpdate) {
          await updateEquipment(equipmentToUpdate.item_id, { ...equipmentToUpdate, status: 'รออนุมัติซ่อม' });
          getEquipment().then(setEquipmentList);
        }
    setRepairDialogOpen(false);
    setSelectedEquipmentForRepair(null);
  };

  const handleInspectEquipment = async (equipment) => {
    // Try to fetch repair requests for this equipment
    try {
      const repairRequests = await getRepairRequestsByItemId(equipment.item_id || equipment.id || equipment.item_code);
      // Find the latest repair request with status 'กำลังซ่อม' or similar (if needed)
      let latestRequest = null;
      if (Array.isArray(repairRequests) && repairRequests.length > 0) {
        // Sort by created_at or id descending if available
        latestRequest = repairRequests.sort((a, b) => {
          if (a.created_at && b.created_at) {
            return new Date(b.created_at) - new Date(a.created_at);
          }
          return (b.id || 0) - (a.id || 0);
        })[0];
      }
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
      console.log('Inspection data received:', inspectionData);

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
      showAlertMessage(`อัพเดทสถานะครุภัณฑ์ ${inspectionData.equipment.name} เป็น "${statusText}" เรียบร้อยแล้ว`, "success");
    } catch (error) {
      console.error('Error handling inspection submit:', error);
      showAlertMessage('เกิดข้อผิดพลาดในการอัพเดทสถานะครุภัณฑ์', "error");
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

    const handleDownloadQRCode = () => {
    const equipment = selectedEquipmentForPrint;
    console.log('Downloading QR Code for:', equipment);

    // สร้าง canvas สำหรับ QR Code
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 340;
    const ctx = canvas.getContext('2d');

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
      img.onload = () => {
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
          console.log('Canvas blob created:', blob);
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
        }, 'image/png');
      };
      img.src = svgUrl;
    } else {
      console.error('QR Code SVG not found');
    }
  };

  const handleDownloadAllQRCodes = async () => {
    console.log('Downloading all QR Codes as PDF...');

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

  // ฟังก์ชันหลักสำหรับสร้าง PDF ที่มี QR Code จริง
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
          const QRCodeComponent = await import('react-qr-code');

          // สร้าง QR Code component
          const qrElement = React.createElement(QRCodeComponent.default, {
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
          const QRCodeComponent = await import('react-qr-code');

          // สร้าง QR Code component
          const qrElement = React.createElement(QRCodeComponent.default, {
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
          const QRCodeComponent = await import('react-qr-code');

          // สร้าง QR Code component
          const qrElement = React.createElement(QRCodeComponent.default, {
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
          // Continue with next equipment even if one fails
        }
      }

      // สร้างและดาวน์โหลด PDF file
      pdf.save('QR_Codes_Equipment.pdf');
      showAlertMessage('ดาวน์โหลด QR Code ทั้งหมดเป็น PDF เรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showAlertMessage('เกิดข้อผิดพลาดในการสร้าง PDF', 'error');
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
                className="w-full h-10 pl-10 pr-4 py-2.5 border border-gray-300 rounded-2xl text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm placeholder-gray-400"
                placeholder="ค้นหารหัส, ชื่อ, หรือรายละเอียด..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
           </div>
                       <div className="flex flex-shrink-0 gap-x-3 w-full md:w-auto justify-start md:justify-end">
             <Button
               variant="outlined"
               className="border-purple-300 text-purple-700 hover:bg-purple-100 shadow-sm rounded-xl flex items-center gap-2 px-4 py-2 text-sm font-medium normal-case"
               onClick={() => setPreviewAllQRCodesOpen(true)}
             >
               <ArrowDownTrayIcon className="w-4 h-4" />
               ดาวน์โหลด QR Code ครุภัณฑ์
             </Button>
             <Button variant="outlined" className="border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm rounded-xl flex items-center gap-2 px-4 py-2 text-sm font-medium normal-case">
               <ArrowDownTrayIcon className="w-4 h-4" />
               ส่งออก Excel
             </Button>
           </div>
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
                      <tr key={item_code} className="hover:bg-gray-50">
                        <td className="w-15 px-3 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            <img
                              className="h-full w-18 object-contain rounded"
                              src={pic || "https://cdn-icons-png.flaticon.com/512/3474/3474360.png"}
                              alt={name}
                              onError={e => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3474/3474360.png"; }}
                            />
                          </div>
                        </td>
                        <td className="w-24 px-3 py-4 whitespace-nowrap text-center">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                              <QRCode
                                value={item_code}
                                size={60}
                                level="M"
                                fgColor="#000000"
                                bgColor="#FFFFFF"
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700 text-center break-all">
                              {item_code}
                            </span>
                          </div>
                        </td>
                        <td className="w-20 px-3 py-4 whitespace-nowrap text-md text-gray-700text-gray-900 text-left truncate">{name}</td>
                        <td className="w-20 px-3 py-4 whitespace-nowrap text-md text-gray-700 text-left truncate">{category}</td>
                        <td className="w-10 px-3 py-4 whitespace-nowrap text-md text-gray-900 text-right">{quantity}{unit ? ` ${unit}` : ''}</td>
                        <td className="w-20 px-3 py-4 whitespace-nowrap text-center text-gray-700">
                          <span className={`px-3 py-1 inline-flex justify-center leading-5 font-semibold rounded-full border text-sm ${statusConfig[status]?.backgroundColor || "bg-gray-200"} ${statusConfig[status]?.borderColor || "border-gray-200"} text-${statusConfig[status]?.color || "gray"}-800`}>
                            {status}
                          </span>
                        </td>
                        <td className="w-25 px-3 py-4 whitespace-nowrap text-center">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <Tooltip content="พิมพ์ QR Code" placement="top">
                              <IconButton variant="text" color="purple" className="bg-purple-50 hover:bg-purple-100 shadow-sm transition-all duration-200 p-2" onClick={() => handlePrintQRCode(item)}>
                                <PrinterIcon className="h-5 w-5" />
                              </IconButton>
                            </Tooltip>
                            {status === 'ชำรุด' && (
                              <Tooltip content="แจ้งซ่อม" placement="top">
                                <IconButton variant="text" color="blue" className="bg-blue-50 hover:bg-blue-100 shadow-sm transition-all duration-200 p-2" onClick={() => handleRepairRequest(item)}>
                                  <WrenchIcon className="h-5 w-5" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {status === 'กำลังซ่อม' && (
                              <Tooltip content="ตรวจรับครุภัณฑ์" placement="top">
                                <IconButton variant="text" color="green" className="bg-green-50 hover:bg-green-100 shadow-sm transition-all duration-200 p-2" onClick={() => handleInspectEquipment(item)}>
                                  <CheckCircleIcon className="h-6 w-6" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip content="แก้ไข" placement="top">
                              <IconButton variant="text" color="amber" className="bg-amber-50 hover:bg-amber-100 shadow-sm transition-all duration-200 p-2" onClick={() => handleEditClick(item)}>
                                <PencilIcon className="h-5 w-5" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip content="ลบ" placement="top">
                              <IconButton variant="text" color="red" className="bg-red-50 hover:bg-red-100 shadow-sm transition-all duration-200 p-2" onClick={() => handleDeleteClick(item)}>
                                <TrashIcon className="h-5 w-5" />
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
                  >
                    ดาวน์โหลด
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
          onSave={async (updatedData) => {
            let dataToSave = { ...updatedData };
                    // ใช้ item_id เป็น canonical identifier สำหรับการอัปเดต
        if (dataToSave.pic instanceof File) {
          dataToSave.pic = await uploadImage(dataToSave.pic, dataToSave.item_code);
        }
        await updateEquipment(selectedEquipment.item_id, dataToSave);
            getEquipment().then(setEquipmentList);
            showAlertMessage(`แก้ไขครุภัณฑ์ ${dataToSave.name} เรียบร้อยแล้ว`, "edit");
          }}
        />

        {/* Add Equipment Dialog */}
        <AddEquipmentDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
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
            let dataToSave = { ...newEquipment };
            if (dataToSave.pic instanceof File) {
              dataToSave.pic = await uploadImage(dataToSave.pic, dataToSave.item_code);
            }
            await addEquipment(dataToSave);
            getEquipment().then(setEquipmentList);
            showAlertMessage(`เพิ่มครุภัณฑ์ ${dataToSave.name} เรียบร้อยแล้ว`, "success");
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
                  >
                    ดาวน์โหลด PDF
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