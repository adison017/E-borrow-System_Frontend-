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
import axios from 'axios';
import Notification from '../../components/Notification';

const API_BASE = 'http://localhost:5000/api';

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
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [addressFilter, setAddressFilter] = useState('ทั้งหมด');

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
      console.error('Error fetching rooms:', error);
      showAlertMessage('เกิดข้อผิดพลาดในการดึงข้อมูลห้อง', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlertMessage = (message, type = "success") => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ป้องกันการส่งซ้ำในขณะที่กำลังประมวลผล
    if (isSubmitting) {
      return;
    }

    try {
      // ตั้งค่า loading state
      setIsSubmitting(true);

      // แสดง loading message
      if (editingRoom) {
        showAlertMessage('⏳ กำลังอัปเดตข้อมูลห้อง...', 'info');
      } else {
        showAlertMessage('⏳ กำลังเพิ่มห้องใหม่...', 'info');
      }

      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'image_url') {
          formDataToSend.append(key, formData[key]);
        }
      });
      // ส่ง image_url (imageUrlsEdit) เสมอ
      if (editingRoom) {
        formDataToSend.append('image_url', JSON.stringify(imageUrlsEdit));
      }
      uploadedFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });
      if (imageUrlsEdit.length + uploadedFiles.length > 5) {
        showAlertMessage('ไม่สามารถอัปโหลดรูปภาพได้เกิน 5 รูป', 'error');
        return;
      }
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };
      if (editingRoom) {
        await axios.put(`${API_BASE}/rooms/${editingRoom.room_id}`, formDataToSend, { headers });
        showAlertMessage('✅ อัปเดตข้อมูลห้องเรียบร้อยแล้ว');
      } else {
        await axios.post(`${API_BASE}/rooms`, formDataToSend, { headers });
        showAlertMessage('✅ เพิ่มห้องใหม่เรียบร้อยแล้ว');
      }
      setShowModal(false);
      setEditingRoom(null);
      setImageUrlsEdit([]);
      resetForm();
      fetchRooms();
    } catch (error) {
      console.error('Error submitting form:', error);
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      showAlertMessage(`❌ ${message}`, 'error');
    } finally {
      // รีเซ็ต loading state
      setIsSubmitting(false);
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      room_code: room.room_code || '',
      room_name: room.room_name || '',
      address: room.address || '',
      detail: room.detail || '',
      note: room.note || '',
      image_url: room.image_url || ''
    });
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
    setImageUrls(['']);
    setUploadedFiles([]);
    setShowModal(true);
  };

  const handleDelete = async (roomId) => {
    if (window.confirm('คุณต้องการลบห้องนี้หรือไม่?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE}/rooms/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showAlertMessage('ลบห้องเรียบร้อยแล้ว');
        fetchRooms();
      } catch (error) {
        console.error('Error deleting room:', error);
        showAlertMessage('เกิดข้อผิดพลาดในการลบห้อง', 'error');
      }
    }
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
      showAlertMessage('ไม่สามารถเพิ่มรูปภาพได้เกิน 5 รูป', 'error');
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
      showAlertMessage('ไม่สามารถใช้ URL รูปภาพที่ซ้ำกันได้', 'error');
      return false;
    }

    return true;
  };

  // Helper function to handle file upload
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);

    // ตรวจสอบจำนวนไฟล์
    if (uploadedFiles.length + files.length > 5) {
      showAlertMessage('ไม่สามารถอัปโหลดรูปภาพได้เกิน 5 รูป', 'error');
      return;
    }

    // ตรวจสอบประเภทไฟล์
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      showAlertMessage('รองรับเฉพาะไฟล์รูปภาพ (JPEG, JPG, PNG, GIF, WEBP)', 'error');
      return;
    }

    // ตรวจสอบขนาดไฟล์ (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      showAlertMessage('ขนาดไฟล์ต้องไม่เกิน 5MB', 'error');
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

        // แสดง loading message
        showAlertMessage('⏳ กำลังลบรูปภาพจาก Cloudinary...', 'info');

        // ส่ง request ไปลบรูปภาพจาก Cloudinary
        await axios.delete(`${API_BASE}/rooms/${editingRoom.room_code}/images/image_${idx + 1}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // ลบรูปภาพออกจาก state หลังจากลบสำเร็จ
        setImageUrlsEdit(prev => prev.filter((_, i) => i !== idx));
        showAlertMessage('✅ ลบรูปภาพจาก Cloudinary เรียบร้อยแล้ว');
      } else {
        // ถ้าไม่ใช่ Cloudinary URL ให้ลบออกจาก state เท่านั้น
        setImageUrlsEdit(prev => prev.filter((_, i) => i !== idx));
        showAlertMessage('✅ ลบรูปภาพเรียบร้อยแล้ว');
      }
    } catch (error) {
      console.error('Error removing image:', error);
      showAlertMessage('❌ เกิดข้อผิดพลาดในการลบรูปภาพ', 'error');
    } finally {
      // รีเซ็ต loading state
      setIsDeletingImage(false);
    }
  };
  const updateOldImageUrl = (idx, newUrl) => {
    setImageUrlsEdit(prev => prev.map((url, i) => i === idx ? newUrl : url));
  };

  const isImageCountExceeded = imageUrlsEdit.length + uploadedFiles.length > 5;

  const TABLE_HEAD = ["รูปภาพ", "รหัสห้อง", "ชื่อห้อง", "ที่อยู่", "รายละเอียด", "หมายเหตุ", "การจัดการ"];

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
                  className="w-full h-10 pl-10 pr-4 py-2.5 border border-gray-300 rounded-2xl text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm placeholder-gray-400"
                  placeholder="ค้นหารหัส, ชื่อ, ที่อยู่, หรือรายละเอียด..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-shrink-0 gap-x-3 w-full md:w-auto justify-start md:justify-end">
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
                        className={`px-3 py-4 text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap ${
                          index === 0 ? "w-16 text-center" :
                          index === 1 ? "w-24 text-center" :
                          index === 2 ? "w-20 text-left" :
                          index === 3 ? "w-20 text-left" :
                          index === 4 ? "w-20 text-left" :
                          index === 5 ? "w-20 text-left" :
                          index === 6 ? "w-20 text-center" : ""
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
                          <td className="w-15 px-3 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center">
                            {imageUrls.length > 0 ? (
                                <img
                                  src={imageUrls[0].startsWith('http') ? imageUrls[0] : `${API_BASE.replace('/api', '')}${imageUrls[0]}`}
                                  alt={`Room ${room.room_code}`}
                                  className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <FaBuilding className="h-16 w-16 text-gray-400" style={{ display: imageUrls.length > 0 ? 'none' : 'flex' }} />
                          </div>
                        </td>
                          <td className="w-24 px-3 py-4 whitespace-nowrap text-center">
                            <span className="text-sm font-medium text-gray-700 text-center break-all">
                              {room.room_code}
                            </span>
                          </td>
                          <td className="w-20 px-3 py-4 whitespace-nowrap text-md text-gray-900 text-left truncate">
                            {room.room_name}
                          </td>
                          <td className="w-20 px-3 py-4 whitespace-nowrap text-md text-gray-700 text-left truncate">
                            {room.address}
                          </td>
                          <td className="w-20 px-3 py-4 whitespace-nowrap text-md text-gray-700 text-left truncate">
                            {room.detail}
                          </td>
                          <td className="w-20 px-3 py-4 whitespace-nowrap text-md text-gray-700 text-left truncate">
                            {room.note}
                        </td>
                          <td className="w-25 px-3 py-4 whitespace-nowrap text-center">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <Tooltip content="แก้ไข" placement="top">
                                <IconButton variant="text" color="amber" className="bg-amber-50 hover:bg-amber-100 shadow-sm transition-all duration-200 p-2" onClick={() => handleEdit(room)}>
                                  <PencilIcon className="h-5 w-5" />
                                </IconButton>
                            </Tooltip>
                              <Tooltip content="ลบ" placement="top">
                                <IconButton variant="text" color="red" className="bg-red-50 hover:bg-red-100 shadow-sm transition-all duration-200 p-2" onClick={() => handleDelete(room.room_id)}>
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

      {/* Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box relative bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-[150vh] w-full p-5 z-50 overflow-y-auto max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-gray-100">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center tracking-tight">
                <span className="bg-emerald-100 text-emerald-700 p-2 rounded-lg mr-3 shadow-sm">
                  <FaBuilding className="h-5 w-5" />
                </span>
                {editingRoom ? 'แก้ไขข้อมูลห้อง' : 'เพิ่มห้องใหม่'}
              </h3>
                         <button
               onClick={() => {
                 if (!isSubmitting) {
                   setShowModal(false);
                   setEditingRoom(null);
                   setImageUrlsEdit([]);
                   resetForm();
                 }
               }}
                 className={`text-gray-500 hover:text-gray-800 transition-colors duration-150 hover:bg-gray-100 p-2 rounded-full ${
                   isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                 }`}
                 disabled={isSubmitting}
             >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
              </div>

              {/* Form Content */}
            <div className="space-y-6">
              {/* Prominent Image Upload */}
              <div className="flex flex-col items-center mb-6">
                                 <div
                   className={`w-44 h-44 bg-gradient-to-br from-emerald-50 to-white rounded-2xl border-2 border-dashed border-emerald-200 flex items-center justify-center relative overflow-hidden group shadow-lg hover:shadow-xl transition-all duration-300 ${
                     isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                   }`}
                   onClick={() => {
                     if (!isSubmitting) {
                       document.getElementById('room-images').click();
                     }
                   }}
                 >
                  {uploadedFiles.length > 0 ? (
                    <img
                      src={URL.createObjectURL(uploadedFiles[0])}
                      alt="Room Preview"
                      className="max-h-40 max-w-40 object-contain z-10 transform group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3474/3474360.png"; }}
                    />
                  ) : (
                    <FaBuilding className="h-20 w-20 text-emerald-400 z-10 transform group-hover:scale-105 transition-transform duration-300" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-300 z-20">
                    <div className="bg-white/95 p-3 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      </div>
                      </div>
                      </div>
                                                 <input
                           type="file"
                           multiple
                           accept="image/*"
                           onChange={handleFileUpload}
                           className="hidden"
                           id="room-images"
                           disabled={isImageCountExceeded || isSubmitting}
                         />
                                 <span className="text-sm font-medium text-gray-600 mt-4 px-4 py-2 rounded-full">
                   {isSubmitting ? '⏳ กำลังประมวลผล...' : 'คลิกที่รูปเพื่ออัพโหลดรูปภาพ'}
                 </span>
                 <span className="text-sm text-emerald-600 mt-2">
                   {uploadedFiles.length}/5 รูปภาพ
                 </span>



                      {/* Uploaded Files Preview */}
                      {uploadedFiles.length > 0 && (
                  <div className="space-y-3 mt-4 w-full max-w-md">
                          <p className="text-sm text-gray-600 font-medium">ไฟล์ที่เลือก:</p>
                    <div className="space-y-2">
                            {uploadedFiles.map((file, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${index + 1}`}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeUploadedFile(index)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
              </div>

              {/* Preview Section */}
              {(editingRoom && (imageUrlsEdit.length > 0 || uploadedFiles.length > 0)) && (
                <div className="w-full max-w-md mb-6 mx-auto">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-lg flex items-start gap-2 mb-2">
                    <span className="text-yellow-500 text-xl mt-0.5">🖼️</span>
                    <div>
                      <span className="font-semibold text-yellow-800">รูปภาพห้อง (Preview):</span>
                      <span className="text-yellow-800 ml-1">
                        สามารถลบหรือแก้ไข URL รูปภาพเดิมได้, รูปใหม่สามารถลบได้ก่อนบันทึก
                        {isDeletingImage && (
                          <span className="block mt-1 text-sm font-medium text-blue-600">
                            ⏳ กำลังลบรูปภาพจาก Cloudinary...
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                    {/* รูปเดิม */}
                    {imageUrlsEdit.map((url, idx) => (
                      <div key={"old-"+idx} className="relative group flex flex-col items-center" title={`รูปเดิม ${idx + 1}`}>
                        <img
                          src={url.startsWith('http') ? url : `${API_BASE.replace('/api', '')}${url}`}
                          alt={`Old ${idx + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-300 shadow group-hover:scale-105 transition-transform duration-200 bg-white"
                          onError={e => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/3474/3474360.png'; }}
                        />
                              <input
                                type="url"
                                value={url}
                          onChange={e => updateOldImageUrl(idx, e.target.value)}
                          className="w-20 mt-1 px-1 py-0.5 text-xs bg-white border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="URL รูปภาพ"
                        />
                                <button
                                  type="button"
                                  onClick={() => removeOldImage(idx)}
                                  disabled={isDeletingImage}
                                  className={`absolute top-0 right-0 p-1 bg-white rounded-full shadow transition-all duration-200 ${
                                    isDeletingImage
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                                  }`}
                                  title={isDeletingImage ? "กำลังลบ..." : "ลบรูปนี้"}
                                >
                                  {isDeletingImage ? (
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  )}
                                </button>
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">เดิม</span>
                            </div>
                          ))}
                    {/* รูปใหม่ */}
                    {uploadedFiles.map((file, idx) => (
                      <div key={"new-"+idx} className="relative group flex flex-col items-center" title={`รูปใหม่ ${idx + 1}`}>
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New ${idx + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border border-green-300 shadow group-hover:scale-105 transition-transform duration-200 bg-white"
                        />
                          <button
                            type="button"
                          onClick={() => removeUploadedFile(idx)}
                          className="absolute top-0 right-0 p-1 text-red-500 hover:text-red-700 bg-white rounded-full shadow"
                          title="ลบรูปนี้"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        <span className="absolute bottom-1 left-1 bg-green-700 text-white text-xs px-2 py-0.5 rounded">ใหม่</span>
                              </div>
                            ))}
                          </div>
                  {isImageCountExceeded && (
                    <div className="mt-2 text-sm text-rose-600 font-semibold flex items-center gap-1">
                      <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
                      ไม่สามารถอัปโหลดรูปภาพรวมกันเกิน 5 รูป (เดิม+ใหม่)
                        </div>
                      )}
                    </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    รหัสห้อง <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.room_code}
                    onChange={(e) => setFormData({ ...formData, room_code: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 shadow-sm group-hover:shadow-md transition-all duration-300"
                    placeholder="เช่น RM-001"
                    required
                  />
                </div>
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    ชื่อห้อง <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.room_name}
                    onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 shadow-sm group-hover:shadow-md transition-all duration-300"
                    placeholder="เช่น ห้องทำงาน"
                    required
                  />
                </div>
                  </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  ที่อยู่ <span className="text-rose-500">*</span>
                        </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 shadow-sm group-hover:shadow-md transition-all duration-300"
                  placeholder="เช่น ชั้น 3 อาคารหลัก"
                  required
                />
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-800 mb-2">รายละเอียด</label>
                        <textarea
                          value={formData.detail}
                          onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 shadow-sm group-hover:shadow-md transition-all duration-300"
                          placeholder="รายละเอียดเพิ่มเติมของห้อง"
                  rows={3}
                        />
                      </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-800 mb-2">หมายเหตุ</label>
                        <textarea
                          value={formData.note}
                          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 shadow-sm group-hover:shadow-md transition-all duration-300"
                          placeholder="หมายเหตุเพิ่มเติม"
                  rows={2}
                        />
                      </div>




                  </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end space-x-4">
              <button
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        if (!isSubmitting) {
                          setShowModal(false);
                          setEditingRoom(null);
                          setImageUrlsEdit([]);
                          resetForm();
                        }
                      }}
                type="button"
                disabled={isSubmitting}
                    >
                      ยกเลิก
              </button>
              <button
                className={`px-6 py-2.5 text-sm font-medium text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
                onClick={handleSubmit}
                type="button"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {editingRoom ? 'กำลังอัปเดต...' : 'กำลังเพิ่ม...'}
                  </div>
                ) : (
                  editingRoom ? 'อัปเดตห้อง' : 'เพิ่มห้อง'
                )}
              </button>
                  </div>
          </div>
                     <form method="dialog" className="modal-backdrop">
             <button onClick={() => {
               if (!isSubmitting) {
                 setShowModal(false);
                 setEditingRoom(null);
                 setImageUrlsEdit([]);
                 resetForm();
               }
             }}>close</button>
                 </form>
        </div>
      )}

      {/* Floating Add Room Button */}
      <Tooltip content="เพิ่มห้องใหม่" placement="left">
        <button
          onClick={() => {
            setEditingRoom(null);
            setImageUrlsEdit([]);
            resetForm();
            setShowModal(true);
          }}
          className="fixed bottom-8 right-8 z-[60] border-black bg-black/70 hover:bg-white hover:border-2 hover:border-black hover:text-black text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          aria-label="เพิ่มห้องใหม่"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.75v14.5m7.25-7.25H4.75" />
          </svg>
        </button>
      </Tooltip>
    </ThemeProvider>
  );
};

export default ManageRoom;