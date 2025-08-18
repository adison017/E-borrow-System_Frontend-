import React, { useEffect, useRef, useState } from 'react';
import { XCircleIcon as ErrorIcon, MagnifyingGlassIcon, QrCodeIcon } from "@heroicons/react/24/solid";
import { BrowserMultiFormatReader, ChecksumException, FormatException, NotFoundException } from "@zxing/library";
import { MdClose } from "react-icons/md";
import { FaCamera, FaSearch } from "react-icons/fa";
import { getEquipment } from '../../../utils/api';
import PermissionRequest from '../../../components/PermissionRequest';

const QRScannerDialog = ({ isOpen, onClose, onEquipmentFound }) => {
  const scannerRef = useRef(null);
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  const codeReader = useRef(null);
  const videoRef = useRef(null);
  const handlingScanRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      initializeScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen]);

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

      if (codeReader.current) {
        try {
          codeReader.current.reset();
        } catch (e) {
          console.warn("Error resetting existing scanner:", e);
        }
        codeReader.current = null;
      }

      try {
        await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } }
        }).then(stream => {
          stream.getTracks().forEach(track => track.stop());
        });
      } catch (permissionError) {
        throw new Error("กรุณาอนุญาตการเข้าถึงกล้องในเบราว์เซอร์");
      }

      codeReader.current = new BrowserMultiFormatReader();
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!codeReader.current) {
        throw new Error("ไม่สามารถเริ่มต้นสแกนเนอร์ได้");
      }

      const devices = await codeReader.current.listVideoInputDevices();

      if (!devices || devices.length === 0) {
        throw new Error("ไม่พบอุปกรณ์กล้อง กรุณาตรวจสอบการเชื่อมต่อกล้อง");
      }

      const rearCameraKeywords = ['back', 'rear', 'environment', 'facing back', 'camera2 0'];
      const candidates = [];
      const rear = devices.find(d => rearCameraKeywords.some(k => d.label.toLowerCase().includes(k)));
      if (rear) candidates.push(rear.deviceId);
      if (devices.length > 1) candidates.push(devices[devices.length - 1].deviceId);
      devices.forEach(d => { if (!candidates.includes(d.deviceId)) candidates.push(d.deviceId); });

      let selectedDeviceId = null;
      for (const devId of candidates) {
        try {
          const testStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: devId } } });
          testStream.getTracks().forEach(t => t.stop());
          selectedDeviceId = devId;
          break;
        } catch (probeErr) {
          console.warn('Camera not readable, trying next device:', probeErr?.name || probeErr);
          continue;
        }
      }

      if (!selectedDeviceId) throw new DOMException('ไม่สามารถเริ่มกล้องจากอุปกรณ์ใดๆ ได้', 'NotReadableError');

      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      await new Promise(resolve => setTimeout(resolve, 200));

      if (!codeReader.current || typeof codeReader.current.decodeFromVideoDevice !== 'function') {
        throw new Error("สแกนเนอร์ไม่พร้อมใช้งาน");
      }

      await codeReader.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            if (handlingScanRef.current) return;
            handlingScanRef.current = true;
            try {
              handleScanComplete(result.getText());
            } finally {
              setTimeout(() => { handlingScanRef.current = false; }, 1000);
            }
          } else if (err && !(err instanceof NotFoundException) && !(err instanceof ChecksumException) && !(err instanceof FormatException)) {
            console.warn("Scanning error:", err);
          }
        }
      );
    } catch (e) {
      console.error("Scanner initialization error:", e);

      if (e.name === 'NotAllowedError' || e.message.includes('อนุญาต')) {
        setShowPermissionRequest(true);
      } else if (e.name === 'NotReadableError') {
        setError("กล้องถูกใช้งานโดยแอปพลิเคชันอื่น กรุณาปิดแอปอื่นแล้วลองใหม่");
        setShowPermissionRequest(true);
      } else {
        let errorMessage = "เกิดข้อผิดพลาดในการเริ่มต้นสแกนเนอร์";

        if (e.name === 'NotFoundError') {
          errorMessage = "ไม่พบกล้องที่ใช้งานได้ กรุณาตรวจสอบอุปกรณ์";
        } else if (e.name === 'OverconstrainedError') {
          errorMessage = "ไม่สามารถใช้กล้องได้ กรุณาตรวจสอบการตั้งค่า";
        } else if (e.name === 'AbortError') {
          errorMessage = "การเชื่อมต่อกล้องถูกยกเลิก";
        }

        setError(errorMessage);
      }

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
        try {
          codeReader.current.reset();
        } catch (e) {
          console.warn("Error resetting scanner:", e);
        }
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
        onEquipmentFound(equipment);
        onClose();
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
        onEquipmentFound(equipment);
        onClose();
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

  const handlePermissionGranted = (permissionType) => {
    if (permissionType === 'camera') {
      setShowPermissionRequest(false);
      setError(null);
      setTimeout(() => {
        initializeScanner();
      }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col mx-2 sm:mx-0">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl p-3 sm:p-4 text-white">
          <div className="flex justify-between items-start sm:items-center">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
                <QrCodeIcon className="text-white text-lg sm:text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-white truncate">สแกน QR Code ครุภัณฑ์</h3>
                <p className="text-xs sm:text-sm text-blue-100">สแกน QR Code เพื่อค้นหาครุภัณฑ์</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 sm:p-3 hover:bg-white/20 rounded-full transition-all duration-200 flex-shrink-0 ml-2"
            >
              <MdClose className="text-white text-lg sm:text-xl" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
          {error && (
            <div className="bg-red-50 p-3 sm:p-4 rounded-xl border border-red-200 space-y-3">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <ErrorIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-700">เกิดข้อผิดพลาด</p>
                  <p className="text-xs text-red-600 break-words">{error}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                  onClick={() => setShowPermissionRequest(true)}
                >
                  ขออนุญาต
                </button>
                <button
                  className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                  onClick={() => { initializeScanner(); }}
                >
                  ลองอีกครั้ง
                </button>
              </div>
            </div>
          )}

          {/* Scanner Frame */}
          <div className="relative">
            <div
              className="relative w-full aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-2xl mx-auto border-2 border-white/20"
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
                    <FaCamera className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-60" />
                    <p className="text-xs sm:text-sm font-medium">กำลังเริ่มต้นกล้อง...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Scanner Corner Indicators */}
            <div className="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-l-2 border-t-2 sm:border-l-4 sm:border-t-4 border-blue-400 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-r-2 border-t-2 sm:border-r-4 sm:border-t-4 border-blue-400 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-l-2 border-b-2 sm:border-l-4 sm:border-b-4 border-blue-400 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-r-2 border-b-2 sm:border-r-4 sm:border-b-4 border-blue-400 rounded-br-lg"></div>
          </div>

          {/* Manual Input Section */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-3 rounded-xl border border-gray-200/50">
            <div className="flex items-center space-x-2 mb-2">
              <FaSearch className="text-blue-500 text-xs sm:text-sm" />
              <label htmlFor="manualCodeInput" className="block text-xs sm:text-sm font-medium text-gray-700">
                หรือป้อนรหัสด้วยตนเอง:
              </label>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                id="manualCodeInput"
                type="text"
                placeholder="รหัสครุภัณฑ์ เช่น EQ-001"
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 bg-white/80 backdrop-blur-sm"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleManualSearch()}
              />
              <button
                type="button"
                className="inline-flex items-center justify-center px-4 py-2.5 sm:p-3 border border-transparent rounded-lg sm:rounded-xl text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl disabled:opacity-60 transition-all duration-200 disabled:cursor-not-allowed text-sm font-medium"
                onClick={handleManualSearch}
                disabled={!manualCode.trim() || isLoading}
              >
                {isLoading ? (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-0 mr-2" />
                    <span className="sm:hidden">ค้นหา</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Request Dialog */}
      <PermissionRequest
        isOpen={showPermissionRequest}
        onClose={() => setShowPermissionRequest(false)}
        onPermissionGranted={handlePermissionGranted}
        requestType="both"
      />
    </div>
  );
};

export default QRScannerDialog;