import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import {
  MEGA_MENU_TOP,
  MEGA_MENU_PRODUCTS,
  MEGA_MENU_PLATFORM,
  TOOLS_FLYOUT_ITEMS,
} from './toolsNavigationData';

interface ToolsMegaMenuPopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  /** Called when user chooses Home from the top section (e.g. navigate to landing). */
  onHome?: () => void;
}

const sectionHeader = 'px-4 pt-3 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider';

const ToolsMegaMenuPopover: React.FC<ToolsMegaMenuPopoverProps> = ({ open, onClose, anchorRef, onHome }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [flyoutOpen, setFlyoutOpen] = useState(false);

  useLayoutEffect(() => {
    if (!open) return;
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const menuW = flyoutOpen ? 320 + 224 : 320;
    let left = r.left;
    if (left + menuW > window.innerWidth - 8) left = window.innerWidth - menuW - 8;
    if (left < 8) left = 8;
    setPos({ top: r.bottom + 6, left });
  }, [open, anchorRef, flyoutOpen]);

  useEffect(() => {
    if (!open) {
      setFlyoutOpen(false);
      return;
    }
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t)) return;
      if (anchorRef.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[500] animate-in fade-in zoom-in-95 duration-150"
      style={{ top: pos.top, left: pos.left }}
      role="dialog"
      aria-label="Tools menu"
    >
      <div
        className="flex rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
        onMouseLeave={() => setFlyoutOpen(false)}
      >
        <div className="w-80 py-2 max-h-[min(560px,85vh)] overflow-y-auto custom-scrollbar border-r border-slate-100">
          <div className="px-1">
            {MEGA_MENU_TOP.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 'home') {
                      onHome?.();
                      onClose();
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Icon size={18} className="text-slate-500 shrink-0" strokeWidth={2} />
                  <span className="flex-1">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="my-2 border-t border-slate-100" />
          <p className={sectionHeader}>Products</p>
          <div className="px-1">
            {MEGA_MENU_PRODUCTS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Icon size={18} className="text-slate-500 shrink-0" strokeWidth={2} />
                  <span className="flex-1">{item.label}</span>
                  {item.chevron && <ChevronRight size={16} className="text-slate-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="my-2 border-t border-slate-100" />
          <p className={sectionHeader}>Platform</p>
          <div className="px-1">
            {MEGA_MENU_PLATFORM.map((item) => {
              const Icon = item.icon;
              const isTools = !!item.opensToolsFlyout;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => isTools && setFlyoutOpen(true)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[13px] font-medium ${
                    isTools && flyoutOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} className="text-slate-500 shrink-0" strokeWidth={2} />
                  <span className="flex-1">{item.label}</span>
                  {item.chevron && <ChevronRight size={16} className="text-slate-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="my-2 border-t border-slate-100" />
          <div className="px-1 pb-1">
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <span className="flex-1">Help docs</span>
              <ChevronRight size={16} className="text-slate-400 shrink-0 rotate-[-45deg]" />
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <span className="flex-1">Tools</span>
              <ChevronRight size={16} className="text-slate-400 shrink-0" />
            </button>
          </div>
        </div>

        {flyoutOpen && (
          <div
            className="w-56 py-2 max-h-[min(560px,85vh)] overflow-y-auto bg-white shrink-0"
            onMouseEnter={() => setFlyoutOpen(true)}
          >
            {TOOLS_FLYOUT_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-medium text-slate-800 hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg"
                >
                  <Icon size={18} className="text-slate-500 shrink-0" strokeWidth={2} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolsMegaMenuPopover;
