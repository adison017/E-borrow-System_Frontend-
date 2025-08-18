import axios from 'axios';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { FaChartBar, FaChartLine, FaExclamationTriangle, FaTools } from 'react-icons/fa';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { API_BASE } from '@/utils/api';

const API = (endpoint) => `${API_BASE}/dashboard/${endpoint}`;

const widgetConfigs = [
  { key: 'monthlyBorrow', title: 'ยอดการยืมรายเดือน', type: 'line', endpoint: 'monthly-borrow' },
  { key: 'returnStatus', title: 'สถานะการคืนอุปกรณ์', type: 'pie', endpoint: 'return-status' },
  { key: 'topBorrowedEquipment', title: 'อุปกรณ์ถูกยืมมากสุด 5 อันดับ', type: 'bar', endpoint: 'top-borrowed-equipment' },
  { key: 'repairStatus', title: 'คำขอซ่อมแยกตามสถานะ', type: 'bar', endpoint: 'repair-status' },
  { key: 'weeklyBorrowTrend', title: 'แนวโน้มการยืมรายสัปดาห์', type: 'area', endpoint: 'weekly-borrow-trend' },
  { key: 'borrowForecast', title: 'คาดการณ์การยืมในเดือนถัดไป', type: 'kpi', endpoint: 'borrow-forecast' },
  { key: 'topDamagedEquipment', title: 'อุปกรณ์ที่มีประวัติเสียหายซ้ำ (Top 5)', type: 'bar', endpoint: 'top-damaged-equipment' },
  { key: 'topRiskUsers', title: 'ผู้ใช้ที่มีค่าปรับรวมสูงสุด (Top 5 Risk User)', type: 'table', endpoint: 'top-risk-users' },
  { key: 'totalEquipmentValue', title: 'มูลค่าอุปกรณ์ในระบบทั้งหมด', type: 'kpi', endpoint: 'total-equipment-value' },
  { key: 'totalDamagedValue', title: 'มูลค่าอุปกรณ์ที่เสียหาย/สูญหายรวม', type: 'kpi', endpoint: 'total-damaged-value' },
  { key: 'totalRepairCost', title: 'ค่าใช้จ่ายซ่อมทั้งหมด', type: 'kpi', endpoint: 'total-repair-cost' },
  { key: 'depreciation', title: 'ค่าเสื่อมราคาทรัพย์สินโดยประมาณ', type: 'line', endpoint: 'depreciation' },
  { key: 'repairVsBorrowRatio', title: 'อัตราส่วนคำขอซ่อมต่อการยืมทั้งหมด', type: 'pie', endpoint: 'repair-vs-borrow-ratio' },
  { key: 'topFineCategories', title: 'หมวดหมู่ที่ก่อค่าปรับสูงสุด', type: 'bar', endpoint: 'top-fine-categories' },
  { key: 'frequentDamageUsers', title: 'ผู้ใช้งานที่คืนของเสียบ่อย', type: 'table', endpoint: 'frequent-damage-users' },
  { key: 'branchBorrowSummary', title: 'ค่าสรุปการยืมตามสาขา', type: 'bar', endpoint: 'branch-borrow-summary' },
];

const colorPalette = ['#1e40af', '#dc2626', '#059669', '#d97706', '#7c3aed', '#0891b2', '#be185d', '#0d9488', '#7c2d12', '#86198f'];

