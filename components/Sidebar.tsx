
import React from 'react';
import { ChevronDown, Grid, Settings, Wrench } from 'lucide-react';
import { SIDEBAR_ITEMS } from '../constants';

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[600px] border-t border-slate-100">
      <nav className="py-2">
        {SIDEBAR_ITEMS.map((item) => (
          <div 
            key={item.id}
            className={`
              flex items-center justify-between px-6 py-2.5 text-[13px] cursor-pointer transition-colors
              ${item.active 
                ? 'bg-[#f0f7ff] text-[#2563eb] font-semibold border-l-[3px] border-[#2563eb]' 
                : 'text-slate-600 hover:bg-slate-50'
              }
            `}
          >
            <span className="truncate">{item.label}</span>
            {(item as any).hasDropdown && <ChevronDown size={14} className="text-slate-400" />}
          </div>
        ))}
      </nav>
      
      {/* Sidebar bottom utility icons */}
      <div className="mt-auto p-4 space-y-4 border-t border-slate-50">
        <div className="flex flex-col space-y-4 px-2">
          <div className="p-1 hover:bg-slate-100 rounded cursor-pointer w-fit text-slate-400">
            <Grid size={18} />
          </div>
          <div className="p-1 hover:bg-slate-100 rounded cursor-pointer w-fit text-slate-400">
            <Wrench size={18} />
          </div>
          <div className="p-1 hover:bg-slate-100 rounded cursor-pointer w-fit text-slate-400">
            <Settings size={18} />
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
