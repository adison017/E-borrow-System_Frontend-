import React, { useState, useEffect } from "react";
import {
  CurrencyDollarIcon,
  WrenchIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon
} from "@heroicons/react/24/outline";
import { API_BASE, authFetch } from '../../utils/api';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import * as XLSX from 'xlsx';

const ExpenseManagement = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Add quick filter state
  const [quickFilter, setQuickFilter] = useState(""); // today, week, month

  // Fetch all expenses (fines and repair costs)
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      // Fetch fines data
      const finesRes = await authFetch(`${API_BASE}/returns/summary`);
      const finesData = await finesRes.json();
      
      // Ensure finesData is an array
      const validFinesData = Array.isArray(finesData) ? finesData : [];
      
      // Fetch repair costs data
      const repairsRes = await authFetch(`${API_BASE}/repair-requests/history`);
      const repairsData = await repairsRes.json();
      
      // Ensure repairsData is an array
      const validRepairsData = Array.isArray(repairsData) ? repairsData : [];
      
      // Process fines data - only include items with amount > 0
      const processedFines = validFinesData
        .map(fine => {
          // Ensure numeric values are properly parsed
          const damageFine = parseFloat(fine.damage_fine) || 0;
          const lateFine = parseFloat(fine.late_fine) || 0;
          const amount = damageFine + lateFine;
          
          // Determine payment method display text
          let paymentMethodText = "";
          if (fine.payment_method === "cash") {
            paymentMethodText = "เงินสด";
          } else if (fine.payment_method === "transfer" || fine.payment_method === "online") {
            paymentMethodText = "โอนเงิน";
          } else {
            paymentMethodText = "ไม่ระบุ";
          }
          
          return {
            id: `fine-${fine.borrow_id}`,
            type: "fine",
            category: "ค่าปรับ",
            amount: amount,
            description: `ค่าปรับจากการยืม ${fine.borrow_code || ''}`,
            date: fine.return_date || fine.created_at,
            status: fine.pay_status || "pending",
            reference: fine.borrow_code || '',
            borrower: fine.borrower ? fine.borrower.name : "ไม่ระบุ",
            details: {
              damageFine: damageFine,
              lateFine: lateFine,
              lateDays: fine.late_days || 0,
              // Add the person who reported the fine (return_by)
              reportedBy: fine.return_by_name || null,
              // Add payment method
              paymentMethod: paymentMethodText
            }
          };
        })
        .filter(fine => fine.amount > 0); // Only include fines with amount > 0
      
      // Process repair data - exclude rejected items and only include items with amount > 0
      const processedRepairs = validRepairsData
        .map(repair => {
          // Ensure numeric values are properly parsed
          const budget = parseFloat(repair.budget);
          const estimatedCost = parseFloat(repair.estimated_cost);
          // Use estimated_cost if available and valid, otherwise fallback to budget
          const amount = (!isNaN(estimatedCost) && estimatedCost > 0) ? estimatedCost : 
                        (!isNaN(budget) && budget > 0) ? budget : 0;
          
          return {
            id: `repair-${repair.id}`,
            type: "repair",
            category: "ค่าซ่อม",
            // Use estimated_cost if available (approved cost), otherwise fallback to budget
            amount: amount,
            description: `ค่าซ่อม ${repair.equipment_name || repair.problem_description || ''}`,
            date: repair.request_date,
            status: repair.status,
            reference: repair.repair_code || '',
            borrower: repair.requester_name || "ไม่ระบุ",
            details: {
              equipment: repair.equipment_name || '',
              problem: repair.problem_description || '',
              responsiblePerson: repair.responsible_person || '',
              // Show approved cost as estimated_cost and estimated cost as budget
              approvedCost: !isNaN(estimatedCost) && estimatedCost > 0 ? estimatedCost : null,
              estimatedCost: !isNaN(budget) && budget > 0 ? budget : null
            }
          };
        })
        .filter(repair => repair.amount > 0 && repair.status !== "rejected"); // Only include repairs with amount > 0 and not rejected
      
      // Combine and sort by date (newest first)
      const allExpenses = [...processedFines, ...processedRepairs].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      
      setExpenses(allExpenses);
      setFilteredExpenses(allExpenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      // Set empty arrays on error to prevent UI issues
      setExpenses([]);
      setFilteredExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);
  
  // Add helper functions for date calculations
  const getTodayRange = () => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    return { start: todayString, end: todayString };
  };

  const getWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Monday as start of week
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return {
      start: startOfWeek.toISOString().split('T')[0],
      end: endOfWeek.toISOString().split('T')[0]
    };
  };

  const getMonthRange = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    return {
      start: startOfMonth.toISOString().split('T')[0],
      end: endOfMonth.toISOString().split('T')[0]
    };
  };

  // Add function to apply quick filters
  const applyQuickFilter = (filterType) => {
    setQuickFilter(filterType);
    setCurrentPage(1); // Reset to first page
    
    switch (filterType) {
      case "today":
        setDateRange(getTodayRange());
        break;
      case "week":
        setDateRange(getWeekRange());
        break;
      case "month":
        setDateRange(getMonthRange());
        break;
      default:
        setDateRange({ start: "", end: "" });
    }
  };

  // Filter expenses based on active tab, search term, and date range
  useEffect(() => {
    let result = expenses;
    
    // Filter by type
    if (activeTab !== "all") {
      result = result.filter(expense => expense.type === activeTab);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(expense => 
        expense.reference.toLowerCase().includes(term) ||
        expense.borrower.toLowerCase().includes(term) ||
        expense.description.toLowerCase().includes(term) ||
        (expense.details.equipment && expense.details.equipment.toLowerCase().includes(term))
      );
    }
    
    // Filter by date range
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      // Set end date to end of day
      endDate.setHours(23, 59, 59, 999);
      
      result = result.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      });
    }
    
    setFilteredExpenses(result);
  }, [activeTab, searchTerm, dateRange, expenses]);
  
  const formatCurrency = (amount) => {
    // Handle null, undefined, or non-numeric values
    if (amount === null || amount === undefined || amount === '') {
      return '฿0.00';
    }
    
    // Convert to number if it's a string
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Check if it's a valid number
    if (isNaN(numericAmount) || !isFinite(numericAmount)) {
      return '฿0.00';
    }
    
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(numericAmount);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMM yyyy', { locale: th });
    } catch (error) {
      return "-";
    }
  };
  
  const getStatusBadge = (status, type) => {
    if (type === "fine") {
      switch (status) {
        case "paid":
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircleIcon className="mr-1.5 h-4 w-4" />
              ชำระแล้ว
            </span>
          );
        case "pending":
        case "awaiting_payment":
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <ClockIcon className="mr-1.5 h-4 w-4" />
              รอชำระ
            </span>
          );
        case "failed":
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <XCircleIcon className="mr-1.5 h-4 w-4" />
              ชำระไม่สำเร็จ
            </span>
          );
        default:
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {status}
            </span>
          );
      }
    } else {
      switch (status) {
        case "completed":
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircleIcon className="mr-1.5 h-4 w-4" />
              เสร็จสิ้น
            </span>
          );
        case "approved":
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <CheckCircleIcon className="mr-1.5 h-4 w-4" />
              กำลังซ่อม
            </span>
          );
        case "rejected":
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <XCircleIcon className="mr-1.5 h-4 w-4" />
              ปฏิเสธ
            </span>
          );
        case "incomplete":
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <ExclamationTriangleIcon className="mr-1.5 h-4 w-4" />
              ไม่สมบูรณ์
            </span>
          );
        default:
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {status}
            </span>
          );
      }
    }
  };
  
  const getCategoryIcon = (category) => {
    if (category === "ค่าปรับ") {
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    } else {
      return <WrenchIcon className="h-5 w-5 text-blue-500" />;
    }
  };
  
  // Calculate totals for summary cards
  const totalFines = Array.isArray(expenses) 
    ? expenses
        .filter(e => e.type === "fine" && e.amount > 0)
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
    : 0;
    
  const totalRepairs = Array.isArray(expenses) 
    ? expenses
        .filter(e => e.type === "repair" && e.amount > 0 && e.status !== "rejected")
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
    : 0;
  
  const getTotalAmount = () => {
    return filteredExpenses.reduce((total, expense) => total + expense.amount, 0);
  };
  
  // Calculate filtered totals for summary cards
  const filteredFines = Array.isArray(filteredExpenses) 
    ? filteredExpenses
        .filter(e => e.type === "fine" && e.amount > 0)
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
    : 0;
    
  const filteredRepairs = Array.isArray(filteredExpenses) 
    ? filteredExpenses
        .filter(e => e.type === "repair" && e.amount > 0 && e.status !== "rejected")
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
    : 0;
  
  // Add export to Excel function
  const exportToExcel = () => {
    // Prepare data for export
    const exportData = filteredExpenses.map(expense => {
      // Format status for export
      let statusText = "";
      if (expense.type === "fine") {
        switch (expense.status) {
          case "paid": statusText = "ชำระแล้ว"; break;
          case "pending": case "awaiting_payment": statusText = "รอชำระ"; break;
          case "failed": statusText = "ชำระไม่สำเร็จ"; break;
          default: statusText = expense.status;
        }
      } else {
        switch (expense.status) {
          case "completed": statusText = "เสร็จสิ้น"; break;
          case "approved": statusText = "กำลังซ่อม"; break;
          case "rejected": statusText = "ปฏิเสธ"; break;
          case "incomplete": statusText = "ไม่สมบูรณ์"; break;
          default: statusText = expense.status;
        }
      }
      
      const rowData = {
        "ประเภท": expense.category,
        "รหัสอ้างอิง": expense.reference || "-",
        "คำอธิบาย": expense.description,
        "ผู้ยืม/ผู้แจ้ง": expense.borrower,
        "วันที่": formatDate(expense.date),
        "จำนวนเงิน": expense.amount,
        "สถานะ": statusText
      };
      
      // Add fine-specific columns if it's a fine
      if (expense.type === "fine") {
        rowData["ค่าเสียหาย"] = expense.details.damageFine > 0 ? expense.details.damageFine : 0;
        rowData["ค่าล่าช้า"] = expense.details.lateFine > 0 ? expense.details.lateFine : 0;
        rowData["จำนวนวันล่าช้า"] = expense.details.lateDays || 0;
        rowData["ช่องทางชำระ"] = expense.details.paymentMethod || "-";
        if (expense.details.reportedBy) {
          rowData["ผู้แจ้ง"] = expense.details.reportedBy;
        }
      }
      
      // Add repair-specific columns if it's a repair
      if (expense.type === "repair") {
        if (expense.details.equipment) {
          rowData["ครุภัณฑ์"] = expense.details.equipment;
        }
        if (expense.details.problem) {
          rowData["ปัญหา"] = expense.details.problem;
        }
        if (expense.details.approvedCost) {
          rowData["ราคาอนุมัติ"] = expense.details.approvedCost;
        }
        if (expense.details.estimatedCost) {
          rowData["ราคาประเมิน"] = expense.details.estimatedCost;
        }
        if (expense.details.responsiblePerson) {
          rowData["ผู้รับผิดชอบ"] = expense.details.responsiblePerson;
        }
      }
      
      return rowData;
    });
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "รายงานค่าใช้จ่าย");
    
    // Export to file
    XLSX.writeFile(wb, "รายงานค่าใช้จ่าย.xlsx");
  };

  return (
    <div className="container mx-auto max-w-8xl p-4 sm:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 sm:mb-6 gap-4">
        <div className="flex items-center gap-3">
          <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">จัดการค่าใช้จ่าย</h1>
            <p className="text-gray-500 text-sm">ติดตามและจัดการค่าปรับและค่าซ่อมครุภัณฑ์</p>
          </div>
        </div>
        {/* Export Button */}
        <button
          onClick={exportToExcel}
          disabled={loading || filteredExpenses.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors w-full md:w-auto justify-center ${
            loading || filteredExpenses.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          ส่งออก Excel
        </button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="bg-yellow-600 rounded-2xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm sm:text-base">ค่าปรับทั้งหมด</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">
                {formatCurrency(filteredFines)}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-2 sm:p-3">
              <ExclamationTriangleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm sm:text-base">ค่าซ่อมทั้งหมด</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">
                {formatCurrency(filteredRepairs)}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-2 sm:p-3">
              <WrenchIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-gray-100 rounded-2xl shadow-sm p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Tab Filters */}
          <div className="flex flex-wrap gap-1 bg-gray-200 p-1 rounded-full w-full sm:w-auto justify-center sm:justify-start">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors min-w-[60px] sm:min-w-0 ${
                activeTab === "all"
                  ? "bg-white text-blue-600 shadow"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setActiveTab("fine")}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors min-w-[60px] sm:min-w-0 ${
                activeTab === "fine"
                  ? "bg-white text-yellow-600 shadow"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ค่าปรับ
            </button>
            <button
              onClick={() => setActiveTab("repair")}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors min-w-[60px] sm:min-w-0 ${
                activeTab === "repair"
                  ? "bg-white text-blue-600 shadow"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ค่าซ่อม
            </button>
          </div>
          
          {/* Search and Date Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-grow items-center">
            {/* Search */}
            <div className="relative flex-grow items-center">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="ค้นหาด้วยรหัส, ชื่อผู้ยืม, หรือคำอธิบาย..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
              />
            </div>
            
            {/* Date Range and Quick Filters Column */}
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              {/* Date Range */}
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <div className="relative">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => {
                      setDateRange({...dateRange, start: e.target.value});
                      setQuickFilter(""); // Clear quick filter when manual date is selected
                    }}
                    className="rounded-full block w-28 px-2 py-1.5 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  />
                </div>
                <span className="text-gray-500 text-xs">ถึง</span>
                <div className="relative">
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => {
                      setDateRange({...dateRange, end: e.target.value});
                      setQuickFilter(""); // Clear quick filter when manual date is selected
                    }}
                    className="block w-28 px-2 py-1.5 text-xs border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    onClick={(e) => e.target.showPicker && e.target.showPicker() }
                  />
                </div>
              </div>
              
              {/* Quick Date Filters */}
              <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
                <button
                  onClick={() => applyQuickFilter("")}
                  className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                    quickFilter === ""
                      ? "bg-white text-gray-600 shadow"
                      : "text-gray-500 hover:text-gray-700 bg-gray-200"
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => applyQuickFilter("today")}
                  className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                    quickFilter === "today"
                      ? "bg-white text-blue-600 shadow"
                      : "text-gray-500 hover:text-gray-700 bg-gray-200"
                  }`}
                >
                  วันนี้
                </button>
                <button
                  onClick={() => applyQuickFilter("week")}
                  className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                    quickFilter === "week"
                      ? "bg-white text-blue-600 shadow"
                      : "text-gray-500 hover:text-gray-700 bg-gray-200"
                  }`}
                >
                  สัปดาห์นี้
                </button>
                <button
                  onClick={() => applyQuickFilter("month")}
                  className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                    quickFilter === "month"
                      ? "bg-white text-blue-600 shadow"
                      : "text-gray-500 hover:text-gray-700 bg-gray-200"
                  }`}
                >
                  เดือนนี้
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Expenses Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3 sm:mb-4"></div>
            <p className="text-gray-500 text-sm sm:text-base">กำลังโหลดข้อมูล...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <MagnifyingGlassIcon className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-1">ไม่พบรายการค่าใช้จ่าย</h3>
            <p className="text-gray-500 text-sm sm:text-base">ลองเปลี่ยนตัวกรองหรือคำค้นหา</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    ประเภท
                  </th>
                  <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    รหัสอ้างอิง
                  </th>
                  <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    คำอธิบาย
                  </th>
                  {(activeTab === "all" || activeTab === "fine") && (
                    <>
                      <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        ค่าเสียหาย
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        ค่าล่าช้า
                      </th>
                    </>
                  )}
                  {(activeTab === "all" || activeTab === "repair") && (
                    <>
                      <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        ราคาอนุมัติ
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        ราคาประเมิน
                      </th>
                    </>
                  )}
                  <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    ผู้ยืม/ผู้แจ้ง
                  </th>
                  {(activeTab === "all" || activeTab === "fine") && (
                    <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      ช่องทางชำระ
                    </th>
                  )}
                  <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    วันที่
                  </th>
                  <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    จำนวนเงิน
                  </th>
                  <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    สถานะ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          {getCategoryIcon(expense.category)}
                        </div>
                        <div className="ml-2 sm:ml-4">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{expense.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">{expense.reference || "-"}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 max-w-xs">
                      <div className="text-xs sm:text-sm text-gray-900">{expense.description}</div>
                      {expense.type === "repair" && (
                        <div className="text-xs text-gray-500 mt-1">
                          {expense.details.problem && (
                            <div className="mt-1">
                              ปัญหา: {expense.details.problem}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    {(activeTab === "all" || activeTab === "fine") && (
                      <>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-900">
                            {expense.type === "fine" ? (expense.details.damageFine > 0 ? formatCurrency(expense.details.damageFine) : "-") : "-"}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-900">
                            {expense.type === "fine" ? (expense.details.lateFine > 0 ? formatCurrency(expense.details.lateFine) : "-") : "-"}
                          </div>
                        </td>
                      </>
                    )}
                    {(activeTab === "all" || activeTab === "repair") && (
                      <>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-900">
                            {expense.type === "repair" && expense.details.approvedCost && expense.details.approvedCost > 0 ? formatCurrency(expense.details.approvedCost) : "-"}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-900">
                            {expense.type === "repair" && expense.details.estimatedCost && expense.details.estimatedCost > 0 ? formatCurrency(expense.details.estimatedCost) : "-"}
                          </div>
                        </td>
                      </>
                    )}
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-900">{expense.borrower}</div>
                      {expense.type === "fine" && expense.details.reportedBy && (
                        <div className="text-xs text-gray-500 mt-1">ผู้แจ้ง: {expense.details.reportedBy}</div>
                      )}
                      {expense.type === "repair" && expense.details.responsiblePerson && (
                        <div className="text-xs text-gray-500 mt-1">ผู้รับผิดชอบ: {expense.details.responsiblePerson}</div>
                      )}
                    </td>
                    {(activeTab === "all" || activeTab === "fine") && (
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-900">
                          {expense.type === "fine" ? expense.details.paymentMethod || "-" : "-"}
                        </div>
                      </td>
                    )}
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">{formatCurrency(expense.amount)}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {getStatusBadge(expense.status, expense.type)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {filteredExpenses.length > 0 && (
                <tfoot className="bg-gray-100 w-full">
                  <tr>
                    <td colSpan="12" className="px-4 py-3 sm:px-6">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-gray-500">แสดง</span>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1); // Reset to first page when changing items per page
                            }}
                            className="rounded-full border-gray-300 text-xs focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={filteredExpenses.length}>ทั้งหมด</option>
                          </select>
                          <span className="text-xs text-gray-500">รายการ</span>
                          <span className="text-xs text-gray-500 ml-2">
                            หน้า {currentPage} จาก {Math.ceil(filteredExpenses.length / itemsPerPage)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 text-xs rounded-full ${
                              currentPage === 1 
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            ก่อนหน้า
                          </button>
                          <span className="text-xs text-gray-500">
                            {Math.min((currentPage - 1) * itemsPerPage + 1, filteredExpenses.length)}-
                            {Math.min(currentPage * itemsPerPage, filteredExpenses.length)} จาก {filteredExpenses.length}
                          </span>
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredExpenses.length / itemsPerPage)))}
                            disabled={currentPage === Math.ceil(filteredExpenses.length / itemsPerPage)}
                            className={`px-3 py-1 text-xs rounded-full ${
                              currentPage === Math.ceil(filteredExpenses.length / itemsPerPage)
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            ถัดไป
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseManagement;
