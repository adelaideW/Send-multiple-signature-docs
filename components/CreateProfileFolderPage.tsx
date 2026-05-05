import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HelpCircle, Menu, ArrowLeft, Folder as FolderIcon, UserRound, Search } from 'lucide-react';
import { PRIMARY_PURPLE } from '../constants';
import type { ProfileFolderNode } from '../utils/profileFolderUtils';
import { buildFolderLocationPreview, MAX_PROFILE_FOLDER_LAYERS } from '../utils/profileFolderUtils';

export interface CreateProfileFolderPageProps {
  rootFolder: ProfileFolderNode;
  parentFolderId: string;
  onExit: () => void;
  onCreate?: (payload: { name: string; description: string }) => void;
}

const ADMIN_DESCRIPTION_TOOLTIP =
  'This description is visible only to admins with access to this page';

type PickerType = 'include' | 'except' | 'access';

const PICKER_OPTIONS = [
  'All - Employees',
  'Engineering',
  'Human Resources',
  'Finance',
  'Product',
  'Design',
  'People Managers',
  'US Employees',
  'Canada Employees',
  'Contractors',
  'New hires (last 90 days)',
  'Administrators',
  'Legal Team',
  'Security Team',
  'Payroll Team',
  'Operations Team',
  'Sales Team',
  'Support Team',
];

const TooltipNearDescriptionLabel: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center align-middle ml-1">
      <button
        type="button"
        className="p-0.5 rounded text-slate-400 hover:text-slate-600 cursor-help outline-none focus-visible:ring-2 focus-visible:ring-[#7A005D]/30"
        aria-label="About description visibility"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <HelpCircle size={15} strokeWidth={2} />
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-40 whitespace-normal pointer-events-none">
          <span className="block px-3 py-2 bg-[#1e293b] text-white text-[12px] font-semibold rounded-lg shadow-lg max-w-[280px] leading-snug text-center">
            {ADMIN_DESCRIPTION_TOOLTIP}
          </span>
        </span>
      )}
    </span>
  );
};

