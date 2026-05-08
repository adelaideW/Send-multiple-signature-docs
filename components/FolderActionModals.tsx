import React, { useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Folder,
  FolderOpen,
  Search,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Users,
  Check,
  HelpCircle,
} from 'lucide-react';
import { PRIMARY_PURPLE } from '../constants';
import type { ProfileFolderNode, FolderPermission } from '../utils/profileFolderUtils';
import { flattenProfileFolders, findProfileFolder, getSubtreeFolderIds, findParentProfileFolderId } from '../utils/profileFolderUtils';

const ACCESS_LEVEL_OPTIONS: FolderPermission['access'][] = ['Can manage files', 'Contributor', 'Viewer'];

// ─── SHARED PICKER TYPES & DATA ────────────────────────────────────────────

type MenuRow =
  | { kind: 'section'; label: string }
  | {
      kind: 'item';
      label: string;
      subtitle?: string;
      hasChevron?: boolean;
      tone?: 'default' | 'muted';
      submenuKey?: string;
      avatarText?: string;
      avatarBg?: string;
      avatarFg?: string;
    };
type MenuItemRow = Extract<MenuRow, { kind: 'item' }>;

const MENU_BASE_ROWS: MenuRow[] = [
  { kind: 'section', label: 'Saved Groups' },
  { kind: 'item', label: 'View all saved groups', tone: 'muted' },
  { kind: 'section', label: 'Categories' },
  { kind: 'item', label: 'All... (Managers, employees, etc.)', tone: 'muted' },
  { kind: 'item', label: 'Admins', hasChevron: true, submenuKey: 'admins' },
  { kind: 'item', label: 'Department', hasChevron: true, submenuKey: 'department' },
  { kind: 'item', label: 'State', hasChevron: true, submenuKey: 'state' },
  { kind: 'item', label: 'Country', hasChevron: true, submenuKey: 'country' },
  { kind: 'item', label: 'Location', hasChevron: true, submenuKey: 'location' },
  { kind: 'item', label: 'Entity', hasChevron: true, submenuKey: 'entity' },
  { kind: 'item', label: 'Team', hasChevron: true, submenuKey: 'team' },
  { kind: 'item', label: 'Level', hasChevron: true, submenuKey: 'level' },
  { kind: 'item', label: 'Employment types', hasChevron: true, submenuKey: 'employment' },
  { kind: 'section', label: 'People' },
  { kind: 'item', label: 'Kale George', subtitle: 'This account profile', avatarText: 'KG', avatarBg: '#D4E4FA', avatarFg: '#185FA5' },
  { kind: 'item', label: 'Aria Chen', subtitle: 'Senior Engineer', avatarText: 'AC', avatarBg: '#D4E4FA', avatarFg: '#185FA5' },
  { kind: 'item', label: 'Marcus Webb', subtitle: 'Product Manager', avatarText: 'MW', avatarBg: '#E1F5EE', avatarFg: '#0F6E56' },
  { kind: 'item', label: 'Priya Kapoor', subtitle: 'Data Analyst', avatarText: 'PK', avatarBg: '#FBEAF0', avatarFg: '#993556' },
  { kind: 'item', label: 'Jordan Ellis', subtitle: 'Design Lead', avatarText: 'JE', avatarBg: '#FAEEDA', avatarFg: '#854F0B' },
  { kind: 'item', label: 'Simone Adeyemi', subtitle: 'HR Business Partner', avatarText: 'SA', avatarBg: '#EEEDFE', avatarFg: '#534AB7' },
  { kind: 'item', label: 'Luca Rossi', subtitle: 'Platform Engineer', avatarText: 'LR', avatarBg: '#EAF3DE', avatarFg: '#3B6D11' },
  { kind: 'item', label: 'Fatima Al-Rashid', subtitle: 'Finance Manager', avatarText: 'FA', avatarBg: '#FAECE7', avatarFg: '#993C1D' },
  { kind: 'item', label: 'Noah Tanaka', subtitle: 'IT Administrator', avatarText: 'NT', avatarBg: '#D4E4FA', avatarFg: '#185FA5' },
  { kind: 'item', label: 'Yuki Yamamoto', subtitle: 'Benefits Specialist', avatarText: 'YY', avatarBg: '#E1F5EE', avatarFg: '#0F6E56' },
];

