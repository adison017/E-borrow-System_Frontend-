import React, { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { MdContentCopy } from "react-icons/md";
import BorrowingRequestDialog from "./dialogs/BorrowingRequestDialog";
// import { globalUserData } from '../../components/Header';
import AlertDialog from '../../components/Notification.jsx';
import { FaBarcode } from "react-icons/fa";
import { MdPayment } from "react-icons/md";
import { FaMoneyCheckAlt } from "react-icons/fa";
import { API_BASE, authFetch } from '../../utils/api';
import { toast } from 'react-toastify';
import { useBadgeCounts } from '../../hooks/useSocket';

const Fine = () => {
  const [fineList, setFineList] = useState([]);
  const [currentImageIndices, setCurrentImageIndices] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1);
  const [dialogShouldClose, setDialogShouldClose] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showRejectAlert, setShowRejectAlert] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [damageLevels, setDamageLevels] = useState([]); // เพิ่ม state สำหรับ damage levels

  const { subscribeToBadgeCounts } = useBadgeCounts();

  // Get user info from localStorage
  const userStr = localStorage.getItem('user');
  let globalUserData = null;
  if (userStr) {
    try {
      globalUserData = JSON.parse(userStr);
    } catch (e) {}
  }

  const fetchFineData = () => {
    const user_id = globalUserData?.user_id;
    if (!user_id) {
      setLoading(false);
      setFineList([]);
      return;
    }
    authFetch(`${API_BASE}/returns/summary?user_id=${user_id}`)
      .then(res => res.json())
      .then(data => {
        setFineList(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchFineData();
    
    // === เพิ่มฟัง event badgeCountsUpdated เพื่ออัปเดต fine list แบบ real-time ===
    const handleBadgeUpdate = () => {
      fetchFineData();
    };
    const unsubscribe = subscribeToBadgeCounts(handleBadgeUpdate);
    return unsubscribe;
    // === จบ logic ===
  }, [subscribeToBadgeCounts]);

  // Load payment settings for displaying method (PromptPay / Bank)
  useEffect(() => {
    const loadPaymentSettings = async () => {
      try {
        setPaymentLoading(true);
        const res = await authFetch(`${API_BASE}/payment-settings`);
        const data = await res.json();
        if (data?.success && data?.data) {
          setPaymentSettings(data.data);
          if (data.data.method) setSelectedMethod(data.data.method);
        }
      } catch (_) {
        // ignore UI failure silently
      } finally {
        setPaymentLoading(false);
      }
    };
    loadPaymentSettings();
  }, []);

  // Load damage levels for condition status
  useEffect(() => {
    const loadDamageLevels = async () => {
      try {
        const res = await authFetch(`${API_BASE}/damage-levels`);
        const data = await res.json();
        if (data?.success && data?.data) {
          setDamageLevels(data.data);
        }
      } catch (_) {
        // ignore UI failure silently
      }
    };
    loadDamageLevels();
  }, []);

  // รับฟัง event appNotify เพื่อแสดงข้อความที่ถูกต้อง
  useEffect(() => {
    const handleAppNotify = (event) => {
      const { type, message } = event.detail;
      if (type === 'info' && message === 'รอผู้ใช้งานทำรายการใหม่') {
        // แสดงข้อความ "รอผู้ใช้งานทำรายการใหม่" แทน success alert
        setShowSuccessAlert(false);
        setShowRejectAlert(true);
        // Message received from server
      }
    };

    window.addEventListener('appNotify', handleAppNotify);
    return () => window.removeEventListener('appNotify', handleAppNotify);
  }, []);

  

  const copyText = async (text) => {
    try {
      if (!text) return;
      await navigator.clipboard.writeText(text);
      toast.success('คัดลอกแล้ว');
    } catch {}
  };

  const handleNext = (borrowId) => {
    setCurrentImageIndices(prev => {
      const currentIndex = prev[borrowId] || 0;
      const items = fineList.find(req => req.borrow_id === borrowId)?.equipment || [];
      return {
        ...prev,
        [borrowId]: currentIndex === items.length - 1 ? 0 : currentIndex + 1
      };
    });
  };

  const openDialog = (request) => {
    setSelectedRequest({
      ...request,
      paymentMethod: selectedMethod || paymentSettings?.method || 'promptpay',
      paymentInfo: paymentSettings || {}
    });
    setActiveStep(5);
    setIsDialogOpen(true);
  };

  const closeDialog = (shouldShowAlert = false) => {
    // Close dialog function called
    const currentBorrowId = selectedRequest?.borrow_id;
    setIsDialogOpen(false);
    setSelectedRequest(null);
    setDialogShouldClose(false);
    
    // รีเฟรช fineList ทันที
    const user_id = globalUserData?.user_id;
    if (user_id) {
      refreshFines().then((updatedData) => {
        // ตรวจสอบสถานะหลังจากรีเฟรชข้อมูลแล้ว
        if (shouldShowAlert && currentBorrowId) {
          // หาข้อมูลล่าสุดจากข้อมูลที่อัปเดตแล้ว
          const updatedRequest = updatedData.find(req => req.borrow_id === currentBorrowId);
          if (updatedRequest && (updatedRequest.pay_status === 'awaiting_payment' || updatedRequest.pay_status === 'failed')) {
            // ถ้าสถานะเป็น "awaiting_payment" หรือ "failed" ไม่ต้องแสดง success alert
            // Skip success alert for pending or failed payment status
          } else {
            setShowSuccessAlert(true);
          }
        }
      });
    }
  };

  const refreshFines = () => {
    const user_id = globalUserData?.user_id;
    if (!user_id) return Promise.resolve();
    setLoading(true);
    return authFetch(`${API_BASE}/returns/summary?user_id=${user_id}`)
      .then(res => res.json())
      .then(data => {
        setFineList(data);
        setLoading(false);
        return data;
      })
      .catch(() => {
        setLoading(false);
        return [];
      });
  };



  function renderPaymentMethod(method) {
    if (method === "online") return "โอนผ่าน PromptPay";
    if (method === "cash") return "เงินสด";
    return "-";
  }

  // ฟังก์ชันแปลง fine_percent เป็นสภาพครุภัณฑ์และสี
  function getConditionInfo(fine_percent) {
            // Fine percentage received from server
    const percent = Number(fine_percent) || 0;
    if (percent >= 50) return { text: 'ชำรุด', color: 'bg-red-100 text-red-700 border-red-400' };
    if (percent >= 30) return { text: 'ปานกลาง', color: 'bg-yellow-100 text-yellow-800 border-yellow-400' };
    return { text: 'ดี', color: 'bg-green-100 text-green-700 border-green-400' };
  }

  // ฟังก์ชันแปลง damage_level_id เป็นข้อความและสี
  function getConditionStatus(damage_level_id) {
    const level = damageLevels.find(dl => dl.damage_id === Number(damage_level_id));
    if (level) {
      return { text: level.name, color: level.color_class };
    }
    return { text: 'ดี', color: 'bg-green-100 text-green-700 border-green-400' };
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
      />
    </div>
  );

     // ป้องกัน error .filter is not a function
   const safeFineList = Array.isArray(fineList) ? fineList : [];
   const pendingList = safeFineList.filter(req => ['pending','failed','awaiting_payment'].includes(req.pay_status));
  // const paidList = fineList.filter(req => req.pay_status === 'paid'); // ลบส่วนนี้ออก

  return (
    <motion.div 
      className="container mx-auto px-4 py-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Payment Method Section */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <MdPayment className="text-2xl text-emerald-600" />
              <h3 className="text-gray-800 font-semibold">ช่องทางการชำระเงิน</h3>
            </div>
            {paymentSettings?.method && (
              <span className={`text-xs px-3 py-1 rounded-full border ${paymentSettings.method === 'promptpay' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                ใช้งาน: {paymentSettings.method === 'promptpay' ? 'PromptPay' : 'โอนผ่านบัญชีธนาคาร'}
              </span>
            )}
          </div>
          {/* selector */}
          <div className="mb-4 flex items-center gap-6 text-sm">
            <label className="flex items-center gap-2 text-gray-700">
              <input type="radio" name="pay_method" checked={selectedMethod === 'promptpay'} onChange={() => setSelectedMethod('promptpay')} />
              ใช้ PromptPay
            </label>
            <label className="flex items-center gap-2 text-gray-700">
              <input type="radio" name="pay_method" checked={selectedMethod === 'bank'} onChange={() => setSelectedMethod('bank')} />
              โอนผ่านบัญชีธนาคาร
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PromptPay card */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSelectedMethod('promptpay')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedMethod('promptpay'); }}
              className={`rounded-xl border p-4 transition-all duration-200 cursor-pointer group
                ${selectedMethod === 'promptpay'
                  ? 'border-emerald-400 bg-emerald-50/60 ring-2 ring-emerald-300 shadow-md'
                  : 'border-gray-200 bg-gray-50/30 hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow'}
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FaBarcode className={`transition-colors ${selectedMethod === 'promptpay' ? 'text-emerald-600' : 'text-emerald-500 group-hover:text-emerald-600'}`} />
                  <span className="font-semibold text-gray-800">PromptPay</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedMethod === 'promptpay' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">กำลังเลือก</span>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-700 flex items-center gap-2">
                หมายเลข: <span className="font-semibold text-gray-900">{paymentSettings?.promptpay_number || '-'}</span>
                {paymentSettings?.promptpay_number && (
                  <button
                    className="ml-2 inline-flex items-center gap-1 text-emerald-700 text-xs border border-emerald-300 px-2 py-0.5 rounded hover:bg-emerald-50"
                    onClick={(e) => { e.stopPropagation(); copyText(paymentSettings.promptpay_number); }}
                  >
                    <MdContentCopy /> คัดลอก
                  </button>
                )}
              </div>
              <div className="text-[10px] text-gray-400 mt-2">คลิกเพื่อเลือกวิธีนี้</div>
            </div>
            {/* Bank card */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSelectedMethod('bank')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedMethod('bank'); }}
              className={`rounded-xl border p-4 transition-all duration-200 cursor-pointer group
                ${selectedMethod === 'bank'
                  ? 'border-blue-400 bg-blue-50/60 ring-2 ring-blue-300 shadow-md'
                  : 'border-gray-200 bg-gray-50/30 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow'}
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FaMoneyCheckAlt className={`transition-colors ${selectedMethod === 'bank' ? 'text-blue-600' : 'text-blue-500 group-hover:text-blue-600'}`} />
                  <span className="font-semibold text-gray-800">โอนผ่านบัญชีธนาคาร</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedMethod === 'bank' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">กำลังเลือก</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                <div>ธนาคาร: <span className="font-semibold text-gray-900">{paymentSettings?.bank_name || '-'}</span></div>
                <div>ชื่อบัญชี: <span className="font-semibold text-gray-900">{paymentSettings?.account_name || '-'}</span></div>
                <div className="sm:col-span-2 flex items-center gap-2">เลขที่บัญชี: <span className="font-semibold text-gray-900">{paymentSettings?.account_number || '-'}</span>
                  {paymentSettings?.account_number && (
                    <button
                      className="ml-1 inline-flex items-center gap-1 text-blue-700 text-xs border border-blue-300 px-2 py-0.5 rounded hover:bg-blue-50"
                      onClick={(e) => { e.stopPropagation(); copyText(paymentSettings.account_number); }}
                    >
                      <MdContentCopy /> คัดลอก
                    </button>
                  )}
                </div>
              </div>
              <div className="text-[10px] text-gray-400 mt-2">คลิกเพื่อเลือกวิธีนี้</div>
            </div>
          </div>
          {paymentLoading && (
            <div className="text-xs text-gray-500 mt-2">กำลังโหลดข้อมูลช่องทางชำระเงิน...</div>
          )}
        </div>
      </motion.div>
                           {/* Success Notification */}
        <AlertDialog
          show={showSuccessAlert}
          title="🎉 ชำระเงินสำเร็จ!"
          message="การชำระค่าปรับเสร็จสิ้นแล้ว ขอบคุณที่ใช้บริการ รายการยืมของคุณได้เสร็จสิ้นเรียบร้อยแล้ว"
          type="success"
          duration={3000}
          onClose={() => setShowSuccessAlert(false)}
          actions={[
            {
              label: 'ตกลง',
              onClick: () => setShowSuccessAlert(false)
            }
          ]}
        />

        {/* Reject Notification */}
        <AlertDialog
          show={showRejectAlert}
          title="⚠️ รอการดำเนินการ"
          message="รอผู้ใช้งานทำรายการใหม่ กรุณาตรวจสอบเหตุผลการปฏิเสธและอัปโหลดสลิปใหม่"
          type="warning"
          duration={5000}
          onClose={() => setShowRejectAlert(false)}
          actions={[
            {
              label: 'ตกลง',
              onClick: () => setShowRejectAlert(false)
            }
          ]}
        />



      {/* กลุ่มค้างชำระ */}

      <div className="space-y-6">
        {pendingList.length === 0 && (
          <motion.div 
            className="flex flex-col items-center justify-center py-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-red-100 rounded-full p-6 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-red-600 mb-2">ไม่พบรายการค้างชำระเงิน</h3>
            <p className="text-gray-500 text-base">คุณไม่มีรายการค้างชำระเงินในขณะนี้</p>
          </motion.div>
        )}
        {pendingList.map((request, index) => {
          const currentIndex = currentImageIndices[request.borrow_id] || 0;
          const items = request.equipment || [];
          const currentItem = items[currentIndex];
          const total = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
          return (
            <motion.div 
              key={request.borrow_id} 
              className="card bg-white shadow-xl overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.5 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="flex flex-col md:flex-row">
                {/* Image Carousel Section */}
                <div className="relative group md:w-1/3 w-full h-full md:h-auto flex items-center justify-center transition-transform duration-300 hover:scale-[1.01]">
                  <div>
                    <img
                      src={currentItem?.pic || "https://via.placeholder.com/500?text=No+Image"}
                      alt={currentItem?.name || "ครุภัณฑ์"}
                      className="object-cover w-90 h-full md:max-h-80 md:max-w-90"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/500?text=No+Image";
                      }}
                    />
                    {/* Navigation Arrows - Right Side */}
                    <div className="absolute right-0 top-0 h-full w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNext(request.borrow_id);
                        }}
                        className="h-full w-full bg-black/20 hover:bg-black/30 flex items-center justify-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                {/* Content section */}
                <div className="md:w-2/3 w-full">
                  <div className="card-body p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:justify-between justify-center md:items-start items-center gap-2">
                      <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-4 py-1 rounded-full shadow text-base tracking-wider">
                      <FaBarcode className="text-xl drop-shadow-md" />
                      {request.borrow_code}
                    </span>
                      </div>
                                             <div className={`badge ${request.pay_status === 'failed' ? 'badge-error' : (request.pay_status === 'awaiting_payment' ? 'badge-warning' : 'badge-error')} text-white md:text-base px-4 py-4 rounded-full text-sm font-medium`}>
                         {request.pay_status === 'failed' ? 'การชำระผิดพลาด' : (request.pay_status === 'awaiting_payment' ? 'รอยืนยันชำระ' : 'ค้างชำระเงิน')}
                       </div>
                    </div>

                    <div className="my-4">
                      <h3 className="font-semibold text-gray-700 mb-1">เหตุผลการขอยืม</h3>
                      <p className="text-gray-600 text-sm md:text-base">{request.purpose || '-'}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <h3 className="font-semibold text-red-700 mb-1">ค่าปรับเสียหาย</h3>
                      <p className="text-red-800 text-xl font-bold">
                        {request.damage_fine?.toLocaleString('th-TH')} บาท
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <h3 className="font-semibold text-yellow-700 mb-1">ค่าปรับคืนช้า</h3>
                      <p className="text-yellow-800 text-xl font-bold">
                        {request.late_fine?.toLocaleString('th-TH')} บาท ({request.late_days} วัน)
                      </p>
                    </div>
                    
                                         {/* แสดงเหตุผลการปฏิเสธสำหรับสถานะ failed */}
                     {request.pay_status === 'failed' && request.notes && (
                       <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                         <h3 className="font-semibold text-red-700 mb-1 flex items-center gap-2">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                           </svg>
                           เหตุผลการปฏิเสธการชำระเงิน
                         </h3>
                         <p className="text-red-800 text-sm leading-relaxed">
                           {request.notes}
                         </p>
                       </div>
                     )}
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-700 mb-2">รายการครุภัณฑ์</h3>
                      <div className="flex flex-wrap gap-2">
                        {items.map((item, index) => {
                          const cond = getConditionStatus(item.damage_level_id);
                          return (
                            <div key={item.item_id} className="mb-1">
                              <span className={`px-3 py-1 rounded-full text-xs md:text-sm ${
                                index === currentIndex
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {item.name} ({item.quantity} {item.quantity > 1 ? 'เครื่อง' : 'ชุด'})
                              </span>
                              <div className={`inline-block ml-2 px-3 py-1 rounded-lg border font-semibold text-xs md:text-sm mt-1 ${cond.color}`} style={{minWidth:'120px'}}>
                                สภาพครุภัณฑ์: {cond.text}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mb-4 grid grid-cols-3 gap-4 ">
                      <div className="bg-gray-100 px-4 py-4 rounded-lg text-sm font-medium">
                        <h3 className="font-semibold text-gray-700 mb-1">วันที่ยืม</h3>
                        <p className="text-gray-600 text-sm md:text-base">{request.borrow_date ? new Date(request.borrow_date).toLocaleDateString() : '-'}</p>
                      </div>
                      <div className="bg-gray-100 px-4 py-4 rounded-lg text-sm font-medium">
                        <h3 className="font-semibold text-gray-700 mb-1">กำหนดคืน</h3>
                        <p className="text-gray-600 text-sm md:text-base">{request.due_date ? new Date(request.due_date).toLocaleDateString() : '-'}</p>
                      </div>
                      <div className="bg-gray-100 px-4 py-4 rounded-lg text-sm font-medium">
                        <h3 className="font-semibold text-gray-700 mb-1">วันคืนจริง</h3>
                        <p className="text-gray-600 text-sm md:text-base">{request.return_date ? new Date(request.return_date).toLocaleDateString() : '-'}</p>
                      </div>
                    </div>
                                         {/* Footer */}
                     <div className="pt-4 border-t border-gray-200 mt-auto">
                       <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                         <div className="text-gray-700 font-medium text-sm md:text-base">
                           รวมทั้งหมด {total} ชิ้น
                         </div>
                         {/* แสดงปุ่มสำหรับสถานะ "รอชำระ" และ "การชำระผิดพลาด" (ไม่แสดงสำหรับ awaiting_payment) */}
                         {(request.pay_status === 'pending' || request.pay_status === 'failed') && (
                           <div className="flex gap-2 w-full md:w-auto">
                             <button
                               className={`font-bold py-2 px-8 rounded-full shadow-lg text-lg tracking-wide transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 animate-pulse flex items-center justify-center gap-2 ${
                                 request.pay_status === 'failed' 
                                   ? 'bg-gradient-to-r from-orange-400 to-red-600 text-white focus:ring-orange-200' 
                                   : 'bg-gradient-to-r from-emerald-400 to-green-600 text-white focus:ring-pink-200'
                               }`}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 openDialog(request);
                               }}
                             >
                               <FaMoneyCheckAlt className="w-6 h-6" />
                               {request.pay_status === 'failed' ? 'ทำรายการใหม่' : 'ชำระเงิน'}
                             </button>
                           </div>
                         )}
                       </div>
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Dialog for showing details */}
      {isDialogOpen && selectedRequest && (
        <BorrowingRequestDialog
          request={selectedRequest}
          onClose={() => setDialogShouldClose(true)}
          activeStep={activeStep}
          dialogShouldClose={dialogShouldClose}
          forceOpen={isDialogOpen}
          afterClose={(showAlert) => closeDialog(showAlert)}
        />
      )}
    </motion.div>
  );
};

export default Fine;