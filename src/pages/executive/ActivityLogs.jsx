import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { 
  DocumentTextIcon, 
  EyeIcon, 
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
// Add react-icons imports with correct syntax
import { 
  FaUser, FaUsers, FaKey, FaLock, FaUnlock, FaSignInAlt, FaSignOutAlt,
  FaPlus, FaEdit, FaTrash, FaSave, FaUpload, FaDownload,
  FaCheck, FaTimes, FaExclamation, FaInfo, FaCog,
  FaDatabase, FaTable, FaFile, FaFileAlt, FaClipboardList,
  FaShoppingCart, FaBox, FaBoxes, FaTags, FaTag,
  FaHome, FaBuilding, FaMapMarker, FaUserCog, FaUserShield
} from 'react-icons/fa';
import { 
  IoLogIn, IoLogOut, IoCreate, IoCloudUpload, IoCloudDownload, 
  IoCheckmark, IoClose, IoWarning, IoInformation, IoSettings, IoPeople
} from 'react-icons/io5';
import { 
  MdLogin, MdLogout, MdCreate, MdEdit, MdDelete, MdVisibility,
  MdFileUpload, MdFileDownload, MdCheck, MdClose,
  MdWarning, MdInfo, MdSettings, MdPeople
} from 'react-icons/md';
import { 
  BiLogIn, BiLogOut, BiPlus, BiEdit, BiTrash, BiShow,
  BiUpload, BiDownload, BiCheck, BiX, BiError,
  BiInfoCircle, BiCog, BiGroup
} from 'react-icons/bi';
import { 
  AiOutlineLogin, AiOutlineLogout, AiOutlinePlus, AiOutlineEdit,
  AiOutlineDelete, AiOutlineEye, AiOutlineUpload, AiOutlineDownload,
  AiOutlineCheck, AiOutlineClose, AiOutlineWarning,
  AiOutlineInfo, AiOutlineSetting, AiOutlineUsergroupAdd
} from 'react-icons/ai';
import { API_BASE } from '../../utils/api';
import { toast } from 'react-toastify';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
    limit: 25,
    offset: 0
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 25,
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

  // Fetch logs with pagination and filters
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Add a small delay to prevent rate limiting issues
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '') {
          params.append(key, value);
        }
      });

      const response = await axios.get(`${API_BASE}/audit-logs/logs?${params}`);

      if (response.data.success) {
        setLogs(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError(response.data.message || 'Failed to fetch logs');
        toast.error(response.data.message || 'Failed to fetch logs');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error fetching logs';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch activity summary
  const fetchSummary = async (period = '24h') => {
    try {
      // Add a small delay to prevent rate limiting issues
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await axios.get(`${API_BASE}/audit-logs/summary?period=${period}`);

      if (response.data.success) {
        setSummary(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to fetch summary');
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error fetching summary';
      toast.error(errorMessage);
    }
  };

  // Fetch action types for filter dropdown
  const fetchActionTypes = async () => {
    try {
      // Add a small delay to prevent rate limiting issues
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await axios.get(`${API_BASE}/audit-logs/action-types`);

      if (response.data.success) {
        setActionTypes(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to fetch action types');
      }
    } catch (error) {
      console.error('Error fetching action types:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error fetching action types';
      toast.error(errorMessage);
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
      toast.success('Export successful');
    } catch (error) {
      console.error('Error exporting logs:', error);
      const errorMessage = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการส่งออกข้อมูล';
      toast.error(errorMessage);
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

  // Get action type badge color with enhanced modern styling and icons
  const getActionTypeBadge = (actionType) => {
    const config = {
      login: { 
        colors: 'bg-gradient-to-r from-emerald-100 to-green-200 text-emerald-800 border border-emerald-300',
        icon: <MdLogin className="w-4 h-4" />
      },
      logout: { 
        colors: 'bg-gradient-to-r from-gray-100 to-slate-200 text-gray-800 border border-gray-300',
        icon: <MdLogout className="w-4 h-4" />
      },
      create: { 
        colors: 'bg-gradient-to-r from-blue-100 to-cyan-200 text-blue-800 border border-blue-300',
        icon: <MdCreate className="w-4 h-4" />
      },
      update: { 
        colors: 'bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800 border border-amber-300',
        icon: <MdEdit className="w-4 h-4" />
      },
      delete: { 
        colors: 'bg-gradient-to-r from-red-100 to-rose-200 text-red-800 border border-red-300',
        icon: <MdDelete className="w-4 h-4" />
      },
      view: { 
        colors: 'bg-gradient-to-r from-purple-100 to-violet-200 text-purple-800 border border-purple-300',
        icon: <MdVisibility className="w-4 h-4" />
      },
      borrow: { 
        colors: 'bg-gradient-to-r from-indigo-100 to-blue-200 text-indigo-800 border border-indigo-300',
        icon: <FaBox className="w-4 h-4" />
      },
      return: { 
        colors: 'bg-gradient-to-r from-teal-100 to-cyan-200 text-teal-800 border border-teal-300',
        icon: <FaBoxes className="w-4 h-4" />
      },
      approve: { 
        colors: 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border border-green-300',
        icon: <MdCheck className="w-4 h-4" />
      },
      reject: { 
        colors: 'bg-gradient-to-r from-pink-100 to-rose-200 text-pink-800 border border-pink-300',
        icon: <MdClose className="w-4 h-4" />
      },
      upload: { 
        colors: 'bg-gradient-to-r from-sky-100 to-blue-200 text-sky-800 border border-sky-300',
        icon: <MdFileUpload className="w-4 h-4" />
      },
      download: { 
        colors: 'bg-gradient-to-r from-orange-100 to-amber-200 text-orange-800 border border-orange-300',
        icon: <MdFileDownload className="w-4 h-4" />
      },
      permission_change: { 
        colors: 'bg-gradient-to-r from-violet-100 to-purple-200 text-violet-800 border border-violet-300',
        icon: <FaUserShield className="w-4 h-4" />
      },
      status_change: { 
        colors: 'bg-gradient-to-r from-fuchsia-100 to-pink-200 text-fuchsia-800 border border-fuchsia-300',
        icon: <FaCog className="w-4 h-4" />
      },
      system_setting: { 
        colors: 'bg-gradient-to-r from-lime-100 to-green-200 text-lime-800 border border-lime-300',
        icon: <MdSettings className="w-4 h-4" />
      },
      other: { 
        colors: 'bg-gradient-to-r from-slate-100 to-gray-200 text-slate-800 border border-slate-300',
        icon: <MdInfo className="w-4 h-4" />
      }
    };
    
    return config[actionType] || config.other;
  };

  // Get status code color
  const getStatusColor = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) return 'text-green-600';
    if (statusCode >= 300 && statusCode < 400) return 'text-yellow-600';
    if (statusCode >= 400 && statusCode < 500) return 'text-red-600';
    if (statusCode >= 500) return 'text-purple-600';
    return 'text-gray-600';
  };

  // Get card background color based on action type (without border)
  const getCardBackgroundColor = (actionType) => {
    const colors = {
      login: 'bg-emerald-50 hover:bg-emerald-100',
      logout: 'bg-gray-50 hover:bg-gray-100',
      create: 'bg-blue-50 hover:bg-blue-100',
      update: 'bg-amber-50 hover:bg-amber-100',
      delete: 'bg-red-50 hover:bg-red-100',
      view: 'bg-purple-50 hover:bg-purple-100',
      borrow: 'bg-indigo-50 hover:bg-indigo-100',
      return: 'bg-teal-50 hover:bg-teal-100',
      approve: 'bg-green-50 hover:bg-green-100',
      reject: 'bg-pink-50 hover:bg-pink-100',
      upload: 'bg-sky-50 hover:bg-sky-100',
      download: 'bg-orange-50 hover:bg-orange-100',
      permission_change: 'bg-violet-50 hover:bg-violet-100',
      status_change: 'bg-fuchsia-50 hover:bg-fuchsia-100',
      system_setting: 'bg-lime-50 hover:bg-lime-100',
      other: 'bg-slate-50 hover:bg-slate-100'
    };
    return colors[actionType] || colors.other;
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

  // Initialize component with delays between requests
  useEffect(() => {
    const initializeData = async () => {
      // Stagger the initial requests to prevent rate limiting
      await fetchActionTypes();
      await new Promise(resolve => setTimeout(resolve, 200));
      await fetchSummary();
    };
    
    initializeData();
  }, []);

  // Fetch logs when filters change
  useEffect(() => {
    fetchLogs();
  }, [filters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2">
      <div className="max-w-7xl mx-auto">
        {/* Header with modern glass morphism effect */}
        <div className="mb-4">
          <div className="backdrop-blur-lg bg-white/80 rounded-xl p-3 shadow-md border border-white/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg shadow-xs">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-gray-900">
                    รายงานกิจกรรมระบบ
                  </h1>
                  <p className="text-gray-600 text-xs">ติดตามและตรวจสอบกิจกรรมของผู้ใช้ในระบบ</p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium transition-all duration-200 text-xs flex-1 sm:flex-none justify-center sm:justify-start ${
                    showFilters 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  <FunnelIcon className="w-3.5 h-3.5" />
                  ตัวกรอง
                </button>
                <button
                  onClick={exportLogs}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-md text-sm flex-1 sm:flex-none justify-center sm:justify-start"
                >
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                  ส่งออก CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Summary with enhanced cards */}
        {summary && (
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="backdrop-blur-lg bg-white/80 rounded-xl p-4 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <DocumentTextIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">กิจกรรมตามประเภท</h3>
              </div>
              <div className="text-xs text-gray-500 mb-1.5">ใน 24 ชั่วโมงที่ผ่านมา</div>
              <div className="space-y-2">
                {summary.activity_by_type?.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-1.5 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50">
                    <div className="flex items-center">
                      <span className="mr-2">
                        {getActionTypeBadge(item.action_type).icon}
                      </span>
                      <span className="text-xs text-gray-700 capitalize truncate">
                        {actionTypes.find(t => t.value === item.action_type)?.label || item.action_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="font-bold text-blue-600 text-xs">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="backdrop-blur-lg bg-white/80 rounded-xl p-4 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
                  <UserIcon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">ผู้ใช้ที่มีกิจกรรมมากสุด</h3>
              </div>
              <div className="space-y-1.5">
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
                <div className="p-1 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                  <ClockIcon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">กิจกรรมในช่วงเวลา</h3>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {summary.hourly_activity?.slice(0, 8).map((item, index) => (
                  <div key={index} className="text-center p-1.5 rounded-lg bg-gradient-to-b from-purple-50 to-pink-50">
                    <div className="text-xs font-medium text-purple-600">{item.hour}:00</div>
                    <div className="text-xs font-bold text-pink-600">{item.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Filters with modern design */}
        {showFilters && (
          <div className="mb-3 backdrop-blur-lg bg-white/90 rounded-xl p-2.5 shadow-sm border border-white/30 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="p-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <FunnelIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800">ตัวกรองขั้นสูง</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                  <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="ค้นหาในรายละเอียด URL หรือชื่อผู้ใช้"
                    className="w-full pl-8 pr-2.5 py-1.5 border-0 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Logs Table with modern design */}
        <div className="backdrop-blur-lg bg-white/90 rounded-xl shadow-md border border-white/30 overflow-hidden">
          {/* Error message display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-3">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1.5" />
                <p className="text-red-700 font-medium text-sm">Error: {error}</p>
              </div>
            </div>
          )}
          
          {/* Replace table with card layout */}
          <div className="p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-indigo-200 rounded-full animate-spin">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
                <p className="text-gray-500 font-medium mt-4">กำลังโหลดข้อมูลกิจกรรม...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <DocumentTextIcon className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-lg">ไม่พบข้อมูลกิจกรรม</p>
                <p className="text-gray-400 mt-2">ลองปรับตัวกรองหรือเพิ่มกิจกรรมในระบบ</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div 
                    key={log.log_id} 
                    className={`rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer p-4 ${getCardBackgroundColor(log.action_type)}`}
                    onClick={() => handleLogClick(log)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-2 bg-indigo-100 rounded-lg">
                          <ClockIcon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${getActionTypeBadge(log.action_type).colors}`}>
                              <span className="mr-1">{getActionTypeBadge(log.action_type).icon}</span>
                              {actionTypes.find(t => t.value === log.action_type)?.label || log.action_type}
                            </span>
                            {log.table_name && (
                              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                                {tableNames.find(t => t.value === log.table_name)?.label || log.table_name}
                              </span>
                            )}
                          </div>
                          <h3 className="font-medium text-gray-900 mb-1">
                            {log.user_fullname || log.username || 'ไม่ระบุผู้ใช้'}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {log.description || 'ไม่มีรายละเอียดกิจกรรม'}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span>#{log.log_id}</span>
                            <span>{formatDate(log.created_at)}</span>
                            <span>{log.ip_address}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                          log.status_code >= 200 && log.status_code < 300 ? 'bg-green-100 text-green-700 border border-green-300' :
                          log.status_code >= 300 && log.status_code < 400 ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                          log.status_code >= 400 && log.status_code < 500 ? 'bg-red-100 text-red-700 border border-red-300' :
                          log.status_code >= 500 ? 'bg-purple-100 text-purple-700 border border-purple-300' :
                          'bg-gray-100 text-gray-700 border border-gray-300'
                        }`}>
                          {log.status_code}
                        </div>
                        {log.response_time_ms !== null && (
                          <span className={`text-xs font-mono font-bold px-2 py-1 rounded-full ${
                            log.response_time_ms < 100 ? 'bg-green-100 text-green-700' :
                            log.response_time_ms < 500 ? 'bg-yellow-100 text-yellow-700' :
                            log.response_time_ms < 1000 ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {log.response_time_ms}ms
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Pagination */}
          {pagination.total > 0 && (
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-4 py-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(Math.max(0, filters.offset - filters.limit))}
                    disabled={filters.offset === 0}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
                  >
                    ก่อนหน้า
                  </button>
                  <button
                    onClick={() => handlePageChange(filters.offset + filters.limit)}
                    disabled={filters.offset + filters.limit >= pagination.total}
                    className="ml-2 relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
                  >
                    ถัดไป
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-gray-700 font-medium">
                      แสดง <span className="font-bold text-indigo-600">{filters.offset + 1}</span> ถึง{' '}
                      <span className="font-bold text-indigo-600">
                        {Math.min(filters.offset + filters.limit, pagination.total)}
                      </span>{' '}
                      จาก <span className="font-bold text-blue-600">{pagination.total}</span> รายการ
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-xs -space-x-px">
                      <button
                        onClick={() => handlePageChange(Math.max(0, filters.offset - filters.limit))}
                        disabled={filters.offset === 0}
                        className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 transition-all duration-200"
                      >
                        ก่อนหน้า
                      </button>
                      <button
                        onClick={() => handlePageChange(filters.offset + filters.limit)}
                        disabled={filters.offset + filters.limit >= pagination.total}
                        className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 transition-all duration-200"
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
          <div className="relative w-full max-w-4xl h-auto max-h-[80vh] rounded-xl shadow-lg bg-white border border-gray-200 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-t-xl p-4 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-white/20 rounded-lg">
                    <DocumentTextIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">รายละเอียดกิจกรรม</h3>
                </div>
                <button
                  onClick={() => setShowLogDetail(false)}
                  className="p-1 hover:bg-white/20 rounded-md transition-colors duration-200"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Content - More compact and organized */}
            <div className="p-5 flex-grow overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                {/* Left Column */}
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">รหัสบันทึก</div>
                    <p className="font-mono font-bold text-indigo-700">#{selectedLog.log_id}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">ผู้ใช้</div>
                    <p className="font-medium text-gray-900">{selectedLog.user_fullname || selectedLog.username || 'ไม่ระบุ'}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">ประเภทกิจกรรม</div>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getActionTypeBadge(selectedLog.action_type).colors}`}>
                      <span className="mr-1">{getActionTypeBadge(selectedLog.action_type).icon}</span>
                      {actionTypes.find(t => t.value === selectedLog.action_type)?.label || selectedLog.action_type}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">ตารางข้อมูล</div>
                    <p className="text-sm font-medium text-gray-900">{tableNames.find(t => t.value === selectedLog.table_name)?.label || selectedLog.table_name || '-'}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Record ID</div>
                    <p className="font-mono font-bold text-gray-900">{selectedLog.record_id || '-'}</p>
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">เวลาที่ทำรายการ</div>
                    <p className="font-medium text-gray-900">{formatDate(selectedLog.created_at)}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">IP Address</div>
                    <p className="font-mono font-medium text-gray-900">{selectedLog.ip_address}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">สถานะ HTTP</div>
                    <span className={`text-lg font-bold ${getStatusColor(selectedLog.status_code)}`}>
                      {selectedLog.status_code}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">เวลาตอบสนอง</div>
                    <p className={`font-mono font-bold ${
                      selectedLog.response_time_ms < 100 ? 'text-green-600' :
                      selectedLog.response_time_ms < 500 ? 'text-yellow-600' :
                      selectedLog.response_time_ms < 1000 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {selectedLog.response_time_ms ? `${selectedLog.response_time_ms}ms` : '-'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Request URL</div>
                    <p className="text-xs font-mono text-gray-900 break-all">
                      <span className="font-bold">{selectedLog.request_method}</span> {selectedLog.request_url || '-'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-5">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-2">รายละเอียดกิจกรรม</div>
                  <p className="text-gray-900">{selectedLog.description || 'ไม่มีรายละเอียด'}</p>
                </div>
              </div>
              
              {selectedLog.old_values && (
                <div className="mb-5">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="text-xs text-blue-700 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      ข้อมูลก่อนเปลี่ยนแปลง
                    </div>
                    <pre className="text-xs text-blue-900 bg-white p-3 rounded overflow-x-auto border border-blue-200 font-mono max-h-40 overflow-y-auto">
                      {formatJSON(selectedLog.old_values)}
                    </pre>
                  </div>
                </div>
              )}
              
              {selectedLog.new_values && (
                <div className="mb-5">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="text-xs text-green-700 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      ข้อมูลหลังเปลี่ยนแปลง
                    </div>
                    <pre className="text-xs text-green-900 bg-white p-3 rounded overflow-x-auto border border-green-200 font-mono max-h-40 overflow-y-auto">
                      {formatJSON(selectedLog.new_values)}
                    </pre>
                  </div>
                </div>
              )}
              
              {selectedLog.user_agent && (
                <div className="mb-5">
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <div className="text-xs text-purple-700 mb-2">User Agent</div>
                    <p className="text-xs text-purple-900 bg-white p-2 rounded border border-purple-200 break-all font-mono">
                      {selectedLog.user_agent}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowLogDetail(false)}
                  className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-medium hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-sm"
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