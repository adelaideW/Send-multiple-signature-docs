
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ChevronRight, 
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
  Bell,
  Upload,
  X as CloseIcon
} from 'lucide-react';
import { Employee } from '../types';

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

const FOLDER_VIEW_DATA = [
  { id: '1', name: 'Confidential', type: 'folder', status: 'Action required', isDefault: true, date: '01/13/25 14:47:21 PST', dotColor: 'bg-red-500' },
  { id: '2', name: 'Notice', type: 'folder', status: 'Sent', isDefault: true, date: '01/13/25 14:47:21 PST', dotColor: 'bg-slate-400' },
  { id: '3', name: 'Performance Records', type: 'folder', status: '--', isDefault: false, date: '01/13/25 14:47:21 PST', dotColor: '' },
  { id: '4', name: 'Company policies', type: 'folder', status: '--', isDefault: false, date: '01/13/25 14:47:21 PST', dotColor: '' },
  { id: '5', name: 'SOC2-GAP-REPORT', type: 'file', status: 'Yet to sign', isDefault: false, date: '01/13/25 14:47:21 PST', dotColor: 'bg-red-500' },
  { id: '6', name: 'Cryptography Policy', type: 'file', status: 'Signed', isDefault: false, date: '01/13/25 14:47:21 PST', dotColor: 'bg-teal-500' },
  { id: '7', name: 'Office Policy', type: 'file', status: 'Archived', isDefault: false, date: '01/13/25 14:47:21 PST', dotColor: 'bg-slate-400' },
  { id: '8', name: 'Sales commission - OPTION...', type: 'file', status: 'Uploaded', isDefault: false, date: '01/13/25 14:47:21 PST', dotColor: 'bg-slate-400' },
  { id: '9', name: 'W-4 Form', type: 'file', status: 'Signed', isDefault: false, date: '01/13/25 15:12:05 PST', dotColor: 'bg-teal-500' },
  { id: '10', name: 'I-9 Verification', type: 'file', status: 'Action required', isDefault: false, date: '01/13/25 15:15:33 PST', dotColor: 'bg-red-500' },
  { id: '11', name: 'Direct Deposit Auth', type: 'file', status: 'Uploaded', isDefault: false, date: '01/13/25 15:20:11 PST', dotColor: 'bg-slate-400' },
];

const DOCUMENT_VIEW_DATA = [
  { id: 'd1', name: 'Comprehensive Project Oversight and Coordination Contract', folderPath: 'Confidential', status: 'Yet to sign', envelopeName: '{Envelope Name}', date: '01/13/25 14:47:21 PST', dotColor: 'bg-red-500' },
  { id: 'd2', name: 'White Paper: Block...', folderPath: 'Confidential', status: 'Yet to sign', envelopeName: '{Envelope Name}', date: '01/13/25 14:47:21 PST', dotColor: 'bg-red-500' },
  { id: 'd3', name: 'Travel Expense Rei...', folderPath: 'Confidential', status: 'Signed', envelopeName: '--', date: '01/13/25 14:47:21 PST', dotColor: 'bg-teal-500' },
  { id: 'd4', name: 'Training Manual: S...', folderPath: 'Confidential', status: 'Signed', envelopeName: '--', date: '01/13/25 14:47:21 PST', dotColor: 'bg-teal-500' },
  { id: 'd5', name: 'The Chronicles of...', folderPath: 'Confidential', status: 'Signed', envelopeName: '{Envelope Name}', date: '01/13/25 14:47:21 PST', dotColor: 'bg-teal-500' },
  { id: 'd6', name: 'Strategic Plan: Cor...', folderPath: 'Confidential', status: 'Archived', envelopeName: '--', date: '01/13/25 14:47:21 PST', dotColor: 'bg-slate-400' },
  { id: 'd7', name: 'Research Paper: Ef...', folderPath: 'Confidential', status: 'Uploaded', envelopeName: '--', date: '01/13/25 14:47:21 PST', dotColor: 'bg-slate-400' },
  { id: 'd8', name: 'Joinder to Motion', folderPath: 'Notice', status: 'Sent', envelopeName: '{Envelope Name}', date: '01/13/25 14:47:21 PST', dotColor: 'bg-slate-400' },
  { id: 'd9', name: 'Performance Review 2024', folderPath: 'Performance Records', status: '--', envelopeName: '--', date: '01/13/25 14:47:21 PST', dotColor: '' },
  { id: 'd10', name: 'Employee Handbook', folderPath: 'Company policies', status: '--', envelopeName: '--', date: '01/13/25 14:47:21 PST', dotColor: '' },
  { id: 'd11', name: 'W-4 Form', folderPath: '--', status: 'Signed', envelopeName: '--', date: '01/13/25 15:12:05 PST', dotColor: 'bg-teal-500' },
  { id: 'd12', name: 'I-9 Verification', folderPath: '--', status: 'Action required', envelopeName: '--', date: '01/13/25 15:15:33 PST', dotColor: 'bg-red-500' },
  { id: 'd13', name: 'Direct Deposit Auth', folderPath: '--', status: 'Uploaded', envelopeName: '--', date: '01/13/25 15:20:11 PST', dotColor: 'bg-slate-400' },
  { id: 'd14', name: 'SOC2-GAP-REPORT', folderPath: '--', status: 'Yet to sign', envelopeName: '--', date: '01/13/25 14:47:21 PST', dotColor: 'bg-red-500' },
  { id: 'd15', name: 'Cryptography Policy', folderPath: '--', status: 'Signed', envelopeName: '--', date: '01/13/25 14:47:21 PST', dotColor: 'bg-teal-500' },
  { id: 'd16', name: 'Office Policy', folderPath: '--', status: 'Archived', envelopeName: '--', date: '01/13/25 14:47:21 PST', dotColor: 'bg-slate-400' },
  { id: 'd17', name: 'Sales commission - OPTION...', folderPath: '--', status: 'Uploaded', envelopeName: '--', date: '01/13/25 14:47:21 PST', dotColor: 'bg-slate-400' },
];