const DashboardExeutive = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data from all endpoints
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      const newData = {};
      await Promise.all(
        widgetConfigs.map(async (cfg) => {
          try {
            const res = await axios.get(API(cfg.endpoint));
            console.log(`[API] ${cfg.endpoint} response:`, res.data);
            newData[cfg.key] = res.data;
          } catch (err) {
            console.error(`Dashboard API error: ${cfg.endpoint}`, err);
            if (["table","bar","line","pie","area","donut"].includes(cfg.type)) {
              newData[cfg.key] = [];
            } else {
              newData[cfg.key] = {};
            }
          }
        })
      );
      console.log('[DashboardExeutive] setData:', newData);
      setData(newData);
      setLoading(false);
    };
    fetchAllData();
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };


  // Enhanced summary cards with icons and better styling
  const summaryCards = [
    {
      title: 'มูลค่าครุภัณฑ์ทั้งหมด',
      value: Number((data.totalEquipmentValue && (typeof data.totalEquipmentValue.total_value === 'string' ? parseFloat(data.totalEquipmentValue.total_value) : data.totalEquipmentValue.total_value)) ?? 0),
      color: 'blue',
      bgGradient: 'from-blue-500 to-blue-600',
      icon: <FaChartBar className="text-4xl text-blue-500" />,
      unit: ' บาท',
    },
    {
      title: 'มูลค่าครุภัณฑ์เสียหาย/สูญหาย',
      value: Number((data.totalDamagedValue && (typeof data.totalDamagedValue.damaged_value === 'string' ? parseFloat(data.totalDamagedValue.damaged_value) : data.totalDamagedValue.damaged_value)) ?? 0),
      color: 'red',
      bgGradient: 'from-red-500 to-red-600',
      icon: <FaExclamationTriangle className="text-4xl text-red-500" />,
      unit: ' บาท',
    },
    {
      title: 'ค่าใช้จ่ายซ่อมแซมรวม',
      value: Number((data.totalRepairCost && (typeof data.totalRepairCost.total_repair_cost === 'string' ? parseFloat(data.totalRepairCost.total_repair_cost) : data.totalRepairCost.total_repair_cost)) ?? 0),
      color: 'purple',
      bgGradient: 'from-purple-500 to-purple-600',
      icon: <FaTools className="text-4xl text-purple-500" />,
      unit: ' บาท',
    },
    {
      title: 'คาดการณ์จำนวนการยืมเดือนถัดไป',
      value: Number((data.borrowForecast && (typeof data.borrowForecast.forecast === 'string' ? parseFloat(data.borrowForecast.forecast) : data.borrowForecast.forecast)) ?? 0),
      color: 'green',
      bgGradient: 'from-green-500 to-green-600',
      icon: <FaChartLine className="text-4xl text-green-500" />,
      unit: ' ครั้ง',
    },
  ];

  // Loading screen
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <motion.div 
        className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto" 
        initial="hidden" 
        animate="visible" 
        variants={containerVariants}
      >
        {/* Header Section */}
        <motion.div className="mb-8" variants={itemVariants}>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
            แดชบอร์ดผู้บริหาร
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">ภาพรวมและการวิเคราะห์การจัดการอุปกรณ์</p>
        </motion.div>

        {/* Enhanced Summary Cards */}
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10" variants={containerVariants}>
          {summaryCards.map((card, idx) => (
            <motion.div 
              key={card.title} 
              className="group relative overflow-hidden"
              variants={itemVariants} 
              whileHover={{ scale: 1.02, y: -4, transition: { duration: 0.2 } }}
            >
              <div className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-slate-100 transition-all duration-300 p-6 h-full relative overflow-hidden"> 
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl pointer-events-none`}></div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-${card.color}-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <div className="text-xl">{card.icon}</div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-slate-700 text-sm font-medium leading-tight mb-3">{card.title}</h3>
                    <div className="flex items-end gap-1">
                      <span className={`text-2xl sm:text-3xl font-bold text-${card.color}-600`}>{card.value.toLocaleString()}</span>
                      <span className="text-slate-500 text-sm font-medium">{card.unit}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Analytics Grid */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-10" variants={containerVariants}>
          {/* Return Status */}
          <motion.div className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-slate-100 transition-shadow duration-300 p-6" variants={itemVariants}>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-slate-800">สถานะครุภัณฑ์</h2>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.returnStatus || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={90}
                    innerRadius={45}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {(data.returnStatus || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || colorPalette[index % colorPalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value}`, name]}
                    labelFormatter={(label) => `สถานะ: ${label}`}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} 
                  />
                  <Legend verticalAlign="bottom" height={36} iconSize={12} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Monthly Borrow Trend */}
          <motion.div className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-slate-100 transition-shadow duration-300 p-6" variants={itemVariants}>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-slate-800">แนวโน้มการยืม-คืน</h2>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Array.isArray(data.monthlyBorrow) ? data.monthlyBorrow.map(row => ({
                    ...row,
                    month: row.month_th || row.month || row.label || '',
                    การยืม: row.borrow_count || row["การยืม"] || row.borrow || 0,
                    การคืน: row.return_count || row["การคืน"] || row.return || 0
                  })) : []}
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
                  <Bar dataKey="การยืม" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="การคืน" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Top Borrowed Equipment */}
          <motion.div className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-slate-100 transition-shadow duration-300 p-6" variants={itemVariants}>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-slate-800">อุปกรณ์ยอดนิยม</h2>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topBorrowedEquipment || []} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    formatter={(value, name) => [`${value} ครั้ง`, `อุปกรณ์: ${name}`]}
                    labelFormatter={(label) => `${label}`}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} 
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={20}>
                    {(data.topBorrowedEquipment || []).map((entry, idx) => (
                      <Cell key={idx} fill={colorPalette[idx % colorPalette.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </motion.div>

        {/* Secondary Analytics Grid */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10" variants={containerVariants}>
          {/* Repair Status */}
          <motion.div className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-slate-100 transition-shadow duration-300 p-6" variants={itemVariants}>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-slate-800">สถานะการซ่อมแซม</h2>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.repairStatus || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={90}
                    innerRadius={45}
                    dataKey="count"
                    nameKey="status"
                    label={({ status, percent }) => `${status === 'approved' ? 'อนุมัติ' : status}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {(data.repairStatus || []).map((entry, idx) => (
                      <Cell key={idx} fill={colorPalette[idx % colorPalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} รายการ`, `สถานะ: ${name === 'approved' ? 'อนุมัติ' : name}`]}
                    labelFormatter={(label) => `${label}`}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconSize={12} 
                    formatter={(value) => value === 'approved' ? 'อนุมัติ' : value}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Branch Summary */}
          <motion.div className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-slate-100 transition-shadow duration-300 p-6" variants={itemVariants}>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-slate-800">สรุปการยืมตามสาขา</h2>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.branchBorrowSummary || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={90}
                    innerRadius={45}
                    dataKey="borrow_count"
                    nameKey="branch_name"
                    label={({ branch_name, percent }) => `${branch_name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {(data.branchBorrowSummary || []).map((entry, idx) => (
                      <Cell key={idx} fill={colorPalette[idx % colorPalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} ครั้ง`, `สาขา: ${name}`]}
                    labelFormatter={(label) => `${label}`}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} 
                  />
                  <Legend verticalAlign="bottom" height={36} iconSize={12} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </motion.div>

        {/* Additional Analytics Grid */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10" variants={containerVariants}>
          {/* Top Fine Categories */}
          <motion.div className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-slate-100 transition-shadow duration-300 p-6" variants={itemVariants}>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-slate-800">หมวดหมู่ค่าปรับสูงสุด</h2>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    Array.isArray(data.topFineCategories)
                      ? data.topFineCategories.map(cat => ({
                          ...cat,
                          total_fine: Number(typeof cat.total_fine === 'string' ? parseFloat(cat.total_fine) : (cat.total_fine ?? 0)),
                        }))
                      : []
                  }
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    formatter={(value) => [`${value.toLocaleString()} บาท`, 'ค่าปรับรวม']}
                    labelFormatter={(label) => `หมวดหมู่: ${label}`}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} 
                  />
                  <Bar dataKey="total_fine" radius={[8, 8, 0, 0]} barSize={40}>
                    {(Array.isArray(data.topFineCategories) ? data.topFineCategories : []).map((entry, idx) => (
                      <Cell key={idx} fill={colorPalette[idx % colorPalette.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Top Damaged Equipment */}
          <motion.div className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-slate-100 transition-shadow duration-300 p-6" variants={itemVariants}>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-slate-800">อุปกรณ์เสียหายซ้ำ</h2>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topDamagedEquipment || []} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    formatter={(value, name) => [`${value} ครั้ง`, 'จำนวนเสียหาย']}
                    labelFormatter={(label) => `อุปกรณ์: ${label}`}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} 
                  />
                  <Bar dataKey="damage_count" radius={[0, 8, 8, 0]} barSize={20}>
                    {(data.topDamagedEquipment || []).map((entry, idx) => (
                      <Cell key={idx} fill={colorPalette[idx % colorPalette.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </motion.div>

        {/* Depreciation Trend */}
        <motion.div className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-slate-100 transition-shadow duration-300 p-6 mb-10" variants={itemVariants}>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
            <h2 className="text-lg font-semibold text-slate-800">ค่าเสื่อมราคาทรัพย์สินรายปี (บาท)</h2>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.depreciation || []} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ef" />
                <XAxis dataKey="year" tick={{ fontSize: 13, fill: '#334155' }} label={{ value: 'ปี', position: 'insideBottom', offset: -5, fontSize: 14, fill: '#334155' }} />
                <YAxis tick={{ fontSize: 13, fill: '#334155' }} tickFormatter={v => v.toLocaleString()} label={{ value: 'ค่าเสื่อมราคา (บาท)', angle: -90, position: 'insideLeft', fontSize: 14, fill: '#334155' }} />
                <Tooltip 
                  formatter={v => [`${Number(v).toLocaleString()} บาท`, 'ค่าเสื่อมราคา']}
                  labelFormatter={label => `ปี ${label}`}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="depreciation" 
                  stroke="#0ea5e9" 
                  strokeWidth={4} 
                  dot={{ fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2, r: 7 }}
                  activeDot={{ r: 10, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default DashboardExeutive;