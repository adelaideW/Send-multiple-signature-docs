
import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  HelpCircle, 
  Accessibility, 
  Bell, 
  ChevronDown, 
  Grid, 
  Filter, 
  MoreVertical, 
  Maximize2, 
  Columns, 
  Settings2, 
  ExternalLink,
  Home,
  Users,
  LayoutGrid,
  Calendar,
  Shield,
  Briefcase,
  Target,
  Coins,
  Heart,
  MessageSquare,
  Settings,
  Layout,
  Send,
  Upload,
  FileText
} from 'lucide-react';

interface PeopleRow {
  id: string;
  name: string;
  department: string;
  avatar: string;
  status: 'Active' | 'Accepted' | 'Terminated';
  documents: { completed: number; total: number } | string;
  envelopes: { completed: number; total: number } | string;
  notices: string;
}

const PEOPLE_DATA: PeopleRow[] = [
  { id: '1', name: 'Richard Satherland', department: 'Sales', avatar: 'https://i.pravatar.cc/150?u=1', status: 'Active', documents: '0 received', envelopes: { completed: 0, total: 1 }, notices: '1 notice received' },
  { id: '2', name: 'Richard Satherland', department: 'Human Resources', avatar: 'https://i.pravatar.cc/150?u=2', status: 'Active', documents: '0 received', envelopes: { completed: 1, total: 1 }, notices: '1 notice received' },
  { id: '3', name: 'Richard Satherland', department: 'Accounting', avatar: 'https://i.pravatar.cc/150?u=3', status: 'Active', documents: { completed: 15, total: 262 }, envelopes: { completed: 1, total: 2 }, notices: '1 notice received' },
  { id: '4', name: 'Richard Satherland', department: 'Support', avatar: 'https://i.pravatar.cc/150?u=4', status: 'Active', documents: { completed: 15, total: 262 }, envelopes: '0 received', notices: '1 notice received' },
  { id: '5', name: 'Richard Satherland', department: 'Legal', avatar: 'https://i.pravatar.cc/150?u=5', status: 'Active', documents: { completed: 15, total: 262 }, envelopes: '0 received', notices: '1 notice received' },
  { id: '6', name: 'Richard Satherland', department: 'Recruiting', avatar: 'https://i.pravatar.cc/150?u=6', status: 'Active', documents: { completed: 15, total: 262 }, envelopes: '0 received', notices: '1 notice received' },
  { id: '7', name: 'Richard Satherland', department: 'Security', avatar: 'https://i.pravatar.cc/150?u=7', status: 'Accepted', documents: 'Sent to 35 people', envelopes: '0 received', notices: '1 notice received' },
  { id: '8', name: 'Richard Satherland', department: 'Recruiting', avatar: 'https://i.pravatar.cc/150?u=8', status: 'Accepted', documents: 'Sent to 112 people', envelopes: '0 received', notices: '0 received' },
  { id: '9', name: 'Richard Satherland', department: 'Engineering', avatar: 'https://i.pravatar.cc/150?u=9', status: 'Terminated', documents: { completed: 15, total: 262 }, envelopes: '0 received', notices: '0 received' },
  { id: '10', name: 'Richard Satherland', department: 'Insurance', avatar: 'https://i.pravatar.cc/150?u=10', status: 'Terminated', documents: { completed: 15, total: 262 }, envelopes: '0 received', notices: '0 received' },
];

