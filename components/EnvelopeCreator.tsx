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
import type { UploadedFileItem } from '../types';

interface EnvelopeCreatorProps {
  onExit: () => void;
  onEditDocument?: () => void;
  onCreateTemplate?: () => void;
  onContinue?: (envelopeName: string) => void;
  state?: any;
  onUpdateState?: (state: any) => void;
}

const HR_UPLOAD_SAMPLES: Omit<UploadedFileItem, 'id'>[] = [
  {
    name: 'Remote_Work_Acknowledgment_v3.pdf',
    previewTitle: 'Remote work expectations',
    previewParagraphs: [
      'By signing below, you acknowledge receipt of Acme’s Remote Work Policy, including equipment care, data security, and core collaboration hours for your team.',
      'You agree to maintain a secure home workspace and to report lost or stolen company devices to IT within twenty-four hours.',
    ],
  },
  {
    name: 'Benefits_Enrollment_Summary_2026.pdf',
    previewTitle: 'Annual benefits enrollment summary',
    previewParagraphs: [
      'This summary highlights medical, dental, vision, and voluntary life coverage effective on your eligibility date. Detailed plan documents are available in Rippling.',
      'Election changes are binding for the plan year unless you experience a qualifying life event approved under IRS guidelines.',
    ],
  },
  {
    name: 'Anti_Harassment_Certification.pdf',
    previewTitle: 'Workplace conduct certification',
    previewParagraphs: [
      'I certify that I have reviewed Acme’s Anti-Harassment and Non-Discrimination Policy and understand my obligation to report concerns promptly.',
      'I understand that retaliation against anyone who reports in good faith is strictly prohibited and may result in disciplinary action up to termination.',
    ],
  },
  {
    name: 'PTO_and_Leave_Policy.pdf',
    previewTitle: 'Paid time off and leave',
    previewParagraphs: [
      'Eligible employees accrue PTO per the schedule in Exhibit A. Requests should be submitted at least two weeks in advance when practicable.',
      'Family and medical leave may be available under federal or state law; contact People Ops for jurisdiction-specific guidance.',
    ],
  },
  {
    name: 'Confidentiality_Reminder_HR.pdf',
    previewTitle: 'Ongoing confidentiality obligations',
    previewParagraphs: [
      'This reminder supplements your Proprietary Information Agreement. Do not share customer lists, roadmaps, compensation data, or unreleased product details outside Acme.',
      'Questions about what may be shared in demos or interviews should be routed through Legal before disclosure.',
    ],
  },
  {
    name: 'I9_Reverification_Checklist.pdf',
    previewTitle: 'Employment eligibility reverification',
    previewParagraphs: [
      'Use this checklist when an employee’s work authorization requires reverification. Complete Section 3 of Form I-9 no later than the expiration date shown on their documentation.',
      'If reverification is not completed on time, pause the employee’s systems access and notify People Ops immediately.',
    ],
  },
  {
    name: 'Performance_Review_Cycle_Q2.pdf',
    previewTitle: 'Q2 performance review acknowledgment',
    previewParagraphs: [
      'Managers will share written feedback and growth goals by the published deadline. Employees may add comments and self-assessment materials in Rippling.',
      'Final ratings are calibrated across departments; your manager will schedule a one-on-one to discuss outcomes and next steps.',
    ],
  },
  {
    name: 'Workplace_Safety_Briefing.pdf',
    previewTitle: 'General safety briefing',
    previewParagraphs: [
      'Report hazards, injuries, or near-misses to your manager and the safety alias without delay. Emergency exits and muster points are posted on each floor.',
      'Personal protective equipment is required in marked lab and warehouse zones; training must be completed before access is granted.',
    ],
  },
];

