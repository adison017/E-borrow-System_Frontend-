import { MdClose } from "react-icons/md";
import { motion, AnimatePresence } from 'framer-motion';

const ImageModal = ({ selectedImage, setSelectedImage }) => {
  return (
    <AnimatePresence>
    {selectedImage && (
      <motion.div 
        className="modal modal-open"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <motion.div 
            className="relative max-w-5xl w-full max-h-[90vh]"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <button
              className="absolute top-4 right-4 hover:bg-gray-200 bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors z-10"
              onClick={() => setSelectedImage(null)}
            >
              <MdClose className="w-6 h-6 text-black" />
            </button>
            <div className="bg-white w-full h-full flex items-center justify-center rounded-lg shadow-xl">
              <img
                src={selectedImage}
                alt="Equipment preview"
                className="w-full max-w-full h-full max-h-[80vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
    )}
    </AnimatePresence>
  );
};

export default ImageModal;