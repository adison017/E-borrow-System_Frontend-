import { useEffect, useState } from 'react';
import { FaNewspaper, FaGripVertical } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';

const NewsFormDialog = ({
  showModal,
  setShowModal,
  handleSubmit,
  isEditing,
  formData,
  handleInputChange,
  isSubmitting = false,
  onImageReorder,
  // Available categories - can be fetched or defined here/passed as prop
  categories = ['ประกาศ', 'การบำรุงรักษา', 'อุปกรณ์ใหม่', 'กิจกรรม']
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  if (!showModal) {
    return null;
  }

  return (
    <div className="modal modal-open backdrop-blur-sm">
      <div className="modal-box relative bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-[150vh] w-full p-6 z-50 overflow-y-auto max-h-[90vh] animate-fadeIn">
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div className="text-blue-700 font-medium">{isEditing ? 'กำลังอัปเดต...' : 'กำลังเพิ่มข่าว...'}</div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center pb-4 mb-6">
          <h3 className="text-3xl font-bold text-gray-800 flex items-center tracking-tight">
            <span className="bg-blue-600 text-white p-3 rounded-full mr-3 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
              <FaNewspaper className="h-6 w-6" />
            </span>
            {isEditing ? 'แก้ไขข่าวสาร' : 'เพิ่มข่าวสารใหม่'}
          </h3>
          <button
            onClick={() => !isSubmitting && setShowModal(false)}
            className="text-gray-500 hover:text-gray-700 transition-all duration-300 hover:bg-gray-100 p-2.5 rounded-xl hover:scale-110"
            disabled={isSubmitting}
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              หัวข้อข่าว <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-all duration-300 hover:border-blue-400 hover:shadow-sm"
              placeholder="กรอกหัวข้อข่าว..."
              required
            />
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              ประเภท <span className="text-rose-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-all duration-300 hover:border-blue-400 hover:shadow-sm"
              required
            >
              <option value="" disabled>เลือกประเภทข่าว</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              เนื้อหา <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-all duration-300 hover:border-blue-400 hover:shadow-sm resize-none"
              placeholder="กรอกรายละเอียดข่าว..."
              rows={7}
              required
            />
          </div>
          {/* Image Upload Section */}
          <div className="space-y-4 bg-gray-50 rounded-2xl p-5 shadow-sm border border-gray-200">
            <label className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              รูปภาพข่าว (สูงสุด 10 รูป)
            </label>

            {!Array.isArray(formData.image_url) || formData.image_url.length === 0 ? (
              <div 
                className="relative border-2 border-dashed border-blue-300 rounded-xl p-8 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 cursor-pointer group"
                onClick={() => document.getElementById('news-images-input')?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-blue-500', 'bg-blue-100');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-100');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-100');
                  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')).slice(0, 10);
                  if (files.length > 0) {
                    window.dispatchEvent(new CustomEvent('newsImagesSelected', { detail: files }));
                  }
                }}
              >
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                      อัปโหลดรูปภาพ
                    </h3>
                    <p className="text-sm text-gray-600">
                      คลิกเพื่อเลือกไฟล์ หรือ <span className="font-medium text-blue-600">ลากและวางที่นี่</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      รองรับ PNG, JPG, GIF • สูงสุด 5MB ต่อไฟล์ • เลือกได้หลายไฟล์
                    </p>
                  </div>
                  <input
                    id="news-images-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []).slice(0, 10);
                      if (files.length > 0) {
                        window.dispatchEvent(new CustomEvent('newsImagesSelected', { detail: files }));
                      }
                    }}
                    className="sr-only"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3 items-start justify-center">
                  {formData.image_url[0] && (
                    <div 
                      draggable
                      onDragStart={() => setDraggedIndex(0)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setHoverIndex(0);
                      }}
                      onDragLeave={() => setHoverIndex(null)}
                      onDrop={() => {
                        if (draggedIndex !== null && draggedIndex !== 0 && onImageReorder) {
                          onImageReorder(draggedIndex, 0);
                        }
                        setDraggedIndex(null);
                        setHoverIndex(null);
                      }}
                      onDragEnd={() => {
                        setDraggedIndex(null);
                        setHoverIndex(null);
                      }}
                      className={`relative group rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 border-3 border-blue-400 shadow-xl ring-2 ring-blue-200 transition-all duration-300 cursor-move max-w-md mx-auto ${
                        hoverIndex === 0 && draggedIndex !== null && draggedIndex !== 0 ? 'scale-105 ring-4 ring-green-400 border-green-400' : 'hover:shadow-2xl hover:scale-105'
                      }`}
                    >
                      <div className="relative h-64">
                        <img
                          src={formData.image_url[0]}
                          alt="Main Preview"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                          <FaGripVertical className="w-3 h-3 text-gray-600" />
                        </div>
                        <div className="absolute bottom-2 left-2 bg-orange-500 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                          #1
                        </div>
                        <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          รูปหลัก
                        </div>
                        <button
                          type="button"
                          onClick={() => window.dispatchEvent(new CustomEvent('newsImageRemoveAt', { detail: { index: 0 } }))}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg opacity-0 group-hover:opacity-100 hover:scale-110"
                          title="ลบรูปภาพ"
                        >
                          <MdClose className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {formData.image_url.length === 1 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    <div 
                      className="relative border-2 border-dashed border-blue-300 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 cursor-pointer group aspect-square flex items-center justify-center"
                      onClick={() => document.getElementById('news-images-input')?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-blue-500', 'bg-blue-100');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-100');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-100');
                        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')).slice(0, 10);
                        if (files.length > 0) {
                          window.dispatchEvent(new CustomEvent('newsImagesSelected', { detail: files }));
                        }
                      }}
                    >
                      <div className="text-center p-2">
                        <div className="mx-auto w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-colors">
                          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <p className="text-xs text-gray-600 font-medium">เพิ่มรูป</p>
                      </div>
                      <input
                        id="news-images-input"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []).slice(0, 10);
                          if (files.length > 0) {
                            window.dispatchEvent(new CustomEvent('newsImagesSelected', { detail: files }));
                          }
                        }}
                        className="sr-only"
                      />
                    </div>
                  </div>
                )}
                {formData.image_url.length > 1 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {formData.image_url.slice(1).map((url, idx) => {
                      const index = idx + 1;
                      return (
                        <div 
                          key={index} 
                          draggable
                          onDragStart={() => setDraggedIndex(index)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setHoverIndex(index);
                          }}
                          onDragLeave={() => setHoverIndex(null)}
                          onDrop={() => {
                            if (draggedIndex !== null && draggedIndex !== index && onImageReorder) {
                              onImageReorder(draggedIndex, index);
                            }
                            setDraggedIndex(null);
                            setHoverIndex(null);
                          }}
                          onDragEnd={() => {
                            setDraggedIndex(null);
                            setHoverIndex(null);
                          }}
                          className={`relative group rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border-2 transition-all duration-300 cursor-move ${
                            draggedIndex === index ? 'border-blue-400 shadow-xl scale-105 opacity-50' : 
                            hoverIndex === index && draggedIndex !== null && draggedIndex !== index ? 'border-green-400 shadow-xl scale-110 ring-4 ring-green-200' :
                            'border-gray-200 hover:border-blue-300 hover:shadow-lg hover:scale-105'
                          }`}
                        >
                          <div className="aspect-square relative">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                              <FaGripVertical className="w-3 h-3 text-gray-600" />
                            </div>
                            <div className="absolute bottom-2 left-2 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                              #{index + 1}
                            </div>
                            <button
                              type="button"
                              onClick={() => window.dispatchEvent(new CustomEvent('newsImageRemoveAt', { detail: { index } }))}
                              className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg opacity-0 group-hover:opacity-100 hover:scale-110"
                              title="ลบรูปภาพ"
                            >
                              <MdClose className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <div 
                      className="relative border-2 border-dashed border-blue-300 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 cursor-pointer group aspect-square flex items-center justify-center"
                      onClick={() => document.getElementById('news-images-input')?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-blue-500', 'bg-blue-100');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-100');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-100');
                        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')).slice(0, 10);
                        if (files.length > 0) {
                          window.dispatchEvent(new CustomEvent('newsImagesSelected', { detail: files }));
                        }
                      }}
                    >
                      <div className="text-center p-2">
                        <div className="mx-auto w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-colors">
                          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <p className="text-xs text-gray-600 font-medium">เพิ่มรูป</p>
                      </div>
                      <input
                        id="news-images-input"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []).slice(0, 10);
                          if (files.length > 0) {
                            window.dispatchEvent(new CustomEvent('newsImagesSelected', { detail: files }));
                          }
                        }}
                        className="sr-only"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-5 justify-end">
            <div className="group">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  name="force_show"
                  type="checkbox"
                  checked={!!formData.force_show}
                  onChange={(e) => handleInputChange({ target: { name: 'force_show', value: e.target.checked } })}
                  className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <span className="text-sm font-semibold text-gray-700">แสดงตลอด (ปิดไม่ได้)</span>
              </label>
            </div>
            <div className="group">
              <label className="flex items-center gap-3 cursor-pointer rounded-2xl">
                <input
                  name="show_to_all"
                  type="checkbox"
                  checked={!!formData.show_to_all}
                  onChange={(e) => handleInputChange({ target: { name: 'show_to_all', value: e.target.checked } })}
                  className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <span className="text-sm font-semibold text-gray-700">แสดงให้ทุกบทบาท (รวมใน 8 ข่าวเด่น)</span>
              </label>
            </div>
          </div>
          {/* Footer */}
          <div className=" flex justify-end space-x-4">
            <button
              className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-300 shadow-sm hover:shadow-md"
              onClick={() => setShowModal(false)}
              type="button"
            >
              ยกเลิก
            </button>
            <button
              className={`px-6 py-3 text-sm font-semibold text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 shadow-sm ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-md focus:ring-blue-500"
              }`}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  กำลังบันทึก...
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isEditing ? "M5 13l4 4L19 7" : "M12 4v16m8-8H4"} />
                  </svg>
                  {isEditing ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มข่าว'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={() => setShowModal(false)}>close</button>
      </form>
    </div>
  );
};

export default NewsFormDialog;