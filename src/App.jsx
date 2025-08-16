import { useEffect, useState, useRef } from 'react';
import { MdMenu } from 'react-icons/md';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation, useNavigate } from 'react-router-dom';
import AuthSystem from './components/AuthSystem'; // เพิ่มบรรทัดนี้
import Footer from './components/Footer';
import FirstVisitNewsModal from './components/FirstVisitNewsModal';
import Header from './components/Header';
import SidebarAdmin from './components/SidebarAdmin';
import SidebarExecutive from './components/SidebarExecutive';
import SidebarUser from './components/SidebarUser';
import './sidebar.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Admin Pages
import BorrowList from './pages/admin/BorrowList';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import ManageCategory from './pages/admin/ManageCategory';
import ManageEquipment from './pages/admin/ManageEquipment';
import ManageNews from './pages/admin/ManageNews';
import ManageRoom from './pages/admin/ManageRoom';
import ManageUser from './pages/admin/ManageUser';
import QRScanner from './pages/admin/QRScanner';
import ReceiveItem from './pages/admin/ReceiveItem';
import ReturnList from './pages/admin/ReturnList';
import Success from './pages/admin/Success';
import SystemSettings from './pages/admin/SystemSettings';
import BorrowCalendar from './pages/admin/BorrowCalendar';

// Executive Pages
import BorrowApprovalList from './pages/executive/BorrowApprovalList';
import DashboardExeutive from './pages/executive/DashboardExeutive';
import Historybt from './pages/executive/Historyborrow';
import HistoryRe from './pages/executive/HistoryRepair';
import RepairApprovalList from './pages/executive/RepairApprovalList';

// User Pages
import Done from './pages/users/All_done';
import Approve from './pages/users/Approve';
import Borrow from './pages/users/Borrow';
import Cancel_re from './pages/users/Cancel_re';
import Edit_pro from './pages/users/edit_profile';
import Fine from './pages/users/Fine';
import NewsPage from './pages/users/NewsPage';
import Homes from './pages/users/Product';
import Return from './pages/users/Return';

