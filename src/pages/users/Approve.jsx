
import { useEffect, useState } from "react";
import BorrowingRequestDialog from "./dialogs/BorrowingRequestDialog";
import { authFetch } from '../../utils/api';

const RequirementList = () => {
  const [borrowList, setBorrowList] = useState([]);
  const [currentImageIndices, setCurrentImageIndices] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user info from localStorage
    const userStr = localStorage.getItem('user');
    let globalUserData = null;
    if (userStr) {
      try {
        globalUserData = JSON.parse(userStr);
      } catch (e) {}
    }
    const user_id = globalUserData?.user_id;
    if (!user_id) {
      setLoading(false);
      setBorrowList([]);
      return;
    }
    setLoading(true);
    authFetch(`http://localhost:5000/api/borrows?user_id=${user_id}`)
      .then(async res => {
        if (!res.ok) return [];
        try {
          const data = await res.json();
          // filter เฉพาะของ user_id และ status === 'carry' (อนุมัติแล้ว)
          if (Array.isArray(data)) {
            return data.filter(b => b.user_id == user_id && b.status === 'carry');
          }
          return [];
        } catch {
          return [];
        }
      })
      .then(data => {
        setBorrowList(data);
        setLoading(false);
      })
      .catch(() => {
        setBorrowList([]);
        setLoading(false);
      });
  }, []);


  const handleNext = (borrowId) => {
    setCurrentImageIndices(prev => {
      const currentIndex = prev[borrowId] || 0;
      const items = borrowList.find(req => req.borrow_id === borrowId)?.equipment || [];
      return {
        ...prev,
        [borrowId]: currentIndex === items.length - 1 ? 0 : currentIndex + 1
      };
    });
  };

  const openDialog = (request) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedRequest(null);
  };

  if (loading) return <div>Loading...</div>;

  // กรองเฉพาะ carry (อนุมัติแล้ว)
  const carryList = borrowList.filter(req => req.status === 'carry');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">รายการอนุมัติการยืมครุภัณฑ์</h1>
      <div className="space-y-6">
        {carryList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-green-100 rounded-full p-6 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-green-600 mb-2">ไม่พบรายการอนุมัติ</h3>
            <p className="text-gray-500 text-base">คุณไม่มีรายการอนุมัติในขณะนี้</p>
          </div>
        )}
        {carryList.map((request) => {
          const currentIndex = currentImageIndices[request.borrow_id] || 0;
          const items = request.equipment || [];
          const currentItem = items[currentIndex];
          const total = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
          return (
            <div key={request.borrow_id} className="card bg-white shadow-xl overflow-hidden ">
              <div className="flex flex-col md:flex-row">
                {/* Image Carousel Section */}
                <div className="relative group md:w-1/3 w-full h-full md:h-auto flex items-center justify-center transition-transform duration-300 hover:scale-[1.01]">
                  <div>
                    <img
                      src={currentItem?.pic || "https://via.placeholder.com/500?text=No+Image"}
                      alt={currentItem?.name || "ครุภัณฑ์"}
                      className="object-cover w-90 h-full md:max-h-80 md:max-w-90"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/500?text=No+Image";
                      }}
                    />
                    {/* Navigation Arrows - Right Side */}
                    <div className="absolute right-0 top-0 h-full w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNext(request.borrow_id);
                        }}
                        className="h-full w-full bg-black/20 hover:bg-black/30 flex items-center justify-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                {/* Content section */}
                <div className="md:w-2/3 w-full">
                  <div className="card-body p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:justify-between justify-center md:items-start items-center gap-2">
                      <h2 className="card-title text-gray-800 text-lg md:text-xl">
                        {request.borrow_code}
                      </h2>
                      <div className={`badge badge-success text-white md:text-base px-4 py-4 rounded-full text-sm font-medium`}>
                        อนุมัติแล้ว
                      </div>
                    </div>
                    <div className="my-4">
                      <h3 className="font-semibold text-gray-700 mb-1">เหตุผลการขอยืม</h3>
                      <p className="text-gray-600 text-sm md:text-base">{request.purpose || '-'}</p>
                    </div>
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-700 mb-2">รายการครุภัณฑ์</h3>
                      <div className="flex flex-wrap gap-2">
                        {items.map((item, index) => (
                          <span
                            key={item.item_id}
                            className={`px-3 py-1 rounded-full text-xs md:text-sm ${
                              index === currentIndex
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {item.name} ({item.quantity} {item.quantity > 1 ? 'เครื่อง' : 'ชุด'})
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4 grid grid-cols-2 gap-4 ">
                      <div className="bg-gray-100 px-4 py-4 rounded-lg text-sm font-medium">
                        <h3 className="font-semibold text-gray-700 mb-1">วันที่ยืม</h3>
                        <p className="text-gray-600 text-sm md:text-base">{request.borrow_date ? new Date(request.borrow_date).toLocaleDateString() : '-'}</p>
                      </div>
                      <div className="bg-gray-100 px-4 py-4 rounded-lg text-sm font-medium">
                        <h3 className="font-semibold text-gray-700 mb-1">วันที่ครบกำหนดคืน</h3>
                        <p className="text-gray-600 text-sm md:text-base">{request.due_date ? new Date(request.due_date).toLocaleDateString() : '-'}</p>
                      </div>
                    </div>
                    {/* Footer */}
                    <div className="pt-4 border-t border-gray-200 mt-auto">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-gray-700 font-medium text-sm md:text-base">
                          รวมทั้งหมด {total} ชิ้น
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                          <button
                            className="btn btn-outline btn-sm md:btn-md flex-2 md:flex-none rounded-xl hover:bg-green-600 hover:border-green-500 border-gray-200 bg-gray-200 transition-colors"
                            onClick={() => openDialog(request)}
                          >
                            รับครุภัณฑ์
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Dialog for showing details */}
              {isDialogOpen && selectedRequest?.borrow_id === request.borrow_id && (
                <BorrowingRequestDialog
                  request={selectedRequest}
                  onClose={closeDialog}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RequirementList;