
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

interface Recipient {
  id: string;
  order: number;
  name: string;
  email: string;
  avatar?: string;
  initials?: string;
  status: 'Completed' | 'In progress' | 'Waiting';
  action: 'To sign' | 'To view';
  sentOn: string;
  completedOn: string;
}

const RECIPIENTS: Recipient[] = [
  {
    id: 'r1',
    order: 1,
    name: 'David Gonzales',
    email: 'david.gonzales@example.com',
    avatar: 'https://i.pravatar.cc/150?u=davidg',
    status: 'Completed',
    action: 'To sign',
    sentOn: '03/01/2026 8:15 AM',
    completedOn: '03/01/2026 9:02 AM',
  },
  {
    id: 'r2',
    order: 2,
    name: 'Carmen Brown',
    email: 'carmen.brown@example.com',
    initials: 'CB',
    status: 'In progress',
    action: 'To sign',
    sentOn: '03/01/2026 9:00 AM',
    completedOn: '—',
  },
  {
    id: 'r3',
    order: 2,
    name: 'Harry Porter',
    email: 'harry.porter@example.com',
    initials: 'HP',
    status: 'In progress',
    action: 'To view',
    sentOn: '03/01/2026 9:00 AM',
    completedOn: '—',
  },
  {
    id: 'r4',
    order: 3,
    name: 'Tracy Davis',
    email: 'tracy.davis@example.com',
    avatar: 'https://i.pravatar.cc/150?u=tracyd',
    status: 'Waiting',
    action: 'To sign',
    sentOn: '03/01/2026 9:00 AM',
    completedOn: '—',
  },
];

const DETAIL_DOCUMENTS = [
  'Employment_Agreement_John_Doe.pdf',
  'W4_Tax_Form_2026.pdf',
  'Health_Insurance_Enrollment.pdf',
];

interface EnvelopeDetailsViewProps {
  envelopeName: string;
  onExit: () => void;
  onSign?: () => void;
}

const EnvelopeDetailsView: React.FC<EnvelopeDetailsViewProps> = ({ envelopeName, onExit, onSign }) => {
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

        {/* Main Info Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex flex-col space-y-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{envelopeName}</h1>
                <span className="text-[11px] font-bold text-[#F59E0B] uppercase tracking-wide whitespace-nowrap">
                  Yet to sign
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onSign}
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#7A005D] text-white rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
              >
                <PenLine size={18} strokeWidth={2} className="text-white" />
                Sign
              </button>
              <button
                type="button"
                className="p-1.5 text-slate-900 hover:bg-slate-100 rounded-lg"
                aria-label="More actions"
              >
                <MoreVertical size={18} strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-12 mt-6">
            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Sent on</p>
              <p className="text-[13px] font-medium text-slate-800">03/01/2026 9:00 AM</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Sent by</p>
              <p className="text-[13px] font-medium text-[#7A005D] hover:underline cursor-pointer">Harry Porter</p>
            </div>
          </div>
        </div>

        {/* Documents Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-[15px] font-bold text-slate-900">Documents</h2>
          </div>
          <div className="p-2">
            {DETAIL_DOCUMENTS.map((fileName) => (
              <div
                key={fileName}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 rounded-lg group transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <FileText size={20} className="text-slate-400 shrink-0" />
                  <span className="text-[14px] font-bold text-slate-900 truncate">{fileName}</span>
                </div>
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    type="button"
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md"
                    aria-label={`View ${fileName}`}
                  >
                    <Eye size={20} />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md"
                    aria-label={`Download ${fileName}`}
                  >
                    <Download size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recipients Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden pb-4">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-[15px] font-bold text-slate-900">Recipients</h2>
              <span className="text-slate-400 font-medium">· 4</span>
            </div>
            <div className="flex items-center space-x-1">
              <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md" aria-label="Share">
                <Share2 size={18} />
              </button>
              <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md" aria-label="Settings">
                <Settings2 size={18} />
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
              <Filter size={16} />
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
                {RECIPIENTS.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-7 h-7 rounded-full border-2 border-red-500 text-red-600 flex items-center justify-center font-bold text-[11px]">
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
                        <div className={`w-2 h-2 rounded-full ${
                          row.status === 'Completed' ? 'bg-[#0D9488]' : 
                          row.status === 'In progress' ? 'bg-[#F59E0B]' : 'bg-[#94A3B8]'
                        }`}></div>
                        <span className="font-medium text-slate-800">{row.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {row.action}
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
