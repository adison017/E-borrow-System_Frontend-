import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { API_BASE } from '../../utils/api';
import { 
  FaUniversity, 
  FaGraduationCap, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaEnvelope, 
  FaGlobe, 
  FaFacebookF, 
  FaLine, 
  FaInstagram, 
  FaCopyright,
  FaEye,
  FaCheck,
  FaSpinner
} from 'react-icons/fa';

const FooterSettings = () => {
  const [settings, setSettings] = useState({
    university_name: '',
    faculty_name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    facebook_url: '',
    line_url: '',
    instagram_url: '',
    copyright_text: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFooterSettings();
  }, []);

  const fetchFooterSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/footer-settings`);
      
      if (!response.ok) {
        console.warn(`Footer settings API returned ${response.status}, using default values`);
        return;
      }
      
      const data = await response.json();
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (error) {
      console.warn('Footer settings not available:', error.message);
      toast.warn('ไม่สามารถโหลดการตั้งค่า Footer ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/footer-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        toast.error('ไม่สามารถบันทึกการตั้งค่าได้ กรุณาลองใหม่อีกครั้ง');
        return;
      }

      const data = await response.json();
      if (data.success) {
        toast.success('บันทึกการตั้งค่า Footer สำเร็จ');
        // Refresh page to update footer
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error) {
      console.error('Error saving footer settings:', error);
      toast.error('ไม่สามารถบันทึกการตั้งค่าได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl ">
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-black mb-4">
            การตั้งค่า Footer
          </h1>
          <p className="text-md text-gray-600 max-w-2xl mx-auto leading-relaxed">
            จัดการข้อมูลที่แสดงใน Footer ของเว็บไซต์
          </p>
        </div>

        {/* Main Form */}
        <div className="backdrop-blur-xl bg-white/70 rounded-3xl border border-white/20 overflow-hidden">
          <div className="p-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-focus-within:bg-blue-200 transition-colors">
                      <FaUniversity className="w-4 h-4 text-blue-600" />
                    </div>
                    ชื่อมหาวิทยาลัย
                  </label>
                  <input
                    type="text"
                    value={settings.university_name}
                    onChange={(e) => handleInputChange('university_name', e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md"
                    placeholder="ชื่อมหาวิทยาลัย"
                  />
                </div>

                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-focus-within:bg-blue-200 transition-colors">
                      <FaGraduationCap className="w-4 h-4 text-blue-600" />
                    </div>
                    ชื่อคณะ
                  </label>
                  <input
                    type="text"
                    value={settings.faculty_name}
                    onChange={(e) => handleInputChange('faculty_name', e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md"
                    placeholder="ชื่อคณะ"
                  />
                </div>

                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-focus-within:bg-blue-200 transition-colors">
                      <FaMapMarkerAlt className="w-4 h-4 text-blue-600" />
                    </div>
                    ที่อยู่
                  </label>
                  <textarea
                    value={settings.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md resize-none"
                    placeholder="ที่อยู่ของหน่วยงาน"
                  />
                </div>

                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-focus-within:bg-blue-200 transition-colors">
                      <FaPhone className="w-4 h-4 text-blue-600" />
                    </div>
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md"
                    placeholder="เบอร์โทรศัพท์"
                  />
                </div>

                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-focus-within:bg-blue-200 transition-colors">
                      <FaEnvelope className="w-4 h-4 text-blue-600" />
                    </div>
                    อีเมล
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md"
                    placeholder="อีเมลติดต่อ"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-focus-within:bg-blue-200 transition-colors">
                      <FaFacebookF className="w-4 h-4 text-blue-600" />
                    </div>
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    value={settings.facebook_url}
                    onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md"
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>

                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-focus-within:bg-green-200 transition-colors">
                      <FaLine className="w-4 h-4 text-green-600" />
                    </div>
                    Line URL
                  </label>
                  <input
                    type="url"
                    value={settings.line_url}
                    onChange={(e) => handleInputChange('line_url', e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md"
                    placeholder="https://line.me/yourline"
                  />
                </div>

                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center mr-3 group-focus-within:bg-pink-200 transition-colors">
                      <FaInstagram className="w-4 h-4 text-pink-600" />
                    </div>
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    value={settings.instagram_url}
                    onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md"
                    placeholder="https://instagram.com/yourpage"
                  />
                </div>
                
                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-focus-within:bg-blue-200 transition-colors">
                      <FaGlobe className="w-4 h-4 text-blue-600" />
                    </div>
                    เว็บไซต์
                  </label>
                  <input
                    type="url"
                    value={settings.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-focus-within:bg-gray-200 transition-colors">
                      <FaCopyright className="w-4 h-4 text-gray-600" />
                    </div>
                    ข้อความลิขสิทธิ์
                  </label>
                  <input
                    type="text"
                    value={settings.copyright_text}
                    onChange={(e) => handleInputChange('copyright_text', e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md"
                    placeholder="ข้อความลิขสิทธิ์"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-16 flex justify-center">
              <button
                onClick={handleSave}
                disabled={saving}
                className="group relative px-12 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-3xl transform hover:scale-105 hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-4 overflow-hidden shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center space-x-4">
                  {saving ? (
                    <>
                      <FaSpinner className="animate-spin w-6 h-6" />
                      <span className="text-md font-semibold">กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-md font-semibold">บันทึกการตั้งค่า</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FooterSettings;