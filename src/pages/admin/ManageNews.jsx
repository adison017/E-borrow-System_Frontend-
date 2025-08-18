import { Tooltip } from '@material-tailwind/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  MdCalendarToday,
  MdCampaign,
  MdChevronLeft, MdChevronRight, MdClose,
  MdDelete, MdEdit,
  MdEvent,
  MdLocalOffer,
  MdNewReleases,
  MdNotifications,
  MdPushPin,
  MdRemoveRedEye,
  MdSettings,
  MdVisibility, MdVisibilityOff
} from 'react-icons/md';
import { TbPinFilled, TbPinnedOff } from "react-icons/tb";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createNews, deleteNewsApi, getNews, updateNewsApi } from '../../utils/api';
import { uploadMultipleFilesToCloudinary } from '../../utils/cloudinaryUtils';
import DeleteNewsDialog from './dialog/DeleteNewsDialog';
import NewsFormDialog from './dialog/NewsFormDialog';

// Get category icon
const getCategoryIcon = (category) => {
  switch (category) {
    case 'การบำรุงรักษา':
      return <MdLocalOffer className="w-5 h-5" />;
    case 'อุปกรณ์ใหม่':
      return <MdNewReleases className="w-5 h-5" />;
    case 'กิจกรรม':
      return <MdEvent className="w-5 h-5" />;
    case 'ประกาศ':
      return <MdCampaign className="w-5 h-5" />;
    default:
      return <MdNotifications className="w-5 h-5" />;
  }
};

