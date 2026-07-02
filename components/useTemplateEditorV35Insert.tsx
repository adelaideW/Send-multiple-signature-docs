import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { RefObject } from 'react';
import CombinedInsertMenu, { type CombinedMenuView } from './insertVariable/CombinedInsertMenu';
import RecipientAssignPopover, {
  type EmployeeRecord,
  type RecipientSelection,
} from './insertVariable/RecipientAssignPopover';
import ImportModal from './insertVariable/ImportModal';
import InsertLinkModal from './insertVariable/InsertLinkModal';
import LuminaAiPopover from './insertVariable/LuminaAiPopover';
import VariableChipRouteTooltip from './insertVariable/VariableChipRouteTooltip';
import { COMBINED_ROOT_ROW_COUNT, searchCombinedMenu } from './insertVariable/combinedMenuSearch';
import { computeCaretAnchorRect } from './insertVariable/editorSelectionUtils';
import { augmentItemForInsert, applyImportToEditor } from './insertVariable/importContent';
import {
  applyChipVisualState,
  insertBulletedListAtCaret,
  insertHtmlAtCaret,
  insertNumberedListAtCaret,
  insertVariableAtCaret,
} from './insertVariable/insertVariableAtCaret';
import { SLASH_BLOCK_ROWS, type SlashMenuItemId } from './insertVariable/SlashBlockMenu';
import { codeSnippetHtml, linkHtml, quoteBlockHtml } from './insertVariable/slashMenuContent';
import {
  getRecipientMetaForAssignment,
  parseRecipientFieldType,
  syncChipVariableDescription,
} from './insertVariable/variableDescriptions';
import { offerLetterDemoHtml } from './insertVariable/offerLetterDemoHtml';
import {
  createRecipientFieldChipElement,
  insertElementAtCaret,
  isRecipientFieldVariableItem,
  recipientIdForVariableItem,
} from '../utils/templateRecipientChips';
import {
  buildVariableDropdownRootForEditor,
  type EditorRecipientEntry,
} from '../utils/templateRecipientVariableCatalog';
import type { RecipientTone } from './insertVariable/recipientFieldsData';
import type { VariableDropdownHandle, VariableItem } from './VariableDropdown';

const INSERT_VERSION = 'v3_5' as const;

type Options = {
  editorRef: RefObject<HTMLDivElement | null>;
  enabled: boolean;
  insertTrigger: number;
  employees: readonly { id: string; name: string; avatar: string }[];
  recipients: EditorRecipientEntry[];
  activeRecipientId: string;
  toneForRecipientId: (recipientId: string | null | undefined) => RecipientTone;
  onContentChange?: () => void;
  onRecipientFieldInserted?: () => void;
  onSelectPlaceholderRecipient?: (recipientId: string) => void;
  /** Custom recipient fields open the placeholder modal instead of inserting immediately. */
  onDeferCustomFieldInsert?: (item: VariableItem, breakoutText: Text | null) => void;
};