const pickRandomUpload = (existing: UploadedFileItem[]): UploadedFileItem => {
  const used = new Set(existing.map((f) => f.name));
  const pool = HR_UPLOAD_SAMPLES.filter((s) => !used.has(s.name));
  const base = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : HR_UPLOAD_SAMPLES[Math.floor(Math.random() * HR_UPLOAD_SAMPLES.length)];
  return { ...base, id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}` };
};

const DisabledWithTooltip: React.FC<{ message: string; children: React.ReactNode }> = ({ message, children }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <div
        className="absolute inset-0 z-10 cursor-not-allowed rounded-[inherit]"
        aria-hidden
      />
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-lg text-[13px] text-slate-600 max-w-[280px] text-center z-20 pointer-events-none leading-snug">
          {message}
        </div>
      )}
    </div>
  );
};

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

const RECIPIENT_DRAG_TYPE = 'application/x-recipient-id';

function removeIdFromGroups(groups: string[][], id: string): string[][] {
  return groups.map((g) => g.filter((x) => x !== id)).filter((g) => g.length > 0);
}

function mergeIntoRecipient(groups: string[][], draggedId: string, targetId: string): string[][] {
  if (draggedId === targetId) return groups;
  const without = removeIdFromGroups(groups, draggedId);
  const ti = without.findIndex((gr) => gr.includes(targetId));
  if (ti < 0) return groups;
  return without.map((gr, i) => (i === ti ? [...gr, draggedId] : gr));
}

function insertSoloBeforeRecipient(groups: string[][], draggedId: string, beforeRecipientId: string): string[][] {
  if (draggedId === beforeRecipientId) return groups;
  const without = removeIdFromGroups(groups, draggedId);
  const ti = without.findIndex((gr) => gr.includes(beforeRecipientId));
  if (ti < 0) return [...without, [draggedId]];
  return [...without.slice(0, ti), [draggedId], ...without.slice(ti)];
}

function appendSoloGroup(groups: string[][], draggedId: string): string[][] {
  return [...removeIdFromGroups(groups, draggedId), [draggedId]];
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
  step: number;
  isLast?: boolean;
}> = ({ title, content, onNext, onClose, step, isLast }) => (
  <div className="absolute z-[200] w-[280px] bg-white rounded-xl shadow-2xl border border-slate-100 p-5 animate-in fade-in zoom-in-95 duration-200">
    <div className="absolute -left-2 top-6 w-4 h-4 bg-white border-l border-b border-slate-100 rotate-45" />
    <div className="flex justify-between items-start mb-2">
      <h4 className="text-[14px] font-bold text-slate-900">{title}</h4>
      <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors">
        <X size={16} />
      </button>
    </div>
    <p className="text-[13px] text-slate-600 leading-relaxed mb-6">{content}</p>
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">STEP {step} OF 2</span>
      <button 
        onClick={onNext}
        className="px-5 py-1.5 bg-[#7A005D] text-white rounded-lg text-xs font-bold hover:opacity-90 shadow-sm transition-all"
      >
        {isLast ? 'Got it' : 'Next'}
      </button>
    </div>
  </div>
);

const EnvelopeCreator: React.FC<EnvelopeCreatorProps> = ({ 
  onExit, 
  onEditDocument, 
  onCreateTemplate,
  onContinue,
  state: persistentState,
  onUpdateState
}) => {
  const [currentStep, setCurrentStep] = useState<'setup' | 'placement'>('setup');
  const [expandedSections, setExpandedSections] = useState<string[]>(['documents', 'recipients', 'destination', 'customMessage']);
  const [leftWidth, setLeftWidth] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  
  // Use state from props if available, otherwise local defaults
  const selectedTemplates = persistentState?.selectedTemplates || [];
  const uploadedFiles = persistentState?.uploadedFiles || [];
  const recipients = persistentState?.recipients || [{ id: '1', user: null, action: 'Needs to complete', isSearching: false, searchTerm: '', isActionDropdownOpen: false }];
  const selectedFolder = persistentState?.selectedFolder || 'All documents';
  const signingOrderEnabled = persistentState?.signingOrderEnabled ?? false;
  const signingOrderGroups: string[][] = persistentState?.signingOrderGroups ?? [];

  const updateState = (updates: any) => {
    onUpdateState?.({
      selectedTemplates,
      uploadedFiles,
      recipients,
      selectedFolder,
      signingOrderEnabled,
      signingOrderGroups,
      ...updates
    });
  };

  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['root', 'f1']); 
  const [isPreviewRecipientsExpanded, setIsPreviewRecipientsExpanded] = useState(false);
  const [currentPreviewPage, setCurrentPreviewPage] = useState(1);
  const [messageMode, setMessageMode] = useState<'edit' | 'preview'>('edit');
  const [subject, setSubject] = useState('Action required for documents');
  const [body, setBody] = useState('Please review and send the documents\n• {Document names}');
  const [activeCoachmark, setActiveCoachmark] = useState<number | null>(null);
  const [draggingRecipientId, setDraggingRecipientId] = useState<string | null>(null);
  const [signingOrderSummaryOpen, setSigningOrderSummaryOpen] = useState(false);

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
    const next = selectedTemplates.includes(tpl) ? selectedTemplates.filter(t => t !== tpl) : [...selectedTemplates, tpl];
    updateState({ selectedTemplates: next });
    if (currentPreviewPage > next.length && next.length > 0) {
      setCurrentPreviewPage(next.length);
    } else if (next.length === 1) {
      setCurrentPreviewPage(1);
    }
  };

  const clearTemplates = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateState({ selectedTemplates: [] });
    setCurrentPreviewPage(1);
  };

  const addFile = () => {
    if (selectedTemplates.length > 0) return;
    updateState({ uploadedFiles: [...uploadedFiles, pickRandomUpload(uploadedFiles)] });
  };

  const removeFile = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = uploadedFiles.filter((_, i) => i !== idx);
    updateState({ uploadedFiles: next });
    if (currentPreviewPage > next.length) {
      setCurrentPreviewPage(Math.max(1, next.length));
    }
  };

  const handleAddRecipient = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const next = [...recipients, { 
      id: newId, 
      user: null, 
      action: 'Needs to complete', 
      isSearching: false, 
      searchTerm: '',
      isActionDropdownOpen: false
    }];
    const nextGroups = signingOrderEnabled
      ? [...signingOrderGroups, [newId]]
      : signingOrderGroups;
    updateState({ recipients: next, signingOrderGroups: nextGroups });
  };

  const updateRecipient = (id: string, updates: Partial<RecipientSlot>) => {
    const next = recipients.map(r => r.id === id ? { ...r, ...updates } : r);
    updateState({ recipients: next });
  };

  const removeRecipient = (id: string) => {
    const next = recipients.filter(r => r.id !== id);
    const nextGroups = signingOrderGroups.map((g) => g.filter((x) => x !== id)).filter((g) => g.length > 0);
    updateState({ recipients: next, signingOrderGroups: nextGroups });
  };

  const setSigningOrderCheckbox = (enabled: boolean) => {
    if (enabled) {
      updateState({
        signingOrderEnabled: true,
        signingOrderGroups: recipients.map((r) => [r.id]),
      });
    } else {
      updateState({ signingOrderEnabled: false });
    }
  };

  const getOrderedRecipients = (): RecipientSlot[] => {
    if (!signingOrderEnabled || signingOrderGroups.length === 0) return recipients;
    return signingOrderGroups
      .flat()
      .map((id) => recipients.find((r) => r.id === id))
      .filter((r): r is RecipientSlot => r != null);
  };

  const recipientDisplayLabel = (r: RecipientSlot) =>
    r.user?.name || (r.searchTerm?.trim() ? r.searchTerm : '') || 'Recipient';

  const applyGroups = (nextGroups: string[][]) => {
    updateState({ signingOrderGroups: nextGroups });
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
            updateState({ selectedFolder: node.name });
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
    if (currentStep === 'setup' && uploadedFiles.length > 0) {
      setCurrentStep('placement');
      setTimeout(() => setActiveCoachmark(1), 600);
    } else {
      onContinue?.(selectedTemplates[0] || uploadedFiles[0]?.name || "[Envelope Name]");
    }
  };

  const hasDocuments = selectedTemplates.length > 0 || uploadedFiles.length > 0;
  const hasValidRecipients = recipients.some(r => r.user !== null);
  const canContinue = hasDocuments && hasValidRecipients;
  const isAddRecipientDisabled = recipients.length > 0 && recipients[0].user === null;

  const isUploadMode = uploadedFiles.length > 0;

  if (currentStep === 'placement') {
    const activeSigner = recipients.find(r => r.user !== null);
    const isCC = activeSigner?.action === 'CC recipient';
    const displayName = isCC ? 'CC recipient' : (activeSigner?.user?.name || 'David Gonzales');

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
          <div className="w-64 border-r border-slate-200 bg-white flex flex-col p-5 space-y-6 shrink-0 relative">
            <div>
              <h3 className="text-[12px] font-bold text-slate-500 mb-4 uppercase tracking-widest">Fields</h3>
              
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
                        step={1}
                        onNext={() => setActiveCoachmark(2)}
                        onClose={() => setActiveCoachmark(null)}
                     />
                  </div>
                )}
              </div>

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
                        step={2}
                        onNext={() => setActiveCoachmark(null)}
                        onClose={() => setActiveCoachmark(null)}
                        isLast
                     />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Document Preview */}
          <div className="flex-1 bg-[#F1F5F9] flex flex-col relative overflow-hidden">
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
                    The following confirms and memorializes an agreement that <VariableChip label="Business legal name" color="blue" />, (the “Company”) and I (<VariableChip label="Full name" color="blue" />) have had since the commencement of my employment with the Company in any capacity and that is and has been a material part of the consideration for my employment by Company:
                  </p>
                  <div className="space-y-6">
                    <p>1. I have not entered into, and I agree I will not enter into, any agreement either written or oral in conflict with this Agreement or my employment with Company...</p>
                    <p>2. Company shall own all right, title and interest (including patent rights, copyrights, trade secret rights, mask work rights, sui generis database rights and all other intellectual property rights of any sort throughout the world)...</p>
                  </div>
                </div>
             </div>
          </div>
        </div>

        <footer className="h-16 border-t border-slate-200 px-8 flex items-center justify-between shrink-0 bg-white z-[100]">
          <button onClick={() => setCurrentStep('setup')} className="flex items-center space-x-2 text-sm font-bold text-slate-700 hover:text-slate-900">
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>
          <button onClick={() => handleContinue()} className="font-bold px-10 py-3 rounded-xl bg-[#7A005D] text-white hover:opacity-90 shadow-lg transition-all">Send</button>
        </footer>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen bg-white overflow-hidden text-[#1e293b] ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
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
            <input type="text" placeholder="Search or jump to" className="w-full bg-[#f1f5f9] border-none rounded-md py-2 pl-10 pr-4 text-sm outline-none" />
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
          <div className="border border-slate-200 rounded-2xl overflow-visible shadow-sm bg-white relative">
            <button onClick={() => toggleSection('documents')} className="w-full flex items-center justify-between p-5 bg-white text-left group rounded-t-2xl">
              <h3 className="font-bold text-lg text-slate-800">Documents</h3>
              {isExpanded('documents') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {isExpanded('documents') && (
              <div className="px-5 pb-6 space-y-6">
                <div className="space-y-2 relative rounded-lg" ref={dropdownRef}>
                  <label className="text-sm font-bold text-slate-800">select templates</label>
                  {uploadedFiles.length > 0 ? (
                    <DisabledWithTooltip message="Remove uploaded documents to allow selecting documents">
                      <div className="rounded-lg">
                        <div className="w-full border border-slate-200 rounded-lg min-h-[44px] p-2.5 flex flex-wrap items-center gap-2 bg-slate-50 opacity-50">
                          {selectedTemplates.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 flex-1 max-h-[96px] overflow-hidden">
                              {selectedTemplates.map(t => (
                                <span key={t} className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded flex items-center max-w-full truncate">{t}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm flex-1">Search</span>
                          )}
                          <ChevronDown size={14} className="text-slate-400 shrink-0" />
                        </div>
                      </div>
                    </DisabledWithTooltip>
                  ) : (
                    <>
                      <div
                        onClick={() => uploadedFiles.length === 0 && setIsTemplateMenuOpen(!isTemplateMenuOpen)}
                        className="w-full border border-slate-200 rounded-lg min-h-[44px] p-2.5 flex flex-wrap items-center gap-2 cursor-pointer bg-white"
                      >
                        {selectedTemplates.length > 0 && (
                          <button
                            type="button"
                            onClick={clearTemplates}
                            className="shrink-0 p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            aria-label="Clear all selected templates"
                          >
                            <X size={16} />
                          </button>
                        )}
                        {selectedTemplates.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 flex-1 max-h-[96px] overflow-hidden min-w-0">
                            {selectedTemplates.map(t => (
                              <span key={t} className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded flex items-center max-w-full truncate">{t}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm flex-1">Search</span>
                        )}
                        <ChevronDown size={14} className="text-slate-400 shrink-0" />
                      </div>
                      {isTemplateMenuOpen && (
                        <div className="absolute z-[110] top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col max-h-[320px] overflow-hidden">
                          <div className="py-2 overflow-y-auto custom-scrollbar min-h-0 flex-1">
                            {TEMPLATES.map((tpl) => (
                              <div key={tpl} onClick={(e) => { e.stopPropagation(); toggleTemplate(tpl); }} className="flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 cursor-pointer">
                                <span className="text-sm text-slate-800 font-medium truncate pr-4">{tpl}</span>
                                {selectedTemplates.includes(tpl) && <Check size={16} className="text-blue-600 ml-auto shrink-0" />}
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-slate-200 shrink-0 bg-white">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsTemplateMenuOpen(false);
                                onCreateTemplate?.();
                              }}
                              className="w-full text-left px-5 py-3 text-sm font-semibold text-blue-600 hover:bg-slate-50 transition-colors"
                            >
                              Create a template
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="space-y-2 rounded-2xl">
                  <label className="text-sm font-bold text-slate-800">Or upload existing documents <span className="text-red-500">*</span></label>
                  {selectedTemplates.length > 0 ? (
                    <DisabledWithTooltip message="Remove selected templates to allow uploading documents">
                      <div className="rounded-2xl">
                        <div className={`border-2 border-dashed border-slate-200 rounded-2xl p-4 min-h-[68px] flex items-center bg-slate-50 opacity-50 relative`}>
                          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                            {uploadedFiles.map((file, idx) => (
                              <div key={file.id} className="flex items-center border border-slate-200 rounded-lg overflow-hidden h-9 bg-white shadow-sm max-w-full">
                                <span className="px-3.5 text-[13px] font-medium text-slate-800 border-r border-slate-200 h-full flex items-center bg-slate-50/30 truncate">{file.name}</span>
                                <button type="button" onClick={(e) => removeFile(idx, e)} className="px-2.5 h-full hover:bg-slate-50"><X size={16} className="text-slate-500" /></button>
                              </div>
                            ))}
                            <div className="flex-1 flex flex-col items-center justify-center py-2">
                              <p className="text-sm text-slate-400 font-medium">Drop or select a file (file.type)</p>
                            </div>
                          </div>
                          <div className="ml-4 text-slate-400 shrink-0"><Camera size={20} /></div>
                        </div>
                      </div>
                    </DisabledWithTooltip>
                  ) : (
                    <div className={`border-2 border-dashed border-slate-200 rounded-2xl p-4 min-h-[68px] flex items-center bg-white relative ${uploadedFiles.length > 0 ? 'border-slate-300' : 'bg-slate-50/20'}`}>
                      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                        {uploadedFiles.map((file, idx) => (
                          <div key={file.id} className="flex items-center border border-slate-200 rounded-lg overflow-hidden h-9 bg-white shadow-sm max-w-full">
                            <span className="px-3.5 text-[13px] font-medium text-slate-800 border-r border-slate-200 h-full flex items-center bg-slate-50/30 truncate">{file.name}</span>
                            <button type="button" onClick={(e) => removeFile(idx, e)} className="px-2.5 h-full hover:bg-slate-50"><X size={16} className="text-slate-500" /></button>
                          </div>
                        ))}
                        <button type="button" onClick={addFile} className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 p-1.5 rounded-full transition-all shrink-0">
                          {uploadedFiles.length > 0 ? <CirclePlus size={20} /> : <div className="flex-1 flex flex-col items-center justify-center py-2 cursor-pointer w-full"><p className="text-sm text-slate-400 font-medium">Drop or select a file (file.type)</p></div>}
                        </button>
                      </div>
                      <div className="ml-4 text-slate-400 shrink-0"><Camera size={20} /></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="border border-slate-200 rounded-2xl shadow-sm bg-white relative">
            <button onClick={() => toggleSection('recipients')} className="w-full flex items-center justify-between p-5 bg-white text-left group rounded-t-2xl">
              <div><h3 className="font-bold text-lg text-slate-800 leading-tight">Add recipients</h3><p className="text-sm text-slate-500 mt-1">Add people to send documents to</p></div>
              {isExpanded('recipients') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {isExpanded('recipients') && (
              <div className="px-5 pb-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center space-x-3 text-slate-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={signingOrderEnabled}
                      onChange={(e) => setSigningOrderCheckbox(e.target.checked)}
                      className="w-5 h-5 rounded-md border-slate-300 cursor-pointer accent-[#7A005D] focus:ring-[#7A005D]/30"
                    />
                    <span className="text-sm font-medium">Set signing order</span>
                  </label>
                  {signingOrderEnabled && (
                    <button
                      type="button"
                      onClick={() => setSigningOrderSummaryOpen(true)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline shrink-0"
                    >
                      View order
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  {signingOrderEnabled ? (
                    <>
                      {signingOrderGroups.map((group, gi) => (
                        <div
                          key={gi}
                          className={group.length > 1 ? 'border-l-4 border-[#7A005D] pl-3 rounded-l-lg' : ''}
                        >
                          {group.map((rid) => {
                            const recipient = recipients.find((r) => r.id === rid);
                            if (!recipient) return null;
                            const stepNum = gi + 1;
                            const parallel = group.length > 1;
                            return (
                              <React.Fragment key={rid}>
                                <div
                                  className={`h-2 rounded-md transition-colors ${draggingRecipientId ? 'bg-slate-100/80' : ''}`}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'move';
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const dragId = e.dataTransfer.getData(RECIPIENT_DRAG_TYPE);
                                    if (!dragId) return;
                                    applyGroups(insertSoloBeforeRecipient(signingOrderGroups, dragId, rid));
                                    setDraggingRecipientId(null);
                                  }}
                                />
                                <div
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'move';
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const dragId = e.dataTransfer.getData(RECIPIENT_DRAG_TYPE);
                                    if (!dragId || dragId === rid) return;
                                    applyGroups(mergeIntoRecipient(signingOrderGroups, dragId, rid));
                                    setDraggingRecipientId(null);
                                  }}
                                  className={`border border-slate-200 rounded-2xl p-6 bg-white space-y-3 mb-3 transition-opacity ${draggingRecipientId === rid ? 'opacity-60' : ''}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-slate-900">Recipient<span className="text-red-500">*</span></label>
                                    {recipients.length > 1 && (
                                      <button type="button" onClick={() => removeRecipient(recipient.id)} className="text-[11px] text-red-500 font-bold uppercase">Remove</button>
                                    )}
                                  </div>
                                  <div className="flex items-start space-x-3 relative">
                                    <div
                                      draggable
                                      onDragStart={(e) => {
                                        e.dataTransfer.setData(RECIPIENT_DRAG_TYPE, recipient.id);
                                        e.dataTransfer.effectAllowed = 'move';
                                        setDraggingRecipientId(recipient.id);
                                      }}
                                      onDragEnd={() => setDraggingRecipientId(null)}
                                      className="shrink-0 p-2 mt-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
                                      title="Drag to reorder or combine signing steps"
                                    >
                                      <GripVertical size={20} />
                                    </div>
                                    <div className={`shrink-0 w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center shadow-sm mt-1 ${parallel ? 'bg-[#7A005D]' : 'bg-blue-600'}`}>
                                      {stepNum}
                                    </div>
                                    <div className="flex-1 flex items-center space-x-3 relative min-w-0 flex-wrap sm:flex-nowrap">
                                      <div className="flex-1 relative min-w-[140px]">
                                        {recipient.user ? (
                                          <div className="flex items-center border border-slate-200 rounded-xl px-4 py-2 bg-white h-12 shadow-sm">
                                            <div className="flex items-center space-x-3 min-w-0">
                                              <div className="w-7 h-7 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 bg-slate-50 overflow-hidden shrink-0"><User size={16} /></div>
                                              <span className="text-sm font-medium text-slate-800 truncate">{recipient.user.name}</span>
                                            </div>
                                            <button type="button" onClick={() => updateRecipient(recipient.id, { user: null })} className="ml-auto p-1 hover:bg-slate-100 rounded-full shrink-0"><X size={14} className="text-slate-400" /></button>
                                          </div>
                                        ) : (
                                          <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                            <input type="text" value={recipient.searchTerm} onChange={(e) => updateRecipient(recipient.id, { searchTerm: e.target.value, isSearching: e.target.value.length > 0 })} placeholder="Name" className="w-full border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm h-12" />
                                            {recipient.isSearching && (
                                              <div className="absolute z-[110] top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                                                {MOCK_USERS.filter(u => u.name.toLowerCase().includes(recipient.searchTerm.toLowerCase())).map(user => (
                                                  <div key={user.id} onClick={() => updateRecipient(recipient.id, { user, searchTerm: '', isSearching: false })} className="px-4 py-2 hover:bg-slate-50 cursor-pointer">
                                                    <p className="text-sm font-bold text-slate-800">{user.name}</p><p className="text-xs text-slate-500">{user.email}</p>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <div className="relative flex-1 min-w-[140px]">
                                        <button type="button" onClick={() => updateRecipient(recipient.id, { isActionDropdownOpen: !recipient.isActionDropdownOpen })} className="w-full border border-slate-200 rounded-xl px-4 py-2 flex items-center justify-between bg-white h-12">
                                          <span className="text-sm font-medium text-slate-800 truncate">{recipient.action}</span>
                                          <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${recipient.isActionDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {recipient.isActionDropdownOpen && (
                                          <div className="absolute z-[110] top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl">
                                            <div onClick={() => updateRecipient(recipient.id, { action: 'Needs to complete', isActionDropdownOpen: false })} className="px-5 py-3 text-sm hover:bg-slate-50 cursor-pointer font-medium text-slate-700">Needs to complete</div>
                                            <div onClick={() => updateRecipient(recipient.id, { action: 'CC recipient', isActionDropdownOpen: false })} className="px-5 py-3 text-sm hover:bg-slate-50 cursor-pointer font-medium text-slate-700">CC recipient</div>
                                          </div>
                                        )}
                                      </div>
                                      <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600 shrink-0 mt-1"><MoreVertical size={20} /></button>
                                    </div>
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      ))}
                      <div
                        className={`h-2 rounded-md ${draggingRecipientId ? 'bg-slate-100/80' : ''}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const dragId = e.dataTransfer.getData(RECIPIENT_DRAG_TYPE);
                          if (!dragId) return;
                          applyGroups(appendSoloGroup(signingOrderGroups, dragId));
                          setDraggingRecipientId(null);
                        }}
                      />
                    </>
                  ) : (
                    <div className="space-y-4">
                      {recipients.map((recipient) => (
                        <div key={recipient.id} className="border border-slate-200 rounded-2xl p-6 bg-white space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-slate-900">Recipient<span className="text-red-500">*</span></label>
                            {recipients.length > 1 && <button type="button" onClick={() => removeRecipient(recipient.id)} className="text-[11px] text-red-500 font-bold uppercase">Remove</button>}
                          </div>
                          <div className="flex items-center space-x-3 relative">
                            <div className="flex-1 relative min-w-0">
                              {recipient.user ? (
                                <div className="flex items-center border border-slate-200 rounded-xl px-4 py-2 bg-white h-12 shadow-sm">
                                  <div className="flex items-center space-x-3 min-w-0">
                                    <div className="w-7 h-7 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 bg-slate-50 overflow-hidden shrink-0"><User size={16} /></div>
                                    <span className="text-sm font-medium text-slate-800 truncate">{recipient.user.name}</span>
                                  </div>
                                  <button type="button" onClick={() => updateRecipient(recipient.id, { user: null })} className="ml-auto p-1 hover:bg-slate-100 rounded-full shrink-0"><X size={14} className="text-slate-400" /></button>
                                </div>
                              ) : (
                                <div className="relative">
                                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                  <input type="text" value={recipient.searchTerm} onChange={(e) => updateRecipient(recipient.id, { searchTerm: e.target.value, isSearching: e.target.value.length > 0 })} placeholder="Enter recipient email" className="w-full border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm h-12" />
                                  {recipient.isSearching && (
                                    <div className="absolute z-[110] top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                                      {MOCK_USERS.filter(u => u.name.toLowerCase().includes(recipient.searchTerm.toLowerCase())).map(user => (
                                        <div key={user.id} onClick={() => updateRecipient(recipient.id, { user, searchTerm: '', isSearching: false })} className="px-4 py-2 hover:bg-slate-50 cursor-pointer">
                                          <p className="text-sm font-bold text-slate-800">{user.name}</p><p className="text-xs text-slate-500">{user.email}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="relative flex-1 min-w-0">
                              <button type="button" onClick={() => updateRecipient(recipient.id, { isActionDropdownOpen: !recipient.isActionDropdownOpen })} className="w-full border border-slate-200 rounded-xl px-4 py-2 flex items-center justify-between bg-white h-12">
                                <span className="text-sm font-medium text-slate-800 truncate">{recipient.action}</span>
                                <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${recipient.isActionDropdownOpen ? 'rotate-180' : ''}`} />
                              </button>
                              {recipient.isActionDropdownOpen && (
                                <div className="absolute z-[110] top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl">
                                  <div onClick={() => updateRecipient(recipient.id, { action: 'Needs to complete', isActionDropdownOpen: false })} className="px-5 py-3 text-sm hover:bg-slate-50 cursor-pointer font-medium text-slate-700">Needs to complete</div>
                                  <div onClick={() => updateRecipient(recipient.id, { action: 'CC recipient', isActionDropdownOpen: false })} className="px-5 py-3 text-sm hover:bg-slate-50 cursor-pointer font-medium text-slate-700">CC recipient</div>
                                </div>
                              )}
                            </div>
                            <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600 shrink-0"><MoreVertical size={20} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="button" onClick={handleAddRecipient} disabled={isAddRecipientDisabled} className={`flex items-center space-x-2 px-4 py-2.5 border rounded-xl text-sm font-bold transition-all ${isAddRecipientDisabled ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'}`}>
                  <CirclePlus size={18} /><span>Add recipient</span>
                </button>

                {signingOrderSummaryOpen && (
                  <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/30 p-4" onClick={() => setSigningOrderSummaryOpen(false)} role="presentation">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="signing-order-title">
                      <h4 id="signing-order-title" className="font-bold text-lg text-slate-900 mb-4">Signing order</h4>
                      <ol className="space-y-3 list-decimal list-inside text-sm text-slate-700">
                        {signingOrderGroups.map((g, i) => (
                          <li key={i} className="leading-relaxed">
                            <span className="font-semibold text-slate-900">Step {i + 1}:</span>{' '}
                            {g.map((id) => {
                              const r = recipients.find((x) => x.id === id);
                              return r ? recipientDisplayLabel(r) : 'Recipient';
                            }).join(', ')}
                          </li>
                        ))}
                      </ol>
                      <button type="button" className="mt-6 w-full py-2.5 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-slate-200" onClick={() => setSigningOrderSummaryOpen(false)}>Close</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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
                    <input type="text" readOnly onClick={() => setIsLocationMenuOpen(!isLocationMenuOpen)} value={selectedFolder} className="w-full border border-slate-200 rounded-xl py-3 pl-12 pr-10 text-sm h-11 cursor-pointer" />
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
          {/* Custom Message Section (Hidden for brevity, same as previous) */}
        </div>

        <div onMouseDown={startResizing} className={`w-1.5 hover:w-2 hover:bg-blue-400 bg-slate-200 cursor-col-resize h-full z-50 flex items-center justify-center ${isResizing ? 'bg-blue-500 w-2' : ''}`}>
          <div className={`w-px h-10 bg-slate-400 ${isResizing ? 'bg-white' : ''}`} />
        </div>

        <div className="flex-1 bg-[#f8fafc] flex flex-col p-8 overflow-y-auto custom-scrollbar relative">
          <div className="max-w-4xl mx-auto w-full flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Preview</h2>
            {totalPages > 0 && (
              <div className="flex items-center space-x-3 bg-white border border-slate-200 rounded-lg px-2 py-1">
                <button disabled={currentPreviewPage === 1} onClick={() => setCurrentPreviewPage(p => Math.max(1, p - 1))} className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronLeft size={16} /></button>
                <span className="text-[12px] font-bold text-slate-700 min-w-[50px] text-center">{currentPreviewPage} of {totalPages}</span>
                <button disabled={currentPreviewPage === totalPages} onClick={() => setCurrentPreviewPage(p => Math.min(totalPages, p + 1))} className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            )}
          </div>
          {(selectedTemplates.length > 0 || uploadedFiles.length > 0) ? (
            <div className="space-y-6 max-w-4xl mx-auto w-full">
              {!isUploadMode && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <button onClick={() => setIsPreviewRecipientsExpanded(!isPreviewRecipientsExpanded)} className="w-full flex items-center justify-between p-5 text-left bg-white font-bold text-lg text-slate-900">
                    <span>Recipients</span>{isPreviewRecipientsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {isPreviewRecipientsExpanded && (
                    <div className="border-t border-slate-100 flex flex-col">
                      {getOrderedRecipients().map((r: RecipientSlot, i: number) => (
                        <div key={r.id} className="px-6 py-4 flex items-center space-x-4 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">{r.user ? <img src={`https://i.pravatar.cc/150?u=${r.user.id}`} className="w-full h-full rounded-full" alt="" /> : <User size={20} />}</div>
                          <div>
                            <p className="text-base font-bold text-slate-900 leading-tight">{r.user ? r.user.name : `Recipient ${i + 1}`}</p>
                            <p className="text-sm text-slate-500 font-medium">
                              {r.action}
                              {signingOrderEnabled && signingOrderGroups.length > 0 && (() => {
                                const gi = signingOrderGroups.findIndex((gr) => gr.includes(r.id));
                                return gi >= 0 ? ` · Step ${gi + 1}` : '';
                              })()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="relative group bg-white border border-slate-200 rounded-2xl shadow-sm p-12 min-h-[1000px] text-[15px] leading-relaxed text-slate-800 transition-all cursor-default">
                {!isUploadMode && (
                  <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-start pt-32 rounded-2xl z-20 pointer-events-none group-hover:pointer-events-auto backdrop-blur-[0.5px]">
                    <button onClick={onEditDocument} className="bg-white text-slate-900 font-bold px-6 py-3 rounded-xl shadow-2xl border border-slate-200 flex items-center space-x-3 hover:scale-105 transition-all">
                      <Pencil size={18} className="text-slate-600" /><span>Edit document</span>
                    </button>
                  </div>
                )}
                <h1 className="text-2xl font-bold text-center mb-10">
                  {selectedTemplates.length > 0
                    ? selectedTemplates[currentPreviewPage - 1]
                    : uploadedFiles[currentPreviewPage - 1]?.previewTitle}
                </h1>
                {isUploadMode ? (
                  <div className="space-y-5 text-slate-700">
                    {(uploadedFiles[currentPreviewPage - 1]?.previewParagraphs ?? []).map((para, i) => (
                      <p key={i} className="leading-relaxed">{para}</p>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="mb-6">Effective <VariableChip label="Start date" />, , <VariableChip label="Contractor Name" /> ("Consultant") and <VariableChip label="Business legal name" /> ("Company") agree as follows:</p>
                    <div className="space-y-6 text-slate-600"><p>1. Services; Payment; No Violation of Rights or Obligations.</p><p>Consultant agrees to undertake and complete the Services (as defined in Exhibit A)...</p></div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50"><FileText size={32} className="text-slate-300 mb-4" /><p className="text-slate-400 text-base font-medium">No template selected or file uploaded</p></div>
          )}
        </div>
      </div>

      <footer className="h-16 border-t border-slate-200 px-8 flex items-center justify-end shrink-0 bg-white z-[100]">
        <button onClick={handleContinue} disabled={!canContinue} className={`font-bold px-10 py-3 rounded-xl border transition-all ${canContinue ? 'bg-[#7A005D] text-white border-[#7A005D] hover:opacity-90 shadow-lg' : 'bg-[#f8fafc] text-slate-300 border-slate-100 cursor-not-allowed'}`}>
          {currentStep === 'setup' && uploadedFiles.length > 0 ? 'Continue' : 'Send'}
        </button>
      </footer>
    </div>
  );
};

export default EnvelopeCreator;