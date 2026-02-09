
import React from 'react';
import { 
  X, 
  ChevronDown, 
  HelpCircle, 
  Accessibility, 
  MessageSquare, 
  Bell, 
  Globe, 
  Search,
  Undo2,
  Redo2,
  Printer,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Baseline,
  Eraser,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Indent,
  Link,
  Image,
  Video,
  GripVertical,
  Type,
  Square,
  PenTool,
  Calendar,
  Grid,
  Plus,
  Minus,
  User,
  LayoutGrid,
  SquareCheck,
  Zap
} from 'lucide-react';

interface TemplateEditorProps {
  onExit: () => void;
  onGoHome?: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ onExit, onGoHome }) => {
  return (
    <div className="flex flex-col h-screen bg-[#F9FAFB] text-[#1e293b] font-sans overflow-hidden">
      {/* --- Tier 1: Global Rippling Header --- */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-[100]">
        <div className="flex items-center space-x-6">
          <div 
            className="flex items-center text-slate-900 cursor-pointer hover:opacity-70 transition-opacity" 
            onClick={onGoHome}
            title="Go to Home"
          >
             <div className="flex items-center font-bold text-lg tracking-tight uppercase">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1e293b]">
                  <path d="M7 6C7 6 4 9 4 12C4 15 7 18 7 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 6C12 6 9 9 9 12C9 15 12 18 12 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M17 6C17 6 14 9 14 12C14 15 17 18 17 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="ml-2">RIPPLING</span>
             </div>
          </div>
        </div>

        <div className="flex-1 max-w-2xl px-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search or jump to..." 
              className="w-full bg-slate-100 border-none rounded-md py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-slate-300 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <HelpCircle size={20} className="text-slate-500 cursor-pointer hover:text-slate-800 transition-colors" />
          <Accessibility size={20} className="text-slate-500 cursor-pointer hover:text-slate-800 transition-colors" />
          <MessageSquare size={20} className="text-slate-500 cursor-pointer hover:text-slate-800 transition-colors" />
          <Bell size={20} className="text-slate-500 cursor-pointer hover:text-slate-800 transition-colors" />
          <Globe size={20} className="text-slate-500 cursor-pointer hover:text-slate-800 transition-colors" />
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <div className="flex items-center space-x-3 cursor-pointer">
            <div className="text-right hidden sm:block">
              <span className="text-sm text-slate-700 font-semibold block leading-tight">Acme, Inc.</span>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
              <img src="https://picsum.photos/id/177/100/100" alt="Avatar" />
            </div>
          </div>
        </div>
      </header>

      {/* --- Tier 2: Template Header (Simplified Action Bar) --- */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center space-x-3">
          <h2 className="text-[15px] font-bold text-slate-900">[Envelope Templates Name]</h2>
        </div>
        <div className="flex items-center space-x-2">
          {/* New Buttons requested from image */}
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-900 hover:bg-slate-50 transition-colors shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h3m-1.5-1.5v3"/>
              <rect x="10" y="4" width="10" height="4" rx="0.5"/>
              <path d="M4 18h3"/>
              <rect x="10" y="16" width="10" height="4" rx="0.5"/>
            </svg>
            <span>Recipient fields</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-900 hover:bg-slate-50 transition-colors shadow-sm">
            <Zap size={16} className="fill-slate-900 text-slate-900" />
            <span>Insert variable</span>
          </button>
          <button className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-900 hover:bg-slate-50 transition-colors shadow-sm">
            Preview
          </button>
          <button className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-900 hover:bg-slate-50 transition-colors shadow-sm">
            Import
          </button>
          
          <button 
            onClick={onExit}
            className="px-8 py-2 bg-[#7A005D] text-white rounded-xl text-[14px] font-bold hover:opacity-95 transition-all shadow-md ml-2"
          >
            Save
          </button>
        </div>
      </div>

      {/* --- Editor Workspace --- */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Main Canvas Container */}
        <div className="flex-1 flex flex-col bg-slate-100/30 relative overflow-hidden">
          
          {/* Rich Text Toolbar */}
          <div className="bg-white border-b border-slate-200 px-6 py-1.5 flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center border-r border-slate-200 pr-2 gap-1">
              <button className="p-1.5 hover:bg-slate-100 rounded transition-colors" title="Undo"><Undo2 size={16} /></button>
              <button className="p-1.5 hover:bg-slate-100 rounded transition-colors" title="Redo"><Redo2 size={16} /></button>
              <button className="p-1.5 hover:bg-slate-100 rounded transition-colors" title="Print"><Printer size={16} /></button>
            </div>
            
            <div className="flex items-center border-r border-slate-200 pr-2 gap-2">
              <div className="flex items-center space-x-1 border border-slate-200 rounded-md px-2 py-1 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                <span className="text-[13px] font-medium min-w-[100px]">Normal text</span>
                <ChevronDown size={14} className="text-slate-400" />
              </div>
              <div className="flex items-center space-x-1 border border-slate-200 rounded-md px-2 py-1 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                <span className="text-[13px] font-medium min-w-[120px]">Rippling's Default</span>
                <ChevronDown size={14} className="text-slate-400" />
              </div>
            </div>

            <div className="flex items-center border-r border-slate-200 pr-2 gap-1">
              <button className="p-1 hover:bg-slate-100 rounded"><Minus size={14} /></button>
              <div className="border border-slate-200 rounded px-2 py-0.5 text-xs font-bold w-10 text-center">11</div>
              <button className="p-1 hover:bg-slate-100 rounded"><Plus size={14} /></button>
            </div>

            <div className="flex items-center border-r border-slate-200 pr-2 gap-1">
              <button className="p-1.5 hover:bg-slate-100 rounded font-bold"><Bold size={16} /></button>
              <button className="p-1.5 hover:bg-slate-100 rounded italic"><Italic size={16} /></button>
              <button className="p-1.5 hover:bg-slate-100 rounded underline"><Underline size={16} /></button>
              <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Code size={16} /></button>
            </div>

            <div className="flex items-center border-r border-slate-200 pr-2 gap-1">
              <button className="p-1.5 hover:bg-slate-100 rounded"><Baseline size={16} className="text-[#2563eb]" /></button>
              <button className="p-1.5 hover:bg-slate-100 rounded"><Baseline size={16} className="text-slate-800" /></button>
              <button className="p-1.5 hover:bg-slate-100 rounded"><Eraser size={16} /></button>
            </div>

            <div className="flex items-center border-r border-slate-200 pr-2 gap-1">
              <button className="p-1.5 hover:bg-slate-100 rounded"><AlignLeft size={16} /></button>
              <button className="p-1.5 hover:bg-slate-100 rounded"><AlignCenter size={16} /></button>
              <button className="p-1.5 hover:bg-slate-100 rounded"><AlignRight size={16} /></button>
            </div>

            <div className="flex items-center gap-1">
              <button className="p-1.5 hover:bg-slate-100 rounded"><List size={16} /></button>
              <button className="p-1.5 hover:bg-slate-100 rounded"><Indent size={16} className="rotate-180" /></button>
              <button className="p-1.5 hover:bg-slate-100 rounded"><Indent size={16} /></button>
            </div>
          </div>

          {/* Scrollable Document Canvas */}
          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
            <div className="max-w-[850px] mx-auto bg-white shadow-2xl min-h-[1100px] p-24 text-[15px] leading-relaxed text-slate-800 border border-slate-100">
              <h1 className="text-center font-bold mb-12 text-lg uppercase tracking-tight">CCPA Privacy Notice for Employees</h1>
              
              <p className="mb-6">
                <span className="inline-flex items-center bg-[#f1f5f9] border border-slate-200 rounded px-1.5 py-0.5 text-[12px] font-bold mx-1 text-slate-700">
                  BusinessLegalName <X size={10} className="ml-1 cursor-pointer text-slate-400" />
                </span> 
                (the “Company,” “we,” “us,” “our”) is providing this Privacy Notice (“Notice”) pursuant to the California Consumer Privacy Act (“CCPA”) to inform you about:
              </p>

              <ol className="list-decimal space-y-6 ml-8 text-slate-700">
                <li>
                  the Categories of Personal Information that Company collects through Rippling and integrated applications about employees, officers, directors, candidates, and contractors who reside in California (“Employees”); and,
                </li>
                <li>
                  the purposes for which the Company uses that Personal Information (“Purposes of Use”).
                </li>
              </ol>

              <p className="mt-8 mb-8 text-slate-700">
                If you do not reside in California, Company has decided to provide this notice as a courtesy to you. For purposes of this Notice, “Personal Information” means information that identifies, relates to, describes, is reasonably capable of being associated with, or could reasonably be linked, directly or indirectly, to an Employee who resides in California. Please contact . with any questions or if you would like an alternative form of this Notice.
              </p>

              <p className="font-bold mb-6 text-slate-800">For purposes of this Notice, “Purposes of Use” include, but are not limited to:</p>
              
              <ol className="list-decimal space-y-6 ml-8 text-slate-700">
                <li>
                  <span className="font-bold text-slate-800">Managing and Engaging Personnel:</span> to manage personnel matters, to set up a personnel file, to administer compensation, bonuses, equity grants, other forms of compensation, and benefits (as applicable, and as permitted by law), to manage vacation, sick leave, and other leaves of absence, to provide training, to evaluate job applicants, to evaluate job performance, to design and engage in career development and other employee engagement programs, to screen employees for risks to the Company, to conduct investigations, and for other general personnel management purposes.
                </li>
                <li>
                   <span className="font-bold text-slate-800">Security and Compliance:</span> to monitor use of Company information systems, to conduct internal audits, to conduct internal investigations, to protect the safety and security of Company's facilities and personnel, to manage reimbursement of business expenses, to ensure compliance with federal, state and local regulations, including occupational health and safety compliance, to obtain appropriate insurance coverages, including worker's compensation, to prevent illicit activity and report suspected criminal conduct to law enforcement and cooperate in investigations.
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* --- Right Sidebar: Recipient Fields --- */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0">
          <div className="p-5 flex items-center justify-between border-b border-slate-100">
            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Recipient Fields</span>
            <X size={18} className="text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
          </div>
          
          <div className="p-4 space-y-6">
            <div className="border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between bg-white hover:bg-slate-50 cursor-pointer shadow-sm transition-colors group">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-[#f3e5f5] group-hover:text-[#7A005D]">
                   <User size={14} />
                </div>
                <span className="text-sm font-bold text-slate-800">Employee</span>
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </div>

            <div className="space-y-3 pt-2">
               {/* Field Draggable Cards - Styled to match screenshot colors */}
               <div className="flex items-center justify-between bg-[#FDF2FB] border border-[#F5D0EE] p-3.5 rounded-xl cursor-grab active:cursor-grabbing hover:shadow-md transition-all group">
                  <div className="flex items-center space-x-3">
                    <Type size={18} className="text-[#7A005D]" />
                    <span className="text-[13px] font-bold text-[#7A005D]">Text</span>
                  </div>
                  <GripVertical size={16} className="text-[#F5D0EE] group-hover:text-[#7A005D] opacity-0 group-hover:opacity-100 transition-opacity" />
               </div>

               <div className="flex items-center justify-between bg-[#FDF2FB] border border-[#F5D0EE] p-3.5 rounded-xl cursor-grab active:cursor-grabbing hover:shadow-md transition-all group">
                  <div className="flex items-center space-x-3">
                    <SquareCheck size={18} className="text-[#7A005D]" />
                    <span className="text-[13px] font-bold text-[#7A005D]">Checkbox</span>
                  </div>
                  <GripVertical size={16} className="text-[#F5D0EE] group-hover:text-[#7A005D] opacity-0 group-hover:opacity-100 transition-opacity" />
               </div>

               <div className="flex items-center justify-between bg-[#FDF2FB] border border-[#F5D0EE] p-3.5 rounded-xl cursor-grab active:cursor-grabbing hover:shadow-md transition-all group">
                  <div className="flex items-center space-x-3">
                    <PenTool size={18} className="text-[#7A005D]" />
                    <span className="text-[13px] font-bold text-[#7A005D]">Signature</span>
                  </div>
                  <GripVertical size={16} className="text-[#F5D0EE] group-hover:text-[#7A005D] opacity-0 group-hover:opacity-100 transition-opacity" />
               </div>

               <div className="flex items-center justify-between bg-[#FDF2FB] border border-[#F5D0EE] p-3.5 rounded-xl cursor-grab active:cursor-grabbing hover:shadow-md transition-all group">
                  <div className="flex items-center space-x-3">
                    <Calendar size={18} className="text-[#7A005D]" />
                    <span className="text-[13px] font-bold text-[#7A005D]">Date signed</span>
                  </div>
                  <GripVertical size={16} className="text-[#F5D0EE] group-hover:text-[#7A005D] opacity-0 group-hover:opacity-100 transition-opacity" />
               </div>
            </div>
          </div>
        </div>

        {/* --- Far Right Utility Strip --- */}
        <div className="w-14 bg-white border-l border-slate-200 flex flex-col items-center py-4 space-y-6 shrink-0 z-20">
           <button className="p-2 bg-slate-100 rounded-lg text-slate-800 shadow-sm" title="Template Layout"><LayoutGrid size={20} /></button>
           <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors" title="Recipient Management"><User size={20} /></button>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
