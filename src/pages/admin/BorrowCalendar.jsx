import { Chip, Typography } from '@material-tailwind/react';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import { th } from 'date-fns/locale';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { useEffect, useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  MdAccessTime,
  MdCheckCircle,
  MdChevronLeft,
  MdChevronRight,
  MdEvent,
  MdFilterList,
  MdInfo,
  MdLocationOn,
  MdPerson,
  MdRefresh,
  MdSchedule,
  MdSearch,
  MdToday,
  MdViewDay,
  MdViewModule,
  MdViewWeek,
  MdWarning
} from 'react-icons/md';
import Notification from '../../components/Notification';
import { API_BASE, getAllBorrows } from '../../utils/api';

// Modern calendar styles
const customCalendarStyles = `
  .rbc-calendar {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .rbc-header {
    background: linear-gradient(#000099 100%);
    border: none;
    padding: 16px 12px;
    font-weight: 600;
    color: white;
    text-align: center;
    font-size: 14px;
  }
  
  .rbc-month-view {
    border: none;
    border-radius: 16px;
    overflow: hidden;
  }
  
  .rbc-date-cell {
    padding: 12px;
    text-align: right;
    border-right: 1px solid #f1f5f9;
  }
  
  .rbc-date-cell > a {
    color: #475569;
    font-weight: 600;
    font-size: 14px;
  }
  
  .rbc-today {
    background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%) !important;
  }
  
  .rbc-event {
    border: none !important;
    border-radius: 8px !important;
    padding: 6px 10px !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
    margin: 2px 1px !important;
    backdrop-filter: blur(10px);
  }
  
  .rbc-toolbar {
    display: none;
  }
  
  .rbc-month-row {
    border-bottom: 1px solid #f1f5f9;
  }
  
  .rbc-day-bg {
    border-right: 1px solid #f1f5f9;
  }
  
  /* Day and Week view - Clean Layout */
  .rbc-time-view {
    height: 600px !important;
    display: flex !important;
    flex-direction: column !important;
  }
  
  .rbc-time-view .rbc-time-header {
    flex-shrink: 0 !important;
  }
  
  .rbc-time-view .rbc-time-content {
    flex: 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }
  
  .rbc-time-view .rbc-time-gutter {
    display: none !important;
  }
  
  .rbc-time-view .rbc-time-content {
    margin-left: 0 !important;
  }
  
  .rbc-time-view .rbc-time-column {
    display: none !important;
  }
  
  .rbc-time-view .rbc-allday-cell {
    height: calc(100% - 60px) !important;
    padding: 20px !important;
    background: #fafafa !important;
    border-radius: 12px !important;
    margin: 10px !important;
    min-height: 500px !important;
    max-height: 500px !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    box-sizing: border-box !important;
  }
  
  .rbc-time-view .rbc-allday-cell::-webkit-scrollbar {
    width: 6px !important;
  }
  
  .rbc-time-view .rbc-allday-cell::-webkit-scrollbar-track {
    background: #f1f1f1 !important;
    border-radius: 3px !important;
  }
  
  .rbc-time-view .rbc-allday-cell::-webkit-scrollbar-thumb {
    background: #c1c1c1 !important;
    border-radius: 3px !important;
  }
  
  .rbc-time-view .rbc-allday-cell::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8 !important;
  }
  
  /* Make week/day view header match the month header styling */
  .rbc-time-view .rbc-header {
    background: linear-gradient(#000099 100%) !important;
    border: none !important;
    padding: 16px 12px !important;
    font-weight: 600 !important;
    color: white !important;
    text-align: center !important;
    font-size: 14px !important;
    border-radius: 16px !important;
    margin: 10px !important;
  }
  
  .rbc-allday-cell .rbc-event {
    margin: 6px 0 !important;
    padding: 12px 16px !important;
    font-size: 13px !important;
    min-height: 45px !important;
    border-radius: 10px !important;
    box-shadow: 0 3px 5px rgba(0,0,0,0.1) !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    width: calc(100% - 12px) !important;
    max-width: calc(100% - 12px) !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
  }
  
  .rbc-allday-cell .rbc-event:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 12px rgba(0,0,0,0.15) !important;
  }
  
  /* Event counter styling */
  .rbc-event .event-counter {
    background: rgba(255, 255, 255, 0.3) !important;
    border-radius: 10px !important;
    font-size: 10px !important;
    font-weight: bold !important;
    padding: 2px 6px !important;
    margin-left: 4px !important;
  }
`;

// Inject modern styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('calendar-styles');
  if (existingStyle) existingStyle.remove();
  
  const styleElement = document.createElement('style');
  styleElement.id = 'calendar-styles';
  styleElement.textContent = customCalendarStyles;
  document.head.appendChild(styleElement);
}

