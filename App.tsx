import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PortfolioReturnLink } from './components/PortfolioReturnLink';
import { Check, X } from 'lucide-react';
import Header from './components/Header';
import ToolsSidePanel from './components/ToolsSidePanel';
import { EmployeeHeaderSection, EmployeeDocumentsSection, type ActionPacketRow } from './components/EmployeeProfile';
import EnvelopeCreator from './components/EnvelopeCreator';
import TemplateEditor from './components/TemplateEditor';
import EnvelopeDetailsView from './components/EnvelopeDetailsView';
import DocumentReviewView from './components/DocumentReviewView';
import PeopleTabView, { type SendDocumentPerson } from './components/PeopleTabView';
import GeminiAssistant from './components/GeminiAssistant';
import { MOCK_EMPLOYEE, ENVELOPE_NAME_MAX_LENGTH } from './constants';
import { SNACKBAR_AUTO_DISMISS_MS } from './constants/snackbar';
import type { UploadedFileItem } from './types';
import type { EnvelopeTableRow, EnvelopeDocumentRow, DocumentSigningStatus, EnvelopeStatus, EnvelopeRecipientRow, CompletedEnvelopeDoc } from './components/EnvelopesListView';
import { cloneInitialEnvelopeRows } from './components/EnvelopesListView';
import type { DocumentReviewFlow } from './components/DocumentReviewView';
import { createInitialProfileFolderRoot, type ProfileFolderNode } from './utils/profileFolderUtils';

type ViewType = 'profile' | 'envelope' | 'template_editor' | 'envelope_details' | 'document_review' | 'people_tab';

/** Deep-link anchor for Documents hub → Profile Folders tab (`#profile-folders`). */
const PROFILE_FOLDERS_HASH = 'profile-folders';

