import React from 'react';
import { 
  X, 
  ChevronDown, 
  // Added ChevronRight import to fix 'Cannot find name' error on line 200
  ChevronRight,
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
  Zap,
  AlignJustify
} from 'lucide-react';

interface TemplateEditorProps {
  onExit: () => void;
  onGoHome?: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ onExit, onGoHome }) => {
  return (
    <div className="flex flex-col h-screen bg-white text-[#1e293b] font-sans overflow-hidden">
      {/* --- Tier 1: Global Header --- */}
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
              className="w-full bg-[#f1f5f9] border-none rounded-md py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-slate-300 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <HelpCircle size={20} className="text-slate-400 cursor-pointer hover:text-slate-800 transition-colors" />
          <Accessibility size={20} className="text-slate-400 cursor-pointer hover:text-slate-800 transition-colors" />
          <div className="p-1 border border-slate-200 rounded">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <Bell size={20} className="text-slate-400 cursor-pointer hover:text-slate-800 transition-colors" />
          <Globe size={20} className="text-slate-400 cursor-pointer hover:text-slate-800 transition-colors" />
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <div className="flex items-center space-x-3 cursor-pointer">
            <span className="text-sm text-slate-700 font-semibold hidden sm:block">Acme, Inc.</span>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
              <img src="https://picsum.photos/id/177/100/100" alt="Avatar" />
            </div>
          </div>
        </div>
      </header>

      {/* --- Tier 2: Template Action Bar --- */}
      <div className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center space-x-3">
          <h2 className="text-[14px] font-bold text-slate-800">[Envelope Templates Name]</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
             <LayoutGrid size={16} className="text-slate-500" />
             <span>Recipient fields</span>
          </button>
          <button className="flex items-center space-x-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <Zap size={16} className="fill-slate-700 text-slate-700" />
            <span>Insert variable</span>
          </button>
          <button className="px-4 py-1.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-100 shadow-sm">
            Preview
          </button>
          <button className="px-4 py-1.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-100 shadow-sm">
            Import
          </button>
          <button 
            onClick={onExit}
            className="px-6 py-1.5 bg-[#7A005D] text-white rounded-xl text-[13px] font-bold hover:opacity-95 transition-all shadow-md ml-1"
          >
            Save
          </button>
        </div>
      </div>

      {/* --- Main Workspace --- */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#F3F4F6]/50">
          
          {/* Toolbar */}
          <div className="bg-white border-b border-slate-100 px-6 py-1 flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar shadow-sm">
            <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><Undo2 size={16} /></button>
            <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><Redo2 size={16} /></button>
            <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><Printer size={16} /></button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            
            <div className="flex items-center space-x-1 border border-slate-200 rounded px-2 py-0.5 bg-white cursor-pointer hover:bg-slate-50 min-w-[110px] justify-between">
              <span className="text-[12px] font-medium text-slate-700">Normal text</span>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
            <div className="flex items-center space-x-1 border border-slate-200 rounded px-2 py-0.5 bg-white cursor-pointer hover:bg-slate-50 min-w-[130px] justify-between">
              <span className="text-[12px] font-medium text-slate-700">Rippling's Default</span>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
            
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-1">
              <button className="p-1 text-slate-400 hover:bg-slate-100 rounded"><Minus size={14} /></button>
              <div className="px-2 py-0.5 border border-slate-200 rounded text-[12px] font-bold text-slate-700 min-w-[32px] text-center">11</div>
              <button className="p-1 text-slate-400 hover:bg-slate-100 rounded"><Plus size={14} /></button>
            </div>
            
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-0.5">
               <button className="p-1.5 hover:bg-slate-100 rounded font-bold text-slate-700"><Bold size={16} /></button>
               <button className="p-1.5 hover:bg-slate-100 rounded italic text-slate-700"><Italic size={16} /></button>
               <button className="p-1.5 hover:bg-slate-100 rounded underline text-slate-700"><Underline size={16} /></button>
               <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Code size={16} /></button>
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-0.5">
               <button className="p-1.5 hover:bg-slate-100 rounded flex flex-col items-center">
                  <Baseline size={16} className="text-[#2563eb]" />
                  <div className="w-3 h-0.5 bg-[#2563eb] mt-[1px]"></div>
               </button>
               <button className="p-1.5 hover:bg-slate-100 rounded flex flex-col items-center">
                  <Baseline size={16} className="text-slate-700" />
                  <div className="w-3 h-0.5 bg-slate-700 mt-[1px]"></div>
               </button>
               <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><Eraser size={16} /></button>
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-0.5">
               <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><AlignLeft size={16} /></button>
               <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><AlignCenter size={16} /></button>
               <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><AlignRight size={16} /></button>
               <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><AlignJustify size={16} /></button>
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-0.5">
               <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><List size={16} /></button>
               <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><ListOrdered size={16} /></button>
               <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500 flex items-center"><Indent size={16} /><ChevronDown size={10} className="ml-0.5" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
            <div className="max-w-[850px] mx-auto bg-white shadow-xl min-h-[1100px] p-24 text-[15px] leading-relaxed text-slate-800 border border-slate-100">
              <h1 className="text-center font-bold mb-12 text-lg uppercase tracking-tight">CCPA PRIVACY NOTICE FOR EMPLOYEES</h1>
              
              <p className="mb-6">
                <span className="inline-flex items-center bg-[#f1f5f9] border border-slate-200 rounded px-1.5 py-0.5 text-[12px] font-bold mx-1 text-slate-600">
                  BusinessLegalName <ChevronRight size={10} className="ml-1 text-slate-400" />
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
                If you do not reside in California, Company has decided to provide this notice as a courtesy to you. For purposes of this Notice, “Personal Information” means information that identifies, relates to, describes, is reasonably capable of being associated with...
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0">
          <div className="p-5 flex items-center justify-between border-b border-slate-100">
            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">RECIPIENT FIELDS</span>
            <X size={18} className="text-slate-300 cursor-pointer hover:text-slate-500 transition-colors" />
          </div>
          
          <div className="p-4 space-y-6">
            <div className="border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between bg-white hover:bg-slate-50 cursor-pointer shadow-sm transition-colors group">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                   <User size={14} />
                </div>
                <span className="text-[13px] font-bold text-slate-800">Employee</span>
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </div>

            <div className="space-y-3 pt-2">
               <div className="flex items-center justify-between bg-[#FDF2FB] border border-[#F5D0EE] p-3.5 rounded-xl cursor-grab active:cursor-grabbing hover:shadow-sm transition-all">
                  <div className="flex items-center space-x-3">
                    <Type size={18} className="text-[#7A005D]" />
                    <span className="text-[14px] font-bold text-[#7A005D]">Text</span>
                  </div>
                  <GripVertical size={16} className="text-[#F5D0EE]" />
               </div>

               <div className="flex items-center justify-between bg-[#FDF2FB] border border-[#F5D0EE] p-3.5 rounded-xl cursor-grab active:cursor-grabbing hover:shadow-sm transition-all">
                  <div className="flex items-center space-x-3">
                    <SquareCheck size={18} className="text-[#7A005D]" />
                    <span className="text-[14px] font-bold text-[#7A005D]">Checkbox</span>
                  </div>
                  <GripVertical size={16} className="text-[#F5D0EE]" />
               </div>

               <div className="flex items-center justify-between bg-[#FDF2FB] border border-[#F5D0EE] p-3.5 rounded-xl cursor-grab active:cursor-grabbing hover:shadow-sm transition-all">
                  <div className="flex items-center space-x-3">
                    <PenTool size={18} className="text-[#7A005D]" />
                    <span className="text-[14px] font-bold text-[#7A005D]">Signature</span>
                  </div>
                  <GripVertical size={16} className="text-[#F5D0EE]" />
               </div>

               <div className="flex items-center justify-between bg-[#FDF2FB] border border-[#F5D0EE] p-3.5 rounded-xl cursor-grab active:cursor-grabbing hover:shadow-sm transition-all">
                  <div className="flex items-center space-x-3">
                    <Calendar size={18} className="text-[#7A005D]" />
                    <span className="text-[14px] font-bold text-[#7A005D]">Date signed</span>
                  </div>
                  <GripVertical size={16} className="text-[#F5D0EE]" />
               </div>
            </div>
          </div>
        </div>

        {/* Far Right Utility Strip */}
        <div className="w-14 bg-white border-l border-slate-200 flex flex-col items-center py-4 space-y-6 shrink-0 z-20">
           <div className="p-2 border border-[#7A005D]/20 bg-[#7A005D]/5 rounded-lg text-[#7A005D] shadow-sm"><Grid size={20} /></div>
           <div className="p-2 text-slate-300 hover:text-slate-500 rounded-lg cursor-pointer transition-colors"><User size={20} /></div>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;