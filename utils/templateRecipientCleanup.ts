import { CHIP_ATTR } from './templateRecipientChips';
import type { EditorRecipientEntry } from './templateRecipientVariableCatalog';

export function getRecipientIdsUsedInEditor(ed: HTMLElement): Set<string> {
  const ids = new Set<string>();
  ed.querySelectorAll(`span[data-chip="${CHIP_ATTR}"]`).forEach((el) => {
    const rid = el.getAttribute('data-recipient-id');
    if (rid) ids.add(rid);
  });
  return ids;
}

/** Drop placeholder/internal recipients with no field chips on the canvas. */
export function pruneUnusedRecipients(
  recipients: EditorRecipientEntry[],
  ed: HTMLElement | null,
): EditorRecipientEntry[] {
  if (!ed) return recipients;
  const used = getRecipientIdsUsedInEditor(ed);
  return recipients.filter((r) => {
    if (r.id === 'employee' || r.id === 'manager') return true;
    return used.has(r.id);
  });
}
