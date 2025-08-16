import th from 'date-fns/locale/th';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { useEffect, useRef, useState } from "react";
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
  equipmentData
}) {
  // Use item_code as the canonical equipment code
  const [formData, setFormData] = useState(initialFormData || {
    item_code: "",
    name: "",
    category: "",
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

  const statusConfig = {
    "พร้อมใช้งาน": { color: "green", icon: "CheckCircleIcon" },
    "ถูกยืม": { color: "blue", icon: "ExclamationCircleIcon" },
    "ชำรุด": { color: "red", icon: "XCircleIcon" },
    "ระหว่างซ่อม": { color: "amber", icon: "ClockIcon" },
  };

  useEffect(() => {
    if (open) {
      getCategories().then(data => setCategories(data));
      getRooms().then(data => setRooms(data));
    }
    setFormData(equipmentData || initialFormData || {
      item_code: "",
      name: "",
      category: "",
      description: "",
      quantity: "",
      unit: "",
      status: "พร้อมใช้งาน",
      pic: "https://cdn-icons-png.flaticon.com/512/3474/3474360.png"
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

    // If initialFormData uses id, map it to item_code for compatibility
    if (initialFormData && initialFormData.id && !initialFormData.item_code) {
      setFormData(prev => ({ ...prev, item_code: initialFormData.id }));
    }
  }, [equipmentData, initialFormData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      // ตรวจสอบฟิลด์ที่จำเป็น (ยกเว้น description)
      const requiredFields = [
        { key: 'name', label: 'ชื่อครุภัณฑ์' },
        { key: 'quantity', label: 'จำนวน' },
        { key: 'category', label: 'หมวดหมู่' },
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

      // ตรวจสอบชื่อครุภัณฑ์ห้ามมีอักขระพิเศษ (อนุญาต a-zA-Z0-9 ก-ฮ ะ-์ เว้นวรรค)
      const namePattern = /^[a-zA-Z0-9ก-๙ะ-์\s]+$/;
      if (!namePattern.test(formData.name)) {
        setMissingFields(['ชื่อครุภัณฑ์ไม่ถูกต้อง']);
        return;
      }

      let dataToSave = { ...formData };

      // อัปโหลดรูปภาพไปยัง Cloudinary ถ้ามีไฟล์ใหม่
      if (dataToSave.pic instanceof File) {
        setIsUploading(true);
        try {
          console.log('[ADD EQUIPMENT] Uploading image for item_code:', dataToSave.item_code);
          dataToSave.pic = await uploadImage(dataToSave.pic, dataToSave.item_code);
          console.log('[ADD EQUIPMENT] Image uploaded successfully:', dataToSave.pic);
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 3000); // แสดงข้อความ 3 วินาที
        } finally {
          setIsUploading(false);
        }
      }

      // Use item_id for updating equipment instead of item_code
      const payload = { ...dataToSave, item_id: formData.item_id };
      await onSave(payload);

      setFormData(prev => ({ ...prev, item_code: "" }));
      onClose();
    } catch (error) {
      console.error('[ADD EQUIPMENT] Error during submit:', error);
      setMissingFields([`เกิดข้อผิดพลาด: ${error.message}`]);
    }
  };

  const isFormValid = formData.name && formData.quantity && formData.category && formData.unit;

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
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition-colors duration-150 hover:bg-gray-100 p-2 rounded-full"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="space-y-6">
          {/* Prominent Image Upload */}
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-44 h-44 bg-gradient-to-br from-emerald-50 to-white rounded-2xl border-2 border-dashed border-emerald-200 flex items-center justify-center cursor-pointer relative overflow-hidden group shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => fileInputRef.current.click()}
            >
              <img
                src={
                  previewImage ||
                  (typeof formData.pic === 'string'
                    ? (formData.pic.startsWith('http') || formData.pic.startsWith('/uploads'))
                      ? formData.pic
                      : formData.pic.startsWith('https://res.cloudinary.com')
                      ? formData.pic
                      : `/uploads/${formData.pic}`
                    : formData.pic)
                }
                alt={formData.name}
                className="max-h-40 max-w-40 object-contain z-10 transform group-hover:scale-105 transition-transform duration-300"
                onError={e => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3474/3474360.png"; }}
              />
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
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <span className="text-sm font-medium text-gray-600 mt-4 px-4 py-2 rounded-full ">คลิกที่รูปเพื่ออัพโหลดรูปภาพ</span>
            {formData.pic?.name && (
              <p className="text-sm mt-2 text-emerald-600 truncate max-w-[300px]">{formData.pic.name}</p>
            )}
          </div>
          {/* แสดง error ถ้าอัปโหลดไฟล์ผิดประเภท */}
          {imageError && (
            <div className="text-red-600 text-sm font-semibold mt-2 text-center">{imageError}</div>
          )}
          {uploadSuccess && (
            <div className="text-emerald-600 text-sm font-semibold mt-2 text-center flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              อัปโหลดรูปภาพสำเร็จแล้ว
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-800 mb-2">รหัสครุภัณฑ์</label>
              <input
                type="text"
                name="item_code"
                value={formData.item_code}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 shadow-sm group-hover:shadow-md transition-all duration-300"
                placeholder="ระบุรหัสครุภัณฑ์"
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
              isUploading
                ? 'bg-emerald-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
            onClick={handleSubmit}
            disabled={isUploading}
            type="button"
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                กำลังอัปโหลด...
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