import React, { useEffect, useState } from 'react';
import { AiFillHome } from "react-icons/ai";
import { FaArchive, FaCheckCircle, FaMoneyBillAlt, FaShoppingBag, FaSignOutAlt, FaThList } from "react-icons/fa";
import { MdAccessTimeFilled, MdCancel, MdClose, MdKeyboardArrowRight, MdMenu } from "react-icons/md";
import { RiArrowGoBackLine } from "react-icons/ri";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './sidebar.css';
import Notification from './Notification';

const borrowingMenus = [
  { to: '/borrow', icon: <MdAccessTimeFilled size={30} />, label: 'รออนุมัติ', key: 'borrow' },
  { to: '/approve', icon: <FaCheckCircle size={18} />, label: 'อนุมัติ', key: 'approve' },
  { to: '/return', icon: <RiArrowGoBackLine size={18} />, label: 'คืนครุภัณฑ์', key: 'return' },
  { to: '/fine', icon: <FaMoneyBillAlt size={18} />, label: 'ค้างชำระเงิน', key: 'fine' },
  { to: '/cancel', icon: <MdCancel size={30} />, label: 'ปฏิเสธ', key: 'cancel' },
  { to: '/completed', icon: <FaArchive size={18} />, label: 'เสร็จสิ้น', key: 'completed' },
];

const mainMenus = [
  { to: '/DashboardUs', icon: <AiFillHome size={22} />, label: 'หน้าแรก', key: 'dashboard' },
  { to: '/equipment', icon: <FaShoppingBag size={22} />, label: 'รายการครุภัณฑ์', key: 'equipment' },
];

