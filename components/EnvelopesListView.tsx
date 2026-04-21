import React, { useMemo, useState } from 'react';
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
  FileText,
  Eye,
  PenLine,
  Download,
} from 'lucide-react';
import { PRIMARY_PURPLE } from '../constants';

export type EnvelopeStatus =
  | 'draft'
  | 'yet to sign'
  | 'in progress'
  | 'correcting'
  | 'completed'
  | 'voided';

export interface EnvelopeTableRow {
  id: string;
  name: string;
  status: EnvelopeStatus;
  /** ISO timestamp for sorting */
  lastModified: string;
  archived: boolean;
  children?: EnvelopeTableRow[];
}

const MOCK_ENVELOPES: EnvelopeTableRow[] = [
  {
    id: 'p1',
    name: 'Employee onboarding packet',
    status: 'in progress',
    lastModified: '2026-04-21T18:30:00.000Z',
    archived: false,
    children: [
      { id: 'c1', name: 'Offer letter', status: 'completed', lastModified: '2026-04-20T10:00:00.000Z', archived: false },
      { id: 'c2', name: 'NDA', status: 'yet to sign', lastModified: '2026-04-21T17:00:00.000Z', archived: false },
      { id: 'c3', name: 'I-9', status: 'draft', lastModified: '2026-04-19T09:15:00.000Z', archived: false },
    ],
  },
  {
    id: 'p2',
    name: 'Finance compliance bundle Q1',
    status: 'correcting',
    lastModified: '2026-04-20T22:10:00.000Z',
    archived: false,
    children: [
      { id: 'c4', name: 'SOX attestation', status: 'correcting', lastModified: '2026-04-20T22:10:00.000Z', archived: false },
    ],
  },
  {
    id: 'p3',
    name: 'Untitled packet',
    status: 'draft',
    lastModified: '2026-04-18T12:00:00.000Z',
    archived: false,
  },
  {
    id: 'p4',
    name: 'Testing Adelaide handoff',
    status: 'yet to sign',
    lastModified: '2026-04-21T08:45:00.000Z',
    archived: false,
  },
  {
    id: 'p5',
    name: 'Archived — Old vendor packet',
    status: 'voided',
    lastModified: '2025-11-01T15:00:00.000Z',
    archived: true,
  },
  {
    id: 'p6',
    name: 'Completed policy rollout',
    status: 'completed',
    lastModified: '2026-03-10T11:20:00.000Z',
    archived: true,
  },
];

type SortKey = 'name' | 'status' | 'lastModified';
type SortDir = 'asc' | 'desc';

