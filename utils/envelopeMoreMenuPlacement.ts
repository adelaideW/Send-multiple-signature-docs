/** Shared width for every envelope `⋯` dropdown (details, profile, hub). */
export const ENVELOPE_MORE_MENU_WIDTH_PX = 240;

const MENU_GAP_PX = 8;

/**
 * Right-align the menu under its trigger so dropdown edges line up across
 * the profile Action required row and the envelope details header.
 */
export function getEnvelopeMoreMenuPosition(
  anchor: HTMLElement | null,
): { top: number; left: number } | null {
  if (!anchor) return null;
  const rect = anchor.getBoundingClientRect();
  const mw = ENVELOPE_MORE_MENU_WIDTH_PX;
  const left = Math.max(MENU_GAP_PX, Math.min(rect.right - mw, window.innerWidth - mw - MENU_GAP_PX));
  return { top: rect.bottom + MENU_GAP_PX, left };
}
