import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  HelpCircle,
  Menu,
  ArrowLeft,
  Folder as FolderIcon,
  UserRound,
  ChevronRight,
  Users,
  X,
} from 'lucide-react';
import { PRIMARY_PURPLE } from '../constants';
import type { ProfileFolderNode } from '../utils/profileFolderUtils';
import { buildFolderLocationPreview, MAX_PROFILE_FOLDER_LAYERS } from '../utils/profileFolderUtils';

export interface CreateProfileFolderPageProps {
  rootFolder: ProfileFolderNode;
  parentFolderId: string;
  onExit: () => void;
  onCreate?: (payload: { name: string; description: string }) => void;
}

/** Tooltip — DM Bulk Upload node 7302:210847 */
const ADMIN_DESCRIPTION_TOOLTIP =
  'This description is visible only to admins with access to this page';

/** Tooltip — DM Bulk Upload node 6173:37830 */
const ADD_PEOPLE_ACCESS_TOOLTIP =
  'Workers will have access to a folder only if they are granted permissions below, or are granted "view" or "manage" privileges for employee documents in the Permissions app';

type PickerType = 'include' | 'except' | 'access';

type MenuRow =
  | { kind: 'section'; label: string }
  | { kind: 'item'; label: string; subtitle?: string; hasChevron?: boolean; tone?: 'default' | 'muted' };

const MENU_BASE_ROWS: MenuRow[] = [
  { kind: 'section', label: 'Saved Groups' },
  { kind: 'item', label: 'View all saved groups', tone: 'muted' },
  { kind: 'section', label: 'Categories' },
  { kind: 'item', label: 'All... (Managers, employees, etc.)', tone: 'muted' },
  { kind: 'item', label: 'Admins', hasChevron: true },
  { kind: 'item', label: 'Department', hasChevron: true },
  { kind: 'item', label: 'State', hasChevron: true },
  { kind: 'item', label: 'Country', hasChevron: true },
  { kind: 'item', label: 'Location', hasChevron: true },
  { kind: 'item', label: 'Entity', hasChevron: true },
  { kind: 'item', label: 'Team', hasChevron: true },
  { kind: 'item', label: 'Level', hasChevron: true },
  { kind: 'item', label: 'Employment types', hasChevron: true },
  { kind: 'section', label: 'People' },
  { kind: 'item', label: 'All - Employees' },
  { kind: 'item', label: 'Engineering' },
  { kind: 'item', label: 'Human Resources' },
  { kind: 'item', label: 'Finance' },
  { kind: 'item', label: 'Product' },
  { kind: 'item', label: 'Design' },
];

const ACCESS_PRESET_ROWS: MenuRow[] = [
  { kind: 'item', label: 'Self - Employee' },
  { kind: 'item', label: "Manager - The employee's manager" },
  { kind: 'item', label: "Peer - Employee's direct teammate" },
];

const DROPDOWN_BODY_MAX_PX = 240;
const OVERLAY_Z = 100_000;

const rdsTooltipSurfaceClass =
  'rounded-xl border border-black/10 bg-[#EDEBE7] p-3 text-left text-[12px] leading-4 text-slate-900 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.15)]';

/** Fixed-position RDS tooltip (portal) — matches DM Bulk Upload tooltips */
const FloatingTooltip: React.FC<{
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  maxWidthPx: number;
}> = ({ open, anchorRef, children, maxWidthPx }) => {
  const [tipStyle, setTipStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
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

const TooltipNearDescriptionLabel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="p-0.5 rounded text-slate-400 hover:text-slate-600 cursor-help outline-none focus-visible:ring-2 focus-visible:ring-[#7A005D]/30 ml-1 align-middle"
        aria-label="About description visibility"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <HelpCircle size={15} strokeWidth={2} />
      </button>
      <FloatingTooltip open={open} anchorRef={btnRef} maxWidthPx={216}>
        <p className="whitespace-normal">{ADMIN_DESCRIPTION_TOOLTIP}</p>
      </FloatingTooltip>
    </>
  );
};

const TooltipNearAddPeopleLabel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="p-0.5 rounded text-slate-400 hover:text-slate-600 cursor-help outline-none focus-visible:ring-2 focus-visible:ring-[#7A005D]/30 align-text-bottom"
        aria-label="About folder access for workers"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <HelpCircle size={14} strokeWidth={2} />
      </button>
      <FloatingTooltip open={open} anchorRef={btnRef} maxWidthPx={280}>
        <p className="whitespace-normal">{ADD_PEOPLE_ACCESS_TOOLTIP}</p>
      </FloatingTooltip>
    </>
  );
};

function SelectionChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[12px] font-semibold text-slate-800 shrink-0">
      <Users size={13} className="text-slate-500 shrink-0" aria-hidden />
      <span className="max-w-[200px] truncate">{label}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="p-0.5 rounded hover:bg-slate-200/80 text-slate-500"
        aria-label={`Remove ${label}`}
      >
        <X size={12} strokeWidth={2.5} />
      </button>
    </span>
  );
}

type DropdownCoords = { top: number; left: number; width: number };

const GroupPickerDropdown: React.FC<{
  open: boolean;
  coords: DropdownCoords | null;
  rows: MenuRow[];
  highlightedIndex: number;
  onPick: (opt: string) => void;
  onHoverIndex: (idx: number) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}> = ({ open, coords, rows, highlightedIndex, onPick, onHoverIndex, dropdownRef }) => {
  if (!open || !coords) return null;

  const { top, left, width } = coords;
  let itemIndex = -1;

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
      style={{
        top,
        left,
        width,
        zIndex: OVERLAY_Z,
        maxHeight: DROPDOWN_BODY_MAX_PX,
      }}
      role="listbox"
    >
      <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: DROPDOWN_BODY_MAX_PX }}>
        {rows.map((row, idx) => {
          if (row.kind === 'section') {
            return (
              <div
                key={`sec-${row.label}-${idx}`}
                className="px-5 pt-4 pb-2 text-[11px] font-semibold tracking-[0.08em] uppercase text-slate-400"
              >
                {row.label}
              </div>
            );
          }
          itemIndex += 1;
          const highlighted = itemIndex === highlightedIndex;
          return (
            <button
              key={`row-${row.label}-${idx}`}
              type="button"
              role="option"
              aria-selected={highlighted}
              className={`w-full text-left px-5 py-3 text-[15px] transition-colors flex items-center justify-between gap-3 ${
                highlighted ? 'bg-slate-50' : 'hover:bg-slate-50'
              } ${row.tone === 'muted' ? 'text-slate-700' : 'text-slate-800'}`}
              style={{ borderTop: '1px solid #F0F0F0' }}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => onHoverIndex(itemIndex)}
              onClick={() => onPick(row.label)}
            >
              <div className="min-w-0">
                <div className="truncate">{row.label}</div>
                {row.subtitle ? <div className="text-[12px] text-slate-400 mt-0.5">{row.subtitle}</div> : null}
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

const CreateProfileFolderPage: React.FC<CreateProfileFolderPageProps> = ({
  rootFolder,
  parentFolderId,
  onExit,
  onCreate,
}) => {
  const [folderName, setFolderName] = useState('');
  const [description, setDescription] = useState('');
  const [peopleSelectionError] = useState<string | null>(null);
  const [includeChips, setIncludeChips] = useState<string[]>([]);
  const [exceptChips, setExceptChips] = useState<string[]>([]);
  const [accessChips, setAccessChips] = useState<string[]>([]);

  const [activePicker, setActivePicker] = useState<PickerType | null>(null);
  const [queries, setQueries] = useState<Record<PickerType, string>>({
    include: '',
    except: '',
    access: '',
  });
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownCoords, setDropdownCoords] = useState<DropdownCoords | null>(null);
  const [accessRows, setAccessRows] = useState<Array<{ name: string; access: 'Manage' | 'View' }>>([]);

  const includeAnchorRef = useRef<HTMLDivElement>(null);
  const exceptAnchorRef = useRef<HTMLDivElement>(null);
  const accessAnchorRef = useRef<HTMLDivElement>(null);
  const includeInputRef = useRef<HTMLInputElement>(null);
  const exceptInputRef = useRef<HTMLInputElement>(null);
  const accessInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activePickerRef = useRef<PickerType | null>(null);

  useEffect(() => {
    activePickerRef.current = activePicker;
  }, [activePicker]);

  const updateDropdownPosition = useCallback(() => {
    if (!activePicker) {
      setDropdownCoords(null);
      return;
    }
    const anchor =
      activePicker === 'include'
        ? includeAnchorRef.current
        : activePicker === 'except'
          ? exceptAnchorRef.current
          : accessAnchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const width = Math.max(rect.width, 300);
    let left = rect.left;
    let top = rect.bottom + 8;
    if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);
    const totalH = DROPDOWN_BODY_MAX_PX;
    if (top + totalH > window.innerHeight - 8) {
      top = Math.max(8, rect.top - 8 - totalH);
    }
    setDropdownCoords({ top, left, width });
  }, [activePicker]);

  useLayoutEffect(() => {
    updateDropdownPosition();
  }, [activePicker, updateDropdownPosition]);

  useEffect(() => {
    if (!activePicker) return;
    const onScroll = () => updateDropdownPosition();
    const onResize = () => updateDropdownPosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [activePicker, updateDropdownPosition]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (dropdownRef.current?.contains(t)) return;
      if (
        includeAnchorRef.current?.contains(t) ||
        exceptAnchorRef.current?.contains(t) ||
        accessAnchorRef.current?.contains(t)
      ) {
        return;
      }
      setActivePicker(null);
      setQueries((prev) => ({ ...prev, include: '', except: '', access: '' }));
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const openPicker = (which: PickerType) => {
    setActivePicker((cur) => (cur === which ? null : which));
    setHighlightedIndex(0);
  };

  const trimmedName = folderName.trim();
  const nameOk = trimmedName.length > 0;

  const locationSteps = useMemo(
    () => buildFolderLocationPreview(rootFolder, parentFolderId, trimmedName || 'New folder'),
    [rootFolder, parentFolderId, trimmedName]
  );

  const handleSubmit = () => {
    if (!nameOk) return;
    onCreate?.({ name: trimmedName, description: description.trim() });
  };

  const layerHelpText = useMemo(() => {
    const levels = locationSteps.filter((s) => s.id !== '__user_profile__').length;
    return `Up to ${MAX_PROFILE_FOLDER_LAYERS} folder layers · showing ${Math.min(levels, MAX_PROFILE_FOLDER_LAYERS)}`;
  }, [locationSteps]);

  const query = activePicker ? queries[activePicker] : '';
  const menuRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows: MenuRow[] = MENU_BASE_ROWS;
    if (activePicker === 'access') {
      rows = [...ACCESS_PRESET_ROWS, { kind: 'section', label: 'Groups' }, ...MENU_BASE_ROWS];
    }
    if (!q) return rows;
    return rows.filter((r) => r.kind === 'item' && r.label.toLowerCase().includes(q));
  }, [activePicker, query]);
  const selectableRows = useMemo(
    () => menuRows.filter((r): r is Extract<MenuRow, { kind: 'item' }> => r.kind === 'item'),
    [menuRows]
  );

  const addChip = (which: PickerType, opt: string) => {
    const add = (prev: string[]) => (prev.includes(opt) ? prev : [...prev, opt]);
    if (which === 'include') setIncludeChips(add);
    else if (which === 'except') setExceptChips(add);
    else setAccessChips(add);
    setActivePicker(null);
    if (which) setQueries((prev) => ({ ...prev, [which]: '' }));
    setHighlightedIndex(0);
  };

  const handlePickerKeyDown = (which: PickerType, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activePicker !== which) {
        openPicker(which);
        return;
      }
      setHighlightedIndex((i) => Math.min(selectableRows.length - 1, i + 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activePicker !== which) {
        openPicker(which);
        return;
      }
      setHighlightedIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === 'Enter') {
      if (activePicker === which && selectableRows[highlightedIndex]) {
        e.preventDefault();
        addChip(which, selectableRows[highlightedIndex]!.label);
      }
      return;
    }
    if (e.key === 'Escape') {
      setActivePicker(null);
      return;
    }
  };

  const handleAccessAdd = () => {
    if (accessChips.length === 0) return;
    setAccessRows((prev) => [
      ...prev,
      ...accessChips.map((name) => ({ name, access: 'Manage' as const })),
    ]);
    setAccessChips([]);
    setQueries((prev) => ({ ...prev, access: '' }));
  };

  return (
    <div className="flex flex-col min-h-screen h-screen bg-[#FAFAFA]">
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <button type="button" className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg" aria-label="Menu">
            <Menu size={22} strokeWidth={2} />
          </button>
          <h2 className="text-[15px] font-bold text-slate-900">Create folder</h2>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-bold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <ArrowLeft size={16} aria-hidden />
          Exit
        </button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 gap-0 bg-[#FAFAFA] overflow-auto">
        <div className="flex-1 min-w-0 space-y-8 pt-10 px-6 lg:px-10 xl:px-16 max-w-[860px] mx-auto">
          <div>
            <h1 className="text-[20px] font-bold text-slate-900">Create folder</h1>
            <p className="mt-2 text-[14px] text-slate-600 leading-relaxed max-w-3xl font-medium">
              Rippling will create a folder in each selected person&apos;s profile.{' '}
              <a href="#" className="font-bold hover:underline" style={{ color: PRIMARY_PURPLE }}>
                Learn more
              </a>
            </p>
          </div>

          <div className="space-y-2 max-w-2xl">
            <label htmlFor="pf-folder-name" className="text-[13px] font-bold text-slate-800">
              Folder name <span className="text-red-500">*</span>
            </label>
            <input
              id="pf-folder-name"
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#7A005D]/20"
            />
          </div>

          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center">
              <label htmlFor="pf-folder-desc" className="text-[13px] font-bold text-slate-800">
                Description
              </label>
              <TooltipNearDescriptionLabel />
            </div>
            <input
              id="pf-folder-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#7A005D]/20"
            />
          </div>

          <div className="space-y-3 max-w-2xl">
            <div>
              <p className="text-[13px] font-bold text-slate-800">
                Select the people that you want Rippling to create folders for <span className="text-red-500">*</span>
              </p>
              <p className="text-[13px] text-slate-500 mt-1 font-medium">
                Rippling creates a folder in each selected person&apos;s profile. You can&apos;t change this list after
                the folders are created.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-visible">
              <div
                ref={includeAnchorRef}
                className="w-full text-left px-4 py-3 hover:bg-slate-50/80 flex flex-wrap items-center gap-x-2 gap-y-2"
                onClick={() => {
                  openPicker('include');
                  includeInputRef.current?.focus();
                }}
              >
                <span className="text-[13px] font-bold text-slate-800 shrink-0">Include:</span>
                <span className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                  {includeChips.map((c) => (
                    <SelectionChip key={c} label={c} onRemove={() => setIncludeChips((x) => x.filter((y) => y !== c))} />
                  ))}
                  <input
                    ref={includeInputRef}
                    value={queries.include}
                    onChange={(e) => {
                      setQueries((prev) => ({ ...prev, include: e.target.value }));
                      if (activePicker !== 'include') openPicker('include');
                      setHighlightedIndex(0);
                    }}
                    onFocus={() => openPicker('include')}
                    onKeyDown={(e) => handlePickerKeyDown('include', e)}
                    placeholder={includeChips.length === 0 ? 'Search or browse options to create groups of employees' : ''}
                    className="min-w-[260px] flex-1 bg-transparent text-[13px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </span>
              </div>
              <div
                ref={exceptAnchorRef}
                className="w-full text-left px-4 py-3 hover:bg-slate-50/80 flex flex-wrap items-center gap-x-2 gap-y-2"
                onClick={() => {
                  openPicker('except');
                  exceptInputRef.current?.focus();
                }}
              >
                <span className="text-[13px] font-bold text-slate-800 shrink-0">Except:</span>
                <span className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                  {exceptChips.map((c) => (
                    <SelectionChip key={c} label={c} onRemove={() => setExceptChips((x) => x.filter((y) => y !== c))} />
                  ))}
                  <input
                    ref={exceptInputRef}
                    value={queries.except}
                    onChange={(e) => {
                      setQueries((prev) => ({ ...prev, except: e.target.value }));
                      if (activePicker !== 'except') openPicker('except');
                      setHighlightedIndex(0);
                    }}
                    onFocus={() => openPicker('except')}
                    onKeyDown={(e) => handlePickerKeyDown('except', e)}
                    placeholder={exceptChips.length === 0 ? 'Click to add exceptions' : ''}
                    className="min-w-[220px] flex-1 bg-transparent text-[13px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </span>
              </div>
            </div>

            <div className="text-right">
              <button type="button" className="text-[13px] font-bold hover:underline" style={{ color: PRIMARY_PURPLE }}>
                Preview people &gt;
              </button>
            </div>
            {peopleSelectionError && <p className="text-[12px] text-red-600 font-semibold">{peopleSelectionError}</p>}
          </div>

          <div className="space-y-3 max-w-2xl">
            <p className="text-[13px] font-bold text-slate-800 inline-flex flex-wrap items-center gap-1">
              <span>
                Add people who need access <span className="text-red-500">*</span>
              </span>
              <TooltipNearAddPeopleLabel />
            </p>

            <div className="flex gap-2 items-start relative">
              <div
                ref={accessAnchorRef}
                className="flex-1 min-w-0 border border-slate-200 rounded-lg py-2.5 px-3 text-left hover:bg-slate-50/60 bg-white flex flex-wrap items-center gap-2 min-h-[44px]"
                onClick={() => {
                  openPicker('access');
                  accessInputRef.current?.focus();
                }}
              >
                {accessChips.map((c) => (
                  <SelectionChip key={c} label={c} onRemove={() => setAccessChips((x) => x.filter((y) => y !== c))} />
                ))}
                <input
                  ref={accessInputRef}
                  value={queries.access}
                  onChange={(e) => {
                    setQueries((prev) => ({ ...prev, access: e.target.value }));
                    if (activePicker !== 'access') openPicker('access');
                    setHighlightedIndex(0);
                  }}
                  onFocus={() => openPicker('access')}
                  onKeyDown={(e) => handlePickerKeyDown('access', e)}
                  placeholder={accessChips.length === 0 ? 'Search or browse options to create groups of people' : ''}
                  className="min-w-[240px] flex-1 bg-transparent text-[13px] font-medium text-slate-700 outline-none placeholder:text-slate-500"
                />
              </div>
              <button
                type="button"
                disabled={accessChips.length === 0}
                className="px-5 py-2.5 rounded-lg text-[13px] font-bold border border-slate-200 bg-white text-slate-900 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 disabled:hover:bg-white"
                onClick={handleAccessAdd}
              >
                Add
              </button>
            </div>

            <GroupPickerDropdown
              open={activePicker !== null}
              coords={dropdownCoords}
              rows={menuRows}
              highlightedIndex={Math.min(highlightedIndex, Math.max(0, selectableRows.length - 1))}
              onPick={(opt) => {
                const cur = activePickerRef.current;
                if (cur) addChip(cur, opt);
              }}
              onHoverIndex={setHighlightedIndex}
              dropdownRef={dropdownRef}
            />

            <p className="text-[13px] text-slate-500 font-medium">
              Specify the access level for each person.{' '}
              <a href="#" className="font-bold hover:underline" style={{ color: PRIMARY_PURPLE }}>
                Learn more
              </a>
              .
            </p>
            <div className="rounded-xl border border-slate-200 bg-white min-h-[120px] overflow-hidden">
              <div className="grid grid-cols-[1fr_160px] items-center bg-slate-50 border-b border-slate-200">
                <div className="px-4 py-2.5 text-[12px] font-semibold text-slate-600">People with access</div>
                <div className="px-4 py-2.5 text-[12px] font-semibold text-slate-600">Access</div>
              </div>
              {accessRows.length === 0 ? (
                <div className="h-20" />
              ) : (
                accessRows.map((row, idx) => (
                  <div key={`${row.name}-${idx}`} className="grid grid-cols-[1fr_160px] items-center border-t border-slate-100">
                    <div className="px-4 py-2.5 text-[13px] font-medium text-slate-800">{row.name}</div>
                    <div className="px-4 py-2.5">
                      <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] font-semibold text-slate-700">
                        {row.access}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <aside className="w-full lg:w-[448px] shrink-0 mt-10 px-16">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-10">
            <h3 className="text-[15px] font-bold text-slate-900">Folder location</h3>
            <p className="text-[12px] text-slate-500 mt-2 leading-relaxed font-medium">
              All documents are located in folders within each person&apos;s profile. People only see the documents they
              have access to.{' '}
              <a href="#" className="font-semibold hover:underline" style={{ color: PRIMARY_PURPLE }}>
                Learn more
              </a>
            </p>
            <p className="text-[11px] text-slate-400 font-semibold mt-3 mb-3 uppercase tracking-wide">{layerHelpText}</p>
            <div className="mt-4 border-t border-slate-100 pt-4 space-y-0.5">
              {locationSteps.map((step, idx) => {
                const isUser = step.id === '__user_profile__';
                const isNew = step.isNewPlaceholder;
                const padLeft = idx * 14;
                return (
                  <div
                    key={`${step.id}-${idx}`}
                    className="flex items-center gap-2.5 py-1.5 min-h-[32px]"
                    style={{ paddingLeft: padLeft }}
                  >
                    {isUser ? (
                      <UserRound size={18} className="text-slate-500 shrink-0" />
                    ) : (
                      <FolderIcon
                        size={18}
                        className={`shrink-0 ${isNew ? 'text-slate-900' : 'text-slate-400'}`}
                        strokeWidth={2}
                      />
                    )}
                    <span
                      className={`text-[13px] leading-snug ${isNew ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}
                      title={step.label !== step.truncated ? step.label : undefined}
                    >
                      {step.truncated}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      <footer className="flex justify-end items-center gap-3 px-6 py-4 bg-white border-t border-slate-200 shrink-0">
        <button
          type="button"
          onClick={onExit}
          className="px-4 py-2 text-[13px] font-bold text-slate-700 hover:bg-slate-50 rounded-lg"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!nameOk}
          onClick={handleSubmit}
          className={`px-5 py-2.5 rounded-lg text-[13px] font-bold text-white shadow-sm ${
            nameOk ? 'hover:opacity-95' : 'opacity-40 cursor-not-allowed'
          }`}
          style={{ backgroundColor: PRIMARY_PURPLE }}
        >
          Create
        </button>
      </footer>
    </div>
  );
};

export default CreateProfileFolderPage;