export function useTemplateEditorV35Insert({
  editorRef,
  enabled,
  insertTrigger,
  employees,
  recipients,
  activeRecipientId,
  toneForRecipientId,
  onContentChange,
  onRecipientFieldInserted,
  onSelectPlaceholderRecipient,
  onDeferCustomFieldInsert,
}: Options) {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });
  const [slashActiveIndex, setSlashActiveIndex] = useState(0);
  const [combinedMenuView, setCombinedMenuView] = useState<CombinedMenuView>('root');
  const [searchActiveIndex, setSearchActiveIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [filteredItems, setFilteredItems] = useState<VariableItem[]>([]);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [aiPopoverOpen, setAiPopoverOpen] = useState(false);
  const [aiPopoverPos, setAiPopoverPos] = useState({ top: 0, left: 0 });
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [recipientPicker, setRecipientPicker] = useState({ isOpen: false, top: 0, left: 0 });
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [chipRouteTooltip, setChipRouteTooltip] = useState<{ description: string; rect: DOMRect } | null>(null);

  const variableDropdownRef = useRef<VariableDropdownHandle>(null);
  const recipientChipRef = useRef<HTMLElement | null>(null);
  const breakoutTextRef = useRef<Text | null>(null);
  const searchSelectAllRef = useRef(false);
  const emptyBackspaceCountRef = useRef(0);
  /** Last known caret inside the editor — used when toolbar clicks steal focus. */
  const lastCaretRangeRef = useRef<Range | null>(null);

  const employeeDirectory = useMemo<EmployeeRecord[]>(
    () => employees.map((e) => ({ id: e.id, name: e.name, avatarUrl: e.avatar })),
    [employees],
  );

  const variableDropdownRoot = useMemo(
    () => buildVariableDropdownRootForEditor(recipients),
    [recipients],
  );

  const combinedSearchResults = useMemo(
    () => searchCombinedMenu(searchQuery, variableDropdownRoot),
    [searchQuery, variableDropdownRoot],
  );

  const notifyChange = useCallback(() => {
    onContentChange?.();
  }, [onContentChange]);

  const captureCaretRange = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return null;
    const sel = window.getSelection();
    if (!sel?.rangeCount) return lastCaretRangeRef.current;
    const range = sel.getRangeAt(0);
    if (!ed.contains(range.commonAncestorContainer)) return lastCaretRangeRef.current;
    const collapsed = range.cloneRange();
    collapsed.collapse(true);
    lastCaretRangeRef.current = collapsed;
    return collapsed;
  }, [editorRef]);

  const restoreSavedCaret = useCallback(() => {
    const ed = editorRef.current;
    const saved = lastCaretRangeRef.current;
    if (!ed || !saved || !ed.contains(saved.startContainer)) return;
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(saved.cloneRange());
  }, [editorRef]);

  const computeCaretAnchor = useCallback(
    () => computeCaretAnchorRect(editorRef.current, lastCaretRangeRef.current),
    [editorRef],
  );

  const updateInsertMenuPosition = useCallback(() => {
    captureCaretRange();
    setSlashMenuPos(computeCaretAnchor());
  }, [captureCaretRange, computeCaretAnchor]);

  const closeRecipientPicker = useCallback(() => {
    recipientChipRef.current = null;
    setRecipientPicker((prev) => ({ ...prev, isOpen: false }));
    setSelectedRecipientId(null);
  }, []);

  const dismissVariablePicker = useCallback(() => {
    setShowSlashMenu(false);
    setCombinedMenuView('root');
    setSearchQuery('');
    setActiveIndex(0);
    setSearchActiveIndex(0);
    breakoutTextRef.current = null;
    searchSelectAllRef.current = false;
    emptyBackspaceCountRef.current = 0;
  }, []);

  const afterChipInserted = useCallback(() => {
    dismissVariablePicker();
    notifyChange();
  }, [dismissVariablePicker, notifyChange]);

  const handleVariableSelect = useCallback(
    (item: VariableItem) => {
      const ed = editorRef.current;
      if (!ed) return;

      if (isRecipientFieldVariableItem(item)) {
        const label = item.insertLabel ?? item.label;

        if (item.needsRecipient && onDeferCustomFieldInsert) {
          onDeferCustomFieldInsert(item, breakoutTextRef.current);
          breakoutTextRef.current = null;
          dismissVariablePicker();
          return;
        }

        const recipientId = recipientIdForVariableItem(item, activeRecipientId);
        if (item.placeholderRecipientId) {
          onSelectPlaceholderRecipient?.(item.placeholderRecipientId);
        }
        const chip = createRecipientFieldChipElement(
          label,
          recipientId,
          toneForRecipientId(recipientId),
        );
        insertElementAtCaret(ed, chip, breakoutTextRef.current, () => {
          onRecipientFieldInserted?.();
          afterChipInserted();
        });
        return;
      }

      insertVariableAtCaret({
        editorEl: ed,
        item: augmentItemForInsert(item, INSERT_VERSION),
        breakoutText: breakoutTextRef.current,
        onInserted: afterChipInserted,
      });
    },
    [
      editorRef,
      activeRecipientId,
      toneForRecipientId,
      afterChipInserted,
      onRecipientFieldInserted,
      onSelectPlaceholderRecipient,
      onDeferCustomFieldInsert,
      dismissVariablePicker,
    ],
  );

  const removeSlashBeforeCaret = useCallback(() => {
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    const range = sel.getRangeAt(0);
    const sc = range.startContainer;
    if (sc.nodeType === Node.TEXT_NODE) {
      const t = sc as Text;
      const offset = range.startOffset;
      if (offset > 0 && t.data.charAt(offset - 1) === '/') {
        t.deleteData(offset - 1, 1);
        const r = document.createRange();
        r.setStart(t, offset - 1);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
      }
    }
  }, []);

  const openCombinedMenuAtCaret = useCallback(() => {
    captureCaretRange();
    removeSlashBeforeCaret();
    captureCaretRange();
    setShowSlashMenu(true);
    setCombinedMenuView('root');
    setSearchQuery('');
    setActiveIndex(0);
    setSlashActiveIndex(0);
    setSearchActiveIndex(0);
    emptyBackspaceCountRef.current = 0;
    requestAnimationFrame(() => {
      captureCaretRange();
      setSlashMenuPos(computeCaretAnchor());
    });
  }, [captureCaretRange, computeCaretAnchor, removeSlashBeforeCaret]);

  const drillIntoCombinedVariables = useCallback(() => {
    setCombinedMenuView('variablesDrillIn');
    setActiveIndex(0);
  }, []);

  const openLuminaAiPopover = useCallback(() => {
    setAiPopoverPos(computeCaretAnchor());
    setShowSlashMenu(false);
    setCombinedMenuView('root');
    setSearchQuery('');
    setAiPopoverOpen(true);
    setAiPrompt('');
  }, [computeCaretAnchor]);

  const replaceChipWithBreakoutText = useCallback(
    (chip: HTMLElement) => {
      const ed = editorRef.current;
      if (!ed) return false;
      const label = chip.getAttribute('data-variable') ?? '';
      const parent = chip.parentNode;
      if (!parent) return false;

      const textNode = document.createTextNode(label);
      parent.replaceChild(textNode, chip);
      breakoutTextRef.current = textNode;
      setSearchQuery(label);
      setActiveIndex(0);
      emptyBackspaceCountRef.current = 0;
      setSlashMenuPos(computeCaretAnchor());
      setShowSlashMenu(true);
      setCombinedMenuView('variablesDrillIn');

      const sel = window.getSelection();
      if (sel) {
        const r = document.createRange();
        r.setStart(textNode, textNode.data.length);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
      }
      requestAnimationFrame(updateInsertMenuPosition);
      return true;
    },
    [editorRef, computeCaretAnchor, updateInsertMenuPosition],
  );

  const openRecipientPickerForChip = useCallback((chip: HTMLElement) => {
    const rect = chip.getBoundingClientRect();
    recipientChipRef.current = chip;
    setSelectedRecipientId(chip.getAttribute('data-related-recipient-id'));
    setRecipientPicker({
      isOpen: true,
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 360),
    });
  }, []);

  const resolveChipRecipient = useCallback(
    (selection: RecipientSelection) => {
      const chip = recipientChipRef.current;
      if (!chip) return;

      if (selection.kind === 'placeholder') {
        chip.setAttribute('data-related-recipient', selection.label);
        chip.setAttribute('data-related-recipient-id', selection.id);
        chip.setAttribute('data-recipient-kind', 'placeholder');
      } else {
        chip.setAttribute('data-related-recipient', selection.employee.name);
        chip.setAttribute('data-related-recipient-id', selection.employee.id);
        chip.setAttribute('data-recipient-kind', 'internal');
      }

      const fieldType = parseRecipientFieldType(chip.getAttribute('data-field-type'));
      const meta = getRecipientMetaForAssignment(selection, fieldType);
      chip.setAttribute('data-recipient-type', meta.recipientType);
      if (meta.assignedRoleLabel) {
        chip.setAttribute('data-assigned-role-label', meta.assignedRoleLabel);
      } else {
        chip.removeAttribute('data-assigned-role-label');
      }

      chip.setAttribute('data-needs-recipient', 'false');
      syncChipVariableDescription(chip);
      applyChipVisualState(chip, false);
      closeRecipientPicker();
      notifyChange();
    },
    [closeRecipientPicker, notifyChange],
  );

  const handleSlashSelect = useCallback(
    (id: SlashMenuItemId) => {
      if (id === 'write-with-ai') {
        openLuminaAiPopover();
        return;
      }

      setShowSlashMenu(false);
      setCombinedMenuView('root');
      const ed = editorRef.current;
      if (!ed) return;

      if (id === 'import') {
        setImportModalOpen(true);
        return;
      }
      if (id === 'link') {
        setLinkModalOpen(true);
        return;
      }
      if (id === 'bulleted-list') {
        insertBulletedListAtCaret(ed, notifyChange);
        return;
      }
      if (id === 'numbered-list') {
        insertNumberedListAtCaret(ed, notifyChange);
        return;
      }

      const htmlById: Record<string, string> = {
        divider: '<hr><p><br></p>',
        quote: quoteBlockHtml(),
        'normal-text': '<p>Text</p>&nbsp;',
        'code-snippet': codeSnippetHtml(),
      };
      if (htmlById[id]) {
        insertHtmlAtCaret(ed, htmlById[id], notifyChange);
      }
    },
    [editorRef, notifyChange, openLuminaAiPopover],
  );

  const handleCombinedSearchEnter = useCallback(
    (index: number) => {
      const row = combinedSearchResults[index];
      if (!row) return;
      if (row.kind === 'block') handleSlashSelect(row.id);
      else handleVariableSelect(row.item);
    },
    [combinedSearchResults, handleSlashSelect, handleVariableSelect],
  );

  const handleImport = useCallback(
    async (payload: { file?: File; url?: string }) => {
      const ed = editorRef.current;
      if (!ed) return;
      await applyImportToEditor(ed, payload);
      setShowSlashMenu(false);
      setCombinedMenuView('root');
      notifyChange();
    },
    [editorRef, notifyChange],
  );

  const handleLinkInsert = useCallback(
    (url: string, label: string) => {
      const ed = editorRef.current;
      if (!ed) return;
      insertHtmlAtCaret(ed, linkHtml(url, label), notifyChange);
    },
    [editorRef, notifyChange],
  );

  const handleCanvasAiGenerate = useCallback(async () => {
    const ed = editorRef.current;
    if (!ed || !aiPrompt.trim()) return;
    setAiLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    ed.innerHTML = offerLetterDemoHtml();
    setAiPopoverOpen(false);
    setAiPrompt('');
    setAiLoading(false);
    notifyChange();
  }, [editorRef, aiPrompt, notifyChange]);

  useLayoutEffect(() => {
    if (!enabled || !insertTrigger || insertTrigger <= 0 || !editorRef.current) return;
    editorRef.current.focus();
    restoreSavedCaret();
    breakoutTextRef.current = null;
    emptyBackspaceCountRef.current = 0;
    setShowSlashMenu(true);
    setCombinedMenuView('root');
    setSearchQuery('');
    setActiveIndex(0);
    setSlashActiveIndex(0);
    setSearchActiveIndex(0);
    requestAnimationFrame(() => {
      restoreSavedCaret();
      captureCaretRange();
      setSlashMenuPos(computeCaretAnchor());
    });
  }, [
    insertTrigger,
    enabled,
    editorRef,
    computeCaretAnchor,
    restoreSavedCaret,
    captureCaretRange,
  ]);

  useEffect(() => {
    if (!enabled) return;
    const ed = editorRef.current;
    if (!ed) return;

    const onSelectionChange = () => {
      captureCaretRange();
    };

    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [enabled, editorRef, captureCaretRange]);

  useEffect(() => {
    setSearchActiveIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    setActiveIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (!showSlashMenu) return;
    const ro = new ResizeObserver(() => updateInsertMenuPosition());
    const root = editorRef.current?.closest('.overflow-y-auto') ?? document.documentElement;
    ro.observe(root);
    window.addEventListener('scroll', updateInsertMenuPosition, true);
    window.addEventListener('resize', updateInsertMenuPosition);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', updateInsertMenuPosition, true);
      window.removeEventListener('resize', updateInsertMenuPosition);
    };
  }, [showSlashMenu, updateInsertMenuPosition, editorRef]);

  const onEditorInput = useCallback(() => {
    const detachedBo = breakoutTextRef.current;
    if (detachedBo && !detachedBo.parentNode) {
      breakoutTextRef.current = null;
      dismissVariablePicker();
    }
    const activeBo = breakoutTextRef.current;
    if (activeBo?.parentNode) {
      setSearchQuery(activeBo.data);
      if (activeBo.data === '') emptyBackspaceCountRef.current = 0;
      else emptyBackspaceCountRef.current = 0;
    }
    if (showSlashMenu) requestAnimationFrame(updateInsertMenuPosition);
  }, [showSlashMenu, dismissVariablePicker, updateInsertMenuPosition]);

  const onEditorClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const deleteBtn = target.closest('.chip-delete-btn');
      if (deleteBtn) {
        const chip = deleteBtn.closest('.variable-chip');
        if (chip) {
          chip.remove();
          notifyChange();
        }
        return;
      }

      const chip = target.closest('.variable-chip') as HTMLElement | null;
      if (chip?.getAttribute('data-needs-recipient') === 'true') {
        openRecipientPickerForChip(chip);
        return;
      }
      if (!chip) closeRecipientPicker();

      if (showSlashMenu) dismissVariablePicker();
    },
    [notifyChange, openRecipientPickerForChip, closeRecipientPicker, showSlashMenu, dismissVariablePicker],
  );

  const onEditorKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): boolean => {
      if (!enabled) return false;

      const overlaysClosed = !showSlashMenu && !linkModalOpen && !importModalOpen && !aiPopoverOpen;
      const combinedMenuOpen = showSlashMenu;
      const combinedSearchActive = combinedMenuOpen && searchQuery.trim().length > 0;
      const combinedDrillActive = combinedMenuOpen && combinedMenuView === 'variablesDrillIn' && !searchQuery.trim();
      const combinedRootActive = combinedMenuOpen && combinedMenuView === 'root' && !searchQuery.trim();

      if (combinedSearchActive || combinedDrillActive) {
        const mod = e.ctrlKey || e.metaKey || e.altKey;
        const inBreakout = !!breakoutTextRef.current?.parentNode;

        if (inBreakout) {
          if (e.key === 'Backspace' || e.key === 'Delete') {
            const bo = breakoutTextRef.current;
            if (bo?.parentNode && bo.data.length === 0 && e.key === 'Backspace') {
              e.preventDefault();
              emptyBackspaceCountRef.current += 1;
              if (emptyBackspaceCountRef.current >= 2) {
                bo.remove();
                dismissVariablePicker();
              }
              return true;
            }
            return false;
          }
          if (!mod && e.key.length === 1) return false;
        } else {
          if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
            e.preventDefault();
            searchSelectAllRef.current = true;
            return true;
          }
          if (e.key === 'Backspace' || e.key === 'Delete') {
            if (searchSelectAllRef.current) {
              searchSelectAllRef.current = false;
              e.preventDefault();
              setSearchQuery('');
              emptyBackspaceCountRef.current = 0;
              requestAnimationFrame(updateInsertMenuPosition);
              return true;
            }
            if (e.key === 'Backspace') {
              if (searchQuery.length > 0) {
                e.preventDefault();
                setSearchQuery((s) => s.slice(0, -1));
                emptyBackspaceCountRef.current = 0;
                requestAnimationFrame(updateInsertMenuPosition);
                return true;
              }
              e.preventDefault();
              emptyBackspaceCountRef.current += 1;
              if (emptyBackspaceCountRef.current >= 2) dismissVariablePicker();
              return true;
            }
          }
          if (!mod && e.key.length === 1) {
            searchSelectAllRef.current = false;
            emptyBackspaceCountRef.current = 0;
            e.preventDefault();
            setSearchQuery((s) => s + e.key);
            requestAnimationFrame(updateInsertMenuPosition);
            return true;
          }
        }

        if (combinedSearchActive) {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSearchActiveIndex((prev) =>
              combinedSearchResults.length > 0 ? (prev + 1) % combinedSearchResults.length : 0,
            );
            return true;
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSearchActiveIndex((prev) =>
              combinedSearchResults.length > 0
                ? (prev - 1 + combinedSearchResults.length) % combinedSearchResults.length
                : 0,
            );
            return true;
          }
          if (e.key === 'Enter') {
            e.preventDefault();
            handleCombinedSearchEnter(searchActiveIndex);
            return true;
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            dismissVariablePicker();
            return true;
          }
          return true;
        }

        if (combinedDrillActive) {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((prev) => (filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0));
            return true;
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) =>
              filteredItems.length > 0 ? (prev - 1 + filteredItems.length) % filteredItems.length : 0,
            );
            return true;
          }
          if (e.key === 'ArrowRight') {
            if (variableDropdownRef.current?.drillInto()) e.preventDefault();
            return true;
          }
          if (e.key === 'ArrowLeft') {
            if (variableDropdownRef.current?.drillOut()) e.preventDefault();
            else {
              setCombinedMenuView('root');
              setSlashActiveIndex(0);
            }
            return true;
          }
          if (e.key === 'Enter') {
            if (variableDropdownRef.current?.activateSelection()) e.preventDefault();
            return true;
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            dismissVariablePicker();
            return true;
          }
          return true;
        }
      }

      if (combinedRootActive) {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          setSearchQuery((s) => s + e.key);
          return true;
        }
        if (e.key === 'Backspace') {
          if (searchQuery.length > 0) {
            e.preventDefault();
            setSearchQuery((s) => s.slice(0, -1));
            return true;
          }
          e.preventDefault();
          emptyBackspaceCountRef.current += 1;
          if (emptyBackspaceCountRef.current >= 2) dismissVariablePicker();
          return true;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSlashActiveIndex((prev) => (prev + 1) % COMBINED_ROOT_ROW_COUNT);
          return true;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSlashActiveIndex((prev) => (prev - 1 + COMBINED_ROOT_ROW_COUNT) % COMBINED_ROOT_ROW_COUNT);
          return true;
        }
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
          e.preventDefault();
          if (slashActiveIndex === 0) handleSlashSelect('write-with-ai');
          else if (slashActiveIndex === 1) drillIntoCombinedVariables();
          else if (slashActiveIndex === 2) handleSlashSelect('import');
          else {
            const block = SLASH_BLOCK_ROWS[slashActiveIndex - 3];
            if (block) handleSlashSelect(block.id);
          }
          return true;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          dismissVariablePicker();
          return true;
        }
        return true;
      }

      if (overlaysClosed && e.key === '/') {
        e.preventDefault();
        openCombinedMenuAtCaret();
        return true;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        const sel = window.getSelection();
        if (sel?.rangeCount) {
          const range = sel.getRangeAt(0);
          if (range.collapsed) {
            let chipToBreak: HTMLElement | null = null;
            const sc = range.startContainer;
            if (e.key === 'Backspace') {
              if (sc.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
                const t = sc as Text;
                const prev = t.previousSibling;
                const charBeforeCaret = t.data.charAt(range.startOffset - 1);
                const isNbspPrev = t.data.charCodeAt(range.startOffset - 1) === 160 || charBeforeCaret === ' ';
                if (isNbspPrev && prev instanceof HTMLElement && prev.classList.contains('variable-chip')) {
                  chipToBreak = prev;
                }
              } else if (sc.nodeType === Node.TEXT_NODE && range.startOffset === 0) {
                const prev = sc.previousSibling;
                if (prev instanceof HTMLElement && prev.classList.contains('variable-chip')) chipToBreak = prev;
              } else if (sc.nodeType === Node.ELEMENT_NODE && range.startOffset > 0) {
                const prev = sc.childNodes[range.startOffset - 1];
                if (prev instanceof HTMLElement && prev.classList.contains('variable-chip')) chipToBreak = prev;
              }
            } else if (e.key === 'Delete') {
              if (sc.nodeType === Node.TEXT_NODE) {
                const t = sc as Text;
                if (range.startOffset === t.data.length) {
                  const nx = t.nextSibling;
                  if (nx instanceof HTMLElement && nx.classList.contains('variable-chip')) chipToBreak = nx;
                }
              } else if (sc.nodeType === Node.ELEMENT_NODE && range.startOffset < sc.childNodes.length) {
                const nx = sc.childNodes[range.startOffset];
                if (nx instanceof HTMLElement && nx.classList.contains('variable-chip')) chipToBreak = nx;
              }
            }
            if (chipToBreak) {
              e.preventDefault();
              replaceChipWithBreakoutText(chipToBreak);
              return true;
            }
          }
        }
      }

      return false;
    },
    [
      enabled,
      showSlashMenu,
      linkModalOpen,
      importModalOpen,
      aiPopoverOpen,
      searchQuery,
      combinedMenuView,
      combinedSearchResults,
      searchActiveIndex,
      filteredItems,
      slashActiveIndex,
      dismissVariablePicker,
      handleCombinedSearchEnter,
      drillIntoCombinedVariables,
      handleSlashSelect,
      openCombinedMenuAtCaret,
      replaceChipWithBreakoutText,
      updateInsertMenuPosition,
    ],
  );

  const overlays = enabled ? (
    <>
      {showSlashMenu && (
        <CombinedInsertMenu
          top={slashMenuPos.top}
          left={slashMenuPos.left}
          combinedMenuView={combinedMenuView}
          searchQuery={searchQuery}
          searchResults={combinedSearchResults}
          searchActiveIndex={searchActiveIndex}
          rootActiveIndex={slashActiveIndex}
          activeIndex={activeIndex}
          variableDropdownRef={variableDropdownRef}
          variableDropdownRoot={variableDropdownRoot}
          onSelect={handleVariableSelect}
          onFilteredItemsChange={setFilteredItems}
          onMenuNavigate={() => setActiveIndex(0)}
          onVariableRowHover={setActiveIndex}
          onDrillIntoVariables={drillIntoCombinedVariables}
          onBackToRoot={() => {
            setCombinedMenuView('root');
            setSlashActiveIndex(0);
          }}
          onBlockSelect={handleSlashSelect}
          onRootRowHover={setSlashActiveIndex}
          onSearchRowHover={setSearchActiveIndex}
          onSearchBlockSelect={handleSlashSelect}
          onSearchVariableSelect={handleVariableSelect}
        />
      )}
      {recipientPicker.isOpen && (
        <RecipientAssignPopover
          top={recipientPicker.top}
          left={recipientPicker.left}
          employees={employeeDirectory}
          selectedRecipientId={selectedRecipientId}
          onSelect={resolveChipRecipient}
          onClose={closeRecipientPicker}
        />
      )}
      <ImportModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} onImport={handleImport} />
      <InsertLinkModal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        onInsert={handleLinkInsert}
      />
      {aiPopoverOpen && (
        <LuminaAiPopover
          top={aiPopoverPos.top}
          left={aiPopoverPos.left}
          prompt={aiPrompt}
          loading={aiLoading}
          onPromptChange={setAiPrompt}
          onCancel={() => {
            setAiPopoverOpen(false);
            setAiPrompt('');
          }}
          onGenerate={handleCanvasAiGenerate}
        />
      )}
      {chipRouteTooltip && (
        <VariableChipRouteTooltip description={chipRouteTooltip.description} anchorRect={chipRouteTooltip.rect} />
      )}
    </>
  ) : null;

  return {
    onEditorKeyDown,
    onEditorClick,
    onEditorInput,
    overlays,
    openInsertMenuAtCaret: openCombinedMenuAtCaret,
  };
}