// Get category style
const getCategoryStyle = (category) => {
  switch (category) {
    case 'การบำรุงรักษา':
      return 'bg-orange-600 text-white';
    case 'อุปกรณ์ใหม่':
      return 'bg-green-600 text-white';
    case 'กิจกรรม':
      return 'bg-blue-600 text-white';
    case 'ประกาศ':
      return 'bg-purple-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
};

// Enhanced image carousel with better UI
const ImageCarousel = ({ urls, altBase = 'image' }) => {
  const [index, setIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  if (!Array.isArray(urls) || urls.length === 0) return null;

  const total = urls.length;
  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  return (
    <>
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 group">
        <img
          src={urls[index]}
          alt={`${altBase}-${index + 1}`}
          className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
          onClick={() => setIsPreviewOpen(true)}
        />
        
        {/* Gradient overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* View Image Button Overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
          onClick={() => setIsPreviewOpen(true)}
        >
          <div className="bg-black/60 backdrop-blur-sm text-white px-6 py-3 rounded-full flex items-center space-x-2 transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-xl">
            <MdRemoveRedEye className="w-6 h-6" />
            <span className="font-medium text-base">ดูภาพเต็ม</span>
          </div>
        </div>
        
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110"
              aria-label="ก่อนหน้า"
            >
              <MdChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110"
              aria-label="ถัดไป"
            >
              <MdChevronRight size={24} />
            </button>
          </>
        )}
        
        {/* Image counter */}
        {total > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
            {index + 1} / {total}
          </div>
        )}
      </div>
      
      {/* Thumbnail navigation */}
      {total > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 p-5">
          {urls.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative flex-shrink-0 w-16 h-16 overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                i === index
                  ? 'border-blue-500 scale-105'
                  : 'border-gray-300 hover:border-gray-400 opacity-70 hover:opacity-100'
              }`}
              aria-label={`ไปยังรูปที่ ${i + 1}`}
            >
              <img
                src={url}
                alt={`thumbnail-${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
      
      {/* Full screen preview modal */}
      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" 
            onClick={() => setIsPreviewOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center" 
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={urls[index]}
                alt={`${altBase}-preview-${index + 1}`}
                className="max-w-full max-h-full object-contain"
              />
              {total > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300"
                    aria-label="ก่อนหน้า"
                  >
                    <MdChevronLeft size={28} />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300"
                    aria-label="ถัดไป"
                  >
                    <MdChevronRight size={28} />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="absolute top-4 right-4 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300"
                aria-label="ปิด"
              >
                <MdClose size={28} />
              </button>
              
              {/* Image counter in preview */}
              {total > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full">
                  {index + 1} / {total}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const ManageNews = () => {
  const [newsItems, setNewsItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
<<<<<<< Updated upstream
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ลบ state error เดิม (ใช้ react-toastify แทน)
  // ฟังก์ชันกลางสำหรับแจ้งเตือน (เหมือน borrowlist)
=======

>>>>>>> Stashed changes
  const notifyNewsAction = (action, extra) => {
    let message = "";
    let type = "info";
    switch (action) {
      case "add":
        message = `เพิ่มประกาศใหม่เรียบร้อยแล้ว`;
        type = "success";
        break;
      case "edit":
        message = `แก้ไขประกาศเรียบร้อยแล้ว`;
        type = "success";
        break;
      case "delete":
        message = `ลบประกาศเรียบร้อยแล้ว`;
        type = "success";
        break;
      case "add_error":
        message = "เกิดข้อผิดพลาดในการเพิ่มประกาศ";
        type = "error";
        break;
      case "edit_error":
        message = "เกิดข้อผิดพลาดในการแก้ไขประกาศ";
        type = "error";
        break;
      case "delete_error":
        message = "เกิดข้อผิดพลาดในการลบประกาศ";
        type = "error";
        break;
      case "fetch_error":
        message = "เกิดข้อผิดพลาดในการโหลดข้อมูล";
        type = "error";
        break;
      default:
        message = action;
        type = "info";
    }
    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else {
      toast.info(message);
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'ประกาศ',
    image_url: [],
    force_show: false,
    show_to_all: false,
  });

  const [pendingImages, setPendingImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const data = await getNews();
      if (data) setNewsItems(data);
      setLoading(false);
    } catch (err) {
      notifyNewsAction("fetch_error");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const onImagesSelected = (evt) => {
      const files = evt.detail || [];
      if (!files || files.length === 0) return;
      const currentCount = Array.isArray(previewUrls) ? previewUrls.length : 0;
      const remaining = Math.max(0, 10 - currentCount);
      if (remaining === 0) return;
      const toAdd = files.slice(0, remaining);
      const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
      setPendingImages((prev) => ([...(Array.isArray(prev) ? prev : []), ...toAdd]));
      setPreviewUrls((prev) => {
        const base = Array.isArray(prev) ? prev : [];
        const combined = [...base, ...newPreviews];
        setFormData((f) => ({ ...f, image_url: combined }));
        return combined;
      });
    };

    const onImageRemoveAt = (evt) => {
      const idx = evt.detail?.index;
      if (typeof idx !== 'number') return;
      setPendingImages((prev) => {
        if (!Array.isArray(prev) || prev.length === 0) return prev;
        const next = prev.filter((_, i) => i !== idx);
        return next;
      });
      setPreviewUrls((prev) => {
        if (!Array.isArray(prev)) return prev;
        const removed = prev[idx];
        if (removed && typeof removed === 'string' && removed.startsWith('blob:')) {
          try { URL.revokeObjectURL(removed); } catch {}
        }
        const next = prev.filter((_, i) => i !== idx);
        setFormData((f) => ({ ...f, image_url: next }));
        return next;
      });
    };

    const onImagesClear = () => {
      previewUrls.forEach((u) => { if (u?.startsWith('blob:')) URL.revokeObjectURL(u); });
      setPendingImages([]);
      setPreviewUrls([]);
      setFormData((f) => ({ ...f, image_url: [] }));
    };

    window.addEventListener('newsImagesSelected', onImagesSelected);
    window.addEventListener('newsImageRemoveAt', onImageRemoveAt);
    window.addEventListener('newsImagesClear', onImagesClear);
    return () => {
      window.removeEventListener('newsImagesSelected', onImagesSelected);
      window.removeEventListener('newsImageRemoveAt', onImageRemoveAt);
      window.removeEventListener('newsImagesClear', onImagesClear);
      previewUrls.forEach((u) => { if (u?.startsWith('blob:')) URL.revokeObjectURL(u); });
    };
  }, [previewUrls]);

  const handleAddNew = () => {
    setIsEditing(false);
    setCurrentItem(null);
    previewUrls.forEach((u) => { if (u?.startsWith('blob:')) URL.revokeObjectURL(u); });
    setPendingImages([]);
    setPreviewUrls([]);
    setFormData({ title: '', content: '', category: 'ประกาศ', image_url: [], force_show: false, show_to_all: false });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setIsEditing(true);
    setCurrentItem(item);
    previewUrls.forEach((u) => { if (u?.startsWith('blob:')) URL.revokeObjectURL(u); });
    setPendingImages([]);
    setFormData({
      title: item.title,
      content: item.content,
      category: item.category,
      image_url: (() => {
        try {
          if (!item.image_url) return [];
          if (Array.isArray(item.image_url)) return item.image_url;
          const parsed = JSON.parse(item.image_url);
          return Array.isArray(parsed) ? parsed : (typeof item.image_url === 'string' ? [item.image_url] : []);
        } catch (e) {
          return typeof item.image_url === 'string' ? [item.image_url] : [];
        }
      })(),
      force_show: !!item.force_show,
      show_to_all: !!item.show_to_all,
    });
    const existing = (() => {
      try {
        const v = item.image_url;
        if (!v) return [];
        if (Array.isArray(v)) return v;
        const parsed = JSON.parse(v);
        return Array.isArray(parsed) ? parsed : (typeof v === 'string' ? [v] : []);
      } catch (e) {
        return typeof item.image_url === 'string' ? [item.image_url] : [];
      }
    })();
    setPreviewUrls(existing);
    setShowModal(true);
  };

  const handleDelete = (item) => {
    setNewsToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (newsToDelete) {
      try {
        await deleteNewsApi(newsToDelete.id);
        setNewsItems(prevItems => prevItems.filter(item => item.id !== newsToDelete.id));
        setShowDeleteModal(false);
        setNewsToDelete(null);
        notifyNewsAction("delete");
      } catch (err) {
        notifyNewsAction("delete_error");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  setIsSubmitting(true);
    try {
      const currentUrls = Array.isArray(formData.image_url)
        ? formData.image_url
        : (formData.image_url ? [formData.image_url] : []);
      const existingCloudUrls = currentUrls.filter(u => typeof u === 'string' && !u.startsWith('blob:'));

      let uploadedUrls = [];
      if (pendingImages.length > 0) {
        try {
          const res = await uploadMultipleFilesToCloudinary(pendingImages, 'e-borrow/news');
          if (Array.isArray(res)) {
            uploadedUrls = res.filter(r => r.success && r.url).map(r => r.url);
          } else if (res && res.success && Array.isArray(res.data)) {
            uploadedUrls = res.data.filter(r => r.success && r.url).map(r => r.url);
          } else {
            throw new Error('Invalid upload response format');
          }
        } catch (uploadError) {
          throw new Error(`เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ: ${uploadError.message}`);
        }
      }

      const cloudUrls = [...existingCloudUrls, ...uploadedUrls];

      if (isEditing && currentItem) {
        const payload = normalizeNewsPayload({ ...formData, image_url: cloudUrls });
        const updated = await updateNewsApi(currentItem.id, payload);
        setNewsItems(prevItems => prevItems.map(item => item.id === currentItem.id ? updated : item));
        notifyNewsAction("edit");
      } else {
        const payload = normalizeNewsPayload({ ...formData, image_url: cloudUrls });
        const created = await createNews(payload);
        setNewsItems(prev => [created, ...prev]);
        notifyNewsAction("add");
      }

      setShowModal(false);
      previewUrls.forEach((u) => { if (u?.startsWith('blob:')) URL.revokeObjectURL(u); });
      setPendingImages([]);
      setPreviewUrls([]);
      setFormData({ title: '', content: '', category: 'ประกาศ', image_url: [], force_show: false, show_to_all: false });
    } catch (err) {
      if (isEditing) {
        notifyNewsAction("edit_error");
      } else {
        notifyNewsAction("add_error");
      }
    } finally {
      // รีเซ็ต loading state
      setIsSubmitting(false);
      console.log('isSubmitting set to FALSE (finally block)');
    }
  };

  const normalizeNewsPayload = (data) => {
    const payload = { ...data };
    if (Array.isArray(payload.image_url)) {
      // keep as array
    } else if (typeof payload.image_url === 'string' && payload.image_url) {
      payload.image_url = [payload.image_url];
    } else {
      payload.image_url = [];
    }
    payload.force_show = !!payload.force_show;
    payload.show_to_all = !!payload.show_to_all;
    return payload;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

    // Ensure pinned news appear first, then visible items, then newest first
    const sortedNews = Array.isArray(newsItems)
      ? [...newsItems].sort((a, b) => {
          // pinned first
          if ((a.force_show ? 1 : 0) !== (b.force_show ? 1 : 0)) {
            return (b.force_show ? 1 : 0) - (a.force_show ? 1 : 0);
          }
          // then visible (show_to_all)
          if ((a.show_to_all ? 1 : 0) !== (b.show_to_all ? 1 : 0)) {
            return (b.show_to_all ? 1 : 0) - (a.show_to_all ? 1 : 0);
          }
          // then by date (newest first)
          const da = a.date ? new Date(a.date).getTime() : 0;
          const db = b.date ? new Date(b.date).getTime() : 0;
          return db - da;
        })
      : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-6">
            <div>
              <MdSettings className="w-15 h-15 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">จัดการประกาศ</h1>
              <p className="text-gray-500 mt-1">จัดการข่าวสารและประกาศ</p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">ประกาศทั้งหมด</h3>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{newsItems.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <MdCampaign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">เห็นได้</h3>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {newsItems.filter(item => item.show_to_all).length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <MdVisibility className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">ปักหมุด</h3>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {newsItems.filter(item => item.force_show).length}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <MdPushPin className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* News Items */}
        {newsItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100"
          >
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdCampaign className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">ไม่มีประกาศ</h3>
              <p className="text-gray-500">ยังไม่มีประกาศในระบบ</p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {sortedNews.map((item, index) => (
                <motion.article
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300 rounded-2xl"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full ${getCategoryStyle(item.category)}`}>
                          {getCategoryIcon(item.category)}
                          <span className="text-sm font-medium">{item.category}</span>
                        </div>
                        
                        {/* Status badges */}
                        {item.show_to_all ? (
                          <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-800">
                            <MdVisibility size={14} />
                            เห็นได้
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
                            <MdVisibilityOff size={14} />
                            ซ่อน
                          </span>
                        )}
                        
                        {item.force_show ? (
                          <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-100 text-red-800">
                            <TbPinFilled size={14} />
                            ปักหมุด
                          </span>
                          ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
                            <TbPinnedOff size={14} />
                            ไม่ปักหมุด
                          </span>
                        )}
                      </div>
                      
                      <time className="text-sm text-gray-500 flex items-center space-x-1">
                        <MdCalendarToday className="w-4 h-4" />
                        <span>{new Date(item.date).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}</span>
                      </time>
                    </div>
                    
                    {/* Title and content */}
                    <h2 className="text-2xl font-bold text-gray-800 mb-3 line-clamp-2">
                      {item.title}
                    </h2>
                    
                    <p className="text-gray-600 leading-relaxed mb-4 line-clamp-3">
                      {item.content}
                    </p>

                    {/* Images */}
                    {item.image_url && (() => {
                      let urls = [];
                      try {
                        urls = Array.isArray(item.image_url) ? item.image_url : JSON.parse(item.image_url);
                        if (!Array.isArray(urls)) urls = item.image_url ? [item.image_url] : [];
                      } catch (e) {
                        urls = item.image_url ? [item.image_url] : [];
                      }
                      return urls.length > 0 && (
                        <div className="mt-4">
                          <ImageCarousel urls={urls} altBase={item.title} />
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* Footer with action buttons */}
                  <div className="px-6 py-4">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all duration-200 hover:scale-105"
                        title="แก้ไข"
                      >
                        <MdEdit size={16} />
                        <span>แก้ไข</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-full transition-all duration-200 hover:scale-105"
                        title="ลบ"
                      >
                        <MdDelete size={16} />
                        <span>ลบ</span>
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Use the NewsFormDialog component */}
      <NewsFormDialog
        key={`${showModal}-${isEditing}`}
        showModal={showModal}
        setShowModal={setShowModal}
        handleSubmit={handleSubmit}
        isEditing={isEditing}
        formData={formData}
        handleInputChange={handleInputChange}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteNewsDialog
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        selectedNews={newsToDelete}
        onConfirm={confirmDelete}
      />

      {/* Floating Add News Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        className="fixed bottom-8 right-8 z-[60]"
      >
        <Tooltip content="เพิ่มข่าวสาร" placement="left">
          <button
            onClick={handleAddNew}
            className="border-black bg-black/70 hover:bg-white hover:border-2 hover:border-black hover:text-black text-white rounded-full shadow-2xl w-16 h-16 flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300"
            aria-label="เพิ่มข่าวสาร"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.75v14.5m7.25-7.25H4.75" />
            </svg>
          </button>
        </Tooltip>
      </motion.div>
    </div>
  );
};

export default ManageNews;