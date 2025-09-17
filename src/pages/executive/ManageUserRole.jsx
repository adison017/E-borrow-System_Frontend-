import {
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from '../../utils/axios';

import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
  ThemeProvider,
  Typography
} from "@material-tailwind/react";
import { API_BASE, UPLOAD_BASE } from '../../utils/api';
import UserDetailDialog from './dialogs/UserDetailDialog';

const theme = {
  typography: {
    defaultProps: {
      color: "#374151",
      textGradient: false,
    },
  }
};

const TABLE_HEAD = [
  "รหัสนิสิต",
  "รูปภาพ", 
  "ชื่อ-นามสกุล",
  "อีเมล",
  "ตำแหน่ง",
  "สาขา",
  "บทบาท"
];

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

function ManageUserRole() {
  const [userList, setUserList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const effectRan = useRef(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [roleFilter, setRoleFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [positions, setPositions] = useState([]);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleRowClick = (user) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/users`, {
        headers: getAuthHeaders(),
        timeout: 10000
      });

      if (response.data && Array.isArray(response.data)) {
        setUserList(response.data);
      } else {
        throw new Error('รูปแบบข้อมูลที่ได้รับไม่ถูกต้อง');
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        toast.error('การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง');
      } else if (error.response?.status === 401) {
        toast.error('กรุณาเข้าสู่ระบบใหม่');
      } else {
        toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน');
      }
      setUserList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!effectRan.current) {
      effectRan.current = true;
      fetchUsers();
    }
  }, []);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [rolesRes, branchesRes, positionsRes] = await Promise.all([
          axios.get(`${API_BASE}/users/roles`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE}/users/branches`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE}/users/positions`, { headers: getAuthHeaders() }),
        ]);
        setRoles(rolesRes.data || []);
        setBranches(branchesRes.data || []);
        setPositions(positionsRes.data || []);
      } catch (err) {
        setRoles([]);
        setBranches([]);
        setPositions([]);
      }
    };
    fetchFilters();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    if (updatingUserId) return;
    
    setUpdatingUserId(userId);
    try {
      const response = await axios.put(`${API_BASE}/users/id/${userId}`, 
        { role_id: newRole === 'admin' ? 1 : newRole === 'executive' ? 2 : 3 },
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        setUserList(prevList => prevList.map(user =>
          user.user_id === userId ? { ...user, role_name: newRole } : user
        ));
        toast.success(`เปลี่ยนบทบาทเป็น ${newRole === 'user' ? 'ผู้ใช้งาน' : newRole === 'admin' ? 'ผู้ดูแลระบบ' : newRole} เรียบร้อยแล้ว`);
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเปลี่ยนบทบาท: ' + (error.response?.data?.message || error.message));
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = userList.filter(user => {
    const matchesSearch =
      (user.student_id && String(user.student_id).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.user_code && String(user.user_code).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.Fullname && user.Fullname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.position_name && user.position_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.branch_name && user.branch_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = !roleFilter || user.role_name === roleFilter;
    const matchesBranch = !branchFilter || user.branch_name === branchFilter;
    const matchesPosition = !positionFilter || user.position_name === positionFilter;
    return matchesSearch && matchesRole && matchesBranch && matchesPosition;
  });

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  return (
    <ThemeProvider value={theme}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Card className="h-full w-full text-gray-800 rounded-2xl shadow-lg">
        <CardHeader floated={false} shadow={false} className="rounded-t-2xl bg-white px-8 py-2">
          <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <Typography variant="h5" className="text-gray-900 font-semibold tracking-tight">
                จัดการบทบาทผู้ใช้งาน
              </Typography>
              <Typography color="gray" className="mt-1 font-normal text-sm text-gray-600">
                เปลี่ยนบทบาทของผู้ใช้งานในระบบ
              </Typography>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-y-4 md:gap-x-4">
            <div className="w-full md:flex-grow relative flex flex-col md:flex-row gap-2 md:gap-4">
              <div className="flex-1 relative">
                <label htmlFor="search" className="sr-only">ค้นหาผู้ใช้งาน</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="search"
                    type="text"
                    className="w-full h-10 pl-10 pr-4 py-2.5 border border-gray-300 rounded-2xl text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm placeholder-gray-400"
                    placeholder="ค้นหารหัสนิสิต, ชื่อ, อีเมล, ตำแหน่ง หรือสาขา..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="mt-4 flex flex-wrap items-center gap-2 justify-center">
            <Menu>
              <MenuHandler>
                <Button
                  variant="outlined"
                  className={`w-55 border-gray-300 shadow-sm rounded-xl flex items-center px-4 py-2 text-sm font-medium normal-case justify-between transition-colors duration-200 ${roleFilter ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <span className="flex items-center gap-2">
                    <MagnifyingGlassIcon className="w-4 h-4" />
                    บทบาท
                    {roleFilter && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full ml-2">
                        {roleFilter === 'user' ? 'ผู้ใช้งาน' : roleFilter === 'admin' ? 'ผู้ดูแลระบบ' : roleFilter}
                      </span>
                    )}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </Button>
              </MenuHandler>
              <MenuList className="min-w-[160px] bg-white text-gray-800 rounded-lg border border-gray-100 p-2">
                <MenuItem
                  className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors duration-200 ${!roleFilter ? 'bg-blue-50 text-blue-700 font-semibold' : 'font-normal'}`}
                  onClick={() => setRoleFilter("")}
                >
                  <span>บทบาททั้งหมด</span>
                  <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{userList.length}</span>
                </MenuItem>
                {roles.map(role => {
                  const count = userList.filter(u => u.role_name === role.role_name).length;
                  return (
                    <MenuItem
                      key={role.role_id}
                      className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors duration-200 ${roleFilter === role.role_name ? 'bg-blue-50 text-blue-700 font-semibold' : 'font-normal'}`}
                      onClick={() => setRoleFilter(role.role_name)}
                    >
                      <span>{role.role_name === 'user' ? 'ผู้ใช้งาน' : role.role_name === 'admin' ? 'ผู้ดูแลระบบ' : role.role_name}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{count}</span>
                    </MenuItem>
                  );
                })}
              </MenuList>
            </Menu>
            <Menu>
              <MenuHandler>
                <Button
                  variant="outlined"
                  className={`w-65 border-gray-300 shadow-sm rounded-xl flex items-center px-4 py-2 text-sm font-medium normal-case justify-between transition-colors duration-200 ${branchFilter ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <span className="flex items-center gap-2">
                    <MagnifyingGlassIcon className="w-4 h-4" />
                    สาขา
                    {branchFilter && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full ml-2">{branchFilter}</span>
                    )}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </Button>
              </MenuHandler>
              <MenuList className="min-w-[200px] bg-white text-gray-800 rounded-lg border border-gray-100 p-2">
                <MenuItem
                  className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors duration-200 ${!branchFilter ? 'bg-blue-50 text-blue-700 font-semibold' : 'font-normal'}`}
                  onClick={() => setBranchFilter("")}
                >
                  <span>สาขาทั้งหมด</span>
                  <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{userList.length}</span>
                </MenuItem>
                {branches.map(branch => {
                  const count = userList.filter(u => u.branch_name === branch.branch_name).length;
                  return (
                    <MenuItem
                      key={branch.branch_id}
                      className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors duration-200 ${branchFilter === branch.branch_name ? 'bg-blue-50 text-blue-700 font-semibold' : 'font-normal'}`}
                      onClick={() => setBranchFilter(branch.branch_name)}
                    >
                      <span>{branch.branch_name}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{count}</span>
                    </MenuItem>
                  );
                })}
              </MenuList>
            </Menu>
            <Menu>
              <MenuHandler>
                <Button
                  variant="outlined"
                  className={`w-55 border-gray-300 shadow-sm rounded-xl flex items-center px-4 py-2 text-sm font-medium normal-case justify-between transition-colors duration-200 ${positionFilter ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <span className="flex items-center gap-2">
                    <MagnifyingGlassIcon className="w-4 h-4" />
                    ตำแหน่ง
                    {positionFilter && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full ml-2">{positionFilter}</span>
                    )}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </Button>
              </MenuHandler>
              <MenuList className="min-w-[180px] bg-white text-gray-800 rounded-lg border border-gray-100 p-2">
                <MenuItem
                  className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors duration-200 ${!positionFilter ? 'bg-blue-50 text-blue-700 font-semibold' : 'font-normal'}`}
                  onClick={() => setPositionFilter("")}
                >
                  <span>ตำแหน่งทั้งหมด</span>
                  <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{userList.length}</span>
                </MenuItem>
                {positions.map(position => {
                  const count = userList.filter(u => u.position_name === position.position_name).length;
                  return (
                    <MenuItem
                      key={position.position_id}
                      className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors duration-200 ${positionFilter === position.position_name ? 'bg-blue-50 text-blue-700 font-semibold' : 'font-normal'}`}
                      onClick={() => setPositionFilter(position.position_name)}
                    >
                      <span>{position.position_name}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{count}</span>
                    </MenuItem>
                  );
                })}
              </MenuList>
            </Menu>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-auto px-0">
          <div className="overflow-x-auto rounded-2xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-indigo-950 to-blue-700">
                <tr>
                {TABLE_HEAD.map((head, index) => (
                    <th
                      key={head}
                      className={`px-3 py-3 text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap ${
                        index === 0 ? "w-24 text-left" :      // รหัสนิสิต
                        index === 1 ? "w-16 text-center" :    // รูปภาพ
                        index === 2 ? "w-30 text-left" :      // ชื่อ-นามสกุล
                        index === 3 ? "w-36 text-left" :      // อีเมล
                        index === 4 ? "w-28 text-center" :    // ตำแหน่ง
                        index === 5 ? "w-32 text-left" :      // สาขา
                        index === 6 ? "w-28 text-center" :    // บทบาท
                        ""
                      }`}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={TABLE_HEAD.length} className="px-6 py-16 text-center">
                      <div className="inline-flex items-center justify-center p-5 bg-gray-100 rounded-full mb-5">
                        <svg className="animate-spin h-8 w-8 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      <Typography variant="h6" className="text-gray-700 font-medium mb-1">
                        กำลังโหลดข้อมูล...
                      </Typography>
                    </td>
                  </tr>
                ) : paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => {
                    const { user_id, user_code, Fullname, avatar, email, position_name, branch_name, role_name } = user;
                    return (
                      <tr key={user_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(user)}>
                        <td className="px-3 py-4 whitespace-nowrap text-md font-bold text-gray-900">{user_code}</td>
                        <td className="px-3 py-4 w-15 h-full whitespace-nowrap">
                          <div className="flex items-center justify-center object-cover">
                            <Avatar
                              src={avatar && avatar.includes('cloudinary.com') ? avatar : avatar ? `${UPLOAD_BASE}/uploads/user/${avatar}?t=${Date.now()}` : "/public/profile.png"}
                              alt={Fullname}
                              size="md"
                              className="rounded-full w-13 h-13 object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-md text-gray-900">{Fullname}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{email}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{position_name}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{branch_name}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                          <Menu>
                            <MenuHandler>
                              <div className={`inline-flex items-center px-4 py-2.5 rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 hover:scale-105 shadow-md ${
                                role_name === 'admin' ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-200' :
                                role_name === 'executive' ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-purple-200' :
                                'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200'
                              } ${updatingUserId === user_id ? 'opacity-70 cursor-not-allowed transform-none' : ''}`}>
                                <div className="flex items-center gap-2.5">
                                  {updatingUserId === user_id ? (
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                  ) : (
                                    <div className="p-1.5 rounded-full bg-white/20">
                                      {role_name === 'admin' ? (
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      ) : role_name === 'executive' ? (
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      ) : (
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </div>
                                  )}
                                  <span className="font-medium">
                                    {role_name === 'user' ? 'ผู้ใช้งาน' : role_name === 'admin' ? 'ผู้ดูแลระบบ' : role_name === 'executive' ? 'ผู้บริหาร' : role_name}
                                  </span>
                                  <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            </MenuHandler>
                            <MenuList className="min-w-[160px] bg-white/95 backdrop-blur-sm text-gray-800 rounded-4xl border border-gray-200 shadow-xl p-2">
                              {roles.map(role => {
                                const isSelected = role_name === role.role_name;
                                const roleConfig = {
                                  admin: { color: 'red', label: 'ผู้ดูแลระบบ', icon: 'shield' },
                                  executive: { color: 'purple', label: 'ผู้บริหาร', icon: 'star' },
                                  user: { color: 'emerald', label: 'ผู้ใช้งาน', icon: 'user' }
                                };
                                const config = roleConfig[role.role_name] || { color: 'gray', label: role.role_name, icon: 'user' };
                                
                                return (
                                  <MenuItem
                                    key={role.role_id}
                                    className={`flex items-center gap-3 rounded-full px-4 py-2 text-sm transition-all duration-200 ${
                                      isSelected 
                                        ? `bg-${config.color}-50 text-${config.color}-700 font-semibold border border-${config.color}-200` 
                                        : 'hover:bg-gray-50 font-normal hover:shadow-sm'
                                    }`}
                                    onClick={() => {
                                      if (!isSelected && updatingUserId !== user_id) {
                                        handleRoleChange(user_id, role.role_name);
                                      }
                                    }}
                                    disabled={updatingUserId === user_id}
                                  >
                                    <div className={`p-2 rounded-lg ${
                                      isSelected 
                                        ? `bg-${config.color}-100 text-${config.color}-600` 
                                        : 'bg-gray-100 text-gray-500'
                                    }`}>
                                      {config.icon === 'shield' ? (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      ) : config.icon === 'star' ? (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                      ) : (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <span className="block font-medium">{config.label}</span>
                                      {isSelected && (
                                        <span className="text-xs opacity-75">บทบาทปัจจุบัน</span>
                                      )}
                                    </div>
                                    {isSelected && (
                                      <div className={`p-1 rounded-full bg-${config.color}-100`}>
                                        <svg className={`w-3 h-3 text-${config.color}-600`} fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    )}
                                  </MenuItem>
                                );
                              })}
                            </MenuList>
                          </Menu>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={TABLE_HEAD.length} className="px-6 py-16 text-center">
                      <div className="inline-flex items-center justify-center p-5 bg-gray-100 rounded-full mb-5">
                        <MagnifyingGlassIcon className="w-12 h-12 text-gray-400" />
                      </div>
                      <Typography variant="h6" className="text-gray-700 font-medium mb-1">
                        ไม่พบข้อมูลผู้ใช้งาน
                      </Typography>
                      <Typography color="gray" className="text-sm text-gray-500">
                        ลองปรับคำค้นหาหรือตัวกรองของคุณ
                      </Typography>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 p-6 bg-white rounded-b-2xl">
          <Typography variant="small" className="font-normal text-gray-600 mb-3 sm:mb-0 text-sm">
            แสดง {filteredUsers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} ถึง {Math.min(currentPage * itemsPerPage, filteredUsers.length)} จากทั้งหมด {userList.length} รายการ
          </Typography>
          <div className="flex gap-2 items-center">
            <Button
              variant="outlined"
              size="sm"
              className="text-gray-700 border-gray-300 hover:bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium normal-case"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              ก่อนหน้า
            </Button>
            <span className="text-sm text-gray-700">{currentPage} / {totalPages}</span>
            <Button
              variant="outlined"
              size="sm"
              className="text-gray-700 border-gray-300 hover:bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium normal-case"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              ถัดไป
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <UserDetailDialog 
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        selectedUser={selectedUser}
      />
    </ThemeProvider>
  );
}

export default ManageUserRole;