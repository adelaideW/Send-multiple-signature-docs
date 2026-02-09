import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  HelpCircle, 
  Bell, 
  Globe, 
  LogOut, 
  MoreVertical, 
  Pencil,
  Camera,
  Accessibility,
  CheckSquare,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Zap,
  Plus,
  Check,
  User,
  X,
  ChevronRight,
  FileText,
  ChevronLeft,
  CirclePlus,
  GripVertical,
  Type,
  PenTool,
  Calendar,
  Square,
  Minus,
  ZoomIn,
  ZoomOut,
  Hand,
  Link,
  Image as ImageIcon,
  AlignLeft,
  List,
  ListOrdered,
  Type as TypeIcon,
  Baseline,
  Eraser
} from 'lucide-react';

interface EnvelopeCreatorProps {
  onExit: () => void;
  onEditDocument?: () => void;
  onContinue?: (envelopeName: string) => void;
}

const TEMPLATES = [
  "Consulting Agreement",
  "Non-CA Under 40 Employees",
  "Canada Contractor Agreement - Monthly Pay - With Equity - Quebec",
  "Canada Contractor Agreement - Monthly Pay - No Equity - Quebec"
];

const MOCK_USERS = [
  { id: 'u1', name: 'David Gonzales', email: 'david.g@acme.com' },
  { id: 'u2', name: 'Sarah Jenkins', email: 'sarah.j@acme.com' },
  { id: 'u3', name: 'Michael Chen', email: 'm.chen@acme.com' },
  { id: 'u4', name: 'Emily Rodriguez', email: 'emily.r@acme.com' },
];

interface FolderNode {
  id: string;
  name: string;
  children?: FolderNode[];
}

const FOLDER_STRUCTURE: FolderNode[] = [
  {
    id: 'root',
    name: 'All documents',
    children: [
      { 
        id: 'f1', 
        name: 'Other agreements', 
        children: [
          { id: 'f2', name: 'NDA' },
          { id: 'f3', name: 'Offer letter' },
        ] 
      },
      { 
        id: 'f4', 
        name: 'Notices', 
        children: [
          { id: 'f4-1', name: 'Health & Safety' },
          { id: 'f4-2', name: 'Employment Policy' }
        ] 
      },
      { id: 'f5', name: 'Handbooks' },
    ]
  }
];

interface RecipientSlot {
  id: string;
  user: { id: string, name: string, email?: string } | null;
  action: 'Needs to complete' | 'CC recipient';
  isSearching: boolean;
  searchTerm: string;
  isActionDropdownOpen: boolean;
}

const VariableChip: React.FC<{ label: string; color?: 'blue' | 'purple' | 'orange' }> = ({ label, color = 'blue' }) => {
  const colors = {
    blue: 'bg-white border-slate-200 text-slate-800',
    purple: 'bg-purple-100 border-purple-200 text-purple-700',
    orange: 'bg-orange-100 border-orange-200 text-orange-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[12px] font-medium mx-1 shadow-sm ${colors[color]}`}>
      {label}
      <X size={10} className="ml-1.5 text-slate-400 cursor-pointer" />
    </span>
  );
};

const Coachmark: React.FC<{ 
  title: string; 
  content: string; 
  onNext: () => void; 
  onClose: () => void;
  isLast?: boolean;
}> = ({ title, content, onNext, onClose, isLast }) => (
  <div className="absolute z-[200] w-[280px] bg-white rounded-xl shadow-2xl border border-slate-200 p-5 animate-in fade-in zoom-in-95 duration-200">
    <div className="absolute -left-2 top-6 w-4 h-4 bg-white border-l border-b border-slate-200 rotate-45" />
    <div className="flex justify-between items-start mb-2">
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
        <X size={16} />
      </button>
    </div>
    <p className="text-[13px] text-slate-600 leading-relaxed mb-4">{content}</p>
    <div className="flex justify-between items-center">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{isLast ? 'Step 2 of 2' : 'Step 1 of 2'}</span>
      <button 
        onClick={onNext}
        className="px-4 py-1.5 bg-[#7A005D] text-white rounded-lg text-xs font-bold hover:opacity-90 shadow-md transition-all"
      >
        {isLast ? 'Got it' : 'Next'}
      </button>
    </div>
  </div>
);

