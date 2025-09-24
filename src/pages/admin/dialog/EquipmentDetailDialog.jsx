import React, { useState, useEffect } from 'react';
import { MdClose, MdHistory } from 'react-icons/md';
import {
  TagIcon,
  CubeIcon,
  InformationCircleIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  HashtagIcon,
  DocumentTextIcon,
  MapPinIcon,
  WrenchIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { UPLOAD_BASE } from '../../../utils/api';
import { getRepairRequestsByItemId } from '../../../utils/api';
import axios from '../../../utils/axios';

const EquipmentDetailDialog = ({ open, onClose, equipment }) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [roomImageModalOpen, setRoomImageModalOpen] = useState(false);
  const [repairRequests, setRepairRequests] = useState([]);
  const [loadingRepairRequests, setLoadingRepairRequests] = useState(false);
  const [borrowCount, setBorrowCount] = useState(equipment?.total_borrow_count || 0);
  const [loadingBorrowCount, setLoadingBorrowCount] = useState(false);
  const [borrowHistory, setBorrowHistory] = useState([]);
  const [loadingBorrowHistory, setLoadingBorrowHistory] = useState(false);

  // Fetch repair requests when equipment changes
  useEffect(() => {
    if (open && equipment?.item_id) {
      fetchRepairRequests();
      fetchBorrowHistory();
      fetchBorrowCount();
    }
  }, [open, equipment?.item_id]);

  const fetchBorrowCount = async () => {
    // No longer needed, count derived from history
    setLoadingBorrowCount(false);
  };

  const fetchBorrowHistory = async () => {
    if (!equipment?.item_id) return;

    try {
      setLoadingBorrowHistory(true);
      const response = await axios.get(`${UPLOAD_BASE}/borrows/equipment-history/${equipment.item_id}`);
      setBorrowHistory(response.data || []);
    } catch (error) {
      console.error('Error fetching borrow history:', error);
      setBorrowHistory([]);
    } finally {
      setLoadingBorrowHistory(false);
    }
  };

  // Update borrow count when history changes
  useEffect(() => {
    setBorrowCount(borrowHistory.length);
  }, [borrowHistory]);

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

  if (!open || !equipment) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'พร้อมใช้งาน':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ชำรุด':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'กำลังซ่อม':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'รออนุมัติซ่อม':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ถูกยืม':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBorrowStatusClass = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'carry':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'waiting_payment':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 to-blue-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <CubeIcon className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">รายละเอียดครุภัณฑ์</h2>
                <p className="text-blue-100 mt-1">ข้อมูลจากการสแกน QR Code</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Image and Status */}
            <div className="space-y-6">
              {/* Equipment Image */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <img
                  src={equipment.pic?.startsWith('http')
                    ? equipment.pic
                    : `${UPLOAD_BASE}/equipment/${equipment.item_code}.jpg`
                  }
                  alt={equipment.name}
                  className="w-full max-w-sm mx-auto h-64 object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setImageModalOpen(true)}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/lo.png';
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">คลิกเพื่อขยายดูรูปภาพ</p>
              </div>

              {/* Status Badge */}
              <div className="text-center">
                <span className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold border ${getStatusColor(equipment.status)}`}>
                  {equipment.status || 'ไม่ระบุสถานะ'}
                </span>
              </div>

              {/* QR Code Information */}
              <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <TagIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">รหัส QR Code</h3>
                </div>
                <p className="text-2xl font-mono font-bold text-blue-600">
                  {equipment.item_code}
                </p>
              </div>
            </div>

            {/* Right Column - Detailed Information */}
            <div className="space-y-4">
              {/* Equipment Name */}
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CubeIcon className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-800">ชื่อครุภัณฑ์</h3>
                </div>
                <p className="text-lg text-gray-700 font-medium">{equipment.name}</p>
              </div>

              {/* Category */}
              {equipment.category_name && (
                <div className="bg-purple-50 rounded-xl border border-purple-100 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <BuildingOfficeIcon className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-800">หมวดหมู่</h3>
                  </div>
                  <p className="text-lg text-purple-600 font-medium">
                    {equipment.category_name}
                  </p>
                </div>
              )}

              {/* Quantity and Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl border border-green-100 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <InformationCircleIcon className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-800">จำนวน</h3>
                  </div>
                  <p className="text-lg text-green-600 font-medium">
                    {equipment.quantity || 1}
                  </p>
                </div>

                <div className="bg-teal-50 rounded-xl border border-teal-100 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <DocumentTextIcon className="w-5 h-5 text-teal-600" />
                    <h3 className="font-semibold text-gray-800">หน่วย</h3>
                  </div>
                  <p className="text-lg text-teal-600 font-medium">
                    {equipment.unit || 'ชิ้น'}
                  </p>
                </div>
              </div>

              {/* Price */}
              {equipment.price && (
                <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CurrencyDollarIcon className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-semibold text-gray-800">ราคา</h3>
                  </div>
                  <p className="text-lg text-emerald-600 font-medium">
                    {Number(equipment.price).toLocaleString('th-TH')} บาท
                  </p>
                </div>
              )}

              {/* Purchase Date */}
              {equipment.purchaseDate && (
                <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-800">วันที่จัดซื้อ</h3>
                  </div>
                  <p className="text-lg text-blue-600 font-medium">
                    {new Date(equipment.purchaseDate).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {/* Storage Location */}
              {(equipment.room_name || equipment.location) && (
                <div className="bg-orange-50 rounded-xl border border-orange-100 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPinIcon className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold text-gray-800">สถานที่จัดเก็บ</h3>
                  </div>

                  {/* Room Preview with Image */}
                  {equipment.room_name && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-orange-200 mb-2">
                      <img
                        src={(() => {
                          if (!equipment.room_image_url) return "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
                          try {
                            const urls = JSON.parse(equipment.room_image_url);
                            return Array.isArray(urls) && urls[0]
                              ? (urls[0].startsWith('http') ? urls[0] : `${UPLOAD_BASE}${urls[0]}`)
                              : "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
                          } catch {
                            return equipment.room_image_url && equipment.room_image_url.startsWith('http')
                              ? equipment.room_image_url
                              : `${UPLOAD_BASE}${equipment.room_image_url}`;
                          }
                        })()}
                        alt="room preview"
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setRoomImageModalOpen(true)}
                        onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3474/3474360.png"; }}
                      />
                      <div className="flex flex-col">
                        <span className="text-lg text-orange-600 font-medium">
                          {equipment.room_name}
                        </span>
                        {equipment.room_address && (
                          <span className="text-xs text-gray-500">
                            {equipment.room_address}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 mt-1">คลิกรูปเพื่อขยายดู</span>
                      </div>
                    </div>
                  )}

                  {/* Additional Location Info */}
                  {equipment.location && equipment.location !== equipment.room_name && (
                    <div className="bg-orange-25 rounded-lg p-2 border border-orange-100">
                      <span className="text-sm font-medium text-orange-700">
                        ตำแหน่งเพิ่มเติม:
                      </span>
                      <span className="text-sm text-orange-600">
                        {equipment.location}
                      </span>
                    </div>
                  )}

                  {/* Room Details */}
                  {equipment.room_detail && (
                    <div className="mt-2 text-xs text-gray-600">
                      <span className="font-medium">รายละเอียดห้อง: </span>
                      {equipment.room_detail}
                    </div>
                  )}
                </div>
              )}

              {/* Created Date */}
              {equipment.created_at && (
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CalendarIcon className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">วันที่เพิ่มเข้าระบบ</h3>
                  </div>
                  <p className="text-lg text-gray-700 font-medium">
                    {new Date(equipment.created_at).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}

              {/* Total Borrow Count */}
              <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <InformationCircleIcon className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-gray-800">จำนวนครั้งที่ถูกยืม</h3>
                </div>
                <p className="text-lg text-emerald-600 font-medium">
                  {loadingBorrowCount ? 'กำลังโหลด...' : `${equipment?.total_borrow_count || 0} ครั้ง`}
                </p>
              </div>
              
              {/* Borrowing History */}
              {borrowHistory && borrowHistory.length > 0 && (
                <div className="bg-blue-50 rounded-xl border border-blue-100 p-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-3">
                    <MdHistory className="w-6 h-6 text-blue-600" />
                    ประวัติการยืม
                  </h3>
                  <div className="space-y-4">
                    {borrowHistory.map((record) => (
                      <div key={record.borrow_id} className="bg-white rounded-lg border border-blue-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                              {record.fullname ? record.fullname.charAt(0).toUpperCase() : '?'}
                            </div>
                            <span className="font-medium text-gray-800">{record.fullname}</span>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBorrowStatusClass(record.status)}`}>
                            {record.status === 'approved' ? 'อนุมัติแล้ว' :
                             record.status === 'carry' ? 'กำลังใช้งาน' :
                             record.status === 'overdue' ? 'เกินกำหนด' :
                             record.status === 'waiting_payment' ? 'รอชำระเงิน' : 'สถานะไม่ทราบ'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">รหัส:</span>
                            <span className="ml-2 text-gray-800">{record.borrow_code}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">วันที่ยืม:</span>
                            <span className="ml-2 text-gray-800">
                              {new Date(record.borrow_date).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">กำหนดคืน:</span>
                            <span className="ml-2 text-gray-800">
                              {new Date(record.return_date).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="md:col-span-3">
                            <span className="font-medium text-gray-600">วัตถุประสงค์:</span>
                            <span className="ml-2 text-gray-800">{record.purpose}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Repair Approval Information */}
          {repairRequests.length > 0 && (
            <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-3">
                <WrenchIcon className="w-6 h-6 text-amber-600" />
                ข้อมูลการอนุมัติซ่อม
              </h3>
              <div className="space-y-4">
                {repairRequests.map((request, index) => (
                  <div key={request.id} className="bg-white rounded-lg border border-amber-100 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-800">คำขอซ่อม #{request.repair_code || request.id}</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        อนุมัติแล้ว
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">งบประมาณที่อนุมัติ:</span>
                        <span className="ml-2 text-gray-800">
                          {Number(request.budget || 0).toLocaleString('th-TH')} บาท
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">วันที่อนุมัติ:</span>
                        <span className="ml-2 text-gray-800">
                          {request.approval_date
                            ? new Date(request.approval_date).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'ไม่ระบุ'}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-600">ผู้รับผิดชอบ:</span>
                        <span className="ml-2 text-gray-800">{request.responsible_person || 'ไม่ระบุ'}</span>
                      </div>
                      {request.note && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-600">หมายเหตุ:</span>
                          <span className="ml-2 text-gray-800">{request.note}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description - Full Width */}
          {equipment.description && (
            <div className="mt-8 bg-blue-50 rounded-xl border border-blue-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">รายละเอียด</h3>
              </div>
              <p className="text-gray-700 leading-relaxed text-base">{equipment.description}</p>
            </div>
          )}

          {/* Additional Information */}
          <div className="mt-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-3">
              <InformationCircleIcon className="w-6 h-6 text-indigo-600" />
              ข้อมูลเพิ่มเติม
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">รหัสหมวดหมู่:</span>
                <span className="ml-2">{equipment.category_id || 'ไม่ระบุ'}</span>
              </div>
              <div>
                <span className="font-medium">รหัสห้องจัดเก็บ:</span>
                <span className="ml-2">{equipment.room_id || 'ไม่ระบุ'}</span>
              </div>
              {equipment.updated_at && (
                <div>
                  <span className="font-medium">วันที่อัปเดตล่าสุด:</span>
                  <span className="ml-2">
                    {new Date(equipment.updated_at).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
              <div>
                <span className="font-medium">รูปแบบข้อมูล:</span>
                <span className="ml-2">ข้อมูลจากการสแกน QR Code</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
          >
            ปิด
          </button>
        </div>
      </div>

      {/* Image Modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-white/20"
            >
              <MdClose className="w-8 h-8" />
            </button>
            <img
              src={equipment.pic?.startsWith('http')
                ? equipment.pic
                : `${UPLOAD_BASE}/equipment/${equipment.item_code}.jpg`
              }
              alt={equipment.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/lo.png';
              }}
            />
            <div className="absolute -bottom-16 left-0 right-0 text-center">
              <p className="text-white text-lg font-medium">{equipment.name}</p>
              <p className="text-gray-300 text-sm">{equipment.item_code}</p>
            </div>
          </div>
          {/* Click outside to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setImageModalOpen(false)}
          />
        </div>
      )}

      {/* Room Image Modal */}
      {roomImageModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              onClick={() => setRoomImageModalOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-white/20"
            >
              <MdClose className="w-8 h-8" />
            </button>
            <img
              src={(() => {
                if (!equipment.room_image_url) return "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
                try {
                  const urls = JSON.parse(equipment.room_image_url);
                  return Array.isArray(urls) && urls[0]
                    ? (urls[0].startsWith('http') ? urls[0] : `${UPLOAD_BASE}${urls[0]}`)
                    : "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
                } catch {
                  return equipment.room_image_url && equipment.room_image_url.startsWith('http')
                    ? equipment.room_image_url
                    : `${UPLOAD_BASE}${equipment.room_image_url}`;
                }
              })()}
              alt={equipment.room_name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
              }}
            />
            <div className="absolute -bottom-16 left-0 right-0 text-center">
              <p className="text-white text-lg font-medium">ห้องจัดเก็บ: {equipment.room_name}</p>
              {equipment.room_address && (
                <p className="text-gray-300 text-sm">{equipment.room_address}</p>
              )}
            </div>
          </div>
          {/* Click outside to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setRoomImageModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

export default EquipmentDetailDialog;
