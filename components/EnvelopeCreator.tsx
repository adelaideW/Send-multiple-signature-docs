import React, { useState, useRef, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  HelpCircle, 
  Bell, 
  Globe, 
  LogOut, 
  MoreVertical, 
  Pencil,
  Camera,
  Accessibility,
  CheckSquare,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Zap,
  Plus,
  Check,
  User,
  X,
  ChevronRight,
  FileText,
  ChevronLeft,
  CirclePlus,
  GripVertical,
  Type,
  PenTool,
  Calendar,
  Square,
  Minus,
  ZoomIn,
  ZoomOut,
  Hand,
  Link,
  Image as ImageIcon,
  AlignLeft,
  List,
  ListOrdered,
  Type as TypeIcon,
  Baseline,
  Eraser,
  Sparkles,
  Trash2,
  Copy,
  FileInput,
  Folder,
} from 'lucide-react';
import type { UploadedFileItem } from '../types';
import { PROFILE_DOCUMENT_FOLDER_LOCATIONS, ENVELOPE_NAME_MAX_LENGTH } from '../constants';

interface EnvelopeCreatorProps {
  onExit: () => void;
  /** Save draft and return to the flow entry point (shows draft snackbar in App). */
  onSaveAndExit?: () => void;
  onEditDocument?: (detail: { title: string; bodyHtml: string }) => void;
  onCreateTemplate?: () => void;
  /** Opens template editor with suggested name (from "Create and select …"). */
  onCreateTemplateWithName?: (name: string) => void;
  onContinue?: (envelopeName: string) => void;
  state?: any;
  onUpdateState?: (state: any) => void;
  /** When true (e.g. editing a draft PDF packet), jump to placement with demo fields once uploads exist. */
  seedPdfPlacementDemo?: boolean;
  onSeedPdfPlacementConsumed?: () => void;
  /** When editing an envelope in "correcting" status, primary actions read "Resend". */
  correctingFlow?: boolean;
}

const HR_UPLOAD_SAMPLES: Omit<UploadedFileItem, 'id'>[] = [
  {
    name: 'Remote_Work_Acknowledgment_v3.pdf',
    previewTitle: 'Remote work expectations',
    previewParagraphs: [
      'By signing below, you acknowledge receipt of Acme’s Remote Work Policy, including equipment care, data security, and core collaboration hours for your team.',
      'You agree to maintain a secure home workspace and to report lost or stolen company devices to IT within twenty-four hours.',
    ],
  },
  {
    name: 'Benefits_Enrollment_Summary_2026.pdf',
    previewTitle: 'Annual benefits enrollment summary',
    previewParagraphs: [
      'This summary highlights medical, dental, vision, and voluntary life coverage effective on your eligibility date. Detailed plan documents are available in Rippling.',
      'Election changes are binding for the plan year unless you experience a qualifying life event approved under IRS guidelines.',
    ],
  },
  {
    name: 'Anti_Harassment_Certification.pdf',
    previewTitle: 'Workplace conduct certification',
    previewParagraphs: [
      'I certify that I have reviewed Acme’s Anti-Harassment and Non-Discrimination Policy and understand my obligation to report concerns promptly.',
      'I understand that retaliation against anyone who reports in good faith is strictly prohibited and may result in disciplinary action up to termination.',
    ],
  },
  {
    name: 'PTO_and_Leave_Policy.pdf',
    previewTitle: 'Paid time off and leave',
    previewParagraphs: [
      'Eligible employees accrue PTO per the schedule in Exhibit A. Requests should be submitted at least two weeks in advance when practicable.',
      'Family and medical leave may be available under federal or state law; contact People Ops for jurisdiction-specific guidance.',
    ],
  },
  {
    name: 'Confidentiality_Reminder_HR.pdf',
    previewTitle: 'Ongoing confidentiality obligations',
    previewParagraphs: [
      'This reminder supplements your Proprietary Information Agreement. Do not share customer lists, roadmaps, compensation data, or unreleased product details outside Acme.',
      'Questions about what may be shared in demos or interviews should be routed through Legal before disclosure.',
    ],
  },
  {
    name: 'I9_Reverification_Checklist.pdf',
    previewTitle: 'Employment eligibility reverification',
    previewParagraphs: [
      'Use this checklist when an employee’s work authorization requires reverification. Complete Section 3 of Form I-9 no later than the expiration date shown on their documentation.',
      'If reverification is not completed on time, pause the employee’s systems access and notify People Ops immediately.',
    ],
  },
  {
    name: 'Performance_Review_Cycle_Q2.pdf',
    previewTitle: 'Q2 performance review acknowledgment',
    previewParagraphs: [
      'Managers will share written feedback and growth goals by the published deadline. Employees may add comments and self-assessment materials in Rippling.',
      'Final ratings are calibrated across departments; your manager will schedule a one-on-one to discuss outcomes and next steps.',
    ],
  },
  {
    name: 'Workplace_Safety_Briefing.pdf',
    previewTitle: 'General safety briefing',
    previewParagraphs: [
      'Report hazards, injuries, or near-misses to your manager and the safety alias without delay. Emergency exits and muster points are posted on each floor.',
      'Personal protective equipment is required in marked lab and warehouse zones; training must be completed before access is granted.',
    ],
  },
];

const pickRandomUpload = (existing: UploadedFileItem[]): UploadedFileItem => {
  const used = new Set(existing.map((f) => f.name));
  const pool = HR_UPLOAD_SAMPLES.filter((s) => !used.has(s.name));
  const base = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : HR_UPLOAD_SAMPLES[Math.floor(Math.random() * HR_UPLOAD_SAMPLES.length)];
  return { ...base, id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}` };
};

const DisabledWithTooltip: React.FC<{ message: string; children: React.ReactNode }> = ({ message, children }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <div
        className="absolute inset-0 z-10 cursor-not-allowed rounded-[inherit]"
        aria-hidden
      />
      {visible && (
        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-[#EDEBE7] border border-slate-300/40 rounded-lg shadow-lg text-[13px] text-slate-700 max-w-[280px] text-left z-20 pointer-events-none leading-snug">
          {message}
        </div>
      )}
    </div>
  );
};

const TEMPLATES = [
  "Consulting Agreement",
  "Non-CA Under 40 Employees",
  "Canada Contractor Agreement - Monthly Pay - With Equity - Quebec",
  "Canada Contractor Agreement - Monthly Pay - No Equity - Quebec"
];

const MOCK_USERS = [
  { id: 'u-kale', name: 'Kale George', email: 'kale.george@acme.com' },
  { id: 'u1', name: 'David Gonzales', email: 'david.g@acme.com' },
  { id: 'u2', name: 'Sarah Jenkins', email: 'sarah.j@acme.com' },
  { id: 'u3', name: 'Michael Chen', email: 'm.chen@acme.com' },
  { id: 'u4', name: 'Emily Rodriguez', email: 'emily.r@acme.com' },
  { id: 'u5', name: 'James Okonkwo', email: 'j.okonkwo@acme.com' },
  { id: 'u6', name: 'Priya Nair', email: 'priya.nair@acme.com' },
  { id: 'u7', name: 'Luis Fernández', email: 'luis.f@acme.com' },
  { id: 'u8', name: 'Hannah Müller', email: 'h.muller@acme.com' },
  { id: 'u9', name: 'Marcus Webb', email: 'marcus.webb@acme.com' },
  { id: 'u10', name: 'Aisha Khan', email: 'aisha.khan@acme.com' },
  { id: 'u11', name: 'Tyler Brooks', email: 'tyler.brooks@acme.com' },
  { id: 'u12', name: 'Nina Patel', email: 'nina.patel@acme.com' },
  { id: 'u13', name: 'Oliver Grant', email: 'oliver.grant@acme.com' },
  { id: 'u14', name: 'Rachel Kim', email: 'rachel.kim@acme.com' },
  { id: 'u15', name: 'Ben Carter', email: 'ben.carter@acme.com' },
  { id: 'u16', name: 'Sofia Alvarez', email: 'sofia.alvarez@acme.com' },
  { id: 'u17', name: 'Daniel O’Brien', email: 'd.obrien@acme.com' },
  { id: 'u18', name: 'Mei Zhang', email: 'mei.zhang@acme.com' },
];

const filterMockUsers = (term: string) => {
  const q = term.trim().toLowerCase();
  if (!q) return MOCK_USERS;
  return MOCK_USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.name.toLowerCase().split(/\s+/).some((w) => w.startsWith(q))
  );
};

interface FolderNode {
  id: string;
  name: string;
  children?: FolderNode[];
  /** System-generated folder — show Default badge and tooltip. */
  isSystemDefault?: boolean;
  /** Folder (and descendants) cannot receive documents until operation completes. */
  moveInProgress?: boolean;
}

const ALL_DOCUMENTS_FOLDER_ID = 'all';

const FOLDER_TREE_ROOTS: FolderNode[] = [
  {
    id: ALL_DOCUMENTS_FOLDER_ID,
    name: 'All documents',
    children: PROFILE_DOCUMENT_FOLDER_LOCATIONS.map((f) => ({
      id: f.id,
      name: f.name,
      isSystemDefault: f.isDefault,
    })),
  },
];

function filterFolderTree(nodes: FolderNode[], q: string): FolderNode[] {
  const term = q.trim().toLowerCase();
  if (!term) return nodes;
  const walk = (n: FolderNode): FolderNode | null => {
    const kids = n.children?.map(walk).filter((x): x is FolderNode => x != null) ?? [];
    const selfHit = n.name.toLowerCase().includes(term);
    if (kids.length > 0) return { ...n, children: kids };
    if (selfHit) return n.children?.length ? { ...n, children: n.children } : { ...n };
    return null;
  };
  return nodes.map(walk).filter((x): x is FolderNode => x != null);
}

function findFolderMeta(
  nodes: FolderNode[],
  id: string,
  trail: string[] = []
): { node: FolderNode; path: string[] } | null {
  for (const n of nodes) {
    const nextTrail = [...trail, n.name];
    if (n.id === id) return { node: n, path: nextTrail };
    if (n.children?.length) {
      const hit = findFolderMeta(n.children, id, nextTrail);
      if (hit) return hit;
    }
  }
  return null;
}

function folderFieldLabel(folderId: string): string {
  if (!folderId || folderId === ALL_DOCUMENTS_FOLDER_ID) return 'All documents';
  const hit = findFolderMeta(FOLDER_TREE_ROOTS, folderId);
  return hit ? hit.node.name : 'All documents';
}

function folderBreadcrumb(folderId: string): string {
  if (!folderId || folderId === ALL_DOCUMENTS_FOLDER_ID) return 'All documents';
  const hit = findFolderMeta(FOLDER_TREE_ROOTS, folderId);
  return hit ? hit.path.join(' / ') : 'All documents';
}

const FolderTreeList: React.FC<{
  nodes: FolderNode[];
  depth: number;
  selectedFolderId: string;
  parentDisabled: boolean;
  onSelect: (id: string) => void;
}> = ({ nodes, depth, selectedFolderId, parentDisabled, onSelect }) => (
  <>
    {nodes.map((node) => {
      const disabled = parentDisabled || !!node.moveInProgress;
      const selected = selectedFolderId === node.id;
      const pad = 8 + depth * 14;
      return (
        <React.Fragment key={node.id}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled) onSelect(node.id);
            }}
            className={`w-full text-left py-2.5 pr-3 flex items-start gap-2 border-b border-slate-50 last:border-0 ${
              disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'
            } ${selected ? 'bg-sky-50' : ''}`}
            style={{ paddingLeft: pad }}
          >
            <Folder size={16} className={`shrink-0 mt-0.5 ${disabled ? 'text-slate-300' : 'text-slate-500'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-900 text-[13px]">{node.name}</span>
                {node.isSystemDefault && (
                  <span
                    title="system generate folder"
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/90 text-slate-800 cursor-help"
                  >
                    Default
                  </span>
                )}
                {node.moveInProgress && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-amber-950">
                    Move in progress
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{folderBreadcrumb(node.id)}</p>
            </div>
            {selected ? <Check size={16} className="text-sky-600 shrink-0 mt-0.5" strokeWidth={2.5} /> : null}
          </button>
          {node.children?.length ? (
            <FolderTreeList
              nodes={node.children}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              parentDisabled={disabled}
              onSelect={onSelect}
            />
          ) : null}
        </React.Fragment>
      );
    })}
  </>
);

const TAG_OPTIONS = ['HR', 'Legal', 'Onboarding', 'Contractor', 'Confidential', 'Payroll'];

const PLACEMENT_FIELD_MIME = 'application/x-placement-field-type';

type PlacementFieldType = 'text' | 'signature' | 'date_signed' | 'checkbox';

interface PlacementField {
  id: string;
  type: PlacementFieldType;
  x: number;
  y: number;
  w: number;
  h: number;
  recipientSlotId: string;
  required: boolean;
}

/** Focus / highlight ring for text inputs (per design #5AA5E7). */
const INPUT_FOCUS =
  'focus:outline-none focus:ring-2 focus:ring-[#5AA5E7]/45 focus:border-[#5AA5E7]';

/** Text link actions in combobox footers (Create and select, add external, etc.). */
const TEXT_LINK = 'text-[#1D4ED8]';

const RECIPIENT_FIELD_PALETTE = ['#6DB3E8', '#9BB8E8', '#7DC9B8', '#E8A4B8', '#E8C97A', '#88C5D8', '#D8B8E8'];

/** Convert a `#RRGGBB` hex to an `rgba()` string with the given alpha so we can paint soft tints inline. */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function recipientFieldAccent(rid: string): string {
  return RECIPIENT_FIELD_PALETTE[hashString(rid) % RECIPIENT_FIELD_PALETTE.length];
}

interface RecipientSlot {
  id: string;
  user: { id: string; name: string; email?: string } | null;
  action: 'Needs to complete' | 'CC recipient';
  searchTerm: string;
  isActionDropdownOpen: boolean;
  /** Per-recipient private note (Add custom message). */
  customMessage?: string;
  showCustomMessage?: boolean;
  /** When true (default), custom message body is visible; when false, header stays but textarea is collapsed. */
  customMessageBodyExpanded?: boolean;
}

const RECIPIENT_DRAG_TYPE = 'application/x-recipient-id';

type ExpireAfterPreset = '5_days' | '2_weeks' | '1_month' | '3_month' | 'custom';
type AlertBeforePreset = 'do_not_send' | '1_day' | '2_days' | '5_days' | '1_week' | '2_weeks' | 'custom';
type ExpirationTimeUnit = 'day' | 'week' | 'month' | 'year';

const EXPIRE_AFTER_MENU: { value: ExpireAfterPreset; label: string }[] = [
  { value: '5_days', label: '5 days' },
  { value: '2_weeks', label: '2 weeks' },
  { value: '1_month', label: '1 month' },
  { value: '3_month', label: '3 month' },
  { value: 'custom', label: 'Custom' },
];
const ALERT_BEFORE_MENU: { value: AlertBeforePreset; label: string }[] = [
  { value: 'do_not_send', label: 'Do not send' },
  { value: '1_day', label: '1 day' },
  { value: '2_days', label: '2 days' },
  { value: '5_days', label: '5 days' },
  { value: '1_week', label: '1 week' },
  { value: '2_weeks', label: '2 weeks' },
  { value: 'custom', label: 'Custom' },
];
const TIME_UNIT_MENU: { value: ExpirationTimeUnit; label: string }[] = [
  { value: 'day', label: 'Day(s)' },
  { value: 'week', label: 'Week(s)' },
  { value: 'month', label: 'Month(s)' },
  { value: 'year', label: 'Year(s)' },
];

