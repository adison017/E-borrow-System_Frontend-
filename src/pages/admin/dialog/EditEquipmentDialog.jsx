import React, { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { FaCalendarAlt } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { getCategories, uploadImage, getRooms, UPLOAD_BASE } from "../../../utils/api";
import axios from "../../../utils/axios.js";
import { API_BASE } from "../../../utils/api";

// ย้าย normalizeDate ออกมาอยู่นอก useEffect เพื่อให้ทุกฟังก์ชันเข้าถึงได้
function normalizeDate(val) {
  if (!val) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
    const [day, month, year] = val.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(val)) {
    const d = new Date(val);
    const offset = d.getTimezoneOffset();
    d.setMinutes(d.getMinutes() - offset);
    return d.toISOString().slice(0, 10);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return val;
  }
  return "";
}

export default function EditEquipmentDialog({
  open,
  onClose,
  equipmentData,
  onSave,
  imageUrls,
  setImageUrls,
  uploadedFiles,
  setUploadedFiles,
  onAddImageUrl,
  onRemoveImageUrl,
  onUpdateImageUrl,
  onFileUpload,
  onRemoveUploadedFile,
  onRemoveOldImage
}) {
  // Use item_code as the canonical equipment code
  const [formData, setFormData] = useState({
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
  const [rooms, setRooms] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRemoved, setPendingRemoved] = useState([]);

  const statusConfig = {
    "พร้อมใช้งาน": { color: "green", icon: "CheckCircleIcon" },
    "ถูกยืม": { color: "purple", icon: "ExclamationCircleIcon" },
    "ชำรุด": { color: "red", icon: "XCircleIcon" },
    "กำลังซ่อม": { color: "amber", icon: "ClockIcon" },
    "รออนุมัติซ่อม": { color: "blue", icon: "ClockIcon" },
    "ไม่อนุมัติซ่อม": { color: "orange", icon: "XCircleIcon" },
  };

  useEffect(() => {
    if (open) {
      getCategories().then(data => setCategories(data));
      getRooms().then(data => setRooms(data));
    }

    const defaultData = {
      item_code: "",
      name: "",
      category: "",
      category_id: "",
      description: "",
      quantity: "",
      unit: "",
      status: "พร้อมใช้งาน",
      pic: "https://cdn-icons-png.flaticon.com/512/3474/3474360.png"
    };

    if (equipmentData) {
      setFormData({
        item_code: equipmentData.item_code || equipmentData.item_id || "",
        name: equipmentData.name || "",
        category: equipmentData.category || equipmentData.category_name || "",
        category_id: equipmentData.category_id || "",
        description: equipmentData.description || "",
        quantity: equipmentData.quantity || "",
        unit: equipmentData.unit || "",
        status: equipmentData.status || "พร้อมใช้งาน",
        pic: equipmentData.pic || "https://cdn-icons-png.flaticon.com/512/3474/3474360.png",
        purchaseDate: normalizeDate(equipmentData.purchaseDate) || "",
        price: equipmentData.price || "",
        room_id: equipmentData.room_id || ""
      });
    } else {
      setFormData(defaultData);
    }

    // ตั้งค่า previewImage ใหม่ทุกครั้งที่เปิด dialog
    if (equipmentData?.pic) {
      if (typeof equipmentData.pic === 'string') {
        setPreviewImage(
          equipmentData.pic.startsWith('http') || equipmentData.pic.startsWith('/uploads')
            ? equipmentData.pic
            : `/uploads/${equipmentData.pic}`
        );
      } else {
        setPreviewImage("https://cdn-icons-png.flaticon.com/512/3474/3474360.png");
      }
    } else {
      setPreviewImage("https://cdn-icons-png.flaticon.com/512/3474/3474360.png");
    }

    // หากมี pic เป็น JSON string และยังไม่มี imageUrls จาก props ให้ดึงมาแสดงเป็นรูปภาพปัจจุบัน
    try {
      if (open && equipmentData?.pic && (!imageUrls || imageUrls.length === 0)) {
        if (typeof equipmentData.pic === 'string' && (equipmentData.pic.startsWith('[') || equipmentData.pic.startsWith('{'))) {
          const urls = JSON.parse(equipmentData.pic);
          if (Array.isArray(urls) && urls.length > 0) {
            setImageUrls(urls.filter(Boolean));
          }
        }
      }
    } catch (e) {
      // ignore parse errors
    }

    // ไม่ต้อง map id เป็น item_code แล้ว เพราะเราต้องการให้ user กรอกเอง
  }, [equipmentData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "purchaseDate") {
      setFormData(prev => ({
        ...prev,
        [name]: normalizeDate(value)
      }));
      return;
    }
    if (name === 'category') {
      // Find the selected category and set both category name and category_id
      const selectedCategory = categories.find(cat => cat.name === value);
      setFormData(prev => ({
        ...prev,
        category: value,
        category_id: selectedCategory ? selectedCategory.category_id : ""
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value || "" // Ensure value is never undefined
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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

      // ลบรูปภาพจาก Cloud เฉพาะที่ถูกกดกากบาท โดยจะทำจริงเมื่อกดบันทึกเท่านั้น
      if (pendingRemoved.length > 0 && equipmentData?.item_code) {
        const token = localStorage.getItem('token');
        for (const { idx } of pendingRemoved) {
          try {
            await axios.delete(`${API_BASE}/equipment/${equipmentData.item_code}/images/image_${idx + 1}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (e) {
            // ถ้าลบไม่สำเร็จ ให้ข้ามไป เพื่อไม่บล็อกการบันทึก
            console.error('Failed to delete image from Cloudinary:', e?.message || e);
          }
        }
      }

      // Include item_id for updating equipment
      const payload = { ...dataToSave, item_id: equipmentData.item_id };
      await onSave(payload);
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div className="text-blue-700 font-medium">กำลังบันทึกการเปลี่ยนแปลง...</div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex justify-between items-center pb-3 mb-4 border-b border-gray-100">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center tracking-tight">
            <span className="bg-blue-100 text-blue-700 p-2 rounded-lg mr-3 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </span>
            แก้ไขครุภัณฑ์
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
        <div className="space-y-5">
          {/* รูปภาพหลายรูป */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              รูปภาพครุภัณฑ์ (สูงสุด 10 รูป)
            </label>
            


          {/* รูปภาพปัจจุบัน (หลายรูป) */}
          {imageUrls && imageUrls.some(url => url && url.trim() !== '') && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">รูปภาพปัจจุบัน</h4>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
                {imageUrls.filter(url => url && url.trim() !== '').map((url, index) => (
                  <div key={index} className="relative w-28 h-28 md:w-32 md:h-32 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img
                      src={url}
                      alt={`Current Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://cdn-icons-png.flaticon.com/512/3474/3474360.png';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        // ทำเครื่องหมายว่าจะลบภาพนี้ และลบออกจากการแสดงผลชั่วคราว
                        setPendingRemoved(prev => [...prev, { idx: index, url }]);
                        setImageUrls(prev => prev.filter((_, i) => i !== index));
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-10 shadow-md"
                      title="ลบรูปภาพ"
                    >
                      <MdClose className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">หมายเหตุ: ภาพจะถูกลบออกจากระบบจริงเมื่อกด "บันทึกการเปลี่ยนแปลง" เท่านั้น</p>
            </div>
          )}

            {/* อัปโหลดไฟล์ */}
            <div 
              className="relative border-2 border-dashed border-blue-300 rounded-xl p-8 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 cursor-pointer group"
              onClick={() => document.getElementById('edit-file-upload').click()}
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
                  id="edit-file-upload"
                  name="edit-file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={onFileUpload}
                  className="sr-only"
                />
              </div>
              
              {/* Decorative elements */}
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

            {/* เอาส่วนแสดงตัวอย่างรูปภาพจาก URL ออก และแสดงใน "รูปภาพปัจจุบัน" แทน */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                รหัสครุภัณฑ์ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="item_code"
                value={formData.item_code}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-shadow"
                placeholder="กรุณากรอกรหัสครุภัณฑ์ตามระบบของท่าน"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                ชื่อครุภัณฑ์ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-shadow"
                placeholder="ระบุชื่อครุภัณฑ์"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              หมวดหมู่ <span className="text-rose-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-shadow"
              required
            >
              <option value="" disabled>เลือกหมวดหมู่</option>
              {categories.map(category => (
                <option key={category.category_id} value={category.name}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">รายละเอียด</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-shadow"
              placeholder="รายละเอียดครุภัณฑ์"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                จำนวน <span className="text-rose-500">*</span>
              </label>
              <div className="flex w-full">
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-shadow"
                  placeholder="ระบุจำนวน"
                  required
                  min={1}
                />
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="bg-white border-t border-b border-r border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
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
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">สถานะ <span className="text-rose-500">*</span></label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-shadow h-[42px] min-h-[42px]"
              >
                {Object.keys(statusConfig).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">วันที่จัดซื้อ <span className="text-rose-500">*</span></label>
              <div className="relative">
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 shadow-sm group-hover:shadow-md transition-all duration-300"
                  placeholder="เลือกวันที่"
                  onClick={() => document.querySelector('input[name=\"purchaseDate\"]').showPicker()}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => document.querySelector('input[name=\"purchaseDate\"]').showPicker()}
                >
                  <FaCalendarAlt />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">ราคา ฿ <span className="text-rose-500">*</span></label>
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
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 shadow-sm group-hover:shadow-md transition-all duration-300"
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
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 shadow-sm group-hover:shadow-md transition-all duration-300"
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
              <path fillRule="evenodd" d="M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 10zm-8-3a1 1 0 00-1 1v3a1 1 0 002 0V8a1 1 0 00-1-1zm0 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            กรุณากรอกข้อมูลต่อไปนี้ให้ครบถ้วน: {missingFields.join(', ')}
          </div>
        )}
        </div>
        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end space-x-3">
          <button
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm"
            onClick={onClose}
            type="button"
          >
            ยกเลิก
          </button>
          <button
            className={`px-5 py-2.5 text-sm font-medium text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm ${
              !isFormValid || isUploading || isSubmitting
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            onClick={handleSubmit}
            disabled={!isFormValid || isUploading || isSubmitting}
            type="button"
          >
            {isUploading || isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {isSubmitting ? 'กำลังบันทึก...' : 'กำลังอัปโหลด...'}
              </div>
            ) : (
              'บันทึกการเปลี่ยนแปลง'
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