import { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import axios from 'axios';
import PinDialog from "../../../components/dialog/PinDialog";

export default function DeleteUserDialog({
  open,
  onClose,
  selectedUser,
  onConfirm
}) {
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get current user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleDeleteClick = () => {
    setPinOpen(true);
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    console.log('handlePinSubmit called with pin:', pin);

    if (!currentUser) {
      console.log('No currentUser found');
      setPinError("ไม่พบข้อมูลผู้ใช้ปัจจุบัน");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'exists' : 'missing');
      console.log('Sending request to verify password...');

      const response = await axios.post('http://localhost:5000/api/users/verify-password',
        { password: pin },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Response:', response.data);

      if (response.data.success) {
        console.log('Password verified successfully, calling onConfirm');
        setPinOpen(false);
        setPin("");
        setPinError("");
        onConfirm();
      } else {
        console.log('Password verification failed');
        setPinError("รหัสผ่านไม่ถูกต้อง");
      }
    } catch (error) {
      console.error('Error in handlePinSubmit:', error);
      console.error('Error response:', error.response?.data);
      setPinError(error.response?.data?.message || "รหัสผ่านไม่ถูกต้อง");
    }
  };

  const handlePinCancel = () => {
    setPinOpen(false);
    setPin("");
    setPinError("");
  };

  if (!open && !pinOpen) return null;
  return (
    <>
      {/* Show main modal only if open and not pinOpen */}
      {open && !pinOpen && (
        <div className="modal modal-open">
          <div className="modal-box relative bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full p-6 z-50">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="bg-red-100 text-red-600 p-2 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </span>
                ยืนยันการลบผู้ใช้งาน
              </h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-800 transition-colors duration-150 hover:bg-gray-100 p-2 rounded-full"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>
            {/* Content */}
            <div className="py-2">
              <div className="text-sm text-gray-600 mb-2">
                คุณแน่ใจว่าต้องการลบผู้ใช้งานนี้หรือไม่?
              </div>
              <div className="mt-2 bg-gray-50 p-3 rounded-lg flex items-center gap-3">
                <img
                  src={selectedUser?.avatar ? `http://localhost:5000/uploads/user/${selectedUser.avatar.split('/').pop()}` : (selectedUser?.pic || "/public/profile.png")}
                  alt={selectedUser?.username}
                  className="w-12 h-12 rounded-full object-cover border border-gray-200 bg-white"
                />
                <div>
                  <div className="font-medium text-lg text-gray-900">{selectedUser?.Fullname}</div>
                  <div className="text-sm text-gray-500">{selectedUser?.user_code}</div>
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="mt-2 pt-4 border-t border-gray-100 flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                onClick={onClose}
                type="button"
              >
                ยกเลิก
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                onClick={handleDeleteClick}
                type="button"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={onClose}>close</button>
          </form>
        </div>
      )}

      {/* Show PinDialog only if pinOpen */}
      {pinOpen && (
        <PinDialog
          open={pinOpen}
          pin={pin}
          setPin={setPin}
          pinError={pinError}
          onCancel={handlePinCancel}
          onSubmit={handlePinSubmit}
        />
      )}
    </>
  );
}