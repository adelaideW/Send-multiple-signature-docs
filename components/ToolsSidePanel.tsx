import React, { useState, useRef } from 'react';
import {
  ChevronDown,
  ExternalLink,
  Box,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeft,
  LifeBuoy,
} from 'lucide-react';
import { PRIMARY_PURPLE } from '../constants';
import { TOOLS_FLYOUT_ITEMS } from './toolsNavigationData';
import ToolsMegaMenuPopover from './ToolsMegaMenuPopover';

interface ToolsSidePanelProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onGoHome: () => void;
  /** Documents hub → People tab (main Documents workspace). */
  onOpenDocumentsPeopleTab?: () => void;
}

const ToolsSidePanel: React.FC<ToolsSidePanelProps> = ({
  collapsed,
  onCollapsedChange,
  onGoHome,
  onOpenDocumentsPeopleTab,
}) => {
  const [activeId, setActiveId] = useState('documents');
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const headerBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col shrink-0 z-[110] h-screen transition-[width] duration-200 ease-out ${
        collapsed ? 'w-[52px]' : 'w-[260px]'
      }`}
    >
      {/* Header — screenshot 1: logo + Tools */}
      <div className={`shrink-0 border-b border-slate-100 ${collapsed ? 'px-2 py-3' : 'px-3 py-3'}`}>
        <button
          ref={headerBtnRef}
          type="button"
          onClick={() => setMegaMenuOpen((v) => !v)}
          className={`flex items-center gap-2.5 rounded-lg w-full text-left hover:bg-slate-50 transition-colors ${
            collapsed ? 'justify-center p-2' : 'px-2 py-1.5'
          }`}
          aria-expanded={megaMenuOpen}
          aria-haspopup="dialog"
          title="Tools menu"
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
            style={{ backgroundColor: PRIMARY_PURPLE }}
          >
            T
          </div>
          {!collapsed && (
            <>
              <span className="text-[14px] font-bold text-slate-900 flex-1 min-w-0 truncate">Tools</span>
              <ChevronDown
                size={16}
                className={`text-slate-400 shrink-0 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`}
              />
            </>
          )}
        </button>
        <ToolsMegaMenuPopover
          open={megaMenuOpen}
          onClose={() => setMegaMenuOpen(false)}
          anchorRef={headerBtnRef}
          onHome={onGoHome}
          onOpenDocumentsPeopleTab={onOpenDocumentsPeopleTab}
        />
      </div>

      {/* Main nav — screenshot 2 items, no stars */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 min-h-0">
        <ul className="space-y-0.5">
          {TOOLS_FLYOUT_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeId === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(item.id);
                    if (item.id === 'documents') onOpenDocumentsPeopleTab?.();
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 rounded-lg text-left transition-colors ${
                    collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
                  } ${
                    active
                      ? 'bg-[#F5F0F9] text-[#5B2D52] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={2}
                    className={`shrink-0 ${active ? 'text-[#7A005D]' : 'text-slate-500'}`}
                  />
                  {!collapsed && <span className="text-[13px] truncate">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom — screenshot 1 */}
      <div className={`shrink-0 border-t border-slate-100 mt-auto ${collapsed ? 'px-1 py-2' : 'px-2 py-3'} space-y-1`}>
        {!collapsed && (
          <>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-slate-50 text-left"
            >
              <LifeBuoy size={16} className="text-slate-500 shrink-0" strokeWidth={2} />
              <span className="flex-1">Help docs</span>
              <ExternalLink size={14} className="text-slate-400 shrink-0" />
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-slate-50 text-left"
            >
              <Box size={16} className="text-slate-500 shrink-0" strokeWidth={2} />
              <span className="flex-1">Custom apps</span>
              <ChevronDown size={14} className="text-slate-400 shrink-0" />
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-slate-50 text-left"
            >
              <SlidersHorizontal size={16} className="text-slate-500 shrink-0" strokeWidth={2} />
              <span className="flex-1">Global settings</span>
              <ChevronDown size={14} className="text-slate-400 shrink-0" />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          className={`w-full flex items-center gap-2 rounded-lg text-[13px] font-semibold text-slate-600 hover:bg-slate-100 mt-2 ${
            collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2.5'
          }`}
          title={collapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {collapsed ? (
            <PanelLeft size={18} className="text-slate-500 shrink-0" strokeWidth={2} />
          ) : (
            <>
              <PanelLeftClose size={18} className="text-slate-500 shrink-0" strokeWidth={2} />
              <span>Collapse panel</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default ToolsSidePanel;
