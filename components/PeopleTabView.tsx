
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
  Settings,
  Layout,
  Send,
  Upload,
  FileText,
  Trash2,
} from 'lucide-react';
import TemplatesLibraryView from './TemplatesLibraryView';
import ProfileFoldersView from './ProfileFoldersView';
import EnvelopesListView, { type EnvelopeTableRow } from './EnvelopesListView';
import ToolsSidePanel from './ToolsSidePanel';
import SendReminderModal from './SendReminderModal';
import type { ProfileFolderNode } from '../utils/profileFolderUtils';

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
  onProfileClick?: () => void;
  onNewTemplate?: () => void;
  onSendDocuments?: () => void;
  packetRows?: EnvelopeTableRow[];
  onPacketRowsChange?: (rows: EnvelopeTableRow[]) => void;
  onViewDocumentPacket?: (packetId: string) => void;
  onEditDocumentPacket?: (packetId: string) => void;
  onSignDocumentPacket?: (packetId: string) => void;
  onResendEnvelope?: (packetId: string) => void;
  hubTab?: string;
  onHubTabChange?: (tab: string) => void;
  onOpenDocumentsPeopleTab?: () => void;
  /** Fires when a person is removed from the list (after local list updates in this view). */
  onRemovePerson?: (personId: string) => void;
  profileFolderRoot?: ProfileFolderNode;
  onProfileFolderRootChange?: (next: ProfileFolderNode) => void;
  viewMode?: 'admin' | 'employee';
}

const PeopleTabView: React.FC<PeopleTabViewProps> = ({
  onGoHome,
  onSendDocument,
  onProfileClick,
  onNewTemplate,
  onSendDocuments,
  packetRows,
  onPacketRowsChange,
  onViewDocumentPacket,
  onEditDocumentPacket,
  onSignDocumentPacket,
  onResendEnvelope,
  hubTab: hubTabProp,
  onHubTabChange,
  onOpenDocumentsPeopleTab,
  onRemovePerson,
  profileFolderRoot,
  onProfileFolderRootChange,
  viewMode = 'admin',
}) => {
  const [internalHubTab, setInternalHubTab] = useState('People');
  const activeTab = hubTabProp ?? internalHubTab;
  const setActiveTab = onHubTabChange ?? setInternalHubTab;
  const [peopleRows, setPeopleRows] = useState<PeopleRow[]>(PEOPLE_DATA);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [toolsSideCollapsed, setToolsSideCollapsed] = useState(true);
  const [sendReminderOpen, setSendReminderOpen] = useState(false);

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
      <ToolsSidePanel
        collapsed={toolsSideCollapsed}
        onCollapsedChange={setToolsSideCollapsed}
        onGoHome={onGoHome}
        onOpenDocumentsPeopleTab={onOpenDocumentsPeopleTab}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-40 gap-4">
          <div className="flex-1 max-w-2xl min-w-0">
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
            <button
              type="button"
              onClick={() => onProfileClick?.()}
              className="flex items-center space-x-3 cursor-pointer rounded-lg p-1 -mr-1 hover:bg-slate-50 transition-colors text-left"
              aria-label="Open user profile"
            >
              <span className="text-[13px] font-bold text-slate-700">Acme</span>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0">
                <img src="https://picsum.photos/id/64/100/100" alt="Profile" />
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-white custom-scrollbar">
          <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-8 pt-8 pb-0 mb-8 shadow-sm">
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

            <div className="flex items-center space-x-8">
              {['People', 'Templates', 'Documents', 'Profile Folders', 'Rules', 'Settings'].map((tab) => (
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
          </div>

          <div className="px-8 pb-8">
          {activeTab === 'People' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
              <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="text-[14px] font-bold text-slate-900">People</span>
                  <span className="text-slate-400 font-medium text-[14px]">· {peopleRows.length}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setSendReminderOpen(true)}
                    className="flex items-center space-x-2 px-4 py-1.5 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
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
                          <span>Notices</span>
                          <ChevronDown size={14} className="text-slate-300" />
                        </div>
                      </th>
                      <th className="px-6 py-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] text-slate-700">
                    {peopleRows.map((row) => (
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
                                <div className="my-1 border-t border-slate-100" role="separator" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPeopleRows((rows) => rows.filter((r) => r.id !== row.id));
                                    onRemovePerson?.(row.id);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full flex items-center space-x-4 px-5 py-3 text-left text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={18} className="text-red-600 shrink-0" />
                                  <span className="text-[14px] font-medium">Remove</span>
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
          )}

          {activeTab === 'Templates' && (
            <div className="mb-8">
              <TemplatesLibraryView onNewTemplate={onNewTemplate} onCreateFolder={() => {}} />
            </div>
          )}

          {activeTab === 'Profile Folders' && (
            <div id="profile-folders" className="mb-8 scroll-mt-8">
              <ProfileFoldersView
                folderRoot={profileFolderRoot}
                onFolderRootChange={onProfileFolderRootChange}
                viewMode={viewMode}
              />
            </div>
          )}

          {activeTab === 'Documents' && (
            <div className="mb-8">
              <EnvelopesListView
                rows={packetRows}
                onRowsChange={onPacketRowsChange}
                onSendDocuments={onSendDocuments}
                onViewEnvelope={onViewDocumentPacket}
                onEditEnvelope={onEditDocumentPacket}
                onSignEnvelope={onSignDocumentPacket}
                onResendEnvelope={onResendEnvelope}
              />
            </div>
          )}

          {(activeTab === 'Rules' || activeTab === 'Settings') && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center text-slate-500 text-sm font-medium mb-8">
              {activeTab} view is not available in this demo.
            </div>
          )}
          </div>
        </main>
      </div>
      <SendReminderModal
        open={sendReminderOpen}
        onClose={() => setSendReminderOpen(false)}
        onConfirm={() => {}}
      />
    </div>
  );
};

export default PeopleTabView;
