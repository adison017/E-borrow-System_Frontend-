// Location Tracking Utility
class LocationTracker {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.lastLocation = null;
  }

  // เริ่มติดตามตำแหน่ง
  startTracking(onLocationUpdate, onError) {
    if (!navigator.geolocation) {
      onError('GPS ไม่รองรับในอุปกรณ์นี้');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // 1 นาที
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        
        this.lastLocation = location;
        this.isTracking = true;
        onLocationUpdate(location);
      },
      (error) => {
        this.isTracking = false;
        onError(`GPS Error: ${error.message}`);
      },
      options
    );
  }

  // หยุดติดตาม
  stopTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isTracking = false;
    }
  }

  // ส่งตำแหน่งไปเซิร์ฟเวอร์
  async sendLocationToServer(borrowId, location) {
    try {
      const response = await fetch(`/api/borrows/${borrowId}/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(location)
      });
      
      if (!response.ok) throw new Error('ส่งตำแหน่งไม่สำเร็จ');
      return await response.json();
    } catch (error) {
      console.error('Location update failed:', error);
      throw error;
    }
  }
}

export default new LocationTracker();