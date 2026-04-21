import React, { useMemo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Filter,
  Bell,
  ChevronDown,
  ChevronRight,
  Settings2,
  Columns,
  Maximize2,
  MoreVertical,
  Mail,
  FileText,
  Eye,
  PenLine,
  Download,
  Send,
  RefreshCw,
  ClipboardX,
  UserRound,
  Trash2,
  XCircle,
  X,
} from 'lucide-react';
import { PRIMARY_PURPLE } from '../constants';
import { SNACKBAR_AUTO_DISMISS_MS } from '../constants/snackbar';
import SendReminderModal from './SendReminderModal';

export type EnvelopeStatus =
  | 'draft'
  | 'yet to sign'
  | 'in progress'
  | 'correcting'
  | 'completed'
  | 'voided';

/** Per-document signing state inside an envelope */
export type DocumentSigningStatus = 'draft' | 'yet to sign' | 'completed' | 'correcting' | 'voided';

export interface EnvelopeDocumentRow {
  id: string;
  name: string;
  status: DocumentSigningStatus;
  lastModified: string;
}

export interface EnvelopeTableRow {
  id: string;
  name: string;
  status: EnvelopeStatus;
  lastModified: string;
  /** When false, "voided" envelopes are hidden unless "Show voided" is on */
  adminIsSigner: boolean;
  children?: EnvelopeDocumentRow[];
}

const DANGER = '#B03E1E';

const MOCK_ENVELOPES: EnvelopeTableRow[] = [
  {
    id: 'e1',
    name: 'Employee onboarding packet — Engineering',
    status: 'in progress',
    lastModified: '2026-04-21T18:30:00.000Z',
    adminIsSigner: true,
    children: [
      { id: 'e1d1', name: 'Offer letter', status: 'completed', lastModified: '2026-04-20T10:00:00.000Z' },
      { id: 'e1d2', name: 'Mutual NDA', status: 'completed', lastModified: '2026-04-20T11:30:00.000Z' },
      { id: 'e1d3', name: 'Equity grant acknowledgment', status: 'yet to sign', lastModified: '2026-04-21T17:00:00.000Z' },
    ],
  },
  {
    id: 'e2',
    name: 'Q2 IT access & security attestation',
    status: 'yet to sign',
    lastModified: '2026-04-21T08:45:00.000Z',
    adminIsSigner: true,
    children: [
      { id: 'e2d1', name: 'SOC2 subprocessor acknowledgment', status: 'yet to sign', lastModified: '2026-04-21T08:45:00.000Z' },
      { id: 'e2d2', name: 'Laptop return policy', status: 'yet to sign', lastModified: '2026-04-21T08:45:00.000Z' },
    ],
  },
  {
    id: 'e3',
    name: 'HR policy rollout — remote work',
    status: 'yet to sign',
    lastModified: '2026-04-19T14:20:00.000Z',
    adminIsSigner: false,
    children: [
      { id: 'e3d1', name: 'Remote work agreement', status: 'yet to sign', lastModified: '2026-04-19T14:20:00.000Z' },
      { id: 'e3d2', name: 'Equipment stipend form', status: 'yet to sign', lastModified: '2026-04-19T14:20:00.000Z' },
    ],
  },
  {
    id: 'e4',
    name: 'Finance contractor SOW bundle',
    status: 'in progress',
    lastModified: '2026-04-20T16:00:00.000Z',
    adminIsSigner: false,
    children: [
      { id: 'e4d1', name: 'Statement of work', status: 'completed', lastModified: '2026-04-18T09:00:00.000Z' },
      { id: 'e4d2', name: 'MSA amendment', status: 'completed', lastModified: '2026-04-19T10:00:00.000Z' },
      { id: 'e4d3', name: 'Invoice authorization', status: 'yet to sign', lastModified: '2026-04-20T16:00:00.000Z' },
    ],
  },
  {
    id: 'e5',
    name: 'Draft: Open enrollment benefits packet',
    status: 'draft',
    lastModified: '2026-04-17T11:00:00.000Z',
    adminIsSigner: true,
    children: [
      { id: 'e5d1', name: 'Medical plan election', status: 'draft', lastModified: '2026-04-17T11:00:00.000Z' },
      { id: 'e5d2', name: 'HSA enrollment', status: 'draft', lastModified: '2026-04-17T11:00:00.000Z' },
    ],
  },
  {
    id: 'e6',
    name: 'Offer letter correction — Product Design',
    status: 'correcting',
    lastModified: '2026-04-20T22:10:00.000Z',
    adminIsSigner: true,
    children: [
      { id: 'e6d1', name: 'Revised offer letter', status: 'correcting', lastModified: '2026-04-20T22:10:00.000Z' },
    ],
  },
  {
    id: 'e7',
    name: 'Executive compensation acknowledgment',
    status: 'completed',
    lastModified: '2026-03-28T09:15:00.000Z',
    adminIsSigner: false,
    children: [
      { id: 'e7d1', name: 'Compensation summary', status: 'completed', lastModified: '2026-03-28T09:15:00.000Z' },
      { id: 'e7d2', name: 'Clawback policy', status: 'completed', lastModified: '2026-03-27T16:00:00.000Z' },
    ],
  },
  {
    id: 'e8',
    name: 'Terminated — vendor NDA (voided)',
    status: 'voided',
    lastModified: '2026-02-14T13:45:00.000Z',
    adminIsSigner: true,
    children: [
      { id: 'e8d1', name: 'Vendor NDA', status: 'completed', lastModified: '2026-02-10T12:00:00.000Z' },
      { id: 'e8d2', name: 'Data handling addendum', status: 'yet to sign', lastModified: '2026-02-14T13:45:00.000Z' },
    ],
  },
];

