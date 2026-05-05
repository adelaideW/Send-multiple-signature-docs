import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Filter,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Folder,
  Maximize2,
  Columns,
  Users,
  LayoutGrid,
  Plus,
  Info,
} from 'lucide-react';
import { PRIMARY_PURPLE } from '../constants';
import CreateProfileFolderPage from './CreateProfileFolderPage';
import {
  addChildFolder,
  canCreateFolderUnderParent,
  createInitialProfileFolderRoot,
  findProfileFolder,
  isFolderAtMaxTreeDepth,
  truncateProfileFolderName,
  type ProfileFolderNode,
} from '../utils/profileFolderUtils';

function formatTs(ts?: string): string {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const yy = String(d.getFullYear()).slice(-2);
    let h = d.getHours();
    h = h % 12 || 12;
    const mi = pad(d.getMinutes());
    const sc = pad(d.getSeconds());
    return `${mm}/${dd}/${yy} ${h}:${mi}:${sc} PST`;
  } catch {
    return ts;
  }
}

const DISABLED_CREATE_TOOLTIP =
  'Maximum nesting depth reached for this folder (10 layers under All documents).';

const MAX_DEPTH_ROW_TOOLTIP =
  'This folder is at the maximum depth and cannot be opened for subfolder management.';

/** 8-digit hex with alpha (supported in modern browsers). */
const primaryTint = (alphaHex: string) => `${PRIMARY_PURPLE}${alphaHex}`;

const ChevronSpacer = () => <span className="w-[14px] h-[14px] shrink-0 inline-block" aria-hidden />;

