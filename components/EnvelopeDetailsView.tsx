
import React from 'react';
import {
  ChevronLeft,
  Search,
  MoreVertical,
  Eye,
  Download,
  Filter,
  Maximize2,
  Columns,
  Settings2,
  FileText,
  ChevronDown,
  PenLine,
  Share2,
} from 'lucide-react';
import type { EnvelopeStatus, DocumentSigningStatus } from './EnvelopesListView';

export interface DetailRecipientRow {
  id: string;
  order: number;
  name: string;
  email: string;
  avatar?: string;
  initials?: string;
  status: 'Completed' | 'In progress' | 'Waiting';
  action: 'To sign' | 'To view' | '—';
  sentOn: string;
  completedOn: string;
}

/** Recipients table aligned with design reference (signing order + sent-on dashes). */
const DEFAULT_RECIPIENTS: DetailRecipientRow[] = [
  {
    id: 'r1',
    order: 1,
    name: 'Darrell Steward',
    email: 'bs@email.com',
    avatar: 'https://i.pravatar.cc/150?u=darrell',
    status: 'In progress',
    action: 'To sign',
    sentOn: '10/14/2024 7:19 AM',
    completedOn: '—',
  },
  {
    id: 'r2',
    order: 2,
    name: 'Albert Flores',
    email: 'shreya@email.com',
    initials: 'AF',
    status: 'In progress',
    action: 'To sign',
    sentOn: '-',
    completedOn: '—',
  },
  {
    id: 'r3',
    order: 2,
    name: 'Rome Montenegro',
    email: 'th@email.com',
    initials: 'RM',
    status: 'In progress',
    action: 'To view',
    sentOn: '10/14/2024 8:19 AM',
    completedOn: '—',
  },
  {
    id: 'r4',
    order: 3,
    name: 'Parker Conrad',
    email: 're@email.com',
    avatar: 'https://i.pravatar.cc/150?u=parker',
    status: 'Waiting',
    action: 'To sign',
    sentOn: '-',
    completedOn: '—',
  },
];

function headerBadgeForStatus(status: EnvelopeStatus): { label: string; className: string } | null {
  switch (status) {
    case 'yet to sign':
      return {
        label: 'Yet to sign',
        className: 'text-[11px] font-semibold text-white px-3 py-1 rounded-full bg-[#E4633C]',
      };
    case 'in progress':
      return {
        label: 'In progress',
        className: 'text-[11px] font-semibold text-white px-3 py-1 rounded-full bg-amber-500',
      };
    case 'draft':
      return {
        label: 'Draft',
        className: 'text-[11px] font-semibold text-white px-3 py-1 rounded-full bg-slate-500',
      };
    case 'correcting':
      return {
        label: 'Correcting',
        className: 'text-[11px] font-semibold text-white px-3 py-1 rounded-full bg-amber-600',
      };
    case 'completed':
      return {
        label: 'Completed',
        className: 'text-[11px] font-semibold text-white px-3 py-1 rounded-full bg-emerald-600',
      };
    case 'voided':
      return {
        label: 'Voided',
        className: 'text-[11px] font-semibold text-white px-3 py-1 rounded-full bg-slate-500',
      };
    default:
      return null;
  }
}

function docStatusLabel(status: DocumentSigningStatus): string {
  if (status === 'voided') return 'Voided';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function documentDotClass(status: DocumentSigningStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500';
    case 'yet to sign':
    case 'correcting':
      return 'bg-amber-500';
    case 'voided':
    case 'draft':
      return 'bg-slate-400';
    default:
      return 'bg-slate-400';
  }
}

interface EnvelopeDetailsViewProps {
  envelopeName: string;
  packetStatus: EnvelopeStatus;
  sentOn: string;
  sentBy: string;
  documents: { name: string; status: DocumentSigningStatus }[];
  recipients?: DetailRecipientRow[];
  isVoided?: boolean;
  onExit: () => void;
  onSign?: () => void;
}

