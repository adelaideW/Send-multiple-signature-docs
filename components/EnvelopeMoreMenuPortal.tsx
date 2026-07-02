import React, { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  EnvelopeMoreMenu,
  type MoreMenuVariant,
} from './EnvelopesListView';
import { getEnvelopeMoreMenuPosition } from '../utils/envelopeMoreMenuPlacement';

export interface EnvelopeMoreMenuActions {
  onDownload?: () => void;
  onSendReminder?: () => void;
  onMakeCorrection?: () => void;
  onRemove?: () => void;
  onVoid?: () => void;
  onMarkAllAsCompleted?: () => void;
}

interface EnvelopeMoreMenuPortalProps {
  open: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  variant: MoreMenuVariant;
  actions: EnvelopeMoreMenuActions;
  rootId: string;
}

/**
 * Shared portal for every envelope `⋯` menu — profile Action required,
 * envelope details header, and Documents hub rows all use this so items and
 * alignment stay identical.
 */
export const EnvelopeMoreMenuPortal: React.FC<EnvelopeMoreMenuPortalProps> = ({
  open,
  onClose,
  anchorEl,
  variant,
  actions,
  rootId,
}) => {
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorEl) {
      setMenuPos(null);
      return;
    }
    const update = () => {
      const next = getEnvelopeMoreMenuPosition(anchorEl);
      if (next) setMenuPos(next);
    };
    update();
    const raf = requestAnimationFrame(update);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, anchorEl]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (anchorEl?.contains(t)) return;
      const root = document.getElementById(rootId);
      if (root?.contains(t)) return;
      onClose();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, anchorEl, onClose, rootId]);

  if (!open || !anchorEl) return null;

  const pos = menuPos ?? getEnvelopeMoreMenuPosition(anchorEl);
  if (!pos) return null;

  return createPortal(
    <div
      id={rootId}
      className="fixed rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
      style={{ top: pos.top, left: pos.left, zIndex: 2147483647 }}
      role="presentation"
    >
      <EnvelopeMoreMenu
        variant={variant}
        onClose={onClose}
        onDownload={actions.onDownload}
        onSendReminder={actions.onSendReminder}
        onMakeCorrection={actions.onMakeCorrection}
        onRemove={actions.onRemove}
        onVoid={actions.onVoid}
        onMarkAllAsCompleted={actions.onMarkAllAsCompleted}
      />
    </div>,
    document.body,
  );
};
