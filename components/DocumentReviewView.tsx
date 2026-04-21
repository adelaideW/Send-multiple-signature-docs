
import React, { useState, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  HelpCircle,
  Accessibility,
  Bell,
  MoreVertical,
  Download,
  ChevronDown,
  Sparkles,
  MessageSquare,
  Settings,
  Eye,
  FileText,
  PenLine,
  LogOut,
  UserPlus,
  ClipboardX,
  LifeBuoy,
  FileCheck,
  Lock,
  X,
} from 'lucide-react';
import type { EnvelopeStatus, DocumentSigningStatus } from './EnvelopesListView';
import { EnvelopeMoreMenu, moreMenuVariantForEnvelope } from './EnvelopesListView';
import { SNACKBAR_AUTO_DISMISS_MS } from '../constants/snackbar';
import SendReminderModal from './SendReminderModal';
import DocumentPreviewModal from './DocumentPreviewModal';

export interface SignFlowDoc {
  id: string;
  name: string;
  status: DocumentSigningStatus;
}

export interface DocumentReviewFlow {
  packetId: string;
  packetName: string;
  envelopeStatus: EnvelopeStatus;
  docs: SignFlowDoc[];
}

interface DocumentReviewViewProps {
  flow: DocumentReviewFlow;
  onExit: () => void;
  onGoHome?: () => void;
  onCompleteAll: (packetId: string) => void;
  onSavePartial: (packetId: string, completedDocIds: string[]) => void;
}

const ACCENT_SIGN = '#FDB71C';

function needsSignerAction(doc: SignFlowDoc, envelopeStatus: EnvelopeStatus): boolean {
  if (envelopeStatus === 'voided' || envelopeStatus === 'draft') return false;
  if (doc.status === 'completed') return false;
  if (doc.status === 'draft') return false;
  return true;
}

