import { AiFillAlert } from "react-icons/ai"; 
import { ExclamationTriangleIcon, InformationCircleIcon, ExclamationCircleIcon, XCircleIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { ArrowPathIcon, CheckCircleIcon as CheckCircleSolidIcon, ClipboardDocumentListIcon, DocumentCheckIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import { FaCheckCircle, FaInfoCircle, FaExclamationTriangle, FaExclamationCircle, FaTimesCircle } from "react-icons/fa";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Button } from "@material-tailwind/react";
import { API_BASE, authFetch, UPLOAD_BASE } from '../../../utils/api';
import DocumentViewer from '../../../components/DocumentViewer';
// import { globalUserData } from '../../../components/Header.jsx';
dayjs.extend(utc);
dayjs.extend(timezone);

const ReturnFormDialog = ({
  borrowedItem,
  isOpen,
  onClose,
  onConfirm,
  isOverdue,
  fineAmount,
  setFineAmount,
  showNotification,
  paymentDetails,
}) => {
  const [returnCondition, setReturnCondition] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [damageLevels, setDamageLevels] = useState([]);
  const [selectedDamageLevelId, setSelectedDamageLevelId] = useState(null);
  const [damageLevelDetail, setDamageLevelDetail] = useState("");
  const [showUploadSlip, setShowUploadSlip] = useState(false);
  const [slipFile, setSlipFile] = useState(null);
  const [isVerifyingSlip, setIsVerifyingSlip] = useState(false);
  const [slipVerifyResult, setSlipVerifyResult] = useState(null);
  const [itemConditions, setItemConditions] = useState({}); // เก็บสภาพรายชิ้น

  // Image modal states
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    imageUrl: '',
    title: ''
  });

  const userId = borrowedItem?.user_id; // ผู้ยืม
  // Get returnById (ผู้ตรวจรับ) จาก localStorage
  const userStr = localStorage.getItem('user');
  let globalUserData = null;
  if (userStr) {
    try {
      globalUserData = JSON.parse(userStr);
    } catch (e) {}
  }
  const returnById = globalUserData?.user_id; // ผู้ตรวจรับ

  // fallback ถ้า parent ไม่ได้ส่ง showNotification มา
  const notify = showNotification || ((msg, type) => alert(msg));

  useEffect(() => {
    const token = localStorage.getItem('token');
    // FRONTEND: Fetching damage levels
    fetch(`${API_BASE}/damage-levels`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        // FRONTEND: Received damage levels
        // ตรวจสอบว่า data เป็น array หรือมี data property
        if (Array.isArray(data)) {
          setDamageLevels(data);
        } else if (data && data.success && Array.isArray(data.data)) {
          setDamageLevels(data.data);
        } else {
          setDamageLevels([]);
        }
      })
      .catch(err => {
        // FRONTEND: Error fetching damage levels
        console.error('Error fetching damage levels:', err);
        setDamageLevels([]);
      });
  }, []);

  useEffect(() => {
    if (selectedDamageLevelId) {
      const found = damageLevels.find(dl => dl.damage_id === Number(selectedDamageLevelId));
      setDamageLevelDetail(found ? found.detail : "");
    } else {
      setDamageLevelDetail("");
    }
  }, [selectedDamageLevelId, damageLevels]);

  useEffect(() => {
    if (!selectedDamageLevelId || !damageLevels.length || !borrowedItem || !borrowedItem.equipment) {
      setFineAmount(0);
      return;
    }
    const level = damageLevels.find(dl => dl.damage_id === Number(selectedDamageLevelId) || dl.id === Number(selectedDamageLevelId));
    if (level) {
      let totalPrice = 0;
      if (Array.isArray(borrowedItem.equipment)) {
        totalPrice = borrowedItem.equipment.reduce((sum, eq) => sum + (Number(eq.price || 0) * (eq.quantity || 1)), 0);
      } else if (borrowedItem.equipment) {
        totalPrice = Number(borrowedItem.equipment.price || 0) * (borrowedItem.equipment.quantity || 1);
      }
      const fine = Math.round((Number(level.fine_percent) / 100) * totalPrice);
      setFineAmount(fine);
    } else {
      setFineAmount(0);
    }
  }, [selectedDamageLevelId, damageLevels, borrowedItem]);

  // สมมุติค่าปรับล่าช้าต่อวัน
  const LATE_FINE_PER_DAY = 20;
  const dueDate = borrowedItem?.due_date ? new Date(borrowedItem.due_date) : null;
  const returnDate = getThailandNow(); // วันคืนจริง (ปัจจุบัน)
  // วันถัดจาก dueDate คือวันที่เริ่มคิดค่าปรับ
  const lateStartDate = dueDate ? new Date(dueDate) : null;
  if (lateStartDate) lateStartDate.setDate(lateStartDate.getDate() + 1);
  const msPerDay = 1000 * 60 * 60 * 24;
  const overdayCount = (lateStartDate && returnDate >= lateStartDate)
    ? Math.floor((returnDate - lateStartDate) / msPerDay) + 1
    : 0;
  const lateFineAmount = overdayCount * LATE_FINE_PER_DAY;

  // รวมค่าปรับล่าช้าและค่าปรับเสียหาย
  const totalFineAmount = fineAmount + lateFineAmount;

  const equipmentItems = Array.isArray(borrowedItem?.equipment)
    ? borrowedItem.equipment
    : borrowedItem?.equipment
      ? [borrowedItem.equipment]
      : [];
  // คำนวณค่าเสียหายรวมจากแต่ละชิ้น (เปอร์เซ็นต์ * ราคา)
  const fineAmountValue = equipmentItems.reduce((sum, eq) => {
    const cond = itemConditions[eq.item_id];
    if (!cond || !cond.damageLevelId) return sum;
    const level = damageLevels.find(dl => String(dl.damage_id) === String(cond.damageLevelId));
    if (!level || !level.fine_percent) return sum;
    const price = Number(eq.price || 0);
    const percent = Number(level.fine_percent) / 100;
    return sum + Math.round(price * percent * (eq.quantity || 1));
  }, 0);
  const totalAmount = lateFineAmount + fineAmountValue;

  useEffect(() => {
    if (isOpen) {
      setReturnCondition("");
      setReturnNotes("");
      setPaymentMethod("cash");
      setIsSubmitting(false);
      setSelectedDamageLevelId(null);
      setDamageLevelDetail("");
      setShowUploadSlip(false);
      setSlipFile(null);
      setIsVerifyingSlip(false);
      setSlipVerifyResult(null);
      setItemConditions({}); // รีเซ็ตสภาพรายชิ้นเมื่อเปิด dialog
    }
  }, [isOpen]);

  if (!isOpen || !borrowedItem) return null;

  // Debug: Check important_documents data

  const handleConfirm = () => {
    setIsSubmitting(true);
    try {
      onConfirm({
        borrowedItem,
        returnCondition,
        returnNotes,
        fineAmount,
        paymentMethod,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const conditionOptions = [
    { value: "good", label: "สภาพดี", color: "success" },
    { value: "minor_damage", label: "ชำรุดเล็กน้อย", color: "warning" },
    { value: "major_damage", label: "ชำรุดหนัก", color: "error" },
    { value: "lost", label: "สูญหาย", color: "error" },
  ];

  const paymentMethods = [
    { 
      value: "cash", 
      label: "เงินสด",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      value: "online", 
      label: "ออนไลน์",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
  ];

  // --- UI สำหรับเลือกสภาพและหมายเหตุรายชิ้น ---
  // ใส่ไว้ก่อนปุ่มยืนยัน
  // <div className="mb-6">
  //   <h3 className="font-bold mb-2">สภาพครุภัณฑ์แต่ละชิ้น</h3>
  //   {equipmentItems.map(eq => (
  //     <div key={eq.item_id} className="mb-4 p-2 border rounded bg-gray-50">
  //       <div className="font-semibold mb-1">{eq.name} ({eq.item_code})</div>
  //       <select
  //         className="w-full p-2 border rounded mb-1"
  //         value={itemConditions[eq.item_id]?.damageLevelId || ''}
  //         onChange={e => setItemConditions(prev => ({
  //           ...prev,
  //           [eq.item_id]: {
  //             ...prev[eq.item_id],
  //             damageLevelId: e.target.value
  //           }
  //         }))}
  //       >
  //         <option value="">เลือกสภาพ</option>
  //         {damageLevels.map(dl => (
  //           <option key={dl.damage_id} value={dl.damage_id}>{dl.detail}</option>
  //         ))}
  //       </select>
  //       <textarea
  //         className="w-full p-2 border rounded"
  //         placeholder="หมายเหตุ (ถ้ามี)"
  //         value={itemConditions[eq.item_id]?.note || ''}
  //         onChange={e => setItemConditions(prev => ({
  //           ...prev,
  //           [eq.item_id]: {
  //             ...prev[eq.item_id],
  //             note: e.target.value
  //           }
  //         }))}
  //       />
  //     </div>
  //   ))}
  // </div>

  const handleSubmit = async () => {
    // Validate ข้อมูลก่อนส่ง
    if (!borrowedItem?.borrow_id) {
      notify('ไม่พบข้อมูลการยืม', 'error');
      alert('ไม่พบข้อมูลการยืม');
      return;
    }
    if (!userId) {
      notify('ไม่พบข้อมูลผู้คืน (userId)', 'error');
      alert('ไม่พบข้อมูลผู้คืน (userId)');
      return;
    }
    if (!returnById) {
      notify('ไม่พบข้อมูลผู้ตรวจรับคืน (return_by)', 'error');
      alert('ไม่พบข้อมูลผู้ตรวจรับคืน (return_by)');
      return;
    }
    const missing = equipmentItems.filter(eq => !itemConditions[eq.item_id] || !itemConditions[eq.item_id].damageLevelId);
    if (missing.length > 0) {
      notify('กรุณาเลือกสภาพครุภัณฑ์ให้ครบทุกชิ้น', 'error');
      alert('กรุณาเลือกสภาพครุภัณฑ์ให้ครบทุกชิ้น');
      return;
    }
    setIsSubmitting(true);
    // หา damage level object
    const selectedDamageLevel = damageLevels.find(dl => dl.damage_id === Number(selectedDamageLevelId) || dl.id === Number(selectedDamageLevelId));
    const proofImage = null;

    // === เพิ่ม logic คำนวณ fine_amount ของแต่ละชิ้น ===
    // FRONTEND: Original itemConditions, Equipment items, Damage levels

    const itemConditionsWithFine = {};
    equipmentItems.forEach(eq => {
      const cond = itemConditions[eq.item_id] || {};
      // FRONTEND: Processing equipment

      const level = damageLevels.find(dl => String(dl.damage_id) === String(cond.damageLevelId));
              // FRONTEND: Found damage level

      let fine = 0;
      if (level && level.fine_percent) {
        const price = Number(eq.price || 0);
        const percent = Number(level.fine_percent) / 100;
        fine = Math.round(price * percent * (eq.quantity || 1));
        // FRONTEND: Calculated fine
      }
      itemConditionsWithFine[eq.item_id] = {
        ...cond,
        fine_amount: fine
      };
    });
    // FRONTEND: Final itemConditionsWithFine
    // === จบ logic ===

    const payload = {
      borrow_id: borrowedItem.borrow_id,
      return_date: getThailandNowString(),
      return_by: returnById, // ผู้ตรวจรับ
      user_id: userId,      // ผู้ยืม
      // condition_level_id, condition_text ไม่ต้องส่งถ้าใช้ per-item
      fine_amount: fineAmountValue + lateFineAmount, // ใช้ค่ารวม per-item + ค่าปรับล่าช้า
      damage_fine: fineAmountValue,                  // ใช้ค่ารวม per-item จริง
      late_fine: lateFineAmount,
      late_days: overdayCount,
      proof_image: proofImage || null,
      status: 'pending',
      notes: returnNotes || '',
      pay_status: (paymentMethod === 'online') ? 'pending' : 'paid',
      paymentMethod,
      item_conditions: itemConditionsWithFine, // ส่งแบบใหม่
    };
    // submit payload
    notify('กำลังส่งข้อมูลการคืน... ดู log เพิ่มเติมใน console', 'info');
    try {
      const res = await authFetch(`${API_BASE}/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
              // API /returns response
      if (!res.ok) {
        const errText = await res.text();
                  // API /returns error
        alert('เกิดข้อผิดพลาดในการบันทึกการคืน: ' + errText);
        throw new Error('เกิดข้อผิดพลาดในการบันทึกการคืน: ' + errText);
      }
      // === Logic การอัปเดตสถานะครุภัณฑ์ถูกย้ายไปจัดการใน backend แล้ว ===
      // Backend จะตรวจสอบสภาพครุภัณฑ์และอัปเดตสถานะเป็น 'complete' หรือ 'พร้อมใช้งาน' ตามเงื่อนไข
      // === จบ logic ===
      if (typeof onConfirm === 'function') {
        onConfirm(); // เรียกหลัง API สำเร็จเท่านั้น
      }
      onClose();
    } catch (err) {
      // Return error
      notify(err.message || 'เกิดข้อผิดพลาดในการบันทึกการคืน', 'error');
      alert('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่ทราบสาเหตุ'));
      setIsSubmitting(false);
    }
  };

  // ฟังก์ชัน mapping สีและไอคอนตาม damage level
  const getDamageLevelStyle = (level) => {
    if (!level) return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: null };
    switch (level.name) {
      case 'สภาพดี':
        return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: <CheckCircleSolidIcon className="w-5 h-5 text-green-400 inline mr-1" /> };
      case 'ชำรุดเล็กน้อย':
        return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: <InformationCircleIcon className="w-5 h-5 text-blue-400 inline mr-1" /> };
      case 'ชำรุดปานกลาง':
        return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 inline mr-1" /> };
      case 'ชำรุดหนัก':
        return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: <ExclamationCircleIcon className="w-5 h-5 text-orange-400 inline mr-1" /> };
      case 'สูญหาย':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: <XCircleIcon className="w-5 h-5 text-red-400 inline mr-1" /> };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: null };
    }
  };

  // เพิ่มฟังก์ชัน getThailandNow
  function getThailandNow() {
    // ใช้ toLocaleString เพื่อให้ได้เวลาตาม timezone ไทย แล้วแปลงกลับเป็น Date
    const tzDateStr = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' });
    return new Date(tzDateStr);
  }

  function getThailandNowString() {
    return dayjs().tz("Asia/Bangkok").format("YYYY-MM-DD HH:mm:ss");
  }

  const handleUploadSlip = async (e) => {
    const file = e.target.files[0];
    setSlipFile(file);
    setIsVerifyingSlip(true);
    try {
      // 1) อัปโหลดไฟล์สลิปไป cloudinary
      const fd = new FormData();
      fd.append('slip', file);
      fd.append('borrow_code', borrowedItem?.borrow_code || 'unknown');
      const uploadRes = await authFetch(`${API_BASE}/returns/upload-slip-cloudinary`, {
        method: 'POST',
        body: fd
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson?.message || 'อัปโหลดสลิปไม่สำเร็จ');
      const slipUrl = uploadJson.cloudinary_url || uploadJson.file_path || uploadJson.url;

      // 2) ส่ง URL ให้ backend บันทึก และตั้งสถานะเป็น pending เพื่อรอแอดมินตรวจสอบ
      const submitRes = await authFetch(`${API_BASE}/returns/submit-slip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ borrow_id: borrowedItem?.borrow_id, slip_url: slipUrl })
      });
      const submitJson = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitJson?.message || 'ส่งสลิปไม่สำเร็จ');

      setSlipVerifyResult({ success: true, message: 'อัปโหลดและส่งสลิปสำเร็จ รอแอดมินตรวจสอบ' });
    } catch (err) {
      setSlipVerifyResult({ success: false, message: err.message || "เกิดข้อผิดพลาดในการอัปโหลดสลิป" });
    } finally {
      setIsVerifyingSlip(false);
    }
  };

  const handleViewImage = (imagePath, title) => {
    if (!imagePath) return;

    // สร้าง URL สำหรับรูปภาพ
    let imageUrl;
    if (imagePath.startsWith('http')) {
      imageUrl = imagePath;
    } else {
      imageUrl = `${UPLOAD_BASE}/uploads/${imagePath}`;
    }

    setImageModal({
      isOpen: true,
      imageUrl: imageUrl,
      title: title
    });
  };

  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      imageUrl: '',
      title: ''
    });
  };

  const isReadOnly = borrowedItem?.status === 'waiting_payment';

  return (
    <div className="modal modal-open">
        <div data-theme="light" className="max-w-8xl w-full h-full max-h-[95vh] rounded-2xl shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex flex-col h-full">
            {/* Enhanced Header with gradient and status badge */}
            <div className="sticky z-10 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg rounded-2xl">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                      <DocumentCheckIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-bold text-white">
                          บันทึกการคืนครุภัณฑ์
                        </h2>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-white">
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          รหัส: <span className="font-mono font-semibold text-white">{borrowedItem.borrow_code || '-'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all duration-200 hover:scale-105"
                  >
                    <MdClose className="w-6 h-6" />
                  </button>
                </div>
              </div>
              {/* Decorative wave */}
              <div className="h-4 bg-gradient-to-r from-blue-500 to-indigo-600 mb-3">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
                  <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="currentColor" className="text-blue-50"></path>
                  <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="currentColor" className="text-blue-50"></path>
                  <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="currentColor" className="text-blue-50"></path>
                </svg>
              </div>
            </div>

            <div className="overflow-y-auto p-6 flex-grow bg-gradient-to-b from-transparent to-blue-50/30">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Borrower Info */}
            <div className="space-y-6 lg:order-1">
              {/* SectionHeader component */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500 rounded-xl shadow-md">
                  <span className="text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-800">ข้อมูลผู้ยืม</h4>
                  <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-200 shadow-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                        <img
                          src={
                            borrowedItem?.borrower?.avatar
                              ? borrowedItem.borrower.avatar.startsWith('http')
                                ? borrowedItem.borrower.avatar
                                : `${UPLOAD_BASE}/user/${borrowedItem.borrower.avatar}`
                              : '/profile.png'
                          }
                          alt={borrowedItem?.borrower?.name}
                          className="w-full h-full object-cover"
                          onClick={() => handleViewImage(
                            borrowedItem?.borrower?.avatar
                              ? borrowedItem.borrower.avatar.startsWith('http')
                                ? borrowedItem.borrower.avatar
                                : `${UPLOAD_BASE}/user/${borrowedItem.borrower.avatar}`
                              : null,
                            `รูปภาพนิสิต - ${borrowedItem.borrower.name}`
                          )}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/profile.png';
                          }}
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                        <CheckCircleSolidIcon className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="font-bold text-xl text-gray-800">{borrowedItem.borrower.name}</h3>
                      {borrowedItem.borrower.position && (
                        <p className="text-blue-600 font-medium">{borrowedItem.borrower.position}</p>
                      )}
                      {borrowedItem.borrower.department && (
                        <p className="text-gray-600 text-sm bg-gray-100 px-3 py-1 rounded-full inline-block">{borrowedItem.borrower.department}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {isOverdue && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-pulse">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-700">พบการคืนล่าช้า!</h3>
                    <div className="text-sm text-red-600">
                      คืนช้า {overdayCount} วัน มีค่าปรับ {lateFineAmount} บาท
                    </div>
                  </div>
                </div>
              )}

              {/* รูปภาพการยืม */}
              <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">รูปภาพการยืม</h3>
                    <p className="text-xs text-gray-500">หลักฐานการยืมครุภัณฑ์</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* ลายเซ็นการยืม */}
                  {borrowedItem?.signature_image && (
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-full shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-gray-800 text-sm">ลายเซ็นการยืม</h4>
                      </div>
                      <button
                        onClick={() => handleViewImage(borrowedItem.signature_image, 'ลายเซ็นการยืม')}
                        className="bg-blue-500  text-white px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 flex items-center gap-1 font-medium text-xs"
                        title="ดูภาพ"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        ดูภาพ
                      </button>
                    </div>
                  )}

                  {/* รูปถ่ายส่งมอบครุภัณฑ์ */}
                  {borrowedItem?.handover_photo && (
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-full shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-gray-800 text-sm">รูปถ่ายส่งมอบครุภัณฑ์</h4>
                      </div>
                      <button
                        onClick={() => handleViewImage(borrowedItem.handover_photo, 'รูปถ่ายส่งมอบครุภัณฑ์')}
                        className="bg-blue-500  text-white px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 flex items-center gap-1 font-medium text-xs"
                        title="ดูภาพ"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        ดูภาพ
                      </button>
                    </div>
                  )}

                  {/* แสดงข้อความเมื่อไม่มีรูปภาพ */}
                  {!borrowedItem?.signature_image && !borrowedItem?.handover_photo && (
                    <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-emerald-200">
                      <div className="bg-gradient-to-r from-emerald-100 to-teal-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-600">ไม่มีรูปภาพการยืม</p>
                      <p className="text-xs text-gray-400 mt-1">ยังไม่มีการอัปโหลดรูปภาพหลักฐาน</p>
                    </div>
                  )}
                </div>
                </div>
              </div>

              {/* เอกสารสำคัญที่แนบ */}
              <DocumentViewer
                documents={borrowedItem.important_documents || []}
                title="เอกสารสำคัญที่แนบ"
              />
            </div>

            {/* Equipment List and Form */}
            <div className="lg:col-span-2 space-y-6 lg:order-2">
              {/* Equipment List */}
              <div className="space-y-4">
                {/* SectionHeader for equipment */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500 rounded-xl shadow-md">
                    <span className="text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">รายการครุภัณฑ์ที่คืน</h4>
                    <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
                {/* Equipment Summary Card */}
                <div className="bg-black rounded-4xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">สรุปรายการ</h3>
                      <p className="text-white">จำนวนครุภัณฑ์ทั้งหมด</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{equipmentItems?.reduce((total, eq) => total + (eq.quantity || 1), 0) || 0}</div>
                      <div className="text-sm text-white">รายการ</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-4xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="overflow-x-auto">
                    <div className="min-w-[340px]">
                      <table className="min-w-full">
                        <thead className="bg-blue-500">
                          <tr>
                            <th className="px-4 py-4 text-center text-sm font-semibold text-white uppercase tracking-wider">รูป</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">ครุภัณฑ์</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-white uppercase tracking-wider">จำนวน</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-100">
                          {equipmentItems.length > 0 ? equipmentItems.map((item, index) => (
                            <tr key={item.item_id || index} className="hover:bg-blue-50/50 transition-colors duration-200">
                              <td className="px-4 py-4 text-center">
                                <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center mx-auto border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
                                  <img
                                    src={item.pic?.startsWith('http') ? item.pic : `${UPLOAD_BASE}/equipment/${item.item_code || item.code}.jpg`}
                                    alt={item.name}
                                    className="max-w-full max-h-full object-contain p-2"
                                    onError={e => { e.target.onerror = null; e.target.src = '/lo.png'; }}
                                  />
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-800 text-base leading-tight">{item.name}</span>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded-md">
                                      {item.item_code}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white font-bold text-lg rounded-full shadow-md">
                                  {item.quantity || 1}
                                </div>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={3} className="p-12 text-center">
                                <div className="flex flex-col items-center gap-3">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                                  <p className="text-gray-400 text-lg">ไม่พบข้อมูลครุภัณฑ์</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Return Form */}
              <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500 rounded-xl shadow-md">
                    <span className="text-white">
                      <ClipboardDocumentListIcon className="w-5 h-5" />
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">ข้อมูลการคืน</h4>
                    <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* สภาพครุภัณฑ์รายชิ้น */}
                  {equipmentItems.map(eq => (
                    <div
                      key={eq.item_id}
                      className="mb-6 p-4 border border-blue-100 rounded-2xl bg-gradient-to-br from-blue-50 to-white shadow-md transition-all duration-200 hover:shadow-lg group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-200 rounded-full p-2 shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </div>
                        <div>
                          <div className="font-bold text-blue-900 text-base leading-tight">{eq.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5 leading-tight">{eq.item_code}</div>
                        </div>
                      </div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1 mt-2" htmlFor={`condition-select-${eq.item_id}`}>เลือกสภาพครุภัณฑ์</label>
                      <div className="relative">
                        <select
                          id={`condition-select-${eq.item_id}`}
                          className="w-full p-2.5 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 text-gray-800 bg-white transition-all duration-150 appearance-none pr-10 shadow-sm hover:border-blue-400"
                          value={itemConditions[eq.item_id]?.damageLevelId || ''}
                          onChange={e => {
                            console.log(`[FRONTEND] User selected damage level for ${eq.item_code} (item_id: ${eq.item_id}):`, e.target.value);
                            setItemConditions(prev => {
                              const newState = {
                                ...prev,
                                [eq.item_id]: {
                                  ...prev[eq.item_id],
                                  damageLevelId: e.target.value
                                }
                              };
                              console.log(`[FRONTEND] Updated itemConditions state:`, newState);
                              return newState;
                            });
                          }}
                        >
                          <option value="">เลือกสภาพ</option>
                          {Array.isArray(damageLevels) && damageLevels
                            .sort((a, b) => Number(a.fine_percent) - Number(b.fine_percent))
                            .map(dl => {
                            let badge = '';
                            if (dl.name?.includes('ดี')) badge = '🟢';
                            else if (dl.name?.includes('เล็กน้อย')) badge = '🟡';
                            else if (dl.name?.includes('ปานกลาง')) badge = '🟠';
                            else if (dl.name?.includes('หนัก')) badge = '🔴';
                            else if (dl.name?.includes('สูญหาย')) badge = '⚫';
                            return (
                              <option key={dl.damage_id} value={dl.damage_id}>
                                {badge} {dl.name} {dl.fine_percent !== undefined && dl.fine_percent !== null ? `${dl.fine_percent}%` : ''}
                              </option>
                            );
                          })}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                      {/* แสดง detail ของ damageLevels ที่เลือกเป็นข้อความเล็กๆ พร้อม badge สี */}
                      {(() => {
                        const selectedId = itemConditions[eq.item_id]?.damageLevelId;
                        const selectedLevel = Array.isArray(damageLevels) ? damageLevels.find(dl => String(dl.damage_id) === String(selectedId)) : null;
                        if (!selectedLevel || !selectedLevel.detail) return null;
                        return (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                            <div className="text-sm text-blue-800 font-medium">
                              {selectedLevel.detail}
                            </div>
                          </div>
                        );
                      })()}
                      <label className="block text-xs font-medium text-gray-500 mb-1 mt-2" htmlFor={`note-${eq.item_id}`}>หมายเหตุเพิ่มเติม (ถ้ามี)</label>
                      <textarea
                        id={`note-${eq.item_id}`}
                        className="w-full p-2.5 border-2 border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 text-gray-700 bg-white transition-all duration-150 shadow-sm resize-none min-h-[44px] hover:border-blue-300 placeholder-gray-400"
                        placeholder="ระบุรายละเอียดเพิ่มเติม เช่น รอยขีดข่วน, อุปกรณ์ขาด ฯลฯ"
                        value={itemConditions[eq.item_id]?.note || ''}
                        onChange={e => setItemConditions(prev => ({
                          ...prev,
                          [eq.item_id]: {
                            ...prev[eq.item_id],
                            note: e.target.value
                          }
                        }))}
                      />
                    </div>
                  ))}
                  {/* ค่าปรับ */}
                  <div className="md:col-span-2">
                    <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 mb-2">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500 rounded-xl shadow-md">
                          <span className="text-white">
                            <ExclamationTriangleIcon className="w-5 h-5" />
                          </span>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-800">สรุปค่าปรับ</h4>
                          <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">ค่าปรับล่าช้า</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 rounded-lg border-transparent bg-gray-100"
                            value={lateFineAmount.toLocaleString()}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">ค่าเสียหาย</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border-transparent rounded-lg bg-gray-100"
                            value={fineAmountValue.toLocaleString()}
                            readOnly
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">รวมทั้งสิ้น</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg bg-blue-50 font-bold text-blue-700 text-lg"
                            value={totalAmount.toLocaleString()}
                            readOnly
                          />
                        </div>
                        {totalAmount > 0 && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">วิธีการชำระค่าปรับ</label>
                            <div className="flex gap-3">
                              {paymentMethods.map((method) => (
                                <button
                                  key={method.value}
                                  type="button"
                                  onClick={() => setPaymentMethod(method.value)}
                                  className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                                    paymentMethod === method.value
                                      ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                                  }`}
                                >
                                  {method.icon}
                                  {method.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

            {/* Enhanced Footer */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 rounded-2xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Status info on left */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">ฟอร์มบันทึกการคืน</p>
                    <p className="text-xs text-white">กรุณาตรวจสอบข้อมูลก่อนยืนยัน</p>
                  </div>
                </div>
                
                {/* Action buttons on right */}
                <div className="flex justify-end gap-3">
                  <button
                    className="btn bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-gray-400 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={onClose}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className={`btn text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-transparent ${
                      isSubmitting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r bg-green-600 hover:bg-green-700"
                    }`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 bg-gray-200 border-transparent rounded-full animate-spin"></div>
                        กำลังดำเนินการ...
                      </>
                    ) : (
                      <>
                        <CheckCircleSolidIcon className="w-5 h-5" />
                        ยืนยันการคืน
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={onClose}>close</button>
        </form>
      </div>

      {/* Image Modal */}
      {imageModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="relative max-w-6xl max-h-[95vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                  <PhotoIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{imageModal.title}</h3>
                  <p className="text-sm text-gray-500">คลิกปุ่มปิดหรือกด ESC เพื่อออกจากมุมมอง</p>
                </div>
              </div>
              <button
                onClick={closeImageModal}
                className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-3 rounded-full hover:bg-gray-100 hover:scale-110 shadow-sm"
              >
                <MdClose className="w-7 h-7" />
              </button>
            </div>

            {/* Image Container */}
            <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="flex justify-center">
                <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200/50 max-w-5xl">
                  <img
                    src={imageModal.imageUrl}
                    alt={imageModal.title}
                    className="max-w-full max-h-[75vh] object-contain rounded-2xl"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/lo.png';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center p-6 border-t border-gray-200/50 bg-gradient-to-r from-white to-gray-50">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>รูปภาพนี้เป็นส่วนหนึ่งของหลักฐานการยืม-คืนครุภัณฑ์</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnFormDialog;