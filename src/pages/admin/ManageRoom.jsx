import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Button,
  ThemeProvider,
  Tooltip,
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
  IconButton,
} from '@material-tailwind/react';
import { FaBuilding } from 'react-icons/fa';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import axios from '../../utils/axios';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Notification from '../../components/Notification';
import { API_BASE } from '../../utils/api';
import AddRoomDialog from './dialog/AddRoomDialog';
import EditRoomDialog from './dialog/EditRoomDialog';

// กำหนด theme สีพื้นฐานเป็นสีดำ เหมือน ManageEquipment
const theme = {
  typography: {
    defaultProps: {
      color: "#374151", // Dark Gray for text
      textGradient: false,
    },
  }
};

const ManageRoom = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [addressFilter, setAddressFilter] = useState('ทั้งหมด');
  const [showDeleteNotification, setShowDeleteNotification] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [formData, setFormData] = useState({
    room_code: '',
    room_name: '',
    address: '',
    detail: '',
    note: '',
    image_url: ''
  });

  const [imageUrls, setImageUrls] = useState(['']);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [imageUrlsEdit, setImageUrlsEdit] = useState([]);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ฟังก์ชันรวมคำอธิบายแจ้งเตือน (เหมือน ManageUser.jsx)
  const getRoomNotifyMessage = (action, extra) => {
    switch (action) {
      case "add":
        return { message: `เพิ่มห้อง ${extra} เรียบร้อยแล้ว`, type: "success" };
      case "edit":
        return { message: `แก้ไขห้อง ${extra} เรียบร้อยแล้ว`, type: "success" };
      case "delete":
        return { message: `ลบห้อง ${extra} เรียบร้อยแล้ว`, type: "success" };
      case "add_error":
        return { message: "เกิดข้อผิดพลาดในการเพิ่มห้อง", type: "error" };
      case "edit_error":
        return { message: "เกิดข้อผิดพลาดในการแก้ไขห้อง", type: "error" };
      case "delete_error":
        return { message: "เกิดข้อผิดพลาดในการลบห้อง", type: "error" };
      case "fetch_error":
        return { message: "เกิดข้อผิดพลาดในการดึงข้อมูลห้อง", type: "error" };
      case "export_success":
        return { message: "ส่งออก Excel เรียบร้อยแล้ว", type: "success" };
      case "export_error":
        return { message: "เกิดข้อผิดพลาดในการส่งออก Excel", type: "error" };
      case "image_delete_success":
        return { message: "ลบรูปภาพเรียบร้อยแล้ว", type: "success" };
      case "image_delete_error":
        return { message: "เกิดข้อผิดพลาดในการลบรูปภาพ", type: "error" };
      default:
        return { message: action, type: "info" };
    }
  };

  // ฟังก์ชันกลางสำหรับแจ้งเตือน
  const notifyRoomAction = (action, extra) => {
    const { message, type } = getRoomNotifyMessage(action, extra);
    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else {
      toast.info(message);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(response.data);
    } catch (error) {
      // Error fetching rooms
      notifyRoomAction('fetch_error');
    } finally {
      setLoading(false);
    }
  };

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

  const handleAddRoom = async (formData) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      uploadedFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };

      await axios.post(`${API_BASE}/rooms`, formDataToSend, { headers });
      notifyRoomAction("add", formData.room_name);
      setShowAddDialog(false);
      setUploadedFiles([]);
      resetForm();
      fetchRooms();
    } catch (error) {
      notifyRoomAction("add_error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRoom = async (formData) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      formDataToSend.append('image_url', JSON.stringify(imageUrlsEdit));
      uploadedFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });

      if (imageUrlsEdit.length + uploadedFiles.length > 5) {
        notifyRoomAction("error", "ไม่สามารถอัปโหลดรูปภาพได้เกิน 5 รูป");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };

      await axios.put(`${API_BASE}/rooms/${editingRoom.room_id}`, formDataToSend, { headers });
      notifyRoomAction("edit", editingRoom.room_name);
      setShowEditDialog(false);
      setEditingRoom(null);
      setImageUrlsEdit([]);
      setUploadedFiles([]);
      resetForm();
      fetchRooms();
    } catch (error) {
      notifyRoomAction("edit_error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    // parse image_url เดิม
    if (room.image_url) {
      try {
        const urls = JSON.parse(room.image_url);
        setImageUrlsEdit(Array.isArray(urls) ? urls : [room.image_url]);
      } catch {
        setImageUrlsEdit([room.image_url]);
      }
    } else {
      setImageUrlsEdit([]);
    }
    setUploadedFiles([]);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (room) => {
    setSelectedRoom(room);
    setShowDeleteNotification(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/rooms/${selectedRoom.room_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      notifyRoomAction("delete", selectedRoom.room_name);
      fetchRooms();
    } catch (error) {
      notifyRoomAction("delete_error");
    }
    setShowDeleteNotification(false);
    setSelectedRoom(null);
  };

  const resetForm = () => {
    setFormData({
      room_name: '',
      room_code: '',
      address: '',
      detail: '',
      note: '',
      image_url: ''
    });
    setImageUrls(['']);
    setUploadedFiles([]);
  };

  // Filter rooms based on search term and address filter
  const filteredRooms = rooms.filter(room => {
    const matchesSearch =
      room.room_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.room_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.detail?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAddress = addressFilter === 'ทั้งหมด' || room.address?.includes(addressFilter);

    return matchesSearch && matchesAddress;
  });

  // Pagination logic เหมือน ManageEquipment
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, addressFilter]);

  // Get unique addresses for filter
  const addresses = Array.from(new Set(rooms.map(room => room.address))).filter(Boolean);

  // Helper function to parse image URLs
  const parseImageUrls = (imageUrlString) => {
    if (!imageUrlString) return [];
    try {
      const urls = JSON.parse(imageUrlString);
      return Array.isArray(urls) ? urls : [imageUrlString];
    } catch {
      return [imageUrlString];
    }
  };

  // Helper function to add new image URL field
  const addImageUrl = () => {
    if (imageUrls.length >= 5) {
      notifyRoomAction("error", "ไม่สามารถเพิ่มรูปภาพได้เกิน 5 รูป");
      return;
    }
    setImageUrls([...imageUrls, '']);
  };

  // Helper function to remove image URL field
  const removeImageUrl = (index) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls.length > 0 ? newUrls : ['']);
  };

  // Helper function to update image URL
  const updateImageUrl = (index, value) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  // Helper function to validate image URLs
  const validateImageUrls = () => {
    const filteredUrls = imageUrls.filter(url => url.trim() !== '');
    const uniqueUrls = [...new Set(filteredUrls)];

    if (filteredUrls.length !== uniqueUrls.length) {
      notifyRoomAction("error", "ไม่สามารถใช้ URL รูปภาพที่ซ้ำกันได้");
      return false;
    }

    return true;
  };

  // Helper function to handle file upload
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);

    // ตรวจสอบจำนวนไฟล์
    if (uploadedFiles.length + files.length > 5) {
      notifyRoomAction("error", "ไม่สามารถอัปโหลดรูปภาพได้เกิน 5 รูป");
      return;
    }

    // ตรวจสอบประเภทไฟล์
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      notifyRoomAction("error", "รองรับเฉพาะไฟล์รูปภาพ (JPEG, JPG, PNG, GIF, WEBP)");
      return;
    }

    // ตรวจสอบขนาดไฟล์ (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      notifyRoomAction("error", "ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }

    setUploadedFiles(prev => [...prev, ...files]);
    event.target.value = ''; // รีเซ็ต input
  };

  // Helper function to remove uploaded file
  const removeUploadedFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

    const removeOldImage = async (idx) => {
    // ป้องกันการคลิกซ้ำในขณะที่กำลังลบ
    if (isDeletingImage) {
      return;
    }

    try {
      const imageUrl = imageUrlsEdit[idx];

      // ตรวจสอบว่าเป็น Cloudinary URL หรือไม่
      if (imageUrl && imageUrl.includes('cloudinary.com')) {
        const token = localStorage.getItem('token');

        // ตั้งค่า loading state
        setIsDeletingImage(true);

        // ส่ง request ไปลบรูปภาพจาก Cloudinary
        await axios.delete(`${API_BASE}/rooms/${editingRoom.room_code}/images/image_${idx + 1}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // ลบรูปภาพออกจาก state หลังจากลบสำเร็จ
        setImageUrlsEdit(prev => prev.filter((_, i) => i !== idx));
        notifyRoomAction("image_delete_success");
      } else {
        // ถ้าไม่ใช่ Cloudinary URL ให้ลบออกจาก state เท่านั้น
        setImageUrlsEdit(prev => prev.filter((_, i) => i !== idx));
        notifyRoomAction("image_delete_success");
      }
    } catch (error) {
      // Error removing image
      notifyRoomAction("image_delete_error");
    } finally {
      // รีเซ็ต loading state
      setIsDeletingImage(false);
    }
  };
  const updateOldImageUrl = (idx, newUrl) => {
    setImageUrlsEdit(prev => prev.map((url, i) => i === idx ? newUrl : url));
  };

  // ฟังก์ชันสำหรับ export Excel
  const handleExportExcel = () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const exportData = filteredRooms.map(room => ({
        'รหัสห้อง': room.room_code || '',
        'ชื่อห้อง': room.room_name || '',
        'ที่อยู่': room.address || '',
        'รายละเอียด': room.detail || '',
        'หมายเหตุ': room.note || '',
        'จำนวนรูปภาพ': room.image_url ? (Array.isArray(JSON.parse(room.image_url)) ? JSON.parse(room.image_url).length : 1) : 0,
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rooms');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, 'rooms.xlsx');
      notifyRoomAction("export_success");
    } catch (error) {
      // Error exporting Excel
      notifyRoomAction("export_error");
    } finally {
      setIsExporting(false);
    }
  };

  const isImageCountExceeded = imageUrlsEdit.length + uploadedFiles.length > 5;

  const TABLE_HEAD = ["รูปภาพ", "รหัสห้อง", "ชื่อห้อง", "ที่อยู่", "รายละเอียด", "หมายเหตุ", "การจัดการ"];

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
                จัดการห้องเก็บครุภัณฑ์
              </Typography>
              <Typography color="gray" className="mt-1 font-normal text-sm text-gray-600">
                จัดการข้อมูลห้องเก็บครุภัณฑ์ทั้งหมดในระบบ
              </Typography>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-y-4 md:gap-x-4">
            <div className="w-full md:flex-grow relative">
              <label htmlFor="search" className="sr-only">
                ค้นหาห้อง
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="search"
                  type="text"
                  className="w-full h-10 pl-10 pr-4 py-2.5 border border-gray-300 rounded-full text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm placeholder-gray-400"
                  placeholder="ค้นหารหัส, ชื่อ, ที่อยู่, หรือรายละเอียด..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-shrink-0 gap-x-3 w-full md:w-auto justify-start md:justify-end">
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

          <div className="flex flex-row items-center gap-2 justify-center mt-5">
            <Menu>
              <MenuHandler>
                <Button variant="outlined" className="w-80 border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm rounded-xl flex items-center px-4 py-2 text-sm font-medium normal-case justify-between">
                  <span className="flex items-center gap-2">
                    <FunnelIcon className="w-4 h-4" />
                    ที่อยู่
                    {addressFilter !== "ทั้งหมด" && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full text-center ml-2">
                        {addressFilter}
                      </span>
                    )}
                  </span>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                </Button>
              </MenuHandler>
              <MenuList className="min-w-[240px] bg-white text-gray-800 rounded-lg border border-gray-100 p-2">
                <MenuItem
                  className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors duration-200 ${addressFilter === "ทั้งหมด" ? "bg-blue-50 text-blue-700 font-semibold" : "font-normal"}`}
                  onClick={() => setAddressFilter("ทั้งหมด")}
                >
                  <span>ทั้งหมด</span>
                  <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{rooms.length}</span>
                </MenuItem>
                {addresses.map(address => (
                  <MenuItem
                    key={address}
                    className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors duration-200 ${addressFilter === address ? "bg-blue-50 text-blue-700 font-semibold" : "font-normal"}`}
                    onClick={() => setAddressFilter(address)}
                  >
                    <span>{address}</span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                      {rooms.filter(room => room.address === address).length}
                    </span>
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          </div>
        </CardHeader>

        <CardBody className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl">
              <table className="min-w-full divide-y divide-gray-200 rounded-2xl">
                <thead className="bg-gradient-to-r from-indigo-950 to-blue-700">
                  <tr>
                    {TABLE_HEAD.map((head, index) => (
                      <th
                        key={head}
                        className={`px-3 py-4 text-sm font-medium text-white uppercase tracking-wider ${
                          index === 0 ? "w-20 text-center" :
                          index === 1 ? "w-28 text-center" :
                          index === 2 ? "w-32 text-left" :
                          index === 3 ? "w-32 text-left" :
                          index === 4 ? "w-40 text-left" :
                          index === 5 ? "w-32 text-left" :
                          index === 6 ? "w-28 text-center" : ""
                        }`}
                      >
                          {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRooms.length > 0 ? (
                    paginatedRooms.map((room, index) => {
                    const imageUrls = parseImageUrls(room.image_url);

                    return (
                        <tr key={room.room_id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 text-center">
                            <div className="flex items-center justify-center">
                            {imageUrls.length > 0 ? (
                                <img
                                  src={imageUrls[0].startsWith('http') ? imageUrls[0] : `${API_BASE.replace('/api', '')}${imageUrls[0]}`}
                                  alt={`Room ${room.room_code}`}
                                  className="h-14 w-14 object-cover rounded-lg border border-gray-200"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <FaBuilding className="h-14 w-14 text-gray-400" style={{ display: imageUrls.length > 0 ? 'none' : 'flex' }} />
                          </div>
                        </td>
                          <td className="px-3 py-4 text-center">
                            <span className="text-sm font-medium text-gray-700">
                              {room.room_code}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-left">
                            <div className="text-sm text-gray-900 max-w-[150px] truncate" title={room.room_name}>
                              {room.room_name}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-left">
                            <div className="text-sm text-gray-700 max-w-[150px] truncate" title={room.address}>
                              {room.address}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-left">
                            <div className="text-sm text-gray-700 max-w-[200px] truncate" title={room.detail}>
                              {room.detail || '-'}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-left">
                            <div className="text-sm text-gray-700 max-w-[150px] truncate" title={room.note}>
                              {room.note || '-'}
                            </div>
                        </td>
                          <td className="px-3 py-4 text-center">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <Tooltip content="แก้ไข" placement="top">
                                <IconButton variant="text" color="amber" className="bg-amber-50 hover:bg-amber-100 shadow-sm transition-all duration-200 p-2" onClick={() => handleEdit(room)}>
                                  <PencilIcon className="h-5 w-5" />
                                </IconButton>
                            </Tooltip>
                              <Tooltip content="ลบ" placement="top">
                                <IconButton variant="text" color="red" className="bg-red-50 hover:bg-red-100 shadow-sm transition-all duration-200 p-2" onClick={() => handleDeleteClick(room)}>
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
                      <td colSpan={TABLE_HEAD.length} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <FaBuilding className="h-12 w-12 text-gray-400 mb-4" />
                          <Typography variant="h6" color="gray" className="mb-2">
                            ไม่พบข้อมูลห้อง
                          </Typography>
                          <Typography variant="small" color="gray" className="font-normal">
                            {searchTerm || addressFilter !== 'ทั้งหมด' ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง' : 'ยังไม่มีข้อมูลห้องในระบบ'}
                          </Typography>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 p-6 bg-white rounded-b-2xl">
          <Typography variant="small" className="font-normal text-gray-600 mb-3 sm:mb-0 text-sm">
            แสดง {filteredRooms.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} ถึง {Math.min(currentPage * itemsPerPage, filteredRooms.length)} จากทั้งหมด {filteredRooms.length} รายการ
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
      </Card>

      {/* Add Room Dialog */}
      <AddRoomDialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setUploadedFiles([]);
          resetForm();
        }}
        onSave={handleAddRoom}
        uploadedFiles={uploadedFiles}
        setUploadedFiles={setUploadedFiles}
        onFileUpload={handleFileUpload}
        onRemoveUploadedFile={removeUploadedFile}
        isSubmitting={isSubmitting}
      />

      {/* Edit Room Dialog */}
      <EditRoomDialog
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingRoom(null);
          setImageUrlsEdit([]);
          setUploadedFiles([]);
          resetForm();
        }}
        roomData={editingRoom}
        onSave={handleEditRoom}
        imageUrls={imageUrlsEdit}
        setImageUrls={setImageUrlsEdit}
        uploadedFiles={uploadedFiles}
        setUploadedFiles={setUploadedFiles}
        onFileUpload={handleFileUpload}
        onRemoveUploadedFile={removeUploadedFile}
        onRemoveOldImage={removeOldImage}
        isSubmitting={isSubmitting}
        isDeletingImage={isDeletingImage}
      />

      {/* Floating Add Room Button */}
      <Tooltip content="เพิ่มห้องใหม่" placement="left">
        <button
          onClick={() => {
            setEditingRoom(null);
            setImageUrlsEdit([]);
            setUploadedFiles([]);
            resetForm();
            setShowAddDialog(true);
           }}
          className="fixed bottom-8 right-8 z-[60] border-black bg-black/70 hover:bg-white hover:border-2 hover:border-black hover:text-black text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          aria-label="เพิ่มห้องใหม่"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.75v14.5m7.25-7.25H4.75" />
          </svg>
        </button>
      </Tooltip>

      {/* Delete Confirmation Notification */}
      <Notification
        show={showDeleteNotification}
        title="ยืนยันการลบห้อง"
        message={selectedRoom ? `คุณต้องการลบห้องนี้หรือไม่?\nคำเตือน: การลบห้องจะทำให้ข้อมูลห้องและรูปภาพทั้งหมดหายไปอย่างถาวร` : ''}
        type="warning"
        duration={0}
        onClose={() => setShowDeleteNotification(false)}
        actions={[
          { label: 'ยกเลิก', onClick: () => setShowDeleteNotification(false) },
          { label: 'ลบห้อง', onClick: confirmDelete }
        ]}
      />
    </ThemeProvider>
  );
};

export default ManageRoom;