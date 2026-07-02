
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
  Eraser,
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
  /**
   * Identity of the user signing. Used by the host to mark the correct
   * recipient row as Completed and to drive any signer-specific UI changes
   * (e.g. hiding "Action required" entries on a person's profile).
   */
  signerUserId?: string;
  /** True when signing was launched from Kale's employee profile Action required tab. */
  returnToProfile?: boolean;
}

interface DocumentReviewViewProps {
  flow: DocumentReviewFlow;
  onExit: () => void;
  onGoHome?: () => void;
  onCompleteAll: (packetId: string) => void;
  /**
   * Persist progress for partially signed docs. Pass `exitFlow: false` when
   * advancing to the next document in a multi-doc packet so the host keeps
   * the review overlay mounted.
   */
  onSavePartial: (
    packetId: string,
    completedDocIds: string[],
    options?: { exitFlow?: boolean }
  ) => void;
}

const ACCENT_SIGN = '#FDB71C';

type SignFieldHighlight = 'acknowledgment' | 'signature' | 'checkbox' | null;

export interface PerDocSignFields {
  acknowledgment: string;
  signatureTyped: string;
  signatureDrawDataUrl: string | null;
  checkbox: boolean;
  /** ISO timestamp captured once all required fields are satisfied (read-only signed date). */
  signedDateLocked: string | null;
}

function defaultPerDocFields(): PerDocSignFields {
  return {
    acknowledgment: '',
    signatureTyped: '',
    signatureDrawDataUrl: null,
    checkbox: false,
    signedDateLocked: null,
  };
}

function hasSignature(st: PerDocSignFields): boolean {
  return !!(st.signatureTyped.trim() || st.signatureDrawDataUrl);
}

function firstMissingRequiredField(st: PerDocSignFields): Exclude<SignFieldHighlight, null> {
  if (!st.acknowledgment.trim()) return 'acknowledgment';
  if (!hasSignature(st)) return 'signature';
  if (!st.checkbox) return 'checkbox';
  return 'acknowledgment';
}

function allRequiredSatisfied(st: PerDocSignFields): boolean {
  return st.acknowledgment.trim().length > 0 && hasSignature(st) && st.checkbox;
}

function formatSignedDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

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
  const [perDocFields, setPerDocFields] = useState<Record<string, PerDocSignFields>>({});
  const [completedInSession, setCompletedInSession] = useState<Record<string, boolean>>({});
  const [fieldHighlight, setFieldHighlight] = useState<SignFieldHighlight>(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [sigModalTyped, setSigModalTyped] = useState('');
  /** True after the user has drawn on the canvas (or a saved draw image was loaded). */
  const [signatureCanvasHasInk, setSignatureCanvasHasInk] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const listMenuBtnRef = useRef<HTMLButtonElement | null>(null);
  const signMenuBtnRef = useRef<HTMLButtonElement | null>(null);
  const ackFieldRef = useRef<HTMLDivElement | null>(null);
  const signatureFieldRef = useRef<HTMLDivElement | null>(null);
  const checkboxFieldRef = useRef<HTMLDivElement | null>(null);
  const [listMenuPos, setListMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [signMenuPos, setSignMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [preview, setPreview] = useState<{ name: string; docId: string } | null>(null);
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

  const getFields = (docId: string): PerDocSignFields =>
    perDocFields[docId] ?? defaultPerDocFields();

  const patchDocFields = (docId: string, patch: Partial<PerDocSignFields>) => {
    setPerDocFields((prev) => ({
      ...prev,
      [docId]: { ...(prev[docId] ?? defaultPerDocFields()), ...patch },
    }));
  };

  const ackLive = currentSignDoc ? getFields(currentSignDoc.id).acknowledgment : '';
  const sigTypedLive = currentSignDoc ? getFields(currentSignDoc.id).signatureTyped : '';
  const sigDrawLive = currentSignDoc ? getFields(currentSignDoc.id).signatureDrawDataUrl : null;
  const cbLive = currentSignDoc ? getFields(currentSignDoc.id).checkbox : false;

  useEffect(() => {
    if (!currentSignDoc) return;
    setPerDocFields((prev) => {
      const st = prev[currentSignDoc.id] ?? defaultPerDocFields();
      const ok = allRequiredSatisfied(st);
      if (!ok && st.signedDateLocked) {
        return { ...prev, [currentSignDoc.id]: { ...st, signedDateLocked: null } };
      }
      if (ok && !st.signedDateLocked) {
        return { ...prev, [currentSignDoc.id]: { ...st, signedDateLocked: new Date().toISOString() } };
      }
      return prev;
    });
  }, [currentSignDoc?.id, ackLive, sigTypedLive, sigDrawLive, cbLive]);

  const scrollHighlight = (which: Exclude<SignFieldHighlight, null>) => {
    const ref =
      which === 'acknowledgment'
        ? ackFieldRef
        : which === 'signature'
          ? signatureFieldRef
          : checkboxFieldRef;
    window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  };

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
      if (document.getElementById('doc-review-signature-modal')?.contains(t)) return;
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
    setFieldHighlight(null);
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
      if (allRequiredSatisfied(getFields(d.id))) ids.add(d.id);
    });
    if (ids.size > 0) onSavePartial(flow.packetId, [...ids], { exitFlow: true });
    else onExit();
  };

  const handlePrimaryAction = () => {
    if (!currentSignDoc) return;
    const st = getFields(currentSignDoc.id);
    if (!allRequiredSatisfied(st)) {
      const miss = firstMissingRequiredField(st);
      setFieldHighlight(miss);
      scrollHighlight(miss);
      return;
    }

    const nextCompleted = { ...completedInSession, [currentSignDoc.id]: true };
    setCompletedInSession(nextCompleted);
    setFieldHighlight(null);

    const finishedIds = signableDocs.filter((d) => nextCompleted[d.id]).map((d) => d.id);
    if (activeSignIndex < signableDocs.length - 1) {
      onSavePartial(flow.packetId, finishedIds, { exitFlow: false });
      setActiveSignDocId(signableDocs[activeSignIndex + 1].id);
      return;
    }
    onCompleteAll(flow.packetId);
  };

  const primaryLabel = signableDocs.length > 1 && !isLastSignDoc ? 'Next' : 'Complete';

  const ringFor = (key: Exclude<SignFieldHighlight, null>) =>
    fieldHighlight === key ? 'ring-2 ring-[#7A005D] ring-offset-2 rounded-xl transition-shadow duration-300' : '';

  const renderSignedSummary = (docId: string): React.ReactNode => {
    const st = getFields(docId);
    if (!completedInSession[docId] && !allRequiredSatisfied(st)) return null;
    return (
      <div className="space-y-3">
        <p>
          <span className="font-semibold text-slate-900">Acknowledgment: </span>
          {st.acknowledgment || '—'}
        </p>
        <div>
          <p className="font-semibold text-slate-900 mb-1">Signature</p>
          {st.signatureDrawDataUrl ? (
            <img src={st.signatureDrawDataUrl} alt="Signature" className="max-h-16 border border-slate-200 rounded bg-white" />
          ) : (
            <p className="font-serif italic text-xl text-slate-900">{st.signatureTyped || '—'}</p>
          )}
        </div>
        <p>
          <span className="font-semibold text-slate-900">Confirmation: </span>
          {st.checkbox ? 'Checked — I agree' : '—'}
        </p>
        <p>
          <span className="font-semibold text-slate-900">Signed date: </span>
          {st.signedDateLocked ? formatSignedDate(st.signedDateLocked) : '—'}
        </p>
      </div>
    );
  };

  const downloadSignedRecord = (docName: string, docId: string) => {
    const st = getFields(docId);
    const imgTag = st.signatureDrawDataUrl
      ? `<p><strong>Signature</strong></p><img src="${st.signatureDrawDataUrl}" alt="Signature" style="max-height:80px;border:1px solid #e2e8f0;" />`
      : `<p><strong>Signature</strong></p><p style="font-family:Georgia,serif;font-style:italic;font-size:22px;">${escapeHtml(st.signatureTyped)}</p>`;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(docName)} — signed</title></head><body style="font-family:system-ui,sans-serif;padding:24px;max-width:640px;">
