import React, { useEffect, useState } from "react";
import BorrowingRequestDialog from "./dialogs/BorrowingRequestDialog";
// import { globalUserData } from '../../components/Header';
import AlertDialog from '../../components/Notification.jsx';
import { FaBarcode } from "react-icons/fa";
import { MdPayment } from "react-icons/md";
import { FaMoneyCheckAlt } from "react-icons/fa";
import { authFetch } from '../../utils/api';

const Fine = () => {
  const [fineList, setFineList] = useState([]);
  const [currentImageIndices, setCurrentImageIndices] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1);
  const [dialogShouldClose, setDialogShouldClose] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Get user info from localStorage
  const userStr = localStorage.getItem('user');
  let globalUserData = null;
  if (userStr) {
    try {
      globalUserData = JSON.parse(userStr);
    } catch (e) {}
  }

  useEffect(() => {
    const user_id = globalUserData?.user_id;
    if (!user_id) {
      setLoading(false);
      setFineList([]);
      return;
    }
    authFetch(`http://localhost:5000/api/returns/summary?user_id=${user_id}`)
      .then(res => res.json())
      .then(data => {
        setFineList(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
    setSelectedRequest({ ...request });
    setActiveStep(5);
    setIsDialogOpen(true);
  };

  const closeDialog = (shouldShowAlert = false) => {
    console.log('closeDialog called');
    setIsDialogOpen(false);
    setSelectedRequest(null);
    setDialogShouldClose(false);
    if (shouldShowAlert) setShowSuccessAlert(true);
    // รีเฟรช fineList ทันที
    const user_id = globalUserData?.user_id;
    if (user_id) {
      setLoading(true);
      authFetch(`http://localhost:5000/api/returns/summary?user_id=${user_id}`)
        .then(res => res.json())
        .then(data => {
          setFineList(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  };

  function renderPaymentMethod(method) {
    if (method === "online") return "โอนผ่าน PromptPay";
    if (method === "cash") return "เงินสด";
    return "-";
  }

  // ฟังก์ชันแปลง fine_percent เป็นสภาพครุภัณฑ์และสี
  function getConditionInfo(fine_percent) {
    console.log('fine_percent received:', fine_percent);
    const percent = Number(fine_percent) || 0;
    if (percent >= 70) return { text: 'ชำรุด', color: 'bg-red-100 text-red-700 border-red-400' };
    if (percent >= 30) return { text: 'ปานกลาง', color: 'bg-yellow-100 text-yellow-800 border-yellow-400' };
    return { text: 'ดี', color: 'bg-green-100 text-green-700 border-green-400' };
  }

  // ฟังก์ชันแปลง damage_level_id เป็นข้อความและสี
  function getConditionStatus(damage_level_id) {
    switch (Number(damage_level_id)) {
      case 5:
        return { text: 'สภาพดี', color: 'bg-green-100 text-green-700 border-green-400' };
      case 6:
        return { text: 'ชำรุดเล็กน้อย', color: 'bg-yellow-100 text-yellow-800 border-yellow-400' };
      case 7:
        return { text: 'ชำรุดปานกลาง', color: 'bg-orange-100 text-orange-800 border-orange-400' };
      case 8:
        return { text: 'ชำรุดหนัก', color: 'bg-red-100 text-red-700 border-red-400' };
      case 9:
        return { text: 'สูญหาย', color: 'bg-gray-300 text-gray-800 border-gray-400' };
      default:
        return { text: 'ดี', color: 'bg-green-100 text-green-700 border-green-400' };
    }
  }

  if (loading) return <div>Loading...</div>;

  // ป้องกัน error .filter is not a function
  const safeFineList = Array.isArray(fineList) ? fineList : [];
  const pendingList = safeFineList.filter(req => req.pay_status === 'pending');
  // const paidList = fineList.filter(req => req.pay_status === 'paid'); // ลบส่วนนี้ออก

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Success Notification */}
      <AlertDialog
        show={showSuccessAlert}
        title="ชำระเงินสำเร็จ!"
        message="การชำระค่าปรับเสร็จสิ้นแล้ว ขอบคุณที่ใช้บริการ"
        type="success"
        duration={5000}
        onClose={() => setShowSuccessAlert(false)}
        actions={[
          {
            label: 'ตกลง',
            onClick: () => setShowSuccessAlert(false)
          }
        ]}
      />

      {/* กลุ่มค้างชำระ */}

      <div className="space-y-6">
        {pendingList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-red-100 rounded-full p-6 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-red-600 mb-2">ไม่พบรายการค้างชำระเงิน</h3>
            <p className="text-gray-500 text-base">คุณไม่มีรายการค้างชำระเงินในขณะนี้</p>
          </div>
        )}
        {pendingList.map((request) => {
          const currentIndex = currentImageIndices[request.borrow_id] || 0;
          const items = request.equipment || [];
          const currentItem = items[currentIndex];
          const total = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
          return (
            <div key={request.borrow_id} className="card bg-white shadow-xl overflow-hidden ">
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
                      <div className={`badge badge-error text-white md:text-base px-4 py-4 rounded-full text-sm font-medium`}>
                        ค้างชำระเงิน
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
                        <div className="flex gap-2 w-full md:w-auto">
                          <button
                            className="bg-gradient-to-r from-emerald-400 to-green-600 text-white font-bold py-2 px-8 rounded-full shadow-lg text-lg tracking-wide transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-pink-200 animate-pulse flex items-center justify-center gap-2"
                            onClick={() => openDialog(request)}
                          >
                            <FaMoneyCheckAlt className="w-6 h-6" />
                            ชำระเงิน
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Dialog for showing details (optional, if you want to keep) */}
              {isDialogOpen && selectedRequest?.borrow_id === request.borrow_id && (
                <BorrowingRequestDialog
                  request={selectedRequest}
                  onClose={() => setDialogShouldClose(true)}
                  activeStep={activeStep}
                  dialogShouldClose={dialogShouldClose}
                  forceOpen={isDialogOpen}
                  afterClose={(showAlert) => closeDialog(showAlert)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Fine;