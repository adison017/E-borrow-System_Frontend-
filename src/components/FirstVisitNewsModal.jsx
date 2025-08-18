import { useEffect, useMemo, useState } from 'react';
import { MdChevronLeft, MdChevronRight, MdClose } from 'react-icons/md';
import { getNews } from '../utils/api';

export default function FirstVisitNewsModal({ userId }) {
  const [open, setOpen] = useState(false);
  const [newsItems, setNewsItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);



  useEffect(() => {
    const run = async () => {
      try {
        const data = await getNews();
        if (!Array.isArray(data) || data.length === 0) return;
        const flagTrue = (v) => v === 1 || v === '1' || v === true || v === 'true';
        let list = data.filter(n => flagTrue(n.show_to_all) && n.image_url);
        list.sort((a, b) => new Date(b.date) - new Date(a.date));
        list = list.slice(0, 8);
        setNewsItems(list);
        if (list.length > 0) {
          setCurrentIndex(0);
          setOpen(true);
        }
      } catch (e) {
        // ignore errors
      }
    };
    run();
  }, [userId]);

  const current = useMemo(() => newsItems[currentIndex], [newsItems, currentIndex]);

  useEffect(() => {
    // Reset image index when switching news item
    setImageIndex(0);
  }, [currentIndex]);

  // Keyboard navigation: left/right to navigate, Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        movePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, newsItems.length]);

  if (!open || !current) return null;

  const moveNext = () => setCurrentIndex((i) => (i + 1) % newsItems.length);
  const movePrev = () => setCurrentIndex((i) => (i - 1 + newsItems.length) % newsItems.length);

  const handleClose = () => setOpen(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center touch-none">
      <div className="relative w-full h-full max-h-[90vh] flex items-center justify-center">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-red-600/50 hover:bg-red-700/50 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center transition-all duration-200 hover:scale-110"
        >
          <MdClose size={20} className="sm:w-6 sm:h-6" />
        </button>

        {/* Previous button */}
        <button
          onClick={movePrev}
          className="absolute left-1 sm:left-2 z-10 bg-black/50 hover:bg-black/70 text-white h-12 w-12 sm:h-16 sm:w-16 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        >
          <MdChevronLeft size={24} className="sm:w-8 sm:h-8" />
        </button>

        {/* Next button */}
        <button
          onClick={moveNext}
          className="absolute right-1 sm:right-2 z-10 bg-black/50 hover:bg-black/70 text-white w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        >
          <MdChevronRight size={24} className="sm:w-8 sm:h-8" />
        </button>

        {/* Image display */}
        {current.image_url && (() => {
          let urls = [];
          try {
            urls = Array.isArray(current.image_url) ? current.image_url : JSON.parse(current.image_url);
            if (!Array.isArray(urls)) urls = [current.image_url];
          } catch {
            urls = [current.image_url];
          }
          
          if (!urls.length) return null;
          
          const total = urls.length;
          const prevImg = () => setImageIndex((i) => (i - 1 + total) % total);
          const nextImg = () => setImageIndex((i) => (i + 1) % total);
          
          return (
            <div className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-4">
              <img
                src={urls[imageIndex]}
                alt="Image"
                className="max-w-full max-h-full object-contain transition-opacity duration-300"
              />
              
              {total > 1 && (
                <>
                  {/* Image navigation */}
                  <div className="absolute bottom-10 sm:bottom-10 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-2">
                    <button
                      onClick={prevImg}
                      className="bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-200 hover:scale-110"
                    >
                      <MdChevronLeft size={16} className="sm:w-5 sm:h-5" />
                    </button>
                    <span className="bg-black/50 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm transition-all duration-200">
                      {imageIndex + 1} / {total}
                    </span>
                    <button
                      onClick={nextImg}
                      className="bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-200 hover:scale-110"
                    >
                      <MdChevronRight size={16} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                
                </>
              )}
            </div>
          );
        })()}
            {/* News-level dots: show number of news items and allow switching news item */}
                      {newsItems.length > 1 && (
                        <div className="absolute bottom-0 sm:bottom-2 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-2 p-2">
                          {newsItems.map((n, ni) => (
                            <button
                              key={n.news_id ?? ni}
                              onClick={() => setCurrentIndex(ni)}
                              aria-label={n.title || `ข่าว ${ni + 1}`}
                              className={`transition-all duration-300 ease-in-out transform hover:scale-110 touch-manipulation ${
                                ni === currentIndex 
                                  ? 'w-8 h-3 sm:w-10 sm:h-3 bg-blue-800 rounded-full shadow-lg shadow-blue-500/50 animate-pulse' 
                                  : 'w-3 h-3 sm:w-3 sm:h-3 bg-white/70 hover:bg-white/90 rounded-full hover:shadow-md'
                              }`}
                            />
                          ))}
                        </div>
                      )}
          </div>
    </div>
  );
}
