// Environment-based API configuration
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/api`;
  }
  
  // สำหรับตอนนี้ใช้ localhost
  return 'http://localhost:5000/api';
};

const getUploadBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // สำหรับตอนนี้ใช้ localhost
  return 'http://localhost:5000';
};

export const API_BASE = getApiBaseUrl();
export const UPLOAD_BASE = getUploadBaseUrl();

// Helper function สำหรับ fetch API ที่แนบ JWT token
export function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = options.headers ? { ...options.headers } : {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
}

// Equipment
export const getEquipment = () => authFetch(`${API_BASE}/equipment`).then(res => {
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
});

// Upload image to Cloudinary and return URL
export const uploadImage = async (file, item_code) => {
  try {
    const formData = new FormData();
    formData.append("image", file);

    // ใช้ query parameter สำหรับ item_code
    const url = item_code
      ? `${API_BASE}/equipment/upload?item_code=${encodeURIComponent(item_code)}`
      : `${API_BASE}/equipment/upload`;

    const res = await authFetch(url, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json();
      if (import.meta.env.MODE !== 'production') console.error('[UPLOAD] Upload failed');
      throw new Error(errorData.error || 'Upload failed');
    }

    const data = await res.json();
    return data.url;
  } catch (error) {
    if (import.meta.env.MODE !== 'production') console.error('[UPLOAD] Upload error');
    throw error;
  }
};

export const addEquipment = (data) => {
  // Always use item_code as canonical identifier
  const payload = { ...data };
  if (!payload.item_code && (payload.id || payload.item_id)) payload.item_code = payload.id || payload.item_id;
  if (typeof payload.quantity === 'string') payload.quantity = Number(payload.quantity);
  if (typeof payload.price === 'string') payload.price = Number(payload.price);
  if (payload.price === '' || payload.price === null || isNaN(payload.price)) delete payload.price;
  if (!payload.purchaseDate) delete payload.purchaseDate;
  if (!payload.room_id) delete payload.room_id;
  return authFetch(`${API_BASE}/equipment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(res => res.json());
};

export const updateEquipment = (item_id, data) => {
  const payload = { ...data };

  return authFetch(`${API_BASE}/equipment/${item_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(res => {
    if (!res.ok) {
      return res.json().then(errorData => {
        if (import.meta.env.MODE !== 'production') console.error('updateEquipment error');
        throw new Error(`HTTP error! status: ${res.status}, message: ${errorData.error || errorData.message || 'Unknown error'}`);
      });
    }
    return res.json();
  });
};

export const deleteEquipment = (item_code) => authFetch(`${API_BASE}/equipment/${item_code}`, { method: "DELETE" }).then(res => res.json());

// Category
export const getCategories = () => authFetch(`${API_BASE}/category`).then(res => res.json());
export const addCategory = (data) => authFetch(`${API_BASE}/category`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(res => res.json());
export const updateCategory = (id, data) => authFetch(`${API_BASE}/category/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(res => res.json());
export const deleteCategory = (id) => authFetch(`${API_BASE}/category/${id}`, { method: "DELETE" }).then(res => res.json());

// Update equipment status
export const updateEquipmentStatus = (item_code, status) => {
  if (!item_code || typeof item_code !== 'string') throw new Error('item_code is required');
  const statusPayload = typeof status === 'object' && status.status ? status : { status };
  return authFetch(`${API_BASE}/equipment/${item_code}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(statusPayload),
  }).then(res => res.json());
};

// Borrow
export const getAllBorrows = () => authFetch(`${API_BASE}/borrows`).then(res => res.json());
export const getBorrowById = (id) => authFetch(`${API_BASE}/borrows/${id}`).then(res => res.json());

// Get repair requests by item_id
export const getRepairRequestsByItemId = (item_id) => {
  return authFetch(`${API_BASE}/repair-requests/item/${item_id}`)
    .then(res => res.json());
};

export const updateBorrowStatus = (borrow_id, status, rejection_reason, signature_image, handover_photo) => {
  const body = { status };
  if (rejection_reason !== undefined) body.rejection_reason = rejection_reason;
  if (signature_image !== undefined) body.signature_image = signature_image;
  if (handover_photo !== undefined) body.handover_photo = handover_photo;

  return authFetch(`${API_BASE}/borrows/${borrow_id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(res => res.json());
};

// Add this helper for news
export const getNews = async () => {
  const res = await authFetch(`${API_BASE}/news`);
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return null;
  }
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
};

// Room
export const getRooms = () => authFetch(`${API_BASE}/rooms`).then(res => res.json());

// News CRUD
export const createNews = async (payload) => {
  const res = await authFetch(`${API_BASE}/news`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Create news failed');
  return res.json();
};

export const updateNewsApi = async (id, payload) => {
  const res = await authFetch(`${API_BASE}/news/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Update news failed');
  return res.json();
};

export const deleteNewsApi = async (id) => {
  const res = await authFetch(`${API_BASE}/news/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete news failed');
  return res.json();
};