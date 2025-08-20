import React, { useState, useEffect } from 'react';
import { MdClose } from "react-icons/md";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { authFetch, API_BASE } from '../../../utils/api';
import { toast } from 'react-toastify';

const DamageManagementDialog = ({ isOpen, onClose, borrowItem, onSubmit }) => {
  const [damageLevels, setDamageLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLevels, setIsLoadingLevels] = useState(false);
  
  // State สำหรับแก้ไข
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    fine_percent: '',
    detail: '',
    nameType: 'select' // 'select' หรือ 'custom'
  });

  // โหลดข้อมูล damage levels เมื่อเปิด dialog
  useEffect(() => {
    if (isOpen) {
      fetchDamageLevels();
    }
  }, [isOpen]);

  const fetchDamageLevels = async () => {
    try {
      setIsLoadingLevels(true);
      const res = await authFetch(`${API_BASE}/damage-levels`);
      if (res.ok) {
        const data = await res.json();
        // ตรวจสอบว่า data เป็น array หรือมี data property
        let levels = [];
        if (Array.isArray(data)) {
          levels = data;
        } else if (data && data.success && Array.isArray(data.data)) {
          levels = data.data;
        }
        setDamageLevels(levels);
        if (levels.length > 0) {
          setSelectedLevel(levels[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching damage levels:', error);
      setDamageLevels([]);
    } finally {
      setIsLoadingLevels(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedLevel) {
      toast.error('กรุณาเลือกระดับความเสียหาย');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(selectedLevel);
    } catch (error) {
      console.error('Error submitting damage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันแก้ไข
  const startEdit = (level) => {
    // ตรวจสอบว่าเป็นระดับที่ห้ามแก้ไขหรือไม่
    if (level.fine_percent === 0 || level.fine_percent === 50 || level.fine_percent === 100) {
      toast.warning(`ไม่สามารถแก้ไขระดับ "${level.name}" ได้ (${level.fine_percent}%)`);
      return;
    }
    
    setEditItem(level);
    setEditForm({
      name: level.name || '',
      fine_percent: level.fine_percent || '',
      detail: level.detail || '',
      nameType: 'custom' // เมื่อแก้ไขให้เป็น custom เสมอ
    });
  };

  // ฟังก์ชันเพิ่มระดับใหม่
  const startAdd = () => {
    setEditItem({ damage_id: 'new' }); // ใช้ 'new' เพื่อแยกแยะระหว่างแก้ไขและเพิ่ม
    setEditForm({
      name: '',
      fine_percent: '',
      detail: '',
      nameType: 'select'
    });
  };

  const cancelEdit = () => {
    setEditItem(null);
    setEditForm({
      name: '',
      fine_percent: '',
      detail: '',
      nameType: 'select'
    });
  };

  const handleUpdate = async () => {
    if (!editItem || !editForm.name || !editForm.fine_percent) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // ตรวจสอบเพิ่มเติมสำหรับการเพิ่มใหม่
    if (editItem.damage_id === 'new' && editForm.nameType === 'select' && !editForm.name) {
      toast.warning('กรุณาเลือกระดับจากรายการที่มีอยู่');
      return;
    }

    if (editForm.fine_percent < 0 || editForm.fine_percent > 100) {
      toast.error('เปอร์เซ็นต์ค่าปรับต้องอยู่ระหว่าง 0-100');
      return;
    }

    // ตรวจสอบว่าไม่ซ้ำกับระดับที่ห้ามแก้ไข
    if (editForm.fine_percent === 50 || editForm.fine_percent === 100) {
      toast.warning('ไม่สามารถใช้เปอร์เซ็นต์ 50% หรือ 100% ได้');
      return;
    }

    setIsLoading(true);
    try {
      const isNew = editItem.damage_id === 'new';
      const url = isNew ? `${API_BASE}/damage-levels` : `${API_BASE}/damage-levels/${editItem.damage_id}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const res = await authFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          fine_percent: parseInt(editForm.fine_percent),
          detail: editForm.detail.trim()
        })
      });

      if (res.ok) {
        await fetchDamageLevels();
        cancelEdit();
        toast.success(isNew ? 'เพิ่มข้อมูลสำเร็จ' : 'อัปเดตข้อมูลสำเร็จ');
      } else {
        toast.error(isNew ? 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล' : 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
      }
    } catch (error) {
      console.error('Error saving damage level:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  const getDamageIcon = (level) => {
    const percent = level.fine_percent;
    if (percent >= 80) return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
    if (percent >= 50) return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
    if (percent >= 20) return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
  };

  const getDamageColor = (level) => {
    const percent = level.fine_percent;
    if (percent >= 80) return 'border-red-200 bg-red-50 hover:bg-red-100';
    if (percent >= 50) return 'border-orange-200 bg-orange-50 hover:bg-orange-100';
    if (percent >= 20) return 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100';
    return 'border-green-200 bg-green-50 hover:bg-green-100';
  };

  const getSelectedColor = (level) => {
    const percent = level.fine_percent;
    if (percent >= 80) return 'border-red-500 bg-red-100';
    if (percent >= 50) return 'border-orange-500 bg-orange-100';
    if (percent >= 20) return 'border-yellow-500 bg-yellow-100';
    return 'border-green-500 bg-green-100';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto transform animate-slideUp">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex items-center gap-3">
              <span>จัดการค่าเสียหาย</span>
              <span className={`text-xs px-2 py-1 rounded-full ${editItem ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'}`}>
                {editItem ? 'กำลังแก้ไข' : 'เลือกระดับ'}
              </span>
            </div>
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <MdClose size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* ฟอร์มแก้ไข */}
          {editItem && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <h4 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                <PencilIcon className="w-5 h-5" />
                {editItem.damage_id === 'new' ? 'เพิ่มระดับความเสียหายใหม่' : 'แก้ไขระดับความเสียหาย'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-yellow-700 mb-1">ชื่อระดับ</label>
                  {editItem.damage_id === 'new' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="nameType"
                            value="select"
                            checked={editForm.nameType !== 'custom'}
                            onChange={() => setEditForm({...editForm, nameType: 'select', name: ''})}
                            className="text-yellow-600"
                          />
                          <span className="text-sm">เลือกจากระดับที่มีอยู่</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="nameType"
                            value="custom"
                            checked={editForm.nameType === 'custom'}
                            onChange={() => setEditForm({...editForm, nameType: 'custom', name: ''})}
                            className="text-yellow-600"
                          />
                          <span className="text-sm">พิมพ์เอง</span>
                        </label>
                      </div>
                      {editForm.nameType !== 'custom' ? (
                        <select
                          className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          value={editForm.name}
                          onChange={(e) => {
                            const selectedLevel = damageLevels.find(level => level.name === e.target.value);
                            setEditForm({
                              ...editForm,
                              name: e.target.value,
                              fine_percent: selectedLevel ? selectedLevel.fine_percent : '',
                              detail: selectedLevel ? selectedLevel.detail : ''
                            });
                          }}
                        >
                          <option value="">เลือกจากระดับที่มีอยู่</option>
                          {Array.isArray(damageLevels) && damageLevels
                            .filter(level => level.fine_percent !== 50 && level.fine_percent !== 100)
                            .sort((a, b) => Number(a.fine_percent) - Number(b.fine_percent))
                            .map(level => (
                              <option key={level.damage_id} value={level.name}>
                                {level.name}
                              </option>
                            ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          placeholder="พิมพ์ชื่อระดับใหม่"
                        />
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      placeholder="ชื่อระดับความเสียหาย"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-yellow-700 mb-1">เปอร์เซ็นต์ค่าปรับ (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    value={editForm.fine_percent}
                    onChange={(e) => setEditForm({...editForm, fine_percent: e.target.value})}
                    placeholder="0-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-yellow-700 mb-1">รายละเอียด</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    value={editForm.detail}
                    onChange={(e) => setEditForm({...editForm, detail: e.target.value})}
                    placeholder="รายละเอียด (ไม่บังคับ)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* เลือกระดับความเสียหาย */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-900">รายการระดับความเสียหาย</h4>
              <button
                onClick={startAdd}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                disabled={editItem !== null}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                เพิ่มใหม่
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              {isLoadingLevels ? (
                <div className="flex items-center justify-center py-12">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-200 border-t-orange-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <span className="ml-3 text-gray-600 font-medium text-sm">กำลังโหลดข้อมูล...</span>
                </div>
              ) : (
                <table className="w-full min-w-[400px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ระดับความเสียหาย</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">เปอร์เซ็นต์ค่าปรับ</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">รายละเอียด</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Array.isArray(damageLevels) && damageLevels.map((level, index) => (
                      <tr 
                        key={level.damage_id} 
                        className={`hover:bg-gray-50 transition-colors animate-fadeInUp ${
                          selectedLevel?.damage_id === level.damage_id ? 'bg-orange-50' : ''
                        }`}
                        style={{animationDelay: `${index * 0.1}s`}}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {getDamageIcon(level)}
                            <div>
                              <span className="text-sm font-medium text-gray-900">{level.name}</span>
                              {(level.fine_percent === 0 || level.fine_percent === 50 || level.fine_percent === 100) && (
                                <div className="text-xs text-red-500 font-medium mt-1">
                                  ไม่สามารถแก้ไขได้
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-300"
                                style={{ width: `${level.fine_percent}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-600">
                              {level.fine_percent}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {level.detail || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex gap-2 justify-center">
                                                          <button
                                className={`p-2 rounded-lg transition-colors ${
                                  level.fine_percent === 0 || level.fine_percent === 50 || level.fine_percent === 100
                                    ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                                    : 'text-blue-600 hover:bg-blue-100'
                                }`}
                                onClick={() => {
                                  if (level.fine_percent !== 0 && level.fine_percent !== 50 && level.fine_percent !== 100) {
                                    startEdit(level);
                                  }
                                }}
                                title={level.fine_percent === 0 || level.fine_percent === 50 || level.fine_percent === 100 ? "ไม่สามารถแก้ไขได้" : "แก้ไข"}
                                disabled={level.fine_percent === 0 || level.fine_percent === 50 || level.fine_percent === 100}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                              onClick={() => setSelectedLevel(level)}
                              title="เลือก"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {damageLevels.length === 0 && !isLoadingLevels && (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium">ไม่มีข้อมูลระดับความเสียหาย</p>
                  <p className="text-sm">กรุณาติดต่อผู้ดูแลระบบ</p>
                </div>
              )}
            </div>
          </div>

          {/* แสดงข้อมูลที่เลือก */}
          {selectedLevel && (
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h4 className="text-lg font-semibold text-orange-800 mb-3 flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5" />
                ข้อมูลที่เลือก
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-3 shadow-sm border border-orange-200">
                  <div className="text-xs font-semibold text-orange-600 mb-1">ระดับความเสียหาย</div>
                  <div className="text-sm font-bold text-orange-900">{selectedLevel.name}</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm border border-orange-200">
                  <div className="text-xs font-semibold text-orange-600 mb-1">เปอร์เซ็นต์ค่าปรับ</div>
                  <div className="text-sm font-bold text-orange-900">{selectedLevel.fine_percent}%</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm border border-orange-200">
                  <div className="text-xs font-semibold text-orange-600 mb-1">สถานะ</div>
                  <div className="flex items-center gap-2">
                    {getDamageIcon(selectedLevel)}
                    <span className="text-sm font-bold text-orange-900">
                      {selectedLevel.fine_percent >= 80 ? 'รุนแรง' : 
                       selectedLevel.fine_percent >= 50 ? 'ปานกลาง' : 
                       selectedLevel.fine_percent >= 20 ? 'เบา' : 'ปกติ'}
                    </span>
                  </div>
                </div>
                {selectedLevel.detail && (
                  <div className="sm:col-span-3 bg-white rounded-lg p-3 shadow-sm border border-orange-200">
                    <div className="text-xs font-semibold text-orange-600 mb-2">รายละเอียด</div>
                    <div className="text-sm text-orange-900">{selectedLevel.detail}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-6 border-t border-gray-100">
          {editItem ? (
            <>
              <button 
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-colors" 
                onClick={cancelEdit}
              >
                ยกเลิก
              </button>
              <button 
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium transition-colors disabled:opacity-50" 
                onClick={handleUpdate}
                disabled={isLoading}
              >
                {isLoading ? 'กำลังบันทึก...' : (editItem.damage_id === 'new' ? 'เพิ่มใหม่' : 'บันทึก')}
              </button>
            </>
          ) : (
            <>
              <button 
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-colors" 
                onClick={onClose}
              >
                ยกเลิก
              </button>
              <button 
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-medium transition-colors disabled:opacity-50" 
                onClick={handleSubmit}
                disabled={isLoading || !selectedLevel}
              >
                {isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DamageManagementDialog;
