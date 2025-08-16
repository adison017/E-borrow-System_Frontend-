import {
    CameraIcon,
    CheckCircleIcon as CheckCircleSolidIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    DocumentCheckIcon,
    PencilSquareIcon,
    QuestionMarkCircleIcon,
    UserCircleIcon,
    XCircleIcon
} from "@heroicons/react/24/solid";
import { useEffect, useRef, useState } from "react";
import { MdClose } from "react-icons/md";
import WebcamSignatureDialog from "./WebcamSignatureDialog";
import DocumentViewer from '../../../components/DocumentViewer';

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
            console.log('DEBUG borrow object:', borrow);
            const id = borrow && (borrow.borrow_id || borrow.id);
            if (!id) {
                setIsSubmitting(false);
                alert('ไม่พบรหัสการยืม (borrow_id)');
                return;
            }
            await onConfirm({
                borrow_id: id,
                signature_image: signature, // ต้องเป็น base64 เท่านั้น
                handover_photo: deliveryPhoto // รูปถ่ายส่งมอบครุภัณฑ์
                // ไม่ต้องส่ง status เพราะ backend จะเปลี่ยนเป็น 'approved' อัตโนมัติ
            });
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const isDeliveryButtonDisabled = borrow.status === "approved" || isSubmitting || !signature || !deliveryPhoto;

    return (
        <div className="modal modal-open">
            <div className="modal-box bg-white rounded-xl shadow-xl w-full max-w-8xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2.5 rounded-lg shadow-sm">
                                <DocumentCheckIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">รายละเอียดการส่งมอบครุภัณฑ์</h2>
                                <div className="flex flex-wrap gap-2 mt-2">
                                   <span className="text-sm font-mono font-medium text-blue-600">รหัสการยืม: {borrow.borrow_code}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
                        >
                            <MdClose className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="space-y-6 lg:order-1">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <UserCircleIcon className="h-6 w-6 text-blue-600" />
                                    <h3 className="font-semibold text-gray-800">ข้อมูลผู้ยืม</h3>
                                </div>
                                <div className="flex flex-col items-center gap-4">
                                    {borrow.borrower?.avatar && (
                                        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                            <img
                                                src={borrow.borrower.avatar ? `http://localhost:5000/uploads/user/${borrow.borrower.avatar}` : '/profile.png'}
                                                alt={borrow.borrower.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="text-center">
                                        <p className="text-gray-500 "><span className="font-mono">{borrow.borrower.student_id}</span></p>
                                        <p className="font-bold text-lg text-gray-800">{borrow.borrower.name}</p>
                                        <p className="text-gray-500 ">{borrow.borrower.position}</p>
                                        <p className="text-gray-500 mt-1">{borrow.borrower.department}</p>
                                    </div>
                                </div>
                                <div className="mt-6 space-y-3">
                                    <div className="flex justify-between items-center bg-white px-4 py-2 rounded-full border border-gray-200">
                                        <span className="text-sm font-medium text-gray-600">รหัสการยืม</span>
                                        <span className="font-mono text-blue-700">{borrow.borrow_code}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white px-4 py-2 rounded-full border border-gray-200">
                                        <span className="text-sm font-medium text-gray-600">สถานะ</span>
                                        {getStatusBadge(borrow.status)}
                                    </div>
                                    <div className="flex justify-between items-center bg-white px-4 py-2 rounded-full border border-gray-200">
                                        <span className="text-sm font-medium text-gray-600">ระยะเวลายืม</span>
                                        <span className="font-semibold text-gray-800 text-right">{borrowDates}</span>
                                    </div>
                                </div>
                            </div>

                            {borrow.purpose && (
                                <div className={'rounded-xl p-5 space-y-3 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200'}>
                                    <div className="flex items-center gap-2">
                                        <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
                                        <h3 className={'font-semibold text-gray-800'}>
                                            วัตถุประสงค์การยืม
                                        </h3>
                                    </div>
                                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                                        <p className="text-gray-700 whitespace-pre-line">{borrow.purpose}</p>
                                    </div>
                                </div>
                            )}

                            {/* Important Documents Section */}
                            <DocumentViewer
                                documents={borrow.important_documents}
                                title="เอกสารสำคัญที่แนบ"
                            />
                        </div>

                        <div className="lg:col-span-2 space-y-6 lg:order-2">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                    รายการครุภัณฑ์ที่ส่งมอบ
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">รหัสการยืม:</span>
                                            <span className="font-mono text-gray-800 font-medium">{borrow.borrow_code}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">จำนวนครุภัณฑ์:</span>
                                            <span className="font-mono text-gray-800 font-medium">
                                                {borrow.equipment?.reduce((total, eq) => total + (eq.quantity || 1), 0) || 0} ชิ้น
                                            </span>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">รูป</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ครุภัณฑ์</th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">จำนวน</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {borrow.equipment?.map((item, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-2 py-3 align-middle text-center">
                                                            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mx-auto border border-gray-200 bg-white">
                                                                {item.image || item.pic ? (
                                                                    <img
                                                                        src={
                                                                            (item.image || item.pic)?.startsWith('http')
                                                                                ? (item.image || item.pic)
                                                                                : `http://localhost:5000/uploads/equipment/${item.item_code || item.code}.jpg`
                                                                        }
                                                                        alt={item.name}
                                                                        className="max-w-full max-h-full object-contain p-1"
                                                                        onError={e => {
                                                                            e.target.onerror = null;
                                                                            e.target.src = '/lo.png';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="bg-gray-100 w-full h-full flex items-center justify-center text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 align-middle">
                                                            <span className="font-semibold text-gray-800 text-base leading-tight">{item.name}</span>
                                                            <div className="text-xs text-gray-500 italic mt-1 leading-tight">
                                                                {item.code || item.item_code}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right align-middle"><span className="font-medium text-blue-700 text-base">{item.quantity || 1}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 shadow-sm space-y-4">
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><PencilSquareIcon className="w-5 h-5 text-blue-600" />บัตรนักศึกษา</h3>
                                    {borrow.status === "approved" ? (
                                        <div className="flex flex-col items-center">
                                            <div className="mb-2 text-green-600 font-medium flex items-center"><CheckCircleSolidIcon className="w-5 h-5 mr-1" /><span>ได้รับการยืนยันแล้ว</span></div>
                                            {(borrow.signature || signature) && <img src={borrow.signature || signature} alt="บัตรนักศึกษา" className="h-32 border border-gray-300 rounded-lg bg-white shadow-sm" />}
                                        </div>
                                    ) : (
                                        <>
                                            {signature ? (
                                                <div className="flex flex-col items-center">
                                                    <img src={signature} alt="บัตรนักศึกษา" className="h-32 border border-gray-300 rounded-lg bg-white shadow-sm mb-2" />
                                                    <button onClick={() => setSignature(null)} className="text-red-600 text-xs font-medium hover:text-red-800 flex items-center gap-1"><XCircleIcon className="w-4 h-4" />ลบบัตรนักศึกษา</button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => {
                                                            setCameraReady(false);
                                                            setIsWebcamDialogOpen(true);
                                                        }}
                                                        type="button"
                                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
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

                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 shadow-sm space-y-4">
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><CameraIcon className="w-5 h-5 text-green-600" />รูปถ่ายส่งมอบครุภัณฑ์</h3>
                                    {borrow.status === "approved" ? (
                                        <div className="flex flex-col items-center">
                                            <div className="mb-2 text-green-600 font-medium flex items-center"><CheckCircleSolidIcon className="w-5 h-5 mr-1" /><span>มีการถ่ายภาพส่งมอบแล้ว</span></div>
                                            {(borrow.handover_photo || deliveryPhoto) && (
                                                <img
                                                    src={borrow.handover_photo ?
                                                        (borrow.handover_photo.startsWith('data:') ?
                                                            borrow.handover_photo :
                                                            `http://localhost:5000/uploads/${borrow.handover_photo}`) :
                                                        deliveryPhoto}
                                                    alt="รูปถ่ายส่งมอบครุภัณฑ์"
                                                    className="h-32 w-48 object-cover border border-gray-300 rounded-lg bg-white shadow-sm"
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {deliveryPhoto ? (
                                                <div className="flex flex-col items-center">
                                                    <img src={deliveryPhoto} alt="รูปถ่ายส่งมอบครุภัณฑ์" className="h-32 w-48 object-cover border border-gray-300 rounded-lg bg-white shadow-sm mb-2" />
                                                    <button onClick={() => setDeliveryPhoto(null)} className="text-red-600 text-xs font-medium hover:text-red-800 flex items-center gap-1"><XCircleIcon className="w-4 h-4" />ลบรูปถ่าย</button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => {
                                                            setDeliveryPhotoCameraReady(false);
                                                            setIsDeliveryPhotoDialogOpen(true);
                                                        }}
                                                        type="button"
                                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-sm"
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

                    <div className="mt-8 flex justify-end space-x-3">
                        {borrow.status === "approved" ? (
                            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">ปิด</button>
                        ) : (
                            <>
                                <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">ยกเลิก</button>
                                <button type="button" onClick={handleDelivery} className={`inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${isDeliveryButtonDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`} disabled={isDeliveryButtonDisabled}>
                                    {isSubmitting ? (
                                        <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>กำลังดำเนินการ...</>
                                    ) : (
                                        <>ยืนยันการส่งมอบ</>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
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