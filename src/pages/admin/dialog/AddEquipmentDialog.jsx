import React, { useEffect, useRef, useState } from "react";
import th from 'date-fns/locale/th';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt, FaGripVertical } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { getCategories, uploadImage, getRooms, UPLOAD_BASE } from "../../../utils/api";

registerLocale('th', th);
dayjs.locale('th');

export default function AddEquipmentDialog({
  open,
  onClose,
  initialFormData,
  onSave,
  equipmentData,
  imageUrls,
  setImageUrls,
  uploadedFiles,
  setUploadedFiles,
  onAddImageUrl,
  onRemoveImageUrl,
  onUpdateImageUrl,
  onFileUpload,
  onRemoveUploadedFile
}) {
  // Use item_code as the canonical equipment code
  const [formData, setFormData] = useState(initialFormData || {
    item_code: "",
    name: "",
    category: "",
    category_id: "",
    description: "",
    quantity: "",
    unit: "",
    status: "พร้อมใช้งาน",
    pic: "https://cdn-icons-png.flaticon.com/512/3474/3474360.png"
  });
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [missingFields, setMissingFields] = useState([]);
  const [imageError, setImageError] = useState("");
  const [rooms, setRooms] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasInitialized = useRef(false);
  const [draggedFileIndex, setDraggedFileIndex] = useState(null);
  const [hoverFileIndex, setHoverFileIndex] = useState(null);

  const statusConfig = {
    "พร้อมใช้งาน": { color: "green", icon: "CheckCircleIcon" },
    "ถูกยืม": { color: "purple", icon: "ExclamationCircleIcon" },
    "ชำรุด": { color: "red", icon: "XCircleIcon" },
    "กำลังซ่อม": { color: "amber", icon: "ClockIcon" },
    "รออนุมัติซ่อม": { color: "blue", icon: "ClockIcon" },
    "ไม่อนุมัติซ่อม": { color: "orange", icon: "XCircleIcon" },
  };

  useEffect(() => {
    console.log('🔄 AddEquipment useEffect triggered:', { equipmentData, initialFormData, open, hasInitialized: hasInitialized.current });

    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    if (open && !hasInitialized.current) {
      hasInitialized.current = true;
      console.log('🎯 AddEquipment Initializing form data for the first time');

      getCategories().then(data => setCategories(data));
      getRooms().then(data => setRooms(data));

      // สำหรับ AddEquipmentDialog ต้องให้ item_code เป็นค่าว่างเสมอ
      const baseData = equipmentData || initialFormData || {};
      console.log('📝 AddEquipment Setting form data from baseData:', baseData);
      setFormData({
        item_code: "", // ต้องเป็นค่าว่างเสมอสำหรับการเพิ่มใหม่
        name: baseData.name || "",
        category: baseData.category || "",
        category_id: baseData.category_id || "",
        description: baseData.description || "",
        quantity: baseData.quantity || "",
        unit: baseData.unit || "",
        status: baseData.status || "พร้อมใช้งาน",
        pic: baseData.pic || "https://cdn-icons-png.flaticon.com/512/3474/3474360.png"
      });

      // ตั้งค่า previewImage ใหม่ทุกครั้งที่เปิด dialog
      const pic = equipmentData?.pic || initialFormData?.pic;
      if (pic) {
        if (typeof pic === 'string') {
          setPreviewImage(
            pic.startsWith('http') || pic.startsWith('/uploads')
              ? pic
              : `/uploads/${pic}`
          );
        } else {
          setPreviewImage("https://cdn-icons-png.flaticon.com/512/3474/3474360.png");
        }
      } else {
        setPreviewImage("https://cdn-icons-png.flaticon.com/512/3474/3474360.png");
      }
    } else if (open && hasInitialized.current) {
      console.log('⏭️ AddEquipment Dialog already initialized, skipping form reset');
    }

    // Reset the flag when dialog closes
    if (!open) {
      console.log('🚪 AddEquipment Dialog closed, resetting initialization flag');
      hasInitialized.current = false;
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
    // ไม่ต้อง map id เป็น item_code แล้ว เพราะเราต้องการให้ user กรอกเอง
  }, [equipmentData, initialFormData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('🔵 AddEquipment handleChange called:', { name, value, currentFormData: formData });

    if (name === 'category') {
      // Find the selected category and set both category name and category_id
      const selectedCategory = categories.find(cat => cat.name === value);
      setFormData(prev => {
        const newData = {
          ...prev,
          category: value,
          category_id: selectedCategory ? selectedCategory.category_id : ""
        };
        console.log('✅ Updated formData (category):', newData);
        return newData;
      });
    } else {
      setFormData(prev => {
        const newData = { ...prev, [name]: value };
        console.log('✅ Updated formData (general):', newData);
        return newData;
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setImageError('อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น');
        setFormData(prev => ({ ...prev, pic: "https://cdn-icons-png.flaticon.com/512/3474/3474360.png" }));
        setPreviewImage("https://cdn-icons-png.flaticon.com/512/3474/3474360.png");
        return;
      } else {
        setImageError("");
      }
      setFormData(prev => ({
        ...prev,
        pic: file
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      purchaseDate: date ? dayjs(date).format('YYYY-MM-DD') : ''
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      // ตรวจสอบฟิลด์ที่จำเป็น (ยกเว้น description)
      const requiredFields = [
        { key: 'item_code', label: 'รหัสครุภัณฑ์' },
        { key: 'name', label: 'ชื่อครุภัณฑ์' },
        { key: 'quantity', label: 'จำนวน' },
        { key: 'category', label: 'หมวดหมู่' },
        { key: 'category_id', label: 'หมวดหมู่' },
        { key: 'unit', label: 'หน่วย' },
        { key: 'status', label: 'สถานะ' },
        { key: 'purchaseDate', label: 'วันที่จัดซื้อ' },
        { key: 'price', label: 'ราคา' },
        { key: 'room_id', label: 'สถานที่จัดเก็บ' }
      ];
      const missing = requiredFields.filter(f => !formData[f.key] || String(formData[f.key]).trim() === '').map(f => f.label);
      setMissingFields(missing);
      if (missing.length > 0) {
        return;
      }

      // ตรวจสอบชื่อครุภัณฑ์ (อนุญาตตัวอักษรไทย อังกฤษ ตัวเลข เว้นวรรค และเครื่องหมายวรรคตอนทั่วไป)
      const namePattern = /^[a-zA-Z0-9ก-๛\s\-\(\)\.\/\%\#\@\!\&\+\=\:\;\'\"\?\,\>\<\[\]\{\}\_\*\^\~\`\|\\]+$/;
      if (!namePattern.test(formData.name)) {
        setMissingFields(['ชื่อครุภัณฑ์ไม่ถูกต้อง (อนุญาตตัวอักษรไทย อังกฤษ ตัวเลข เว้นวรรค และเครื่องหมายวรรคตอนทั่วไป)']);
        return;
      }

      let dataToSave = { ...formData };

      // จัดการรูปภาพหลายรูป
      if (uploadedFiles.length > 0 || imageUrls.some(url => url && url.trim() !== '')) {
        // จัดการอัปโหลดรูปภาพหลายรูปไว้ที่หน้า ManageEquipment เพื่อหลีกเลี่ยงการอัปโหลดซ้ำ
        // ที่นี่ไม่ทำการอัปโหลดไฟล์และไม่แก้ไข dataToSave.pic
      }

      // Use item_id for updating equipment instead of item_code
      const payload = { ...dataToSave, item_id: formData.item_id };
      await onSave(payload);

      // Reset form data after successful save
      setFormData({
        item_code: "",
        name: "",
        category: "",
        category_id: "",
        description: "",
        quantity: "",
        unit: "",
        status: "พร้อมใช้งาน",
        pic: "https://cdn-icons-png.flaticon.com/512/3474/3474360.png"
      });
      setPreviewImage("https://cdn-icons-png.flaticon.com/512/3474/3474360.png");
      onClose();
    } catch (error) {
      // Error during submit
      setMissingFields([`เกิดข้อผิดพลาด: ${error.message}`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.item_code && formData.name && formData.quantity && formData.category && formData.category_id && formData.unit;

  const StatusDisplay = ({ status }) => {
    const config = statusConfig[status] || {
      color: "gray",
      icon: "ExclamationCircleIcon"
    };

    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-${config.color}-50 border border-${config.color}-100`}>
        <span className={`text-${config.color}-700 font-medium text-base`}>
          {status}
        </span>
      </div>
    );
  };

  if (!open) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm">
      <div className="modal-box relative bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-[150vh] w-full p-6 z-50 overflow-y-auto max-h-[90vh] animate-fadeIn">
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div className="text-blue-700 font-medium">กำลังเพิ่มครุภัณฑ์...</div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex justify-between items-center pb-4 mb-6">
          <h3 className="text-3xl font-bold text-gray-800 flex items-center tracking-tight">
            <span className="bg-blue-600 text-white p-3 rounded-full mr-3 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </span>
            เพิ่มครุภัณฑ์ใหม่
          </h3>
          <button
            onClick={() => {
              if (!isSubmitting) {
                setUploadedFiles([]);
                onClose();
              }
            }}
            className="text-gray-500 hover:text-gray-700 transition-all duration-300 hover:bg-gray-100 p-2.5 rounded-xl hover:scale-110"
            disabled={isSubmitting}
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="space-y-5">
          {/* รูปภาพหลายรูป */}
          <div className="space-y-4 bg-gray-50 rounded-2xl p-5 shadow-sm border border-gray-200">
            <label className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              รูปภาพครุภัณฑ์ (สูงสุด 10 รูป)
            </label>
            


            {uploadedFiles && uploadedFiles.length === 0 ? (
              <div 
                className="relative border-2 border-dashed border-blue-300 rounded-xl p-8 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 cursor-pointer group"
                onClick={() => document.getElementById('file-upload').click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-blue-500', 'bg-blue-100');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-100');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-100');
                  const files = Array.from(e.dataTransfer.files);
                  if (files.length > 0) {
                    const event = { target: { files } };
                    onFileUpload(event);
                  }
                }}
              >
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                      อัปโหลดรูปภาพ
                    </h3>
                    <p className="text-sm text-gray-600">
                      คลิกเพื่อเลือกไฟล์ หรือ <span className="font-medium text-blue-600">ลากและวางที่นี่</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      รองรับ PNG, JPG, GIF • สูงสุด 5MB ต่อไฟล์ • เลือกได้หลายไฟล์
                    </p>
                  </div>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={onFileUpload}
                    className="sr-only"
                  />
                </div>
                <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
                  <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="absolute bottom-4 left-4 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3 items-start justify-center">
                {uploadedFiles[0] && (
                  <div 
                    draggable
                    onDragStart={() => setDraggedFileIndex(0)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setHoverFileIndex(0);
                    }}
                    onDragLeave={() => setHoverFileIndex(null)}
                    onDrop={() => {
                      if (draggedFileIndex !== null && draggedFileIndex !== 0) {
                        const newFiles = [...uploadedFiles];
                        const [removed] = newFiles.splice(draggedFileIndex, 1);
                        newFiles.splice(0, 0, removed);
                        setUploadedFiles(newFiles);
                      }
                      setDraggedFileIndex(null);
                      setHoverFileIndex(null);
                    }}
                    onDragEnd={() => {
                      setDraggedFileIndex(null);
                      setHoverFileIndex(null);
                    }}
                    className={`relative group rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 border-3 border-blue-400 shadow-xl ring-2 ring-blue-200 transition-all duration-300 cursor-move max-w-md mx-auto ${
                      hoverFileIndex === 0 && draggedFileIndex !== null && draggedFileIndex !== 0 ? 'scale-105 ring-4 ring-green-400 border-green-400' : 'hover:shadow-2xl hover:scale-105'
                    }`}
                  >
                    <div className="relative h-64">
                      <img
                        src={URL.createObjectURL(uploadedFiles[0])}
                        alt="Main Preview"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <FaGripVertical className="w-3 h-3 text-gray-600" />
                      </div>
                      <div className="absolute bottom-2 left-2 bg-orange-500 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                        #1
                      </div>
                      <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        รูปหลัก
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveUploadedFile(0)}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg opacity-0 group-hover:opacity-100 hover:scale-110"
                        title="ลบไฟล์"
                      >
                        <MdClose className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="truncate font-medium">{uploadedFiles[0].name}</p>
                        <p className="text-gray-300 text-[10px]">{(uploadedFiles[0].size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  </div>
                )}
                </div>
                {uploadedFiles.length > 1 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {uploadedFiles.slice(1).map((file, idx) => {
                    const index = idx + 1;
                    return (
                    <div 
                      key={index} 
                      draggable
                      onDragStart={() => setDraggedFileIndex(index)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setHoverFileIndex(index);
                      }}
                      onDragLeave={() => setHoverFileIndex(null)}
                      onDrop={() => {
                        if (draggedFileIndex !== null && draggedFileIndex !== index) {
                          const newFiles = [...uploadedFiles];
                          const [removed] = newFiles.splice(draggedFileIndex, 1);
                          newFiles.splice(index, 0, removed);
                          setUploadedFiles(newFiles);
                        }
                        setDraggedFileIndex(null);
                        setHoverFileIndex(null);
                      }}
                      onDragEnd={() => {
                        setDraggedFileIndex(null);
                        setHoverFileIndex(null);
                      }}
                      className={`relative group rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border-2 transition-all duration-300 cursor-move ${
                        draggedFileIndex === index ? 'border-blue-400 shadow-xl scale-105 opacity-50' : 
                        hoverFileIndex === index && draggedFileIndex !== null && draggedFileIndex !== index ? 'border-green-400 shadow-xl scale-110 ring-4 ring-green-200' :
                        'border-gray-200 hover:border-blue-300 hover:shadow-lg hover:scale-105'
                      }`}
                    >
                      <div className="aspect-square relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Drag Handle */}
                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                          <FaGripVertical className="w-3 h-3 text-gray-600" />
                        </div>
                        {/* Image Number Badge */}
                        <div className="absolute bottom-2 left-2 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                          #{index + 1}
                        </div>
                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => onRemoveUploadedFile(index)}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg opacity-0 group-hover:opacity-100 hover:scale-110"
                          title="ลบไฟล์"
                        >
                          <MdClose className="w-4 h-4" />
                        </button>
                        {/* File Name Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="truncate font-medium">{file.name}</p>
                          <p className="text-gray-300 text-[10px]">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                  <div 
                  className="relative border-2 border-dashed border-blue-300 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 cursor-pointer group aspect-square flex items-center justify-center"
                  onClick={() => document.getElementById('file-upload').click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-blue-500', 'bg-blue-100');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-100');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-100');
                    const files = Array.from(e.dataTransfer.files);
                    if (files.length > 0) {
                      const event = { target: { files } };
                      onFileUpload(event);
                    }
                  }}
                >
                  <div className="text-center p-2">
                    <div className="mx-auto w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-colors">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">เพิ่มรูป</p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={onFileUpload}
                    className="sr-only"
                  />
                </div>
                  </div>
                  
                )}
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-xs text-blue-700">
                    <p className="font-medium">คุณสามารถลากและวางรูปภาพเพื่อเปลี่ยนตำแหน่งได้</p>
                  </div>
                </div>
              </div>
            )}


          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                รหัสครุภัณฑ์ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="item_code"
                value={formData.item_code}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-all duration-300 hover:border-blue-400 hover:shadow-sm"
                placeholder="กรุณากรอกรหัสครุภัณฑ์ตามระบบของท่าน"
                required
              />
            </div>
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                ชื่อครุภัณฑ์ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-all duration-300 hover:border-blue-400 hover:shadow-sm"
                placeholder="ระบุชื่อครุภัณฑ์"
                required
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              หมวดหมู่ <span className="text-rose-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-all duration-300 hover:border-blue-400 hover:shadow-sm cursor-pointer"
              required
            >
              <option value="" disabled>เลือกหมวดหมู่</option>
              {categories.map(category => (
                <option key={category.category_id} value={category.name}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              รายละเอียด
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-all duration-300 hover:border-blue-400 hover:shadow-sm resize-none"
              placeholder="รายละเอียดครุภัณฑ์"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                จำนวน <span className="text-rose-500">*</span>
              </label>
              <div className="flex w-full rounded-xl overflow-hidden">
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-r-0 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-all duration-300"
                  placeholder="ระบุจำนวน"
                  required
                  min={1}
                />
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="bg-gray-50 border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 px-3 cursor-pointer"
                  required
                >
                  <option value="" disabled>เลือกหน่วย</option>
                  <option value="ชิ้น">ชิ้น</option>
                  <option value="ชุด">ชุด</option>
                  <option value="กล่อง">กล่อง</option>
                  <option value="อัน">อัน</option>
                  <option value="รายการ">รายการ</option>
                </select>
              </div>
            </div>
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                สถานะ <span className="text-rose-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-all duration-300 hover:border-blue-400 hover:shadow-sm cursor-pointer"
              >
                {Object.keys(statusConfig).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                วันที่จัดซื้อ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-all duration-300 hover:shadow-sm cursor-pointer"
                  placeholder="เลือกวันที่"
                  onClick={() => document.querySelector('input[name="purchaseDate"]').showPicker()}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3.5 text-blue-500 hover:text-blue-700 focus:outline-none transition-colors duration-300"
                  onClick={() => document.querySelector('input[name="purchaseDate"]').showPicker()}
                >
                  <FaCalendarAlt className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                ราคา ฿ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-blue-600 font-bold text-lg">฿</span>
                <input
                  type="text"
                  name="price"
                  value={formData.price ? Number(formData.price).toLocaleString('th-TH') : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setFormData(prev => ({
                      ...prev,
                      price: value
                    }));
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-all duration-300 hover:shadow-sm"
                  placeholder="ระบุราคา"
                />
              </div>
            </div>
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              สถานที่จัดเก็บ <span className="text-rose-500">*</span>
            </label>
            <select
              name="room_id"
              value={formData.room_id || ''}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-all duration-300 hover:shadow-sm cursor-pointer"
              required
            >
              <option value="" disabled>เลือกสถานที่จัดเก็บ</option>
              {rooms.map(room => (
                <option key={room.room_id} value={room.room_id}>
                  {room.room_name}
                </option>
              ))}
            </select>
            {/* แสดง preview ห้องที่เลือก */}
            {formData.room_id && rooms.length > 0 && (
              <div className="flex items-center gap-3 mt-3 p-3 bg-blue-50 rounded-xl border-2 border-blue-200 shadow-sm transition-all duration-300">
                <img
                  src={(() => {
                    const r = rooms.find(r => String(r.room_id) === String(formData.room_id));
                    if (!r) return "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
                    try {
                      const urls = JSON.parse(r.image_url);
                      return Array.isArray(urls) && urls[0] ? (urls[0].startsWith('http') ? urls[0] : `${UPLOAD_BASE}${urls[0]}`) : "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
                    } catch {
                      return r.image_url && r.image_url.startsWith('http') ? r.image_url : `${UPLOAD_BASE}${r.image_url}`;
                    }
                  })()}
                  alt="room preview"
                  className="w-14 h-14 object-cover rounded-xl border-2 border-white shadow-md"
                  onError={e => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3474/3474360.png"; }}
                />
                <div className="flex flex-col">
                  <span className="text-xs text-blue-600 font-medium">สถานที่ที่เลือก</span>
                  <span className="font-bold text-gray-800 text-lg">{rooms.find(r => String(r.room_id) === String(formData.room_id))?.room_name}</span>
                </div>
              </div>
            )}
          </div>

          {missingFields.length > 0 && (
          <div className="mt-2 mb-2 p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-red-700 text-sm flex items-center gap-3 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8zm-8-3a1 1 0 00-1 1v3a1 1 0 002 0V8a1 1 0 00-1-1zm0 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-bold text-red-800">กรุณากรอกข้อมูลให้ครบถ้วน</p>
              <p className="text-red-600 mt-0.5">{missingFields.join(', ')}</p>
            </div>
          </div>
        )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-5 flex justify-end space-x-4">
          <button
            className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-300 shadow-sm hover:shadow-md"
            onClick={() => {
              setUploadedFiles([]);
              onClose();
            }}
            type="button"
          >
            ยกเลิก
          </button>
          <button
            className={`px-6 py-3 text-sm font-semibold text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 shadow-sm ${
              !isFormValid || isUploading || isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 hover:shadow-md focus:ring-blue-500"
            }`}
            onClick={handleSubmit}
            disabled={!isFormValid || isUploading || isSubmitting}
            type="button"
          >
            {isUploading || isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {isSubmitting ? 'กำลังบันทึก...' : 'กำลังอัปโหลด...'}
              </div>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                เพิ่มครุภัณฑ์
              </span>
            )}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </div>
  );
}