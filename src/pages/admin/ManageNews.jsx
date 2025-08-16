import { getNews, createNews, updateNewsApi, deleteNewsApi } from '../../utils/api';
import { uploadMultipleFilesToCloudinary } from '../../utils/cloudinaryUtils';
import { useEffect, useState } from 'react';
import { MdAddCircle, MdDelete, MdEdit, MdChevronLeft, MdChevronRight, MdClose, MdVisibility, MdVisibilityOff, MdPushPin } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Tooltip } from '@material-tailwind/react';
import DeleteNewsDialog from './dialog/DeleteNewsDialog';
import NewsFormDialog from './dialog/NewsFormDialog';

// Helper function to get category color
const getCategoryColor = (category) => {
  switch (category) {
    case 'การบำรุงรักษา':
      return 'bg-orange-100 text-orange-800';
    case 'อุปกรณ์ใหม่':
      return 'bg-green-100 text-green-800';
    case 'กิจกรรม':
      return 'bg-blue-100 text-blue-800';
    case 'ประกาศ':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Simple image carousel for news images
const ImageCarousel = ({ urls, altBase = 'image' }) => {
  const [index, setIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  if (!Array.isArray(urls) || urls.length === 0) return null;

  const total = urls.length;
  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  return (
    <div className="mt-4">
      <div className="relative h-64 md:h-80 w-fit max-w-full rounded-lg overflow-hidden bg-black shadow mx-auto">
        <img
          src={urls[index]}
          alt={`${altBase}-${index + 1}`}
          className="h-full w-auto max-w-full object-contain cursor-zoom-in"
          onClick={() => setIsPreviewOpen(true)}
        />
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center"
              aria-label="ก่อนหน้า"
            >
              <MdChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center"
              aria-label="ถัดไป"
            >
              <MdChevronRight size={18} />
            </button>
          </>
        )}
      </div>
      {total > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1">
          {urls.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full ${i === index ? 'bg-blue-600' : 'bg-gray-300'}`}
              aria-label={`ไปยังรูปที่ ${i + 1}`}
            />
          ))}
        </div>
      )}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setIsPreviewOpen(false)}>
          <div className="relative w-full h-full max-w-6xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={urls[index]}
              alt={`${altBase}-preview-${index + 1}`}
              className="w-full h-full object-contain"
            />
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10 flex items-center justify-center"
                  aria-label="ก่อนหน้า"
                >
                  <MdChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10 flex items-center justify-center"
                  aria-label="ถัดไป"
                >
                  <MdChevronRight size={22} />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10 flex items-center justify-center"
              aria-label="ปิด"
            >
              <MdClose size={22} />
            </button>
          </div>
        </div>
      )}
    </div>
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
  // ลบ state error เดิม (ใช้ react-toastify แทน)
  // ฟังก์ชันกลางสำหรับแจ้งเตือน (เหมือน borrowlist)
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

  // Hold files selected but not yet uploaded
  const [pendingImages, setPendingImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  // Fetch all news
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

  // Handle images selected from dialog child input (no upload yet)
  useEffect(() => {
    const onImagesSelected = (evt) => {
      const files = evt.detail || [];
      if (!files || files.length === 0) return;
      // Calculate remaining capacity (max 10 total)
      const currentCount = Array.isArray(previewUrls) ? previewUrls.length : 0;
      const remaining = Math.max(0, 10 - currentCount);
      if (remaining === 0) return;
      const toAdd = files.slice(0, remaining);
      // Create previews for new files only
      const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
      // Append to existing state
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
        if (!Array.isArray(prev) || prev.length === 0) return prev; // editing existing images only
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
      // Cleanup previews
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
      // Cleanup previews
      previewUrls.forEach((u) => { if (u?.startsWith('blob:')) URL.revokeObjectURL(u); });
    };
  }, [previewUrls]);

  const handleAddNew = () => {
    setIsEditing(false);
    setCurrentItem(null);
    // Cleanup previews
    previewUrls.forEach((u) => { if (u?.startsWith('blob:')) URL.revokeObjectURL(u); });
    setPendingImages([]);
    setPreviewUrls([]);
    setFormData({ title: '', content: '', category: 'ประกาศ', image_url: [], force_show: false, show_to_all: false });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setIsEditing(true);
    setCurrentItem(item);
    // Cleanup previews
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
    // Show existing images as previews
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
    try {
      // Prepare image URLs: keep existing (non-blob) + upload new pending
      const currentUrls = Array.isArray(formData.image_url)
        ? formData.image_url
        : (formData.image_url ? [formData.image_url] : []);
      const existingCloudUrls = currentUrls.filter(u => typeof u === 'string' && !u.startsWith('blob:'));

      let uploadedUrls = [];
      if (pendingImages.length > 0) {
        const res = await uploadMultipleFilesToCloudinary(pendingImages, 'e-borrow/news');
        if (!res || !res.success) throw new Error('Upload images failed');
        uploadedUrls = (res.data || []).filter(r => r.success).map(r => r.url);
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
      // Cleanup and reset
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
    }
  };

  // Normalize payload before send to API
  const normalizeNewsPayload = (data) => {
    const payload = { ...data };
    // image_url can be array -> send array, backend will stringify; or string
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

  if (loading) return <div className="p-6">กำลังโหลด...</div>;

  return (
    <div className="p-6 flex-grow text-black">
      {/* Notification Component (react-toastify) */}
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
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">จัดการประกาศ</h1>
        </div>

        {/* สถิติประกาศ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">ประกาศทั้งหมด</h3>
            <p className="text-2xl font-bold text-blue-600">{newsItems.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-green-800">
              <MdVisibility size={20} />
              เห็นได้
            </h3>
            <p className="text-2xl font-bold text-green-600">
              {newsItems.filter(item => item.show_to_all).length}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-red-800">
              <MdPushPin size={20} />
              ปักหมุด
            </h3>
            <p className="text-2xl font-bold text-red-600">
              {newsItems.filter(item => item.force_show).length}
            </p>
          </div>
        </div>

                {/* ข้อมูลอธิบาย */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-sm text-yellow-800">
            <strong>หมายเหตุ:</strong>
            <span className="inline-flex items-center gap-1 mx-1"><MdVisibility size={14} className="text-green-600" /><strong>เห็นได้</strong></span>
            = User เห็นได้ |
            <span className="inline-flex items-center gap-1 mx-1"><MdVisibilityOff size={14} className="text-gray-600" /><strong>ซ่อน</strong></span>
            = User เห็นไม่ได้ |
            <span className="inline-flex items-center gap-1 mx-1"><MdPushPin size={14} className="text-red-600" /><strong>ปักหมุด</strong></span>
            = แสดงตลอด (ปิดไม่ได้)
          </p>
        </div>
      </div>

              {/* News Items List/Table */}
        <div className="space-y-6">
          {newsItems.length === 0 ? (
            <p className="text-gray-500">ยังไม่มีประกาศในระบบ</p>
          ) : (
          newsItems.map((item) => (
            <div
              key={item.id}
              className="bg-blue-100/20 p-6 rounded-4xl shadow-md"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className={`text-xs font-semibold p-2 rounded-full ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                    {/* แสดงสถานะการมองเห็นของข่าว */}
                    {item.show_to_all ? (
                      <span className="flex items-center gap-1 text-xs font-semibold p-2 rounded-full bg-green-100 text-green-800" title="แสดงให้ User เห็น">
                        <MdVisibility size={14} />
                        เห็นได้
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold p-2 rounded-full bg-gray-100 text-gray-600" title="ไม่แสดงให้ User">
                        <MdVisibilityOff size={14} />
                        ซ่อน
                      </span>
                    )}
                    {item.force_show && (
                      <span className="flex items-center gap-1 text-xs font-semibold p-2 rounded-full bg-red-100 text-red-800" title="แสดงตลอด (ปิดไม่ได้)">
                        <MdPushPin size={14} />
                        ปักหมุด
                      </span>
                    )}
                  </div>
                  <h2 className="ml-2 text-2xl font-semibold text-blue-600 mt-2">{item.title}</h2>
                  <p className="ml-2  text-sm text-gray-500">เผยแพร่เมื่อ: {new Date(item.date).toLocaleDateString('th-TH')}</p>
                </div>
                <div className="flex space-x-2 ">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-100 transition duration-150"
                    title="แก้ไข"
                  >
                    <MdEdit size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition duration-150"
                    title="ลบ"
                  >
                    <MdDelete size={20} />
                  </button>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mt-3 ml-2 ">{item.content}</p>
              {item.image_url && (() => {
                let urls = [];
                try {
                  urls = Array.isArray(item.image_url) ? item.image_url : JSON.parse(item.image_url);
                  if (!Array.isArray(urls)) urls = item.image_url ? [item.image_url] : [];
                } catch (e) {
                  urls = item.image_url ? [item.image_url] : [];
                }
                return <ImageCarousel urls={urls} altBase={item.title} />;
              })()}
            </div>
          ))
        )}
      </div>

      {/* Use the NewsFormDialog component */}
      <NewsFormDialog
        showModal={showModal}
        setShowModal={setShowModal}
        handleSubmit={handleSubmit}
        isEditing={isEditing}
        formData={formData}
        handleInputChange={handleInputChange}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteNewsDialog
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        selectedNews={newsToDelete}
        onConfirm={confirmDelete}
      />

      {/* Floating Add News Button */}
      <Tooltip content="เพิ่มประกาศ" placement="left">
        <button
          onClick={handleAddNew}
          className="fixed bottom-8 right-8 z-[60] border-black bg-black/70 hover:bg-white hover:border-2 hover:border-black hover:text-black text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          aria-label="เพิ่มประกาศ"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.75v14.5m7.25-7.25H4.75" />
          </svg>
        </button>
      </Tooltip>
    </div>
  );
};

export default ManageNews;