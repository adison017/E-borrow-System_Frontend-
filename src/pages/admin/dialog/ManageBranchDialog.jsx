import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import "../../../styles/animations.css";
import { API_BASE, authFetch } from "../../../utils/api";
import DeleteBranchDialog from "./DeleteBranchDialog";

export default function ManageBranchDialog({ open, onClose, onSaved }) {
  const [branches, setBranches] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    // reset local UI state
    setName("");
    setEditItem(null);
    setLoading(false);
    // call parent onClose
    onClose && onClose();
  };

  useEffect(() => {
    if (open) fetchBranches();
  }, [open]);

  const fetchBranches = async () => {
    try {
      const res = await authFetch(`${API_BASE}/users/branches`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setBranches(data || []);
    } catch (err) {
      console.error('fetchBranches', err);
      setBranches([]);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await authFetch(`${API_BASE}/users/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch_name: name.trim() })
      });
      setName('');
      await fetchBranches();
      onSaved && onSaved();
    } catch (err) {
      console.error('create branch', err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (b) => {
    setEditItem(b);
    setName(b.branch_name || '');
  };

  const cancelEdit = () => {
    setEditItem(null);
    setName('');
  };

  const handleUpdate = async () => {
    if (!editItem || !name.trim()) return;
    setLoading(true);
    try {
      await authFetch(`${API_BASE}/users/branches/${editItem.branch_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch_name: name.trim() })
      });
      setEditItem(null);
      setName('');
      await fetchBranches();
      onSaved && onSaved();
    } catch (err) {
      console.error('update branch', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    // open delete dialog instead
    setSelectedBranchId(id);
    setDeleteOpen(true);
  };

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(null);

  const handleConfirmDelete = async () => {
    if (!selectedBranchId) return;
    try {
      await authFetch(`${API_BASE}/users/branches/${selectedBranchId}`, { method: 'DELETE' });
      setDeleteOpen(false);
      setSelectedBranchId(null);
      await fetchBranches();
      onSaved && onSaved();
    } catch (err) {
      console.error('delete branch', err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 transform animate-slideUp">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="flex items-center gap-3">
              <span>จัดการสาขา</span>
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
          <div className="flex gap-3">
            <input 
              className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
              placeholder="ชื่อสาขา" 
              value={name} 
              onChange={(e)=>setName(e.target.value)} 
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ลำดับ</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อสาขา</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {branches.map((b, index) => (
                    <tr key={b.branch_id} className="hover:bg-gray-50 transition-colors animate-fadeInUp" style={{animationDelay: `${index * 0.1}s`}}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{b.branch_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{b.branch_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            onClick={() => startEdit(b)}
                            title="แก้ไข"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            onClick={() => handleDelete(b.branch_id)}
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
              {branches.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium">ไม่มีข้อมูลสาขา</p>
                  <p className="text-sm">เพิ่มสาขาใหม่เพื่อเริ่มต้นใช้งาน</p>
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
              <>

                <button 
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-colors disabled:opacity-50" 
                  onClick={handleCreate} 
                  disabled={loading}
                >
                  {loading ? 'กำลังเพิ่ม...' : 'เพิ่ม'}
                </button>
              </>
            )}
        </div>
      </div>
      {/* Delete confirmation dialog */}
      <DeleteBranchDialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setSelectedBranchId(null); }}
        selectedBranch={branches.find(b => b.branch_id === selectedBranchId)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
