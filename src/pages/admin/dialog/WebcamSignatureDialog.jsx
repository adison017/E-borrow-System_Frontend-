import { useState } from "react";
import { StopCircleIcon as CancelIcon, CameraIcon as TakePictureIcon, ArrowsUpDownIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { MdClose } from "react-icons/md";
import Webcam from "react-webcam";
import PermissionRequest from "../../../components/PermissionRequest";

const WebcamSignatureDialog = ({
    isOpen,
    onClose,
    onCapture,
    webcamRef,
    cameraReady,
    setCameraReady
}) => {
    const [showPermissionRequest, setShowPermissionRequest] = useState(false);
    const [facingMode, setFacingMode] = useState("environment");

    if (!isOpen) return null;

    const handleCapture = () => {
        if (webcamRef.current && cameraReady) {
            const imageSrc = webcamRef.current.getScreenshot();
            onCapture(imageSrc);
        }
    };

    const handlePermissionGranted = (permissionType) => {
        if (permissionType === 'camera') {
            setShowPermissionRequest(false);
            setCameraReady(true);
        }
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === "user" ? "environment" : "user");
        setCameraReady(false);
    };

    const getCameraLabel = () => {
        return facingMode === "user" ? "กล้องหน้า" : "กล้องหลัง";
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-3xl h-[90vh] mx-auto bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-3xl shadow-2xl border border-blue-100 overflow-hidden transform transition-all duration-300 animate-in slide-in-from-bottom-4 flex flex-col">
                {/* Enhanced Header */}
                <div className="relative px-6 sm:px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <TakePictureIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-white">ถ่ายภาพ</h3>
                                <p className="text-blue-100 text-xs sm:text-sm mt-0.5">จัดตำแหน่งให้เหมาะสมแล้วกดถ่าย</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="self-end sm:self-auto p-2 bg-gray-200 hover:bg-red-100 hover:text-red-600 text-gray-700 rounded-full transition-all duration-200 hover:scale-105 border border-gray-300 hover:border-red-300"
                        >
                            <MdClose className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute top-3 right-12 sm:right-16 opacity-20">
                        <SparklesIcon className="w-4 h-4 sm:w-6 sm:h-6 text-white animate-pulse" />
                    </div>
                    <div className="absolute bottom-3 left-12 sm:left-16 opacity-10">
                        <SparklesIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white animate-pulse" style={{animationDelay: '1s'}} />
                    </div>
                </div>

                {/* Content - No scroll, fit to available space */}
                <div className="flex-1 flex flex-col p-4 sm:p-6">
                    {/* Camera View Container - Takes remaining space */}
                    <div className="flex-1 flex justify-center items-center min-h-0">
                        <div className="relative w-full h-full max-w-4xl bg-gradient-to-br from-gray-900 to-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-4 border-blue-200" style={{aspectRatio: '16/9'}}>
                            <Webcam
                                key={facingMode}
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{
                                    width: { ideal: 1920, min: 640 },
                                    height: { ideal: 1080, min: 480 },
                                    facingMode,
                                    aspectRatio: { ideal: 16/9 }
                                }}
                                onUserMedia={() => setCameraReady(true)}
                                onUserMediaError={(error) => {
                                    setCameraReady(false);
                                    if (error.name === 'NotAllowedError' || error.name === 'NotReadableError') {
                                        setShowPermissionRequest(true);
                                    }
                                }}
                                className="w-full h-full object-cover"
                            />
                            
                            {/* Loading State */}
                            {!cameraReady && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-black/80 to-blue-900/80 backdrop-blur-sm">
                                    <div className="relative mb-4">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                                        <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{animationDelay: '0.15s'}}></div>
                                    </div>
                                    <div className="text-center px-4 max-w-md">
                                        <p className="text-white text-lg sm:text-xl font-semibold mb-2">กำลังเชื่อมต่อกล้อง...</p>
                                        <p className="text-blue-200 text-sm sm:text-base leading-relaxed mb-2">
                                            กรุณาอนุญาตการเข้าถึงกล้องในเบราว์เซอร์
                                        </p>
                                        <p className="text-blue-300 text-xs sm:text-sm">
                                            หากมีข้อผิดพลาด ลองปิดแอปอื่นที่ใช้กล้อง
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowPermissionRequest(true)}
                                        className="mt-4 px-6 py-3 sm:px-8 sm:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all duration-300 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                                    >
                                        <TakePictureIcon className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                                        ขออนุญาตกล้อง
                                    </button>
                                </div>
                            )}
                            
                            {/* Camera Frame Overlay */}
                            {cameraReady && (
                                <div className="absolute inset-0 pointer-events-none">
                                    {/* Corner frames */}
                                    <div className="absolute top-4 left-4 w-10 h-10 sm:w-12 sm:h-12 border-l-4 border-t-4 border-white/60 rounded-tl-lg"></div>
                                    <div className="absolute top-4 right-4 w-10 h-10 sm:w-12 sm:h-12 border-r-4 border-t-4 border-white/60 rounded-tr-lg"></div>
                                    <div className="absolute bottom-4 left-4 w-10 h-10 sm:w-12 sm:h-12 border-l-4 border-b-4 border-white/60 rounded-bl-lg"></div>
                                    <div className="absolute bottom-4 right-4 w-10 h-10 sm:w-12 sm:h-12 border-r-4 border-b-4 border-white/60 rounded-br-lg"></div>
                                    
                                    {/* Center focus indicator */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-white/80 rounded-full animate-pulse"></div>
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-white/80 rounded-full"></div>
                                    </div>
                                    
                                    {/* Grid lines for better composition */}
                                    <div className="absolute inset-0 opacity-25">
                                        <div className="absolute top-1/3 left-0 right-0 h-px bg-white/40"></div>
                                        <div className="absolute top-2/3 left-0 right-0 h-px bg-white/40"></div>
                                        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/40"></div>
                                        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/40"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons - Fixed at bottom */}
                <div className="flex-shrink-0 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 border-2 border-gray-300 text-sm sm:text-base font-semibold rounded-2xl text-gray-700 bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-700 focus:outline-none focus:ring-4 focus:ring-red-200 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 min-w-[120px]"
                        >
                            <CancelIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            ยกเลิก
                        </button>
                        
                        {/* Camera Switch Button - Moved to center */}
                        <button
                            onClick={toggleCamera}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 sm:px-6 sm:py-4 bg-blue-100 hover:bg-blue-200 text-blue-800 hover:text-blue-900 rounded-2xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-blue-300 hover:border-blue-400 min-w-[120px]"
                            title={`สลับเป็น ${getCameraLabel()}`}
                        >
                            <ArrowsUpDownIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">{getCameraLabel()}</span>
                            <span className="sm:hidden">สลับ</span>
                        </button>
                        
                        <button
                            type="button"
                            onClick={handleCapture}
                            disabled={!cameraReady}
                            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 border-2 border-transparent text-sm sm:text-base font-semibold rounded-2xl text-white shadow-lg focus:outline-none focus:ring-4 transition-all duration-300 transform hover:scale-105 min-w-[120px] ${
                                !cameraReady 
                                    ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                                    : 'bg-green-600 hover:bg-green-700 focus:ring-green-200'
                            }`}
                        >
                            <TakePictureIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            {cameraReady ? 'ถ่ายภาพ' : 'รอกล้อง...'}
                        </button>
                    </div>
                </div>
            </div>

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