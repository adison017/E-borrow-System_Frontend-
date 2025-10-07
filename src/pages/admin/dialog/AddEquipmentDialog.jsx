import React, { useEffect, useRef, useState } from "react";
import th from 'date-fns/locale/th';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from "react-icons/fa";
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
    <div className="modal modal-open">
      <div className="modal-box relative bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-[150vh] w-full p-5 z-50 overflow-y-auto max-h-[90vh]">
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <div className="text-emerald-700 font-medium">กำลังเพิ่มครุภัณฑ์...</div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex justify-between items-center pb-3 mb-4 border-b border-gray-100">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center tracking-tight">
            <span className="bg-emerald-100 text-emerald-700 p-2 rounded-lg mr-3 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </span>
            เพิ่มครุภัณฑ์ใหม่
          </h3>
          <button
            onClick={isSubmitting ? undefined : onClose}
            className="text-gray-500 hover:text-gray-800 transition-colors duration-150 hover:bg-gray-100 p-2 rounded-full"
            disabled={isSubmitting}
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="space-y-6">
          {/* รูปภาพหลายรูป */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              รูปภาพครุภัณฑ์ (สูงสุด 10 รูป)
            </label>
            


            {/* อัปโหลดไฟล์ */}
            <div 
              className="relative border-2 border-dashed border-emerald-300 rounded-xl p-8 bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 transition-all duration-300 cursor-pointer group"
              onClick={() => document.getElementById('file-upload').click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('border-emerald-500', 'bg-emerald-100');
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-100');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-100');
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                  const event = { target: { files } };
                  onFileUpload(event);
                }
              }}
            >
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors duration-300">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors duration-300">
                    อัปโหลดรูปภาพ
                  </h3>
                  <p className="text-sm text-gray-600">
                    คลิกเพื่อเลือกไฟล์ หรือ <span className="font-medium text-emerald-600">ลากและวางที่นี่</span>
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
              
              {/* Decorative elements */}
              <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
                <svg className="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="absolute bottom-4 left-4 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* แสดงไฟล์ที่อัปโหลด */}
            {uploadedFiles && uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">ไฟล์ที่เลือก:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveUploadedFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                        {file.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* แสดงตัวอย่างรูปภาพจาก URL */}
            {imageUrls && imageUrls.some(url => url && url.trim() !== '') && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">ตัวอย่างรูปภาพจาก URL:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {imageUrls.filter(url => url && url.trim() !== '').map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`URL Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.target.src = "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                รหัสครุภัณฑ์ <span className="text-rose-500">*</span>
              </label>
                             <input
                 type="text"
                 name="item_code"
                 value={formData.item_code}
                 onChange={handleChange}
                 className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 shadow-sm group-hover:shadow-md transition-all duration-300"
                 placeholder="กรุณากรอกรหัสครุภัณฑ์ตามระบบของท่าน"
                 required
               />
            </div>
            <div className="group">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                ชื่อครุภัณฑ์ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 shadow-sm group-hover:shadow-md transition-all duration-300"
                placeholder="ระบุชื่อครุภัณฑ์"
                required
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              หมวดหมู่ <span className="text-rose-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 shadow-sm group-hover:shadow-md transition-all duration-300"
              required
            >
              <option value="" disabled>เลือกหมวดหมู่</option>
              {categories.map(category => (
                <option key={category.category_id} value={category.name}>{category.name}</option>
              ))}
            </select>
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-800 mb-2">รายละเอียด</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 shadow-sm group-hover:shadow-md transition-all duration-300"
              placeholder="รายละเอียดครุภัณฑ์"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                จำนวน <span className="text-rose-500">*</span>
              </label>
              <div className="flex w-full group">
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-l-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 shadow-sm group-hover:shadow-md transition-all duration-300"
                  placeholder="ระบุจำนวน"
                  required
                  min={1}
                  step="1"
                  pattern="[0-9]*"
                  inputMode="numeric"
                />
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className=" bg-white border-t border-b border-r border-gray-300 rounded-r-xl focus:ring-2 focus:border-emerald-500 text-gray-800 shadow-sm group-hover:shadow-md transition-all duration-300 ring-emerald-300 focus:ring-emerald-600"
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
              <label className="block text-sm font-semibold text-gray-800 mb-2">สถานะ <span className="text-rose-500">*</span></label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 shadow-sm group-hover:shadow-md transition-all duration-300"
              >
                {Object.keys(statusConfig).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-800 mb-2">วันที่จัดซื้อ <span className="text-rose-500">*</span></label>
              <div className="relative">
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 shadow-sm group-hover:shadow-md transition-all duration-300"
                  placeholder="เลือกวันที่"
                  onClick={() => document.querySelector('input[name="purchaseDate"]').showPicker()}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => document.querySelector('input[name="purchaseDate"]').showPicker()}
                >
                  <FaCalendarAlt />
                </button>
              </div>
            </div>
            <div className="group">
              <label className="block text-sm font-semibold text-gray-800 mb-2">ราคา ฿ <span className="text-rose-500">*</span></label>
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
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 shadow-sm group-hover:shadow-md transition-all duration-300"
                placeholder="ระบุราคา"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-800 mb-2">สถานที่จัดเก็บ <span className="text-rose-500">*</span></label>
            <select
              name="room_id"
              value={formData.room_id || ''}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 shadow-sm group-hover:shadow-md transition-all duration-300"
              required
            >
              <option value="" disabled>เลือกสถานที่จัดเก็บ</option>
              {rooms.map(room => (
                <option key={room.room_id} value={room.room_id}>
                  {room.room_name} ({room.room_code})
                </option>
              ))}
            </select>
            {/* แสดง preview ห้องที่เลือก */}
            {formData.room_id && rooms.length > 0 && (
              <div className="flex items-center gap-3 mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
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
                  className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                  onError={e => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3474/3474360.png"; }}
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800">{rooms.find(r => String(r.room_id) === String(formData.room_id))?.room_name}</span>
                  <span className="text-xs text-gray-500">{rooms.find(r => String(r.room_id) === String(formData.room_id))?.room_code}</span>
                </div>
              </div>
            )}
          </div>

          {missingFields.length > 0 && (
            <div className="mt-2 mb-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8zm-8-3a1 1 0 00-1 1v3a1 1 0 002 0V8a1 1 0 00-1-1zm0 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              กรุณากรอกข้อมูลต่อไปนี้ให้ครบถ้วน: {missingFields.join(', ')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end space-x-4">
          <button
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 shadow-sm hover:shadow-md"
            onClick={onClose}
            type="button"
          >
            ยกเลิก
          </button>
          <button
            className={`px-6 py-2.5 text-sm font-medium text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
              (isUploading || isSubmitting)
                ? 'bg-emerald-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
            onClick={handleSubmit}
            disabled={isUploading || isSubmitting}
            type="button"
          >
            {isUploading || isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                กำลังบันทึก...
              </div>
            ) : (
              'เพิ่มครุภัณฑ์'
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