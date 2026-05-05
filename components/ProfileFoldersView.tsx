import React, { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { PRIMARY_PURPLE } from '../constants';
import CreateProfileFolderPage from './CreateProfileFolderPage';
import {
  addChildFolder,
  canCreateFolderUnderParent,
  countProfileFolders,
  createInitialProfileFolderRoot,
  flattenProfileFolders,
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

const ChevronSpacer = () => <span className="w-[14px] h-[14px] shrink-0 inline-block" aria-hidden />;

const SidebarTreeRow: React.FC<{
  node: ProfileFolderNode;
  depth: number;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  selectedId: string;
  onSelect: (id: string) => void;
}> = ({ node, depth, expanded, setExpanded, selectedId, onSelect }) => {
  const hasKids = !!(node.children && node.children.length > 0);
  const isOpen = expanded[node.id] ?? depth < 2;
  const active = selectedId === node.id;

  const row = (
    <div key={node.id}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(node.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(node.id);
          }
        }}
        className={`w-full flex items-center gap-2 py-2.5 text-left text-[13px] transition-colors cursor-pointer border-l-[3px] ${
          active
            ? 'bg-[#e8f2ff] text-[#2563eb] font-semibold border-[#2563eb]'
            : 'text-slate-600 hover:bg-white/80 border-transparent'
        }`}
        style={{ paddingLeft: `${12 + depth * 14}px`, paddingRight: '12px' }}
      >
        {hasKids ? (
          <button
            type="button"
            className={`p-0.5 rounded shrink-0 ${active ? 'text-[#2563eb]' : 'text-slate-400'}`}
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
        <Folder size={16} className={`shrink-0 ${active ? 'text-[#2563eb]' : 'text-slate-400'}`} />
        <span className="truncate flex-1 min-w-0" title={node.name}>
          {truncateProfileFolderName(node.name)}
        </span>
      </div>
      {hasKids && isOpen
        ? node.children!.map((c) => (
            <SidebarTreeRow
              key={c.id}
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

  return row;
};

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

  const totalFolders = countProfileFolders(folderRoot);

  const tableRows = useMemo(() => {
    let rows = flattenProfileFolders(folderRoot, true);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => r.name.toLowerCase().includes(q));
    }
    return rows;
  }, [folderRoot, search]);

  const allowCreateHere = useMemo(
    () => canCreateFolderUnderParent(folderRoot, selectedFolderId),
    [folderRoot, selectedFolderId]
  );

  return (
    <>
    <div className="flex min-h-[560px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-[#fafafa] flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Location</p>
            <button
              type="button"
              disabled={!allowCreateHere}
              title={!allowCreateHere ? DISABLED_CREATE_TOOLTIP : undefined}
              onClick={() => {
                if (allowCreateHere) setSubView('create');
              }}
              className={`px-3 py-1 rounded-md text-[12px] font-bold text-white shadow-sm ${
                allowCreateHere ? 'hover:opacity-95' : 'opacity-40 cursor-not-allowed'
              }`}
              style={{ backgroundColor: PRIMARY_PURPLE }}
            >
              Create
            </button>
          </div>
          <p className="text-[12px] text-slate-500 mt-1 font-medium leading-snug">New folders are created inside the selected folder.</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          <SidebarTreeRow
            node={folderRoot}
            depth={0}
            expanded={expanded}
            setExpanded={setExpanded}
            selectedId={selectedFolderId}
            onSelect={setSelectedFolderId}
          />
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="px-8 pt-6 pb-4 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-[15px] font-bold text-slate-900 shrink-0">
              All Folders · {totalFolders}
            </h2>
            <button
              type="button"
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
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

        <div className="flex-1 overflow-x-auto px-8 pb-8">
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
                return (
                  <tr
                    key={row.id}
                    className={`border-b border-slate-100 transition-colors cursor-pointer ${
                      active ? 'bg-sky-50/60' : 'hover:bg-slate-50/80'
                    }`}
                    onClick={() => setSelectedFolderId(row.id)}
                  >
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Folder size={18} className="text-slate-400 shrink-0" />
                        <div className="min-w-0 flex items-center gap-2 flex-wrap">
                          <span
                            className="font-bold text-[#2563eb] hover:underline truncate max-w-[280px]"
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
          {tableRows.length === 0 && (
            <div className="py-20 text-center text-slate-500 text-sm font-medium">No folders match your search.</div>
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