const DocumentReviewView: React.FC<DocumentReviewViewProps> = ({
  flow,
  onExit,
  onGoHome,
  onCompleteAll,
  onSavePartial,
}) => {
  const [phase, setPhase] = useState<'list' | 'sign'>('list');
  const [listMenuOpen, setListMenuOpen] = useState(false);
  const [signMenuOpen, setSignMenuOpen] = useState(false);
  const [activeSignDocId, setActiveSignDocId] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState('');
  const [completedInSession, setCompletedInSession] = useState<Record<string, boolean>>({});

  const listMenuBtnRef = useRef<HTMLButtonElement | null>(null);
  const signMenuBtnRef = useRef<HTMLButtonElement | null>(null);
  const [listMenuPos, setListMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [signMenuPos, setSignMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [preview, setPreview] = useState<{ name: string } | null>(null);
  const [docSnack, setDocSnack] = useState<string | null>(null);
  const [bulkSnack, setBulkSnack] = useState<{ phase: 'loading' | 'done'; count: number } | null>(null);
  const [sendReminderOpen, setSendReminderOpen] = useState(false);

  const signableDocs = useMemo(
    () => flow.docs.filter((d) => needsSignerAction(d, flow.envelopeStatus)),
    [flow.docs, flow.envelopeStatus]
  );

  const activeSignIndex = useMemo(() => {
    if (!activeSignDocId) return 0;
    return Math.max(
      0,
      signableDocs.findIndex((d) => d.id === activeSignDocId)
    );
  }, [activeSignDocId, signableDocs]);

  const currentSignDoc = signableDocs[activeSignIndex] ?? null;
  const isLastSignDoc =
    signableDocs.length > 0 && activeSignIndex === signableDocs.length - 1;

  const placeMenu = (btn: HTMLButtonElement | null, setPos: (p: { top: number; left: number } | null) => void) => {
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const mw = 260;
    const left = Math.max(8, Math.min(r.right - mw, window.innerWidth - mw - 8));
    setPos({ top: r.bottom + 8, left });
  };

  useLayoutEffect(() => {
    if (!listMenuOpen) {
      setListMenuPos(null);
      return;
    }
    const run = () => placeMenu(listMenuBtnRef.current, setListMenuPos);
    run();
    window.addEventListener('scroll', run, true);
    window.addEventListener('resize', run);
    return () => {
      window.removeEventListener('scroll', run, true);
      window.removeEventListener('resize', run);
    };
  }, [listMenuOpen]);

  useLayoutEffect(() => {
    if (!signMenuOpen) {
      setSignMenuPos(null);
      return;
    }
    const run = () => placeMenu(signMenuBtnRef.current, setSignMenuPos);
    run();
    window.addEventListener('scroll', run, true);
    window.addEventListener('resize', run);
    return () => {
      window.removeEventListener('scroll', run, true);
      window.removeEventListener('resize', run);
    };
  }, [signMenuOpen]);

  useEffect(() => {
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (listMenuBtnRef.current?.contains(t)) return;
      if (signMenuBtnRef.current?.contains(t)) return;
      if (document.getElementById('doc-review-list-more')?.contains(t)) return;
      if (document.getElementById('doc-review-sign-more')?.contains(t)) return;
      setListMenuOpen(false);
      setSignMenuOpen(false);
    };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, []);

  useEffect(() => {
    if (!docSnack) return;
    const timer = window.setTimeout(() => setDocSnack(null), SNACKBAR_AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [docSnack]);

  useEffect(() => {
    if (bulkSnack?.phase !== 'done') return;
    const timer = window.setTimeout(() => setBulkSnack(null), SNACKBAR_AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [bulkSnack]);

  const runBulkDownload = () => {
    const n = Math.max(1, flow.docs.length);
    setBulkSnack({ phase: 'loading', count: n });
    window.setTimeout(() => {
      setBulkSnack({ phase: 'done', count: n });
    }, 1200);
  };

  const openSignForDoc = (docId: string) => {
    setActiveSignDocId(docId);
    setFieldValue('');
    setPhase('sign');
    setListMenuOpen(false);
  };

  const handleSaveAndExitList = () => {
    onExit();
  };

  const handleSaveAndExitSign = () => {
    const ids = new Set<string>();
    signableDocs.forEach((d) => {
      if (completedInSession[d.id]) ids.add(d.id);
    });
    if (fieldValue.trim() && currentSignDoc) ids.add(currentSignDoc.id);
    if (ids.size > 0) onSavePartial(flow.packetId, [...ids]);
    else onExit();
  };

  const handleNext = () => {
    if (!currentSignDoc || !fieldValue.trim()) return;
    const nextCompleted = { ...completedInSession, [currentSignDoc.id]: true };
    setCompletedInSession(nextCompleted);
    setFieldValue('');
    const nextIdx = activeSignIndex + 1;
    if (nextIdx < signableDocs.length) {
      setActiveSignDocId(signableDocs[nextIdx].id);
    }
  };

  const handleComplete = () => {
    if (!currentSignDoc || !fieldValue.trim()) return;
    const finalCompleted = { ...completedInSession, [currentSignDoc.id]: true };
    const allDone = signableDocs.every((d) => finalCompleted[d.id]);
    if (allDone) {
      onCompleteAll(flow.packetId);
    } else {
      onSavePartial(
        flow.packetId,
        signableDocs.filter((d) => finalCompleted[d.id]).map((d) => d.id)
      );
    }
  };

  const listVariant = moreMenuVariantForEnvelope(flow.envelopeStatus);

  return (
    <div className="flex flex-col h-screen bg-[#F3F4F6] overflow-hidden text-[#1e293b]">
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center space-x-6">
          <div
            className="flex items-center cursor-pointer hover:opacity-70 transition-opacity"
            onClick={onGoHome}
            title="Go to Home"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 6C7 6 4 9 4 12C4 15 7 18 7 18" stroke="#000" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 6C12 6 9 9 9 12C9 15 12 18 12 18" stroke="#000" strokeWidth="2" strokeLinecap="round" />
              <path d="M17 6C17 6 14 9 14 12C14 15 17 18 17 18" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center space-x-2 cursor-pointer group">
            <span className="text-sm font-semibold text-slate-700">Tools</span>
            <ChevronDown size={14} className="text-slate-500" />
          </div>
        </div>

        <div className="flex-1 max-w-2xl px-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search or jump to..."
              className="w-full bg-slate-100 border-none rounded-md py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-slate-300 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <HelpCircle size={18} className="text-slate-500 cursor-pointer" />
          <Accessibility size={18} className="text-slate-500 cursor-pointer" />
          <Bell size={18} className="text-slate-500 cursor-pointer" />
          <div className="h-6 w-px bg-slate-200 mx-1" />
          <div className="flex items-center space-x-3 cursor-pointer">
            <span className="text-sm text-slate-700 font-semibold">Acme</span>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-200" />
          </div>
        </div>
      </header>

      {phase === 'list' && (
        <>
          <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
            <h2 className="text-sm font-bold text-slate-900">Review and sign documents</h2>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500 font-medium">Last saved just now</span>
              <button
                type="button"
                onClick={handleSaveAndExitList}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900"
              >
                <LogOut size={14} />
                Save and exit
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Review and sign documents</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Review and sign the following documents from Acme to proceed with onboarding.
                  </p>
                </div>
                <button
                  ref={listMenuBtnRef}
                  type="button"
                  onClick={() => setListMenuOpen((v) => !v)}
                  className="relative shrink-0 p-1.5 text-slate-900 hover:bg-slate-100 rounded-[8px]"
                  aria-label="More"
                  aria-expanded={listMenuOpen}
                >
                  <MoreVertical size={20} strokeWidth={2} />
                </button>
              </div>

              <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100">
                <p className="text-[13px] font-bold text-slate-900">{flow.packetName}</p>
              </div>

              <div className="divide-y divide-slate-100">
                {flow.docs.map((doc) => {
                  const showSign = needsSignerAction(doc, flow.envelopeStatus);
                  return (
                    <div key={doc.id} className="px-6 py-4 flex items-center gap-3 hover:bg-slate-50/60">
                      <FileText size={20} className="text-slate-400 shrink-0" />
                      <span className="min-w-0 flex-1 font-semibold text-slate-900 text-[14px] truncate">{doc.name}</span>
                      <div className="flex items-center justify-end gap-1 shrink-0">
                        <button
                          type="button"
                          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                          aria-label="View"
                          onClick={() => setPreview({ name: doc.name })}
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          type="button"
                          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                          aria-label="Download"
                          onClick={() => setDocSnack('Document downloaded')}
                        >
                          <Download size={18} />
                        </button>
                        {showSign ? (
                          <button
                            type="button"
                            onClick={() => openSignForDoc(doc.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-bold text-slate-900"
                            style={{ backgroundColor: ACCENT_SIGN }}
                          >
                            <PenLine size={14} strokeWidth={2} />
                            Sign
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {phase === 'sign' && currentSignDoc && (
        <>
          <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-40">
            <h2 className="text-sm font-bold text-slate-900 truncate pr-4">{currentSignDoc.name}</h2>
            <div className="flex items-center gap-3 shrink-0">
              {signableDocs.length > 1 && (
                <button
                  type="button"
                  onClick={handleSaveAndExitSign}
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 px-2"
                >
                  Save and exit
                </button>
              )}
              {signableDocs.length > 1 && !isLastSignDoc ? (
                <button
                  type="button"
                  disabled={!fieldValue.trim()}
                  onClick={handleNext}
                  className="px-5 py-2 bg-[#7A005D] text-white rounded-[8px] text-xs font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!fieldValue.trim()}
                  onClick={handleComplete}
                  className="px-5 py-2 bg-[#7A005D] text-white rounded-[8px] text-xs font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Complete
                </button>
              )}
              <button
                ref={signMenuBtnRef}
                type="button"
                onClick={() => setSignMenuOpen((v) => !v)}
                className="p-1.5 text-slate-900 hover:bg-slate-100 rounded-[8px]"
                aria-label="More"
                aria-expanded={signMenuOpen}
              >
                <MoreVertical size={18} strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden relative">
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center py-12 px-6">
              <div className="w-[800px] bg-white shadow-xl min-h-[1030px] p-20 relative">
                <div className="space-y-4 text-[13px] text-slate-800 leading-relaxed font-normal mt-12">
                  <p>
                    Demo Admin · {currentSignDoc.name}
                    <span className="bg-[#FEE2E2] text-[#991B1B] px-1.5 py-0.5 rounded text-[11px] font-medium mx-1">
                      Pay frequency
                    </span>
                    Placeholder agreement text for this prototype signing step.
                  </p>
                  <p>Please complete the required field below to continue.</p>
                  <div className="mt-8 flex flex-col space-y-4">
                    <div className="flex items-end space-x-2">
                      <div className="font-serif italic text-3xl opacity-80" style={{ transform: 'rotate(-5deg)' }}>
                        sign
                      </div>
                      <div className="w-32 border-b border-slate-300" />
                    </div>
                  </div>
                  <div className="mt-8">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Required acknowledgment</label>
                    <input
                      type="text"
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      placeholder="Type your initials to sign"
                      className="w-full max-w-md border border-slate-200 rounded-[8px] px-3 py-2 outline-none focus:ring-2 focus:ring-[#7A005D]/25"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-10 flex flex-col items-center py-8 space-y-8 bg-transparent absolute right-0 top-0 h-full border-l border-transparent z-30">
              <div className="flex flex-col items-center -rotate-90 origin-center translate-y-24 space-x-2">
                <button
                  type="button"
                  className="flex items-center space-x-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap bg-white border border-slate-200 px-3 py-1.5 rounded-t-lg shadow-sm"
                >
                  <MessageSquare size={12} className="rotate-90" />
                  <span>Share feedback</span>
                </button>
              </div>
              <div className="flex flex-col items-center space-y-6 mt-auto pb-4 absolute bottom-4 w-full">
                <button type="button" className="text-slate-400 hover:text-slate-600 transition-colors">
                  <Settings size={20} />
                </button>
                <button
                  type="button"
                  className="w-8 h-8 bg-[#7A005D] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <Sparkles size={16} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {listMenuOpen &&
        listMenuPos &&
        createPortal(
          <div
            id="doc-review-list-more"
            className="fixed rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
            style={{ top: listMenuPos.top, left: listMenuPos.left, zIndex: 2147483647 }}
            role="presentation"
          >
            <EnvelopeMoreMenu
              variant={listVariant}
              onClose={() => setListMenuOpen(false)}
              onDownload={runBulkDownload}
              onSendReminder={() => setSendReminderOpen(true)}
            />
          </div>,
          document.body
        )}

      {signMenuOpen &&
        signMenuPos &&
        createPortal(
          <div
            id="doc-review-sign-more"
            className="fixed w-64 rounded-xl border border-slate-200 bg-white shadow-2xl py-1 overflow-hidden"
            style={{ top: signMenuPos.top, left: signMenuPos.left, zIndex: 2147483647 }}
            role="menu"
          >
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => {
                setSignMenuOpen(false);
                handleSaveAndExitSign();
              }}
            >
              <LogOut size={16} />
              Save and exit
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => setSignMenuOpen(false)}
            >
              <Download size={16} />
              Download
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => setSignMenuOpen(false)}
            >
              <UserPlus size={16} />
              Assign to someone else
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-semibold hover:bg-slate-50"
              style={{ color: '#E4633C' }}
              onClick={() => setSignMenuOpen(false)}
            >
              <ClipboardX size={16} style={{ color: '#E4633C' }} />
              Refuse to sign
            </button>
            <div className="border-t border-slate-100 my-1" />
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => setSignMenuOpen(false)}
            >
              <LifeBuoy size={16} />
              Help and support
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => setSignMenuOpen(false)}
            >
              <FileCheck size={16} />
              Terms of use
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => setSignMenuOpen(false)}
            >
              <Lock size={16} />
              Privacy policy
            </button>
          </div>,
          document.body
        )}

      {preview && (
        <DocumentPreviewModal
          name={preview.name}
          onClose={() => setPreview(null)}
          onDownload={() => setDocSnack('Document downloaded')}
          zIndexClass="z-[400000]"
        />
      )}

      {docSnack && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[400000] pointer-events-none px-4 w-full max-w-md">
          <div className="pointer-events-auto bg-[#C6F6F1] border border-[#A5F3E9] rounded-lg shadow-lg flex items-center px-4 py-3 gap-3">
            <span className="text-[13px] font-bold text-[#134E4A] flex-1">{docSnack}</span>
            <button type="button" className="text-[#134E4A]/70 p-1" onClick={() => setDocSnack(null)} aria-label="Dismiss">
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {bulkSnack && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[400000] pointer-events-none px-4 w-full max-w-md">
          <div
            className={`pointer-events-auto rounded-lg shadow-lg flex items-center px-4 py-3 gap-3 border ${
              bulkSnack.phase === 'loading'
                ? 'bg-[#E0F2FE] border-[#BAE6FD]'
                : 'bg-[#C6F6F1] border-[#A5F3E9]'
            }`}
          >
            <span className="text-[13px] font-bold text-slate-900 flex-1">
              {bulkSnack.phase === 'loading'
                ? `${bulkSnack.count} documents downloading`
                : `${bulkSnack.count} documents downloaded`}
            </span>
            <button type="button" className="text-slate-600 p-1" onClick={() => setBulkSnack(null)} aria-label="Dismiss">
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
      <SendReminderModal
        open={sendReminderOpen}
        onClose={() => setSendReminderOpen(false)}
        onConfirm={() => {}}
      />
    </div>
  );
};

export default DocumentReviewView;