type SortKey = 'name' | 'status' | 'lastModified';
type SortDir = 'asc' | 'desc';

function envelopeStatusDotClass(status: EnvelopeStatus): string {
  switch (status) {
    case 'draft':
    case 'voided':
      return 'bg-slate-400';
    case 'yet to sign':
      return 'bg-red-500';
    case 'in progress':
    case 'correcting':
      return 'bg-amber-500';
    case 'completed':
      return 'bg-emerald-500';
    default:
      return 'bg-slate-400';
  }
}

function documentStatusDotClass(status: DocumentSigningStatus): string {
  switch (status) {
    case 'draft':
      return 'bg-slate-400';
    case 'yet to sign':
      return 'bg-red-500';
    case 'correcting':
      return 'bg-amber-500';
    case 'completed':
      return 'bg-emerald-500';
    case 'voided':
      return 'bg-slate-500';
    default:
      return 'bg-slate-400';
  }
}

function statusLabelText(status: string): string {
  if (status === 'voided') return 'Voided';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatLastModified(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${mm}/${dd}/${yy} ${h}:${m}:${s} PST`;
}

function compareRows(a: EnvelopeTableRow, b: EnvelopeTableRow, key: SortKey, dir: SortDir): number {
  let cmp = 0;
  if (key === 'lastModified') {
    cmp = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
  } else if (key === 'name') {
    cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  } else {
    cmp = a.status.localeCompare(b.status, undefined, { sensitivity: 'base' });
  }
  return dir === 'asc' ? cmp : -cmp;
}

export type MoreMenuVariant = 'yet_to_sign' | 'in_progress' | 'draft' | 'correcting' | 'completed_voided';

export function moreMenuVariantForEnvelope(status: EnvelopeStatus): MoreMenuVariant {
  switch (status) {
    case 'yet to sign':
      return 'yet_to_sign';
    case 'in progress':
      return 'in_progress';
    case 'draft':
      return 'draft';
    case 'correcting':
      return 'correcting';
    case 'completed':
    case 'voided':
      return 'completed_voided';
    default:
      return 'completed_voided';
  }
}

interface EnvelopeMoreMenuProps {
  variant: MoreMenuVariant;
  onClose: () => void;
  onDownload?: () => void;
  onSendReminder?: () => void;
}

export const EnvelopeMoreMenu: React.FC<EnvelopeMoreMenuProps> = ({
  variant,
  onClose,
  onDownload,
  onSendReminder,
}) => {
  const itemClass = 'w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-semibold text-slate-800 hover:bg-slate-50';
  const dangerItemClass = `w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-semibold hover:bg-slate-50`;
  const IconWrap: React.FC<{ children: React.ReactNode; danger?: boolean }> = ({ children, danger }) => (
    <span className={`shrink-0 ${danger ? '' : 'text-slate-800'}`}>{children}</span>
  );
  const dl = () => {
    onDownload?.();
    onClose();
  };

  if (variant === 'yet_to_sign') {
    return (
      <div className="py-1 min-w-[220px]" role="menu">
        <button type="button" className={itemClass} role="menuitem" onClick={dl}>
          <IconWrap><Download size={16} strokeWidth={2} /></IconWrap>
          Download
        </button>
        <button type="button" className={itemClass} role="menuitem" onClick={onClose}>
          <IconWrap><UserRound size={16} strokeWidth={2} /></IconWrap>
          Reassign
        </button>
        <button type="button" className={itemClass} role="menuitem" onClick={onClose}>
          <IconWrap><ClipboardX size={16} strokeWidth={2} /></IconWrap>
          Decline to sign
        </button>
        <button
          type="button"
          className={itemClass}
          role="menuitem"
          onClick={() => {
            onSendReminder?.();
            onClose();
          }}
        >
          <IconWrap><Bell size={16} strokeWidth={2} /></IconWrap>
          Send reminder
        </button>
        <button type="button" className={itemClass} role="menuitem" onClick={onClose}>
          <IconWrap><RefreshCw size={16} strokeWidth={2} /></IconWrap>
          Make correction
        </button>
        <button type="button" className={`${dangerItemClass}`} style={{ color: DANGER }} role="menuitem" onClick={onClose}>
          <IconWrap danger><XCircle size={16} strokeWidth={2} style={{ color: DANGER }} /></IconWrap>
          Void
        </button>
      </div>
    );
  }

  if (variant === 'in_progress') {
    return (
      <div className="py-1 min-w-[200px]" role="menu">
        <button type="button" className={itemClass} role="menuitem" onClick={dl}>
          <IconWrap><Download size={16} strokeWidth={2} /></IconWrap>
          Download
        </button>
        <button
          type="button"
          className={itemClass}
          role="menuitem"
          onClick={() => {
            onSendReminder?.();
            onClose();
          }}
        >
          <IconWrap><Bell size={16} strokeWidth={2} /></IconWrap>
          Send reminder
        </button>
        <button type="button" className={itemClass} role="menuitem" onClick={onClose}>
          <IconWrap><RefreshCw size={16} strokeWidth={2} /></IconWrap>
          Make correction
        </button>
        <button type="button" className={dangerItemClass} style={{ color: DANGER }} role="menuitem" onClick={onClose}>
          <IconWrap danger><XCircle size={16} strokeWidth={2} style={{ color: DANGER }} /></IconWrap>
          Void
        </button>
      </div>
    );
  }

  if (variant === 'draft') {
    return (
      <div className="py-1 min-w-[180px]" role="menu">
        <button type="button" className={itemClass} role="menuitem" onClick={dl}>
          <IconWrap><Download size={16} strokeWidth={2} /></IconWrap>
          Download
        </button>
        <button type="button" className={dangerItemClass} style={{ color: DANGER }} role="menuitem" onClick={onClose}>
          <IconWrap danger><Trash2 size={16} strokeWidth={2} style={{ color: DANGER }} /></IconWrap>
          Remove
        </button>
      </div>
    );
  }

  if (variant === 'correcting') {
    return (
      <div className="py-1 min-w-[180px]" role="menu">
        <button type="button" className={itemClass} role="menuitem" onClick={onClose}>
          <IconWrap><XCircle size={16} strokeWidth={2} /></IconWrap>
          Void
        </button>
        <button type="button" className={dangerItemClass} style={{ color: DANGER }} role="menuitem" onClick={onClose}>
          <IconWrap danger><Trash2 size={16} strokeWidth={2} style={{ color: DANGER }} /></IconWrap>
          Remove
        </button>
      </div>
    );
  }

  /* completed / voided */
  return (
    <div className="py-1 min-w-[180px]" role="menu">
      <button type="button" className={itemClass} role="menuitem" onClick={dl}>
        <IconWrap><Download size={16} strokeWidth={2} /></IconWrap>
        Download
      </button>
      <button type="button" className={dangerItemClass} style={{ color: DANGER }} role="menuitem" onClick={onClose}>
        <IconWrap danger><Trash2 size={16} strokeWidth={2} style={{ color: DANGER }} /></IconWrap>
        Remove
      </button>
    </div>
  );
};

interface EnvelopesListViewProps {
  rows?: EnvelopeTableRow[];
  onRowsChange?: (rows: EnvelopeTableRow[]) => void;
  onSendDocuments?: () => void;
  /** Packet row id */
  onViewEnvelope?: (packetId: string) => void;
  onEditEnvelope?: (packetId: string) => void;
  onSignEnvelope?: (packetId: string) => void;
  onResendEnvelope?: (packetId: string) => void;
}

const btnOutline =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-slate-200 text-[12px] font-bold text-slate-900 bg-white hover:bg-slate-50 shadow-sm shrink-0 whitespace-nowrap';
const btnOrange =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-bold text-slate-900 bg-[#F5A623] hover:bg-[#e09420] shadow-sm shrink-0 whitespace-nowrap';
const btnResend =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-bold text-white bg-[#7A005D] hover:opacity-95 shadow-sm shrink-0 whitespace-nowrap';
const moreIconBtn =
  'p-1.5 text-slate-900 hover:bg-slate-100 rounded-lg shrink-0';

const EnvelopesListView: React.FC<EnvelopesListViewProps> = ({
  rows: rowsProp,
  onRowsChange,
  onSendDocuments,
  onViewEnvelope,
  onEditEnvelope,
  onSignEnvelope,
  onResendEnvelope,
}) => {
  const [fallbackRows, setFallbackRows] = useState<EnvelopeTableRow[]>(() => structuredClone(MOCK_ENVELOPES));
  const rows = rowsProp ?? fallbackRows;
  const [search, setSearch] = useState('');
  const [showVoided, setShowVoided] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('lastModified');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ e1: true });
  const [openMoreId, setOpenMoreId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const moreTriggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [previewDoc, setPreviewDoc] = useState<{ name: string } | null>(null);
  const [docSnack, setDocSnack] = useState<string | null>(null);
  const [bulkSnack, setBulkSnack] = useState<{ phase: 'loading' | 'done'; count: number } | null>(null);
  const [sendReminderOpen, setSendReminderOpen] = useState(false);

  const childCount = (row: EnvelopeTableRow) => row.children?.length ?? 0;

  const runBulkDownload = (row: EnvelopeTableRow) => {
    const n = Math.max(1, childCount(row));
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
    if (!openMoreId) {
      setMenuPos(null);
      return;
    }
    const btn = moreTriggerRefs.current[openMoreId];
    if (!btn) return;
    const place = () => {
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
  }, [openMoreId]);

  useEffect(() => {
    if (!openMoreId) return;
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (moreTriggerRefs.current[openMoreId]?.contains(t)) return;
      const root = document.getElementById('envelope-more-menu-root');
      if (root?.contains(t)) return;
      setOpenMoreId(null);
    };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, [openMoreId]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'lastModified' ? 'desc' : 'asc');
    }
  };

  const filteredRoots = useMemo(() => {
    let list = rows.filter((r) => showVoided || r.status !== 'voided');
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const self = r.name.toLowerCase().includes(q);
        const childMatch = r.children?.some((c) => c.name.toLowerCase().includes(q));
        return self || childMatch;
      });
    }
    return [...list].sort((a, b) => compareRows(a, b, sortKey, sortDir));
  }, [rows, search, showVoided, sortKey, sortDir]);

  const visibleCount = useMemo(
    () => rows.filter((r) => showVoided || r.status !== 'voided').length,
    [rows, showVoided]
  );

  const SortHeader: React.FC<{ label: string; colKey: SortKey }> = ({ label, colKey }) => (
    <button
      type="button"
      onClick={() => toggleSort(colKey)}
      className="flex items-center gap-1 text-[11px] text-slate-500 font-bold uppercase tracking-wider hover:text-slate-800 w-full text-left"
    >
      <span>{label}</span>
      <ChevronDown
        size={14}
        className={`text-slate-400 shrink-0 transition-transform ${sortKey === colKey && sortDir === 'asc' ? 'rotate-180' : ''}`}
      />
    </button>
  );

  const renderEnvelopeActions = (row: EnvelopeTableRow) => {
    const { status, adminIsSigner } = row;
    const moreVariant = moreMenuVariantForEnvelope(status);

    const moreBtn = (
      <button
        type="button"
        ref={(el) => {
          moreTriggerRefs.current[row.id] = el;
        }}
        className={moreIconBtn}
        aria-label="More actions"
        onClick={() => setOpenMoreId((id) => (id === row.id ? null : row.id))}
      >
        <MoreVertical size={18} strokeWidth={2} />
      </button>
    );

    const viewBtn = (
      <button
        type="button"
        className={btnOutline}
        onClick={() => onViewEnvelope?.(row.id)}
      >
        <Eye size={14} strokeWidth={2} />
        View
      </button>
    );

    if (status === 'draft') {
      return (
        <div className="inline-flex items-center justify-end gap-2 flex-nowrap whitespace-nowrap">
          <button type="button" className={btnOutline} onClick={() => onEditEnvelope?.(row.id)}>
            <PenLine size={14} strokeWidth={2} />
            Edit
          </button>
          {moreBtn}
        </div>
      );
    }

    if (status === 'correcting') {
      return (
        <div className="inline-flex items-center justify-end gap-2 flex-nowrap whitespace-nowrap">
          <button type="button" className={btnOutline} onClick={() => onEditEnvelope?.(row.id)}>
            <PenLine size={14} strokeWidth={2} />
            Edit
          </button>
          <button type="button" className={btnResend} onClick={() => onResendEnvelope?.(row.id)}>
            <Send size={14} strokeWidth={2} />
            Resend
          </button>
          {moreBtn}
        </div>
      );
    }

    if (status === 'completed' || status === 'voided') {
      return (
        <div className="inline-flex items-center justify-end gap-2 flex-nowrap whitespace-nowrap">
          {viewBtn}
          {moreBtn}
        </div>
      );
    }

    if (status === 'yet to sign') {
      if (adminIsSigner) {
        return (
          <div className="inline-flex items-center justify-end gap-2 flex-nowrap whitespace-nowrap">
            {viewBtn}
            <button type="button" className={btnOrange} onClick={() => onSignEnvelope?.(row.id)}>
              <PenLine size={14} strokeWidth={2} />
              Sign
            </button>
            {moreBtn}
          </div>
        );
      }
      return (
        <div className="inline-flex items-center justify-end gap-2 flex-nowrap whitespace-nowrap">
          {viewBtn}
          {moreBtn}
        </div>
      );
    }

    if (adminIsSigner) {
      return (
        <div className="inline-flex items-center justify-end gap-2 flex-nowrap whitespace-nowrap">
          {viewBtn}
          <button type="button" className={btnOrange} onClick={() => onSignEnvelope?.(row.id)}>
            <PenLine size={14} strokeWidth={2} />
            Sign
          </button>
          {moreBtn}
        </div>
      );
    }
    return (
      <div className="inline-flex items-center justify-end gap-2 flex-nowrap whitespace-nowrap">
        {viewBtn}
        {moreBtn}
      </div>
    );
  };

  const hasChildren = (row: EnvelopeTableRow) => !!row.children && row.children.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 flex flex-col gap-4 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-bold text-slate-900">Documents</h2>
          <span className="text-slate-400 font-medium text-[15px]">· {visibleCount}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSendReminderOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-1.5 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-800 bg-white hover:bg-slate-50 shadow-sm"
          >
            <Bell size={14} />
            Send reminder
          </button>
          <button
            type="button"
            onClick={onSendDocuments}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-bold text-white hover:opacity-95 shadow-sm"
            style={{ backgroundColor: PRIMARY_PURPLE }}
          >
            Send documents
          </button>
          <div className="flex items-center gap-1 pl-2 border-l border-slate-100">
            <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-50">
              <Settings2 size={18} />
            </button>
            <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-50">
              <Columns size={18} />
            </button>
            <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-50">
              <Maximize2 size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 bg-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 flex-1 min-w-0">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-[#7A005D]/20 bg-white"
            />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowVoided((v) => !v)}
              className={`w-11 h-6 rounded-full relative transition-colors border shadow-inner ${
                showVoided ? 'bg-[#7A005D] border-[#7A005D]' : 'bg-slate-300 border-slate-400/20'
              }`}
              aria-pressed={showVoided}
              aria-label="Show voided envelopes"
            >
              <span
                className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow border border-slate-200 transition-all ${
                  showVoided ? 'left-[22px]' : 'left-[2px]'
                }`}
              />
            </button>
            <span className="text-[13px] text-slate-900 font-bold whitespace-nowrap">Show voided</span>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-700 shrink-0 self-start sm:self-auto"
        >
          <Filter size={16} />
          Filter
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[880px] table-auto">
          <thead>
            <tr className="border-b border-slate-200 bg-white text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <th className="px-6 py-3 min-w-[200px]">
                <SortHeader label="Name" colKey="name" />
              </th>
              <th className="px-4 py-3 min-w-[140px]">
                <SortHeader label="Status" colKey="status" />
              </th>
              <th className="px-4 py-3 min-w-[160px]">
                <SortHeader label="Last modified" colKey="lastModified" />
              </th>
              <th className="px-6 py-3 text-right whitespace-nowrap w-[1%]">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="text-[13px] text-slate-800">
            {filteredRoots.map((row) => (
              <React.Fragment key={row.id}>
                <tr className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 align-middle">
                    <div className="flex items-center gap-2 min-w-0">
                      {hasChildren(row) ? (
                        <button
                          type="button"
                          onClick={() => setExpanded((e) => ({ ...e, [row.id]: !e[row.id] }))}
                          className="p-0.5 text-slate-400 hover:text-slate-700 rounded shrink-0"
                          aria-expanded={!!expanded[row.id]}
                        >
                          {expanded[row.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                      ) : (
                        <span className="w-[22px] shrink-0 inline-block" />
                      )}
                      <Mail size={18} className="text-slate-500 shrink-0" strokeWidth={2} />
                      <span
                        role="button"
                        tabIndex={0}
                        className="font-bold truncate max-w-[min(280px,100%)] min-w-0 cursor-pointer text-left bg-transparent border-none p-0"
                        style={{ color: PRIMARY_PURPLE }}
                        title={row.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEnvelope?.(row.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onEditEnvelope?.(row.id);
                          }
                        }}
                      >
                        {row.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${envelopeStatusDotClass(row.status)}`} />
                      <span className="font-semibold capitalize">{statusLabelText(row.status)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-500 font-medium tabular-nums align-middle">
                    {formatLastModified(row.lastModified)}
                  </td>
                  <td className="px-6 py-4 align-middle text-right whitespace-nowrap">{renderEnvelopeActions(row)}</td>
                </tr>
                {row.children &&
                  expanded[row.id] &&
                  row.children.map((child) => (
                    <tr key={child.id} className="border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50/90">
                      <td className="px-6 py-4 pl-14 align-middle">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={16} className="text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">{child.name}</span>
                        </div>
                      </td>
                        <td className="px-4 py-4 align-middle">
                        {row.status === 'draft' ? (
                          <span className="text-slate-400 font-medium">—</span>
                        ) : row.status === 'voided' ? (
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${documentStatusDotClass('voided')}`} />
                            <span className="font-semibold capitalize text-[13px]">Voided</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${documentStatusDotClass(child.status)}`}
                            />
                            <span className="font-semibold capitalize text-[13px]">{statusLabelText(child.status)}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-500 font-medium text-[13px] tabular-nums align-middle">
                        {formatLastModified(child.lastModified)}
                      </td>
                        <td className="px-6 py-4 align-middle text-right whitespace-nowrap">
                        {row.status === 'voided' ? (
                          <span className="text-slate-400 font-medium">—</span>
                        ) : (
                          <div className="inline-flex items-center justify-end gap-1 flex-nowrap">
                            <button
                              type="button"
                              className="p-2 text-slate-700 hover:bg-white rounded-lg border border-transparent hover:border-slate-200"
                              aria-label="View document"
                              onClick={() => setPreviewDoc({ name: child.name })}
                            >
                              <Eye size={18} strokeWidth={2} />
                            </button>
                            <button
                              type="button"
                              className="p-2 text-slate-700 hover:bg-white rounded-lg border border-transparent hover:border-slate-200"
                              aria-label="Download document"
                              onClick={() => setDocSnack('Document downloaded')}
                            >
                              <Download size={18} strokeWidth={2} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {filteredRoots.length === 0 && (
          <div className="py-20 text-center text-slate-500 text-sm font-medium">No documents match your filters.</div>
        )}
      </div>

      {openMoreId &&
        menuPos &&
        (() => {
          const openRow = rows.find((r) => r.id === openMoreId);
          if (!openRow) return null;
          return createPortal(
            <div
              id="envelope-more-menu-root"
              className="fixed rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
              style={{
                top: menuPos.top,
                left: menuPos.left,
                zIndex: 2147483647,
              }}
              role="presentation"
            >
              <EnvelopeMoreMenu
                variant={moreMenuVariantForEnvelope(openRow.status)}
                onClose={() => setOpenMoreId(null)}
                onDownload={() => runBulkDownload(openRow)}
                onSendReminder={() => setSendReminderOpen(true)}
              />
            </div>,
            document.body
          );
        })()}
      {previewDoc && (
        <div
          className="fixed inset-0 z-[300000] flex flex-col bg-white"
          role="dialog"
          aria-modal="true"
          aria-label="Document preview"
        >
          <div className="h-14 border-b border-slate-200 flex items-center justify-between px-4 shrink-0 bg-white">
            <h2 className="text-sm font-bold text-slate-900 truncate pr-4">{previewDoc.name}</h2>
            <button
              type="button"
              className="px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-lg"
              onClick={() => setPreviewDoc(null)}
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-center">
            <div className="w-full max-w-3xl bg-white shadow-xl rounded-lg border border-slate-200 p-10 min-h-[480px] text-slate-700 text-sm leading-relaxed">
              <p className="font-bold text-slate-900 mb-4">Static preview</p>
              <p>
                This is a prototype preview of <strong>{previewDoc.name}</strong>. In production, the received PDF
                would render here.
              </p>
            </div>
          </div>
        </div>
      )}
      {docSnack && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300000] pointer-events-none px-4 w-full max-w-md">
          <div className="pointer-events-auto bg-[#C6F6F1] border border-[#A5F3E9] rounded-lg shadow-lg flex items-center px-4 py-3 gap-3">
            <span className="text-[13px] font-bold text-[#134E4A] flex-1">{docSnack}</span>
            <button
              type="button"
              className="text-[#134E4A]/70 hover:text-[#134E4A] p-1"
              onClick={() => setDocSnack(null)}
              aria-label="Dismiss"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
      {bulkSnack && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300000] pointer-events-none px-4 w-full max-w-md">
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
            <button
              type="button"
              className="text-slate-600 hover:text-slate-900 p-1"
              onClick={() => setBulkSnack(null)}
              aria-label="Dismiss"
            >
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

export function cloneInitialEnvelopeRows(): EnvelopeTableRow[] {
  return structuredClone(MOCK_ENVELOPES);
}

export default EnvelopesListView;
