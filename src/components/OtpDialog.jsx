import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AiOutlineKey } from "react-icons/ai";

const OtpDialog = ({
  show,
  title = "ยืนยันรหัส OTP",
  message = "กรุณากรอกรหัส OTP ที่ได้รับทางอีเมล",
  onSubmit,
  onClose,
  error,
  duration = 0
}) => {
  const [otp, setOtp] = useState("");
  const [otpArr, setOtpArr] = useState(["", "", "", "", "", ""]);
  const inputRefs = Array.from({ length: 6 }, () => useRef(null));
  const [animateOut, setAnimateOut] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => {
    if (show) {
      setAnimateOut(false);
      setOtp("");
      setOtpArr(["", "", "", "", "", ""]);
      setTimeout(() => {
        if (inputRefs[0].current) inputRefs[0].current.focus();
      }, 100);
    } else if (animateOut) setTimeout(() => setAnimateOut(false), 200);
  }, [show]);

  const handleOtpChange = (e, idx) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (!val) return;
    let arr = [...otpArr];
    arr[idx] = val[val.length - 1];
    setOtpArr(arr);
    setOtp(arr.join(""));
    if (val && idx < 5 && inputRefs[idx + 1].current) {
      inputRefs[idx + 1].current.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (otpArr[idx]) {
        let arr = [...otpArr];
        arr[idx] = "";
        setOtpArr(arr);
        setOtp(arr.join(""));
      } else if (idx > 0 && inputRefs[idx - 1].current) {
        inputRefs[idx - 1].current.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputRefs[idx - 1].current && inputRefs[idx - 1].current.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      inputRefs[idx + 1].current && inputRefs[idx + 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (paste.length === 6) {
      setOtpArr(paste.split(""));
      setOtp(paste);
      setTimeout(() => {
        if (inputRefs[5].current) inputRefs[5].current.focus();
      }, 50);
      e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSubmit) {
      // ส่ง OTP ไปให้ parent ตรวจสอบ
      await onSubmit(otpArr.join(""));
      // ไม่ต้อง reset state หรือปิด dialog ที่นี่ ให้ parent จัดการ
    }
  };



  if (!show) return null;

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
          className={`relative bg-white rounded-3xl p-8 pb-10 w-full max-w-[380px] sm:max-w-[420px] shadow-2xl border border-blue-200 transition-all duration-300 ${animateOut ? 'animate-fadeOutScale' : 'animate-fadeInScale'} mb-12`}
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
          onClick={onClose}
        >
          <span className="sr-only">Close</span>
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {/* ไอคอน OTP */}
        <div className="mb-3 flex items-center justify-center">
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-50 animate-bounce">
            <AiOutlineKey className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        {/* Title และข้อความ */}
        <h3
          className="text-2xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 text-center break-words tracking-wide drop-shadow-sm"
        >
          {title}
        </h3>
        <div
          className="text-gray-700 text-base sm:text-lg md:text-xl  text-center whitespace-pre-line break-words mb-6 px-2 leading-relaxed font-medium"
        >
          {message}
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full ">
          <div className="flex justify-center gap-2 mb-2" onPaste={handlePaste}>
            {otpArr.map((val, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                className="w-12 h-14 text-2xl text-center font-bold border-2 border-blue-300 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 bg-[#f0f6ff] text-black"
                value={val}
                onChange={e => handleOtpChange(e, idx)}
                onKeyDown={e => handleKeyDown(e, idx)}
                autoFocus={idx === 0}
                required
                style={{ letterSpacing: 0, marginRight: idx < 5 ? 4 : 0 }}
              />
            ))}
          </div>
          {error && <div className="text-red-500 text-sm text-center mt-1">{error}</div>}
          <div className="w-full flex flex-row gap-4 justify-center items-center mt-4 flex-wrap">  
            <button
              type="button"
              className="min-w-[120px] px-6 py-2 text-base font-semibold rounded-full shadow-xl border-2 bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300 focus:ring-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200"
              onClick={onClose}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="min-w-[120px] px-6 py-2 text-base font-semibold rounded-full shadow-xl border-2 bg-blue-500 text-white border-blue-600 hover:bg-blue-600 focus:ring-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200"
              disabled={otpArr.some(v => !v)}
            >
              ยืนยัน
            </button>
          </div>

        </form>
        </div>
      </div>
    </>,
    document.body
  );
};

export default OtpDialog;
