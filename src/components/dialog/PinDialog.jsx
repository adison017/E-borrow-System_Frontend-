export default function PinDialog({ open, pin, setPin, pinError, onCancel, onSubmit }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-blue-100">
        <div className="flex flex-col items-center">
          <div className="bg-blue-100 rounded-full p-3 mb-3">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <path d="M12 17a2 2 0 0 0 2-2v-2a2 2 0 1 0-4 0v2a2 2 0 0 0 2 2zm6-6V9a6 6 0 1 0-12 0v2a6 6 0 0 0 12 0zm-2 0a4 4 0 1 1-8 0V9a4 4 0 1 1 8 0v2z" fill="#2563eb"/>
            </svg>
          </div>
          <h3 className="text-xl font-extrabold mb-2 text-blue-700 text-center">กรุณากรอกรหัสผ่านเพื่อยืนยัน</h3>
          <p className="text-gray-500 text-sm mb-4 text-center">เพื่อความปลอดภัย กรุณากรอกรหัสผ่านของคุณ</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="password"
            className={`w-full px-5 py-3 border ${pinError ? 'border-red-400' : 'border-blue-200'} rounded-xl focus:ring-2 focus:ring-blue-400 text-lg tracking-widest text-center transition text-black`}
            value={pin}
            onChange={e => setPin(e.target.value)}
            autoFocus
            maxLength={50}
          />
          {pinError && <div className="text-red-500 text-sm text-center">{pinError}</div>}
          <div className="flex justify-between gap-3 mt-2">
            <button
              type="button"
              className="flex-1 px-4 py-2 text-sm rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold shadow transition"
              onClick={onCancel}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold shadow transition"
            >
              ยืนยัน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}