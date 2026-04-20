import React, { useState, useRef, useEffect, useCallback } from 'react';
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
} from 'lucide-react';

const RECIPIENT_FIELD_MIME = 'application/x-recipient-field-label';
const CHIP_ATTR = 'recipient-field';

/** Match recipient-field chips in side panel; text inherits line formatting. */
const CHIP_CLASS =
  'inline-flex items-center align-baseline mx-0.5 px-2 py-0.5 rounded-md text-inherit font-inherit leading-inherit bg-[#FDF2FB] border border-[#F5D0EE] cursor-grab active:cursor-grabbing select-none';

const MOCK_EMPLOYEES = [
  { id: '1', name: 'Angel Hunter', dept: 'Engineering', avatar: 'https://i.pravatar.cc/40?u=angel-hunter' },
  { id: '2', name: 'Angie Adams', dept: 'Marketing', avatar: 'https://i.pravatar.cc/40?u=angie-adams' },
  { id: '3', name: 'Anna Taylor', dept: 'Accounting', avatar: 'https://i.pravatar.cc/40?u=anna-taylor' },
  { id: '4', name: 'Anne Montgomery', dept: 'CEO', avatar: 'https://i.pravatar.cc/40?u=anne-montgomery' },
  { id: '5', name: 'James Chen', dept: 'Design', avatar: 'https://i.pravatar.cc/40?u=james-chen' },
  { id: '6', name: 'Maria Santos', dept: 'People Operations', avatar: 'https://i.pravatar.cc/40?u=maria-santos' },
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

function createChipElement(label: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.setAttribute('data-chip', CHIP_ATTR);
  span.setAttribute('data-label', label);
  span.setAttribute('draggable', 'true');
  span.setAttribute('tabindex', '0');
  span.contentEditable = 'false';
  span.className = CHIP_CLASS;
  span.textContent = label;
  return span;
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
  const [employeeRole, setEmployeeRole] = useState<'employee' | 'manager'>('employee');
  const editorRef = useRef<HTMLDivElement>(null);
  const chipMoveRef = useRef<HTMLElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const syncingTitleFromBar = useRef(false);
  const employeeMenuRef = useRef<HTMLDivElement>(null);

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
  };

  const wireChipDragHandlers = useCallback((root: HTMLElement) => {
    root.querySelectorAll(`span[data-chip="${CHIP_ATTR}"]`).forEach((el) => {
      const chip = el as HTMLElement;
      chip.setAttribute('draggable', 'true');
      chip.className = CHIP_CLASS;
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
  }, []);

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

  const insertChipAtCaret = useCallback((label: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      editor.appendChild(createChipElement(label));
      wireChipDragHandlers(editor);
      return;
    }
    let range = sel.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }
    range.deleteContents();
    const chip = createChipElement(label);
    range.insertNode(chip);
    range.setStartAfter(chip);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    wireChipDragHandlers(editor);
  }, [wireChipDragHandlers]);

  const handleEditorDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const editor = editorRef.current;
      if (!editor) return;

      const moveEl = chipMoveRef.current;
      chipMoveRef.current = null;

      const label = e.dataTransfer.getData(RECIPIENT_FIELD_MIME);
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
        return;
      }

      if (label) {
        range.deleteContents();
        const chip = createChipElement(label);
        range.insertNode(chip);
        const sel = window.getSelection();
        if (sel) {
          range.setStartAfter(chip);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
        wireChipDragHandlers(editor);
      }
    },
    [wireChipDragHandlers]
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
      }
    }
    if (anchorNode.nodeType === Node.ELEMENT_NODE) {
      const el = anchorNode as HTMLElement;
      const child = el.childNodes[anchorOffset - 1];
      if (e.key === 'Backspace' && child instanceof HTMLElement && child.dataset.chip === CHIP_ATTR) {
        e.preventDefault();
        child.remove();
      }
    }
  };

  const startPaletteDrag = (label: string) => (e: React.DragEvent) => {
    e.dataTransfer.setData(RECIPIENT_FIELD_MIME, label);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const syncChipsAfterInput = () => {
    const ed = editorRef.current;
    if (!ed) return;
    normalizeTitleParagraphs(ed);
    if (!syncingTitleFromBar.current) {
      setTemplateName(readTitleFromEditor());
    }
    wireChipDragHandlers(ed);
  };

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
          <button
            type="button"
            onClick={() => setRecipientPanelOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <LayoutGrid size={16} className="text-slate-500" />
            <span>Recipient fields</span>
          </button>
          <button className="flex items-center space-x-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <Zap size={16} className="fill-slate-700 text-slate-700" />
            <span>Insert variable</span>
          </button>
          <button className="px-4 py-1.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-100 shadow-sm">Preview</button>
          <button className="px-4 py-1.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-100 shadow-sm">Import</button>
          <button
            type="button"
            onClick={() => {
              const name = templateName.trim() || readTitleFromEditor().trim() || 'Untitled template';
              const body = useRichCanvas && editorRef.current ? editorRef.current.innerHTML : '';
              if (isCreate && onSaveNewTemplate) {
                onSaveNewTemplate(name, body);
              } else if (!isCreate && onUpdateTemplate) {
                onUpdateTemplate(name, body);
              } else {
                onExit();
              }
            }}
            className="px-6 py-1.5 bg-[#7A005D] text-white rounded-xl text-[13px] font-bold hover:opacity-95 transition-all shadow-md ml-1"
          >
            Save
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
            <div className="flex items-center space-x-1 border border-slate-200 rounded px-2 py-0.5 bg-white cursor-pointer hover:bg-slate-50 min-w-[130px] justify-between">
              <span className="text-[12px] font-medium text-slate-700">Rippling&apos;s Default</span>
              <ChevronDown size={14} className="text-slate-400" />
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
              <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">RECIPIENT FIELDS</span>
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
                    <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                      <User size={14} />
                    </div>
                    <span className="text-[13px] font-bold text-slate-800 truncate">Employee</span>
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
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left"
                          onClick={() => setEmployeeRole('employee')}
                        >
                          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                            <User size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900">Employee</div>
                            <div className="text-xs text-slate-500">Placeholder</div>
                          </div>
                          {employeeRole === 'employee' ? <Check size={18} className="text-blue-600 shrink-0" strokeWidth={2.5} /> : null}
                        </button>
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left"
                          onClick={() => setEmployeeRole('manager')}
                        >
                          <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                            <User size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900">Employee&apos;s manager</div>
                            <div className="text-xs text-slate-500">Placeholder</div>
                          </div>
                          {employeeRole === 'manager' ? <Check size={18} className="text-blue-600 shrink-0" strokeWidth={2.5} /> : null}
                        </button>
                        <div className="border-t border-slate-200" />
                        <button type="button" className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left text-sm font-medium text-slate-900">
                          <UserPlus size={18} className="text-slate-600 shrink-0" />
                          Add external recipient
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
                              >
                                <img src={emp.avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 bg-slate-100" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-bold text-slate-900 truncate">{emp.name}</div>
                                  <div className="text-xs text-slate-500 truncate">{emp.dept}</div>
                                </div>
                                {primaryMatchId === emp.id ? <Check size={18} className="text-blue-600 shrink-0" strokeWidth={2.5} /> : null}
                              </button>
                            ))
                          )}
                        </div>
                        <div className="border-t border-slate-200" />
                        <button type="button" className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left text-sm font-medium text-slate-900">
                          <UserPlus size={18} className="text-slate-600 shrink-0" />
                          <span className="truncate">
                            Add &apos;{employeeSearch.trim() || '…'}&apos; as an external recipient
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-3 pt-2">
                {(['Text', 'Checkbox', 'Signature', 'Date signed'] as const).map((label, i) => {
                  const Icon = [Type, SquareCheck, PenTool, Calendar][i];
                  return (
                    <div
                      key={label}
                      draggable
                      onDragStart={startPaletteDrag(label)}
                      className="flex items-center justify-between bg-[#FDF2FB] border border-[#F5D0EE] p-3.5 rounded-xl cursor-grab active:cursor-grabbing hover:shadow-sm transition-all"
                      onDoubleClick={() => insertChipAtCaret(label)}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon size={18} className="text-[#7A005D]" />
                        <span className="text-[14px] font-bold text-[#7A005D]">{label}</span>
                      </div>
                      <GripVertical size={16} className="text-[#F5D0EE]" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="w-14 bg-white border-l border-slate-200 flex flex-col items-center py-4 space-y-6 shrink-0 z-20">
          <button
            type="button"
            onClick={() => setRecipientPanelOpen(true)}
            className={`p-2 rounded-lg shadow-sm transition-colors ${recipientPanelOpen ? 'border border-[#7A005D]/20 bg-[#7A005D]/5 text-[#7A005D]' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            title="Recipient fields"
          >
            <Grid size={20} />
          </button>
          <div className="p-2 text-slate-300 hover:text-slate-500 rounded-lg cursor-pointer transition-colors">
            <User size={20} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