function statusDotClass(status: EnvelopeStatus): string {
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

function statusLabel(status: EnvelopeStatus): string {
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

interface EnvelopesListViewProps {
  onSendEnvelope?: () => void;
}

const EnvelopesListView: React.FC<EnvelopesListViewProps> = ({ onSendEnvelope }) => {
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('lastModified');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ p1: true });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'lastModified' ? 'desc' : 'asc');
    }
  };

  const filteredRoots = useMemo(() => {
    let rows = MOCK_ENVELOPES.filter((r) => showArchived || !r.archived);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => {
        const self = r.name.toLowerCase().includes(q);
        const childMatch = r.children?.some((c) => c.name.toLowerCase().includes(q));
        return self || childMatch;
      });
    }
    return [...rows].sort((a, b) => compareRows(a, b, sortKey, sortDir));
  }, [search, showArchived, sortKey, sortDir]);

  const visibleCount = useMemo(() => MOCK_ENVELOPES.filter((r) => showArchived || !r.archived).length, [showArchived]);

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

  const renderActions = (row: EnvelopeTableRow, isChild: boolean) => {
    const canSign = row.status === 'yet to sign';
    const signMuted = row.status === 'correcting' || row.status === 'voided' || row.status === 'completed';
    return (
      <div className="flex items-center justify-end gap-2 flex-wrap">
        <button
          type="button"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-700 bg-white hover:bg-slate-50"
        >
          <Eye size={14} />
          View
        </button>
        <button
          type="button"
          disabled={signMuted}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-bold text-white ${
            signMuted ? 'bg-amber-200 text-amber-800/80 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'
          }`}
        >
          <PenLine size={14} />
          Sign
        </button>
        {!isChild && (
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-700 bg-white hover:bg-slate-50"
          >
            <PenLine size={14} />
            Edit
          </button>
        )}
        <button type="button" className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
          <Download size={16} />
        </button>
        <button type="button" className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
          <MoreVertical size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 flex flex-col gap-4 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-bold text-slate-900">Envelopes</h2>
          <span className="text-slate-400 font-medium text-[15px]">· {visibleCount}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-1.5 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 hover:bg-slate-50"
          >
            <Bell size={14} />
            Send reminder
          </button>
          <button
            type="button"
            onClick={onSendEnvelope}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-bold text-white hover:opacity-95 shadow-sm"
            style={{ backgroundColor: PRIMARY_PURPLE }}
          >
            Send envelope
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
              className="w-full border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-[#7A005D]/20"
            />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className={`w-11 h-6 rounded-full relative transition-colors border shadow-inner ${
                showArchived ? 'bg-[#7A005D] border-[#7A005D]' : 'bg-slate-300 border-slate-400/20'
              }`}
              aria-pressed={showArchived}
              aria-label="Show archived envelopes"
            >
              <span
                className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow border border-slate-200 transition-all ${
                  showArchived ? 'left-[22px]' : 'left-[2px]'
                }`}
              />
            </button>
            <span className="text-[13px] text-slate-900 font-bold whitespace-nowrap">Show archived</span>
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
        <table className="w-full text-left border-collapse min-w-[880px]">
          <thead>
            <tr className="border-b border-slate-200 bg-white">
              <th className="px-6 py-3 w-[40%]">
                <SortHeader label="Name" colKey="name" />
              </th>
              <th className="px-4 py-3 w-[22%]">
                <SortHeader label="Status" colKey="status" />
              </th>
              <th className="px-4 py-3 w-[22%]">
                <SortHeader label="Last modified" colKey="lastModified" />
              </th>
              <th className="px-6 py-3 w-[16%] text-right">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="text-[13px] text-slate-800">
            {filteredRoots.map((row) => (
              <React.Fragment key={row.id}>
                <tr className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {row.children && row.children.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setExpanded((e) => ({ ...e, [row.id]: !e[row.id] }))}
                          className="p-0.5 text-slate-400 hover:text-slate-700 rounded shrink-0"
                          aria-expanded={!!expanded[row.id]}
                        >
                          {expanded[row.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                      ) : (
                        <span className="w-5 shrink-0" />
                      )}
                      <FileText size={18} className="text-slate-400 shrink-0" />
                      <span className="font-bold truncate" style={{ color: PRIMARY_PURPLE }}>
                        {row.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotClass(row.status)}`} />
                      <span className="font-semibold capitalize">{statusLabel(row.status)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 font-medium tabular-nums">
                    {formatLastModified(row.lastModified)}
                  </td>
                  <td className="px-6 py-3.5">{renderActions(row, false)}</td>
                </tr>
                {row.children &&
                  expanded[row.id] &&
                  row.children
                    .filter((c) => showArchived || !c.archived)
                    .map((child) => (
                      <tr key={child.id} className="border-b border-slate-100 bg-slate-50/40 hover:bg-slate-50/80">
                        <td className="px-6 py-2.5 pl-14">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={16} className="text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-700 truncate">{child.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotClass(child.status)}`} />
                            <span className="font-semibold capitalize text-[12px]">{statusLabel(child.status)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 font-medium text-[12px] tabular-nums">
                          {formatLastModified(child.lastModified)}
                        </td>
                        <td className="px-6 py-2.5">{renderActions(child, true)}</td>
                      </tr>
                    ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {filteredRoots.length === 0 && (
          <div className="py-20 text-center text-slate-500 text-sm font-medium">No envelopes match your filters.</div>
        )}
      </div>
    </div>
  );
};

export default EnvelopesListView;
