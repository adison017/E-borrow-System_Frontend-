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
    <footer className="bg-gradient-to-r from-indigo-950 to-blue-700 text-white pt-1 pb-20  rounded-t-2xl mt-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* University Logo and Basic Info */}
          <div className="flex flex-col items-center md:items-start">
            <div className="bg-white p-3 rounded-full mb-3 shadow-md flex items-center justify-center">
              <img
                src="/msu.png"
                alt="Mahasarakham University Logo"
                className="h-16 w-16 object-contain"
              />
            </div>
            <h3 className="text-xl font-bold mb-2 text-blue-200 tracking-wide">{footerData.copyright_text}</h3>
            <p className="text-sm text-gray-200">
              © {new Date().getFullYear()} {footerData.university_name}
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center md:items-center">
            <h3 className="text-lg font-semibold mb-3 text-blue-100">Quick Links</h3>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <a href="/about" className="px-4 py-1 rounded-full bg-blue-800/60 hover:bg-blue-600 text-white text-sm font-medium transition-all shadow">
                About System
              </a>
              <a href="/how-to-use" className="px-4 py-1 rounded-full bg-blue-800/60 hover:bg-blue-600 text-white text-sm font-medium transition-all shadow">
                How to Use
              </a>
              <a href="/faq" className="px-4 py-1 rounded-full bg-blue-800/60 hover:bg-blue-600 text-white text-sm font-medium transition-all shadow">
                FAQ
              </a>
              <a href="/contact" className="px-4 py-1 rounded-full bg-blue-800/60 hover:bg-blue-600 text-white text-sm font-medium transition-all shadow">
                Contact Support
              </a>
            </div>
          </div>

          {/* Contact Info and Social Media */}
          <div className="flex flex-col items-center md:items-end">
            <h3 className="text-lg font-semibold mb-3 text-blue-100">Contact Us</h3>
            <p className="text-sm text-gray-200 mb-2 text-center md:text-right">
              {footerData.university_name}<br />
              {footerData.faculty_name}<br />
              {footerData.address}
            </p>
            <p className="text-sm text-gray-200 mb-3 text-center md:text-right">
              <span className="font-medium">Tel:</span> {footerData.phone}<br />
              <span className="font-medium">Email:</span> {footerData.email}
            </p>
            <div className="flex space-x-3 mt-2">
              <a
                href={footerData.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 bg-opacity-20 p-2 rounded-full hover:bg-blue-700 hover:text-white transition-all shadow"
                title="Facebook"
              >
                <FaFacebookF className="w-5 h-5" />
              </a>
              <a
                href={footerData.line_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 bg-opacity-20 p-2 rounded-full hover:bg-green-600 hover:text-white transition-all shadow"
                title="Line"
              >
                <FaLine className="w-5 h-5" />
              </a>
              <a
                href={footerData.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-pink-500 bg-opacity-20 p-2 rounded-full hover:bg-pink-600 hover:text-white transition-all shadow"
                title="Instagram"
              >
                <FaInstagram className="w-5 h-5" />
              </a>
              <a
                href={footerData.website}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 bg-opacity-20 p-2 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow"
                title="Contact Us"
              >
                <BiGlobe className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;