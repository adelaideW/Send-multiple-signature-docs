
import React from 'react';
import { Search, HelpCircle, Bell, Accessibility, ChevronDown, Grid } from 'lucide-react';

interface HeaderProps {
  onProfileClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onProfileClick }) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
      <div className="flex items-center space-x-4 w-1/3">
        <div className="flex items-center space-x-1 cursor-pointer">
          <span className="text-[14px] font-bold text-slate-700">Menu</span>
          <ChevronDown size={14} className="text-slate-500" />
        </div>
      </div>

      <div className="flex-1 max-w-2xl px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search or jump to..." 
            className="w-full bg-slate-100 border-none rounded-md py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-slate-300 outline-none"
          />
        </div>
      </div>

      <div className="flex items-center space-x-5 w-1/3 justify-end">
        <div className="flex items-center space-x-4">
          <button className="text-slate-500 hover:text-slate-700"><HelpCircle size={20} /></button>
          <button className="text-slate-500 hover:text-slate-700"><Accessibility size={20} /></button>
          <button className="text-slate-500 hover:text-slate-700 relative">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">4</span>
          </button>
          <button className="text-slate-500 hover:text-slate-700 relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">1</span>
          </button>
          <button className="text-slate-500 hover:text-slate-700"><Grid size={20} /></button>
        </div>
        
        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        <button
          type="button"
          onClick={() => onProfileClick?.()}
          className="flex items-center space-x-3 cursor-pointer rounded-lg p-1 -mr-1 hover:bg-slate-50 transition-colors text-left"
          aria-label="Open user profile"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-700 leading-tight">Acme</p>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0">
            <img src="https://picsum.photos/id/64/100/100" alt="User Profile" />
          </div>
        </button>
      </div>
    </header>
  );
}

export default Header;
