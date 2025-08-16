import { useEffect, useState, useRef } from "react";
import { BsBoxSeamFill, BsCalendarDateFill } from "react-icons/bs";
import {
  FaCheck,
  FaChevronRight,
  FaDownload,
  FaFileAlt,
  FaMoneyBillAlt,
  FaMoneyBillWave,
  FaMoneyCheckAlt,
  FaSearch,
  FaTimes,
  FaUpload
} from "react-icons/fa";
import { RiArrowGoBackLine } from "react-icons/ri";
import QRCode from "react-qr-code";
import AlertDialog from '../../../components/Notification.jsx';
import { API_BASE, authFetch } from '../../../utils/api';

// เพิ่มฟังก์ชัน formatThaiDate ในไฟล์นี้
function formatThaiDate(dateStr) {
  if (!dateStr) return "-";
  if (dateStr instanceof Date) {
    // ถ้าเป็น Date object
    const yyyy = dateStr.getFullYear() + 543;
    const mm = String(dateStr.getMonth() + 1).padStart(2, '0');
    const dd = String(dateStr.getDate()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy}`;
  }
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${parseInt(y, 10) + 543}`;
}

const getStepIcon = (stepNumber) => {
  const iconClass = "text-lg";
  switch (stepNumber) {
    case 1:
      return <FaFileAlt className={iconClass} />;
    case 2:
      return <FaSearch className={iconClass} />;
    case 3:
      return <BsBoxSeamFill className={iconClass} />;
    case 4:
      return <RiArrowGoBackLine className={iconClass} />;
    case 5:
      return <FaMoneyBillWave className={iconClass} />;
    case 6:
      return <FaCheck className={iconClass} />;
    default:
      return <FaFileAlt className={iconClass} />;
  }
};

// PromptPay QR payload generator (minimal, inline)
function generatePromptPayPayload(phone, amount) {
  // Convert phone to 13 digits (0066xxxxxxxxx)
  let id = phone.replace(/[^0-9]/g, '');
  if (id.length === 10 && id.startsWith('0')) id = '0066' + id.slice(1);
  else if (id.length === 13 && id.startsWith('0066')) { /* ok */ }
  else return '';

  let payload =
    '000201' + // Payload Format Indicator
    '010212' + // Point of Initiation Method
    '29370016A000000677010111' + // Merchant Account Information - PromptPay
    '0113' + id + // PromptPay ID
    '5303764' + // Currency (764 = THB)
    '5802TH'; // Country

  if (amount && amount > 0) {
    let amt = Number(amount).toFixed(2);
    payload += '54' + amt.length.toString().padStart(2, '0') + amt;
  }

  payload += '6304'; // CRC
  payload += crc16(payload);
  return payload;

  function crc16(s) {
    let crc = 0xFFFF;
    for (let i = 0; i < s.length; i++) {
      crc ^= s.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
        else crc <<= 1;
      }
      crc &= 0xFFFF;
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
}

// ลบฟังก์ชัน formatThaiDate ที่ประกาศในไฟล์นี้ออก (ถ้ามี)

// ฟังก์ชันดึงวันที่ปัจจุบัน (string YYYY-MM-DD) ของไทย
function getTodayStringTH() {
  const now = new Date();
  // คำนวณเวลาปัจจุบันของไทย (Asia/Bangkok)
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const bangkok = new Date(utc + (7 * 60 * 60 * 1000));
  const yyyy = bangkok.getUTCFullYear();
  const mm = String(bangkok.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(bangkok.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// เพิ่มฟังก์ชัน mapStatusToColor
const mapStatusToColor = (status) => {
  switch (status) {
    case "carry": // ส่งมอบครุภัณฑ์
      return "badge-info";
    case "completed": // เสร็จสิ้น
      return "badge-neutral";
    case "waiting_payment": // ค้างชำระเงิน
      return "badge-error";
    case "rejected": // ไม่อนุมัติ/ปฏิเสธ
      return "badge-error";
    case "pending_approval": // รอการอนุมัติ
      return "badge-warning";
    case "pending": // รอดำเนินการ
      return "badge-warning";
    case "approved": // ได้รับการอนุมัติ
      return "badge-info";
    default:
      return "badge-neutral";
  }
};

const mapStatusToLabel = (status) => {
  switch (status) {
    case "carry":
      return "ส่งมอบครุภัณฑ์";
    case "completed":
      return "เสร็จสิ้น";
    case "waiting_payment":
      return "ค้างชำระเงิน";
    case "rejected":
      return "ปฏิเสธ";
    case "pending_approval":
      return "รอการอนุมัติ";
    case "pending":
      return "รอดำเนินการ";
    case "approved":
      return "กำลังใช้งาน";
    default:
      return status;
  }
};

function formatThaiDateTime(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const yyyy = d.getFullYear() + 543;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  // ถ้าต้องการแค่วันที่: `${dd}/${mm}/${yyyy}`
  // ถ้าต้องการวันที่+เวลา: `${dd}/${mm}/${yyyy} ${hh}:${min}`
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

const BorrowingRequestDialog = ({ request, onClose, onConfirmReceipt, onPayFine, showImageModal, activeStep, dialogShouldClose, forceOpen, afterClose }) => {
  if (!request && !showSuccessAlert) return null;

  console.log('BorrowingRequestDialog request:', request);

  // Determine current step based on status
  let currentStep = 1;
  if (typeof activeStep === 'number') {
    currentStep = activeStep;
  } else {
    if (request.status === "pending") currentStep = 2;
    if (request.status === "carry") currentStep = 3;
    if (request.status === "approved") currentStep = 4;
    if (request.status === "waiting_payment") currentStep = 5;
    if (request.status === "completed") currentStep = 6;
    if (request.status === "rejected") currentStep = 2;
  }

  // Check if we should show QR code
  const showQRCode = request.status === "carry" || request.status === "approved";
  const showReason = request.status === "rejected";
  const showFine = (request.status === "waiting_payment") || currentStep === 5;

  const [showQRDialog, setShowQRDialog] = useState(false);
  const [slipFile, setSlipFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [uploadStep, setUploadStep] = useState(1); // 1 = ยืนยันการอัพโหลด, 2 = ยืนยันการชำระเงิน
  const [isDownloadingQR, setIsDownloadingQR] = useState(false);
  const qrCodeRef = useRef(null);

  // คำนวณค่าปรับรวม
  const totalFine = Number(request.late_fine || 0) + Number(request.damage_fine || 0);

  // ฟังก์ชันแปลง QR Code เป็นไฟล์ภาพและดาวน์โหลด
  const downloadQRCode = async () => {
    if (!qrCodeRef.current || isDownloadingQR) return;

    setIsDownloadingQR(true);
    try {
      // สร้าง canvas สำหรับ QR Code
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      // ตั้งค่าพื้นหลังสีขาว
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // หา SVG element ของ QR Code ที่แสดงอยู่
      const qrSvgElement = qrCodeRef.current.querySelector('svg');
      if (!qrSvgElement) {
        throw new Error('ไม่พบ QR Code SVG element');
      }

      // แปลง SVG เป็น data URL
      const svgData = new XMLSerializer().serializeToString(qrSvgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
      const svgUrl = URL.createObjectURL(svgBlob);

      // สร้าง image จาก SVG
      const img = new Image();
      img.onload = () => {
        // วาดกรอบด้านนอกแบบสวยงาม
        ctx.strokeStyle = '#34495E'; // สีน้ำเงินเข้ม
        ctx.lineWidth = 4;
        ctx.strokeRect(15, 15, 370, 450);

        // วาดกรอบด้านในสำหรับ QR Code
        ctx.strokeStyle = '#BDC3C7'; // สีเทาอ่อน
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 50, 300, 300);

        // วาด QR Code ลงบน canvas
        ctx.drawImage(img, 55, 55, 290, 290);

                 // วาดข้อความหัวข้อ (ด้านบน)
         ctx.fillStyle = '#2C3E50'; // สีน้ำเงินเข้ม
         ctx.font = 'bold 24px Arial';
         ctx.textAlign = 'center';
         ctx.fillText('PromptPay QR Code', 200, 380);

         // วาดข้อความยอดเงิน
         ctx.fillStyle = '#E74C3C'; // สีแดง
         ctx.font = 'bold 20px Arial';
         ctx.textAlign = 'center';
         ctx.fillText(`ยอดเงิน: ${totalFine.toLocaleString()} บาท`, 200, 410);

        // แปลงเป็น blob และดาวน์โหลด
        canvas.toBlob((blob) => {
          console.log('Canvas blob created:', blob);
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `PromptPay_QR_${request.borrow_code}_${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          URL.revokeObjectURL(svgUrl);
          setIsDownloadingQR(false);
        }, 'image/png');
      };

      img.onerror = (error) => {
        console.error('Error loading SVG image:', error);
        // ลองใช้วิธีสำรอง
        try {
          // สร้าง QR Code ใหม่โดยตรง
          const qrValue = generatePromptPayPayload('0929103592', totalFine);
          const fallbackSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
              <rect width="300" height="300" fill="white"/>
              <text x="150" y="150" text-anchor="middle" dy="0.35em" font-family="Arial" font-size="24" fill="black">QR Code</text>
              <text x="150" y="180" text-anchor="middle" font-family="Arial" font-size="12" fill="black">${qrValue.substring(0, 20)}...</text>
            </svg>
          `;

          const fallbackBlob = new Blob([fallbackSvg], { type: 'image/svg+xml' });
          const fallbackUrl = URL.createObjectURL(fallbackBlob);
          const fallbackImg = new Image();

          fallbackImg.onload = () => {
            // วาดกรอบด้านนอกแบบสวยงาม
            ctx.strokeStyle = '#34495E';
            ctx.lineWidth = 4;
            ctx.strokeRect(15, 15, 370, 450);

            // วาดกรอบด้านในสำหรับ QR Code
            ctx.strokeStyle = '#BDC3C7';
            ctx.lineWidth = 2;
            ctx.strokeRect(50, 50, 300, 300);

            // วาด QR Code ลงบน canvas
            ctx.drawImage(fallbackImg, 55, 55, 290, 290);

                         // วาดข้อความหัวข้อ
             ctx.fillStyle = '#2C3E50';
             ctx.font = 'bold 24px Arial';
             ctx.textAlign = 'center';
             ctx.fillText('PromptPay QR Code', 200, 380);

             // วาดข้อความยอดเงิน
             ctx.fillStyle = '#E74C3C';
             ctx.font = 'bold 20px Arial';
             ctx.textAlign = 'center';
             ctx.fillText(`ยอดเงิน: ${totalFine.toLocaleString()} บาท`, 200, 410);

            canvas.toBlob((blob) => {
              const downloadUrl = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = `PromptPay_QR_${request.borrow_code}_${Date.now()}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(downloadUrl);
              URL.revokeObjectURL(fallbackUrl);
              setIsDownloadingQR(false);
            }, 'image/png');
          };

          fallbackImg.src = fallbackUrl;
        } catch (fallbackError) {
          console.error('Fallback error:', fallbackError);
          setIsDownloadingQR(false);
        }
      };

      img.src = svgUrl;
    } catch (error) {
      console.error('Error downloading QR code:', error);
      setIsDownloadingQR(false);
    }
  };

  // ถ้า dialogShouldClose เป็น true และ afterClose มี ให้ปิด dialog จริง
  useEffect(() => {
    if (dialogShouldClose && afterClose) {
      console.log('afterClose called');
      afterClose();
    }
  }, [dialogShouldClose, afterClose]);

  // กำหนด statusColor อัตโนมัติถ้าไม่มีมาใน request
  const statusColor = request.statusColor || mapStatusToColor(request.status);
  const statusLabel = mapStatusToLabel(request.status);

  return (
    <div className={forceOpen === false ? 'hidden' : 'modal modal-open'}>
      <div className="fixed inset-0 z-50  flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="p-4 md:p-6 space-y-6 md:space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                  <span>คำร้องขอยืม</span>
                  <FaChevronRight className="text-gray-400 text-sm hidden sm:block" />
                  <span className="text-primary">{request.id}</span>
                </h2>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span
                    className={`badge ${statusColor} text-white px-3 py-1 rounded-full text-xs md:text-sm font-medium`}
                  >
                    {statusLabel}
                  </span>
                  <span className="text-xs md:text-sm text-gray-500 flex items-center gap-1">
                    <BsCalendarDateFill className="text-gray-400 hidden sm:block" />
                    วันที่ยืม {formatThaiDate(request.borrowedDate || request.borrow_date || getTodayStringTH())} - คืน {formatThaiDate(request.dueDate || request.due_date)}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className=" text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>

            {/* QR Code Section (only for approved or received status) */}
            {showQRCode && (
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3 text-center">
                  QR Code สำหรับการยืมครุภัณฑ์
                </h3>
                <div className="p-2 bg-white rounded-lg border border-gray-200 mb-2">
                  <QRCode
                    value={
                      request.borrow_code || request.borrow_id?.toString() || request.id?.toString() || ''
                    }
                    size={128}
                    level="H"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  สแกนเพื่อตรวจสอบข้อมูลการยืม
                </p>
              </div>
            )}

            {showReason && (
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-5 border border-red-200 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-red-100 rounded-full flex-shrink-0">
                  <FaTimes className="text-red-600 text-lg" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900 text-lg flex items-center gap-2">
                    เหตุผลการปฏิเสธคำร้อง
                    <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium">
                      ไม่ได้รับการอนุมัติ
                    </span>
                  </h3>
                  <p className="text-xs text-red-700 mt-1">
                    วันที่ปฏิเสธ: {request.rejectionDate || 'ไม่ระบุวันที่'}
                  </p>
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                <div className="flex items-start gap-3 px-6">
                  <div className="text-red-500 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-red-800 font-medium mb-1">สาเหตุ</p>
                    <p className="text-red-700">{request.rejection_reason}</p>

                    {request.rejectionDetails && (
                      <div className="mt-3">
                        <p className="text-red-800 font-medium mb-1 text-sm">รายละเอียดเพิ่มเติม:</p>
                        <p className="text-red-600 text-sm">{request.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
                </div>
              </div>
            )}

            {/* Payment Section for Overdue Status */}
            {showFine && (
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-5 border border-amber-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-full">
                      <FaMoneyBillWave className="text-amber-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-900 text-lg">ค่าปรับ</h3>
                      <p className="text-xs text-amber-700">กรุณาชำระค่าปรับเพื่อดำเนินการต่อ</p>
                    </div>
                  </div>
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                    รอชำระเงิน
                  </span>
                </div>

                <div className="bg-white rounded-lg p-4 mb-5 border border-amber-100">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <FaMoneyBillWave className="text-amber-400" />
                        ค่าปรับเสียหาย
                      </p>
                      <p className="text-xl font-bold text-amber-700">
                        ฿{(request.damage_fine ?? 0).toLocaleString('th-TH')}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <FaMoneyBillWave className="text-amber-400" />
                        ค่าปรับคืนช้า
                      </p>
                      <p className="text-xl font-bold text-amber-700">
                        ฿{(request.late_fine ?? 0).toLocaleString('th-TH')} ({request.late_days ?? 0} วัน)
                      </p>
                    </div>
                  </div>

                  {/* Fine Total Only */}
                  {(Number(request.late_fine || 0) + Number(request.damage_fine || 0)) > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700 mb-2">ค่าปรับรวม</h4>
                      <div className="flex items-center gap-3 bg-gradient-to-r from-amber-200 to-amber-100 rounded-xl p-5 shadow-sm border border-amber-300">
                        <FaMoneyBillAlt className="text-3xl text-amber-500" />
                        <span className="text-2xl font-bold text-amber-800">
                          {(Number(request.late_fine || 0) + Number(request.damage_fine || 0)).toLocaleString()} บาท
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* PromptPay QR Code + Slip Upload */}
                <div className="mt-8 flex flex-col items-center justify-center">
                  <h4 className="font-medium text-gray-700 mb-3 text-center">ชำระค่าปรับผ่าน PromptPay</h4>
                  <div ref={qrCodeRef} className="relative">
                    <QRCode value={generatePromptPayPayload('0929103592', totalFine)} size={180} level="H" />
                  </div>
                  <div className="text-center text-gray-700 text-sm mt-2">
                    <div>PromptPay: <span className="font-bold text-blue-700">092-910-3592</span></div>
                    <div>ยอดเงิน: <span className="font-bold text-amber-700">{totalFine.toLocaleString()} บาท</span></div>
                  </div>
                  {/* ปุ่มดาวน์โหลด QR Code */}
                  <button
                    onClick={downloadQRCode}
                    disabled={isDownloadingQR}
                    className="mt-4 w-full max-w-xs mx-auto py-2 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold flex items-center justify-center gap-2 text-sm shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                  >
                    <FaDownload className="text-lg" />
                    {isDownloadingQR ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลด QR Code'}
                  </button>
                  {/* ปุ่มอัปโหลด/เปลี่ยนสลิป */}
                  <label
                    htmlFor="slip-upload"
                    className="mt-6 w-full max-w-xs mx-auto py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold flex items-center justify-center gap-2 text-lg shadow-lg cursor-pointer transition-transform"
                  >
                    <FaUpload className="text-2xl" />
                    {slipFile ? 'เปลี่ยนไฟล์สลิป' : 'เลือกไฟล์สลิป'}
                    <input
                      id="slip-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        setUploadError("");
                        setUploadSuccess(false);
                        setUploadStep(1);
                        const file = e.target.files[0];
                        if (!file) return;
                        setSlipFile(file);
                      }}
                    />
                  </label>
                  {/* Preview รูปภาพสลิปใน card ค่าปรับ */}
                  {slipFile && (
                    <div className="flex flex-col items-center mt-6 w-full">
                      <div className="bg-white border-2 border-blue-200 rounded-2xl shadow-lg p-4 flex flex-col items-center w-full max-w-xs mx-auto">
                        <img
                          src={URL.createObjectURL(slipFile)}
                          alt="slip preview"
                          className="w-56 h-56 object-contain rounded-xl mb-2 bg-white"
                        />
                        <span className="text-gray-500 text-xs mb-2">Preview สลิปที่เลือก</span>
                      </div>
                    </div>
                  )}
                  {/* ปุ่ม 2 สเต็ป */}
                  {slipFile && uploadStep === 1 && (
                    <button
                      className="mt-6 w-full max-w-xs mx-auto py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold flex items-center justify-center gap-2 text-lg shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                      disabled={isUploading}
                      onClick={() => setUploadStep(2)}
                    >
                      <FaUpload className="text-2xl" />
                      ยืนยันการอัพโหลด
                    </button>
                  )}
                  {slipFile && uploadStep === 2 && (
                    <button
                      className="mt-6 w-full max-w-xs mx-auto py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 text-white font-extrabold flex items-center justify-center gap-2 text-lg shadow-xl ring-2 ring-emerald-200 hover:ring-4 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-emerald-300"
                      disabled={isUploading || isConfirming}
                      onClick={async () => {
                        if (isUploading || isConfirming) return;
                        setIsUploading(true);
                        setUploadError("");
                        setUploadSuccess(false);
                                                 const formData = new FormData();
                         formData.append("borrow_code", request.borrow_code);
                         formData.append("slip", slipFile);
                         formData.append("borrow_id", request.borrow_id);
                         try {
                           // อัปโหลดสลิปไปยัง Cloudinary
                           const res = await authFetch(`${API_BASE}/returns/upload-slip-cloudinary`, {
                             method: "POST",
                             body: formData
                           });
                          if (!res.ok) throw new Error("อัปโหลดสลิปไม่สำเร็จ");
                          const data = await res.json();
                          setIsConfirming(true);
                          const confirmRes = await authFetch(`${API_BASE}/returns/confirm-payment`, {
                            method: "POST",
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              borrow_id: request.borrow_id,
                              proof_image: data.cloudinary_url || data.filename,
                              cloudinary_public_id: data.cloudinary_public_id
                            })
                          });
                          if (!confirmRes.ok) throw new Error("ยืนยันการจ่ายเงินไม่สำเร็จ");
                          setUploadSuccess(true);
                          // เรียก PATCH /api/returns/:return_id/pay เพื่อ trigger LINE Notify รายการเสร็จสิ้น
                          if (request.return_id) {
                            await authFetch(`${API_BASE}/returns/${request.return_id}/pay`, { method: "PATCH" });
                          } else {
                            console.error('ไม่พบ return_id ใน request, ไม่สามารถ trigger LINE Notify ได้');
                          }
                          // แสดง success alert
                          setShowSuccessAlert(true);
                          if (afterClose) afterClose(true);
                        } catch (err) {
                          setUploadError("เกิดข้อผิดพลาดในการอัปโหลดหรือยืนยันการจ่ายเงิน");
                        } finally {
                          setIsUploading(false);
                          setIsConfirming(false);
                        }
                      }}
                    >
                      <FaMoneyCheckAlt className="text-2xl drop-shadow-md" />
                      {(isUploading || isConfirming) ? 'กำลังดำเนินการ...' : 'ยืนยันการชำระเงิน'}
                    </button>
                  )}
                </div>
                <div className="text-center pt-2">
                  <p className="text-xs text-gray-400">
                    ระบบจะอัปเดตสถานะภายใน 1 ชั่วโมงหลังชำระเงิน
                  </p>
                </div>
              </div>
            )}

            {/* Progress Steps */}
            <div className="text-center">
              <h3 className="font-semibold text-gray-700 mb-3 md:mb-4 text-lg">
                สถานะการยืม
              </h3>
              <div className="flex justify-center">
                <div className="steps steps-horizontal md:gap-4 sm:gap-2">
                  {[1, 2, 3, 4, 5, 6].map((step) => {
                    const isActive = currentStep >= step;
                    const isRejected = request.status === "rejected" && step === 2;

                    return (
                      <div
                        key={step}
                        className={`step ${isRejected ? "step-error" : isActive ? "step-warning" : "step-neutral"}`}
                      >
                        <div
                          className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center mb-1
                            ${isRejected ? "bg-error text-white" : isActive ? "bg-warning text-black" : "bg-gray-200 text-gray-500"}`}
                          >
                            {getStepIcon(step)}
                          </div>
                          <div className="text-center text-xs md:text-sm text-gray-700 whitespace-nowrap">
                            {step === 1 && "ส่งข้อมูล"}
                            {step === 2 && (request.status === "ปฏิเสธ" ? "ปฏิเสธ" : "รอตรวจสอบ")}
                            {step === 3 && "รับครุภัณฑ์"}
                            {step === 4 && "คืนครุภัณฑ์"}
                            {step === 5 && "ชำระค่าปรับ"}
                            {step === 6 && "เสร็จสิ้น"}
                          </div>
                        </div>
                      );
                  })}
                </div>
              </div>
            </div>

            {/* Equipment List */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="font-semibold text-gray-700 text-sm">รายการครุภัณฑ์</h3>
              <div className="bg-blue-50 rounded-lg p-3 md:p-4">
                {(request.equipment || []).map((item, index) => (
                  <div key={item.item_id || index} className="flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-lg transition-colors">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.pic || "https://via.placeholder.com/500?text=No+Image"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/500?text=No+Image";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate text-sm md:text-base">{item.name}</p>
                      <div className="flex justify-between text-xs md:text-sm text-gray-500 px-1">
                        <span>รหัส: {item.item_code}</span>
                        <span>จำนวน: {item.quantity} {item.quantity > 1 ? 'ชิ้น' : 'ชุด'}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="mt-5 bg-blue-600 px-2 py-3 rounded-2xl text-white font-medium text-sm md:text-base justify-end flex">
                  รวมทั้งหมด {(request.equipment || []).reduce((sum, eq) => sum + (eq.quantity || 0), 0)} ชิ้น
                </div>
              </div>
            </div>

            {/* Borrower Name */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700 text-sm">ชื่อผู้ยืม</h3>
              <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                <p className="text-gray-700 text-sm md:text-base">{request.borrower?.name || '-'}</p>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700 text-sm">เหตุผลการขอยืม</h3>
              <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                <p className="text-gray-700 text-sm md:text-base">{request.purpose || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {/* วันที่ยืม */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700 text-sm md:text-base">วันที่ยืม</h3>
              <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                <p className="text-gray-700 text-sm md:text-base">
                  {formatThaiDate(
                    request.borrowedDate ||
                    request.borrow_date ||
                    new Date()
                  )}
                </p>
              </div>
            </div>

            {/* วันที่คืนกำหนด */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700 text-sm md:text-base">วันที่คืนกำหนด</h3>
              <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                <p className="text-gray-700 text-sm md:text-base">
                  {request.dueDate
                    ? formatThaiDate(request.dueDate)
                    : request.due_date
                    ? formatThaiDate(request.due_date)
                    : "-"}
                </p>
              </div>
            </div>

            {/* วันที่คืนจริง */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700 text-sm md:text-base">วันที่คืนจริง</h3>
              <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                <p className="text-gray-600 text-sm md:text-base">
                  {formatThaiDateTime(request.return_date)}
                </p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Success Alert */}
      <AlertDialog
        show={showSuccessAlert}
        message="🎉 ชำระเงินเสร็จสิ้น! ขอบคุณสำหรับการใช้บริการ รายการยืมของคุณได้เสร็จสิ้นเรียบร้อยแล้ว"
        type="success"
        onClose={() => {
          console.log('AlertDialog onClose called');
          setShowSuccessAlert(false);
          if (onClose) onClose();
        }}
        buttonText="ตกลง"
      />
    </div>
  );
};

export default BorrowingRequestDialog;