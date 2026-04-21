
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronRight,
  History,
  Search,
  MoreVertical,
  ChevronDown,
  ChevronUp,
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
} from 'lucide-react';
import { Employee } from '../types';
import { PRIMARY_PURPLE, PROFILE_DOCUMENT_FOLDER_LOCATIONS } from '../constants';

interface EmployeeProfileProps {
  employee: Employee;
}

export const EmployeeHeaderSection: React.FC<EmployeeProfileProps> = ({ employee }) => {
  return (
    <div className="pt-4 px-8 pb-4">
      <nav className="flex items-center space-x-2 text-[12px] text-slate-500 mb-4">
        <span className="hover:text-slate-700 cursor-pointer">Feeds</span>
        <ChevronRight size={14} className="text-slate-300" />
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

const ACTION_REQUIRED_BADGE = 4;
const DOCUMENTS_TAB_TOTAL = 8;

interface ActionChildRow {
  id: string;
  name: string;
  status: string;
  dotClass: string;
  showSign?: boolean;
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
    name: 'Employee onboarding packet',
    status: 'In progress',
    dotClass: 'bg-amber-500',
    lastModified: '01/13/25 14:47:21 PST',
    children: [
      { id: 'ap1c1', name: 'Offer letter', status: 'Not started', dotClass: 'bg-slate-400' },
      { id: 'ap1c2', name: 'Cryptography Policy', status: 'Not started', dotClass: 'bg-slate-400', showSign: true },
      { id: 'ap1c3', name: 'Office Policy', status: 'In progress', dotClass: 'bg-amber-500', showSign: true },
      {
        id: 'ap1c4',
        name: 'Sales commission - OPTIONAL APPENDIXES',
        status: 'In progress',
        dotClass: 'bg-amber-500',
        showSign: true,
      },
      { id: 'ap1c5', name: 'SOC2-GAP-REPORT', status: 'Not started', dotClass: 'bg-slate-400', showSign: true },
    ],
  },
];

type DocumentsTabRow =
  | {
      id: string;
      kind: 'folder';
      name: string;
      isDefault: boolean;
      folderId: string;
      lastModified: string;
      archived?: boolean;
    }
  | {
      id: string;
      kind: 'file';
      name: string;
      folderId: string;
      lastModified: string;
      archived?: boolean;
    };

const COMPLETED_FILE_ROWS: Array<{ id: string; name: string; folderId: string }> = [
  { id: 'ff-crypto', name: 'Cryptography Policy', folderId: 'folder-company-policies' },
  { id: 'ff-office', name: 'Office Policy', folderId: 'folder-company-policies' },
  { id: 'ff-sales', name: 'Sales commission - OPTIONAL APPENDIXES', folderId: 'folder-company-policies' },
  { id: 'ff-soc2', name: 'SOC2-GAP-REPORT', folderId: 'folder-company-policies' },
];

function buildDocumentsTabRows(): DocumentsTabRow[] {
  const folders: DocumentsTabRow[] = PROFILE_DOCUMENT_FOLDER_LOCATIONS.map((f) => ({
    id: `row-folder-${f.id}`,
    kind: 'folder',
    name: f.name,
    isDefault: f.isDefault,
    folderId: f.id,
    lastModified: '01/13/25 14:47:21 PST',
  }));
  const files: DocumentsTabRow[] = COMPLETED_FILE_ROWS.map((r) => ({
    id: r.id,
    kind: 'file',
    name: r.name,
    folderId: r.folderId,
    lastModified: '01/13/25 14:47:21 PST',
  }));
  return [...folders, ...files];
}

const DOCUMENTS_TAB_ROWS = buildDocumentsTabRows();

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

  const visibleDocumentRows = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    return DOCUMENTS_TAB_ROWS.filter((row) => {
      if (!showArchive && row.archived) return false;
      if (!q) return true;
      return row.name.toLowerCase().includes(q);
    });
  }, [listSearch, showArchive]);

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
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <h2 className="text-[16px] font-bold text-slate-900">Documents</h2>
            <span className="text-slate-400 font-medium text-sm">
              · {profileTab === 'action_required' ? ACTION_REQUIRED_BADGE : DOCUMENTS_TAB_TOTAL}
            </span>
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
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50/80">
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

              {profileTab === 'documents' && (
                <div className="flex items-center gap-2 pl-1">
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
                  const open = expandedPackets[packet.id] ?? true;
                  return (
                    <React.Fragment key={packet.id}>
                      <tr className="border-b border-slate-100 bg-white hover:bg-slate-50/50">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedPackets((p) => ({
                                  ...p,
                                  [packet.id]: !(p[packet.id] ?? true),
                                }))
                              }
                              className="p-0.5 text-slate-500 hover:bg-slate-100 rounded"
                              aria-expanded={open}
                              aria-label={open ? 'Collapse' : 'Expand'}
                            >
                              {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <FileText size={18} className="text-slate-400 shrink-0" />
                            <span className="font-bold text-slate-900 truncate">{packet.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${packet.dotClass}`} />
                            <span className="font-bold text-slate-800">{packet.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 font-medium tabular-nums">
                          {packet.lastModified}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-2 flex-nowrap">
                            <button
                              type="button"
                              onClick={() => onOpenEnvelope?.('{Envelope Name}')}
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
                        packet.children.map((child) => (
                          <tr key={child.id} className="border-b border-slate-100 bg-slate-50/40 hover:bg-slate-50/80">
                            <td className="px-6 py-3 pl-14">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText size={18} className="text-slate-400 shrink-0" />
                                <span className="font-semibold text-slate-900 truncate">{child.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${child.dotClass}`} />
                                <span className="font-bold text-slate-800">{child.status}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-500 font-medium tabular-nums">
                              {packet.lastModified}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  className="p-2 text-slate-500 hover:bg-white rounded-lg"
                                  aria-label="View"
                                >
                                  <Eye size={18} />
                                </button>
                                <button
                                  type="button"
                                  className="p-2 text-slate-500 hover:bg-white rounded-lg"
                                  aria-label="Download"
                                >
                                  <Download size={18} />
                                </button>
                                {child.showSign ? (
                                  <button
                                    type="button"
                                    onClick={() => onReviewDocument?.()}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-slate-900"
                                    style={{ backgroundColor: ACCENT_SIGN }}
                                  >
                                    <PenLine size={14} />
                                    Sign
                                  </button>
                                ) : null}
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
                        <span
                          className="text-[#2563eb] font-bold cursor-pointer hover:underline truncate"
                          onClick={() => {
                            if (row.kind === 'file' && row.name === 'Cryptography Policy') {
                              onReviewDocument?.();
                            }
                          }}
                        >
                          {row.name}
                        </span>
                        {row.kind === 'folder' && row.isDefault && (
                          <span className="text-[10px] font-black text-slate-800 bg-slate-100 px-1 py-0.5 rounded leading-none uppercase shrink-0">
                            Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-medium tabular-nums">{row.lastModified}</td>
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