const SUBMENU_ROWS: Record<string, MenuRow[]> = {
  admins: [
    { kind: 'item', label: 'All admins' },
    { kind: 'item', label: 'Super admin' },
    { kind: 'item', label: 'Full admin' },
  ],
  department: [
    { kind: 'item', label: 'Engineering' },
    { kind: 'item', label: 'Marketing' },
    { kind: 'item', label: 'Finance' },
    { kind: 'item', label: 'Human Resources' },
    { kind: 'item', label: 'Operations' },
    { kind: 'item', label: 'Legal' },
    { kind: 'item', label: 'Product' },
    { kind: 'item', label: 'Design' },
  ],
  state: [
    { kind: 'item', label: 'Offer accepted' },
    { kind: 'item', label: 'Hired' },
    { kind: 'item', label: 'Onboarded' },
    { kind: 'item', label: 'Active' },
    { kind: 'item', label: 'Terminated' },
  ],
  country: [
    { kind: 'item', label: 'United States' },
    { kind: 'item', label: 'United Kingdom' },
    { kind: 'item', label: 'Canada' },
    { kind: 'item', label: 'Australia' },
    { kind: 'item', label: 'Germany' },
  ],
  location: [
    { kind: 'item', label: 'Remote' },
    { kind: 'item', label: 'San Francisco office' },
    { kind: 'item', label: 'New York office' },
    { kind: 'item', label: 'Austin office' },
  ],
  entity: [
    { kind: 'item', label: 'Parent company' },
    { kind: 'item', label: 'Subsidiary' },
    { kind: 'item', label: 'Division' },
  ],
  team: [
    { kind: 'item', label: 'HRIS' },
    { kind: 'item', label: 'Payroll' },
    { kind: 'item', label: 'Finance' },
    { kind: 'item', label: 'Platform' },
    { kind: 'item', label: 'IT' },
  ],
  level: [
    { kind: 'item', label: 'L3' },
    { kind: 'item', label: 'L4' },
    { kind: 'item', label: 'L5' },
    { kind: 'item', label: 'L6' },
    { kind: 'item', label: 'Director' },
    { kind: 'item', label: 'VP' },
  ],
  employment: [
    { kind: 'item', label: 'Full-time' },
    { kind: 'item', label: 'Part-time' },
    { kind: 'item', label: 'Contract' },
    { kind: 'item', label: 'Intern' },
  ],
};

const DROPDOWN_MAX_H = 240;
const OVERLAY_Z = 100_000;

type DropdownCoords = { top: number; left: number; width: number };

// ─── SELECTION CHIP ─────────────────────────────────────────────────────────

function SelectionChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[12px] font-semibold text-slate-800 shrink-0">
      <Users size={13} className="text-slate-500 shrink-0" aria-hidden />
      <span className="max-w-[200px] truncate">{label}</span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="p-0.5 rounded hover:bg-slate-200/80 text-slate-500"
        aria-label={`Remove ${label}`}
      >
        <X size={12} strokeWidth={2.5} />
      </button>
    </span>
  );
}

// ─── GROUP PICKER DROPDOWN ──────────────────────────────────────────────────

