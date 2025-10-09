import { CgFileDocument } from "react-icons/cg"; 
import {
  ArrowPathIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  CubeIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TagIcon,
  UserIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import React, { useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import axios from '../../../utils/axios.js';
import { MdClose } from "react-icons/md";
import { API_BASE, UPLOAD_BASE } from '../../../utils/api';
import DocumentViewer from '../../../components/DocumentViewer';

export default function RepairApprovalDialog({
  open,
  onClose,
  repairRequest,
  onApprove,
  onReject
}) {
  console.log('Repair Request Data:', repairRequest);
  console.log('Equipment Name:', repairRequest?.equipment_name);
  console.log('Equipment Code:', repairRequest?.equipment_code);
  console.log('Equipment Category:', repairRequest?.equipment_category);
  console.log('Requester Name:', repairRequest?.requester_name);
  console.log('Branch Name:', repairRequest?.branch_name);
  console.log('Status:', repairRequest?.status);
  console.log('Request Date:', repairRequest?.request_date);
  console.log('Problem Description:', repairRequest?.problem_description);
  console.log('Estimated Cost:', repairRequest?.estimated_cost);
  console.log('Equipment Pic:', repairRequest?.equipment_pic);

  // Normalize repairRequest fields in case they are objects
  const normalizedRepairRequest = {
    ...repairRequest,
    requester_name: typeof repairRequest?.requester_name === 'string'
      ? repairRequest.requester_name
      : repairRequest?.requester?.name || '',
    equipment_name: typeof repairRequest?.equipment_name === 'string'
      ? repairRequest.equipment_name
      : repairRequest?.equipment?.name || '',
    equipment_code: typeof repairRequest?.equipment_code === 'string'
      ? repairRequest.equipment_code
      : repairRequest?.equipment?.code || '',
    equipment_category: typeof repairRequest?.equipment_category === 'string'
      ? repairRequest.equipment_category
      : repairRequest?.equipment?.category || '',
    avatar: repairRequest?.avatar || repairRequest?.requester?.avatar || null,
    equipment_pic: repairRequest?.equipment_pic || repairRequest?.equipment?.image || repairRequest?.equipment?.pic || null
  };

  const [notes, setNotes] = useState('')
  const [budgetApproved, setBudgetApproved] = useState(repairRequest?.budget || repairRequest?.estimated_cost || 0)
  const [assignedTo, setAssignedTo] = useState('')
  const [assignedToName, setAssignedToName] = useState('')
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [viewMode, setViewMode] = useState('grid') // 'single' or 'grid'
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [repairImages, setRepairImages] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse repair images from pic_filename field
  useEffect(() => {
    console.log('=== Repair Images Debug ===');
    console.log('repairRequest:', repairRequest);
    console.log('pic_filename:', repairRequest?.pic_filename);
    console.log('pic_filename type:', typeof repairRequest?.pic_filename);
    console.log('pic_filename_raw:', repairRequest?.pic_filename_raw);
    console.log('repair_code:', repairRequest?.repair_code);


    if (repairRequest?.pic_filename) {
      // Check if it's already an array (parsed by backend)
      if (Array.isArray(repairRequest.pic_filename)) {
        console.log('✅ Already parsed array:', repairRequest.pic_filename);
        setRepairImages(repairRequest.pic_filename);
      } else if (typeof repairRequest.pic_filename === 'string') {
        try {
          console.log('pic_filename type:', typeof repairRequest.pic_filename);
          console.log('pic_filename starts with [:', repairRequest.pic_filename.startsWith('['));
          console.log('pic_filename starts with {:', repairRequest.pic_filename.startsWith('{'));

          // Check if it's a JSON string (multiple images)
          if (repairRequest.pic_filename.startsWith('[') || repairRequest.pic_filename.startsWith('{')) {
            const images = JSON.parse(repairRequest.pic_filename);
            console.log('Parsed JSON images:', images);
            setRepairImages(images);
          } else {
            // Single image - convert to array format
            console.log('Single image filename:', repairRequest.pic_filename);
            const singleImage = {
              filename: repairRequest.pic_filename,
              original_name: repairRequest.pic_filename,
              file_path: `uploads/repair/${repairRequest.pic_filename}`,
              url: `${UPLOAD_BASE}/uploads/repair/${repairRequest.pic_filename}`,
              repair_code: repairRequest.repair_code,
              index: 0
            };
            console.log('Created single image object:', singleImage);
            setRepairImages([singleImage]);
          }
        } catch (error) {
          console.error('Error parsing repair images:', error);
          setRepairImages([]);
        }
      } else {
        console.log('Unexpected pic_filename type:', typeof repairRequest.pic_filename);
        setRepairImages([]);
      }
    } else if (repairRequest?.images && Array.isArray(repairRequest.images) && repairRequest.images.length > 0) {
      // Fallback: กรณี history (images มาจาก backend)
      setRepairImages(
        repairRequest.images.map((img, idx) => ({
          ...img,
          url: img.url || (img.file_path ? `${UPLOAD_BASE}/${img.file_path}` : undefined),
          index: idx,
          repair_code: repairRequest.repair_code
        }))
      );
    } else {
      console.log('No pic_filename or images found');
      setRepairImages([]);
    }

    console.log('Final repairImages state:', repairImages);
  }, [repairRequest?.pic_filename, repairRequest?.repair_code]);

  // Reset active image index when images change
  useEffect(() => {
    setActiveImageIndex(0);
  }, [repairImages]);

  // Fetch admin users when dialog opens and prevent background scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      fetchAdminUsers();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  const fetchAdminUsers = async () => {
    try {
      setLoadingAdmins(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/users/role/admin`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Admin users response:', response.data);
      setAdminUsers(response.data);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      setAdminUsers([]);
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Helper function to get admin name by ID
  const getAdminNameById = (userId) => {
    const admin = adminUsers.find(user => user.user_id == userId);
    return admin ? admin.Fullname : 'ไม่ระบุ';
  };

  // Handle dropdown change to store both ID and name
  const handleAssignedToChange = (userId) => {
    setAssignedTo(userId);
    const selectedAdmin = adminUsers.find(user => user.user_id == userId);
    setAssignedToName(selectedAdmin ? selectedAdmin.Fullname : '');
  };

  const rejectReasonOptions = [
    "งบประมาณไม่ผ่านการอนุมัติ",
    "ไม่สามารถซ่อมแซมได้",
    "รายการนี้ไม่อยู่ในขอบเขตงานซ่อม",
    "อื่นๆ (โปรดระบุในหมายเหตุ)"
  ];

  const handleApprove = async () => {
    if (!normalizedRepairRequest) {
      setFormError("ไม่พบข้อมูลคำขอซ่อม");
      return;
    }

    if (isSubmitting) {
      return; // Prevent multiple submissions
    }

    // Clear previous errors
    setFormError("");
    setFieldErrors({});

    // Validate form fields
    const errors = {};

    // Validate budget approved
    if (!budgetApproved || budgetApproved.toString().trim() === '') {
      errors.budgetApproved = 'กรุณากรอกงบประมาณที่อนุมัติ';
    } else if (Number(budgetApproved) <= 0) {
      errors.budgetApproved = 'งบประมาณต้องมากกว่า 0';
    }

    // Validate assigned person
    if (!assignedTo || assignedTo.toString().trim() === '') {
      errors.assignedTo = 'กรุณาเลือกผู้รับผิดชอบ';
    }

    // Validate required fields from repair request
    const requiredFields = {
      requestId: normalizedRepairRequest.requestId,
      problem_description: normalizedRepairRequest.problem_description,
      request_date: normalizedRepairRequest.request_date,
      estimated_cost: normalizedRepairRequest.estimated_cost,
      equipment_code: normalizedRepairRequest.equipment_code
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      setFormError(`ข้อมูลไม่ครบถ้วน: ${missingFields.join(', ')}`);
      return;
    }

    // If there are field errors, show them and stop
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      console.log('Preparing approval payload for request ID:', normalizedRepairRequest.requestId);

    // Format request_date to MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
    let formattedRequestDate = normalizedRepairRequest.request_date;
    if (formattedRequestDate) {
      const d = new Date(formattedRequestDate);
      if (!isNaN(d)) {
        formattedRequestDate = d.toISOString().slice(0, 19).replace('T', ' ');
      }
    }
    // Prepare payload for approval
    const payload = {
      requester_name: normalizedRepairRequest.requester_name,
      equipment_name: normalizedRepairRequest.equipment_name,
      equipment_code: normalizedRepairRequest.equipment_code,
      equipment_category: normalizedRepairRequest.equipment_category,
      problem_description: normalizedRepairRequest.problem_description,
      request_date: formattedRequestDate,
      estimated_cost: normalizedRepairRequest.estimated_cost, // Keep original estimated cost
      budget: budgetApproved, // Use approved budget
      status: "approved",
      pic_filename: normalizedRepairRequest.pic_filename || normalizedRepairRequest.repair_pic_raw || '',
      note: notes,
      responsible_person: assignedToName,
      approval_date: new Date().toISOString(),
      images: normalizedRepairRequest.repair_pic || []
    };

      console.log('Approval payload:', payload);

      // Update repair request status to approved
      await axios.put(`${API_BASE}/repair-requests/${normalizedRepairRequest.requestId}`, payload);

      // Update equipment status to 'กำลังซ่อม'
      if (normalizedRepairRequest.equipment_code) {
        const token = localStorage.getItem('token');
        await axios.put(
          `${API_BASE}/equipment/${normalizedRepairRequest.equipment_code}/status`,
          { status: "กำลังซ่อม" },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      }

      // ปิด dialog ก่อน
      onClose();
      
      // เรียก callback เพื่อแสดง toast และรีเฟรชข้อมูล
      onApprove(payload);
    } catch (error) {
      console.error('Error approving repair request:', error);
      console.error('Error response:', error.response?.data);
      setFormError(`เกิดข้อผิดพลาดในการอนุมัติคำขอซ่อม: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectClick = () => {
    setShowRejectDialog(true);
    setRejectReason("");
    setFormError("");
    setFieldErrors({});
  };

  const handleCancelReject = () => {
    setShowRejectDialog(false);
    setRejectReason("");
    setFormError("");
    setFieldErrors({});
  };

  const handleConfirmReject = async () => {
    if (!normalizedRepairRequest) {
      setFormError("ไม่พบข้อมูลคำขอซ่อม");
      return;
    }

    if (isSubmitting) {
      return; // Prevent multiple submissions
    }

    // Clear previous errors
    setFormError("");

    // Validate rejection reason
    if (!rejectReason || rejectReason.trim() === '') {
      setFormError("กรุณาเลือกเหตุผลในการปฏิเสธ");
      return;
    }

    // Validate additional notes if "Other" reason is selected
    if (rejectReason === "อื่นๆ (โปรดระบุในหมายเหตุ)" && (!notes || notes.trim() === '')) {
      setFormError("กรุณาระบุเหตุผลเพิ่มเติม");
      return;
    }

    // Validate required fields
    const requiredFields = {
      requestId: normalizedRepairRequest.requestId,
      problem_description: normalizedRepairRequest.problem_description,
      request_date: normalizedRepairRequest.request_date,
      estimated_cost: normalizedRepairRequest.estimated_cost,
      equipment_code: normalizedRepairRequest.equipment_code
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      setFormError(`ข้อมูลไม่ครบถ้วน: ${missingFields.join(', ')}`);
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      console.log('Preparing rejection payload for request ID:', normalizedRepairRequest.requestId);

    // Format request_date to MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
    let formattedRequestDate = normalizedRepairRequest.request_date;
    if (formattedRequestDate) {
      const d = new Date(formattedRequestDate);
      if (!isNaN(d)) {
        formattedRequestDate = d.toISOString().slice(0, 19).replace('T', ' ');
      }
    }
                             // Prepare payload for rejection
           const payload = {
             requester_name: normalizedRepairRequest.requester_name,
             equipment_name: normalizedRepairRequest.equipment_name,
             equipment_code: normalizedRepairRequest.equipment_code,
             equipment_category: normalizedRepairRequest.equipment_category,
             problem_description: normalizedRepairRequest.problem_description,
             request_date: formattedRequestDate,
             estimated_cost: normalizedRepairRequest.estimated_cost, // Keep original estimated cost
             budget: normalizedRepairRequest.budget || normalizedRepairRequest.estimated_cost, // Use existing budget or estimated cost
             status: "rejected",
             pic_filename: normalizedRepairRequest.pic_filename || normalizedRepairRequest.repair_pic_raw || '',
             note: '', // ไม่ใช้ note สำหรับการปฏิเสธ
             responsible_person: assignedToName,
             approval_date: new Date().toISOString(),
             images: normalizedRepairRequest.repair_pic || [],
             rejection_reason: rejectReason === "อื่นๆ (โปรดระบุในหมายเหตุ)" ? notes : rejectReason // ใช้หมายเหตุที่กรอกแทนถ้าเลือกอื่นๆ
           };

      console.log('Rejection payload:', payload);

      // Update repair request status to rejected
      await axios.put(`${API_BASE}/repair-requests/${normalizedRepairRequest.requestId}`, payload);

             // Update equipment status to 'ไม่อนุมัติซ่อม' when rejecting repair request
       if (normalizedRepairRequest.equipment_code) {
         const token = localStorage.getItem('token');
         
         try {
           // Update equipment status to 'ไม่อนุมัติซ่อม'
           await axios.put(
             `${API_BASE}/equipment/${normalizedRepairRequest.equipment_code}/status`,
             { status: "ไม่อนุมัติซ่อม" },
             {
               headers: {
                 Authorization: `Bearer ${token}`
               }
             }
           );
           
           console.log(`Equipment status updated to: ไม่อนุมัติซ่อม`);
        } catch (error) {
          console.error('Error updating equipment status:', error);
          setFormError(`เกิดข้อผิดพลาดในการอัพเดทสถานะครุภัณฑ์: ${error.response?.data?.error || error.message}`);
        }
      }

      // ปิด dialog ก่อน
      setShowRejectDialog(false);
      onClose();
      
      // เรียก callback เพื่อแสดง toast และรีเฟรชข้อมูล
      onReject({
        ...payload,
        rejectReason: rejectReason,
        equipmentName: normalizedRepairRequest.equipment_name,
        requesterName: normalizedRepairRequest.requester_name
      });
    } catch (error) {
      console.error('Error rejecting repair request:', error);
      console.error('Error response:', error.response?.data);
      setFormError(`เกิดข้อผิดพลาดในการปฏิเสธคำขอซ่อม: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextImage = () => {
    setActiveImageIndex(prev => (prev + 1) % repairImages.length);
  }

  const prevImage = () => {
    setActiveImageIndex(prev => (prev - 1 + repairImages.length) % repairImages.length);
  }

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'single' ? 'grid' : 'single');
    setIsZoomed(false);
  }

  if (!repairRequest) return null

  if (!open) return null;

  // Enhanced SectionHeader with gradient and better styling
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

  const getDialogTitle = () => {
    const titles = {
      pending: "พิจารณาคำขอแจ้งซ่อมครุภัณฑ์",
      approved: "รายละเอียดคำขอซ่อม (อนุมัติแล้ว)",
      rejected: "รายละเอียดคำขอซ่อม (ปฏิเสธ)",
      completed: "รายละเอียดคำขอซ่อม (เสร็จสิ้น)",
      incomplete: "รายละเอียดคำขอซ่อม (ไม่สำเร็จ)"
    };
    return titles[repairRequest?.status] || "รายละเอียดคำขอแจ้งซ่อมครุภัณฑ์";
  };

  return (
    <div className="modal modal-open">
      <div data-theme="light" className="max-w-8xl w-full h-full max-h-[95vh] rounded-2xl shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex flex-col h-full">
          {/* Enhanced Header with gradient and status badge */}
          <div className="sticky z-10 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg rounded-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                    <DocumentCheckIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-white">
                        {getDialogTitle()}
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-white">
                      <span className="flex items-center gap-1">
                        <TagIcon className="w-4 h-4" />
                        รหัส: <span className="font-mono font-semibold text-white">{repairRequest.repair_code || '-'}</span>
                      </span>
                      {repairRequest.request_date && (
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          วันที่แจ้ง: <span className="font-semibold text-white">{new Date(repairRequest.request_date).toLocaleDateString('th-TH')}</span>
                        </span>
                      )}
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
                            src={normalizedRepairRequest.avatar ? (typeof normalizedRepairRequest.avatar === 'string' && normalizedRepairRequest.avatar.startsWith('http') ? normalizedRepairRequest.avatar : `${UPLOAD_BASE}/uploads/user/${normalizedRepairRequest.avatar}`) : "/profile.png"}
                            alt={normalizedRepairRequest.requester_name}
                            className="w-full h-full object-cover"
                            onError={e => { e.target.onerror = null; e.target.src = '/profile.png'; }}
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                          <CheckCircleIcon className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="font-bold text-xl text-gray-800">{normalizedRepairRequest.requester_name || '-'}</h3>
                        {repairRequest.branch_name && (
                          <p className="text-gray-600 text-sm bg-gray-100 px-3 py-1 rounded-full inline-block">{repairRequest.branch_name}</p>
                        )}
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
                              src={normalizedRepairRequest.equipment_pic ? 
                                (normalizedRepairRequest.equipment_pic.startsWith('http') ? 
                                  normalizedRepairRequest.equipment_pic : 
                                  `${UPLOAD_BASE}/uploads/equipment/${normalizedRepairRequest.equipment_pic}`) : 
                                (normalizedRepairRequest.equipment_code ? 
                                  `${UPLOAD_BASE}/equipment/${normalizedRepairRequest.equipment_code}.jpg` : 
                                  "/lo.png")}
                              alt={normalizedRepairRequest.equipment_name}
                              className="max-w-full max-h-full object-contain p-2"
                              onError={e => { e.target.onerror = null; e.target.src = '/lo.png'; }}
                            />
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-blue-600 font-medium mb-1">ชื่อครุภัณฑ์</p>
                            <p className="font-bold text-lg text-gray-800">{normalizedRepairRequest.equipment_name || '-'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-100">
                            <div className="p-2 bg-blue-500 rounded-full">
                              <TagIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm text-blue-600 font-medium mb-1">รหัสครุภัณฑ์</p>
                              <p className="font-bold text-gray-800">{normalizedRepairRequest.equipment_code || '-'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-full border border-green-100">
                            <div className="p-2 bg-green-500 rounded-full">
                              <CubeIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm text-green-600 font-medium mb-1">ประเภท</p>
                              <p className="font-bold text-gray-800">{normalizedRepairRequest.equipment_category || '-'}</p>
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
                <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="p-6">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{repairRequest.problem_description || '-'}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                        <div className="p-3 bg-blue-600 rounded-full">
                          <CalendarIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-blue-600 font-medium mb-1">วันที่แจ้ง</p>
                          <p className="font-bold text-lg text-gray-800">{repairRequest.request_date ? new Date(repairRequest.request_date).toLocaleDateString('th-TH') : '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl">
                        <div className="p-3 bg-orange-500 rounded-full">
                          <TagIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-orange-600 font-medium mb-1">ค่าใช้จ่ายประมาณ</p>
                          <p className="font-bold text-lg text-gray-800">{Number(repairRequest.estimated_cost || 0).toLocaleString()} บาท</p>
                        </div>
                      </div>
                      {repairRequest.budget > 0 && (
                        <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
                          <div className="p-3 bg-green-500 rounded-full">
                            <TagIcon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-green-600 font-medium mb-1">งบประมาณที่อนุมัติ</p>
                            <p className="font-bold text-lg text-gray-800">{Number(repairRequest.budget || 0).toLocaleString()} บาท</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* รูปภาพความเสียหาย */}
                {repairImages.length > 0 ? (
                  <div>
                    <SectionHeader
                      title={`รูปภาพความเสียหาย (${repairImages.length} รูป)`}
                      icon={<DocumentCheckIcon className="h-5 w-5 text-white" />}
                    />
                    <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {repairImages.map((image, index) => (
                            <div key={image.filename || index} className="relative group cursor-pointer">
                              <img
                                src={image.url || `${UPLOAD_BASE}/${image.file_path}`}
                                alt={`รูปภาพความเสียหาย ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg shadow-lg hover:opacity-80 transition-opacity"
                                onClick={e => {
                                  e.stopPropagation();
                                  setActiveImageIndex(index);
                                  setIsZoomed(true);
                                }}
                              />
                              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-3 py-1 rounded-2xl">
                                รูปที่ {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <SectionHeader
                      title="รูปภาพความเสียหาย"
                      icon={<DocumentCheckIcon className="h-5 w-5 text-white" />}
                    />
                    <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="p-6">
                        <div className="bg-gray-100 p-12 rounded-lg flex flex-col items-center justify-center">
                          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                            <CgFileDocument  className="w-10 h-10 text-gray-400" />
                          </div>
                          <p className="text-gray-600 font-medium text-lg">ไม่มีรูปภาพความเสียหาย</p>
                          <p className="text-gray-500 text-sm mt-2">ไม่มีรูปภาพแนบมากับคำขอนี้</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}



                {/* สถานะคำขอ */}
                {repairRequest.status === 'approved' && (
                  <div>
                    <SectionHeader
                      title="สถานะคำขอ"
                      icon={<CheckCircleIcon className="h-5 w-5 text-white" />}
                    />
                    <div className="bg-green-600 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="p-6">
                        <div className="p-6 rounded-xl">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-green-500">
                              <CheckCircleIcon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-white mb-3">คำขอได้รับการอนุมัติแล้ว</h4>
                              <div className="bg-green-50 px-5 py-2 rounded-full border border-gray-200">
                                <div className="text-sm text-gray-700 mb-2">
                                  <span className="font-bold">รับผิดชอบโดย:</span> {repairRequest.responsible_person || 'ไม่ระบุผู้รับผิดชอบ'}
                                </div>
                                {repairRequest.note && (
                                  <div className="text-sm text-gray-700">
                                    <span className="font-bold">หมายเหตุ:</span> {repairRequest.note}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {repairRequest.status === 'completed' && (
                  <div>
                    <SectionHeader
                      title="สถานะคำขอ"
                      icon={<CheckCircleIcon className="h-5 w-5 text-white" />}
                    />
                    <div className="bg-blue-600 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="p-6">
                        <div className="p-6 rounded-xl">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-blue-500">
                              <CheckCircleIcon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-white mb-3">การซ่อมเสร็จสิ้นแล้ว</h4>
                              <div className="bg-white/80 px-6 py-3 rounded-full border border-gray-200">
                                <div className="text-sm text-gray-700 mb-2">
                                  <span className="font-bold">รับผิดชอบโดย:</span> {repairRequest.responsible_person || 'ไม่ระบุผู้รับผิดชอบ'}
                                </div>
                                {repairRequest.inspection_notes && (
                                  <div className="text-sm text-gray-700">
                                    <span className="font-bold">บันทึกการตรวจสอบ:</span> {repairRequest.inspection_notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {repairRequest.status === 'rejected' && (
                  <div>
                    <SectionHeader
                      title="สถานะคำขอ"
                      icon={<XCircleIcon className="h-5 w-5 text-white" />}
                    />
                    <div className="bg-red-600 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="p-6">
                        <div className="p-6 rounded-xl">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-red-500">
                              <XCircleIcon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-white mb-3">คำขอถูกปฏิเสธ</h4>
                              <div className="bg-white/80 p-4 rounded-full border border-gray-200">
                                {repairRequest.rejection_reason && (
                                  <p className="text-gray-700 leading-relaxed">{repairRequest.rejection_reason}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* การดำเนินการ - ย้ายมาไว้ล่างสุดเป็นคอลัมเดียว */}
            {(repairRequest.status === 'pending' || !repairRequest.status) && (
              <div className="mt-8">
                <SectionHeader
                  title="การดำเนินการ"
                  icon={<CheckCircleIcon className="h-5 w-5 text-white" />}
                />
                <div className="bg-yellow-400 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-white/80 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">ค่าใช้จ่ายประมาณการจากผู้แจ้ง</p>
                          <p className="text-xl font-bold text-gray-800">{Number(normalizedRepairRequest.estimated_cost || 0).toLocaleString()} บาท</p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          งบประมาณที่อนุมัติ
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                            fieldErrors.budgetApproved ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                          }`}
                          value={
                            budgetApproved === '' ? '' : Number(budgetApproved.toString().replace(/,/g, '')).toLocaleString()
                          }
                          onChange={e => {
                            let raw = e.target.value.replace(/[^\d]/g, '');
                            setBudgetApproved(raw);
                            if (fieldErrors.budgetApproved) {
                              setFieldErrors(prev => ({ ...prev, budgetApproved: null }));
                            }
                          }}
                          inputMode="numeric"
                          pattern="[0-9,]*"
                          placeholder="0"
                        />
                        {fieldErrors.budgetApproved && (
                          <p className="text-xs text-red-600 mt-1">{fieldErrors.budgetApproved}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          หมายเหตุ (ถ้ามี)
                        </label>
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="ระบุหมายเหตุเพิ่มเติม"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          มอบหมายให้
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                            fieldErrors.assignedTo ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                          }`}
                          value={assignedTo}
                          onChange={(e) => {
                            handleAssignedToChange(e.target.value);
                            if (fieldErrors.assignedTo) {
                              setFieldErrors(prev => ({ ...prev, assignedTo: null }));
                            }
                          }}
                          disabled={loadingAdmins}
                        >
                          <option value="" disabled>
                            {loadingAdmins ? 'กำลังโหลด...' : 'เลือกผู้รับผิดชอบ'}
                          </option>
                          {adminUsers.map(user => (
                            <option key={user.user_id} value={user.user_id}>
                              {user.Fullname} ({user.role_name || 'Admin'})
                            </option>
                          ))}
                        </select>
                        {fieldErrors.assignedTo && (
                          <p className="text-xs text-red-600 mt-1">{fieldErrors.assignedTo}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Enhanced Footer */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 rounded-2xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Status info on left */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <InformationCircleIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">สถานะปัจจุบัน</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      repairRequest.status === 'pending' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                      repairRequest.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      repairRequest.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                      repairRequest.status === 'completed' ? 'bg-indigo-100 text-indigo-800 border-indigo-200':
                      repairRequest.status === 'incomplete' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                      'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                      <span className="mr-1">
                        {repairRequest.status === 'pending' && <ClockIcon className="w-4 h-4" />}
                        {repairRequest.status === 'approved' && <CheckCircleIcon className="w-4 h-4" />}
                        {repairRequest.status === 'rejected' && <XCircleIcon className="w-4 h-4" />}
                        {repairRequest.status === 'completed' && <DocumentCheckIcon className="w-4 h-4" />}
                        {repairRequest.status === 'incomplete' && <XCircleIcon className="w-4 h-4" />}
                      </span>
                      <span>
                        {repairRequest.status === 'pending' && 'รอการอนุมัติ'}
                        {repairRequest.status === 'approved' && 'อนุมัติแล้ว'}
                        {repairRequest.status === 'rejected' && 'ปฏิเสธ'}
                        {repairRequest.status === 'completed' && 'เสร็จสิ้น'}
                        {repairRequest.status === 'incomplete' && 'ไม่สำเร็จ'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Action buttons on right */}
              <div className="flex justify-end gap-3">
                {(repairRequest.status === 'pending' || !repairRequest.status) && (
                  <>
                    {formError && (
                      <div className="w-full mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm font-medium">{formError}</p>
                      </div>
                    )}
                    <button
                      onClick={handleRejectClick}
                      className="btn bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-transparent"
                      disabled={isSubmitting}
                    >
                      <XCircleIcon className="w-5 h-5" />
                      {isSubmitting ? 'กำลังประมวลผล...' : 'ปฏิเสธ'}
                    </button>
                    <button
                      onClick={handleApprove}
                      className="btn bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-transparent"
                      disabled={isSubmitting}
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                      {isSubmitting ? 'กำลังประมวลผล...' : 'อนุมัติ'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Reject Reason Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg transform transition-all duration-300 overflow-hidden rounded-4xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <XCircleIcon className="w-5 h-5 text-red-500" />
                  <span>ปฏิเสธคำขอซ่อม</span>
                </h3>
                <button
                  onClick={handleCancelReject}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors duration-150"
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    โปรดเลือกเหตุผลในการปฏิเสธ
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="space-y-2 overflow-y-auto pr-2">
                    {rejectReasonOptions.map((reason) => (
                      <label
                        key={reason}
                        className={`flex items-start gap-2.5 p-3 cursor-pointer transition-colors duration-150 rounded-lg 
                          ${
                            rejectReason === reason
                              ? 'bg-red-50 border-red-300 shadow-sm'
                              : 'border-gray-200 hover:bg-red-50 hover:border-red-200'
                          }`}
                      >
                        <input
                          type="radio"
                          name="rejectReason"
                          value={reason}
                          checked={rejectReason === reason}
                          onChange={() => setRejectReason(reason)}
                          className="mt-0.5 form-radio accent-red-500"
                        />
                        <span className="text-sm text-gray-700">{reason}</span>
                      </label>
                    ))}
                  </div>
                  {formError && !rejectReason && (
                    <p className="mt-1.5 text-sm text-red-600">{formError}</p>
                  )}
                </div>

                {/* Additional notes for Other reason */}
                {rejectReason === "อื่นๆ (โปรดระบุในหมายเหตุ)" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      ระบุเหตุผลเพิ่มเติม
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-sm"
                      placeholder="โปรดระบุเหตุผลในการปฏิเสธ"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      required
                    />
                    {formError && rejectReason === "อื่นๆ (โปรดระบุในหมายเหตุ)" && !notes.trim() && (
                      <p className="mt-1.5 text-sm text-red-600">{formError}</p>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-2">
                  <button
                    onClick={handleCancelReject}
                    className="px-4 py-2 border border-gray-300 rounded-4xl text-gray-700 font-medium hover:bg-gray-100 transition-colors duration-150 text-sm"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleConfirmReject}
                    className="px-4 py-2 bg-red-600 text-white rounded-4xl font-medium hover:bg-red-700 transition-colors duration-150 flex items-center gap-1.5 text-sm"
                    disabled={!rejectReason || (rejectReason === "อื่นๆ (โปรดระบุในหมายเหตุ)" && !notes.trim())}
                  >
                    <XCircleIcon className="w-4 h-4" />
                    ยืนยัน
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {isZoomed && repairImages.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-gray-100">
              <div>
                <h3 className="font-medium">
                  รูปภาพความเสียหาย {activeImageIndex + 1} จาก {repairImages.length}
                </h3>
                {repairImages[activeImageIndex]?.repair_code && (
                  <p className="text-sm text-blue-600 font-medium">
                    รหัส: {repairImages[activeImageIndex].repair_code}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsZoomed(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                ✕
              </button>
            </div>

            {/* Image */}
            <div className="relative">
              <img
                src={repairImages[activeImageIndex]?.url || `${UPLOAD_BASE}/${repairImages[activeImageIndex]?.file_path}`}
                alt={`รูปภาพความเสียหาย ${activeImageIndex + 1}`}
                className="max-w-full max-h-[70vh] object-contain"
              />

              {/* Navigation buttons */}
              {repairImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-opacity"
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-opacity"
                  >
                    <FaChevronRight />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {repairImages.length > 1 && (
              <div className="p-4 bg-gray-100">
                <div className="flex gap-2 overflow-x-auto">
                  {repairImages.map((image, index) => (
                    <button
                      key={image.filename || index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded border-2 transition-colors ${
                        index === activeImageIndex
                          ? 'border-blue-500'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={image.url || `${UPLOAD_BASE}/${image.file_path}`}
                        alt={`รูปภาพ ${index + 1}`}
                        className="w-full h-full object-cover rounded"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
  )
}