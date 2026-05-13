
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft,
  Search,
  MoreVertical,
  Eye,
  Download,
  Filter,
  Maximize2,
  Columns,
  Settings2,
  FileText,
  ChevronDown,
  PenLine,
  Share2,
  X,
} from 'lucide-react';
import type { EnvelopeStatus, DocumentSigningStatus, EnvelopeRecipientRow } from './EnvelopesListView';
import { EnvelopeMoreMenu, moreMenuVariantForEnvelope } from './EnvelopesListView';
import { SNACKBAR_AUTO_DISMISS_MS } from '../constants/snackbar';
import SendReminderModal from './SendReminderModal';
import DocumentPreviewModal from './DocumentPreviewModal';

/** Backwards-compatible alias — recipient row shape now lives on `EnvelopesListView`. */
export type DetailRecipientRow = EnvelopeRecipientRow;

const DEFAULT_RECIPIENTS: EnvelopeRecipientRow[] = [
  {
    id: 'r1',
    order: 1,
    name: 'Darrell Steward',
    email: 'bs@email.com',
    avatar: 'https://i.pravatar.cc/150?u=darrell',
    status: 'In progress',
    action: 'To sign',
    sentOn: '10/14/2024 7:19 AM',
    completedOn: '—',
  },
  {
    id: 'r2',
    order: 2,
    name: 'Albert Flores',
    email: 'shreya@email.com',
    initials: 'AF',
    status: 'In progress',
    action: 'To sign',
    sentOn: '-',
    completedOn: '—',
  },
  {
    id: 'r3',
    order: 2,
    name: 'Rome Montenegro',
    email: 'th@email.com',
    initials: 'RM',
    status: 'In progress',
    action: 'To view',
    sentOn: '10/14/2024 8:19 AM',
    completedOn: '—',
  },
  {
    id: 'r4',
    order: 3,
    name: 'Parker Conrad',
    email: 're@email.com',
    avatar: 'https://i.pravatar.cc/150?u=parker',
    status: 'Waiting',
    action: 'To sign',
    sentOn: '-',
    completedOn: '—',
  },
];

function headerBadgeForStatus(status: EnvelopeStatus): { label: string; className: string } | null {
  const base = 'text-[10px] font-bold px-2 py-0.5 rounded-full border';
  switch (status) {
    case 'yet to sign':
      return { label: 'Yet to sign', className: `${base} bg-rose-50 text-slate-900 border-rose-100` };
    case 'in progress':
      return { label: 'In progress', className: `${base} bg-amber-50 text-slate-900 border-amber-100` };
    case 'draft':
      return { label: 'Draft', className: `${base} bg-slate-100 text-slate-800 border-slate-200/80` };
    case 'correcting':
      return { label: 'Correcting', className: `${base} bg-amber-50 text-slate-900 border-amber-100` };
    case 'completed':
      return { label: 'Completed', className: `${base} bg-emerald-50 text-slate-900 border-emerald-100` };
    case 'voided':
      return { label: 'Voided', className: `${base} bg-slate-100 text-slate-800 border-slate-200/80` };
    default:
      return null;
  }
}

function docStatusLabel(status: DocumentSigningStatus): string {
  if (status === 'voided') return 'Voided';
  if (status === 'in progress') return 'In progress';
  if (status === 'yet to sign') return 'Yet to sign';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function documentDotClass(status: DocumentSigningStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500';
    case 'yet to sign':
      return 'bg-red-500';
    case 'in progress':
    case 'correcting':
      return 'bg-amber-500';
    case 'voided':
    case 'draft':
      return 'bg-slate-400';
    default:
      return 'bg-slate-400';
  }
}

interface EnvelopeDetailsViewProps {
  packetId: string;
  envelopeName: string;
  packetStatus: EnvelopeStatus;
  adminIsSigner: boolean;
  sentOn: string;
  sentBy: string;
  documents: { id: string; name: string; status: DocumentSigningStatus }[];
  recipients?: EnvelopeRecipientRow[];
  isVoided?: boolean;
  onExit: () => void;
  onSign?: () => void;
  onEdit?: () => void;
  onResend?: () => void;
}