function AppInner() {
  // เปลี่ยน default userRole เป็น null
  const [userRole, setUserRole] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const defaultRoutes = {
    admin: '/DashboardAd',
    user: '/DashboardUs',
    executive: '/DashboardEx'
  };

  const changeRole = (role) => {
    setUserRole(role);
    if (defaultRoutes[role]) {
      navigate(defaultRoutes[role]);
    }
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const inactivityTimer = useRef(null);
  const INACTIVITY_MINUTES = 45; // Enforce 45 minutes globally
  const inactivityMinutes = INACTIVITY_MINUTES;

  // ฟังก์ชัน logout
  const autoLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUserRole(null);
    navigate('/login', { replace: true });
  };

  // ฟังก์ชัน reset timer
  const resetInactivityTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(autoLogout, inactivityMinutes * 60 * 1000);
  };

  useEffect(() => {
    // เริ่มจับ event
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetInactivityTimer));
    resetInactivityTimer();
    return () => {
      events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);

  // บังคับใช้ 45 นาทีตายตัว: ไม่รับค่าจาก SystemSettings หรือ storage อีกต่อไป

  // // ถ้ายังไม่ได้ login ให้แสดงหน้า AuthSystem
  // if (!userRole) {
  //   return <AuthSystem onLoginSuccess={changeRole} />;
  // }

  // ตรวจสอบ token ใน localStorage ทุกครั้งที่โหลดหน้า
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUserRole(null);
      setCheckingAuth(false);
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // เช็ค exp
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        setUserRole(null);
        localStorage.removeItem('token');
        setCheckingAuth(false);
        navigate('/login', { replace: true });
        return;
      }
      setUserRole(payload.role);

      // Verify กับ backend (ใช้ endpoint ที่ require auth เช่น /api/users/verify-token)
      fetch('http://localhost:5000/api/users/verify-token', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.status === 401 || res.status === 403) {
            setUserRole(null);
            localStorage.removeItem('token');
            setCheckingAuth(false);
            navigate('/login', { replace: true });
          } else {
            setCheckingAuth(false);
          }
        })
        .catch(() => {
          setUserRole(null);
          localStorage.removeItem('token');
          setCheckingAuth(false);
          navigate('/login', { replace: true });
        });
    } catch (e) {
      setUserRole(null);
      localStorage.removeItem('token');
      setCheckingAuth(false);
      navigate('/login', { replace: true });
    }
  }, []);

  // Navigate to the first menu item on application startup
  useEffect(() => {
    // Always navigate to the default route for the current role on app startup
    navigate(defaultRoutes[userRole] || '/DashboardUs');
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handle route changes or root navigation
  useEffect(() => {
    if (location.pathname === '/') {
      // Navigate to the default route of the initial role if at root path
      if (defaultRoutes[userRole]) {
        navigate(defaultRoutes[userRole]);
      } else {
        navigate('/DashboardUs'); // Fallback if role not in defaultRoutes
      }
    }
  }, [userRole, navigate, location.pathname, defaultRoutes]);

  // ปิด sidebar overlay อัตโนมัติเมื่อจอกว้างขึ้น (desktop)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ถ้ายังไม่ได้ login และ path ไม่ใช่ /login ให้เปลี่ยน path เป็น /login
  useEffect(() => {
    if (!userRole && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  }, [userRole, location.pathname, navigate]);

  // ถ้ายังเช็ค token อยู่ ให้ render null (หรือ loading)
  // if (checkingAuth) return null;

  useEffect(() => {
    if (checkingAuth) return;
    if (!userRole) {
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    } else {
      // ถ้า login แล้ว และไม่ได้อยู่ที่ defaultRoutes[userRole] ให้ redirect
      if (location.pathname === '/login' || location.pathname === '/') {
        navigate(defaultRoutes[userRole], { replace: true });
      }
    }
  }, [userRole, checkingAuth, location.pathname, navigate]);

  // ถ้ายังเช็ค token อยู่ ให้ render null (หรือ loading)
  if (checkingAuth) return null;

  const renderSidebar = () => {
    switch (userRole) {
      case 'admin':
        return (
          <SidebarAdmin
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={toggleSidebarCollapse}
          />
        );
      case 'user':
        return (
          <SidebarUser
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={toggleSidebarCollapse}
          />
        );
      case 'executive':
        return (
          <SidebarExecutive
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={toggleSidebarCollapse}
          />
        );
      default:
        return null;
    }
  };

  // ถ้ายังไม่ได้ login หรือ path เป็น /login ให้แสดงหน้า AuthSystem อย่างเดียว (ไม่มี sidebar/menu)
  if (!userRole || location.pathname === '/login') {
    return <AuthSystem onLoginSuccess={changeRole} />;
  }

  return (
    <div className="min-h-screen flex flex-row bg-gradient-to-r from-indigo-950 md:from-7% sm:from-1% to-blue-700 text-black">
      {/* Hamburger button (mobile only) */}
      {!mobileOpen && (
        <button
          className="fixed top-4 left-4 z-50 block lg:hidden p-2 rounded-lg hover:bg-blue-700 text-white bg-gray-900/50 shadow-lg transition-all duration-200"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar"
        >
          <MdMenu size={28} />
        </button>
      )}

      {/* Sidebar overlay (mobile) */}
      {mobileOpen && userRole === 'user' && (
        <SidebarUser
          isCollapsed={false}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          toggleCollapse={() => {}}
        />
      )}
      {mobileOpen && userRole === 'admin' && (
        <SidebarAdmin
          isCollapsed={false}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          toggleCollapse={() => {}}
        />
      )}
      {mobileOpen && userRole === 'executive' && (
        <SidebarExecutive
          isCollapsed={false}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          toggleCollapse={() => {}}
        />
      )}

      {/* Sidebar (desktop) */}
      <div
        className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-white transition-all duration-300 ease-in-out flex-none hidden lg:block rounded-r-2xl fixed top-0 left-0 h-full z-30 shadow-xl`}
        style={{
          animation: isSidebarCollapsed ? 'none' : 'slideIn 0.3s ease-in-out'
        }}
      >
        {renderSidebar()}
      </div>

      {/* Main content */}
      <main className={`flex-1 flex flex-col transition-all duration-300 w-full bg-gradient-to-r from-indigo-950 md:from-2% sm:from-1% to-blue-700 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        {/* First-visit news modal for all roles */}
        <FirstVisitNewsModal userId={JSON.parse(localStorage.getItem('user') || '{}')?.id} />
        <Header userRole={userRole} changeRole={changeRole} />
        {/* Content */}
        <div className="bg-white p-4 m-4 rounded-xl flex-1 min-h-0">
          <Routes>
            <Route path="/login" element={<AuthSystem onLoginSuccess={changeRole} />} />
            {/* Admin Routes */}
            {userRole === 'admin' && (
              <>
                <Route path="/DashboardAd" element={<DashboardAdmin />} />
                <Route path="/borrow-list" element={<BorrowList />} />
                <Route path="/equipment" element={<ManageEquipment />} />
                <Route path="/rooms" element={<ManageRoom />} />
                <Route path="/members" element={<ManageUser />} />
                <Route path="/qr-scanner" element={<QRScanner />} />
                <Route path="/return-list" element={<ReturnList />} />
                <Route path="/ReceiveItem" element={<ReceiveItem />} />
                <Route path="/category" element={<ManageCategory />} />
                <Route path="/success" element={<Success />} />
                <Route path="/manage-news" element={<ManageNews />} />
                <Route path="/edit_profile" element={<Edit_pro />} />
                <Route path="/system-settings" element={<SystemSettings />} />
                <Route path="/borrow-calendar" element={<BorrowCalendar />} />
                <Route path="/reports" element={<DashboardAdmin />} />
                <Route path="*" element={<Navigate to="/DashboardAd" replace />} />
              </>
            )}

            {/* Executive Routes */}
            {userRole === 'executive' && (
              <>
                <Route path="/DashboardEx" element={<DashboardExeutive />} />
                <Route path="/BorrowApprovalList" element={<BorrowApprovalList />} />
                <Route path="/Repair" element={<RepairApprovalList />} />
                <Route path="/History" element={<Historybt />} />
                <Route path="/History_repair" element={<HistoryRe />} />
                <Route path="/edit_profile" element={<Edit_pro />} />
                <Route path="*" element={<Navigate to="/DashboardEx" replace />} />
              </>
            )}

            {/* User Routes */}
            {userRole === 'user' && (
              <>
                <Route path="/DashboardUs" element={<NewsPage />} />
                <Route path="/equipment" element={<Homes />} />
                <Route path="/approve" element={<Approve />} />
                <Route path="/return" element={<Return />} />
                <Route path="/completed" element={<Done />} />
                <Route path="/borrow" element={<Borrow />} />
                <Route path="/cancel" element={<Cancel_re />} />
                <Route path="/fine" element={<Fine />} />
                <Route path="/edit_profile" element={<Edit_pro />} />
                <Route path="*" element={<Navigate to="/DashboardUs" replace />} />
              </>
            )}
          </Routes>
        </div>
        <Footer />
      </main>
      <ToastContainer
        position="top-right"
        autoClose={8000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  );
}

export default App;