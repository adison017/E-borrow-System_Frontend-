import {
  CalendarIcon,
  CubeIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  TagIcon,
  UserIcon
} from "@heroicons/react/24/outline";
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { MdClose } from "react-icons/md";
import { FaImage, FaTimes, FaTools } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Notification from '../../../components/Notification';
import { API_BASE, UPLOAD_BASE } from '../../../utils/api';

export default function RepairRequestDialog({
  open,
  onClose,
  equipment,
  onSubmit
}) {
  const [formData, setFormData] = useState({
    description: '',
    estimatedCost: '',
    images: [],
    imageFiles: [] // Store actual File objects
  });
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // 'single' or 'grid'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const [globalUserData, setGlobalUserData] = useState(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  // Function to generate random repair code
  const generateRepairCode = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000); // Random 5 digits
    return `RP-${randomNum}`;
  };

  // Function to fetch user data from API
  const fetchUserData = async () => {
    setIsLoadingUserData(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await axios.get(`${API_BASE}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('=== Debug: User Data from API ===');
      console.log('API Response:', response.data);
      console.log('User data:', response.data.user);
      console.log('branch_name:', response.data.user?.branch_name);
      console.log('position_name:', response.data.user?.position_name);

      setGlobalUserData(response.data.user);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback to localStorage if API fails
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setGlobalUserData(userData);
          console.log('Fallback to localStorage data:', userData);
        } catch (e) {
          console.error('Error parsing localStorage data:', e);
        }
      }
    } finally {
      setIsLoadingUserData(false);
    }
  };

  // Fetch user data when component mounts or dialog opens
  useEffect(() => {
    if (open) {
      fetchUserData();
    }
  }, [open]);

  // Debug log เพื่อตรวจสอบข้อมูลผู้ใช้
  console.log('=== Debug: User Data State ===');
  console.log('globalUserData:', globalUserData);
  console.log('branch_name:', globalUserData?.branch_name);
  console.log('position_name:', globalUserData?.position_name);
  console.log('branch_id:', globalUserData?.branch_id);
  console.log('position_id:', globalUserData?.position_id);
  console.log('user_id:', globalUserData?.user_id);
  console.log('username:', globalUserData?.username);
  console.log('Fullname:', globalUserData?.Fullname);

  const requesterInfo = {
    name: globalUserData?.Fullname || 'ไม่ระบุชื่อ',
    department: globalUserData?.branch_name || 'ไม่ระบุแผนก',
    position: globalUserData?.position_name || 'ไม่ระบุตำแหน่ง'
  };
  const requestDate = new Date().toISOString().split('T')[0];
  const equipmentCategory = 'อุปกรณ์ทั่วไป'; // Hardcoded category

  useEffect(() => {
    // Reset form and clean up images when dialog is closed or equipment changes
    if (!open) {
      formData.images.forEach(url => URL.revokeObjectURL(url));
      setFormData({
        description: '',
        estimatedCost: '',
        images: [],
        imageFiles: []
      });
    }
    // Cleanup object URLs on component unmount
    return () => {
      formData.images.forEach(url => URL.revokeObjectURL(url));
    };
  }, [open]);

  const processFilesAndUpdateState = (files) => {
    const newImageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (newImageFiles.length === 0) return;

    const newImageUrls = newImageFiles.map(file => URL.createObjectURL(file));

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImageUrls],
      imageFiles: [...prev.imageFiles, ...newImageFiles]
    }));
  };

  const handleRemoveImage = (indexToRemove) => {
    const imageToRemove = formData.images[indexToRemove];
    if (imageToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove);
    }

    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
      imageFiles: prev.imageFiles.filter((_, index) => index !== indexToRemove)
    }));

    // Adjust active image index if needed
    if (activeImageIndex >= indexToRemove && activeImageIndex > 0) {
      setActiveImageIndex(prev => prev - 1);
    }
  };

  // Function to show notification
  const showNotification = (message, type = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });

    // Auto hide notification after 5 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Function to upload images to server
  const uploadImagesToServer = async (files, repairCode) => {
    if (!files || files.length === 0) return [];

    setIsUploading(true);
    try {
      const formData = new FormData();

      // Add repair code first
      formData.append('repair_code', repairCode);

      // Add images
      files.forEach((file, index) => {
        formData.append('images', file);
      });

      console.log('Uploading images with repair code:', repairCode);
      console.log('Files to upload:', files.length);

      const response = await axios.post(
        `${API_BASE}/repair-requests/upload-images`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('Upload response:', response.data);
      return response.data.images;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!equipment) return;

    // Validate form
    if (!formData.description.trim()) {
      toast.error('โปรดกรอกรายละเอียดความเสียหาย');
      return;
    }

    if (!formData.estimatedCost || formData.estimatedCost <= 0) {
      toast.error('โปรดกรอกค่าใช้จ่ายประมาณการ');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate repair code first
      const repairCode = generateRepairCode();

      // Log all relevant data
      console.log('=== Debug Information ===');
      console.log('1. Equipment Object:', {
        id: equipment.id,
        item_id: equipment.item_id,
        name: equipment.name,
        item_code: equipment.item_code,
        category: equipment.category
      });
      console.log('2. Form Data:', {
        description: formData.description,
        estimatedCost: formData.estimatedCost,
        images: formData.images,
        imageFiles: formData.imageFiles
      });
      console.log('3. Requester Info:', requesterInfo);
      console.log('4. Request Date:', requestDate);
      console.log('5. Global User Data:', globalUserData);
      console.log('6. Generated Repair Code:', repairCode);

      // Upload images to server if there are any (with repair code)
      let uploadedImages = [];
      if (formData.imageFiles.length > 0) {
        uploadedImages = await uploadImagesToServer(formData.imageFiles, repairCode);
      }

      // Prepare the repair request data
      const repairData = {
        repair_code: repairCode,
        user_id: globalUserData?.user_id || "1",
        item_id: equipment.item_id || equipment.id,
        problem_description: formData.description,
        request_date: requestDate,
        estimated_cost: Number(formData.estimatedCost) || 0,
        status: "pending",
        pic_filename: uploadedImages.length > 0 ? uploadedImages[0].filename : null,
        images: uploadedImages
      };

      console.log('7. Final Data Being Sent to Server:', repairData);

      // ตรวจสอบรหัสซ้ำฝั่ง backend
      try {
        const response = await axios.post(`${API_BASE}/repair-requests`, repairData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('8. Server Response:', response.data);

        // Update equipment status to "รออนุมัติซ่อม"
        try {
          // Use item_code as canonical identifier
          const equipmentCode = equipment.item_code || equipment.id || equipment.item_id;
          console.log('Updating equipment status for item_code:', equipmentCode);

          if (equipmentCode) {
            const response = await axios.put(`${API_BASE}/equipment/${equipmentCode}/status`, {
              status: "รออนุมัติซ่อม"
            });

            console.log('Equipment status update response:', response.data);
          } else {
            console.warn('No equipment item_code available for status update');
          }
        } catch (error) {
          console.error('Error updating equipment status:', error);
          console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          // Continue with the process even if status update fails
        }

        // If successful, call the onSubmit callback with the response data
        onSubmit({
          description: formData.description,
          estimatedCost: formData.estimatedCost,
          images: formData.images,
          equipment: {
            name: equipment.name,
            item_id: equipment.item_id,
            code: equipment.item_code,
            category: equipmentCategory
          },
          requester: {
            name: requesterInfo.name,
            department: requesterInfo.department
          },
          requestDate: requestDate,
          status: 'pending'
        });

        // ปิด dialog ก่อน
        onClose();
        
        // แสดง toast notification
        toast.success('ส่งคำขอแจ้งซ่อมสำเร็จ');
        

      } catch (error) {
        if (error.response && error.response.status === 409) {
          toast.error(error.response.data.error || 'รหัสแจ้งซ่อมซ้ำ กรุณาลองใหม่');
        } else {
          toast.error('เกิดข้อผิดพลาดในการส่งคำขอแจ้งซ่อม');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextImage = () => {
    setActiveImageIndex(prev => (prev + 1) % formData.images.length);
    setIsZoomed(false);
  };

  const prevImage = () => {
    setActiveImageIndex(prev => (prev - 1 + formData.images.length) % formData.images.length);
    setIsZoomed(false);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'single' ? 'grid' : 'single');
    setIsZoomed(false);
  };

  if (!open || !equipment) return null;

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFilesAndUpdateState(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  // SectionHeader component matching RepairApprovalDialog
  const SectionHeader = ({ title, icon }) => (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-black rounded-xl shadow-md">
        <span className="text-white">{icon}</span>
      </div>
      <div>
        <h4 className="text-lg font-bold text-gray-800">{title}</h4>
        <div className="w-12 h-1 bg-black rounded-full"></div>
      </div>
    </div>
  );

  return (
    <>
      <div className="modal modal-open">
        <div className="modal-box max-w-8xl w-full max-h-[95vh] p-0 rounded-2xl shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-50" data-theme="light">
          <div className="flex flex-col h-full">
            {/* Enhanced Header with gradient */}
            <div className="sticky z-10 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg rounded-2xl">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                      <FaTools className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-bold text-white">
                          แจ้งซ่อมครุภัณฑ์
                        </h2>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-white">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          วันที่แจ้ง: <span className="font-semibold text-white">{requestDate}</span>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ข้อมูลผู้แจ้งและครุภัณฑ์ */}
                <div className="space-y-6">
                  <SectionHeader
                    title="ข้อมูลผู้แจ้งซ่อม"
                    icon={<UserIcon className="h-5 w-5 text-white" />}
                  />
                  <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="p-6">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-200 shadow-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                            <img
                              src={globalUserData?.avatar ? (typeof globalUserData.avatar === 'string' && globalUserData.avatar.startsWith('http') ? globalUserData.avatar : `${UPLOAD_BASE}/uploads/user/${globalUserData.avatar}`) : "/profile.png"}
                              alt={requesterInfo.name}
                              className="w-full h-full object-cover"
                              onError={e => { e.target.onerror = null; e.target.src = '/profile.png'; }}
                            />
                          </div>
                        </div>
                        <div className="text-center space-y-2">
                          <h3 className="font-bold text-xl text-gray-800">{requesterInfo.name}</h3>
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-gray-600 text-sm bg-green-100 px-3 py-1 rounded-full inline-block">{requesterInfo.position}</p>
                            <p className="text-gray-600 text-sm bg-gray-100 px-3 py-1 rounded-full inline-block">{requesterInfo.department}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <SectionHeader
                      title="ข้อมูลครุภัณฑ์"
                      icon={<CubeIcon className="h-5 w-5 text-white" />}
                    />
                    <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="p-6">
                        <div className="space-y-4">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-30 h-30 rounded-xl overflow-hidden flex items-center justify-center border-2 border-blue-200 shadow-sm">
                              <img
                                src={equipment.pic ? (typeof equipment.pic === 'string' && equipment.pic.startsWith('http') ? equipment.pic : `${UPLOAD_BASE}/uploads/${equipment.pic}`) : "/lo.png"}
                                alt={equipment.name}
                                className="max-w-full max-h-full object-contain p-2"
                                onError={e => { e.target.onerror = null; e.target.src = '/lo.png'; }}
                              />
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-blue-600 font-medium mb-1">ชื่อครุภัณฑ์</p>
                              <p className="font-bold text-lg text-gray-800">{equipment.name}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-100">
                              <div className="p-2 bg-blue-500 rounded-full">
                                <TagIcon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="text-sm text-blue-600 font-medium mb-1">รหัสครุภัณฑ์</p>
                                <p className="font-bold text-gray-800">{equipment.item_code}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-full border border-green-100">
                              <div className="p-2 bg-green-500 rounded-full">
                                <CubeIcon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="text-sm text-green-600 font-medium mb-1">ประเภท</p>
                                <p className="font-bold text-gray-800">{equipmentCategory}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* รายละเอียดปัญหาและรูปภาพ */}
                <div className="space-y-6">
                  <SectionHeader
                    title="รายละเอียดปัญหา"
                    icon={<ExclamationTriangleIcon className="h-5 w-5 text-white" />}
                  />
                  <div className="bg-yellow-400 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="p-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            รายละเอียดปัญหา <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="ระบุรายละเอียดของปัญหาที่พบ เช่น อาการ, สาเหตุเบื้องต้น..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            ค่าใช้จ่ายประมาณการ <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9,]*"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            value={formData.estimatedCost ? Number(formData.estimatedCost).toLocaleString() : ''}
                            onChange={e => {
                              const raw = e.target.value.replace(/[^\d]/g, '');
                              if (raw.length <= 8) {
                                setFormData({ ...formData, estimatedCost: raw });
                              }
                            }}
                            placeholder="ระบุค่าใช้จ่าย (บาท)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* รูปภาพความเสียหาย */}
                  <div>
                    <SectionHeader
                      title="รูปภาพความเสียหาย"
                      icon={<DocumentCheckIcon className="h-5 w-5 text-white" />}
                    />
                    <div className="bg-yellow-400 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="p-6">
                        {/* Drop Zone */}
                        <div
                          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                            isDraggingOver
                              ? 'border-black bg-amber-50'
                              : 'border-black hover:border-black hover:bg-amber-50'
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={handleDropZoneClick}
                        >
                          <FaImage className="mx-auto h-12 w-12 text-black mb-4" />
                          <p className="text-sm text-gray-600 mb-2">
                            ลากและวางรูปภาพที่นี่ หรือ <span className="text-black font-medium">คลิกเพื่อเลือกไฟล์</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            รองรับไฟล์ JPG, PNG, GIF ขนาดไม่เกิน 5MB ต่อไฟล์
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => processFilesAndUpdateState(e.target.files)}
                            className="hidden"
                          />
                        </div>

                        {/* Image Preview */}
                        {formData.images.length > 0 && (
                          <div className="mt-4">
                            <h5 className="font-medium text-black mb-3">
                              รูปภาพที่เลือก ({formData.images.length} รูป)
                            </h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {formData.images.map((image, index) => (
                                <div key={index} className="relative group cursor-pointer">
                                  <img
                                    src={image}
                                    alt={`รูปภาพความเสียหาย ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg shadow-lg hover:opacity-80 transition-opacity"
                                  />
                                  <button
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <FaTimes className="text-xs" />
                                  </button>
                                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-3 py-1 rounded-2xl">
                                    รูปที่ {index + 1}
                                  </div>
                                </div>
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

            {/* Footer actions */}
            <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 p-4 rounded-3xl">
              <div className="flex justify-end gap-4">
                <button 
                  onClick={onClose} 
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || isUploading}
                >
                  {isSubmitting || isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      กำลังส่ง...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FaTools />
                      ส่งคำขอแจ้งซ่อม
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={onClose}>close</button>
        </form>
      </div>

      {/* Notification Component */}
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
      />
    </>
  );
}