function SidebarUser({ isCollapsed, toggleCollapse, mobileOpen, setMobileOpen }) {
  const [openSubMenu, setOpenSubMenu] = useState(false);
  const [menuReady, setMenuReady] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Immediately hide submenu when collapsed
    if (isCollapsed) {
      setOpenSubMenu(false);
      setAnimating(false);
    }
  }, [isCollapsed]);

  // When openSubMenu changes and sidebar is expanded, manage animation state
  useEffect(() => {
    if (!isCollapsed) {
      if (openSubMenu) {
        setAnimating(true);
      } else {
        // Add delay before hiding when manually closing
        const timer = setTimeout(() => {
          setAnimating(false);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [openSubMenu, isCollapsed]);

  useEffect(() => {
    // Add a small delay to trigger animation after component mount
    const timer = setTimeout(() => {
      setMenuReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };
  const confirmLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.clear();
    if (setMobileOpen) setMobileOpen(false);
    setShowLogoutConfirm(false);
    navigate('/login');
  };
  const cancelLogout = () => setShowLogoutConfirm(false);

  const handleMenuClick = (to) => {
    if (setMobileOpen) setMobileOpen(false);
    if (to) navigate(to);
  };

  const iconSize = 22;

  return (
    <>
          <div
      className={
        mobileOpen
          ? "fixed top-0 left-0 h-full w-72 z-50 bg-white shadow-xl rounded-r-2xl transition-all duration-300 ease-in-out overflow-y-auto mobile-menu-enter-active"
          : `${isCollapsed ? 'w-20' : 'w-72'} flex-none bg-white border-r border-gray-200 shadow-md transition-all duration-300 h-full hidden lg:block rounded-r-3xl overflow-y-auto`
      }
      style={mobileOpen ? {
        maxWidth: '85vw',
        animation: 'slideIn 0.3s ease-in-out'
      } : {}}
    >
      <div className={mobileOpen ? "py-5 h-full flex flex-col" : "py-6 h-full flex flex-col"}>
        {/* Mobile Header */}
        <div className={mobileOpen ? "flex items-center justify-between mb-6 px-6 pb-4 border-b border-gray-100" : "flex flex-col items-center justify-between mb-8 px-4"}>
          {/* Logo or Brand */}
          <div className="flex items-center">
            <h1 className={`font-bold text-blue-600 text-xl ${isCollapsed && !mobileOpen ? 'hidden' : ''}`}>e-Borrow</h1>
          </div>

          {/* Close button for mobile */}
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors duration-200"
              aria-label="Close sidebar"
            >
              <MdClose size={26} />
            </button>
          )}
        </div>

        <ul className={`flex-1 ${isCollapsed ? "flex flex-col items-center space-y-2 px-2" : mobileOpen ? "space-y-2 font-medium px-5" : "space-y-2 font-medium px-4"}`}>
          {/* Hamburger menu for desktop */}
          {!mobileOpen && (
            <li className={`${isCollapsed ? "w-full flex justify-center mb-2" : "mb-2"} transition-all duration-300 ease-in-out ${menuReady ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
              <button
                onClick={toggleCollapse}
                className={isCollapsed
                  ? "flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition-all duration-200"
                  : "flex items-center p-3 rounded-xl hover:bg-gray-100 text-gray-700 w-full justify-start transition-all duration-200"}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <MdMenu size={24} />
                {!isCollapsed && <span className="ml-3 font-medium">เมนู</span>}
              </button>
            </li>
          )}

          {/* Dashboard, Equipment & Profile Menu Items */}
          {mainMenus.map((item, index) => (
            <li
              key={item.key}
              className={`${isCollapsed ? "w-full flex justify-center" : "w-full"} transition-all duration-300 ease-in-out
                ${menuReady ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
              style={{
                transitionDelay: menuReady ? `${(index + 1) * 100}ms` : '0ms',
                animation: !isCollapsed && menuReady ? 'fadeIn 0.3s ease-in-out' : 'none'
              }}
            >
              <Link
                to={item.to}
                onClick={() => handleMenuClick(item.to)}
                className={`flex items-center rounded-xl transition-all duration-200
                  ${isCollapsed
                    ? 'justify-center w-12 h-12'
                    : 'justify-start w-full p-3'}
                  ${isActive(item.to)
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
                    : 'hover:bg-blue-50 text-gray-700'}`}
                title={isCollapsed ? item.label : undefined}
              >
                {item.icon}
                <span
                  className={`transition-all duration-700 ease-in-out overflow-hidden whitespace-nowrap ${isCollapsed ? 'max-w-0 opacity-0 ms-0' : 'max-w-xs opacity-100 ms-3'} font-medium`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          ))}

          {/* Borrowing Menu Section */}
          <li
            className={`${isCollapsed ? "hidden" : "w-full"} transition-all duration-300 ease-in-out
              ${menuReady ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
            style={{
              transitionDelay: menuReady ? '400ms' : '0ms',
              animation: !isCollapsed && menuReady ? 'fadeIn 0.3s ease-in-out' : 'none'
            }}
          >
            <div
              onClick={() => !isCollapsed && setOpenSubMenu(!openSubMenu)}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ease-in-out
                ${openSubMenu ? 'bg-blue-200 text-black shadow-md shadow-blue-200' : 'hover:bg-blue-50 text-gray-700'}`}
            >
              <div className="flex items-center">
                <FaThList size={iconSize} />
                <span className={`transition-all duration-700 ease-in-out overflow-hidden whitespace-nowrap ${isCollapsed ? 'max-w-0 opacity-0 ms-0' : 'max-w-xs opacity-100 ms-3'} font-medium`}>
                  รายการขอยืมครุภัณฑ์
                </span>
              </div>
              <MdKeyboardArrowRight
                size={20}
                className={`transition-transform duration-200 ease-in-out ${openSubMenu ? "rotate-90" : ""}`}
              />
            </div>
            {/* Submenu container */}
            {(!isCollapsed && (openSubMenu || animating)) && (
              <ul
                className={`ml-4 mt-1 space-y-1 pl-2 border-l-2 border-blue-100 overflow-hidden
                  ${isCollapsed ? 'duration-0' : 'transition-all duration-300 ease-in-out'}
                  ${openSubMenu ? 'max-h-[1000px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2'}`}
              >
                {borrowingMenus.map((item, index) => (
                  <li
                    key={item.key}
                    className={`transition-all duration-300 ease-in-out
                      ${openSubMenu ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}
                    `}
                    style={{ transitionDelay: openSubMenu ? `${index * 50}ms` : '0ms' }}
                  >
                    <Link
                      to={item.to}
                      onClick={() => handleMenuClick(item.to)}
                      className={`flex items-center justify-start py-2 px-3 rounded-lg transition-colors duration-200
                        ${isActive(item.to) ? 'bg-blue-500 text-white shadow-sm' : 'hover:bg-blue-50 text-gray-700'} w-full`}
                    >
                      {React.cloneElement(item.icon, { size: iconSize })}
                      <span className="ms-3 text-sm font-medium whitespace-nowrap">
                        {item.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
          {/* Icon-Only List for Borrowing Menu */}
          {borrowingMenus.map((item, index) => (
            <li
              key={`${item.key}-icon`}
              className={`w-full flex justify-center transition-all duration-300 ease-in-out
                ${isCollapsed ? 'my-1 opacity-100 max-h-12' : 'm-0 opacity-0 max-h-0 invisible overflow-hidden'}
                ${menuReady ? 'translate-y-0' : '-translate-y-4'}`}
              style={{
                transitionDelay: menuReady && isCollapsed ? `${(index + 4) * 50}ms` : '0ms',
                animation: isCollapsed && menuReady ? 'fadeIn 0.3s ease-in-out' : 'none'
              }}
            >
              <Link
                to={item.to}
                onClick={() => handleMenuClick(item.to)}
                className={`flex items-center justify-center w-12 h-12 rounded-xl transition-colors duration-200
                  ${isActive(item.to) ? 'bg-blue-500 text-white shadow-md shadow-blue-200' : 'hover:bg-blue-50 text-gray-700'}
                  ${isCollapsed ? 'opacity-100' : 'opacity-0'}`}
                title={item.label}
                style={{ pointerEvents: isCollapsed ? 'auto' : 'none' }}
              >
                {React.cloneElement(item.icon, { size: iconSize })}
              </Link>
            </li>
          ))}
        </ul>

        {/* Logout button - moved to bottom */}
        <div className={`mt-auto px-4 pb-6 ${isCollapsed ? 'flex justify-center' : ''} transition-all duration-500 ease-in-out ${menuReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: menuReady ? '500ms' : '0ms' }}>
          <button
            onClick={handleLogout}
            className={isCollapsed
              ? "flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-all duration-200"
              : "flex items-center w-full p-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 justify-start transition-all duration-200"}
            title={isCollapsed ? "ออกจากระบบ" : undefined}
          >
            <FaSignOutAlt size={iconSize} />
            <span
              className={`transition-all duration-700 ease-in-out overflow-hidden whitespace-nowrap ${isCollapsed ? 'max-w-0 opacity-0 ms-0' : 'max-w-xs opacity-100 ms-3'} font-medium`}
            >
              ออกจากระบบ
            </span>
          </button>
        </div>
      </div>
      {showLogoutConfirm && (
        <Notification
          show={showLogoutConfirm}
          title="ยืนยันออกจากระบบ"
          message="คุณต้องการออกจากระบบใช่หรือไม่?"
          type="warning"
          onClose={cancelLogout}
          actions={[
            { label: 'ยกเลิก', onClick: cancelLogout },
            { label: 'ออกจากระบบ', onClick: confirmLogout }
          ]}
        />
      )}
    </div>
    </>
  );
}

export default SidebarUser;