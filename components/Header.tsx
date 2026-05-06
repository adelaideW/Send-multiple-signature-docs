
import React, { useState, useRef, useEffect } from 'react';
import { Search, HelpCircle, Bell, Accessibility, Grid } from 'lucide-react';

interface HeaderProps {
  onProfileClick?: () => void;
  currentView?: 'admin' | 'employee';
  onViewChange?: (view: 'admin' | 'employee') => void;
}

const Header: React.FC<HeaderProps> = ({ onProfileClick, currentView = 'admin', onViewChange }) => {
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!viewMenuRef.current?.contains(e.target as Node)) {
        setIsViewMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
      <div className="w-1/3 shrink-0" aria-hidden />

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

        <div className="relative" ref={viewMenuRef}>
          <button
            type="button"
            onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
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

          {isViewMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
              <button
                type="button"
                onClick={() => {
                  onViewChange?.('admin');
                  setIsViewMenuOpen(false);
                  onProfileClick?.();
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  currentView === 'admin'
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Admin view
              </button>
              <button
                type="button"
                onClick={() => {
                  onViewChange?.('employee');
                  setIsViewMenuOpen(false);
                  onProfileClick?.();
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  currentView === 'employee'
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Employee view
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