// ตั้งค่า locale เป็นภาษาไทย
dayjs.locale('th');

// Helpers to avoid Invalid Date displays
const safeParse = (value) => {
  if (!value) return null;
  const d1 = dayjs(value);
  if (d1.isValid()) return d1;
  if (typeof value === 'string') {
    // Try DD/MM/YYYY
    const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      const d2 = dayjs(`${m[3]}-${m[2]}-${m[1]}`);
      if (d2.isValid()) return d2;
    }
  }
  const d3 = dayjs(new Date(value));
  return d3.isValid() ? d3 : null;
};

const safeFormatDate = (value, fmt) => {
  const d = safeParse(value);
  return d ? d.format(fmt) : '-';
};

const isPastDate = (value) => {
  const d = safeParse(value);
  return d ? d.isBefore(dayjs(), 'day') : false;
};

// ตั้งค่า localizer สำหรับ react-big-calendar
const locales = {
  'th': th,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const BorrowCalendar = () => {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState({});
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  // Navigation functions
  const navigate = (action) => {
    const newDate = new Date(date);
    
    switch (view) {
      case 'day':
        if (action === 'PREV') {
          newDate.setDate(newDate.getDate() - 1);
        } else if (action === 'NEXT') {
          newDate.setDate(newDate.getDate() + 1);
        } else if (action === 'TODAY') {
          setDate(new Date());
          return;
        }
        break;
      case 'week':
        if (action === 'PREV') {
          newDate.setDate(newDate.getDate() - 7);
        } else if (action === 'NEXT') {
          newDate.setDate(newDate.getDate() + 7);
        } else if (action === 'TODAY') {
          setDate(new Date());
          return;
        }
        break;
      case 'month':
        if (action === 'PREV') {
          newDate.setMonth(newDate.getMonth() - 1);
        } else if (action === 'NEXT') {
          newDate.setMonth(newDate.getMonth() + 1);
        } else if (action === 'TODAY') {
          setDate(new Date());
          return;
        }
        break;
    }
    
    setDate(newDate);
  };

  // Format date for display
  const getDateLabel = () => {
    switch (view) {
      case 'day':
        return dayjs(date).format('DD MMMM YYYY');
      case 'week':
        const startOfWeek = dayjs(date).startOf('week');
        const endOfWeek = dayjs(date).endOf('week');
        return `${startOfWeek.format('DD MMM')} - ${endOfWeek.format('DD MMM YYYY')}`;
      case 'month':
        return dayjs(date).format('MMMM YYYY');
      default:
        return dayjs(date).format('MMMM YYYY');
    }
  };

  // สีตามสถานะ
  const getStatusColor = (status) => {
    // Normalize to string
    const s = (status || '').toString();
    switch (s) {
      case 'pending': // รอตรวจสอบ
        return '#fbbf24'; // yellow
      case 'pending_approval': // รออนุมัติ
        return '#fb923c'; // orange
      case 'carry': // อนุมัติแล้ว (กำลังดำเนินการ)
        return '#3b82f6'; // blue
      case 'approved': // ส่งมอบแล้ว
        return '#10b981'; // green
      case 'rejected': // ถูกปฏิเสธ
        return '#dc2626'; // red-600
      case 'waiting_payment': // รอการชำระเงิน
        return '#8b5cf6'; // violet
      case 'canceled': // ยกเลิก
        return '#9ca3af'; // gray
      case 'completed': // เสร็จสิ้น
        return '#6b7280'; // gray
      default:
        return '#6b7280'; // fallback gray
    }
  };

  // ข้อความสถานะภาษาไทย
  const getStatusText = (status) => {
    const s = (status || '').toString();
    switch (s) {
      case 'pending':
        return 'รอตรวจสอบ';
      case 'pending_approval':
        return 'รออนุมัติ';
      case 'carry':
        return 'ส่งมอบ';
      case 'approved':
        return 'อนุมัติ';
      case 'rejected':
        return 'ถูกปฏิเสธ';
      case 'waiting_payment':
        return 'รอการชำระเงิน';
      case 'canceled':
        return 'ยกเลิก';
      case 'completed':
        return 'เสร็จสิ้น';
      default:
        return s || '-';
    }
  };

  useEffect(() => {
    fetchBorrows();
  }, []);

  const fetchBorrows = async () => {
    try {
      setLoading(true);
      setDebugInfo('กำลังดึงข้อมูล...');

      // ตรวจสอบ token ก่อน
      const token = localStorage.getItem('token');
      if (!token) {
        setDebugInfo('ไม่พบ token - กรุณาเข้าสู่ระบบใหม่');
        setNotificationData({
          title: 'ไม่พบ token',
          message: 'กรุณาเข้าสู่ระบบใหม่',
          type: 'error'
        });
        setShowNotification(true);
        return;
      }

      console.log('Making API call to:', `${API_BASE}/borrows`);
      const data = await getAllBorrows();
      console.log('Fetched borrows data:', data);
      console.log('Data type:', typeof data);
      console.log('Is array:', Array.isArray(data));

      setDebugInfo(`ได้รับข้อมูล: ${Array.isArray(data) ? data.length : 'ไม่ใช่ array'} รายการ`);

      if (Array.isArray(data)) {
        setBorrows(data);
        console.log('Set borrows state with', data.length, 'items');
        setDebugInfo(`โหลดข้อมูลสำเร็จ: ${data.length} รายการ`);

        // แสดงตัวอย่างข้อมูลแรก
        if (data.length > 0) {
          console.log('Sample data:', data[0]);
          setDebugInfo(`โหลดข้อมูลสำเร็จ: ${data.length} รายการ - ตัวอย่าง: ${data[0].borrow_code}`);
        }
      } else if (data && data.message) {
        // กรณี API ส่ง error message กลับมา
        console.error('API Error:', data.message);
        setDebugInfo(`API Error: ${data.message}`);
        setNotificationData({
          title: 'เกิดข้อผิดพลาด',
          message: data.message,
          type: 'error'
        });
        setShowNotification(true);
      } else {
        console.error('Data is not an array:', data);
        setDebugInfo(`ข้อมูลไม่ถูกต้อง: ${typeof data} - ${JSON.stringify(data).slice(0, 100)}`);

        // ลองสร้างข้อมูลทดสอบ
        const testData = [
          {
            borrow_id: 'test_1',
            borrow_code: 'TEST001',
            borrower: { name: 'ทดสอบ ระบบ', department: 'IT', position: 'Developer' },
            equipment: [{ name: 'Laptop Dell', item_code: 'LAP001', quantity: 1 }],
            borrow_date: new Date().toISOString().split('T')[0],
            return_date: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
            status: 'approved',
            purpose: 'ทดสอบระบบ'
          }
        ];
        setBorrows(testData);
        setDebugInfo(`ใช้ข้อมูลทดสอบ: ${testData.length} รายการ`);
      }
    } catch (error) {
      console.error('Error fetching borrows:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      setDebugInfo(`เกิดข้อผิดพลาด: ${error.message}`);
      setNotificationData({
        title: 'เกิดข้อผิดพลาด',
        message: `ไม่สามารถดึงข้อมูลการยืมได้: ${error.message}`,
        type: 'error'
      });
      setShowNotification(true);

      // สร้างข้อมูลทดสอบเมื่อเกิด error
      const testData = [
        {
          borrow_id: 'error_test_1',
          borrow_code: 'ERR001',
          borrower: { name: 'ข้อมูลทดสอบ', department: 'ทดสอบ', position: 'ทดสอบ' },
          equipment: [{ name: 'อุปกรณ์ทดสอบ', item_code: 'TEST001', quantity: 1 }],
          borrow_date: new Date().toISOString().split('T')[0],
          return_date: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
          status: 'pending',
          purpose: 'ข้อมูลทดสอบเมื่อเกิดข้อผิดพลาด'
        }
      ];
      setBorrows(testData);
      setDebugInfo(`ใช้ข้อมูลทดสอบ (Error): ${testData.length} รายการ`);
    } finally {
      setLoading(false);
    }
  };

     // แปลงข้อมูลการยืมเป็น events สำหรับปฏิทิน
   const events = useMemo(() => {
     console.log('Creating events from borrows:', borrows);
     console.log('Borrows length:', borrows.length);
     console.log('Filter status:', filterStatus);
     console.log('Search term:', searchTerm);

     if (!Array.isArray(borrows) || borrows.length === 0) {
       console.log('No borrows data available');
       return [];
     }

     const filteredBorrows = borrows
       .filter(borrow => {
         // ไม่แสดงรายการที่เสร็จสิ้นแล้ว
         if (borrow.status === 'completed') return false;

         const matchesStatus = filterStatus === 'all' || borrow.status === filterStatus;
         const matchesSearch = searchTerm === '' ||
           borrow.borrow_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           borrow.borrower?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           borrow.equipment?.some(eq => eq.name?.toLowerCase().includes(searchTerm.toLowerCase()));

         return matchesStatus && matchesSearch;
       });

     console.log('Filtered borrows:', filteredBorrows);
     console.log('Filtered borrows length:', filteredBorrows.length);

      const events = filteredBorrows.map(borrow => {
       console.log('Processing borrow:', borrow.borrow_code, 'dates:', borrow.borrow_date, borrow.return_date);

       // สร้าง title ที่เข้าใจง่าย
       const borrowerName = borrow.borrower?.name || 'ไม่ระบุ';
       const equipmentNames = borrow.equipment?.map(eq => eq.name).join(', ') || 'ไม่ระบุ';
       const statusText = getStatusText(borrow.status);

       // แปลงวันที่ให้ถูกต้อง
       let startDate, endDate;
       try {
         // ใช้ return_date แทน due_date เพื่อความชัดเจน
         const borrowDate = borrow.borrow_date || borrow.due_date;
         const returnDate = borrow.return_date || borrow.due_date;

         startDate = new Date(borrowDate);
         endDate = new Date(returnDate);

         // ตรวจสอบว่าวันที่ถูกต้องหรือไม่
         if (isNaN(startDate.getTime())) {
           console.warn('Invalid start date for borrow:', borrow.borrow_code);
           startDate = new Date(); // ใช้วันนี้เป็น default
         }

         if (isNaN(endDate.getTime())) {
           console.warn('Invalid end date for borrow:', borrow.borrow_code);
           endDate = new Date(startDate.getTime() + 7*24*60*60*1000); // 7 วันหลังจาก start date
         }

         // ถ้า end date เป็นวันเดียวกับ start date ให้เพิ่ม 1 วัน
         if (endDate.getTime() === startDate.getTime()) {
           endDate = new Date(startDate.getTime() + 24*60*60*1000);
         }

       } catch (error) {
         console.error('Error parsing dates for borrow:', borrow.borrow_code, error);
         startDate = new Date();
         endDate = new Date(startDate.getTime() + 7*24*60*60*1000);
       }

        // แสดงวันคืนจริงหากมี (return_date จากตาราง returns) ไม่เช่นนั้นใช้กำหนดคืน (due_date)
        const hasActualReturn = Boolean(borrow.return_date);
        const returnDateRaw = borrow.return_date || borrow.due_date;
        const returnDateStr = safeFormatDate(returnDateRaw, 'DD/MM/YYYY');
        const returnLabel = hasActualReturn ? 'คืนจริง' : 'กำหนดคืน';

        const event = {
         id: borrow.borrow_id,
         title: `${borrow.borrow_code} - ${borrowerName}`,
         start: startDate,
         end: endDate,
         borrow: borrow,
         status: borrow.status,
         allDay: true,
         resource: {
           borrowCode: borrow.borrow_code,
           borrowerName: borrowerName,
           equipmentNames: equipmentNames,
           status: borrow.status,
           statusText: statusText,
           returnDateStr
         }
       };

       console.log('Created event:', {
         id: event.id,
         title: event.title.split('\n')[0], // แสดงแค่ borrow_code
         start: event.start.toISOString(),
         end: event.end.toISOString(),
         status: event.status
       });

       return event;
     });

     console.log('Generated events:', events.length, 'events');
     return events;
   }, [borrows, filterStatus, searchTerm]);

  // Event Style
  const eventStyleGetter = (event) => {
    const backgroundColor = getStatusColor(event.status);
    const style = {
      backgroundColor,
      borderRadius: '6px',
      opacity: 0.95,
      color: 'white',
      border: 'none',
      fontSize: '11px',
      fontWeight: '500',
      padding: '2px 6px',
      margin: '1px 0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    };
    return { style };
  };

  // Custom event component with counter
  const CustomEvent = ({ event }) => {
    const eventDate = dayjs(event.start);
    const weekStart = eventDate.startOf('week');
    const weekEnd = eventDate.endOf('week');
    
    // นับจาก borrows ทั้งหมดในสัปดาห์ (ไม่กรองตามสถานะ)
    const weekEvents = borrows.filter(borrow => {
      if (borrow.status === 'completed') return false;
      const borrowDate = dayjs(borrow.borrow_date || borrow.due_date);
      return borrowDate.isAfter(weekStart.subtract(1, 'day')) && borrowDate.isBefore(weekEnd.add(1, 'day'));
    });
    
    const isFirstEvent = weekEvents[0]?.borrow_id === event.borrow.borrow_id;
    const eventCount = weekEvents.length;

    return (
      <div className="flex items-center justify-between w-full">
        <span className="truncate flex-1">
          {event.resource.borrowCode} - {event.resource.borrowerName}
        </span>
        {isFirstEvent && eventCount > 1 && (
          <span className="ml-1 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
            +{eventCount - 1}
          </span>
        )}
      </div>
    );
  };

  // จัดการเมื่อคลิก event
  const handleEventClick = (event) => {
    const eventDate = dayjs(event.start);
    const weekStart = eventDate.startOf('week');
    const weekEnd = eventDate.endOf('week');
    
    // นับจาก borrows ทั้งหมดในสัปดาห์ (ไม่กรองตามสถานะ)
    const weekEvents = borrows.filter(borrow => {
      if (borrow.status === 'completed') return false;
      const borrowDate = dayjs(borrow.borrow_date || borrow.due_date);
      return borrowDate.isAfter(weekStart.subtract(1, 'day')) && borrowDate.isBefore(weekEnd.add(1, 'day'));
    });
    
    // ถ้ามีหลายรายการในสัปดาห์เดียวกันและอยู่ในมุมมองเดือน ให้เปลี่ยนไปมุมมองสัปดาห์
    if (weekEvents.length > 1 && view === 'month') {
      setDate(new Date(event.start));
      setView('week');
    } else {
      // แสดงรายละเอียดตามปกติ
      setSelectedEvent(event);
      setShowEventDetails(true);
    }
  };

  // จัดการเมื่อคลิก slot ว่าง
  const handleSelectSlot = (slotInfo) => {
    console.log('Selected slot:', slotInfo);
  };

  // จัดการเมื่อคลิก event
  const handleSelectEvent = (event) => {
    handleEventClick(event);
  };

     // Messages สำหรับภาษาไทย
   const messages = {
     allDay: 'ตลอดวัน',
     previous: 'ก่อนหน้า',
     next: 'ถัดไป',
     today: 'วันนี้',
     month: 'เดือน',
     week: 'สัปดาห์',
     day: 'วัน',
     agenda: 'กำหนดการ',
     date: 'วันที่',
     time: 'เวลา',
     event: 'เหตุการณ์',
     noEventsInRange: 'ไม่มีรายการยืมในช่วงเวลานี้',
     showMore: (total) => `+${total} รายการเพิ่มเติม`,
   };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <MdSchedule className="text-black text-4xl" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-black bg-clip-text mb-2">
                ปฏิทินการยืม
              </h1>
              <p className="text-gray-500 text-lg">จัดการและติดตามการยืมครุภัณฑ์อย่างมีประสิทธิภาพ</p>
            </div>
          </div>
        </div>

        {/* Modern Legend */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
              <MdInfo className="text-black text-xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">คำอธิบายสถานะ</h3>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-2">
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-2xl border border-yellow-200/50">
              <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: '#fbbf24' }}></div>
              <span className="font-semibold text-gray-700">รอตรวจสอบ</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50  rounded-2xl border border-orange-200/50">
              <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: '#fb923c' }}></div>
              <span className="font-semibold text-gray-700">รออนุมัติ</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50">
              <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: '#3b82f6' }}></div>
              <span className="font-semibold text-gray-700">ส่งมอบ</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-2xl border border-emerald-200/50">
              <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: '#10b981' }}></div>
              <span className="font-semibold text-gray-700">อนุมัติ</span>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-3">
            
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-2xl border border-red-300/50">
              <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: '#dc2626' }}></div>
              <span className="font-semibold text-gray-700">ถูกปฏิเสธ</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-2xl border border-violet-200/50">
              <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: '#8b5cf6' }}></div>
              <span className="font-semibold text-gray-700">รอการชำระเงิน</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-200/50">
              <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: '#9ca3af' }}></div>
              <span className="font-semibold text-gray-700">เสร็จสิ้น</span>
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50">
            <div className="flex items-center gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <p className="font-semibold text-blue-900 mb-1">วิธีใช้งาน</p>
                <p className="text-blue-700">คลิกที่รายการในปฏิทินเพื่อดูรายละเอียดการยืมแบบละเอียด</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Control Panel */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search Section */}
            <div className="flex-1">
              <div className="relative">
                <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="text"
                  placeholder="ค้นหารหัสการยืม, ชื่อผู้ยืม, หรือชื่อครุภัณฑ์..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-200/50 rounded-2xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            {/* Filters and Controls */}
            <div className="flex flex-wrap gap-4 items-center">
              {/* Status Filter */}
              <div className="relative">
                <MdFilterList className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-8 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">สถานะทั้งหมด</option>
                  <option value="pending">รอตรวจสอบ</option>
                  <option value="pending_approval">รออนุมัติ</option>
                  <option value="carry">อนุมัติ</option>
                  <option value="approved">ส่งมอบ</option>
                  <option value="rejected">ถูกปฏิเสธ</option>
                  <option value="waiting_payment">รอการชำระเงิน</option>
                  <option value="completed">เสร็จสิ้น</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex bg-gray-100/80 rounded-2xl p-1.5 backdrop-blur-sm">
                <button
                  onClick={() => setView('day')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    view === 'day' 
                      ? 'bg-white text-blue-600 shadow-lg shadow-blue-500/20' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <MdViewDay className="text-lg" />
                  วัน
                </button>
                <button
                  onClick={() => setView('week')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    view === 'week' 
                      ? 'bg-white text-blue-600 shadow-lg shadow-blue-500/20' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <MdViewWeek className="text-lg" />
                  สัปดาห์
                </button>
                <button
                  onClick={() => setView('month')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    view === 'month' 
                      ? 'bg-white text-blue-600 shadow-lg shadow-blue-500/20' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <MdViewModule className="text-lg" />
                  เดือน
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={fetchBorrows}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-semibold shadow-lg shadow-blue-500/25 transition-all transform hover:scale-105 disabled:hover:scale-100"
                >
                  <MdRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Calendar */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Custom Calendar Header */}
          <div className="bg-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* Navigation Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('PREV')}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all transform hover:scale-105"
                  >
                    <MdChevronLeft className="text-xl" />
                  </button>
                  <button
                    onClick={() => navigate('TODAY')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all transform hover:scale-105 flex items-center gap-2"
                  >
                    <MdToday className="text-lg" />
                    วันนี้
                  </button>
                  <button
                    onClick={() => navigate('NEXT')}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all transform hover:scale-105"
                  >
                    <MdChevronRight className="text-xl" />
                  </button>
                </div>
                
                {/* Date Display */}
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {getDateLabel()}
                  </h2>
                  <div className="flex items-center gap-2 text-white mt-1">
                    <MdEvent className="text-lg" />
                    <span className="font-medium">{events.length} รายการ</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right text-white">
                <div className="text-sm">อัพเดทล่าสุด</div>
                <div className="font-semibold">{dayjs().format('DD/MM/YYYY HH:mm')}</div>
              </div>
            </div>
          </div>
          
          <div className="h-[calc(100vh-400px)] min-h-[600px] p-6 overflow-hidden">
            <div className="w-full h-full overflow-hidden">
              <Calendar
                   localizer={localizer}
                   events={events}
                   startAccessor="start"
                   endAccessor="end"
                   style={{ height: '100%' }}
                   view={view}
                   date={date}
                   onView={setView}
                   onNavigate={setDate}
                   onSelectEvent={handleSelectEvent}
                   onSelectSlot={handleSelectSlot}
                   selectable
                   eventPropGetter={eventStyleGetter}
                   messages={messages}
                   culture="th"
                   tooltipAccessor={(event) => {
                     const { resource } = event;
                     return `รหัส: ${resource.borrowCode}\nผู้ยืม: ${resource.borrowerName}\nครุภัณฑ์: ${resource.equipmentNames}\nสถานะ: ${resource.statusText}`;
                   }}
                   popup
                   step={60}
                   timeslots={1}
                   defaultView="month"
                   showMultiDayTimes={false}
                   components={{
                     timeSlotWrapper: () => null,
                     timeGutterHeader: () => null,
                     event: CustomEvent
                   }}
                   formats={{
                     dayFormat: 'dd',
                     dayHeaderFormat: 'eeee dd/MM/yyyy',
                     dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
                       localizer.format(start, 'dd/MM/yyyy', culture) + ' - ' + localizer.format(end, 'dd/MM/yyyy', culture),
                     timeGutterFormat: () => '',
                     eventTimeRangeFormat: () => ''
                   }}
                   dayPropGetter={(date) => {
                      const dayEvents = events.filter(event => {
                        const eventDate = new Date(event.start);
                        return eventDate.toDateString() === date.toDateString();
                      });

                      if (dayEvents.length > 0) {
                        const hasOverdue = dayEvents.some(event => event.status === 'overdue');
                        const hasPending = dayEvents.some(event => event.status === 'pending' || event.status === 'pending_approval');

                        if (hasOverdue) {
                          return { className: 'bg-red-50 border-l-4 border-red-500' };
                        } else if (hasPending) {
                          return { className: 'bg-yellow-50 border-l-4 border-yellow-500' };
                        }
                      }
                      return {};
                    }}
              />
            </div>
          </div>
        </div>

        {/* Event Details Modal */}
         {showEventDetails && selectedEvent && (
           <div className="modal modal-open">
             <div className="modal-box relative bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-[150vh] w-full p-5 z-50 overflow-y-auto max-h-[90vh]">
               {/* Header */}
               <div className="flex justify-between items-center pb-3 mb-4 border-b border-gray-100">
                 <h3 className="text-2xl font-bold text-gray-800 flex items-center tracking-tight">
                   <span className="bg-emerald-100 text-emerald-700 p-2 rounded-lg mr-3 shadow-sm">
                     <MdEvent className="h-5 w-5" />
                   </span>
                   รายละเอียดการยืม
                 </h3>
                 <button
                   onClick={() => setShowEventDetails(false)}
                   className="text-gray-500 hover:text-gray-800 transition-colors duration-150 hover:bg-gray-100 p-2 rounded-full"
                 >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>

               {/* Content */}
               <div className="space-y-6">
                 {/* Status Banner */}
                 <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-white border border-emerald-200 shadow-sm">
                   <div className="flex items-center gap-4">
                     <div className="flex items-center gap-3">
                       <Typography variant="h4" className="text-emerald-600 font-bold">
                         {selectedEvent.borrow.borrow_code}
                       </Typography>
                       <Chip
                         value={getStatusText(selectedEvent.borrow.status)}
                         className="text-white font-semibold px-3 py-1"
                         style={{ backgroundColor: getStatusColor(selectedEvent.borrow.status) }}
                       />
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="flex items-center gap-2 text-gray-600">
                       <MdSchedule className="text-lg" />
                       <div>
                         <Typography variant="small" className="font-semibold">
                           วันที่ยืม
                         </Typography>
                         <Typography variant="small">
                           {dayjs(selectedEvent.borrow.borrow_date).format('DD/MM/YYYY')}
                         </Typography>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Main Content Grid */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {/* Borrower Information */}
                   <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                     <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-200 p-4">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-emerald-500 rounded-lg">
                           <MdPerson className="text-white text-xl" />
                         </div>
                         <Typography variant="h6" className="text-gray-800 font-semibold">
                           ข้อมูลผู้ยืม
                         </Typography>
                       </div>
                     </div>
                     <div className="p-4">
                       <div className="space-y-4">
                         <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-all duration-300">
                           <MdPerson className="text-gray-500 text-lg" />
                           <div>
                             <Typography variant="small" className="font-semibold text-gray-700">
                               ชื่อผู้ยืม
                             </Typography>
                             <Typography variant="paragraph" className="text-gray-800 font-medium">
                               {selectedEvent.borrow.borrower?.name || 'ไม่ระบุ'}
                             </Typography>
                           </div>
                         </div>
                         <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-all duration-300">
                           <MdLocationOn className="text-gray-500 text-lg" />
                           <div>
                             <Typography variant="small" className="font-semibold text-gray-700">
                               สาขา/แผนก
                             </Typography>
                             <Typography variant="paragraph" className="text-gray-800 font-medium">
                               {selectedEvent.borrow.borrower?.department || 'ไม่ระบุ'}
                             </Typography>
                           </div>
                         </div>
                         {selectedEvent.borrow.borrower?.position && (
                           <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-all duration-300">
                             <MdInfo className="text-gray-500 text-lg" />
                             <div>
                               <Typography variant="small" className="font-semibold text-gray-700">
                                 ตำแหน่ง
                               </Typography>
                               <Typography variant="paragraph" className="text-gray-800 font-medium">
                                 {selectedEvent.borrow.borrower.position}
                               </Typography>
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                   </div>

                   {/* Equipment Information */}
                   <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                     <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-4">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-500 rounded-lg">
                           <MdInfo className="text-white text-xl" />
                         </div>
                         <Typography variant="h6" className="text-gray-800 font-semibold">
                           รายการครุภัณฑ์
                         </Typography>
                       </div>
                     </div>
                     <div className="p-4">
                       <div className="space-y-3">
                         {selectedEvent.borrow.equipment?.map((eq, idx) => (
                           <div key={idx} className="p-3 bg-gray-50 rounded-lg border-l-4 border-emerald-500 group hover:bg-gray-100 transition-all duration-300">
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                 <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                 <div>
                                   <Typography variant="paragraph" className="font-semibold text-gray-800">
                                     {eq.name}
                                   </Typography>
                                   <Typography variant="small" className="text-gray-600">
                                     รหัส: {eq.item_code}
                                   </Typography>
                                 </div>
                               </div>
                                                               <div className="flex items-center gap-1">
                                  <span className="text-emerald-600 font-semibold text-sm">จำนวน:</span>
                                  <div className="px-2 py-1 bg-emerald-500 text-white rounded-full text-xs font-bold min-w-[20px] text-center">
                                    {eq.quantity}
                                  </div>
                                </div>
                             </div>
                             {eq.room_name && (
                               <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                                 <MdLocationOn className="text-xs" />
                                 <span>ห้อง: {eq.room_name} ({eq.room_code})</span>
                               </div>
                             )}
                           </div>
                         ))}
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Purpose and Dates */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Purpose */}
                   {selectedEvent.borrow.purpose && (
                     <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                       <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200 p-4">
                         <div className="flex items-center gap-3">
                           <div className="p-2 bg-purple-500 rounded-lg">
                             <MdInfo className="text-white text-xl" />
                           </div>
                           <Typography variant="h6" className="text-gray-800 font-semibold">
                             วัตถุประสงค์
                           </Typography>
                         </div>
                       </div>
                       <div className="p-4">
                         <Typography variant="paragraph" className="text-gray-700">
                           {selectedEvent.borrow.purpose}
                         </Typography>
                       </div>
                     </div>
                   )}

                   {/* Return Date */}
                   <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                     <div className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-200 p-4">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-orange-500 rounded-lg">
                           <MdAccessTime className="text-white text-xl" />
                         </div>
                          <Typography variant="h6" className="text-gray-800 font-semibold">
                            {selectedEvent.borrow.return_date ? 'วันคืนจริง' : 'กำหนดคืน'}
                          </Typography>
                       </div>
                     </div>
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <Typography variant="h4" className="font-bold text-orange-600">
                              {safeFormatDate(selectedEvent.borrow.return_date || selectedEvent.borrow.due_date, 'DD')}
                            </Typography>
                            <Typography variant="small" className="text-gray-600">
                              {safeFormatDate(selectedEvent.borrow.return_date || selectedEvent.borrow.due_date, 'MMM YYYY')}
                            </Typography>
                          </div>
                          <div className="flex-1">
                            <Typography variant="small" className="text-gray-600">
                              วัน{safeFormatDate(selectedEvent.borrow.return_date || selectedEvent.borrow.due_date, 'dddd')}
                            </Typography>
                            {/* ถ้ามีวันคืนจริง ให้แสดงกำหนดเดิมเสริม */}
                            {selectedEvent.borrow.return_date && selectedEvent.borrow.due_date && (
                              <div className="mt-1 text-xs text-gray-500">
                                กำหนดเดิม: {safeFormatDate(selectedEvent.borrow.due_date, 'DD/MM/YYYY')}
                              </div>
                            )}
                            {selectedEvent.borrow.status === 'completed' && (
                              <div className="flex items-center gap-2 mt-1">
                                <MdCheckCircle className="text-emerald-500" />
                                <Typography variant="small" className="text-emerald-600 font-semibold">
                                  คืนแล้ว
                                </Typography>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                   </div>
                 </div>

                 {/* Warning Messages */}
                  {selectedEvent.borrow.status === 'approved' &&
                   isPastDate(selectedEvent.borrow.return_date || selectedEvent.borrow.due_date) && (
                   <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden bg-gradient-to-r from-red-50 to-pink-50">
                     <div className="p-4">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-red-500 rounded-lg">
                           <MdWarning className="text-white text-xl" />
                         </div>
                         <div>
                           <Typography variant="h6" className="text-red-700 font-semibold">
                             เกินกำหนดคืน
                           </Typography>
                           <Typography variant="small" className="text-red-600">
                              กำหนดคืน: {safeFormatDate(selectedEvent.borrow.return_date || selectedEvent.borrow.due_date, 'DD/MM/YYYY')}
                           </Typography>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}

                 {/* Rejection Reason */}
                 {selectedEvent.borrow.rejection_reason && (
                   <div className="bg-white rounded-xl border border-yellow-200 shadow-sm overflow-hidden bg-gradient-to-r from-yellow-50 to-orange-50">
                     <div className="p-4">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-yellow-500 rounded-lg">
                           <MdWarning className="text-white text-xl" />
                         </div>
                         <div>
                           <Typography variant="h6" className="text-yellow-700 font-semibold">
                             เหตุผลการปฏิเสธ
                           </Typography>
                           <Typography variant="small" className="text-yellow-600">
                             {selectedEvent.borrow.rejection_reason}
                           </Typography>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}
               </div>

               {/* Footer */}
               <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                 <button
                   className="px-6 py-2.5 text-sm font-medium text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 bg-emerald-600 hover:bg-emerald-700"
                   onClick={() => setShowEventDetails(false)}
                   type="button"
                 >
                   ปิด
                 </button>
               </div>
             </div>
             <form method="dialog" className="modal-backdrop">
               <button onClick={() => setShowEventDetails(false)}>close</button>
             </form>
           </div>
         )}
      </div>

      {/* Notification */}
      <Notification
        show={showNotification}
        title={notificationData.title}
        message={notificationData.message}
        type={notificationData.type}
        onClose={() => setShowNotification(false)}
      />
    </div>
  );
};

export default BorrowCalendar;