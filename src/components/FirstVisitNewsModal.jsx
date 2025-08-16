import { useEffect, useMemo, useState } from 'react';
import { IoMdNotifications } from 'react-icons/io';
import { MdCalendarToday, MdChevronLeft, MdChevronRight, MdClose } from 'react-icons/md';
import { getNews } from '../utils/api';

// Mark a news item as hidden for a user so it won't be shown again
// v2: include news date in the key so republished/updated news shows again
const STORAGE_HIDE_PREFIX = 'news_hide_v2_';

// Category color mapping with gradient styles
const getCategoryStyle = (category) => {
  switch (category) {
    case 'การบำรุงรักษา':
      return {
        badge: 'bg-amber-500 text-white shadow-lg shadow-orange-200/50',
        icon: '🔧',
        glow: 'shadow-orange-300/30'
      };
    case 'อุปกรณ์ใหม่':
      return {
        badge: 'bg-green-500 text-white shadow-lg shadow-green-200/50',
        icon: '✨',
        glow: 'shadow-green-300/30'
      };
    case 'กิจกรรม':
      return {
        badge: 'bg-indigo-500 text-white shadow-lg shadow-blue-200/50',
        icon: '🎉',
        glow: 'shadow-blue-300/30'
      };
    case 'ประกาศ':
      return {
        badge: 'bg-purple-400 text-white shadow-lg shadow-purple-200/50',
        icon: '📢',
        glow: 'shadow-purple-300/30'
      };
    default:
      return {
        badge: 'bg-slate-500 text-white shadow-lg shadow-gray-200/50',
        icon: '📌',
        glow: 'shadow-gray-300/30'
      };
  }
};

