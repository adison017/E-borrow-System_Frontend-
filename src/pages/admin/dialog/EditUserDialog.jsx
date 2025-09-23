import { useEffect, useRef, useState } from "react";
import { MdCloudUpload } from "react-icons/md";
import PinDialog from "../../../components/dialog/PinDialog";
import { API_BASE } from '../../../utils/api';
import axios from '../../../utils/axios.js';
import { getAvatarSrc } from '../../../utils/image';

export default function EditUserDialog({ open, onClose, userData, onSave }) {
  const [formData, setFormData] = useState({
    user_id: "",
    user_code: "",
    username: "",
    Fullname: "",
    pic: "logo_it.png",
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
    password: ""
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
  const [previewImage, setPreviewImage] = useState("/profile.png");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const [validation, setValidation] = useState({
    email: null,
    user_code: null,
    phone: null,
    username: null
  });

  useEffect(() => {
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
        const [positionsResponse, branchesResponse, rolesResponse, provincesResponse] = await Promise.all([
          axios.get(`${API_BASE}/users/positions`),
          axios.get(`${API_BASE}/users/branches`),
          axios.get(`${API_BASE}/users/roles`),
          fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province_with_district_and_sub_district.json').then(res => res.json())
        ]);

        if (!positionsResponse.data) throw new Error('Failed to fetch positions');
        if (!branchesResponse.data) throw new Error('Failed to fetch branches');
        if (!rolesResponse.data) throw new Error('Failed to fetch roles');

        setPositions(positionsResponse.data);
        setBranches(branchesResponse.data);
        setRoles(rolesResponse.data);
  setProvinces(provincesResponse || []);

        if (userData) {
          const province = (provincesResponse || []).find(p => p.name_th === userData.province);
          if (province) {
            // kongvut latest JSON uses `districts` and each district has `sub_districts`
            const districts = province.districts || [];
            setAmphures(districts);
            const district = districts.find(a => a.name_th === userData.district);
            if (district) {
              const subDistricts = district.sub_districts || [];
              setTambons(subDistricts);
              const sub = subDistricts.find(t => t.name_th === userData.parish);
              if (sub) {
                setSelected({
                  province_id: province.id,
                  amphure_id: district.id,
                  tambon_id: sub.id
                });
              }
            }
          }
        }
      } catch (error) {
        // Error fetching data
      }
    };

    if (open) {
      fetchData();
    }
  }, [open, userData]);

  // kept for backward-compat; use shared helper for final preview URL
  const getAvatarUrl = (path) => {
    if (!path) return 'logo_it.png';
    if (path.includes('cloudinary.com')) return path;
    let filename = path;
    filename = filename.replace(/^http:\/\/localhost:5000\//, '')
      .replace(/^[\\/]+/, '')
      .replace(/^imgEborow\//, '')
      .replace(/^uploads\//, '');
    return filename;
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
        setAmphures(provinceObj.districts || []);
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
        setTambons(amphureObj.sub_districts || []);
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

  useEffect(() => {
    if (userData) {
      const avatarPath = getAvatarUrl(userData.avatar);

      const province = (provinces || []).find(p => p.name_th === userData.province);
      if (province) {
        const districts = province.districts || [];
        setAmphures(districts);
        const district = districts.find(a => a.name_th === userData.district);
        if (district) {
          const subDistricts = district.sub_districts || [];
          setTambons(subDistricts);
          const sub = subDistricts.find(t => t.name_th === userData.parish);
          if (sub) {
            setSelected({
              province_id: province.id,
              amphure_id: district.id,
              tambon_id: sub.id
            });
          }
        }
      }

      setFormData({
        user_id: userData.user_id,
        user_code: userData.user_code,
        username: userData.username,
        Fullname: userData.Fullname,
        pic: avatarPath || "logo_it.png",
        email: userData.email,
        phone: userData.phone || '',
        position_name: userData.position_name || '',
        branch_name: userData.branch_name || '',
        position_id: userData.position_id || '',
        branch_id: userData.branch_id || '',
        role_id: userData.role_id || '',
        role_name: userData.role_name || '',
        street: userData.street || '',
        province: userData.province || '',
        district: userData.district || '',
        parish: userData.parish || '',
        postal_no: userData.postal_no || '',
        password: ''
      });

      // normalize preview with shared helper (returns local placeholder for 'profile.png')
      setPreviewImage(getAvatarSrc(avatarPath));
    }
  }, [userData, provinces]);

  const validateField = async (name, value) => {
    if (!value) {
      setValidation(prev => ({ ...prev, [name]: null }));
      return;
    }

    try {
      const currentUserId = formData.user_id;

      if (name === 'email' && value.includes('@')) {
        const res = await axios.get(`${API_BASE}/users/email/${value}`);
        const isDuplicate = res.data && res.data.user_id !== currentUserId;
        setValidation(prev => ({ ...prev, email: isDuplicate ? 'duplicate' : 'ok' }));
      } else if (name === 'user_code' && value.length >= 5) {
        const res = await axios.get(`${API_BASE}/users/username/${value}`);
        const isDuplicate = res.data && res.data.user_id !== currentUserId;
        setValidation(prev => ({ ...prev, user_code: isDuplicate ? 'duplicate' : 'ok' }));
      } else if (name === 'username' && value.length >= 3) {
        const res = await axios.get(`${API_BASE}/users/username/${value}`);
        const isDuplicate = res.data && res.data.user_id !== currentUserId;
        setValidation(prev => ({ ...prev, username: isDuplicate ? 'duplicate' : 'ok' }));
      } else if (name === 'phone' && value.length >= 9) {
        const res = await axios.get(`${API_BASE}/users/phone/${value}`);
        const isDuplicate = res.data && res.data.user_id !== currentUserId;
        setValidation(prev => ({ ...prev, phone: isDuplicate ? 'duplicate' : 'ok' }));
      }
    } catch (error) {
      setValidation(prev => ({ ...prev, [name]: 'ok' }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'position_name') {
      const selectedPosition = positions.find(p => p.position_name === value);
      setFormData(prev => ({
        ...prev,
        position_name: value,
        position_id: selectedPosition ? selectedPosition.position_id : prev.position_id
      }));
    } else if (name === 'branch_name') {
      const selectedBranch = branches.find(b => b.branch_name === value);
      setFormData(prev => ({
        ...prev,
        branch_name: value,
        branch_id: selectedBranch ? selectedBranch.branch_id : prev.branch_id
      }));
    } else if (name === 'role_name') {
      const selectedRole = roles.find(r => r.role_name === value);
      setFormData(prev => ({
        ...prev,
        role_name: value,
        role_id: selectedRole ? selectedRole.role_id : prev.role_id
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (['email', 'user_code', 'username', 'phone'].includes(name)) {
      validateField(name, value);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(`ไฟล์มีขนาดใหญ่เกินไป (${fileSizeMB} MB)\nขนาดไฟล์ต้องไม่เกิน 2 MB`);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        alert('รองรับเฉพาะไฟล์ JPG และ PNG เท่านั้น');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
        setFormData(prev => ({ ...prev, pic: file }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (data) => {
    const errors = {};

    if (!data.username?.trim()) {
      errors.username = 'Username is required';
    }

    if (!data.Fullname?.trim()) {
      errors.Fullname = 'Full name is required';
    }

    if (!data.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      errors.email = 'Invalid email format';
    }

    if (!data.phone?.trim()) {
      errors.phone = 'Phone number is required';
    }

    return errors;
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setPinError("ไม่พบข้อมูลผู้ใช้ปัจจุบัน");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/users/verify-password`,
        { password: pin },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setShowPin(false);
        setPin("");
        setPinError("");
        handleSubmit();
      } else {
        setPinError("รหัสผ่านไม่ถูกต้อง");
      }
    } catch (error) {
      setPinError(error.response?.data?.message || "รหัสผ่านไม่ถูกต้อง");
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('ไม่พบ token กรุณา login ใหม่');
      setIsLoading(false);
      return;
    }

    try {
      const currentUserId = formData.user_id;

      if (formData.email) {
        try {
          const emailRes = await axios.get(`${API_BASE}/users/email/${formData.email}`);
          if (emailRes.data && emailRes.data.user_id !== currentUserId) {
            setError('อีเมลนี้ถูกใช้ไปแล้ว กรุณาใช้อีเมลอื่น');
            setIsLoading(false);
            return;
          }
        } catch (error) {
          // Continue if error
        }
      }

      if (formData.user_code) {
        try {
          const userCodeRes = await axios.get(`${API_BASE}/users/username/${formData.user_code}`);
          if (userCodeRes.data && userCodeRes.data.user_id !== currentUserId) {
            setError('รหัสนิสิต/บุคลากรนี้ถูกใช้ไปแล้ว กรุณาใช้รหัสอื่น');
            setIsLoading(false);
            return;
          }
        } catch (error) {
          // Continue if error
        }
      }

      if (formData.username) {
        try {
          const usernameRes = await axios.get(`${API_BASE}/users/username/${formData.username}`);
          if (usernameRes.data && usernameRes.data.user_id !== currentUserId) {
            setError('ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว กรุณาใช้ชื่ออื่น');
            setIsLoading(false);
            return;
          }
        } catch (error) {
          // Continue if error
        }
      }

      if (formData.phone) {
        try {
          const phoneRes = await axios.get(`${API_BASE}/users/phone/${formData.phone}`);
          if (phoneRes.data && phoneRes.data.user_id !== currentUserId) {
            setError('เบอร์โทรศัพท์นี้ถูกใช้ไปแล้ว กรุณาใช้เบอร์อื่น');
            setIsLoading(false);
            return;
          }
        } catch (error) {
          // Continue if error
        }
      }

      let avatarUrl = formData.pic;

      if (formData.pic && typeof formData.pic === 'string' && formData.pic.includes('cloudinary.com')) {
        avatarUrl = formData.pic;
      } else if (formData.pic instanceof File) {
        const formDataImage = new FormData();
        formDataImage.append('user_code', formData.user_code);
        formDataImage.append('avatar', formData.pic);
        try {
          const token = localStorage.getItem('token');
          const uploadResponse = await axios.post(`${API_BASE}/users/upload-image`, formDataImage, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            }
          });
          if (uploadResponse.data && uploadResponse.data.url) {
            avatarUrl = uploadResponse.data.url;
          }
        } catch (uploadError) {
          setError(uploadError.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
          setIsLoading(false);
          return;
        }
      }

      const updateData = {
        user_id: formData.user_id,
        user_code: formData.user_code,
        username: formData.username,
        Fullname: formData.Fullname,
        email: formData.email,
        phone: formData.phone,
        position_id: formData.position_id,
        branch_id: formData.branch_id,
        role_id: formData.role_id,
        street: formData.street,
        province: formData.province,
        district: formData.district,
        parish: formData.parish,
        postal_no: formData.postal_no,
        avatar: avatarUrl
      };

      const validationErrors = validateForm(updateData);

      if (Object.keys(validationErrors).length > 0) {
        setError('กรุณากรอกข้อมูลให้ครบถ้วน');
        setIsLoading(false);
        return;
      }

      const response = await axios.patch(
        `${API_BASE}/users/id/${formData.user_id}`,
        updateData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data?.user) {
        onSave(response.data.user);
        onClose();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    formData.username &&
    formData.Fullname &&
    formData.email &&
    formData.phone &&
    formData.province &&
    formData.district &&
    formData.parish &&
    formData.street &&
    formData.role_name;

  if (!open) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm bg-black/30">
      <div className="relative w-full max-h-[97vh] max-w-8xl mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 animate-fadeIn transition-all duration-500 transform scale-100 hover:shadow-3xl overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-gray-400 hover:text-red-500 p-3 rounded-full hover:bg-red-50 z-20 transition-all duration-300 transform hover:rotate-180 hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col md:flex-row h-full">
          <div className="flex flex-col items-center justify-start pt-20 px-12 bg-blue-50 md:min-w-[320px] relative overflow-hidden">
            <div className="mb-10 text-center relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4 shadow-full">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-blue-700 mb-2">แก้ไขข้อมูลผู้ใช้งาน</h2>
              <h3 className="text-lg font-semibold text-blue-700 mb-1">รูปโปรไฟล์</h3>
              <p className="text-sm text-gray-600">อัพโหลดรูปภาพสำหรับใช้เป็นรูปโปรไฟล์</p>
            </div>
            
            <div className="relative group">
              <div className="w-40 h-40 rounded-full bg-white shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:scale-105">
                <img
                  src={previewImage && previewImage.includes('cloudinary.com') ? previewImage : previewImage || "/profile.png"}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full transition-all duration-500 group-hover:scale-110"
                  onError={e => {
                    e.target.onerror = null;
                    e.target.src = "/profile.png";
                  }}
                />
                <label htmlFor="profile-upload-edit" className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer rounded-full">
                  <MdCloudUpload className="w-8 h-8 text-white mb-1" />
                  <span className="text-xs font-medium text-white bg-blue-600/80 hover:bg-blue-700 px-3 py-1.5 rounded-full shadow-lg transform transition-transform duration-300 group-hover:scale-110">เปลี่ยนรูป</span>
                </label>
                <input
                  id="profile-upload-edit"
                  type="file"
                  className="hidden"
                  accept="image/jpeg, image/png"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                />
              </div>
              <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
                formData.role_name === 'admin' ? 'bg-red-500' :
                formData.role_name === 'executive' ? 'bg-purple-500' :
                'bg-emerald-500'
              }`}>
                {formData.role_name === 'user' ? 'ผู้ใช้งาน' : formData.role_name === 'admin' ? 'ผู้ดูแลระบบ' : formData.role_name === 'executive' ? 'ผู้บริหาร' : formData.role_name}
              </div>
            </div>
            {formData.pic && typeof formData.pic !== 'string' && (
              <span className="text-xs text-gray-500 max-w-full truncate px-3 bg-white/70 py-1.5 rounded-full mt-4 shadow-sm border border-gray-100">{formData.pic.name}</span>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-start px-10 md:px-12 py-8 bg-white relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/30 rounded-full -translate-y-32 translate-x-32"></div>
            
            <div className="relative z-10">
              <div className="mb-8">
                <h2 className="text-3xl font-semibold text-blue-700 mb-3">
                  แก้ไขข้อมูลผู้ใช้งาน
                </h2>
                <div className="w-20 h-1 bg-blue-500 rounded-full"></div>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-100/50 hover:border-blue-200/50 group">
                    <div className="flex items-center space-x-3 pb-4 mb-6">
                      <div className="p-2 bg-blue-500 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-700">ข้อมูลผู้ใช้งาน</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                          </svg>
                          รหัสนิสิต <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="user_code"
                            className={`w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 shadow-inner focus:shadow-md transition-all duration-300 ${
                              validation.user_code === 'duplicate' ? 'border-red-500' :
                              validation.user_code === 'ok' ? 'border-green-500' : ''
                            }`}
                            value={formData.user_code}
                            onChange={handleChange}
                            placeholder="เช่น 64010123"
                            required
                            readOnly
                            disabled
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                        {validation.user_code === 'duplicate' && (
                          <span className="text-red-500 text-xs mt-1">รหัสนิสิต/บุคลากรนี้ถูกใช้ไปแล้ว</span>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          ชื่อ-นามสกุล <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="Fullname"
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 shadow-inner focus:shadow-md transition-all duration-300"
                            value={formData.Fullname}
                            onChange={handleChange}
                            placeholder="ระบุชื่อ-นามสกุล"
                            required
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            ตำแหน่ง <span className="text-red-500 ml-1">*</span>
                          </label>
                          <div className="relative">
                            <select
                              name="position_name"
                              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 shadow-inner focus:shadow-md transition-all duration-300 appearance-none"
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
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            สาขา <span className="text-red-500 ml-1">*</span>
                          </label>
                          <div className="relative">
                            <select
                              name="branch_name"
                              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 shadow-inner focus:shadow-md transition-all duration-300 appearance-none"
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
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          ชื่อผู้ใช้งาน <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="username"
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 shadow-inner focus:shadow-md transition-all duration-300"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="ระบุชื่อผู้ใช้งาน"
                            required
                            readOnly
                            disabled
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-100/50 hover:border-green-200/50 group">
                    <div className="flex items-center space-x-3 pb-4 mb-6">
                      <div className="p-2 bg-green-500 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">ข้อมูลติดต่อ</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          อีเมล <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            name="email"
                            className={`w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 shadow-inner focus:shadow-md transition-all duration-300 ${
                              validation.email === 'duplicate' ? 'border-red-500 focus:ring-red-500' :
                              validation.email === 'ok' ? 'border-green-500 focus:ring-green-500' : ''
                            }`}
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="example@domain.com"
                            required
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                        {validation.email === 'duplicate' && (
                          <span className="text-red-500 text-xs mt-1">อีเมลนี้ถูกใช้ไปแล้ว</span>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          เบอร์โทรศัพท์ <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            name="phone"
                            className={`w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 shadow-inner focus:shadow-md transition-all duration-300 ${
                              validation.phone === 'duplicate' ? 'border-red-500 focus:ring-red-500' :
                              validation.phone === 'ok' ? 'border-green-500 focus:ring-green-500' : ''
                            }`}
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="0812345678"
                            required
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                        {validation.phone === 'duplicate' && (
                          <span className="text-red-500 text-xs mt-1">เบอร์โทรศัพท์นี้ถูกใช้ไปแล้ว</span>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          ที่อยู่ <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <textarea
                            name="street"
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-inner focus:shadow-md transition-all duration-300 resize-none"
                            rows="3"
                            value={formData.street}
                            onChange={handleChange}
                            placeholder="ที่อยู่ปัจจุบัน"
                          />
                          <div className="absolute top-3 right-3">
                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            จังหวัด <span className="text-red-500 ml-1">*</span>
                          </label>
                          <div className="relative">
                            <select
                              name="province"
                              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 shadow-inner focus:shadow-md transition-all duration-300 appearance-none"
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
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            อำเภอ <span className="text-red-500 ml-1">*</span>
                          </label>
                          <div className="relative">
                            <select
                              name="district"
                              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 shadow-inner focus:shadow-md transition-all duration-300 appearance-none"
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
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            ตำบล <span className="text-red-500 ml-1">*</span>
                          </label>
                          <div className="relative">
                            <select
                              name="parish"
                              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 shadow-inner focus:shadow-md transition-all duration-300 appearance-none"
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
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          รหัสไปรษณีย์
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="postal_no"
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-100 shadow-inner transition-all duration-300"
                            value={formData.postal_no}
                            placeholder="รหัสไปรษณีย์"
                            readOnly
                            disabled
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <form onSubmit={e => {
                e.preventDefault();
                setShowPin(true);
              }} className="flex justify-end gap-4 mt-6">
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
                  ) : 'บันทึกการเปลี่ยนแปลง'}
                </button>
              </form>

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
      </div>
    </div>
  );
}