const PortalSelectMenu: React.FC<{
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  minWidth?: number;
}> = ({ open, onClose, anchorRef, children, minWidth = 0 }) => {
  const [box, setBox] = useState({ top: 0, left: 0, width: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setBox({ top: r.bottom + 4, left: r.left, width: r.width });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, anchorRef]);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      onClose();
    };
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => {
      document.removeEventListener('mousedown', h);
      document.removeEventListener('keydown', k);
    };
  }, [open, onClose, anchorRef]);
  if (!open) return null;
  const w = Math.max(box.width, minWidth, 160);
  return createPortal(
    <div
      ref={menuRef}
      className="bg-white border border-slate-200 rounded-xl shadow-xl py-1 max-h-[min(400px,calc(100vh-16px))] overflow-y-auto custom-scrollbar"
      style={{ position: 'fixed', top: box.top, left: box.left, width: w, zIndex: 200000 }}
      role="listbox"
    >
      {children}
    </div>,
    document.body
  );
};

const AdvancedExpirationFields: React.FC<{
  afterPreset: ExpireAfterPreset;
  afterCustomAmount: number;
  afterCustomUnit: ExpirationTimeUnit;
  alertPreset: AlertBeforePreset;
  alertCustomAmount: number;
  alertCustomUnit: ExpirationTimeUnit;
  onPatch: (p: {
    expirationAfterPreset?: ExpireAfterPreset;
    expirationAfterCustomAmount?: number;
    expirationAfterCustomUnit?: ExpirationTimeUnit;
    expirationAlertPreset?: AlertBeforePreset;
    expirationAlertCustomAmount?: number;
    expirationAlertCustomUnit?: ExpirationTimeUnit;
  }) => void;
}> = ({ afterPreset, afterCustomAmount, afterCustomUnit, alertPreset, alertCustomAmount, alertCustomUnit, onPatch }) => {
  const [openMenu, setOpenMenu] = useState<null | 'after' | 'afterUnit' | 'alert' | 'alertUnit'>(null);
  const afterRef = useRef<HTMLButtonElement>(null);
  const afterUnitRef = useRef<HTMLButtonElement>(null);
  const alertRef = useRef<HTMLButtonElement>(null);
  const alertUnitRef = useRef<HTMLButtonElement>(null);
  const afterLabel = EXPIRE_AFTER_MENU.find((o) => o.value === afterPreset)?.label ?? '5 days';
  const alertLabel = ALERT_BEFORE_MENU.find((o) => o.value === alertPreset)?.label ?? 'Do not send';
  const afterUnitLabel = TIME_UNIT_MENU.find((o) => o.value === afterCustomUnit)?.label ?? 'Day(s)';
  const alertUnitLabel = TIME_UNIT_MENU.find((o) => o.value === alertCustomUnit)?.label ?? 'Day(s)';

  const rowClass =
    'w-full border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between bg-white h-12 text-sm font-medium text-slate-800';
  return (
    <div className="space-y-4 pl-0 sm:pl-0">
      <div className="space-y-1.5">
        <p className="text-sm font-bold text-slate-900">Days until envelope expires</p>
        <div
          className={
            afterPreset === 'custom'
              ? 'flex flex-col sm:flex-row sm:items-stretch gap-2 sm:gap-2'
              : 'w-full'
          }
        >
          <div className={afterPreset === 'custom' ? 'flex-1 min-w-0' : 'w-full relative'}>
            <button
              type="button"
              ref={afterRef}
              onClick={() => setOpenMenu((m) => (m === 'after' ? null : 'after'))}
              className={rowClass}
            >
              <span className="truncate text-left">{afterPreset === 'custom' ? 'Custom' : afterLabel}</span>
              <ChevronDown size={16} className="text-slate-400 shrink-0" />
            </button>
            <PortalSelectMenu
              open={openMenu === 'after'}
              onClose={() => setOpenMenu(null)}
              anchorRef={afterRef}
              minWidth={240}
            >
              {EXPIRE_AFTER_MENU.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  onClick={() => {
                    onPatch({ expirationAfterPreset: opt.value });
                    setOpenMenu(null);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-50 flex items-center justify-between gap-2"
                >
                  <span>{opt.label}</span>
                  {afterPreset === opt.value && <Check size={16} className="text-blue-600 shrink-0" strokeWidth={2.5} />}
                </button>
              ))}
            </PortalSelectMenu>
          </div>
          {afterPreset === 'custom' && (
            <>
              <input
                type="number"
                min={1}
                value={afterCustomAmount}
                onChange={(e) => {
                  const n = Math.max(1, Math.floor(Number(e.target.value) || 1));
                  onPatch({ expirationAfterCustomAmount: n });
                }}
                className="w-full sm:w-16 shrink-0 border border-slate-200 rounded-xl px-2 py-2 text-sm text-slate-900 h-12 text-center outline-none focus:ring-2 focus:ring-[#5AA5E7]/30"
                aria-label="Custom duration amount"
              />
              <div className="flex-1 min-w-[100px] relative">
                <button
                  type="button"
                  ref={afterUnitRef}
                  onClick={() => setOpenMenu((m) => (m === 'afterUnit' ? null : 'afterUnit'))}
                  className={rowClass}
                >
                  <span className="truncate">{afterUnitLabel}</span>
                  <ChevronDown size={16} className="text-slate-400 shrink-0" />
                </button>
                <PortalSelectMenu open={openMenu === 'afterUnit'} onClose={() => setOpenMenu(null)} anchorRef={afterUnitRef} minWidth={160}>
                  {TIME_UNIT_MENU.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onPatch({ expirationAfterCustomUnit: opt.value });
                        setOpenMenu(null);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>{opt.label}</span>
                      {afterCustomUnit === opt.value && <Check size={16} className="text-blue-600 shrink-0" />}
                    </button>
                  ))}
                </PortalSelectMenu>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-bold text-slate-900">Alert before expiration date</p>
        <div className={alertPreset === 'custom' ? 'flex flex-col sm:flex-row sm:items-stretch gap-2' : 'w-full'}>
          <div className={alertPreset === 'custom' ? 'flex-1 min-w-0' : 'w-full relative'}>
            <button
              type="button"
              ref={alertRef}
              onClick={() => setOpenMenu((m) => (m === 'alert' ? null : 'alert'))}
              className={rowClass}
            >
              <span className="truncate text-left">{alertPreset === 'custom' ? 'Custom' : alertLabel}</span>
              <ChevronDown size={16} className="text-slate-400 shrink-0" />
            </button>
            <PortalSelectMenu open={openMenu === 'alert'} onClose={() => setOpenMenu(null)} anchorRef={alertRef} minWidth={220}>
              {ALERT_BEFORE_MENU.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onPatch({ expirationAlertPreset: opt.value });
                    setOpenMenu(null);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-50 flex items-center justify-between gap-2"
                >
                  <span>{opt.label}</span>
                  {alertPreset === opt.value && <Check size={16} className="text-blue-600 shrink-0" strokeWidth={2.5} />}
                </button>
              ))}
            </PortalSelectMenu>
          </div>
          {alertPreset === 'custom' && (
            <>
              <input
                type="number"
                min={1}
                value={alertCustomAmount}
                onChange={(e) => {
                  const n = Math.max(1, Math.floor(Number(e.target.value) || 1));
                  onPatch({ expirationAlertCustomAmount: n });
                }}
                className="w-full sm:w-16 shrink-0 border border-slate-200 rounded-xl px-2 py-2 text-sm text-slate-900 h-12 text-center outline-none focus:ring-2 focus:ring-[#5AA5E7]/30"
                aria-label="Custom alert lead amount"
              />
              <div className="flex-1 min-w-[100px] relative">
                <button
                  type="button"
                  ref={alertUnitRef}
                  onClick={() => setOpenMenu((m) => (m === 'alertUnit' ? null : 'alertUnit'))}
                  className={rowClass}
                >
                  <span className="truncate">{alertUnitLabel}</span>
                  <ChevronDown size={16} className="text-slate-400 shrink-0" />
                </button>
                <PortalSelectMenu open={openMenu === 'alertUnit'} onClose={() => setOpenMenu(null)} anchorRef={alertUnitRef} minWidth={160}>
                  {TIME_UNIT_MENU.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onPatch({ expirationAlertCustomUnit: opt.value });
                        setOpenMenu(null);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>{opt.label}</span>
                      {alertCustomUnit === opt.value && <Check size={16} className="text-blue-600 shrink-0" />}
                    </button>
                  ))}
                </PortalSelectMenu>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function removeIdFromGroups(groups: string[][], id: string): string[][] {
  return groups.map((g) => g.filter((x) => x !== id)).filter((g) => g.length > 0);
}

function mergeIntoRecipient(groups: string[][], draggedId: string, targetId: string): string[][] {
  if (draggedId === targetId) return groups;
  const without = removeIdFromGroups(groups, draggedId);
  const ti = without.findIndex((gr) => gr.includes(targetId));
  if (ti < 0) return groups;
  return without.map((gr, i) => (i === ti ? [...gr, draggedId] : gr));
}

function insertSoloBeforeRecipient(groups: string[][], draggedId: string, beforeRecipientId: string): string[][] {
  if (draggedId === beforeRecipientId) return groups;
  const without = removeIdFromGroups(groups, draggedId);
  const ti = without.findIndex((gr) => gr.includes(beforeRecipientId));
  if (ti < 0) return [...without, [draggedId]];
  return [...without.slice(0, ti), [draggedId], ...without.slice(ti)];
}

function appendSoloGroup(groups: string[][], draggedId: string): string[][] {
  return [...removeIdFromGroups(groups, draggedId), [draggedId]];
}

const VariableChip: React.FC<{ label: string; color?: 'blue' | 'purple' | 'orange' }> = ({ label, color = 'blue' }) => {
  const colors = {
    blue: 'bg-white border-slate-200 text-slate-800',
    purple: 'bg-purple-100 border-purple-200 text-purple-700',
    orange: 'bg-orange-100 border-orange-200 text-orange-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[12px] font-medium mx-1 shadow-sm ${colors[color]}`}>
      {label}
      <X size={10} className="ml-1.5 text-slate-400 cursor-pointer" />
    </span>
  );
};

