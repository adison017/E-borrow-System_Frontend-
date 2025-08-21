import { useEffect, useState, useRef } from 'react';
import { MdMenu } from 'react-icons/md';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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
import socketService from './utils/socketService';
import { API_BASE, authFetch } from './utils/api';
import locationTracker from './utils/locationTracker';

// Admin Pages
import BorrowList from './pages/admin/BorrowList';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import ManageEquipment from './pages/admin/ManageEquipment';
import ManageNews from './pages/admin/ManageNews';
import ManageRoom from './pages/admin/ManageRoom';
import ManageUser from './pages/admin/ManageUser';

import ReceiveItem from './pages/admin/ReceiveItem';
import ReturnList from './pages/admin/ReturnList';
import Success from './pages/admin/Success';
import SystemSettings from './pages/admin/SystemSettings';
import BorrowCalendar from './pages/admin/BorrowCalendar';
import LocationTracking from './pages/admin/LocationTracking';

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
  const INACTIVITY_MINUTES = 60; // เพิ่มเป็น 60 นาที
  const inactivityMinutes = INACTIVITY_MINUTES;
  const [remainingTime, setRemainingTime] = useState(inactivityMinutes * 60); // เวลาที่เหลือในวินาที

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
    setRemainingTime(inactivityMinutes * 60); // รีเซ็ตเวลา
    inactivityTimer.current = setTimeout(autoLogout, inactivityMinutes * 60 * 1000);
  };

  // Countdown timer
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

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

      // ตั้งค่า role ทันทีจาก token แทนที่จะรอ backend verification
      setCheckingAuth(false);

      // Ensure socket connection with token for real-time updates
      socketService.connect(token);

      // Verify กับ backend ในพื้นหลัง (ไม่บล็อก UI)
      fetch(`${API_BASE}/users/verify-token`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.status === 401 || res.status === 403) {
            console.log('Token expired or invalid, logging out');
            setUserRole(null);
            localStorage.removeItem('token');
            navigate('/login', { replace: true });
          } else {
            console.log('Token verified successfully');
          }
        })
        .catch((error) => {
          console.error('Backend verification failed:', error);
          console.log('Continuing with existing token due to backend connection error');
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
    // Only navigate if userRole is set and not checking auth
    if (userRole && !checkingAuth) {
      navigate(defaultRoutes[userRole] || '/DashboardUs');
    }
  }, [userRole, checkingAuth]); // Depend on userRole and checkingAuth

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

  // เพิ่ม Global Location Tracking สำหรับ User
  const [locationPermission, setLocationPermission] = useState(null);
  const [borrowList, setBorrowList] = useState([]);

  // ตรวจสอบ location permission เมื่อ user login
  useEffect(() => {
    if (!userRole || userRole !== 'user') return;

    const checkLocationPermission = async () => {
      if (!navigator.geolocation) {
        setLocationPermission('not_supported');
        return;
      }

      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'granted') {
          setLocationPermission('granted');
        } else if (permission.state === 'denied') {
          setLocationPermission('denied');
        } else {
          setLocationPermission('prompt');
        }
      } catch (error) {
        console.error('Error checking location permission:', error);
        setLocationPermission('unknown');
      }
    };

    checkLocationPermission();
  }, [userRole]);

  // ดึงข้อมูลรายการขอยืมสำหรับ location tracking
  useEffect(() => {
    if (!userRole || userRole !== 'user' || locationPermission !== 'granted') return;

    const userStr = localStorage.getItem('user');
    let globalUserData = null;
    if (userStr) {
      try {
        globalUserData = JSON.parse(userStr);
      } catch (e) {}
    }

    if (!globalUserData?.user_id) return;

    const fetchBorrowData = () => {
      authFetch(`${API_BASE}/borrows?user_id=${globalUserData.user_id}`)
        .then(async res => {
          if (!res.ok) return [];
          try {
            const data = await res.json();
            if (Array.isArray(data)) {
              return data.filter(b => b.user_id == globalUserData.user_id);
            }
            return [];
          } catch {
            return [];
          }
        })
        .then(data => {
          console.log('Global: Fetched borrow data:', data);
          setBorrowList(data);
          
          // เริ่มการติดตามตำแหน่งสำหรับรายการที่ active
          const activeBorrows = data.filter(borrow => ['approved', 'carry', 'overdue'].includes(borrow.status));
          console.log('Global: Active borrows for location tracking:', activeBorrows);
          
          if (activeBorrows.length > 0) {
            startGlobalLocationTracking(activeBorrows);
          }
        })
        .catch(() => {
          setBorrowList([]);
        });
    };

    fetchBorrowData();
    
    // ฟัง event badgeCountsUpdated เพื่ออัปเดต borrow list แบบ real-time
    const handleBadgeUpdate = () => {
      fetchBorrowData();
    };
    
    // ใช้ setTimeout เพื่อให้แน่ใจว่า useSocket hook พร้อมแล้ว
    setTimeout(() => {
      if (window.subscribeToBadgeCounts) {
        const unsubscribe = window.subscribeToBadgeCounts(handleBadgeUpdate);
        return () => {
          unsubscribe();
          locationTracker.stopTracking();
        };
      }
    }, 1000);

  }, [userRole, locationPermission]);

  // เริ่มการติดตามตำแหน่งแบบ Global
  const startGlobalLocationTracking = (activeBorrows) => {
    console.log('Global: Starting location tracking...');
    
    const activeBorrowIds = activeBorrows.map(borrow => borrow.borrow_id);
    
    if (activeBorrowIds.length === 0) {
      console.log('Global: No active borrows found');
      return;
    }

    locationTracker.startTracking(
      async (location) => {
        console.log('Global: Location update received:', location);
      },
      (error) => {
        console.error('Global: Location tracking error:', error);
      },
      activeBorrowIds
    );
  };

  // Global Periodic Location Check
  useEffect(() => {
    if (!locationTracker.isTracking || !locationTracker.lastLocation || borrowList.length === 0) {
      return;
    }

    console.log('Global: Setting up periodic location check...');

    const checkAndUpdateLocation = () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000);

      console.log('Global: Periodic location check...');

      borrowList.forEach(borrow => {
        if (['approved', 'carry', 'overdue'].includes(borrow.status)) {
          if (borrow.last_location_update) {
            const lastUpdate = new Date(borrow.last_location_update);
            if (lastUpdate < oneMinuteAgo) {
              console.log(`Global: Updating location for borrow_id: ${borrow.borrow_id}`);
              locationTracker.sendLocationToServer(borrow.borrow_id, locationTracker.lastLocation)
                .then(() => console.log(`Global: Location updated for borrow_id: ${borrow.borrow_id}`))
                .catch(error => console.error(`Global: Failed to update location for borrow_id ${borrow.borrow_id}:`, error));
            }
          } else {
            console.log(`Global: Sending initial location for borrow_id: ${borrow.borrow_id}`);
            locationTracker.sendLocationToServer(borrow.borrow_id, locationTracker.lastLocation)
              .then(() => console.log(`Global: Initial location sent for borrow_id: ${borrow.borrow_id}`))
              .catch(error => console.error(`Global: Failed to send initial location for borrow_id ${borrow.borrow_id}:`, error));
          }
        }
      });
    };

    const interval = setInterval(checkAndUpdateLocation, 60000);
    return () => clearInterval(interval);
  }, [borrowList, locationTracker.isTracking, locationTracker.lastLocation]);

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

  // ถ้ายัง checking auth อยู่ ให้แสดง loading
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-950 to-blue-700">
        <div className="text-white text-xl">กำลังตรวจสอบการเข้าสู่ระบบ...</div>
      </div>
    );
  }

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

                <Route path="/return-list" element={<ReturnList />} />
                <Route path="/ReceiveItem" element={<ReceiveItem />} />
                <Route path="/success" element={<Success />} />
                <Route path="/manage-news" element={<ManageNews />} />
                <Route path="/edit_profile" element={<Edit_pro />} />
                <Route path="/system-settings" element={<SystemSettings />} />
                <Route path="/location-tracking" element={<LocationTracking />} />
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(null);
  const [borrowList, setBorrowList] = useState([]);

  // เพิ่ม Global Location Tracking
  useEffect(() => {
    if (!user?.user_id) return;

    // ตรวจสอบ location permission
    const checkLocationPermission = async () => {
      if (!navigator.geolocation) {
        setLocationPermission('not_supported');
        return;
      }

      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'granted') {
          setLocationPermission('granted');
        } else if (permission.state === 'denied') {
          setLocationPermission('denied');
        } else {
          setLocationPermission('prompt');
        }
      } catch (error) {
        console.error('Error checking location permission:', error);
        setLocationPermission('unknown');
      }
    };

    checkLocationPermission();
  }, [user]);

  // ดึงข้อมูลรายการขอยืมสำหรับ location tracking
  useEffect(() => {
    if (!user?.user_id || locationPermission !== 'granted') return;

    const fetchBorrowData = () => {
      authFetch(`${API_BASE}/borrows?user_id=${user.user_id}`)
        .then(async res => {
          if (!res.ok) return [];
          try {
            const data = await res.json();
            if (Array.isArray(data)) {
              return data.filter(b => b.user_id == user.user_id);
            }
            return [];
          } catch {
            return [];
          }
        })
        .then(data => {
          console.log('Global: Fetched borrow data:', data);
          setBorrowList(data);
          
          // เริ่มการติดตามตำแหน่งสำหรับรายการที่ active
          const activeBorrows = data.filter(borrow => ['approved', 'carry', 'overdue'].includes(borrow.status));
          console.log('Global: Active borrows for location tracking:', activeBorrows);
          
          if (activeBorrows.length > 0) {
            startGlobalLocationTracking(activeBorrows);
          }
        })
        .catch(() => {
          setBorrowList([]);
        });
    };

    fetchBorrowData();
    
    // ฟัง event badgeCountsUpdated เพื่ออัปเดต borrow list แบบ real-time
    const handleBadgeUpdate = () => {
      fetchBorrowData();
    };
    
    // ใช้ setTimeout เพื่อให้แน่ใจว่า useSocket hook พร้อมแล้ว
    setTimeout(() => {
      if (window.subscribeToBadgeCounts) {
        const unsubscribe = window.subscribeToBadgeCounts(handleBadgeUpdate);
        return () => {
          unsubscribe();
          locationTracker.stopTracking();
        };
      }
    }, 1000);

  }, [user, locationPermission]);

  // เริ่มการติดตามตำแหน่งแบบ Global
  const startGlobalLocationTracking = (activeBorrows) => {
    console.log('Global: Starting location tracking...');
    
    const activeBorrowIds = activeBorrows.map(borrow => borrow.borrow_id);
    
    if (activeBorrowIds.length === 0) {
      console.log('Global: No active borrows found');
      return;
    }

    locationTracker.startTracking(
      async (location) => {
        console.log('Global: Location update received:', location);
      },
      (error) => {
        console.error('Global: Location tracking error:', error);
      },
      activeBorrowIds
    );
  };

  // Global Periodic Location Check
  useEffect(() => {
    if (!locationTracker.isTracking || !locationTracker.lastLocation || borrowList.length === 0) {
      return;
    }

    console.log('Global: Setting up periodic location check...');

    const checkAndUpdateLocation = () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000);

      console.log('Global: Periodic location check...');

      borrowList.forEach(borrow => {
        if (['approved', 'carry', 'overdue'].includes(borrow.status)) {
          if (borrow.last_location_update) {
            const lastUpdate = new Date(borrow.last_location_update);
            if (lastUpdate < oneMinuteAgo) {
              console.log(`Global: Updating location for borrow_id: ${borrow.borrow_id}`);
              locationTracker.sendLocationToServer(borrow.borrow_id, locationTracker.lastLocation)
                .then(() => console.log(`Global: Location updated for borrow_id: ${borrow.borrow_id}`))
                .catch(error => console.error(`Global: Failed to update location for borrow_id ${borrow.borrow_id}:`, error));
            }
          } else {
            console.log(`Global: Sending initial location for borrow_id: ${borrow.borrow_id}`);
            locationTracker.sendLocationToServer(borrow.borrow_id, locationTracker.lastLocation)
              .then(() => console.log(`Global: Initial location sent for borrow_id: ${borrow.borrow_id}`))
              .catch(error => console.error(`Global: Failed to send initial location for borrow_id ${borrow.borrow_id}:`, error));
          }
        }
      });
    };

    const interval = setInterval(checkAndUpdateLocation, 60000);
    return () => clearInterval(interval);
  }, [borrowList, locationTracker.isTracking, locationTracker.lastLocation]);

  return <AppInner />;
}

export default App;