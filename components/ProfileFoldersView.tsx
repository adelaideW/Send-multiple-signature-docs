import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Filter,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Folder,
  Maximize2,
  Columns,
  Users,
  LayoutGrid,
  Plus,
  Info,
  MoreVertical,
  Pencil,
  Shield,
  FolderInput,
  Trash2,
} from 'lucide-react';
import { PRIMARY_PURPLE } from '../constants';
import CreateProfileFolderPage from './CreateProfileFolderPage';
import { RenameFolderModal, SetPermissionModal, MoveFolderModal } from './FolderActionModals';
import {
  addChildFolder,
  canCreateFolderUnderParent,
  createInitialProfileFolderRoot,
  findProfileFolder,
  findParentProfileFolderId,
  isFolderAtMaxTreeDepth,
  truncateProfileFolderName,
  renameProfileFolder,
  updateFolderPermissions,
  removeFolderById,
  moveProfileFolder,
  type ProfileFolderNode,
  type FolderPermission,
} from '../utils/profileFolderUtils';

function formatTs(ts?: string): string {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const yy = String(d.getFullYear()).slice(-2);
    let h = d.getHours();
    h = h % 12 || 12;
    const mi = pad(d.getMinutes());
    const sc = pad(d.getSeconds());
    return `${mm}/${dd}/${yy} ${h}:${mi}:${sc} PST`;
  } catch {
    return ts;
  }
}

const DISABLED_CREATE_TOOLTIP =
  'Maximum nesting depth reached for this folder (10 layers under All documents).';

const MAX_DEPTH_ROW_TOOLTIP =
  'This folder is at the maximum depth and cannot be opened for subfolder management.';

/** 8-digit hex with alpha (supported in modern browsers). */
const primaryTint = (alphaHex: string) => `${PRIMARY_PURPLE}${alphaHex}`;

const TREE_INDENT_PX = 16;
const SIDEBAR_DEFAULT_W = 256;
const SIDEBAR_MIN_W = 200;

const FULL_WIDTH_PRIMARY_CTA =
  'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white shadow-sm hover:opacity-95 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed';

const ChevronSpacer = () => <span className="w-[14px] h-[14px] shrink-0 inline-block" aria-hidden />;

const rdsTooltipSurfaceClass =
  'rounded-xl border border-black/10 bg-white p-3 text-left text-[12px] leading-[18px] text-black shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.15)]';

const FloatingTooltip: React.FC<{
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  maxWidthPx: number;
}> = ({ open, anchorRef, children, maxWidthPx }) => {
  const [tipStyle, setTipStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const el = anchorRef.current;
    const tick = () => {
      const r = el.getBoundingClientRect();
      const pad = 8;
      let left = r.left + r.width / 2 - maxWidthPx / 2;
      left = Math.max(pad, Math.min(left, window.innerWidth - maxWidthPx - pad));
      const spaceAbove = r.top - pad;
      const estH = 100;
      const placeAbove = spaceAbove >= estH + pad;
      if (placeAbove) {
        setTipStyle({
          position: 'fixed',
          left,
          top: r.top - pad,
          width: maxWidthPx,
          zIndex: 100001,
          transform: 'translateY(-100%)',
          pointerEvents: 'none',
        });
      } else {
        setTipStyle({
          position: 'fixed',
          left,
          top: r.bottom + pad,
          width: maxWidthPx,
          zIndex: 100001,
          pointerEvents: 'none',
        });
      }
    };
    tick();
    window.addEventListener('scroll', tick, true);
    window.addEventListener('resize', tick);
    return () => {
      window.removeEventListener('scroll', tick, true);
      window.removeEventListener('resize', tick);
    };
  }, [open, anchorRef, maxWidthPx]);

  if (!open) return null;

  return createPortal(
    <div style={tipStyle} role="tooltip">
      <div className={rdsTooltipSurfaceClass}>{children}</div>
    </div>,
    document.body
  );
};