const EnvelopeCreator: React.FC<EnvelopeCreatorProps> = ({ onExit, onEditDocument, onContinue }) => {
  const [currentStep, setCurrentStep] = useState<'setup' | 'placement'>('setup');
  const [expandedSections, setExpandedSections] = useState<string[]>(['documents', 'recipients', 'destination', 'customMessage']);
  
  const [leftWidth, setLeftWidth] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  
  const [recipients, setRecipients] = useState<RecipientSlot[]>([
    { id: '1', user: null, action: 'Needs to complete', isSearching: false, searchTerm: '', isActionDropdownOpen: false }
  ]);

  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['root', 'f1']); 
  const [selectedFolder, setSelectedFolder] = useState<string | null>("All documents"); 

  const [isPreviewRecipientsExpanded, setIsPreviewRecipientsExpanded] = useState(false);
  const [currentPreviewPage, setCurrentPreviewPage] = useState(1);

  const [messageMode, setMessageMode] = useState<'edit' | 'preview'>('edit');
  const [subject, setSubject] = useState('Action required for documents');
  const [body, setBody] = useState('Please review and send the documents\n• {Document names}');

  // Coachmarks state
  const [activeCoachmark, setActiveCoachmark] = useState<number | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const recipientSelectorRef = useRef<HTMLDivElement>(null);
  const fieldsContainerRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const minWidth = 350;
      const maxWidth = window.innerWidth * (2 / 3);
      const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);
      setLeftWidth(newWidth);
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTemplateMenuOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setIsLocationMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalPages = selectedTemplates.length > 0 ? selectedTemplates.length : (uploadedFiles.length > 0 ? uploadedFiles.length : 0);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const isExpanded = (id: string) => expandedSections.includes(id);

  const toggleTemplate = (tpl: string) => {
    if (uploadedFiles.length > 0) return;
    setSelectedTemplates(prev => {
      const next = prev.includes(tpl) ? prev.filter(t => t !== tpl) : [...prev, tpl];
      if (currentPreviewPage > next.length && next.length > 0) {
        setCurrentPreviewPage(next.length);
      } else if (next.length === 1) {
        setCurrentPreviewPage(1);
      }
      return next;
    });
  };

  const clearTemplates = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTemplates([]);
    setCurrentPreviewPage(1);
  };

  const addFile = () => {
    if (selectedTemplates.length > 0) return;
    setUploadedFiles(prev => [...prev, 'Proprietary_Info_Agreement.pdf']);
  };

  const removeFile = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
    if (currentPreviewPage > uploadedFiles.length - 1) {
      setCurrentPreviewPage(Math.max(1, uploadedFiles.length - 1));
    }
  };

  const handleAddRecipient = () => {
    setRecipients(prev => [...prev, { 
      id: Math.random().toString(36).substr(2, 9), 
      user: null, 
      action: 'Needs to complete', 
      isSearching: false, 
      searchTerm: '',
      isActionDropdownOpen: false
    }]);
  };

  const updateRecipient = (id: string, updates: Partial<RecipientSlot>) => {
    setRecipients(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeRecipient = (id: string) => {
    setRecipients(prev => prev.filter(r => r.id !== id));
  };

  const toggleFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const renderFolderTree = (nodes: FolderNode[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.id} className="flex flex-col">
        <div 
          onClick={() => {
            setSelectedFolder(node.name);
            if (!node.children) {
              setIsLocationMenuOpen(false);
            }
          }}
          className={`flex items-center py-1.5 px-4 hover:bg-slate-50 cursor-pointer group`}
          style={{ paddingLeft: `${depth * 20 + 16}px` }}
        >
          {node.children ? (
            <div onClick={(e) => toggleFolder(node.id, e)} className="p-1 mr-1 hover:bg-slate-100 rounded">
              {expandedFolders.includes(node.id) ? <ChevronDown size={14} className="text-slate-600" /> : <ChevronRight size={14} className="text-slate-600" />}
            </div>
          ) : (
            <div className="w-6 mr-1" />
          )}
          <span className={`text-[13px] ${selectedFolder === node.name ? 'text-blue-600 font-bold' : 'text-slate-700 font-medium'}`}>
            {node.name}
          </span>
        </div>
        {node.children && expandedFolders.includes(node.id) && (
          <div className="flex flex-col">
            {renderFolderTree(node.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  const handleContinue = () => {
    if (currentStep === 'setup' && (selectedTemplates.length > 0 || uploadedFiles.length > 0)) {
      setCurrentStep('placement');
      // Trigger coachmarks after a small delay for animation
      setTimeout(() => setActiveCoachmark(1), 600);
    } else {
      onContinue?.(selectedTemplates[0] || uploadedFiles[0] || "[Envelope Name]");
    }
  };

  const hasDocuments = selectedTemplates.length > 0 || uploadedFiles.length > 0;
  const hasValidRecipients = recipients.some(r => r.user !== null);
  const canContinue = hasDocuments && hasValidRecipients;
  const isAddRecipientDisabled = recipients.length > 0 && recipients[0].user === null;

  const isUploadMode = uploadedFiles.length > 0;

  // New Placement UI based on screenshot
  if (currentStep === 'placement') {
    // Determine current active recipient to show in sidebar
    const activeSigner = recipients.find(r => r.user !== null);
    const isCC = activeSigner?.action === 'CC recipient';
    // Logic: Do not show name if person is a CC recipient
    const displayName = isCC ? 'CC recipient' : (activeSigner?.user?.name || 'Sarah Jenkins');

    return (
      <div className="flex flex-col h-screen bg-[#F9FAFB] overflow-hidden text-[#1e293b]">
        {/* Placement Header */}
        <header className="h-14 border-b border-slate-200 px-4 flex items-center justify-between shrink-0 bg-white z-[100]">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 6C7 6 4 9 4 12C4 15 7 18 7 18" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 6C12 6 9 9 9 12C9 15 12 18 12 18" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
                <path d="M17 6C17 6 14 9 14 12C14 15 17 18 17 18" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center space-x-2 cursor-pointer group">
              <span className="text-sm font-semibold text-slate-700">Tools</span>
              <ChevronDown size={14} className="text-slate-500" />
            </div>
          </div>

          <div className="flex-1 max-w-2xl px-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search or jump to" 
                className="w-full bg-[#f1f5f9] border-none rounded-md py-2 pl-10 pr-4 text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <HelpCircle size={18} className="text-slate-500 cursor-pointer" />
            <Accessibility size={18} className="text-slate-500 cursor-pointer" />
            <div className="p-1 border border-slate-200 rounded text-slate-500"><FileText size={18} /></div>
            <Bell size={18} className="text-slate-500 cursor-pointer" />
            <Globe size={18} className="text-slate-500 cursor-pointer" />
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center space-x-3 cursor-pointer">
              <span className="text-sm text-slate-600 font-medium">Acme</span>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
                <img src="https://picsum.photos/id/177/100/100" alt="Avatar" />
              </div>
            </div>
          </div>
        </header>

        {/* Sub Header */}
        <div className="h-12 border-b border-slate-100 flex items-center justify-between px-4 shrink-0 bg-white">
          <div className="flex items-center space-x-2 ml-4">
            <span className="text-sm font-bold text-slate-800">[Envelope Name]</span>
            <Pencil size={14} className="text-slate-400 cursor-pointer" />
          </div>
          <div className="flex items-center space-x-4 mr-4">
            <button onClick={() => setCurrentStep('setup')} className="flex items-center space-x-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
              <LogOut size={16} />
              <span>Save and exit</span>
            </button>
            <MoreVertical size={16} className="text-slate-500 cursor-pointer" />
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Fields Sidebar */}
          <div className="w-64 border-r border-slate-200 bg-white flex flex-col p-5 space-y-6 shrink-0 relative">
            <div>
              <h3 className="text-[12px] font-bold text-slate-500 mb-4 uppercase tracking-widest">Fields</h3>
              
              {/* Recipient Dropdown */}
              <div className="relative">
                <div 
                  ref={recipientSelectorRef}
                  className="border-2 border-[#14B8A6] rounded-xl px-4 py-2 flex items-center justify-between bg-white cursor-pointer hover:bg-slate-50 shadow-sm transition-all mb-6"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                      <User size={14} />
                    </div>
                    <span className="text-sm font-medium text-slate-800 truncate">{displayName}</span>
                  </div>
                  <ChevronDown size={14} className="text-slate-400 shrink-0" />
                </div>

                {activeCoachmark === 1 && (
                  <div className="absolute left-[105%] top-[-8px] z-[210]">
                     <Coachmark 
                        title="Switch recipients"
                        content="You can switch recipients to add fields here."
                        onNext={() => setActiveCoachmark(2)}
                        onClose={() => setActiveCoachmark(null)}
                     />
                  </div>
                )}
              </div>

              {/* Field Types */}
              <div ref={fieldsContainerRef} className="space-y-3 relative">
                <div className="flex items-center justify-between border border-slate-200 p-3.5 rounded-xl cursor-grab bg-white hover:border-slate-300 transition-all group">
                  <div className="flex items-center space-x-3">
                    <Type size={18} className="text-slate-700" />
                    <span className="text-sm font-bold text-slate-800">Text</span>
                  </div>
                  <GripVertical size={16} className="text-slate-300 group-hover:text-slate-400" />
                </div>
                <div className="flex items-center justify-between border border-slate-200 p-3.5 rounded-xl cursor-grab bg-white hover:border-slate-300 transition-all group">
                  <div className="flex items-center space-x-3">
                    <PenTool size={18} className="text-slate-700" />
                    <span className="text-sm font-bold text-slate-800">Signature</span>
                  </div>
                  <GripVertical size={16} className="text-slate-300 group-hover:text-slate-400" />
                </div>
                <div className="flex items-center justify-between border border-slate-200 p-3.5 rounded-xl cursor-grab bg-white hover:border-slate-300 transition-all group">
                  <div className="flex items-center space-x-3">
                    <Calendar size={18} className="text-slate-700" />
                    <span className="text-sm font-bold text-slate-800">Date signed</span>
                  </div>
                  <GripVertical size={16} className="text-slate-300 group-hover:text-slate-400" />
                </div>
                <div className="flex items-center justify-between border border-slate-200 p-3.5 rounded-xl cursor-grab bg-white hover:border-slate-300 transition-all group">
                  <div className="flex items-center space-x-3">
                    <CheckSquare size={18} className="text-slate-700" />
                    <span className="text-sm font-bold text-slate-800">Checkbox</span>
                  </div>
                  <GripVertical size={16} className="text-slate-300 group-hover:text-slate-400" />
                </div>

                {activeCoachmark === 2 && (
                  <div className="absolute left-[105%] top-0 z-[210]">
                     <Coachmark 
                        title="Drag and drop fields"
                        content="you need to drag and drop the fields into the canvas to finish the setup."
                        onNext={() => setActiveCoachmark(null)}
                        onClose={() => setActiveCoachmark(null)}
                        isLast
                     />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Document Viewer */}
          <div className="flex-1 bg-[#F1F5F9] flex flex-col relative overflow-hidden">
             {/* Toolbar */}
             <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 py-1.5 px-4 flex items-center justify-start space-x-4">
               <div className="flex items-center space-x-1 border border-slate-200 rounded px-2 py-1 bg-white text-[12px] font-bold">
                 <span>256%</span>
                 <ChevronDown size={14} className="text-slate-400" />
               </div>
               <div className="flex items-center bg-white border border-slate-200 rounded overflow-hidden">
                 <button className="p-1.5 hover:bg-slate-50 border-r border-slate-200 text-slate-400"><Minus size={14} /></button>
                 <button className="p-1.5 hover:bg-slate-50 text-slate-400"><Plus size={14} /></button>
               </div>
               <button className="p-1.5 text-slate-400 hover:text-slate-600"><Hand size={18} /></button>
               <div className="flex-1"></div>
               <button className="p-1.5 text-slate-400 hover:text-slate-600"><Search size={18} /></button>
             </div>

             <div className="flex-1 overflow-y-auto p-12 custom-scrollbar flex flex-col items-center">
                <div className="max-w-[850px] w-full bg-white shadow-xl min-h-[1100px] p-24 text-[15px] leading-relaxed text-slate-800 border border-slate-100 relative">
                  
                  {/* Colorful Spinner Loader Icon as per screenshot */}
                  <div className="flex justify-center mb-12">
                    <div className="relative w-16 h-16">
                      {[...Array(8)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`absolute w-1.5 h-4 rounded-full opacity-80`}
                          style={{
                            transform: `rotate(${i * 45}deg) translateY(-18px)`,
                            backgroundColor: i % 3 === 0 ? '#EC4899' : i % 3 === 1 ? '#6366F1' : '#14B8A6',
                            left: 'calc(50% - 0.75px)',
                            top: 'calc(50% - 2px)',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <h1 className="text-center font-bold mb-10 text-lg uppercase tracking-tight">PROPRIETARY INFORMATION AND INVENTIONS AGREEMENT<br/><span className="normal-case">(California employees)</span></h1>
                  
                  <p className="mb-6">
                    The following confirms and memorializes an agreement that 
                    <VariableChip label="Business legal name" color="blue" />
                    , (the “Company”) and I (
                    <VariableChip label="Full name" color="blue" />
                    ) have had since the commencement of my employment (which term, for purposes of this agreement, shall be deemed to include any relationship of service to the Company that I may have had prior to actually becoming an employee) with the Company in any capacity and that is and has been a material part of the consideration for my employment by Company:
                  </p>

                  <div className="space-y-6">
                    <p>1. I have not entered into, and I agree I will not enter into, any agreement either written or oral in conflict with this Agreement or my employment with Company. I will not violate any agreement with or rights of any third party or, except as expressly authorized by Company in writing hereafter, use or disclose my own or any third party’s confidential information or intellectual property...</p>
                    <p>2. Company shall own all right, title and interest (including patent rights, copyrights, trade secret rights, mask work rights, <span className="underline decoration-red-500 decoration-dotted">sui generis</span> database rights and all other intellectual property rights of any sort throughout the world) relating to any and all inventions (whether or not patentable), works of authorship, mask works, designs, know-how, ideas and information made or conceived or reduced to practice, in whole or in part, by me during the term of my employment with Company...</p>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Placement Footer */}
        <footer className="h-16 border-t border-slate-200 px-8 flex items-center justify-between shrink-0 bg-white z-[100]">
          <button onClick={() => setCurrentStep('setup')} className="flex items-center space-x-2 text-sm font-bold text-slate-700 hover:text-slate-900">
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>
          <button 
            onClick={() => handleContinue()}
            className="font-bold px-10 py-3 rounded-xl bg-[#7A005D] text-white hover:opacity-90 shadow-lg transition-all"
          >
            Send
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen bg-white overflow-hidden text-[#1e293b] ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
      {/* Header */}
      <header className="h-14 border-b border-slate-200 px-4 flex items-center justify-between shrink-0 bg-white z-[100]">
        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 6C7 6 4 9 4 12C4 15 7 18 7 18" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 6C12 6 9 9 9 12C9 15 12 18 12 18" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
              <path d="M17 6C17 6 14 9 14 12C14 15 17 18 17 18" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="flex items-center space-x-2 cursor-pointer group">
            <span className="text-sm font-semibold text-slate-700">Tools</span>
            <ChevronDown size={14} className="text-slate-500" />
          </div>
        </div>

        <div className="flex-1 max-w-2xl px-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search or jump to" 
              className="w-full bg-[#f1f5f9] border-none rounded-md py-2 pl-10 pr-4 text-sm outline-none"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <HelpCircle size={18} className="text-slate-500 cursor-pointer" />
          <Accessibility size={18} className="text-slate-500 cursor-pointer" />
          <CheckSquare size={18} className="text-slate-500 cursor-pointer" />
          <Bell size={18} className="text-slate-500 cursor-pointer" />
          <Globe size={18} className="text-slate-500 cursor-pointer" />
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <div className="flex items-center space-x-3 cursor-pointer">
            <span className="text-sm text-slate-600 font-medium">Acme</span>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
              <img src="https://picsum.photos/id/177/100/100" alt="Avatar" />
            </div>
          </div>
        </div>
      </header>

      {/* Sub-Header */}
      <div className="h-12 border-b border-slate-100 flex items-center justify-between px-4 shrink-0 bg-white z-[90]">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-slate-800">[Envelope Name]</span>
          <Pencil size={14} className="text-slate-400 cursor-pointer hover:text-slate-600" />
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={onExit} className="flex items-center space-x-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
            <LogOut size={16} />
            <span>Save and exit</span>
          </button>
          <MoreVertical size={16} className="text-slate-500 cursor-pointer" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div 
          className="bg-slate-50/10 overflow-y-auto overflow-x-hidden custom-scrollbar p-6 space-y-4 shrink-0" 
          style={{ width: `${leftWidth}px`, minWidth: `${leftWidth}px`, maxWidth: `${leftWidth}px` }}
        >
          {/* Documents Section */}
          <div className="border border-slate-200 rounded-2xl overflow-visible shadow-sm bg-white relative">
            <button 
              onClick={() => toggleSection('documents')}
              className="w-full flex items-center justify-between p-5 bg-white text-left group rounded-t-2xl"
            >
              <h3 className="font-bold text-lg text-slate-800">Documents</h3>
              {isExpanded('documents') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            
            {isExpanded('documents') && (
              <div className="px-5 pb-6 space-y-6">
                <div className={`space-y-2 relative ${uploadedFiles.length > 0 ? 'opacity-50 pointer-events-none' : ''}`} ref={dropdownRef}>
                  <label className="text-sm font-bold text-slate-800">Select a template</label>
                  <div 
                    onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
                    className="w-full border border-slate-200 rounded-lg min-h-[44px] p-2.5 flex flex-wrap items-center gap-2 cursor-pointer bg-white"
                  >
                    {selectedTemplates.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 flex-1 max-h-[96px] overflow-hidden">
                        {selectedTemplates.map(t => (
                          <span key={t} className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded flex items-center max-w-full truncate">
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm flex-1">Search</span>
                    )}
                    <div className="flex items-center space-x-1 ml-auto">
                      {selectedTemplates.length > 0 && (
                        <button 
                          onClick={clearTemplates}
                          className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                          title="Clear selection"
                        >
                          <X size={14} />
                        </button>
                      )}
                      <ChevronDown size={14} className="text-slate-400" />
                    </div>
                  </div>

                  {isTemplateMenuOpen && (
                    <div className="absolute z-[110] top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                      <div className="py-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {TEMPLATES.map((tpl) => (
                          <div 
                            key={tpl}
                            onClick={(e) => { e.stopPropagation(); toggleTemplate(tpl); }}
                            className="flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 cursor-pointer group"
                          >
                            <span className="text-sm text-slate-800 font-medium truncate pr-4">{tpl}</span>
                            {selectedTemplates.includes(tpl) && <Check size={16} className="text-blue-600 flex-shrink-0 ml-auto" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className={`space-y-2 ${selectedTemplates.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                  <label className="text-sm font-bold text-slate-800">Or upload existing documents <span className="text-red-500">*</span></label>
                  <div 
                    className={`border-2 border-dashed border-slate-200 rounded-2xl p-4 min-h-[68px] flex items-center bg-white relative ${uploadedFiles.length > 0 ? 'border-slate-300' : 'bg-slate-50/20'}`}
                  >
                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center border border-slate-200 rounded-lg overflow-hidden h-9 bg-white shadow-sm max-w-full">
                          <span className="px-3.5 text-[13px] font-medium text-slate-800 border-r border-slate-200 h-full flex items-center bg-slate-50/30 truncate">
                            {file}
                          </span>
                          <button 
                            onClick={(e) => removeFile(idx, e)}
                            className="px-2.5 h-full hover:bg-slate-50 transition-colors flex items-center justify-center shrink-0"
                          >
                            <X size={16} className="text-slate-500" />
                          </button>
                        </div>
                      ))}
                      
                      {uploadedFiles.length > 0 ? (
                        <button 
                          onClick={addFile}
                          className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 p-1.5 rounded-full transition-all shrink-0"
                        >
                          <CirclePlus size={20} />
                        </button>
                      ) : (
                        <div 
                          onClick={addFile}
                          className="flex-1 flex flex-col items-center justify-center py-2 cursor-pointer"
                        >
                          <p className="text-sm text-slate-400 font-medium">Drop or select a file (file.type)</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 text-slate-400 shrink-0">
                      <Camera size={20} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recipients Section */}
          <div className="border border-slate-200 rounded-2xl shadow-sm bg-white relative">
            <button onClick={() => toggleSection('recipients')} className="w-full flex items-center justify-between p-5 bg-white text-left group rounded-t-2xl">
              <div>
                <h3 className="font-bold text-lg text-slate-800 leading-tight">Add recipients</h3>
                <p className="text-sm text-slate-500 mt-1">Add people to send documents to</p>
              </div>
              {isExpanded('recipients') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            
            {isExpanded('recipients') && (
              <div className="px-5 pb-6 space-y-4">
                <div className="flex items-center space-x-3 text-slate-500">
                  <input type="checkbox" className="w-5 h-5 rounded-md border-slate-300 cursor-pointer text-purple-900 focus:ring-purple-200" />
                  <span className="text-sm font-medium text-slate-500">Enable signing order</span>
                </div>

                <div className="space-y-4">
                  {recipients.map((recipient, index) => (
                    <div key={recipient.id} className="border border-slate-200 rounded-2xl p-6 bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-900">Recipient<span className="text-red-500">*</span></label>
                        {recipients.length > 1 && (
                          <button onClick={() => removeRecipient(recipient.id)} className="text-[11px] text-red-500 font-bold uppercase hover:underline">Remove</button>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3 relative">
                        <div className="flex-1 relative min-w-0">
                          {recipient.user ? (
                            <div className="flex items-center border border-slate-200 rounded-xl px-4 py-2 bg-white h-12 shadow-sm">
                              <div className="flex items-center space-x-3 min-w-0">
                                <div className="w-7 h-7 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 bg-slate-50 overflow-hidden shrink-0">
                                  <User size={16} />
                                </div>
                                <span className="text-sm font-medium text-slate-800 truncate">{recipient.user.name}</span>
                              </div>
                              <button onClick={() => updateRecipient(recipient.id, { user: null })} className="ml-auto p-1 hover:bg-slate-100 rounded-full shrink-0">
                                <X size={14} className="text-slate-400" />
                              </button>
                            </div>
                          ) : (
                            <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                              <input 
                                type="text" 
                                value={recipient.searchTerm}
                                onChange={(e) => updateRecipient(recipient.id, { searchTerm: e.target.value, isSearching: e.target.value.length > 0 })}
                                placeholder="Enter recipient email" 
                                className="w-full border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm outline-none h-12 shadow-sm"
                              />
                              {recipient.isSearching && (
                                <div className="absolute z-[110] top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                                   {MOCK_USERS.filter(u => u.name.toLowerCase().includes(recipient.searchTerm.toLowerCase())).map(user => (
                                     <div key={user.id} onClick={() => updateRecipient(recipient.id, { user, searchTerm: '', isSearching: false })} className="px-4 py-2 hover:bg-slate-50 cursor-pointer">
                                       <p className="text-sm font-bold text-slate-800">{user.name}</p>
                                       <p className="text-xs text-slate-500">{user.email}</p>
                                     </div>
                                   ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="relative flex-1 min-w-0">
                          <button 
                            onClick={() => updateRecipient(recipient.id, { isActionDropdownOpen: !recipient.isActionDropdownOpen })}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2 flex items-center justify-between bg-white h-12 shadow-sm hover:bg-slate-50 transition-all"
                          >
                            <span className="text-sm font-medium text-slate-800 truncate">{recipient.action}</span>
                            <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${recipient.isActionDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {recipient.isActionDropdownOpen && (
                            <div className="absolute z-[110] top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                              <div 
                                onClick={() => updateRecipient(recipient.id, { action: 'Needs to complete', isActionDropdownOpen: false })}
                                className="px-5 py-3 text-sm hover:bg-slate-50 cursor-pointer font-medium text-slate-700"
                              >
                                Needs to complete
                              </div>
                              <div 
                                onClick={() => updateRecipient(recipient.id, { action: 'CC recipient', isActionDropdownOpen: false })}
                                className="px-5 py-3 text-sm hover:bg-slate-50 cursor-pointer font-medium text-slate-700"
                              >
                                CC recipient
                              </div>
                            </div>
                          )}
                        </div>

                        <button className="p-1.5 text-slate-400 hover:text-slate-600 shrink-0">
                          <MoreVertical size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleAddRecipient}
                  disabled={isAddRecipientDisabled}
                  className={`flex items-center space-x-2 px-4 py-2.5 border rounded-xl text-sm font-bold transition-all shadow-sm w-fit shrink-0 ${
                    isAddRecipientDisabled 
                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-60' 
                    : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <CirclePlus size={18} className={isAddRecipientDisabled ? 'text-slate-300' : 'text-slate-800'} />
                  <span>Add recipient</span>
                </button>
              </div>
            )}
          </div>

          {/* Destination Folder Section */}
          <div className="border border-slate-200 rounded-2xl shadow-sm bg-white relative">
            <button onClick={() => toggleSection('destination')} className="w-full flex items-center justify-between p-5 bg-white text-left rounded-t-2xl">
              <h3 className="font-bold text-lg text-slate-800">Destination folder</h3>
              {isExpanded('destination') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {isExpanded('destination') && (
              <div className="px-5 pb-6 space-y-6">
                <div className="space-y-2 relative" ref={locationRef}>
                  <label className="text-sm font-bold text-slate-900">Location</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      readOnly
                      onClick={() => setIsLocationMenuOpen(!isLocationMenuOpen)}
                      value={selectedFolder || ""}
                      placeholder="Choose folder" 
                      className="w-full border border-slate-200 rounded-xl py-3 pl-12 pr-10 text-sm outline-none h-11 cursor-pointer shadow-sm"
                    />
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  {isLocationMenuOpen && (
                    <div className="absolute z-[110] top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                      <div className="py-2 max-h-[300px] overflow-y-auto custom-scrollbar">{renderFolderTree(FOLDER_STRUCTURE)}</div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-slate-800 group cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 rounded-md border-slate-300 cursor-pointer" />
                  <span className="text-sm font-medium">Save completed document to recipients' profile</span>
                </div>
              </div>
            )}
          </div>

          {/* Custom Message Section */}
          <div className="border border-slate-200 rounded-2xl shadow-sm bg-white relative">
            <button 
              onClick={() => toggleSection('customMessage')} 
              className="w-full flex items-center justify-between p-5 bg-white text-left rounded-t-2xl"
            >
              <div>
                <h3 className="font-bold text-lg text-slate-800 leading-tight">Add custom message</h3>
                <p className="text-sm text-slate-400 mt-1">Insert a custom note for the recipient(s)</p>
              </div>
              {isExpanded('customMessage') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            
            {isExpanded('customMessage') && (
              <div className="px-5 pb-6 space-y-6">
                {/* Mode Toggle */}
                <div className="flex border border-slate-200 rounded-xl p-1 bg-white shadow-sm overflow-hidden">
                  <button 
                    onClick={() => setMessageMode('edit')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                      messageMode === 'edit' ? 'bg-[#7A005D] text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => setMessageMode('preview')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                      messageMode === 'preview' ? 'bg-[#7A005D] text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Preview
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Subject Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-800">
                      Subject<span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:ring-1 focus:ring-slate-300 shadow-sm"
                    />
                  </div>

                  {/* Body Field with Toolbar */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-800">
                      Body <span className="text-red-500">*</span>
                    </label>
                    
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col min-h-[220px]">
                      {/* Toolbar */}
                      <div className="px-4 py-2 border-b border-slate-100 flex flex-wrap items-center gap-1.5 bg-slate-50/10">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"><Undo2 size={16} /></button>
                          <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"><Redo2 size={16} /></button>
                        </div>
                        <div className="h-5 w-px bg-slate-200 mx-1"></div>
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 text-slate-800 hover:bg-slate-100 rounded transition-colors"><Bold size={16} /></button>
                          <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"><Italic size={16} /></button>
                          <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors"><MoreVertical size={16} /></button>
                        </div>
                        <div className="h-5 w-px bg-slate-200 mx-1"></div>
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded flex flex-col items-center">
                            <Baseline size={16} />
                            <div className="w-3 h-0.5 bg-[#7A005D] mt-0.5"></div>
                          </button>
                          <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"><Pencil size={16} /></button>
                          <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"><Eraser size={16} /></button>
                        </div>
                        <div className="h-5 w-px bg-slate-200 mx-1"></div>
                        <div className="flex items-center space-x-1 border border-slate-200 rounded px-2 py-0.5 bg-white cursor-pointer hover:bg-slate-50">
                          <span className="text-[12px] font-medium text-slate-700">Normal text</span>
                          <ChevronDown size={12} className="text-slate-400" />
                        </div>
                        <div className="h-5 w-px bg-slate-200 mx-1"></div>
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"><Minus size={14} /></button>
                          <div className="px-2 py-0.5 border border-slate-200 rounded text-[12px] font-bold text-slate-700 min-w-[32px] text-center">15</div>
                          <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"><Plus size={14} /></button>
                        </div>
                        <div className="h-5 w-px bg-slate-200 mx-1"></div>
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded flex items-center">
                            <AlignLeft size={16} />
                            <ChevronDown size={12} className="ml-1 text-slate-300" />
                          </button>
                          <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"><List size={16} /></button>
                          <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded flex items-center">
                            <ListOrdered size={16} />
                            <ChevronDown size={12} className="ml-1 text-slate-300" />
                          </button>
                          <div className="h-5 w-px bg-slate-200 mx-1"></div>
                          <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded flex items-center">
                            <div className="relative">
                               <GripVertical size={14} className="rotate-90" />
                               <ChevronDown size={12} className="ml-1 text-slate-300" />
                            </div>
                          </button>
                        </div>
                        <div className="h-5 w-px bg-slate-200 mx-1"></div>
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"><Link size={16} /></button>
                          <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"><ImageIcon size={16} /></button>
                          <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded flex items-center">
                            <CirclePlus size={16} />
                            <ChevronDown size={12} className="ml-1 text-slate-300" />
                          </button>
                        </div>
                        <div className="h-5 w-px bg-slate-200 mx-1"></div>
                        <button className="flex items-center space-x-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-900 hover:bg-slate-50 transition-colors shadow-sm ml-auto">
                           <Zap size={14} className="text-slate-900 fill-slate-900" />
                           <span>Insert variable</span>
                        </button>
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 p-4">
                        <textarea 
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          className="w-full h-full text-sm text-slate-500 outline-none resize-none custom-scrollbar leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div 
          onMouseDown={startResizing}
          className={`w-1.5 hover:w-2 hover:bg-blue-400 bg-slate-200 cursor-col-resize transition-all h-full z-50 flex items-center justify-center group ${isResizing ? 'bg-blue-500 w-2' : ''}`}
        >
          <div className={`w-px h-10 bg-slate-400 group-hover:bg-white ${isResizing ? 'bg-white' : ''}`} />
        </div>

        <div className="flex-1 bg-[#f8fafc] flex flex-col p-8 overflow-y-auto custom-scrollbar relative">
          <div className="max-w-4xl mx-auto w-full flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Preview</h2>
            {totalPages > 0 && (
              <div className="flex items-center space-x-3 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm">
                <button disabled={currentPreviewPage === 1} onClick={() => setCurrentPreviewPage(p => Math.max(1, p - 1))} className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronLeft size={16} /></button>
                <span className="text-[12px] font-bold text-slate-700 min-w-[50px] text-center">{currentPreviewPage} of {totalPages}</span>
                <button disabled={currentPreviewPage === totalPages} onClick={() => setCurrentPreviewPage(p => Math.min(totalPages, p + 1))} className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            )}
          </div>
          
          {(selectedTemplates.length > 0 || uploadedFiles.length > 0) ? (
            <div className="space-y-6 max-w-4xl mx-auto w-full">
              {/* Requirement: In preview section, if uploaded, NO recipients section */}
              {!isUploadMode && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <button onClick={() => setIsPreviewRecipientsExpanded(!isPreviewRecipientsExpanded)} className="w-full flex items-center justify-between p-5 text-left bg-white">
                    <span className="font-bold text-lg text-slate-900">Recipients</span>
                    {isPreviewRecipientsExpanded ? <ChevronUp size={20} className="text-slate-900" /> : <ChevronDown size={20} className="text-slate-900" />}
                  </button>
                  {isPreviewRecipientsExpanded && (
                    <div className="border-t border-slate-100 flex flex-col">
                      {recipients.map((r, i) => (
                        <div key={r.id} className="px-6 py-4 flex items-center space-x-4 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                            {r.user ? <img src={`https://i.pravatar.cc/150?u=${r.user.id}`} className="w-full h-full rounded-full object-cover" alt="" /> : <User size={20} />}
                          </div>
                          <div>
                            <p className="text-base font-bold text-slate-900 leading-tight">{r.user ? r.user.name : `Recipient ${i + 1}`}</p>
                            <p className="text-sm text-slate-500 font-medium">{r.action}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="relative group bg-white border border-slate-200 rounded-2xl shadow-sm p-12 min-h-[1000px] text-[15px] leading-relaxed text-slate-800 transition-all cursor-default">
                {/* Requirement: Users do not have the option to edit the document when hovering over preview IF UPLOADED */}
                {!isUploadMode && (
                  <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-start pt-32 rounded-2xl z-20 pointer-events-none group-hover:pointer-events-auto backdrop-blur-[0.5px]">
                    <button onClick={onEditDocument} className="bg-white text-slate-900 font-bold px-6 py-3 rounded-xl shadow-2xl border border-slate-200 flex items-center space-x-3 hover:scale-105 active:scale-95 transition-all">
                      <Pencil size={18} className="text-slate-600" />
                      <span>Edit document</span>
                    </button>
                  </div>
                )}

                <h1 className="text-2xl font-bold text-center mb-10">
                  {selectedTemplates.length > 0 ? selectedTemplates[currentPreviewPage - 1] : uploadedFiles[currentPreviewPage - 1]}
                </h1>
                
                <p className="mb-6">
                  Effective <VariableChip label="Start date" />, , <VariableChip label="Contractor Name" /> ("Consultant") and <VariableChip label="Business legal name" /> ("Company") agree as follows:
                </p>

                <div className="space-y-6 text-slate-600">
                  <p>1. Services; Payment; No Violation of Rights or Obligations.</p>
                  <p>Consultant agrees to undertake and complete the Services (as defined in Exhibit A) in accordance with and on the schedule specified in Exhibit A. As the only consideration due Consultant regarding the subject matter of this Agreement, Company will pay Consultant in accordance with Exhibit A.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
              <FileText size={32} className="text-slate-300 mb-4" />
              <p className="text-slate-400 text-base font-medium">No template selected or file uploaded</p>
            </div>
          )}
        </div>
      </div>

      <footer className="h-16 border-t border-slate-200 px-8 flex items-center justify-end shrink-0 bg-white z-[100]">
        <button 
          onClick={handleContinue}
          disabled={!canContinue}
          className={`font-bold px-10 py-3 rounded-xl border transition-all ${
            canContinue
            ? 'bg-[#7A005D] text-white border-[#7A005D] hover:opacity-90 shadow-lg' 
            : 'bg-[#f8fafc] text-slate-300 border-slate-100 cursor-not-allowed'
          }`}
        >
          {currentStep === 'setup' && uploadedFiles.length > 0 ? 'Continue' : 'Send'}
        </button>
      </footer>
    </div>
  );
};

export default EnvelopeCreator;