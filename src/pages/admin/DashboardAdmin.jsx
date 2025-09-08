import {
  FiAlertTriangle as WarningIcon,
  FiCreditCard as PaymentIcon,
  FiUser as PeopleIcon,
  FiPackage as InventoryIcon,
  FiList as ListAltIcon,
  FiCheckCircle as DoneIcon,
  FiTrendingUp as TrendingUpIcon,
  FiClipboard as AssignmentTurnedInIcon,
  FiRotateCcw as AssignmentReturnIcon,
  FiMapPin as LocationIcon,
  FiClock as ClockIcon,
  FiAlertCircle as AlertIcon,
  FiDollarSign as MoneyIcon
} from 'react-icons/fi';
import axios from '../../utils/axios';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '@/utils/api';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';


const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEquipment: 0,
    availableEquipment: 0,
    borrowedEquipment: 0,
    pendingRequests: 0,
    lateReturns: 0,
    totalUsers: 0,
    totalCategories: 0,
    pendingDelivery: 0,
    pendingReturn: 0,
  });


  const [equipmentStatusData, setEquipmentStatusData] = useState([]);
  const [borrowReturnData, setBorrowReturnData] = useState([]);
  const [topBorrowedItems, setTopBorrowedItems] = useState([]);
  const [branchBorrowSummary, setBranchBorrowSummary] = useState([]);
  const [frequentDamageUsers, setFrequentDamageUsers] = useState([]);
  const [topRiskUsers, setTopRiskUsers] = useState([]);
  const [overdueNearDueItems, setOverdueNearDueItems] = useState([]);
  const [pendingPaymentItems, setPendingPaymentItems] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const statsRes = await axios.get(`${API_BASE}/dashboard/summary`);
        setStats(statsRes.data);
      } catch (e) {}
      try {
        const res = await axios.get(`${API_BASE}/dashboard/return-status`);
        setEquipmentStatusData(res.data);
      } catch (e) { setEquipmentStatusData([]); }
      try {
        const res = await axios.get(`${API_BASE}/dashboard/monthly-borrow`);
        setBorrowReturnData(res.data);
      } catch (e) { setBorrowReturnData([]); }
      try {
        const res = await axios.get(`${API_BASE}/dashboard/top-borrowed-equipment`);
        setTopBorrowedItems(res.data);
      } catch (e) { setTopBorrowedItems([]); }
      try {
        const res = await axios.get(`${API_BASE}/dashboard/top-risk-users`);
        setTopRiskUsers(res.data);
      } catch (e) { setTopRiskUsers([]); }
      try {
        const res = await axios.get(`${API_BASE}/dashboard/frequent-damage-users`);
        setFrequentDamageUsers(res.data);
      } catch (e) { setFrequentDamageUsers([]); }
      try {
        const res = await axios.get(`${API_BASE}/dashboard/branch-borrow-summary`);
        setBranchBorrowSummary(res.data);
      } catch (e) { setBranchBorrowSummary([]); }
      try {
        const res = await axios.get(`${API_BASE}/dashboard/overdue-near-due-items`);
        setOverdueNearDueItems(res.data);
      } catch (e) { setOverdueNearDueItems([]); }
      try {
        const res = await axios.get(`${API_BASE}/dashboard/pending-payment-items`);
        setPendingPaymentItems(res.data);
      } catch (e) { setPendingPaymentItems([]); }
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  const summaryTableData = [
    {
      id: 1,
      category: 'จัดการครุภัณฑ์',
      icon: <InventoryIcon className="text-blue-500" />,
      count: stats.totalEquipment,
      status: '',
      statusColor: 'text-blue-500',
      path: '/equipment'
    },
    {
      id: 2,
      category: 'จัดการผู้ใช้งาน',
      icon: <PeopleIcon className="text-purple-500" />,
      count: stats.totalUsers,
      status: '',
      statusColor: 'text-purple-500',
      path: '/members'
    },
    {
      id: 3,
      category: 'รายการยืม (รอตรวจสอบ)',
      icon: <ListAltIcon className="text-yellow-500" />,
      count: stats.pendingRequests,
      status: '',
      statusColor: 'text-yellow-500',
      path: '/borrow-list'
    },
    {
      id: 4,
      category: 'รายการส่งมอบ (รอส่งมอบ)',
      icon: <AssignmentTurnedInIcon className="text-indigo-500" />,
      count: stats.pendingDelivery,
      status: '',
      statusColor: 'text-indigo-500',
      path: '/ReceiveItem'
    },
    {
      id: 5,
      category: 'รายการคืน (รอคืน)',
      icon: <AssignmentReturnIcon className="text-teal-500" />,
      count: stats.pendingReturn,
      status: '',
      statusColor: 'text-teal-500',
      path: '/return-list'
    },
    {
      id: 8,
      category: 'คืนเกินกำหนด',
      icon: <WarningIcon className="text-red-500" />,
      count: stats.lateReturns,
      status: stats.borrowedEquipment ? `${((stats.lateReturns / stats.borrowedEquipment) * 100).toFixed(0)}% ของที่ยืม` : '',
      statusColor: 'text-red-500',
      path: '/return-list'
    }
  ];


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'borrow': return <AssignmentReturnIcon className="text-blue-500" />;
      case 'return': return <DoneIcon className="text-green-500" />;
      case 'new_item': return <InventoryIcon className="text-purple-500" />;
      case 'update_status': return <TrendingUpIcon className="text-indigo-500" />;
      default: return <ListAltIcon className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Columns for risk users and frequent damage users
  const topRiskUsersColumns = [
    { field: 'Fullname', headerName: 'ชื่อผู้ใช้', width: 160 },
    { field: 'total_fine', headerName: 'ค่าปรับรวม', width: 120 },
  ];
  const frequentDamageUsersColumns = [
    { field: 'Fullname', headerName: 'ชื่อผู้ใช้', width: 160 },
    { field: 'damage_count', headerName: 'จำนวนคืนของเสีย', width: 120 },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100">
      <motion.div
        className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div className="mb-8" variants={itemVariants}>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
            แดชบอร์ดผู้ดูแลระบบ
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">ภาพรวมการจัดการระบบและทางลัด</p>
        </motion.div>

        {/* Combined Overdue/Near Due and Pending Payment Items Section */}
        {(overdueNearDueItems.length > 0 || pendingPaymentItems.length > 0) && (
          <motion.div className="mb-3" variants={itemVariants}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Overdue and Near Due Items */}
              {overdueNearDueItems.length > 0 && (
                <div className="bg-red-50 rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-400 to-red-600 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/40 rounded-xl flex items-center justify-center">
                          <WarningIcon className="text-white text-xl sm:text-2xl" />
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-xl font-bold text-white">รายการเกินกำหนดและกำลังจะเกินกำหนด</h2>
                          <p className="text-white/90 text-sm mt-1">คลิกที่รายการเพื่อดูรายละเอียด</p>
                          <span className="text-white/90 text-sm font-medium">{overdueNearDueItems.length} รายการ</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="grid gap-3 sm:gap-4">
                      {overdueNearDueItems.map((item) => (
                        <motion.div 
                          key={item.borrow_id}
                          className={`p-3 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg cursor-pointer ${
                            item.urgency_status === 'overdue' 
                              ? 'border-red-200 bg-red-100 hover:border-red-300 hover:shadow-red-100' 
                              : 'border-orange-200 bg-orange-100 hover:border-orange-300 hover:shadow-orange-100'
                          }`}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => navigate('/return-list')}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-start gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex-shrink-0">
                                {item.borrower.avatar ? (
                                  <img 
                                    src={item.borrower.avatar} 
                                    alt={item.borrower.name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-md">
                                    <PeopleIcon className="text-slate-600 text-sm" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 mb-1">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm ${
                                    item.urgency_status === 'overdue'
                                      ? 'bg-red-200 text-red-800 border border-red-200'
                                      : 'bg-orange-200 text-orange-800 border border-orange-200'
                                  }`}>
                                    {item.urgency_status === 'overdue' ? (
                                      <><AlertIcon className="w-3 h-3" /> เกินกำหนด</>
                                    ) : (
                                      <><WarningIcon className="w-3 h-3" /> กำลังจะเกิน</>
                                    )}
                                  </span>
                                  <h3 className="font-bold text-slate-800 text-sm truncate mb-0 sm:mb-1">{item.borrower.name}</h3>
                                </div>
                                <p className="text-xs text-slate-600 truncate mb-1">
                                  {item.borrower.position} • {item.borrower.department}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 text-xs">
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-500">รหัส:</span>
                                    <span className="font-semibold text-slate-700">{item.borrow_code}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-500">กำหนดคืน:</span>
                                    <span className="font-semibold text-red-600">{item.due_date}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className={`font-bold text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                      item.urgency_status === 'overdue' 
                                        ? 'bg-red-100 text-red-700' 
                                        : 'bg-orange-100 text-orange-700'
                                    }`}>
                                      <ClockIcon className="w-3 h-3" />
                                      {item.urgency_status === 'overdue' 
                                        ? `เกิน ${Math.abs(item.days_until_due)} วัน`
                                        : `เหลือ ${item.days_until_due} วัน`
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex sm:justify-end justify-center">
                              <div className="text-center">
                                <div className="text-xs text-slate-500 mb-1">อุปกรณ์</div>
                                <div className="text-sm font-bold text-slate-700 bg-white rounded-full px-2 py-1 border border-slate-300">
                                  {item.equipment.length}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className={`mt-2 p-2 rounded-2xl border-2 transition-all duration-300 hover:shadow-sm cursor-pointer ${
                            item.urgency_status === 'overdue' 
                              ? 'border-red-500 bg-red-600 hover:border-red-500 hover:shadow-red-500' 
                              : 'border-orange-500 bg-orange-600 hover:border-orange-500 hover:shadow-orange-500'
                          }`}>
                            <div className="flex flex-wrap gap-1">
                              {item.equipment.slice(0, 3).map((eq, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs text-slate-700 border border-slate-200 shadow-sm">
                                  <span className="font-medium">{eq.name}</span>
                                  <span className="text-white bg-black px-1 py-0.5 rounded-full text-xs">×{eq.quantity}</span>
                                </span>
                              ))}
                              {item.equipment.length > 3 && (
                                <span className="inline-flex items-center px-2 py-1 bg-slate-100 rounded-full text-xs text-slate-600 border border-slate-200">
                                  +{item.equipment.length - 3} อื่นๆ
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Pending Payment Items */}
              {pendingPaymentItems.length > 0 && (
                <div className="bg-yellow-50 rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                  <div className="bg-yellow-400 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/50 rounded-xl flex items-center justify-center">
                          <PaymentIcon className="text-black text-xl sm:text-2xl" />
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-xl font-bold text-black">รายการค้างชำระ</h2>
                          <p className="text-black/90 text-sm mt-1">ค่าปรับที่ยังไม่ได้ชำระเงิน</p>
                          <span className="text-black/90 text-sm font-medium">{pendingPaymentItems.length} รายการ</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-bold text-black bg-white/50 px-3 py-1.5 rounded-full flex items-center gap-1"> รวม {pendingPaymentItems.reduce((sum, item) => sum + Number(item.fine_amount), 0).toLocaleString()} บาท
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="grid gap-3 sm:gap-4">
                      {pendingPaymentItems.map((item) => (
                        <motion.div 
                          key={item.borrow_id}
                          className="p-3 rounded-2xl border-2 border-yellow-200 bg-yellow-100 hover:border-yellow-300 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-100 cursor-pointer"
                          whileHover={{ scale: 1.01 }}
                          onClick={() => navigate('/return-list')}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-start gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex-shrink-0">
                                {item.borrower.avatar ? (
                                  <img 
                                    src={item.borrower.avatar} 
                                    alt={item.borrower.name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-md">
                                    <PeopleIcon className="text-slate-600 text-sm" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 mb-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-200 text-yellow-800 border border-yellow-200 shadow-sm">
                                    <PaymentIcon className="w-3 h-3" /> รอชำระเงิน
                                  </span>
                                  <h3 className="font-bold text-slate-800 text-sm truncate mb-0 sm:mb-1">{item.borrower.name}</h3>
                                </div>
                                <p className="text-xs text-slate-600 truncate mb-1">
                                  {item.borrower.position} • {item.borrower.department}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 text-xs">
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-500">รหัส:</span>
                                    <span className="font-semibold">{item.borrow_code}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-500">คืนเมื่อ:</span>
                                    <span className="font-semibold text-slate-700">{item.actual_return_date}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-500">ค่าปรับ:</span>
                                    <span className="font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                                      <MoneyIcon className="w-3 h-3" /> {Number(item.fine_amount).toLocaleString()} บาท
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex sm:justify-end justify-center">
                              <div className="text-center">
                                <div className="text-xs text-slate-500 mb-1">อุปกรณ์</div>
                                <div className="text-sm font-bold text-slate-700 bg-white rounded-full px-2 py-1 border border-slate-300">
                                  {item.equipment.length}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 p-2 rounded-2xl border-2 transition-all duration-300 hover:shadow-sm cursor-pointer border-yellow-300 bg-yellow-400 hover:border-yellow-300 hover:shadow-yellow-400">
                            <div className="flex flex-wrap gap-1">
                              {item.equipment.slice(0, 3).map((eq, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs text-slate-700 border border-slate-200 shadow-sm">
                                  <span className="font-medium">{eq.name}</span>
                                  <span className="text-white bg-black px-1 py-0.5 rounded-full text-xs">×{eq.quantity}</span>
                                </span>
                              ))}
                              {item.equipment.length > 3 && (
                                <span className="inline-flex items-center px-2 py-1 bg-slate-100 rounded-full text-xs text-slate-600 border border-slate-200">
                                  +{item.equipment.length - 3} อื่นๆ
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}


        {/* Quick Actions Grid */}
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4 sm:gap-6 mb-8" variants={containerVariants}>
          {summaryTableData.map((item) => (
            <motion.div
              key={item.id}
              className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-100"
              onClick={() => item.path && navigate(item.path)}
              whileHover={{ scale: 1.02, y: -4 }}
              variants={itemVariants}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${item.statusColor?.replace('text-', 'bg-').replace('-500', '-100')} group-hover:scale-110 transition-transform duration-300`}>
                  <div className="text-2xl">{item.icon}</div>
                </div>
                <div>
                  <h3 className="font-bold text-2xl text-slate-800 mb-1">{item.count}</h3>
                  <p className="text-sm font-medium text-slate-600 leading-tight">{item.category}</p>
                  {item.status && (
                    <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${item.statusColor?.replace('text-', 'bg-').replace('-500', '-100')} ${item.statusColor}`}>
                      {item.status}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Dashboard Charts Section */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-10" variants={containerVariants}>
          {/* Equipment Status PieChart */}
          <motion.div 
            className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 border border-slate-100"
            variants={itemVariants}
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-slate-800">สถานะครุภัณฑ์</h2>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={equipmentStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    innerRadius={48}
                    fill="#8884d8"
                    dataKey="value"
                    isAnimationActive={true}
                    animationDuration={900}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelStyle={{ fontWeight: 600, fontSize: 14 }}
                    activeIndex={-1}
                    activeShape={props => (
                      <g>
                        <Pie {...props} />
                        <text x={props.cx} y={props.cy} dy={8} textAnchor="middle" fill="#333" fontSize={18} fontWeight={700}>
                          {equipmentStatusData.reduce((sum, d) => sum + (d.value || 0), 0)}
                        </text>
                      </g>
                    )}
                  >
                    {equipmentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || ['#6366f1','#3b82f6','#06b6d4','#f59e42','#f43f5e','#10b981','#fbbf24','#a78bfa','#f87171','#34d399'][index % 10]} cursor="pointer" />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value}`, name]}
                    labelFormatter={(label) => `สถานะ: ${label}`}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.97)', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Legend verticalAlign="bottom" height={36} iconSize={14} formatter={(value) => <span style={{fontWeight:300, color:'#374151'}}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Borrow/Return Trends BarChart */}
          <motion.div 
            className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 border border-slate-100"
            variants={itemVariants}
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-slate-800">แนวโน้มการยืม-คืน</h2>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={borrowReturnData.map(row => ({
                    ...row,
                    month: row.month_th || row.month || row.label || '',
                    การยืม: row.borrow_count || row["การยืม"] || row.borrow || 0,
                    การคืน: row.return_count || row["การคืน"] || row.return || 0
                  }))}
                  margin={{ top: 5, right: 0, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    formatter={(value, name) => [`${value} ครั้ง`, name]}
                    labelFormatter={(label) => `เดือน: ${label}`}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Legend verticalAlign="bottom" height={36} iconSize={12} />
                  <Bar dataKey="การยืม" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={15} />
                  <Bar dataKey="การคืน" fill="#10b981" radius={[4, 4, 0, 0]} barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Branch Borrow Summary PieChart */}
          <motion.div 
            className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 border border-slate-100"
            variants={itemVariants}
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-slate-800">สรุปการยืมตามสาขา</h2>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={branchBorrowSummary}
                    dataKey="borrow_count"
                    nameKey="branch_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={48}
                    isAnimationActive={true}
                    animationDuration={900}
                    label={({ branch_name, percent }) => `${branch_name} ${(percent * 100).toFixed(0)}%`}
                    labelStyle={{ fontWeight: 600, fontSize: 14 }}
                    labelLine={false}
                  >
                    {branchBorrowSummary.map((entry, idx) => (
                      <Cell key={`cell-branch-${idx}`} fill={['#6366f1','#3b82f6','#06b6d4','#f59e42','#f43f5e','#10b981','#fbbf24','#a78bfa','#f87171','#34d399'][idx % 10]} cursor="pointer" />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} ครั้ง`, `สาขา: ${name}`]}
                    labelFormatter={(label) => `${label}`}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.97)', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Legend verticalAlign="bottom" height={36} iconSize={14} formatter={(value) => <span style={{fontWeight:300, color:'#374151'}}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Top Borrowed Equipment BarChart */}
          <motion.div 
            className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 border border-slate-100"
            variants={itemVariants}
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-3 h-3 bg-sky-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-slate-800">อุปกรณ์ที่ถูกยืมบ่อยสุด</h2>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={topBorrowedItems}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="name" type="category" width={120} fontSize={12} tick={{ textAnchor: 'end' }} />
                  <Tooltip 
                    formatter={(value, name) => [`${value} ครั้ง`, `อุปกรณ์: ${name}`]}
                    labelFormatter={(label) => `${label}`}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </motion.div>

        {/* Risk Users Table */}
        <motion.div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 mb-8 border border-slate-100" variants={itemVariants}>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <h2 className="text-lg font-semibold text-slate-800">ผู้ใช้กลุ่มเสี่ยง</h2>
          </div>
          <div className="overflow-x-auto">
            {Array.isArray(topRiskUsers) && topRiskUsers.length > 0 ? (
              <table className="w-full rounded-lg overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-red-100">
                    <th className="py-3 px-6 text-xs font-bold text-red-700 uppercase tracking-wider text-left">อันดับ</th>
                    {topRiskUsersColumns.map(col => (
                      <th key={col.field} className="py-3 px-6 text-xs font-bold text-slate-700 uppercase tracking-wider text-left">{col.headerName}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topRiskUsers.map((row, idx) => (
                    <tr key={idx} className={`transition-all duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-orange-50`}>
                      <td className="py-3 px-6 text-left align-middle">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-base font-bold shadow ${idx === 0 ? 'bg-red-600' : idx === 1 ? 'bg-orange-500' : idx === 2 ? 'bg-yellow-400 text-slate-800' : 'bg-orange-300 text-slate-800'}`}>
                          {idx + 1}
                        </div>
                      </td>
                      {topRiskUsersColumns.map(col => (
                        <td key={col.field} className="py-3 px-6 text-sm text-slate-700 font-medium align-middle">
                          {col.field === 'total_fine' ? <span className="font-bold text-red-500">{Number(row[col.field]).toLocaleString()} บาท</span> : row[col.field]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center text-slate-400 py-16">
                <div className="text-4xl mb-4">📊</div>
                <p>ไม่มีข้อมูล</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Frequent Damage Users Table */}
        <motion.div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 mb-8 border border-slate-100" variants={itemVariants}>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <h2 className="text-lg font-semibold text-slate-800">ผู้ใช้คืนของเสียบ่อย</h2>
          </div>
          <div className="overflow-x-auto">
            {Array.isArray(frequentDamageUsers) && frequentDamageUsers.length > 0 ? (
              <table className="w-full rounded-lg overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-yellow-100">
                    <th className="py-3 px-6 text-xs font-bold text-yellow-700 uppercase tracking-wider text-left">อันดับ</th>
                    {frequentDamageUsersColumns.map(col => (
                      <th key={col.field} className="py-3 px-6 text-xs font-bold text-slate-700 uppercase tracking-wider text-left">{col.headerName}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {frequentDamageUsers.map((row, idx) => (
                    <tr key={idx} className={`transition-all duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-yellow-50`}>
                      <td className="py-3 px-6 text-left align-middle">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-base font-bold shadow ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-orange-400' : idx === 2 ? 'bg-orange-300 text-slate-800' : 'bg-yellow-200 text-slate-800'}`}>
                          {idx + 1}
                        </div>
                      </td>
                      {frequentDamageUsersColumns.map(col => (
                        <td key={col.field} className="py-3 px-6 text-sm text-slate-700 font-medium align-middle">
                          {row[col.field]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center text-slate-400 py-12">
                <div className="text-3xl mb-2">📊</div>
                <p>ไม่มีข้อมูล</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default DashboardAdmin;