const DefaultBadge: React.FC = () => {
  const [open, setOpen] = useState(false);
  const badgeRef = useRef<HTMLSpanElement>(null);

  return (
    <>
      <span
        ref={badgeRef}
        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/90 text-slate-800 shrink-0 cursor-help"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        Default
      </span>
      <FloatingTooltip open={open} anchorRef={badgeRef} maxWidthPx={240}>
        <p className="whitespace-normal">Default folders are system-generated that cannot be edited, moved, or have subfolders created within them.</p>
      </FloatingTooltip>
    </>
  );
};

const CURRENT_EMPLOYEE = 'Kale George';

const canEmployeeViewFolder = (node: ProfileFolderNode): boolean => {
  // Default/system folders remain visible unless permissions explicitly exclude Kale.
  if (node.isDefault) {
    if (!node.permissions || node.permissions.length === 0) return true;
    return node.permissions.some(p => p.name === CURRENT_EMPLOYEE);
  }

  // Employee view filters by explicit access grants only.
  if (!node.permissions || node.permissions.length === 0) return false;
  return node.permissions.some(p => p.name === CURRENT_EMPLOYEE);
};

// Returns only folders visible to the employee; invisible parents are skipped and their
// accessible children are promoted up to fill the gap.
const getEmployeeVisibleChildren = (node: ProfileFolderNode): ProfileFolderNode[] => {
  const result: ProfileFolderNode[] = [];
  for (const child of node.children ?? []) {
    if (canEmployeeViewFolder(child)) {
      result.push({ ...child, children: getEmployeeVisibleChildren(child) });
    } else {
      // Parent hidden → promote grandchildren so they appear at this level
      result.push(...getEmployeeVisibleChildren(child));
    }
  }
  return result;
};

const filterFolderTreeForEmployee = (node: ProfileFolderNode): ProfileFolderNode | null => {
  // Root "All documents" always acts as container; filter its children
  return { ...node, children: getEmployeeVisibleChildren(node) };
};

