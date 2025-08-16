import { GiOfficeChair } from "react-icons/gi";
// EditUserDialog.jsx
import axios from 'axios';
import { useEffect, useRef, useState } from "react";
import {
  FaBook,
  FaBuilding,
  FaEnvelope,
  FaIdCard,
  FaLock,
  FaMapMarkerAlt,
  FaPhone,
  FaUser
} from "react-icons/fa";
import { MdClose, MdCloudUpload } from "react-icons/md";
import PinDialog from "../../../components/dialog/PinDialog";

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

  useEffect(() => {
    // Get current user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    const fetchData = async () => {
      try {
        const [positionsResponse, branchesResponse, rolesResponse, provincesResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/users/positions'),
          axios.get('http://localhost:5000/api/users/branches'),
          axios.get('http://localhost:5000/api/users/roles'),
          fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province_with_amphure_tambon.json').then(res => res.json())
        ]);

        if (!positionsResponse.data) throw new Error('Failed to fetch positions');
        if (!branchesResponse.data) throw new Error('Failed to fetch branches');
        if (!rolesResponse.data) throw new Error('Failed to fetch roles');

        setPositions(positionsResponse.data);
        setBranches(branchesResponse.data);
        setRoles(rolesResponse.data);
        setProvinces(provincesResponse);

        // If we have user data, set the address data
        if (userData) {
          console.log('Setting initial address data for user:', {
            province: userData.province,
            district: userData.district,
            parish: userData.parish,
            postal_no: userData.postal_no
          });

          // Find the matching province
          const province = provincesResponse.find(p => p.name_th === userData.province);
          if (province) {
            console.log('Found matching province:', province.name_th);
            setAmphures(province.amphure);

            // Find the matching amphure (district)
            const amphure = province.amphure.find(a => a.name_th === userData.district);
            if (amphure) {
              console.log('Found matching district:', amphure.name_th);
              setTambons(amphure.tambon);

              // Find the matching tambon (parish)
              const tambon = amphure.tambon.find(t => t.name_th === userData.parish);
              if (tambon) {
                console.log('Found matching parish:', tambon.name_th);
                setSelected({
                  province_id: province.id,
                  amphure_id: amphure.id,
                  tambon_id: tambon.id
                });
              } else {
                console.log('No matching parish found for:', userData.parish);
              }
            } else {
              console.log('No matching district found for:', userData.district);
            }
          } else {
            console.log('No matching province found for:', userData.province);
          }
        }

        console.log('Fetched data:', {
          positions: positionsResponse.data,
          branches: branchesResponse.data,
          roles: rolesResponse.data,
          provinces: provincesResponse,
          userData: userData
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open, userData]);

  const getAvatarUrl = (path) => {
    if (!path) return 'logo_it.png';

    // ถ้าเป็น Cloudinary URL ใช้เลย
    if (path.includes('cloudinary.com')) {
      return path;
    }

    // ถ้าเป็น local path ให้แปลงเป็น filename
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

  useEffect(() => {
    if (userData) {
      const avatarPath = getAvatarUrl(userData.avatar);
      console.log('Setting form data with user data:', userData);

      // Find province, amphure, and tambon IDs based on names
      const province = provinces.find(p => p.name_th === userData.province);
      if (province) {
        setAmphures(province.amphure);
        const amphure = province.amphure.find(a => a.name_th === userData.district);
        if (amphure) {
          setTambons(amphure.tambon);
          const tambon = amphure.tambon.find(t => t.name_th === userData.parish);
          if (tambon) {
            setSelected({
              province_id: province.id,
              amphure_id: amphure.id,
              tambon_id: tambon.id
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
      // ตั้งค่า preview image - ถ้าเป็น Cloudinary URL ใช้เลย ถ้าเป็น local path ให้สร้าง URL
      if (avatarPath && avatarPath.includes('cloudinary.com')) {
        setPreviewImage(avatarPath);
      } else {
        setPreviewImage(avatarPath ? `http://localhost:5000/uploads/user/${avatarPath}` : "/profile.png");
      }
    }
  }, [userData, provinces]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('Handling change for:', name, 'with value:', value);

    if (name === 'position_name') {
      const selectedPosition = positions.find(p => p.position_name === value);
      console.log('Selected position:', selectedPosition);
      setFormData(prev => ({
        ...prev,
        position_name: value,
        position_id: selectedPosition ? selectedPosition.position_id : prev.position_id
      }));
    } else if (name === 'branch_name') {
      const selectedBranch = branches.find(b => b.branch_name === value);
      console.log('Selected branch:', selectedBranch);
      setFormData(prev => ({
        ...prev,
        branch_name: value,
        branch_id: selectedBranch ? selectedBranch.branch_id : prev.branch_id
      }));
    } else if (name === 'role_name') {
      const selectedRole = roles.find(r => r.role_name === value);
      console.log('Selected role:', selectedRole);
      setFormData(prev => ({
        ...prev,
        role_name: value,
        role_id: selectedRole ? selectedRole.role_id : prev.role_id
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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

      // แสดง preview รูปภาพทันที แต่ยังไม่อัพโหลด
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
        setFormData(prev => ({ ...prev, pic: file })); // เก็บไฟล์ไว้ใน formData
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
    console.log('handlePinSubmit called with pin:', pin);

    if (!currentUser) {
      console.log('No currentUser found');
      setPinError("ไม่พบข้อมูลผู้ใช้ปัจจุบัน");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'exists' : 'missing');
      console.log('Sending request to verify password...');

      const response = await axios.post('http://localhost:5000/api/users/verify-password',
        { password: pin },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Response:', response.data);

      if (response.data.success) {
        console.log('Password verified successfully, calling handleSubmit');
        setShowPin(false);
        setPin("");
        setPinError("");
        handleSubmit(); // call the real submit
      } else {
        console.log('Password verification failed');
        setPinError("รหัสผ่านไม่ถูกต้อง");
      }
    } catch (error) {
      console.error('Error in handlePinSubmit:', error);
      console.error('Error response:', error.response?.data);
      setPinError(error.response?.data?.message || "รหัสผ่านไม่ถูกต้อง");
    }
  };

  // ปรับ handleSubmit ให้ไม่รับ event ถ้ามาจาก PIN
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    console.log('handleSubmit called');
    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('ไม่พบ token กรุณา login ใหม่');
      setIsLoading(false);
      return;
    }

    try {
      // ตรวจสอบรูปภาพ - ถ้าเป็น Cloudinary URL ใช้เลย ถ้าเป็น File ให้อัปโหลดก่อน
      let avatarUrl = formData.pic;
      console.log('formData.pic type:', typeof formData.pic);
      console.log('formData.pic:', formData.pic);

      if (formData.pic && typeof formData.pic === 'string' && formData.pic.includes('cloudinary.com')) {
        // ถ้าเป็น Cloudinary URL ใช้เลย
        console.log('Using existing Cloudinary URL');
        avatarUrl = formData.pic;
      } else if (formData.pic instanceof File) {
        // ถ้าเป็น File ให้อัปโหลดก่อน
        console.log('Uploading file to Cloudinary...');
        const formDataImage = new FormData();
        formDataImage.append('user_code', formData.user_code);
        formDataImage.append('avatar', formData.pic);
        try {
          const token = localStorage.getItem('token');
          const uploadResponse = await axios.post('http://localhost:5000/api/users/upload-image', formDataImage, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            }
          });
          if (uploadResponse.data && uploadResponse.data.url) {
            console.log('File uploaded successfully:', uploadResponse.data.url);
            avatarUrl = uploadResponse.data.url;
          }
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          setError(uploadError.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
          setIsLoading(false);
          return;
        }
      } else {
        console.log('Using existing avatar URL or default');
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
      if (formData.password) {
        updateData.password = formData.password;
      }

      console.log('Update data:', updateData);

      const validationErrors = validateForm(updateData);
      console.log('Validation errors:', validationErrors);

      if (Object.keys(validationErrors).length > 0) {
        console.log('Validation failed');
        setError('กรุณากรอกข้อมูลให้ครบถ้วน');
        setIsLoading(false);
        return;
      }
      console.log('Sending PATCH request to update user...');
      const response = await axios.patch(
        `http://localhost:5000/api/users/id/${formData.user_id}`,
        updateData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('PATCH response:', response.data);

      if (response.data?.user) {
        console.log('Update successful, calling onSave and onClose');
        onSave(response.data.user);
        onClose();
      } else {
        console.log('No user data in response');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      console.error('Error response:', error.response?.data);
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
              <h2 className="text-xl font-bold text-blue-800 text-center mb-2">แก้ข้อมูลผู้ใช้งาน</h2>
              <h3 className="text-lg font-bold text-blue-800 text-center mb-2">รูปโปรไฟล์</h3>
              <p className="text-xs text-gray-500 text-center">อัพโหลดรูปภาพสำหรับใช้เป็นรูปโปรไฟล์</p>
            </div>
            <div className="w-36 h-36 rounded-full bg-white shadow-lg flex items-center justify-center relative group overflow-hidden border-4 border-white hover:border-blue-200 transition-all duration-300">
              <img
                src={previewImage && previewImage.includes('cloudinary.com') ? previewImage : previewImage || "/profile.png"}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
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
                แก้ไขข้อมูลผู้ใช้งาน
              </h2>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                setShowPin(true);
              }}
              className="space-y-8"
            >
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
                        รหัสนิสิต <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="user_code"
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-100"
                        value={formData.user_code}
                        onChange={handleChange}
                        placeholder="เช่น 64010123"
                        required
                        readOnly
                        disabled
                      />
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
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-100"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="ระบุชื่อผู้ใช้งาน"
                        required
                        readOnly
                        disabled
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <FaLock className="w-4 h-4 mr-2 text-blue-500" />
                        รหัสผ่าน
                      </label>
                      <input
                        type="password"
                        name="password"
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm hover:border-blue-300 bg-white"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="รหัสผ่าน"
                      />
                      <span className="text-xs text-gray-400 mt-1 block">(เว้นว่างหากไม่ต้องการเปลี่ยนรหัสผ่าน)</span>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <FaEnvelope className="w-4 h-4 mr-2 text-blue-500" />
                        อีเมล <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm hover:border-blue-300 bg-white"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="example@domain.com"
                        required
                      />
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
                          className="w-full pl-4 px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm hover:border-blue-300 bg-white"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="0812345678"
                          required
                        />
                      </div>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่ปัจจุบัน <span className="text-red-500 ml-1">*</span></label>
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
                          onChange={(e) => { handleAddressChange(e, 'province'); }}
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
                          onChange={(e) => { handleAddressChange(e, 'amphure'); }}
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
                          onChange={(e) => { handleAddressChange(e, 'tambon'); }}
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
                  ) : 'บันทึกการเปลี่ยนแปลง'}
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
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </div>
  );
}
