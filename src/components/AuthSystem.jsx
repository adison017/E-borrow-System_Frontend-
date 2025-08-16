import axios from 'axios';
import { useEffect, useState } from 'react';
import { FaBuilding, FaChartBar, FaCog, FaEnvelope, FaEye, FaEyeSlash, FaGraduationCap, FaIdCard, FaLaptop, FaLock, FaMapMarkerAlt, FaPhone, FaUser, FaUserAlt } from 'react-icons/fa';
import { GiHandTruck } from "react-icons/gi";
import { useNavigate } from 'react-router-dom';
import {
  LoginErrorDialog,
  LoginSuccessDialog,
  PasswordMismatchDialog,
  RegisterErrorDialog,
  RegisterSuccessDialog
} from './dialog/AlertDialog';
import Notification from './Notification';
import OtpDialog from './OtpDialog';
import { API_BASE } from '../utils/api.js';

const defaultRoutes = {
  admin: '/DashboardAd',
  user: '/DashboardUs',
  executive: '/DashboardEx'
};

// เพิ่ม helper สำหรับแปล error message
function getRegisterErrorMessage(error) {
  let errorMsg = error.response?.data?.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
  if (errorMsg.includes('Duplicate entry') && errorMsg.includes('users.email')) {
    return 'อีเมลนี้ถูกใช้ไปแล้ว กรุณาใช้อีเมลอื่น';
  }
  if (errorMsg.includes('Duplicate entry') && errorMsg.includes('users.user_code')) {
    return 'รหัสนิสิต/บุคลากรนี้ถูกใช้ไปแล้ว กรุณาตรวจสอบ';
  }
  if (errorMsg.includes('Duplicate entry') && errorMsg.includes('users.username')) {
    return 'ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว กรุณาเลือกชื่อใหม่';
  }
  return errorMsg;
}

import { useMemo } from 'react';

