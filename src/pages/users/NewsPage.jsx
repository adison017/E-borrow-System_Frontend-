import React, { useState, useEffect } from 'react';
import { getNews } from '../../utils/api';
import {
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdCalendarToday,
  MdLocalOffer,
  MdCampaign,
  MdNewReleases,
  MdEvent,
  MdNotifications,
  MdRemoveRedEye
} from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {urls.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 group ${
                i === index
                  ? 'border-blue-500 shadow-lg scale-105'
                  : 'border-gray-300 hover:border-gray-400 opacity-70 hover:opacity-100'
              }`}
              aria-label={`ไปยังรูปที่ ${i + 1}`}
            >
              <img
                src={url}
                alt={`thumbnail-${i + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Hover overlay for thumbnails */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <MdRemoveRedEye className="w-6 h-6 text-white" />
              </div>
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
                className="absolute top-2 right-1 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300"
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

// Main NewsPage component with enhanced UI
const NewsPage = () => {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const data = await getNews();
      if (Array.isArray(data)) {
        const flagTrue = (v) => v === 1 || v === '1' || v === true || v === 'true';
        setNewsItems(data.filter(n => flagTrue(n.show_to_all)));
      } else {
        setNewsItems([]);
        if (data && data.message) setError(data.message);
      }
      setLoading(false);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setLoading(false);
    }
  };

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
        return 'bg-orange-500  text-white';
      case 'อุปกรณ์ใหม่':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      case 'กิจกรรม':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'ประกาศ':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  // Get unique categories
  const categories = ['all', ...new Set(newsItems.map(item => item.category))];
  
  // Filter news by category
  const filteredNews = selectedCategory === 'all' 
    ? newsItems 
    : newsItems.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
              <div className="absolute top-0 animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-200">
            <div className="flex items-center space-x-3 text-red-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold">เกิดข้อผิดพลาด!</h3>
                <p className="text-gray-600">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <div>
                  <MdCampaign className="w-10 h-10 text-black" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">ข่าวสารและประกาศ</h1>
                  <p className="text-gray-500 mt-1">อัพเดทข่าวสารล่าสุด</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 overflow-x-auto"
          >
            <div className="flex space-x-2 pb-2 p-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 font-medium transition-all duration-300 whitespace-nowrap rounded-full ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white transform scale-105'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {category === 'all' ? 'ทั้งหมด' : category}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* News Grid */}
        {filteredNews.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100"
          >
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdCampaign className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">ไม่พบข่าวสาร</h3>
              <p className="text-gray-500">
                {selectedCategory === 'all' 
                  ? 'ยังไม่มีข่าวสารในระบบ' 
                  : `ไม่มีข่าวสารในหมวดหมู่ ${selectedCategory}`}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-auto">
            <AnimatePresence mode="popLayout">
              {filteredNews.map((item, index) => {
                const hasImages = item.image_url && (() => {
                  let urls = [];
                  try {
                    urls = Array.isArray(item.image_url) ? item.image_url : JSON.parse(item.image_url);
                    if (!Array.isArray(urls)) urls = item.image_url ? [item.image_url] : [];
                  } catch (e) {
                    urls = item.image_url ? [item.image_url] : [];
                  }
                  return urls.length > 0;
                })();
                
                const isFeatured = index === 0;
                const isWide = index % 5 === 0 && index !== 0;
                const isTall = hasImages && index % 3 === 0;
                
                let gridClass = "";
                if (isFeatured) {
                  gridClass = "lg:col-span-2 xl:col-span-2 lg:row-span-2";
                } else if (isWide) {
                  gridClass = "lg:col-span-2 xl:col-span-2";
                } else if (isTall) {
                  gridClass = "lg:row-span-2";
                }
                
                return (
                  <motion.article
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300 rounded-4xl flex flex-col ${gridClass}`}
                  >
                    {/* News Header */}
                    <div className={`p-6 ${isFeatured ? 'lg:p-8' : ''} flex-grow flex flex-col`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full ${getCategoryStyle(item.category)}`}>
                          {getCategoryIcon(item.category)}
                          <span className={`${isFeatured ? 'text-base' : 'text-sm'} font-medium`}>{item.category}</span>
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
                      
                      {/* Title */}
                      <h2 className={`${isFeatured ? 'text-2xl lg:text-3xl' : isWide ? 'text-xl lg:text-2xl' : 'text-xl'} font-bold text-gray-800 mb-1 ${isFeatured ? 'line-clamp-3' : 'line-clamp-2'}`}>
                        {item.title}
                      </h2>
                      
                      {/* Content */}
                      <p className={`text-gray-600 leading-relaxed ${isFeatured ? 'line-clamp-5' : isTall ? 'line-clamp-4' : 'line-clamp-3'} mb-4 flex-grow`}>
                        {item.content}
                      </p>

                      {/* Image Section */}
                      {item.image_url && (() => {
                        let urls = [];
                        try {
                          urls = Array.isArray(item.image_url) ? item.image_url : JSON.parse(item.image_url);
                          if (!Array.isArray(urls)) urls = item.image_url ? [item.image_url] : [];
                        } catch (e) {
                          urls = item.image_url ? [item.image_url] : [];
                        }
                        return urls.length > 0 && (
                          <div className="mt-auto">
                            <ImageCarousel urls={urls} altBase={item.title} />
                          </div>
                        );
                      })()}
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage;