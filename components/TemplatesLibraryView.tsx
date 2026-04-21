import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, ChevronRight, Folder, Plus, FileText } from 'lucide-react';
import { PRIMARY_PURPLE } from '../constants';

export interface TemplateLibraryRow {
  id: string;
  name: string;
  tplCode: string;
  type: 'Multi-recipient template' | 'Single-recipient template';
  tags: string[];
  entity: string;
  country: string;
  /** Drives sidebar selection; matches folder node id (including nested ids like tax/w2). */
  libraryPath: string;
}

export type FolderTreeNode = {
  id: string;
  label: string;
  children?: FolderTreeNode[];
};

export const TEMPLATE_FOLDER_TREE: FolderTreeNode[] = [
  { id: 'all', label: 'All Document Templates' },
  {
    id: 'tax',
    label: 'Tax Withholding Documents',
    children: [
      { id: 'tax/w2', label: 'W-2 & withholding packets' },
      { id: 'tax/1099', label: '1099 & contractor tax' },
    ],
  },
  {
    id: 'offer',
    label: 'Offer Letter Templates',
    children: [{ id: 'offer/executive', label: 'Executive & sales offers' }],
  },
  /** No subfolders — chevron hidden, spacing preserved */
  { id: 'termination', label: 'Termination Templates' },
  {
    id: 'other',
    label: 'Other Agreement Templates',
    children: [
      { id: 'other/msa', label: 'MSA & SOW library' },
      { id: 'other/nda', label: 'NDA variants' },
    ],
  },
  {
    id: 'onboarding',
    label: 'Onboarding Packets',
    children: [
      { id: 'onboarding/us', label: 'US new hire packet' },
      { id: 'onboarding/remote', label: 'Remote & distributed hires' },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance & Legal',
    children: [{ id: 'compliance/policies', label: 'Policy acknowledgments' }],
  },
];

const MOCK_TEMPLATES: TemplateLibraryRow[] = [
  { id: '1', name: 'Employment Agreement – Standard', tplCode: 'TPL-001', type: 'Multi-recipient template', tags: ['Onboarding', 'Legal'], entity: 'All', country: 'US', libraryPath: 'compliance/policies' },
  { id: '2', name: 'W4 Tax Form 2026', tplCode: 'TPL-002', type: 'Single-recipient template', tags: ['Tax', 'Onboarding'], entity: 'Finance', country: 'US', libraryPath: 'tax/w2' },
  { id: '3', name: 'Health Insurance Enrollment Form', tplCode: 'TPL-003', type: 'Single-recipient template', tags: ['Insurance', 'Onboarding'], entity: 'All', country: 'US', libraryPath: 'onboarding/us' },
  { id: '4', name: 'Mutual Non-Disclosure Agreement', tplCode: 'TPL-004', type: 'Multi-recipient template', tags: ['Legal', 'Recruiting'], entity: 'Engineering', country: 'All', libraryPath: 'other/nda' },
  { id: '5', name: 'Offer Letter – Full Time', tplCode: 'TPL-005', type: 'Single-recipient template', tags: ['Recruiting', 'Onboarding'], entity: 'All', country: 'US', libraryPath: 'offer/executive' },
  { id: '6', name: 'Separation Agreement', tplCode: 'TPL-006', type: 'Multi-recipient template', tags: ['Offboarding', 'Legal'], entity: 'All', country: 'US', libraryPath: 'termination' },
  { id: '7', name: 'Remote Work Policy Acknowledgment', tplCode: 'TPL-007', type: 'Single-recipient template', tags: ['Policy', 'Legal'], entity: 'All', country: 'All', libraryPath: 'onboarding/remote' },
  { id: '8', name: 'Contractor Services Agreement', tplCode: 'TPL-008', type: 'Multi-recipient template', tags: ['Legal'], entity: 'Finance', country: 'US', libraryPath: 'other/msa' },
  { id: '9', name: 'I-9 Employment Eligibility', tplCode: 'TPL-009', type: 'Single-recipient template', tags: ['Onboarding', 'Compliance'], entity: 'All', country: 'US', libraryPath: 'onboarding/us' },
  { id: '10', name: 'Employee Handbook Acknowledgment', tplCode: 'TPL-010', type: 'Single-recipient template', tags: ['Policy'], entity: 'All', country: 'All', libraryPath: 'compliance/policies' },
  { id: '11', name: 'Bonus Plan Election', tplCode: 'TPL-011', type: 'Single-recipient template', tags: ['Finance'], entity: 'Finance', country: 'US', libraryPath: 'offer/executive' },
  { id: '12', name: 'Internship Agreement', tplCode: 'TPL-012', type: 'Multi-recipient template', tags: ['Recruiting', 'Legal'], entity: 'All', country: 'US', libraryPath: 'offer/executive' },
  { id: '13', name: 'COBRA Notice Packet', tplCode: 'TPL-013', type: 'Single-recipient template', tags: ['Insurance', 'Offboarding'], entity: 'All', country: 'US', libraryPath: 'termination' },
  { id: '14', name: 'Stock Option Grant Notice', tplCode: 'TPL-014', type: 'Multi-recipient template', tags: ['Finance', 'Legal'], entity: 'Engineering', country: 'US', libraryPath: 'offer/executive' },
  { id: '15', name: 'Data Processing Addendum', tplCode: 'TPL-015', type: 'Multi-recipient template', tags: ['Legal', 'Compliance'], entity: 'All', country: 'All', libraryPath: 'compliance/policies' },
  { id: '16', name: 'Timesheet Policy – Hourly', tplCode: 'TPL-016', type: 'Single-recipient template', tags: ['Policy'], entity: 'All', country: 'US', libraryPath: 'compliance/policies' },
  { id: '17', name: 'Relocation Benefits Summary', tplCode: 'TPL-017', type: 'Single-recipient template', tags: ['Recruiting', 'Finance'], entity: 'Finance', country: 'US', libraryPath: 'offer/executive' },
  { id: '18', name: 'Safety Training Certificate', tplCode: 'TPL-018', type: 'Single-recipient template', tags: ['Onboarding', 'Compliance'], entity: 'All', country: 'US', libraryPath: 'onboarding/us' },
  { id: '19', name: 'State tax supplemental packet', tplCode: 'TPL-019', type: 'Single-recipient template', tags: ['Tax'], entity: 'All', country: 'US', libraryPath: 'tax/w2' },
  { id: '20', name: 'Contractor 1099 checklist', tplCode: 'TPL-020', type: 'Single-recipient template', tags: ['Tax'], entity: 'Finance', country: 'US', libraryPath: 'tax/1099' },
];

function findNodeLabel(nodes: FolderTreeNode[], id: string): string | undefined {
  for (const n of nodes) {
    if (n.id === id) return n.label;
    if (n.children) {
      const hit = findNodeLabel(n.children, id);
      if (hit) return hit;
    }
  }
  return undefined;
}

function matchesLibraryPath(row: TemplateLibraryRow, activeId: string): boolean {
  if (activeId === 'all') return true;
  return row.libraryPath === activeId || row.libraryPath.startsWith(`${activeId}/`);
}

interface TemplatesLibraryViewProps {
  onNewTemplate?: () => void;
  onCreateFolder?: () => void;
}

const ChevronSpacer = () => <span className="w-[14px] h-[14px] shrink-0 inline-block" aria-hidden />;

const TemplatesLibraryView: React.FC<TemplatesLibraryViewProps> = ({ onNewTemplate, onCreateFolder }) => {
  const [activeFolderId, setActiveFolderId] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    tax: true,
    offer: true,
    other: true,
    onboarding: true,
    compliance: true,
  });
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const newMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!newMenuOpen) return;
    const down = (e: MouseEvent) => {
      if (newMenuRef.current?.contains(e.target as Node)) return;
      setNewMenuOpen(false);
    };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, [newMenuOpen]);

  const filtered = useMemo(() => {
    let rows = MOCK_TEMPLATES.filter((r) => matchesLibraryPath(r, activeFolderId));
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.tplCode.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return rows;
  }, [activeFolderId, search]);

  const activeFolderLabel = findNodeLabel(TEMPLATE_FOLDER_TREE, activeFolderId) ?? 'All Document Templates';

  const renderFolderRows = (nodes: FolderTreeNode[], depth: number) => {
    return nodes.flatMap((node) => {
      const hasKids = !!(node.children && node.children.length > 0);
      const isOpen = expanded[node.id] ?? false;
      const active = activeFolderId === node.id;
      const row = (
        <div key={node.id}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveFolderId(node.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveFolderId(node.id);
              }
            }}
            className={`w-full flex items-center gap-2 py-2.5 text-left text-[13px] transition-colors cursor-pointer ${
              active
                ? 'bg-[#e8f2ff] text-[#2563eb] font-semibold border-l-[3px] border-[#2563eb]'
                : 'text-slate-600 hover:bg-white/80 border-l-[3px] border-transparent'
            }`}
            style={{ paddingLeft: `${12 + depth * 14}px`, paddingRight: '12px' }}
          >
            {hasKids ? (
              <button
                type="button"
                className={`p-0.5 rounded shrink-0 ${active ? 'text-[#2563eb]' : 'text-slate-400'}`}
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
            <Folder size={16} className={`shrink-0 ${active ? 'text-[#2563eb]' : 'text-slate-400'}`} />
            <span className="truncate flex-1 min-w-0">{node.label}</span>
          </div>
          {hasKids && isOpen ? renderFolderRows(node.children!, depth + 1) : null}
        </div>
      );
      return [row];
    });
  };

  return (
    <div className="flex min-h-[560px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-[#fafafa] flex flex-col">
        <div className="p-4 border-b border-slate-200/80 relative" ref={newMenuRef}>
          <button
            type="button"
            onClick={() => setNewMenuOpen((v) => !v)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white shadow-sm hover:opacity-95 transition-opacity"
            style={{ backgroundColor: PRIMARY_PURPLE }}
          >
            <Plus size={18} strokeWidth={2.5} />
            New
            <ChevronDown size={14} className={`opacity-90 transition-transform ${newMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {newMenuOpen && (
            <div className="absolute left-4 right-4 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 overflow-hidden">
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-slate-800 hover:bg-slate-50"
                onClick={() => {
                  setNewMenuOpen(false);
                  onCreateFolder?.();
                }}
              >
                Create a folder
              </button>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-slate-800 hover:bg-slate-50"
                onClick={() => {
                  setNewMenuOpen(false);
                  onNewTemplate?.();
                }}
              >
                Create a template
              </button>
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto py-2">{renderFolderRows(TEMPLATE_FOLDER_TREE, 0)}</nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="px-8 pt-8 pb-4 flex items-start justify-between gap-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{activeFolderLabel}</h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">{filtered.length} templates</p>
          </div>
          <div className="relative w-72 max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full border border-slate-200 rounded-lg py-2 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#7A005D]/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="text-[11px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 bg-white">
                <th className="px-8 py-3">Template</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Tag</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-8 py-3">Country</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-9 h-9 rounded-lg bg-[#FDF2FB] border border-[#F5D0EE] flex items-center justify-center shrink-0">
                        <FileText size={18} className="text-[#7A005D]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 leading-snug">{row.name}</p>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{row.tplCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-700 font-medium align-top">{row.type}</td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {row.tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-700 font-medium align-top">{row.entity}</td>
                  <td className="px-8 py-4 text-slate-700 font-medium align-top">{row.country}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-24 text-center text-slate-500 text-sm font-medium">No templates match your filters.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplatesLibraryView;
