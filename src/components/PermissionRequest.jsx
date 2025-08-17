import { useState, useEffect } from 'react';
import { CameraIcon, BellIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { MdClose, MdRefresh } from 'react-icons/md';

const PermissionRequest = ({
  isOpen,
  onClose,
  onPermissionGranted,
  requestType = 'both' // 'camera', 'notification', 'both'
}) => {
  const [cameraStatus, setCameraStatus] = useState('unknown'); // 'unknown', 'granted', 'denied', 'prompt'
  const [notificationStatus, setNotificationStatus] = useState('unknown');
  const [isRequesting, setIsRequesting] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkPermissions();
    }
  }, [isOpen]);

  const checkPermissions = async () => {
    // Check camera permission
    if (requestType === 'camera' || requestType === 'both') {
      try {
        const result = await navigator.permissions.query({ name: 'camera' });
        setCameraStatus(result.state);

        result.addEventListener('change', () => {
          setCameraStatus(result.state);
        });
      } catch (error) {
        console.log('Camera permission check not supported, will use getUserMedia');
        setCameraStatus('unknown');
      }
    }

    // Check notification permission
    if (requestType === 'notification' || requestType === 'both') {
      if ('Notification' in window) {
        setNotificationStatus(Notification.permission);
      } else {
        setNotificationStatus('not-supported');
      }
    }
  };

  const requestCameraPermission = async () => {
    setIsRequesting(true);
    setShowTroubleshoot(false); // ซ่อน troubleshoot เมื่อเริ่มขออนุญาตใหม่

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      // Clean up the test stream
      stream.getTracks().forEach(track => track.stop());
      setCameraStatus('granted');

      if (onPermissionGranted) {
        onPermissionGranted('camera');
      }
    } catch (error) {
      console.error('Camera permission error:', error);

      if (error.name === 'NotReadableError') {
        setCameraStatus('denied');
        setShowTroubleshoot(true);
      } else if (error.name === 'NotAllowedError') {
        setCameraStatus('denied');
        setShowTroubleshoot(true);
      } else {
        setCameraStatus('denied');
        setShowTroubleshoot(true);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const requestNotificationPermission = async () => {
    setIsRequesting(true);
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setNotificationStatus(permission);

        if (permission === 'granted' && onPermissionGranted) {
          onPermissionGranted('notification');
        }
      }
    } catch (error) {
      console.error('Notification permission error:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const requestBothPermissions = async () => {
    await requestCameraPermission();
    await requestNotificationPermission();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'granted':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'denied':
        return <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'granted':
        return 'อนุญาตแล้ว';
      case 'denied':
        return 'ปฏิเสธ';
      case 'prompt':
        return 'รออนุญาต';
      case 'not-supported':
        return 'ไม่รองรับ';
      default:
        return 'ไม่ทราบสถานะ';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">อนุญาตการเข้าถึง</h3>
              <p className="text-blue-100 text-sm mt-1">จำเป็นสำหรับการใช้งานแอปพลิเคชัน</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 p-2 rounded-lg"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Camera Permission */}
          {(requestType === 'camera' || requestType === 'both') && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <CameraIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">การเข้าถึงกล้อง</h4>
                  <p className="text-sm text-gray-600">สำหรับสแกน QR Code และถ่ายรูป</p>
                </div>
                {getStatusIcon(cameraStatus)}
              </div>

              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  สถานะ: {getStatusText(cameraStatus)}
                </span>
                {cameraStatus !== 'granted' && (
                  <button
                    onClick={requestCameraPermission}
                    disabled={isRequesting}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isRequesting ? 'กำลังขออนุญาต...' : 'ขออนุญาต'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Notification Permission */}
          {(requestType === 'notification' || requestType === 'both') && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <BellIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">การแจ้งเตือน</h4>
                  <p className="text-sm text-gray-600">สำหรับแจ้งเตือนสถานะการยืม</p>
                </div>
                {getStatusIcon(notificationStatus)}
              </div>

              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  สถานะ: {getStatusText(notificationStatus)}
                </span>
                {notificationStatus !== 'granted' && notificationStatus !== 'not-supported' && (
                  <button
                    onClick={requestNotificationPermission}
                    disabled={isRequesting}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isRequesting ? 'กำลังขออนุญาต...' : 'ขออนุญาต'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Request All Button */}
          {requestType === 'both' && (cameraStatus !== 'granted' || notificationStatus !== 'granted') && (
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={requestBothPermissions}
                disabled={isRequesting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isRequesting ? 'กำลังขออนุญาต...' : 'ขออนุญาตทั้งหมด'}
              </button>
            </div>
          )}

                     {/* Troubleshoot Section */}
           {showTroubleshoot && (
             <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
               <div className="flex items-center gap-2 mb-3">
                 <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                 <h4 className="font-semibold text-yellow-800">วิธีแก้ปัญหา</h4>
               </div>
               <div className="space-y-2 text-sm text-yellow-700">
                 <p>• ตรวจสอบการตั้งค่าเบราว์เซอร์ในแถบที่อยู่ (URL)</p>
                 <p>• กดไอคอนกล้องหรือกุญแจที่แถบที่อยู่</p>
                 <p>• เลือก "อนุญาต" สำหรับกล้องและการแจ้งเตือน</p>
                 <p>• ปิดแอปอื่นที่ใช้กล้อง (เช่น กล้อง, WhatsApp, Line, Zoom)</p>
                 <p>• ตรวจสอบว่าไม่มีแอปอื่นเปิดกล้องอยู่</p>
                 <p>• รีเฟรชหน้าเว็บและลองใหม่</p>
               </div>
               <div className="flex gap-2 mt-3">
                 <button
                   onClick={() => window.location.reload()}
                   className="flex items-center gap-2 text-yellow-700 hover:text-yellow-800 font-medium bg-yellow-100 hover:bg-yellow-200 px-3 py-1.5 rounded-lg transition-colors"
                 >
                   <MdRefresh className="w-4 h-4" />
                   รีเฟรชหน้า
                 </button>
                 <button
                   onClick={() => {
                     setShowTroubleshoot(false);
                     requestCameraPermission();
                   }}
                   className="text-blue-700 hover:text-blue-800 font-medium bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors"
                 >
                   ลองใหม่
                 </button>
               </div>
             </div>
           )}

          {/* Success State */}
          {((requestType === 'camera' && cameraStatus === 'granted') ||
            (requestType === 'notification' && notificationStatus === 'granted') ||
            (requestType === 'both' && cameraStatus === 'granted' && notificationStatus === 'granted')) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <h4 className="font-semibold text-green-800 mb-1">อนุญาตสำเร็จ!</h4>
              <p className="text-sm text-green-600">ตอนนี้คุณสามารถใช้งานฟีเจอร์ทั้งหมดได้แล้ว</p>
              <button
                onClick={onClose}
                className="mt-3 bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                เริ่มใช้งาน
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionRequest;