const SidebarTreeRow: React.FC<{
  rootFolder: ProfileFolderNode;
  node: ProfileFolderNode;
  depth: number;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  selectedId: string;
  onSelect: (id: string) => void;
}> = ({ rootFolder, node, depth, expanded, setExpanded, selectedId, onSelect }) => {
  const hasKids = !!(node.children && node.children.length > 0);
  const isOpen = expanded[node.id] ?? depth < 2;
  const active = selectedId === node.id;
  const selectionDisabled = isFolderAtMaxTreeDepth(rootFolder, node.id);

  return (
    <div key={node.id}>
      <div
        role={selectionDisabled ? undefined : 'button'}
        tabIndex={selectionDisabled ? undefined : 0}
        onClick={() => {
          if (selectionDisabled) return;
          onSelect(node.id);
        }}
        onKeyDown={(e) => {
          if (selectionDisabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(node.id);
          }
        }}
        title={selectionDisabled ? MAX_DEPTH_ROW_TOOLTIP : undefined}
        className={`w-full flex items-center gap-2 py-2.5 text-left text-[13px] transition-colors border-l-[3px] ${
          selectionDisabled
            ? 'text-slate-400 cursor-not-allowed opacity-55 border-transparent'
            : active
              ? 'font-semibold cursor-pointer'
              : 'text-slate-600 hover:bg-white/80 border-transparent cursor-pointer'
        }`}
        style={
          !selectionDisabled && active
            ? {
                backgroundColor: primaryTint('1A'),
                color: PRIMARY_PURPLE,
                borderLeftColor: PRIMARY_PURPLE,
              }
            : undefined
        }
        data-active={active ? 'true' : undefined}
      >
        {hasKids ? (
          <button
            type="button"
            className={`p-0.5 rounded shrink-0 ${
              active && !selectionDisabled ? '' : selectionDisabled ? 'text-slate-300' : 'text-slate-400'
            }`}
            style={active && !selectionDisabled ? { color: PRIMARY_PURPLE } : undefined}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Collapse folder' : 'Expand folder'}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((ex) => ({ ...ex, [node.id]: !isOpen }));
            }}
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <ChevronSpacer />
        )}
        <Folder
          size={16}
          className="shrink-0 text-slate-400"
          style={active && !selectionDisabled ? { color: PRIMARY_PURPLE } : undefined}
        />
        <span className="truncate flex-1 min-w-0" title={node.name}>
          {truncateProfileFolderName(node.name)}
        </span>
      </div>
      {hasKids && isOpen
        ? node.children!.map((c) => (
            <SidebarTreeRow
              key={c.id}
              rootFolder={rootFolder}
              node={c}
              depth={depth + 1}
              expanded={expanded}
              setExpanded={setExpanded}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  );
};

const EmptySubfoldersState: React.FC<{ onCreate: () => void; allowCreateHere: boolean }> = ({
  onCreate,
  allowCreateHere,
}) => (
  <div className="flex flex-col items-center justify-center py-24 px-6 text-center min-h-[360px]">
    <div
      className="w-16 h-16 rounded-full border border-slate-900/15 flex items-center justify-center mb-6"
      aria-hidden
    >
      <Info size={28} strokeWidth={2} className="text-slate-900" />
    </div>
    <h3 className="text-[17px] font-bold text-slate-900 mb-2">No subfolder available</h3>
    <p className="text-[14px] text-slate-500 font-medium leading-relaxed max-w-md mb-8">
      You can create another subfolder here. A new folder will be created
      <br />
      to each selected person&apos;s profile.
    </p>
    <button
      type="button"
      disabled={!allowCreateHere}
      title={!allowCreateHere ? DISABLED_CREATE_TOOLTIP : undefined}
      onClick={() => {
        if (allowCreateHere) onCreate();
      }}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-[13px] font-bold text-slate-900 shadow-sm ${
        allowCreateHere ? 'hover:bg-slate-50' : 'opacity-40 cursor-not-allowed'
      }`}
    >
      <span className="inline-flex items-center justify-center rounded-full border border-slate-300 p-0.5" aria-hidden>
        <Plus size={14} strokeWidth={2.5} />
      </span>
      Create
    </button>
  </div>
);

const ProfileFoldersView: React.FC = () => {
  const [folderRoot, setFolderRoot] = useState<ProfileFolderNode>(() => createInitialProfileFolderRoot());
  const [selectedFolderId, setSelectedFolderId] = useState('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    all: true,
    'folder-confidential': true,
    'folder-notice': true,
    'folder-ee-performance': true,
    'folder-company-policies': true,
  });
  const [subView, setSubView] = useState<'list' | 'create'>('list');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setSearch('');
  }, [selectedFolderId]);

  const selectedFolder = findProfileFolder(folderRoot, selectedFolderId);
  const childFolders = selectedFolder?.children ?? [];

  const tableRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return childFolders;
    return childFolders.filter((r) => r.name.toLowerCase().includes(q));
  }, [childFolders, search]);

  const allowCreateHere = useMemo(
    () => canCreateFolderUnderParent(folderRoot, selectedFolderId),
    [folderRoot, selectedFolderId]
  );

  const selectedHeading = truncateProfileFolderName(selectedFolder?.name ?? 'All documents');
  const childCountLabel = `${childFolders.length}`;

  const showEmptyNoSubfolders = childFolders.length === 0;
  const showSearchEmpty = !showEmptyNoSubfolders && tableRows.length === 0 && search.trim().length > 0;

  return (
    <>
      <div className="flex min-h-[560px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <aside className="w-64 shrink-0 border-r border-slate-200 bg-[#fafafa] flex flex-col">
          <div className="p-4 border-b border-slate-200 flex justify-start items-center">
            <button
              type="button"
              disabled={!allowCreateHere}
              title={!allowCreateHere ? DISABLED_CREATE_TOOLTIP : undefined}
              onClick={() => {
                if (allowCreateHere) setSubView('create');
              }}
              className={`px-3 py-2 rounded-lg text-[12px] font-bold text-white shadow-sm ${
                allowCreateHere ? 'hover:opacity-95' : 'opacity-40 cursor-not-allowed'
              }`}
              style={{ backgroundColor: PRIMARY_PURPLE }}
            >
              Create
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            <SidebarTreeRow
              rootFolder={folderRoot}
              node={folderRoot}
              depth={0}
              expanded={expanded}
              setExpanded={setExpanded}
              selectedId={selectedFolderId}
              onSelect={(id) => {
                if (isFolderAtMaxTreeDepth(folderRoot, id)) return;
                setSelectedFolderId(id);
              }}
            />
          </nav>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="px-8 pt-6 pb-4 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-[15px] font-bold text-slate-900 shrink-0 truncate" title={selectedFolder?.name}>
                {selectedHeading} · {childCountLabel}
              </h2>
              <button
                type="button"
                className="p-1 text-slate-400 hover:text-slate-600 rounded shrink-0"
                aria-label="About folders"
              >
                <HelpCircle size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg border border-transparent hover:border-slate-200"
                aria-label="Grid view"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg border border-transparent hover:border-slate-200"
                aria-label="Expand"
              >
                <Maximize2 size={18} />
              </button>
            </div>
          </div>

          <div className="px-8 py-3 flex items-center justify-between gap-4 border-b border-slate-100">
            <div className="relative w-64 max-w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-[12px] outline-none font-medium"
              />
            </div>
            <button className="flex items-center gap-2 text-[13px] font-bold text-slate-700">
              <Filter size={16} />
              Filter
            </button>
          </div>

          <div className="flex-1 overflow-x-auto px-8 pb-8 flex flex-col min-h-[400px]">
            {showEmptyNoSubfolders ? (
              <EmptySubfoldersState onCreate={() => setSubView('create')} allowCreateHere={allowCreateHere} />
            ) : (
              <>
                <table className="w-full text-left border-collapse min-w-[720px]">
                  <thead>
                    <tr className="text-[11px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1 cursor-pointer">
                          Folder name
                          <ChevronDown size={14} className="text-slate-300" />
                        </span>
                      </th>
                      <th className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1 cursor-pointer">
                          Created for
                          <ChevronDown size={14} className="text-slate-300" />
                        </span>
                      </th>
                      <th className="py-3">
                        <span className="inline-flex items-center gap-1 cursor-pointer">
                          Last modified
                          <ChevronDown size={14} className="text-slate-300" />
                        </span>
                      </th>
                      <th className="py-3 w-10 text-right">
                        <Columns size={16} className="inline text-slate-300 ml-auto" aria-hidden />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px]">
                    {tableRows.map((row) => {
                      const active = selectedFolderId === row.id;
                      const rowMaxDepth = isFolderAtMaxTreeDepth(folderRoot, row.id);
                      return (
                        <tr
                          key={row.id}
                          title={rowMaxDepth ? MAX_DEPTH_ROW_TOOLTIP : undefined}
                          className={`border-b border-slate-100 transition-colors ${
                            rowMaxDepth
                              ? 'opacity-55 cursor-not-allowed'
                              : 'cursor-pointer hover:bg-slate-50/80'
                          }`}
                          style={
                            active && !rowMaxDepth
                              ? {
                                  backgroundColor: primaryTint('14'),
                                  boxShadow: `inset 3px 0 0 0 ${PRIMARY_PURPLE}`,
                                }
                              : undefined
                          }
                          onClick={() => {
                            if (!rowMaxDepth) setSelectedFolderId(row.id);
                          }}
                        >
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <Folder
                                size={18}
                                className={`shrink-0 ${active && !rowMaxDepth ? '' : 'text-slate-400'}`}
                                style={active && !rowMaxDepth ? { color: PRIMARY_PURPLE } : undefined}
                              />
                              <div className="min-w-0 flex items-center gap-2 flex-wrap">
                                <span
                                  className={`font-bold truncate max-w-[280px] ${rowMaxDepth ? '' : 'hover:underline'}`}
                                  style={{ color: rowMaxDepth ? '#64748b' : PRIMARY_PURPLE }}
                                  title={row.name}
                                >
                                  {truncateProfileFolderName(row.name)}
                                </span>
                                {row.isDefault && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/90 text-slate-800 shrink-0">
                                    Default
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 pr-4 text-slate-700 font-medium">
                            <span className="inline-flex items-center gap-1.5">
                              <Users size={14} className="text-slate-400 shrink-0" />
                              {row.createdFor ?? '—'}
                            </span>
                          </td>
                          <td className="py-4 text-slate-500 font-medium whitespace-nowrap">
                            {formatTs(row.lastModified)}
                          </td>
                          <td className="py-4" />
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {showSearchEmpty && (
                  <div className="py-20 text-center text-slate-500 text-sm font-medium">
                    No folders match your search.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {subView === 'create' && (
        <div className="fixed inset-0 z-[200] bg-[#FAFAFA]">
          <CreateProfileFolderPage
            rootFolder={folderRoot}
            parentFolderId={selectedFolderId}
            onExit={() => setSubView('list')}
            onCreate={({ name }) => {
              const id = `pf-folder-${Date.now()}`;
              const child: ProfileFolderNode = {
                id,
                name,
                createdFor: 'All - Employees',
                lastModified: new Date().toISOString(),
              };
              setFolderRoot((r) => addChildFolder(r, selectedFolderId, child));
              setSubView('list');
              setExpanded((ex) => ({ ...ex, [selectedFolderId]: true }));
            }}
          />
        </div>
      )}
    </>
  );
};

export default ProfileFoldersView;