const CoachmarkPortal: React.FC<{
  anchorRef: React.RefObject<HTMLElement | null>;
  title: string;
  content: string;
  onNext: () => void;
  onClose: () => void;
  step: number;
  isLast?: boolean;
}> = ({ anchorRef, title, content, onNext, onClose, step, isLast }) => {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useLayoutEffect(() => {
    const place = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const top = r.top + r.height / 2;
      const left = r.right + 12;
      setPos({ top, left });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [anchorRef]);
  return createPortal(
    <div
      className="fixed z-[100000] w-[min(280px,calc(100vw-24px))] bg-white rounded-xl shadow-2xl border border-slate-100 p-5 pointer-events-auto -translate-y-1/2 animate-in fade-in zoom-in-95 duration-200"
      style={{ top: pos.top, left: pos.left }}
      role="dialog"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-[14px] font-bold text-slate-900 pr-2">{title}</h4>
        <button type="button" onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors shrink-0">
          <X size={16} />
        </button>
      </div>
      <p className="text-[13px] text-slate-600 leading-relaxed mb-6">{content}</p>
      <div className="flex justify-between items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">STEP {step} OF 2</span>
        <button
          type="button"
          onClick={onNext}
          className="px-5 py-1.5 bg-[#7A005D] text-white rounded-lg text-xs font-bold hover:opacity-90 shadow-sm transition-all shrink-0"
        >
          {isLast ? 'Got it' : 'Next'}
        </button>
      </div>
    </div>,
    document.body
  );
};

const EnvelopeCreator: React.FC<EnvelopeCreatorProps> = ({ 
  onExit,
  onSaveAndExit,
  onEditDocument, 
  onCreateTemplate,
  onCreateTemplateWithName,
  onContinue,
  state: persistentState,
  onUpdateState,
  seedPdfPlacementDemo = false,
  onSeedPdfPlacementConsumed,
  correctingFlow = false,
}) => {
  const exitSavingDraft = () => {
    if (onSaveAndExit) onSaveAndExit();
    else onExit();
  };
  const [currentStep, setCurrentStep] = useState<'setup' | 'placement'>('setup');
  const [expandedSections, setExpandedSections] = useState<string[]>(['documents', 'recipients', 'customMessage', 'advanced']);
  const [leftWidth, setLeftWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  
  // Use state from props if available, otherwise local defaults
  const selectedTemplates = persistentState?.selectedTemplates || [];
  const uploadedFiles = persistentState?.uploadedFiles || [];
  const recipients: RecipientSlot[] = useMemo(() => {
    const raw = persistentState?.recipients;
    const base =
      raw && raw.length > 0
        ? raw
        : [{ id: '1', user: null, action: 'Needs to complete' as const, searchTerm: '', isActionDropdownOpen: false }];
    return base.map((r: RecipientSlot & { isSearching?: boolean }) => ({
      id: r.id,
      user: r.user ?? null,
      action: r.action,
      searchTerm: r.searchTerm ?? '',
      isActionDropdownOpen: r.isActionDropdownOpen ?? false,
      customMessage: r.customMessage,
      showCustomMessage: r.showCustomMessage,
      customMessageBodyExpanded: r.customMessageBodyExpanded !== false,
    }));
  }, [persistentState?.recipients]);
  const selectedFolder =
    persistentState?.selectedFolder && String(persistentState.selectedFolder).trim() !== ''
      ? String(persistentState.selectedFolder)
      : ALL_DOCUMENTS_FOLDER_ID;
  const signingOrderEnabled = persistentState?.signingOrderEnabled ?? false;
  const signingOrderGroups: string[][] = persistentState?.signingOrderGroups ?? [];
  const customTemplates: Array<{ name: string; body: string }> = persistentState?.customTemplates ?? [];
  const customMessageSubject = persistentState?.customMessageSubject ?? 'Action required for documents';
  const customMessageBody = persistentState?.customMessageBody ?? 'Please review and complete the documents below\n• {Document names}';
  const advancedTags: string[] = persistentState?.advancedTags ?? [];
  const expirationEnabled = persistentState?.expirationEnabled ?? false;
  const expirationAfterPreset: ExpireAfterPreset = persistentState?.expirationAfterPreset ?? '5_days';
  const expirationAfterCustomAmount = Math.max(1, persistentState?.expirationAfterCustomAmount ?? 5);
  const expirationAfterCustomUnit: ExpirationTimeUnit = persistentState?.expirationAfterCustomUnit ?? 'day';
  const expirationAlertPreset: AlertBeforePreset = persistentState?.expirationAlertPreset ?? 'do_not_send';
  const expirationAlertCustomAmount = Math.max(1, persistentState?.expirationAlertCustomAmount ?? 1);
  const expirationAlertCustomUnit: ExpirationTimeUnit = persistentState?.expirationAlertCustomUnit ?? 'day';
  const envelopeName: string = persistentState?.envelopeName ?? '';
  const envelopeNameTouched: boolean = persistentState?.envelopeNameTouched ?? false;

  const updateState = (updates: any) => {
    onUpdateState?.({
      selectedTemplates,
      uploadedFiles,
      recipients,
      selectedFolder,
      signingOrderEnabled,
      signingOrderGroups,
      customTemplates,
      customMessageSubject,
      customMessageBody,
      advancedTags,
      expirationEnabled,
      expirationAfterPreset,
      expirationAfterCustomAmount,
      expirationAfterCustomUnit,
      expirationAlertPreset,
      expirationAlertCustomAmount,
      expirationAlertCustomUnit,
      envelopeName,
      envelopeNameTouched,
      ...updates
    });
  };

  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [isTagsMenuOpen, setIsTagsMenuOpen] = useState(false);
  const [isPreviewRecipientsExpanded, setIsPreviewRecipientsExpanded] = useState(false);
  const [currentPreviewPage, setCurrentPreviewPage] = useState(1);
  const [messageMode, setMessageMode] = useState<'edit' | 'preview'>('edit');
  const [activeCoachmark, setActiveCoachmark] = useState<number | null>(null);
  const [draggingRecipientId, setDraggingRecipientId] = useState<string | null>(null);
  const [signingOrderSummaryOpen, setSigningOrderSummaryOpen] = useState(false);
  const [dropTargetZone, setDropTargetZone] = useState<string | null>(null);
  const [showRecipientErrors, setShowRecipientErrors] = useState(false);
  const [templateFilter, setTemplateFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [extraTagOptions, setExtraTagOptions] = useState<string[]>([]);
  const [createTagModalOpen, setCreateTagModalOpen] = useState(false);
  const [createTagDraft, setCreateTagDraft] = useState('');
  const [placementFields, setPlacementFields] = useState<PlacementField[]>([]);
  const [selectedPlacementFieldId, setSelectedPlacementFieldId] = useState<string | null>(null);
  const [placementActiveRecipientId, setPlacementActiveRecipientId] = useState('');
  const [placementRecipientMenuOpen, setPlacementRecipientMenuOpen] = useState(false);
  const [autoFieldsModalOpen, setAutoFieldsModalOpen] = useState(false);
  const [showInsertFieldsButton, setShowInsertFieldsButton] = useState(false);
  const [autoModalRecipientId, setAutoModalRecipientId] = useState('');
  const placementPageRef = useRef<HTMLDivElement>(null);
  const placementAutoGateRef = useRef(false);
  const suppressPlacementAutoModalRef = useRef(false);
  const pdfPlacementSeedDoneRef = useRef(false);
  const [fieldDragOffset, setFieldDragOffset] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const [fieldResize, setFieldResize] = useState<{
    id: string;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);
  const [recipientPickerOpenId, setRecipientPickerOpenId] = useState<string | null>(null);
  const [recipientRowMenuId, setRecipientRowMenuId] = useState<string | null>(null);
  const [externalRecipientModal, setExternalRecipientModal] = useState<{
    slotId: string;
    email: string;
    fullName: string;
    title: 'Add external recipient' | 'Edit recipient';
  } | null>(null);

  useEffect(() => {
    if (!recipientPickerOpenId) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = document.querySelector(
        `[data-recipient-picker="${CSS.escape(recipientPickerOpenId)}"]`
      );
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setRecipientPickerOpenId(null);
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [recipientPickerOpenId]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);

  const buildTemplateEditSnapshot = (): { title: string; bodyHtml: string } => {
    const name = selectedTemplates[currentPreviewPage - 1] || 'Document';
    const custom = customTemplates.find((c) => c.name === name);
    const chipStyle =
      'display:inline-flex;align-items:center;margin:0 4px;padding:2px 8px;border-radius:6px;font:inherit;background:#FDF2FB;border:1px solid #F5D0EE;color:inherit';
    const chip = (t: string) =>
      `<span data-chip="recipient-field" data-label="${t.replace(/"/g, '&quot;')}" draggable="true" contenteditable="false" style="${chipStyle}">${t}</span>`;
    if (custom) {
      let html = custom.body;
      if (!html.trim().startsWith('<')) {
        html = custom.body
          .split(/\n+/)
          .filter((p) => p.trim())
          .map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
          .join('');
      }
      return { title: name, bodyHtml: html || '<p></p>' };
    }
    const bodyHtml = `<p>Effective ${chip('Start date')}, , ${chip('Contractor Name')} ("Consultant") and ${chip('Business legal name')} ("Company") agree as follows:</p><p>1. Services; Payment; No Violation of Rights or Obligations.</p><p>Consultant agrees to undertake and complete the Services (as defined in Exhibit A)...</p>`;
    return { title: name, bodyHtml };
  };

  const allTemplateNames = [
    ...TEMPLATES,
    ...customTemplates.map((c) => c.name).filter((n) => !TEMPLATES.includes(n)),
  ];

  const allTagOptionsList = useMemo(
    () => [...TAG_OPTIONS, ...extraTagOptions.filter((t) => !TAG_OPTIONS.includes(t))],
    [extraTagOptions]
  );

  const filteredTemplatesList = useMemo(() => {
    const q = templateFilter.trim().toLowerCase();
    if (!q) return allTemplateNames;
    return allTemplateNames.filter((t) => t.toLowerCase().includes(q));
  }, [allTemplateNames, templateFilter]);

  const filteredFolderTree = useMemo(
    () => filterFolderTree(FOLDER_TREE_ROOTS, locationFilter),
    [locationFilter]
  );

  const filteredTagOptions = useMemo(() => {
    const q = tagFilter.trim().toLowerCase();
    if (!q) return allTagOptionsList;
    return allTagOptionsList.filter((t) => t.toLowerCase().includes(q));
  }, [allTagOptionsList, tagFilter]);

  const tagFilterHasNoExactMatch =
    tagFilter.trim().length > 0 &&
    !allTagOptionsList.some((t) => t.toLowerCase() === tagFilter.trim().toLowerCase());

  const templateFilterHasNoExactMatch =
    templateFilter.trim().length > 0 &&
    !allTemplateNames.some((t) => t.toLowerCase() === templateFilter.trim().toLowerCase());

  const placementRecipientLabel = useCallback(
    (rid: string) => {
      const i = recipients.findIndex((r) => r.id === rid);
      if (i < 0) return 'Recipient';
      return recipients[i].user?.name ?? `Recipient ${i + 1}`;
    },
    [recipients]
  );

  /**
   * Resolve a recipient slot id to a stable accent hex, keyed off the assigned user id when present
   * so the same person keeps the same color regardless of which slot they're sitting in.
   */
  const accentForSlot = useCallback(
    (rid: string) => {
      const slot = recipients.find((r) => r.id === rid);
      const key = slot?.user?.id ?? rid;
      return recipientFieldAccent(key);
    },
    [recipients]
  );

  const defaultFieldSize = (t: PlacementFieldType) => {
    switch (t) {
      case 'text':
        return { w: 150, h: 40 };
      case 'signature':
        return { w: 180, h: 48 };
      case 'date_signed':
        return { w: 140, h: 40 };
      case 'checkbox':
        return { w: 36, h: 36 };
    }
  };

  const fieldTypeLabel = (t: PlacementFieldType) => {
    switch (t) {
      case 'text':
        return 'TEXT';
      case 'signature':
        return 'SIGNATURE';
      case 'date_signed':
        return 'DATE SIGNED';
      case 'checkbox':
        return 'CHECK';
    }
  };

  useEffect(() => {
    if (recipients.length <= 1 && signingOrderEnabled) {
      updateState({ signingOrderEnabled: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- batch envelope updates from parent state
  }, [recipients.length, signingOrderEnabled]);
  const locationRef = useRef<HTMLDivElement>(null);
  const recipientSelectorRef = useRef<HTMLDivElement>(null);
  const fieldsContainerRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const minWidth = 350;
      const maxWidth = window.innerWidth * (2 / 3);
      const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);
      setLeftWidth(newWidth);
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTemplateMenuOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setIsLocationMenuOpen(false);
      }
      if (tagsRef.current && !tagsRef.current.contains(event.target as Node)) {
        setIsTagsMenuOpen(false);
      }
      if (
        recipientPickerOpenId &&
        !(event.target as Element).closest('[data-recipient-picker]')
      ) {
        setRecipientPickerOpenId(null);
      }
      if (
        recipientRowMenuId &&
        !(event.target as Element).closest('[data-recipient-row-menu]')
      ) {
        setRecipientRowMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [recipientPickerOpenId, recipientRowMenuId]);

  useEffect(() => {
    if (currentStep !== 'placement' || uploadedFiles.length === 0) {
      if (currentStep === 'setup') placementAutoGateRef.current = false;
      return;
    }
    if (suppressPlacementAutoModalRef.current) {
      suppressPlacementAutoModalRef.current = false;
      placementAutoGateRef.current = true;
    } else if (!placementAutoGateRef.current) {
      placementAutoGateRef.current = true;
      setAutoFieldsModalOpen(true);
      setShowInsertFieldsButton(false);
    }
    const first = recipients.find((r) => r.user)?.id ?? recipients[0]?.id ?? '';
    setPlacementActiveRecipientId(first);
    setAutoModalRecipientId(first);
  }, [currentStep, uploadedFiles.length, recipients]);

  useEffect(() => {
    if (!seedPdfPlacementDemo) {
      pdfPlacementSeedDoneRef.current = false;
      return;
    }
    if (pdfPlacementSeedDoneRef.current || uploadedFiles.length === 0) return;
    pdfPlacementSeedDoneRef.current = true;
    suppressPlacementAutoModalRef.current = true;
    setCurrentStep('placement');
    const rid = recipients.find((r) => r.user)?.id ?? recipients[0]?.id ?? '1';
    const ts = Date.now();
    setPlacementFields([
      {
        id: `seed-text-${ts}`,
        type: 'text',
        x: 130,
        y: 300,
        w: 220,
        h: 40,
        recipientSlotId: rid,
        required: true,
      },
      {
        id: `seed-sig-${ts}`,
        type: 'signature',
        x: 150,
        y: 400,
        w: 200,
        h: 48,
        recipientSlotId: rid,
        required: true,
      },
      {
        id: `seed-date-${ts}`,
        type: 'date_signed',
        x: 130,
        y: 500,
        w: 160,
        h: 40,
        recipientSlotId: rid,
        required: false,
      },
    ]);
    onSeedPdfPlacementConsumed?.();
  }, [seedPdfPlacementDemo, uploadedFiles.length, recipients, onSeedPdfPlacementConsumed]);

  useEffect(() => {
    if (!fieldDragOffset) return;
    const move = (e: MouseEvent) => {
      const el = placementPageRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPlacementFields((prev) =>
        prev.map((f) => {
          if (f.id !== fieldDragOffset.id) return f;
          let x = e.clientX - r.left - fieldDragOffset.dx;
          let y = e.clientY - r.top - fieldDragOffset.dy;
          x = Math.max(0, Math.min(x, r.width - f.w));
          y = Math.max(0, Math.min(y, r.height - f.h));
          return { ...f, x, y };
        })
      );
    };
    const up = () => setFieldDragOffset(null);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [fieldDragOffset]);

  useEffect(() => {
    if (!fieldResize) return;
    const move = (e: MouseEvent) => {
      const dx = e.clientX - fieldResize.startX;
      const dy = e.clientY - fieldResize.startY;
      setPlacementFields((prev) =>
        prev.map((f) =>
          f.id !== fieldResize.id
            ? f
            : {
                ...f,
                w: Math.max(40, fieldResize.startW + dx),
                h: Math.max(24, fieldResize.startH + dy),
              }
        )
      );
    };
    const up = () => setFieldResize(null);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [fieldResize]);

  const totalPages = selectedTemplates.length > 0 ? selectedTemplates.length : (uploadedFiles.length > 0 ? uploadedFiles.length : 0);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const isExpanded = (id: string) => expandedSections.includes(id);

  const toggleTemplate = (tpl: string) => {
    if (uploadedFiles.length > 0) return;
    const next = selectedTemplates.includes(tpl) ? selectedTemplates.filter(t => t !== tpl) : [...selectedTemplates, tpl];
    updateState({ selectedTemplates: next });
    setTemplateFilter('');
    if (currentPreviewPage > next.length && next.length > 0) {
      setCurrentPreviewPage(next.length);
    } else if (next.length === 1) {
      setCurrentPreviewPage(1);
    }
  };

  const removeOneTemplate = (tpl: string) => {
    const next = selectedTemplates.filter((t) => t !== tpl);
    updateState({ selectedTemplates: next });
    if (currentPreviewPage > next.length && next.length > 0) {
      setCurrentPreviewPage(next.length);
    } else if (next.length === 0) {
      setCurrentPreviewPage(1);
    }
  };

  const clearTemplates = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateState({ selectedTemplates: [] });
    setCurrentPreviewPage(1);
  };

  const addFile = () => {
    if (selectedTemplates.length > 0) return;
    updateState({ uploadedFiles: [...uploadedFiles, pickRandomUpload(uploadedFiles)] });
  };

  const removeFile = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = uploadedFiles.filter((_, i) => i !== idx);
    updateState({ uploadedFiles: next });
    if (currentPreviewPage > next.length) {
      setCurrentPreviewPage(Math.max(1, next.length));
    }
  };

  const handleAddRecipient = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const next = [...recipients, { 
      id: newId, 
      user: null, 
      action: 'Needs to complete' as const, 
      searchTerm: '',
      isActionDropdownOpen: false,
      showCustomMessage: false,
    }];
    const nextGroups = signingOrderEnabled
      ? [...signingOrderGroups, [newId]]
      : signingOrderGroups;
    updateState({ recipients: next, signingOrderGroups: nextGroups });
  };

  const updateRecipient = (id: string, updates: Partial<RecipientSlot>) => {
    const next = recipients.map(r => r.id === id ? { ...r, ...updates } : r);
    updateState({ recipients: next });
    if (updates.user) setShowRecipientErrors(false);
  };

  const toggleTag = (t: string) => {
    const has = advancedTags.includes(t);
    const next = has ? advancedTags.filter((x) => x !== t) : [...advancedTags, t];
    updateState({ advancedTags: next });
    setTagFilter('');
  };

  const removeOneTag = (t: string) => {
    updateState({ advancedTags: advancedTags.filter((x) => x !== t) });
  };

  const clearAllTags = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateState({ advancedTags: [] });
  };

  const commitExternalRecipient = () => {
    if (!externalRecipientModal) return;
    const e = externalRecipientModal.email.trim();
    const n = externalRecipientModal.fullName.trim();
    if (!e || !n) return;
    const user = { id: `ext-${Date.now()}`, name: n, email: e };
    updateRecipient(externalRecipientModal.slotId, { user, searchTerm: '' });
    setExternalRecipientModal(null);
    setRecipientPickerOpenId(null);
  };

  const removeRecipient = (id: string) => {
    const next = recipients.filter(r => r.id !== id);
    const nextGroups = signingOrderGroups.map((g) => g.filter((x) => x !== id)).filter((g) => g.length > 0);
    updateState({ recipients: next, signingOrderGroups: nextGroups });
  };

  const setSigningOrderCheckbox = (enabled: boolean) => {
    if (enabled && recipients.length <= 1) return;
    if (enabled) {
      updateState({
        signingOrderEnabled: true,
        signingOrderGroups: recipients.map((r) => [r.id]),
      });
    } else {
      updateState({ signingOrderEnabled: false });
    }
  };

  const getOrderedRecipients = (): RecipientSlot[] => {
    if (!signingOrderEnabled || signingOrderGroups.length === 0) return recipients;
    return signingOrderGroups
      .flat()
      .map((id) => recipients.find((r) => r.id === id))
      .filter((r): r is RecipientSlot => r != null);
  };

  const recipientDisplayLabel = (r: RecipientSlot) =>
    r.user?.name || (r.searchTerm?.trim() ? r.searchTerm : '') || 'Recipient';

  const applyGroups = (nextGroups: string[][]) => {
    updateState({ signingOrderGroups: nextGroups });
  };

  const hasDocuments = selectedTemplates.length > 0 || uploadedFiles.length > 0;
  const canContinue = hasDocuments;

  /** Doc-derived envelope name, computed only when user hasn't manually edited it. */
  const derivedEnvelopeName = useMemo(() => {
    const docNames = [
      ...selectedTemplates.map((t: string) => String(t).replace(/\.pdf$/i, '').trim()),
      ...uploadedFiles.map((f: { name: string }) => f.name.replace(/\.pdf$/i, '').trim()),
    ].filter((n) => n.length > 0);
    if (docNames.length === 0) return '';
    const joined = docNames.join('; ');
    return joined.length > ENVELOPE_NAME_MAX_LENGTH
      ? `${joined.slice(0, ENVELOPE_NAME_MAX_LENGTH - 1)}…`
      : joined;
  }, [selectedTemplates, uploadedFiles]);

  /** What we render in the sub-header; falls back to the bracket placeholder when no docs + no edit. */
  const displayedEnvelopeName = envelopeNameTouched
    ? envelopeName || derivedEnvelopeName || '[Envelope Name]'
    : derivedEnvelopeName || envelopeName || '[Envelope Name]';

  const commitEnvelopeName = (next: string) => {
    const trimmed = next.trim().slice(0, ENVELOPE_NAME_MAX_LENGTH);
    if (trimmed === '') {
      updateState({ envelopeName: '', envelopeNameTouched: false });
    } else {
      updateState({ envelopeName: trimmed, envelopeNameTouched: true });
    }
  };

  const [isEditingEnvelopeName, setIsEditingEnvelopeName] = useState(false);
  const [envelopeNameDraft, setEnvelopeNameDraft] = useState('');
  const envelopeNameInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isEditingEnvelopeName) {
      envelopeNameInputRef.current?.focus();
      envelopeNameInputRef.current?.select();
    }
  }, [isEditingEnvelopeName]);

  const beginEditingEnvelopeName = () => {
    const seed = envelopeNameTouched
      ? envelopeName
      : derivedEnvelopeName || envelopeName || '';
    setEnvelopeNameDraft(seed);
    setIsEditingEnvelopeName(true);
  };

  const renderEnvelopeNameField = () => {
    if (isEditingEnvelopeName) {
      return (
        <div className="flex items-center space-x-2">
          <input
            ref={envelopeNameInputRef}
            type="text"
            value={envelopeNameDraft}
            onChange={(e) => setEnvelopeNameDraft(e.target.value.slice(0, ENVELOPE_NAME_MAX_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitEnvelopeName(envelopeNameDraft);
                setIsEditingEnvelopeName(false);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setIsEditingEnvelopeName(false);
              }
            }}
            onBlur={() => {
              commitEnvelopeName(envelopeNameDraft);
              setIsEditingEnvelopeName(false);
            }}
            maxLength={ENVELOPE_NAME_MAX_LENGTH}
            placeholder="[Envelope Name]"
            aria-label="Envelope name"
            className="text-sm font-bold text-slate-800 px-2 py-0.5 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-[#7A005D]/30 bg-white min-w-[200px]"
          />
          <span className="text-[11px] text-slate-400 tabular-nums">
            {envelopeNameDraft.length}/{ENVELOPE_NAME_MAX_LENGTH}
          </span>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={beginEditingEnvelopeName}
        className="flex items-center space-x-2 group rounded-md px-1.5 py-0.5 hover:bg-slate-50 transition-colors"
        title="Rename envelope"
        aria-label="Edit envelope name"
      >
        <span className="text-sm font-bold text-slate-800 truncate max-w-[460px]">{displayedEnvelopeName}</span>
        <Pencil size={14} className="text-slate-400 group-hover:text-slate-600" />
      </button>
    );
  };

  const handleContinue = () => {
    if (!hasDocuments) return;
    const allRecipientsFilled = recipients.every((r) => r.user !== null);
    if (!allRecipientsFilled) {
      setShowRecipientErrors(true);
      return;
    }
    setShowRecipientErrors(false);
    if (currentStep === 'setup' && uploadedFiles.length > 0) {
      setCurrentStep('placement');
      setTimeout(() => setActiveCoachmark(1), 600);
    } else {
      const finalName =
        (envelopeNameTouched && envelopeName.trim()) ||
        derivedEnvelopeName ||
        selectedTemplates[0] ||
        uploadedFiles[0]?.name ||
        '[Envelope Name]';
      onContinue?.(finalName);
    }
  };

  const isUserAlreadyRecipient = (user: { id: string; email?: string }, exceptSlotId: string) =>
    recipients.some(
      (r) =>
        r.id !== exceptSlotId &&
        r.user &&
        (r.user.id === user.id || (user.email && r.user.email && r.user.email.toLowerCase() === user.email.toLowerCase()))
    );

  const renderRecipientUserPicker = (recipient: RecipientSlot, opts: { placeholder: string; variant: 'signing' | 'parallel' }) => {
    const open = recipientPickerOpenId === recipient.id;
    const err = showRecipientErrors && !recipient.user;
    const triggerErr = err ? 'border-red-500 ring-2 ring-red-200' : 'border-slate-200';
    const minW = opts.variant === 'parallel' ? 'min-w-0' : 'min-w-[140px]';
    const q = recipient.searchTerm.trim();
    const mockMatches = filterMockUsers(recipient.searchTerm);
    const hasNoDirectoryMatch = q.length > 0 && mockMatches.length === 0;

    const list = mockMatches.map((user) => {
      const taken = isUserAlreadyRecipient(user, recipient.id);
      if (taken) {
        return (
          <div key={user.id} className="group relative px-4 py-2 opacity-50 cursor-not-allowed select-none" title="recipient existed">
            <p className="text-sm font-bold text-slate-800">{user.name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
            <div className="absolute left-2 top-full mt-1 px-3 py-2 bg-[#EDEBE7] border border-slate-300/40 rounded-lg shadow-md text-[12px] text-slate-700 max-w-[220px] text-left z-[500] pointer-events-none leading-snug opacity-0 group-hover:opacity-100 transition-opacity">
              recipient existed
            </div>
          </div>
        );
      }
      return (
        <div
          key={user.id}
          role="button"
          tabIndex={0}
          onClick={() => {
            updateRecipient(recipient.id, { user, searchTerm: '' });
            setRecipientPickerOpenId(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              updateRecipient(recipient.id, { user, searchTerm: '' });
              setRecipientPickerOpenId(null);
            }
          }}
          className="px-4 py-2 hover:bg-slate-50 cursor-pointer"
        >
          <p className="text-sm font-bold text-slate-800">{user.name}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
      );
    });

    const openAddExternal = (raw: string) => {
      const t = raw.trim();
      const looksEmail = t.includes('@');
      setExternalRecipientModal({
        slotId: recipient.id,
        email: looksEmail ? t : '',
        fullName: looksEmail ? '' : t,
        title: 'Add external recipient',
      });
      setRecipientPickerOpenId(null);
    };

    return (
      <div className={`flex-1 relative ${minW}`} data-recipient-picker={recipient.id}>
        {recipient.user ? (
          <div className="w-full flex items-center border border-slate-200 rounded-xl px-2 py-2 bg-white h-12 shadow-sm gap-1">
            <button
              type="button"
              onClick={() => setRecipientPickerOpenId(open ? null : recipient.id)}
              className="flex items-center space-x-3 min-w-0 flex-1 text-left rounded-lg px-2 py-1 hover:bg-slate-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5AA5E7]/45"
            >
              <div className="w-7 h-7 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 bg-slate-50 overflow-hidden shrink-0">
                <User size={16} />
              </div>
              <span className="text-sm font-medium text-slate-800 truncate">{recipient.user.name}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                updateRecipient(recipient.id, { user: null });
                setRecipientPickerOpenId(null);
              }}
              className="p-1 hover:bg-slate-100 rounded-full shrink-0"
              aria-label="Clear recipient"
            >
              <X size={14} className="text-slate-400" />
            </button>
          </div>
        ) : (
          <div
            className={`w-full flex items-center rounded-xl px-2 py-2 bg-white h-12 border gap-2 transition-colors ${triggerErr} ${!err ? 'border-slate-200 hover:border-slate-300' : ''}`}
          >
            <Search className="text-slate-400 shrink-0 ml-1" size={16} aria-hidden />
            <input
              type="text"
              value={recipient.searchTerm}
              onChange={(e) => {
                updateRecipient(recipient.id, { searchTerm: e.target.value });
                setRecipientPickerOpenId(recipient.id);
              }}
              onFocus={() => setRecipientPickerOpenId(recipient.id)}
              placeholder={opts.placeholder}
              className="flex-1 min-w-0 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
            />
            <button
              type="button"
              className="p-1 text-slate-400 hover:text-slate-600 shrink-0 rounded"
              aria-label={open ? 'Close list' : 'Open list'}
              onClick={() => setRecipientPickerOpenId(open ? null : recipient.id)}
            >
              <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}
        {open && !recipient.user && (
          <div className="absolute z-[400] top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col overflow-hidden max-h-[min(360px,70vh)]">
            <div className="max-h-52 min-h-0 overflow-y-auto custom-scrollbar">{list.length > 0 ? list : <p className="px-4 py-6 text-sm text-slate-500 text-center">No internal matches</p>}</div>
            <div className="border-t border-slate-200 bg-white shrink-0 flex flex-col">
              {hasNoDirectoryMatch && q ? (
                <button
                  type="button"
                  onClick={() => openAddExternal(q)}
                  className={`w-full text-left px-4 py-3 text-sm font-semibold ${TEXT_LINK} hover:bg-slate-50`}
                >
                  Add &apos;{q}&apos; as external recipient
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAddExternal('')}
                  className={`w-full text-left px-4 py-3 text-sm font-semibold ${TEXT_LINK} hover:bg-slate-50`}
                >
                  Add external recipient
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const isUploadMode = uploadedFiles.length > 0;

  const addPlacementFieldAt = (type: PlacementFieldType, clientX: number, clientY: number) => {
    const el = placementPageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const { w, h } = defaultFieldSize(type);
    let x = clientX - r.left - w / 2;
    let y = clientY - r.top - h / 2;
    x = Math.max(0, Math.min(x, r.width - w));
    y = Math.max(0, Math.min(y, r.height - h));
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const rid = placementActiveRecipientId || recipients[0]?.id || '';
    setPlacementFields((prev) => [
      ...prev,
      { id, type, x, y, w, h, recipientSlotId: rid, required: true },
    ]);
    setSelectedPlacementFieldId(id);
  };

  const updateSelectedPlacementField = (patch: Partial<PlacementField>) => {
    if (!selectedPlacementFieldId) return;
    setPlacementFields((prev) =>
      prev.map((f) => (f.id === selectedPlacementFieldId ? { ...f, ...patch } : f))
    );
  };

  const onPlacementFieldMouseDown = (e: React.MouseEvent, fid: string) => {
    e.stopPropagation();
    setSelectedPlacementFieldId(fid);
    const f = placementFields.find((x) => x.id === fid);
    const el = placementPageRef.current;
    if (!f || !el) return;
    const r = el.getBoundingClientRect();
    setFieldDragOffset({ id: fid, dx: e.clientX - r.left - f.x, dy: e.clientY - r.top - f.y });
  };

  const insertAutoFieldsFromModal = () => {
    const rid = autoModalRecipientId || recipients[0]?.id || '';
    const presets: { type: PlacementFieldType; x: number; y: number }[] = [
      { type: 'text', x: 72, y: 260 },
      { type: 'signature', x: 72, y: 380 },
      { type: 'date_signed', x: 420, y: 380 },
    ];
    const newFields: PlacementField[] = presets.map((p, i) => {
      const { w, h } = defaultFieldSize(p.type);
      return {
        id: `auto-${Date.now()}-${i}`,
        type: p.type,
        x: p.x,
        y: p.y,
        w,
        h,
        recipientSlotId: rid,
        required: true,
      };
    });
    setPlacementFields((prev) => [...prev, ...newFields]);
    setAutoFieldsModalOpen(false);
    setShowInsertFieldsButton(false);
  };

  const renderCreateTagModal = () =>
    createTagModalOpen ? (
      <div
        className="fixed inset-0 z-[600] flex items-center justify-center bg-black/40 p-4"
        onClick={() => setCreateTagModalOpen(false)}
        role="presentation"
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[520px] border border-slate-100"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-labelledby="create-tag-title"
        >
          <div className="flex items-start justify-between p-5 pb-2">
            <h2 id="create-tag-title" className="text-lg font-bold text-slate-900">
              Create tag
            </h2>
            <button
              type="button"
              onClick={() => setCreateTagModalOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
          <p className="px-5 text-sm text-slate-600 leading-relaxed">
            You can use tags to organize your documents. Create a new tag using the fields below.
          </p>
          <div className="p-5 pt-4 space-y-2">
            <label className="text-sm font-bold text-slate-900">
              Tags name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={createTagDraft}
              onChange={(e) => setCreateTagDraft(e.target.value)}
              placeholder="Enter name"
              className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-[#7A005D]/30"
            />
          </div>
          <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/80 rounded-b-2xl">
            <button
              type="button"
              onClick={() => setCreateTagModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!createTagDraft.trim()}
              onClick={() => {
                const t = createTagDraft.trim();
                if (!t) return;
                setExtraTagOptions((prev) => (prev.includes(t) || TAG_OPTIONS.includes(t) ? prev : [...prev, t]));
                if (!advancedTags.includes(t)) updateState({ advancedTags: [...advancedTags, t] });
                setCreateTagModalOpen(false);
                setIsTagsMenuOpen(false);
                setTagFilter('');
              }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#7A005D] hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    ) : null;

  if (currentStep === 'placement') {
    const displayName = placementRecipientLabel(placementActiveRecipientId);
    const selectedField = placementFields.find((f) => f.id === selectedPlacementFieldId) ?? null;
    const pageW = placementPageRef.current?.clientWidth ?? 850;

    return (
      <>
        {renderCreateTagModal()}
        {autoFieldsModalOpen && (
          <div
            className="fixed inset-0 z-[550] flex items-center justify-center bg-black/40 p-4"
            onClick={() => setAutoFieldsModalOpen(false)}
            role="presentation"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-[520px] border border-slate-100 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
            >
              <div className="flex justify-end p-2">
                <button
                  type="button"
                  onClick={() => setAutoFieldsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="px-8 pb-2 text-center">
                <div className="mx-auto w-14 h-14 rounded-xl bg-[#F3E8FF] flex items-center justify-center mb-4">
                  <Sparkles className="text-[#7A005D]" size={28} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">Insert fields automatically?</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  We detected empty lines in your document. Would you like to automatically insert signature and text fields for a recipient?
                </p>
              </div>
              <div className="px-8 pb-6">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Select recipient</p>
                <div className="relative">
                  <select
                    value={autoModalRecipientId}
                    onChange={(e) => setAutoModalRecipientId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-900 appearance-none bg-white cursor-pointer outline-none focus:ring-2 focus:ring-[#7A005D]/25"
                  >
                    {recipients.map((r, i) => (
                      <option key={r.id} value={r.id}>
                        {r.user?.name ?? `Recipient ${i + 1}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="px-8 pb-6 space-y-3 bg-slate-50/80 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={insertAutoFieldsFromModal}
                  className="w-full py-3 rounded-xl bg-[#7A005D] text-white text-sm font-bold hover:opacity-95"
                >
                  Insert fields
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAutoFieldsModalOpen(false);
                    setShowInsertFieldsButton(true);
                  }}
                  className="w-full py-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        )}
      <div className="flex flex-col h-screen bg-[#F9FAFB] overflow-hidden text-[#1e293b]">
        {/* Placement Header */}
        <header className="h-14 border-b border-slate-200 px-4 flex items-center justify-between shrink-0 bg-white z-[100]">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 6C7 6 4 9 4 12C4 15 7 18 7 18" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 6C12 6 9 9 9 12C9 15 12 18 12 18" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
                <path d="M17 6C17 6 14 9 14 12C14 15 17 18 17 18" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center space-x-2 cursor-pointer group">
              <span className="text-sm font-semibold text-slate-700">Tools</span>
              <ChevronDown size={14} className="text-slate-500" />
            </div>
          </div>

          <div className="flex-1 max-w-2xl px-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search or jump to" 
                className="w-full bg-[#f1f5f9] border-none rounded-md py-2 pl-10 pr-4 text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <HelpCircle size={18} className="text-slate-500 cursor-pointer" />
            <Accessibility size={18} className="text-slate-500 cursor-pointer" />
            <div className="p-1 border border-slate-200 rounded text-slate-500"><FileText size={18} /></div>
            <Bell size={18} className="text-slate-500 cursor-pointer" />
            <Globe size={18} className="text-slate-500 cursor-pointer" />
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center space-x-3 cursor-pointer">
              <span className="text-sm text-slate-600 font-medium">Acme</span>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
                <img src="https://picsum.photos/id/177/100/100" alt="Avatar" />
              </div>
            </div>
          </div>
        </header>

        {/* Sub Header */}
        <div className="h-12 border-b border-slate-100 flex items-center justify-between px-4 shrink-0 bg-white">
          <div className="flex items-center space-x-2 ml-4">
            {renderEnvelopeNameField()}
          </div>
          <div className="flex items-center space-x-4 mr-4">
            <button type="button" onClick={exitSavingDraft} className="flex items-center space-x-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
              <LogOut size={16} />
              <span>Save and exit</span>
            </button>
            <MoreVertical size={16} className="text-slate-500 cursor-pointer" />
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          <div className="w-64 border-r border-slate-200 bg-white flex flex-col p-5 space-y-4 shrink-0 relative overflow-y-auto custom-scrollbar">
            <div>
              <h3 className="text-[12px] font-bold text-slate-500 mb-3 uppercase tracking-widest">Fields</h3>
              {showInsertFieldsButton && (
                <button
                  type="button"
                  onClick={() => setAutoFieldsModalOpen(true)}
                  className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-[#7A005D] bg-[#FDF2FB] text-[#7A005D] text-sm font-bold hover:opacity-90 shadow-sm"
                >
                  <FileInput size={18} />
                  Insert fields
                </button>
              )}
              <div className="relative mb-4">
                <button
                  type="button"
                  ref={recipientSelectorRef}
                  onClick={() => setPlacementRecipientMenuOpen((o) => !o)}
                  className="w-full border-2 border-[#14B8A6] rounded-xl px-4 py-2 flex items-center justify-between bg-white cursor-pointer hover:bg-slate-50 shadow-sm transition-all"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                      <User size={14} />
                    </div>
                    <span className="text-sm font-medium text-slate-800 truncate">{displayName}</span>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${placementRecipientMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {placementRecipientMenuOpen && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto py-1">
                    {recipients.map((r, i) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setPlacementActiveRecipientId(r.id);
                          setPlacementRecipientMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 font-medium text-slate-800"
                      >
                        {r.user?.name ?? `Recipient ${i + 1}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div ref={fieldsContainerRef} className="space-y-3 relative">
                {(
                  [
                    { type: 'text' as const, label: 'Text', Icon: Type },
                    { type: 'signature' as const, label: 'Signature', Icon: PenTool },
                    { type: 'date_signed' as const, label: 'Date signed', Icon: Calendar },
                    { type: 'checkbox' as const, label: 'Checkbox', Icon: CheckSquare },
                  ] as const
                ).map(({ type, label, Icon }) => (
                  <div
                    key={type}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(PLACEMENT_FIELD_MIME, type);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="flex items-center justify-between border border-slate-200 p-3.5 rounded-xl cursor-grab active:cursor-grabbing bg-white hover:border-slate-300 transition-all shadow-sm group"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon size={18} className="text-slate-700" />
                      <span className="text-sm font-bold text-slate-800">{label}</span>
                    </div>
                    <GripVertical size={16} className="text-slate-300 group-hover:text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 bg-[#F1F5F9] flex flex-col relative overflow-hidden min-w-0">
            <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 py-1.5 px-4 flex items-center justify-start space-x-4 shrink-0">
              <div className="flex items-center space-x-1 border border-slate-200 rounded px-2 py-1 bg-white text-[12px] font-bold">
                <span>256%</span>
                <ChevronDown size={14} className="text-slate-400" />
              </div>
              <div className="flex items-center bg-white border border-slate-200 rounded overflow-hidden">
                <button type="button" className="p-1.5 hover:bg-slate-50 border-r border-slate-200 text-slate-400">
                  <Minus size={14} />
                </button>
                <button type="button" className="p-1.5 hover:bg-slate-50 text-slate-400">
                  <Plus size={14} />
                </button>
              </div>
              <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600">
                <Hand size={18} />
              </button>
              <div className="flex-1" />
              <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600">
                <Search size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar flex flex-col items-center">
              <div
                ref={placementPageRef}
                onClick={() => setSelectedPlacementFieldId(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const type = e.dataTransfer.getData(PLACEMENT_FIELD_MIME) as PlacementFieldType;
                  if (!type || !['text', 'signature', 'date_signed', 'checkbox'].includes(type)) return;
                  addPlacementFieldAt(type, e.clientX, e.clientY);
                }}
                className="max-w-[850px] w-full bg-white shadow-xl min-h-[1100px] p-24 text-[15px] leading-relaxed text-slate-800 border border-slate-100 relative select-none"
              >
                <div className="pointer-events-none space-y-6">
                  <h1 className="text-center font-bold mb-10 text-lg uppercase tracking-tight">
                    PROPRIETARY INFORMATION AND INVENTIONS AGREEMENT
                    <br />
                    <span className="normal-case">(California employees)</span>
                  </h1>
                  <p className="mb-6">
                    The following confirms and memorializes an agreement that{' '}
                    <span className="underline decoration-dotted font-medium text-slate-900">Business legal name</span>, (the
                    “Company”) and I (
                    <span className="underline decoration-dotted font-medium text-slate-900">Full name</span>) have had since the
                    commencement of my employment with the Company in any capacity and that is and has been a material part of the
                    consideration for my employment by Company:
                  </p>
                  <div className="space-y-6">
                    <p>
                      1. I have not entered into, and I agree I will not enter into, any agreement either written or oral in conflict
                      with this Agreement or my employment with Company...
                    </p>
                    <p>
                      2. Company shall own all right, title and interest (including patent rights, copyrights, trade secret rights,
                      mask work rights, sui generis database rights and all other intellectual property rights of any sort throughout
                      the world)...
                    </p>
                  </div>
                </div>

                <div className="absolute inset-0 pointer-events-none p-24">
                  <div className="relative w-full h-full pointer-events-auto">
                    {placementFields.map((f) => {
                      const accent = accentForSlot(f.recipientSlotId);
                      const selected = selectedPlacementFieldId === f.id;
                      return (
                        <div
                          key={f.id}
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlacementFieldId(f.id);
                          }}
                          onMouseDown={(e) => onPlacementFieldMouseDown(e, f.id)}
                          className="absolute rounded-md border-2 flex flex-col justify-center items-stretch px-1.5 py-1 shadow-sm cursor-move"
                          style={{
                            left: f.x,
                            top: f.y,
                            width: f.w,
                            height: f.h,
                            borderColor: accent,
                            backgroundColor: hexToRgba(accent, 0.22),
                            boxShadow: selected ? `0 0 0 2px ${accent}99` : undefined,
                          }}
                        >
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-xs leading-none shadow z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlacementFields((prev) => prev.filter((x) => x.id !== f.id));
                              if (selectedPlacementFieldId === f.id) setSelectedPlacementFieldId(null);
                            }}
                            aria-label="Remove field"
                          >
                            ×
                          </button>
                          <div
                            role="presentation"
                            className="absolute bottom-0 right-0 w-2.5 h-2.5 cursor-se-resize rounded-tl border border-slate-300/80 bg-white/95 z-10"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setFieldResize({
                                id: f.id,
                                startX: e.clientX,
                                startY: e.clientY,
                                startW: f.w,
                                startH: f.h,
                              });
                            }}
                          />
                          <span className="text-[10px] font-bold text-slate-700 text-center leading-tight">{fieldTypeLabel(f.type)}</span>
                          <span className="text-[9px] text-slate-500 flex items-center gap-1 mt-0.5 justify-center truncate max-w-full">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />
                            <span className="truncate">{placementRecipientLabel(f.recipientSlotId)}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {selectedField && (
            <div className="w-80 border-l border-slate-200 bg-white flex flex-col shrink-0 z-40 shadow-[ -4px_0_24px_rgba(0,0,0,0.06)] overflow-y-auto custom-scrollbar">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">1 selected</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50"
                    aria-label="Duplicate"
                    onClick={() => {
                      const copy: PlacementField = {
                        ...selectedField,
                        id: `${Date.now()}-dup`,
                        x: selectedField.x + 16,
                        y: selectedField.y + 16,
                      };
                      setPlacementFields((prev) => [...prev, copy]);
                      setSelectedPlacementFieldId(copy.id);
                    }}
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    type="button"
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-50"
                    aria-label="Delete"
                    onClick={() => {
                      setPlacementFields((prev) => prev.filter((x) => x.id !== selectedField.id));
                      setSelectedPlacementFieldId(null);
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-4 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Recipient</p>
                {(() => {
                  const panelAccent = accentForSlot(selectedField.recipientSlotId);
                  return (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div
                    className="w-10 h-10 rounded-full border flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      backgroundColor: hexToRgba(panelAccent, 0.28),
                      borderColor: panelAccent,
                      color: panelAccent,
                    }}
                  >
                    {placementRecipientLabel(selectedField.recipientSlotId).slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{placementRecipientLabel(selectedField.recipientSlotId)}</p>
                    <p className="text-xs text-slate-500">Assigned signer</p>
                  </div>
                </div>
                  );
                })()}
                <label className="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedField.required}
                    onChange={(e) => updateSelectedPlacementField({ required: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#7A005D]"
                  />
                  Required
                </label>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Location</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <label className="col-span-2 text-xs text-slate-500">Page number</label>
                  <input
                    type="number"
                    readOnly
                    value={1}
                    className="col-span-2 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                  />
                  <label className="col-span-2 text-xs text-slate-500">px from left</label>
                  <input
                    type="number"
                    value={Math.round(selectedField.x)}
                    onChange={(e) => updateSelectedPlacementField({ x: Number(e.target.value) || 0 })}
                    className="col-span-2 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                  />
                  <label className="col-span-2 text-xs text-slate-500">px from right</label>
                  <input
                    type="number"
                    value={Math.max(0, Math.round(pageW - selectedField.x - selectedField.w))}
                    readOnly
                    className="col-span-2 border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-slate-50"
                  />
                  <label className="col-span-2 text-xs text-slate-500">px wide</label>
                  <input
                    type="number"
                    value={Math.round(selectedField.w)}
                    onChange={(e) => updateSelectedPlacementField({ w: Math.max(24, Number(e.target.value) || 24) })}
                    className="col-span-2 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                  />
                  <label className="col-span-2 text-xs text-slate-500">px tall</label>
                  <input
                    type="number"
                    value={Math.round(selectedField.h)}
                    onChange={(e) => updateSelectedPlacementField({ h: Math.max(24, Number(e.target.value) || 24) })}
                    className="col-span-2 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="h-16 border-t border-slate-200 px-8 flex items-center justify-between shrink-0 bg-white z-[100]">
          <button onClick={() => setCurrentStep('setup')} className="flex items-center space-x-2 text-sm font-bold text-slate-700 hover:text-slate-900">
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>
          <button onClick={() => handleContinue()} className="font-bold px-10 py-3 rounded-xl bg-[#7A005D] text-white hover:opacity-90 shadow-lg transition-all">
            {correctingFlow ? 'Resend' : 'Send'}
          </button>
        </footer>
      </div>
      {activeCoachmark === 1 && (
        <CoachmarkPortal
          anchorRef={recipientSelectorRef}
          title="Switch recipients"
          content="You can switch recipients to add fields here."
          step={1}
          onNext={() => setActiveCoachmark(2)}
          onClose={() => setActiveCoachmark(null)}
        />
      )}
      {activeCoachmark === 2 && (
        <CoachmarkPortal
          anchorRef={fieldsContainerRef}
          title="Drag and drop fields"
          content="Drag fields onto the document. They sit above the static PDF text."
          step={2}
          isLast
          onNext={() => setActiveCoachmark(null)}
          onClose={() => setActiveCoachmark(null)}
        />
      )}
      </>
    );
  }

  const externalFormValid =
    !!externalRecipientModal && externalRecipientModal.email.trim() !== '' && externalRecipientModal.fullName.trim() !== '';

  return (
    <>
      {renderCreateTagModal()}
      {externalRecipientModal && (
        <div
          className="fixed inset-0 z-[650] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setExternalRecipientModal(null)}
          role="presentation"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="external-recipient-title"
          >
            <div className="flex items-start justify-between p-5 pb-2">
              <h2 id="external-recipient-title" className="text-lg font-bold text-slate-900 pr-2">
                {externalRecipientModal.title}
              </h2>
              <button
                type="button"
                onClick={() => setExternalRecipientModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-5 pb-2 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-900">
                  Recipient email<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={externalRecipientModal.email}
                  onChange={(e) =>
                    setExternalRecipientModal((m) => (m ? { ...m, email: e.target.value } : m))
                  }
                  placeholder="Enter email"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5AA5E7]/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-900">
                  Full name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={externalRecipientModal.fullName}
                  onChange={(e) =>
                    setExternalRecipientModal((m) => (m ? { ...m, fullName: e.target.value } : m))
                  }
                  placeholder="Enter full name"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5AA5E7]/30"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setExternalRecipientModal(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 text-slate-800 bg-white hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!externalFormValid}
                onClick={commitExternalRecipient}
                className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity ${
                  externalFormValid ? 'bg-[#7A005D] hover:opacity-90' : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    <div className={`flex flex-col h-screen bg-white overflow-hidden text-[#1e293b] ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
      <header className="h-14 border-b border-slate-200 px-4 flex items-center justify-between shrink-0 bg-white z-[100]">
        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 6C7 6 4 9 4 12C4 15 7 18 7 18" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 6C12 6 9 9 9 12C9 15 12 18 12 18" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
              <path d="M17 6C17 6 14 9 14 12C14 15 17 18 17 18" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="flex items-center space-x-2 cursor-pointer group">
            <span className="text-sm font-semibold text-slate-700">Tools</span>
            <ChevronDown size={14} className="text-slate-500" />
          </div>
        </div>

        <div className="flex-1 max-w-2xl px-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search or jump to" className="w-full bg-[#f1f5f9] border-none rounded-md py-2 pl-10 pr-4 text-sm outline-none" />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <HelpCircle size={18} className="text-slate-500 cursor-pointer" />
          <Accessibility size={18} className="text-slate-500 cursor-pointer" />
          <CheckSquare size={18} className="text-slate-500 cursor-pointer" />
          <Bell size={18} className="text-slate-500 cursor-pointer" />
          <Globe size={18} className="text-slate-500 cursor-pointer" />
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <div className="flex items-center space-x-3 cursor-pointer">
            <span className="text-sm text-slate-600 font-medium">Acme</span>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
              <img src="https://picsum.photos/id/177/100/100" alt="Avatar" />
            </div>
          </div>
        </div>
      </header>

      <div className="h-12 border-b border-slate-100 flex items-center justify-between px-4 shrink-0 bg-white z-[90]">
        <div className="flex items-center space-x-2">
          {renderEnvelopeNameField()}
        </div>
        <div className="flex items-center space-x-4">
          <button type="button" onClick={exitSavingDraft} className="flex items-center space-x-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
            <LogOut size={16} />
            <span>Save and exit</span>
          </button>
          <MoreVertical size={16} className="text-slate-500 cursor-pointer" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div 
          className="bg-slate-50/10 overflow-y-auto overflow-x-hidden custom-scrollbar p-6 space-y-4 shrink-0" 
          style={{ width: `${leftWidth}px`, minWidth: `${leftWidth}px`, maxWidth: `${leftWidth}px` }}
        >
          <div className="border border-slate-200 rounded-2xl overflow-visible shadow-sm bg-white relative">
            <button onClick={() => toggleSection('documents')} className="w-full flex items-center justify-between p-5 bg-white text-left group rounded-t-2xl">
              <h3 className="font-bold text-lg text-slate-800">Documents</h3>
              {isExpanded('documents') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {isExpanded('documents') && (
              <div className="px-5 pb-6 space-y-6">
                <div className="space-y-2 relative rounded-lg" ref={dropdownRef}>
                  <label className="text-sm font-bold text-slate-800">Select templates</label>
                  {uploadedFiles.length > 0 ? (
                    <DisabledWithTooltip message="Remove uploaded documents to allow selecting documents">
                      <div className="rounded-lg">
                        <div className="w-full border border-slate-200 rounded-lg min-h-[44px] px-3 py-2 flex items-stretch gap-2 bg-slate-50 opacity-50 overflow-hidden">
                          <Search className="text-slate-400 shrink-0 mt-1.5" size={16} />
                          <div className="flex flex-1 min-w-0 flex-col gap-1.5 py-0.5 min-h-0">
                            <div className="max-h-[3.25rem] min-h-0 overflow-y-auto overflow-x-hidden flex flex-wrap gap-1.5 content-start custom-scrollbar">
                              {selectedTemplates.map((t) => (
                                <span
                                  key={t}
                                  className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded shrink-0 max-w-[200px] truncate"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                            <span className="text-slate-400 text-[13px] leading-tight">Search</span>
                          </div>
                          <ChevronDown size={14} className="text-slate-400 shrink-0 self-end mb-0.5" />
                        </div>
                      </div>
                    </DisabledWithTooltip>
                  ) : (
                    <>
                      <div
                        className={`w-full border border-slate-200 rounded-lg bg-white flex items-stretch gap-2 px-3 py-2 min-h-[44px] focus-within:ring-2 focus-within:ring-[#5AA5E7]/45 focus-within:border-[#5AA5E7]`}
                      >
                        <Search className="text-slate-400 shrink-0 mt-1.5" size={16} />
                        <div className="flex flex-1 min-w-0 flex-col gap-1.5 min-h-0 py-0.5">
                          <div className="max-h-[3.25rem] min-h-0 overflow-y-auto overflow-x-hidden flex flex-wrap gap-1.5 content-start custom-scrollbar">
                            {selectedTemplates.map((t) => (
                              <span
                                key={t}
                                className="inline-flex items-center gap-1 shrink-0 max-w-[min(200px,100%)] bg-slate-100 text-slate-800 text-[11px] pl-2 pr-1 py-0.5 rounded border border-slate-200/80"
                              >
                                <span className="truncate">{t}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeOneTemplate(t);
                                  }}
                                  className="shrink-0 rounded p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                                  aria-label={`Remove ${t}`}
                                >
                                  <X size={12} strokeWidth={2.5} />
                                </button>
                              </span>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={templateFilter}
                            onChange={(e) => {
                              setTemplateFilter(e.target.value);
                              setIsTemplateMenuOpen(true);
                            }}
                            onFocus={() => setIsTemplateMenuOpen(true)}
                            placeholder="Search"
                            className="w-full text-[13px] outline-none bg-transparent border-none p-0 min-h-[1.125rem] placeholder:text-slate-400"
                            aria-label="Search templates"
                          />
                        </div>
                        <div className="flex flex-col items-end justify-end gap-0.5 shrink-0 self-stretch pb-0.5">
                          {selectedTemplates.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearTemplates(e);
                              }}
                              className="flex h-[20px] w-[20px] min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                              aria-label="Clear all selected templates"
                            >
                              <X size={10} strokeWidth={2.5} className="shrink-0" aria-hidden />
                            </button>
                          )}
                          <button
                            type="button"
                            className="p-1 text-slate-400 hover:text-slate-600 rounded mt-auto"
                            aria-label="Toggle template list"
                            onClick={() => {
                              if (!isTemplateMenuOpen) setTemplateFilter('');
                              setIsTemplateMenuOpen((o) => !o);
                            }}
                          >
                            <ChevronDown size={14} className={isTemplateMenuOpen ? 'rotate-180' : ''} />
                          </button>
                        </div>
                      </div>
                      {isTemplateMenuOpen && (
                        <div className="absolute z-[300] top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col max-h-[360px] overflow-hidden">
                          <div className="py-1 overflow-y-auto custom-scrollbar min-h-0 flex-1">
                            {filteredTemplatesList.map((tpl) => (
                              <div
                                key={tpl}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTemplate(tpl);
                                }}
                                className="flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 cursor-pointer"
                              >
                                <span className="text-sm text-slate-800 font-medium truncate pr-4">{tpl}</span>
                                {selectedTemplates.includes(tpl) && <Check size={16} className="text-blue-600 ml-auto shrink-0" />}
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-slate-200 shrink-0 bg-white">
                            {templateFilterHasNoExactMatch ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const name = templateFilter.trim();
                                  setIsTemplateMenuOpen(false);
                                  setTemplateFilter('');
                                  if (onCreateTemplateWithName) onCreateTemplateWithName(name);
                                  else onCreateTemplate?.();
                                }}
                                className={`w-full flex items-center gap-2 px-5 py-3 text-left text-sm font-semibold ${TEXT_LINK} hover:bg-slate-50 transition-colors`}
                              >
                                <div className={`w-7 h-7 rounded-full border border-[#1D4ED8]/40 flex items-center justify-center shrink-0`}>
                                  <Plus size={14} className={TEXT_LINK} />
                                </div>
                                <span>Create and select &apos;{templateFilter.trim()}&apos;</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsTemplateMenuOpen(false);
                                  setTemplateFilter('');
                                  onCreateTemplate?.();
                                }}
                                className={`w-full text-left px-5 py-3 text-sm font-semibold ${TEXT_LINK} hover:bg-slate-50 transition-colors`}
                              >
                                Creating a one-off document
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="space-y-2 rounded-2xl">
                  <label className="text-sm font-bold text-slate-800">Or upload existing documents <span className="text-red-500">*</span></label>
                  {selectedTemplates.length > 0 ? (
                    <DisabledWithTooltip message="Remove selected templates to allow uploading documents">
                      <div className="rounded-2xl">
                        <div className={`border-2 border-dashed border-slate-200 rounded-2xl p-4 min-h-[68px] flex items-center bg-slate-50 opacity-50 relative`}>
                          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                            {uploadedFiles.map((file, idx) => (
                              <div key={file.id} className="flex items-center border border-slate-200 rounded-lg overflow-hidden h-9 bg-white shadow-sm max-w-full">
                                <span className="px-3.5 text-[13px] font-medium text-slate-800 border-r border-slate-200 h-full flex items-center bg-slate-50/30 truncate">{file.name}</span>
                                <button type="button" onClick={(e) => removeFile(idx, e)} className="px-2.5 h-full hover:bg-slate-50"><X size={16} className="text-slate-500" /></button>
                              </div>
                            ))}
                            <div className="flex-1 flex flex-col items-center justify-center py-2">
                              <p className="text-sm text-slate-400 font-medium">Drop or select a file (file.type)</p>
                            </div>
                          </div>
                          <div className="ml-4 text-slate-400 shrink-0"><Camera size={20} /></div>
                        </div>
                      </div>
                    </DisabledWithTooltip>
                  ) : (
                    <div className={`border-2 border-dashed border-slate-200 rounded-2xl p-4 min-h-[68px] flex items-center bg-white relative ${uploadedFiles.length > 0 ? 'border-slate-300' : 'bg-slate-50/20'}`}>
                      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                        {uploadedFiles.map((file, idx) => (
                          <div key={file.id} className="flex items-center border border-slate-200 rounded-lg overflow-hidden h-9 bg-white shadow-sm max-w-full">
                            <span className="px-3.5 text-[13px] font-medium text-slate-800 border-r border-slate-200 h-full flex items-center bg-slate-50/30 truncate">{file.name}</span>
                            <button type="button" onClick={(e) => removeFile(idx, e)} className="px-2.5 h-full hover:bg-slate-50"><X size={16} className="text-slate-500" /></button>
                          </div>
                        ))}
                        <button type="button" onClick={addFile} className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 p-1.5 rounded-full transition-all shrink-0">
                          {uploadedFiles.length > 0 ? <CirclePlus size={20} /> : <div className="flex-1 flex flex-col items-center justify-center py-2 cursor-pointer w-full"><p className="text-sm text-slate-400 font-medium">Drop or select a file (file.type)</p></div>}
                        </button>
                      </div>
                      <div className="ml-4 text-slate-400 shrink-0"><Camera size={20} /></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="border border-slate-200 rounded-2xl shadow-sm bg-white relative">
            <button onClick={() => toggleSection('recipients')} className="w-full flex items-center justify-between p-5 bg-white text-left group rounded-t-2xl">
              <div><h3 className="font-bold text-lg text-slate-800 leading-tight">Add recipients</h3><p className="text-sm text-slate-500 mt-1">Add people to send documents to</p></div>
              {isExpanded('recipients') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {isExpanded('recipients') && (
              <div className="px-5 pb-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <label className={`flex items-center space-x-3 select-none ${recipients.length <= 1 ? 'cursor-not-allowed opacity-50 text-slate-500' : 'cursor-pointer text-slate-800'}`}>
                    <input
                      type="checkbox"
                      disabled={recipients.length <= 1}
                      checked={signingOrderEnabled}
                      onChange={(e) => setSigningOrderCheckbox(e.target.checked)}
                      className="w-5 h-5 rounded-md border-slate-300 cursor-pointer accent-[#7A005D] focus:ring-[#7A005D]/30 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm font-medium">Set signing order</span>
                  </label>
                  {signingOrderEnabled && (
                    <button
                      type="button"
                      onClick={() => setSigningOrderSummaryOpen(true)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline shrink-0"
                    >
                      View order
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  {signingOrderEnabled ? (
                    <>
                      {signingOrderGroups.map((group, gi) => (
                        <div
                          key={gi}
                          className={group.length > 1 ? 'border-l-4 border-[#7A005D] pl-3 rounded-l-lg' : ''}
                        >
                          {group.map((rid) => {
                            const recipient = recipients.find((r) => r.id === rid);
                            if (!recipient) return null;
                            const stepNum = gi + 1;
                            return (
                              <React.Fragment key={rid}>
                                <div
                                  className={`h-3 rounded-md transition-all ${dropTargetZone === `before:${rid}` ? 'ring-2 ring-[#7A005D]/50 bg-[#7A005D]/15' : draggingRecipientId ? 'bg-slate-50' : ''}`}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'move';
                                  }}
                                  onDragEnter={(e) => {
                                    e.preventDefault();
                                    if (draggingRecipientId) setDropTargetZone(`before:${rid}`);
                                  }}
                                  onDragLeave={(e) => {
                                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTargetZone(null);
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const dragId = e.dataTransfer.getData(RECIPIENT_DRAG_TYPE);
                                    if (!dragId) return;
                                    applyGroups(insertSoloBeforeRecipient(signingOrderGroups, dragId, rid));
                                    setDraggingRecipientId(null);
                                    setDropTargetZone(null);
                                  }}
                                />
                                <div
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'move';
                                  }}
                                  onDragEnter={(e) => {
                                    e.preventDefault();
                                    if (draggingRecipientId && draggingRecipientId !== rid) setDropTargetZone(`merge:${rid}`);
                                  }}
                                  onDragLeave={(e) => {
                                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTargetZone(null);
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const dragId = e.dataTransfer.getData(RECIPIENT_DRAG_TYPE);
                                    if (!dragId || dragId === rid) return;
                                    applyGroups(mergeIntoRecipient(signingOrderGroups, dragId, rid));
                                    setDraggingRecipientId(null);
                                    setDropTargetZone(null);
                                  }}
                                  className={`border rounded-2xl p-6 bg-white space-y-3 mb-3 transition-all ${dropTargetZone === `merge:${rid}` ? 'ring-2 ring-[#7A005D]/55 border-[#7A005D]/40 bg-[#7A005D]/5' : 'border-slate-200'} ${draggingRecipientId === rid ? 'opacity-65 shadow-md' : ''}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-slate-900">Recipient<span className="text-red-500">*</span></label>
                                    {recipients.length > 1 && (
                                      <button type="button" onClick={() => removeRecipient(recipient.id)} className="text-[11px] text-red-500 font-bold uppercase">Remove</button>
                                    )}
                                  </div>
                                  <div className="flex items-start space-x-3 relative">
                                    <div
                                      draggable
                                      onDragStart={(e) => {
                                        e.dataTransfer.setData(RECIPIENT_DRAG_TYPE, recipient.id);
                                        e.dataTransfer.effectAllowed = 'move';
                                        setDraggingRecipientId(recipient.id);
                                        setDropTargetZone(null);
                                      }}
                                      onDragEnd={() => {
                                        setDraggingRecipientId(null);
                                        setDropTargetZone(null);
                                      }}
                                      className="shrink-0 h-12 px-2 flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
                                      title="Drag to reorder or combine signing steps"
                                    >
                                      <GripVertical size={20} />
                                    </div>
                                    <div className="shrink-0 h-12 flex items-center justify-center">
                                      <div className="w-5 h-5 rounded-full bg-[#7A005D] text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                                        {stepNum}
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-3">
                                      <div className="flex items-center space-x-3 relative min-w-0 flex-wrap sm:flex-nowrap">
                                        {renderRecipientUserPicker(recipient, {
                                          placeholder: 'Search',
                                          variant: 'signing',
                                        })}
                                        <div className="relative flex-1 min-w-[140px]">
                                          <button type="button" onClick={() => updateRecipient(recipient.id, { isActionDropdownOpen: !recipient.isActionDropdownOpen })} className="w-full border border-slate-200 rounded-xl px-4 py-2 flex items-center justify-between bg-white h-12">
                                            <span className="text-sm font-medium text-slate-800 truncate">{recipient.action}</span>
                                            <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${recipient.isActionDropdownOpen ? 'rotate-180' : ''}`} />
                                          </button>
                                          {recipient.isActionDropdownOpen && (
                                            <div className="absolute z-[110] top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl">
                                              <div onClick={() => updateRecipient(recipient.id, { action: 'Needs to complete', isActionDropdownOpen: false })} className="px-5 py-3 text-sm hover:bg-slate-50 cursor-pointer font-medium text-slate-700">Needs to complete</div>
                                              <div onClick={() => updateRecipient(recipient.id, { action: 'CC recipient', isActionDropdownOpen: false })} className="px-5 py-3 text-sm hover:bg-slate-50 cursor-pointer font-medium text-slate-700">CC recipient</div>
                                            </div>
                                          )}
                                        </div>
                                        <div className="relative shrink-0" data-recipient-row-menu>
                                          <button
                                            type="button"
                                            className="p-1.5 text-slate-400 hover:text-slate-600"
                                            onClick={() => setRecipientRowMenuId((v) => (v === recipient.id ? null : recipient.id))}
                                            aria-haspopup="menu"
                                            aria-expanded={recipientRowMenuId === recipient.id}
                                          >
                                            <MoreVertical size={20} />
                                          </button>
                                          {recipientRowMenuId === recipient.id && (
                                            <div className="absolute right-0 top-full mt-1 z-[130] w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-xl text-left">
                                              {recipient.user?.id?.startsWith('ext-') && (
                                                <button
                                                  type="button"
                                                  className="w-full px-4 py-2.5 text-left text-sm text-slate-900 hover:bg-slate-50"
                                                  onClick={() => {
                                                    setRecipientRowMenuId(null);
                                                    setExternalRecipientModal({
                                                      slotId: recipient.id,
                                                      email: recipient.user?.email || 'jane.smith@external-partner.com',
                                                      fullName: recipient.user?.name || 'Jane Smith',
                                                      title: 'Edit recipient',
                                                    });
                                                  }}
                                                >
                                                  Edit recipient
                                                </button>
                                              )}
                                              <button
                                                type="button"
                                                className="w-full px-4 py-2.5 text-left text-sm text-slate-900 hover:bg-slate-50"
                                                onClick={() => {
                                                  setRecipientRowMenuId(null);
                                                  updateRecipient(recipient.id, {
                                                    showCustomMessage: true,
                                                    customMessage: recipient.customMessage ?? '',
                                                    customMessageBodyExpanded: true,
                                                  });
                                                }}
                                              >
                                                Add custom message
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      {recipient.showCustomMessage && (
                                        <div className="border-t border-slate-100 pt-3 space-y-2">
                                          <div className="flex items-center justify-between gap-2">
                                            <label className="text-sm font-bold text-slate-900">
                                              Custom message<span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex items-center gap-0.5 shrink-0">
                                              <button
                                                type="button"
                                                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                                aria-label={recipient.customMessageBodyExpanded ? 'Collapse custom message' : 'Expand custom message'}
                                                onClick={() =>
                                                  updateRecipient(recipient.id, { customMessageBodyExpanded: !recipient.customMessageBodyExpanded })
                                                }
                                              >
                                                {recipient.customMessageBodyExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                              </button>
                                              <button
                                                type="button"
                                                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                                aria-label="Remove custom message"
                                                onClick={() =>
                                                  updateRecipient(recipient.id, {
                                                    showCustomMessage: false,
                                                    customMessage: '',
                                                    customMessageBodyExpanded: true,
                                                  })
                                                }
                                              >
                                                <X size={16} />
                                              </button>
                                            </div>
                                          </div>
                                          {recipient.customMessageBodyExpanded && (
                                            <textarea
                                              value={recipient.customMessage ?? ''}
                                              onChange={(e) => updateRecipient(recipient.id, { customMessage: e.target.value })}
                                              rows={4}
                                              placeholder="Add a private note for this recipient"
                                              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 min-h-[100px] resize-y outline-none focus:ring-2 focus:ring-[#5AA5E7]/30"
                                            />
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      ))}
                      <div
                        className={`h-3 rounded-md transition-all ${dropTargetZone === 'append' ? 'ring-2 ring-[#7A005D]/50 bg-[#7A005D]/15' : draggingRecipientId ? 'bg-slate-50' : ''}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          if (draggingRecipientId) setDropTargetZone('append');
                        }}
                        onDragLeave={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTargetZone(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const dragId = e.dataTransfer.getData(RECIPIENT_DRAG_TYPE);
                          if (!dragId) return;
                          applyGroups(appendSoloGroup(signingOrderGroups, dragId));
                          setDraggingRecipientId(null);
                          setDropTargetZone(null);
                        }}
                      />
                    </>
                  ) : (
                    <div className="space-y-4">
                      {recipients.map((recipient) => (
                        <div key={recipient.id} className="border border-slate-200 rounded-2xl p-6 bg-white space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-slate-900">Recipient<span className="text-red-500">*</span></label>
                            {recipients.length > 1 && <button type="button" onClick={() => removeRecipient(recipient.id)} className="text-[11px] text-red-500 font-bold uppercase">Remove</button>}
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3 relative">
                              {renderRecipientUserPicker(recipient, {
                                placeholder: 'Search',
                                variant: 'parallel',
                              })}
                              <div className="relative flex-1 min-w-0">
                                <button type="button" onClick={() => updateRecipient(recipient.id, { isActionDropdownOpen: !recipient.isActionDropdownOpen })} className="w-full border border-slate-200 rounded-xl px-4 py-2 flex items-center justify-between bg-white h-12">
                                  <span className="text-sm font-medium text-slate-800 truncate">{recipient.action}</span>
                                  <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${recipient.isActionDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {recipient.isActionDropdownOpen && (
                                  <div className="absolute z-[110] top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl">
                                    <div onClick={() => updateRecipient(recipient.id, { action: 'Needs to complete', isActionDropdownOpen: false })} className="px-5 py-3 text-sm hover:bg-slate-50 cursor-pointer font-medium text-slate-700">Needs to complete</div>
                                    <div onClick={() => updateRecipient(recipient.id, { action: 'CC recipient', isActionDropdownOpen: false })} className="px-5 py-3 text-sm hover:bg-slate-50 cursor-pointer font-medium text-slate-700">CC recipient</div>
                                  </div>
                                )}
                              </div>
                              <div className="relative shrink-0" data-recipient-row-menu>
                                <button
                                  type="button"
                                  className="p-1.5 text-slate-400 hover:text-slate-600"
                                  onClick={() => setRecipientRowMenuId((v) => (v === recipient.id ? null : recipient.id))}
                                  aria-haspopup="menu"
                                  aria-expanded={recipientRowMenuId === recipient.id}
                                >
                                  <MoreVertical size={20} />
                                </button>
                                {recipientRowMenuId === recipient.id && (
                                  <div className="absolute right-0 top-full mt-1 z-[130] w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-xl text-left">
                                    {recipient.user?.id?.startsWith('ext-') && (
                                      <button
                                        type="button"
                                        className="w-full px-4 py-2.5 text-left text-sm text-slate-900 hover:bg-slate-50"
                                        onClick={() => {
                                          setRecipientRowMenuId(null);
                                          setExternalRecipientModal({
                                            slotId: recipient.id,
                                            email: recipient.user?.email || 'jane.smith@external-partner.com',
                                            fullName: recipient.user?.name || 'Jane Smith',
                                            title: 'Edit recipient',
                                          });
                                        }}
                                      >
                                        Edit recipient
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="w-full px-4 py-2.5 text-left text-sm text-slate-900 hover:bg-slate-50"
                                      onClick={() => {
                                        setRecipientRowMenuId(null);
                                        updateRecipient(recipient.id, {
                                          showCustomMessage: true,
                                          customMessage: recipient.customMessage ?? '',
                                          customMessageBodyExpanded: true,
                                        });
                                      }}
                                    >
                                      Add custom message
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            {recipient.showCustomMessage && (
                              <div className="border-t border-slate-100 pt-3 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <label className="text-sm font-bold text-slate-900">
                                    Custom message<span className="text-red-500">*</span>
                                  </label>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      type="button"
                                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                      aria-label={recipient.customMessageBodyExpanded ? 'Collapse custom message' : 'Expand custom message'}
                                      onClick={() =>
                                        updateRecipient(recipient.id, { customMessageBodyExpanded: !recipient.customMessageBodyExpanded })
                                      }
                                    >
                                      {recipient.customMessageBodyExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                    <button
                                      type="button"
                                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                      aria-label="Remove custom message"
                                      onClick={() =>
                                        updateRecipient(recipient.id, {
                                          showCustomMessage: false,
                                          customMessage: '',
                                          customMessageBodyExpanded: true,
                                        })
                                      }
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                </div>
                                {recipient.customMessageBodyExpanded && (
                                  <textarea
                                    value={recipient.customMessage ?? ''}
                                    onChange={(e) => updateRecipient(recipient.id, { customMessage: e.target.value })}
                                    rows={4}
                                    placeholder="Add a private note for this recipient"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 min-h-[100px] resize-y outline-none focus:ring-2 focus:ring-[#5AA5E7]/30"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="button" onClick={handleAddRecipient} className="flex items-center space-x-2 px-4 py-2.5 border rounded-xl text-sm font-bold transition-all bg-white border-slate-200 text-slate-900 hover:bg-slate-50">
                  <CirclePlus size={18} /><span>Add recipient</span>
                </button>

                {signingOrderSummaryOpen && (
                  <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/30 p-4" onClick={() => setSigningOrderSummaryOpen(false)} role="presentation">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="signing-order-title">
                      <h4 id="signing-order-title" className="font-bold text-lg text-slate-900 mb-4">Signing order</h4>
                      <ol className="space-y-3 list-decimal list-inside text-sm text-slate-700">
                        {signingOrderGroups.map((g, i) => (
                          <li key={i} className="leading-relaxed">
                            <span className="font-semibold text-slate-900">Step {i + 1}:</span>{' '}
                            {g.map((id) => {
                              const r = recipients.find((x) => x.id === id);
                              return r ? recipientDisplayLabel(r) : 'Recipient';
                            }).join(', ')}
                          </li>
                        ))}
                      </ol>
                      <button type="button" className="mt-6 w-full py-2.5 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-slate-200" onClick={() => setSigningOrderSummaryOpen(false)}>Close</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border border-slate-200 rounded-2xl shadow-sm bg-white relative">
            <button type="button" onClick={() => toggleSection('customMessage')} className="w-full flex items-center justify-between p-5 bg-white text-left rounded-t-2xl">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Add custom message</h3>
                <p className="text-sm text-slate-500 mt-1">Insert a custom note for the recipient(s)</p>
              </div>
              {isExpanded('customMessage') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {isExpanded('customMessage') && (
              <div className="px-5 pb-6 space-y-4 border-t border-slate-100">
                <div className="flex rounded-xl border border-slate-200 overflow-hidden w-fit mt-4">
                  <button
                    type="button"
                    onClick={() => setMessageMode('edit')}
                    className={`px-5 py-2 text-sm font-bold transition-colors ${messageMode === 'edit' ? 'bg-[#7A005D] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageMode('preview')}
                    className={`px-5 py-2 text-sm font-bold transition-colors border-l border-slate-200 ${messageMode === 'preview' ? 'bg-[#7A005D] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    Preview
                  </button>
                </div>
                {messageMode === 'edit' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-900">Subject<span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={customMessageSubject}
                        onChange={(e) => updateState({ customMessageSubject: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-900">Body<span className="text-red-500">*</span></label>
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-slate-100 bg-slate-50/80">
                          <button type="button" className="p-1.5 rounded hover:bg-slate-200 text-slate-600"><Undo2 size={14} /></button>
                          <button type="button" className="p-1.5 rounded hover:bg-slate-200 text-slate-600"><Redo2 size={14} /></button>
                          <div className="w-px h-5 bg-slate-200 mx-0.5" />
                          <button type="button" className="p-1.5 rounded hover:bg-slate-200 font-bold text-slate-700">B</button>
                          <button type="button" className="p-1.5 rounded hover:bg-slate-200 italic text-slate-700">I</button>
                          <div className="w-px h-5 bg-slate-200 mx-0.5" />
                          <span className="text-[11px] font-medium text-slate-500 px-2 border border-slate-200 rounded bg-white py-0.5">Normal text</span>
                          <div className="w-px h-5 bg-slate-200 mx-0.5" />
                          <button type="button" className="p-1 rounded hover:bg-slate-200"><Minus size={12} /></button>
                          <span className="text-xs font-bold px-1">15</span>
                          <button type="button" className="p-1 rounded hover:bg-slate-200"><Plus size={12} /></button>
                          <div className="w-px h-5 bg-slate-200 mx-0.5" />
                          <button type="button" className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 ml-auto">
                            <Zap size={12} className="fill-slate-700" /> Insert variable
                          </button>
                        </div>
                        <textarea
                          value={customMessageBody}
                          onChange={(e) => updateState({ customMessageBody: e.target.value })}
                          rows={6}
                          className="w-full border-0 text-sm p-4 resize-y min-h-[140px] outline-none focus:ring-0"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-6 space-y-4 text-[15px]">
                    <div className="border-b border-slate-200 pb-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Subject</p>
                      <p className="font-semibold text-slate-900">{customMessageSubject || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Message</p>
                      <div className="text-slate-800 whitespace-pre-wrap leading-relaxed">{customMessageBody || '—'}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border border-slate-200 rounded-2xl shadow-sm bg-white relative z-30 overflow-visible">
            <button type="button" onClick={() => toggleSection('advanced')} className="w-full flex items-center justify-between p-5 bg-white text-left rounded-t-2xl">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Advanced settings</h3>
                <p className="text-sm text-slate-500 mt-1">Select a folder in the profile or add a tag for sent documents</p>
              </div>
              {isExpanded('advanced') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {isExpanded('advanced') && (
              <div className="px-5 pb-6 space-y-6 border-t border-slate-100">
                <div className="space-y-2 relative" ref={locationRef}>
                  <label className="text-sm font-bold text-slate-900">Location<span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    <input
                      type="text"
                      value={isLocationMenuOpen ? locationFilter : folderFieldLabel(selectedFolder)}
                      onChange={(e) => {
                        setLocationFilter(e.target.value);
                        if (!isLocationMenuOpen) setIsLocationMenuOpen(true);
                      }}
                      onFocus={() => {
                        setIsLocationMenuOpen(true);
                        setLocationFilter((prev) => (isLocationMenuOpen ? prev : ''));
                      }}
                      placeholder="Choose folder"
                      className={`w-full border border-slate-200 rounded-xl py-3 pl-12 pr-10 text-sm h-11 placeholder:text-slate-400 ${INPUT_FOCUS} ${
                        !isLocationMenuOpen && selectedFolder === ALL_DOCUMENTS_FOLDER_ID ? 'text-slate-500' : 'text-slate-900'
                      }`}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded"
                      aria-label="Toggle folder list"
                      onClick={() => {
                        if (!isLocationMenuOpen) setLocationFilter('');
                        setIsLocationMenuOpen((o) => !o);
                      }}
                    >
                      <ChevronDown size={16} className={isLocationMenuOpen ? 'rotate-180' : ''} />
                    </button>
                  </div>
                  {isLocationMenuOpen && (
                    <div className="absolute z-[400] top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col max-h-[320px] overflow-y-auto custom-scrollbar">
                      <FolderTreeList
                        nodes={filteredFolderTree}
                        depth={0}
                        selectedFolderId={selectedFolder}
                        parentDisabled={false}
                        onSelect={(id) => {
                          updateState({ selectedFolder: id });
                          setIsLocationMenuOpen(false);
                          setLocationFilter('');
                        }}
                      />
                      {filteredFolderTree.length === 0 && (
                        <p className="px-4 py-6 text-sm text-slate-500 text-center">No folders match</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-2 relative" ref={tagsRef}>
                  <label className="text-sm font-bold text-slate-900">Tags</label>
                  <div className="relative">
                    <div
                      className={`w-full border border-slate-200 rounded-lg bg-white flex items-stretch gap-2 px-3 py-2 min-h-[44px] focus-within:ring-2 focus-within:ring-[#5AA5E7]/45 focus-within:border-[#5AA5E7]`}
                    >
                      <Search className="text-slate-400 shrink-0 mt-1.5" size={16} />
                      <div className="flex flex-1 min-w-0 flex-col gap-1.5 min-h-0 py-0.5">
                        <div className="max-h-[3.25rem] min-h-0 overflow-y-auto overflow-x-hidden flex flex-wrap gap-1.5 content-start custom-scrollbar">
                          {advancedTags.map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-1 shrink-0 max-w-[min(200px,100%)] bg-slate-100 text-slate-800 text-[11px] pl-2 pr-1 py-0.5 rounded border border-slate-200/80"
                            >
                              <span className="truncate">{t}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeOneTag(t);
                                }}
                                className="shrink-0 rounded p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                                aria-label={`Remove ${t}`}
                              >
                                <X size={12} strokeWidth={2.5} />
                              </button>
                            </span>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={tagFilter}
                          onChange={(e) => {
                            setTagFilter(e.target.value);
                            setIsTagsMenuOpen(true);
                          }}
                          onFocus={() => setIsTagsMenuOpen(true)}
                          placeholder="Search"
                          className="w-full text-[13px] outline-none bg-transparent border-none p-0 min-h-[1.125rem] placeholder:text-slate-400"
                          aria-label="Search tags"
                        />
                      </div>
                      <div className="flex flex-col items-end justify-end gap-0.5 shrink-0 self-stretch pb-0.5">
                        {advancedTags.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => clearAllTags(e)}
                            className="flex h-[20px] w-[20px] min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                            aria-label="Clear all tags"
                          >
                            <X size={10} strokeWidth={2.5} className="shrink-0" aria-hidden />
                          </button>
                        )}
                        <button
                          type="button"
                          className="p-1 text-slate-400 hover:text-slate-600 rounded mt-auto"
                          aria-label="Toggle tag list"
                          onClick={() => {
                            if (!isTagsMenuOpen) setTagFilter('');
                            setIsTagsMenuOpen((o) => !o);
                          }}
                        >
                          <ChevronDown size={14} className={isTagsMenuOpen ? 'rotate-180' : ''} />
                        </button>
                      </div>
                    </div>
                    {isTagsMenuOpen && (
                      <div className="absolute z-[400] top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col max-h-[360px] overflow-hidden">
                        <div className="py-1 overflow-y-auto custom-scrollbar min-h-0 flex-1 max-h-52">
                          {filteredTagOptions.length > 0 ? (
                            filteredTagOptions.map((tag) => (
                              <div
                                key={tag}
                                role="button"
                                tabIndex={0}
                                onClick={() => toggleTag(tag)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    toggleTag(tag);
                                  }
                                }}
                                className="flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 cursor-pointer"
                              >
                                <span className="text-sm text-slate-800 font-medium truncate pr-4">{tag}</span>
                                {advancedTags.includes(tag) && <Check size={16} className="text-blue-600 ml-auto shrink-0" />}
                              </div>
                            ))
                          ) : (
                            <p className="px-4 py-4 text-sm text-slate-500 text-center">No tags match your search</p>
                          )}
                        </div>
                        <div className="border-t border-slate-200 shrink-0 bg-white">
                          {tagFilterHasNoExactMatch ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const t = tagFilter.trim();
                                if (!t) return;
                                if (!advancedTags.includes(t)) {
                                  setExtraTagOptions((prev) => (prev.includes(t) ? prev : [...prev, t]));
                                  updateState({ advancedTags: [...advancedTags, t] });
                                }
                                setTagFilter('');
                                setIsTagsMenuOpen(false);
                              }}
                              className={`w-full flex items-center gap-2 px-5 py-3 text-left text-sm font-semibold ${TEXT_LINK} hover:bg-slate-50 transition-colors`}
                            >
                              <div className="w-7 h-7 rounded-full border border-[#1D4ED8]/40 flex items-center justify-center shrink-0">
                                <Plus size={14} className={TEXT_LINK} />
                              </div>
                              <span>Create and select &apos;{tagFilter.trim()}&apos;</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCreateTagDraft(tagFilter.trim());
                                setCreateTagModalOpen(true);
                                setIsTagsMenuOpen(false);
                              }}
                              className={`w-full text-left px-5 py-3 text-sm font-semibold ${TEXT_LINK} hover:bg-slate-50 transition-colors`}
                            >
                              Create a tag
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <label className="flex items-start space-x-3 text-slate-800 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 mt-0.5 rounded-md border-slate-300 cursor-pointer accent-[#7A005D]" />
                  <span>
                    <span className="text-sm font-medium block">Save completed document to recipients&apos; profile</span>
                    <span className="text-xs text-slate-500 block mt-1">This only applies if the selected employee is not a recipient of the document</span>
                  </span>
                </label>
                <label className="flex items-center space-x-3 text-slate-800 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 rounded-md border-slate-300 cursor-pointer accent-[#7A005D]" />
                  <span className="text-sm font-medium">Allow recipients to reassign to other people</span>
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-md border-slate-300 cursor-pointer accent-[#7A005D]"
                      checked={expirationEnabled}
                      onChange={(e) => updateState({ expirationEnabled: e.target.checked })}
                    />
                    <span className="text-sm font-medium">Set expiration date</span>
                  </label>
                  {expirationEnabled && (
                    <AdvancedExpirationFields
                      afterPreset={expirationAfterPreset}
                      afterCustomAmount={expirationAfterCustomAmount}
                      afterCustomUnit={expirationAfterCustomUnit}
                      alertPreset={expirationAlertPreset}
                      alertCustomAmount={expirationAlertCustomAmount}
                      alertCustomUnit={expirationAlertCustomUnit}
                      onPatch={(p) => updateState(p)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div onMouseDown={startResizing} className={`w-1.5 hover:w-2 hover:bg-blue-400 bg-slate-200 cursor-col-resize h-full z-50 flex items-center justify-center ${isResizing ? 'bg-blue-500 w-2' : ''}`}>
          <div className={`w-px h-10 bg-slate-400 ${isResizing ? 'bg-white' : ''}`} />
        </div>

        <div className="flex-1 bg-[#f8fafc] flex flex-col p-12 overflow-y-auto custom-scrollbar relative">
          <div className="max-w-4xl mx-auto w-full flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Preview</h2>
            {totalPages > 0 && (
              <div className="flex items-center space-x-3 bg-white border border-slate-200 rounded-lg px-2 py-1">
                <button disabled={currentPreviewPage === 1} onClick={() => setCurrentPreviewPage(p => Math.max(1, p - 1))} className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronLeft size={16} /></button>
                <span className="text-[12px] font-bold text-slate-700 min-w-[50px] text-center">{currentPreviewPage} of {totalPages}</span>
                <button disabled={currentPreviewPage === totalPages} onClick={() => setCurrentPreviewPage(p => Math.min(totalPages, p + 1))} className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            )}
          </div>
          {(selectedTemplates.length > 0 || uploadedFiles.length > 0) ? (
            <div className="space-y-6 max-w-4xl mx-auto w-full">
              {!isUploadMode && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <button onClick={() => setIsPreviewRecipientsExpanded(!isPreviewRecipientsExpanded)} className="w-full flex items-center justify-between p-5 text-left bg-white font-bold text-lg text-slate-900">
                    <span>Recipients</span>{isPreviewRecipientsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {isPreviewRecipientsExpanded && (
                    <div className="border-t border-slate-100 flex flex-col">
                      {getOrderedRecipients().map((r: RecipientSlot, i: number) => (
                        <div key={r.id} className="px-6 py-4 flex items-center space-x-4 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">{r.user ? <img src={`https://i.pravatar.cc/150?u=${r.user.id}`} className="w-full h-full rounded-full" alt="" /> : <User size={20} />}</div>
                          <div>
                            <p className="text-base font-bold text-slate-900 leading-tight">{r.user ? r.user.name : `Recipient ${i + 1}`}</p>
                            <p className="text-sm text-slate-500 font-medium">
                              {r.action}
                              {signingOrderEnabled && signingOrderGroups.length > 0 && (() => {
                                const gi = signingOrderGroups.findIndex((gr) => gr.includes(r.id));
                                return gi >= 0 ? ` · Step ${gi + 1}` : '';
                              })()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="relative group max-w-[850px] mx-auto w-full">
                {!isUploadMode && (
                  <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-start pt-32 z-20 pointer-events-none group-hover:pointer-events-auto backdrop-blur-[0.5px]">
                    <button type="button" onClick={() => onEditDocument?.(buildTemplateEditSnapshot())} className="bg-white text-slate-900 font-bold px-6 py-3 rounded-xl shadow-2xl border border-slate-200 flex items-center space-x-3 hover:scale-105 transition-all">
                      <Pencil size={18} className="text-slate-600" /><span>Edit document</span>
                    </button>
                  </div>
                )}
                <div className="bg-white border border-slate-100 shadow-xl min-h-[1100px] p-24 text-[15px] leading-relaxed text-slate-800">
                  {isUploadMode ? (
                    <>
                      <h1 className="text-2xl font-bold text-center mb-10">
                        {uploadedFiles[currentPreviewPage - 1]?.previewTitle}
                      </h1>
                      <div className="space-y-5 text-slate-700">
                        {(uploadedFiles[currentPreviewPage - 1]?.previewParagraphs ?? []).map((para, i) => (
                          <p key={i} className="leading-relaxed">{para}</p>
                        ))}
                      </div>
                    </>
                  ) : (() => {
                    const tplName = selectedTemplates[currentPreviewPage - 1];
                    const customEntry = customTemplates.find((c) => c.name === tplName);
                    const chipPreview =
                      '[&_span[data-chip]]:inline-flex [&_span[data-chip]]:items-center [&_span[data-chip]]:mx-0.5 [&_span[data-chip]]:px-2 [&_span[data-chip]]:py-0.5 [&_span[data-chip]]:rounded-md [&_span[data-chip]]:font-inherit [&_span[data-chip]]:text-inherit [&_span[data-chip]]:bg-[#FDF2FB] [&_span[data-chip]]:border [&_span[data-chip]]:border-[#F5D0EE]';
                    const titleLinePreview =
                      '[&_p[data-title-line]]:text-2xl [&_p[data-title-line]]:font-bold [&_p[data-title-line]]:text-slate-900 [&_p[data-title-line]]:text-center [&_p[data-title-line]]:mb-10 [&_p[data-title-line]]:leading-snug';
                    if (customEntry && customEntry.body.trim().startsWith('<')) {
                      const hasDocTitle = customEntry.body.includes('data-title-line');
                      return (
                        <>
                          {!hasDocTitle ? (
                            <h1 className="text-2xl font-bold text-center mb-10">{tplName}</h1>
                          ) : null}
                          <div
                            className={`space-y-4 text-slate-700 ${titleLinePreview} ${chipPreview}`}
                            dangerouslySetInnerHTML={{ __html: customEntry.body }}
                          />
                        </>
                      );
                    }
                    if (customEntry) {
                      return (
                        <>
                          <h1 className="text-2xl font-bold text-center mb-10">{tplName}</h1>
                          <div className="space-y-4 text-slate-700">
                            {customEntry.body.split(/\n+/).filter((p) => p.trim()).map((para, i) => (
                              <p key={i} className="leading-relaxed whitespace-pre-wrap">
                                {para}
                              </p>
                            ))}
                          </div>
                        </>
                      );
                    }
                    return (
                      <>
                        <h1 className="text-2xl font-bold text-center mb-10">{tplName}</h1>
                        <p className="mb-6">Effective <VariableChip label="Start date" />, , <VariableChip label="Contractor Name" /> ("Consultant") and <VariableChip label="Business legal name" /> ("Company") agree as follows:</p>
                        <div className="space-y-6 text-slate-600"><p>1. Services; Payment; No Violation of Rights or Obligations.</p><p>Consultant agrees to undertake and complete the Services (as defined in Exhibit A)...</p></div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50"><FileText size={32} className="text-slate-300 mb-4" /><p className="text-slate-400 text-base font-medium">No template selected or file uploaded</p></div>
          )}
        </div>
      </div>

      <footer className="h-16 border-t border-slate-200 px-8 flex items-center justify-end shrink-0 bg-white z-[100]">
        <button onClick={handleContinue} disabled={!canContinue} className={`font-bold px-10 py-3 rounded-xl border transition-all ${canContinue ? 'bg-[#7A005D] text-white border-[#7A005D] hover:opacity-90 shadow-lg' : 'bg-[#f8fafc] text-slate-300 border-slate-100 cursor-not-allowed'}`}>
          {currentStep === 'setup' && uploadedFiles.length > 0
            ? 'Continue'
            : correctingFlow
              ? 'Resend'
              : 'Send'}
        </button>
      </footer>
    </div>
    </>
  );
};

export default EnvelopeCreator;