const AuthSystem = (props) => {
  const [activeTab, setActiveTab] = useState('login');
  // Forgot password states
  const [forgotStep, setForgotStep] = useState(0); // 0: email, 1: otp, 2: new password
  const [forgotData, setForgotData] = useState({ email: '', otp: '', password: '', confirmPassword: '' });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableSubdistricts, setAvailableSubdistricts] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [amphures, setAmphures] = useState([]);
  const [tambons, setTambons] = useState([]);
  const [selected, setSelected] = useState({ province_id: undefined, amphure_id: undefined, tambon_id: undefined });
  const [notification, setNotification] = useState({ show: false, type: 'info', title: '', message: '', onClose: null });
  const [showRegisterLeaveDialog, setShowRegisterLeaveDialog] = useState(false);
  // แจ้งเตือนออกจาก forgot password (step 2)
  const [showForgotLeaveDialog, setShowForgotLeaveDialog] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);
  // ฟังก์ชันเปลี่ยน tab พร้อมเช็ค forgotStep === 2
  const handleTabChange = (tab) => {
    if (activeTab === 'forgot' && forgotStep === 2) {
      setPendingTab(tab);
      setShowForgotLeaveDialog(true);
    } else if (tab === 'login' && activeTab === 'register' && Object.values(registerData).some(v => v)) {
      setShowRegisterLeaveDialog(true);
    } else {
      setActiveTab(tab);
      // ถ้าออกจากหน้า forgot ให้ล้างอีเมลและ error
      if (activeTab === 'forgot' && tab !== 'forgot') {
        setForgotData(d => ({ ...d, email: '', otp: '', password: '', confirmPassword: '' }));
        setForgotError('');
        setForgotSuccess('');
        setForgotStep(0);
      }
      // รีเซ็ต login attempts เมื่อเปลี่ยน tab
      if (tab !== 'login') {
        setLoginAttempts({
          remaining: 5,
          blockedUntil: null,
          lastAttempt: null
        });
      }
    }
  };
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [positions, setPositions] = useState([]);
  const [branches, setBranches] = useState([]);
  // Real-time validation state
  const [validation, setValidation] = useState({
    idNumber: null,
    username: null,
    email: null
  });
  const [otpDialog, setOtpDialog] = useState({ show: false, email: '', phone: '', error: '' });
  const [otpVerified, setOtpVerified] = useState(false);

  // Login form state
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  // เพิ่ม state สำหรับ login attempts
  const [loginAttempts, setLoginAttempts] = useState({
    remaining: 5,
    blockedUntil: null,
    lastAttempt: null
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    idNumber: '',
    fullName: '',
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    currentAddress: '',
    provinceId: '',
    amphureId: '',
    tambonId: '',
    postalCode: ''
  });
  // Multi-step register
  const [registerStep, setRegisterStep] = useState(0); // 0: basic, 1: account, 2: contact, 3: address

  // ฟังก์ชันตรวจสอบข้อมูลแต่ละขั้น
  const validateRegisterStep = (step) => {
    if (step === 0) {
      // ข้อมูลพื้นฐาน
      if (!registerData.idNumber || !registerData.fullName || !registerData.position || !registerData.department) {
        setNotification({ show: true, type: 'warning', title: 'ข้อมูลไม่ครบ', message: 'กรุณากรอกข้อมูลพื้นฐานให้ครบถ้วน', onClose: () => setNotification(n => ({ ...n, show: false })) });
        return false;
      }
      if (validation.idNumber === 'duplicate') {
        setNotification({ show: true, type: 'warning', title: 'รหัสนิสิต/บุคลากรซ้ำ', message: 'รหัสนิสิต/บุคลากรนี้ถูกใช้ไปแล้ว', onClose: () => setNotification(n => ({ ...n, show: false })) });
        return false;
      }
    } else if (step === 1) {
      // ข้อมูลบัญชี
      if (!registerData.username || !registerData.password || !registerData.confirmPassword) {
        setNotification({ show: true, type: 'warning', title: 'ข้อมูลไม่ครบ', message: 'กรุณากรอกข้อมูลบัญชีให้ครบถ้วน', onClose: () => setNotification(n => ({ ...n, show: false })) });
        return false;
      }
      if (!passwordMatch) {
        setNotification({ show: true, type: 'warning', title: 'รหัสผ่านไม่ตรงกัน', message: 'กรุณายืนยันรหัสผ่านให้ถูกต้อง', onClose: () => setNotification(n => ({ ...n, show: false })) });
        return false;
      }
      if (validation.username === 'duplicate') {
        setNotification({ show: true, type: 'warning', title: 'ชื่อผู้ใช้งานซ้ำ', message: 'ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว', onClose: () => setNotification(n => ({ ...n, show: false })) });
        return false;
      }
    } else if (step === 2) {
      // ข้อมูลติดต่อ
      if (!registerData.email || !registerData.phone) {
        setNotification({ show: true, type: 'warning', title: 'ข้อมูลไม่ครบ', message: 'กรุณากรอกข้อมูลติดต่อให้ครบถ้วน', onClose: () => setNotification(n => ({ ...n, show: false })) });
        return false;
      }
      if (validation.email === 'duplicate') {
        setNotification({ show: true, type: 'warning', title: 'อีเมลซ้ำ', message: 'อีเมลนี้ถูกใช้ไปแล้ว', onClose: () => setNotification(n => ({ ...n, show: false })) });
        return false;
      }
    } else if (step === 3) {
      // ข้อมูลที่อยู่
      if (!registerData.currentAddress || !registerData.provinceId || !registerData.amphureId || !registerData.tambonId || !registerData.postalCode) {
        setNotification({ show: true, type: 'warning', title: 'ข้อมูลไม่ครบ', message: 'กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วน', onClose: () => setNotification(n => ({ ...n, show: false })) });
        return false;
      }
    }
    return true;
  };

  const navigate = useNavigate();

  useEffect(() => {
    setIsMounted(true);
    // โหลดอำเภอเริ่มต้นตามจังหวัดเริ่มต้น
    const initialProvince = provinces.find(p => p.name === registerData.province);
    if (initialProvince) {
      const provinceDistricts = amphures.find(a => a.id === Number(registerData.amphureId))?.tambon || [];
      setAvailableDistricts(provinceDistricts);

      // โหลดตำบลเริ่มต้นตามอำเภอเริ่มต้น
      const initialDistrict = provinceDistricts.find(d => d.name === registerData.district);
      if (initialDistrict) {
        const districtSubdistricts = tambons.find(t => t.id === Number(registerData.tambonId))?.zip_code || '';
        setAvailableSubdistricts(districtSubdistricts);
      }
    }
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    // fetch จังหวัด/อำเภอ/ตำบล จาก github
    fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province_with_amphure_tambon.json')
      .then(res => res.json())
      .then(data => {
        setProvinces(data);
        // โหลดอำเภอเริ่มต้นตามจังหวัดเริ่มต้น
        const initialProvince = data.find(p => p.name === registerData.province);
        if (initialProvince) {
          setAmphures(initialProvince.amphure);
          const initialDistrict = initialProvince.amphure.find(d => d.name === registerData.district);
          if (initialDistrict) {
            setTambons(initialDistrict.tambon);
          }
        }
      });
    // fetch positions
    axios.get('http://localhost:5000/api/users/positions')
      .then(res => setPositions(res.data))
      .catch(() => setPositions([]));
    // fetch branches
    axios.get('http://localhost:5000/api/users/branches')
      .then(res => setBranches(res.data))
      .catch(() => setBranches([]));
  }, []);

  // Inline validation: ตรวจสอบรหัสผ่านตรงกันทันที
  useEffect(() => {
    if (registerData.password && registerData.confirmPassword) {
      setPasswordMatch(registerData.password === registerData.confirmPassword);
    } else {
      setPasswordMatch(true);
    }
  }, [registerData.password, registerData.confirmPassword]);

  useEffect(() => {
    // ตรวจสอบ token ทุกครั้งที่ mount
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetch('http://localhost:5000/api/users/verify-token', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        console.log('verify-token status:', res.status);
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .catch((err) => {
        console.log('verify-token error:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      });
  }, [navigate]);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterChange = async (e) => {
    const { name, value } = e.target;
    if (name === 'idNumber') {
      // ถ้า email ยังว่างหรือเป็น [รหัสนิสิตเดิม]@msu.ac.th ให้ auto fill ใหม่
      setRegisterData(prev => {
        let newEmail = prev.email;
        // เฉพาะถ้า email ยังว่าง หรือเป็น [รหัสนิสิตเดิม]@msu.ac.th
        if (!prev.email || prev.email === `${prev.idNumber}@msu.ac.th`) {
          newEmail = value ? `${value}@msu.ac.th` : '';
        }
        return { ...prev, idNumber: value, username: value, email: newEmail };
      });
      // ตรวจสอบรหัสนิสิตซ้ำ
      if (value) {
        try {
          const res = await axios.get(`http://localhost:5000/api/users/username/${value}`);
          setValidation(v => ({ ...v, idNumber: res.data ? 'duplicate' : 'ok' }));
        } catch {
          setValidation(v => ({ ...v, idNumber: 'ok' }));
        }
      } else {
        setValidation(v => ({ ...v, idNumber: null }));
      }
      // username จะ sync กับ idNumber
      setValidation(v => ({ ...v, username: null }));
    } else if (name === 'username') {
      setRegisterData(prev => ({ ...prev, username: value }));
      if (value) {
        try {
          const res = await axios.get(`http://localhost:5000/api/users/username/${value}`);
          setValidation(v => ({ ...v, username: res.data ? 'duplicate' : 'ok' }));
        } catch {
          setValidation(v => ({ ...v, username: 'ok' }));
        }
      } else {
        setValidation(v => ({ ...v, username: null }));
      }
    } else if (name === 'email') {
      setRegisterData(prev => ({ ...prev, email: value }));
      if (value && value.includes('@')) {
        try {
          const res = await axios.get(`http://localhost:5000/api/users/username/${value}`);
          setValidation(v => ({ ...v, email: res.data ? 'duplicate' : 'ok' }));
        } catch {
          setValidation(v => ({ ...v, email: 'ok' }));
        }
      } else {
        setValidation(v => ({ ...v, email: null }));
      }
    } else {
      setRegisterData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProvinceChange = (e) => {
    const provinceId = Number(e.target.value);
    setSelected({ province_id: provinceId, amphure_id: undefined, tambon_id: undefined });
    const provinceObj = provinces.find(p => p.id === provinceId);
    setRegisterData(prev => ({ ...prev, provinceId, amphureId: '', tambonId: '', postalCode: '' }));
    setAmphures(provinceObj ? provinceObj.amphure : []);
    setTambons([]);
  };
  const handleDistrictChange = (e) => {
    const amphureId = Number(e.target.value);
    setSelected(prev => ({ ...prev, amphure_id: amphureId, tambon_id: undefined }));
    const amphureObj = amphures.find(a => a.id === amphureId);
    setRegisterData(prev => ({ ...prev, amphureId, tambonId: '', postalCode: '' }));
    setTambons(amphureObj ? amphureObj.tambon : []);
  };
  const handleSubdistrictChange = (e) => {
    const tambonId = Number(e.target.value);
    setSelected(prev => ({ ...prev, tambon_id: tambonId }));
    const tambonObj = tambons.find(t => t.id === tambonId);
    setRegisterData(prev => ({ ...prev, tambonId, postalCode: tambonObj ? tambonObj.zip_code : '' }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    // ตรวจสอบว่าถูกบล็อกหรือไม่
    if (loginAttempts.blockedUntil && Date.now() < loginAttempts.blockedUntil) {
      const remainingMinutes = Math.ceil((loginAttempts.blockedUntil - Date.now()) / 1000 / 60);
      setNotification({
        show: true,
        type: 'error',
        title: 'บัญชีถูกบล็อกชั่วคราว',
        message: `บัญชีถูกบล็อกชั่วคราว กรุณาลองใหม่ใน ${remainingMinutes} นาที`,
        onClose: () => setNotification(n => ({ ...n, show: false }))
      });
      return;
    }

    // ตรวจสอบจำนวนครั้งที่เหลือ
    if (loginAttempts.remaining <= 0) {
      setNotification({
        show: true,
        type: 'error',
        title: 'เกินจำนวนครั้งที่กำหนด',
        message: 'คุณได้ลองเข้าสู่ระบบครบ 5 ครั้งแล้ว กรุณารอ 15 นาทีแล้วลองใหม่',
        onClose: () => setNotification(n => ({ ...n, show: false }))
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/users/login`, {
        username: loginData.username,
        password: loginData.password
      });
      setIsLoading(false);
      
      if (response.data && response.data.token) {
        // Debug log เพื่อตรวจสอบข้อมูลที่ได้รับจาก backend
        console.log('=== Debug: Login response from backend ===');
        console.log('Full response data:', response.data);
        console.log('User data from response:', response.data.user);
        console.log('branch_name from response:', response.data.user.branch_name);
        console.log('position_name from response:', response.data.user.position_name);

        // รีเซ็ต login attempts เมื่อ login สำเร็จ
        setLoginAttempts({
          remaining: 5,
          blockedUntil: null,
          lastAttempt: null
        });

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setNotification({
          show: true,
          type: 'success',
          title: 'เข้าสู่ระบบสำเร็จ',
          message: 'ยินดีต้อนรับ ' + (response.data.user.Fullname || response.data.user.username),
          onClose: () => {
            setNotification(n => ({ ...n, show: false }));
            if (props.onLoginSuccess) {
              props.onLoginSuccess(response.data.user.role);
            }
          }
        });
      } else {
        handleLoginError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (error) {
      setIsLoading(false);
      
      // จัดการ error messages จาก backend
      let errorMessage = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      
      if (error.response?.data?.message) {
        const backendMessage = error.response.data.message;
        
        // ตรวจสอบข้อความจาก backend
        if (backendMessage.includes('บัญชีถูกบล็อกชั่วคราว')) {
          // แยกเวลาที่เหลือจากข้อความ
          const timeMatch = backendMessage.match(/(\d+)/);
          const remainingMinutes = timeMatch ? parseInt(timeMatch[1]) : 15;
          
          setLoginAttempts({
            remaining: 0,
            blockedUntil: Date.now() + (remainingMinutes * 60 * 1000),
            lastAttempt: Date.now()
          });
          
          errorMessage = `บัญชีถูกบล็อกชั่วคราว กรุณาลองใหม่ใน ${remainingMinutes} นาที`;
        } else {
          errorMessage = backendMessage;
        }
      }
      
      handleLoginError(errorMessage);
    }
  };

  // ฟังก์ชันจัดการ login error
  const handleLoginError = (message) => {
    const newRemaining = Math.max(0, loginAttempts.remaining - 1);
    const newBlockedUntil = newRemaining === 0 ? Date.now() + (15 * 60 * 1000) : null;
    
    setLoginAttempts({
      remaining: newRemaining,
      blockedUntil: newBlockedUntil,
      lastAttempt: Date.now()
    });

      setNotification({
        show: true,
        type: 'error',
        title: 'เข้าสู่ระบบไม่สำเร็จ',
      message: message,
        onClose: () => setNotification(n => ({ ...n, show: false }))
      });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      setNotification({ show: true, type: 'warning', title: 'รหัสผ่านไม่ตรงกัน', message: 'กรุณายืนยันรหัสผ่านให้ถูกต้อง', onClose: () => setNotification(n => ({ ...n, show: false })) });
      return;
    }
    // ตรวจสอบว่าต้องใช้อีเมล @msu.ac.th เท่านั้นสำหรับ OTP
    const isMsuEmail = registerData.email && /@msu\.ac\.th$/.test(registerData.email);
    if (!isMsuEmail) {
      setNotification({ show: true, type: 'warning', title: 'ข้อมูลไม่ครบ', message: 'กรุณากรอกอีเมล @msu.ac.th เพื่อรับรหัส OTP', onClose: () => setNotification(n => ({ ...n, show: false })) });
      return;
    }
    // เปิด OTP Dialog เฉพาะ email
    setOtpDialog({ show: true, email: registerData.email, error: '' });
  };

  // OTP Verification Handler (สมัครสมาชิก)
  const handleOtpVerify = async (otp) => {
    setIsLoading(true);
    try {
      const contact = otpDialog.email;
      const res = await axios.post('http://localhost:5000/api/users/verify-otp-register', { contact, otp });
      if (res.data && res.data.success) {
        setOtpVerified(true);
        setOtpDialog({ show: false, email: '', error: '' });
        // ดำเนินการสมัครสมาชิกจริง
        const provinceObj = provinces.find(p => p.id === Number(registerData.provinceId));
        const amphureObj = amphures.find(a => a.id === Number(registerData.amphureId));
        const tambonObj = tambons.find(t => t.id === Number(registerData.tambonId));
        const payload = {
          user_code: registerData.idNumber,
          username: registerData.username,
          password: registerData.password,
          email: registerData.email,
          phone: registerData.phone,
          Fullname: registerData.fullName,
          position_id: registerData.position,
          branch_id: registerData.department,
          role_id: 3,
          street: registerData.currentAddress,
          province: provinceObj ? provinceObj.name_th : '',
          district: amphureObj ? amphureObj.name_th : '',
          parish: tambonObj ? tambonObj.name_th : '',
          postal_no: registerData.postalCode
        };
        try {
          await axios.post('http://localhost:5000/api/users', payload);
          setIsLoading(false);
          setRegisterData({
            idNumber: '',
            fullName: '',
            username: '',
            password: '',
            confirmPassword: '',
            email: '',
            phone: '',
            position: '',
            department: '',
            currentAddress: '',
            provinceId: '',
            amphureId: '',
            tambonId: '',
            postalCode: ''
          });
          setRegisterStep(0);
          setActiveTab('login');
          setNotification({
            show: true,
            type: 'success',
            title: 'สมัครสมาชิกสำเร็จ',
            message: 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบด้วยบัญชีที่สมัคร',
            onClose: () => setNotification(n => ({ ...n, show: false }))
          });
        } catch (error) {
          setIsLoading(false);
          setNotification({
            show: true,
            type: 'error',
            title: 'สมัครสมาชิกไม่สำเร็จ',
            message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก',
            onClose: () => setNotification(n => ({ ...n, show: false }))
          });
        }
      } else {
        setOtpDialog(d => ({ ...d, error: 'OTP ไม่ถูกต้อง' }));
      }
    } catch (error) {
      setOtpDialog(d => ({ ...d, error: 'OTP ไม่ถูกต้องหรือหมดอายุ' }));
      setIsLoading(false);
    }
  };

  // OTP Verification Handler (ลืมรหัสผ่าน)
  const handleForgotOtpVerify = async (otp) => {
    setForgotLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/users/verify-otp', { email: forgotData.email, otp });
      if (res.data && res.data.success) {
        setForgotData(prev => ({ ...prev, otp })); // เก็บ otp ไว้ใน state
        setForgotStep(2); // ไปหน้ากรอกรหัสผ่านใหม่
        setForgotError('');
      } else {
        setForgotError('OTP ไม่ถูกต้อง');
      }
    } catch (error) {
      setForgotError('OTP ไม่ถูกต้องหรือหมดอายุ');
    }
    setForgotLoading(false);
  };

  // Handler สำหรับ reset password (ยิงเฉพาะ /reset-password)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/users/reset-password', {
        email: forgotData.email,
        otp: forgotData.otp,
        password: forgotData.password
      });
      if (res.data && res.data.success) {
        setForgotStep(0);
        setForgotSuccess('เปลี่ยนรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่');
        setActiveTab('login');
        setForgotData({ email: '', otp: '', password: '', confirmPassword: '' });
      } else {
        setForgotError(res.data?.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      setForgotError(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    }
    setForgotLoading(false);
  };

  // Memoize options to reduce re-render
  const positionOptions = useMemo(() => positions.map(pos => (
    <option key={pos.position_id} value={pos.position_id}>{pos.position_name}</option>
  )), [positions]);
  const branchOptions = useMemo(() => branches.map(branch => (
    <option key={branch.branch_id} value={branch.branch_id}>{branch.branch_name}</option>
  )), [branches]);
  const provinceOptions = useMemo(() => provinces.map(province => (
    <option key={province.id} value={province.id}>{province.name_th}</option>
  )), [provinces]);
  const amphureOptions = useMemo(() => amphures.map(amphure => (
    <option key={amphure.id} value={amphure.id}>{amphure.name_th}</option>
  )), [amphures]);
  const tambonOptions = useMemo(() => tambons.map(tambon => (
    <option key={tambon.id} value={tambon.id}>{tambon.name_th}</option>
  )), [tambons]);

  return (
    <div data-theme="light" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      {/* Background blobs: remove animation for performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-blue-600/40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute top-20 right-60 w-80 h-80 bg-blue-600/40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute -bottom-60 -right-40 w-80 h-80 bg-blue-600/40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      </div>

      {/* Floating Equipment Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-17 text-blue-300 opacity-30 animate-float-slow">
          <FaLaptop className="text-5xl" />
        </div>
        <div className="absolute top-40 right-10 text-indigo-300 opacity-30 animate-float-slow animation-delay-1000">
          <FaCog className="text-5xl" />
        </div>
        <div className="absolute bottom-40 left-15 text-sky-300 opacity-30 animate-float-slow animation-delay-2000">
          <FaChartBar className="text-5xl" />
        </div>
        <div className="absolute bottom-40 right-11 text-sky-300 opacity-30 animate-float-slow animation-delay-2000">
          <GiHandTruck className="text-6xl" />
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-8xl mx-auto">
        <div className="bg-black/20 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-blue-100 transform transition-all duration-700 hover:shadow-blue-200/50 hover:shadow-3xl">
          <div className="flex flex-col lg:flex-row min-h-[600px]">

            {/* Left Panel - Branding */}
            <div className="w-full lg:w-2/5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 lg:p-12 flex flex-col justify-center items-center relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-blue-800 transform rotate-12 scale-150"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-indigo-800 transform -rotate-12 scale-150"></div>
              </div>

              {/* Content */}
              <div className="relative z-10 text-center animate-fade-in-up">
                {/* Logo */}
                <div className="mb-8 transform hover:scale-105 transition-transform duration-500">
                  <div className="w-70 h-50 mx-auto bg-white/50 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-lg">
                    <img
                      src="/logo_it.png"
                      alt="IT Equipment Logo"
                      className="w-50 h-50 object-contain filter drop-shadow-lg"
                    />
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl lg:text-4xl font-extrabold mb-4 leading-tight">
                  ระบบยืม-คืนครุภัณฑ์
                </h1>
                <p className=" text-lg mb-6 font-light">
                  คณะวิทยาการสารสนเทศ
                </p>

                {/* Decorative Elements */}
                <div className="mt-2 flex justify-center">
                  <div className="w-full h-2 bg-white rounded-full animate-pulse animation-delay-300"></div>
                </div>
              </div>
            </div>

            {/* Right Panel - Forms */}
            <div className="w-full lg:w-3/5 p-4 lg:p-12">
              {/* Tab Navigation */}
              <div className="flex bg-blue-50 rounded-full px-4 py-2 mb-8 shadow-inner gap-x-3 overflow-x-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <button
                  onClick={() => handleTabChange('login')}
                  className={`flex-1 min-w-[90px] py-3 px-3 md:py-4 md:px-6 rounded-full font-semibold text-xs md:text-sm transition-all duration-300 transform bg-blue-200 border-blue-200 ${
                    activeTab === 'login'
                      ? 'bg-white text-blue-700 shadow-lg scale-105 border-2 border-blue-200'
                      : 'text-blue-600 hover:bg-blue-100 hover:scale-102'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1 md:space-x-2">
                    <FaUser className={`text-base md:text-lg ${activeTab === 'login' ? 'animate-bounce' : ''}`} />
                    <span className="truncate">เข้าสู่ระบบ</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('register')}
                  className={`flex-1 min-w-[90px] py-3 px-3 md:py-4 md:px-6 rounded-full font-semibold text-xs md:text-sm transition-all duration-300 transform  bg-blue-200 border-blue-200 ${
                    activeTab === 'register'
                      ? 'bg-white text-blue-700 shadow-lg scale-105 border-2 border-blue-200'
                      : 'text-blue-600 hover:bg-blue-100 hover:scale-102'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1 md:space-x-2">
                    <FaUserAlt className={`text-base md:text-lg ${activeTab === 'register' ? 'animate-bounce' : ''}`} />
                    <span className="truncate">สมัครสมาชิก</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('forgot')}
                  className={`flex-1 min-w-[90px] py-3 px-3 md:py-4 md:px-6 rounded-full font-semibold text-xs md:text-sm transition-all duration-300 transform bg-blue-200 border-blue-200 ${
                    activeTab === 'forgot'
                      ? 'bg-white text-blue-700 shadow-lg scale-105 border-2 border-blue-200'
                      : 'text-blue-600 hover:bg-blue-100 hover:scale-102 '
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1 md:space-x-2">
                    <FaLock className={`text-base md:text-lg ${activeTab === 'forgot' ? 'animate-bounce' : ''}`} />
                    <span className="truncate">ลืมรหัสผ่าน</span>
                  </div>
                </button>
              {/* Custom scrollbar for horizontal scroll on small screens */}
              <style>{`
                .scrollbar-thin::-webkit-scrollbar {
                  height: 6px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                  background: #bfdbfe;
                  border-radius: 4px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                  background: #f0f9ff;
                }
              `}</style>
              {/* Notification แจ้งเตือนเมื่อจะออกจาก forgot password (step 2) */}
              <Notification
                show={showForgotLeaveDialog}
                title="แจ้งเตือน"
                message="หากคุณเปลี่ยนไปหน้าอื่นข้อมูลที่กรอกไว้จะหายทั้งหมด ต้องการดำเนินการต่อหรือไม่?"
                type="warning"
                duration={0}
                onClose={() => setShowForgotLeaveDialog(false)}
                actions={[
                  {
                    label: 'ยกเลิก',
                    onClick: () => setShowForgotLeaveDialog(false)
                  },
                  {
                    label: 'ดำเนินการต่อ',
                    onClick: () => {
                      setShowForgotLeaveDialog(false);
                      setForgotStep(0);
                      setForgotData({ email: '', otp: '', password: '', confirmPassword: '' });
                      setForgotError('');
                      setActiveTab(pendingTab);
                    }
                  }
                ]}
              />
              </div>

              {activeTab === 'forgot' && (
                <div className="animate-fade-in-left">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">ลืมรหัสผ่าน</h2>
                    <p className="text-gray-600">กรอกอีเมลที่ลงทะเบียนไว้เพื่อขอ OTP และตั้งรหัสผ่านใหม่</p>
                  </div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setForgotError('');
                      setForgotSuccess('');
                      if (forgotStep === 0) {
                        setForgotLoading(true);
                        try {
                          const res = await fetch('http://localhost:5000/api/users/request-password-otp', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: forgotData.email })
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            setNotification({
                              show: true,
                              type: 'error',
                              title: 'ไม่พบข้อมูลสมาชิก',
                              message: data.message || 'ไม่พบอีเมลนี้ในระบบ',
                              onClose: () => setNotification(n => ({ ...n, show: false }))
                            });
                            setForgotLoading(false);
                            return;
                          }
                          setForgotStep(1);
                          setForgotSuccess('ส่ง OTP ไปยังอีเมลแล้ว กรุณาตรวจสอบอีเมลของคุณ');
                        } catch (err) {
                          setNotification({
                            show: true,
                            type: 'error',
                            title: 'ไม่พบข้อมูลสมาชิก',
                            message: 'ไม่พบอีเมลนี้ในระบบ',
                            onClose: () => setNotification(n => ({ ...n, show: false }))
                          });
                        } finally {
                          setForgotLoading(false);
                        }
                      } else if (forgotStep === 2) {
                        // ตั้งรหัสผ่านใหม่
                        if (forgotData.password !== forgotData.confirmPassword) {
                          setForgotError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
                          return;
                        }
                        setForgotLoading(true);
                        try {
                          const res = await fetch('http://localhost:5000/api/users/reset-password', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: forgotData.email, otp: forgotData.otp, password: forgotData.password })
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
                          setNotification({
                            show: true,
                            type: 'success',
                            title: 'สำเร็จ',
                            message: 'เปลี่ยนรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่ของคุณ',
                            duration: 4000,
                            onClose: () => setNotification(n => ({ ...n, show: false }))
                          });
                          setTimeout(() => {
                            setActiveTab('login');
                            setForgotStep(0);
                            setForgotData({ email: '', otp: '', password: '', confirmPassword: '' });
                          }, 2000);
                        } catch (err) {
                          setForgotError(err.message);
                        } finally {
                          setForgotLoading(false);
                        }
                      }
                    }}
                    className="space-y-7"
                  >
                    {forgotStep === 0 && (
                      <div className="space-y-5 animate-slide-in-right">
                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">อีเมล</label>
                          <div className="relative">
                            <input
                              type="email"
                              name="email"
                              value={forgotData.email}
                              onChange={e => setForgotData(d => ({ ...d, email: e.target.value }))}
                              className="w-full h-12 pl-12 pr-4 bg-gray-50 border-2 border-gray-200 rounded-full focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-300 text-gray-800 group-hover:border-blue-300"
                              placeholder="กรอกอีเมลที่ลงทะเบียน"
                              required
                            />
                            <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500" />
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={forgotLoading || !forgotData.email}
                          className={`w-full h-12 bg-gradient-to-r from-blue-800 to-blue-600 text-white font-semibold rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${forgotLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-800 hover:shadow-xl hover:scale-105 active:scale-95'}`}
                        >
                          {forgotLoading ? 'กำลังส่ง OTP...' : 'ขอ OTP'}
                        </button>
                      </div>
                    )}
                    {forgotStep === 1 && (
                      <OtpDialog
                        show={true}
                        title="ยืนยัน OTP"
                        message={`กรุณากรอกรหัส OTP ที่ส่งไปยัง ${forgotData.email}`}
                        error={forgotError}
                        onSubmit={async (otp) => {
                          setForgotLoading(true);
                          setForgotError("");
                          try {
                            // ตรวจสอบ OTP
                            const res = await fetch('http://localhost:5000/api/users/verify-otp', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: forgotData.email, otp })
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.message || 'OTP ไม่ถูกต้อง');
                            setForgotData(prev => ({ ...prev, otp }));
                            setForgotStep(2);
                            setForgotSuccess('OTP ถูกต้อง กรุณาตั้งรหัสผ่านใหม่');
                          } catch (err) {
                            setForgotError(err.message);
                          } finally {
                            setForgotLoading(false);
                          }
                        }}
                        onClose={() => {
                          setForgotStep(0);
                          setForgotData(d => ({ ...d, otp: '' }));
                          setForgotError('');
                          setForgotSuccess('');
                        }}
                      />
                    )}
                    {forgotStep === 2 && (
                      <div className="space-y-5 animate-slide-in-right">
                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">รหัสผ่านใหม่</label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              name="password"
                              value={forgotData.password}
                              onChange={e => setForgotData(d => ({ ...d, password: e.target.value }))}
                              className="w-full h-12 pl-12 pr-12 bg-gray-50 border-2 border-gray-200 rounded-full focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-300 text-gray-800 group-hover:border-blue-300"
                              placeholder="กรอกรหัสผ่านใหม่"
                              required
                            />
                            <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500" />
                            <button
                              type="button"
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors duration-300"
                              onClick={() => setShowPassword(v => !v)}
                            >
                              {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                        </div>
                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">ยืนยันรหัสผ่านใหม่</label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              name="confirmPassword"
                              value={forgotData.confirmPassword}
                              onChange={e => setForgotData(d => ({ ...d, confirmPassword: e.target.value }))}
                              className={`w-full h-12 pl-12 pr-12 bg-gray-50 border-2 rounded-full focus:outline-none transition-all duration-300 text-gray-800 ${
                                forgotData.password !== forgotData.confirmPassword && forgotData.confirmPassword
                                  ? 'border-red-400 focus:border-red-500 bg-red-50'
                                  : 'border-gray-200 focus:border-blue-500 focus:bg-white group-hover:border-blue-300'
                              }`}
                              placeholder="ยืนยันรหัสผ่านใหม่"
                              required
                            />
                            <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500" />
                            <button
                              type="button"
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors duration-300"
                              onClick={() => setShowConfirmPassword(v => !v)}
                            >
                              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                          {forgotData.password !== forgotData.confirmPassword && forgotData.confirmPassword && (
                            <div className="text-red-500 text-xs mt-1 animate-shake">รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน</div>
                          )}
                        </div>

                      </div>
                    )}

                    {forgotStep > 0 && (
                      <div className="flex justify-between pt-4">
                        <button
                          type="button"
                          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-full shadow-lg hover:bg-red-700 transform hover:scale-105 transition-all duration-300 flex items-center"
                          onClick={() => {
                            setNotification({
                              show: true,
                              title: 'แจ้งเตือน',
                              message: 'หากกลับไปกรอกอีเมลใหม่ ข้อมูลที่กรอกไว้จะหาย ต้องการดำเนินการต่อหรือไม่?',
                              type: 'warning',
                              duration: 0,
                              onClose: () => setNotification(n => ({ ...n, show: false })),
                              actions: [
                                {
                                  label: 'ยกเลิก',
                                  onClick: () => setNotification(n => ({ ...n, show: false }))
                                },
                                {
                                  label: 'ดำเนินการต่อ',
                                  onClick: () => {
                                    setNotification(n => ({ ...n, show: false }));
                                    setForgotStep(0);
                                    setForgotData({ email: '', otp: '', password: '', confirmPassword: '' });
                                    setForgotError('');
                                    setForgotSuccess('');
                                  }
                                }
                              ]
                            });
                          }}
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={forgotLoading || !forgotData.password || !forgotData.confirmPassword}
                            className={`px-6 py-3 bg-gradient-to-r from-blue-800 to-blue-600 text-white font-semibold rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center ${forgotLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-800 hover:shadow-xl hover:scale-105 active:scale-95'}`}
                          >
                            {forgotLoading ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'เปลี่ยนรหัสผ่าน'}
                          </button>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* Login Form */}
              {activeTab === 'login' && (
                <div className="animate-fade-in-right">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">ยินดีต้อนรับกลับมา</h2>
                    <p className="text-gray-600">เข้าสู่ระบบเพื่อจัดการครุภัณฑ์ของคุณ</p>
                    
                    {/* แสดงจำนวนครั้งที่เหลือ */}
                    {loginAttempts.remaining < 5 && (
                      <div className={`mt-4 p-3 rounded-lg border-2 ${
                        loginAttempts.remaining <= 1 
                          ? 'bg-red-50 border-red-200 text-red-700' 
                          : loginAttempts.remaining <= 2 
                            ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                            : 'bg-blue-50 border-blue-200 text-blue-700'
                      }`}>
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="font-semibold">
                            จำนวนครั้งที่เหลือ: {loginAttempts.remaining}/5
                          </span>
                        </div>
                        {loginAttempts.remaining <= 2 && (
                          <p className="text-sm mt-1">
                            หากผิดอีก {loginAttempts.remaining} ครั้ง บัญชีจะถูกบล็อก 15 นาที
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* แสดงสถานะการบล็อก */}
                    {loginAttempts.blockedUntil && Date.now() < loginAttempts.blockedUntil && (
                      <div className="mt-4 p-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg">
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          <span className="font-semibold">
                            บัญชีถูกบล็อกชั่วคราว
                          </span>
                        </div>
                        <p className="text-sm mt-1 text-center">
                          กรุณารอ {Math.ceil((loginAttempts.blockedUntil - Date.now()) / 1000 / 60)} นาทีแล้วลองใหม่
                        </p>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-6">
                    <div className="space-y-5">
                      {/* Username Field */}
                      <div className="group">
                        <label className=" text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <FaUser className="mr-2 text-blue-600" />
                          ชื่อผู้ใช้งาน
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="username"
                            value={loginData.username}
                            onChange={handleLoginChange}
                            className="w-full h-14 pl-14 pr-4 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-inner group-hover:border-blue-300 rounded-full"
                            placeholder="กรอกชื่อผู้ใช้งาน"
                            required
                          />
                          <FaUserAlt className="absolute left-5 top-1/2 transform -translate-y-1/2 text-blue-500 text-lg group-hover:text-blue-600 transition-colors duration-300" />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 transition-all duration-300 pointer-events-none"></div>
                        </div>
                      </div>

                      {/* Password Field */}
                      <div className="group">
                        <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <FaLock className="mr-2 text-blue-600" />
                          รหัสผ่าน
                        </label>
                        <div className="relative">
                          <input
                            type={showLoginPassword ? 'text' : 'password'}
                            name="password"
                            value={loginData.password}
                            onChange={handleLoginChange}
                            className="w-full h-14 pl-14 pr-12 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-inner group-hover:border-blue-300 rounded-full"
                            placeholder="กรอกรหัสผ่าน"
                            required
                          />
                          <FaLock className="absolute left-5 top-1/2 transform -translate-y-1/2 text-blue-500 text-lg group-hover:text-blue-600 transition-colors duration-300" />
                          <button
                            type="button"
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors duration-300 p-1"
                            onClick={() => setShowLoginPassword(v => !v)}
                          >
                            {showLoginPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
                          </button>
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 transition-all duration-300 pointer-events-none"></div>
                        </div>
                      </div>

                      {/* Forgot Password Link */}
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          เพื่อความปลอดภัย ระบบจะบล็อกบัญชีหลังผิด 5 ครั้ง
                        </div>
                        <button
                          type="button"
                          className="text-sm font-medium text-black hover:text-blue-800 transition-colors duration-300 bg-transparent border-0 px-3"
                          onClick={() => setActiveTab('forgot')}
                        >
                          ลืมรหัสผ่าน?
                        </button>
                      </div>
                    </div>

                    {/* Login Button */}
                    <button
                      type="submit"
                      disabled={isLoading || (loginAttempts.blockedUntil && Date.now() < loginAttempts.blockedUntil) || loginAttempts.remaining <= 0}
                      className={`w-full h-14 font-semibold rounded-full shadow-lg transition-all duration-300 transform flex items-center justify-center relative overflow-hidden ${
                        isLoading || (loginAttempts.blockedUntil && Date.now() < loginAttempts.blockedUntil) || loginAttempts.remaining <= 0
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-70'
                          : 'bg-gradient-to-r from-blue-800 to-blue-600 text-white hover:bg-blue-800 hover:shadow-xl hover:scale-105 active:scale-95'
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform skew-x-[-45deg] -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                          กำลังเข้าสู่ระบบ...
                        </>
                      ) : (loginAttempts.blockedUntil && Date.now() < loginAttempts.blockedUntil) ? (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          บัญชีถูกบล็อก
                        </>
                      ) : loginAttempts.remaining <= 0 ? (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          เกินจำนวนครั้งที่กำหนด
                        </>
                      ) : (
                        <>
                          <FaUser className="mr-2 text-lg" />
                          เข้าสู่ระบบ
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Register Form */}
              {activeTab === 'register' && (
                <div className="animate-fade-in-left">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">สร้างบัญชีใหม่</h2>
                    <p className="text-gray-600">เข้าร่วมระบบจัดการครุภัณฑ์</p>
                  </div>

                  {/* Progress Steps */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-6 px-2 md:px-8" style={{minHeight: '70px'}}>
                      {/* Steps only, no connector/progress bar */}
                      {[
                        { step: 0, label: 'ข้อมูลพื้นฐาน', icon: FaIdCard },
                        { step: 1, label: 'บัญชี', icon: FaLock },
                        { step: 2, label: 'ติดต่อ', icon: FaEnvelope },
                        { step: 3, label: 'ที่อยู่', icon: FaMapMarkerAlt }
                      ].map(({ step, label, icon: Icon }) => (
                        <div key={step} className="flex flex-col items-center flex-1">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all duration-300 shadow-lg ${
                            registerStep === step
                              ? 'bg-blue-800 border-white text-white scale-110 animate-pulse'
                              : registerStep > step
                                ? 'bg-white border-white text-black scale-100'
                                : 'bg-gray-100 border-gray-300 text-gray-400 scale-100'
                          }`}>
                            <Icon className="text-2xl" />
                          </div>
                          <span className={`text-xs mt-2 font-semibold transition-colors duration-300 ${
                            registerStep >= step ? 'text-black' : 'text-gray-500'
                          }`}>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-7">
                    {/* Step 0: Basic Info */}
                    {registerStep === 0 && (
                      <div className="space-y-5 animate-slide-in-right">
                        <div className="flex items-center mb-6 py-4 px-6 bg-black/50 rounded-full border border-white/20 shadow-lg">
                          <FaIdCard className="text-white text-2xl mr-6" />
                          <div>
                            <h3 className="text-lg font-semibold text-white">ข้อมูลพื้นฐาน</h3>
                            <p className="text-sm text-white">กรอกข้อมูลส่วนตัวของคุณ</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {/* Student/Staff ID */}
                          <div className="group">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">รหัสนิสิต/บุคลากร</label>
                            <div className="relative">
                              <input
                                type="text"
                                name="idNumber"
                                value={registerData.idNumber}
                                onChange={handleRegisterChange}
                                className={`w-full h-12 pl-12 pr-4 bg-gray-50 border-2 rounded-full focus:outline-none transition-all duration-300 text-gray-800 ${
                                  validation.idNumber === 'duplicate'
                                    ? 'border-red-400 focus:border-red-500 bg-red-50'
                                    : 'border-gray-200 focus:border-blue-500 focus:bg-white group-hover:border-blue-300'
                                }`}
                                placeholder="เช่น 65011211033"
                                required
                              />
                              <FaIdCard className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500" />
                              {validation.idNumber === 'duplicate' && (
                                <div className="text-red-500 text-xs mt-1 animate-shake">รหัสนิสิต/บุคลากรนี้ถูกใช้ไปแล้ว</div>
                              )}
                            </div>
                          </div>

                          {/* Full Name */}
                          <div className="group">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อ-นามสกุล</label>
                            <div className="relative">
                              <input
                                type="text"
                                name="fullName"
                                value={registerData.fullName}
                                onChange={handleRegisterChange}
                                className="w-full h-12 pl-12 pr-4 bg-gray-50 border-2 border-gray-200 rounded-full focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-300 text-gray-800 group-hover:border-blue-300"
                                placeholder="กรอกชื่อ-นามสกุล"
                                required
                              />
                              <FaUserAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500" />
                            </div>
                          </div>

                          {/* Position */}
                          <div className="group">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">ตำแหน่ง</label>
                            <div className="relative">
                              <select
                                name="position"
                                value={registerData.position}
                                onChange={handleRegisterChange}
                                className="w-full h-12 pl-12 pr-4 bg-gray-50 border-2 border-gray-200 rounded-full focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-300 text-gray-800 appearance-none group-hover:border-blue-300"
                                required
                              >
                                <option value="">เลือกตำแหน่ง</option>
                                {positionOptions}
                              </select>
                              <FaUserAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500" />
                              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Department */}
                          <div className="group">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">สาขา</label>
                            <div className="relative">
                              <select
                                name="department"
                                value={registerData.department}
                                onChange={handleRegisterChange}
                                className="w-full h-12 pl-12 pr-4 bg-gray-50 border-2 border-gray-200 rounded-full focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-300 text-gray-800 appearance-none group-hover:border-blue-300"
                                required
                              >
                                <option value="">เลือกสาขา</option>
                                {branchOptions}
                              </select>
                              <FaGraduationCap className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500" />
                              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-4">
                          <button
                            type="button"
                            className="px-8 py-3 bg-gradient-to-r from-blue-800 to-blue-700 text-white font-semibold rounded-full shadow-lg hover:bg-blue-800 hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
                            onClick={() => {
                              if (validateRegisterStep(0)) setRegisterStep(1);
                            }}
                          >
                            ถัดไป
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 1: Account Info */}
                    {registerStep === 1 && (
                      <div className="space-y-5 animate-slide-in-right">
                        <div className="flex items-center mb-6 py-4 px-6 bg-black/50 rounded-full border border-white/20 shadow-lg">
                          <FaLock className="text-white text-2xl mr-6" />
                          <div>
                            <h3 className="text-lg font-semibold text-white">ข้อมูลบัญชี</h3>
                            <p className="text-sm text-white">ตั้งค่าชื่อผู้ใช้และรหัสผ่าน</p>
                          </div>
                        </div>

                        <div className="space-y-5">
                          {/* Username */}
                          <div className="group">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อผู้ใช้งาน</label>
                            <div className="relative">
                              <input
                                type="text"
                                name="username"
                                value={registerData.username}
                                readOnly
                                tabIndex={-1}
                                className={`w-full h-12 pl-12 pr-4 bg-gray-100 border-2 border-gray-300 text-gray-600 rounded-full focus:outline-none cursor-not-allowed select-none ${
                                  validation.username === 'duplicate' ? 'border-red-400' : ''
                                }`}
                                placeholder="ชื่อผู้ใช้งานจะตรงกับรหัสนิสิต/บุคลากร"
                                required
                              />
                              <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                              {validation.username === 'duplicate' && (
                                <div className="text-red-500 text-xs mt-1 animate-shake">ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว</div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Password */}
                            <div className="group">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">รหัสผ่าน</label>
                              <div className="relative">
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  name="password"
                                  value={registerData.password}
                                  onChange={handleRegisterChange}
                                  className="w-full h-12 pl-12 pr-12 bg-gray-50 border-2 border-gray-200 rounded-full focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-300 text-gray-800 group-hover:border-blue-300"
                                  placeholder="กรอกรหัสผ่าน"
                                  required
                                />
                                <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500" />
                                <button
                                  type="button"
                                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors duration-300"
                                  onClick={() => setShowPassword(v => !v)}
                                >
                                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                              </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="group">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">ยืนยันรหัสผ่าน</label>
                              <div className="relative">
                                <input
                                  type={showConfirmPassword ? 'text' : 'password'}
                                  name="confirmPassword"
                                  value={registerData.confirmPassword}
                                  onChange={handleRegisterChange}
                                  className={`w-full h-12 pl-12 pr-12 bg-gray-50 border-2 rounded-full focus:outline-none transition-all duration-300 text-gray-800 ${
                                    !passwordMatch && registerData.confirmPassword
                                      ? 'border-red-400 focus:border-red-500 bg-red-50'
                                      : 'border-gray-200 focus:border-blue-500 focus:bg-white group-hover:border-blue-300'
                                  }`}
                                  placeholder="ยืนยันรหัสผ่าน"
                                  required
                                />
                                <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500" />
                                <button
                                  type="button"
                                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors duration-300"
                                  onClick={() => setShowConfirmPassword(v => !v)}
                                >
                                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                              </div>
                              {!passwordMatch && registerData.confirmPassword && (
                                <div className="text-red-500 text-xs mt-1 animate-shake">รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน</div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between pt-4">
                          <button
                            type="button"
                            className="px-6 py-3 bg-gray-400 text-white font-semibold rounded-full shadow-lg hover:bg-gray-500 transform hover:scale-105 transition-all duration-300 flex items-center"
                            onClick={() => setRegisterStep(0)}
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            ย้อนกลับ
                          </button>
                          <button
                            type="button"
                            className="px-8 py-3 bg-gradient-to-r from-blue-800 to-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-800 hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
                            onClick={() => {
                              if (validateRegisterStep(1)) setRegisterStep(2);
                            }}
                          >
                            ถัดไป
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Contact Info */}
                    {registerStep === 2 && (
                      <div className="space-y-5 animate-slide-in-right">
                        <div className="flex items-center mb-6 py-4 px-6 bg-black/50 rounded-full border border-white/20 shadow-lg">
                          <FaEnvelope className="text-white text-2xl mr-6" />
                          <div>
                            <h3 className="text-lg font-semibold text-white">ข้อมูลติดต่อ</h3>
                            <p className="text-sm text-white">กรอกอีเมลและเบอร์โทรศัพท์ที่ติดต่อได้</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {/* Email */}
                          <div className="group">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">อีเมล</label>
                            <div className="relative">
                              <input
                                type="email"
                                name="email"
                                value={registerData.email}
                                onChange={handleRegisterChange}
                                className={`w-full h-12 pl-12 pr-4 bg-gray-50 border-2 border-gray-200 rounded-full focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-300 text-gray-800 group-hover:border-blue-300 ${validation.email === 'duplicate' ? 'border-red-400 focus:border-red-500 bg-red-50' : ''}`}
                                placeholder="กรอกอีเมล @msu.ac.th"
                                required
                              />
                              <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500" />
                              {validation.email === 'duplicate' && (
                                <div className="text-red-500 text-xs mt-1 animate-shake">อีเมลนี้ถูกใช้ไปแล้ว</div>
                              )}
                            </div>
                          </div>
                          {/* Phone */}
                          <div className="group">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">เบอร์โทรศัพท์</label>
                            <div className="relative">
                              <input
                                type="tel"
                                name="phone"
                                value={registerData.phone}
                                onChange={handleRegisterChange}
                                className="w-full h-12 pl-12 pr-4 bg-gray-50 border-2 border-gray-200 rounded-full focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-300 text-gray-800 group-hover:border-blue-300"
                                placeholder="กรอกเบอร์โทรศัพท์"
                                required
                              />
                              <FaPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500" />
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between pt-4">
                          <button
                            type="button"
                            className="px-6 py-3 bg-gray-400 text-white font-semibold rounded-full shadow-lg hover:bg-gray-500 transform hover:scale-105 transition-all duration-300 flex items-center"
                            onClick={() => setRegisterStep(1)}
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            ย้อนกลับ
                          </button>
                          <button
                            type="button"
                            className="px-8 py-3 bg-gradient-to-r from-blue-800 to-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-800 hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
                            onClick={() => {
                              if (validateRegisterStep(2)) setRegisterStep(3);
                            }}
                          >
                            ถัดไป
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Address Info */}
                    {registerStep === 3 && (
                      <div className="space-y-5 animate-slide-in-right">
                        <div className="flex items-center mb-6 py-4 px-6 bg-black/50 rounded-full border border-white/20 shadow-lg">
                          <FaMapMarkerAlt className="text-white text-2xl mr-6" />
                          <div>
                            <h3 className="text-lg font-semibold text-white">ข้อมูลที่อยู่</h3>
                            <p className="text-sm text-white">ที่อยู่สำหรับการจัดส่งและติดต่อ</p>
                          </div>
                        </div>

                        <div className="space-y-5">
                          {/* Current Address */}
                          <div className="group">
                            <label className="block text-sm font-semibold text-gray-700 mb-2 ">ที่อยู่ปัจจุบัน</label>
                            <div className="relative">
                              <textarea
                                name="currentAddress"
                                value={registerData.currentAddress}
                                onChange={handleRegisterChange}
                                rows="3"
                                className=" w-full px-7 py-3 pl-12 bg-gray-50 border-2 border-gray-200 rounded-4xl focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-300 text-gray-800 resize-none group-hover:border-blue-300"
                                placeholder="บ้านเลขที่, ถนน, ซอย"
                                required
                              />
                              <FaMapMarkerAlt className="absolute left-5 top-4 text-red-500" />
                            </div>
                          </div>

                          {/* Location Selects */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {/* Province */}
                            <div className="group">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">จังหวัด</label>
                              <div className="relative">
                                <select
                                  name="province"
                                  value={registerData.provinceId}
                                  onChange={handleProvinceChange}
                                  className="w-full h-12 pl-10 pr-4 bg-gray-50 border-2 border-gray-200 rounded-full focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-300 text-gray-800 appearance-none group-hover:border-blue-300"
                                  required
                                >
                                  <option value="">เลือกจังหวัด</option>
                                  {provinceOptions}
                                </select>
                                <FaBuilding className="absolute left-4 top-1/2 transform -translate-y-1/2 text-yellow-600" />
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            </div>

                            {/* District */}
                            <div className="group">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">อำเภอ/เขต</label>
                              <div className="relative">
                                <select
                                  name="district"
                                  value={registerData.amphureId}
                                  onChange={handleDistrictChange}
                                  className="w-full h-12 pl-10 pr-4 bg-gray-50 border-2 border-gray-200 rounded-full focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-300 text-gray-800 appearance-none group-hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                  required
                                  disabled={!registerData.provinceId}
                                >
                                  <option value="">เลือกอำเภอ/เขต</option>
                                  {amphureOptions}
                                </select>
                                <FaBuilding className="absolute left-4 top-1/2 transform -translate-y-1/2 text-yellow-600" />
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            </div>

                            {/* Sub-district */}
                            <div className="group">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">ตำบล/แขวง</label>
                              <div className="relative">
                                <select
                                  name="subdistrict"
                                  value={registerData.tambonId}
                                  onChange={handleSubdistrictChange}
                                  className="w-full h-12 pl-10 pr-4 bg-gray-50 border-2 border-gray-200 rounded-full focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-300 text-gray-800 appearance-none group-hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                  required
                                  disabled={!registerData.amphureId}
                                >
                                  <option value="">เลือกตำบล/แขวง</option>
                                  {tambonOptions}
                                </select>
                                <FaBuilding className="absolute left-4 top-1/2 transform -translate-y-1/2 text-yellow-600" />
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Postal Code */}
                          <div className="group">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">รหัสไปรษณีย์</label>
                            <div className="relative">
                              <input
                                type="text"
                                name="postalCode"
                                value={registerData.postalCode}
                                onChange={handleRegisterChange}
                                className="w-full h-12 pl-12 pr-4 bg-gray-100 border-2 border-gray-300 rounded-xl focus:outline-none text-gray-600 cursor-not-allowed select-none"
                                placeholder="รหัสไปรษณีย์"
                                required
                                readOnly
                              />
                              <FaMapMarkerAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-500" />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between pt-4">
                          <button
                            type="button"
                            className="px-6 py-3 bg-gray-400 text-white font-semibold rounded-full shadow-lg hover:bg-gray-500 transform hover:scale-105 transition-all duration-300 flex items-center"
                            onClick={() => setRegisterStep(2)}
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            ย้อนกลับ
                          </button>
                          <button
                            type="button"
                            disabled={isLoading}
                            className={`px-8 py-3 bg-gradient-to-r from-blue-800 to-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-800 hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center ${
                              isLoading ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                            onClick={async () => {
                              if (validateRegisterStep(3)) {
                                // ตรวจสอบว่าต้องใช้อีเมล @msu.ac.th เท่านั้นสำหรับ OTP
                                const isMsuEmail = registerData.email && /@msu\.ac\.th$/.test(registerData.email);
                                if (!isMsuEmail) {
                                  setNotification({
                                    show: true,
                                    type: 'warning',
                                    title: 'ข้อมูลไม่ครบ',
                                    message: 'กรุณากรอกอีเมล @msu.ac.th เพื่อรับรหัส OTP',
                                    onClose: () => setNotification(n => ({ ...n, show: false }))
                                  });
                                  return;
                                }
                                setIsLoading(true);
                                try {
                                  await axios.post('http://localhost:5000/api/users/request-otp', { contact: registerData.email });
                                  setOtpDialog({ show: true, email: registerData.email, error: '' });
                                } catch (err) {
                                  setNotification({
                                    show: true,
                                    type: 'error',
                                    title: 'ส่ง OTP ไม่สำเร็จ',
                                    message: err.response?.data?.message || 'เกิดข้อผิดพลาดในการส่ง OTP',
                                    onClose: () => setNotification(n => ({ ...n, show: false }))
                                  });
                                }
                                setIsLoading(false);
                              }
                            }}
                          >
                            {isLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                                กำลังสมัครสมาชิก...
                              </>
                            ) : (
                              <>
                                <FaUserAlt className="mr-2" />
                                สมัครสมาชิก
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <OtpDialog
        show={otpDialog.show}
        title={'ยืนยันอีเมล'}
        message={`กรุณากรอกรหัส OTP ที่ส่งไปยัง ${otpDialog.email}`}
        onSubmit={handleOtpVerify}
        onClose={() => setOtpDialog({ show: false, email: '', error: '' })}
        error={otpDialog.error}
      />
      <LoginSuccessDialog />
      <LoginErrorDialog />
      <RegisterSuccessDialog />
      <RegisterErrorDialog />
      <PasswordMismatchDialog />
      <Notification
        show={notification.show}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={notification.onClose}
        actions={notification.actions}
        duration={notification.duration}
      />

      {/* Notification แจ้งเตือนเมื่อจะออกจากสมัครสมาชิก */}
      <Notification
        show={showRegisterLeaveDialog}
        title="แจ้งเตือน"
        message="หากคุณเปลี่ยนไปหน้าเข้าสู่ระบบข้อมูลที่กรอกไว้จะหายทั้งหมดต้องการดำเนินการต่อหรือไม่?"
        type="warning"
        duration={0}
        onClose={() => setShowRegisterLeaveDialog(false)}
        actions={[
          {
            label: 'ยกเลิก',
            onClick: () => setShowRegisterLeaveDialog(false)
          },
          {
            label: 'ดำเนินการต่อ',
            onClick: () => {
              setShowRegisterLeaveDialog(false);
              setActiveTab('login');
              setRegisterData({
                idNumber: '',
                fullName: '',
                username: '',
                password: '',
                confirmPassword: '',
                email: '',
                phone: '',
                position: '',
                department: '',
                currentAddress: '',
                provinceId: '',
                amphureId: '',
                tambonId: '',
                postalCode: ''
              });
              setRegisterStep(0);
            }
          }
        ]}
      />

      {/* Custom Styles */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fade-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-2px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(2px);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }

        .animate-fade-in-right {
          animation: fade-in-right 0.6s ease-out;
        }

        .animate-fade-in-left {
          animation: fade-in-left 0.6s ease-out;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animation-delay-500 {
          animation-delay: 0.5s;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .hover\:scale-102:hover {
          transform: scale(1.02);
        }

        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
};

export default AuthSystem;