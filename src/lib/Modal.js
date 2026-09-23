"use client";

export default function Modal({ children, title, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4">
            <h3 className="text-lg font-bold text-navy-800">{title}</h3>
            <button onClick={onClose} className="text-navy-400 hover:text-navy-700">✕</button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