const SidebarTreeRow: React.FC<{
  rootFolder: ProfileFolderNode;
  node: ProfileFolderNode;
  depth: number;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  selectedId: string;
  onSelect: (id: string) => void;
}> = ({ rootFolder, node, depth, expanded, setExpanded, selectedId, onSelect }) => {
  // Default (system) folders cannot be expanded to show subfolders
  const hasKids = !!(node.children && node.children.length > 0) && !node.isDefault;
  const isOpen = expanded[node.id] ?? depth < 2;
  const active = selectedId === node.id;
  const selectionDisabled = isFolderAtMaxTreeDepth(rootFolder, node.id);

  return (
    <div key={node.id}>
      <div
        role={selectionDisabled ? undefined : 'button'}
        tabIndex={selectionDisabled ? undefined : 0}
        onClick={() => {
          if (selectionDisabled) return;
          onSelect(node.id);
        }}
        onKeyDown={(e) => {
          if (selectionDisabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(node.id);
          }
        }}
        title={selectionDisabled ? MAX_DEPTH_ROW_TOOLTIP : undefined}
        className={`w-full flex items-center gap-2 py-2.5 text-left text-[13px] transition-colors border-l-[3px] ${
          selectionDisabled
            ? 'text-slate-400 cursor-not-allowed opacity-55 border-transparent'
            : active
              ? 'font-semibold cursor-pointer'
              : 'text-slate-600 hover:bg-white/80 border-transparent cursor-pointer'
        }`}
        style={{
          paddingLeft: `${12 + depth * TREE_INDENT_PX}px`,
          paddingRight: '12px',
          ...(!selectionDisabled && active
            ? {
                backgroundColor: primaryTint('1A'),
                color: PRIMARY_PURPLE,
                borderLeftColor: PRIMARY_PURPLE,
              }
            : {}),
        }}
        data-active={active ? 'true' : undefined}
      >
        {hasKids ? (
          <button
            type="button"
            className={`p-0.5 rounded shrink-0 ${
              active && !selectionDisabled ? '' : selectionDisabled ? 'text-slate-300' : 'text-slate-400'
            }`}
            style={active && !selectionDisabled ? { color: PRIMARY_PURPLE } : undefined}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Collapse folder' : 'Expand folder'}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((ex) => ({ ...ex, [node.id]: !isOpen }));
            }}
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <ChevronSpacer />
        )}
        <Folder
          size={16}
          className="shrink-0 text-slate-400"
          style={active && !selectionDisabled ? { color: PRIMARY_PURPLE } : undefined}
        />
        <span className="truncate flex-1 min-w-0" title={node.name}>
          {truncateProfileFolderName(node.name)}
        </span>
      </div>
      {hasKids && isOpen
        ? node.children!.map((c) => (
            <SidebarTreeRow
              key={c.id}
              rootFolder={rootFolder}
              node={c}
              depth={depth + 1}
              expanded={expanded}
              setExpanded={setExpanded}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  );
};

const EmptySubfoldersState: React.FC<{ onCreate: () => void; allowCreateHere: boolean; isSystemFolder?: boolean }> = ({
  onCreate,
  allowCreateHere,
  isSystemFolder = false,
}) => {
  const title = isSystemFolder ? 'No subfolders allowed' : 'No subfolder available';
  const subtitle = isSystemFolder
    ? 'This folder is system-generated and does not allow the creation of subfolders.'
    : 'You can create another subfolder here. A new folder will be created to each selected person\'s profile.';
  const canCreate = !isSystemFolder && allowCreateHere;

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center min-h-[360px] max-w-lg mx-auto w-full">
      <Info size={32} strokeWidth={2} className="text-slate-900 mb-5 shrink-0" aria-hidden />
      <h3 className="text-[17px] font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-[14px] text-slate-500 font-medium leading-relaxed mb-8 max-w-[576px]">
        {subtitle}
      </p>
      {!isSystemFolder && (
        <div className="w-auto max-w-full">
          <button
            type="button"
            disabled={!canCreate}
            title={!canCreate ? DISABLED_CREATE_TOOLTIP : undefined}
            onClick={() => {
              if (canCreate) onCreate();
            }}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-[14px] border border-slate-300 bg-white text-[14px] font-semibold text-slate-900 shadow-sm ${
              canCreate ? 'hover:bg-slate-50' : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <Plus size={18} strokeWidth={2.5} aria-hidden />
            New
          </button>
        </div>
      )}
    </div>
  );
};

const ProfileFoldersView: React.FC<{
  folderRoot?: ProfileFolderNode;
  onFolderRootChange?: (next: ProfileFolderNode) => void;
  viewMode?: 'admin' | 'employee';
}> = ({ folderRoot: folderRootProp, onFolderRootChange, viewMode = 'admin' }) => {
  const [localFolderRoot, setLocalFolderRoot] = useState<ProfileFolderNode>(() => createInitialProfileFolderRoot());
  const folderRoot = folderRootProp ?? localFolderRoot;
  const setFolderRoot = useCallback(
    (updater: React.SetStateAction<ProfileFolderNode>) => {
      const next = typeof updater === 'function' ? (updater as (prev: ProfileFolderNode) => ProfileFolderNode)(folderRoot) : updater;
      if (!folderRootProp) setLocalFolderRoot(next);
      onFolderRootChange?.(next);
    },
    [folderRoot, folderRootProp, onFolderRootChange]
  );

  const displayFolderRoot = useMemo(() => {
    if (viewMode === 'employee') {
      const filtered = filterFolderTreeForEmployee(folderRoot);
      return filtered ?? folderRoot;
    }
    return folderRoot;
  }, [folderRoot, viewMode]);
  const [sidebarWidthPx, setSidebarWidthPx] = useState(SIDEBAR_DEFAULT_W);
  const resizeDragRef = useRef<{ startX: number; startW: number } | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    all: true,
    'folder-confidential': true,
    'folder-notice': true,
    'folder-ee-performance': true,
    'folder-company-policies': true,
  });
  const [subView, setSubView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Action dropdown + modals
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const [activeModal, setActiveModal] = useState<{ type: 'rename' | 'set_permission' | 'move' | 'edit'; folderId: string } | null>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch('');
  }, [selectedFolderId]);

  useEffect(() => {
    if (!openDropdownId) return;
    const onDown = (e: MouseEvent) => {
      if (dropdownMenuRef.current?.contains(e.target as Node)) return;
      setOpenDropdownId(null);
      setDropdownPos(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [openDropdownId]);

  useEffect(() => {
    const clamp = () => {
      const max = Math.max(SIDEBAR_MIN_W, Math.floor(window.innerWidth * 0.5));
      setSidebarWidthPx((w) => Math.min(Math.max(SIDEBAR_MIN_W, w), max));
    };
    clamp();
    window.addEventListener('resize', clamp);
    return () => window.removeEventListener('resize', clamp);
  }, []);

  const onSidebarResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      resizeDragRef.current = { startX: e.clientX, startW: sidebarWidthPx };
      const onMove = (ev: MouseEvent) => {
        if (!resizeDragRef.current) return;
        const max = Math.max(SIDEBAR_MIN_W, Math.floor(window.innerWidth * 0.5));
        const delta = ev.clientX - resizeDragRef.current.startX;
        const next = Math.min(Math.max(SIDEBAR_MIN_W, resizeDragRef.current.startW + delta), max);
        setSidebarWidthPx(next);
      };
      const onUp = () => {
        resizeDragRef.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [sidebarWidthPx]
  );

  const selectedFolder = findProfileFolder(displayFolderRoot, selectedFolderId);
  const childFolders = selectedFolder?.children ?? [];

  const tableRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return childFolders;
    return childFolders.filter((r) => r.name.toLowerCase().includes(q));
  }, [childFolders, search]);

  const allowCreateHere = useMemo(
    () => canCreateFolderUnderParent(folderRoot, selectedFolderId),
    [folderRoot, selectedFolderId]
  );

  const selectedHeading = truncateProfileFolderName(selectedFolder?.name ?? 'All documents');
  const childCountLabel = `${childFolders.length}`;
  const selectedParentId = findParentProfileFolderId(displayFolderRoot, selectedFolderId);
  const showBackToParent = selectedFolderId !== 'all' && !!selectedParentId;

  const showEmptyNoSubfolders = childFolders.length === 0;
  const showSearchEmpty = !showEmptyNoSubfolders && tableRows.length === 0 && search.trim().length > 0;

  return (
    <>
      <div className="flex min-h-[560px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <aside
          className="relative shrink-0 border-r border-slate-200 bg-[#fafafa] flex flex-col"
          style={{
            width: sidebarWidthPx,
            minWidth: SIDEBAR_MIN_W,
            maxWidth: '50vw',
          }}
        >
          <div className="p-4 border-b border-slate-200">
            <button
              type="button"
              disabled={!allowCreateHere}
              title={!allowCreateHere ? DISABLED_CREATE_TOOLTIP : undefined}
              onClick={() => {
                if (allowCreateHere) setSubView('create');
              }}
              className={FULL_WIDTH_PRIMARY_CTA}
              style={{ backgroundColor: PRIMARY_PURPLE }}
            >
              <Plus size={18} strokeWidth={2.5} aria-hidden />
              Create
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-2 min-h-0">
            <SidebarTreeRow
              rootFolder={folderRoot}
              node={displayFolderRoot}
              depth={0}
              expanded={expanded}
              setExpanded={setExpanded}
              selectedId={selectedFolderId}
              onSelect={(id) => {
                if (isFolderAtMaxTreeDepth(folderRoot, id)) return;
                setSelectedFolderId(id);
              }}
            />
          </nav>
          <button
            type="button"
            aria-label="Resize folder sidebar"
            onMouseDown={onSidebarResizeStart}
            className="absolute top-0 right-0 z-20 h-full w-1.5 min-w-[4px] cursor-col-resize hover:bg-[#7A005D]/20 active:bg-[#7A005D]/30 border-0 p-0 bg-transparent"
          />
        </aside>

        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="px-8 pt-6 pb-4 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-[15px] font-bold text-slate-900 shrink-0 truncate" title={selectedFolder?.name}>
                {selectedHeading} · {childCountLabel}
              </h2>
              <button
                type="button"
                className="p-1 text-slate-400 hover:text-slate-600 rounded shrink-0"
                aria-label="About folders"
              >
                <HelpCircle size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {selectedFolderId !== 'all' && !selectedFolder?.isDefault && (
                <button
                  type="button"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setOpenDropdownId(openDropdownId ? null : selectedFolderId);
                    setDropdownPos({ top: rect.bottom + 8, left: rect.left });
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg border border-transparent hover:border-slate-200"
                  aria-label="More actions"
                >
                  <MoreVertical size={18} />
                </button>
              )}
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg border border-transparent hover:border-slate-200"
                aria-label="Grid view"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg border border-transparent hover:border-slate-200"
                aria-label="Expand"
              >
                <Maximize2 size={18} />
              </button>
            </div>
          </div>

          <div className="px-8 py-3 flex items-center justify-between gap-4 border-b border-slate-100">
            <div className="relative w-64 max-w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-[12px] outline-none font-medium"
              />
            </div>
            <button className="flex items-center gap-2 text-[13px] font-bold text-slate-700">
              <Filter size={16} />
              Filter
            </button>
          </div>

          {selectedFolderId !== 'all' && (
            <div className="px-8 py-3 flex items-center gap-2 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedFolderId('all')}
                className="text-[13px] font-medium text-slate-700 hover:text-slate-900 hover:underline"
              >
                All documents
              </button>
              {(() => {
                const path: Array<{ id: string; name: string }> = [];
                let current = selectedFolderId;
                while (current && current !== 'all') {
                  const node = findProfileFolder(folderRoot, current);
                  if (node) {
                    path.unshift({ id: node.id, name: node.name });
                    current = findParentProfileFolderId(folderRoot, current);
                  } else {
                    break;
                  }
                }
                return path.map((item) => (
                  <React.Fragment key={item.id}>
                    <span className="text-slate-400">/</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFolderId(item.id)}
                      className="text-[13px] font-medium text-slate-700 hover:text-slate-900 hover:underline"
                    >
                      {truncateProfileFolderName(item.name)}
                    </button>
                  </React.Fragment>
                ));
              })()}
            </div>
          )}

          <div className="flex-1 overflow-x-auto px-8 pb-8 flex flex-col min-h-[400px]">
            {showEmptyNoSubfolders ? (
              <EmptySubfoldersState
                onCreate={() => setSubView('create')}
                allowCreateHere={allowCreateHere}
                isSystemFolder={selectedFolder?.isDefault ?? false}
              />
            ) : (
              <>
                <table className="w-full text-left border-collapse min-w-[720px]">
                  <thead>
                    <tr className="text-[11px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1 cursor-pointer">
                          Folder name
                          <ChevronDown size={14} className="text-slate-300" />
                        </span>
                      </th>
                      <th className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1 cursor-pointer">
                          Created for
                          <ChevronDown size={14} className="text-slate-300" />
                        </span>
                      </th>
                      <th className="py-3">
                        <span className="inline-flex items-center gap-1 cursor-pointer">
                          Last modified
                          <ChevronDown size={14} className="text-slate-300" />
                        </span>
                      </th>
                      <th className="py-3 w-10 text-right pr-2">
                        <Columns size={16} className="inline text-slate-300 ml-auto" aria-hidden />
                      </th>
                      <th className="py-3 w-12" />
                    </tr>
                  </thead>
                  <tbody className="text-[13px]">
                    {tableRows.map((row) => {
                      const active = selectedFolderId === row.id;
                      const rowMaxDepth = isFolderAtMaxTreeDepth(folderRoot, row.id);
                      const isDropdownOpen = openDropdownId === row.id;
                      return (
                        <tr
                          key={row.id}
                          title={rowMaxDepth ? MAX_DEPTH_ROW_TOOLTIP : undefined}
                          className={`border-b border-slate-100 transition-colors group ${
                            rowMaxDepth
                              ? 'opacity-55 cursor-not-allowed'
                              : 'cursor-pointer hover:bg-slate-50/80'
                          }`}
                          style={
                            active && !rowMaxDepth
                              ? {
                                  backgroundColor: primaryTint('14'),
                                  boxShadow: `inset 3px 0 0 0 ${PRIMARY_PURPLE}`,
                                }
                              : undefined
                          }
                          onClick={() => {
                            if (!rowMaxDepth) setSelectedFolderId(row.id);
                          }}
                        >
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <Folder
                                size={18}
                                className={`shrink-0 ${active && !rowMaxDepth ? '' : 'text-slate-400'}`}
                                style={active && !rowMaxDepth ? { color: PRIMARY_PURPLE } : undefined}
                              />
                              <div className="min-w-0 flex items-center gap-2 flex-wrap">
                                <span
                                  className={`font-bold truncate max-w-[280px] ${rowMaxDepth ? '' : 'hover:underline'}`}
                                  style={{ color: rowMaxDepth ? '#64748b' : PRIMARY_PURPLE }}
                                  title={row.name}
                                >
                                  {truncateProfileFolderName(row.name)}
                                </span>
                                {row.isDefault && <DefaultBadge />}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 pr-4 text-slate-700 font-medium">
                            <span className="inline-flex items-center gap-1.5">
                              <Users size={14} className="text-slate-400 shrink-0" />
                              {row.createdFor === 'All - Employees' ? 'All - Everyone' : (row.createdFor ?? '—')}
                            </span>
                          </td>
                          <td className="py-4 text-slate-500 font-medium whitespace-nowrap">
                            {formatTs(row.lastModified)}
                          </td>
                          <td className="py-4 pr-2" />
                          {/* Action column — hidden for system-default folders */}
                          <td className="py-4 pr-3 text-right" onClick={(e) => e.stopPropagation()}>
                            {!row.isDefault && (
                              <button
                                type="button"
                                aria-label="More actions"
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors ${isDropdownOpen ? 'bg-slate-200/70 text-slate-700' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isDropdownOpen) {
                                    setOpenDropdownId(null);
                                    setDropdownPos(null);
                                  } else {
                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                    setDropdownPos({ top: rect.bottom + 4, left: rect.right });
                                    setOpenDropdownId(row.id);
                                  }
                                }}
                              >
                                <MoreVertical size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {showSearchEmpty && (
                  <div className="py-20 text-center text-slate-500 text-sm font-medium">
                    No folders match your search.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ... More actions dropdown portal */}
      {openDropdownId && dropdownPos && (() => {
        const targetFolder = findProfileFolder(folderRoot, openDropdownId);
        if (!targetFolder) return null;
        return createPortal(
          <div
            ref={dropdownMenuRef}
            className="fixed z-[400] bg-white border border-black/10 rounded-lg shadow-xl py-1 w-48 overflow-hidden"
            style={{ top: dropdownPos.top, right: window.innerWidth - dropdownPos.left }}
          >
            {!targetFolder.isDefault && (
              <>
                {[
                  { label: 'Rename', icon: <Pencil size={16} />, action: 'rename' as const },
                  { label: 'Edit', icon: <Pencil size={16} />, action: 'edit' as const },
                  { label: 'Set permission', icon: <Shield size={16} />, action: 'set_permission' as const },
                  { label: 'Move', icon: <FolderInput size={16} />, action: 'move' as const },
                ].map(({ label, icon, action }) => (
                  <button
                    key={action}
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-slate-800 hover:bg-slate-50 transition-colors"
                    onClick={() => {
                      setActiveModal({ type: action, folderId: openDropdownId });
                      setOpenDropdownId(null);
                      setDropdownPos(null);
                    }}
                  >
                    <span className="text-slate-500 shrink-0">{icon}</span>
                    {label}
                  </button>
                ))}
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#e4633c] hover:bg-red-50 transition-colors"
                  onClick={() => {
                    setFolderRoot((r) => removeFolderById(r, openDropdownId));
                    if (selectedFolderId === openDropdownId) setSelectedFolderId('all');
                    setOpenDropdownId(null);
                    setDropdownPos(null);
                  }}
                >
                  <span className="shrink-0"><Trash2 size={16} /></span>
                  Remove
                </button>
              </>
            )}
            {targetFolder.isDefault && (
              <div className="px-4 py-2.5 text-[12px] text-slate-500">
                No actions available for system folders
              </div>
            )}
          </div>,
          document.body
        );
      })()}

      {/* Modals */}
      {activeModal && (() => {
        const targetFolder = findProfileFolder(folderRoot, activeModal.folderId);
        if (!targetFolder) return null;

        if (activeModal.type === 'rename') {
          return (
            <RenameFolderModal
              folder={targetFolder}
              onSave={(id, newName, newDesc) => {
                setFolderRoot((r) => renameProfileFolder(r, id, newName, newDesc));
                setActiveModal(null);
              }}
              onClose={() => setActiveModal(null)}
            />
          );
        }
        if (activeModal.type === 'set_permission') {
          return (
            <SetPermissionModal
              folder={targetFolder}
              onSave={(id, permissions) => {
                setFolderRoot((r) => updateFolderPermissions(r, id, permissions));
                setActiveModal(null);
              }}
              onClose={() => setActiveModal(null)}
            />
          );
        }
        if (activeModal.type === 'move') {
          return (
            <MoveFolderModal
              folder={targetFolder}
              folderRoot={folderRoot}
              onMove={(folderId, newParentId) => {
                setFolderRoot((r) => moveProfileFolder(r, folderId, newParentId));
                if (selectedFolderId === folderId) setSelectedFolderId(newParentId);
                setActiveModal(null);
              }}
              onClose={() => setActiveModal(null)}
            />
          );
        }
        if (activeModal.type === 'edit') {
          setSubView('edit');
          setEditingFolderId(activeModal.folderId);
          setActiveModal(null);
          return null;
        }
        return null;
      })()}

      {subView === 'create' && (
        <div className="fixed inset-0 z-[200] bg-[#FAFAFA]">
          <CreateProfileFolderPage
            rootFolder={folderRoot}
            parentFolderId={selectedFolderId}
            onExit={() => setSubView('list')}
            onCreate={({ name, description, include, except, permissions }) => {
              const id = `pf-folder-${Date.now()}`;
              const exceptSet = new Set(except);
              const allEmployees = include.length === 0;
              const createdFor = allEmployees
                ? (exceptSet.size > 0 ? `All - Employees (${[...exceptSet].join(', ')} excluded)` : 'All - Employees')
                : include.join(', ');
              const child: ProfileFolderNode = {
                id,
                name,
                description: description || undefined,
                createdFor,
                lastModified: new Date().toISOString(),
                permissions: permissions.length > 0 ? (permissions as FolderPermission[]) : undefined,
              };
              setFolderRoot((r) => addChildFolder(r, selectedFolderId, child));
              setSubView('list');
              setExpanded((ex) => ({ ...ex, [selectedFolderId]: true }));
            }}
          />
        </div>
      )}

      {subView === 'edit' && editingFolderId && (() => {
        const folderToEdit = findProfileFolder(folderRoot, editingFolderId);
        if (!folderToEdit) return null;
        return (
          <div className="fixed inset-0 z-[200] bg-[#FAFAFA]">
            <CreateProfileFolderPage
              rootFolder={folderRoot}
              parentFolderId={folderToEdit.id}
              editingFolder={folderToEdit}
              onExit={() => {
                setSubView('list');
                setEditingFolderId(null);
              }}
              onCreate={({ name, description, include, except, permissions }) => {
                const exceptSet = new Set(except);
                const allEmployees = include.length === 0;
                const createdFor = allEmployees
                  ? (exceptSet.size > 0 ? `All - Employees (${[...exceptSet].join(', ')} excluded)` : 'All - Employees')
                  : include.join(', ');
                setFolderRoot((r) => renameProfileFolder(r, editingFolderId, name, description));
                setFolderRoot((r) => updateFolderPermissions(r, editingFolderId, permissions as FolderPermission[]));
                setFolderRoot((r) => {
                  const updated = findProfileFolder(r, editingFolderId);
                  if (updated) updated.createdFor = createdFor;
                  return r;
                });
                setSubView('list');
                setEditingFolderId(null);
              }}
            />
          </div>
        );
      })()}
    </>
  );
};

export default ProfileFoldersView;
