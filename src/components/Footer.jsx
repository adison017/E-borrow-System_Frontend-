import React from "react";
import { FaFacebookF, FaInstagram, FaLine } from "react-icons/fa";
import { RiMailLine } from "react-icons/ri";

function Footer() {
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
            <h3 className="text-xl font-bold mb-2 text-blue-200 tracking-wide">Equipment Borrowing System</h3>
            <p className="text-sm text-gray-200">
              © {new Date().getFullYear()} Mahasarakham University
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
              Mahasarakham University<br />
              Khamriang Sub-District, Kantarawichai District<br />
              Maha Sarakham 44150, Thailand
            </p>
            <p className="text-sm text-gray-200 mb-3 text-center md:text-right">
              <span className="font-medium">Tel:</span> +66 4375 4333<br />
              <span className="font-medium">Email:</span> equipment@msu.ac.th
            </p>
            <div className="flex space-x-3 mt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow"
                title="Facebook"
              >
                <FaFacebookF className="w-5 h-5" />
              </a>
              <a
                href="https://line.me"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-green-500 hover:text-white transition-all shadow"
                title="Line"
              >
                <FaLine className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-pink-500 hover:text-white transition-all shadow"
                title="Instagram"
              >
                <FaInstagram className="w-5 h-5" />
              </a>
              <a
                href="mailto:equipment@msu.ac.th"
                className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-yellow-400 hover:text-white transition-all shadow"
                title="Contact Us"
              >
                <RiMailLine className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;