export const EmployeeDocumentsSection: React.FC<DocumentsSectionProps> = ({ 
  onSend, 
  onOpenEnvelope,
  onReviewDocument,
  viewByDocuments,
  setViewByDocuments
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [filterFolder, setFilterFolder] = useState<string | null>(null);
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

  const filteredDocuments = useMemo(() => {
    if (!filterFolder) return DOCUMENT_VIEW_DATA;
    return DOCUMENT_VIEW_DATA.filter(doc => doc.folderPath === filterFolder);
  }, [filterFolder]);

  // Determine if a folder is "Default" by looking at FOLDER_VIEW_DATA
  const getIsDefault = (folderName: string) => {
    return FOLDER_VIEW_DATA.find(f => f.name === folderName)?.isDefault || false;
  };

  return (
    <div className="pr-8 pb-8 pl-4 pt-0">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm min-h-[500px] overflow-hidden">
        {/* Header Section */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <h2 className="text-[16px] font-bold text-slate-900">Documents</h2>
            <span className="text-slate-400 font-medium text-sm">· {viewByDocuments ? filteredDocuments.length : FOLDER_VIEW_DATA.length}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-md text-[13px] font-bold hover:bg-slate-50 transition-colors">
              Edit folder
            </button>
            
            <div className="relative" ref={addMenuRef}>
              <button 
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                className="px-4 py-1.5 bg-[#7A005D] text-white rounded-md text-[13px] font-bold hover:opacity-90 transition-opacity flex items-center space-x-2 shadow-sm"
              >
                <span>Add</span>
                <ChevronDown size={14} />
              </button>
              
              {isAddMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-3 animate-in fade-in zoom-in-95 duration-100">
                  <button 
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
              <button className="p-1.5 text-slate-400 hover:text-slate-600"><Settings2 size={18} /></button>
              <button className="p-1.5 text-slate-400 hover:text-slate-600"><Columns size={18} /></button>
              <button className="p-1.5 text-slate-400 hover:text-slate-600"><Maximize2 size={18} /></button>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="px-6 py-3 flex items-center justify-between bg-white border-b border-slate-100">
          <div className="flex items-center space-x-6">
            <div className="relative w-40">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full border border-slate-200 rounded-md py-1.5 pl-9 pr-4 text-[12px] focus:ring-1 focus:ring-slate-300 outline-none bg-slate-50/30"
              />
            </div>
            <div className="flex items-center space-x-3">
              <div 
                onClick={() => {
                  setViewByDocuments(!viewByDocuments);
                  setFilterFolder(null); // Clear filter when toggling mode
                }}
                className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors border shadow-inner ${viewByDocuments ? 'bg-[#7A005D] border-[#7A005D]' : 'bg-slate-300 border-slate-400/20'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-[1px] shadow-sm transition-all border border-slate-200 ${viewByDocuments ? 'left-[21px]' : 'left-[1px]'}`}></div>
              </div>
              <span className="text-[12px] text-slate-900 font-bold whitespace-nowrap">View by documents</span>
            </div>
          </div>
          <button className="flex items-center space-x-2 text-[12px] font-bold text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-md border border-transparent hover:border-slate-200">
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>

        {/* Breadcrumb Navigation when a folder is filtered */}
        {filterFolder && (
          <div className="px-6 py-3 flex items-center space-x-2 bg-white border-b border-slate-100 animate-in fade-in duration-200">
            <span 
              className="text-[14px] text-slate-500 hover:text-slate-700 cursor-pointer transition-colors"
              onClick={() => setFilterFolder(null)}
            >
              All
            </span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-[14px] text-slate-900 font-medium">
              {filterFolder} documents
            </span>
          </div>
        )}

        {/* Documents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-[13px] text-slate-600 font-semibold">
                <th className="px-6 py-3 w-12 border-r border-slate-200">
                   <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-purple-900 focus:ring-purple-200" />
                </th>
                <th className="px-4 py-3 border-r border-slate-200">
                  <div className="flex items-center justify-between cursor-pointer hover:text-slate-800">
                    <span>Name</span>
                    <ChevronDown size={14} className="text-slate-300" />
                  </div>
                </th>
                {viewByDocuments && (
                  <>
                    <th className="px-4 py-3 border-r border-slate-200">
                      <div className="flex items-center justify-between cursor-pointer hover:text-slate-800">
                        <span>Folder path</span>
                        <ChevronDown size={14} className="text-slate-300" />
                      </div>
                    </th>
                    <th className="px-4 py-3 border-r border-slate-200">
                      <div className="flex items-center justify-between cursor-pointer hover:text-slate-800">
                        <span>Envelopes</span>
                        <ChevronDown size={14} className="text-slate-300" />
                      </div>
                    </th>
                  </>
                )}
                <th className="px-4 py-3 border-r border-slate-200">
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
                <th className="px-4 py-3 w-[60px]">
                  <ChevronDown size={14} className="text-slate-300" />
                </th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-slate-700">
              {(viewByDocuments ? filteredDocuments : FOLDER_VIEW_DATA).map((row: any) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-purple-900 focus:ring-purple-200" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center space-x-2.5">
                      {/* First column: always document icons in View by documents mode */}
                      {viewByDocuments ? (
                        <FileText size={18} className="text-slate-400" />
                      ) : (
                        row.type === 'folder' ? (
                          <Folder size={18} className="text-slate-400 fill-slate-50" />
                        ) : (
                          <FileText size={18} className="text-slate-400" />
                        )
                      )}
                      <span 
                        className="text-[#2563eb] font-bold cursor-pointer hover:underline truncate max-w-[200px]"
                        onClick={() => {
                          if (row.name === 'Comprehensive Project Oversight and Coordination Contract') {
                            onReviewDocument?.();
                          }
                        }}
                      >
                        {row.name}
                      </span>
                      {!viewByDocuments && row.isDefault && (
                        <span className="text-[10px] font-black text-slate-800 bg-slate-100 px-1 py-0.5 rounded leading-none uppercase">Default</span>
                      )}
                    </div>
                  </td>
                  {viewByDocuments && (
                    <>
                      <td className="px-4 py-3.5">
                        {row.folderPath && row.folderPath !== '--' ? (
                          <div className="flex items-center space-x-2">
                            <Folder size={18} className="text-slate-400 fill-slate-50" />
                            <button 
                              onClick={() => setFilterFolder(row.folderPath)}
                              className="text-[#2563eb] font-bold cursor-pointer hover:underline"
                            >
                              {row.folderPath}
                            </button>
                            {getIsDefault(row.folderPath) && (
                              <span className="text-[10px] font-black text-slate-800 bg-slate-100 px-1 py-0.5 rounded leading-none uppercase ml-1">Default</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {row.envelopeName && row.envelopeName !== '--' ? (
                          <span 
                            className="text-[#2563eb] font-bold cursor-pointer hover:underline"
                            onClick={() => onOpenEnvelope?.(row.envelopeName)}
                          >
                            {row.envelopeName}
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center space-x-2">
                      {row.dotColor && <div className={`w-2 h-2 rounded-full ${row.dotColor}`}></div>}
                      <span className="font-bold text-slate-800 text-[13px]">{row.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 font-medium">
                    {row.date || row.lastModified}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button className="p-1 hover:bg-slate-200 rounded text-slate-400 transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(viewByDocuments ? filteredDocuments : FOLDER_VIEW_DATA).length === 0 && (
            <div className="py-20 text-center">
              <FileText size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium text-[14px]">No documents found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
