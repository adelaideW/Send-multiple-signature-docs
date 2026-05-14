import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Accessibility,
  Bell,
  Globe,
  Search,
  Undo2,
  Redo2,
  Printer,
  Bold,
  Italic,
  Underline,
  Code,
  Baseline,
  Eraser,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Indent,
  Minus,
  Plus,
  Type,
  PenTool,
  Calendar,
  Grid,
  LayoutGrid,
  SquareCheck,
  Zap,
  AlignJustify,
  GripVertical,
  User,
  Check,
  UserPlus,
  Trash2,
  Pencil,
} from 'lucide-react';

const RECIPIENT_FIELD_MIME = 'application/x-recipient-field-label';
/** Carried alongside the field label on palette drags so the dropped chip knows which recipient to color itself for. */
const RECIPIENT_FIELD_RID_MIME = 'application/x-recipient-field-rid';
const CHIP_ATTR = 'recipient-field';

/**
 * Color/style descriptor for a single recipient placeholder. We render chip
 * backgrounds and avatar tones inline from these values so each recipient's
 * fields are visually grouped without us needing to enumerate Tailwind
 * variants for every new external recipient the user adds.
 */
interface RecipientTone {
  /** Soft fill used for chips and the field palette tiles. */
  bg: string;
  /** Slightly darker stroke used to outline chips/tiles. */
  border: string;
  /** Stronger color used for icons + the active palette text. */
  icon: string;
  /** Tone applied to the round avatar in the dropdown + top button. */
  avatarBg: string;
  /** Icon color used inside the avatar circle. */
  avatarIcon: string;
}

/**
 * Per-recipient placeholder/external palette. The first two slots are
 * pinned for the built-in placeholders so they stay purple/teal across
 * sessions; the rest are cycled through for externally added
 * placeholders in the order they were created.
 */
const RECIPIENT_TONE_PALETTE: RecipientTone[] = [
  { bg: '#F3E8FF', border: '#E9D5FF', icon: '#7E22CE', avatarBg: '#F3E8FF', avatarIcon: '#7E22CE' }, // purple — Employee
  { bg: '#CCFBF1', border: '#99F6E4', icon: '#0F766E', avatarBg: '#CCFBF1', avatarIcon: '#0F766E' }, // teal — Employee's manager
  { bg: '#FEF3C7', border: '#FDE68A', icon: '#B45309', avatarBg: '#FEF3C7', avatarIcon: '#B45309' }, // amber
  { bg: '#FFE4E6', border: '#FECDD3', icon: '#BE123C', avatarBg: '#FFE4E6', avatarIcon: '#BE123C' }, // rose
  { bg: '#DBEAFE', border: '#BFDBFE', icon: '#1D4ED8', avatarBg: '#DBEAFE', avatarIcon: '#1D4ED8' }, // sky
  { bg: '#E0E7FF', border: '#C7D2FE', icon: '#4338CA', avatarBg: '#E0E7FF', avatarIcon: '#4338CA' }, // indigo
  { bg: '#DCFCE7', border: '#BBF7D0', icon: '#15803D', avatarBg: '#DCFCE7', avatarIcon: '#15803D' }, // green
];

/** Default tone for chips loaded from `initialBodyHtml` without a `data-recipient-id`. */
const DEFAULT_RECIPIENT_TONE = RECIPIENT_TONE_PALETTE[0];

/** Match recipient-field chips in side panel; text inherits line formatting. Background + border come from per-recipient inline styles. */
const CHIP_CLASS =
  'inline-flex items-center align-baseline mx-0.5 px-2 py-0.5 rounded-md text-inherit font-inherit leading-inherit border cursor-grab active:cursor-grabbing select-none';

const MOCK_EMPLOYEES = [
  { id: '1', name: 'Angel Hunter', dept: 'Engineering', avatar: 'https://i.pravatar.cc/40?u=angel-hunter' },
  { id: '2', name: 'Angie Adams', dept: 'Marketing', avatar: 'https://i.pravatar.cc/40?u=angie-adams' },
  { id: '3', name: 'Anna Taylor', dept: 'Accounting', avatar: 'https://i.pravatar.cc/40?u=anna-taylor' },
  { id: '4', name: 'Anne Montgomery', dept: 'CEO', avatar: 'https://i.pravatar.cc/40?u=anne-montgomery' },
  { id: '5', name: 'James Chen', dept: 'Design', avatar: 'https://i.pravatar.cc/40?u=james-chen' },
  { id: '6', name: 'Maria Santos', dept: 'People Operations', avatar: 'https://i.pravatar.cc/40?u=maria-santos' },
  { id: 'u-kale', name: 'Kale George', dept: 'People Operations', avatar: 'https://i.pravatar.cc/40?u=kale-george' },
] as const;

interface TemplateEditorProps {
  onExit: () => void;
  onGoHome?: () => void;
  mode?: 'create' | 'edit';
  onSaveNewTemplate?: (name: string, body: string) => void;
  /** Persist changes when editing an existing template (preview + reopen). */
  onUpdateTemplate?: (name: string, body: string) => void;
  initialTitle?: string;
  /** When set in edit mode, rich canvas shows this HTML (aligned with envelope preview). */
  initialBodyHtml?: string | null;
}

/**
 * Apply chip background/border to a node from its currently-stamped recipient
 * id. Kept as a top-level helper so it can be called both at creation time
 * and by `wireChipDragHandlers` when chips are reloaded from saved HTML.
 */
function applyChipTone(chip: HTMLElement, tone: RecipientTone) {
  chip.style.backgroundColor = tone.bg;
  chip.style.borderColor = tone.border;
}

function createChipElement(label: string, recipientId: string, tone: RecipientTone): HTMLSpanElement {
  const span = document.createElement('span');
  span.setAttribute('data-chip', CHIP_ATTR);
  span.setAttribute('data-label', label);
  span.setAttribute('data-recipient-id', recipientId);
  span.setAttribute('draggable', 'true');
  span.setAttribute('tabindex', '0');
  span.contentEditable = 'false';
  span.className = CHIP_CLASS;
  span.textContent = label;
  applyChipTone(span, tone);
  return span;
}

