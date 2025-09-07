import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DocumentTextIcon, 
  EyeIcon, 
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { API_BASE } from '../../utils/api';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showLogDetail, setShowLogDetail] = useState(false);
  const [filters, setFilters] = useState({
    user_id: '',
    username: '',
    action_type: '',
    table_name: '',
    start_date: '',
    end_date: '',
    search: '',
    limit: 50,
    offset: 0
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    pages: 1
  });
  const [actionTypes, setActionTypes] = useState([]);
  const [tableNames, setTableNames] = useState([
    { value: 'users', label: 'ผู้ใช้ (Users)' },
    { value: 'equipment', label: 'อุปกรณ์ (Equipment)' },
    { value: 'borrow_transactions', label: 'การยืม (Borrow Transactions)' },
    { value: 'categories', label: 'หมวดหมู่ (Categories)' },
    { value: 'roles', label: 'บทบาท (Roles)' },
    { value: 'brands', label: 'ยี่ห้อ (Brands)' },
    { value: 'locations', label: 'สถานที่ (Locations)' }
  ]);
  const [showFilters, setShowFilters] = useState(false);

  // Get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '') {
          params.append(key, value);
        }
      });

      const response = await axios.get(`${API_BASE}/audit-logs/logs?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setLogs(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      // Handle error appropriately
    } finally {
      setLoading(false);
    }
  };

  // Fetch activity summary
  const fetchSummary = async (period = '24h') => {
    try {
      const response = await axios.get(`${API_BASE}/audit-logs/summary?period=${period}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setSummary(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  // Fetch action types for filter dropdown
  const fetchActionTypes = async () => {
    try {
      const response = await axios.get(`${API_BASE}/audit-logs/action-types`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setActionTypes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching action types:', error);
    }
  };

  // Export logs to CSV
  const exportLogs = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && key !== 'limit' && key !== 'offset') {
          params.append(key, value);
        }
      });

      const response = await axios.get(`${API_BASE}/audit-logs/export?${params}`, {
        headers: getAuthHeaders(),
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    }
  };

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      offset: 0 // Reset pagination when filtering
    }));
  };

  // Handle pagination
  const handlePageChange = (newOffset) => {
    setFilters(prev => ({
      ...prev,
      offset: newOffset
    }));
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get action type badge color with enhanced modern styling
  const getActionTypeBadge = (actionType) => {
    const colors = {
      login: 'bg-gradient-to-r from-emerald-100 to-green-200 text-emerald-800 border border-emerald-300',
      logout: 'bg-gradient-to-r from-gray-100 to-slate-200 text-gray-800 border border-gray-300',
      create: 'bg-gradient-to-r from-blue-100 to-cyan-200 text-blue-800 border border-blue-300',
      update: 'bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800 border border-amber-300',
      delete: 'bg-gradient-to-r from-red-100 to-rose-200 text-red-800 border border-red-300',
      view: 'bg-gradient-to-r from-purple-100 to-violet-200 text-purple-800 border border-purple-300',
      borrow: 'bg-gradient-to-r from-indigo-100 to-blue-200 text-indigo-800 border border-indigo-300',
      return: 'bg-gradient-to-r from-teal-100 to-cyan-200 text-teal-800 border border-teal-300',
      approve: 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border border-green-300',
      reject: 'bg-gradient-to-r from-pink-100 to-rose-200 text-pink-800 border border-pink-300',
      upload: 'bg-gradient-to-r from-sky-100 to-blue-200 text-sky-800 border border-sky-300',
      download: 'bg-gradient-to-r from-orange-100 to-amber-200 text-orange-800 border border-orange-300',
      permission_change: 'bg-gradient-to-r from-violet-100 to-purple-200 text-violet-800 border border-violet-300',
      status_change: 'bg-gradient-to-r from-fuchsia-100 to-pink-200 text-fuchsia-800 border border-fuchsia-300',
      system_setting: 'bg-gradient-to-r from-lime-100 to-green-200 text-lime-800 border border-lime-300',
      other: 'bg-gradient-to-r from-slate-100 to-gray-200 text-slate-800 border border-slate-300'
    };
    return colors[actionType] || colors.other;
  };

  // Get status code color
  const getStatusColor = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) return 'text-green-600';
    if (statusCode >= 300 && statusCode < 400) return 'text-yellow-600';
    if (statusCode >= 400 && statusCode < 500) return 'text-red-600';
    if (statusCode >= 500) return 'text-purple-600';
    return 'text-gray-600';
  };

  // Show log detail modal
  const handleLogClick = (log) => {
    setSelectedLog(log);
    setShowLogDetail(true);
  };

  // Format JSON for display
  const formatJSON = (data) => {
    if (!data) return null;
    try {
      return JSON.stringify(typeof data === 'string' ? JSON.parse(data) : data, null, 2);
    } catch {
      return String(data);
    }
  };

  // Initialize component
  useEffect(() => {
    fetchActionTypes();
    fetchSummary();
  }, []);

  // Fetch logs when filters change
  useEffect(() => {
    fetchLogs();
  }, [filters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with modern glass morphism effect */}
        <div className="mb-8">
          <div className="backdrop-blur-lg bg-white/80 rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg shadow-md">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    รายงานกิจกรรมระบบ
                  </h1>
                  <p className="text-gray-600 text-xs sm:text-sm">ติดตามและตรวจสอบกิจกรรมของผู้ใช้ในระบบ</p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm flex-1 sm:flex-none justify-center sm:justify-start ${
                    showFilters 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  <FunnelIcon className="w-4 h-4" />
                  ตัวกรอง
                </button>
                <button
                  onClick={exportLogs}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-md text-sm flex-1 sm:flex-none justify-center sm:justify-start"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  ส่งออก CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Summary with enhanced cards */}
        {summary && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="backdrop-blur-lg bg-white/80 rounded-xl p-4 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <DocumentTextIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">กิจกรรมตามประเภท</h3>
              </div>
              <div className="text-xs text-gray-500 mb-2">ใน 24 ชั่วโมงที่ผ่านมา</div>
              <div className="space-y-2">
                {summary.activity_by_type?.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50">
                    <span className="text-sm text-gray-700 capitalize truncate">
                      {actionTypes.find(t => t.value === item.action_type)?.label || item.action_type}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="font-bold text-blue-600 text-sm">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="backdrop-blur-lg bg-white/80 rounded-xl p-4 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">ผู้ใช้ที่มีกิจกรรมมากสุด</h3>
              </div>
              <div className="space-y-2">
                {summary.top_active_users?.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-gradient-to-r from-gray-50 to-emerald-50">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${
                        index === 0 ? 'bg-yellow-400' : 
                        index === 1 ? 'bg-gray-400' : 
                        'bg-orange-400'
                      }`}></div>
                      <span className="text-sm text-gray-700 truncate">
                        {item.Fullname || item.username}
                      </span>
                    </div>
                    <span className="font-bold text-emerald-600 text-sm">{item.activity_count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="backdrop-blur-lg bg-white/80 rounded-xl p-4 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                  <ClockIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">กิจกรรมในช่วงเวลา</h3>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {summary.hourly_activity?.slice(0, 8).map((item, index) => (
                  <div key={index} className="text-center p-1.5 rounded-lg bg-gradient-to-b from-purple-50 to-pink-50">
                    <div className="text-xs font-medium text-purple-600">{item.hour}:00</div>
                    <div className="text-sm font-bold text-pink-600">{item.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Filters with modern design */}
        {showFilters && (
          <div className="mb-6 backdrop-blur-lg bg-white/90 rounded-xl p-4 shadow-lg border border-white/30 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <FunnelIcon className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">ตัวกรองขั้นสูง</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  <UserIcon className="w-3 h-3 text-indigo-500" />
                  ชื่อผู้ใช้
                </label>
                <input
                  type="text"
                  value={filters.username}
                  onChange={(e) => handleFilterChange('username', e.target.value)}
                  placeholder="ค้นหาชื่อผู้ใช้"
                  className="w-full px-3 py-2 border-0 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-sm"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  <DocumentTextIcon className="w-3 h-3 text-blue-500" />
                  ประเภทกิจกรรม
                </label>
                <select
                  value={filters.action_type}
                  onChange={(e) => handleFilterChange('action_type', e.target.value)}
                  className="w-full px-3 py-2 border-0 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-sm"
                >
                  <option value="">ทั้งหมด</option>
                  {actionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  <ComputerDesktopIcon className="w-3 h-3 text-purple-500" />
                  ตารางข้อมูล
                </label>
                <select
                  value={filters.table_name}
                  onChange={(e) => handleFilterChange('table_name', e.target.value)}
                  className="w-full px-3 py-2 border-0 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-sm"
                >
                  <option value="">ทั้งหมด</option>
                  {tableNames.map((table) => (
                    <option key={table.value} value={table.value}>
                      {table.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  <ClockIcon className="w-3 h-3 text-emerald-500" />
                  วันที่เริ่มต้น
                </label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="w-full px-3 py-2 border-0 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-sm"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  <ClockIcon className="w-3 h-3 text-red-500" />
                  วันที่สิ้นสุด
                </label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="w-full px-3 py-2 border-0 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-sm"
                />
              </div>
              
              <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  <MagnifyingGlassIcon className="w-3 h-3 text-orange-500" />
                  ค้นหา
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="ค้นหาในรายละเอียด URL หรือชื่อผู้ใช้"
                    className="w-full pl-10 pr-3 py-2 border-0 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Logs Table with modern design */}
        <div className="backdrop-blur-lg bg-white/90 rounded-xl shadow-lg border border-white/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 to-blue-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    เวลา
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    ผู้ใช้
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    กิจกรรม
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Record ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    รายละเอียด
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    สถานะ & เวลา
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-indigo-200 rounded-full animate-spin">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        </div>
                        <p className="text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-gray-100 rounded-full">
                          <DocumentTextIcon className="w-12 h-12 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">ไม่พบข้อมูลกิจกรรม</p>
                        <p className="text-gray-400 text-sm">ลองปรับตัวกรองหรือเพิ่มกิจกรรมในระบบ</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-200" onClick={() => handleLogClick(log)}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-indigo-100 rounded-lg">
                            <ClockIcon className="w-3 h-3 text-indigo-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-xs">{formatDate(log.created_at)}</div>
                            <div className="text-xs text-gray-500">ID: #{log.log_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-emerald-100 rounded-lg">
                            <UserIcon className="w-3 h-3 text-emerald-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {log.user_fullname || log.username || 'ไม่ระบุ'}
                            </div>
                            {log.user_fullname && log.username && (
                              <div className="text-xs text-emerald-600 font-medium">@{log.username}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full shadow-sm ${getActionTypeBadge(log.action_type)}`}>
                            {actionTypes.find(t => t.value === log.action_type)?.label || log.action_type}
                          </span>
                          {log.table_name && (
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                                {log.table_name}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {log.record_id ? (
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                            <div className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-1 rounded-full border border-blue-200 text-xs">
                              #{log.record_id}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic font-medium">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-gray-900 truncate mb-1" title={log.description}>
                            {log.description}
                          </div>
                          {log.request_url && (
                            <div className="text-xs text-gray-500 truncate font-mono bg-gray-50 px-2 py-1 rounded" title={log.request_url}>
                              <span className="font-semibold text-indigo-600">{log.request_method}</span> {log.request_url}
                            </div>
                          )}
                          <div className="flex gap-1 mt-1">
                            {log.old_values && (
                              <div className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                                <span className="font-semibold">Old:</span> {JSON.stringify(log.old_values).substring(0, 20)}...
                              </div>
                            )}
                            {log.new_values && (
                              <div className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                                <span className="font-semibold">New:</span> {JSON.stringify(log.new_values).substring(0, 20)}...
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <div className="p-1 bg-gray-100 rounded-lg">
                            <ComputerDesktopIcon className="w-3 h-3 text-gray-600" />
                          </div>
                          <div className="text-sm font-mono font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded border text-xs">
                            {log.ip_address}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                            log.status_code >= 200 && log.status_code < 300 ? 'bg-green-100 text-green-700 border border-green-300' :
                            log.status_code >= 300 && log.status_code < 400 ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                            log.status_code >= 400 && log.status_code < 500 ? 'bg-red-100 text-red-700 border border-red-300' :
                            log.status_code >= 500 ? 'bg-purple-100 text-purple-700 border border-purple-300' :
                            'bg-gray-100 text-gray-700 border border-gray-300'
                          }`}>
                            {log.status_code}
                          </span>
                          {log.response_time_ms !== null && (
                            <div className="flex items-center gap-1">
                              <ClockIcon className="w-2 h-2 text-gray-400" />
                              <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-full ${
                                log.response_time_ms < 100 ? 'bg-green-100 text-green-700' :
                                log.response_time_ms < 500 ? 'bg-yellow-100 text-yellow-700' :
                                log.response_time_ms < 1000 ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {log.response_time_ms}ms
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Enhanced Pagination */}
          {pagination.total > 0 && (
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-4 py-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(Math.max(0, filters.offset - filters.limit))}
                    disabled={filters.offset === 0}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
                  >
                    ก่อนหน้า
                  </button>
                  <button
                    onClick={() => handlePageChange(filters.offset + filters.limit)}
                    disabled={filters.offset + filters.limit >= pagination.total}
                    className="ml-3 relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
                  >
                    ถัดไป
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-gray-700 font-medium">
                      แสดง <span className="font-bold text-indigo-600">{filters.offset + 1}</span> ถึง{' '}
                      <span className="font-bold text-indigo-600">
                        {Math.min(filters.offset + filters.limit, pagination.total)}
                      </span>{' '}
                      จาก <span className="font-bold text-blue-600">{pagination.total}</span> รายการ
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(Math.max(0, filters.offset - filters.limit))}
                        disabled={filters.offset === 0}
                        className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 transition-all duration-200"
                      >
                        ก่อนหน้า
                      </button>
                      <button
                        onClick={() => handlePageChange(filters.offset + filters.limit)}
                        disabled={filters.offset + filters.limit >= pagination.total}
                        className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 transition-all duration-200"
                      >
                        ถัดไป
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Log Detail Modal */}
      {showLogDetail && selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-200 transform transition-all duration-300">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-t-2xl p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <DocumentTextIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">รายละเอียดบันทึกกิจกรรม</h3>
                </div>
                <button
                  onClick={() => setShowLogDetail(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-xl border border-blue-200">
                    <label className="block text-sm font-semibold text-blue-800 mb-1">Log ID</label>
                    <p className="text-lg font-mono font-bold text-blue-900">#{selectedLog.log_id}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-emerald-50 to-green-100 p-4 rounded-xl border border-emerald-200">
                    <label className="block text-sm font-semibold text-emerald-800 mb-1">ผู้ใช้</label>
                    <p className="text-lg font-semibold text-emerald-900">{selectedLog.user_fullname || selectedLog.username || 'ไม่ระบุ'}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-4 rounded-xl border border-purple-200">
                    <label className="block text-sm font-semibold text-purple-800 mb-2">ประเภทกิจกรรม</label>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getActionTypeBadge(selectedLog.action_type)}`}>
                      {actionTypes.find(t => t.value === selectedLog.action_type)?.label || selectedLog.action_type}
                    </span>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-orange-100 p-4 rounded-xl border border-amber-200">
                    <label className="block text-sm font-semibold text-amber-800 mb-1">ตารางข้อมูล</label>
                    <p className="text-lg font-mono font-semibold text-amber-900">{selectedLog.table_name || '-'}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-100 p-4 rounded-xl border border-cyan-200">
                    <label className="block text-sm font-semibold text-cyan-800 mb-1">Record ID</label>
                    <p className="text-lg font-mono font-bold text-cyan-900">{selectedLog.record_id || '-'}</p>
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-gray-50 to-slate-100 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-800 mb-1">เวลา</label>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(selectedLog.created_at)}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-red-50 to-pink-100 p-4 rounded-xl border border-red-200">
                    <label className="block text-sm font-semibold text-red-800 mb-1">IP Address</label>
                    <p className="text-lg font-mono font-semibold text-red-900">{selectedLog.ip_address}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-xl border border-green-200">
                    <label className="block text-sm font-semibold text-green-800 mb-1">สถานะ HTTP</label>
                    <span className={`text-xl font-bold ${getStatusColor(selectedLog.status_code)}`}>
                      {selectedLog.status_code}
                    </span>
                  </div>
                  
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-100 p-4 rounded-xl border border-indigo-200">
                    <label className="block text-sm font-semibold text-indigo-800 mb-1">เวลาตอบสนอง</label>
                    <p className={`text-xl font-mono font-bold ${
                      selectedLog.response_time_ms < 100 ? 'text-green-600' :
                      selectedLog.response_time_ms < 500 ? 'text-yellow-600' :
                      selectedLog.response_time_ms < 1000 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {selectedLog.response_time_ms ? `${selectedLog.response_time_ms}ms` : '-'}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-100 p-4 rounded-xl border border-teal-200">
                    <label className="block text-sm font-semibold text-teal-800 mb-1">Request URL</label>
                    <p className="text-sm font-mono text-teal-900 break-all">
                      <span className="font-bold">{selectedLog.request_method}</span> {selectedLog.request_url || '-'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">รายละเอียด</label>
                  <p className="text-gray-900 leading-relaxed">{selectedLog.description}</p>
                </div>
              </div>
              
              {selectedLog.old_values && (
                <div className="mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                    <label className="block text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      ข้อมูลเดิม (Old Values)
                    </label>
                    <pre className="text-xs text-blue-900 bg-white p-4 rounded-lg overflow-x-auto border-2 border-blue-200 font-mono">
                      {formatJSON(selectedLog.old_values)}
                    </pre>
                  </div>
                </div>
              )}
              
              {selectedLog.new_values && (
                <div className="mb-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                    <label className="block text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      ข้อมูลใหม่ (New Values)
                    </label>
                    <pre className="text-xs text-green-900 bg-white p-4 rounded-lg overflow-x-auto border-2 border-green-200 font-mono">
                      {formatJSON(selectedLog.new_values)}
                    </pre>
                  </div>
                </div>
              )}
              
              {selectedLog.user_agent && (
                <div className="mb-6">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                    <label className="block text-sm font-semibold text-purple-800 mb-2">User Agent</label>
                    <p className="text-xs text-purple-900 bg-white p-3 rounded-lg break-all font-mono border border-purple-200">{selectedLog.user_agent}</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowLogDetail(false)}
                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-medium hover:from-gray-600 hover:to-gray-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;