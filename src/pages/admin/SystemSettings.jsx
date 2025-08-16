import React, { useState, useEffect, useRef } from 'react';
import { Card, CardBody, Typography, Button, Input } from '@material-tailwind/react';
import {
  MdSettings,
  MdContactPhone,
  MdLocationOn,
  MdAccessTime,
  MdNotifications,
  MdSave,
  MdRefresh,
  MdCheckCircle,
  MdError,
  MdInfo,
  MdPeople,
  MdBarChart,
  MdWifiTethering
} from 'react-icons/md';
import { FaUserEdit } from 'react-icons/fa';
// removed security icons
import { ImMail4 } from "react-icons/im";
import { authFetch } from '../../utils/api';
import Notification from '../../components/Notification';
import PersonalInfoEdit from '../users/edit_profile.jsx';

const SystemSettings = () => {
  const [contactInfo, setContactInfo] = useState({
    location: '',
    phone: '',
    hours: ''
  });
  const [cloudinaryConfig, setCloudinaryConfig] = useState({
    cloud_name: '',
    api_key: '',
    is_configured: false
  });
  const [notificationStats, setNotificationStats] = useState({
    overall: { total_users: 0, users_with_line: 0, users_enabled_line: 0 },
    by_role: []
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState({});
  const [activeTab, setActiveTab] = useState('notifications');
  const [isUpdatingStats, setIsUpdatingStats] = useState(false);
  const [notifActive, setNotifActive] = useState('overview');

  // Refs for in-page notification menu navigation
  const overviewRef = useRef(null);
  const connectionRef = useRef(null);
  const contactRef = useRef(null);
  const previewRef = useRef(null);
  const globalRef = useRef(null);
  const rolesRef = useRef(null);

  // Security tab states
  const [securityForm, setSecurityForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });
  const [otpSent, setOtpSent] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [passwordHint, setPasswordHint] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: 'bg-gray-200', textColor: 'text-gray-500' });
  const [resendCooldownSec, setResendCooldownSec] = useState(0);
  // Auto-logout settings
  const [inactivityMinutes, setInactivityMinutes] = useState(45);
  // Pre-logout warning
  const [preWarnMinutes, setPreWarnMinutes] = useState(() => {
    const saved = parseInt(localStorage.getItem('security.preLogoutWarnMinutes'));
    return Number.isFinite(saved) && saved >= 0 ? saved : 1;
  });
  // Password policy
  const [passwordPolicy, setPasswordPolicy] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('security.passwordPolicy') || '{}');
      return {
        minLength: Number.isFinite(saved.minLength) ? saved.minLength : 8,
        requireLetter: typeof saved.requireLetter === 'boolean' ? saved.requireLetter : true,
        requireNumber: typeof saved.requireNumber === 'boolean' ? saved.requireNumber : true,
        requireUppercase: typeof saved.requireUppercase === 'boolean' ? saved.requireUppercase : false,
        requireSpecial: typeof saved.requireSpecial === 'boolean' ? saved.requireSpecial : false,
      };
    } catch {
      return { minLength: 8, requireLetter: true, requireNumber: true, requireUppercase: false, requireSpecial: false };
    }
  });

  useEffect(() => {
    fetchContactInfo();
    if (activeTab === 'notifications') {
      fetchNotificationStats();
      fetchUsers();
    }
  }, [activeTab]);

  // Prefill email from logged-in user (if available)
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user?.email) {
          setSecurityForm(prev => ({ ...prev, email: user.email }));
        }
      }
    } catch (_) {}
  }, []);

  const validatePassword = (pwd) => {
    const policy = passwordPolicy;
    if (!pwd || pwd.length < policy.minLength) return `รหัสผ่านต้องมีอย่างน้อย ${policy.minLength} ตัวอักษร`;
    if (policy.requireLetter && !/[A-Za-z]/.test(pwd)) return 'รหัสผ่านต้องมีตัวอักษร';
    if (policy.requireNumber && !/[0-9]/.test(pwd)) return 'รหัสผ่านต้องมีตัวเลข';
    if (policy.requireUppercase && !/[A-Z]/.test(pwd)) return 'ต้องมีตัวพิมพ์ใหญ่';
    if (policy.requireSpecial && !/[^A-Za-z0-9]/.test(pwd)) return 'ต้องมีอักขระพิเศษ';
    return '';
  };

  const goToNotificationSection = (key) => {
    setNotifActive(key);
    const sectionMap = {
      overview: overviewRef,
      connection: connectionRef,
      contact: contactRef,
      preview: previewRef,
      global: globalRef,
      roles: rolesRef,
    };
    const ref = sectionMap[key];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderSessionSettings = () => (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <MdSettings className="text-2xl text-gray-700" />
          </div>
          <div>
            <Typography variant="h6" className="text-gray-800 font-bold mb-1">
              ความปลอดภัยของเซสชัน
            </Typography>
            <Typography variant="paragraph" className="text-gray-600 text-sm">
              ออกจากระบบอัตโนมัติเมื่อไม่มีการใช้งาน และตั้งค่าเตือนล่วงหน้า
            </Typography>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="text-sm font-semibold text-gray-700">ไม่มีการใช้งานเป็นเวลา</label>
            <div className="flex items-center gap-2 mt-1">
               <Input
                type="number"
                value={inactivityMinutes}
                disabled
                className="!border !border-gray-300 bg-gray-100 w-28"
                labelProps={{ className: 'hidden' }}
              />
              <span className="text-gray-700">นาที</span>
            </div>
            <Typography variant="small" className="text-gray-500 mt-1">แนะนำ 15–60 นาที</Typography>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">เตือนล่วงหน้า</label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number"
                min={0}
                max={120}
                value={preWarnMinutes}
                onChange={(e) => setPreWarnMinutes(Math.max(0, Math.min(120, parseInt(e.target.value || '0'))))}
                className="!border !border-gray-300 bg-white w-28"
                labelProps={{ className: 'hidden' }}
              />
              <span className="text-gray-700">นาทีก่อนหมดเวลา</span>
            </div>
            <Typography variant="small" className="text-gray-500 mt-1">0 = ไม่เตือน</Typography>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={() => {
              localStorage.setItem('security.inactivityMinutes', String(inactivityMinutes));
              window.dispatchEvent(new CustomEvent('security:inactivityUpdated', { detail: String(inactivityMinutes) }));
              localStorage.setItem('security.preLogoutWarnMinutes', String(preWarnMinutes));
              window.dispatchEvent(new CustomEvent('security:preWarnUpdated', { detail: String(preWarnMinutes) }));
              setNotificationData({ title: 'บันทึกแล้ว', message: `ตั้งค่าออกจากระบบอัตโนมัติ ${inactivityMinutes} นาที`, type: 'success' });
              setShowNotification(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            บันทึกการตั้งค่า
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              const saved = parseInt(localStorage.getItem('security.inactivityMinutes'));
              setInactivityMinutes(Number.isFinite(saved) && saved > 0 ? saved : 45);
              const savedWarn = parseInt(localStorage.getItem('security.preLogoutWarnMinutes'));
              setPreWarnMinutes(Number.isFinite(savedWarn) && savedWarn >= 0 ? savedWarn : 1);
            }}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            ใช้ค่าที่บันทึกไว้
          </Button>
        </div>
      </div>
    </div>
  );

  const renderContactSettings = () => (
    <div className="max-w-5xl mx-auto">
      {/* ใช้ส่วน Contact Information Section เดิม */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-50 rounded-xl">
            <MdContactPhone className="text-2xl text-blue-600" />
          </div>
          <div>
            <Typography variant="h6" className="text-gray-800 font-bold mb-1">
              ข้อมูลติดต่อเจ้าหน้าที่
            </Typography>
            <Typography variant="paragraph" className="text-gray-600 text-sm">
              ข้อมูลนี้จะแสดงในข้อความแจ้งเตือน LINE เมื่อมีการอนุมัติการขอยืมครุภัณฑ์
            </Typography>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <MdLocationOn className="text-blue-600" />
              สถานที่ติดต่อ
            </label>
            <Input
              type="text"
              name="location"
              value={contactInfo.location}
              onChange={handleInputChange}
              placeholder="เช่น ห้องพัสดุ อาคาร 1 ชั้น 2"
              className="!border !border-gray-300 bg-white"
              labelProps={{ className: 'hidden' }}
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <MdContactPhone className="text-blue-600" />
              เบอร์โทรศัพท์
            </label>
            <Input
              type="text"
              name="phone"
              value={contactInfo.phone}
              onChange={handleInputChange}
              placeholder="เช่น 02-123-4567"
              className="!border !border-gray-300 bg-white"
              labelProps={{ className: 'hidden' }}
              required
            />
          </div>

          {/* Hours */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <MdAccessTime className="text-blue-600" />
              เวลาทำการ
            </label>
            <Input
              type="text"
              name="hours"
              value={contactInfo.hours}
              onChange={handleInputChange}
              placeholder="เช่น 8:30-16:30 น."
              className="!border !border-gray-300 bg-white"
              labelProps={{ className: 'hidden' }}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outlined" onClick={fetchContactInfo} className="border-gray-300 text-gray-700 hover:bg-gray-50">
              รีเฟรช
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              บันทึก
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-gray-200', textColor: 'text-gray-500' };
    let score = 0;
    const policy = passwordPolicy;
    if (pwd.length >= policy.minLength) score += 30;
    if (pwd.length >= Math.max(12, policy.minLength + 4)) score += 20;
    if (!policy.requireUppercase) {
      if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 20;
    } else {
      if (/[A-Z]/.test(pwd)) score += 20;
    }
    if (!policy.requireNumber) {
      if (/[0-9]/.test(pwd)) score += 15;
    } else {
      if (/[0-9]/.test(pwd)) score += 15;
    }
    if (!policy.requireSpecial) {
      if (/[^A-Za-z0-9]/.test(pwd)) score += 15;
    } else {
      if (/[^A-Za-z0-9]/.test(pwd)) score += 15;
    }
    if (score > 100) score = 100;
    let label = 'อ่อน';
    let color = 'bg-red-500';
    let textColor = 'text-red-600';
    if (score >= 70) { label = 'แข็งแกร่ง'; color = 'bg-green-500'; textColor = 'text-green-600'; }
    else if (score >= 40) { label = 'ปานกลาง'; color = 'bg-yellow-500'; textColor = 'text-yellow-600'; }
    return { score, label, color, textColor };
  };

  const handleSecurityInputChange = (e) => {
    const { name, value } = e.target;
    setSecurityForm(prev => ({ ...prev, [name]: value }));
    if (name === 'password') {
      setPasswordHint(validatePassword(value));
      setPasswordStrength(getPasswordStrength(value));
    }
  };

  const requestPasswordOtp = async () => {
    try {
      setSecurityLoading(true);
      setOtpSent(false);
      if (resendCooldownSec > 0) {
        return;
      }
      if (!securityForm.email) {
        setNotificationData({ title: 'ข้อผิดพลาด', message: 'กรุณากรอกอีเมล', type: 'error' });
        setShowNotification(true);
        return;
      }
      const res = await authFetch('http://localhost:5000/api/users/request-password-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: securityForm.email })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setNotificationData({ title: 'ส่ง OTP แล้ว', message: data.message || 'กรุณาตรวจสอบอีเมลของคุณ', type: 'success' });
        setResendCooldownSec(60);
      } else {
        setNotificationData({ title: 'เกิดข้อผิดพลาด', message: data.message || 'ไม่สามารถส่ง OTP ได้', type: 'error' });
      }
      setShowNotification(true);
    } catch (err) {
      setNotificationData({ title: 'เกิดข้อผิดพลาด', message: 'ไม่สามารถส่ง OTP ได้', type: 'error' });
      setShowNotification(true);
    } finally {
      setSecurityLoading(false);
    }
  };

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldownSec <= 0) return;
    const t = setTimeout(() => setResendCooldownSec((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldownSec]);

  const submitPasswordReset = async () => {
    try {
      setSecurityLoading(true);
      // validations
      if (!securityForm.email || !securityForm.password || !securityForm.confirmPassword || !securityForm.otp) {
        setNotificationData({ title: 'ข้อผิดพลาด', message: 'กรุณากรอกข้อมูลให้ครบถ้วน', type: 'error' });
        setShowNotification(true);
        return;
      }
      if (securityForm.password !== securityForm.confirmPassword) {
        setNotificationData({ title: 'ข้อผิดพลาด', message: 'รหัสผ่านไม่ตรงกัน', type: 'error' });
        setShowNotification(true);
        return;
      }
      const pwdError = validatePassword(securityForm.password);
      if (pwdError) {
        setNotificationData({ title: 'ข้อผิดพลาด', message: pwdError, type: 'error' });
        setShowNotification(true);
        return;
      }

      const res = await authFetch('http://localhost:5000/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: securityForm.email, otp: securityForm.otp, password: securityForm.password })
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setNotificationData({ title: 'สำเร็จ', message: data.message || 'เปลี่ยนรหัสผ่านสำเร็จ', type: 'success' });
        setShowNotification(true);
        setSecurityForm({ email: securityForm.email, password: '', confirmPassword: '', otp: '' });
        setOtpSent(false);
      } else {
        setNotificationData({ title: 'เกิดข้อผิดพลาด', message: data.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้', type: 'error' });
        setShowNotification(true);
      }
    } catch (err) {
      setNotificationData({ title: 'เกิดข้อผิดพลาด', message: 'ไม่สามารถเปลี่ยนรหัสผ่านได้', type: 'error' });
      setShowNotification(true);
    } finally {
      setSecurityLoading(false);
    }
  };


  const fetchContactInfo = async () => {
    try {
      setLoading(true);
      const response = await authFetch('http://localhost:5000/api/contact-info');
      const data = await response.json();

      if (data.success && data.data) {
        setContactInfo({
          location: data.data.location || '',
          phone: data.data.phone || '',
          hours: data.data.hours || ''
        });
      } else {
        console.log('No contact info found or error:', data.message);
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
      setNotificationData({
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถดึงข้อมูลติดต่อได้',
        type: 'error'
      });
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };

  // removed: fetchCloudinaryConfig (storage tab removed)

  const testCloudinaryConnection = async () => {
    try {
      setLoading(true);
      const data = await testConnection();

      if (data.success) {
        setNotificationData({
          title: 'สำเร็จ',
          message: data.message,
          type: 'success'
        });
      } else {
        setNotificationData({
          title: 'เกิดข้อผิดพลาด',
          message: data.message || 'ไม่สามารถเชื่อมต่อ Cloudinary ได้',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error testing cloudinary connection:', error);
      setNotificationData({
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถทดสอบการเชื่อมต่อ Cloudinary ได้',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setShowNotification(true);
    }
  };

  const getCloudinaryUsageStats = async () => {
    try {
      setLoading(true);
      const data = await getUsageStats();

      if (data.success) {
        setNotificationData({
          title: 'ข้อมูลสถิติการใช้งาน',
          message: 'ดึงข้อมูลสถิติการใช้งาน Cloudinary สำเร็จ',
          type: 'success'
        });
        // You can display the stats in a modal or another component
        console.log('Cloudinary usage stats:', data.data);
      } else {
        setNotificationData({
          title: 'เกิดข้อผิดพลาด',
          message: data.message || 'ไม่สามารถดึงข้อมูลสถิติการใช้งานได้',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error getting cloudinary usage stats:', error);
      setNotificationData({
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถดึงข้อมูลสถิติการใช้งานได้',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setShowNotification(true);
    }
  };

  const createCloudinaryFolderStructure = async () => {
    try {
      setLoading(true);
      const data = await createCloudinaryFolders();

      if (data.success) {
        setNotificationData({
          title: 'สร้าง Folder Structure สำเร็จ',
          message: 'สร้าง folder structure ใน Cloudinary สำเร็จแล้ว',
          type: 'success'
        });
        setShowNotification(true);
      } else {
        setNotificationData({
          title: 'เกิดข้อผิดพลาด',
          message: data.message || 'ไม่สามารถสร้าง folder structure ได้',
          type: 'error'
        });
        setShowNotification(true);
      }
    } catch (error) {
      console.error('Error creating cloudinary folders:', error);
      setNotificationData({
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถสร้าง folder structure ได้',
        type: 'error'
      });
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };

  const listCloudinaryFolderStructure = async () => {
    try {
      setLoading(true);
      const data = await listCloudinaryFolders();

      if (data.success) {
        setNotificationData({
          title: 'รายการ Folder',
          message: `พบ folder ทั้งหมด ${data.data.folders.length} รายการ`,
          type: 'success'
        });
        setShowNotification(true);
      } else {
        setNotificationData({
          title: 'เกิดข้อผิดพลาด',
          message: data.message || 'ไม่สามารถดึงรายการ folder ได้',
          type: 'error'
        });
        setShowNotification(true);
      }
    } catch (error) {
      console.error('Error listing cloudinary folders:', error);
      setNotificationData({
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถดึงรายการ folder ได้',
        type: 'error'
      });
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationStats = async (force = false) => {
    try {
      // Skip if we're in the middle of updating stats (unless forced)
      if (isUpdatingStats && !force) {
        console.log('Skipping stats fetch - currently updating');
        return;
      }

      const response = await authFetch('http://localhost:5000/api/notification-settings/stats');
      const data = await response.json();

      if (data.success && data.data) {
        console.log('Fetched fresh stats from server:', {
          overall: data.data.overall,
          by_role: data.data.by_role,
          explanation: 'users_enabled_line should only count users with LINE ID and enabled=1'
        });
        setNotificationStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await authFetch('http://localhost:5000/api/notification-settings/users');
      const data = await response.json();

      if (data.success && data.data) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setNotificationData({
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถดึงข้อมูลผู้ใช้งานได้',
        type: 'error'
      });
      setShowNotification(true);
    }
  };



  const testLineConnection = async () => {
    try {
      setLoading(true);
      const response = await authFetch('http://localhost:5000/api/notification-settings/test-line-connection', {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        setNotificationData({
          title: 'การเชื่อมต่อสำเร็จ',
          message: data.message,
          type: 'success'
        });
      } else {
        setNotificationData({
          title: 'เกิดข้อผิดพลาด',
          message: data.message || 'ไม่สามารถเชื่อมต่อ LINE Bot ได้',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error testing LINE connection:', error);
      setNotificationData({
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถทดสอบการเชื่อมต่อ LINE Bot ได้',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setShowNotification(true);
    }
  };

  // ฟังก์ชันสำหรับเปิด/ปิดการแจ้งเตือนตาม role
  const toggleRoleNotification = async (roleName, enabled) => {
    try {
      setLoading(true);

      // หาผู้ใช้ที่มี role นี้และมี LINE ID
      const usersInRole = users.filter(user =>
        user.role_name === roleName &&
        user.line_id !== 'ยังไม่ผูกบัญชี'
      );

      if (usersInRole.length === 0) {
        setNotificationData({
          title: 'ไม่มีผู้ใช้งาน',
          message: `ไม่มีผู้ใช้งานในตำแหน่ง ${roleName} ที่ผูก LINE ID`,
          type: 'warning'
        });
        setShowNotification(true);
        return;
      }

      const userIds = usersInRole.map(user => user.user_id);

      const response = await authFetch('http://localhost:5000/api/notification-settings/bulk-toggle', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds, enabled })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setUsers(prev => prev.map(user =>
          userIds.includes(user.user_id)
            ? { ...user, line_notify_enabled: enabled ? 1 : 0 }
            : user
        ));

        // Update stats immediately for instant UI feedback
        setNotificationStats(prev => {
          const updatedByRole = prev.by_role.map(roleStats => {
            if (roleStats.role_name === roleName) {
              return {
                ...roleStats,
                users_enabled_line: enabled ? roleStats.users_with_line : 0
              };
            }
            return roleStats;
          });

          // Calculate new overall stats - sum only from roles that have users with LINE
          const newOverallEnabled = updatedByRole.reduce((sum, role) => sum + role.users_enabled_line, 0);

          return {
            ...prev,
            overall: {
              ...prev.overall,
              users_enabled_line: newOverallEnabled
            },
            by_role: updatedByRole
          };
        });

        // Also refresh from server to ensure accuracy
        setTimeout(() => {
          fetchNotificationStats();
        }, 100);

        setNotificationData({
          title: 'สำเร็จ',
          message: `${enabled ? 'เปิด' : 'ปิด'}การแจ้งเตือน LINE สำหรับตำแหน่ง ${roleName} (${userIds.length} คน)`,
          type: 'success'
        });
      } else {
        setNotificationData({
          title: 'เกิดข้อผิดพลาด',
          message: data.message,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error toggling role notification:', error);
      setNotificationData({
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถเปลี่ยนการตั้งค่าการแจ้งเตือนตาม role ได้',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setShowNotification(true);
    }
  };

    // ฟังก์ชันสำหรับเปิด/ปิดการแจ้งเตือนทั้งหมด
  const toggleAllNotifications = async (enabled) => {
    try {
      setLoading(true);
      setIsUpdatingStats(true);
      console.log('toggleAllNotifications called with:', { enabled, users: users.length });

      // หาผู้ใช้ทั้งหมดที่มี LINE ID
      const usersWithLine = users.filter(user =>
        user.line_id !== 'ยังไม่ผูกบัญชี'
      );

      console.log('Users with LINE:', {
        total: users.length,
        withLine: usersWithLine.length,
        usersWithLine: usersWithLine.map(u => ({ id: u.user_id, name: u.Fullname, line_id: u.line_id, enabled: u.line_notify_enabled }))
      });

      if (usersWithLine.length === 0) {
        setNotificationData({
          title: 'ไม่มีผู้ใช้งาน',
          message: 'ไม่มีผู้ใช้งานที่ผูก LINE ID',
          type: 'warning'
        });
        setShowNotification(true);
        return;
      }

      const userIds = usersWithLine.map(user => user.user_id);

      console.log('Making API call:', {
        url: 'http://localhost:5000/api/notification-settings/bulk-toggle',
        payload: { userIds, enabled }
      });

      const response = await authFetch('http://localhost:5000/api/notification-settings/bulk-toggle', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds, enabled })
      });

      const data = await response.json();
      console.log('API response:', data);

      if (data.success) {
        // Update local state immediately for better UX
        setUsers(prev => {
          const updated = prev.map(user =>
            userIds.includes(user.user_id)
              ? { ...user, line_notify_enabled: enabled ? 1 : 0 }
              : user
          );
          console.log('Updated users state:', updated.filter(u => userIds.includes(u.user_id)));
          return updated;
        });

                                // Update stats immediately based on actual database logic
        setNotificationStats(prev => {
          // Calculate new enabled count: only users with LINE ID and enabled = 1
          const newEnabledCount = enabled ? prev.overall.users_with_line : 0;

          const newStats = {
            ...prev,
            overall: {
              ...prev.overall,
              users_enabled_line: newEnabledCount
            }
          };
          console.log('Updated notification stats:', {
            previous: prev.overall,
            new: newStats.overall,
            enabled,
            calculation: `${enabled ? 'enabling' : 'disabling'} all users with LINE`
          });
          return newStats;
        });

        // Delay server refresh to avoid UI flickering
        setTimeout(() => {
          console.log('Refreshing global stats from server...');
          setIsUpdatingStats(false);
          fetchNotificationStats(true); // Force refresh
        }, 1000);

        setNotificationData({
          title: 'สำเร็จ',
          message: `${enabled ? 'เปิด' : 'ปิด'}การแจ้งเตือน LINE สำหรับผู้ใช้งานทั้งหมด (${userIds.length} คน)`,
          type: 'success'
        });
      } else {
        console.error('API error:', data.message);
        setNotificationData({
          title: 'เกิดข้อผิดพลาด',
          message: data.message,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error toggling all notifications:', error);
      setNotificationData({
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถเปลี่ยนการตั้งค่าการแจ้งเตือนทั้งหมดได้',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setShowNotification(true);
      // Reset updating flag in case of error
      setTimeout(() => {
        setIsUpdatingStats(false);
      }, 1000);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await authFetch('http://localhost:5000/api/contact-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactInfo)
      });

      const data = await response.json();

      if (data.success) {
        setNotificationData({
          title: 'สำเร็จ',
          message: data.message || 'อัปเดตข้อมูลติดต่อสำเร็จ',
          type: 'success'
        });
        // อัปเดตข้อมูลใน state หลังจากบันทึกสำเร็จ
        setContactInfo({
          location: data.data.location || contactInfo.location,
          phone: data.data.phone || contactInfo.phone,
          hours: data.data.hours || contactInfo.hours
        });
      } else {
        setNotificationData({
          title: 'เกิดข้อผิดพลาด',
          message: data.message || 'ไม่สามารถอัปเดตข้อมูลได้',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating contact info:', error);
      setNotificationData({
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถอัปเดตข้อมูลได้',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setShowNotification(true);
    }
  };

  const tabs = [
    {
      label: "การแจ้งเตือน",
      value: "notifications",
      icon: <MdNotifications className="w-5 h-5" />,
    },
    {
      label: "แก้ไขข้อมูลส่วนตัว",
      value: "profile",
      icon: <FaUserEdit className="w-5 h-5" />,
    },
  ];



  const renderNotificationSettings = () => {
    const uniqueRoles = [...new Set(users.map(user => user.role_name))];

    return (
      <div className="max-w-5xl mx-auto space-y-8">
        {/* In-Page Menu */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sticky top-16 z-10">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { key: 'overview', label: 'ภาพรวม', icon: <MdNotifications className="w-4 h-4" /> },
              { key: 'global', label: 'ควบคุมทั้งหมด', icon: <MdSettings className="w-4 h-4" /> },
              { key: 'roles', label: 'ตามบทบาท', icon: <MdPeople className="w-4 h-4" /> },
              { key: 'contact', label: 'ข้อมูลติดต่อ', icon: <MdContactPhone className="w-4 h-4" /> },
              { key: 'preview', label: 'ตัวอย่าง LINE', icon: <MdInfo className="w-4 h-4" /> },
              { key: 'connection', label: 'ทดสอบการเชื่อมต่อ', icon: <MdWifiTethering className="w-4 h-4" /> },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => goToNotificationSection(item.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap border transition-colors ${
                  notifActive === item.key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
        {/* Header Section - Modern & Clean */}
        <div ref={overviewRef} className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-200">
                  <MdNotifications className="text-3xl text-indigo-600" />
          </div>
          <div>
                  <Typography variant="h4" className="text-gray-800 font-bold mb-1">
                    การแจ้งเตือน LINE
            </Typography>
            <Typography variant="paragraph" className="text-gray-600">
                    จัดการการแจ้งเตือนสำหรับผู้ใช้งานทั้งหมด
            </Typography>
                </div>
              </div>
              <div className="text-right">
                <Typography variant="paragraph" className="text-sm text-gray-500 mb-1">
                  สถานะระบบ
                </Typography>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <Typography variant="paragraph" className="text-sm font-medium text-green-600">
                    ออนไลน์
                  </Typography>
                </div>
              </div>
          </div>
        </div>
      </div>

        {/* Quick Stats - Compact & Beautiful */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="h3" className="text-gray-800 font-bold">
                  {notificationStats.overall.total_users}
            </Typography>
                <Typography variant="paragraph" className="text-gray-500 text-sm mt-1">
                  ผู้ใช้งานทั้งหมด
            </Typography>
          </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <MdPeople className="text-xl text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="h3" className="text-gray-800 font-bold">
                  {notificationStats.overall.users_with_line}
                </Typography>
                <Typography variant="paragraph" className="text-gray-500 text-sm mt-1">
                  ผูก LINE แล้ว
                </Typography>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <MdWifiTethering className="text-xl text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="h3" className="text-gray-800 font-bold">
                  {notificationStats.overall.users_enabled_line}
                </Typography>
                <Typography variant="paragraph" className="text-gray-500 text-sm mt-1">
                  เปิดการแจ้งเตือน
                </Typography>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <MdNotifications className="text-xl text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="h3" className="text-gray-800 font-bold">
                  {Math.round((notificationStats.overall.users_enabled_line / notificationStats.overall.users_with_line) * 100) || 0}%
                </Typography>
                <Typography variant="paragraph" className="text-gray-500 text-sm mt-1">
                  อัตราการใช้งาน
                </Typography>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <MdBarChart className="text-xl text-purple-600" />
              </div>
            </div>
          </div>
        </div>



        {/* LINE Bot Connection Test - Simplified */}
        <div ref={connectionRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-xl">
                <MdWifiTethering className="text-2xl text-green-600" />
              </div>
              <div>
                <Typography variant="h6" className="text-gray-800 font-bold mb-1">
                  ทดสอบการเชื่อมต่อ LINE Bot
                </Typography>
                <Typography variant="paragraph" className="text-gray-600 text-sm">
                  ตรวจสอบว่าระบบสามารถส่งการแจ้งเตือนได้หรือไม่
                </Typography>
              </div>
            </div>
            <Button
              onClick={testLineConnection}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 shadow-sm hover:shadow-md"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  กำลังทดสอบ...
                </>
              ) : (
                <>
                  <MdWifiTethering className="text-lg" />
                  ทดสอบการเชื่อมต่อ
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Contact Information Section */}
        <div ref={contactRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-50 rounded-xl">
              <MdContactPhone className="text-2xl text-blue-600" />
            </div>
            <div>
              <Typography variant="h6" className="text-gray-800 font-bold mb-1">
                ข้อมูลติดต่อเจ้าหน้าที่
              </Typography>
              <Typography variant="paragraph" className="text-gray-600 text-sm">
                ข้อมูลนี้จะแสดงในข้อความแจ้งเตือน LINE เมื่อมีการอนุมัติการขอยืมครุภัณฑ์
              </Typography>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MdLocationOn className="text-blue-600" />
                สถานที่ติดต่อ
              </label>
              <Input
                type="text"
                name="location"
                value={contactInfo.location}
                onChange={handleInputChange}
                placeholder="เช่น ห้องพัสดุ อาคาร 1 ชั้น 2"
                className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-blue-500 focus:!border-t-blue-500 focus:ring-blue-500/20"
                labelProps={{
                  className: "hidden",
                }}
                containerProps={{ className: "min-w-[100px]" }}
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MdContactPhone className="text-blue-600" />
                เบอร์โทรศัพท์
              </label>
              <Input
                type="text"
                name="phone"
                value={contactInfo.phone}
                onChange={handleInputChange}
                placeholder="เช่น 02-123-4567"
                className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-blue-500 focus:!border-t-blue-500 focus:ring-blue-500/20"
                labelProps={{
                  className: "hidden",
                }}
                containerProps={{ className: "min-w-[100px]" }}
                required
              />
            </div>

            {/* Hours */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MdAccessTime className="text-blue-600" />
                เวลาทำการ
              </label>
              <Input
                type="text"
                name="hours"
                value={contactInfo.hours}
                onChange={handleInputChange}
                placeholder="เช่น 8:30-16:30 น."
                className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-blue-500 focus:!border-t-blue-500 focus:ring-blue-500/20"
                labelProps={{
                  className: "hidden",
                }}
                containerProps={{ className: "min-w-[100px]" }}
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outlined"
                onClick={fetchContactInfo}
                disabled={loading}
                className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <MdRefresh className="text-lg" />
                รีเฟรช
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <MdSave className="text-lg" />
                    บันทึก
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Preview Section */}
        <div ref={previewRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-green-50 rounded-xl">
              <MdInfo className="text-2xl text-green-600" />
            </div>
            <div>
              <Typography variant="h6" className="text-gray-800 font-bold mb-1">
                ตัวอย่างการแสดงผลใน LINE
              </Typography>
              <Typography variant="paragraph" className="text-gray-600 text-sm">
                ข้อมูลติดต่อจะแสดงในข้อความแจ้งเตือนเมื่อมีการอนุมัติการขอยืมครุภัณฑ์
              </Typography>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
            {/* LINE Message Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">L</span>
              </div>
              <div>
                <Typography variant="paragraph" className="text-green-700 font-bold text-sm">
                  ระบบยืมครุภัณฑ์
                </Typography>
                <Typography variant="paragraph" className="text-green-600 text-xs">
                  📦 สถานะคำขอยืมของคุณ
                </Typography>
              </div>
            </div>

            {/* Message Content */}
            <div className="bg-white rounded-lg p-4 border border-green-100 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">✅</span>
                  <Typography variant="paragraph" className="text-green-700 font-bold">
                    สถานะ: อนุมัติแล้ว
                  </Typography>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <Typography variant="paragraph" className="text-gray-600 text-sm mb-2">
                    รหัสการยืม: BR240115001
                  </Typography>
                  <Typography variant="paragraph" className="text-gray-600 text-sm mb-2">
                    วันที่ยืม: 15/01/2024
                  </Typography>
                  <Typography variant="paragraph" className="text-gray-600 text-sm mb-3">
                    วันที่คืน: 20/01/2024
                  </Typography>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <Typography variant="paragraph" className="text-gray-700 font-semibold text-sm mb-2">
                    รายการอุปกรณ์และสถานที่รับ:
                  </Typography>
                  <Typography variant="paragraph" className="text-gray-600 text-sm mb-3">
                    • โปรเจคเตอร์ (PROJ001) x1 รับที่: ห้องเรียน 101
                  </Typography>
                </div>

                {/* Contact Info Preview */}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center gap-2 mb-3">
                    <MdContactPhone className="text-blue-600 text-lg" />
                    <Typography variant="paragraph" className="text-blue-600 font-bold text-sm">
                      ติดต่อเจ้าหน้าที่:
                    </Typography>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MdLocationOn className="text-blue-600 text-sm" />
                        <Typography variant="paragraph" className="text-blue-700 text-sm">
                          {contactInfo.location || 'ห้องพัสดุ อาคาร 1 ชั้น 2'}
                        </Typography>
                      </div>
                      <div className="flex items-center gap-2">
                        <MdContactPhone className="text-blue-600 text-sm" />
                        <Typography variant="paragraph" className="text-blue-700 text-sm">
                          โทร: {contactInfo.phone || '02-123-4567'}
                        </Typography>
                      </div>
                      <div className="flex items-center gap-2">
                        <MdAccessTime className="text-blue-600 text-sm" />
                        <Typography variant="paragraph" className="text-blue-700 text-sm">
                          เวลา: {contactInfo.hours || '8:30-16:30 น.'}
                        </Typography>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button Preview */}
                <div className="border-t border-gray-200 pt-3">
                  <div className="bg-green-600 text-white text-center py-2 px-4 rounded-lg text-sm font-medium">
                    ดูรายละเอียด
                  </div>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <Typography variant="paragraph" className="text-yellow-700 text-xs">
                💡 หมายเหตุ: นี่คือตัวอย่างการแสดงผลในแอป LINE ข้อมูลจริงจะอัปเดตตามที่คุณบันทึกไว้
              </Typography>
            </div>
          </div>
        </div>

        {/* Session Security Settings moved to its own tab */}
        <div className="hidden">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <MdSettings className="text-2xl text-gray-700" />
            </div>
            <div>
              <Typography variant="h6" className="text-gray-800 font-bold mb-1">
                ความปลอดภัยของเซสชัน
              </Typography>
              <Typography variant="paragraph" className="text-gray-600 text-sm">
                ออกจากระบบอัตโนมัติเมื่อไม่มีการใช้งาน และตั้งค่าเตือนล่วงหน้า
              </Typography>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="text-sm font-semibold text-gray-700">ไม่มีการใช้งานเป็นเวลา</label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min={5}
                  max={240}
                  value={inactivityMinutes}
                  onChange={(e) => setInactivityMinutes(Math.max(5, Math.min(240, parseInt(e.target.value || '0'))))}
                  className="!border !border-gray-300 bg-white w-28"
                  labelProps={{ className: 'hidden' }}
                />
                <span className="text-gray-700">นาที</span>
              </div>
              <Typography variant="small" className="text-gray-500 mt-1">แนะนำ 15–60 นาที</Typography>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">เตือนล่วงหน้า</label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={preWarnMinutes}
                  onChange={(e) => setPreWarnMinutes(Math.max(0, Math.min(120, parseInt(e.target.value || '0'))))}
                  className="!border !border-gray-300 bg-white w-28"
                  labelProps={{ className: 'hidden' }}
                />
                <span className="text-gray-700">นาทีก่อนหมดเวลา</span>
              </div>
              <Typography variant="small" className="text-gray-500 mt-1">0 = ไม่เตือน</Typography>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button disabled className="bg-gray-300 text-white cursor-not-allowed">ล็อกไว้ที่ 45 นาที</Button>
            <Button
              variant="outlined"
              onClick={() => {
                const saved = parseInt(localStorage.getItem('security.inactivityMinutes'));
                setInactivityMinutes(Number.isFinite(saved) && saved > 0 ? saved : 45);
                const savedWarn = parseInt(localStorage.getItem('security.preLogoutWarnMinutes'));
                setPreWarnMinutes(Number.isFinite(savedWarn) && savedWarn >= 0 ? savedWarn : 1);
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              ใช้ค่าที่บันทึกไว้
            </Button>
          </div>
        </div>

        {/* Main Controls - Clean & Modern */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <MdSettings className="text-2xl text-gray-700" />
                </div>
                <div>
                  <Typography variant="h5" className="text-gray-800 font-bold">
                    การควบคุมการแจ้งเตือน
                  </Typography>
                  <Typography variant="paragraph" className="text-gray-600 text-sm">
                    จัดการการแจ้งเตือนแบบกลุ่ม
                  </Typography>
                </div>
              </div>
              <Button
                onClick={() => {
                  fetchUsers();
                  fetchNotificationStats();
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2 shadow-sm"
              >
                <MdRefresh className="text-lg" />
                รีเฟรช
              </Button>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Global Control - Enhanced */}
            <div ref={globalRef} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-blue-200">
                    <MdPeople className="text-2xl text-blue-600" />
                  </div>
                  <div>
                    <Typography variant="h6" className="text-gray-800 font-bold mb-1">
                      ควบคุมทั้งหมด
                    </Typography>
                    <Typography variant="paragraph" className="text-gray-600 text-sm">
                      เปิด/ปิดการแจ้งเตือนสำหรับผู้ใช้งานทั้งหมดที่ผูก LINE
                    </Typography>
                  </div>
                </div>
                                                        <div className="flex flex-col items-end gap-3">
                     <div className="flex items-center gap-3">
                       <Typography variant="paragraph" className="text-sm font-medium text-gray-700">
                         เปิดใช้งานทั้งหมด
                       </Typography>
                       <button
                         type="button"
                         disabled={loading || notificationStats.overall.users_with_line === 0}
                         className={`relative w-16 h-8 rounded-full transition-all duration-300 focus:outline-none border-2 transform hover:scale-105 ${
                           notificationStats.overall.users_enabled_line === notificationStats.overall.users_with_line && notificationStats.overall.users_with_line > 0
                             ? 'bg-green-400 border-green-500 shadow-lg shadow-green-200'
                             : 'bg-white border-gray-400 hover:border-gray-500'
                         } ${loading || notificationStats.overall.users_with_line === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                         onClick={() => {
                           if (loading || notificationStats.overall.users_with_line === 0) return;

                           const allEnabled = notificationStats.overall.users_enabled_line === notificationStats.overall.users_with_line;
                           console.log('Global switch clicked:', {
                             allEnabled,
                             users_enabled: notificationStats.overall.users_enabled_line,
                             users_with_line: notificationStats.overall.users_with_line,
                             will_toggle_to: !allEnabled
                           });

                           toggleAllNotifications(!allEnabled);
                         }}
                       >
                                                  <span
                           className={`absolute left-1 top-0.5 w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 ease-in-out ${
                             notificationStats.overall.users_enabled_line === notificationStats.overall.users_with_line && notificationStats.overall.users_with_line > 0
                               ? 'shadow-green-200'
                               : ''
                           }`}
                           style={{
                             transform: `translateX(${
                               notificationStats.overall.users_enabled_line === notificationStats.overall.users_with_line && notificationStats.overall.users_with_line > 0
                                 ? '28px'
                                 : '0px'
                             })`,
                             transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                             maxWidth: '24px', // Ensure thumb doesn't exceed container
                             maxHeight: '24px'
                           }}
                         >
                           <ImMail4 className={`w-4 h-4 transition-colors duration-300 ${
                             notificationStats.overall.users_enabled_line === notificationStats.overall.users_with_line && notificationStats.overall.users_with_line > 0
                               ? 'text-green-600'
                               : 'text-gray-500'
                           }`} />
                         </span>
                       </button>
                     </div>
                     <div className="text-center">
                       <Typography variant="paragraph" className={`text-xs font-medium px-3 py-1 rounded-full transition-colors duration-300 ${
                         notificationStats.overall.users_enabled_line === notificationStats.overall.users_with_line && notificationStats.overall.users_with_line > 0
                           ? 'bg-green-100 text-green-700 border border-green-400'
                           : 'bg-gray-100 text-gray-700 border border-gray-300'
                       }`}>
                         {notificationStats.overall.users_enabled_line}/{notificationStats.overall.users_with_line} เปิดใช้งาน
                       </Typography>
                       {notificationStats.overall.users_with_line === 0 && (
                         <Typography variant="paragraph" className="text-xs text-red-500 mt-1">
                           ไม่มีผู้ใช้ที่ผูก LINE
                         </Typography>
                       )}


                     </div>
                   </div>
                </div>
              </div>

            {/* Role-based Control - Redesigned */}
            <div ref={rolesRef} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-purple-200">
                  <MdPeople className="text-2xl text-purple-600" />
                </div>
                <div>
                  <Typography variant="h6" className="text-gray-800 font-bold mb-1">
                    ควบคุมตามบทบาท
                  </Typography>
                  <Typography variant="paragraph" className="text-gray-600 text-sm">
                    จัดการการแจ้งเตือนแยกตามตำแหน่งงาน
                  </Typography>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uniqueRoles.map(role => {
                    const roleUsers = users.filter(user => user.role_name === role && user.line_id !== 'ยังไม่ผูกบัญชี');
                    const enabledCount = roleUsers.filter(user => user.line_notify_enabled === 1).length;
                    const totalCount = roleUsers.length;

                    return (
                <div key={role} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
                        {role.charAt(0)}
                      </div>
                      <div>
                        <Typography variant="paragraph" className="font-bold text-gray-800 text-lg">
                          {role}
                        </Typography>
                        <Typography variant="paragraph" className="text-sm text-gray-500">
                          {totalCount} คนที่ผูก LINE
                        </Typography>
                      </div>
                    </div>
                    <div className="text-center">
                      <button
                        type="button"
                        disabled={loading || totalCount === 0}
                        className={`relative w-16 h-8 rounded-full transition-all duration-300 focus:outline-none border-2 shadow-sm hover:scale-105 ${
                          enabledCount === totalCount && totalCount > 0
                            ? 'bg-green-400 border-green-500 shadow-green-200'
                            : 'bg-gray-200 border-gray-300 hover:border-gray-400'
                        } ${loading || totalCount === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        onClick={() => {
                          if (totalCount === 0) return;
                          const allEnabled = enabledCount === totalCount;
                          toggleRoleNotification(role, !allEnabled);
                        }}
                      >
                        <span
                          className="absolute left-1 top-0.5 w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 ease-in-out"
                          style={{
                            transform: `translateX(${
                              enabledCount === totalCount && totalCount > 0
                                ? '28px'
                                : '0px'
                            })`,
                            transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
                          }}
                        >
                          <ImMail4 className={`w-4 h-4 ${
                            enabledCount === totalCount && totalCount > 0
                              ? 'text-green-600'
                              : 'text-gray-500'
                          } transition-colors duration-300`} />
                        </span>
                      </button>
                      <div className="mt-3">
                        <Typography variant="paragraph" className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors duration-300 ${
                          enabledCount === totalCount && totalCount > 0
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                        }`}>
                          {enabledCount}/{totalCount} เปิดใช้งาน
                        </Typography>
                        {totalCount === 0 && (
                          <Typography variant="paragraph" className="text-xs text-red-500 mt-2">
                            ไม่มีผู้ใช้ที่ผูก LINE
                          </Typography>
                        )}
                      </div>
                    </div>
                         </div>
    </div>
  );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-rose-50 via-red-50 to-pink-50 p-6 rounded-2xl border border-rose-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl border border-rose-200">
              <MdShield className="text-2xl text-rose-600" />
          </div>
          <div>
              <Typography variant="h5" className="text-gray-800 font-bold">การตั้งค่าความปลอดภัย</Typography>
              <Typography variant="small" className="text-gray-600">ยืนยันอีเมลและตั้งรหัสผ่านใหม่อย่างปลอดภัย</Typography>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className={`flex items-center gap-2 ${!otpSent ? 'text-blue-600' : 'text-green-600'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${!otpSent ? 'bg-blue-600' : 'bg-green-600'}`}>1</span>
              <span className="font-medium">ขอ OTP</span>
            </div>
            <div className="w-10 h-[2px] bg-gray-300" />
            <div className={`flex items-center gap-2 ${otpSent ? 'text-blue-600' : 'text-gray-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${otpSent ? 'bg-blue-600' : 'bg-gray-400'}`}>2</span>
              <span className="font-medium">ตั้งรหัสผ่าน</span>
            </div>
          </div>
        </div>
      </div>

      <Card className="shadow-lg border-0">
        <CardBody className="p-6 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Request OTP */}
            <div className="rounded-xl border border-gray-100 p-5 bg-gradient-to-br from-white to-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <MdMarkEmailRead className="text-xl text-blue-600" />
                <Typography variant="h6" className="font-semibold text-gray-800">ยืนยันอีเมลเพื่อรับ OTP</Typography>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">อีเมล</label>
                <Input
                  type="email"
                  name="email"
                  value={securityForm.email}
                  onChange={handleSecurityInputChange}
                  placeholder="your@email.com"
                  className="!border !border-gray-300 bg-white"
                  labelProps={{ className: 'hidden' }}
                />
                <div className="flex items-center gap-3">
                  <Button
                    onClick={requestPasswordOtp}
                    disabled={securityLoading || !securityForm.email || resendCooldownSec > 0}
                    className={`text-white ${resendCooldownSec > 0 ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {securityLoading ? 'กำลังส่ง...' : (resendCooldownSec > 0 ? `ส่งอีกครั้งใน ${resendCooldownSec}s` : 'ส่ง OTP')}
                  </Button>
                  {otpSent && (
                    <span className="inline-flex items-center gap-1 text-green-700 text-sm">
                      <MdCheckCircle /> ส่งไปยังอีเมลแล้ว (หมดอายุ 5 นาที)
                    </span>
                  )}
                </div>
                {resendCooldownSec > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <MdTimer />
                    กรุณารอสักครู่ก่อนส่งใหม่
                  </div>
                )}
              </div>
            </div>

            {/* Right: Set new password */}
            <div className="rounded-xl border border-gray-100 p-5 bg-gradient-to-br from-white to-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <MdLockReset className="text-xl text-purple-600" />
                <Typography variant="h6" className="font-semibold text-gray-800">ตั้งรหัสผ่านใหม่</Typography>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">รหัส OTP</label>
                  <Input
                    type="text"
                    name="otp"
                    value={securityForm.otp}
                    onChange={handleSecurityInputChange}
                    placeholder="กรอกรหัส 6 หลัก"
                    className="!border !border-gray-300 bg-white"
                    labelProps={{ className: 'hidden' }}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">รหัสผ่านใหม่</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={securityForm.password}
                      onChange={handleSecurityInputChange}
                      placeholder="อย่างน้อย 8 ตัวอักษร มีตัวอักษรและตัวเลข"
                      className="!border !border-gray-300 bg-white pr-12"
                      labelProps={{ className: 'hidden' }}
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                    </button>
                  </div>
                  {/* Strength Bar */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-medium ${passwordStrength.textColor}`}>{passwordStrength.label}</span>
                      <span className="text-gray-500">{passwordStrength.score}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-2 ${passwordStrength.color}`} style={{ width: `${passwordStrength.score}%` }}></div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      {[
                        { ok: securityForm.password.length >= 8, text: 'อย่างน้อย 8 ตัว' },
                        { ok: /[A-Za-z]/.test(securityForm.password), text: 'มีตัวอักษร' },
                        { ok: /[0-9]/.test(securityForm.password), text: 'มีตัวเลข' }
                      ].map((r, idx) => (
                        <div key={idx} className={`px-2 py-1 rounded border ${r.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                          {r.text}
                        </div>
                      ))}
                    </div>
                  </div>
                  {passwordHint && (
                    <Typography variant="small" className="text-red-600 mt-1">{passwordHint}</Typography>
                  )}
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">ยืนยันรหัสผ่าน</label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={securityForm.confirmPassword}
                      onChange={handleSecurityInputChange}
                      placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                      className="!border !border-gray-300 bg-white pr-12"
                      labelProps={{ className: 'hidden' }}
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" onClick={() => setShowConfirm(v => !v)}>
                      {showConfirm ? <MdVisibilityOff /> : <MdVisibility />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Password Policy */}
          <div className="rounded-xl border border-gray-100 p-5 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <MdShield className="text-xl text-gray-700" />
              <Typography variant="h6" className="font-semibold text-gray-800">นโยบายรหัสผ่าน</Typography>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">ความยาวขั้นต่ำ</label>
                <Input
                  type="number"
                  min={6}
                  max={64}
                  value={passwordPolicy.minLength}
                  onChange={(e) => setPasswordPolicy(p => ({ ...p, minLength: Math.max(6, Math.min(64, parseInt(e.target.value || '0'))) }))}
                  className="!border !border-gray-300 bg-white w-28"
                  labelProps={{ className: 'hidden' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'requireLetter', label: 'ต้องมีตัวอักษร' },
                  { key: 'requireNumber', label: 'ต้องมีตัวเลข' },
                  { key: 'requireUppercase', label: 'ต้องมีตัวพิมพ์ใหญ่' },
                  { key: 'requireSpecial', label: 'ต้องมีอักขระพิเศษ' },
                ].map(opt => (
                  <label key={opt.key} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={passwordPolicy[opt.key]}
                      onChange={(e) => setPasswordPolicy(p => ({ ...p, [opt.key]: e.target.checked }))}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button
                onClick={() => {
                  localStorage.setItem('security.passwordPolicy', JSON.stringify(passwordPolicy));
                  setPasswordHint(validatePassword(securityForm.password));
                  setPasswordStrength(getPasswordStrength(securityForm.password));
                  setNotificationData({ title: 'บันทึกแล้ว', message: 'อัปเดตนโยบายรหัสผ่านสำเร็จ', type: 'success' });
                  setShowNotification(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                บันทึกนโยบาย
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  try {
                    const saved = JSON.parse(localStorage.getItem('security.passwordPolicy') || '{}');
                    setPasswordPolicy({
                      minLength: Number.isFinite(saved.minLength) ? saved.minLength : 8,
                      requireLetter: typeof saved.requireLetter === 'boolean' ? saved.requireLetter : true,
                      requireNumber: typeof saved.requireNumber === 'boolean' ? saved.requireNumber : true,
                      requireUppercase: typeof saved.requireUppercase === 'boolean' ? saved.requireUppercase : false,
                      requireSpecial: typeof saved.requireSpecial === 'boolean' ? saved.requireSpecial : false,
                    });
                  } catch {}
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                ใช้ค่าที่บันทึกไว้
              </Button>
            </div>
          </div>

          {/* Auto-logout settings */}
          <div className="rounded-xl border border-gray-100 p-5 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <MdLock className="text-xl text-gray-700" />
              <Typography variant="h6" className="font-semibold text-gray-800">การออกจากระบบอัตโนมัติ</Typography>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="text-sm font-semibold text-gray-700">ไม่มีการใช้งานเป็นเวลา</label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min={5}
                    max={240}
                    value={inactivityMinutes}
                    onChange={(e) => setInactivityMinutes(Math.max(5, Math.min(240, parseInt(e.target.value || '0'))))}
                    className="!border !border-gray-300 bg-white w-28"
                    labelProps={{ className: 'hidden' }}
                  />
                  <span className="text-gray-700">นาที</span>
                </div>
                <Typography variant="small" className="text-gray-500 mt-1">แนะนำ 15–60 นาที</Typography>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">เตือนล่วงหน้า</label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min={0}
                    max={120}
                    value={preWarnMinutes}
                    onChange={(e) => setPreWarnMinutes(Math.max(0, Math.min(120, parseInt(e.target.value || '0'))))}
                    className="!border !border-gray-300 bg-white w-28"
                    labelProps={{ className: 'hidden' }}
                  />
                  <span className="text-gray-700">นาทีก่อนหมดเวลา</span>
                </div>
                <Typography variant="small" className="text-gray-500 mt-1">0 = ไม่เตือน</Typography>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    localStorage.setItem('security.inactivityMinutes', String(inactivityMinutes));
                    window.dispatchEvent(new CustomEvent('security:inactivityUpdated', { detail: String(inactivityMinutes) }));
                    localStorage.setItem('security.preLogoutWarnMinutes', String(preWarnMinutes));
                    window.dispatchEvent(new CustomEvent('security:preWarnUpdated', { detail: String(preWarnMinutes) }));
                    setNotificationData({ title: 'บันทึกแล้ว', message: `ตั้งค่าออกจากระบบอัตโนมัติ ${inactivityMinutes} นาที`, type: 'success' });
                    setShowNotification(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  บันทึกการตั้งค่า
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    const saved = parseInt(localStorage.getItem('security.inactivityMinutes'));
                    setInactivityMinutes(Number.isFinite(saved) && saved > 0 ? saved : 45);
                    const savedWarn = parseInt(localStorage.getItem('security.preLogoutWarnMinutes'));
                    setPreWarnMinutes(Number.isFinite(savedWarn) && savedWarn >= 0 ? savedWarn : 1);
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  ใช้ค่าที่บันทึกไว้
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <MdLock className="text-gray-700" />
              ข้อมูลของคุณถูกปกป้องและเข้ารหัสระหว่างการส่ง
            </div>
            <Button
              onClick={submitPasswordReset}
              disabled={securityLoading || !otpSent}
              className={`text-white ${securityLoading ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
              {securityLoading ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'ยืนยันเปลี่ยนรหัสผ่าน'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  const renderStorageSettings = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <MdStorage className="text-2xl text-green-600" />
          </div>
          <div>
            <Typography variant="h5" className="text-gray-800 font-bold">
              การตั้งค่าการจัดเก็บ Cloudinary
            </Typography>
            <Typography variant="paragraph" className="text-gray-600">
              จัดการการตั้งค่า Cloudinary สำหรับการจัดเก็บรูปภาพและไฟล์
            </Typography>
          </div>
        </div>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
          <div className="flex items-center gap-3">
            <MdStorage className="text-2xl text-blue-600" />
            <Typography variant="h6" className="text-gray-800 font-semibold">
              การตั้งค่า Cloudinary
            </Typography>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          <div className="space-y-6">
            {/* Cloudinary Status */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${cloudinaryConfig.is_configured ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <Typography variant="h6" className="text-gray-800 font-semibold">
                    สถานะการเชื่อมต่อ Cloudinary
                  </Typography>
                </div>
                <Typography variant="paragraph" className={`font-medium ${cloudinaryConfig.is_configured ? 'text-green-600' : 'text-red-600'}`}>
                  {cloudinaryConfig.is_configured ? 'เชื่อมต่อแล้ว' : 'ยังไม่ได้เชื่อมต่อ'}
                </Typography>
              </div>
            </div>

            {/* Cloudinary Configuration */}
            <div className="space-y-4">
              <Typography variant="h6" className="text-gray-800 font-semibold">
                ข้อมูลการตั้งค่า
              </Typography>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Cloud Name</label>
                  <Input
                    type="text"
                    value={cloudinaryConfig.cloud_name || ''}
                    placeholder="your-cloud-name"
                    className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-blue-500 focus:!border-t-blue-500 focus:ring-blue-500/20"
                    labelProps={{ className: "hidden" }}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">API Key</label>
                  <Input
                    type="text"
                    value={cloudinaryConfig.api_key || ''}
                    placeholder="your-api-key"
                    className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-blue-500 focus:!border-t-blue-500 focus:ring-blue-500/20"
                    labelProps={{ className: "hidden" }}
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
              <Button
                onClick={testCloudinaryConnection}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    กำลังทดสอบ...
                  </>
                ) : (
                  <>
                    <MdCheckCircle className="text-lg" />
                    ทดสอบการเชื่อมต่อ
                  </>
                )}
              </Button>

              <Button
                onClick={getCloudinaryUsageStats}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <MdInfo className="text-lg" />
                ดูสถิติการใช้งาน
              </Button>

              <Button
                onClick={createCloudinaryFolderStructure}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    กำลังสร้าง...
                  </>
                ) : (
                  <>
                    <MdStorage className="text-lg" />
                    สร้าง Folder Structure
                  </>
                )}
              </Button>

              <Button
                onClick={listCloudinaryFolderStructure}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <MdInfo className="text-lg" />
                ดูรายการ Folder
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Cloudinary Features */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-200">
          <div className="flex items-center gap-3">
            <MdStorage className="text-2xl text-purple-600" />
            <Typography variant="h6" className="text-gray-800 font-semibold">
              ฟีเจอร์ Cloudinary
            </Typography>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <Typography variant="h6" className="text-blue-600 font-semibold">อัปโหลดไฟล์</Typography>
              </div>
              <Typography variant="paragraph" className="text-gray-600 text-sm">
                รองรับการอัปโหลดรูปภาพและไฟล์ต่างๆ ไปยัง Cloudinary
              </Typography>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <Typography variant="h6" className="text-green-600 font-semibold">แปลงรูปภาพ</Typography>
              </div>
              <Typography variant="paragraph" className="text-gray-600 text-sm">
                ปรับขนาดและคุณภาพรูปภาพอัตโนมัติ
              </Typography>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <Typography variant="h6" className="text-purple-600 font-semibold">จัดเก็บปลอดภัย</Typography>
              </div>
              <Typography variant="paragraph" className="text-gray-600 text-sm">
                ไฟล์ถูกจัดเก็บอย่างปลอดภัยในระบบ Cloud
              </Typography>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  const renderLanguageSettings = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <MdLanguage className="text-2xl text-purple-600" />
          </div>
          <div>
            <Typography variant="h5" className="text-gray-800 font-bold">
              การตั้งค่าภาษา
            </Typography>
            <Typography variant="paragraph" className="text-gray-600">
              จัดการภาษาและภูมิภาคของระบบ
            </Typography>
          </div>
        </div>
      </div>

      <Card className="shadow-lg border-0">
        <CardBody className="p-6">
          <div className="text-center py-12">
            <MdLanguage className="text-6xl text-gray-300 mx-auto mb-4" />
            <Typography variant="h6" className="text-gray-500 mb-2">
              ฟีเจอร์นี้จะเปิดให้ใช้งานเร็วๆ นี้
            </Typography>
            <Typography variant="paragraph" className="text-gray-400">
              การตั้งค่าภาษาจะพร้อมใช้งานในเวอร์ชันถัดไป
            </Typography>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  const renderContent = () => {
    if (activeTab === 'notifications') return renderNotificationSettings();
    if (activeTab === 'profile') return <PersonalInfoEdit />;
    return renderNotificationSettings();
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <MdSettings className="text-3xl text-white" />
            </div>
            <div>
              <Typography variant="h3" className="text-gray-800 font-bold">
                ตั้งค่าระบบ
              </Typography>
              <Typography variant="paragraph" className="text-gray-600">
                จัดการการตั้งค่าระบบและการกำหนดค่าต่างๆ
              </Typography>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Card className="shadow-lg border-0 mb-6">
          <CardBody className="p-0">
            <div className="border-b border-gray-200">
              <div className="flex">
                {tabs.map(({ label, value, icon }) => (
                  <button
                    key={value}
                    onClick={() => setActiveTab(value)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 ${
                      activeTab === value
                        ? 'text-blue-600 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50 border-transparent'
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Content */}
        {renderContent()}
      </div>

      {/* Notification */}
      <Notification
        show={showNotification}
        title={notificationData.title}
        message={notificationData.message}
        type={notificationData.type}
        onClose={() => setShowNotification(false)}
      />
    </div>
  );
};

export default SystemSettings;