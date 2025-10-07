// Camera utilities for mobile device support
import { checkCameraAvailability, requestCameraAccess, isSecureContext } from './securityUtils';

export const checkCameraSupport = async () => {
  try {
    // ตรวจสอบ secure context ก่อน
    const availability = checkCameraAvailability();
    if (!availability.available) {
      return {
        supported: false,
        message: availability.reason
      };
    }

    // Check if cameras are available
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');

    if (videoDevices.length === 0) {
      return {
        supported: false,
        message: "ไม่พบกล้องที่ใช้งานได้ในอุปกรณ์ของคุณ"
      };
    }

    return {
      supported: true,
      cameras: videoDevices,
      message: `พบกล้อง ${videoDevices.length} ตัว`,
      isSecure: isSecureContext()
    };
  } catch (error) {
    console.error('Camera support check failed:', error);
    return {
      supported: false,
      message: "ไม่สามารถตรวจสอบการรองรับกล้องได้"
    };
  }
};

export const requestCameraPermission = async (facingMode = 'environment') => {
  try {
    // ใช้ฟังก์ชันจาก securityUtils ที่จัดการ HTTP/HTTPS แล้ว
    const result = await requestCameraAccess();
    
    if (!result.success) {
      return {
        granted: false,
        message: result.error
      };
    }

    // Clean up the test stream
    result.stream.getTracks().forEach(track => track.stop());

    return {
      granted: true,
      message: "อนุญาตการเข้าถึงกล้องแล้ว"
    };
  } catch (error) {
    console.error('Camera permission request failed:', error);

    let message = "ไม่สามารถเข้าถึงกล้องได้";

    switch (error.name) {
      case 'NotAllowedError':
        message = "ผู้ใช้ปฏิเสธการอนุญาตใช้กล้อง กรุณาอนุญาตในเบราว์เซอร์";
        break;
      case 'NotFoundError':
        message = "ไม่พบกล้องที่ใช้งานได้";
        break;
      case 'NotReadableError':
        message = "กล้องถูกใช้งานโดยแอปพลิเคชันอื่น";
        break;
      case 'OverconstrainedError':
        message = "กล้องไม่รองรับการตั้งค่าที่ระบุ";
        break;
      case 'SecurityError':
        message = "การเข้าถึงกล้องถูกปฏิเสธด้วยเหตุผลด้านความปลอดภัย";
        break;
      default:
        message = `เกิดข้อผิดพลาด: ${error.message}`;
    }

    return {
      granted: false,
      message,
      error: error.name
    };
  }
};

export const getCameraList = async () => {
  try {
    // Request permission first to get device labels
    await requestCameraPermission();

    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');

    return videoDevices.map(device => ({
      deviceId: device.deviceId,
      label: device.label || `กล้อง ${device.deviceId.substring(0, 8)}`,
      groupId: device.groupId
    }));
  } catch (error) {
    console.error('Failed to get camera list:', error);
    return [];
  }
};

export const findBestCamera = (cameras) => {
  // Keywords that indicate a rear/back camera
  const rearKeywords = ['back', 'rear', 'environment', 'facing back', 'camera2 0', 'back camera'];

  // Find rear camera
  const rearCamera = cameras.find(camera => {
    const label = camera.label.toLowerCase();
    return rearKeywords.some(keyword => label.includes(keyword));
  });

  if (rearCamera) {
    return { camera: rearCamera, type: 'rear' };
  }

  // If multiple cameras but no clear rear camera, try the last one (often rear on mobile)
  if (cameras.length > 1) {
    return { camera: cameras[cameras.length - 1], type: 'likely-rear' };
  }

  // Use the only available camera
  if (cameras.length === 1) {
    return { camera: cameras[0], type: 'only' };
  }

  return null;
};

export const troubleshootCamera = () => {
  return {
    steps: [
      "ตรวจสอบว่าเบราว์เซอร์ได้รับอนุญาตให้เข้าถึงกล้อง",
      "ปิดแอปพลิเคชันอื่นที่อาจใช้กล้อง (เช่น แอปถ่ายรูป, วิดีโอคอล)",
      "รีเฟรชหน้าเว็บและลองใหม่",
      "ตรวจสอบการตั้งค่าความเป็นส่วนตัวของเบราว์เซอร์",
      "ลองใช้เบราว์เซอร์อื่น (Chrome, Firefox, Safari)",
      "รีสตาร์ทเบราว์เซอร์หรืออุปกรณ์"
    ],
    browserSpecific: {
      chrome: "ไปที่ Settings > Privacy and security > Site settings > Camera",
      firefox: "ไปที่ Preferences > Privacy & Security > Permissions > Camera",
      safari: "ไปที่ Preferences > Websites > Camera",
      edge: "ไปที่ Settings > Site permissions > Camera"
    }
  };
};