<h1>${escapeHtml(docName)}</h1>
<p><strong>Acknowledgment</strong></p><p>${escapeHtml(st.acknowledgment)}</p>
${imgTag}
<p><strong>Confirmation</strong></p><p>${st.checkbox ? 'Checked — I agree' : '—'}</p>
<p><strong>Signed date</strong></p><p>${st.signedDateLocked ? formatSignedDate(st.signedDateLocked) : '—'}</p>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docName.replace(/[^\w\-]+/g, '_')}_signed.html`;
    a.click();
    URL.revokeObjectURL(url);
    setDocSnack('Signed document downloaded');
  };

  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const openSignatureModal = () => {
    if (!currentSignDoc) return;
    setSignatureModalOpen(true);
  };

  useLayoutEffect(() => {
    if (!signatureModalOpen || !currentSignDoc) return;
    const st = perDocFields[currentSignDoc.id] ?? defaultPerDocFields();
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const w = c.width;
    const h = c.height;
    const paintWhite = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    };

    setSigModalTyped(st.signatureTyped);
    if (st.signatureDrawDataUrl) {
      const img = new Image();
      img.onload = () => {
        paintWhite();
        try {
          ctx.drawImage(img, 0, 0, w, h);
        } catch {
          paintWhite();
        }
        setSignatureCanvasHasInk(true);
      };
      img.onerror = () => {
        paintWhite();
        setSignatureCanvasHasInk(false);
      };
      img.src = st.signatureDrawDataUrl;
    } else {
      paintWhite();
      setSignatureCanvasHasInk(false);
    }
  }, [signatureModalOpen, currentSignDoc?.id]);

  const applySignatureFromModal = () => {
    if (!currentSignDoc) return;
    const typed = sigModalTyped.trim();
    const hasTyped = typed.length > 0;
    const hasDraw = signatureCanvasHasInk;
    if (!hasTyped && !hasDraw) return;

    if (hasTyped) {
      patchDocFields(currentSignDoc.id, {
        signatureTyped: typed,
        signatureDrawDataUrl: null,
      });
    } else {
      const canvas = canvasRef.current;
      const url = canvas && canvas.width > 0 ? canvas.toDataURL('image/png') : null;
      const ink = url && url.length > 100;
      patchDocFields(currentSignDoc.id, {
        signatureDrawDataUrl: ink ? url : null,
        signatureTyped: '',
      });
    }
    setSignatureModalOpen(false);
  };

  const clearSignatureCanvas = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (ctx && c) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
    }
    setSignatureCanvasHasInk(false);
  };

  const canvasXY = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    if ('touches' in e) {
      const t = e.touches[0] ?? e.changedTouches[0];
      if (!t) return { x: 0, y: 0 };
      const r = c.getBoundingClientRect();
      const scaleX = c.width / r.width;
      const scaleY = c.height / r.height;
      return { x: (t.clientX - r.left) * scaleX, y: (t.clientY - r.top) * scaleY };
    }
    const me = e as React.MouseEvent<HTMLCanvasElement>;
    const scaleX = c.width / c.clientWidth;
    const scaleY = c.height / c.clientHeight;
    return { x: me.nativeEvent.offsetX * scaleX, y: me.nativeEvent.offsetY * scaleY };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (sigModalTyped.trim()) return;
    if ('touches' in e) e.preventDefault();
    isDrawingRef.current = true;
    lastPointRef.current = canvasXY(e);
  };
  const moveDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('touches' in e) e.preventDefault();
    if (!isDrawingRef.current || !lastPointRef.current) return;
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!ctx || !c) return;
    const p = canvasXY(e);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPointRef.current = p;
    setSignatureCanvasHasInk(true);
  };
  const endDraw = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
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
                        <button
                          type="button"
                          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                          aria-label="View"
                          onClick={() => setPreview({ name: doc.name, docId: doc.id })}
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          type="button"
                          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                          aria-label="Download"
                          onClick={() => {
                            const st = getFields(doc.id);
                            if (completedInSession[doc.id] || allRequiredSatisfied(st)) {
                              downloadSignedRecord(doc.name, doc.id);
                            } else {
                              setDocSnack('Document downloaded');
                            }
                          }}
                        >
                          <Download size={18} />
                        </button>
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
              <button
                type="button"
                onClick={handleSaveAndExitSign}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 px-1"
              >
                <LogOut size={14} />
                Save and exit
              </button>
              <button
                type="button"
                onClick={handlePrimaryAction}
                className="px-5 py-2 bg-[#7A005D] text-white rounded-[8px] text-xs font-bold hover:opacity-90 shadow-sm"
              >
                {primaryLabel}
              </button>
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
                  <p>Please complete the required fields below to continue.</p>
                  <p className="text-slate-600">Tap <strong>Next</strong> or <strong>Complete</strong> when you are ready — if anything is missing, we will highlight the next field you need.</p>

                  <div ref={ackFieldRef} className={`mt-6 p-3 -m-3 ${ringFor('acknowledgment')}`}>
                    <label className="block text-[11px] font-bold text-slate-900 uppercase mb-1">Required acknowledgment</label>
                    <input
                      type="text"
                      value={getFields(currentSignDoc.id).acknowledgment}
                      onChange={(e) => patchDocFields(currentSignDoc.id, { acknowledgment: e.target.value })}
                      placeholder="Type your acknowledgment"
                      className="w-full max-w-md border border-slate-200 rounded-[8px] px-3 py-2 outline-none focus:ring-2 focus:ring-[#7A005D]/25 text-slate-900"
                    />
                  </div>

                  <div ref={signatureFieldRef} className={`mt-6 p-3 -m-3 ${ringFor('signature')}`}>
                    <label className="block text-[11px] font-bold text-slate-900 uppercase mb-2">Signature</label>
                    <button
                      type="button"
                      onClick={openSignatureModal}
                      className="w-full max-w-md border-2 border-dashed border-slate-300 rounded-xl px-4 py-6 text-left hover:border-[#7A005D]/50 hover:bg-slate-50/80 transition-colors"
                    >
                      {getFields(currentSignDoc.id).signatureDrawDataUrl ? (
                        <img
                          src={getFields(currentSignDoc.id).signatureDrawDataUrl!}
                          alt="Your signature"
                          className="max-h-20 object-contain"
                        />
                      ) : getFields(currentSignDoc.id).signatureTyped ? (
                        <span className="font-serif italic text-3xl text-slate-900">{getFields(currentSignDoc.id).signatureTyped}</span>
                      ) : (
                        <span className="text-slate-500 text-sm font-medium">Click to sign — type your name or draw your signature</span>
                      )}
                    </button>
                  </div>

                  <div ref={checkboxFieldRef} className={`mt-6 p-3 -m-3 ${ringFor('checkbox')}`}>
                    <label className="flex items-start gap-3 cursor-pointer max-w-md">
                      <input
                        type="checkbox"
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-[#7A005D] focus:ring-[#7A005D]"
                        checked={getFields(currentSignDoc.id).checkbox}
                        onChange={(e) => patchDocFields(currentSignDoc.id, { checkbox: e.target.checked })}
                      />
                      <span className="text-[13px] font-bold text-slate-900 leading-snug">
                        I confirm the information above is accurate and I agree to proceed.
                      </span>
                    </label>
                  </div>

                  <div className="mt-8 max-w-md">
                    <label className="block text-[11px] font-bold text-slate-900 uppercase mb-1">Signed date</label>
                    <div
                      className="w-full border border-slate-200 rounded-[8px] px-3 py-2 bg-slate-100 text-slate-900 font-medium cursor-default select-none"
                      aria-readonly="true"
                    >
                      {getFields(currentSignDoc.id).signedDateLocked
                        ? formatSignedDate(getFields(currentSignDoc.id).signedDateLocked!)
                        : '—'}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Filled automatically when all required fields above are complete.</p>
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
                if (currentSignDoc) {
                  const st = getFields(currentSignDoc.id);
                  if (completedInSession[currentSignDoc.id] || allRequiredSatisfied(st)) {
                    downloadSignedRecord(currentSignDoc.name, currentSignDoc.id);
                  } else {
                    setDocSnack('Document downloaded');
                  }
                }
              }}
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

      {signatureModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[500000] flex items-center justify-center bg-black/45 p-4"
            onClick={() => setSignatureModalOpen(false)}
            role="presentation"
          >
            <div
              id="doc-review-signature-modal"
              className="bg-white rounded-2xl shadow-2xl w-full max-w-[640px] p-6 border border-slate-200"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="sig-modal-title"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 id="sig-modal-title" className="text-lg font-bold text-slate-900 pr-2">
                  Add your signature
                </h2>
                <button
                  type="button"
                  onClick={() => setSignatureModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed mb-5">
                Draw your signature above, or type your full name below. Only one method is active at a time — use the
                clear buttons to reset.
              </p>

              {/* Draw (top) */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Draw</span>
                  <button
                    type="button"
                    onClick={clearSignatureCanvas}
                    disabled={!signatureCanvasHasInk}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none"
                    title="Clear drawing"
                    aria-label="Clear drawing"
                  >
                    <Eraser size={18} strokeWidth={2} />
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <canvas
                    ref={canvasRef}
                    width={608}
                    height={200}
                    className={`w-full h-[200px] touch-none bg-white block ${
                      sigModalTyped.trim().length > 0 ? 'cursor-not-allowed opacity-50' : 'cursor-crosshair'
                    }`}
                    onMouseDown={startDraw}
                    onMouseMove={moveDraw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={moveDraw}
                    onTouchEnd={endDraw}
                  />
                </div>
              </div>

              {/* Type (bottom) */}
              <div className="mb-6">
                <div className="mb-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Type</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={sigModalTyped}
                    onChange={(e) => setSigModalTyped(e.target.value)}
                    disabled={signatureCanvasHasInk}
                    className="w-full border border-slate-200 rounded-xl pl-3 py-3 pr-12 text-slate-900 font-medium outline-none focus:ring-2 focus:ring-[#7A005D]/25 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    placeholder="Type your full name"
                  />
                  {sigModalTyped.trim() && !signatureCanvasHasInk ? (
                    <button
                      type="button"
                      onClick={() => setSigModalTyped('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A005D]/40 focus-visible:ring-offset-2"
                      title="Clear typed name"
                      aria-label="Clear typed name"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSignatureModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-900 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!(sigModalTyped.trim() || signatureCanvasHasInk)}
                  onClick={applySignatureFromModal}
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm ${
                    sigModalTyped.trim() || signatureCanvasHasInk
                      ? 'bg-[#7A005D] text-white hover:opacity-95'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Apply signature
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {preview && (
        <DocumentPreviewModal
          name={preview.name}
          onClose={() => setPreview(null)}
          onDownload={() => {
            const st = getFields(preview.docId);
            if (completedInSession[preview.docId] || allRequiredSatisfied(st)) {
              downloadSignedRecord(preview.name, preview.docId);
            } else {
              setDocSnack('Document downloaded');
            }
          }}
          signedSummary={renderSignedSummary(preview.docId) ?? undefined}
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
