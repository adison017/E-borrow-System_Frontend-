import React, { useEffect, useRef, useState } from "react";
import {
    ArrowPathIcon,
    CalendarIcon,
    CameraIcon,
    CheckCircleIcon,
    CheckCircleIcon as CheckCircleSolidIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    CubeIcon,
    DocumentCheckIcon,
    InformationCircleIcon,
    PencilSquareIcon,
    QuestionMarkCircleIcon,
    TagIcon,
    UserIcon,
    XCircleIcon
} from "@heroicons/react/24/outline";
import WebcamSignatureDialog from "./WebcamSignatureDialog";
import DocumentViewer from '../../../components/DocumentViewer';
import { UPLOAD_BASE, API_BASE } from '../../../utils/api';

const EquipmentDeliveryDialog = ({ borrow, isOpen, onClose, onConfirm }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deliveryNote, setDeliveryNote] = useState("");
    const [isWebcamDialogOpen, setIsWebcamDialogOpen] = useState(false);
    const [isDeliveryPhotoDialogOpen, setIsDeliveryPhotoDialogOpen] = useState(false);
    const [signature, setSignature] = useState(null);
    const [deliveryPhoto, setDeliveryPhoto] = useState(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [deliveryPhotoCameraReady, setDeliveryPhotoCameraReady] = useState(false);
    const webcamRef = useRef(null);
    const deliveryPhotoWebcamRef = useRef(null);

    useEffect(() => {
        if (isOpen && borrow) {
            setDeliveryNote(borrow.delivery_note || "");
            if (borrow.status === "approved" && borrow.signature_image) {
                setSignature(borrow.signature_image);
            } else {
                setSignature(null);
            }
            if (borrow.status === "approved" && borrow.handover_photo) {
                setDeliveryPhoto(borrow.handover_photo);
            } else {
                setDeliveryPhoto(null);
            }
            setIsWebcamDialogOpen(false);
            setIsDeliveryPhotoDialogOpen(false);
            setCameraReady(false);
            setDeliveryPhotoCameraReady(false);
        }
    }, [isOpen, borrow]);

    if (!isOpen || !borrow) return null;

    const borrowDates = `${borrow.borrow_date ? borrow.borrow_date.slice(0, 10) : ''} ถึง ${borrow.due_date ? borrow.due_date.slice(0, 10) : ''}`;

    const getStatusBadge = (status) => {
        const baseClasses = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all";
        const iconSize = "w-5 h-5";
        switch (status) {
            case "approved":
                return (
                    <div className={`${baseClasses} bg-green-100 text-green-700 border border-green-200 relative`}>
                        <CheckCircleSolidIcon className={`${iconSize} text-green-600`} />
                        <span>ส่งมอบแล้ว</span>
                        <div className="absolute -right-1 -top-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
                    </div>
                );
            case "carry":
                return (
                    <div className={`${baseClasses} bg-yellow-100 text-yellow-700 border border-yellow-200 relative`}>
                        <ClockIcon className={`${iconSize} text-yellow-600`} />
                        <span>รอส่งมอบ</span>
                        <div className="absolute -right-1 -top-1 w-2.5 h-2.5 bg-yellow-500 rounded-full border border-white animate-pulse"></div>
                    </div>
                );
            case "cancelled":
                return (
                    <div className={`${baseClasses} bg-gray-200 text-gray-500 border border-gray-300`}>
                        <XCircleIcon className={`${iconSize} text-gray-400`} />
                        <span>ยกเลิก</span>
                    </div>
                );
            default:
                return (
                    <div className={`${baseClasses} bg-gray-100 text-gray-700 border border-gray-200`}>
                        <QuestionMarkCircleIcon className={`${iconSize} text-gray-600`} />
                        <span>ไม่ทราบสถานะ</span>
                    </div>
                );
        }
    };

    const handleSignatureCaptured = (imageSrc) => {
        setSignature(imageSrc);
        setIsWebcamDialogOpen(false);
        setCameraReady(false);
    };

    const handleDeliveryPhotoCaptured = (imageSrc) => {
        // สร้าง canvas เพื่อปรับขนาดรูปภาพให้เท่ากับบัตรนักศึกษา
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // สร้าง Image object เพื่อโหลดรูปภาพ
        const img = new Image();
        img.onload = () => {
            // กำหนดขนาดของบัตรนักศึกษา (อัตราส่วน 3:2)
            const targetWidth = 300; // ความกว้างของบัตรนักศึกษา
            const targetHeight = 200; // ความสูงของบัตรนักศึกษา (3:2 ratio)

            // ตั้งค่าขนาด canvas
            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // คำนวณการครอปและปรับขนาด
            const aspectRatio = targetWidth / targetHeight; // 1.5 (3:2)
            const imgAspectRatio = img.width / img.height;

            let sourceX = 0;
            let sourceY = 0;
            let sourceWidth = img.width;
            let sourceHeight = img.height;

            if (imgAspectRatio > aspectRatio) {
                // รูปภาพกว้างกว่า ต้องครอปด้านข้าง
                sourceWidth = img.height * aspectRatio;
                sourceX = (img.width - sourceWidth) / 2;
            } else {
                // รูปภาพสูงกว่า ต้องครอปด้านบนล่าง
                sourceHeight = img.width / aspectRatio;
                sourceY = (img.height - sourceHeight) / 2;
            }

            // วาดรูปภาพลงบน canvas ด้วยขนาดที่กำหนด
            ctx.drawImage(
                img,
                sourceX, sourceY, sourceWidth, sourceHeight, // source
                0, 0, targetWidth, targetHeight // destination
            );

            // แปลงเป็น base64
            const resizedImageSrc = canvas.toDataURL('image/jpeg', 0.9);
            setDeliveryPhoto(resizedImageSrc);
        };

        img.src = imageSrc;
        setIsDeliveryPhotoDialogOpen(false);
        setDeliveryPhotoCameraReady(false);
    };

    const handleDelivery = async () => {
        setIsSubmitting(true);
        try {
            // ตรวจสอบว่า borrow มี property อะไรบ้าง (debug)
            // Debug borrow object
            const id = borrow && (borrow.borrow_id || borrow.id);
            if (!id) {
                setIsSubmitting(false);
                alert('ไม่พบรหัสการยืม (borrow_id)');
                return;
            }
            const deliveryData = {
                borrow_id: id,
                signature_image: signature, // ต้องเป็น base64 เท่านั้น
                handover_photo: deliveryPhoto // รูปถ่ายส่งมอบครุภัณฑ์
                // ไม่ต้องส่ง status เพราะ backend จะเปลี่ยนเป็น 'approved' อัตโนมัติ
            };

            console.log('Sending delivery data:', {
                borrow_id: deliveryData.borrow_id,
                has_signature: !!deliveryData.signature_image,
                has_handover_photo: !!deliveryData.handover_photo,
                signature_type: typeof deliveryData.signature_image,
                handover_type: typeof deliveryData.handover_photo
            });

            await onConfirm(deliveryData);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const isDeliveryButtonDisabled = borrow.status === "approved" || isSubmitting || !signature || !deliveryPhoto;

    // Enhanced SectionHeader with gradient and better styling
    const SectionHeader = ({ title, icon }) => (
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500 rounded-xl shadow-md">
                <span className="text-white">{icon}</span>
            </div>
            <div>
                <h4 className="text-lg font-bold text-gray-800">{title}</h4>
                <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
            </div>
        </div>
    );

    return (
        <div className="modal modal-open">
            <div data-theme="light" className="max-w-8xl w-full h-full max-h-[95vh] rounded-2xl shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="flex flex-col h-full">
                    {/* Enhanced Header with gradient and status badge */}
                    <div className="sticky z-10 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg rounded-2xl">
                        <div className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                        <DocumentCheckIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h2 className="text-xl font-bold text-white">
                                                รายละเอียดการส่งมอบครุภัณฑ์
                                            </h2>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-white">
                                            <span className="flex items-center gap-1">
                                                <TagIcon className="w-4 h-4" />
                                                รหัส: <span className="font-mono font-semibold text-white">{borrow.borrow_code || '-'}</span>
                                            </span>
                                            {borrow.borrow_date && (
                                                <span className="flex items-center gap-1">
                                                    <CalendarIcon className="w-4 h-4" />
                                                    วันที่ขอ: <span className="font-semibold text-white">{new Date(borrow.borrow_date).toLocaleDateString('th-TH')}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all duration-200 hover:scale-105"
                                >
                                    <MdClose className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        {/* Decorative wave */}
                        <div className="h-4 bg-gradient-to-r from-blue-500 to-indigo-600 mb-3">
                            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
                                <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="currentColor" className="text-blue-50"></path>
                                <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="currentColor" className="text-blue-50"></path>
                                <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="currentColor" className="text-blue-50"></path>
                            </svg>
                        </div>
                    </div>

                    <div className="overflow-y-auto p-6 flex-grow bg-gradient-to-b from-transparent to-blue-50/30">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* ข้อมูลผู้ขอยืมและช่วงเวลา */}
                            <div className="space-y-6">
                                <SectionHeader
                                    title="ข้อมูลผู้ขอยืม"
                                    icon={<UserIcon className="h-5 w-5 text-white" />}
                                />
                                {borrow.borrower && (
                                    <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                                        <div className="p-6">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-200 shadow-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                                                        <img
                                                            src={borrow.borrower.avatar ? (String(borrow.borrower.avatar).startsWith('http') ? borrow.borrower.avatar : `${UPLOAD_BASE}/uploads/user/${borrow.borrower.avatar}`) : '/profile.png'}
                                                            alt={borrow.borrower.name}
                                                            className="w-full h-full object-cover"
                                                            onError={e => { e.target.onerror = null; e.target.src = '/profile.png'; }}
                                                        />
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                                                        <CheckCircleIcon className="w-3 h-3 text-white" />
                                                    </div>
                                                </div>
                                                <div className="text-center space-y-2">
                                                    {borrow.borrower.student_id && (
                                                        <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-mono">
                                                            {borrow.borrower.student_id}
                                                        </div>
                                                    )}
                                                    <h3 className="font-bold text-xl text-gray-800">{borrow.borrower.name}</h3>
                                                    {borrow.borrower.position && (
                                                        <p className="text-blue-600 font-medium">{borrow.borrower.position}</p>
                                                    )}
                                                    {borrow.borrower.department && (
                                                        <p className="text-gray-600 text-sm bg-gray-100 px-3 py-1 rounded-full inline-block">{borrow.borrower.department}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <SectionHeader
                                        title="ข้อมูลการยืม"
                                        icon={<CalendarIcon className="h-5 w-5 text-white" />}
                                    />
                                    <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                                        <div className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-4xl">
                                                    <div className="p-3 bg-blue-600 rounded-full">
                                                        <CalendarIcon className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-black font-medium mb-1">วันที่ต้องการยืม</p>
                                                        <p className="font-bold text-lg text-gray-800">{borrow.borrow_date ? new Date(borrow.borrow_date).toLocaleDateString('th-TH') : '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-4xl">
                                                    <div className="p-3 bg-orange-500 rounded-full">
                                                        <ClockIcon className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-orange-600 font-medium mb-1">กำหนดคืน</p>
                                                        <p className="font-bold text-lg text-gray-800">{borrow.due_date ? new Date(borrow.due_date).toLocaleDateString('th-TH') : '-'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Duration indicator */}
                                            {borrow.borrow_date && borrow.due_date && (
                                                <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                                                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                                        <ArrowPathIcon className="w-4 h-4" />
                                                        <span>ระยะเวลาการยืม: <span className="font-semibold text-blue-600">{Math.ceil((new Date(borrow.due_date) - new Date(borrow.borrow_date)) / (1000 * 60 * 60 * 24))} วัน</span></span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {borrow.purpose && (
                                    <div>
                                        <SectionHeader
                                            title="วัตถุประสงค์"
                                            icon={<TagIcon className="h-5 w-5 text-white" />}
                                        />
                                        <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                                            <div className="p-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex-1">
                                                        <p className="text-gray-700 leading-relaxed">{borrow.purpose}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Important Documents Section */}
                                {borrow.important_documents && borrow.important_documents.length > 0 && (
                                    <div>
                                        <SectionHeader
                                            title="เอกสารสำคัญที่แนบ"
                                            icon={<DocumentCheckIcon className="h-5 w-5 text-white" />}
                                        />
                                        <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                                            <div className="p-6">
                                                <DocumentViewer
                                                    documents={borrow.important_documents}
                                                    title=""
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ข้อมูลอุปกรณ์ */}
                            <div className="space-y-6">
                                <SectionHeader
                                    title="รายการครุภัณฑ์ที่ส่งมอบ"
                                    icon={<CubeIcon className="h-5 w-5 text-white" />}
                                />

                                {/* Equipment Summary Card */}
                                <div className="bg-black rounded-4xl p-6 text-white shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">สรุปรายการ</h3>
                                            <p className="text-white">จำนวนครุภัณฑ์ทั้งหมด</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-bold">{borrow.equipment?.length || 0}</div>
                                            <div className="text-sm text-white">รายการ</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-4xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <div className="min-w-[340px]">
                                            <table className="min-w-full">
                                                <thead className="bg-blue-500">
                                                    <tr>
                                                        <th className="px-4 py-4 text-center text-sm font-semibold text-white uppercase tracking-wider">รูป</th>
                                                        <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">ครุภัณฑ์</th>
                                                        <th className="px-6 py-4 text-center text-sm font-semibold text-white uppercase tracking-wider">จำนวน</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-blue-100">
                                                    {borrow.equipment?.length > 0 ? borrow.equipment.map((item, index) => (
                                                        <tr key={item.item_id || index} className="hover:bg-blue-50/50 transition-colors duration-200">
                                                            <td className="px-4 py-4 text-center">
                                                                <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center mx-auto border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
                                                                    <img
                                                                        src={item.pic?.startsWith('http') ? item.pic : `${UPLOAD_BASE}/equipment/${item.item_code || item.code}.jpg`}
                                                                        alt={item.name}
                                                                        className="max-w-full max-h-full object-contain p-2"
                                                                        onError={e => { e.target.onerror = null; e.target.src = '/lo.png'; }}
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="font-semibold text-gray-800 text-base leading-tight">{item.name}</span>
                                                                    <div className="flex items-center gap-2 mt-2">
                                                                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded-md">
                                                                            {item.item_code}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white font-bold text-lg rounded-full shadow-md">
                                                                    {item.quantity || 1}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan={3} className="p-12 text-center">
                                                                <div className="flex flex-col items-center gap-3">
                                                                    <CubeIcon className="w-12 h-12 text-gray-300" />
                                                                    <p className="text-gray-400 text-lg">ไม่พบข้อมูลครุภัณฑ์</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* บัตรนักศึกษา */}
                                <div>
                                    <SectionHeader
                                        title="บัตรนักศึกษา"
                                        icon={<PencilSquareIcon className="h-5 w-5 text-white" />}
                                    />
                                    <div className="bg-blue-100 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                                        <div className="p-6">
                                            {borrow.status === "approved" ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="mb-4 text-green-600 font-medium flex items-center">
                                                        <CheckCircleSolidIcon className="w-5 h-5 mr-2" />
                                                        <span>ได้รับการยืนยันแล้ว</span>
                                                    </div>
                                                    {(borrow.signature || signature) && (
                                                        <img
                                                            src={borrow.signature || signature}
                                                            alt="บัตรนักศึกษา"
                                                            className="h-40 border-2 border-blue-200 rounded-xl bg-white shadow-lg"
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    {signature ? (
                                                        <div className="flex flex-col items-center">
                                                            <img
                                                                src={signature}
                                                                alt="บัตรนักศึกษา"
                                                                className="h-40 border-2 border-blue-200 rounded-xl bg-white shadow-lg mb-4"
                                                            />
                                                            <button
                                                                onClick={() => setSignature(null)}
                                                                className="text-red-600 text-sm font-medium hover:text-red-800 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                                                            >
                                                                <XCircleIcon className="w-4 h-4" />
                                                                ลบบัตรนักศึกษา
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-center">
                                                            <button
                                                                onClick={() => {
                                                                    setCameraReady(false);
                                                                    setIsWebcamDialogOpen(true);
                                                                }}
                                                                type="button"
                                                                className="inline-flex items-center justify-center gap-3 px-6 py-3 border border-transparent text-sm font-medium rounded-2xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105 shadow-lg"
                                                            >
                                                                <CameraIcon className="h-5 w-5" />
                                                                ถ่ายภาพบัตรนักศึกษา
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* รูปถ่ายส่งมอบครุภัณฑ์ */}
                                <div>
                                    <SectionHeader
                                        title="รูปถ่ายส่งมอบครุภัณฑ์"
                                        icon={<CameraIcon className="h-5 w-5 text-white" />}
                                    />
                                    <div className="bg-green-100 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                                        <div className="p-6">
                                            {borrow.status === "approved" ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="mb-4 text-green-600 font-medium flex items-center">
                                                        <CheckCircleSolidIcon className="w-5 h-5 mr-2" />
                                                        <span>มีการถ่ายภาพส่งมอบแล้ว</span>
                                                    </div>
                                                    {(borrow.handover_photo || deliveryPhoto) && (
                                                        <img
                                                            src={borrow.handover_photo ?
                                                                (borrow.handover_photo.startsWith('data:') ?
                                                                    borrow.handover_photo :
                                                                    `${UPLOAD_BASE}/uploads/${borrow.handover_photo}`) :
                                                                deliveryPhoto}
                                                            alt="รูปถ่ายส่งมอบครุภัณฑ์"
                                                            className="h-40 w-60 object-cover border-2 border-blue-200 rounded-xl bg-white shadow-lg"
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    {deliveryPhoto ? (
                                                        <div className="flex flex-col items-center">
                                                            <img
                                                                src={deliveryPhoto}
                                                                alt="รูปถ่ายส่งมอบครุภัณฑ์"
                                                                className="h-40 w-60 object-cover border-2 border-blue-200 rounded-xl bg-white shadow-lg mb-4"
                                                            />
                                                            <button
                                                                onClick={() => setDeliveryPhoto(null)}
                                                                className="text-red-600 text-sm font-medium hover:text-red-800 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                                                            >
                                                                <XCircleIcon className="w-4 h-4" />
                                                                ลบรูปถ่าย
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-center">
                                                            <button
                                                                onClick={() => {
                                                                    setDeliveryPhotoCameraReady(false);
                                                                    setIsDeliveryPhotoDialogOpen(true);
                                                                }}
                                                                type="button"
                                                                className="inline-flex items-center justify-center gap-3 px-6 py-3 border border-transparent text-sm font-medium rounded-2xl text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105 shadow-lg"
                                                            >
                                                                <CameraIcon className="h-5 w-5" />
                                                                ถ่ายภาพส่งมอบครุภัณฑ์
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Footer */}
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 rounded-2xl">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            {/* Status info on left */}
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-full">
                                    <InformationCircleIcon className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">สถานะปัจจุบัน</p>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(borrow.status)}
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons on right */}
                            <div className="flex justify-end gap-3">
                                {borrow.status === "approved" ? (
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="btn bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-gray-400 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
                                    >
                                        ปิด
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="btn bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-gray-400 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
                                        >
                                            ยกเลิก
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDelivery}
                                            className={`btn text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-transparent ${
                                                isDeliveryButtonDisabled
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : 'bg-green-600 hover:bg-green-700'
                                            }`}
                                            disabled={isDeliveryButtonDisabled}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 bg-gray-200 border-transparent rounded-full animate-spin"></div>
                                                    กำลังดำเนินการ...
                                                </>
                                            ) : (
                                                <>
                                                    ยืนยันการส่งมอบ
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <WebcamSignatureDialog
                isOpen={isWebcamDialogOpen}
                onClose={() => {
                    setIsWebcamDialogOpen(false);
                    setCameraReady(false);
                }}
                onCapture={handleSignatureCaptured}
                webcamRef={webcamRef}
                cameraReady={cameraReady}
                setCameraReady={setCameraReady}
            />
            <WebcamSignatureDialog
                isOpen={isDeliveryPhotoDialogOpen}
                onClose={() => {
                    setIsDeliveryPhotoDialogOpen(false);
                    setDeliveryPhotoCameraReady(false);
                }}
                onCapture={handleDeliveryPhotoCaptured}
                webcamRef={deliveryPhotoWebcamRef}
                cameraReady={deliveryPhotoCameraReady}
                setCameraReady={setDeliveryPhotoCameraReady}
            />
        </div>
    );
};

export default EquipmentDeliveryDialog;