const GroupPickerDropdown: React.FC<{
  open: boolean;
  coords: DropdownCoords | null;
  rows: MenuRow[];
  highlightedIndex: number;
  onPick: (row: MenuItemRow) => void;
  onHoverIndex: (idx: number) => void;
  onBack: (() => void) | null;
  submenuTitle?: string | null;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}> = ({ open, coords, rows, highlightedIndex, onPick, onHoverIndex, onBack, submenuTitle, dropdownRef }) => {
  if (!open || !coords) return null;
  const { top, left, width } = coords;
  let itemIndex = -1;
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const target = optionRefs.current[highlightedIndex];
    if (target) target.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex, rows]);

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
      style={{ top, left, width, zIndex: OVERLAY_Z, maxHeight: DROPDOWN_MAX_H }}
      role="listbox"
    >
      {onBack && submenuTitle ? (
        <div>
          <button
            type="button"
            className="w-full px-5 py-3 text-left text-[13px] font-medium text-slate-600 border-b border-[#F0F0F0] hover:bg-slate-50 inline-flex items-center gap-2"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onBack}
          >
            <ChevronLeft size={14} /> Back
          </button>
          <div className="px-5 py-3 text-[15px] font-semibold text-slate-900 border-b border-[#F0F0F0]">{submenuTitle}</div>
        </div>
      ) : null}
      <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: DROPDOWN_MAX_H }}>
        {rows.map((row, idx) => {
          if (row.kind === 'section') {
            return (
              <div key={`sec-${idx}`} className="px-5 pt-4 pb-2 text-[11px] font-semibold tracking-[0.08em] uppercase text-slate-400">
                {row.label}
              </div>
            );
          }
          itemIndex += 1;
          const highlighted = itemIndex === highlightedIndex;
          return (
            <button
              key={`row-${idx}`}
              ref={(el) => { optionRefs.current[itemIndex] = el; }}
              type="button"
              role="option"
              aria-selected={highlighted}
              className={`w-full text-left px-5 py-3 text-[15px] transition-colors flex items-center justify-between gap-3 ${highlighted ? 'bg-slate-50' : 'hover:bg-slate-50'} ${row.tone === 'muted' ? 'text-slate-700' : 'text-slate-800'}`}
              style={{ borderTop: '1px solid #F0F0F0' }}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => onHoverIndex(itemIndex)}
              onClick={() => onPick(row)}
            >
              <div className="min-w-0 flex items-center gap-3">
                {row.avatarText ? (
                  <span
                    className="w-8 h-8 rounded-full inline-flex items-center justify-center text-[11px] font-semibold shrink-0"
                    style={{ backgroundColor: row.avatarBg ?? '#E2E8F0', color: row.avatarFg ?? '#334155' }}
                  >
                    {row.avatarText}
                  </span>
                ) : null}
                <div className="min-w-0">
                  <div className="truncate">{row.label}</div>
                  {row.subtitle ? <div className="text-[12px] text-slate-400 mt-0.5">{row.subtitle}</div> : null}
                </div>
              </div>
              {row.hasChevron ? <ChevronRight size={13} className="text-slate-400 shrink-0" /> : null}
            </button>
          );
        })}
        {rows.length === 0 && (
          <div className="px-4 py-6 text-center text-[13px] text-slate-500 font-medium">No matches</div>
        )}
      </div>
    </div>,
    document.body
  );
};

// ─── MODAL BACKDROP ──────────────────────────────────────────────────────────

const ModalBackdrop: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>,
    document.body
  );
};

// ─── RENAME FOLDER MODAL ─────────────────────────────────────────────────────

