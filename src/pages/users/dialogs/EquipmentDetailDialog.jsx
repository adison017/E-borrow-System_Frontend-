import { MdClose } from "react-icons/md";
import { motion, AnimatePresence } from 'framer-motion';

const EquipmentDetailDialog = ({
  showDetailDialog,
  setShowDetailDialog,
  selectedEquipment,
  showImageModal,
  getStatusBadge
}) => {
  return (
    <AnimatePresence>
    {showDetailDialog && selectedEquipment && (
      <motion.div 
        className="modal modal-open"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
          <motion.div 
            className="bg-white rounded-xl shadow-xl w-full max-w-4xl xl:max-w-6xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 50 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-950 to-blue-700 -mx-6 -mt-6 px-6 py-6 rounded-t-xl mb-8">
                <div className="flex justify-between items-center">
                  <div className="text-white">
                    <h2 className="text-2xl font-bold">รายละเอียดครุภัณฑ์</h2>
                    <p className="text-blue-100 mt-1">รหัส: {selectedEquipment.code}</p>
                  </div>
                  <button
                    onClick={() => setShowDetailDialog(false)}
                    className=" hover:text-white transition-colors p-2 hover:bg-white/40 bg-white text-black rounded-full"
                  >
                    <MdClose className="w-6 h-6 " />
                  </button>
                </div>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Image Column */}
                <div className="lg:col-span-1 mt-10">
                  <div className="rounded-xl overflow-hidden transition-all duration-300 flex items-center justify-center bg-white p-4 group">
                    <img
                      src={selectedEquipment.image}
                      alt={selectedEquipment.name}
                      className="w-full max-w-full h-full max-h-[33vh] object-contain cursor-pointer transform transition-transform duration-300 group-hover:scale-110"
                      onClick={() => showImageModal(selectedEquipment.image)}
                    />
                  </div>
                </div>

                {/* Details Column */}
                <div className="lg:col-span-2">
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{selectedEquipment.name}</h3>
                    </div>                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-xl shadow-sm transition-shadow border border-blue-100">
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">จำนวนคงเหลือ</p>
                        <p className="text-lg font-semibold mt-1 text-gray-800">{selectedEquipment.available} ชิ้น</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-xl shadow-sm transition-shadow border border-blue-100">
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">ราคา</p>
                        <p className="text-lg font-semibold mt-1 text-gray-800">{selectedEquipment.price ? Number(selectedEquipment.price).toLocaleString('th-TH') + ' บาท' : '-'}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-xl shadow-sm transition-shadow border border-blue-100">
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">วันที่จัดซื้อ</p>
                        <p className="text-lg font-semibold mt-1 text-gray-800">{selectedEquipment.purchaseDate ? new Date(selectedEquipment.purchaseDate).toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-xl shadow-sm transition-shadow border border-blue-100">
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">สถานที่จัดเก็บ</p>
                        <p className="text-lg font-semibold mt-1 text-gray-800">{selectedEquipment.location || '-'}</p>
                      </div>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-xl shadow-sm transition-shadow border border-blue-100">
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">รายละเอียด</p>
                      <p className="text-md font-semibold mt-1">{selectedEquipment.specifications}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    )}
    </AnimatePresence>
  );
};

export default EquipmentDetailDialog;