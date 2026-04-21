
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  History,
  Search,
  MoreVertical,
  ChevronDown,
  Maximize2,
  Filter,
  Columns,
  RefreshCw,
  Folder,
  FileText,
  Settings2,
  Send,
  Upload,
  Share2,
  Download,
  Lock,
  Archive,
  Trash2,
  ArrowRightLeft,
  Eye,
  PenLine,
  Mail,
  ChevronRight,
} from 'lucide-react';
import { Employee } from '../types';
import { PRIMARY_PURPLE } from '../constants';

interface EmployeeProfileProps {
  employee: Employee;
}

export const EmployeeHeaderSection: React.FC<EmployeeProfileProps> = ({ employee }) => {
  return (
    <div className="pt-4 px-8 pb-4">
      <nav className="flex items-center gap-2 text-[12px] text-slate-500 mb-4">
        <span className="hover:text-slate-700 cursor-pointer">Feeds</span>
        <span className="text-slate-300" aria-hidden>
          /
        </span>
        <span className="text-slate-800 font-medium">Employee profile</span>
      </nav>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-100 bg-slate-50">
              {employee.avatar ? (
                <img src={employee.avatar} alt={employee.name} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-slate-300">KG</div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 mb-0.5">{employee.name}</h1>
              <p className="text-[13px] text-slate-500 font-medium">{employee.role}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 px-3 py-1.5 bg-white hover:bg-slate-50 rounded-md text-[13px] font-bold text-slate-700 transition-colors border border-slate-200">
              <History size={16} />
              <span>View history</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-1.5 bg-white hover:bg-slate-50 rounded-md text-[13px] font-bold text-slate-700 transition-colors border border-slate-200">
              <RefreshCw size={16} />
              <span>Change employment type</span>
            </button>
            <button className="p-1.5 bg-white hover:bg-slate-50 rounded-md transition-colors border border-slate-200 text-slate-700">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mt-8 border-t border-slate-100 pt-6">
          <div>
            <p className="text-[10px] text-slate-400 mb-1 uppercase font-bold tracking-wider">Employment type</p>
            <p className="text-[12px] font-bold text-slate-900">{employee.employmentType}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 mb-1 uppercase font-bold tracking-wider">Department</p>
            <p className="text-[12px] font-bold text-slate-900">{employee.department}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 mb-1 uppercase font-bold tracking-wider">Work location</p>
            <p className="text-[12px] font-bold text-slate-900">{employee.workLocation}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 mb-1 uppercase font-bold tracking-wider">Work email</p>
            <p className="text-[12px] font-bold text-slate-900">{employee.workEmail}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 mb-1 uppercase font-bold tracking-wider">Start date</p>
            <p className="text-[12px] font-bold text-slate-900">{employee.startDate}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 mb-1 uppercase font-bold tracking-wider">Manager</p>
            <p className="text-[12px] font-bold text-slate-900">{employee.manager}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DocumentsSectionProps {
  onSend?: () => void;
  onOpenEnvelope?: (name: string) => void;
  onReviewDocument?: () => void;
  viewByDocuments: boolean;
  setViewByDocuments: (val: boolean) => void;
}

type ProfileDocTab = 'action_required' | 'documents';

interface ActionChildRow {
  id: string;
  name: string;
  status: string;
  dotClass: string;
  /** Kale George (prototype signer) still needs to complete this document. */
  needsKaleSignature: boolean;
}

interface ActionPacketRow {
  id: string;
  name: string;
  status: string;
  dotClass: string;
  lastModified: string;
  children: ActionChildRow[];
}

const ACTION_REQUIRED_PACKETS: ActionPacketRow[] = [
  {
    id: 'ap1',
    name: 'Employee onboarding packet — Engineering',
    status: 'In progress',
    dotClass: 'bg-amber-500',
    lastModified: '2026-04-21T18:30:00.000Z',
    children: [
      { id: 'ap1c1', name: 'Offer letter.pdf', status: 'Completed', dotClass: 'bg-teal-500', needsKaleSignature: false },
      { id: 'ap1c2', name: 'Mutual NDA.pdf', status: 'Completed', dotClass: 'bg-teal-500', needsKaleSignature: false },
      {
        id: 'ap1c3',
        name: 'Equity grant acknowledgment.pdf',
        status: 'Yet to sign',
        dotClass: 'bg-slate-400',
        needsKaleSignature: true,
      },
    ],
  },
  {
    id: 'ap2',
    name: 'Q2 IT access & security attestation',
    status: 'Yet to sign',
    dotClass: 'bg-slate-400',
    lastModified: '2026-04-21T08:45:00.000Z',
    children: [
      {
        id: 'ap2c1',
        name: 'SOC2 subprocessor acknowledgment.pdf',
        status: 'Yet to sign',
        dotClass: 'bg-slate-400',
        needsKaleSignature: true,
      },
      {
        id: 'ap2c2',
        name: 'Laptop return policy.pdf',
        status: 'Yet to sign',
        dotClass: 'bg-slate-400',
        needsKaleSignature: true,
      },
    ],
  },
];

const ACTION_REQUIRED_BADGE = ACTION_REQUIRED_PACKETS.reduce(
  (n, p) => n + p.children.filter((c) => c.needsKaleSignature).length,
  0
);

type ProfileFile = { id: string; name: string; lastModified: string; archived: boolean };
type ProfileSubfolder = { id: string; name: string; files: ProfileFile[] };
type ProfileRootFolder = {
  id: string;
  name: string;
  isDefault?: boolean;
  subfolders: ProfileSubfolder[];
  files: ProfileFile[];
};

const PROFILE_DOCS_TREE: ProfileRootFolder[] = [
  {
    id: 'folder-confidential',
    name: 'Confidential',
    isDefault: true,
    subfolders: [
      {
        id: 'folder-confidential/hr-audits',
        name: 'HR audit worksheets',
        files: [
          {
            id: 'pf-c1',
            name: '2025 I-9 reverification tracker.xlsx',
            lastModified: '2026-01-13T22:47:21.000Z',
            archived: false,
          },
          {
            id: 'pf-c2',
            name: 'Compensation band calibration — working.xlsx',
            lastModified: '2026-01-12T15:30:00.000Z',
            archived: false,
          },
        ],
      },
    ],
    files: [
      {
        id: 'pf-c3',
        name: 'Executive compensation policy — superseded.pdf',
        lastModified: '2026-01-10T09:00:00.000Z',
        archived: true,
      },
    ],
  },
  {
    id: 'folder-notice',
    name: 'Notice',
    isDefault: true,
    subfolders: [],
    files: [
      {
        id: 'pf-n1',
        name: 'COBRA qualifying event letter template.pdf',
        lastModified: '2026-01-08T11:20:00.000Z',
        archived: false,
      },
      {
        id: 'pf-n2',
        name: '2024 benefits premium change notice.pdf',
        lastModified: '2025-06-01T10:00:00.000Z',
        archived: true,
      },
    ],
  },
  {
    id: 'folder-ee-performance',
    name: 'EE Performance Record',
    subfolders: [
      {
        id: 'folder-ee-performance/2025',
        name: '2025 cycles',
        files: [
          {
            id: 'pf-e1',
            name: 'Self-review — Kale George.pdf',
            lastModified: '2026-01-14T18:00:00.000Z',
            archived: false,
          },
        ],
      },
    ],
    files: [],
  },
  {
    id: 'folder-company-policies',
    name: 'Company policies',
    subfolders: [
      {
        id: 'folder-company-policies/handbook',
        name: 'Handbook & codes of conduct',
        files: [
          {
            id: 'pf-h1',
            name: 'Anti-harassment acknowledgment — v3.pdf',
            lastModified: '2026-01-05T08:00:00.000Z',
            archived: false,
          },
          {
            id: 'pf-h2',
            name: 'Archived employee handbook 2023.pdf',
            lastModified: '2024-01-01T08:00:00.000Z',
            archived: true,
          },
        ],
      },
    ],
    files: [
      {
        id: 'pf-p1',
        name: 'Cryptography Policy.pdf',
        lastModified: '2026-01-13T22:47:21.000Z',
        archived: false,
      },
      {
        id: 'pf-p2',
        name: 'Office attendance & hybrid policy.pdf',
        lastModified: '2026-01-13T22:47:21.000Z',
        archived: false,
      },
    ],
  },
];

function countListedDocuments(tree: ProfileRootFolder[], includeArchived: boolean): number {
  let n = 0;
  for (const root of tree) {
    n += root.files.filter((f) => includeArchived || !f.archived).length;
    for (const sub of root.subfolders) {
      n += sub.files.filter((f) => includeArchived || !f.archived).length;
    }
  }
  return n;
}

const DOCUMENTS_TAB_TOTAL = countListedDocuments(PROFILE_DOCS_TREE, false);

type DocumentsListRow =
  | { id: string; kind: 'folder'; name: string; isDefault?: boolean; dateLabel: string; navPath: string[] }
  | { id: string; kind: 'file'; name: string; dateLabel: string; archived: boolean };

function formatProfileTs(iso: string): string {
  try {
    const s = new Date(iso).toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/Los_Angeles',
    });
    return `${s} PST`;
  } catch {
    return iso;
  }
}

function buildDocumentsListRows(
  tree: ProfileRootFolder[],
  navPath: string[],
  showArchive: boolean,
  search: string
): DocumentsListRow[] {
  const q = search.trim().toLowerCase();
  const match = (name: string) => !q || name.toLowerCase().includes(q);

  if (navPath.length === 0) {
    const rows: DocumentsListRow[] = tree.map((root) => {
      const dates: string[] = [
        ...root.files.map((f) => f.lastModified),
        ...root.subfolders.flatMap((s) => s.files.map((f) => f.lastModified)),
      ].sort();
      const latest = dates.length ? formatProfileTs(dates[dates.length - 1]) : '—';
      return {
        id: root.id,
        kind: 'folder',
        name: root.name,
        isDefault: root.isDefault,
        dateLabel: latest,
        navPath: [root.id],
      };
    });
    return rows.filter((r) => match(r.name));
  }

  const root = tree.find((t) => t.id === navPath[0]);
  if (!root) return [];

  if (navPath.length === 1) {
    const rows: DocumentsListRow[] = [];
    for (const sub of root.subfolders) {
      const dates = sub.files.map((f) => f.lastModified).sort();
      const latest = dates.length ? formatProfileTs(dates[dates.length - 1]) : '—';
      rows.push({
        id: sub.id,
        kind: 'folder',
        name: sub.name,
        dateLabel: latest,
        navPath: [root.id, sub.id],
      });
    }
    for (const f of root.files) {
      if (!showArchive && f.archived) continue;
      if (!match(f.name)) continue;
      rows.push({
        id: f.id,
        kind: 'file',
        name: f.name,
        dateLabel: formatProfileTs(f.lastModified),
        archived: f.archived,
      });
    }
    return rows.filter((r) => r.kind === 'file' || match(r.name));
  }

  const sub = root.subfolders.find((s) => s.id === navPath[1]);
  if (!sub) return [];
  const rows: DocumentsListRow[] = [];
  for (const f of sub.files) {
    if (!showArchive && f.archived) continue;
    if (!match(f.name)) continue;
    rows.push({
      id: f.id,
      kind: 'file',
      name: f.name,
      dateLabel: formatProfileTs(f.lastModified),
      archived: f.archived,
    });
  }
  return rows;
}

function breadcrumbForPath(navPath: string[]): { label: string; path: string[] }[] {
  const crumbs: { label: string; path: string[] }[] = [{ label: 'Documents', path: [] }];
  if (navPath.length >= 1) {
    const root = PROFILE_DOCS_TREE.find((t) => t.id === navPath[0]);
    if (root) crumbs.push({ label: root.name, path: [root.id] });
  }
  if (navPath.length >= 2) {
    const root = PROFILE_DOCS_TREE.find((t) => t.id === navPath[0]);
    const sub = root?.subfolders.find((s) => s.id === navPath[1]);
    if (sub) crumbs.push({ label: sub.name, path: [navPath[0], navPath[1]] });
  }
  return crumbs;
}

const ACCENT_SIGN = '#FDB71C';

export const EmployeeDocumentsSection: React.FC<DocumentsSectionProps> = ({
  onSend,
  onOpenEnvelope,
  onReviewDocument,
  viewByDocuments,
  setViewByDocuments,
}) => {
  const profileTab: ProfileDocTab = viewByDocuments ? 'documents' : 'action_required';
  const setProfileTab = useCallback(
    (t: ProfileDocTab) => {
      setViewByDocuments(t === 'documents');
    },
    [setViewByDocuments]
  );

  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [expandedPackets, setExpandedPackets] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [showArchive, setShowArchive] = useState(false);
  const [listSearch, setListSearch] = useState('');
  const [docNavPath, setDocNavPath] = useState<string[]>([]);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (profileTab === 'documents') {
      setDocNavPath([]);
    }
  }, [profileTab]);

  const visibleDocumentRows = useMemo(
    () => buildDocumentsListRows(PROFILE_DOCS_TREE, docNavPath, showArchive, listSearch),
    [docNavPath, showArchive, listSearch]
  );

  const docCrumbs = useMemo(() => breadcrumbForPath(docNavPath), [docNavPath]);

  const selectedCount = useMemo(
    () => visibleDocumentRows.reduce((n, r) => (selectedIds[r.id] ? n + 1 : n), 0),
    [visibleDocumentRows, selectedIds]
  );

  const allVisibleSelected =
    visibleDocumentRows.length > 0 && visibleDocumentRows.every((r) => selectedIds[r.id]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds({});
    } else {
      const next: Record<string, boolean> = {};
      visibleDocumentRows.forEach((r) => {
        next[r.id] = true;
      });
      setSelectedIds(next);
    }
  };

  return (
    <div className="pr-8 pb-8 pl-4 pt-0">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm min-h-[500px] overflow-hidden relative">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 gap-4 flex-wrap">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50/80 shrink-0">
            <button
              type="button"
              onClick={() => setProfileTab('action_required')}
              className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition-colors inline-flex items-center gap-2 ${
                profileTab === 'action_required'
                  ? 'bg-[#7A005D] text-white shadow-sm'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              Action required
              <span
                className={`min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  profileTab === 'action_required' ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
                }`}
              >
                {ACTION_REQUIRED_BADGE}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setProfileTab('documents')}
              className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition-colors inline-flex items-center gap-2 ${
                profileTab === 'documents'
                  ? 'bg-[#7A005D] text-white shadow-sm'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              Documents
              <span
                className={`text-[11px] font-bold tabular-nums ${
                  profileTab === 'documents' ? 'text-white/90' : 'text-slate-500'
                }`}
              >
                {DOCUMENTS_TAB_TOTAL}
              </span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-md text-[13px] font-bold hover:bg-slate-50 transition-colors"
            >
              Edit folder
            </button>

            <div className="relative" ref={addMenuRef}>
              <button
                type="button"
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                className="px-4 py-1.5 bg-[#7A005D] text-white rounded-md text-[13px] font-bold hover:opacity-90 transition-opacity flex items-center space-x-2 shadow-sm"
              >
                <span>Add document</span>
                <ChevronDown size={14} />
              </button>

              {isAddMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-3 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      onSend?.();
                      setIsAddMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-4 px-5 py-3 text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <Send size={20} className="text-slate-800" />
                    <span className="text-[15px] font-medium">Send document</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddMenuOpen(false)}
                    className="w-full flex items-center space-x-4 px-5 py-3 text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <Upload size={20} className="text-slate-800" />
                    <span className="text-[15px] font-medium">Upload document</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-1 pl-2 border-l border-slate-100">
              <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600">
                <Settings2 size={18} />
              </button>
              <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600">
                <Columns size={18} />
              </button>
              <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600">
                <Maximize2 size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white border-b border-slate-100">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4 flex-1 min-w-0">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Search"
                className="w-full border border-slate-200 rounded-md py-1.5 pl-9 pr-4 text-[12px] focus:ring-1 focus:ring-slate-300 outline-none bg-slate-50/30"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {profileTab === 'documents' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowArchive((v) => !v)}
                    className={`w-9 h-5 rounded-full relative transition-colors border shadow-inner shrink-0 ${
                      showArchive ? 'bg-[#7A005D] border-[#7A005D]' : 'bg-slate-300 border-slate-400/20'
                    }`}
                    aria-pressed={showArchive}
                    aria-label="Show archive"
                  >
                    <span
                      className={`absolute top-[1px] w-4 h-4 bg-white rounded-full shadow border border-slate-200 transition-all ${
                        showArchive ? 'left-[18px]' : 'left-[2px]'
                      }`}
                    />
                  </button>
                  <span className="text-[12px] text-slate-900 font-bold whitespace-nowrap">Show archive</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="flex items-center space-x-2 text-[12px] font-bold text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-md border border-transparent hover:border-slate-200 shrink-0"
          >
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>

        <div className="overflow-x-auto pb-24">
          {profileTab === 'documents' && (
            <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center gap-2 text-[13px]">
              {docCrumbs.map((c, i) => {
                const isLast = i === docCrumbs.length - 1;
                return (
                  <React.Fragment key={`${c.path.join('/')}-${i}`}>
                    {i > 0 && <span className="text-slate-300 font-medium px-0.5">›</span>}
                    {isLast ? (
                      <span className="font-bold text-slate-900">{c.label}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDocNavPath(c.path)}
                        className="font-bold text-[#2563eb] hover:underline bg-transparent border-none p-0 cursor-pointer"
                      >
                        {c.label}
                      </button>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
          {profileTab === 'action_required' ? (
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-[13px] text-slate-600 font-semibold">
                  <th className="px-6 py-3 border-r border-slate-200">
                    <div className="flex items-center justify-between cursor-pointer hover:text-slate-800">
                      <span>Name</span>
                      <ChevronDown size={14} className="text-slate-300" />
                    </div>
                  </th>
                  <th className="px-4 py-3 border-r border-slate-200 w-[140px]">
                    <div className="flex items-center justify-between cursor-pointer hover:text-slate-800">
                      <span>Status</span>
                      <ChevronDown size={14} className="text-slate-300" />
                    </div>
                  </th>
                  <th className="px-4 py-3 border-r border-slate-200">
                    <div className="flex items-center justify-between cursor-pointer hover:text-slate-800">
                      <span>Last modified</span>
                      <ChevronDown size={14} className="text-slate-300" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-slate-700">
                {ACTION_REQUIRED_PACKETS.map((packet) => {
                  const pending = packet.children.filter((c) => c.needsKaleSignature);
                  if (pending.length === 0) return null;
                  const open = expandedPackets[packet.id] ?? true;
                  return (
                    <React.Fragment key={packet.id}>
                      <tr className="border-b border-slate-100 bg-white hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedPackets((p) => ({
                                  ...p,
                                  [packet.id]: !(p[packet.id] ?? true),
                                }))
                              }
                              className="p-0.5 text-slate-400 hover:text-slate-700 rounded shrink-0"
                              aria-expanded={open}
                              aria-label={open ? 'Collapse' : 'Expand'}
                            >
                              {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                            <Mail size={18} className="text-slate-500 shrink-0" strokeWidth={2} />
                            <button
                              type="button"
                              onClick={() => onOpenEnvelope?.(packet.name)}
                              className="font-bold truncate max-w-[min(280px,100%)] min-w-0 text-left bg-transparent border-none p-0 cursor-pointer hover:underline"
                              style={{ color: PRIMARY_PURPLE }}
                            >
                              {packet.name}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${packet.dotClass}`} />
                            <span className="font-semibold capitalize text-slate-800">{packet.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-500 font-medium tabular-nums align-middle">
                          {formatProfileTs(packet.lastModified)}
                        </td>
                        <td className="px-4 py-4 align-middle text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2 flex-nowrap">
                            <button
                              type="button"
                              onClick={() => onOpenEnvelope?.(packet.name)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-900 bg-white hover:bg-slate-50"
                            >
                              <Eye size={14} />
                              View envelope
                            </button>
                            <button
                              type="button"
                              onClick={() => onReviewDocument?.()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-slate-900"
                              style={{ backgroundColor: ACCENT_SIGN }}
                            >
                              <PenLine size={14} />
                              Sign
                            </button>
                            <button
                              type="button"
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                              aria-label="More"
                            >
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {open &&
                        pending.map((child) => (
                          <tr key={child.id} className="border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50/90">
                            <td className="px-6 py-4 pl-14 align-middle">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText size={16} className="text-slate-400 shrink-0" />
                                <span className="font-bold text-slate-900 truncate">{child.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-middle">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${child.dotClass}`} />
                                <span className="font-semibold text-slate-800">{child.status}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-slate-500 font-medium tabular-nums align-middle">
                              {formatProfileTs(packet.lastModified)}
                            </td>
                            <td className="px-4 py-4 align-middle text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  className="p-2 text-slate-700 hover:bg-white rounded-lg border border-transparent hover:border-slate-200"
                                  aria-label="View"
                                >
                                  <Eye size={18} />
                                </button>
                                <button
                                  type="button"
                                  className="p-2 text-slate-700 hover:bg-white rounded-lg border border-transparent hover:border-slate-200"
                                  aria-label="Download"
                                >
                                  <Download size={18} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onReviewDocument?.()}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-slate-900"
                                  style={{ backgroundColor: ACCENT_SIGN }}
                                >
                                  <PenLine size={14} />
                                  Sign
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-[13px] text-slate-600 font-semibold">
                  <th className="px-6 py-3 w-12 border-r border-slate-200">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      className="w-4 h-4 rounded border-slate-300 text-purple-900 focus:ring-purple-200"
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-4 py-3 border-r border-slate-200">
                    <div className="flex items-center justify-between cursor-pointer hover:text-slate-800">
                      <span>Name</span>
                      <ChevronDown size={14} className="text-slate-300" />
                    </div>
                  </th>
                  <th className="px-4 py-3 border-r border-slate-200">
                    <div className="flex items-center justify-between cursor-pointer hover:text-slate-800">
                      <span>Last modified</span>
                      <ChevronDown size={14} className="text-slate-300" />
                    </div>
                  </th>
                  <th className="px-4 py-3 w-14" />
                </tr>
              </thead>
              <tbody className="text-[13px] text-slate-700">
                {visibleDocumentRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <input
                        type="checkbox"
                        checked={!!selectedIds[row.id]}
                        onChange={() => toggleSelect(row.id)}
                        className="w-4 h-4 rounded border-slate-300 text-purple-900 focus:ring-purple-200"
                        aria-label={`Select ${row.name}`}
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {row.kind === 'folder' ? (
                          <Folder size={18} className="text-slate-400 fill-slate-50 shrink-0" />
                        ) : (
                          <FileText size={18} className="text-slate-400 shrink-0" />
                        )}
                        <button
                          type="button"
                          className="text-[#2563eb] font-bold cursor-pointer hover:underline truncate text-left bg-transparent border-none p-0"
                          onClick={() => {
                            if (row.kind === 'folder') {
                              setDocNavPath(row.navPath);
                            } else {
                              onReviewDocument?.();
                            }
                          }}
                        >
                          {row.name}
                        </button>
                        {row.kind === 'folder' && row.isDefault && (
                          <span className="text-[10px] font-black text-slate-800 bg-slate-100 px-1 py-0.5 rounded leading-none uppercase shrink-0">
                            Default
                          </span>
                        )}
                        {row.kind === 'file' && row.archived && (
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                            Archived
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-medium tabular-nums">{row.dateLabel}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        className="p-1 hover:bg-slate-200 rounded text-slate-400 transition-colors"
                        aria-label="Row actions"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {profileTab === 'documents' && visibleDocumentRows.length === 0 && (
            <div className="py-20 text-center">
              <FileText size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium text-[14px]">No documents found.</p>
            </div>
          )}
        </div>

        {profileTab === 'documents' && selectedCount >= 2 && (
          <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4">
            <div
              className="pointer-events-auto flex items-center gap-1 rounded-full shadow-lg border border-white/10 px-4 py-2.5 text-white"
              style={{ backgroundColor: PRIMARY_PURPLE }}
            >
              <span className="text-[13px] font-bold tabular-nums pr-3 mr-1 border-r border-white/25 shrink-0">
                {selectedCount}/{DOCUMENTS_TAB_TOTAL} selected
              </span>
              <div className="flex items-center gap-0.5">
                {(
                  [
                    { Icon: Share2, label: 'Share' },
                    { Icon: ArrowRightLeft, label: 'Move' },
                    { Icon: Download, label: 'Download' },
                    { Icon: Lock, label: 'Set as confidential' },
                    { Icon: Archive, label: 'Archive' },
                    { Icon: Trash2, label: 'Remove' },
                  ] as const
                ).map(({ Icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    title={label}
                    aria-label={label}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Icon size={18} strokeWidth={2} className="text-white" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