export const RenameFolderModal: React.FC<{
  folder: ProfileFolderNode;
  onSave: (folderId: string, newName: string, newDescription: string) => void;
  onClose: () => void;
}> = ({ folder, onSave, onClose }) => {
  const [name, setName] = useState(folder.name);
  const [description, setDescription] = useState(folder.description ?? '');
  const nameOk = name.trim().length > 0;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[576px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-[20px] font-bold text-slate-900">Rename folder</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-2 space-y-5 pb-6">
          <div className="space-y-1.5">
            <label className="block text-[14px] font-semibold text-slate-900">
              Folder name <span className="text-[#e4633c]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              autoFocus
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[#7A005D]/20 focus:border-[#7A005D]/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[14px] font-semibold text-slate-900">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[#7A005D]/20 focus:border-[#7A005D]/50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            disabled={!nameOk}
            onClick={() => { if (nameOk) onSave(folder.id, name.trim(), description.trim()); }}
            className="px-5 py-2.5 rounded-lg text-[14px] font-bold disabled:cursor-not-allowed transition-colors"
            style={{
              backgroundColor: nameOk ? PRIMARY_PURPLE : 'rgba(0,0,0,0.05)',
              color: nameOk ? 'white' : 'rgba(0,0,0,0.4)',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};

// ─── SET PERMISSION MODAL ────────────────────────────────────────────────────

export const SetPermissionModal: React.FC<{
  folder: ProfileFolderNode;
  onSave: (folderId: string, permissions: FolderPermission[]) => void;
  onClose: () => void;
}> = ({ folder, onSave, onClose }) => {
  const [accessRows, setAccessRows] = useState<FolderPermission[]>(
    () => (folder.permissions ?? []).map((p) => ({ ...p }))
  );
  const [accessChips, setAccessChips] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [submenuPath, setSubmenuPath] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownCoords, setDropdownCoords] = useState<DropdownCoords | null>(null);
  const [openAccessMenuIdx, setOpenAccessMenuIdx] = useState<number | null>(null);
  const [accessDropdownPos, setAccessDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [accessKeyboardIdx, setAccessKeyboardIdx] = useState(0);

  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const accessMenuRef = useRef<HTMLDivElement>(null);
  const accessOptionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeSubmenuKey = submenuPath.length > 0 ? submenuPath[submenuPath.length - 1] : null;

  const pickerRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const baseRows: MenuRow[] = [
      { kind: 'section', label: 'Access presets' },
      { kind: 'item', label: 'Self - Employee' },
      { kind: 'item', label: "Manager - The employee's manager" },
      { kind: 'item', label: "Peer - Employee's direct teammate" },
      { kind: 'section', label: 'Groups' },
      ...MENU_BASE_ROWS,
    ];
    if (q) {
      const pool = [...baseRows, ...Object.values(SUBMENU_ROWS).flat()];
      return pool.filter((r): r is MenuItemRow => r.kind === 'item' && r.label.toLowerCase().includes(q));
    }
    if (activeSubmenuKey) return SUBMENU_ROWS[activeSubmenuKey] ?? [];
    return baseRows;
  }, [query, activeSubmenuKey]);

  const selectableRows = useMemo(() => pickerRows.filter((r): r is MenuItemRow => r.kind === 'item'), [pickerRows]);

  const updateDropdownPosition = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const width = Math.max(rect.width, 320);
    let left = rect.left;
    let top = rect.bottom + 6;
    if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);
    if (top + DROPDOWN_MAX_H > window.innerHeight - 8) top = Math.max(8, rect.top - 8 - DROPDOWN_MAX_H);
    setDropdownCoords({ top, left, width });
  }, []);

  useLayoutEffect(() => {
    if (isOpen) updateDropdownPosition();
    else setDropdownCoords(null);
  }, [isOpen, updateDropdownPosition]);

  useEffect(() => {
    if (!isOpen) return;
    const h = () => updateDropdownPosition();
    window.addEventListener('scroll', h, true);
    window.addEventListener('resize', h);
    return () => { window.removeEventListener('scroll', h, true); window.removeEventListener('resize', h); };
  }, [isOpen, updateDropdownPosition]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (dropdownRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      setIsOpen(false);
      setSubmenuPath([]);
      setQuery('');
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const addChip = (label: string) => {
    setAccessChips((prev) => prev.includes(label) ? prev : [...prev, label]);
    setIsOpen(false);
    setSubmenuPath([]);
    setQuery('');
    setHighlightedIndex(0);
  };

  // Access level dropdown — keyboard nav (capture phase so ESC doesn't also close the modal)
  useEffect(() => {
    if (openAccessMenuIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        setOpenAccessMenuIdx(null);
        setAccessDropdownPos(null);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setAccessKeyboardIdx((i) => Math.min(ACCESS_LEVEL_OPTIONS.length - 1, i + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setAccessKeyboardIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const opt = ACCESS_LEVEL_OPTIONS[accessKeyboardIdx];
        if (opt !== undefined && openAccessMenuIdx !== null) {
          setAccessRows((prev) => prev.map((r, i) => i === openAccessMenuIdx ? { ...r, access: opt } : r));
          setOpenAccessMenuIdx(null);
          setAccessDropdownPos(null);
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [openAccessMenuIdx, accessKeyboardIdx]);

  // Scroll highlighted access option into view on keyboard nav
  useEffect(() => {
    accessOptionRefs.current[accessKeyboardIdx]?.scrollIntoView({ block: 'nearest' });
  }, [accessKeyboardIdx]);

  // Access level dropdown — outside click
  useEffect(() => {
    if (openAccessMenuIdx === null) return;
    const onDown = (e: MouseEvent) => {
      if (accessMenuRef.current?.contains(e.target as Node)) return;
      setOpenAccessMenuIdx(null);
      setAccessDropdownPos(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [openAccessMenuIdx]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) { setIsOpen(true); return; }
      setHighlightedIndex((i) => Math.min(selectableRows.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) { setIsOpen(true); return; }
      setHighlightedIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && isOpen && selectableRows[highlightedIndex]) {
      e.preventDefault();
      const row = selectableRows[highlightedIndex]!;
      if (!query.trim() && row.submenuKey) {
        setSubmenuPath((prev) => [...prev, row.submenuKey!]);
        setHighlightedIndex(0);
      } else {
        addChip(row.label);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSubmenuPath([]);
    } else if ((e.key === 'Backspace' || e.key === 'Delete') && !query.trim() && accessChips.length > 0) {
      setAccessChips((prev) => prev.slice(0, -1));
    }
  };

  const handleAdd = () => {
    if (accessChips.length === 0) return;
    setAccessRows((prev) => [
      ...prev,
      ...accessChips.map((name) => ({ name, access: 'Viewer' as const })),
    ]);
    setAccessChips([]);
    setQuery('');
  };

  return (
    <>
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[576px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-[20px] font-bold text-slate-900">Set permission</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-2 pb-5 space-y-4">
          {/* Picker label */}
          <div>
            <p className="text-[13px] font-semibold text-slate-800 inline-flex items-center gap-1">
              Add people who need access <span className="text-[#e4633c]">*</span>
              <button type="button" className="p-0.5 text-slate-400 hover:text-slate-600 cursor-help" aria-label="About access">
                <HelpCircle size={14} strokeWidth={2} />
              </button>
            </p>
          </div>

          {/* Picker input + Add button */}
          <div className="flex gap-2 items-start">
            <div
              ref={anchorRef}
              className="flex-1 min-w-0 border border-slate-300 rounded-lg py-2 px-3 bg-white flex flex-wrap items-center gap-2 min-h-[40px] max-h-[96px] overflow-y-auto cursor-text"
              onClick={() => { setIsOpen(true); inputRef.current?.focus(); }}
            >
              {accessChips.map((c) => (
                <SelectionChip key={c} label={c} onRemove={() => setAccessChips((x) => x.filter((y) => y !== c))} />
              ))}
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setHighlightedIndex(0); if (!isOpen) setIsOpen(true); }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={accessChips.length === 0 ? 'Search or browse options to create groups of employees' : ''}
                className="min-w-[200px] flex-1 bg-transparent text-[13px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
            <button
              type="button"
              disabled={accessChips.length === 0}
              onClick={handleAdd}
              className="px-4 py-2.5 rounded-lg text-[13px] font-bold border border-slate-200 bg-white text-slate-900 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 disabled:hover:bg-white"
            >
              Add
            </button>
          </div>

          <GroupPickerDropdown
            open={isOpen}
            coords={dropdownCoords}
            rows={pickerRows}
            highlightedIndex={Math.min(highlightedIndex, Math.max(0, selectableRows.length - 1))}
            onPick={(row) => {
              if (!query.trim() && row.submenuKey) {
                setSubmenuPath((prev) => [...prev, row.submenuKey!]);
                setHighlightedIndex(0);
              } else {
                addChip(row.label);
              }
            }}
            onHoverIndex={setHighlightedIndex}
            onBack={submenuPath.length > 0 && !query.trim() ? () => { setSubmenuPath((p) => p.slice(0, -1)); setHighlightedIndex(0); } : null}
            submenuTitle={activeSubmenuKey ? (MENU_BASE_ROWS.find((r) => r.kind === 'item' && r.submenuKey === activeSubmenuKey) as MenuItemRow | undefined)?.label ?? null : null}
            dropdownRef={dropdownRef}
          />

          <p className="text-[13px] text-slate-500 font-medium">
            Specify the access level for each person.{' '}
            <a href="#" className="font-bold hover:underline" style={{ color: PRIMARY_PURPLE }}>Learn more</a>.
          </p>

          {/* Permissions table */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-[1fr_172px_44px] bg-slate-50 border-b border-slate-200">
              <div className="px-4 py-2.5 text-[12px] font-semibold text-slate-600">People with access</div>
              <div className="px-4 py-2.5 text-[12px] font-semibold text-slate-600">Access</div>
              <div />
            </div>
            {accessRows.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-slate-400 font-medium">No people added yet.</div>
            ) : (
              accessRows.map((row, idx) => (
                <div key={`${row.name}-${idx}`} className="grid grid-cols-[1fr_172px_44px] items-center border-t border-slate-100">
                  <div className="px-4 py-3 min-w-0">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-[#f9f7f6] px-2 py-0.5 text-[12px] font-medium text-slate-800 max-w-full">
                      <Users size={12} className="text-slate-500 shrink-0" />
                      <span className="truncate">{row.name}</span>
                    </span>
                  </div>
                  <div className="px-3 py-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        if (openAccessMenuIdx === idx) {
                          setOpenAccessMenuIdx(null);
                          setAccessDropdownPos(null);
                        } else {
                          const btn = e.currentTarget as HTMLElement;
                          const rect = btn.getBoundingClientRect();
                          const dropH = ACCESS_LEVEL_OPTIONS.length * 36;
                          const spaceBelow = window.innerHeight - rect.bottom;
                          const spaceAbove = rect.top;
                          const top = spaceBelow >= dropH + 12 ? rect.bottom + 4 : Math.max(8, rect.top - dropH - 8);
                          setAccessDropdownPos({ top, left: rect.left, width: rect.width });
                          setOpenAccessMenuIdx(idx);
                          setAccessKeyboardIdx(0);
                        }
                      }}
                      className="w-full inline-flex items-center justify-between rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <span>{row.access}</span>
                      <ChevronDown size={12} className="text-slate-400 shrink-0" />
                    </button>
                  </div>
                  <div className="px-2 py-2 flex items-center justify-center">
                    <button
                      type="button"
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50"
                      aria-label={`Remove ${row.name}`}
                      onClick={() => {
                        setAccessRows((prev) => prev.filter((_, i) => i !== idx));
                        setOpenAccessMenuIdx((r) => r === idx ? null : r != null && r > idx ? r - 1 : r);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Preview people */}
          <div className="flex justify-end">
            <button type="button" className="inline-flex items-center gap-1 text-[13px] font-semibold hover:underline" style={{ color: PRIMARY_PURPLE }}>
              Preview people <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg text-[13px] font-bold border border-slate-200 text-slate-800 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(folder.id, accessRows)}
            className="px-5 py-2.5 rounded-lg text-[14px] font-bold text-white"
            style={{ backgroundColor: PRIMARY_PURPLE }}
          >
            Save
          </button>
        </div>
      </div>
    </ModalBackdrop>
    {openAccessMenuIdx !== null && accessDropdownPos && createPortal(
      <div
        ref={accessMenuRef}
        className="fixed rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden"
        style={{ top: accessDropdownPos.top, left: accessDropdownPos.left, width: accessDropdownPos.width, zIndex: OVERLAY_Z + 1 }}
      >
        {ACCESS_LEVEL_OPTIONS.map((opt, i) => (
          <button
            key={opt}
            ref={(el) => { accessOptionRefs.current[i] = el; }}
            type="button"
            className={`w-full text-left px-3 py-2 text-[12px] text-slate-800 border-t first:border-t-0 border-[#F0F0F0] flex items-center justify-between ${i === accessKeyboardIdx ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setAccessKeyboardIdx(i)}
            onClick={() => {
              if (openAccessMenuIdx !== null) {
                setAccessRows((prev) => prev.map((r, rowIdx) => rowIdx === openAccessMenuIdx ? { ...r, access: opt } : r));
              }
              setOpenAccessMenuIdx(null);
              setAccessDropdownPos(null);
            }}
          >
            {opt}
            {openAccessMenuIdx !== null && accessRows[openAccessMenuIdx]?.access === opt && <Check size={13} className="text-[#7A005D]" />}
          </button>
        ))}
      </div>,
      document.body
    )}
    </>
  );
};

// ─── MOVE FOLDER MODAL ───────────────────────────────────────────────────────

type FlatFolder = { node: ProfileFolderNode; depth: number; parentId: string | null };

function flattenTree(root: ProfileFolderNode, skipRoot = false): FlatFolder[] {
  const result: FlatFolder[] = [];
  function walk(node: ProfileFolderNode, depth: number, parentId: string | null) {
    if (!skipRoot || node.id !== root.id) {
      result.push({ node, depth: skipRoot ? depth - 1 : depth, parentId });
    }
    for (const child of node.children ?? []) {
      walk(child, depth + 1, node.id);
    }
  }
  walk(root, 0, null);
  return result;
}

export const MoveFolderModal: React.FC<{
  folder: ProfileFolderNode;
  folderRoot: ProfileFolderNode;
  onMove: (folderId: string, newParentId: string) => void;
  onClose: () => void;
}> = ({ folder, folderRoot, onMove, onClose }) => {
  const currentParentId = findParentProfileFolderId(folderRoot, folder.id) ?? folderRoot.id;

  // ids of the folder being moved and its entire subtree — all disabled
  const subtreeIds = useMemo(() => getSubtreeFolderIds(folderRoot, folder.id), [folderRoot, folder.id]);

  const [selectedId, setSelectedId] = useState<string>(currentParentId);
  const [search, setSearch] = useState('');
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  // Full flat list including root — exclude isDefault folders and their descendants as move targets
  const allFolders = useMemo(() => {
    const defaultIds = new Set<string>();
    function collectDefault(node: ProfileFolderNode) {
      if (node.isDefault) { defaultIds.add(node.id); (node.children ?? []).forEach(collectDefault); return; }
      (node.children ?? []).forEach(collectDefault);
    }
    collectDefault(folderRoot);
    return flattenTree(folderRoot).filter(({ node }) => !defaultIds.has(node.id));
  }, [folderRoot]);

  // Filtered flat list for search
  const filteredFolders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allFolders;
    return allFolders.filter((f) => f.node.name.toLowerCase().includes(q));
  }, [allFolders, search]);

  const selectedNode = useMemo(() => findProfileFolder(folderRoot, selectedId), [folderRoot, selectedId]);

  const canMove = selectedId !== currentParentId && !subtreeIds.has(selectedId);

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[576px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-[20px] font-bold text-slate-900">Move folder</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-2 pb-4 space-y-4">
          <p className="text-[14px] text-slate-600 font-medium">Any subfolders will be moved along with the folder.</p>

          <div className="space-y-1.5">
            <label className="block text-[14px] font-semibold text-slate-900">
              Location <span className="text-slate-400 font-normal">*</span>
            </label>

            {/* Location select trigger */}
            <button
              type="button"
              onClick={() => setLocationDropdownOpen((v) => !v)}
              className="w-full flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2.5 bg-white text-left hover:bg-slate-50 transition-colors"
            >
              <Search size={16} className="text-slate-400 shrink-0" />
              <span className="flex-1 text-[14px] font-medium text-slate-900 truncate">
                {selectedNode?.name ?? 'Select a folder'}
              </span>
              <ChevronDown
                size={16}
                className={`text-slate-400 shrink-0 transition-transform ${locationDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Tree picker */}
            {locationDropdownOpen && (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                {/* Search inside the tree */}
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search folders..."
                      className="w-full border border-slate-200 rounded-md py-1.5 pl-8 pr-3 text-[12px] outline-none"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Tree rows */}
                <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
                  {filteredFolders.length === 0 ? (
                    <div className="py-8 text-center text-[13px] text-slate-400 font-medium">No folders match.</div>
                  ) : (
                    filteredFolders.map(({ node, depth }) => {
                      const isDisabled = subtreeIds.has(node.id);
                      const isCurrentFolder = node.id === folder.id;
                      const isSelected = node.id === selectedId;
                      const isCurrentParent = node.id === currentParentId;
                      const indentPx = 16 + depth * 20;

                      return (
                        <button
                          key={node.id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            if (!isDisabled) {
                              setSelectedId(node.id);
                              setLocationDropdownOpen(false);
                              setSearch('');
                            }
                          }}
                          className={`w-full flex items-center gap-2 py-2.5 pr-4 text-left transition-colors border-b border-slate-50 last:border-0 ${
                            isDisabled
                              ? 'cursor-not-allowed opacity-50'
                              : isSelected
                              ? 'bg-[#F3EBF0]'
                              : 'hover:bg-slate-50'
                          }`}
                          style={{ paddingLeft: indentPx }}
                        >
                          {/* Folder icon */}
                          <span className="shrink-0">
                            {isSelected ? (
                              <FolderOpen size={18} style={{ color: PRIMARY_PURPLE }} />
                            ) : (
                              <Folder size={18} className={isDisabled ? 'text-slate-300' : 'text-slate-400'} />
                            )}
                          </span>

                          {/* Name */}
                          <span
                            className={`flex-1 text-[14px] font-medium truncate ${
                              isDisabled ? 'text-slate-400' : isSelected ? 'font-semibold' : 'text-slate-800'
                            }`}
                            style={isSelected ? { color: PRIMARY_PURPLE } : undefined}
                          >
                            {node.name}
                          </span>

                          {/* Badges */}
                          <span className="flex items-center gap-2 shrink-0">
                            {isCurrentFolder && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                Current folder
                              </span>
                            )}
                            {!isCurrentFolder && isCurrentParent && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                Current location
                              </span>
                            )}
                            {isSelected && !isCurrentFolder && (
                              <Check size={15} style={{ color: PRIMARY_PURPLE }} />
                            )}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg text-[13px] font-bold border border-slate-200 text-slate-800 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            disabled={!canMove}
            onClick={() => { if (canMove) onMove(folder.id, selectedId); }}
            className="px-5 py-2.5 rounded-lg text-[14px] font-bold disabled:cursor-not-allowed transition-colors"
            style={{
              backgroundColor: canMove ? PRIMARY_PURPLE : 'rgba(0,0,0,0.05)',
              color: canMove ? 'white' : 'rgba(0,0,0,0.4)',
            }}
          >
            Move
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};

// ─── REMOVE FOLDER CONFIRMATION ──────────────────────────────────────────────

const REMOVE_BODY =
  'Removing this folder will delete its subfolder structure, but no employee documents will be deleted. All documents will be moved to the parent folder, which may change who has access to them.';

export const RemoveFolderModal: React.FC<{
  onConfirm: () => void;
  onClose: () => void;
}> = ({ onConfirm, onClose }) => (
  <ModalBackdrop onClose={onClose}>
    <div
      className="bg-white rounded-[14px] shadow-2xl w-[min(100vw-48px,480px)] flex flex-col overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-folder-title"
    >
      <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-1">
        <h2 id="remove-folder-title" className="text-[18px] font-bold text-slate-900 leading-tight">
          Remove folder
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          aria-label="Close"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>
      <div className="px-6 pb-5 pt-3">
        <p className="text-[14px] text-slate-900 leading-[1.5] font-normal">{REMOVE_BODY}</p>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-lg text-[13px] font-bold border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-5 py-2.5 rounded-lg text-[14px] font-bold text-white bg-[#C3402C] hover:opacity-95 transition-opacity"
        >
          Remove
        </button>
      </div>
    </div>
  </ModalBackdrop>
);
