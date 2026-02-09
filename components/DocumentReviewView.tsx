
import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  HelpCircle, 
  Accessibility, 
  Bell, 
  MoreVertical, 
  LogOut, 
  UserPlus, 
  Download, 
  Settings,
  X,
  ChevronDown,
  Sparkles,
  MessageSquare
} from 'lucide-react';

interface DocumentReviewViewProps {
  onExit: () => void;
  onGoHome?: () => void;
}

const DocumentReviewView: React.FC<DocumentReviewViewProps> = ({ onExit, onGoHome }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#F3F4F6] overflow-hidden text-[#1e293b]">
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center space-x-6">
          <div 
            className="flex items-center cursor-pointer hover:opacity-70 transition-opacity" 
            onClick={onGoHome}
            title="Go to Home"
          >
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
              placeholder="Search or jump to..." 
              className="w-full bg-slate-100 border-none rounded-md py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-slate-300 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <HelpCircle size={18} className="text-slate-500 cursor-pointer" />
          <Accessibility size={18} className="text-slate-500 cursor-pointer" />
          <div className="relative">
            <div className="bg-white border border-slate-200 rounded p-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </div>
            <span className="absolute -top-1.5 -right-1.5 bg-[#EF4444] text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">4</span>
          </div>
          <Bell size={18} className="text-slate-500 cursor-pointer" />
          <div className="rotate-45">
            <div className="w-4 h-4 border-2 border-slate-500 rounded-sm"></div>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          <div className="flex items-center space-x-3 cursor-pointer">
            <span className="text-sm text-slate-700 font-semibold">Wright, Davis and Price</span>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
              <img src="https://picsum.photos/id/64/100/100" alt="Avatar" />
            </div>
          </div>
        </div>
      </header>

      {/* Sub Header */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-40">
        <h2 className="text-sm font-bold text-slate-900">Comprehensive Project Oversight and Coordination Contract</h2>
        <div className="flex items-center space-x-2">
          <button 
            className="px-5 py-2 bg-[#7A005D] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
            onClick={onExit}
          >
            Complete
          </button>
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 transition-colors"
            >
              <MoreVertical size={18} />
            </button>
            
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <button onClick={onExit} className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <LogOut size={16} />
                  <span>Save and exit</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <UserPlus size={16} />
                  <span>Assign to someone else</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <Download size={16} />
                  <span>Download document</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Document Canvas */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center py-12 px-6">
          <div className="w-[800px] bg-white shadow-xl min-h-[1030px] p-20 relative">
            <div className="space-y-4 text-[13px] text-slate-800 leading-relaxed font-normal mt-12">
              <p>
                Demo Admin Harry Porter January 1, 1974 
                <span className="bg-[#FEE2E2] text-[#991B1B] px-1.5 py-0.5 rounded text-[11px] font-medium mx-1">Pay frequency</span> 
                1 de diciembre de 2016 1
              </p>
              <p>December 2016 January 1, 1974</p>
              
              <div className="mt-8 flex flex-col space-y-4">
                <div className="flex items-end space-x-2">
                  <div className="font-serif italic text-3xl opacity-80" style={{ transform: 'rotate(-5deg)' }}>
                    r o r
                  </div>
                  <div className="w-32 border-b border-slate-300"></div>
                </div>
                <div className="flex items-center text-[13px]">
                   <span>1 janvier 1974</span>
                   <span className="bg-[#FEE2E2] text-[#991B1B] px-1.5 py-0.5 rounded text-[11px] font-medium mx-2">Pay frequency</span> 
                   <span>4</span>
                </div>
              </div>

              <div className="mt-8">
                <input 
                  type="text" 
                  defaultValue="testing"
                  className="w-40 border border-slate-200 rounded-md px-3 py-1.5 outline-none focus:ring-1 focus:ring-purple-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Utility Bar */}
        <div className="w-10 flex flex-col items-center py-8 space-y-8 bg-transparent absolute right-0 top-0 h-full border-l border-transparent z-30">
          <div className="flex flex-col items-center -rotate-90 origin-center translate-y-24 space-x-2">
            <button className="flex items-center space-x-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap bg-white border border-slate-200 px-3 py-1.5 rounded-t-lg shadow-sm">
               <MessageSquare size={12} className="rotate-90" />
               <span>Share feedback</span>
            </button>
          </div>
          
          <div className="flex flex-col items-center space-y-6 mt-auto pb-4 absolute bottom-4 w-full">
             <button className="text-slate-400 hover:text-slate-600 transition-colors">
               <Settings size={20} />
             </button>
             <button className="w-8 h-8 bg-[#7A005D] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
               <Sparkles size={16} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentReviewView;
