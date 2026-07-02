import type { RecipientTone } from '../components/insertVariable/recipientFieldsData';
import type { VariableItem } from '../components/VariableDropdown';

export const CHIP_ATTR = 'recipient-field';

/** Match side-panel recipient field chips: inherits line formatting, per-recipient fill/border. */
export const CHIP_CLASS =
  'inline-flex items-center align-baseline mx-0.5 px-2 py-0.5 rounded-md text-inherit font-inherit leading-inherit border cursor-grab active:cursor-grabbing select-none';

export function applyChipTone(chip: HTMLElement, tone: RecipientTone) {
  chip.style.backgroundColor = tone.bg;
  chip.style.borderColor = tone.border;
}

export type RecipientFieldChipOptions = {
  paletteIndex?: number;
  recipientLabel?: string;
};

export function createRecipientFieldChipElement(
  label: string,
  recipientId: string,
  tone: RecipientTone,
  options?: RecipientFieldChipOptions,
): HTMLSpanElement {
  const span = document.createElement('span');
  span.setAttribute('data-chip', CHIP_ATTR);
  span.setAttribute('data-label', label);
  span.setAttribute('data-recipient-id', recipientId);
  if (options?.paletteIndex != null) {
    span.setAttribute('data-palette-index', String(options.paletteIndex));
  }
  if (options?.recipientLabel) {
    span.setAttribute('data-recipient-label', options.recipientLabel);
  }
  span.setAttribute('draggable', 'true');
  span.setAttribute('tabindex', '0');
  span.contentEditable = 'false';
  span.className = CHIP_CLASS;
  span.textContent = label;
  applyChipTone(span, tone);
  return span;
}

export function isRecipientFieldVariableItem(item: VariableItem): boolean {
  return !!item.fieldType;
}

export function recipientIdForVariableItem(item: VariableItem, activeRecipientId: string): string {
  if (item.placeholderRecipientId) return item.placeholderRecipientId;
  if (item.recipientType === 'employee') return 'employee';
  if (item.recipientType === 'manager') return 'manager';
  return activeRecipientId;
}

export function captureEditorCaretRange(editorEl: HTMLElement): Range | null {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return null;
  const range = sel.getRangeAt(0);
  if (!editorEl.contains(range.commonAncestorContainer)) return null;
  const collapsed = range.cloneRange();
  collapsed.collapse(true);
  return collapsed;
}

export function insertElementAtCaret(
  editorEl: HTMLDivElement,
  chip: HTMLElement,
  breakoutText: Text | null = null,
  onInserted?: () => void,
  savedRange: Range | null = null,
): boolean {
  editorEl.focus();
  const sel = window.getSelection();
  if (!sel) return false;

  if (breakoutText?.parentNode) {
    breakoutText.parentNode.replaceChild(chip, breakoutText);
    sel.removeAllRanges();
    const r = document.createRange();
    const space = document.createTextNode('\u00A0');
    r.setStartAfter(chip);
    r.insertNode(space);
    r.setStartAfter(space);
    r.collapse(true);
    sel.addRange(r);
    onInserted?.();
    return true;
  }

  let range: Range;
  if (savedRange) {
    if (editorEl.contains(savedRange.startContainer)) {
      range = savedRange.cloneRange();
      range.collapse(true);
    } else {
      range = document.createRange();
      range.selectNodeContents(editorEl);
      range.collapse(false);
    }
  } else {
    if (!sel.rangeCount) return false;
    range = sel.getRangeAt(0).cloneRange();
    range.collapse(true);
  }

  range.insertNode(chip);
  range.setStartAfter(chip);
  range.setEndAfter(chip);

  const space = document.createTextNode('\u00A0');
  range.insertNode(space);
  range.setStartAfter(space);
  range.setEndAfter(space);

  sel.removeAllRanges();
  sel.addRange(range);
  onInserted?.();
  return true;
}
