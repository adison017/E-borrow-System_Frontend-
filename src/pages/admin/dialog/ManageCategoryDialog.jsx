import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import "../../../styles/animations.css";
import { getCategories, addCategory, updateCategory, deleteCategory } from "../../../utils/api";
import DeleteCategoryDialog from "./DeleteCategoryDialog";

export default function ManageCategoryDialog({ open, onClose, onSaved }) {
  const [categories, setCategories] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [name, setName] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setName("");
    setCategoryCode("");
    setEditItem(null);
    setLoading(false);
    onClose && onClose();
  };

  useEffect(() => {
    if (open) fetchCategories();
  }, [open]);

  // When the dialog is opened and categories are loaded, auto-generate a category code
  useEffect(() => {
    if (open && !editItem && !categoryCode) {
      try {
        const next = generateNextCode();
        setCategoryCode(next);
      } catch (e) {
        // fallback: leave categoryCode empty
      }
    }
  }, [open, categories, editItem, categoryCode]);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error('fetchCategories', err);
      setCategories([]);
    }
  };

  const generateNextCode = () => {
    const existingNumbers = categories
      .map(cat => cat.category_code)
      .filter(code => code && code.startsWith('CAT-'))
      .map(code => parseInt(code.replace('CAT-', ''), 10))
      .filter(num => !isNaN(num));
    
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    return `CAT-${String(maxNumber + 1).padStart(3, '0')}`;
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const code = categoryCode || generateNextCode();
      await addCategory({ category_code: code, name: name.trim() });
      setName('');
      setCategoryCode('');
      await fetchCategories();
      onSaved && onSaved();
    } catch (err) {
      console.error('create category', err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (c) => {
    setEditItem(c);
    setName(c.name || '');
    setCategoryCode(c.category_code || '');
  };

  const cancelEdit = () => {
    setEditItem(null);
    setName('');
    setCategoryCode('');
  };

  const handleUpdate = async () => {
    if (!editItem || !name.trim()) return;
    setLoading(true);
    try {
      await updateCategory(editItem.category_id, {
        category_code: categoryCode,
        name: name.trim()
      });
      setEditItem(null);
      setName('');
      setCategoryCode('');
      await fetchCategories();
      onSaved && onSaved();
    } catch (err) {
      console.error('update category', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setSelectedCategoryId(id);
    setDeleteOpen(true);
  };

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const handleConfirmDelete = async () => {
    if (!selectedCategoryId) return;
    try {
      await deleteCategory(selectedCategoryId);
      setDeleteOpen(false);
      setSelectedCategoryId(null);
      await fetchCategories();
      onSaved && onSaved();
    } catch (err) {
      console.error('delete category', err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto transform animate-slideUp">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="flex items-center gap-3">
              <span>จัดการหมวดหมู่</span>
              <span className={`text-xs px-2 py-1 rounded-full ${editItem ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                {editItem ? 'กำลังแก้ไข' : 'เพิ่มใหม่'}
              </span>
            </div>
          </h3>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <MdClose size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-2">
            <input 
              className="w-32 px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" 
              placeholder="รหัสหมวดหมู่" 
              value={categoryCode} 
              onChange={(e)=>setCategoryCode(e.target.value)}
              disabled={editItem}
            />
            <input 
              className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" 
              placeholder="ชื่อหมวดหมู่" 
              value={name} 
              onChange={(e)=>setName(e.target.value)} 
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัสหมวดหมู่</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อหมวดหมู่</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categories.map((c, index) => (
                    <tr key={c.category_id} className="hover:bg-gray-50 transition-colors animate-fadeInUp" style={{animationDelay: `${index * 0.1}s`}}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{c.category_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            onClick={() => startEdit(c)}
                            title="แก้ไข"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            onClick={() => handleDelete(c.category_id)}
                            title="ลบ"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {categories.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium">ไม่มีข้อมูลหมวดหมู่</p>
                  <p className="text-sm">เพิ่มหมวดหมู่ใหม่เพื่อเริ่มต้นใช้งาน</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-6 border-t border-gray-100">
            {editItem ? (
              <>
                <button 
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-colors" 
                  onClick={cancelEdit}
                >
                  ยกเลิก
                </button>
                <button 
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium transition-colors disabled:opacity-50" 
                  onClick={handleUpdate} 
                  disabled={loading}
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </>
            ) : (
              <button 
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium transition-colors disabled:opacity-50" 
                onClick={handleCreate} 
                disabled={loading}
              >
                {loading ? 'กำลังเพิ่ม...' : 'เพิ่ม'}
              </button>
            )}
        </div>
      </div>
      {/* Delete confirmation dialog */}
      <DeleteCategoryDialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setSelectedCategoryId(null); }}
        selectedCategory={categories.find(c => c.category_id === selectedCategoryId)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}