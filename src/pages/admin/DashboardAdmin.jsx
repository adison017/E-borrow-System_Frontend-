import {
  AssignmentReturn as AssignmentReturnIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Category as CategoryIcon,
  CheckCircle as DoneIcon,
  Inventory as InventoryIcon,
  ListAlt as ListAltIcon,
  People as PeopleIcon,
  PieChartOutline as PieChartOutlineIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import axios from 'axios';
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