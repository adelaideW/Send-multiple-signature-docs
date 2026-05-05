import { PROFILE_DOCUMENT_FOLDER_LOCATIONS } from '../constants';

export const PROFILE_FOLDER_NAME_MAX_DISPLAY = 20;
/** Max folder segments from “All documents” through the new folder (inclusive). */
export const MAX_PROFILE_FOLDER_LAYERS = 10;

export type ProfileFolderNode = {
  id: string;
  name: string;
  isDefault?: boolean;
  createdFor?: string;
  lastModified?: string;
  children?: ProfileFolderNode[];
};

export function truncateProfileFolderName(name: string, maxLen = PROFILE_FOLDER_NAME_MAX_DISPLAY): string {
  const t = name.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}...`;
}

export function findProfileFolder(
  root: ProfileFolderNode,
  id: string
): ProfileFolderNode | null {
  if (root.id === id) return root;
  for (const c of root.children ?? []) {
    const hit = findProfileFolder(c, id);
    if (hit) return hit;
  }
  return null;
}

export function findParentProfileFolderId(root: ProfileFolderNode, childId: string): string | null {
  if (root.id === childId) return null;
  for (const c of root.children ?? []) {
    if (c.id === childId) return root.id;
    const nested = findParentProfileFolderId(c, childId);
    if (nested) return nested;
  }
  return null;
}

/** Number of edges from `all` down to this node (0 for root). */
export function depthFromAllDocuments(root: ProfileFolderNode, folderId: string): number | null {
  const walk = (node: ProfileFolderNode, d: number): number | null => {
    if (node.id === folderId) return d;
    for (const c of node.children ?? []) {
      const hit = walk(c, d + 1);
      if (hit != null) return hit;
    }
    return null;
  };
  return walk(root, 0);
}

/**
 * Segments on the path from “All documents” to the parent of the new folder (inclusive of All documents).
 * Used to enforce MAX_PROFILE_FOLDER_LAYERS for the *new* folder row in the sidebar.
 */
export function pathSegmentCountIncludingAllDocuments(root: ProfileFolderNode, parentId: string): number | null {
  if (parentId === root.id) return 1;
  const d = depthFromAllDocuments(root, parentId);
  if (d == null) return null;
  return 1 + d;
}

export function canCreateFolderUnderParent(
  root: ProfileFolderNode,
  parentId: string
): boolean {
  const segs = pathSegmentCountIncludingAllDocuments(root, parentId);
  if (segs == null) return false;
  const newDepth = segs + 1;
  return newDepth <= MAX_PROFILE_FOLDER_LAYERS;
}

/** Folder sits on the deepest allowed tier (cannot nest further); don’t allow selecting it in the tree/table. */
export function isFolderAtMaxTreeDepth(root: ProfileFolderNode, folderId: string): boolean {
  const segs = pathSegmentCountIncludingAllDocuments(root, folderId);
  return segs != null && segs >= MAX_PROFILE_FOLDER_LAYERS;
}

export type FolderLocationStep = {
  id: string;
  label: string;
  truncated: string;
  isNewPlaceholder?: boolean;
};

function findPathFromRootTo(root: ProfileFolderNode, goal: string): ProfileFolderNode[] | null {
  if (root.id === goal) return [root];
  for (const c of root.children ?? []) {
    const sub = findPathFromRootTo(c, goal);
    if (sub) return [root, ...sub];
  }
  return null;
}

/** Builds right-rail preview: User’s profile → … path to parent … → New folder. */
export function buildFolderLocationPreview(
  root: ProfileFolderNode,
  parentFolderId: string,
  newFolderDraftName?: string
): FolderLocationStep[] {
  const steps: FolderLocationStep[] = [];

  steps.push({
    id: '__user_profile__',
    label: 'User’s profile',
    truncated: truncateProfileFolderName('User’s profile'),
  });

  const pathToParent = findPathFromRootTo(root, parentFolderId);
  if (!pathToParent) {
    steps.push({
      id: root.id,
      label: root.name,
      truncated: truncateProfileFolderName(root.name),
    });
  } else {
    for (const node of pathToParent) {
      steps.push({
        id: node.id,
        label: node.name,
        truncated: truncateProfileFolderName(node.name),
      });
    }
  }

  const draft = (newFolderDraftName ?? 'New folder').trim() || 'New folder';
  steps.push({
    id: '__new__',
    label: draft,
    truncated: truncateProfileFolderName(draft),
    isNewPlaceholder: true,
  });

  return steps;
}

export function flattenProfileFolders(root: ProfileFolderNode, skipRoot = true): ProfileFolderNode[] {
  const out: ProfileFolderNode[] = [];

  function walk(node: ProfileFolderNode) {
    if (!skipRoot || node.id !== root.id) {
      out.push(node);
    }
    for (const c of node.children ?? []) {
      walk(c);
    }
  }

  walk(root);
  return out;
}

export function countProfileFolders(root: ProfileFolderNode): number {
  return flattenProfileFolders(root, true).length;
}

/** Seed tree for Documents → Profile Folders (includes demo nesting under EE Performance Record). */
export function createInitialProfileFolderRoot(): ProfileFolderNode {
  const fakeChildrenByFolderId: Record<string, ProfileFolderNode[]> = {
    'folder-confidential': [
      {
        id: 'folder-confidential/employee-relations',
        name: 'Employee relations',
        createdFor: 'All - Employees',
        lastModified: '2026-02-04T10:22:00.000Z',
      },
      {
        id: 'folder-confidential/investigation-notes',
        name: 'Investigation notes',
        createdFor: 'All - Employees',
        lastModified: '2026-02-05T09:12:00.000Z',
      },
    ],
    'folder-notice': [
      {
        id: 'folder-notice/policy-updates',
        name: 'Policy updates',
        createdFor: 'All - Employees',
        lastModified: '2026-02-06T08:20:00.000Z',
      },
      {
        id: 'folder-notice/team-announcements',
        name: 'Team announcements',
        createdFor: 'All - Employees',
        lastModified: '2026-02-02T14:15:00.000Z',
      },
    ],
    'folder-ee-performance': [
      {
        id: 'folder-ee-performance/performance-records',
        name: 'Performance records',
        createdFor: 'All - Employees',
        lastModified: '2026-02-01T12:00:00.000Z',
      },
      {
        id: 'folder-ee-performance/manager-feedback',
        name: 'Manager feedback',
        createdFor: 'All - Employees',
        lastModified: '2026-02-03T11:10:00.000Z',
      },
    ],
    'folder-company-policies': [
      {
        id: 'folder-company-policies/handbook-acknowledgements',
        name: 'Handbook acknowledgements',
        createdFor: 'All - Employees',
        lastModified: '2026-02-07T10:00:00.000Z',
      },
      {
        id: 'folder-company-policies/remote-work',
        name: 'Remote work',
        createdFor: 'All - Employees',
        lastModified: '2026-02-08T09:40:00.000Z',
      },
    ],
  };

  return {
    id: 'all',
    name: 'All documents',
    children: PROFILE_DOCUMENT_FOLDER_LOCATIONS.map((f) => ({
      id: f.id,
      name: f.name,
      isDefault: f.isDefault,
      createdFor: 'All - Employees',
      lastModified: '2026-01-13T22:47:21.000Z',
      children: fakeChildrenByFolderId[f.id],
    })),
  };
}

export function addChildFolder(
  root: ProfileFolderNode,
  parentId: string,
  child: ProfileFolderNode
): ProfileFolderNode {
  if (root.id === parentId) {
    return {
      ...root,
      children: [...(root.children ?? []), child],
    };
  }
  return {
    ...root,
    children: (root.children ?? []).map((c) => addChildFolder(c, parentId, child)),
  };
}
