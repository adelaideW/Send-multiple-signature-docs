import React from 'react';
import { X } from 'lucide-react';
import { PRIMARY_PURPLE } from '../constants';

interface SendReminderModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const SendReminderModal: React.FC<SendReminderModalProps> = ({ open, onClose, onConfirm }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[600000] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[28px] shadow-2xl w-full max-w-[480px] border border-slate-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-reminder-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-8 pt-8 pb-2">
          <h2 id="send-reminder-title" className="text-lg font-bold text-slate-900 pr-4">
            Send reminder
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 shrink-0"
            aria-label="Close"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>
        <p className="px-8 pb-8 text-[15px] text-slate-800 leading-relaxed">
          This will send a reminder to everyone with pending actions across all documents. Are you sure you want to
          proceed?
        </p>
        <div className="flex items-center justify-end gap-3 px-8 pb-8">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-95 shadow-sm"
            style={{ backgroundColor: PRIMARY_PURPLE }}
          >
            Yes, send reminder
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendReminderModal;
