import React, { useState, useEffect } from 'react';

const VersionDisplay = () => {
  const [versionInfo, setVersionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch('/api/version');
        if (response.ok) {
          const data = await response.json();
          setVersionInfo(data.data);
        } else {
          setError('ไม่สามารถโหลดข้อมูลเวอร์ชันได้');
        }
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      } finally {
        setLoading(false);
      }
    };

    fetchVersion();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm p-2">
        {error}
      </div>
    );
  }

  if (!versionInfo) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        ข้อมูลเวอร์ชันระบบ
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">ชื่อระบบ</p>
          <p className="font-medium">{versionInfo.systemName}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">เวอร์ชัน</p>
          <p className="font-medium text-blue-600">{versionInfo.version}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">หมายเลข Build</p>
          <p className="font-medium">{versionInfo.buildNumber}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">วันที่เผยแพร่</p>
          <p className="font-medium">{new Date(versionInfo.releaseDate).toLocaleDateString('th-TH')}</p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-600 mb-2">คุณสมบัติหลัก</p>
        <div className="flex flex-wrap gap-2">
          {versionInfo.features.map((feature, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          อัปเดตล่าสุด: {new Date(versionInfo.lastUpdated).toLocaleString('th-TH')}
        </p>
      </div>
    </div>
  );
};

export default VersionDisplay;
