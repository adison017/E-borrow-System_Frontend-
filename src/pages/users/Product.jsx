import { Button, Menu, MenuHandler, MenuItem, MenuList } from "@material-tailwind/react";
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { MdAdd, MdRemove, MdSearch, MdShoppingCart } from "react-icons/md";
// import { globalUserData } from '../../components/Header';
import Notification from '../../components/Notification';
import { getCategories, getEquipment, updateEquipmentStatus, authFetch } from '../../utils/api'; // เพิ่ม updateEquipmentStatus
import BorrowDialog from './dialogs/BorrowDialog';
import EquipmentDetailDialog from './dialogs/EquipmentDetailDialog';
import ImageModal from './dialogs/ImageModal';

// ฟังก์ชันดึงวันพรุ่งนี้ของไทย (string YYYY-MM-DD)
function getTomorrowTH() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const bangkok = new Date(utc + (7 * 60 * 60 * 1000));
  bangkok.setDate(bangkok.getDate() + 1);
  const yyyy = bangkok.getUTCFullYear();
  const mm = String(bangkok.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(bangkok.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ทั้งหมด');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [quantities, setQuantities] = useState({});
  const [showBorrowDialog, setShowBorrowDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [borrowData, setBorrowData] = useState({
    reason: '',
    borrowDate: getTomorrowTH(), // autofill วันพรุ่งนี้ของไทย
    returnDate: '',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [equipmentData, setEquipmentData] = useState([]);
  const [categories, setCategories] = useState(['ทั้งหมด']); // default 'ทั้งหมด'
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, title: '', message: '', type: 'info' });

  // Get user info from localStorage
  const userStr = localStorage.getItem('user');
  let globalUserData = null;
  if (userStr) {
    try {
      globalUserData = JSON.parse(userStr);
    } catch (e) {}
  }

  // โหลดข้อมูลจาก API
  useEffect(() => {
    setLoading(true);
    getEquipment()
      .then(data => {
        console.log('API equipment data:', data); // เพิ่ม log เพื่อตรวจสอบข้อมูลที่ได้จาก API
        if (!Array.isArray(data)) {
          setEquipmentData([]);
          return;
        }
        // map field ให้ตรงกับ UI เดิม โดยใช้ item_code เป็น string เสมอ
        const mapped = data.map(item => ({
          id: String(item.item_code), // บังคับเป็น string
          item_id: item.item_id,      // เพิ่มบรรทัดนี้เพื่อให้ payload มี item_id จริง
          name: item.name,
          code: String(item.item_code), // บังคับเป็น string
          category: item.category,
          status: item.status,
          dueDate: item.dueDate || item.return_date || item.due_date || '', // ใช้ข้อมูลจริงจาก API
          image: item.pic,
          available: item.quantity,
          specifications: item.description,
          location: item.location || '',
          purchaseDate: item.purchaseDate || '',
          price: item.price || '',
          unit: item.unit
        }));
        setEquipmentData(mapped);
      })
      .finally(() => setLoading(false));
  }, []);

  // โหลด category จาก API
  useEffect(() => {
    getCategories().then(data => {
      if (!Array.isArray(data)) {
        setCategories(['ทั้งหมด']);
        return;
      }
      // สมมติ field ชื่อหมวดหมู่คือ name
      const names = data.map(item => item.name);
      setCategories(['ทั้งหมด', ...names]);
    });
  }, []);

  // Extract unique categories from equipment data
  // const categoryOptions = ['ทั้งหมด', ...new Set(equipmentData.map(item => item.category))]; // ไม่ได้ใช้

  // Handle quantity increase
  const handleIncrease = (item_code) => {
    // ถ้ายังไม่เคยเลือก item_code นี้ และเลือกครบ 7 รหัสแล้ว
    if (!quantities[item_code] && Object.keys(quantities).length >= 7) {
      setNotification({ show: true, title: 'แจ้งเตือน', message: 'เลือกอุปกรณ์ได้ไม่เกิน 7 รหัส', type: 'warning' });
      return;
    }
    const equipment = equipmentData.find(item => item.id === item_code);
    if (equipment && (quantities[item_code] || 0) < equipment.available) {
      setQuantities(prev => ({
        ...prev,
        [item_code]: (prev[item_code] || 0) + 1
      }));
    }
  };

  // Handle quantity decrease
  const handleDecrease = (item_code) => {
    setQuantities(prev => {
      const newQuantity = (prev[item_code] || 0) - 1;
      if (newQuantity <= 0) {
        const newState = { ...prev };
        delete newState[item_code];
        return newState;
      }
      return {
        ...prev,
        [item_code]: newQuantity
      };
    });
  };

  // Calculate total selected items
  const totalSelectedItems = Object.keys(quantities).length;

  // Filter equipment based on search, status and category
  const filteredEquipment = equipmentData.filter(equipment => {
    const matchesSearch = equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (equipment.code && String(equipment.code).toLowerCase().includes(searchTerm.toLowerCase()));
    let matchesStatus = false;
    if (selectedStatus === 'ทั้งหมด') {
      matchesStatus = true;
    } else if (selectedStatus === 'กำลังซ่อม') {
      matchesStatus = ['รออนุมัติซ่อม', 'ชำรุด', 'กำลังซ่อม'].includes(equipment.status);
    } else {
      matchesStatus = equipment.status === selectedStatus;
    }
    const matchesCategory = selectedCategory === 'ทั้งหมด' || equipment.category === selectedCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get status badge with appropriate styling
  const getStatusBadge = (status) => {
    const baseClasses = "badge px-4 py-4 rounded-full text-sm font-medium ";
    switch (status) {
      case 'พร้อมใช้งาน':
        return <span className={`${baseClasses} badge-success text-white`}>พร้อมใช้งาน</span>;
      case 'ถูกยืม':
        return <span className={`${baseClasses} badge-warning text-black`}>ถูกยืม</span>;
      case 'รออนุมัติซ่อม':
      case 'ชำรุด':
      case 'กำลังซ่อม':
        return <span className={`${baseClasses} badge-error text-white`}>กำลังซ่อม</span>;
      default:
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>{status}</span>;
    }
  };

  // Handle status filter change
  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
  };

  // Handle category filter change
  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
  };

  // Handle confirm button click
  const handleConfirm = () => {
    setShowBorrowDialog(true);
    const tomorrow = getTomorrowTH();
    const returnDate = new Date(tomorrow);
    returnDate.setDate(returnDate.getDate() + 7);
    setBorrowData({
      reason: '',
      borrowDate: tomorrow, // autofill วันพรุ่งนี้ของไทย
      returnDate: returnDate.toISOString().split('T')[0]
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'borrowDate') {
      const minDate = getTomorrowTH();
      if (value < minDate) {
        setNotification({ show: true, title: 'แจ้งเตือน', message: 'กรุณาเลือกวันที่ยืมหลังวันส่งคำขอ 1 วันขึ้นไป', type: 'warning' });
        return;
      }
    }
    setBorrowData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle return date change with validation (max 7 days from borrow date)
  const handleReturnDateChange = (e) => {
    const returnDate = new Date(e.target.value);
    const borrowDate = new Date(borrowData.borrowDate);
    const maxReturnDate = new Date(borrowDate);
    maxReturnDate.setDate(borrowDate.getDate() + 7);

    if (returnDate > maxReturnDate) {
      setNotification({ show: true, title: 'แจ้งเตือน', message: 'วันที่คืนต้องไม่เกิน 7 วันนับจากวันที่ยืม', type: 'warning' });
      return;
    }

    setBorrowData(prev => ({
      ...prev,
      returnDate: e.target.value
    }));
  };

  // Handle form submission
  const handleSubmitBorrow = async (e, selectedFiles = []) => {
    e.preventDefault();

    if (!globalUserData?.user_id) {
      setNotification({ show: true, title: 'กรุณาเข้าสู่ระบบ', message: 'กรุณาเข้าสู่ระบบก่อนทำรายการ', type: 'error' });
      return;
    }

    const items = Object.entries(quantities).map(([item_code, quantity]) => {
      const equipment = equipmentData.find(eq => String(eq.id) === String(item_code));
      if (!equipment || !equipment.item_id) {
        setNotification({ show: true, title: 'เกิดข้อผิดพลาด', message: 'พบอุปกรณ์ที่ไม่มีรหัส item_id', type: 'error' });
        throw new Error('Missing item_id');
      }
      return {
        item_id: equipment.item_id,
        quantity: Number(quantity)
      };
    });

    if (items.length === 0) {
      setNotification({ show: true, title: 'แจ้งเตือน', message: 'กรุณาเลือกอุปกรณ์อย่างน้อย 1 ชิ้น', type: 'warning' });
      return;
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('user_id', globalUserData.user_id);
    formData.append('purpose', borrowData.reason);
    formData.append('borrow_date', borrowData.borrowDate);
    formData.append('return_date', borrowData.returnDate);
    formData.append('items', JSON.stringify(items));

    // Add files to FormData
    selectedFiles.forEach((file, index) => {
      formData.append('important_documents', file);
    });

    console.log('FormData payload:', {
      user_id: globalUserData.user_id,
      purpose: borrowData.reason,
      borrow_date: borrowData.borrowDate,
      return_date: borrowData.returnDate,
      items: items,
      files_count: selectedFiles.length
    });

    // แสดง loading state พร้อม progress bar
    setNotification({
      show: true,
      title: 'กำลังส่งคำขอ...',
      message: 'ระบบกำลังประมวลผลคำขอยืมของคุณ กรุณารอสักครู่',
      type: 'info',
      duration: 0 // ไม่ auto-close
    });

    try {
      const response = await authFetch('http://localhost:5000/api/borrows', {
        method: 'POST',
        // Don't set Content-Type header for FormData - let browser set it with boundary
        body: formData
      });
            const data = await response.json();
      if (response.ok) {
        setNotification({
          show: true,
          title: 'สำเร็จ',
          message: 'ส่งคำขอยืมสำเร็จ รหัส ' + (data.borrow_code || 'ไม่พบรหัส'),
          type: 'success',
          duration: 5000 // แสดง 5 วินาที
        });
        setShowBorrowDialog(false);
        setQuantities({});
        setBorrowData({ reason: '', borrowDate: '', returnDate: '' });

        // อัปเดตสถานะอุปกรณ์แบบ async (ไม่ต้องรอ)
        setTimeout(() => {
          for (const item of items) {
            try {
              const equipment = equipmentData.find(eq => eq.item_id === item.item_id);
              if (!equipment) continue;
              const itemCode = equipment.code;
              updateEquipmentStatus(itemCode, 'ถูกยืม').then(() => {
                setEquipmentData(prev => prev.map(eq => eq.item_id === item.item_id ? { ...eq, status: 'ถูกยืม' } : eq));
              }).catch(() => { /* ignore error */ });
            } catch { /* ignore error */ }
          }
        }, 100);
      } else {
        setNotification({
          show: true,
          title: 'เกิดข้อผิดพลาด',
          message: data.message || '',
          type: 'error',
          duration: 5000 // แสดง 5 วินาที
        });
      }
    } catch {
      setNotification({
        show: true,
        title: 'เกิดข้อผิดพลาด',
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์',
        type: 'error',
        duration: 5000 // แสดง 5 วินาที
      });
    }
  };

  // Calculate max return date (7 days from borrow date)
  const calculateMaxReturnDate = () => {
    if (!borrowData.borrowDate) return '';
    const maxDate = new Date(borrowData.borrowDate);
    maxDate.setDate(maxDate.getDate() + 7);
    return maxDate.toISOString().split('T')[0];
  };

  // Show image modal
  const showImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  // Show equipment detail dialog
  const showEquipmentDetail = (equipment) => {
    setSelectedEquipment(equipment);
    setShowDetailDialog(true);
  };

  // เพิ่มตัวแปรตรวจสอบว่า borrowDate ถูกต้องหรือไม่
  const isBorrowDateValid = borrowData.borrowDate && borrowData.borrowDate >= getTomorrowTH();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <>
      <Notification
        show={notification.show}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        duration={4000}
        onClose={() => setNotification(n => ({ ...n, show: false }))}
        animateIn="animate-fadeInScale"
        animateOut="animate-fadeOutScale"
      />
      <motion.div
        className="bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header Section */}
        <motion.header
          className="bg-white"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center text-center">
              <h1 className="text-3xl font-bold text-gray-900">ระบบยืมคืนครุภัณฑ์</h1>
              <p className="mt-2 text-lg text-gray-600">คณะวิทยาการสารสนเทศ</p>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-auto mx-auto px-4 py-6 sm:px-6 lg:px-8 bg-white">
          {loading ? (
            <div className="text-center py-12 text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : (
            <>
              {/* Search and Filter Section */}
              <motion.div
                className="mb-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Search Bar */}
                <motion.div
                  className="mb-6"
                  variants={itemVariants}
                >
                  <div className="relative max-w-3xl mx-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MdSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl text-sm"
                      placeholder="ค้นหาชื่อครุภัณฑ์หรือรหัส..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </motion.div>

                {/* Filter Controls */}
                <motion.div
                  className="bg-white p-6 mb-6 bg-gradient-to-r from-indigo-950 to-blue-700 rounded-2xl"
                  variants={itemVariants}
                >
                  <div className="flex flex-col px-6 md:flex-row md:items-center md:justify-between gap-4">
                    {/* Status Filters */}
                    <div>
                      <h3 className="text-sm font-medium text-white mb-2">สถานะ</h3>
                      <div className="flex flex-wrap gap-2">
                        {['ทั้งหมด', 'พร้อมใช้งาน', 'ถูกยืม', 'กำลังซ่อม'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusFilter(status)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                              selectedStatus === status
                                ? 'bg-blue-700 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                      <h3 className="text-sm font-medium text-white mb-2">หมวดหมู่</h3>
                      <Menu>
                        <MenuHandler>
                          <Button
                            variant="outlined"
                            className={`w-70 border-white shadow-sm rounded-xl flex items-center px-4 py-2 text-sm font-medium normal-case justify-between transition-colors duration-200 bg-white ${selectedCategory !== 'ทั้งหมด' ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                          >
                            <span className="flex items-center gap-2">
                              <MdSearch className="w-4 h-4" />
                              หมวดหมู่
                              {selectedCategory !== 'ทั้งหมด' && (
                                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full ml-2">{selectedCategory}</span>
                              )}
                            </span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </Button>
                        </MenuHandler>
                        <MenuList className="min-w-[200px] bg-white text-gray-800 rounded-lg border border-gray-100 p-2">
                          <MenuItem
                            className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors duration-200 ${selectedCategory === 'ทั้งหมด' ? 'bg-blue-50 text-blue-700 font-semibold' : 'font-normal'}`}
                            onClick={() => handleCategoryFilter('ทั้งหมด')}
                          >
                            <span>ทั้งหมด</span>
                            <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{equipmentData.length}</span>
                          </MenuItem>
                          {categories.filter(cat => cat !== 'ทั้งหมด').map(category => {
                            const count = equipmentData.filter(item => item.category === category).length;
                            return (
                              <MenuItem
                                key={category}
                                className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors duration-200 ${selectedCategory === category ? 'bg-blue-50 text-blue-700 font-semibold' : 'font-normal'}`}
                                onClick={() => handleCategoryFilter(category)}
                              >
                                <span>{category}</span>
                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{count}</span>
                              </MenuItem>
                            );
                          })}
                        </MenuList>
                      </Menu>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Equipment Grid */}
              <motion.div
                className="mb-16"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredEquipment.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {filteredEquipment.map((equipment, index) => (
                      <motion.div
                        key={equipment.id}
                        className="card rounded-2xl shadow-md hover:shadow-xl bg-white cursor-pointer transition-all duration-300 ease-in-out group border border-transparent hover:border-blue-200 relative overflow-hidden"
                        variants={itemVariants}
                        whileHover={{
                          scale: 1.02,
                          y: -5
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.2 }}
                        onClick={() => showEquipmentDetail(equipment)}>
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white to-blue-700 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none z-0"></div>
                        <figure className="px-4 pt-4 relative">
                          <img
                            src={equipment.image}
                            alt={equipment.name}
                            className="rounded-xl h-40 w-full object-contain cursor-pointer"
                            // onClick={(e) => {
                            //   e.stopPropagation();
                            //   showImageModal(equipment.image);
                            // }}
                          />
                          <div className="absolute top-6 right-6">
                            {getStatusBadge(equipment.status)}
                          </div>
                        </figure>
                        <div className="card-body p-4 md:p-6">
                          <div className="card-title flex flex-col gap-2">
                            <h2 className="font-semibold line-clamp-1 text-lg md:text-xl">{equipment.name}</h2>
                            <p className="text-sm">{equipment.code}</p>
                          </div>

                          <div className="flex flex-col items-center w-full mt-2">
                            <p className="text-sm font-medium text-white bg-blue-700 px-4 py-2 rounded-full">
                              จำนวน {equipment.available} {equipment.unit || ''}
                            </p>
                            {equipment.status === 'พร้อมยืม' && (
                              <p className="text-sm">คงเหลือ {equipment.available} ชิ้น</p>
                            )}
                            {/* เพิ่มแสดงวันที่คืนเมื่อสถานะเป็น 'ถูกยืม' */}
                            {equipment.status === 'ถูกยืม' && equipment.dueDate && (
                              <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-yellow-100 border border-yellow-300 shadow-sm animate-pulse">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-base font-bold text-red-700">
                                  กำหนดคืน {new Date(equipment.dueDate).toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                </span>
                              </div>
                            )}
                            {equipment.dueDate && equipment.status !== 'พร้อมยืม' && equipment.status !== 'ถูกยืม' && (
                              <p className="text-sm">กำหนดคืน {equipment.dueDate}</p>
                            )}
                          </div>

                          <div className="card-actions flex-col items-center justify-center mt-2 ">
                            {(equipment.status === 'พร้อมยืม' || equipment.status === 'พร้อมใช้งาน') ? (
                              quantities[equipment.id] ? (
                                <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                  <motion.button
                                    className={`flex items-center justify-center w-9 h-9 rounded-full  border border-blue-500 bg-white shadow-sm transition-colors duration-150 text-blue-700 hover:bg-blue-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed ${quantities[equipment.id] >= equipment.available ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleIncrease(equipment.id);
                                    }}
                                    disabled={quantities[equipment.id] >= equipment.available}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    aria-label="เพิ่มจำนวน"
                                  >
                                    <MdAdd className="w-5 h-5" />
                                  </motion.button>
                                  <span className="inline-flex items-center justify-center w-10 h-9 rounded-lg bg-blue-700 text-base font-semibold text-white border border-gray-200">
                                    {quantities[equipment.id]}
                                  </span>
                                  <motion.button
                                    className="flex items-center justify-center w-9 h-9 rounded-full border border-blue-500 bg-white shadow-sm transition-colors duration-150 text-blue-700 hover:bg-blue-600 hover:text-white"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDecrease(equipment.id);
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    aria-label="ลดจำนวน"
                                  >
                                    <MdRemove className="w-5 h-5" />
                                  </motion.button>
                                </div>
                              ) : (
                                <motion.button
                                  className={`flex items-center justify-center w-10 h-10 rounded-full mt-2 border border-blue-500  shadow-sm text-blue-700 font-medium gap-2 hover:bg-blue-600 hover:text-white transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${equipment.available <= 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleIncrease(equipment.id);
                                  }}
                                  disabled={equipment.available <= 0}
                                  whileHover={{ scale: 1.07 }}
                                  whileTap={{ scale: 0.97 }}
                                  aria-label="เลือก"
                                >
                                  <MdAdd className="w-5 h-5" />
                                </motion.button>
                              )
                            ) : null}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    className="text-center py-12 bg-white rounded-lg shadow-sm"
                    variants={itemVariants}
                  >
                    <p className="text-gray-500 text-lg">ไม่พบครุภัณฑ์ที่ตรงกับการค้นหา</p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedStatus('ทั้งหมด');
                        setSelectedCategory('ทั้งหมด');
                      }}
                      className="mt-4 btn btn-md btn-ghost px-4 py-2 rounded-full bg-gray-200 hover:bg-blue-700 transition-colors"
                    >
                      ล้างการค้นหา
                    </button>
                  </motion.div>
                )}
              </motion.div>
            </>
          )}
        </main>

        {/* Floating Cart Summary */}
        {totalSelectedItems > 0 && (
          <motion.div
            className="fixed bottom-6 right-11 md:bottom-6 md:right-6 bg-white shadow-xl p-4 z-10 rounded-2xl"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <MdShoppingCart className="h-6 w-6 text-blue-600" />
                </motion.div>
                <span className="font-medium">
                  {totalSelectedItems} รายการที่เลือก
                </span>
              </div>
              <div className="flex gap-2">
                <motion.button
                  onClick={() => setQuantities({})}
                  className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-2xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ยกเลิก
                </motion.button>
                <motion.button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-2xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ยืนยันการยืม
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Dialogs */}
        <BorrowDialog
          showBorrowDialog={showBorrowDialog}
          setShowBorrowDialog={setShowBorrowDialog}
          quantities={quantities}
          equipmentData={equipmentData}
          borrowData={borrowData}
          setBorrowData={setBorrowData} // ส่ง prop นี้เพิ่ม
          handleInputChange={handleInputChange}
          handleReturnDateChange={handleReturnDateChange}
          handleSubmitBorrow={handleSubmitBorrow}
          calculateMaxReturnDate={calculateMaxReturnDate}
          showImageModal={showImageModal}
          isBorrowDateValid={isBorrowDateValid}
        />

        <EquipmentDetailDialog
          showDetailDialog={showDetailDialog}
          setShowDetailDialog={setShowDetailDialog}
          selectedEquipment={selectedEquipment}
          showImageModal={showImageModal}
          getStatusBadge={getStatusBadge}
        />

        <ImageModal
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
        />
      </motion.div>
    </>
  );
};

export default Home;