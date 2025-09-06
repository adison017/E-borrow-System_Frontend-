import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// // ลดการพิมพ์ log ที่อาจรบกวน/เผยข้อมูลใน production
// if (import.meta.env.MODE === 'production') {
//   const noop = () => {};
//   // เก็บเฉพาะ error จริงไว้
//   console.log = noop;
//   console.debug = noop;
//   console.info = noop;
//   console.warn = noop; // ถ้าต้องการเก็บ warn ไว้ คอมเมนต์บรรทัดนี้
// }

// // กลบดัก error จากส่วนขยายที่ไม่เกี่ยวข้องกับระบบ
// window.addEventListener('unhandledrejection', (e) => {
//   const r = e?.reason;
//   if (r?.code === 403 && r?.httpStatus === 200 && r?.name === 'i') {
//     e.preventDefault();
//   }
// });

const router = createBrowserRouter([
  { path: '*', element: <App /> },
], {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_skipActionErrorRevalidation: true,
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
  </StrictMode>,
)