export default function FirstVisitNewsModal({ userId }) {
  const [open, setOpen] = useState(false);
  const [newsItems, setNewsItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const storageUser = userId || 'anon';

  const getHideKey = (news) => {
    try {
      const ts = news?.date ? new Date(news.date).getTime() : 'nodate';
      return `${STORAGE_HIDE_PREFIX}${storageUser}_${news?.id}_${ts}`;
    } catch {
      return `${STORAGE_HIDE_PREFIX}${storageUser}_${news?.id}_nodate`;
    }
  };
  const isHiddenFor = (news) => !!localStorage.getItem(getHideKey(news));
  const hideNewsFor = (news) => localStorage.setItem(getHideKey(news), '1');

  useEffect(() => {
    const run = async () => {
      try {
        const data = await getNews();
        if (!Array.isArray(data) || data.length === 0) return;
        // Helper to normalize truthy flags (1, '1', true, 'true')
        const flagTrue = (v) => v === 1 || v === '1' || v === true || v === 'true';
        // Filter to items flagged show_to_all only (เห็นทุกบทบาท)
        let list = data.filter(n => flagTrue(n.show_to_all));
        list.sort((a, b) => new Date(b.date) - new Date(a.date));
        list = list.slice(0, 8);
        // Always show items flagged show_to_all (ignore hidden state)
        const visible = list;
        setNewsItems(visible);
        if (visible.length > 0) {
          setCurrentIndex(0);
          setOpen(true); // Always open on mount if there is at least one visible news
        }
      } catch (e) {
        // ignore errors
      }
    };
    run();
    // Re-open on each mount (login/refresh) by design
  }, [storageUser]);

  const current = useMemo(() => newsItems[currentIndex], [newsItems, currentIndex]);

  useEffect(() => {
    // Reset image index when switching news item
    setImageIndex(0);
  }, [currentIndex]);

  if (!open || !current) return null;

  const moveNext = () => setCurrentIndex((i) => (i + 1) % newsItems.length);
  const movePrev = () => setCurrentIndex((i) => (i - 1 + newsItems.length) % newsItems.length);

  const handleCloseForNow = () => {
    // อนุญาตให้ปิดชั่วคราวเสมอ แม้ force_show จะเป็น 1
    // (ยังคงแสดงอีกครั้งเมื่อเข้าใหม่ตามพฤติกรรมเดิม)
    setOpen(false);
  };

  const handleDontShowAgain = () => {
    const flagTrue = (v) => v === 1 || v === '1' || v === true || v === 'true';
    // If current is force_show, do not allow hiding
    if (flagTrue(current?.force_show)) return;
    // Remove from current session only (show_to_all always shows next time)
    const remaining = newsItems.filter((n, idx) => idx !== currentIndex);
    if (remaining.length === 0) {
      setOpen(false);
      setNewsItems([]);
      return;
    }
    setNewsItems(remaining);
    setCurrentIndex((idx) => (idx >= remaining.length ? 0 : idx));
  };

  const categoryStyle = getCategoryStyle(current?.category);

  return (
    <div className="modal modal-open">
      {/* Backdrop with blur effect */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300">
        {/* Container with navigation buttons on sides */}
        <div className="flex items-center gap-4 w-full max-w-5xl">
          {/* Previous Button - Outside Modal */}
          <button
            className="p-3 bg-white/80 hover:bg-white shadow-lg hover:shadow-xl rounded-2xl h-20 transition-all duration-300 group backdrop-blur-sm flex-shrink-0"
            onClick={movePrev}
            aria-label="ก่อนหน้า"
          >
            <MdChevronLeft className="text-gray-600 group-hover:text-blue-600 text-2xl transition-colors" />
          </button>

          {/* Main Modal Container with glass morphism effect */}
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-h-[95vh] overflow-hidden border border-white/20 transform transition-all duration-500 flex flex-col">
            {/* Decorative gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-50"></div>
            
            {/* Header Section */}
            <div className="relative p-6 border-b border-gray-200/50 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg animate-pulse">
                    <IoMdNotifications className="text-white text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-black bg-clip-text ">
                      ข่าวสารและประกาศ
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">อัพเดทล่าสุดสำหรับคุณ</p>
                  </div>
                </div>
                <button
                  className="group p-2 hover:bg-gray-100/80 rounded-xl transition-all duration-300 backdrop-blur-sm"
                  onClick={handleCloseForNow}
                  aria-label="ปิด"
                >
                  <MdClose className="text-gray-500 group-hover:text-gray-700 text-xl transition-colors" />
                </button>
              </div>
            </div>
            
            {/* Content Section - Scrollable */}
            <div className="relative p-8 overflow-y-auto flex-1">
              {/* Main Content Area */}
              <div className="w-full">
                {/* Category Badge and Title */}
                <div className="mb-4">
                  <h3 className="text-3xl font-bold text-gray-800 leading-tight mb-2">
                    {current.title}
                  </h3>
                  <div className="flex items-center mb-2 gap-2 text-sm text-gray-600">
                    <MdCalendarToday className="text-gray-400" />
                    <span>เผยแพร่เมื่อ {new Date(current.date).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                    {current?.category && (
                    <div className="inline-flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold ${categoryStyle.badge} transform hover:scale-105 transition-transform`}>
                        <span className="text-lg">{categoryStyle.icon}</span>
                        {current.category}
                      </span>
                    </div>
                  )}
                    
                  
                </div>

                {/* Image Gallery */}
                {current.image_url && (() => {
                  let urls = [];
                  try {
                    urls = Array.isArray(current.image_url) ? current.image_url : JSON.parse(current.image_url);
                    if (!Array.isArray(urls)) urls = current.image_url ? [current.image_url] : [];
                  } catch (e) {
                    urls = current.image_url ? [current.image_url] : [];
                  }
                  if (!urls || urls.length === 0) return null;
                  const total = urls.length;
                  const prevImg = () => setImageIndex((i) => (i - 1 + total) % total);
                  const nextImg = () => setImageIndex((i) => (i + 1) % total);
                  return (
                    <div className="mb-6">
                      <div className={`relative h-64 md:h-96 w-full rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-2xl ${categoryStyle.glow} group`}>
                        <img
                          src={urls[imageIndex]}
                          alt={`${current.title}-${imageIndex}`}
                          className="h-full w-full object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-105"
                          onClick={() => setIsPreviewOpen(true)}
                        />
                        
                        {/* Gradient overlay for better text visibility */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none"></div>
                        
                        {total > 1 && (
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={prevImg}
                              className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
                              aria-label="ก่อนหน้า"
                            >
                              <MdChevronLeft className="text-lg" />
                            </button>
                            
                            <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-1 rounded-full text-sm font-medium">
                              {imageIndex + 1} / {total}
                            </div>
                            
                            <button
                              type="button"
                              onClick={nextImg}
                              className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
                              aria-label="ถัดไป"
                            >
                              <MdChevronRight className="text-lg" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Image dots indicator */}
                      {total > 1 && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                          {urls.map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setImageIndex(i)}
                              className={`transition-all duration-300 ${
                                i === imageIndex
                                  ? 'w-8 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full'
                                  : 'w-2 h-2 bg-gray-300 hover:bg-gray-400 rounded-full'
                              }`}
                              aria-label={`ไปยังรูปที่ ${i + 1}`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Full screen preview */}
                      {isPreviewOpen && (
                        <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-4 transition-opacity duration-300" onClick={() => setIsPreviewOpen(false)}>
                          <div className="relative w-full h-full max-w-7xl max-h-[90vh] transform transition-transform duration-300 scale-100" onClick={(e) => e.stopPropagation()}>
                            <img
                              src={urls[imageIndex]}
                              alt={`${current.title}-preview-${imageIndex}`}
                              className="w-full h-full object-contain rounded-lg"
                            />
                            {total > 1 && (
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={prevImg}
                                  className="bg-black/50 backdrop-blur-sm hover:bg-black text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
                                  aria-label="ก่อนหน้า"
                                >
                                  <MdChevronLeft className="text-lg" />
                                </button>
                                
                                <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-1 rounded-full text-sm font-medium">
                                  {imageIndex + 1} / {total}
                                </div>
                                <button
                                  type="button"
                                  onClick={nextImg}
                                  className="bg-black/50 backdrop-blur-sm hover:bg-black text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
                                  aria-label="ถัดไป"
                                >
                                <MdChevronRight className="text-lg" />
                              </button>
                            </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setIsPreviewOpen(false)}
                              className="absolute top-2 right-2 bg-black/10 backdrop-blur-md hover:bg-black/20 text-black rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300"
                              aria-label="ปิด"
                            >
                              <MdClose size={24} />
                            </button>
                            
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
                
                {/* Content Text */}
                <div className="bg-gray-50/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                    {current.content}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Footer Section */}
            <div className="relative p-6 border-t border-gray-200/50 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  กำลังแสดงข่าวที่ {currentIndex + 1} จาก {newsItems.length} รายการ
                </span>
                
                <button
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 w-full max-w-xs text-center ${
                    (current && (current.force_show === 1 || current.force_show === '1' || current.force_show === true))
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:shadow-md'
                  }`}
                  onClick={handleDontShowAgain}
                  disabled={(current && (current.force_show === 1 || current.force_show === '1' || current.force_show === true))}
                >
                  ไม่ต้องแสดงอีก
                </button>
              </div>
            </div>
          </div>

          {/* Next Button - Outside Modal */}
          <button
            className="p-3 bg-white/80 hover:bg-white shadow-lg hover:shadow-xl h-20 rounded-2xl transition-all duration-300 group backdrop-blur-sm flex-shrink-0"
            onClick={moveNext}
            aria-label="ถัดไป"
          >
            <MdChevronRight className="text-gray-600 group-hover:text-blue-600 text-2xl transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}
