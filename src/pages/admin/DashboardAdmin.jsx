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
        const statsRes = await axios.get('/api/dashboard/summary');
        setStats(statsRes.data);
      } catch (e) {}
      try {
        const res = await axios.get('/api/dashboard/return-status');
        setEquipmentStatusData(res.data);
      } catch (e) { setEquipmentStatusData([]); }
      try {
        const res = await axios.get('/api/dashboard/monthly-borrow');
        setBorrowReturnData(res.data);
      } catch (e) { setBorrowReturnData([]); }
      try {
        const res = await axios.get('/api/dashboard/top-borrowed-equipment');
        setTopBorrowedItems(res.data);
      } catch (e) { setTopBorrowedItems([]); }
      try {
        const res = await axios.get('/api/dashboard/top-risk-users');
        setTopRiskUsers(res.data);
      } catch (e) { setTopRiskUsers([]); }
      try {
        const res = await axios.get('/api/dashboard/frequent-damage-users');
        setFrequentDamageUsers(res.data);
      } catch (e) { setFrequentDamageUsers([]); }
      try {
        const res = await axios.get('/api/dashboard/branch-borrow-summary');
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

  // Additional items for the expanded view
  const additionalSummaryItems = [
    {
      id: 2,
      category: 'จัดการผู้ใช้งาน',
      icon: <PeopleIcon className="text-purple-500" />,
      count: stats.totalUsers,
      status: '',
      statusColor: 'text-green-500',
      path: '/members'
    },
    {
      id: 6,
      category: 'จัดการหมวดหมู่',
      icon: <CategoryIcon className="text-amber-500" />,
      count: stats.totalCategories,
      status: '',
      statusColor: '',
      path: '/category'
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
    <motion.div
      className="p-6 md:p-8 flex-grow bg-gray-50 text-gray-800 min-h-screen"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto">
        <motion.h1
          className="text-3xl font-bold mb-10 text-gray-800 pl-2"
          variants={itemVariants}
        >
          แดชบอร์ดผู้ดูแลระบบ
        </motion.h1>

        {/* Summary Table - Now with integrated navigation */}
        <motion.div
          className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 mb-8"
          variants={itemVariants}
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
            <ListAltIcon className="mr-2 text-blue-600" />
            ภาพรวมและทางลัด
          </h2>

          <div className="grid grid-cols-1 gap-3">
            {summaryTableData.map((item) => (
              <motion.div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-150 ${item.path ? 'cursor-pointer hover:bg-blue-50/40' : ''}`}
                onClick={() => item.path && navigate(item.path)}
                whileHover={item.path ? { scale: 1.01 } : {}}
                variants={itemVariants}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full ${item.statusColor?.replace('text-', 'bg-').replace('-500', '-100')}`}>
                    {item.icon}
                  </div>
                  <span className="font-semibold">{item.category}</span>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center justify-center min-w-[60px]">
                    <span className="font-bold text-xl text-gray-700">{item.count}</span>
                  </div>
                  <div className="min-w-[120px] text-right">
                    {item.status ? (
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm ${item.statusColor?.replace('text-', 'bg-').replace('-500', '-50')} ${item.statusColor}`}>
                        {item.status}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>



        {/* Additional Management Options */}
        <motion.div
          className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 mb-8"
          variants={itemVariants}
        >
          <h2 className="text-xl font-semibold mb-6 text-gray-700 pb-3 flex items-center border-b border-gray-100">
            <CategoryIcon className="mr-2 text-amber-600" />
            การจัดการระบบเพิ่มเติม
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {additionalSummaryItems.map((item) => (
              <motion.div
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-lg hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                variants={itemVariants}
                whileHover={{ x: 5 }}
                onClick={() => item.path && navigate(item.path)}
              >
                <div className="p-3 rounded-full bg-gray-100">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{item.category}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-lg font-bold text-gray-700">{item.count}</span>
                    <span className={`text-xs ${item.statusColor}`}>{item.status}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Dashboard Charts Section - Responsive and Balanced Layout */}
        <motion.div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-12" variants={containerVariants}>
          {/* Equipment Status PieChart */}
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col items-center justify-center min-h-[370px]"
            variants={itemVariants}
          >
            <h2 className="text-xl font-semibold mb-6 text-gray-700 pb-3 flex items-center border-b border-gray-100 w-full">
              <PieChartOutlineIcon className="mr-2 text-indigo-500" />
              สถานะครุภัณฑ์
            </h2>
            <div className="h-[220px] w-full flex items-center justify-center">
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
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col items-center justify-center min-h-[370px]"
            variants={itemVariants}
          >
            <h2 className="text-xl font-semibold mb-6 text-gray-700 pb-3 flex items-center border-b border-gray-100 w-full">
              <TrendingUpIcon className="mr-2 text-teal-500" />
              แนวโน้มการยืม-คืน
            </h2>
            <div className="h-[220px] w-full flex items-center justify-center">
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
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col items-center justify-center min-h-[370px]"
            variants={itemVariants}
          >
            <h2 className="text-xl font-semibold mb-6 text-gray-700 pb-3 flex items-center border-b border-gray-100 w-full">
              <AssignmentReturnIcon className="mr-2 text-indigo-500" />
              สรุปการยืมตามสาขา
            </h2>
            <div className="h-[220px] w-full flex items-center justify-center">
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

          {/* Top Borrowed Equipment BarChart (from executive) */}
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col items-center justify-center min-h-[370px]"
            variants={itemVariants}
          >
            <h2 className="text-xl font-semibold mb-6 text-gray-700 pb-3 flex items-center border-b border-gray-100 w-full">
              <AssignmentReturnIcon className="mr-2 text-sky-500" />
              อุปกรณ์ที่ถูกยืมบ่อยสุด
            </h2>
            <div className="h-[220px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={topBorrowedItems}
                  margin={{ top: 5, right: 20, left: 120, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="name" type="category" width={120} fontSize={12} tick={{ textAnchor: 'end' }} />
                  <Tooltip 
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
      </div>
      {/* Risk Users Table - Improved UI */}
      <motion.div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 mb-10" variants={itemVariants}>
        <h2 className="text-xl font-semibold text-gray-700 pb-3 flex items-center border-gray-100">
          <WarningIcon className="mr-2 text-red-500" />
          ผู้ใช้กลุ่มเสี่ยง
        </h2>
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

      {/* Frequent Damage Users Table - Improved UI */}
      <motion.div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 mb-10" variants={itemVariants}>
        <h2 className="text-xl font-semibold text-gray-700 pb-3 flex items-center border-b border-gray-100">
          <WarningIcon className="mr-2 text-yellow-500" />
          ผู้ใช้คืนของเสียบ่อย
        </h2>
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
    );
}

export default DashboardAdmin;