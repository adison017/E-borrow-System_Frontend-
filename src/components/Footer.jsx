import { BiGlobe } from "react-icons/bi"; 
import React, { useState, useEffect } from "react";
import { FaFacebookF, FaInstagram, FaLine } from "react-icons/fa";
import { RiMailLine } from "react-icons/ri";
import { API_BASE } from '../utils/api';

function Footer() {
  const [footerData, setFooterData] = useState({
    university_name: 'มหาวิทยาลัยมหาสารคาม',
    faculty_name: 'คณะวิทยาการสารสนเทศ',
    address: 'ตำบลขามเรียง อำเภอกันทรวิชัย จังหวัดมหาสารคาม 44150',
    phone: '+66 4375 4333',
    email: 'equipment@msu.ac.th',
    website: 'https://it.msu.ac.th',
    facebook_url: 'https://facebook.com',
    line_url: 'https://line.me',
    instagram_url: 'https://www.instagram.com',
    copyright_text: 'ระบบยืม-คืนครุภัณฑ์'
  });

  useEffect(() => {
    fetchFooterData();
  }, []);

  const fetchFooterData = async () => {
    try {
      const response = await fetch(`${API_BASE}/footer-settings`);
      
      // Check if response is ok (status 200-299)
      if (!response.ok) {
        console.warn(`Footer settings API returned ${response.status}, using default values`);
        return; // Use default footer data
      }
      
      const data = await response.json();
      if (data.success && data.data) {
        setFooterData(data.data);
      }
    } catch (error) {
      console.warn('Footer settings not available, using default values:', error.message);
      // Continue with default footer data - don't throw error
    }
  };

  return (
    <footer className="bg-gradient-to-br from-indigo-950 via-blue-900 to-blue-700 text-white pt-12 pb-20 rounded-t-3xl mt-8 shadow-2xl">
      <div className="container mx-auto max-w-5xl px-6 ">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 shadow-2xl p-5 rounded-4xl">
          {/* University Logo and Basic Info */}
          <div className="flex flex-col items-center md:items-start">
            <div className="mt-5 bg-white p-4 rounded-2xl mb-4 shadow-xl border-2 border-blue-200 flex items-center justify-center transform hover:scale-105 transition-transform">
              <img
                src="/msu.png"
                alt="Mahasarakham University Logo"
                className="h-30 w-30 object-contain"
              />
            </div>
            <h3 className="text-2xl font-bold text-blue-100 tracking-wide text-center md:text-left">{footerData.copyright_text}</h3>
            <p className="text-sm text-blue-200 font-medium mb-4">
              © {new Date().getFullYear()} {footerData.university_name}
            </p>
          </div>

          {/* Service Hours */}
          <div className="flex flex-col items-center">
            <h3 className="text-2xl font-semibold text-blue-100 ">เวลาให้บริการ</h3>
            <div className="bg-gradient-to-br from-blue-800/40 to-indigo-800/40 mt-4 rounded-2xl">
              <div className="text-center text-sm space-y-3">
                <div className="bg-blue-700/50 p-2 rounded-xl">
                  <p className="font-bold text-blue-100 text-base">วันจันทร์ - วันศุกร์</p>
                  <p className="text-white font-medium text-md">08:30 - 16:30 น.</p>
                </div>
                <div className="bg-red-700/50 p-2 rounded-xl">
                  <p className="font-bold text-red-100 text-base">วันเสาร์ - วันอาทิตย์</p>
                  <p className="text-red-200 text-xs">ปิดให้บริการ</p>
                </div>
                <div className="mb-4 p-2 bg-amber-400/50 rounded-full">
                  <p className="text-xs text-green-100 font-medium">💡 หมายเหตุ: สามารถยืม-คืนออนไลน์ได้ตลอด 24 ชั่วโมง</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info and Social Media */}
          <div className="flex flex-col items-center md:items-end">
            <h3 className="text-2xl font-semibold mt-1 text-blue-100">ติดต่อเรา</h3>
            <div className="bg-gradient-to-br from-blue-800/40 to-indigo-800/40 mt-3 rounded-2xl w-full">
              <div className="text-sm text-blue-100 mb-4 text-center md:text-right space-y-1">
                <p className="font-bold text-base text-white">{footerData.university_name}</p>
                <p className="text-blue-200">{footerData.faculty_name}</p>
                <p className="text-blue-200 leading-relaxed">{footerData.address}</p>
              </div>
              <div className="text-sm text-blue-100 mb-4 text-center md:text-right space-y-1">
                <p><span className="font-semibold text-blue-200">📞 Tel:</span> <span className="text-white">{footerData.phone}</span></p>
                <p><span className="font-semibold text-blue-200">✉️ Email:</span> <span className="text-white">{footerData.email}</span></p>
              </div>
              <div className="flex justify-center md:justify-end space-x-3 mt-4">
                <a
                  href={footerData.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl hover:from-blue-500 hover:to-blue-600 transform hover:scale-110 transition-all shadow-lg border border-blue-400/50"
                  title="Facebook"
                >
                  <FaFacebookF className="w-5 h-5 text-white" />
                </a>
                <a
                  href={footerData.line_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl hover:from-green-400 hover:to-green-500 transform hover:scale-110 transition-all shadow-lg border border-green-400/50"
                  title="Line"
                >
                  <FaLine className="w-5 h-5 text-white" />
                </a>
                <a
                  href={footerData.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-br from-pink-500 to-pink-600 p-3 rounded-xl hover:from-pink-400 hover:to-pink-500 transform hover:scale-110 transition-all shadow-lg border border-pink-400/50"
                  title="Instagram"
                >
                  <FaInstagram className="w-5 h-5 text-white" />
                </a>
                <a
                  href={footerData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl hover:from-indigo-400 hover:to-indigo-500 transform hover:scale-110 transition-all shadow-lg border border-indigo-400/50"
                  title="Website"
                >
                  <BiGlobe className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;