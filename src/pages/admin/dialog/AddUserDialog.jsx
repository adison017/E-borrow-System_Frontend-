import React, { useEffect, useRef, useState } from "react";
import axios from '../../../utils/axios.js';
import {
  FaBook,
  FaBuilding,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaIdCard,
  FaLock,
  FaMapMarkerAlt,
  FaPhone,
  FaUser
} from "react-icons/fa";
import { GiOfficeChair } from "react-icons/gi";
import { MdClose, MdCloudUpload } from "react-icons/md";
import Swal from 'sweetalert2';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import PinDialog from "../../../components/dialog/PinDialog";
import { API_BASE, UPLOAD_BASE } from '../../../utils/api';

export default function AddUserDialog({
  open,
  onClose,
  initialFormData,
  onSave
}) {
  const DEFAULT_PROFILE_URL = "/profile.png";
  const [formData, setFormData] = useState({
    user_code: "",
    username: "",
    Fullname: "",
    email: "",
    phone: "",
    position_name: "",
    branch_name: "",
    position_id: "",
    branch_id: "",
    role_id: "",
    role_name: "",
    street: "",
    province: "",
    district: "",
    parish: "",
    postal_no: "",
    password: "",
    pic: DEFAULT_PROFILE_URL
  });
  const [positions, setPositions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [amphures, setAmphures] = useState([]);
  const [tambons, setTambons] = useState([]);
  const [selected, setSelected] = useState({
    province_id: undefined,
    amphure_id: undefined,
    tambon_id: undefined
  });
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(DEFAULT_PROFILE_URL);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // เพิ่ม state สำหรับแสดงรหัสผ่าน
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const hasInitialized = useRef(false);

              // Add validation state for real-time feedback
            const [validation, setValidation] = useState({
              email: null,
              user_code: null,
              phone: null,
              username: null
            });

  useEffect(() => {
    // Get current user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
          } catch (error) {
      // Error parsing user data
    }
    }

    const fetchData = async () => {
      try {
        const [positionsResponse, branchesResponse, rolesResponse] = await Promise.all([
          axios.get(`${API_BASE}/users/positions`),
          axios.get(`${API_BASE}/users/branches`),
          axios.get(`${API_BASE}/users/roles`),
        ]);

        if (!positionsResponse.data) throw new Error('Failed to fetch positions');
        if (!branchesResponse.data) throw new Error('Failed to fetch branches');
        if (!rolesResponse.data) throw new Error('Failed to fetch roles');

        setPositions(positionsResponse.data);
        setBranches(branchesResponse.data);
        setRoles(rolesResponse.data);

        // ดึงข้อมูลจังหวัด/อำเภอ/ตำบลจาก dataset สาธารณะ
        try {
          const res = await fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province_with_amphure_tambon.json');
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setProvinces(data);
          } else {
            // Provinces dataset returned unexpected format
            setProvinces([]);
          }
        } catch (addrErr) {
          // Error fetching provinces dataset
          setProvinces([]);
        }

      } catch (error) {
        // Error fetching data
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    console.log('🔄 AddUser useEffect triggered:', { initialFormData, open, hasInitialized: hasInitialized.current });

    // Only initialize form data once when dialog opens
    if (open && !hasInitialized.current) {
      hasInitialized.current = true;
      console.log('🎯 AddUser Initializing form data for the first time');

      if (initialFormData) {
        console.log('📝 AddUser Setting form data from initialFormData');
        setFormData({
          user_code: initialFormData.user_code || "",
          username: initialFormData.username || "",
          Fullname: initialFormData.Fullname || "",
          email: initialFormData.email || "",
          phone: initialFormData.phone || "",
          position_name: initialFormData.position_name || "",
          branch_name: initialFormData.branch_name || "",
          position_id: initialFormData.position_id || "",
          branch_id: initialFormData.branch_id || "",
          role_id: initialFormData.role_id || "",
          role_name: initialFormData.role_name || "",
          street: initialFormData.street || "",
          province: initialFormData.province || "",
          district: initialFormData.district || "",
          parish: initialFormData.parish || "",
          postal_no: initialFormData.postal_no || "",
          password: "",
          pic: initialFormData.pic || DEFAULT_PROFILE_URL
        });
        setPreviewImage(initialFormData.pic || DEFAULT_PROFILE_URL);
      } else {
        // Only reset when dialog opens and there's no initial data
        console.log('🆕 AddUser Resetting form data for new dialog');
        setFormData({
          user_code: "",
          username: "",
          Fullname: "",
          email: "",
          phone: "",
          position_name: "",
          branch_name: "",
          position_id: "",
          branch_id: "",
          role_id: "",
          role_name: "",
          street: "",
          province: "",
          district: "",
          parish: "",
          postal_no: "",
          password: "",
          pic: DEFAULT_PROFILE_URL
        });
        setPreviewImage(DEFAULT_PROFILE_URL);
      }
    } else if (open && hasInitialized.current) {
      console.log('⏭️ AddUser Dialog already initialized, skipping form reset');
    }

    // Reset the flag when dialog closes
    if (!open) {
      console.log('🚪 AddUser Dialog closed, resetting initialization flag');
      hasInitialized.current = false;
    }
  }, [initialFormData, open]);

  // Real-time validation function
  const validateField = async (name, value) => {
    if (!value) {
      setValidation(prev => ({ ...prev, [name]: null }));
      return;
    }

    try {
      if (name === 'email' && value.includes('@')) {
        const res = await axios.get(`${API_BASE}/users/email/${value}`);
        setValidation(prev => ({ ...prev, email: res.data ? 'duplicate' : 'ok' }));
      } else if (name === 'user_code' && value.length >= 5) {
        const res = await axios.get(`${API_BASE}/users/username/${value}`);
        setValidation(prev => ({ ...prev, user_code: res.data ? 'duplicate' : 'ok' }));
      } else if (name === 'username' && value.length >= 3) {
        const res = await axios.get(`${API_BASE}/users/username/${value}`);
        setValidation(prev => ({ ...prev, username: res.data ? 'duplicate' : 'ok' }));
      } else if (name === 'phone' && value.length >= 9) {
        const res = await axios.get(`${API_BASE}/users/phone/${value}`);
        setValidation(prev => ({ ...prev, phone: res.data ? 'duplicate' : 'ok' }));
      }
    } catch (error) {
      // If error, assume field is available
      setValidation(prev => ({ ...prev, [name]: 'ok' }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('🔵 AddUser handleChange called:', { name, value, currentFormData: formData });

    if (name === 'position_name') {
      const selectedPosition = positions.find(p => p.position_name === value);
      setFormData(prev => {
        const newData = {
          ...prev,
          position_name: value,
          position_id: selectedPosition ? selectedPosition.position_id : prev.position_id
        };
        console.log('✅ AddUser Updated formData (position):', newData);
        return newData;
      });
    } else if (name === 'branch_name') {
      const selectedBranch = branches.find(b => b.branch_name === value);
      setFormData(prev => {
        const newData = {
          ...prev,
          branch_name: value,
          branch_id: selectedBranch ? selectedBranch.branch_id : prev.branch_id
        };
        console.log('✅ AddUser Updated formData (branch):', newData);
        return newData;
      });
    } else if (name === 'role_name') {
      const selectedRole = roles.find(r => r.role_name === value);
      setFormData(prev => {
        const newData = {
          ...prev,
          role_name: value,
          role_id: selectedRole ? selectedRole.role_id : prev.role_id
        };
        console.log('✅ AddUser Updated formData (role):', newData);
        return newData;
      });
    } else {
      setFormData(prev => {
        const newData = { ...prev, [name]: value };
        console.log('✅ AddUser Updated formData (general):', newData);
        return newData;
      });
    }

                  // Real-time validation for email, user_code, username, and phone
              if (['email', 'user_code', 'username', 'phone'].includes(name)) {
                validateField(name, value);
              }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        Swal.fire({
          icon: 'error',
          title: 'ขนาดไฟล์ใหญ่เกินไป',
          text: `ไฟล์มีขนาด ${fileSizeMB} MB\nขนาดไฟล์ต้องไม่เกิน 2 MB`,
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#3085d6'
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        Swal.fire({
          icon: 'error',
          title: 'รูปแบบไฟล์ไม่ถูกต้อง',
          text: 'รองรับเฉพาะไฟล์ JPG และ PNG เท่านั้น',
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#3085d6'
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // แสดง preview รูปภาพทันที แต่ยังไม่อัพโหลด
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
        setFormData(prev => ({ ...prev, pic: file })); // เก็บไฟล์ไว้ใน formData
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddressChange = (event, type) => {
    const value = event.target.value;
    const id = Number(value);

    if (type === 'province') {
      setAmphures([]);
      setTambons([]);
      setSelected({
        province_id: id,
        amphure_id: undefined,
        tambon_id: undefined
      });
      const provinceObj = provinces.find(p => p.id === id);
      setFormData(prev => ({
        ...prev,
        province: provinceObj ? provinceObj.name_th : '',
        district: '',
        parish: '',
        postal_no: ''
      }));
      if (provinceObj) {
        setAmphures(provinceObj.amphure);
      }
    } else if (type === 'amphure') {
      setTambons([]);
      setSelected(prev => ({
        ...prev,
        amphure_id: id,
        tambon_id: undefined
      }));
      const amphureObj = amphures.find(a => a.id === id);
      setFormData(prev => ({
        ...prev,
        district: amphureObj ? amphureObj.name_th : '',
        parish: '',
        postal_no: ''
      }));
      if (amphureObj) {
        setTambons(amphureObj.tambon);
      }
    } else if (type === 'tambon') {
      setSelected(prev => ({
        ...prev,
        tambon_id: id
      }));
      const tambonObj = tambons.find(t => t.id === id);
      setFormData(prev => ({
        ...prev,
        parish: tambonObj ? tambonObj.name_th : '',
        postal_no: tambonObj ? tambonObj.zip_code : ''
      }));
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    // handlePinSubmit called with pin

    if (!currentUser) {
      // No currentUser found
      setPinError("ไม่พบข้อมูลผู้ใช้ปัจจุบัน");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // Token verification

      const response = await axios.post(`${API_BASE}/users/verify-password`,
        { password: pin },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

              // Response received

      if (response.data.success) {
                  // Password verified successfully, calling handleSubmit
        setShowPin(false);
        setPin("");
        setPinError("");
        handleSubmit(); // call the real submit
              } else {
          // Password verification failed
        setPinError("รหัสผ่านไม่ถูกต้อง");
      }
          } catch (error) {
        // Error in handlePinSubmit
      setPinError(error.response?.data?.message || "รหัสผ่านไม่ถูกต้อง");
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    // handleSubmit called
    if (isLoading) return; // ป้องกัน double submit
    setIsLoading(true);
    try {
      const position = positions.find(p => p.position_name === formData.position_name);
      const branch = branches.find(b => b.branch_name === formData.branch_name);
      const role = roles.find(r => r.role_name === formData.role_name);

      // ตรวจสอบข้อมูลเบื้องต้นเพื่อหลีกเลี่ยง 400
      if (!formData.user_code || String(formData.user_code).length !== 11) {
        toast.error('กรุณากรอกรหัสนิสิตให้ครบ 11 หลัก');
        setIsLoading(false);
        return;
      }
      if (!formData.phone || String(formData.phone).length !== 10) {
        toast.error('กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');
        setIsLoading(false);
        return;
      }
      if (!formData.password) {
        toast.error('กรุณากรอกรหัสผ่าน');
        setIsLoading(false);
        return;
      }
      if (!position?.position_id || !branch?.branch_id || !role?.role_id) {
        toast.error('กรุณาเลือก ตำแหน่ง / สาขา / บทบาท ให้ครบถ้วน');
        setIsLoading(false);
        return;
      }

      // Pre-submission validation for duplicates
      try {
        // Check for duplicate email
        const emailRes = await axios.get(`${API_BASE}/users/email/${formData.email}`);
        if (emailRes.data) {
          toast.error('อีเมลนี้ถูกใช้ไปแล้ว กรุณาใช้อีเมลอื่น');
          setIsLoading(false);
          return;
        }
      } catch (error) {
        // Continue if error
      }

      try {
        // Check for duplicate user_code
        const userCodeRes = await axios.get(`${API_BASE}/users/username/${formData.user_code}`);
        if (userCodeRes.data) {
          toast.error('รหัสนิสิต/บุคลากรนี้ถูกใช้ไปแล้ว กรุณาใช้รหัสอื่น');
          setIsLoading(false);
          return;
        }
      } catch (error) {
        // Continue if error
      }

      try {
        // Check for duplicate username
        const usernameRes = await axios.get(`${API_BASE}/users/username/${formData.username}`);
        if (usernameRes.data) {
          toast.error('ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว กรุณาใช้ชื่ออื่น');
          setIsLoading(false);
          return;
        }
      } catch (error) {
        // Continue if error
      }

      try {
        // Check for duplicate phone
        const phoneRes = await axios.get(`${API_BASE}/users/phone/${formData.phone}`);
        if (phoneRes.data) {
          toast.error('เบอร์โทรศัพท์นี้ถูกใช้ไปแล้ว กรุณาใช้เบอร์อื่น');
          setIsLoading(false);
          return;
        }
      } catch (error) {
        // Continue if error
      }

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('ไม่พบ token กรุณา login ใหม่');
        setIsLoading(false);
        return;
      }

      // 1. ตรวจสอบรูปภาพ - ถ้าเป็น Cloudinary URL ใช้เลย ถ้าเป็น File ให้อัปโหลดก่อน
      let avatarUrl = DEFAULT_PROFILE_URL;
      // formData.pic type and value

      if (formData.pic && typeof formData.pic === 'string' && formData.pic.includes('cloudinary.com')) {
        // ถ้าเป็น Cloudinary URL ใช้เลย
                  // Using existing Cloudinary URL
        avatarUrl = formData.pic;
      } else if (formData.pic instanceof File) {
        // ถ้าเป็น File ให้อัปโหลดก่อน
                  // Uploading file to Cloudinary
        const formDataImage = new FormData();
        formDataImage.append('user_code', formData.user_code);
        formDataImage.append('avatar', formData.pic);
        try {
          const uploadResponse = await axios.post(`${API_BASE}/users/upload-image`, formDataImage, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            }
          });
                      // File uploaded successfully
          avatarUrl = uploadResponse.data.url;
        } catch (uploadError) {
                      // Upload error
          if (uploadError.response && uploadError.response.status === 401) {
            toast.error('Session หมดอายุ กรุณา login ใหม่');
            setIsLoading(false);
            return;
          } else {
            toast.warn('อัพโหลดรูปภาพไม่สำเร็จ แต่ข้อมูลผู้ใช้ถูกบันทึกแล้ว');
          }
        }
      } else {
                  // Using default avatar URL
      }

      // 2. สร้าง user โดยใช้ชื่อไฟล์จริง
      const userDataToSave = {
        user_code: formData.user_code,
        username: formData.username,
        Fullname: formData.Fullname,
        email: formData.email,
        phone: formData.phone,
        position_id: position?.position_id || null,
        branch_id: branch?.branch_id || null,
        role_id: role?.role_id || null,
        street: formData.street || '',
        parish: formData.parish || '',
        district: formData.district || '',
        province: formData.province || '',
        postal_no: formData.postal_no || '',
        avatar: avatarUrl,
        password: formData.password || undefined
      };

      const response = await axios.post(`${API_BASE}/users`, userDataToSave, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      onSave(userDataToSave); // ส่ง object user ที่จะบันทึก
      onClose();
    } catch (error) {
      // Add user error
      toast.error(error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    formData.username &&
    formData.Fullname &&
    formData.email &&
    formData.phone &&
    formData.password &&
    formData.province &&
    formData.district &&
    formData.parish &&
    formData.street &&
    formData.role_name;

  // Debug logging
  console.log('Form Data:', formData);
  console.log('Is Form Valid:', isFormValid);
  console.log('Positions:', positions);
  console.log('Branches:', branches);
  console.log('Roles:', roles);

  if (!open) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box relative w-full max-h-[95vh] max-w-8xl mx-auto bg-white rounded-3xl overflow-hidden animate-fadeIn transition-all duration-300 transform overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-gray-50 z-10 transition-all duration-200 transform hover:rotate-90"
          aria-label="ปิด"
        >
          <MdClose className="w-7 h-7" />
        </button>

        <div className="flex flex-col md:flex-row h-full">
          <div className="flex flex-col items-center justify-start pt-10 px-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 md:min-w-[280px]">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-blue-800 text-center mb-2">เพิ่มผู้ใช้งานใหม่</h2>
              <h3 className="text-lg font-bold text-blue-800 text-center mb-2">รูปโปรไฟล์</h3>
              <p className="text-xs text-gray-500 text-center">อัพโหลดรูปภาพสำหรับใช้เป็นรูปโปรไฟล์</p>
            </div>
            <div className="w-36 h-36 rounded-full bg-white shadow-lg flex items-center justify-center relative group overflow-hidden border-4 border-white hover:border-blue-200 transition-all duration-300">
              <img
                src={previewImage && previewImage.includes('cloudinary.com') ? previewImage : previewImage || DEFAULT_PROFILE_URL}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
                onError={e => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_PROFILE_URL;
                }}
              />
              <label htmlFor="profile-upload-add" className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer rounded-full">
                <MdCloudUpload className="w-8 h-8 text-white mb-1" />
                <span className="text-xs font-medium text-white bg-blue-600/80 hover:bg-blue-700 px-3 py-1.5 rounded-full shadow-lg transform transition-transform duration-300 group-hover:scale-110">เปลี่ยนรูป</span>
              </label>
              <input
                id="profile-upload-add"
                type="file"
                className="hidden"
                accept="image/jpeg, image/png"
                ref={fileInputRef}
                onChange={handleImageChange}
              />
            </div>
            {formData.pic && typeof formData.pic !== 'string' && (
              <span className="text-xs text-gray-500 max-w-full truncate px-3 bg-white/70 py-1.5 rounded-full mt-4 shadow-sm border border-gray-100">{formData.pic.name}</span>
            )}
            <div>
              <label className="mt-5 text-sm font-medium text-gray-700 mb-1 flex justify-center items-center">
                <GiOfficeChair className="w-5 h-5 mr-2 text-center text-blue-500" />
                บทบาท<span className="text-red-500 ml-1">*</span>
              </label>
              <select
                name="role_name"
                className="w-35 px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm hover:border-blue-300 bg-white appearance-none"
                value={formData.role_name}
                onChange={handleChange}
                required
              >
                <option value="" disabled>เลือกบทบาท</option>
                {roles.map(role => (
                  <option key={role.role_id} value={role.role_name}>
                    {role.role_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-start px-8 md:px-10 bg-gradient-to-br from-white to-gray-50">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                เพิ่มผู้ใช้งานใหม่
              </h2>
            </div>

            <form onSubmit={e => {
              e.preventDefault();
              setShowPin(true);
            }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-5 bg-white p-1 rounded-2xl transition-all duration-300 border border-gray-50">
                  <div className="flex items-center space-x-2 pb-3 mb-1 border-b border-gray-100">
                    <FaUser className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">ข้อมูลผู้ใช้งาน</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <FaIdCard className="w-4 h-4 mr-2 text-blue-500" />
                        รหัสนิสิต<span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="user_code"
                        className={`w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm hover:border-blue-300 bg-white ${
                          validation.user_code === 'duplicate' ? 'border-red-500 focus:ring-red-500' :
                          validation.user_code === 'ok' ? 'border-green-500 focus:ring-green-500' : ''
                        }`}
                        value={formData.user_code}
                        onChange={e => {
                          const value = e.target.value.replace(/\D/g, "");
                          setFormData(prev => ({ ...prev, user_code: value }));
                          // Trigger validation
                          validateField('user_code', value);
                        }}
                        onKeyPress={e => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        placeholder="กรุณากรอกรหัสนิสิต 11 หลัก"
                        required
                        maxLength={11}
                        title="กรุณากรอกรหัสนิสิต 11 หลัก"
                      />
                      {validation.user_code === 'duplicate' && (
                        <span className="text-red-500 text-xs mt-1">รหัสนิสิต/บุคลากรนี้ถูกใช้ไปแล้ว</span>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <FaUser className="w-4 h-4 mr-2 text-blue-500" />
                        ชื่อ-นามสกุล <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="Fullname"
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm hover:border-blue-300 bg-white"
                        value={formData.Fullname}
                        onChange={handleChange}
                        placeholder="ระบุชื่อ-นามสกุล"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <FaBuilding className="w-4 h-4 mr-2 text-blue-500" />
                          ตำแหน่ง <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          name="position_name"
                          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm hover:border-blue-300 bg-white appearance-none"
                          value={formData.position_name}
                          onChange={handleChange}
                          required
                        >
                          <option value="" disabled>เลือกตำแหน่ง</option>
                          {positions.map(position => (
                            <option key={position.position_id} value={position.position_name}>
                              {position.position_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <FaBook className="w-4 h-4 mr-2 text-blue-500" />
                          สาขา <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          name="branch_name"
                          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm hover:border-blue-300 bg-white appearance-none"
                          value={formData.branch_name}
                          onChange={handleChange}
                          required
                        >
                          <option value="" disabled>เลือกสาขา</option>
                          {branches.map(branch => (
                            <option key={branch.branch_id} value={branch.branch_name}>
                              {branch.branch_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <FaUser className="w-4 h-4 mr-2 text-blue-500" />
                        ชื่อผู้ใช้งาน <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="username"
                        className={`w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm hover:border-blue-300 bg-white ${
                          validation.username === 'duplicate' ? 'border-red-500 focus:ring-red-500' :
                          validation.username === 'ok' ? 'border-green-500 focus:ring-green-500' : ''
                        }`}
                        value={formData.username}
                        onChange={e => {
                          // อนุญาตเฉพาะ a-z, A-Z, 0-9, _ และ . เท่านั้น
                          const value = e.target.value.replace(/[^a-zA-Z0-9_.]/g, "");
                          setFormData(prev => ({ ...prev, username: value }));
                          // Trigger validation
                          validateField('username', value);
                        }}
                        onKeyPress={e => {
                          // ไม่อนุญาตให้พิมพ์ถ้าไม่ใช่ a-z, A-Z, 0-9, _ หรือ .
                          if (!/[a-zA-Z0-9_.]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        placeholder="ระบุชื่อผู้ใช้งาน"
                        required
                      />
                      {validation.username === 'duplicate' && (
                        <span className="text-red-500 text-xs mt-1">ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว</span>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <FaLock className="w-4 h-4 mr-2 text-blue-500" />
                        รหัสผ่าน <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm hover:border-blue-300 bg-white pr-12"
                          value={formData.password}
                          onChange={e => {
                            // อนุญาตเฉพาะ a-z, A-Z, 0-9, _ และ . เท่านั้น (ไม่ให้เว้นวรรค)
                            const value = e.target.value.replace(/[^a-zA-Z0-9_.]/g, "");
                            setFormData(prev => ({ ...prev, password: value }));
                          }}
                          onKeyPress={e => {
                            // ไม่อนุญาตให้พิมพ์ถ้าไม่ใช่ a-z, A-Z, 0-9, _ หรือ .
                            if (!/[a-zA-Z0-9_.]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          placeholder="รหัสผ่าน"
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600"
                          tabIndex={-1}
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? (
                            <FaEyeSlash className="h-5 w-5" />
                          ) : (
                            <FaEye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <FaEnvelope className="w-4 h-4 mr-2 text-blue-500" />
                        อีเมล <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        className={`w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm hover:border-blue-300 bg-white ${
                          validation.email === 'duplicate' ? 'border-red-500 focus:ring-red-500' :
                          validation.email === 'ok' ? 'border-green-500 focus:ring-green-500' : ''
                        }`}
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="example@domain.com"
                        required
                      />
                      {validation.email === 'duplicate' && (
                        <span className="text-red-500 text-xs mt-1">อีเมลนี้ถูกใช้ไปแล้ว</span>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <FaPhone className="w-4 h-4 mr-2 text-blue-500" />
                        เบอร์โทรศัพท์ <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          className={`w-full pl-4 px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm hover:border-blue-300 bg-white ${
                            validation.phone === 'duplicate' ? 'border-red-500 focus:ring-red-500' :
                            validation.phone === 'ok' ? 'border-green-500 focus:ring-green-500' : ''
                          }`}
                          value={formData.phone}
                          onChange={e => {
                            // อนุญาตเฉพาะตัวเลขเท่านั้น
                            const value = e.target.value.replace(/\D/g, "");
                            setFormData(prev => ({ ...prev, phone: value }));
                            // Trigger validation
                            validateField('phone', value);
                          }}
                          onKeyPress={e => {
                            // ไม่อนุญาตให้พิมพ์ถ้าไม่ใช่ตัวเลข
                            if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          maxLength={10}
                          placeholder="กรุณากรอกเบอร์โทรศัพท์"
                          required
                        />
                      </div>
                      {validation.phone === 'duplicate' && (
                        <span className="text-red-500 text-xs mt-1">เบอร์โทรศัพท์นี้ถูกใช้ไปแล้ว</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-5 bg-white p-2 rounded-2xl transition-all duration-300 border border-gray-50">
                  <div className="flex items-center space-x-2 pb-3 mb-1 border-b border-gray-100">
                    <FaMapMarkerAlt className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">ที่อยู่</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่ปัจจุบัน<span className="text-red-500 ml-1">*</span></label>
                      <textarea
                        name="street"
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm hover:border-blue-300 bg-white"
                        rows="3"
                        value={formData.street}
                        onChange={handleChange}
                        placeholder="ที่อยู่ปัจจุบัน"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <FaMapMarkerAlt className="w-4 h-4 mr-2 text-blue-500" />
                          จังหวัด <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          name="province"
                          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm hover:border-blue-300 bg-white appearance-none"
                          value={selected.province_id || ''}
                          onChange={(e) => handleAddressChange(e, 'province')}
                          required
                        >
                          <option value="" disabled>เลือกจังหวัด</option>
                          {provinces.map(province => (
                            <option key={province.id} value={province.id}>
                              {province.name_th}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <FaMapMarkerAlt className="w-4 h-4 mr-2 text-blue-500" />
                          อำเภอ <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          name="district"
                          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm hover:border-blue-300 bg-white appearance-none"
                          value={selected.amphure_id || ''}
                          onChange={(e) => handleAddressChange(e, 'amphure')}
                          required
                        >
                          <option value="" disabled>เลือกอำเภอ</option>
                          {amphures.map(amphure => (
                            <option key={amphure.id} value={amphure.id}>
                              {amphure.name_th}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <FaMapMarkerAlt className="w-4 h-4 mr-2 text-blue-500" />
                          ตำบล <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          name="parish"
                          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm hover:border-blue-300 bg-white appearance-none"
                          value={selected.tambon_id || ''}
                          onChange={(e) => handleAddressChange(e, 'tambon')}
                          required
                        >
                          <option value="" disabled>เลือกตำบล</option>
                          {tambons.map(tambon => (
                            <option key={tambon.id} value={tambon.id}>
                              {tambon.name_th}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <FaMapMarkerAlt className="w-4 h-4 mr-2 text-blue-500" />
                        รหัสไปรษณีย์
                      </label>
                      <input
                        type="text"
                        name="postal_no"
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-100"
                        value={formData.postal_no}
                        onChange={handleChange}
                        placeholder="รหัสไปรษณีย์"
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 pb-2">
                <button
                  type="button"
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-red-600 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all duration-200 shadow-sm"
                  onClick={onClose}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className={`px-8 py-2 text-sm font-medium text-white rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transform hover:-translate-y-0.5 transition-all duration-200 ${
                    isLoading
                      ? 'bg-green-500 hover:bg-green-600 cursor-wait'
                      : isFormValid
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!isFormValid || isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      กำลังบันทึก...
                    </div>
                  ) : 'เพิ่มผู้ใช้งาน'}
                </button>
              </div>
            </form>
            {/* PIN Dialog */}
            <PinDialog
              open={showPin}
              pin={pin}
              setPin={setPin}
              pinError={pinError}
              onCancel={() => {
                setShowPin(false);
                setPin("");
                setPinError("");
              }}
              onSubmit={handlePinSubmit}
            />
          </div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}