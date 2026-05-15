import React from 'react';
import { Download, X } from 'lucide-react';

export interface DocumentPreviewModalProps {
  name: string;
  onClose: () => void;
  /** Prototype: e.g. show snackbar from parent */
  onDownload?: () => void;
  /** When the signer has finished this document, show captured signature / checkbox / date details. */
  signedSummary?: React.ReactNode;
  zIndexClass?: string;
}

/**
 * Full-screen static document preview; header matches Documents hub (download + close icons).
 */
const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  name,
  onClose,
  onDownload,
  signedSummary,
  zIndexClass = 'z-[300000]',
}) => {
  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex flex-col bg-white`}
      role="dialog"
      aria-modal="true"
      aria-label="Document preview"
    >
      <div className="h-14 border-b border-slate-200 flex items-center justify-between px-4 shrink-0 bg-white">
        <h2 className="text-sm font-bold text-slate-900 truncate pr-4">{name}</h2>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onDownload}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            aria-label="Download"
          >
            <Download size={20} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={22} strokeWidth={2} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-center">
        <div className="w-full max-w-[640px] bg-white shadow-xl rounded-lg border border-slate-200 p-10 min-h-[480px] text-slate-700 text-sm leading-relaxed">
          <p className="font-bold text-slate-900 mb-4">Static preview</p>
          <p>
            This is a prototype preview of <strong>{name}</strong>. In production, the received PDF would render here.
          </p>
          {signedSummary ? (
            <div className="mt-8 pt-6 border-t border-slate-200 text-[13px] text-slate-800">
              <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wide mb-3">Signed copy record</p>
              {signedSummary}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
