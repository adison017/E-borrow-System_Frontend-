import { FaCalendarAlt } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { useEffect, useState } from 'react';

const BorrowDialog = ({
  showBorrowDialog,
  setShowBorrowDialog,
  quantities,
  equipmentData,
  borrowData,
  setBorrowData, // เพิ่ม prop นี้
  handleInputChange,
  handleReturnDateChange,
  handleSubmitBorrow,
  calculateMaxReturnDate,
  showImageModal
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ฟังก์ชันตรวจสอบประเภทไฟล์ Office
  const getFileIcon = (fileName) => {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf':
        return (
          <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
      case 'doc':
      case 'docx':
        return (
          <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
      case 'xls':
      case 'xlsx':
        return (
          <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
      case 'ppt':
      case 'pptx':
        return (
          <svg className="h-4 w-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'tiff':
        return (
          <svg className="h-4 w-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // ฟังก์ชันตรวจสอบประเภทไฟล์ที่อนุญาต
  const isAllowedFileType = (fileName) => {
    const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'txt', 'rtf', 'csv'];
    const extension = fileName.toLowerCase().split('.').pop();
    return allowedExtensions.includes(extension);
  };
  // ฟังก์ชันดึงวันพรุ่งนี้ของไทย (string YYYY-MM-DD)
  function getTomorrowTH() {
    const now = new Date();
    const bangkokNow = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    bangkokNow.setUTCHours(0, 0, 0, 0);
    bangkokNow.setUTCDate(bangkokNow.getUTCDate() + 1);
    const yyyy = bangkokNow.getUTCFullYear();
    const mm = String(bangkokNow.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(bangkokNow.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Autofill borrowDate เป็นวันพรุ่งนี้เมื่อ dialog ถูกเปิด
  useEffect(() => {
    if (showBorrowDialog) {
      const tomorrow = getTomorrowTH();
      if (!borrowData.borrowDate || borrowData.borrowDate !== tomorrow) {
        setBorrowData(prev => ({
          ...prev,
          borrowDate: tomorrow
        }));
      }
    }
    // eslint-disable-next-line
  }, [showBorrowDialog]);

  // Reset selected files when dialog closes
  useEffect(() => {
    if (!showBorrowDialog) {
      setSelectedFiles([]);
      setIsSubmitting(false); // Reset loading state when dialog closes
    }
  }, [showBorrowDialog]);

  // File handling functions
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (สูงสุด 10MB)`);
        return false;
      }
      if (!isAllowedFileType(file.name)) {
        alert(`ไฟล์ ${file.name} ไม่ใช่ประเภทไฟล์ที่อนุญาต`);
        return false;
      }
      return true;
    });

    if (selectedFiles.length + validFiles.length > 5) {
      alert('สามารถอัปโหลดไฟล์ได้สูงสุด 5 ไฟล์');
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter(file => {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          alert(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (สูงสุด 10MB)`);
          return false;
        }
        if (!isAllowedFileType(file.name)) {
          alert(`ไฟล์ ${file.name} ไม่ใช่ประเภทไฟล์ที่อนุญาต`);
          return false;
        }
        return true;
      });

      if (selectedFiles.length + validFiles.length > 5) {
        alert('สามารถอัปโหลดไฟล์ได้สูงสุด 5 ไฟล์');
        return;
      }

      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const isBorrowDateValid = !!borrowData.borrowDate && borrowData.borrowDate >= getTomorrowTH();

  // Handle form submission with loading state
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await handleSubmitBorrow(e, selectedFiles);
    } catch (error) {
      console.error('Error submitting borrow request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    showBorrowDialog && (
      <div className="modal modal-open">
        <div className="fixed inset-0 flex items-center justify-center z-50 p-2 transition-opacity duration-300">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] transform transition-all duration-300 flex flex-col relative">
            {/* Loading Overlay */}
            {isSubmitting && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">กำลังส่งคำขอยืม...</p>
                  <p className="text-gray-500 text-sm mt-1">กรุณารอสักครู่</p>
                </div>
              </div>
            )}
            {/* Header - Fixed */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">แบบฟอร์มขอยืมครุภัณฑ์</h2>
                <button
                  onClick={() => setShowBorrowDialog(false)}
                  className={`transition-colors ${
                    isSubmitting
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  disabled={isSubmitting}
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">รายการที่เลือก</h3>
                <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {Object.entries(quantities).map(([item_code, qty]) => {
                    // ใช้ item_id เป็น string ทั้งคู่
                    const equipment = equipmentData.find(item => String(item.id) === String(item_code));
                    if (!equipment) return null;
                    return (
                      <div key={item_code} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <div
                          className="w-8 h-8 rounded-lg overflow-hidden cursor-pointer flex-shrink-0"
                          onClick={() => showImageModal(equipment.image)}
                        >
                          <img
                            src={equipment.image}
                            alt={equipment.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate text-sm">{equipment.name}</p>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span className="truncate">รหัส: {equipment.id}</span>
                            <span className="font-semibold">จำนวน {qty} {equipment.unit}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* กรณีไม่มีรายการที่เลือก */}
                  {Object.keys(quantities).length === 0 && (
                    <div className="text-gray-400 text-center py-4 text-sm">ไม่มีรายการที่เลือก</div>
                  )}
                </div>
              </div>

              <form id="borrow-form" onSubmit={handleFormSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">เหตุผลการขอยืม</label>
                  <textarea
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm ${
                      isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder="กรุณากรอกเหตุผลการขอยืม..."
                    rows={3}
                    name="reason"
                    value={borrowData.reason}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      <span>วันที่ยืม</span>
                      <span className="text-xs text-blue-600 font-normal"> (หลังวันที่ส่งคำขอ 1 วัน)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm ${
                          isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        name="borrowDate"
                        value={borrowData.borrowDate}
                        onChange={handleInputChange}
                        min={getTomorrowTH()}
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        onClick={() => document.querySelector('input[name="borrowDate"]').showPicker()}
                      >
                        <FaCalendarAlt className="w-4 h-4" />
                      </button>
                      {!isBorrowDateValid && borrowData.borrowDate && (
                        <p className="text-xs text-red-600 mt-1">กรุณาเลือกวันที่ยืมหลังวันส่งคำขอ 1 วันขึ้นไป</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      <span>วันที่คืน</span>
                      <span className="text-xs text-blue-600 font-normal"> (ไม่เกิน 7 วัน)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm ${
                          isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        name="returnDate"
                        value={borrowData.returnDate}
                        onChange={handleReturnDateChange}
                        min={borrowData.borrowDate}
                        max={calculateMaxReturnDate()}
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        onClick={() => document.querySelector('input[name="returnDate"]').showPicker()}
                      >
                        <FaCalendarAlt className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* File Upload Section */}
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    เอกสารสำคัญ (ไม่บังคับ)
                    <span className="text-xs text-gray-500 font-normal"> - สูงสุด 5 ไฟล์, ไฟล์ละไม่เกิน 10MB</span>
                  </label>

                  {/* Drag & Drop Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                      isSubmitting
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                        : dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={isSubmitting ? undefined : handleDrag}
                    onDragLeave={isSubmitting ? undefined : handleDrag}
                    onDragOver={isSubmitting ? undefined : handleDrag}
                    onDrop={isSubmitting ? undefined : handleDrop}
                  >
                    <div className="space-y-2">
                      <div className="text-gray-600">
                        <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="text-gray-600">
                        <label htmlFor="file-upload" className={isSubmitting ? "cursor-not-allowed" : "cursor-pointer"}>
                          <span className={`font-medium text-sm ${
                            isSubmitting
                              ? 'text-gray-400'
                              : 'text-blue-600 hover:text-blue-500'
                          }`}>
                            {isSubmitting ? 'ไม่สามารถอัปโหลดไฟล์ได้ขณะส่งคำขอ' : 'คลิกเพื่อเลือกไฟล์'}
                          </span>
                          {!isSubmitting && ' หรือลากไฟล์มาวางที่นี่'}
                        </label>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          multiple
                          className="sr-only"
                          onChange={handleFileSelect}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.txt,.rtf,.csv"
                          disabled={isSubmitting}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        รองรับไฟล์ Office ทั้งหมด (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX) และรูปภาพ (JPG, PNG, etc.)
                      </p>
                    </div>
                  </div>

                  {/* Selected Files List */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">ไฟล์ที่เลือก:</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="flex-shrink-0">
                                {getFileIcon(file.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(index)}
                              className={`flex-shrink-0 p-1 transition-colors ${
                                isSubmitting
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-400 hover:text-red-500'
                              }`}
                              disabled={isSubmitting}
                            >
                              <MdClose className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Footer - Fixed */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBorrowDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium text-sm"
                  disabled={isSubmitting}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  form="borrow-form"
                  className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm flex items-center gap-2 ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                  disabled={!isBorrowDateValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      กำลังส่งคำขอ...
                    </>
                  ) : (
                    'ส่งคำขอยืม'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default BorrowDialog;