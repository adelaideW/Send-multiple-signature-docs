import React, { useState, useEffect, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { EmployeeHeaderSection, EmployeeDocumentsSection } from './components/EmployeeProfile';
import EnvelopeCreator from './components/EnvelopeCreator';
import TemplateEditor from './components/TemplateEditor';
import EnvelopeDetailsView from './components/EnvelopeDetailsView';
import DocumentReviewView from './components/DocumentReviewView';
import LandingPage from './components/LandingPage';
import PeopleTabView from './components/PeopleTabView';
import GeminiAssistant from './components/GeminiAssistant';
import { MOCK_EMPLOYEE } from './constants';
import type { UploadedFileItem } from './types';

type ViewType = 'landing' | 'profile' | 'envelope' | 'template_editor' | 'envelope_details' | 'document_review' | 'people_tab';

// Define the state structure for persistent envelope creation
interface EnvelopeState {
  selectedTemplates: string[];
  uploadedFiles: UploadedFileItem[];
  recipients: any[];
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
}

const INITIAL_ENVELOPE_STATE: EnvelopeState = {
  selectedTemplates: [],
  uploadedFiles: [],
  recipients: [{ id: '1', user: null, action: 'Needs to complete', isSearching: false, searchTerm: '', isActionDropdownOpen: false }],
  selectedFolder: '',
  signingOrderEnabled: false,
  signingOrderGroups: [],
  customTemplates: [],
  customMessageSubject: 'Action required for documents',
  customMessageBody: 'Please review and send the documents\n• {Document names}',
  advancedTags: [],
};

const SuccessSnackbar: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 10000);
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
  const [viewHistory, setViewHistory] = useState<ViewType[]>(['landing']);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [sentEnvelopeName, setSentEnvelopeName] = useState('');
  const [selectedEnvelopeName, setSelectedEnvelopeName] = useState('');
  const [viewByDocuments, setViewByDocuments] = useState(false);
  const [templateEditorMode, setTemplateEditorMode] = useState<'create' | 'edit'>('edit');
  const [templateEditorSeed, setTemplateEditorSeed] = useState<{ title: string; bodyHtml: string | null } | null>(null);

  // Persistent Envelope Creation State
  const [envelopeState, setEnvelopeState] = useState<EnvelopeState>(INITIAL_ENVELOPE_STATE);

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

  const handleEnvelopeContinue = (name: string) => {
    setSentEnvelopeName(name);
    setShowSuccessToast(true);
    // Reset state after completion
    setEnvelopeState(INITIAL_ENVELOPE_STATE);
    setViewHistory(prev => {
      const envelopeIndex = prev.indexOf('envelope');
      if (envelopeIndex > 0) {
        return prev.slice(0, envelopeIndex);
      }
      return ['landing'];
    });
  };

  const handleOpenEnvelopeDetails = (name: string) => {
    setSelectedEnvelopeName(name);
    navigateTo('envelope_details');
  };

  const handleExitEnvelopeDetails = () => {
    setViewByDocuments(true);
    goBack();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Landing Page View */}
      {currentView === 'landing' && (
        <div className="flex flex-col h-screen bg-white">
          <Header onProfileClick={() => navigateTo('profile')} />
          <LandingPage 
            onSelectUserProfile={() => navigateTo('profile')} 
            onSelectPeopleTab={() => navigateTo('people_tab')}
          />
        </div>
      )}

      {/* People Tab View */}
      {currentView === 'people_tab' && (
        <PeopleTabView 
          onGoHome={() => setViewHistory(['landing'])} 
          onSendDocument={() => navigateTo('envelope')}
        />
      )}

      {/* Profile & Main Sidebar View */}
      <div className={`flex min-h-screen bg-[#F9FAFB] ${['profile', 'envelope_details'].includes(currentView) ? 'block' : 'hidden'}`}>
        <div className="w-14 bg-white border-r border-slate-200 flex flex-col items-center py-4 space-y-6 sticky top-0 h-screen z-30 shrink-0">
          <div 
            onClick={() => setViewHistory(['landing'])}
            className="text-[#7A005D] font-bold text-xl mb-4 cursor-pointer hover:opacity-80 transition-opacity"
            title="Go to Home"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 6C7 6 4 9 4 12C4 15 7 18 7 18" stroke="#7A005D" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 6C12 6 9 9 9 12C9 15 12 18 12 18" stroke="#7A005D" strokeWidth="2" strokeLinecap="round"/>
              <path d="M17 6C17 6 14 9 14 12C14 15 17 18 17 18" stroke="#7A005D" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="space-y-6 flex flex-col items-center text-slate-400">
             <i className="w-5 h-5 cursor-pointer hover:text-slate-600"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></i>
             <i className="w-5 h-5 cursor-pointer hover:text-slate-600"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></i>
             <i className="w-5 h-5 cursor-pointer hover:text-slate-600"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></i>
             <i className="w-5 h-5 text-[#7A005D]"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></i>
          </div>
        </div>

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Header onProfileClick={() => navigateTo('profile')} />
          <main className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#F9FAFB]">
            {currentView === 'profile' && (
              <>
                <EmployeeHeaderSection employee={MOCK_EMPLOYEE} />
                <div className="flex items-start">
                  <Sidebar />
                  <div className="flex-1 min-w-0">
                    <EmployeeDocumentsSection 
                      onSend={() => navigateTo('envelope')} 
                      onOpenEnvelope={handleOpenEnvelopeDetails}
                      onReviewDocument={() => navigateTo('document_review')}
                      viewByDocuments={viewByDocuments}
                      setViewByDocuments={setViewByDocuments}
                    />
                  </div>
                </div>
              </>
            )}
            {currentView === 'envelope_details' && (
              <EnvelopeDetailsView 
                envelopeName={selectedEnvelopeName} 
                onExit={handleExitEnvelopeDetails} 
                onSign={() => navigateTo('document_review')}
              />
            )}

            {['profile', 'envelope_details', 'people_tab'].includes(currentView) && (
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

            {showSuccessToast && (
              <SuccessSnackbar 
                message="envelope sent" 
                onClose={() => setShowSuccessToast(false)} 
              />
            )}
          </main>
        </div>
      </div>

      {/* Envelope Creator View */}
      {currentView === 'envelope' && (
        <div className="absolute inset-0 z-[100] bg-white">
          <EnvelopeCreator 
            onExit={goBack} 
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
            onGoHome={() => setViewHistory(['landing'])}
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

      {currentView === 'document_review' && (
        <div className="absolute inset-0 z-[120] bg-white">
          <DocumentReviewView 
            onExit={goBack} 
            onGoHome={() => setViewHistory(['landing'])}
          />
        </div>
      )}
    </div>
  );
}

export default App;