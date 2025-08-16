import { useState, useEffect } from 'react';
import {
  DocumentIcon,
  PhotoIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const DocumentViewer = ({ documents = [], title = "เอกสารแนบ" }) => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  const [errorStates, setErrorStates] = useState({});

  // จัดการ keyboard event และ body scroll สำหรับ modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showViewer) {
        setShowViewer(false);
        if (selectedDocument) {
          setLoadingStates(prev => ({ ...prev, [selectedDocument.original_name]: false }));
        }
      }
    };

    if (showViewer) {
      // ป้องกันการ scroll ของ body
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      // คืนค่า scroll ของ body
      document.body.style.overflow = 'unset';
    }
  }, [showViewer, selectedDocument]);

  if (!documents || documents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <DocumentIcon className="h-5 w-5 text-blue-600" />
            {title}
          </h3>
        </div>
        <div className="p-8 text-center min-h-[200px] flex flex-col items-center justify-center">
          <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">ไม่มีเอกสารแนบ</p>
        </div>
      </div>
    );
  }

  const getFileIcon = (filename, mimeType) => {
    const extension = filename.split('.').pop()?.toLowerCase();

    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
      return <PhotoIcon className="h-6 w-6 text-green-600" />;
    } else if (mimeType === 'application/pdf' || extension === 'pdf') {
      return <DocumentTextIcon className="h-6 w-6 text-red-600" />;
    } else if (['doc', 'docx'].includes(extension)) {
      return <DocumentTextIcon className="h-6 w-6 text-blue-600" />;
    } else if (['xls', 'xlsx'].includes(extension)) {
      return <DocumentTextIcon className="h-6 w-6 text-green-700" />;
    } else if (['ppt', 'pptx'].includes(extension)) {
      return <DocumentTextIcon className="h-6 w-6 text-orange-600" />;
    } else if (['txt', 'rtf', 'md'].includes(extension)) {
      return <DocumentTextIcon className="h-6 w-6 text-gray-600" />;
    } else {
      return <DocumentIcon className="h-6 w-6 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewDocument = (doc) => {
    setSelectedDocument(doc);
    setShowViewer(true);
    // ตั้งค่า loading state สำหรับไฟล์ที่เลือก
    setLoadingStates(prev => ({ ...prev, [doc.original_name]: true }));
    setErrorStates(prev => ({ ...prev, [doc.original_name]: false }));
    
    // สำหรับ PDF และรูปภาพ ให้ตั้งค่า loading state ทันที
    if (isPdfFile(doc) || isImageFile(doc)) {
      setLoadingStates(prev => ({ ...prev, [doc.original_name]: true }));
    }
  };

  const getFileUrl = (doc) => {
    // ถ้ามี Cloudinary URL ให้ใช้ Cloudinary URL
    if (doc.cloudinary_url) {
      // ตรวจสอบว่า URL เริ่มต้นด้วย http หรือ https
      if (doc.cloudinary_url.startsWith('http://') || doc.cloudinary_url.startsWith('https://')) {
        return doc.cloudinary_url;
      } else {
        // ถ้าไม่เริ่มต้นด้วย http/https ให้เพิ่ม https://
        return `https://${doc.cloudinary_url}`;
      }
    }
    // ถ้าไม่มี Cloudinary URL ให้ใช้ local path
    if (doc.file_path) {
      // ตรวจสอบว่า file_path เริ่มต้นด้วย http หรือ https
      if (doc.file_path.startsWith('http://') || doc.file_path.startsWith('https://')) {
        return doc.file_path;
      } else {
        // ถ้าไม่เริ่มต้นด้วย http/https ให้เพิ่ม localhost
        return `http://localhost:5000/${doc.file_path}`;
      }
    }
    // fallback
    return null;
  };

  const handleDownloadDocument = (doc) => {
    const fileUrl = getFileUrl(doc);
    if (!fileUrl) {
      console.error('ไม่พบ URL ของไฟล์');
      return;
    }

    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = doc.original_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isPdfFile = (doc) => {
    const extension = doc.original_name.split('.').pop()?.toLowerCase();
    return extension === 'pdf' || doc.mime_type === 'application/pdf';
  };

  const isImageFile = (doc) => {
    const extension = doc.original_name.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension) || 
           doc.mime_type?.startsWith('image/');
  };

  const canPreviewFile = (doc) => {
    return isPdfFile(doc) || isImageFile(doc);
  };

  const renderFilePreview = (doc) => {
    const fileUrl = getFileUrl(doc);
    
    if (!fileUrl) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <DocumentIcon className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">ไม่พบ URL ของไฟล์</p>
        </div>
      );
    }

    if (isPdfFile(doc)) {
      return (
        <div className="w-full h-full flex flex-col min-h-[600px]">
          {loadingStates[doc.original_name] && (
            <div className="flex flex-col items-center justify-center h-full min-h-[600px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">กำลังโหลด PDF...</p>
            </div>
          )}
          <iframe
            src={fileUrl}
            className={`w-full h-full min-h-[600px] border-0 rounded-lg shadow-lg ${
              loadingStates[doc.original_name] ? 'hidden' : ''
            }`}
            onLoad={() => {
              setLoadingStates(prev => ({ ...prev, [doc.original_name]: false }));
              console.log('✅ PDF loaded successfully:', doc.original_name);
            }}
            onError={(e) => {
              setLoadingStates(prev => ({ ...prev, [doc.original_name]: false }));
              setErrorStates(prev => ({ ...prev, [doc.original_name]: true }));
              console.error('❌ Error loading PDF:', doc.original_name, e);
            }}
            title={doc.original_name}
          />
          {errorStates[doc.original_name] && (
            <div className="flex flex-col items-center justify-center h-full min-h-[600px]">
              <DocumentTextIcon className="h-16 w-16 text-red-600 mb-4" />
              <p className="text-gray-600 mb-4 text-center">
                ไม่สามารถแสดง PDF ได้<br />
                เนื่องจากข้อจำกัดการเข้าถึงจาก Cloudinary
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    console.log('🔗 Opening PDF in new tab:', fileUrl);
                    window.open(fileUrl, '_blank');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <EyeIcon className="h-4 w-4" />
                  เปิดในแท็บใหม่
                </button>
                <button
                  onClick={() => handleDownloadDocument(doc)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  ดาวน์โหลดไฟล์
                </button>
              </div>
            </div>
          )}
        </div>
      );
    } else if (isImageFile(doc)) {
      return (
        <div className="w-full h-full flex items-center justify-center min-h-[400px]">
          {loadingStates[doc.original_name] && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">กำลังโหลดรูปภาพ...</p>
            </div>
          )}
          <img
            src={fileUrl}
            alt={doc.original_name}
            className={`max-w-full max-h-full object-contain rounded-lg shadow-lg ${
              loadingStates[doc.original_name] ? 'hidden' : ''
            }`}
            onLoad={() => {
              setLoadingStates(prev => ({ ...prev, [doc.original_name]: false }));
              console.log('✅ Image loaded successfully:', doc.original_name);
            }}
            onError={(e) => {
              setLoadingStates(prev => ({ ...prev, [doc.original_name]: false }));
              setErrorStates(prev => ({ ...prev, [doc.original_name]: true }));
              console.error('❌ Error loading image:', doc.original_name, e);
            }}
          />
          {errorStates[doc.original_name] && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
               <PhotoIcon className="h-16 w-16 text-gray-400 mb-4" />
               <p className="text-gray-600 mb-4 text-center">
                 ไม่สามารถแสดงรูปภาพได้<br />
                 เนื่องจากข้อจำกัดการเข้าถึงจาก Cloudinary
               </p>
               <div className="flex flex-col sm:flex-row gap-3">
                 <button
                   onClick={() => {
                     console.log('🔗 Opening image in new tab:', fileUrl);
                     window.open(fileUrl, '_blank');
                   }}
                   className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                 >
                   <EyeIcon className="h-4 w-4" />
                   เปิดในแท็บใหม่
                 </button>
                 <button
                   onClick={() => handleDownloadDocument(doc)}
                   className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                 >
                   <ArrowDownTrayIcon className="h-4 w-4" />
                   ดาวน์โหลดไฟล์
                 </button>
               </div>
             </div>
           )}
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
          <DocumentIcon className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">ไม่สามารถแสดงตัวอย่างไฟล์นี้ได้</p>
          <p className="text-sm text-gray-500 mb-4">รองรับการแสดงตัวอย่างเฉพาะไฟล์ PDF และรูปภาพ</p>
          <button
            onClick={() => handleDownloadDocument(doc)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            ดาวน์โหลดไฟล์
          </button>
        </div>
      );
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <DocumentIcon className="h-5 w-5 text-blue-600" />
            {title}
            <span className="text-sm font-normal text-gray-500">
              ({documents.length} ไฟล์)
            </span>
          </h3>
        </div>

        <div className="p-4">
          <div className="space-y-3">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(doc.original_name, doc.mime_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.original_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatFileSize(doc.file_size)}</span>
                        {doc.cloudinary_url && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ☁️ Cloudinary
                          </span>
                        )}
                        {doc.stored_locally && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            💾 Server
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                <div className="flex items-center gap-2">
                  {canPreviewFile(doc) && (
                    <button
                      onClick={() => handleViewDocument(doc)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="ดูไฟล์"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownloadDocument(doc)}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="ดาวน์โหลด"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {showViewer && selectedDocument && (
        <div 
          className="fixed inset-0 bg-black/5 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowViewer(false);
            if (selectedDocument) {
              setLoadingStates(prev => ({ ...prev, [selectedDocument.original_name]: false }));
            }
          }}
        >
          <div 
            className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-800 truncate">
                  {selectedDocument.original_name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">
                    {formatFileSize(selectedDocument.file_size)}
                  </span>
                  {selectedDocument.cloudinary_url && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      ☁️ Cloudinary
                    </span>
                  )}
                                     {selectedDocument.stored_locally && (
                     <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                       💾 Server
                     </span>
                   )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadDocument(selectedDocument)}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="ดาวน์โหลด"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setShowViewer(false);
                    // รีเซ็ต loading state เมื่อปิด modal
                    if (selectedDocument) {
                      setLoadingStates(prev => ({ ...prev, [selectedDocument.original_name]: false }));
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-auto flex-1 min-h-0">
              {renderFilePreview(selectedDocument)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentViewer;