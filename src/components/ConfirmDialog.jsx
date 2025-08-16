import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-full">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            </div>
            
            <p className="mt-4 text-gray-600">{message}</p>
            
            <div className="mt-8 flex justify-end gap-4">
              <button
                className="btn btn-outline rounded-full border-2 border-gray-300 hover:border-none"
                onClick={onClose}
              >
                ยกเลิก
              </button>
              <button
                className="btn btn-error rounded-full"
                onClick={onConfirm}
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;