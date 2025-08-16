import React from 'react';

export default function BaseDialog({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Blurred background overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

      <div className="modal modal-open">
        <div className="modal-box relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}