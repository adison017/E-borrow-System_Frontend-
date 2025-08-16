import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardBody, CardHeader, Typography, Button, Chip, Badge } from '@material-tailwind/react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  MdCalendarMonth,
  MdPerson,
  MdLocationOn,
  MdAccessTime,
  MdInfo,
  MdFilterList,
  MdSearch,
  MdToday,
  MdEvent,
  MdWarning,
  MdCheckCircle,
  MdSchedule,
  MdRefresh,
  MdViewDay,
  MdViewWeek,
  MdViewModule
} from 'react-icons/md';
import { getAllBorrows } from '../../utils/api';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Notification from '../../components/Notification';

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
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  // สีตามสถานะ
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#fbbf24'; // yellow
      case 'pending_approval':
        return '#fb923c'; // orange
      case 'carry':
        return '#3b82f6'; // blue
      case 'approved':
        return '#10b981'; // green
      case 'overdue':
        return '#ef4444'; // red
      case 'completed':
        return '#6b7280'; // gray
      default:
        return '#6b7280'; // gray
    }
  };

  // ข้อความสถานะภาษาไทย
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'รอตรวจสอบ';
      case 'pending_approval':
        return 'รออนุมัติ';
      case 'carry':
        return 'อนุมัติแล้ว';
      case 'approved':
        return 'ส่งมอบแล้ว';
      case 'overdue':
        return 'เกินกำหนด';
      case 'completed':
        return 'เสร็จสิ้น';
      default:
        return status;
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

      console.log('Making API call to:', `http://localhost:5000/api/borrows`);
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
           title: `${borrow.borrow_code}\n${borrowerName}\n${equipmentNames}\nสถานะ: ${statusText}\n${returnLabel}: ${returnDateStr}`,
         start: startDate,
         end: endDate,
         borrow: borrow,
         status: borrow.status,
         allDay: true, // เปลี่ยนเป็น allDay เพื่อให้แสดงเต็มวัน
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
       borderRadius: '8px',
       opacity: 0.9,
       color: 'white',
       border: '2px solid white',
       display: 'block',
       fontSize: '11px',
       fontWeight: 'bold',
       padding: '4px 8px',
       margin: '2px 0',
       boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
       whiteSpace: 'pre-line',
       lineHeight: '1.3',
       minHeight: '60px'
     };
     return {
       style
     };
   };

  // จัดการเมื่อคลิก event
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
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
    <div className="p-6 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <MdCalendarMonth className="text-3xl text-white" />
            </div>
            <div>
              <Typography variant="h3" className="text-gray-800 font-bold">
                ปฏิทินการยืม
              </Typography>
              <Typography variant="paragraph" className="text-gray-600">
                ดูตารางการยืมครุภัณฑ์และกำหนดการคืน
              </Typography>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <Card className="shadow-lg border-0 mb-6">
          <CardBody className="p-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              {/* Search */}
              <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
                <MdSearch className="text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหารหัสการยืม, ชื่อผู้ยืม, หรือชื่อครุภัณฑ์..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="outline-none text-gray-700 min-w-[300px]"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <MdFilterList className="text-gray-600" />
                                 <select
                   value={filterStatus}
                   onChange={(e) => setFilterStatus(e.target.value)}
                   className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 bg-white"
                 >
                   <option value="all">สถานะทั้งหมด</option>
                   <option value="pending">รอตรวจสอบ</option>
                   <option value="pending_approval">รออนุมัติ</option>
                   <option value="carry">อนุมัติแล้ว</option>
                 </select>
              </div>

              {/* View Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant={view === 'day' ? 'filled' : 'outlined'}
                  size="sm"
                  onClick={() => setView('day')}
                  className="flex items-center gap-1"
                >
                  <MdViewDay />
                  วัน
                </Button>
                <Button
                  variant={view === 'week' ? 'filled' : 'outlined'}
                  size="sm"
                  onClick={() => setView('week')}
                  className="flex items-center gap-1"
                >
                  <MdViewWeek />
                  สัปดาห์
                </Button>
                <Button
                  variant={view === 'month' ? 'filled' : 'outlined'}
                  size="sm"
                  onClick={() => setView('month')}
                  className="flex items-center gap-1"
                >
                  <MdViewModule />
                  เดือน
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    // สร้างข้อมูลทดสอบ
                    const testData = [
                      {
                        borrow_id: 'demo_1',
                        borrow_code: 'DEMO001',
                        borrower: { name: 'สมชาย ใจดี', department: 'IT', position: 'Developer' },
                        equipment: [{ name: 'Laptop Dell Inspiron', item_code: 'LAP001', quantity: 1 }],
                        borrow_date: new Date().toISOString().split('T')[0],
                        return_date: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
                        status: 'approved',
                        purpose: 'งานพัฒนาระบบ'
                      },
                      {
                        borrow_id: 'demo_2',
                        borrow_code: 'DEMO002',
                        borrower: { name: 'สมหญิง รักงาน', department: 'Marketing', position: 'Manager' },
                        equipment: [{ name: 'Projector Epson', item_code: 'PRJ001', quantity: 1 }],
                        borrow_date: new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0],
                        return_date: new Date(Date.now() + 5*24*60*60*1000).toISOString().split('T')[0],
                        status: 'pending_approval',
                        purpose: 'งานนำเสนอโครงการ'
                      },
                      {
                        borrow_id: 'demo_3',
                        borrow_code: 'DEMO003',
                        borrower: { name: 'สมศักดิ์ มั่นคง', department: 'HR', position: 'Officer' },
                        equipment: [{ name: 'กล้องถ่ายรูป Canon', item_code: 'CAM001', quantity: 1 }],
                        borrow_date: new Date(Date.now() - 2*24*60*60*1000).toISOString().split('T')[0],
                        return_date: new Date(Date.now() + 1*24*60*60*1000).toISOString().split('T')[0],
                        status: 'carry',
                        purpose: 'ถ่ายภาพกิจกรรมบริษัท'
                      }
                    ];
                    setBorrows(testData);
                    setDebugInfo(`โหลดข้อมูลทดสอบ: ${testData.length} รายการ`);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <MdEvent />
                  ข้อมูลทดสอบ
                </Button>

                <Button
                  onClick={fetchBorrows}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <MdRefresh className={loading ? 'animate-spin' : ''} />
                  {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>



                 {/* Calendar Legend */}
         <Card className="shadow-lg border-0 mb-4">
           <CardBody className="p-4">
             <Typography variant="h6" className="text-gray-800 font-semibold mb-3">
               คำอธิบายสีในปฏิทิน
             </Typography>
                           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fbbf24' }}></div>
                  <Typography variant="small" className="text-gray-700">รอตรวจสอบ</Typography>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fb923c' }}></div>
                  <Typography variant="small" className="text-gray-700">รออนุมัติ</Typography>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                  <Typography variant="small" className="text-gray-700">อนุมัติแล้ว</Typography>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-50 border-l-4 border-yellow-500"></div>
                  <Typography variant="small" className="text-gray-700">วันที่มีรายการรอ</Typography>
                </div>
              </div>
             <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
               <Typography variant="small" className="text-blue-800">
                 💡 <strong>วิธีใช้งาน:</strong> คลิกที่รายการในปฏิทินเพื่อดูรายละเอียดการยืม
               </Typography>
             </div>
           </CardBody>
         </Card>

         {/* Debug Info */}
         {debugInfo && (
           <Card className="shadow-lg border-0 mb-4">
             <CardBody className="p-4">
               <Typography variant="small" className="text-gray-600">
                 Debug: {debugInfo}
               </Typography>
               <Typography variant="small" className="text-gray-600">
                 Events: {events.length} รายการ
               </Typography>
               <Typography variant="small" className="text-gray-600">
                 Borrows: {borrows.length} รายการ
               </Typography>
             </CardBody>
           </Card>
         )}

         {/* Calendar */}
          <Card className="shadow-lg border-0 mb-6">
            <CardBody className="p-6 overflow-hidden">
              <div className="relative" style={{ height: 'calc(100vh - 260px)' }}>
                <div className="absolute inset-0 overflow-auto">
                  <Calendar
                   localizer={localizer}
                   events={events}
                   startAccessor="start"
                   endAccessor="end"
                    style={{ height: '100%' }}
                   view={view}
                   onView={setView}
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
                   min={new Date(2024, 0, 1, 8, 0, 0)}
                   max={new Date(2024, 11, 31, 18, 0, 0)}
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
           </CardBody>
         </Card>

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