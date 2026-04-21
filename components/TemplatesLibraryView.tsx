import React, { useMemo, useState } from 'react';
import { Search, ChevronDown, Folder, Plus, FileText } from 'lucide-react';
import { PRIMARY_PURPLE } from '../constants';

export interface TemplateLibraryRow {
  id: string;
  name: string;
  tplCode: string;
  type: 'Multi-recipient template' | 'Single-recipient template';
  tags: string[];
  entity: string;
  country: string;
  folderId: string;
}

const FOLDERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All Document Templates' },
  { id: 'tax', label: 'Tax Withholding Documents' },
  { id: 'offer', label: 'Offer Letter Templates' },
  { id: 'termination', label: 'Termination Templates' },
  { id: 'other', label: 'Other Agreement Templates' },
  { id: 'onboarding', label: 'Onboarding Packets' },
  { id: 'compliance', label: 'Compliance & Legal' },
];

const MOCK_TEMPLATES: TemplateLibraryRow[] = [
  { id: '1', name: 'Employment Agreement – Standard', tplCode: 'TPL-001', type: 'Multi-recipient template', tags: ['Onboarding', 'Legal'], entity: 'All', country: 'US', folderId: 'compliance' },
  { id: '2', name: 'W4 Tax Form 2026', tplCode: 'TPL-002', type: 'Single-recipient template', tags: ['Tax', 'Onboarding'], entity: 'Finance', country: 'US', folderId: 'tax' },
  { id: '3', name: 'Health Insurance Enrollment Form', tplCode: 'TPL-003', type: 'Single-recipient template', tags: ['Insurance', 'Onboarding'], entity: 'All', country: 'US', folderId: 'onboarding' },
  { id: '4', name: 'Mutual Non-Disclosure Agreement', tplCode: 'TPL-004', type: 'Multi-recipient template', tags: ['Legal', 'Recruiting'], entity: 'Engineering', country: 'All', folderId: 'compliance' },
  { id: '5', name: 'Offer Letter – Full Time', tplCode: 'TPL-005', type: 'Single-recipient template', tags: ['Recruiting', 'Onboarding'], entity: 'All', country: 'US', folderId: 'offer' },
  { id: '6', name: 'Separation Agreement', tplCode: 'TPL-006', type: 'Multi-recipient template', tags: ['Offboarding', 'Legal'], entity: 'All', country: 'US', folderId: 'termination' },
  { id: '7', name: 'Remote Work Policy Acknowledgment', tplCode: 'TPL-007', type: 'Single-recipient template', tags: ['Policy', 'Legal'], entity: 'All', country: 'All', folderId: 'compliance' },
  { id: '8', name: 'Contractor Services Agreement', tplCode: 'TPL-008', type: 'Multi-recipient template', tags: ['Legal'], entity: 'Finance', country: 'US', folderId: 'other' },
  { id: '9', name: 'I-9 Employment Eligibility', tplCode: 'TPL-009', type: 'Single-recipient template', tags: ['Onboarding', 'Compliance'], entity: 'All', country: 'US', folderId: 'onboarding' },
  { id: '10', name: 'Employee Handbook Acknowledgment', tplCode: 'TPL-010', type: 'Single-recipient template', tags: ['Policy'], entity: 'All', country: 'All', folderId: 'compliance' },
  { id: '11', name: 'Bonus Plan Election', tplCode: 'TPL-011', type: 'Single-recipient template', tags: ['Finance'], entity: 'Finance', country: 'US', folderId: 'other' },
  { id: '12', name: 'Internship Agreement', tplCode: 'TPL-012', type: 'Multi-recipient template', tags: ['Recruiting', 'Legal'], entity: 'All', country: 'US', folderId: 'offer' },
  { id: '13', name: 'COBRA Notice Packet', tplCode: 'TPL-013', type: 'Single-recipient template', tags: ['Insurance', 'Offboarding'], entity: 'All', country: 'US', folderId: 'termination' },
  { id: '14', name: 'Stock Option Grant Notice', tplCode: 'TPL-014', type: 'Multi-recipient template', tags: ['Finance', 'Legal'], entity: 'Engineering', country: 'US', folderId: 'offer' },
  { id: '15', name: 'Data Processing Addendum', tplCode: 'TPL-015', type: 'Multi-recipient template', tags: ['Legal', 'Compliance'], entity: 'All', country: 'All', folderId: 'compliance' },
  { id: '16', name: 'Timesheet Policy – Hourly', tplCode: 'TPL-016', type: 'Single-recipient template', tags: ['Policy'], entity: 'All', country: 'US', folderId: 'compliance' },
  { id: '17', name: 'Relocation Benefits Summary', tplCode: 'TPL-017', type: 'Single-recipient template', tags: ['Recruiting', 'Finance'], entity: 'Finance', country: 'US', folderId: 'offer' },
  { id: '18', name: 'Safety Training Certificate', tplCode: 'TPL-018', type: 'Single-recipient template', tags: ['Onboarding', 'Compliance'], entity: 'All', country: 'US', folderId: 'onboarding' },
];

interface TemplatesLibraryViewProps {
  onNewTemplate?: () => void;
}

const TemplatesLibraryView: React.FC<TemplatesLibraryViewProps> = ({ onNewTemplate }) => {
  const [activeFolderId, setActiveFolderId] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let rows = MOCK_TEMPLATES;
    if (activeFolderId !== 'all') {
      rows = rows.filter((r) => r.folderId === activeFolderId);
    }
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

  const activeFolderLabel = FOLDERS.find((f) => f.id === activeFolderId)?.label ?? 'All Document Templates';

  return (
    <div className="flex min-h-[560px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-[#fafafa] flex flex-col">
        <div className="p-4 border-b border-slate-200/80">
          <button
            type="button"
            onClick={onNewTemplate}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white shadow-sm hover:opacity-95 transition-opacity"
            style={{ backgroundColor: PRIMARY_PURPLE }}
          >
            <Plus size={18} strokeWidth={2.5} />
            New
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {FOLDERS.map((f) => {
            const active = f.id === activeFolderId;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFolderId(f.id)}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-[13px] transition-colors ${
                  active
                    ? 'bg-[#e8f2ff] text-[#2563eb] font-semibold border-l-[3px] border-[#2563eb]'
                    : 'text-slate-600 hover:bg-white/80 border-l-[3px] border-transparent'
                }`}
              >
                <ChevronDown size={14} className={`shrink-0 text-slate-400 ${active ? 'text-[#2563eb]' : ''}`} />
                <Folder size={16} className={`shrink-0 ${active ? 'text-[#2563eb]' : 'text-slate-400'}`} />
                <span className="truncate">{f.label}</span>
              </button>
            );
          })}
        </nav>
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
