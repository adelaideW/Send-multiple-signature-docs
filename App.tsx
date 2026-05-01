import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Check, X } from 'lucide-react';
import Header from './components/Header';
import ToolsSidePanel from './components/ToolsSidePanel';
import { EmployeeHeaderSection, EmployeeDocumentsSection } from './components/EmployeeProfile';
import EnvelopeCreator from './components/EnvelopeCreator';
import TemplateEditor from './components/TemplateEditor';
import EnvelopeDetailsView from './components/EnvelopeDetailsView';
import DocumentReviewView from './components/DocumentReviewView';
import PeopleTabView from './components/PeopleTabView';
import GeminiAssistant from './components/GeminiAssistant';
import { MOCK_EMPLOYEE } from './constants';
import { SNACKBAR_AUTO_DISMISS_MS } from './constants/snackbar';
import type { UploadedFileItem } from './types';
import type { EnvelopeTableRow, EnvelopeDocumentRow, DocumentSigningStatus, EnvelopeStatus } from './components/EnvelopesListView';
import { cloneInitialEnvelopeRows } from './components/EnvelopesListView';
import type { DocumentReviewFlow } from './components/DocumentReviewView';

type ViewType = 'profile' | 'envelope' | 'template_editor' | 'envelope_details' | 'document_review' | 'people_tab';

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
}

function computeDraftDisplayTitle(st: EnvelopeState): string {
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
  customMessageBody: 'Please review and send the documents\n• {Document names}',
  advancedTags: [],
  expirationEnabled: false,
  expirationAfterPreset: '5_days',
  expirationAfterCustomAmount: 5,
  expirationAfterCustomUnit: 'day',
  expirationAlertPreset: 'do_not_send',
  expirationAlertCustomAmount: 1,
  expirationAlertCustomUnit: 'day',
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
  const [profileToolsCollapsed, setProfileToolsCollapsed] = useState(false);
  const envelopeEntryRef = useRef<ViewType>('people_tab');
  const editingPacketIdRef = useRef<string | null>(null);

  // Persistent Envelope Creation State
  const [envelopeState, setEnvelopeState] = useState<EnvelopeState>(INITIAL_ENVELOPE_STATE);

  const selectedPacket = selectedPacketId ? packetRows.find((r) => r.id === selectedPacketId) : undefined;

  const currentView = viewHistory[viewHistory.length - 1];

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

  const handleEnvelopeContinue = (name: string) => {
    const editId = editingPacketIdRef.current;
    const prevRow = editId ? packetRows.find((r) => r.id === editId) : undefined;
    if (prevRow?.status === 'correcting') {
      applyResendToInProgress(editId!, name);
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
    setDocumentsHubTab('Documents');
    setViewByDocuments(true);
    setViewHistory((prev) => {
      const i = prev.lastIndexOf('envelope_details');
      if (i <= 0) return ['people_tab'];
      return [...prev.slice(0, i), 'people_tab'];
    });
  };

  const handleDraftViewDetails = useCallback(() => {
    if (draftSavedPacketId) setSelectedPacketId(draftSavedPacketId);
    setDraftSavedSnackOpen(false);
    navigateTo('envelope_details');
  }, [draftSavedPacketId, navigateTo]);

  const startSignFlow = useCallback(
    (packetId: string) => {
      const row = packetRows.find((r) => r.id === packetId);
      if (!row) return;
      setSignFlow({
        packetId: row.id,
        packetName: row.name,
        envelopeStatus: row.status,
        docs: (row.children ?? []).map((c) => ({ id: c.id, name: c.name, status: c.status })),
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

  const openDocumentsPeopleHub = useCallback(() => {
    setDocumentsHubTab('People');
    setViewHistory(['people_tab']);
  }, []);

  const handleSignComplete = useCallback(
    (packetId: string) => {
      const ts = new Date().toISOString();
      setPacketRows((prev) =>
        prev.map((r) => {
          if (r.id !== packetId) return r;
          return {
            ...r,
            status: 'completed' as EnvelopeStatus,
            lastModified: ts,
            children: r.children?.map((c) => ({
              ...c,
              status: 'completed' as DocumentSigningStatus,
              lastModified: ts,
            })),
          };
        })
      );
      setSignFlow(null);
      setDocumentsHubTab('Documents');
      trimToPeopleTab();
    },
    [trimToPeopleTab]
  );

  const handleSignPartial = useCallback(
    (packetId: string, completedDocIds: string[]) => {
      const ts = new Date().toISOString();
      const done = new Set(completedDocIds);
      setPacketRows((prev) =>
        prev.map((r) => {
          if (r.id !== packetId) return r;
          const children = r.children?.map((c) =>
            done.has(c.id)
              ? { ...c, status: 'completed' as DocumentSigningStatus, lastModified: ts }
              : c.status === 'completed'
                ? c
                : { ...c, status: 'yet to sign' as DocumentSigningStatus, lastModified: ts }
          );
          return {
            ...r,
            status: 'in progress' as EnvelopeStatus,
            lastModified: ts,
            children,
          };
        })
      );
      setSignFlow(null);
      setDocumentsHubTab('Documents');
      trimToPeopleTab();
    },
    [trimToPeopleTab]
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
      {/* People Tab View — default entry (Documents → People hub) */}
      {currentView === 'people_tab' && (
        <PeopleTabView 
          onGoHome={openDocumentsPeopleHub}
          onOpenDocumentsPeopleTab={openDocumentsPeopleHub}
          onSendDocument={() => {
            editingPacketIdRef.current = null;
            setPdfPlacementSeed(false);
            setCreatorCorrectingFlow(false);
            setEnvelopeState(INITIAL_ENVELOPE_STATE);
            goToEnvelopeCreator('people_tab');
          }}
          onProfileClick={() => navigateTo('profile')}
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
          onHubTabChange={setDocumentsHubTab}
        />
      )}

      {/* Profile — same Tools side panel as Documents hub */}
      <div className={`${currentView === 'profile' ? 'block' : 'hidden'}`}>
        <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
          <ToolsSidePanel
            collapsed={profileToolsCollapsed}
            onCollapsedChange={setProfileToolsCollapsed}
            onGoHome={openDocumentsPeopleHub}
            onOpenDocumentsPeopleTab={openDocumentsPeopleHub}
          />
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
            <Header onProfileClick={() => navigateTo('profile')} />
            <main className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#F9FAFB]">
            {currentView === 'profile' && (
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
                    onOpenEnvelope={() => handleOpenEnvelopeDetails('e1')}
                    onReviewDocument={() => startSignFlow('e1')}
                    viewByDocuments={viewByDocuments}
                    setViewByDocuments={setViewByDocuments}
                  />
                </div>
              </>
            )}
            {['profile', 'people_tab'].includes(currentView) && (
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

      {currentView === 'envelope_details' && selectedPacket && (
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
      {currentView === 'envelope' && (
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

      {currentView === 'template_editor' && (
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

      {currentView === 'document_review' && signFlow && (
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