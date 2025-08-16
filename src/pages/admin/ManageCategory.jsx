import {
  MagnifyingGlassIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import {
  PencilIcon,
} from "@heroicons/react/24/solid";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  IconButton,
  ThemeProvider,
  Tooltip,
  Typography
} from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { addCategory, deleteCategory, getCategories, updateCategory } from "../../utils/api";
import AddCategoryDialog from "./dialog/AddCategoryDialog";
import DeleteCategoryDialog from "./dialog/DeleteCategoryDialog";
import EditCategoryDialog from "./dialog/EditCategoryDialog";

// Theme configuration
const theme = {
  typography: {
    defaultProps: {
      color: "#374151", // Dark Gray for text
      textGradient: false,
    },
  }
};

const TABLE_HEAD = [
  "รหัสหมวดหมู่",
  "ชื่อหมวดหมู่",
  "จัดการ"
];

function ManageCategory() {
  const [categoryList, setCategoryList] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  // ลบ state notification เดิม (ใช้ react-toastify แทน)

  const [editFormData, setEditFormData] = useState({
    category_id: "",
    category_code: "",
    name: ""
  });

  const [addFormData, setAddFormData] = useState({
    category_code: "",
    name: ""
  });

  const [searchTerm, setSearchTerm] = useState("");
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    getCategories().then(setCategoryList);
  }, []);

  // ฟังก์ชันกลางสำหรับแจ้งเตือน (รวมคำอธิบาย)
  const showNotification = (action, name = "") => {
    let message = "";
    let type = "success";
    switch (action) {
      case "add":
        message = `เพิ่มหมวดหมู่${name ? ` ${name}` : ""} เรียบร้อยแล้ว`;
        type = "success";
        break;
      case "edit":
        message = `แก้ไขหมวดหมู่${name ? ` ${name}` : ""} เรียบร้อยแล้ว`;
        type = "success";
        break;
      case "delete":
        message = `ลบหมวดหมู่${name ? ` ${name}` : ""} เรียบร้อยแล้ว`;
        type = "success";
        break;
      case "add_error":
        message = "เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่";
        type = "error";
        break;
      case "edit_error":
        message = "เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่";
        type = "error";
        break;
      case "delete_error":
        message = "เกิดข้อผิดพลาดในการลบหมวดหมู่";
        type = "error";
        break;
      default:
        message = action;
        type = "info";
    }
    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else {
      toast.info(message);
    }
  };

  const handleDeleteClick = (category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteCategory(selectedCategory.category_id)
      .then(() => getCategories().then(setCategoryList))
      .then(() => showNotification("delete", selectedCategory.name))
      .catch(() => showNotification("delete_error"));
    setDeleteDialogOpen(false);
    setSelectedCategory(null);
  };

  const handleEditClick = (category) => {
    setSelectedCategory(category);
    setEditFormData({
      category_id: category.category_id,
      category_code: category.category_code,
      name: category.name
    });
    setEditDialogOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveEdit = () => {
    updateCategory(editFormData.category_id, editFormData)
      .then(() => getCategories().then(setCategoryList))
      .then(() => showNotification("edit", editFormData.name))
      .catch(() => showNotification("edit_error"));
    setEditDialogOpen(false);
  };

  const handleAddClick = () => {
    const newCode = `CAT-${String(categoryList.length + 1).padStart(3, '0')}`;
    setAddFormData({
      category_code: newCode,
      name: ""
    });
    setAddDialogOpen(true);
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setAddFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddCategory = (data) => {
    // ตรวจสอบชื่อหมวดหมู่ซ้ำ (case-insensitive)
    const isDuplicate = categoryList.some(cat => cat.name.trim().toLowerCase() === data.name.trim().toLowerCase());
    if (isDuplicate) {
      showNotification('add_error', 'หมวดหมู่นี้มีอยู่แล้ว');
      toast.error('หมวดหมู่นี้มีอยู่แล้ว');
      return;
    }
    addCategory(data)
      .then(() => getCategories().then(setCategoryList))
      .then(() => showNotification("add", data.name))
      .catch(() => showNotification("add_error"));
  };

  const handleEditCategory = (data) => {
    updateCategory(data.category_id, data)
      .then(() => getCategories().then(setCategoryList))
      .then(() => showNotification("edit", data.name))
      .catch(() => showNotification("edit_error"));
  };

  const handleDeleteCategory = (category) => {
    deleteCategory(category.category_id)
      .then(() => getCategories().then(setCategoryList))
      .then(() => showNotification("delete", category.name))
      .catch(() => showNotification("delete_error"));
  };

  const filteredCategories = categoryList.filter(
    category =>
      (category.category_code && String(category.category_code).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (category.name && category.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset to first page when search or list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryList.length]);

  return (
    <ThemeProvider value={theme}>
      <Card className="h-full w-full text-gray-800 rounded-2xl shadow-lg">
        <CardHeader floated={false} shadow={false} className="rounded-t-2xl bg-white px-8 py-6">
          <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <Typography variant="h5" className="text-gray-900 font-semibold tracking-tight">
                รายการหมวดหมู่
              </Typography>
              <Typography color="gray" className="mt-1 font-normal text-sm text-gray-600">
                จัดการข้อมูลหมวดหมู่ทั้งหมด
              </Typography>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-y-4 md:gap-x-4">
            <div className="w-full md:flex-grow relative">
              <label htmlFor="search" className="sr-only">ค้นหาหมวดหมู่</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="search"
                  type="text"
                  className="w-full h-10 pl-10 pr-4 py-2.5 border border-gray-300 rounded-2xl text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm placeholder-gray-400"
                  placeholder="ค้นหารหัส, ชื่อ หรือคำอธิบาย..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-shrink-0 gap-x-3 w-full md:w-auto justify-start md:justify-end">
              <Button variant="outlined" className="border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm rounded-xl flex items-center gap-2 px-4 py-2 text-sm font-medium normal-case">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm7.586 2.586L14.5 7H12V4.5h.086ZM11 10a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5A.75.75 0 0 1 11 10Z" clipRule="evenodd" />
                </svg>
                ส่งออก Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <div className="overflow-x-auto rounded-2xl">
            <table className="min-w-full divide-y divide-gray-200 text-lg">
              <thead className="bg-gradient-to-r from-indigo-950 to-blue-700">
                <tr>
                  {TABLE_HEAD.map((head, index) => (
                    <th
                      key={head}
                      className={`px-5 py-3 text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap ${
                        index === 0 ? "w-32 text-left" : // รหัสหมวดหมู่
                        index === 1 ? "w-48 text-left" : // ชื่อหมวดหมู่
                        index === 2 ? "w-32 text-center" : ""
                      }`}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedCategories.length > 0 ? (
                  paginatedCategories.map(({ category_id, category_code, name, created_at }, index) => (
                    <tr key={category_id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="w-32 px-3 py-3 whitespace-nowrap  font-bold  text-left">{category_code}</td>
                      <td className="w-48 px-3 py-3 whitespace-nowrap text-gray-700 text-left">{name}</td>
                      <td className="w-32 px-3 py-3 whitespace-nowrap text-center">
                        <div className="flex gap-2 justify-center">
                          <Tooltip content="แก้ไข">
                            <IconButton
                              variant="text"
                              color="amber"
                              className="bg-amber-50 hover:bg-amber-100 shadow-sm transition-all duration-200"
                              onClick={() => handleEditClick({ category_id, category_code, name })}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip content="ลบ">
                            <IconButton
                              variant="text"
                              color="red"
                              className="bg-red-50 hover:bg-red-100 shadow-sm transition-all duration-200"
                              onClick={e => { e.stopPropagation(); handleDeleteClick({ category_id, category_code, name }); }}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={TABLE_HEAD.length} className="px-6 py-16 text-center">
                      <div className="inline-flex items-center justify-center p-5 bg-gray-100 rounded-full mb-5">
                        <MagnifyingGlassIcon className="w-12 h-12 text-gray-400" />
                      </div>
                      <Typography variant="h6" className="text-gray-700 font-medium mb-1">
                        ไม่พบข้อมูลหมวดหมู่
                      </Typography>
                      <Typography color="gray" className="text-sm text-gray-500">
                        ลองปรับคำค้นหาหรือตัวกรองของคุณ
                      </Typography>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 p-6 bg-white rounded-b-2xl">
          <Typography variant="small" className="font-normal text-gray-600 mb-3 sm:mb-0 text-sm">
            แสดง {filteredCategories.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage + 1)} ถึง {filteredCategories.length === 0 ? 0 : Math.min(currentPage * itemsPerPage, filteredCategories.length)} จากทั้งหมด {filteredCategories.length} รายการ
          </Typography>
          <div className="flex gap-2">
            <Button
              variant="outlined"
              size="sm"
              className="text-gray-700 border-gray-300 hover:bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium normal-case"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              ก่อนหน้า
            </Button>
            <span className="text-gray-700 text-sm px-2 py-1">{currentPage} / {totalPages || 1}</span>
            <Button
              variant="outlined"
              size="sm"
              className="text-gray-700 border-gray-300 hover:bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium normal-case"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              ถัดไป
            </Button>
          </div>
        </CardFooter>
        {/* Notification Component (react-toastify) */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
        {/* Delete Confirmation Modal */}
        <DeleteCategoryDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          selectedCategory={selectedCategory}
          onConfirm={confirmDelete}
        />
        {/* Edit Dialog Modal */}
        <EditCategoryDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          categoryData={selectedCategory}
          onSave={handleEditCategory}
        />
        {/* Add Category Dialog Modal */}
        <AddCategoryDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          initialFormData={{
            category_code: `CAT-${String(categoryList.length + 1).padStart(3, '0')}`,
            name: ""
          }}
          onSave={handleAddCategory}
        />
      </Card>
      {/* Floating Add Category Button */}
      <Tooltip content="เพิ่มหมวดหมู่" placement="left">
        <button
          onClick={handleAddClick}
          className="fixed bottom-8 right-8 z-[60] border-black bg-black/70 hover:bg-white hover:border-2 hover:border-black hover:text-black text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          aria-label="เพิ่มหมวดหมู่"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.75v14.5m7.25-7.25H4.75" />
          </svg>
        </button>
      </Tooltip>
    </ThemeProvider>
  );
}

export default ManageCategory;