function editorHasMeaningfulContent(root: HTMLElement): boolean {
  const titleP = root.querySelector('p[data-title-line]');
  const titleText = (titleP?.textContent || '').replace(/\u00a0/g, ' ').trim();
  if (titleText.length > 0) return true;
  if (root.querySelectorAll(`span[data-chip="${CHIP_ATTR}"]`).length > 0) return true;
  for (const child of Array.from(root.children)) {
    if (child === titleP) continue;
    if ((child.textContent || '').replace(/\u00a0/g, ' ').trim().length > 0) return true;
  }
  return false;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  onExit,
  onGoHome,
  mode = 'edit',
  onSaveNewTemplate,
  onUpdateTemplate,
  initialTitle,
  initialBodyHtml,
}) => {
  const isCreate = mode === 'create';
  const useRichCanvas = isCreate || (mode === 'edit' && initialBodyHtml != null);

  const [templateName, setTemplateName] = useState(initialTitle?.trim() || '');
  const [titleEditing, setTitleEditing] = useState(false);
  const [recipientPanelOpen, setRecipientPanelOpen] = useState(true);
  const [employeeMenuOpen, setEmployeeMenuOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  /**
   * Recipient registry shown in the recipient selector dropdown. The first
   * two entries are pinned built-in placeholders; later entries come from
   * the "Add placeholder recipient" modal or from picking an internal
   * person in the directory search. `kind` controls UI affordances
   * (only `placeholder` rows expose a rename pencil), and `paletteIndex`
   * is the recipient's slot inside `RECIPIENT_TONE_PALETTE` so colors
   * stay deterministic regardless of array re-ordering or deletions.
   */
  type RecipientKind = 'placeholder' | 'internal';
  type RecipientEntry = {
    id: string;
    label: string;
    sublabel: string;
    paletteIndex: number;
    kind: RecipientKind;
  };
  const [recipients, setRecipients] = useState<RecipientEntry[]>([
    { id: 'employee', label: 'Employee', sublabel: 'Placeholder recipient', paletteIndex: 0, kind: 'placeholder' },
    { id: 'manager', label: "Employee's manager", sublabel: 'Placeholder recipient', paletteIndex: 1, kind: 'placeholder' },
  ]);
  const [activeRecipientId, setActiveRecipientId] = useState<string>('employee');
  /** 'fields' shows the field palette tiles, 'recipients' shows the recipient list with delete/rename. */
  const [sidePanelView, setSidePanelView] = useState<'fields' | 'recipients'>('fields');
  /** Add-placeholder modal state. When `editingRecipientId` is set the modal saves back to that recipient instead of creating a new one. */
  const [placeholderModalOpen, setPlaceholderModalOpen] = useState(false);
  const [placeholderLabel, setPlaceholderLabel] = useState('');
  const [editingRecipientId, setEditingRecipientId] = useState<string | null>(null);
  const [contentCheck, setContentCheck] = useState(0);
  const [unsavedExitModalOpen, setUnsavedExitModalOpen] = useState(false);
  // Edit-mode header Save splits into two destinations behind a
  // dropdown: "Save to instance" (one-off custom template attached to
  // this envelope) and "Save and update template" (overwrite the source
  // template). Create-mode keeps the single Save click.
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const chipMoveRef = useRef<HTMLElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const syncingTitleFromBar = useRef(false);
  const employeeMenuRef = useRef<HTMLDivElement>(null);
  const saveMenuRef = useRef<HTMLDivElement>(null);

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const exec = (command: string, value?: string) => {
    focusEditor();
    document.execCommand(command, false, value);
  };

  const normalizeTitleParagraphs = (root: HTMLElement) => {
    let firstP: HTMLParagraphElement | null = null;
    for (const el of Array.from(root.children)) {
      if (el.tagName === 'P') {
        firstP = el as HTMLParagraphElement;
        break;
      }
    }
    if (!firstP) {
      const p = document.createElement('p');
      p.setAttribute('data-title-line', '');
      p.appendChild(document.createElement('br'));
      root.prepend(p);
      firstP = p;
    }
    firstP.setAttribute('data-title-line', '');
    for (const el of Array.from(root.children)) {
      if (el.tagName !== 'P' || el === firstP) continue;
      (el as HTMLParagraphElement).removeAttribute('data-title-line');
    }
  };

  const readTitleFromEditor = (): string => {
    const tp = editorRef.current?.querySelector('p[data-title-line]');
    return tp?.textContent?.trim() ?? '';
  };

  const writeTitleToEditor = (text: string) => {
    const ed = editorRef.current;
    if (!ed) return;
    let tp = ed.querySelector('p[data-title-line]') as HTMLParagraphElement | null;
    if (!tp) {
      normalizeTitleParagraphs(ed);
      tp = ed.querySelector('p[data-title-line]') as HTMLParagraphElement | null;
    }
    if (!tp) return;
    syncingTitleFromBar.current = true;
    if (!text.trim()) {
      tp.innerHTML = '<br>';
    } else {
      tp.textContent = text;
    }
    syncingTitleFromBar.current = false;
    setContentCheck((c) => c + 1);
  };

  /**
   * Resolve the color tone for a given recipient id. Unknown ids (e.g. a
   * chip loaded from saved HTML whose recipient was deleted, or pre-color
   * legacy chips with no `data-recipient-id` at all) fall back to the
   * Employee tone so they stay visible and consistent with prior renders.
   */
  const toneForRecipientId = useCallback(
    (rid: string | null | undefined): RecipientTone => {
      if (!rid) return DEFAULT_RECIPIENT_TONE;
      const entry = recipients.find((r) => r.id === rid);
      if (!entry) return DEFAULT_RECIPIENT_TONE;
      return RECIPIENT_TONE_PALETTE[entry.paletteIndex % RECIPIENT_TONE_PALETTE.length];
    },
    [recipients]
  );

  const activeRecipient = useMemo(
    () => recipients.find((r) => r.id === activeRecipientId) ?? recipients[0],
    [recipients, activeRecipientId]
  );
  const activeTone = toneForRecipientId(activeRecipient?.id);

  const wireChipDragHandlers = useCallback((root: HTMLElement) => {
    root.querySelectorAll(`span[data-chip="${CHIP_ATTR}"]`).forEach((el) => {
      const chip = el as HTMLElement;
      chip.setAttribute('draggable', 'true');
      chip.className = CHIP_CLASS;
      // Backfill recipient id + repaint background so chips that came in
      // from saved HTML pick up their per-recipient tone (and stay current
      // if the user later adds or removes external recipients).
      const rid = chip.getAttribute('data-recipient-id') ?? '';
      if (!rid) chip.setAttribute('data-recipient-id', 'employee');
      applyChipTone(chip, toneForRecipientId(chip.getAttribute('data-recipient-id')));
      chip.ondragstart = (e: DragEvent) => {
        chipMoveRef.current = chip;
        e.dataTransfer!.effectAllowed = 'move';
        e.dataTransfer!.setData('text/plain', 'chip-move');
      };
      chip.onkeydown = (ev: KeyboardEvent) => {
        if (ev.key === 'Backspace' || ev.key === 'Delete') {
          ev.preventDefault();
          chip.remove();
        }
      };
    });
  }, [toneForRecipientId]);

  useEffect(() => {
    if (initialTitle != null) setTemplateName(initialTitle.trim());
  }, [initialTitle]);

  useEffect(() => {
    if (titleEditing) titleInputRef.current?.focus();
  }, [titleEditing]);

  useEffect(() => {
    if (!useRichCanvas || !editorRef.current) return;
    const ed = editorRef.current;
    if (initialBodyHtml) {
      if (initialBodyHtml.includes('data-title-line')) {
        ed.innerHTML = initialBodyHtml;
      } else {
        const safe = (initialTitle ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        ed.innerHTML = `<p data-title-line>${safe || '<br>'}</p>${initialBodyHtml}`;
      }
    } else if (isCreate) {
      ed.innerHTML = '<p data-title-line><br></p>';
    }
    normalizeTitleParagraphs(ed);
    const titleText = ed.querySelector('p[data-title-line]')?.textContent?.trim() ?? '';
    if (titleText) setTemplateName(titleText);
    else if (initialTitle?.trim()) setTemplateName(initialTitle.trim());
    wireChipDragHandlers(ed);
    setContentCheck((c) => c + 1);
  }, [initialBodyHtml, initialTitle, isCreate, useRichCanvas, wireChipDragHandlers]);

  useEffect(() => {
    if (!employeeMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (employeeMenuRef.current && !employeeMenuRef.current.contains(e.target as Node)) {
        setEmployeeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [employeeMenuOpen]);

  // Reapply chip tones when the recipient registry changes (e.g. an external
  // recipient was added) so any chips already on the canvas pick up an updated
  // palette mapping without requiring a full re-render of the editor.
  useEffect(() => {
    if (!useRichCanvas) return;
    const ed = editorRef.current;
    if (!ed) return;
    ed.querySelectorAll(`span[data-chip="${CHIP_ATTR}"]`).forEach((el) => {
      const chip = el as HTMLElement;
      applyChipTone(chip, toneForRecipientId(chip.getAttribute('data-recipient-id')));
    });
  }, [recipients, toneForRecipientId, useRichCanvas]);

  useEffect(() => {
    if (!saveMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (saveMenuRef.current && !saveMenuRef.current.contains(e.target as Node)) {
        setSaveMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [saveMenuOpen]);

  const insertChipAtCaret = useCallback((label: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const rid = activeRecipientId;
    const tone = toneForRecipientId(rid);
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      editor.appendChild(createChipElement(label, rid, tone));
      wireChipDragHandlers(editor);
      setContentCheck((c) => c + 1);
      return;
    }
    let range = sel.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }
    range.deleteContents();
    const chip = createChipElement(label, rid, tone);
    range.insertNode(chip);
    range.setStartAfter(chip);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    wireChipDragHandlers(editor);
    setContentCheck((c) => c + 1);
  }, [activeRecipientId, toneForRecipientId, wireChipDragHandlers]);

  const handleEditorDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const editor = editorRef.current;
      if (!editor) return;

      const moveEl = chipMoveRef.current;
      chipMoveRef.current = null;

      const label = e.dataTransfer.getData(RECIPIENT_FIELD_MIME);
      // Prefer the rid baked into the drag (palette knows which recipient
      // is active at drag-start); fall back to the current selection so a
      // dropped chip still picks up a valid color.
      const dragRid = e.dataTransfer.getData(RECIPIENT_FIELD_RID_MIME) || activeRecipientId;
      let range: Range | null = null;
      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(e.clientX, e.clientY);
      } else if ((document as any).caretPositionFromPoint) {
        const pos = (document as any).caretPositionFromPoint(e.clientX, e.clientY);
        if (pos) {
          range = document.createRange();
          range.setStart(pos.offsetNode, pos.offset);
          range.collapse(true);
        }
      }
      if (!range || !editor.contains(range.commonAncestorContainer)) {
        range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
      }

      if (moveEl && editor.contains(moveEl)) {
        range.deleteContents();
        range.insertNode(moveEl);
        const sel = window.getSelection();
        if (sel) {
          range.setStartAfter(moveEl);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
        wireChipDragHandlers(editor);
        setContentCheck((c) => c + 1);
        return;
      }

      if (label) {
        range.deleteContents();
        const chip = createChipElement(label, dragRid, toneForRecipientId(dragRid));
        range.insertNode(chip);
        const sel = window.getSelection();
        if (sel) {
          range.setStartAfter(chip);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
        wireChipDragHandlers(editor);
        setContentCheck((c) => c + 1);
      }
    },
    [activeRecipientId, toneForRecipientId, wireChipDragHandlers]
  );

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Backspace' && e.key !== 'Delete') return;
    const sel = window.getSelection();
    if (!sel || !sel.isCollapsed) return;
    const { anchorNode, anchorOffset } = sel;
    if (!anchorNode || !editorRef.current?.contains(anchorNode)) return;

    if (anchorNode.nodeType === Node.TEXT_NODE && anchorOffset === 0 && e.key === 'Backspace') {
      const prev = anchorNode.previousSibling;
      if (prev instanceof HTMLElement && prev.dataset.chip === CHIP_ATTR) {
        e.preventDefault();
        prev.remove();
        setContentCheck((c) => c + 1);
      }
    }
    if (anchorNode.nodeType === Node.ELEMENT_NODE) {
      const el = anchorNode as HTMLElement;
      const child = el.childNodes[anchorOffset - 1];
      if (e.key === 'Backspace' && child instanceof HTMLElement && child.dataset.chip === CHIP_ATTR) {
        e.preventDefault();
        child.remove();
        setContentCheck((c) => c + 1);
      }
    }
  };

  const startPaletteDrag = (label: string) => (e: React.DragEvent) => {
    e.dataTransfer.setData(RECIPIENT_FIELD_MIME, label);
    e.dataTransfer.setData(RECIPIENT_FIELD_RID_MIME, activeRecipientId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  /**
   * Save the placeholder modal. When `editingRecipientId` is set, this
   * rewrites the existing entry's label in place (palette + id remain
   * stable so colors and chip ownership stay intact). Otherwise it
   * appends a fresh placeholder and makes it active so the next field
   * the user drops picks up its color.
   */
  const handleSavePlaceholderRecipient = () => {
    const label = placeholderLabel.trim();
    if (!label) return;
    if (editingRecipientId) {
      setRecipients((prev) =>
        prev.map((r) => (r.id === editingRecipientId ? { ...r, label } : r))
      );
    } else {
      setRecipients((prev) => {
        const id = `ext-${Date.now().toString(36)}`;
        // Use the next palette slot based on how many recipients have ever
        // been created, picking from the highest existing paletteIndex so
        // deletions don't recycle the same color for back-to-back adds.
        const nextIndex = Math.max(-1, ...prev.map((r) => r.paletteIndex)) + 1;
        const entry: RecipientEntry = {
          id,
          label,
          sublabel: 'Placeholder recipient',
          paletteIndex: nextIndex,
          kind: 'placeholder',
        };
        setActiveRecipientId(id);
        return [...prev, entry];
      });
    }
    setPlaceholderLabel('');
    setEditingRecipientId(null);
    setPlaceholderModalOpen(false);
    setEmployeeMenuOpen(false);
    setEmployeeSearch('');
  };

  /**
   * Add (or re-activate) an internal employee as a recipient when picked
   * from the directory search. Reuses an existing entry if the same
   * employee is already in the registry to avoid duplicates.
   */
  const handleSelectInternalEmployee = (emp: { id: string; name: string; dept: string }) => {
    setRecipients((prev) => {
      const existing = prev.find((r) => r.id === emp.id);
      if (existing) {
        setActiveRecipientId(existing.id);
        return prev;
      }
      const nextIndex = Math.max(-1, ...prev.map((r) => r.paletteIndex)) + 1;
      const entry: RecipientEntry = {
        id: emp.id,
        label: emp.name,
        sublabel: emp.dept,
        paletteIndex: nextIndex,
        kind: 'internal',
      };
      setActiveRecipientId(entry.id);
      return [...prev, entry];
    });
    setEmployeeMenuOpen(false);
    setEmployeeSearch('');
  };

  /**
   * Remove a recipient from the registry. Also strips every chip on the
   * canvas that pointed at that recipient — chips without an owner would
   * fall back to a random tone, and the placement-flow expectation is
   * that deleting a recipient retracts their fields too. Refuses to
   * delete the last remaining recipient (the editor needs at least one
   * to anchor new fields).
   */
  const handleDeleteRecipient = (id: string) => {
    if (recipients.length <= 1) return;
    setRecipients((prev) => {
      const nextList = prev.filter((r) => r.id !== id);
      if (id === activeRecipientId) {
        setActiveRecipientId(nextList[0]?.id ?? prev[0].id);
      }
      return nextList;
    });
    const ed = editorRef.current;
    if (ed) {
      ed.querySelectorAll(`span[data-chip="${CHIP_ATTR}"][data-recipient-id="${id}"]`).forEach(
        (el) => el.parentElement && el.parentElement.removeChild(el)
      );
      setContentCheck((c) => c + 1);
    }
  };

  /** Open the placeholder modal in rename mode for an existing placeholder. */
  const handleRenameRecipient = (id: string) => {
    const target = recipients.find((r) => r.id === id);
    if (!target) return;
    setEditingRecipientId(id);
    setPlaceholderLabel(target.label);
    setPlaceholderModalOpen(true);
  };

  const syncChipsAfterInput = () => {
    const ed = editorRef.current;
    if (!ed) return;
    normalizeTitleParagraphs(ed);
    if (!syncingTitleFromBar.current) {
      setTemplateName(readTitleFromEditor());
    }
    wireChipDragHandlers(ed);
    setContentCheck((c) => c + 1);
  };

  const canSave = useMemo(() => {
    if (!useRichCanvas) return true;
    const el = editorRef.current;
    if (!el) return false;
    return editorHasMeaningfulContent(el);
  }, [useRichCanvas, contentCheck]);

  /**
   * `target` lets the unsaved-changes modal force a specific destination
   * when editing: "new" saves the edits as a brand-new template, while
   * "update" overwrites the template that was opened for editing.
   * "auto" preserves the legacy behavior — `create` mode saves new and
   * `edit` mode updates in place.
   */
  const performSave = useCallback(
    (allowEmpty: boolean, target: 'auto' | 'new' | 'update' = 'auto') => {
      if (useRichCanvas && !allowEmpty) {
        const el = editorRef.current;
        if (!el || !editorHasMeaningfulContent(el)) return;
      }
      const name = templateName.trim() || readTitleFromEditor().trim() || 'Untitled template';
      const body = useRichCanvas && editorRef.current ? editorRef.current.innerHTML : '';
      const resolved = target === 'auto' ? (isCreate ? 'new' : 'update') : target;
      if (resolved === 'new' && onSaveNewTemplate) {
        onSaveNewTemplate(name, body);
      } else if (resolved === 'update' && onUpdateTemplate) {
        onUpdateTemplate(name, body);
      } else if (onSaveNewTemplate) {
        onSaveNewTemplate(name, body);
      } else if (onUpdateTemplate) {
        onUpdateTemplate(name, body);
      } else {
        onExit();
      }
    },
    [useRichCanvas, templateName, isCreate, onSaveNewTemplate, onUpdateTemplate, onExit]
  );

  const requestEditorExit = useCallback(() => {
    if (!useRichCanvas) {
      onExit();
      return;
    }
    if (!editorRef.current || !editorHasMeaningfulContent(editorRef.current)) {
      onExit();
      return;
    }
    setUnsavedExitModalOpen(true);
  }, [useRichCanvas, onExit]);

  const displayTitle = templateName.trim() || '[Envelope Templates Name]';

  const employeeQuery = employeeSearch.trim().toLowerCase();
  const filteredEmployees = employeeQuery
    ? MOCK_EMPLOYEES.filter(
        (e) => e.name.toLowerCase().includes(employeeQuery) || e.dept.toLowerCase().includes(employeeQuery)
      )
    : [];
  const primaryMatchId = filteredEmployees[0]?.id ?? null;

  return (
    <div className="flex flex-col h-screen bg-white text-[#1e293b] font-sans overflow-hidden">
      <style>{`
        .template-rich-editor > p[data-title-line] {
          font-size: 24px;
          font-weight: 700;
          line-height: 1.3;
          color: rgb(15 23 42);
          margin: 0 0 0.75rem 0;
        }
        .template-rich-editor > p:not([data-title-line]) {
          font-size: 15px;
          font-weight: 400;
          line-height: 1.625;
          color: rgb(30 41 59);
          margin: 0 0 0.75rem 0;
        }
      `}</style>
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-[100]">
        <div className="flex items-center space-x-6">
          <div
            className="flex items-center text-slate-900 cursor-pointer hover:opacity-70 transition-opacity"
            onClick={onGoHome}
            title="Go to Home"
          >
            <div className="flex items-center font-bold text-lg tracking-tight uppercase">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1e293b]">
                <path d="M7 6C7 6 4 9 4 12C4 15 7 18 7 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 6C12 6 9 9 9 12C9 15 12 18 12 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M17 6C17 6 14 9 14 12C14 15 17 18 17 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="ml-2">RIPPLING</span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-2xl px-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search or jump to..."
              className="w-full bg-[#f1f5f9] border-none rounded-md py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-slate-300 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <HelpCircle size={20} className="text-slate-400 cursor-pointer hover:text-slate-800 transition-colors" />
          <Accessibility size={20} className="text-slate-400 cursor-pointer hover:text-slate-800 transition-colors" />
          <div className="p-1 border border-slate-200 rounded">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <Bell size={20} className="text-slate-400 cursor-pointer hover:text-slate-800 transition-colors" />
          <Globe size={20} className="text-slate-400 cursor-pointer hover:text-slate-800 transition-colors" />
          <div className="h-6 w-px bg-slate-200 mx-2" />
          <div className="flex items-center space-x-3 cursor-pointer">
            <span className="text-sm text-slate-700 font-semibold hidden sm:block">Acme, Inc.</span>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
              <img src="https://picsum.photos/id/177/100/100" alt="Avatar" />
            </div>
          </div>
        </div>
      </header>

      <div className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center min-w-0 flex-1 max-w-2xl">
          {titleEditing ? (
            <input
              ref={titleInputRef}
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onBlur={() => {
                writeTitleToEditor(templateName);
                setTitleEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  writeTitleToEditor(templateName);
                  setTitleEditing(false);
                }
              }}
              className="text-[14px] font-bold text-slate-800 w-full border-b-2 border-[#7A005D] outline-none bg-transparent py-0.5"
              placeholder="[Envelope Templates Name]"
            />
          ) : (
            <button
              type="button"
              onClick={() => setTitleEditing(true)}
              className="text-left text-[14px] font-bold text-slate-800 truncate hover:text-[#7A005D] transition-colors border border-transparent hover:border-slate-200 rounded px-2 py-1 -mx-2"
            >
              {displayTitle}
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button type="button" className="px-4 py-1.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-100 shadow-sm">
            Preview
          </button>
          {isCreate ? (
            <span
              className="inline-flex"
              title={useRichCanvas && !canSave ? 'Enter content before saving' : undefined}
            >
              <button
                type="button"
                onClick={() => performSave(false)}
                disabled={useRichCanvas && !canSave}
                className={`px-6 py-1.5 rounded-xl text-[13px] font-bold transition-all shadow-md ml-1 ${
                  useRichCanvas && !canSave
                    ? 'bg-[#7A005D]/45 text-white cursor-not-allowed'
                    : 'bg-[#7A005D] text-white hover:opacity-95'
                }`}
              >
                Save
              </button>
            </span>
          ) : (
            <div
              ref={saveMenuRef}
              className="relative inline-flex"
              title={useRichCanvas && !canSave ? 'Enter content before saving' : undefined}
            >
              <button
                type="button"
                onClick={() => {
                  if (useRichCanvas && !canSave) return;
                  setSaveMenuOpen((o) => !o);
                }}
                disabled={useRichCanvas && !canSave}
                aria-haspopup="menu"
                aria-expanded={saveMenuOpen}
                className={`inline-flex items-center gap-1.5 pl-6 pr-3 py-1.5 rounded-xl text-[13px] font-bold transition-all shadow-md ml-1 ${
                  useRichCanvas && !canSave
                    ? 'bg-[#7A005D]/45 text-white cursor-not-allowed'
                    : 'bg-[#7A005D] text-white hover:opacity-95'
                }`}
              >
                Save
                <ChevronDown
                  size={14}
                  className={`transition-transform ${saveMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {saveMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-1.5 w-[240px] bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-[1500]"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-slate-800 hover:bg-slate-50"
                    onClick={() => {
                      setSaveMenuOpen(false);
                      performSave(false, 'new');
                    }}
                  >
                    Save to this document
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-slate-800 hover:bg-slate-50 border-t border-slate-100"
                    onClick={() => {
                      setSaveMenuOpen(false);
                      performSave(false, 'update');
                    }}
                  >
                    Save and update template
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={requestEditorExit}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            aria-label="Close editor"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#F3F4F6]/50">
          <div className="bg-white border-b border-slate-100 px-6 py-1 flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar shadow-sm">
            <button
              type="button"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => exec('undo')}
            >
              <Undo2 size={16} />
            </button>
            <button
              type="button"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => exec('redo')}
            >
              <Redo2 size={16} />
            </button>
            <button
              type="button"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => window.print()}
            >
              <Printer size={16} />
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1" />
            <div className="flex items-center space-x-1 border border-slate-200 rounded px-2 py-0.5 bg-white cursor-pointer hover:bg-slate-50 min-w-[110px] justify-between">
              <span className="text-[12px] font-medium text-slate-700">Normal text</span>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
            <div className="flex items-center gap-1 border border-slate-200 rounded px-2 py-0.5 bg-white cursor-pointer hover:bg-slate-50 w-[130px] max-w-[130px] justify-between min-w-0">
              <span className="text-[12px] font-medium text-slate-700 truncate min-w-0 block text-left">
                Rippling&apos;s Default
              </span>
              <ChevronDown size={14} className="text-slate-400 shrink-0" />
            </div>
            <div className="h-6 w-px bg-slate-200 mx-1" />
            <div className="flex items-center gap-1">
              <button type="button" className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                <Minus size={14} />
              </button>
              <div className="px-2 py-0.5 border border-slate-200 rounded text-[12px] font-bold text-slate-700 min-w-[32px] text-center">11</div>
              <button type="button" className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                <Plus size={14} />
              </button>
            </div>
            <div className="h-6 w-px bg-slate-200 mx-1" />
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                className="p-1.5 hover:bg-slate-100 rounded font-bold text-slate-700"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('bold')}
              >
                <Bold size={16} />
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-slate-100 rounded italic text-slate-700"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('italic')}
              >
                <Italic size={16} />
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-slate-100 rounded underline text-slate-700"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('underline')}
              >
                <Underline size={16} />
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-400"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('formatBlock', 'pre')}
              >
                <Code size={16} />
              </button>
            </div>
            <div className="h-6 w-px bg-slate-200 mx-1" />
            <div className="flex items-center gap-0.5">
              <button type="button" className="p-1.5 hover:bg-slate-100 rounded flex flex-col items-center">
                <Baseline size={16} className="text-[#2563eb]" />
                <div className="w-3 h-0.5 bg-[#2563eb] mt-[1px]" />
              </button>
              <button type="button" className="p-1.5 hover:bg-slate-100 rounded flex flex-col items-center">
                <Baseline size={16} className="text-slate-700" />
                <div className="w-3 h-0.5 bg-slate-700 mt-[1px]" />
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('removeFormat')}
              >
                <Eraser size={16} />
              </button>
            </div>
            <div className="h-6 w-px bg-slate-200 mx-1" />
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('justifyLeft')}
              >
                <AlignLeft size={16} />
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('justifyCenter')}
              >
                <AlignCenter size={16} />
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('justifyRight')}
              >
                <AlignRight size={16} />
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('justifyFull')}
              >
                <AlignJustify size={16} />
              </button>
            </div>
            <div className="h-6 w-px bg-slate-200 mx-1" />
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('insertUnorderedList')}
              >
                <List size={16} />
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('insertOrderedList')}
              >
                <ListOrdered size={16} />
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-500 flex items-center"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('indent')}
              >
                <Indent size={16} />
                <ChevronDown size={10} className="ml-0.5" />
              </button>
            </div>
            <div className="h-6 w-px bg-slate-200 mx-1" />
            <button
              type="button"
              onClick={() => setRecipientPanelOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm shrink-0"
            >
              <LayoutGrid size={14} className="text-slate-500" />
              <span className="whitespace-nowrap">Recipient fields</span>
            </button>
            <button
              type="button"
              onClick={focusEditor}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm shrink-0"
            >
              <Zap size={14} className="fill-slate-700 text-slate-700" />
              <span className="whitespace-nowrap">Insert variable</span>
            </button>
            <button
              type="button"
              className="px-2.5 py-1 bg-[#f8fafc] border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 hover:bg-slate-100 shadow-sm shrink-0"
            >
              Import
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
            <div className="max-w-[850px] mx-auto bg-white shadow-xl min-h-[1100px] p-24 text-[15px] leading-relaxed text-slate-800 border border-slate-100">
              {useRichCanvas ? (
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={syncChipsAfterInput}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleEditorDrop}
                  onKeyDown={handleEditorKeyDown}
                  className="template-rich-editor w-full min-h-[900px] outline-none"
                />
              ) : (
                <>
                  <h1 className="text-center font-bold mb-12 text-lg uppercase tracking-tight">CCPA PRIVACY NOTICE FOR EMPLOYEES</h1>
                  <p className="mb-6">
                    <span className="inline-flex items-center bg-[#f1f5f9] border border-slate-200 rounded px-1.5 py-0.5 text-[12px] font-bold mx-1 text-slate-600">
                      BusinessLegalName <ChevronRight size={10} className="ml-1 text-slate-400" />
                    </span>
                    (the “Company,” “we,” “us,” “our”) is providing this Privacy Notice (“Notice”) pursuant to the California Consumer Privacy Act (“CCPA”) to inform you about:
                  </p>
                  <ol className="list-decimal space-y-6 ml-8 text-slate-700">
                    <li>
                      the Categories of Personal Information that Company collects through Rippling and integrated applications about employees, officers, directors, candidates, and contractors who reside in California (“Employees”); and,
                    </li>
                    <li>the purposes for which the Company uses that Personal Information (“Purposes of Use”).</li>
                  </ol>
                  <p className="mt-8 mb-8 text-slate-700">
                    If you do not reside in California, Company has decided to provide this notice as a courtesy to you. For purposes of this Notice, “Personal Information” means information that identifies, relates to, describes, is reasonably capable of being associated with...
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {recipientPanelOpen && (
          <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 transition-all duration-200">
            <div className="p-5 flex items-center justify-between border-b border-slate-100">
              <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">
                {sidePanelView === 'recipients' ? 'RECIPIENTS' : 'RECIPIENT FIELDS'}
              </span>
              <button type="button" onClick={() => setRecipientPanelOpen(false)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600" aria-label="Close panel">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar">
              <div ref={employeeMenuRef} className="relative z-30">
                <button
                  type="button"
                  onClick={() => {
                    setEmployeeMenuOpen((o) => {
                      const next = !o;
                      setEmployeeSearch('');
                      return next;
                    });
                  }}
                  className={`w-full border rounded-xl px-4 py-2.5 flex items-center justify-between bg-white hover:bg-slate-50 cursor-pointer shadow-sm transition-colors text-left ${
                    employeeMenuOpen ? 'ring-2 ring-blue-400 border-blue-500' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: activeTone.avatarBg, color: activeTone.avatarIcon }}
                    >
                      <User size={14} />
                    </div>
                    <span className="text-[13px] font-bold text-slate-800 truncate">
                      {activeRecipient?.label ?? 'Recipient'}
                    </span>
                  </div>
                  {employeeMenuOpen ? <ChevronDown size={16} className="text-slate-400 rotate-180 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
                </button>
                {employeeMenuOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100">
                      <Search size={16} className="text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                        placeholder="Search people"
                        className="flex-1 min-w-0 text-sm outline-none text-slate-900 placeholder:text-slate-400"
                        autoFocus
                      />
                      <ChevronDown size={14} className="text-slate-400 rotate-180 shrink-0" />
                    </div>
                    {!employeeQuery ? (
                      <div className="py-1">
                        {recipients.map((r) => {
                          const tone = RECIPIENT_TONE_PALETTE[r.paletteIndex % RECIPIENT_TONE_PALETTE.length];
                          return (
                            <button
                              key={r.id}
                              type="button"
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left"
                              onClick={() => {
                                setActiveRecipientId(r.id);
                                setEmployeeMenuOpen(false);
                              }}
                            >
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                                style={{ backgroundColor: tone.avatarBg, color: tone.avatarIcon }}
                              >
                                <User size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-slate-900">{r.label}</div>
                                <div className="text-xs text-slate-500">{r.sublabel}</div>
                              </div>
                              {activeRecipientId === r.id ? <Check size={18} className="text-blue-600 shrink-0" strokeWidth={2.5} /> : null}
                            </button>
                          );
                        })}
                        <div className="border-t border-slate-200" />
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left text-sm font-medium text-slate-900"
                          onClick={() => {
                            setEditingRecipientId(null);
                            setPlaceholderLabel('');
                            setPlaceholderModalOpen(true);
                          }}
                        >
                          <UserPlus size={18} className="text-slate-600 shrink-0" />
                          Add placeholder recipient
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="max-h-52 overflow-y-auto py-1">
                          {filteredEmployees.length === 0 ? (
                            <div className="px-4 py-6 text-sm text-slate-500 text-center">No matches</div>
                          ) : (
                            filteredEmployees.map((emp) => (
                              <button
                                key={emp.id}
                                type="button"
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left"
                                onClick={() => handleSelectInternalEmployee(emp)}
                              >
                                <img src={emp.avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 bg-slate-100" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-bold text-slate-900 truncate">{emp.name}</div>
                                  <div className="text-xs text-slate-500 truncate">{emp.dept}</div>
                                </div>
                                {recipients.some((r) => r.id === emp.id) || primaryMatchId === emp.id ? (
                                  <Check size={18} className="text-blue-600 shrink-0" strokeWidth={2.5} />
                                ) : null}
                              </button>
                            ))
                          )}
                        </div>
                        <div className="border-t border-slate-200" />
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left text-sm font-medium text-slate-900"
                          onClick={() => {
                            setEditingRecipientId(null);
                            setPlaceholderLabel(employeeSearch.trim());
                            setPlaceholderModalOpen(true);
                          }}
                        >
                          <UserPlus size={18} className="text-slate-600 shrink-0" />
                          <span className="truncate">
                            Add &apos;{employeeSearch.trim() || '…'}&apos; as a placeholder recipient
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {sidePanelView === 'fields' ? (
                <div className="space-y-3 pt-2">
                  {(['Text', 'Checkbox', 'Signature', 'Date signed'] as const).map((label, i) => {
                    const Icon = [Type, SquareCheck, PenTool, Calendar][i];
                    return (
                      <div
                        key={label}
                        draggable
                        onDragStart={startPaletteDrag(label)}
                        className="flex items-center justify-between p-3.5 rounded-xl cursor-grab active:cursor-grabbing hover:shadow-sm transition-all border"
                        style={{ backgroundColor: activeTone.bg, borderColor: activeTone.border }}
                        onDoubleClick={() => insertChipAtCaret(label)}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon size={18} style={{ color: activeTone.icon }} />
                          <span className="text-[14px] font-bold text-slate-900">
                            {label}
                          </span>
                        </div>
                        <GripVertical size={16} style={{ color: activeTone.border }} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1 pt-2">
                  {recipients.map((r) => {
                    const tone = RECIPIENT_TONE_PALETTE[r.paletteIndex % RECIPIENT_TONE_PALETTE.length];
                    const canDelete = recipients.length > 1;
                    const canRename = r.kind === 'placeholder' && r.id !== 'employee' && r.id !== 'manager';
                    return (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 px-1 py-2 rounded-lg hover:bg-slate-50"
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: tone.avatarBg, color: tone.avatarIcon }}
                        >
                          <User size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">{r.label}</div>
                          <div className="text-xs text-slate-500 truncate">{r.sublabel}</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {canRename && (
                            <button
                              type="button"
                              onClick={() => handleRenameRecipient(r.id)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                              aria-label={`Rename ${r.label}`}
                              title="Rename placeholder"
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteRecipient(r.id)}
                              className="p-1.5 rounded-md text-red-500 hover:text-red-600 hover:bg-red-50"
                              aria-label={`Remove ${r.label}`}
                              title="Remove recipient"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="w-14 bg-white border-l border-slate-200 flex flex-col items-center py-4 space-y-6 shrink-0 z-20">
          <button
            type="button"
            onClick={() => {
              setRecipientPanelOpen(true);
              setSidePanelView('fields');
            }}
            className={`p-2 rounded-lg shadow-sm transition-colors ${
              recipientPanelOpen && sidePanelView === 'fields'
                ? 'border border-[#7A005D]/20 bg-[#7A005D]/5 text-[#7A005D]'
                : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title="Recipient fields"
            aria-pressed={recipientPanelOpen && sidePanelView === 'fields'}
          >
            <Grid size={20} />
          </button>
          <button
            type="button"
            onClick={() => {
              setRecipientPanelOpen(true);
              setSidePanelView('recipients');
            }}
            className={`p-2 rounded-lg shadow-sm transition-colors ${
              recipientPanelOpen && sidePanelView === 'recipients'
                ? 'border border-[#7A005D]/20 bg-[#7A005D]/5 text-[#7A005D]'
                : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title="Recipients"
            aria-pressed={recipientPanelOpen && sidePanelView === 'recipients'}
          >
            <User size={20} />
          </button>
        </div>
      </div>

      {unsavedExitModalOpen && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setUnsavedExitModalOpen(false)}
          role="presentation"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-[640px] p-6 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-exit-title"
          >
            <div className="flex justify-between items-start gap-3 mb-2">
              <h2 id="unsaved-exit-title" className="text-lg font-bold text-slate-900 pr-2">
                Unsaved Changes
              </h2>
              <button
                type="button"
                className="p-1 text-slate-400 hover:text-slate-600 rounded shrink-0"
                onClick={() => setUnsavedExitModalOpen(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-6">
              You have unsaved contents. Are you sure you want to leave the editor without saving this template?
            </p>
            {isCreate ? (
              <div className="flex items-center justify-end gap-2 flex-nowrap">
                <button
                  type="button"
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 hover:bg-slate-50"
                  onClick={() => {
                    setUnsavedExitModalOpen(false);
                    onExit();
                  }}
                >
                  Leave without saving
                </button>
                <button
                  type="button"
                  className="px-4 py-2.5 rounded-xl bg-[#7A005D] text-white text-sm font-bold hover:opacity-95"
                  onClick={() => {
                    setUnsavedExitModalOpen(false);
                    performSave(true);
                  }}
                >
                  Save template
                </button>
              </div>
            ) : (
              // Editing an existing template gets the low-emphasis
              // "Save changes to template" text button on the left,
              // alongside the standard Leave / Save pair. The text
              // button intentionally has no border or fill so the
              // destructive overwrite stays the least eye-grabbing.
              <div className="flex items-center justify-end gap-2 flex-nowrap">
                <button
                  type="button"
                  className="px-2 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:underline rounded mr-auto"
                  onClick={() => {
                    setUnsavedExitModalOpen(false);
                    performSave(true, 'update');
                  }}
                >
                  Save changes to template
                </button>
                <button
                  type="button"
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 hover:bg-slate-50"
                  onClick={() => {
                    setUnsavedExitModalOpen(false);
                    onExit();
                  }}
                >
                  Leave without saving
                </button>
                <button
                  type="button"
                  className="px-4 py-2.5 rounded-xl bg-[#7A005D] text-white text-sm font-bold hover:opacity-95"
                  onClick={() => {
                    setUnsavedExitModalOpen(false);
                    performSave(true, 'new');
                  }}
                >
                  Save to this document
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {placeholderModalOpen && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            setPlaceholderModalOpen(false);
            setEditingRecipientId(null);
          }}
          role="presentation"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-[640px] p-6 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-placeholder-title"
          >
            <div className="flex justify-between items-start gap-3 mb-3">
              <h2 id="add-placeholder-title" className="text-lg font-bold text-slate-900 pr-2">
                {editingRecipientId ? 'Rename placeholder recipient' : 'Add placeholder recipient'}
              </h2>
              <button
                type="button"
                className="p-1 text-slate-400 hover:text-slate-600 rounded shrink-0"
                onClick={() => {
                  setPlaceholderModalOpen(false);
                  setEditingRecipientId(null);
                }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-5">
              Use a placeholder for people with a relationship to the employee a document is sent to.
              Each recipient&apos;s name and email address will be collected when the document is sent.
            </p>
            <div className="mb-6">
              <label htmlFor="placeholder-label-input" className="block text-sm font-bold text-slate-900 mb-1.5">
                Placeholder label<span className="text-red-500">*</span>
              </label>
              <input
                id="placeholder-label-input"
                type="text"
                value={placeholderLabel}
                onChange={(e) => setPlaceholderLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && placeholderLabel.trim()) {
                    e.preventDefault();
                    handleSavePlaceholderRecipient();
                  }
                }}
                placeholder="Placeholder label"
                autoFocus
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-end">
              <button
                type="button"
                disabled={!placeholderLabel.trim()}
                onClick={handleSavePlaceholderRecipient}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold ${
                  placeholderLabel.trim()
                    ? 'bg-[#7A005D] text-white hover:opacity-95'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateEditor;