const CreateProfileFolderPage: React.FC<CreateProfileFolderPageProps> = ({
  rootFolder,
  parentFolderId,
  onExit,
  onCreate,
}) => {
  const [folderName, setFolderName] = useState('');
  const [description, setDescription] = useState('');
  const [peopleSelectionError] = useState<string | null>(null);
  const [activePicker, setActivePicker] = useState<PickerType | null>(null);
  const pickerContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!pickerContainerRef.current) return;
      if (pickerContainerRef.current.contains(e.target as Node)) return;
      setActivePicker(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const trimmedName = folderName.trim();
  const nameOk = trimmedName.length > 0;

  const locationSteps = useMemo(
    () => buildFolderLocationPreview(rootFolder, parentFolderId, trimmedName || 'New folder'),
    [rootFolder, parentFolderId, trimmedName]
  );

  const handleSubmit = () => {
    if (!nameOk) return;
    onCreate?.({ name: trimmedName, description: description.trim() });
  };

  const layerHelpText = useMemo(() => {
    const levels = locationSteps.filter((s) => s.id !== '__user_profile__').length;
    return `Up to ${MAX_PROFILE_FOLDER_LAYERS} folder layers · showing ${Math.min(levels, MAX_PROFILE_FOLDER_LAYERS)}`;
  }, [locationSteps]);

  return (
    <div className="flex flex-col min-h-screen h-screen bg-[#FAFAFA]">
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <button type="button" className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg" aria-label="Menu">
            <Menu size={22} strokeWidth={2} />
          </button>
          <h2 className="text-[15px] font-bold text-slate-900">Create folder</h2>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-bold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <ArrowLeft size={16} aria-hidden />
          Exit
        </button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 gap-0 lg:gap-6 p-6 lg:p-8 bg-[#FAFAFA] overflow-auto">
        <div className="flex-1 min-w-0 space-y-8" ref={pickerContainerRef}>
          <div>
            <h1 className="text-[20px] font-bold text-slate-900">Create folder</h1>
            <p className="mt-2 text-[14px] text-slate-600 leading-relaxed max-w-3xl font-medium">
              Rippling will create a folder in each selected person&apos;s profile.{' '}
              <a href="#" className="text-[#2563eb] font-bold hover:underline">
                Learn more
              </a>
            </p>
          </div>

          <div className="space-y-2 max-w-2xl">
            <label htmlFor="pf-folder-name" className="text-[13px] font-bold text-slate-800">
              Folder name <span className="text-red-500">*</span>
            </label>
            <input
              id="pf-folder-name"
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#7A005D]/20"
            />
          </div>

          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center">
              <label htmlFor="pf-folder-desc" className="text-[13px] font-bold text-slate-800">
                Description
              </label>
              <TooltipNearDescriptionLabel />
            </div>
            <input
              id="pf-folder-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#7A005D]/20"
            />
          </div>

          <div className="space-y-3 max-w-2xl">
            <div>
              <p className="text-[13px] font-bold text-slate-800">
                Select the people that you want Rippling to create folders for <span className="text-red-500">*</span>
              </p>
              <p className="text-[13px] text-slate-500 mt-1 font-medium">
                Rippling creates a folder in each selected person&apos;s profile. You can&apos;t change this list
                after the folders are created.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100 relative">
              <button
                type="button"
                onClick={() => setActivePicker((cur) => (cur === 'include' ? null : 'include'))}
                className="w-full text-left px-4 py-3 text-[13px] text-slate-500 hover:bg-slate-50 font-medium"
              >
                Include: Search or browse options to create groups of employees
              </button>
              <button
                type="button"
                onClick={() => setActivePicker((cur) => (cur === 'except' ? null : 'except'))}
                className="w-full text-left px-4 py-3 text-[13px] text-slate-400 hover:bg-slate-50 font-medium"
              >
                Except: Click to add exceptions
              </button>
              {(activePicker === 'include' || activePicker === 'except') && (
                <div className="absolute z-40 left-0 right-0 top-[calc(100%+8px)] rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                  <div className="p-3 border-b border-slate-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="text"
                        placeholder="Search groups"
                        className="w-full border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-[13px] font-medium outline-none focus:ring-2 focus:ring-[#7A005D]/20"
                      />
                    </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto py-1">
                    {PICKER_OPTIONS.map((opt) => (
                      <button
                        key={`people-${opt}`}
                        type="button"
                        className="w-full text-left px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50"
                        onClick={() => setActivePicker(null)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              <button type="button" className="text-[13px] font-bold text-[#2563eb] hover:underline">
                Preview people &gt;
              </button>
            </div>
            {peopleSelectionError && <p className="text-[12px] text-red-600 font-semibold">{peopleSelectionError}</p>}
          </div>

          <div className="space-y-3 max-w-2xl">
            <p className="text-[13px] font-bold text-slate-800">
              Add people who need access <span className="text-red-500">*</span>{' '}
              <HelpCircle size={14} className="inline text-slate-400 align-text-bottom" aria-hidden />
            </p>
            <div className="flex gap-2 relative">
              <button
                type="button"
                onClick={() => setActivePicker((cur) => (cur === 'access' ? null : 'access'))}
                className="flex-1 border border-slate-200 rounded-lg py-2.5 px-3 text-[13px] font-medium bg-slate-50 text-slate-500 text-left hover:bg-slate-100/60"
              >
                Search or browse options to create groups of people
              </button>
              <button
                type="button"
                disabled
                className="px-5 py-2.5 rounded-lg text-[13px] font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              >
                Add
              </button>
              {activePicker === 'access' && (
                <div className="absolute z-40 left-0 right-0 top-[calc(100%+8px)] rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                  <div className="p-3 border-b border-slate-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="text"
                        placeholder="Search people or groups"
                        className="w-full border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-[13px] font-medium outline-none focus:ring-2 focus:ring-[#7A005D]/20"
                      />
                    </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto py-1">
                    {PICKER_OPTIONS.map((opt) => (
                      <button
                        key={`access-${opt}`}
                        type="button"
                        className="w-full text-left px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50"
                        onClick={() => setActivePicker(null)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="text-[13px] text-slate-500 font-medium">
              Specify the access level for each person.{' '}
              <a href="#" className="text-[#2563eb] font-bold hover:underline">
                Learn more
              </a>
              .
            </p>
            <div className="rounded-xl border border-dashed border-slate-200 bg-white min-h-[120px]" />
          </div>
        </div>

        <aside className="w-full lg:w-[320px] shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-0">
            <h3 className="text-[15px] font-bold text-slate-900">Folder location</h3>
            <p className="text-[12px] text-slate-500 mt-2 leading-relaxed font-medium">
              All documents are located in folders within each person&apos;s profile. People only see the documents
              they have access to.{' '}
              <a href="#" className="text-[#2563eb] font-semibold hover:underline">
                Learn more
              </a>
            </p>
            <p className="text-[11px] text-slate-400 font-semibold mt-3 mb-3 uppercase tracking-wide">
              {layerHelpText}
            </p>
            <div className="mt-4 border-t border-slate-100 pt-4 space-y-0.5">
              {locationSteps.map((step, idx) => {
                const isUser = step.id === '__user_profile__';
                const isNew = step.isNewPlaceholder;
                const padLeft = idx * 14;
                return (
                  <div
                    key={`${step.id}-${idx}`}
                    className="flex items-center gap-2.5 py-1.5 min-h-[32px]"
                    style={{ paddingLeft: padLeft }}
                  >
                    {isUser ? (
                      <UserRound size={18} className="text-slate-500 shrink-0" />
                    ) : (
                      <FolderIcon
                        size={18}
                        className={`shrink-0 ${isNew ? 'text-slate-900' : 'text-slate-400'}`}
                        strokeWidth={2}
                      />
                    )}
                    <span
                      className={`text-[13px] leading-snug ${
                        isNew ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                      }`}
                      title={step.label !== step.truncated ? step.label : undefined}
                    >
                      {step.truncated}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      <footer className="flex justify-end items-center gap-3 px-6 py-4 bg-white border-t border-slate-200 shrink-0">
        <button
          type="button"
          onClick={onExit}
          className="px-4 py-2 text-[13px] font-bold text-slate-700 hover:bg-slate-50 rounded-lg"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!nameOk}
          onClick={handleSubmit}
          className={`px-5 py-2.5 rounded-lg text-[13px] font-bold text-white shadow-sm ${
            nameOk ? 'hover:opacity-95' : 'opacity-40 cursor-not-allowed'
          }`}
          style={{ backgroundColor: PRIMARY_PURPLE }}
        >
          Create
        </button>
      </footer>
    </div>
  );
};

export default CreateProfileFolderPage;
