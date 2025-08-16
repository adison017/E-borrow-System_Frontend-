import { ImMail4 } from "react-icons/im";
import {
  MagnifyingGlassIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
  PencilIcon,
} from "@heroicons/react/24/solid";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  IconButton,
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
  ThemeProvider,
  Tooltip,
  Typography
} from "@material-tailwind/react";
import { BsChatDots } from "react-icons/bs";
import AddUserDialog from "./dialog/AddUserDialog";
import DeleteUserDialog from "./dialog/DeleteUserDialog";
import EditUserDialog from "./dialog/EditUserDialog";
import ViewUserDialog from "./dialog/ViewUserDialog";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
// กำหนด theme สีพื้นฐานเป็นสีดำ
const theme = {
  typography: {
    defaultProps: {
      color: "#374151", // Dark Gray for text
      textGradient: false,
    },
  }
};

const TABLE_HEAD = [
  "รหัสนิสิต",
  "รูปภาพ",
  "ชื่อ-นามสกุล",
  "อีเมล",
  "เบอร์โทรศัพท์",
  "ตำแหน่ง",
  "สาขา",
  "แจ้งเตือน LINE", // เพิ่มหัวตารางใหม่
  "จัดการ"
];

// เพิ่ม utility สำหรับแนบ token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

function ManageUser() {
  const [userList, setUserList] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    user_id: "",
    student_id: "",
    username: "",
    Fullname: "",
    pic:"",
    email: "",
    phone: "",
    position: "",
    department: "",
    street: "",
    province: "",
    district: "",
    parish: "",
    postal_no: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const effectRan = useRef(false);

  const [addFormData, setAddFormData] = useState({
    student_id: "",
    username: "",
    Fullname: "",
    pic:"",
    email: "",
    phone: "",
    position: "",
    department: "",
    password: ""
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // State for filter dropdowns
  const [roleFilter, setRoleFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [positions, setPositions] = useState([]);

  const [showAddUserSuccess, setShowAddUserSuccess] = useState(false);

  // ฟังก์ชันรวมคำอธิบายแจ้งเตือน (เหมือน borrowlist/news)
  const getUserNotifyMessage = (action, extra) => {
    switch (action) {
      case "add":
        return { message: `เพิ่มผู้ใช้เรียบร้อยแล้ว`, type: "success" };
      case "edit":
        return { message: `แก้ไขข้อมูลผู้ใช้เรียบร้อยแล้ว`, type: "success" };
      case "delete":
        return { message: `ลบผู้ใช้${extra ? ` ${extra}` : ''} เรียบร้อยแล้ว`, type: "success" };
      case "add_error":
        return { message: "เกิดข้อผิดพลาดในการเพิ่มผู้ใช้", type: "error" };
      case "edit_error":
        return { message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้", type: "error" };
      case "delete_error":
        return { message: "เกิดข้อผิดพลาดในการลบผู้ใช้", type: "error" };
      case "fetch_error":
        return { message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน", type: "error" };
      default:
        return { message: action, type: "info" };
    }
  };

  // ฟังก์ชันกลางสำหรับแจ้งเตือน
  const notifyUserAction = (action, extra) => {
    const { message, type } = getUserNotifyMessage(action, extra);
    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else {
      toast.info(message);
    }
  };

  // Function to fetch users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: getAuthHeaders()
      });
      setUserList(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      notifyUserAction('fetch_error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users when component mounts
  useEffect(() => {
    if (effectRan.current === true) {
      fetchUsers();
    }
    return () => {
      effectRan.current = true;
    };
  }, []);

  // Add event listener for user data updates
  useEffect(() => {
    const handleUserDataUpdate = (event) => {
      if (event.detail && event.detail.userList) {
        setUserList(event.detail.userList);
      }
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdate);
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate);
    };
  }, []);

  // Fetch filter data (roles, branches, positions)
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [rolesRes, branchesRes, positionsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/users/roles', { headers: getAuthHeaders() }),
          axios.get('http://localhost:5000/api/users/branches', { headers: getAuthHeaders() }),
          axios.get('http://localhost:5000/api/users/positions', { headers: getAuthHeaders() }),
        ]);
        setRoles(rolesRes.data);
        setBranches(branchesRes.data);
        setPositions(positionsRes.data);
      } catch (err) {
        // fallback: do nothing
      }
    };
    fetchFilters();
  }, []);

  // ฟังก์ชันแสดง Toast
  const showAlertMessage = (message, type = "success") => {
    if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
    else if (type === 'loading') toast.loading(message);
    else toast(message);
  };

  const handleDeleteClick = async (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/users/id/${selectedUser.user_id}`, {
        headers: getAuthHeaders()
      });

      if (!response.data) throw new Error('Failed to delete user');

      // Update the list immediately
      setUserList(prevList => prevList.filter(item => item.user_id !== selectedUser.user_id));
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      notifyUserAction("delete", selectedUser.Fullname);
    } catch (error) {
      console.error('Error deleting user:', error);
      notifyUserAction('delete_error');
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    // Clean up avatar path to show only filename
    let avatarPath = user.avatar || '';
    if (avatarPath) {
      // Extract only the filename from any path
      avatarPath = avatarPath.split('/').pop();
    }
    setEditFormData({
      user_id: user.user_id,
      student_id: user.user_code,
      username: user.username,
      Fullname: user.Fullname,
      pic: avatarPath,
      email: user.email,
      phone: user.phone || '',
      position: user.position_name,
      department: user.branch_name,
      street: user.street || '',
      province: user.province || '',
      district: user.district || '',
      parish: user.parish || '',
      postal_no: user.postal_no || '',
      password: ""
    });
    setEditDialogOpen(true);
  };

  // เพิ่มฟังก์ชัน saveEdit ใหม่ที่รับ updatedUser
  const saveEdit = (updatedUser) => {
    setUserList(prevList =>
      prevList.map(user =>
        user.user_id === updatedUser.user_id ? updatedUser : user
      )
    );
    setEditDialogOpen(false);
    setSelectedUser(null);
    notifyUserAction('edit');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddClick = () => {
    setAddFormData({
      student_id: "",
      username: "",
      Fullname: "",
      pic:"",
      email: "",
      phone: "",
      position: "",
      department: "",
      password: ""
    });
    setAddDialogOpen(true);
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setAddFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddUser = async () => {
    await fetchUsers();
    setShowAddUserSuccess(true); // ตั้ง flag ว่าจะโชว์ toast หลัง dialog ปิด
  };

  // Filtering logic
  const filteredUsers = userList.filter(user => {
    const matchesSearch =
      (user.student_id && String(user.student_id).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.user_code && String(user.user_code).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.Fullname && user.Fullname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.phone && String(user.phone).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.position_name && user.position_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.branch_name && user.branch_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = !roleFilter || user.role_name === roleFilter;
    const matchesBranch = !branchFilter || user.branch_name === branchFilter;
    const matchesPosition = !positionFilter || user.position_name === positionFilter;
    return matchesSearch && matchesRole && matchesBranch && matchesPosition;
  });

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // เพิ่มฟังก์ชัน handleToggleLineNotify
  const handleToggleLineNotify = (userId, checked) => {
    // ตัวอย่าง: เรียก API เพื่ออัปเดต line_notify_enabled
    axios.patch(`http://localhost:5000/api/users/${userId}/line-notify`, { line_notify_enabled: checked ? 1 : 0 }, {
      headers: getAuthHeaders()
    })
      .then(res => res.data)
      .then(data => {
        // อัปเดต state หรือ refresh ข้อมูล user ตามต้องการ
        setUserList(prevList => prevList.map(u =>
          u.user_id === userId ? { ...u, line_notify_enabled: checked ? 1 : 0 } : u
        ));
                 toast.success(checked ? 'เปิดแจ้งเตือน LINE แล้ว' : 'ปิดแจ้งเตือน LINE แล้ว');
      })
      .catch(err => {
                 toast.error('เกิดข้อผิดพลาดในการอัปเดตแจ้งเตือน LINE');
      });
  };

  // ฟังก์ชันสำหรับ export Excel
  const handleExportExcel = () => {
    // เตรียมข้อมูลเฉพาะที่แสดงผล (filteredUsers)
    const exportData = filteredUsers.map(user => ({
      'รหัสนิสิต': user.student_id || user.user_code || '',
      'ชื่อผู้ใช้': user.username || '',
      'ชื่อ-นามสกุล': user.Fullname || '',
      'อีเมล': user.email || '',
      'เบอร์โทรศัพท์': user.phone || '',
      'ตำแหน่ง': user.position_name || '',
      'สาขา': user.branch_name || '',
      'แจ้งเตือน LINE': user.line_notify_enabled === 1 ? 'เปิด' : 'ปิด',
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'users.xlsx');
  };

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
                รายการผู้ใช้งาน
              </Typography>
              <Typography color="gray" className="mt-1 font-normal text-sm text-gray-600">
                จัดการข้อมูลผู้ใช้งานทั้งหมด
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
            <div className="flex flex-shrink-0 gap-x-3 w-full md:w-auto justify-start md:justify-end">
              <Button variant="outlined" className="border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm rounded-xl flex items-center gap-2 px-4 py-2 text-sm font-medium normal-case" onClick={handleExportExcel}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm7.586 2.586L14.5 7H12V4.5h.086ZM11 10a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5A.75.75 0 0 1 11 10Z" clipRule="evenodd" />
                </svg>
                ส่งออก Excel
              </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 justify-center">
            {/* Filter Dropdowns */}
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
                        index === 4 ? "w-28 text-left" :      // เบอร์โทรศัพท์
                        index === 5 ? "w-28 text-center" :    // ตำแหน่ง
                        index === 6 ? "w-32 text-left" :      // สาขา
                        index === 7 ? "w-28 text-center" :    // แจ้งเตือน LINE
                        index === 8 ? "w-24 text-center" :    // จัดการ
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
                    const { user_id, user_code, username, Fullname, avatar, email, phone, position_name, branch_name, role_name, line_notify_enabled } = user;
                    return (
                      <tr key={user_id} className="hover:bg-gray-50 cursor-pointer" onClick={e => {
                        if (e.target.closest('button') || e.target.closest('.line-notify-switch')) return;
                        setViewUser(user);
                        setViewDialogOpen(true);
                      }}>
                        <td className="px-3 py-4 whitespace-nowrap text-md font-bold text-gray-900">{user_code}</td>
                        <td className="px-3 py-4 w-15 h-full whitespace-nowrap">
                          <div className="flex items-center justify-center object-cover">
                                            <Avatar
                  src={avatar && avatar.includes('cloudinary.com') ? avatar : avatar ? `http://localhost:5000/uploads/user/${avatar}?t=${Date.now()}` : "/public/profile.png"}
                              alt={Fullname}
                              size="md"
                              className="rounded-full w-13 h-13 object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-md text-gray-900">{Fullname}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{email}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{phone}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{position_name}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{branch_name}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-center">
                          <Tooltip content={line_notify_enabled ? 'ปิดการแจ้งเตือน LINE' : 'เปิดการแจ้งเตือน LINE'} placement="top">
                            <div className="flex flex-col items-center justify-center gap-1">
                              <button
                                type="button"
                                className={`line-notify-switch relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none border-2 ${line_notify_enabled ? 'bg-green-400 border-green-500' : 'bg-white border-gray-400'}`}
                                aria-pressed={!!line_notify_enabled}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const newValue = !line_notify_enabled ? 1 : 0;
                                  await axios.patch(`http://localhost:5000/api/users/${user_id}/line-notify`, { line_notify_enabled: newValue }, {
                                    headers: getAuthHeaders()
                                  });
                                  setUserList(prevList => prevList.map(u =>
                                    u.user_id === user_id ? { ...u, line_notify_enabled: newValue } : u
                                  ));
                                                                     toast.success(newValue ? 'เปิดแจ้งเตือน LINE แล้ว' : 'ปิดแจ้งเตือน LINE แล้ว');
                                }}
                              >
                                <span
                                  className={`absolute left-1 top-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300 ${line_notify_enabled ? 'translate-x-6' : 'translate-x-0'}`}
                                >
                                  <ImMail4 className={`w-5 h-5 ${line_notify_enabled ? 'text-green-600' :  'text-black'} transition-colors duration-300`} />
                                </span>
                              </button>
                              <span
                                className={`mt-1 px-3 py-0.5 rounded-full text-xs font-bold transition-colors duration-200 ${line_notify_enabled ? 'bg-green-100 text-green-700 border border-green-400' : 'bg-gray-100 text-gray-700 border border-gray-300'}`}
                                style={{marginTop: '2px'}}
                              >
                                {line_notify_enabled ? 'เปิด' : 'ปิด'}
                              </span>
                            </div>
                          </Tooltip>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-center">
                          <div className="flex gap-1 justify-center">
                            <Tooltip content="แก้ไข">
                              <IconButton variant="text" color="amber" className="bg-amber-50 hover:bg-amber-100"
                                onClick={e => { e.stopPropagation(); handleEditClick(user); }}>
                                <PencilIcon className="h-4 w-4" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip content="ลบ">
                              <IconButton variant="text" color="red" className="bg-red-50 hover:bg-red-100"
                                onClick={e => { e.stopPropagation(); handleDeleteClick(user); }}>
                                <TrashIcon className="h-4 w-4" />
                              </IconButton>
                            </Tooltip>
                          </div>
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
        {/* Delete Confirmation Modal */}
        <DeleteUserDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          selectedUser={selectedUser}
          onConfirm={confirmDelete}
        />
        {/* Edit Dialog Modal */}
        <EditUserDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedUser(null);
          }}
          userData={selectedUser}
          onSave={saveEdit}
        />
        {/* Add User Dialog Modal */}
        <AddUserDialog
          open={addDialogOpen}
          onClose={() => {
            setAddDialogOpen(false);
            setSelectedUser(null);
            if (showAddUserSuccess) {
              toast.success('เพิ่มผู้ใช้สำเร็จ');
              setShowAddUserSuccess(false);
            }
          }}
          initialFormData={selectedUser || {
            student_id: "",
            username: "",
            Fullname: "",
            pic: "",
            email: "",
            phone: "",
            position: "",
            department: "",
            password: ""
          }}
          onSave={handleAddUser}
        />
        <ViewUserDialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} userData={viewUser} />
      </Card>
      {/* Floating Add User Button */}
      <Tooltip content="เพิ่มผู้ใช้งาน" placement="left">
        <button
          onClick={handleAddClick}
          className="fixed bottom-8 right-8 z-[60] border-black bg-black/70 hover:bg-white hover:border-2 hover:border-black hover:text-black text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          aria-label="เพิ่มผู้ใช้งาน"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.75v14.5m7.25-7.25H4.75" />
          </svg>
        </button>
      </Tooltip>
    </ThemeProvider>
  );
}

export default ManageUser;