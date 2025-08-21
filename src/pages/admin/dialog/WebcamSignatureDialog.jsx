import { useState } from "react";
import { StopCircleIcon as CancelIcon, CameraIcon as TakePictureIcon } from "@heroicons/react/24/solid"; // Using appropriate icons
import { MdClose } from "react-icons/md";
import Webcam from "react-webcam";
import PermissionRequest from "../../../components/PermissionRequest";

const WebcamSignatureDialog = ({
    isOpen,
    onClose,
    onCapture,
    webcamRef,
    cameraReady,
    setCameraReady // Parent manages cameraReady state via setCameraReady
}) => {
    const [showPermissionRequest, setShowPermissionRequest] = useState(false);

    if (!isOpen) return null;

    const handleCapture = () => {
        if (webcamRef.current && cameraReady) {
            const imageSrc = webcamRef.current.getScreenshot();
            onCapture(imageSrc); // This function should also handle closing the dialog
        }
    };

    const handlePermissionGranted = (permissionType) => {
        if (permissionType === 'camera') {
            setShowPermissionRequest(false);
            setCameraReady(true);
        }
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-800">ถ่ายภาพ</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <MdClose className="w-6 h-6" />
                    </button>
                </div>

                {/* Webcam View */}
                <div className="p-6 space-y-5">
                    <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-inner mx-auto max-h-[60vh]">
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{
                                width: { ideal: 1280 },
                                height: { ideal: 720 },
                                facingMode: "user",
                                aspectRatio: { ideal: 16/9 }
                            }}
                            onUserMedia={() => setCameraReady(true)}
                            onUserMediaError={(error) => {
                                // Camera error
                                setCameraReady(false);

                                // แสดง Permission Request Dialog สำหรับ permission errors
                                if (error.name === 'NotAllowedError' || error.name === 'NotReadableError') {
                                    setShowPermissionRequest(true);
                                }
                            }} // Handle media error
                            className="w-full h-full object-cover"
                        />
                        {!cameraReady && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                                <svg className="animate-spin h-8 w-8 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-white text-base font-medium">กำลังเชื่อมต่อกล้อง...</p>
                                <p className="text-gray-300 text-xs mt-2 text-center max-w-xs">
                                    กรุณาอนุญาตการเข้าถึงกล้องในเบราว์เซอร์<br/>
                                    หากมีข้อผิดพลาด ลองปิดแอปอื่นที่ใช้กล้อง
                                </p>
                                <button
                                    onClick={() => setShowPermissionRequest(true)}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                    ขออนุญาตกล้อง
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 shadow-sm"
                        >
                            <CancelIcon className="h-5 w-5" />
                            ยกเลิก
                        </button>
                        <button
                            type="button"
                            onClick={handleCapture}
                            disabled={!cameraReady}
                            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${
                                !cameraReady ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            <TakePictureIcon className="h-5 w-5" />
                            ถ่ายภาพ
                        </button>
                    </div>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>

            {/* Permission Request Dialog */}
            <PermissionRequest
                isOpen={showPermissionRequest}
                onClose={() => setShowPermissionRequest(false)}
                onPermissionGranted={handlePermissionGranted}
                requestType="camera"
            />
        </div>
    );
};

export default WebcamSignatureDialog;