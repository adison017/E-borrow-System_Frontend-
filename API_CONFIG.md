# การตั้งค่า API Host

## วิธีการเปลี่ยน API Host

ตอนนี้ระบบได้ถูกปรับปรุงให้ใช้ `VITE_API_URL` เป็นแหล่งข้อมูลเดียวในการกำหนด API host แล้ว

### 1. สร้างไฟล์ `.env` ในโฟลเดอร์ `E-borrow-System_Frontend-`

```bash
# สำหรับ localhost
VITE_API_URL=http://localhost:65033

# สำหรับ render.com backend
VITE_API_URL=https://e-borrow-system-backend.onrender.com
```

### 2. การใช้งาน

- **Development**: สร้างไฟล์ `.env` และกำหนด `VITE_API_URL`
- **Production**: กำหนด environment variable `VITE_API_URL` ใน Vercel

### 3. ไฟล์ที่ถูกปรับปรุงแล้ว

- ✅ `src/utils/api.js` - ใช้ `VITE_API_URL` เป็นแหล่งข้อมูลเดียว
- ✅ `src/utils/socketService.js` - ใช้ `VITE_API_URL` สำหรับ WebSocket
- ✅ `src/components/Header.jsx` - ใช้ `VITE_API_URL` สำหรับรูปภาพ
- ✅ `src/pages/users/edit_profile.jsx` - ใช้ `VITE_API_URL` สำหรับรูปภาพ
- ✅ `vite.config.js` - ใช้ `VITE_API_URL` สำหรับ proxy target

### 4. ตัวอย่างการใช้งาน

```bash
# ใช้ localhost
echo "VITE_API_URL=http://localhost:65033" > .env

# ใช้ render.com backend
echo "VITE_API_URL=https://e-borrow-system-backend.onrender.com" > .env
```

### 5. การ Restart

หลังจากเปลี่ยน `VITE_API_URL` ต้อง restart development server:

```bash
npm run dev
```

### 6. Backend URLs ที่ถูกต้อง

- **Backend API**: `https://e-borrow-system-backend.onrender.com`
- **Frontend**: `https://e-borrow-system.vercel.app`
- **Local Development**: `http://localhost:65033` (backend) + `http://localhost:5173` (frontend)
