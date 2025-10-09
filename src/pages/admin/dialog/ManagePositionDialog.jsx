import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import "../../../styles/animations.css";
import { API_BASE, authFetch } from "../../../utils/api";
import Notification from "../../../components/Notification";

export default function ManagePositionDialog({ open, onClose, onSaved, onNotify }) {
  const [positions, setPositions] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState(null);

  const handleClose = () => {
    setName("");
    setEditItem(null);
    setLoading(false);
    onClose && onClose();
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  useEffect(() => {
    if (open) fetchPositions();
  }, [open]);

  const fetchPositions = async () => {
    try {
      const res = await authFetch(`${API_BASE}/users/positions`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setPositions(data || []);
    } catch (err) {
      setPositions([]);
      onNotify && onNotify("position_fetch_error");
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await authFetch(`${API_BASE}/users/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position_name: name.trim() })
      });
      setName('');
      await fetchPositions();
      onSaved && onSaved();
      onNotify && onNotify("position_add_success");
    } catch (err) {
      onNotify && onNotify("position_add_error");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (p) => {
    setEditItem(p);
    setName(p.position_name || '');
  };

  const cancelEdit = () => {
    setEditItem(null);
    setName('');
  };

  const handleUpdate = async () => {
    if (!editItem || !name.trim()) return;
    setLoading(true);
    try {
      await authFetch(`${API_BASE}/users/positions/${editItem.position_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position_name: name.trim() })
      });
      setEditItem(null);
      setName('');
      await fetchPositions();
      onSaved && onSaved();
      onNotify && onNotify("position_update_success");
    } catch (err) {
      onNotify && onNotify("position_update_error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    // open delete dialog instead
    setSelectedPositionId(id);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPositionId) return;
    try {
      await authFetch(`${API_BASE}/users/positions/${selectedPositionId}`, { method: 'DELETE' });
      setDeleteOpen(false);
      setSelectedPositionId(null);
      await fetchPositions();
      onSaved && onSaved();
      onNotify && onNotify("position_delete_success");
    } catch (err) {
      onNotify && onNotify("position_delete_error");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto transform animate-slideUp">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex items-center gap-3">
              <span>จัดการตำแหน่ง</span>
              <span className={`text-xs px-2 py-1 rounded-full ${editItem ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {editItem ? 'กำลังแก้ไข' : 'เพิ่มใหม่'}
              </span>
            </div>
          </h3>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <MdClose size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-3">
            <input 
              className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"  
              placeholder="ชื่อตำแหน่ง" 
              value={name} 
              onChange={(e)=>setName(e.target.value)} 
            />        
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full min-w-[400px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อตำแหน่ง</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {positions.map((p, index) => (
                    <tr key={p.position_id} className="hover:bg-gray-50 transition-colors animate-fadeInUp" style={{animationDelay: `${index * 0.1}s`}}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.position_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                            onClick={() => startEdit(p)}
                            title="แก้ไข"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            onClick={() => handleDelete(p.position_id)}
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
              {positions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium">ไม่มีข้อมูลตำแหน่ง</p>
                  <p className="text-sm">เพิ่มตำแหน่งใหม่เพื่อเริ่มต้นใช้งาน</p>
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
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-full font-medium transition-colors disabled:opacity-50" 
                onClick={handleCreate} 
                disabled={loading}
              >
                {loading ? 'กำลังเพิ่ม...' : 'เพิ่ม'}
              </button>
            )}
        </div>
      </div>
      {/* Delete confirmation notification */}
      <Notification
        show={deleteOpen}
        title="ยืนยันการลบตำแหน่ง"
        message={(() => {
          const pos = positions.find(p => p.position_id === selectedPositionId);
          return pos ? `คุณแน่ใจว่าต้องการลบตำแหน่งนี้หรือไม่?\n${pos.position_name}` : '';
        })()}
        type="warning"
        duration={0}
        onClose={() => { setDeleteOpen(false); setSelectedPositionId(null); }}
        actions={[
          { label: 'ยกเลิก', onClick: () => { setDeleteOpen(false); setSelectedPositionId(null); } },
          { label: 'ยืนยันการลบ', onClick: handleConfirmDelete }
        ]}
      />
    </div>
  );
}
