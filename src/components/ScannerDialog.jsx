import React, { useEffect, useRef, useState } from "react";
import { XCircleIcon as ErrorIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid"; // Updated and added icons
import { BrowserMultiFormatReader, ChecksumException, FormatException, NotFoundException } from "@zxing/library";
import { MdClose, MdRefresh } from "react-icons/md";
import { checkCameraSupport, requestCameraPermission, troubleshootCamera } from "../utils/cameraUtils";
import PermissionRequest from "./PermissionRequest";

const ScannerDialog = ({ isOpen, onClose, onScanComplete, onManualInput }) => {
  const scannerRef = useRef(null); // This ref seems to be for the div, might not be strictly needed with new video setup
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false); // Keep for logic if needed
  const [error, setError] = useState(null);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  const codeReader = useRef(null);
  const videoRef = useRef(null); // Essential for the video element
  const handlingScanRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    // Initialize scanner when dialog opens and videoRef is available
    if (isOpen && videoRef.current) {
      initializeScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]); // Rerun when isOpen changes

    const initializeScanner = async () => {
    if (scanning) return; // Prevent re-initialization if already scanning
    setScanning(true);
    setError(null);

    try {
      if (!videoRef.current) {
        console.warn("Video element not ready for scanner initialization.");
        setScanning(false);
        return;
      }

      // Clean up any existing scanner
      if (codeReader.current) {
        try {
          codeReader.current.reset();
        } catch (e) {
          console.warn("Error resetting existing scanner:", e);
        }
        codeReader.current = null;
      }

      // Request camera permission first
      try {
        await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } }
        }).then(stream => {
          stream.getTracks().forEach(track => track.stop()); // Clean up test stream
        });
      } catch (permissionError) {
        throw new Error("กรุณาอนุญาตการเข้าถึงกล้องในเบราว์เซอร์");
      }

      // Create new scanner instance
      codeReader.current = new BrowserMultiFormatReader();

      // Wait a bit for the scanner to initialize
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!codeReader.current) {
        throw new Error("ไม่สามารถเริ่มต้นสแกนเนอร์ได้");
      }

      const devices = await codeReader.current.listVideoInputDevices();

      if (!devices || devices.length === 0) {
        throw new Error("ไม่พบอุปกรณ์กล้อง กรุณาตรวจสอบการเชื่อมต่อกล้อง");
      }

      console.log("Available cameras:", devices.map(d => ({ id: d.deviceId, label: d.label })));

      // Enhanced camera selection with fallback probing
      const rearCameraKeywords = ['back', 'rear', 'environment', 'facing back', 'camera2 0'];
      const candidates = [];
      const rear = devices.find(d => rearCameraKeywords.some(k => d.label.toLowerCase().includes(k)));
      if (rear) candidates.push(rear.deviceId);
      if (devices.length > 1) candidates.push(devices[devices.length - 1].deviceId);
      devices.forEach(d => { if (!candidates.includes(d.deviceId)) candidates.push(d.deviceId); });

      let selectedDeviceId = null;
      for (const devId of candidates) {
        try {
          // Probe device readability first to avoid NotReadableError later
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

      // Clean up any existing video stream
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      // Wait a bit more before starting the scanner
      await new Promise(resolve => setTimeout(resolve, 200));

      // Check if codeReader is still valid
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
              onScanComplete(result.getText());
            } finally {
              setTimeout(() => { handlingScanRef.current = false; }, 1000);
            }
          } else if (err && !(err instanceof NotFoundException) && !(err instanceof ChecksumException) && !(err instanceof FormatException)) {
            // Log more specific errors, but don't show generic scan errors to user unless critical
            console.warn("Scanning error:", err);
            // setError("เกิดข้อผิดพลาดระหว่างการสแกน"); // Avoid flooding user with minor scan errors
          }
        }
      );
            } catch (e) {
      console.error("Scanner initialization error:", e);

      // แสดง Permission Request Dialog สำหรับ permission errors
      if (e.name === 'NotAllowedError' || e.message.includes('อนุญาต')) {
        setShowPermissionRequest(true);
      } else if (e.name === 'NotReadableError') {
        // กล้องถูกใช้งานโดยแอปอื่น - แสดง dialog ให้ผู้ใช้เลือก
        setError("กล้องถูกใช้งานโดยแอปพลิเคชันอื่น กรุณาปิดแอปอื่นแล้วลองใหม่");
        setShowPermissionRequest(true); // แสดง dialog เพื่อให้ผู้ใช้สามารถขออนุญาตใหม่ได้
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
        codeReader.current = null; // Ensure it's cleared for re-initialization
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null; // Clear the srcObject
      }
    } catch (e) {
      console.error("Error stopping scanner:", e);
    } finally {
      setScanning(false);
    }
  };

  const handleManualSearch = () => {
    if (manualCode.trim()) {
      // stopScanner(); // No need to stop if it wasn't necessarily started for manual input
      onManualInput(manualCode.trim());
      // onClose(); // Typically, manual input would also close the dialog or give feedback
    }
  };

  const handleCloseDialog = () => {
    stopScanner();
    onClose();
  };

  const handlePermissionGranted = (permissionType) => {
    if (permissionType === 'camera') {
      setShowPermissionRequest(false);
      setError(null);
      // ลองเริ่ม scanner ใหม่หลังจากได้รับ permission
      setTimeout(() => {
        initializeScanner();
      }, 1000); // เพิ่มเวลาให้มากขึ้น
    }
  };

  if (!isOpen) return null;

  console.log('=== ScannerDialog Component Render ==='); // Debug log
  console.log('ScannerDialog rendering, isOpen:', isOpen); // Debug log
  console.log('Render timestamp:', Date.now()); // Debug log

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={handleCloseDialog}></div>
        <div className="relative z-10 w-full max-w-md transform transition-all duration-300">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 flex flex-col max-h-[90vh] mx-2 sm:mx-0">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">สแกน QR Code / Barcode</h3>
              <button
                onClick={handleCloseDialog}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors touch-manipulation select-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-grow">
              {error && (
                <div className="bg-red-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-start space-x-3">
                    <ErrorIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-700">เกิดข้อผิดพลาด</p>
                      <p className="text-xs text-red-600">{error}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors touch-manipulation select-none"
                      onClick={() => setShowPermissionRequest(true)}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      ขออนุญาต
                    </button>
                    <button
                      className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors touch-manipulation select-none"
                      onClick={() => { initializeScanner(); }}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      ลองอีกครั้ง
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs sm:text-sm text-gray-600 text-center">
                วาง QR Code หรือ Barcode ของครุภัณฑ์ให้อยู่ในกรอบเพื่อสแกน
              </p>

              <div
                className="relative w-full aspect-[4/3] bg-gray-800 rounded-lg overflow-hidden shadow-inner mx-auto max-h-[50vh]"
                ref={scannerRef} // Keep ref if needed by zxing or other logic, though videoRef is primary for stream
              >
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  autoPlay
                  playsInline // Important for iOS
                />
                {/* Optional: Add a scanning animation or overlay here if desired */}
                {scanning && !error && (
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {/* Example: Simple animated focus square (optional) */}
                        <div className="w-3/4 h-3/4 border-2 border-dashed border-white/50 rounded-lg animate-pulse"></div>
                    </div>
                )}
              </div>

              <div className="pt-2">
                <label htmlFor="manualCodeInput" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  หรือป้อนรหัสด้วยตนเอง:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="manualCodeInput"
                    type="text"
                    placeholder="รหัสการยืม"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors touch-manipulation select-none"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleManualSearch()}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  />
                  <button
                    type="button"
                    className="inline-flex items-center justify-center p-2.5 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm disabled:opacity-60 transition-colors touch-manipulation select-none"
                    onClick={handleManualSearch}
                    disabled={!manualCode.trim()}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex justify-end flex-shrink-0">
              <button
                type="button"
                onClick={handleCloseDialog}
                className="px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm touch-manipulation select-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                ยกเลิก
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
        requestType="camera"
      />
    </div>
  );
};

export default ScannerDialog;
