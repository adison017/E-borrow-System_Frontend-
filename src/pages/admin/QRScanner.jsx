import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircleIcon as ErrorIcon, MagnifyingGlassIcon, QrCodeIcon } from "@heroicons/react/24/solid";
import { BrowserMultiFormatReader, ChecksumException, FormatException, NotFoundException } from "@zxing/library";
import { MdClose, MdArrowBack } from "react-icons/md";
import { BiPackage } from "react-icons/bi";
import { FaInfoCircle, FaCalendarAlt, FaMapMarkerAlt, FaMoneyBillWave, FaBoxes, FaTag, FaClipboardList, FaCamera, FaSearch } from "react-icons/fa";
import { TbCategory } from "react-icons/tb";
import { getEquipment } from '../../utils/api';

const QRScanner = () => {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [scannedEquipment, setScannedEquipment] = useState(null);
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const codeReader = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    initializeScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const initializeScanner = async () => {
    if (scanning) return;
    setScanning(true);
    setError(null);

    try {
      if (!videoRef.current) {
        console.warn("Video element not ready for scanner initialization.");
        setScanning(false);
        return;
      }

      codeReader.current = new BrowserMultiFormatReader();
      const devices = await codeReader.current.listVideoInputDevices();

      if (!devices || devices.length === 0) {
        throw new Error("ไม่พบอุปกรณ์กล้อง");
      }

      const rearCamera = devices.find((device) =>
        device.label.toLowerCase().includes("back") ||
        device.label.toLowerCase().includes("rear")
      );
      const deviceId = rearCamera?.deviceId || devices[0]?.deviceId;

      if (!deviceId) throw new Error("ไม่สามารถเลือกกล้องได้");

      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }

      await codeReader.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            stopScanner();
            handleScanComplete(result.getText());
          } else if (err && !(err instanceof NotFoundException) && !(err instanceof ChecksumException) && !(err instanceof FormatException)) {
            console.warn("Scanning error:", err);
          }
        }
      );
    } catch (e) {
      console.error("Scanner initialization error:", e);
      setError(e.message || "เกิดข้อผิดพลาดในการเริ่มต้นสแกนเนอร์");
      setScanning(false);
      if (codeReader.current) {
        codeReader.current.reset();
        codeReader.current = null;
      }
    }
  };

  const stopScanner = () => {
    try {
      if (codeReader.current) {
        codeReader.current.reset();
        codeReader.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    } catch (e) {
      console.error("Error stopping scanner:", e);
    } finally {
      setScanning(false);
    }
  };

  const handleScanComplete = async (scannedCode) => {
    setIsLoading(true);
    try {
      const equipmentList = await getEquipment();
      const equipment = equipmentList.find(item => item.item_code === scannedCode);

      if (equipment) {
        setScannedEquipment(equipment);
        setShowEquipmentDialog(true);
      } else {
        alert('ไม่พบครุภัณฑ์ที่สแกน กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error) {
      console.error('Error finding equipment:', error);
      alert('เกิดข้อผิดพลาดในการค้นหาครุภัณฑ์');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualInput = async (manualCode) => {
    setIsLoading(true);
    try {
      const equipmentList = await getEquipment();
      const equipment = equipmentList.find(item => item.item_code === manualCode);

      if (equipment) {
        setScannedEquipment(equipment);
        setShowEquipmentDialog(true);
      } else {
        alert('ไม่พบครุภัณฑ์ที่ป้อน กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error) {
      console.error('Error finding equipment:', error);
      alert('เกิดข้อผิดพลาดในการค้นหาครุภัณฑ์');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSearch = () => {
    if (manualCode.trim()) {
      handleManualInput(manualCode.trim());
    }
  };

  const closeEquipmentDialog = () => {
    setShowEquipmentDialog(false);
    setScannedEquipment(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'พร้อมใช้งาน': return 'text-green-600 bg-green-50';
      case 'ถูกยืม': return 'text-blue-600 bg-blue-50';
      case 'กำลังซ่อม': return 'text-orange-600 bg-orange-50';
      case 'ชำรุด': return 'text-red-600 bg-red-50';
      case 'รออนุมัติซ่อม': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 sm:p-3 rounded-xl hover:bg-gray-100/80 transition-all duration-200 touch-manipulation select-none group"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <MdArrowBack className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-gray-800 transition-colors" />
              </button>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <BiPackage className="text-white text-lg sm:text-xl" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900">สแกน QR Code ครุภัณฑ์</h1>
                  <p className="text-xs sm:text-sm text-gray-500">สแกน QR Code เพื่อดูรายละเอียดครุภัณฑ์</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Scanner Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/50 p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <QrCodeIcon className="text-white text-lg sm:text-xl" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">สแกน QR Code</h2>
                <p className="text-xs sm:text-sm text-gray-500">ใช้กล้องเพื่อสแกน QR Code</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-red-200 flex items-start space-x-3 mb-6">
                <ErrorIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm sm:text-base font-medium text-red-700">เกิดข้อผิดพลาด</p>
                  <p className="text-xs sm:text-sm text-red-600">{error}</p>
                </div>
                <button
                  className="ml-auto text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 underline whitespace-nowrap touch-manipulation select-none px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                  onClick={() => { initializeScanner(); }}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  ลองอีกครั้ง
                </button>
              </div>
            )}

            <div className="text-center mb-6">
              <p className="text-sm sm:text-base text-gray-600">
                วาง QR Code หรือ Barcode ของครุภัณฑ์ให้อยู่ในกรอบเพื่อสแกน
              </p>
            </div>

            {/* Scanner Frame */}
            <div className="relative mb-6">
              <div
                className="relative w-full aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl mx-auto border-4 border-white/20"
                ref={scannerRef}
              >
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  autoPlay
                  playsInline
                />
                {scanning && !error && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-3/4 h-3/4 border-2 border-dashed border-white/60 rounded-lg animate-pulse"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1/2 h-1/2 border-2 border-solid border-white/80 rounded-lg animate-ping"></div>
                    </div>
                  </div>
                )}
                {!scanning && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="text-center text-white">
                      <FaCamera className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 opacity-60" />
                      <p className="text-sm sm:text-base font-medium">กำลังเริ่มต้นกล้อง...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Scanner Corner Indicators */}
              <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-blue-400 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-blue-400 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-blue-400 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-blue-400 rounded-br-lg"></div>
            </div>

            {/* Manual Input Section */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-4 sm:p-6 rounded-xl border border-gray-200/50">
              <div className="flex items-center space-x-2 mb-3">
                <FaSearch className="text-blue-500 text-sm sm:text-base" />
                <label htmlFor="manualCodeInput" className="block text-sm sm:text-base font-medium text-gray-700">
                  หรือป้อนรหัสด้วยตนเอง:
                </label>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  id="manualCodeInput"
                  type="text"
                  placeholder="รหัสครุภัณฑ์ เช่น EQ-001"
                  className="flex-1 px-4 py-3 sm:py-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-all duration-200 touch-manipulation select-none bg-white/80 backdrop-blur-sm"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleManualSearch()}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center p-3 sm:p-4 border border-transparent rounded-xl text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl disabled:opacity-60 transition-all duration-200 touch-manipulation select-none disabled:cursor-not-allowed"
                  onClick={handleManualSearch}
                  disabled={!manualCode.trim() || isLoading}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <MagnifyingGlassIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Tips Section */}
            <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/50">
              <div className="flex items-start space-x-3">
                <div className="p-1.5 bg-amber-500 rounded-lg flex-shrink-0 mt-0.5">
                  <FaInfoCircle className="text-white text-xs" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-amber-800 mb-1">เคล็ดลับการสแกน</h4>
                  <ul className="text-xs sm:text-sm text-amber-700 space-y-1">
                    <li>• วาง QR Code ให้อยู่ในกรอบสี่เหลี่ยม</li>
                    <li>• ตรวจสอบให้แน่ใจว่ามีแสงเพียงพอ</li>
                    <li>• หลีกเลี่ยงการสะท้อนแสงบน QR Code</li>
                    <li>• ค้างไว้สักครู่เพื่อให้ระบบประมวลผล</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/50 p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <FaInfoCircle className="text-white text-lg sm:text-xl" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">ข้อมูลครุภัณฑ์</h2>
                <p className="text-xs sm:text-sm text-gray-500">รายละเอียดครุภัณฑ์ที่สแกนได้</p>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {/* Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200/50 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <FaTag className="text-white text-sm" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">รหัสครุภัณฑ์</h4>
                      <p className="text-xs text-gray-600">แสดงรหัสเฉพาะ</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200/50 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <BiPackage className="text-white text-sm" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">ชื่อครุภัณฑ์</h4>
                      <p className="text-xs text-gray-600">ชื่อและรายละเอียด</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200/50 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <TbCategory className="text-white text-sm" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">หมวดหมู่</h4>
                      <p className="text-xs text-gray-600">ประเภทครุภัณฑ์</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200/50 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-500 rounded-lg">
                      <FaClipboardList className="text-white text-sm" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">สถานะ</h4>
                      <p className="text-xs text-gray-600">สถานะปัจจุบัน</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 p-4 sm:p-6 rounded-xl border border-gray-200/50">
                <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-3">การดำเนินการ</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>สแกน QR Code เพื่อดูรายละเอียด</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>ตรวจสอบสถานะครุภัณฑ์</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>ดูข้อมูลการจัดซื้อ</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>จัดการครุภัณฑ์</span>
                  </div>
                </div>
              </div>

              {/* Recent Scans Placeholder */}
              <div className="text-center py-8">
                <div className="p-4 bg-gray-100/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <BiPackage className="text-gray-400 text-2xl" />
                </div>
                <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2">ยังไม่มีข้อมูลครุภัณฑ์</h3>
                <p className="text-xs sm:text-sm text-gray-500">สแกน QR Code หรือป้อนรหัสครุภัณฑ์เพื่อดูรายละเอียด</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Details Dialog */}
      {showEquipmentDialog && scannedEquipment && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/60 backdrop-blur-sm p-2 sm:p-4 lg:p-6 touch-none select-none">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] lg:max-h-[90vh] overflow-hidden flex flex-col relative transform transition-all duration-300 ease-in-out mx-2 sm:mx-0">
            {/* Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl sm:rounded-t-3xl p-4 sm:p-6 text-white">
              <div className="flex justify-between items-start sm:items-center">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
                    <BiPackage className="text-white text-xl sm:text-2xl" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-2xl font-bold text-white truncate">รายละเอียดครุภัณฑ์</h3>
                    <p className="text-xs sm:text-sm text-blue-100">ข้อมูลครุภัณฑ์ที่สแกนได้</p>
                  </div>
                </div>
                <button
                  onClick={closeEquipmentDialog}
                  className="p-2 sm:p-3 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 flex-shrink-0 ml-2 touch-manipulation select-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <MdClose className="text-white text-lg sm:text-xl" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
              {/* Equipment Image Section */}
              <div className="flex justify-center">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <img
                    src={scannedEquipment.pic || "https://cdn-icons-png.flaticon.com/512/3474/3474360.png"}
                    alt={scannedEquipment.name}
                    className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 object-cover rounded-xl sm:rounded-2xl border-4 border-white shadow-xl"
                    onError={(e) => {
                      e.target.src = "https://cdn-icons-png.flaticon.com/512/3474/3474360.png";
                    }}
                  />
                </div>
              </div>

              {/* Equipment Details */}
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {/* Basic Information */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-blue-100">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <FaInfoCircle className="text-white text-base sm:text-lg" />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-gray-800">ข้อมูลพื้นฐาน</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <FaTag className="text-blue-500 text-base sm:text-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500">รหัสครุภัณฑ์</p>
                        <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{scannedEquipment.item_code}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <BiPackage className="text-green-500 text-base sm:text-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500">ชื่อครุภัณฑ์</p>
                        <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{scannedEquipment.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <TbCategory className="text-purple-500 text-base sm:text-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500">หมวดหมู่</p>
                        <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{scannedEquipment.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <FaBoxes className="text-orange-500 text-base sm:text-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500">จำนวน</p>
                        <p className="font-semibold text-gray-800 text-sm sm:text-base">
                          {scannedEquipment.quantity} {scannedEquipment.unit || 'ชิ้น'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <FaMoneyBillWave className="text-green-600 text-base sm:text-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500">ราคา</p>
                        <p className="font-semibold text-gray-800 text-sm sm:text-base">
                          {scannedEquipment.price ? `${Number(scannedEquipment.price).toLocaleString()} บาท` : 'ไม่ระบุ'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <FaMapMarkerAlt className="text-red-500 text-base sm:text-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500">สถานที่</p>
                        <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{scannedEquipment.location || 'ไม่ระบุ'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Section */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-green-100">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <FaClipboardList className="text-white text-base sm:text-lg" />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-gray-800">สถานะ</h4>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-shadow space-y-2 sm:space-y-0">
                    <span className="text-gray-600 font-medium text-sm sm:text-base">สถานะปัจจุบัน:</span>
                    <span className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-sm ${getStatusColor(scannedEquipment.status)} self-start sm:self-auto`}>
                      {scannedEquipment.status}
                    </span>
                  </div>
                </div>

                {/* Purchase Information */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-purple-100">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <FaCalendarAlt className="text-white text-base sm:text-lg" />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-gray-800">ข้อมูลการจัดซื้อ</h4>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <FaCalendarAlt className="text-purple-500 text-base sm:text-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500">วันที่จัดซื้อ</p>
                        <p className="font-semibold text-gray-800 text-sm sm:text-base">
                          {scannedEquipment.purchaseDate ? new Date(scannedEquipment.purchaseDate).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                        </p>
                      </div>
                    </div>
                    {scannedEquipment.dueDate && (
                      <div className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <FaCalendarAlt className="text-pink-500 text-base sm:text-lg flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-gray-500">วันครบกำหนด</p>
                          <p className="font-semibold text-gray-800 text-sm sm:text-base">
                            {new Date(scannedEquipment.dueDate).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {scannedEquipment.description && (
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-amber-100">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                      <div className="p-2 bg-amber-500 rounded-lg">
                        <FaInfoCircle className="text-white text-base sm:text-lg" />
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-gray-800">รายละเอียด</h4>
                    </div>
                    <div className="p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        {scannedEquipment.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t border-gray-200">
                <button
                  onClick={closeEquipmentDialog}
                  className="px-4 sm:px-6 py-2 sm:py-3 text-gray-600 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all duration-200 font-medium flex items-center justify-center space-x-2 hover:scale-105 touch-manipulation select-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <MdClose className="text-base sm:text-lg" />
                  <span>ปิด</span>
                </button>
                <button
                  onClick={() => {
                    closeEquipmentDialog();
                    navigate('/equipment');
                  }}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 hover:scale-105 touch-manipulation select-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <BiPackage className="text-base sm:text-lg" />
                  <span>จัดการครุภัณฑ์</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;