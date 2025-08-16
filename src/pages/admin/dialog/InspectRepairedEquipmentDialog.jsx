import axios from 'axios';
import { useState } from 'react';
import { FaCheckCircle, FaTimesCircle, FaTools } from 'react-icons/fa';

export default function InspectRepairedEquipmentDialog({
  open,
  onClose,
  equipment,
  onSubmit
}) {
  const [formData, setFormData] = useState({
    inspectionNotes: '',
    isRepaired: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!formData.inspectionNotes.trim()) {
      setError('โปรดกรอกบันทึกการตรวจสอบ');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {

      const newStatus = formData.isRepaired ? 'พร้อมใช้งาน' : 'ชำรุด';
      // อัปเดตสถานะอุปกรณ์ใน backend
      await axios.put(`/api/equipment/${equipment.item_code}/status`, {
        status: newStatus,
        inspectionNotes: formData.inspectionNotes,
        inspectionDate: new Date().toISOString().split('T')[0],
      });

      // อัปเดตสถานะ repair_requests เป็น 'completed' ถ้าซ่อมเสร็จสมบูรณ์, 'incomplete' ถ้ายังไม่สมบูรณ์
      if (equipment.repair_request_id) {
        // 1. ดึงข้อมูล repair request ปัจจุบัน
        const { data: currentRequest } = await axios.get(`/api/repair-requests/${equipment.repair_request_id}`);
        // 2. ส่งข้อมูลเดิมกลับไปทั้งหมด ยกเว้นเปลี่ยน status
        await axios.put(`/api/repair-requests/${equipment.repair_request_id}`, {
          ...currentRequest,
          status: formData.isRepaired ? 'completed' : 'incomplete',
          // สามารถเพิ่ม field อื่นๆ ที่จำเป็นได้ เช่น inspectionNotes, inspectionDate
        });
      }

      // ส่งข้อมูล inspection กลับไปให้ parent
      onSubmit({
        ...formData,
        equipment: {
          name: equipment.name,
          item_id: equipment.item_id,
          code: equipment.item_code,
          category: equipment.category || 'อุปกรณ์ทั่วไป',
        },
        inspectionDate: new Date().toISOString().split('T')[0],
        status: newStatus,
        inspectionResult: formData.isRepaired ? 'ซ่อมเสร็จสมบูรณ์' : 'ยังไม่สมบูรณ์',
      });
      setFormData({ inspectionNotes: '', isRepaired: true });
      onClose();
    } catch (error) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      inspectionNotes: '',
      isRepaired: true
    });
    setError('');
    onClose();
  };

  if (!open || !equipment) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl w-full bg-white rounded-2xl shadow-2xl border border-gray-200 p-0 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-100 to-blue-50">
          <h3 className="text-xl font-bold flex items-center gap-3 text-blue-700">
            <FaTools className="text-blue-500 text-2xl" />
            <span>ตรวจรับครุภัณฑ์หลังซ่อม</span>
          </h3>
          <button onClick={handleClose} className="btn btn-sm btn-circle btn-ghost hover:opacity-70">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6 bg-white">
          {/* ข้อมูลครุภัณฑ์ */}
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 shadow-sm">
            <h4 className="font-semibold text-blue-600 flex items-center gap-2 mb-3 text-base">
              <FaTools className="text-blue-500" />
              ข้อมูลครุภัณฑ์
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p><span className="font-medium">ชื่อ:</span> {equipment.name}</p>
                <p><span className="font-medium">รหัส:</span> {equipment.item_code}</p>
              </div>
              <div>
                <p><span className="font-medium">ประเภท:</span> {equipment.category || 'อุปกรณ์ทั่วไป'}</p>
                <p><span className="font-medium">สถานะปัจจุบัน:</span>
                  <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                    equipment.status === 'กำลังซ่อม' ? 'bg-amber-100 text-amber-800' :
                    equipment.status === 'ชำรุด' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {equipment.status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* บันทึกการตรวจสอบ */}
          <div>
            <label className="label mb-2">
              <span className="label-text text-base font-medium text-gray-700">
                บันทึกการตรวจสอบ <span className="text-red-500">*</span>
              </span>
            </label>
            <textarea
              rows={4}
              className="textarea w-full bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition p-3 text-gray-800"
              value={formData.inspectionNotes}
              onChange={(e) => setFormData({ ...formData, inspectionNotes: e.target.value })}
              placeholder="บันทึกผลการตรวจสอบ เช่น การซ่อมแซมที่ทำ, ส่วนที่ยังต้องปรับปรุง, ข้อสังเกตต่างๆ..."
            />
            {error && formData.inspectionNotes.trim() === '' && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>

          {/* สถานะการซ่อม */}
          <div>
            <label className="label mb-2">
              <span className="label-text text-base font-medium text-gray-700">ผลการตรวจสอบ</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <label className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-lg border-2 transition-all ${
                formData.isRepaired
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 hover:bg-green-50 hover:border-green-200'
              }`}>
                <input
                  type="radio"
                  name="repairStatus"
                  className="radio radio-success"
                  checked={formData.isRepaired}
                  onChange={() => setFormData({ ...formData, isRepaired: true })}
                />
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-600 text-lg" />
                  <span className="text-green-700 font-medium">ซ่อมเสร็จสมบูรณ์</span>
                </div>
              </label>
              <label className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-lg border-2 transition-all ${
                !formData.isRepaired
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 hover:bg-red-50 hover:border-red-200'
              }`}>
                <input
                  type="radio"
                  name="repairStatus"
                  className="radio radio-error"
                  checked={!formData.isRepaired}
                  onChange={() => setFormData({ ...formData, isRepaired: false })}
                />
                <div className="flex items-center gap-2">
                  <FaTimesCircle className="text-red-600 text-lg" />
                  <span className="text-red-700 font-medium">ยังไม่สมบูรณ์</span>
                </div>
              </label>
            </div>
          </div>

          {/* แสดงสถานะที่จะเปลี่ยนเป็น */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h5 className="font-medium text-gray-700 mb-2">สถานะที่จะเปลี่ยนเป็น:</h5>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                formData.isRepaired
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {formData.isRepaired ? 'พร้อมใช้งาน' : 'ชำรุด'}
              </span>
              <span className="text-gray-500 text-sm">
                {formData.isRepaired
                  ? '(ครุภัณฑ์พร้อมให้บริการ)'
                  : '(ต้องส่งซ่อมเพิ่มเติม)'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="modal-action px-6 py-4 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={handleClose}
            className="btn-neutral bg-ghost border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition rounded-full px-6"
            disabled={isSubmitting}
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            className={`btn rounded-full px-8 shadow-md transition ${
              formData.isRepaired
                ? 'btn-success bg-green-600 hover:bg-green-700 text-white'
                : 'btn-error bg-red-600 hover:bg-red-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={!formData.inspectionNotes.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                กำลังบันทึก...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {formData.isRepaired ? <FaCheckCircle /> : <FaTimesCircle />}
                ยืนยัน
              </div>
            )}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}