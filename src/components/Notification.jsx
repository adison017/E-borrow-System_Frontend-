import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AiOutlineCheckCircle, AiOutlineCloseCircle, AiOutlineInfoCircle, AiOutlineWarning } from "react-icons/ai";

const Notification = ({
  show,
  title,
  message,
  type = "info",
  duration = 5000,
  onClose,
  actions = []
}) => {
  const notificationRef = useRef(null);
  const timerRef = useRef(null);
  const [visible, setVisible] = useState(show);
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setAnimateOut(false);
      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          handleClose();
        }, duration);
      }
    } else if (visible) {
      setAnimateOut(true);
      // รอให้ animation ออกจบก่อน unmount
      const timeout = setTimeout(() => {
        setVisible(false);
        setAnimateOut(false);
      }, 200); // ต้องตรงกับ duration ของ fadeOutScale
      return () => clearTimeout(timeout);
    }
    return () => {
      clearTimeout(timerRef.current);
    };
  }, [show, duration]);

  const handleClose = () => {
    setAnimateOut(true);
    setTimeout(() => {
      setVisible(false);
      setAnimateOut(false);
      onClose && onClose();
    }, 200); // duration ของ fadeOutScale
  };

  if (!visible) return null;

  const getNotificationStyle = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <AiOutlineCheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <AiOutlineCloseCircle className="w-8 h-8 text-red-500" />;
      case 'warning':
        return <AiOutlineWarning className="w-8 h-8 text-yellow-500" />;
      case 'info':
      default:
        return <AiOutlineInfoCircle className="w-8 h-8 text-blue-500" />;
    }
  };

  // Default action: ถ้าไม่มี actions ส่งมา ให้แสดงปุ่มตกลง
  const effectiveActions = actions && actions.length > 0 ? actions : [
    { label: 'ตกลง', onClick: handleClose }
  ];

  return createPortal(
    <>
      <style>{`
        @keyframes fadeInScale {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeOutScale {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.95); }
        }
        .animate-fadeInScale {
          animation: fadeInScale 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .animate-fadeOutScale {
          animation: fadeOutScale 0.25s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fadeIn">
        <div
          ref={notificationRef}
          className={`relative bg-white rounded-3xl p-8 pb-10 w-full max-w-[380px] sm:max-w-[420px] shadow-2xl border ${getNotificationStyle()} transition-all duration-300 ${animateOut ? 'animate-fadeOutScale' : 'animate-fadeInScale'} mb-12`}
          style={{
            maxWidth: '30vw',
            maxHeight: '80vh',
            overflow: 'visible',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
        {/* ปุ่มปิด (X) มุมขวาบน */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full p-1 transition"
          onClick={handleClose}
        >
          <span className="sr-only">Close</span>
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {/* ไอคอนสถานะใหญ่ */}
        <div className="mb-3 flex items-center justify-center">
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-opacity-10 animate-bounce" style={{backgroundColor: type==='success'? '#bbf7d0': type==='error'? '#fecaca': type==='warning'? '#fef08a': '#bfdbfe'}}>
            <div className="w-8 h-8">{getIcon()}</div>
          </div>
        </div>
        {/* Title และข้อความ */}
        <h3
          className="text-2xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 text-center break-words tracking-wide drop-shadow-sm"
          style={{ letterSpacing: '0.02em', lineHeight: 1.2 }}
        >
          {title}
        </h3>
        <div
          className="text-gray-700 text-base sm:text-lg md:text-lg  text-center whitespace-pre-line break-words mb-4 px-2 leading-relaxed font-medium"
          style={{ letterSpacing: '0.01em' }}
        >
          {message}
        </div>
        {/* Progress bar */}
        {duration > 0 && (
          <>
            <style>{`
              @keyframes notification-progress-center {
                from { transform: scaleX(1); }
                to { transform: scaleX(0); }
              }
            `}</style>
            <div className="h-1 bg-gray-200 flex-shrink-0 rounded-b-xl overflow-hidden w-2/3 mx-auto ">
              <div
                className={`h-full ${
                  type === 'success' ? 'bg-green-500' :
                  type === 'error' ? 'bg-red-500' :
                  type === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}
                style={{
                  width: '100%',
                  transformOrigin: 'center',
                  animation: visible ? `notification-progress-center ${duration}ms linear` : 'none',
                  margin: '0 auto'
                }}
              />
            </div>
          </>
        )}
        {/* ปุ่ม action ครึ่งในครึ่งนอกกล่อง dialog */}
        {effectiveActions.length > 0 && (
          <div className="w-full flex flex-row gap-4 justify-center items-center mt-4 flex-wrap">
            {effectiveActions.map((action, index) => (
              <button
                key={index}
                type="button"
                className={`min-w-[120px] px-6 py-2 text-base rounded-full shadow-xl border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200
                  ${
                    type === 'warning'
                      ? 'bg-yellow-500 text-black border-yellow-400 hover:bg-yellow-400 hover:text-white focus:ring-yellow-500' :
                    type === 'error'
                      ? 'bg-red-600 text-white border-red-500 hover:bg-red-500 focus:ring-red-500' :
                    type === 'success'
                      ? 'bg-green-600 text-white border-green-500 hover:bg-green-500 focus:ring-green-500' :
                      'bg-blue-600 text-white border-blue-500 hover:bg-blue-500 focus:ring-blue-500'
                  }
                `}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      </div>
    </>,
    document.body
  );
};

export default Notification;