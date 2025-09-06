import React, { useState, useEffect } from 'react';
import { MapPinIcon, UserIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { API_BASE, authFetch, getAllBorrows } from '../../utils/api';
import LocationMapDialog from '../../components/LocationMapDialog';

const LocationTracking = () => {
  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchActiveBorrowers();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchActiveBorrowers();
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchActiveBorrowers = async () => {
    try {
      const data = await getAllBorrows();
      console.log('Fetched borrows data:', data);

      // กรองเฉพาะรายการที่ active
      const activeBorrowers = data.filter(borrow =>
        ['approved', 'carry', 'overdue'].includes(borrow.status)
      );

      console.log('Active borrowers:', activeBorrowers);
      setBorrowers(activeBorrowers);
    } catch (error) {
      console.error('Error fetching borrowers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchActiveBorrowers();
    setLastRefresh(new Date());
  };

  const handleViewLocation = (borrower) => {
    if (borrower.borrower_location) {
      setSelectedLocation(borrower.borrower_location);
      setSelectedBorrower(`${borrower.borrower?.first_name || borrower.borrower?.name || borrower.user?.first_name || borrower.user?.name || 'ไม่ระบุชื่อ'} ${borrower.borrower?.last_name || borrower.user?.last_name || ''}`);
      setShowMap(true);
    }
  };





  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0 p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <MapPinIcon className="w-8 h-8 text-blue-600" />
              ติดตามตำแหน่งผู้ยืม
            </h1>
            <p className="text-gray-600 mt-2">ดูตำแหน่งปัจจุบันของผู้ที่กำลังยืมครุภัณฑ์</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              อัพเดทล่าสุด: {lastRefresh.toLocaleTimeString('th-TH')}
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              <ArrowPathIcon className="w-4 h-4" />
              รีเฟรช
            </button>
          </div>
        </div>
      </div>

      {/* Content Section - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">

      {borrowers.length === 0 ? (
        <div className="text-center py-12">
          <MapPinIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">ไม่มีข้อมูลตำแหน่ง</h3>
          <p className="text-gray-400">ยังไม่มีผู้ยืมที่เปิดการติดตามตำแหน่ง</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {borrowers.map((borrower) => (
            <div
              key={borrower.borrow_id}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-100 to-indigo-100">
                    <img
                      src={
                        borrower.borrower?.avatar || borrower.user?.avatar
                          ? (borrower.borrower?.avatar || borrower.user?.avatar).startsWith('http')
                          ? (borrower.borrower?.avatar || borrower.user?.avatar)
                          : `${API_BASE}${borrower.borrower?.avatar || borrower.user?.avatar}`
                          : '/profile.png'
                      }
                      alt="ผู้ยืม"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/profile.png'; }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">
                      {borrower.borrower?.first_name || borrower.borrower?.name || borrower.user?.first_name || borrower.user?.name || 'ไม่ระบุชื่อ'} {borrower.borrower?.last_name || borrower.user?.last_name || ''}
                    </h3>
                    <p className="text-sm text-gray-500">{borrower.borrower?.department || borrower.user?.department || 'สาขา'}</p>
                  </div>
                </div>

                {/* Borrow Info */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">รหัสการยืม: {borrower.borrow_code}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    จำนวนครุภัณฑ์: {borrower.equipment?.length || 0} รายการ
                  </p>
                </div>

                {/* Location Info */}
                {console.log('Borrower location data:', borrower.borrower_location)}
                {borrower.borrower_location ? (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPinIcon className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">มีข้อมูลตำแหน่ง</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      <p>📍 {borrower.borrower_location.address || 'ไม่ระบุที่อยู่'}</p>
                      <div className="flex items-center gap-1 mt-2 p-2 bg-gray-50 rounded-lg">
                        <ClockIcon className="w-3 h-3 text-blue-600" />
                        <span className="text-blue-700 font-medium">
                          อัพเดทล่าสุด: {new Date(borrower.last_location_update).toLocaleString('th-TH', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {(() => {
                          const now = new Date();
                          const lastUpdate = new Date(borrower.last_location_update);
                          const diffMs = Math.max(0, now - lastUpdate);
                          const diffMins = Math.floor(diffMs / 60000);
                          const diffSecs = Math.floor((diffMs % 60000) / 1000);

                          if (diffMs < 1000) {
                            return `🟢 เพิ่งอัพเดท`;
                          } else if (diffMins < 1) {
                            return `🟢 ${diffSecs} วินาทีที่แล้ว`;
                          } else if (diffMins < 60) {
                            return `🟡 ${diffMins} นาทีที่แล้ว`;
                          } else {
                            const diffHours = Math.floor(diffMins / 60);
                            return `🔴 ${diffHours} ชั่วโมงที่แล้ว`;
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPinIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">ไม่มีข้อมูลตำแหน่ง</span>
                    </div>
                  </div>
                )}

                                                                {/* Action Button */}
                {borrower.borrower_location ? (
                  <button
                    onClick={() => handleViewLocation(borrower)}
                    className="w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                  >
                    <MapPinIcon className="w-4 h-4" />
                    ดูบนแผนที่
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 bg-gray-100 text-gray-400 cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <MapPinIcon className="w-4 h-4" />
                    ไม่มีตำแหน่ง
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Location Map Dialog */}
      <LocationMapDialog
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        location={selectedLocation}
        borrowerName={selectedBorrower}
      />
      </div>
    </div>
  );
};

export default LocationTracking;