import { MdClose } from "react-icons/md";

export default function DeleteNewsDialog({
  open,
  onClose,
  selectedNews,
  onConfirm
}) {
  if (!open) return null;
  return (
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
            ยืนยันการลบข่าวสาร
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
            คุณแน่ใจว่าต้องการลบข่าวสารนี้หรือไม่?
          </div>
          <div className="mt-2 bg-gray-50 p-3 rounded-lg">
            {/* Display news title or other relevant info */}
            <div className="font-medium text-lg text-gray-900">{selectedNews?.title}</div>
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
            onClick={onConfirm}
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
  );
} 