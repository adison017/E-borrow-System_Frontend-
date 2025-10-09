import {
  CalendarIcon,
  CubeIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  TagIcon,
  UserIcon,
  WrenchIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import axios from '../../../utils/axios.js';
import { useState, useEffect } from 'react';
import { MdClose } from "react-icons/md";
import { FaCheckCircle, FaTimesCircle, FaTools } from 'react-icons/fa';
import { API_BASE } from '../../../utils/api';
import { toast } from 'react-toastify';
import { getRepairRequestsByItemId } from '../../../utils/api';

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
  const [repairRequests, setRepairRequests] = useState([]);
  const [loadingRepairRequests, setLoadingRepairRequests] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // Fetch repair requests when equipment changes
  useEffect(() => {
    if (open && equipment?.item_id) {
      fetchRepairRequests();
    }
  }, [open, equipment?.item_id]);

  const fetchRepairRequests = async () => {
    if (!equipment?.item_id) return;
    
    try {
      setLoadingRepairRequests(true);
      const requests = await getRepairRequestsByItemId(equipment.item_id);
      // Ensure we're working with an array
      const requestsArray = Array.isArray(requests) ? requests : [requests];
      // Filter for approved repair requests (though backend now only returns approved ones)
      const approvedRequests = requestsArray.filter(request => request.status === 'approved');
      setRepairRequests(approvedRequests);
    } catch (error) {
      console.error('Error fetching repair requests:', error);
      setRepairRequests([]);
    } finally {
      setLoadingRepairRequests(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.inspectionNotes.trim()) {
      setError('โปรดกรอกบันทึกการตรวจสอบ');
      return;
    }
    setIsSubmitting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('ไม่พบ token การเข้าสู่ระบบ');
        return;
      }

      const newStatus = formData.isRepaired ? 'พร้อมใช้งาน' : 'ชำรุด';
      
      // อัปเดตสถานะอุปกรณ์ใน backend
      await axios.put(`${API_BASE}/equipment/${equipment.item_code}/status`, {
        status: newStatus,
        inspectionNotes: formData.inspectionNotes,
        inspectionDate: new Date().toISOString().split('T')[0],
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // อัปเดตสถานะ repair_requests เป็น 'completed' ถ้าซ่อมเสร็จสมบูรณ์, 'incomplete' ถ้ายังไม่สมบูรณ์
      if (equipment.repair_request_id) {
        try {
          // 1. ดึงข้อมูล repair request ปัจจุบัน
          const { data: currentRequest } = await axios.get(`${API_BASE}/repair-requests/${equipment.repair_request_id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          // 2. ส่งข้อมูลเดิมกลับไปทั้งหมด ยกเว้นเปลี่ยน status
          await axios.put(`${API_BASE}/repair-requests/${equipment.repair_request_id}`, {
            ...currentRequest,
            status: formData.isRepaired ? 'completed' : 'incomplete',
            inspection_notes: formData.inspectionNotes,
            inspectionDate: new Date().toISOString().split('T')[0],
          }, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } catch (repairError) {
          // Error updating repair request - ไม่หยุดการทำงานถ้า update repair request ไม่สำเร็จ
        }
      }

      // แสดง toast notification
      toast.success(formData.isRepaired ? 'ตรวจรับครุภัณฑ์สำเร็จ - ซ่อมเสร็จสมบูรณ์' : 'ตรวจรับครุภัณฑ์สำเร็จ - ยังไม่สมบูรณ์');

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
      // Error submitting inspection
      if (error.response?.status === 401) {
        toast.error('ไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบใหม่');
      } else if (error.response?.status === 404) {
        toast.error('ไม่พบครุภัณฑ์ที่ระบุ');
      } else {
        toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
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

  // SectionHeader component matching RepairRequestDialog
  const SectionHeader = ({ title, icon }) => (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-blue-500 rounded-xl shadow-md">
        <span className="text-white">{icon}</span>
      </div>
      <div>
        <h4 className="text-lg font-bold text-gray-800">{title}</h4>
        <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
      </div>
    </div>
  );

  if (!open || !equipment) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-7xl w-full max-h-[95vh] p-0 rounded-2xl shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-50" data-theme="light">
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
                        ตรวจรับครุภัณฑ์หลังซ่อม
                      </h2>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClose}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* ข้อมูลครุภัณฑ์ */}
              <div className="flex flex-col h-full">
                <SectionHeader
                  title="ข้อมูลครุภัณฑ์"
                  icon={<CubeIcon className="h-5 w-5 text-white" />}
                />
                <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex-1">
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-30 h-30 rounded-xl overflow-hidden flex items-center justify-center border-2 border-blue-200 shadow-sm">
                          <img
                            src={equipment.pic ? (typeof equipment.pic === 'string' && equipment.pic.startsWith('http') ? equipment.pic : `/uploads/${equipment.pic}`) : "/lo.png"}
                            alt={equipment.name}
                            className="max-w-full max-h-full object-contain p-2"
                            onError={e => { e.target.onerror = null; e.target.src = '/lo.png'; }}
                          />
                        </div>
                        <div className="text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium mb-2 inline-block ${
                            equipment.status === 'กำลังซ่อม' ? 'bg-amber-100 text-amber-800' :
                            equipment.status === 'ชำรุด' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {equipment.status}
                          </span>
                          <p className="text-sm text-blue-600 font-medium mb-1">ชื่อครุภัณฑ์</p>
                          <p className="font-bold text-lg text-gray-800">{equipment.name}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-100">
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
                            <p className="font-bold text-gray-800">{equipment.category || 'อุปกรณ์ทั่วไป'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* บันทึกการตรวจสอบ */}
              <div className="flex flex-col h-full">
                <SectionHeader
                  title="บันทึกการตรวจสอบ"
                  icon={<DocumentCheckIcon className="h-5 w-5 text-white" />}
                />
                <div className="bg-white rounded-xl p-4 mb-4 shadow-md border border-blue-200">
                  <div className="space-y-4">
                    {/* Repair Approval Information - Moved inside inspection section */}
                    {repairRequests.length > 0 && (
                      <div className="bg-white rounded-xl p-4 mb-4 shadow-md border border-blue-200">
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <WrenchIcon className="h-5 w-5 text-blue-600" />
                          ข้อมูลการอนุมัติซ่อม
                        </h4>
                        <div className="space-y-3">
                          {repairRequests.map((request, index) => (
                            <div key={request.id} className="bg-blue-50 rounded-lg border border-blue-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-bold text-gray-800 text-sm">คำขอซ่อม #{request.repair_code || request.id}</h5>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
                                  <CheckCircleIcon className="w-3 h-3 mr-1" />
                                  อนุมัติแล้ว
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-600 w-32">งบประมาณที่อนุมัติ:</span>
                                  <span className="text-gray-800 font-medium">
                                    {Number(request.budget || 0).toLocaleString('th-TH')} บาท
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-600 w-32">วันที่อนุมัติ:</span>
                                  <span className="text-gray-800">
                                    {request.approval_date 
                                      ? new Date(request.approval_date).toLocaleDateString('th-TH', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric'
                                        })
                                      : 'ไม่ระบุ'}
                                  </span>
                                </div>
                                <div className="md:col-span-2 flex items-center">
                                  <span className="font-medium text-gray-600 w-32">ผู้รับผิดชอบ:</span>
                                  <span className="text-gray-800">{request.responsible_person || 'ไม่ระบุ'}</span>
                                </div>
                                {request.note && (
                                  <div className="md:col-span-2 flex">
                                    <span className="font-medium text-gray-600 w-32">หมายเหตุ:</span>
                                    <span className="text-gray-800">{request.note}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">
                        บันทึกการตรวจสอบ <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={6}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                        value={formData.inspectionNotes}
                        onChange={(e) => setFormData({ ...formData, inspectionNotes: e.target.value })}
                        placeholder="บันทึกผลการตรวจสอบ เช่น การซ่อมแซมที่ทำ, ส่วนที่ยังต้องปรับปรุง, ข้อสังเกตต่างๆ..."
                      />
                      {error && formData.inspectionNotes.trim() === '' && (
                        <p className="text-red-500 text-sm mt-1">{error}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-lg border transition-all  ${
                        formData.isRepaired
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}>
                        <input
                          type="radio"
                          name="repairStatus"
                          className="radio radio-success"
                          checked={formData.isRepaired}
                          onChange={() => setFormData({ ...formData, isRepaired: true })}
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-gray-800 font-medium">ซ่อมสำเร็จ</span>
                        </div>
                      </label>
                      <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-lg border transition-all ${
                        !formData.isRepaired
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}>
                        <input
                          type="radio"
                          name="repairStatus"
                          className="radio radio-error"
                          checked={!formData.isRepaired}
                          onChange={() => setFormData({ ...formData, isRepaired: false })}
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-gray-800 font-medium">ซ่อมไม่สำเร็จ</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 p-4 rounded-2xl">
            <div className="flex justify-end gap-4">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-colors"
                disabled={isSubmitting}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmit}
                className={`px-8 py-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  formData.isRepaired
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                disabled={!formData.inspectionNotes.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    กำลังบันทึก...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    ยืนยัน
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </div>
  );
}