const ProgressBar: React.FC<{ completed: number; total: number }> = ({ completed, total }) => {
  const percentage = (completed / total) * 100;
  return (
    <div className="w-full space-y-1">
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div 
          className="bg-[#7A005D] h-full rounded-full transition-all duration-500" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-[12px] font-bold text-[#2563eb] hover:underline cursor-pointer">
        {completed}/{total} completed
      </p>
    </div>
  );
};

interface PeopleTabViewProps {
  onGoHome: () => void;
  onSendDocument?: () => void;
}

const PeopleTabView: React.FC<PeopleTabViewProps> = ({ onGoHome, onSendDocument }) => {
  const [activeTab, setActiveTab] = useState('People');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden text-slate-800">
      {/* Sidebar Navigation */}
      <aside className="w-14 bg-white border-r border-slate-200 flex flex-col items-center py-4 space-y-6 shrink-0 z-[110] overflow-y-auto no-scrollbar">
        <div 
          onClick={onGoHome}
          className="text-[#7A005D] cursor-pointer hover:opacity-80 transition-opacity mb-2"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 6C7 6 4 9 4 12C4 15 7 18 7 18" stroke="#7A005D" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M12 6C12 6 9 9 9 12C9 15 12 18 12 18" stroke="#7A005D" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M17 6C17 6 14 9 14 12C14 15 17 18 17 18" stroke="#7A005D" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="flex flex-col items-center space-y-6">
          <Home size={20} className="text-slate-400 cursor-pointer" />
          <Users size={20} className="text-slate-400 cursor-pointer" />
          <LayoutGrid size={20} className="text-slate-400 cursor-pointer" />
          <Calendar size={20} className="text-slate-400 cursor-pointer" />
          <Shield size={20} className="text-slate-400 cursor-pointer" />
          <Briefcase size={20} className="text-[#7A005D] cursor-pointer" />
          <Target size={20} className="text-slate-400 cursor-pointer" />
          <Coins size={20} className="text-slate-400 cursor-pointer" />
          <Heart size={20} className="text-slate-400 cursor-pointer" />
          <MessageSquare size={20} className="text-slate-400 cursor-pointer" />
        </div>
        <div className="mt-auto flex flex-col items-center space-y-6 pb-2">
          <Grid size={20} className="text-slate-400 cursor-pointer" />
          <HelpCircle size={20} className="text-slate-400 cursor-pointer" />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-40">
          <div className="flex items-center space-x-1 cursor-pointer group">
            <span className="text-[14px] font-bold text-slate-700">Tools</span>
            <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600" />
          </div>

          <div className="flex-1 max-w-2xl px-12">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search or jump to" 
                className="w-full bg-slate-100 border-none rounded-lg py-2 pl-10 pr-4 text-[13px] outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-5">
            <div className="flex items-center space-x-4 text-slate-500">
              <HelpCircle size={20} className="cursor-pointer" />
              <Accessibility size={20} className="cursor-pointer" />
              <div className="relative p-1 border border-slate-200 rounded">
                <Layout size={18} />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">4</span>
              </div>
              <div className="relative">
                <Bell size={20} className="cursor-pointer" />
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">1</span>
              </div>
              <Grid size={20} className="cursor-pointer" />
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center space-x-3 cursor-pointer">
              <span className="text-[13px] font-bold text-slate-700">Acme</span>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
                <img src="https://picsum.photos/id/64/100/100" alt="Profile" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-white p-8 custom-scrollbar">
          {/* Page Title & Help Link */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-[#7A005D] text-white rounded-lg flex items-center justify-center shadow-sm">
              <div className="p-1.5 border-2 border-white/40 rounded-md">
                 <FileText size={18} strokeWidth={2.5} />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
            <a href="#" className="flex items-center space-x-1.5 px-2.5 py-1 border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 hover:bg-slate-50">
              <span>Help docs</span>
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-8 border-b border-slate-200 mb-8">
            {['People', 'Templates', 'Envelopes', 'Rules', 'Settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-[14px] font-bold transition-all relative ${
                  activeTab === tab ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#7A005D]" />}
              </button>
            ))}
          </div>

          {/* Action Bar Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="text-[14px] font-bold text-slate-900">People</span>
                <span className="text-slate-400 font-medium text-[14px]">· 14</span>
              </div>
              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 px-4 py-1.5 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                  <Bell size={14} />
                  <span>Send reminder</span>
                </button>
                <div className="flex items-center space-x-1 pl-2 border-l border-slate-100">
                  <button className="p-1.5 text-slate-400 hover:text-slate-600"><Settings2 size={18} /></button>
                  <button className="p-1.5 text-slate-400 hover:text-slate-600"><Columns size={18} /></button>
                  <button className="p-1.5 text-slate-400 hover:text-slate-600"><Maximize2 size={18} /></button>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 flex items-center justify-between border-b border-slate-100 bg-white">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Search" 
                  className="w-full border border-slate-200 rounded-lg py-1.5 pl-9 pr-4 text-[12px] outline-none"
                />
              </div>
              <button className="flex items-center space-x-2 text-[13px] font-bold text-slate-700">
                <Filter size={16} />
                <span>Filter</span>
              </button>
            </div>

            <div className="overflow-x-auto overflow-visible">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-white border-b border-slate-200 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-6 py-3">
                      <div className="flex items-center space-x-1 cursor-pointer">
                        <span>Name</span>
                        <ChevronDown size={14} className="text-slate-300" />
                      </div>
                    </th>
                    <th className="px-6 py-3">
                      <div className="flex items-center space-x-1 cursor-pointer">
                        <span>Employee status</span>
                        <ChevronDown size={14} className="text-slate-300" />
                      </div>
                    </th>
                    <th className="px-6 py-3">
                      <div className="flex items-center space-x-1 cursor-pointer">
                        <span>Documents</span>
                        <ChevronDown size={14} className="text-slate-300" />
                      </div>
                    </th>
                    <th className="px-6 py-3">
                      <div className="flex items-center space-x-1 cursor-pointer">
                        <span>Envelopes</span>
                        <ChevronDown size={14} className="text-slate-300" />
                      </div>
                    </th>
                    <th className="px-6 py-3">
                      <div className="flex items-center space-x-1 cursor-pointer">
                        <span>Notices</span>
                        <ChevronDown size={14} className="text-slate-300" />
                      </div>
                    </th>
                    <th className="px-6 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-slate-700">
                  {PEOPLE_DATA.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-100 bg-slate-50 shrink-0 shadow-sm">
                            <img src={row.avatar} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 leading-tight">{row.name}</span>
                            <span className="text-slate-400 text-[11px] font-medium leading-tight mt-0.5">{row.department}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {row.status}
                      </td>
                      <td className="px-6 py-4">
                        {typeof row.documents === 'string' ? (
                          <span className="text-slate-400 font-medium">{row.documents}</span>
                        ) : (
                          <ProgressBar completed={row.documents.completed} total={row.documents.total} />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {typeof row.envelopes === 'string' ? (
                          <span className="text-slate-400 font-medium">{row.envelopes}</span>
                        ) : (
                          <ProgressBar completed={row.envelopes.completed} total={row.envelopes.total} />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {row.notices === '0 received' ? (
                          <span className="text-slate-400 font-medium">{row.notices}</span>
                        ) : (
                          <span className="text-[#2563eb] font-bold hover:underline cursor-pointer">{row.notices}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right overflow-visible">
                        <div className="relative inline-block text-left" ref={activeMenuId === row.id ? menuRef : null}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === row.id ? null : row.id);
                            }}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 transition-colors"
                          >
                            <MoreVertical size={18} />
                          </button>
                          
                          {activeMenuId === row.id && (
                            <div className="absolute right-0 top-full mt-1 w-60 bg-white border border-slate-200 rounded-xl shadow-xl z-[120] py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                              <button 
                                onClick={() => { 
                                  onSendDocument?.(); 
                                  setActiveMenuId(null); 
                                }} 
                                className="w-full flex items-center space-x-4 px-5 py-3 text-slate-900 hover:bg-slate-50 transition-colors text-left"
                              >
                                <Send size={18} className="text-slate-800" />
                                <span className="text-[14px] font-medium">Send document</span>
                              </button>
                              <button 
                                onClick={() => setActiveMenuId(null)}
                                className="w-full flex items-center space-x-4 px-5 py-3 text-slate-900 hover:bg-slate-50 transition-colors text-left"
                              >
                                <Upload size={18} className="text-slate-800" />
                                <span className="text-[14px] font-medium">Upload document</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PeopleTabView;