const btnOutline =
  'inline-flex items-center gap-2 px-5 py-2 rounded-[8px] border border-slate-200 text-sm font-bold text-slate-900 bg-white hover:bg-slate-50 shadow-sm';
const btnOrange =
  'inline-flex items-center gap-2 px-5 py-2 rounded-[8px] text-sm font-bold text-slate-900 bg-[#FDB71C] hover:opacity-95 shadow-sm';
const btnResend =
  'inline-flex items-center gap-2 px-5 py-2 rounded-[8px] text-sm font-bold text-white bg-[#7A005D] hover:opacity-95 shadow-sm';

const EnvelopeDetailsView: React.FC<EnvelopeDetailsViewProps> = ({
  packetId: _packetId,
  envelopeName,
  packetStatus,
  adminIsSigner,
  sentOn,
  sentBy,
  documents,
  recipients,
  isVoided = false,
  onExit,
  onSign,
  onEdit,
  onResend,
}) => {
  const badge = headerBadgeForStatus(packetStatus);
  const effectiveRecipients = recipients && recipients.length > 0 ? recipients : DEFAULT_RECIPIENTS;
  // Once the envelope itself is completed, every recipient must read as
  // Completed too — there's no "In progress" or "Yet to sign" recipient
  // on a finished envelope. We also backfill a sensible completedOn so
  // the column never shows an em dash on a completed row.
  const recipientsForStatus =
    packetStatus === 'completed'
      ? effectiveRecipients.map((r) => ({
          ...r,
          status: 'Completed' as const,
          completedOn: r.completedOn && r.completedOn !== '—' ? r.completedOn : r.sentOn,
        }))
      : effectiveRecipients;
  const recipientRows = isVoided
    ? recipientsForStatus.map((r) => ({ ...r, action: '—' as const }))
    : recipientsForStatus;

  const showSign = packetStatus !== 'voided' && packetStatus !== 'completed' && packetStatus !== 'draft' && packetStatus !== 'correcting';
  // Hide Sign once there's nothing left to sign — either every document in
  // the envelope is `completed`, or every "To sign" recipient has already
  // finished. In both cases the active viewer's signing share is done, so
  // showing Sign would let them re-sign the envelope unintentionally.
  const everyDocCompleted =
    documents.length > 0 && documents.every((d) => d.status === 'completed');
  const signersRequired = recipients?.filter((r) => r.action === 'To sign') ?? [];
  const everySignerDone =
    signersRequired.length > 0 && signersRequired.every((r) => r.status === 'Completed');
  const noMoreSigning = everyDocCompleted || everySignerDone;
  const canSign = showSign && adminIsSigner && !noMoreSigning;

  const [moreOpen, setMoreOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const moreBtnRef = useRef<HTMLButtonElement | null>(null);
  const [preview, setPreview] = useState<{ name: string } | null>(null);
  const [docSnack, setDocSnack] = useState<string | null>(null);
  const [bulkSnack, setBulkSnack] = useState<{ phase: 'loading' | 'done'; count: number } | null>(null);
  const [sendReminderOpen, setSendReminderOpen] = useState(false);

  const runBulkDownload = () => {
    const n = Math.max(1, documents.length);
    setBulkSnack({ phase: 'loading', count: n });
    window.setTimeout(() => {
      setBulkSnack({ phase: 'done', count: n });
    }, 1200);
  };

  useEffect(() => {
    if (!docSnack) return;
    const t = window.setTimeout(() => setDocSnack(null), SNACKBAR_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [docSnack]);

  useEffect(() => {
    if (bulkSnack?.phase !== 'done') return;
    const t = window.setTimeout(() => setBulkSnack(null), SNACKBAR_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [bulkSnack]);

  useLayoutEffect(() => {
    if (!moreOpen) {
      setMenuPos(null);
      return;
    }
    const place = () => {
      const btn = moreBtnRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const mw = 260;
      const left = Math.max(8, Math.min(r.right - mw, window.innerWidth - mw - 8));
      setMenuPos({ top: r.bottom + 8, left });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [moreOpen]);

  useEffect(() => {
    if (!moreOpen) return;
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (moreBtnRef.current?.contains(t)) return;
      const root = document.getElementById('envelope-details-more-root');
      if (root?.contains(t)) return;
      setMoreOpen(false);
    };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, [moreOpen]);

  const moreBtn = (
    <button
      ref={moreBtnRef}
      type="button"
      className="p-1.5 text-slate-900 hover:bg-slate-100 rounded-[8px]"
      aria-label="More actions"
      aria-expanded={moreOpen}
      onClick={() => setMoreOpen((v) => !v)}
    >
      <MoreVertical size={18} strokeWidth={2} />
    </button>
  );

  const renderPrimaryCluster = () => {
    if (packetStatus === 'draft') {
      return (
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" className={btnOutline} onClick={onEdit}>
            <PenLine size={18} strokeWidth={2} />
            Edit
          </button>
          {moreBtn}
        </div>
      );
    }
    if (packetStatus === 'correcting') {
      return (
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" className={btnOutline} onClick={onEdit}>
            <PenLine size={18} strokeWidth={2} />
            Edit
          </button>
          <button type="button" className={btnResend} onClick={onResend}>
            Resend
          </button>
          {moreBtn}
        </div>
      );
    }
    if (packetStatus === 'completed' || packetStatus === 'voided') {
      return (
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className={btnOutline}
            onClick={() => documents[0] && setPreview({ name: documents[0].name })}
          >
            <Eye size={18} strokeWidth={2} />
            View
          </button>
          {moreBtn}
        </div>
      );
    }
    if (packetStatus === 'yet to sign' || packetStatus === 'in progress') {
      if (canSign) {
        return (
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={onSign} className={btnOrange}>
              <PenLine size={18} strokeWidth={2} className="text-slate-900" />
              Sign
            </button>
            {moreBtn}
          </div>
        );
      }
      return <div className="flex items-center gap-2 shrink-0">{moreBtn}</div>;
    }
    return null;
  };

  return (
    <div className="flex flex-col h-screen bg-[#F9FAFB] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-700 hover:text-slate-900 -mt-1 mb-2"
        >
          <ChevronLeft size={18} strokeWidth={2} />
          Back
        </button>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex flex-col space-y-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{envelopeName}</h1>
                {badge && <span className={badge.className}>{badge.label}</span>}
              </div>
            </div>
            {renderPrimaryCluster()}
          </div>

          <div className="flex items-center space-x-12 mt-6">
            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Sent on</p>
              <p className="text-[13px] font-medium text-slate-800">{sentOn}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Sent by</p>
              <p className="text-[13px] font-medium text-[#7A005D] hover:underline cursor-pointer">{sentBy}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-[15px] font-bold text-slate-900">Documents</h2>
          </div>
          <div className="p-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 rounded-lg group transition-colors gap-4"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <FileText size={20} className="text-slate-400 shrink-0" />
                  <span className="text-[14px] font-bold text-slate-900 truncate">{doc.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2 w-[120px] justify-end">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${documentDotClass(doc.status)}`} />
                    <span className="text-[12px] font-semibold text-slate-700 whitespace-nowrap">
                      {docStatusLabel(doc.status)}
                    </span>
                  </div>
                  {isVoided ? (
                    <span className="text-slate-400 font-medium w-20 text-right">—</span>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md"
                        aria-label={`View ${doc.name}`}
                        onClick={() => setPreview({ name: doc.name })}
                      >
                        <Eye size={20} />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md"
                        aria-label={`Download ${doc.name}`}
                        onClick={() => setDocSnack('Document downloaded')}
                      >
                        <Download size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden pb-4">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-[15px] font-bold text-slate-900">Recipients</h2>
              <span className="text-slate-400 font-medium">· {recipientRows.length}</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md"
                aria-label="Filter"
              >
                <Filter size={18} />
              </button>
              <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md" aria-label="Share">
                <Share2 size={18} />
              </button>
              <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md" aria-label="Columns">
                <Columns size={18} />
              </button>
              <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md" aria-label="Expand">
                <Maximize2 size={18} />
              </button>
            </div>
          </div>

          <div className="px-6 pb-4 flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search"
                className="w-full border border-slate-200 rounded-lg py-1.5 pl-10 pr-4 text-[13px] outline-none bg-white"
              />
            </div>
            <button className="flex items-center space-x-2 text-[13px] font-bold text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg">
              <Settings2 size={16} />
              <span>Filter</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-6 py-3 w-16">Order</th>
                  <th className="px-2 py-3">
                    <div className="flex items-center space-x-1">
                      <span>Recipients</span>
                      <ChevronDown size={12} className="text-slate-300" />
                    </div>
                  </th>
                  <th className="px-6 py-3">
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      <ChevronDown size={12} className="text-slate-300" />
                    </div>
                  </th>
                  <th className="px-6 py-3">
                    <div className="flex items-center space-x-1">
                      <span>Actions</span>
                      <ChevronDown size={12} className="text-slate-300" />
                    </div>
                  </th>
                  <th className="px-6 py-3">
                    <div className="flex items-center space-x-1">
                      <span>Sent on</span>
                      <ChevronDown size={12} className="text-slate-300" />
                    </div>
                  </th>
                  <th className="px-6 py-3">
                    <div className="flex items-center space-x-1">
                      <span>Completed on</span>
                      <ChevronDown size={12} className="text-slate-300" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-slate-700">
                {recipientRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-7 h-7 rounded-full bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center font-bold text-[11px]">
                        {row.order}
                      </div>
                    </td>
                    <td className="px-2 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
                          {row.avatar ? (
                            <img src={row.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-[#64748B] text-[12px] bg-[#F1F5F9]">
                              {row.initials}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 leading-tight">{row.name}</span>
                          <span className="text-slate-400 text-[11px] font-medium">{row.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            row.status === 'Completed'
                              ? 'bg-[#0D9488]'
                              : row.status === 'In progress'
                                ? 'bg-[#F59E0B]'
                                : row.status === 'Yet to sign'
                                  ? 'bg-red-500'
                                  : 'bg-[#94A3B8]'
                          }`}
                        />
                        <span className="font-medium text-slate-800">{row.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {row.action === '—' ? <span className="text-slate-400">—</span> : row.action}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {row.sentOn}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {row.completedOn}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {moreOpen &&
        menuPos &&
        createPortal(
          <div
            id="envelope-details-more-root"
            className="fixed rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
            style={{ top: menuPos.top, left: menuPos.left, zIndex: 2147483647 }}
            role="presentation"
          >
            <EnvelopeMoreMenu
              variant={moreMenuVariantForEnvelope(packetStatus)}
              onClose={() => setMoreOpen(false)}
              onDownload={runBulkDownload}
              onSendReminder={() => setSendReminderOpen(true)}
            />
          </div>,
          document.body
        )}

      {preview && (
        <DocumentPreviewModal
          name={preview.name}
          onClose={() => setPreview(null)}
          onDownload={() => setDocSnack('Document downloaded')}
          zIndexClass="z-[400000]"
        />
      )}

      {docSnack && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[400000] pointer-events-none px-4 w-full max-w-md">
          <div className="pointer-events-auto bg-[#C6F6F1] border border-[#A5F3E9] rounded-lg shadow-lg flex items-center px-4 py-3 gap-3">
            <span className="text-[13px] font-bold text-[#134E4A] flex-1">{docSnack}</span>
            <button type="button" className="text-[#134E4A]/70 p-1" onClick={() => setDocSnack(null)} aria-label="Dismiss">
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {bulkSnack && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[400000] pointer-events-none px-4 w-full max-w-md">
          <div
            className={`pointer-events-auto rounded-lg shadow-lg flex items-center px-4 py-3 gap-3 border ${
              bulkSnack.phase === 'loading'
                ? 'bg-[#E0F2FE] border-[#BAE6FD]'
                : 'bg-[#C6F6F1] border-[#A5F3E9]'
            }`}
          >
            <span className="text-[13px] font-bold text-slate-900 flex-1">
              {bulkSnack.phase === 'loading'
                ? `${bulkSnack.count} documents downloading`
                : `${bulkSnack.count} documents downloaded`}
            </span>
            <button type="button" className="text-slate-600 p-1" onClick={() => setBulkSnack(null)} aria-label="Dismiss">
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
      <SendReminderModal
        open={sendReminderOpen}
        onClose={() => setSendReminderOpen(false)}
        onConfirm={() => {}}
      />
    </div>
  );
};

export default EnvelopeDetailsView;