function parseProfileFoldersFromLocation(): boolean {
  try {
    const h = window.location.hash.replace(/^#/, '').replace(/^\/+/, '').trim().toLowerCase();
    if (h === PROFILE_FOLDERS_HASH || h === 'profile-folder') return true;
    const raw = new URLSearchParams(window.location.search).get('tab');
    if (!raw) return false;
    const t = raw.trim().toLowerCase().replace(/_/g, '-');
    return t === 'profile-folder' || t === 'profile-folders';
  } catch {
    return false;
  }
}

function syncHubTabToUrl(tab: string) {
  if (typeof window === 'undefined') return;
  const { pathname, search } = window.location;
  if (tab === 'Profile Folders') {
    window.history.replaceState(null, '', `${pathname}${search}#${PROFILE_FOLDERS_HASH}`);
  } else {
    window.history.replaceState(null, '', `${pathname}${search}`);
  }
}

// Define the state structure for persistent envelope creation
interface EnvelopeState {
  selectedTemplates: string[];
  uploadedFiles: UploadedFileItem[];
  recipients: any[];
  /** Folder id: `'all'` = All documents root; otherwise matches `FolderNode.id` in EnvelopeCreator. */
  selectedFolder: string | null;
  /** When false, all recipients are treated as the same signing step (parallel). */
  signingOrderEnabled: boolean;
  /** Ordered signing steps; each inner array is recipient ids who sign together. Only used when signingOrderEnabled. */
  signingOrderGroups: string[][];
  /** User-created templates from the template editor (name + body for preview). */
  customTemplates: Array<{ name: string; body: string }>;
  customMessageSubject: string;
  customMessageBody: string;
  advancedTags: string[];
  expirationEnabled?: boolean;
  expirationAfterPreset?: '5_days' | '2_weeks' | '1_month' | '3_month' | 'custom';
  expirationAfterCustomAmount?: number;
  expirationAfterCustomUnit?: 'day' | 'week' | 'month' | 'year';
  expirationAlertPreset?:
    | 'do_not_send'
    | '1_day'
    | '2_days'
    | '5_days'
    | '1_week'
    | '2_weeks'
    | 'custom';
  expirationAlertCustomAmount?: number;
  expirationAlertCustomUnit?: 'day' | 'week' | 'month' | 'year';
  /** Human-readable envelope name. Auto-derived from doc names unless the user has manually edited it. */
  envelopeName?: string;
  /** True after the user has manually edited the envelope name; prevents auto-derivation from clobbering. */
  envelopeNameTouched?: boolean;
}

/** Join template + uploaded doc names (stripping `.pdf`) with `; ` and truncate to `ENVELOPE_NAME_MAX_LENGTH`. */
export function deriveEnvelopeNameFromDocs(
  selectedTemplates: string[],
  uploadedFiles: UploadedFileItem[]
): string {
  const docNames = [
    ...selectedTemplates.map((t) => String(t).replace(/\.pdf$/i, '').trim()),
    ...uploadedFiles.map((f) => f.name.replace(/\.pdf$/i, '').trim()),
  ].filter((n) => n.length > 0);
  if (docNames.length === 0) return '';
  const joined = docNames.join('; ');
  return joined.length > ENVELOPE_NAME_MAX_LENGTH
    ? `${joined.slice(0, ENVELOPE_NAME_MAX_LENGTH - 1)}…`
    : joined;
}

function computeDraftDisplayTitle(st: EnvelopeState): string {
  if (st.envelopeNameTouched && st.envelopeName && st.envelopeName.trim()) {
    return st.envelopeName.trim();
  }
  const derived = deriveEnvelopeNameFromDocs(st.selectedTemplates, st.uploadedFiles);
  if (derived) return derived;
  const fromTemplates = st.selectedTemplates
    .map((t) => String(t).replace(/\.pdf$/i, ''))
    .join(', ');
  if (fromTemplates.trim()) {
    return fromTemplates.length > 50 ? `${fromTemplates.slice(0, 47)}...` : fromTemplates;
  }
  const f = st.uploadedFiles[0];
  if (f) {
    const n = f.name.replace(/\.pdf$/i, '');
    return n.length > 50 ? `${n.slice(0, 47)}...` : n;
  }
  return 'Untitled draft';
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Format a Date as M/D/YYYY h:mm AM/PM for the envelope-details "Sent on" column. */
function formatRecipientSentOn(d: Date): string {
  const date = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = ((hours + 11) % 12) + 1;
  const displayMinute = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${date} ${displayHour}:${displayMinute} ${period}`;
}

/** Map the envelope creator's recipient slots into the envelope-details recipient row shape. */
function recipientsForDetails(st: EnvelopeState, sentAt: Date): EnvelopeRecipientRow[] {
  const sentOn = formatRecipientSentOn(sentAt);
  const filled = st.recipients.filter((r: any) => r && r.user);
  const groupsById = new Map<string, number>();
  if (st.signingOrderEnabled && st.signingOrderGroups.length > 0) {
    st.signingOrderGroups.forEach((group, idx) => {
      group.forEach((id) => groupsById.set(id, idx + 1));
    });
  }
  return filled.map((r: any, i: number): EnvelopeRecipientRow => {
    const name = r.user?.name ?? `Recipient ${i + 1}`;
    const order = groupsById.get(r.id) ?? (st.signingOrderEnabled ? i + 1 : 1);
    const isCC = r.action === 'CC recipient';
    return {
      id: r.id,
      userId: r.user?.id,
      order,
      name,
      email: r.user?.email ?? '',
      initials: initialsFromName(name),
      // Recipients start in "Yet to sign" once an envelope is sent; the
      // status only advances to "In progress" or "Completed" as they work
      // through their documents.
      status: isCC ? 'In progress' : 'Yet to sign',
      action: isCC ? 'To view' : 'To sign',
      sentOn,
      completedOn: '—',
    };
  });
}

function childrenFromEnvelopeState(st: EnvelopeState): EnvelopeDocumentRow[] {
  const ts = new Date().toISOString();
  if (st.selectedTemplates.length > 0) {
    return st.selectedTemplates.map((t, i) => {
      const base = String(t).replace(/\.pdf$/i, '');
      return {
        id: `draft-doc-${Date.now()}-${i}`,
        name: String(t).toLowerCase().endsWith('.pdf') ? String(t) : `${base}.pdf`,
        status: 'draft' as DocumentSigningStatus,
        lastModified: ts,
      };
    });
  }
  return st.uploadedFiles.map((f, i) => ({
    id: `draft-doc-${Date.now()}-${i}`,
    name: f.name,
    status: 'draft' as DocumentSigningStatus,
    lastModified: ts,
  }));
}

const DEMO_EDIT_RECIPIENTS: EnvelopeState['recipients'] = [
  {
    id: '1',
    user: { id: 'u1', name: 'David Gonzales', email: 'david.g@acme.com' },
    action: 'Needs to complete',
    searchTerm: '',
    isActionDropdownOpen: false,
  },
  {
    id: '2',
    user: { id: 'u2', name: 'Sarah Jenkins', email: 'sarah.j@acme.com' },
    action: 'Needs to complete',
    searchTerm: '',
    isActionDropdownOpen: false,
  },
];

const INITIAL_ENVELOPE_STATE: EnvelopeState = {
  selectedTemplates: [],
  uploadedFiles: [],
  recipients: [{ id: '1', user: null, action: 'Needs to complete', searchTerm: '', isActionDropdownOpen: false }],
  selectedFolder: 'all',
  signingOrderEnabled: false,
  signingOrderGroups: [],
  customTemplates: [],
  customMessageSubject: 'Action required for documents',
  customMessageBody: 'Please review and complete the documents below\n• {Document names}',
  advancedTags: [],
  expirationEnabled: false,
  expirationAfterPreset: '5_days',
  expirationAfterCustomAmount: 5,
  expirationAfterCustomUnit: 'day',
  expirationAlertPreset: 'do_not_send',
  expirationAlertCustomAmount: 1,
  expirationAlertCustomUnit: 'day',
  envelopeName: '',
  envelopeNameTouched: false,
};

const DraftSavedSnackbar: React.FC<{
  onViewDetails: () => void;
  onDismiss: () => void;
}> = ({ onViewDetails, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, SNACKBAR_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[260] animate-in fade-in slide-in-from-bottom-4 duration-300 px-4 w-full max-w-lg pointer-events-none">
      <div className="pointer-events-auto rounded-full bg-[#C6F6F1] border border-[#A5F3E9] shadow-lg flex items-center gap-3 px-5 py-3 min-h-[52px]">
        <div className="w-9 h-9 rounded-full bg-[#0D9488] flex items-center justify-center text-white shrink-0">
          <Check size={18} strokeWidth={3} />
        </div>
        <span className="text-[14px] font-bold text-[#134E4A] flex-1">Draft saved</span>
        <button
          type="button"
          onClick={onViewDetails}
          className="text-[14px] font-bold text-[#134E4A] hover:underline shrink-0"
        >
          View details
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="p-1.5 text-[#134E4A]/70 hover:text-[#134E4A] shrink-0 rounded-full hover:bg-[#A5F3E9]/40"
          aria-label="Dismiss"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

const CorrectionSavedSnackbar: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, SNACKBAR_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[260] animate-in fade-in slide-in-from-bottom-4 duration-300 px-4 w-full max-w-lg pointer-events-none">
      <div className="pointer-events-auto rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] shadow-lg flex items-center gap-3 px-4 py-3 min-h-[48px]">
        <div className="w-8 h-8 rounded-full bg-[#0369A1] flex items-center justify-center text-white shrink-0 text-[13px] font-bold">
          i
        </div>
        <span className="text-[13px] font-bold text-slate-900 flex-1">Correction saved</span>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-600 hover:text-slate-900 shrink-0 rounded-full hover:bg-[#BAE6FD]/50"
          aria-label="Dismiss"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

const SuccessSnackbar: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, SNACKBAR_AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#C6F6F1] border border-[#A5F3E9] rounded-lg flex items-center shadow-lg w-[320px] h-12 px-4 space-x-3">
        <div className="w-6 h-6 rounded-full bg-[#14B8A6] flex items-center justify-center text-white shrink-0">
          <Check size={14} strokeWidth={3} />
        </div>
        <span className="text-[13px] font-bold text-[#134E4A] flex-1">
          {message}
        </span>
        <button 
          onClick={onClose}
          className="p-1 text-[#134E4A]/60 hover:text-[#134E4A] transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [viewHistory, setViewHistory] = useState<ViewType[]>(['people_tab']);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [sentEnvelopeName, setSentEnvelopeName] = useState('');
  const [packetRows, setPacketRows] = useState<EnvelopeTableRow[]>(() => cloneInitialEnvelopeRows());
  const [selectedPacketId, setSelectedPacketId] = useState<string | null>(null);
  const [viewByDocuments, setViewByDocuments] = useState(false);
  const [templateEditorMode, setTemplateEditorMode] = useState<'create' | 'edit'>('edit');
  const [templateEditorSeed, setTemplateEditorSeed] = useState<{ title: string; bodyHtml: string | null } | null>(null);
  const [documentsHubTab, setDocumentsHubTab] = useState('People');
  const [draftSavedSnackOpen, setDraftSavedSnackOpen] = useState(false);
  const [draftSavedPacketId, setDraftSavedPacketId] = useState<string | null>(null);
  const [correctionSavedSnackOpen, setCorrectionSavedSnackOpen] = useState(false);
  const [creatorCorrectingFlow, setCreatorCorrectingFlow] = useState(false);
  const [signFlow, setSignFlow] = useState<DocumentReviewFlow | null>(null);
  const [pdfPlacementSeed, setPdfPlacementSeed] = useState(false);
  const [profileToolsCollapsed, setProfileToolsCollapsed] = useState(true);
  const [profileFolderRoot, setProfileFolderRoot] = useState<ProfileFolderNode>(() => createInitialProfileFolderRoot());
  const [currentView, setCurrentView] = useState<'admin' | 'employee'>('admin');
  const envelopeEntryRef = useRef<ViewType>('people_tab');
  const editingPacketIdRef = useRef<string | null>(null);

  // Persistent Envelope Creation State
  const [envelopeState, setEnvelopeState] = useState<EnvelopeState>(INITIAL_ENVELOPE_STATE);
  // Envelopes sent in-session that include Kale George ("u-kale") as a "Needs to complete" recipient.
  // Surfaced in the Employee profile → Action required tab so the prototype reflects the just-sent envelope.
  const [kaleActionRequiredPackets, setKaleActionRequiredPackets] = useState<ActionPacketRow[]>([]);
  /**
   * Envelope ids Kale has already personally signed. The row stays in her
   * Action required tab so the envelope is still visible, but its Sign button
   * is hidden and the row no longer contributes to the pending-signature badge.
   */
  const [kaleSignedEnvelopeIds, setKaleSignedEnvelopeIds] = useState<Set<string>>(() => new Set());

  const syncDocumentsHubTab = useCallback((tab: string) => {
    setDocumentsHubTab(tab);
    syncHubTabToUrl(tab);
  }, []);

  useEffect(() => {
    const run = (isInitial: boolean) => {
      const wantPF = parseProfileFoldersFromLocation();
      if (wantPF) {
        setViewHistory(['people_tab']);
        syncDocumentsHubTab('Profile Folders');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            document.getElementById('profile-folders')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        });
      } else if (!isInitial) {
        setDocumentsHubTab((prev) => (prev === 'Profile Folders' ? 'People' : prev));
        const { pathname, search } = window.location;
        window.history.replaceState(null, '', `${pathname}${search}`);
      }
    };
    run(true);
    const onHashChange = () => run(false);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [syncDocumentsHubTab]);

  const selectedPacket = selectedPacketId ? packetRows.find((r) => r.id === selectedPacketId) : undefined;

  /**
   * Track which envelopes have reached the "completed" status — every
   * required signer is done and every document is `completed`. Used to
   * filter completed envelopes out of Kale's Action required tab.
   */
  const completedEnvelopeIds = useMemo<Set<string>>(() => {
    const out = new Set<string>();
    for (const r of packetRows) {
      if (r.status === 'completed') out.add(r.id);
    }
    return out;
  }, [packetRows]);

  /**
   * Flatten every completed envelope's child documents into standalone
   * rows so the Documents hub and Kale's profile Documents tab can
   * surface them outside their envelope. `voided`/`draft` children are
   * skipped — they aren't real "signed deliverables".
   */
  const completedEnvelopeDocs = useMemo<CompletedEnvelopeDoc[]>(() => {
    const out: CompletedEnvelopeDoc[] = [];
    for (const r of packetRows) {
      if (r.status !== 'completed') continue;
      for (const c of r.children ?? []) {
        if (c.status === 'voided' || c.status === 'draft') continue;
        out.push({
          rowId: `${r.id}:${c.id}`,
          envelopeId: r.id,
          envelopeName: r.name,
          doc: c,
        });
      }
    }
    return out;
  }, [packetRows]);

  /**
   * Subset of completed-envelope docs that Kale was a recipient of, so
   * her profile only shows docs that were actually sent to her.
   */
  const completedEnvelopeDocsForKale = useMemo<CompletedEnvelopeDoc[]>(() => {
    const out: CompletedEnvelopeDoc[] = [];
    for (const r of packetRows) {
      if (r.status !== 'completed') continue;
      const isKaleRecipient = (r.recipients ?? []).some((rcp) => rcp.userId === 'u-kale');
      if (!isKaleRecipient) continue;
      for (const c of r.children ?? []) {
        if (c.status === 'voided' || c.status === 'draft') continue;
        out.push({
          rowId: `${r.id}:${c.id}`,
          envelopeId: r.id,
          envelopeName: r.name,
          doc: c,
        });
      }
    }
    return out;
  }, [packetRows]);

  const currentPage = viewHistory[viewHistory.length - 1];

  const navigateTo = useCallback((view: ViewType) => {
    setViewHistory(prev => {
      if (prev[prev.length - 1] === view) return prev;
      return [...prev, view];
    });
  }, []);

  const goBack = useCallback(() => {
    setViewHistory(prev => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, -1);
    });
  }, []);

  const goToEnvelopeCreator = useCallback(
    (from: ViewType) => {
      envelopeEntryRef.current = from;
      navigateTo('envelope');
    },
    [navigateTo]
  );

  const handleSaveAndExitEnvelope = useCallback(() => {
    const st = envelopeState;
    const displayTitle = computeDraftDisplayTitle(st);
    const children = childrenFromEnvelopeState(st);
    const editId = editingPacketIdRef.current;
    const rowId = editId ?? `draft-${Date.now()}`;
    const prevRow = editId ? packetRows.find((r) => r.id === editId) : undefined;
    const keepCorrecting = prevRow?.status === 'correcting';
    const row: EnvelopeTableRow = {
      id: rowId,
      name: displayTitle,
      status: keepCorrecting ? 'correcting' : 'draft',
      lastModified: new Date().toISOString(),
      adminIsSigner: prevRow?.adminIsSigner ?? true,
      children: children.length > 0 ? children : undefined,
    };
    setPacketRows((prev) => {
      const i = prev.findIndex((r) => r.id === rowId);
      if (i >= 0) {
        const next = [...prev];
        next[i] = row;
        return next;
      }
      return [row, ...prev];
    });
    setDraftSavedPacketId(rowId);
    editingPacketIdRef.current = null;
    setCreatorCorrectingFlow(false);
    setPdfPlacementSeed(false);
    setViewHistory((prev) => {
      const i = prev.lastIndexOf('envelope');
      if (i < 0) return prev;
      return [...prev.slice(0, i), envelopeEntryRef.current];
    });
    if (keepCorrecting) {
      setCorrectionSavedSnackOpen(true);
    } else {
      setDraftSavedSnackOpen(true);
    }
  }, [envelopeState, packetRows]);

  const applyResendToInProgress = useCallback((packetId: string, nameFallback?: string) => {
    const ts = new Date().toISOString();
    setPacketRows((rows) =>
      rows.map((r) => {
        if (r.id !== packetId) return r;
        return {
          ...r,
          name: nameFallback && nameFallback.trim() ? nameFallback : r.name,
          status: 'in progress' as EnvelopeStatus,
          lastModified: ts,
          children: r.children?.map((c) => ({
            ...c,
            status:
              c.status === 'correcting' || c.status === 'yet to sign'
                ? ('yet to sign' as const)
                : c.status,
            lastModified: ts,
          })),
        };
      })
    );
  }, []);

  const recordKaleActionRequiredIfRecipient = useCallback(
    (envelopeName: string, st: EnvelopeState, linkedEnvelopeId: string) => {
      const kaleIsRecipient = st.recipients.some(
        (r: any) => r?.user?.id === 'u-kale' && r?.action === 'Needs to complete'
      );
      if (!kaleIsRecipient) return;
      const ts = new Date().toISOString();
      const docs = childrenFromEnvelopeState(st);
      const packet: ActionPacketRow = {
        id: `kale-pkt-${linkedEnvelopeId}`,
        envelopeId: linkedEnvelopeId,
        name: envelopeName,
        status: 'Yet to sign',
        dotClass: 'bg-slate-400',
        lastModified: ts,
        children: docs.map((d, i) => ({
          id: `kale-${d.id}-${i}`,
          name: d.name,
          status: 'Yet to sign',
          dotClass: 'bg-slate-400',
          needsKaleSignature: true,
        })),
      };
      setKaleActionRequiredPackets((prev) => {
        const filtered = prev.filter((p) => p.envelopeId !== linkedEnvelopeId);
        return [packet, ...filtered];
      });
    },
    []
  );

  /**
   * Prepend a freshly-sent envelope to the Documents tab list so it shows up immediately,
   * or promote a previously-saved draft row to "in progress" in place when applicable.
   */
  const recordSentEnvelopeInDocuments = useCallback(
    (
      envelopeName: string,
      st: EnvelopeState,
      editingId: string | null,
      newRowId: string,
    ): string => {
      const now = new Date();
      const ts = now.toISOString();
      const children = childrenFromEnvelopeState(st).map((c) => ({
        ...c,
        status: 'yet to sign' as DocumentSigningStatus,
        lastModified: ts,
      }));
      const recipientRows = recipientsForDetails(st, now);
      let resolvedId = newRowId;
      setPacketRows((prev) => {
        if (editingId) {
          const idx = prev.findIndex((r) => r.id === editingId);
          if (idx >= 0) {
            resolvedId = editingId;
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              name: envelopeName,
              status: 'yet to sign' as EnvelopeStatus,
              lastModified: ts,
              children: children.length > 0 ? children : next[idx].children,
              recipients: recipientRows.length > 0 ? recipientRows : next[idx].recipients,
            };
            return next;
          }
        }
        const row: EnvelopeTableRow = {
          id: newRowId,
          name: envelopeName,
          status: 'yet to sign' as EnvelopeStatus,
          lastModified: ts,
          adminIsSigner: true,
          children: children.length > 0 ? children : undefined,
          recipients: recipientRows.length > 0 ? recipientRows : undefined,
        };
        return [row, ...prev];
      });
      return resolvedId;
    },
    []
  );

  const handleEnvelopeContinue = (name: string) => {
    const editId = editingPacketIdRef.current;
    const prevRow = editId ? packetRows.find((r) => r.id === editId) : undefined;
    if (prevRow?.status === 'correcting') {
      applyResendToInProgress(editId!, name);
      recordKaleActionRequiredIfRecipient(name, envelopeState, editId!);
      editingPacketIdRef.current = null;
      setCreatorCorrectingFlow(false);
      setEnvelopeState(INITIAL_ENVELOPE_STATE);
      setViewHistory((prev) => {
        const envelopeIndex = prev.indexOf('envelope');
        if (envelopeIndex > 0) return prev.slice(0, envelopeIndex);
        return ['people_tab'];
      });
      setSentEnvelopeName(name);
      setShowSuccessToast(true);
      return;
    }
    const newRowId = `sent-${Date.now()}`;
    const linkedId = recordSentEnvelopeInDocuments(
      name,
      envelopeState,
      editingPacketIdRef.current,
      newRowId,
    );
    recordKaleActionRequiredIfRecipient(name, envelopeState, linkedId);
    setSentEnvelopeName(name);
    setShowSuccessToast(true);
    setEnvelopeState(INITIAL_ENVELOPE_STATE);
    editingPacketIdRef.current = null;
    setCreatorCorrectingFlow(false);
    setViewHistory((prev) => {
      const envelopeIndex = prev.indexOf('envelope');
      if (envelopeIndex > 0) {
        return prev.slice(0, envelopeIndex);
      }
      return ['people_tab'];
    });
  };

  const handleOpenEnvelopeDetails = (packetId: string) => {
    setSelectedPacketId(packetId);
    navigateTo('envelope_details');
  };

  const handleExitEnvelopeDetails = () => {
    setSelectedPacketId(null);
    // Pop just the envelope_details frame and return to whatever surface the
    // user was on before. Only surface the Documents tab when the previous
    // surface was the People hub; if they opened the envelope from an
    // employee profile, leave the profile (and its current sub-tab) intact.
    const prev = viewHistory;
    const popped = prev.length <= 1 ? ['people_tab'] : prev.slice(0, -1);
    const landing = popped[popped.length - 1] ?? 'people_tab';
    setViewHistory(popped);
    if (landing === 'people_tab') {
      syncDocumentsHubTab('Documents');
      setViewByDocuments(true);
    }
  };

  const handleDraftViewDetails = useCallback(() => {
    if (draftSavedPacketId) setSelectedPacketId(draftSavedPacketId);
    setDraftSavedSnackOpen(false);
    navigateTo('envelope_details');
  }, [draftSavedPacketId, navigateTo]);

  const startSignFlow = useCallback(
    (packetId: string, signerUserId?: string) => {
      const row = packetRows.find((r) => r.id === packetId);
      if (!row) return;
      setSignFlow({
        packetId: row.id,
        packetName: row.name,
        envelopeStatus: row.status,
        docs: (row.children ?? []).map((c) => ({ id: c.id, name: c.name, status: c.status })),
        signerUserId,
      });
      navigateTo('document_review');
    },
    [packetRows, navigateTo]
  );

  const trimToPeopleTab = useCallback(() => {
    setViewHistory((prev) => {
      const i = prev.indexOf('people_tab');
      if (i >= 0) return prev.slice(0, i + 1);
      return ['people_tab'];
    });
  }, []);

  /**
   * After a profile-driven sign flow, return to the employee's profile
   * page (not the Documents hub). If "profile" isn't in the current
   * history we fall back to the people tab so we never strand the user
   * on a now-closed document review screen.
   */
  const trimToProfile = useCallback(() => {
    setViewHistory((prev) => {
      const i = prev.lastIndexOf('profile');
      if (i >= 0) return prev.slice(0, i + 1);
      const j = prev.indexOf('people_tab');
      if (j >= 0) return [...prev.slice(0, j + 1), 'profile'];
      return ['people_tab', 'profile'];
    });
  }, []);

  const openDocumentsPeopleHub = useCallback(() => {
    syncDocumentsHubTab('People');
    setViewHistory(['people_tab']);
  }, [syncDocumentsHubTab]);

  /**
   * Mark the recipient row that maps to `signerUserId` as Completed (with the
   * provided completedOn timestamp). Other rows are left intact so multi-signer
   * envelopes show one recipient finishing without prematurely flipping the
   * whole envelope to completed.
   */
  const markRecipientCompleted = useCallback(
    (
      recipients: EnvelopeRecipientRow[] | undefined,
      signerUserId: string | undefined,
      completedOn: string,
    ): EnvelopeRecipientRow[] | undefined => {
      if (!recipients || recipients.length === 0 || !signerUserId) return recipients;
      let matched = false;
      const next = recipients.map((r) => {
        if (r.userId !== signerUserId) return r;
        matched = true;
        return { ...r, status: 'Completed' as const, completedOn };
      });
      return matched ? next : recipients;
    },
    []
  );

  /**
   * Envelope status mirrors its documents:
   * - "yet to sign" when every doc is still untouched and no signer has acted.
   * - "in progress" the moment any doc is `in progress` / `completed`, or any
   *   signer has flipped to Completed.
   * - "completed" only once every doc is `completed` and every signing
   *   recipient has finished.
   * Voided / draft envelopes keep their explicit status.
   */
  const deriveEnvelopeStatus = useCallback(
    (
      previousStatus: EnvelopeStatus,
      recipients: EnvelopeRecipientRow[] | undefined,
      children: EnvelopeDocumentRow[] | undefined,
    ): EnvelopeStatus => {
      if (previousStatus === 'voided' || previousStatus === 'draft') return previousStatus;
      const docs = children ?? [];
      const allDocsDone = docs.length > 0 && docs.every((c) => c.status === 'completed');
      const signers = (recipients ?? []).filter((r) => r.action === 'To sign');
      const allSignersDone = signers.length === 0 || signers.every((r) => r.status === 'Completed');
      if (allDocsDone && allSignersDone) return 'completed';
      const anyDocTouched = docs.some((c) => c.status === 'in progress' || c.status === 'completed');
      const anySignerActed = signers.some((r) => r.status === 'In progress' || r.status === 'Completed');
      if (anyDocTouched || anySignerActed) return 'in progress';
      return 'yet to sign';
    },
    []
  );

  /**
   * Record that Kale has personally finished signing the given envelope. The
   * row stays in her Action required tab (so she can still see the envelope's
   * progress while other recipients finish), but the Sign button is hidden
   * and the badge stops counting that envelope's documents.
   */
  const markKaleSignedForPacket = useCallback((packetId: string) => {
    setKaleSignedEnvelopeIds((prev) => {
      if (prev.has(packetId)) return prev;
      const next = new Set(prev);
      next.add(packetId);
      return next;
    });
  }, []);

  const handleSignComplete = useCallback(
    (packetId: string) => {
      const ts = new Date().toISOString();
      const completedOn = formatRecipientSentOn(new Date());
      const signerUserId = signFlow?.signerUserId;
      setPacketRows((prev) =>
        prev.map((r) => {
          if (r.id !== packetId) return r;
          // Flip the signing recipient first; documents stay in their current
          // state until every "To sign" recipient is done. This avoids the
          // doc-level "Completed" dot appearing while the envelope is still
          // waiting on other signers.
          const recipients = markRecipientCompleted(r.recipients, signerUserId, completedOn);
          const signers = (recipients ?? []).filter((rcp) => rcp.action === 'To sign');
          const allSignersDone =
            signers.length > 0 && signers.every((rcp) => rcp.status === 'Completed');
          // Once any signer has completed but others haven't, surface the doc
          // as "in progress" so the table reads cleanly between "yet to sign"
          // (untouched) and "completed" (every signer done). draft/voided
          // documents are left alone.
          const children = r.children?.map((c) => {
            if (c.status === 'voided' || c.status === 'draft') return c;
            if (allSignersDone) {
              return { ...c, status: 'completed' as DocumentSigningStatus, lastModified: ts };
            }
            if (c.status === 'yet to sign') {
              return { ...c, status: 'in progress' as DocumentSigningStatus, lastModified: ts };
            }
            return c;
          });
          return {
            ...r,
            status: deriveEnvelopeStatus(r.status, recipients, children),
            lastModified: ts,
            children,
            recipients,
          };
        })
      );
      if (signerUserId === 'u-kale') {
        markKaleSignedForPacket(packetId);
      }
      setSignFlow(null);
      // When Kale signs from her profile, drop her back on the profile
      // (Action required is still her current tab). All other sign
      // flows return to the Documents tab as before.
      if (signerUserId === 'u-kale') {
        trimToProfile();
      } else {
        syncDocumentsHubTab('Documents');
        trimToPeopleTab();
      }
    },
    [
      signFlow,
      markRecipientCompleted,
      deriveEnvelopeStatus,
      markKaleSignedForPacket,
      trimToPeopleTab,
      trimToProfile,
      syncDocumentsHubTab,
    ]
  );

  const handleSignPartial = useCallback(
    (packetId: string, _completedDocIds: string[]) => {
      const ts = new Date().toISOString();
      const signerUserId = signFlow?.signerUserId;
      // Partial sign means the signer hasn't finished. We intentionally leave
      // document statuses and the recipient row alone — only the envelope's
      // lastModified is bumped and we re-derive its status (which will stay
      // "in progress"). Action required entries also stay in place because
      // there's still work for the signer to come back to.
      setPacketRows((prev) =>
        prev.map((r) => {
          if (r.id !== packetId) return r;
          return {
            ...r,
            status: deriveEnvelopeStatus(r.status, r.recipients, r.children),
            lastModified: ts,
          };
        })
      );
      setSignFlow(null);
      if (signerUserId === 'u-kale') {
        trimToProfile();
      } else {
        syncDocumentsHubTab('Documents');
        trimToPeopleTab();
      }
    },
    [signFlow, deriveEnvelopeStatus, trimToPeopleTab, trimToProfile, syncDocumentsHubTab]
  );

  const prefillStateFromDraftRow = (row: EnvelopeTableRow): EnvelopeState => {
    const uploadedFiles: UploadedFileItem[] = (row.children ?? []).map((c, i) => ({
      id: `pf-${Date.now()}-${i}`,
      name: c.name.endsWith('.pdf') ? c.name : `${c.name}.pdf`,
      previewTitle: c.name.replace(/\.pdf$/i, '').slice(0, 48),
      previewParagraphs: [
        'Prototype PDF preview: this document is part of your saved draft packet.',
        'Signature fields are shown on the placement canvas for demonstration.',
      ],
    }));
    return {
      ...INITIAL_ENVELOPE_STATE,
      selectedTemplates: [],
      uploadedFiles,
      recipients: DEMO_EDIT_RECIPIENTS,
      selectedFolder: 'all',
    };
  };

  const prefillStateFromCorrectingRow = (row: EnvelopeTableRow): EnvelopeState => {
    const names = (row.children ?? []).map((c) => c.name.replace(/\.pdf$/i, ''));
    return {
      ...INITIAL_ENVELOPE_STATE,
      selectedTemplates: names,
      uploadedFiles: [],
      recipients: DEMO_EDIT_RECIPIENTS,
      selectedFolder: 'all',
    };
  };

  const handleEditEnvelope = useCallback(
    (packetId: string) => {
      const row = packetRows.find((r) => r.id === packetId);
      if (!row) return;
      editingPacketIdRef.current = packetId;
      if (row.status === 'draft') {
        setEnvelopeState(prefillStateFromDraftRow(row));
        setPdfPlacementSeed(false);
        setCreatorCorrectingFlow(false);
      } else if (row.status === 'correcting') {
        setEnvelopeState(prefillStateFromCorrectingRow(row));
        setPdfPlacementSeed(false);
        setCreatorCorrectingFlow(true);
      } else {
        editingPacketIdRef.current = null;
        setCreatorCorrectingFlow(false);
        return;
      }
      goToEnvelopeCreator('people_tab');
    },
    [packetRows, goToEnvelopeCreator]
  );

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <PortfolioReturnLink />
      {/* People Tab View — default entry (Documents → People hub) */}
      {currentPage === 'people_tab' && (
        <PeopleTabView
          onGoHome={openDocumentsPeopleHub}
          onOpenDocumentsPeopleTab={openDocumentsPeopleHub}
          onSendDocument={(person?: SendDocumentPerson) => {
            editingPacketIdRef.current = null;
            setPdfPlacementSeed(false);
            setCreatorCorrectingFlow(false);
            setEnvelopeState(
              person
                ? {
                    ...INITIAL_ENVELOPE_STATE,
                    recipients: [
                      {
                        id: '1',
                        user: { id: person.id, name: person.name, email: person.email },
                        action: 'Needs to complete',
                        searchTerm: '',
                        isActionDropdownOpen: false,
                      },
                    ],
                  }
                : INITIAL_ENVELOPE_STATE
            );
            goToEnvelopeCreator('people_tab');
          }}
          onProfileClick={() => {
            setViewByDocuments(false);
            navigateTo('profile');
          }}
          onNewTemplate={() => {
            setTemplateEditorSeed(null);
            setTemplateEditorMode('create');
            navigateTo('template_editor');
          }}
          onSendDocuments={() => {
            editingPacketIdRef.current = null;
            setPdfPlacementSeed(false);
            setCreatorCorrectingFlow(false);
            setEnvelopeState(INITIAL_ENVELOPE_STATE);
            goToEnvelopeCreator('people_tab');
          }}
          packetRows={packetRows}
          onPacketRowsChange={setPacketRows}
          onViewDocumentPacket={handleOpenEnvelopeDetails}
          onEditDocumentPacket={handleEditEnvelope}
          onSignDocumentPacket={startSignFlow}
          onResendEnvelope={(packetId) => {
            applyResendToInProgress(packetId);
            setShowSuccessToast(true);
          }}
          hubTab={documentsHubTab}
          onHubTabChange={syncDocumentsHubTab}
          profileFolderRoot={profileFolderRoot}
          onProfileFolderRootChange={setProfileFolderRoot}
          viewMode={currentView}
          completedEnvelopeDocs={completedEnvelopeDocs}
        />
      )}

      {/* Profile — same Tools side panel as Documents hub */}
      <div className={`${currentPage === 'profile' ? 'block' : 'hidden'}`}>
        <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
          <ToolsSidePanel
            collapsed={profileToolsCollapsed}
            onCollapsedChange={setProfileToolsCollapsed}
            onGoHome={openDocumentsPeopleHub}
            onOpenDocumentsPeopleTab={openDocumentsPeopleHub}
          />
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
            <Header
              onProfileClick={() => {
                setViewByDocuments(false);
                navigateTo('profile');
              }}
              currentView={currentView}
              onViewChange={setCurrentView}
            />
            <main className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#F9FAFB]">
            {currentPage === 'profile' && (
              <>
                <EmployeeHeaderSection employee={MOCK_EMPLOYEE} />
                <div className="min-w-0 px-0">
                  <EmployeeDocumentsSection
                    onSend={() => {
                      editingPacketIdRef.current = null;
                      setPdfPlacementSeed(false);
                      setCreatorCorrectingFlow(false);
                      setEnvelopeState(INITIAL_ENVELOPE_STATE);
                      goToEnvelopeCreator('profile');
                    }}
                    onOpenEnvelope={(envelopeId) => handleOpenEnvelopeDetails(envelopeId)}
                    onReviewDocument={(envelopeId) => startSignFlow(envelopeId, 'u-kale')}
                    viewByDocuments={viewByDocuments}
                    setViewByDocuments={setViewByDocuments}
                    profileFolderRoot={profileFolderRoot}
                    viewMode={currentView}
                    extraActionRequiredPackets={kaleActionRequiredPackets}
                    kaleSignedEnvelopeIds={kaleSignedEnvelopeIds}
                    completedEnvelopeIds={completedEnvelopeIds}
                    completedEnvelopeDocs={completedEnvelopeDocsForKale}
                  />
                </div>
              </>
            )}
            {['profile', 'people_tab'].includes(currentPage) && (
              <button 
                onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                className="fixed bottom-6 right-6 w-12 h-12 bg-[#7A005D] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50"
                title="Gemini AI Assistant"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            )}

            {isAssistantOpen && (
              <GeminiAssistant onClose={() => setIsAssistantOpen(false)} />
            )}
          </main>
          </div>
        </div>
      </div>

      {currentPage === 'envelope_details' && selectedPacket && (
        <div className="fixed inset-0 z-[130] overflow-y-auto bg-[#F9FAFB]">
          <EnvelopeDetailsView
            packetId={selectedPacket.id}
            envelopeName={selectedPacket.name}
            packetStatus={selectedPacket.status}
            adminIsSigner={selectedPacket.adminIsSigner}
            sentOn="03/01/2026 9:00 AM"
            sentBy="Harry Porter"
            documents={(selectedPacket.children ?? []).map((c) => ({
              id: c.id,
              name: c.name,
              status: selectedPacket.status === 'voided' ? ('voided' as DocumentSigningStatus) : c.status,
            }))}
            recipients={selectedPacket.recipients}
            isVoided={selectedPacket.status === 'voided'}
            onExit={handleExitEnvelopeDetails}
            onSign={() => startSignFlow(selectedPacket.id)}
            onEdit={() => handleEditEnvelope(selectedPacket.id)}
            onResend={() => {
              applyResendToInProgress(selectedPacket.id, selectedPacket.name);
              setShowSuccessToast(true);
            }}
          />
        </div>
      )}

      {/* Envelope Creator View */}
      {currentPage === 'envelope' && (
        <div className="absolute inset-0 z-[100] bg-white">
          <EnvelopeCreator 
            onExit={goBack}
            onSaveAndExit={handleSaveAndExitEnvelope}
            correctingFlow={creatorCorrectingFlow}
            onEditDocument={(detail) => {
              setTemplateEditorSeed(detail ?? null);
              setTemplateEditorMode('edit');
              navigateTo('template_editor');
            }}
            onCreateTemplate={() => {
              setTemplateEditorSeed(null);
              setTemplateEditorMode('create');
              navigateTo('template_editor');
            }}
            onCreateTemplateWithName={(name) => {
              const t = name.trim();
              setTemplateEditorSeed({ title: t || 'Untitled template', bodyHtml: null });
              setTemplateEditorMode('create');
              navigateTo('template_editor');
            }}
            onContinue={handleEnvelopeContinue}
            state={envelopeState}
            onUpdateState={setEnvelopeState}
            seedPdfPlacementDemo={pdfPlacementSeed}
            onSeedPdfPlacementConsumed={() => setPdfPlacementSeed(false)}
          />
        </div>
      )}

      {currentPage === 'template_editor' && (
        <div className="absolute inset-0 z-[110] bg-white">
          <TemplateEditor 
            onExit={() => {
              setTemplateEditorSeed(null);
              goBack();
            }} 
            onGoHome={openDocumentsPeopleHub}
            mode={templateEditorMode}
            initialTitle={templateEditorSeed?.title}
            initialBodyHtml={templateEditorSeed?.bodyHtml ?? null}
            onSaveNewTemplate={(name, body) => {
              const finalName = name.trim() || 'Untitled template';
              setEnvelopeState((prev) => ({
                ...prev,
                customTemplates: [
                  ...prev.customTemplates.filter((t) => t.name !== finalName),
                  { name: finalName, body },
                ],
                selectedTemplates: Array.from(new Set([...prev.selectedTemplates, finalName])),
              }));
              setTemplateEditorSeed(null);
              goBack();
            }}
            onUpdateTemplate={(name, body) => {
              const finalName = name.trim() || 'Untitled template';
              const orig = templateEditorSeed?.title;
              setEnvelopeState((prev) => {
                const without = prev.customTemplates.filter((t) => t.name !== finalName && t.name !== orig);
                let selected = prev.selectedTemplates;
                if (orig && orig !== finalName) {
                  selected = selected.map((s) => (s === orig ? finalName : s));
                }
                return {
                  ...prev,
                  customTemplates: [...without, { name: finalName, body }],
                  selectedTemplates: Array.from(new Set([...selected, finalName])),
                };
              });
              setTemplateEditorSeed(null);
              goBack();
            }}
          />
        </div>
      )}

      {currentPage === 'document_review' && signFlow && (
        <div className="fixed inset-0 z-[140] bg-white">
          <DocumentReviewView
            flow={signFlow}
            onExit={goBack}
            onGoHome={openDocumentsPeopleHub}
            onCompleteAll={handleSignComplete}
            onSavePartial={handleSignPartial}
          />
        </div>
      )}

      {showSuccessToast && (
        <SuccessSnackbar message="envelope sent" onClose={() => setShowSuccessToast(false)} />
      )}

      {draftSavedSnackOpen && (
        <DraftSavedSnackbar
          onViewDetails={handleDraftViewDetails}
          onDismiss={() => setDraftSavedSnackOpen(false)}
        />
      )}

      {correctionSavedSnackOpen && (
        <CorrectionSavedSnackbar onClose={() => setCorrectionSavedSnackOpen(false)} />
      )}
    </div>
  );
}

export default App;