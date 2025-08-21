// Location Tracking Utility

class LocationTracker {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.lastLocation = null;
    this.periodicCheckInterval = null;
  }

  // เริ่มติดตามตำแหน่ง
  startTracking(onLocationUpdate, onError, activeBorrowIds = []) {
    console.log('=== LocationTracker.startTracking Debug ===');
    console.log('Active borrow IDs:', activeBorrowIds);
    console.log('Current tracking state:', this.isTracking);
    
    if (!navigator.geolocation) {
      console.error('GPS not supported');
      onError('GPS ไม่รองรับในอุปกรณ์นี้');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 180000 // 3 นาที
    };

    console.log('GPS options:', options);

    // เพิ่มการตรวจสอบและอัพเดทตำแหน่งเมื่อผ่านไป 1 นาที
    this.startPeriodicLocationCheck(activeBorrowIds);

    console.log('Starting GPS watchPosition...');
    
    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        console.log('GPS position received:', position);
        
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        
        console.log('Location object created:', location);
        
        // เพิ่มการแปลงพิกัดเป็นที่อยู่
        try {
          const address = await this.reverseGeocode(location.latitude, location.longitude);
          location.address = address;
          console.log('Address resolved:', address);
        } catch (error) {
          console.warn('Failed to get address:', error);
          location.address = null;
        }
        
        this.lastLocation = location;
        this.isTracking = true;
        
        console.log('Location tracking state updated:', this.isTracking);
        console.log('Last location saved:', this.lastLocation);
        
        // ส่งตำแหน่งไปยังเซิร์ฟเวอร์สำหรับรายการยืมที่ active
        if (activeBorrowIds.length > 0) {
          console.log('Sending location to server for active borrows...');
          for (const borrowId of activeBorrowIds) {
            try {
              await this.sendLocationToServer(borrowId, location);
              console.log(`Location sent for borrow_id: ${borrowId} (real-time update)`);
            } catch (error) {
              console.error(`Failed to send location for borrow_id ${borrowId}:`, error);
            }
          }
        } else {
          console.log('No active borrow IDs to send location to');
        }
        
        onLocationUpdate(location);
      },
      (error) => {
        console.error('GPS watchPosition error:', error);
        this.isTracking = false;
        onError(`GPS Error: ${error.message}`);
      },
      options
    );
    
    console.log('GPS watchPosition started with ID:', this.watchId);
  }

  // แปลงพิกัดเป็นที่อยู่
  async reverseGeocode(latitude, longitude) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'th,en'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }
      
      const data = await response.json();
      
      // สร้างที่อยู่จากข้อมูลที่ได้รับ - เน้นจังหวัดและอำเภอ
      const addressParts = [];
      
      if (data.address) {
        // เพิ่มถนน (ถ้ามี)
        if (data.address.road) addressParts.push(data.address.road);
        
        // เพิ่มตำบล/แขวง (ถ้ามี)
        if (data.address.suburb) addressParts.push(data.address.suburb);
        
        // เพิ่มหมู่บ้าน (ถ้ามี)
        if (data.address.hamlet) addressParts.push(data.address.hamlet);
        
        // เพิ่มอำเภอ/เขต (สำคัญ)
        if (data.address.county) {
          addressParts.push(data.address.county);
        } else if (data.address.district) {
          addressParts.push(data.address.district);
        }
        
        // เพิ่มจังหวัด (สำคัญที่สุด)
        if (data.address.state) {
          addressParts.push(data.address.state);
        } else if (data.address.province) {
          addressParts.push(data.address.province);
        }
        
        // ไม่เพิ่มประเทศแล้ว เพราะต้องการเฉพาะจังหวัด
      }
      
      // ถ้าไม่มีข้อมูลที่อยู่ ให้ใช้ display_name และตัดประเทศออก
      if (addressParts.length === 0) {
        if (data.display_name) {
          // ตัด "ประเทศไทย" ออกจาก display_name
          let displayName = data.display_name;
          displayName = displayName.replace(/, ประเทศไทย$/, '');
          displayName = displayName.replace(/, Thailand$/, '');
          return displayName || 'ไม่ระบุที่อยู่';
        }
        return 'ไม่ระบุที่อยู่';
      }
      
      return addressParts.join(', ');
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  // หยุดติดตาม
  stopTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isTracking = false;
    }
    
    // หยุดการตรวจสอบแบบ periodic
    if (this.periodicCheckInterval) {
      clearInterval(this.periodicCheckInterval);
      this.periodicCheckInterval = null;
    }
  }

    // เริ่มการตรวจสอบและอัพเดทตำแหน่งแบบ periodic
  startPeriodicLocationCheck(activeBorrowIds = []) {
    console.log('=== startPeriodicLocationCheck Debug ===');
    console.log('Active borrow IDs:', activeBorrowIds);
    
    // หยุดการตรวจสอบเดิม (ถ้ามี)
    if (this.periodicCheckInterval) {
      console.log('Clearing existing periodic check interval');
      clearInterval(this.periodicCheckInterval);
    }

    console.log('Setting up new periodic check interval (every 1 minute)');

    this.periodicCheckInterval = setInterval(async () => {
      console.log('=== Periodic Check Triggered ===');
      console.log('Tracking state:', this.isTracking);
      console.log('Last location exists:', !!this.lastLocation);
      console.log('Active borrow IDs count:', activeBorrowIds.length);
      
      if (!this.isTracking || !this.lastLocation || activeBorrowIds.length === 0) {
        console.log('Periodic check skipped - tracking:', this.isTracking, 'location:', !!this.lastLocation, 'borrowIds:', activeBorrowIds.length);
        return;
      }

      console.log('Periodic location check - checking for updates needed...');
      console.log('Active borrow IDs:', activeBorrowIds);
      console.log('Current location:', this.lastLocation);
      
      // ส่งตำแหน่งไปยังเซิร์ฟเวอร์สำหรับรายการยืมที่ active
      for (const borrowId of activeBorrowIds) {
        try {
          console.log(`Sending periodic location update for borrow_id: ${borrowId}`);
          await this.sendLocationToServer(borrowId, this.lastLocation);
          console.log(`Periodic location update sent for borrow_id: ${borrowId} (every 1 minute)`);
        } catch (error) {
          console.error(`Failed to send periodic location update for borrow_id ${borrowId}:`, error);
        }
      }
    }, 60000); // ตรวจสอบทุก 1 นาที
    
    console.log('Periodic check interval set up successfully');
  }

  // ส่งตำแหน่งไปเซิร์ฟเวอร์
  async sendLocationToServer(borrowId, location) {
    try {
      const locationData = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        address: location.address || null
      };
      
      // Dynamic import to avoid module loading issues
      const { updateBorrowerLocation } = await import('./api.js');
      const result = await updateBorrowerLocation(borrowId, locationData);
      return result;
    } catch (error) {
      console.error('Location update failed:', error);
      throw error;
    }
  }
}

export default new LocationTracker();