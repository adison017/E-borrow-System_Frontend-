// Security and Context Utilities

/**
 * ตรวจสอบว่าเว็บไซต์ทำงานใน secure context หรือไม่
 * @returns {boolean} true ถ้าเป็น HTTPS หรือ localhost
 */
export const isSecureContext = () => {
  // ตรวจสอบ secure context ตาม Web API standard
  if (typeof window !== 'undefined' && 'isSecureContext' in window) {
    return window.isSecureContext;
  }
  
  // Fallback: ตรวจสอบ protocol และ hostname
  if (typeof location !== 'undefined') {
    return (
      location.protocol === 'https:' ||
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1' ||
      location.hostname.endsWith('.localhost')
    );
  }
  
  return false;
};

/**
 * ตรวจสอบว่า Geolocation API สามารถใช้งานได้หรือไม่
 * @returns {Object} { available: boolean, reason: string }
 */
export const checkGeolocationAvailability = () => {
  if (!navigator.geolocation) {
    return {
      available: false,
      reason: 'GPS ไม่รองรับในอุปกรณ์นี้'
    };
  }
  
  if (!isSecureContext()) {
    return {
      available: false,
      reason: 'ต้องใช้ HTTPS เพื่อเข้าถึงตำแหน่ง (ยกเว้น localhost)'
    };
  }
  
  return {
    available: true,
    reason: 'พร้อมใช้งาน'
  };
};

/**
 * ตรวจสอบว่า Camera API สามารถใช้งานได้หรือไม่
 * @returns {Object} { available: boolean, reason: string }
 */
export const checkCameraAvailability = () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      available: false,
      reason: 'กล้องไม่รองรับในอุปกรณ์นี้'
    };
  }
  
  if (!isSecureContext()) {
    return {
      available: false,
      reason: 'ต้องใช้ HTTPS เพื่อเข้าถึงกล้อง (ยกเว้น localhost)'
    };
  }
  
  return {
    available: true,
    reason: 'พร้อมใช้งาน'
  };
};

/**
 * สร้างข้อความแจ้งเตือนสำหรับ HTTP
 * @param {string} feature - ฟีเจอร์ที่ต้องการใช้ ('camera', 'location', 'both')
 * @returns {Object} { title: string, message: string, type: string }
 */
export const getHttpWarningMessage = (feature = 'both') => {
  const messages = {
    camera: {
      title: 'ไม่สามารถเข้าถึงกล้องได้',
      message: 'เว็บไซต์ต้องใช้ HTTPS เพื่อเข้าถึงกล้อง กรุณาติดต่อผู้ดูแลระบบเพื่อติดตั้ง SSL Certificate',
      type: 'warning'
    },
    location: {
      title: 'ไม่สามารถเข้าถึงตำแหน่งได้',
      message: 'เว็บไซต์ต้องใช้ HTTPS เพื่อเข้าถึงตำแหน่ง กรุณาติดต่อผู้ดูแลระบบเพื่อติดตั้ง SSL Certificate',
      type: 'warning'
    },
    both: {
      title: 'ฟีเจอร์บางอย่างไม่สามารถใช้งานได้',
      message: 'เว็บไซต์ต้องใช้ HTTPS เพื่อเข้าถึงกล้องและตำแหน่ง กรุณาติดต่อผู้ดูแลระบบเพื่อติดตั้ง SSL Certificate หรือใช้งานผ่าน localhost',
      type: 'warning'
    }
  };
  
  return messages[feature] || messages.both;
};

/**
 * แสดงข้อมูลการแก้ไขปัญหา HTTP
 * @returns {Object} คำแนะนำสำหรับแก้ไขปัญหา
 */
export const getHttpSolutions = () => {
  return {
    title: 'วิธีแก้ไขปัญหา HTTP',
    solutions: [
      {
        title: 'สำหรับผู้ดูแลระบบ',
        items: [
          'ติดตั้ง SSL Certificate (แนะนำ Let\'s Encrypt ฟรี)',
          'ตั้งค่า Reverse Proxy (Nginx/Apache) ให้รองรับ HTTPS',
          'ใช้ Cloudflare สำหรับ SSL ฟรี'
        ]
      },
      {
        title: 'สำหรับการทดสอบ',
        items: [
          'ใช้งานผ่าน localhost หรือ 127.0.0.1',
          'ใช้ ngrok หรือ tunneling service อื่นๆ',
          'ตั้งค่า browser flags (ไม่แนะนำสำหรับ production)'
        ]
      }
    ]
  };
};

/**
 * ลองขอสิทธิ์เข้าถึงกล้องแบบ graceful fallback
 * @returns {Promise<Object>} { success: boolean, stream?: MediaStream, error?: string }
 */
export const requestCameraAccess = async () => {
  const cameraCheck = checkCameraAvailability();
  
  if (!cameraCheck.available) {
    return {
      success: false,
      error: cameraCheck.reason
    };
  }
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    });
    
    return {
      success: true,
      stream
    };
  } catch (error) {
    let errorMessage = 'ไม่สามารถเข้าถึงกล้องได้';
    
    switch (error.name) {
      case 'NotAllowedError':
        errorMessage = 'ผู้ใช้ปฏิเสธการเข้าถึงกล้อง';
        break;
      case 'NotFoundError':
        errorMessage = 'ไม่พบกล้องในอุปกรณ์';
        break;
      case 'NotReadableError':
        errorMessage = 'กล้องถูกใช้งานโดยแอปพลิเคชันอื่น';
        break;
      case 'OverconstrainedError':
        errorMessage = 'การตั้งค่ากล้องไม่รองรับ';
        break;
      case 'SecurityError':
        errorMessage = 'ไม่สามารถเข้าถึงกล้องได้เนื่องจากปัญหาความปลอดภัย (ต้องใช้ HTTPS)';
        break;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * ลองขอสิทธิ์เข้าถึงตำแหน่งแบบ graceful fallback
 * @returns {Promise<Object>} { success: boolean, position?: GeolocationPosition, error?: string }
 */
export const requestLocationAccess = () => {
  return new Promise((resolve) => {
    const locationCheck = checkGeolocationAvailability();
    
    if (!locationCheck.available) {
      resolve({
        success: false,
        error: locationCheck.reason
      });
      return;
    }
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    };
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          position
        });
      },
      (error) => {
        let errorMessage = 'ไม่สามารถเข้าถึงตำแหน่งได้';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'ผู้ใช้ปฏิเสธการเข้าถึงตำแหน่ง';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'ไม่สามารถระบุตำแหน่งได้';
            break;
          case error.TIMEOUT:
            errorMessage = 'หมดเวลาในการระบุตำแหน่ง';
            break;
        }
        
        resolve({
          success: false,
          error: errorMessage
        });
      },
      options
    );
  });
};