const EnvelopeDetailsView: React.FC<EnvelopeDetailsViewProps> = ({
  envelopeName,
  packetStatus,
  sentOn,
  sentBy,
  documents,
  recipients = DEFAULT_RECIPIENTS,
  isVoided = false,
  onExit,
  onSign,
}) => {
  const badge = headerBadgeForStatus(packetStatus);
  const recipientRows = isVoided ? recipients.map((r) => ({ ...r, action: '—' as const })) : recipients;

  const showSign = packetStatus !== 'voided' && packetStatus !== 'completed' && packetStatus !== 'draft';

  return (
    <div className="flex flex-col h-screen bg-[#F9FAFB] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-700 hover:text-slate-900 -mt-1 mb-2"
        >
          <ChevronLeft size={18} strokeWidth={2} />
          Back
        </button>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex flex-col space-y-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{envelopeName}</h1>
                {badge && <span className={badge.className}>{badge.label}</span>}
              </div>
            </div>
            {showSign && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onSign}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#FDB71C] text-slate-900 rounded-[8px] text-sm font-bold hover:opacity-95 transition-opacity"
                >
                  <PenLine size={18} strokeWidth={2} className="text-slate-900" />
                  Sign
                </button>
                <button
                  type="button"
                  className="p-1.5 text-slate-900 hover:bg-slate-100 rounded-[8px]"
                  aria-label="More actions"
                >
                  <MoreVertical size={18} strokeWidth={2} />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-12 mt-6">
            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Sent on</p>
              <p className="text-[13px] font-medium text-slate-800">{sentOn}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Sent by</p>
              <p className="text-[13px] font-medium text-[#7A005D] hover:underline cursor-pointer">{sentBy}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-[15px] font-bold text-slate-900">Documents</h2>
          </div>
          <div className="p-2">
            {documents.map((doc) => (
              <div
                key={doc.name}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 rounded-lg group transition-colors gap-4"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <FileText size={20} className="text-slate-400 shrink-0" />
                  <span className="text-[14px] font-bold text-slate-900 truncate">{doc.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2 w-[120px] justify-end">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${documentDotClass(doc.status)}`} />
                    <span className="text-[12px] font-semibold text-slate-700 whitespace-nowrap">
                      {docStatusLabel(doc.status)}
                    </span>
                  </div>
                  {isVoided ? (
                    <span className="text-slate-400 font-medium w-20 text-right">—</span>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md"
                        aria-label={`View ${doc.name}`}
                      >
                        <Eye size={20} />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md"
                        aria-label={`Download ${doc.name}`}
                      >
                        <Download size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden pb-4">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-[15px] font-bold text-slate-900">Recipients</h2>
              <span className="text-slate-400 font-medium">· {recipientRows.length}</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md"
                aria-label="Filter"
              >
                <Filter size={18} />
              </button>
              <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md" aria-label="Share">
                <Share2 size={18} />
              </button>
              <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md" aria-label="Columns">
                <Columns size={18} />
              </button>
              <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md" aria-label="Expand">
                <Maximize2 size={18} />
              </button>
            </div>
          </div>

          <div className="px-6 pb-4 flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search"
                className="w-full border border-slate-200 rounded-lg py-1.5 pl-10 pr-4 text-[13px] outline-none bg-white"
              />
            </div>
            <button className="flex items-center space-x-2 text-[13px] font-bold text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg">
              <Settings2 size={16} />
              <span>Filter</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-6 py-3 w-16">Order</th>
                  <th className="px-2 py-3">
                    <div className="flex items-center space-x-1">
                      <span>Recipients</span>
                      <ChevronDown size={12} className="text-slate-300" />
                    </div>
                  </th>
                  <th className="px-6 py-3">
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      <ChevronDown size={12} className="text-slate-300" />
                    </div>
                  </th>
                  <th className="px-6 py-3">
                    <div className="flex items-center space-x-1">
                      <span>Actions</span>
                      <ChevronDown size={12} className="text-slate-300" />
                    </div>
                  </th>
                  <th className="px-6 py-3">
                    <div className="flex items-center space-x-1">
                      <span>Sent on</span>
                      <ChevronDown size={12} className="text-slate-300" />
                    </div>
                  </th>
                  <th className="px-6 py-3">
                    <div className="flex items-center space-x-1">
                      <span>Completed on</span>
                      <ChevronDown size={12} className="text-slate-300" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-slate-700">
                {recipientRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-7 h-7 rounded-full bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center font-bold text-[11px]">
                        {row.order}
                      </div>
                    </td>
                    <td className="px-2 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
                          {row.avatar ? (
                            <img src={row.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-[#64748B] text-[12px] bg-[#F1F5F9]">
                              {row.initials}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 leading-tight">{row.name}</span>
                          <span className="text-slate-400 text-[11px] font-medium">{row.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            row.status === 'Completed'
                              ? 'bg-[#0D9488]'
                              : row.status === 'In progress'
                                ? 'bg-[#F59E0B]'
                                : 'bg-[#94A3B8]'
                          }`}
                        />
                        <span className="font-medium text-slate-800">{row.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {row.action === '—' ? <span className="text-slate-400">—</span> : row.action}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {row.sentOn}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {row.completedOn}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvelopeDetailsView;
