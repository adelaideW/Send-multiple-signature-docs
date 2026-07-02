/** Directory entries used in TemplateEditor employee search (and chip owner ids). */
export const EDITOR_DIRECTORY_USERS = [
  { id: '1', name: 'Angel Hunter', dept: 'Engineering', email: 'angel.hunter@acme.com', avatar: 'https://i.pravatar.cc/40?u=angel-hunter' },
  { id: '2', name: 'Angie Adams', dept: 'Marketing', email: 'angie.adams@acme.com', avatar: 'https://i.pravatar.cc/40?u=angie-adams' },
  { id: '3', name: 'Anna Taylor', dept: 'Accounting', email: 'anna.taylor@acme.com', avatar: 'https://i.pravatar.cc/40?u=anna-taylor' },
  { id: '4', name: 'Anne Montgomery', dept: 'CEO', email: 'anne.montgomery@acme.com', avatar: 'https://i.pravatar.cc/40?u=anne-montgomery' },
  { id: '5', name: 'James Chen', dept: 'Design', email: 'james.chen@acme.com', avatar: 'https://i.pravatar.cc/40?u=james-chen' },
  { id: '6', name: 'Maria Santos', dept: 'People Operations', email: 'maria.santos@acme.com', avatar: 'https://i.pravatar.cc/40?u=maria-santos' },
  { id: 'u-kale', name: 'Kale George', dept: 'People Operations', email: 'kale.george@acme.com', avatar: 'https://i.pravatar.cc/40?u=kale-george' },
] as const;

export type EditorDirectoryUser = (typeof EDITOR_DIRECTORY_USERS)[number];

export function isEditorPlaceholderRecipientId(rid: string): boolean {
  return rid === 'employee' || rid === 'manager' || rid.startsWith('ext-');
}

export function isEditorInternalRecipientId(rid: string): boolean {
  return !!rid && !isEditorPlaceholderRecipientId(rid);
}

export function resolveEditorDirectoryUser(
  recipientId: string,
): { id: string; name: string; email: string } | null {
  const entry = EDITOR_DIRECTORY_USERS.find((u) => u.id === recipientId);
  if (!entry) return null;
  return { id: entry.id, name: entry.name, email: entry.email };
}

export function extractInternalRecipientIdsFromBody(body: string): string[] {
  if (!body || !body.includes('recipient-field')) return [];
  const seen = new Set<string>();
  const out: string[] = [];

  const collect = (rid: string) => {
    if (!rid || seen.has(rid) || !isEditorInternalRecipientId(rid)) return;
    if (!resolveEditorDirectoryUser(rid)) return;
    seen.add(rid);
    out.push(rid);
  };

  if (typeof DOMParser === 'undefined') {
    const re = /data-recipient-id="([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) !== null) collect(m[1]);
    return out;
  }

  const doc = new DOMParser().parseFromString(`<div>${body}</div>`, 'text/html');
  doc.querySelectorAll('span[data-chip="recipient-field"]').forEach((chip) => {
    collect(chip.getAttribute('data-recipient-id') || '');
  });
  return out;
}

export function extractInternalRecipientIdsFromTemplates(
  selectedTemplates: string[],
  customTemplates: ReadonlyArray<{ name: string; body: string }>,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of selectedTemplates) {
    const custom = customTemplates.find((c) => c.name === name);
    if (!custom?.body) continue;
    for (const rid of extractInternalRecipientIdsFromBody(custom.body)) {
      if (seen.has(rid)) continue;
      seen.add(rid);
      out.push(rid);
    }
  }
  return out;
}

type EnvelopeRecipientSlot = {
  id: string;
  user: { id: string; name: string; email?: string } | null;
  action: 'Needs to complete' | 'CC recipient';
  searchTerm: string;
  isActionDropdownOpen: boolean;
  showCustomMessage?: boolean;
};

/** Ensure each template-bound directory user has a signing recipient row. */
export function mergeRecipientsForInternalTemplateFields(
  internalRecipientIds: string[],
  recipients: EnvelopeRecipientSlot[],
  signingOrderEnabled: boolean,
  signingOrderGroups: string[][],
): {
  recipients: EnvelopeRecipientSlot[];
  signingOrderGroups: string[][];
  mutated: boolean;
} {
  if (internalRecipientIds.length === 0) {
    return { recipients, signingOrderGroups, mutated: false };
  }

  let next = [...recipients];
  let nextGroups = signingOrderGroups.map((g) => [...g]);
  let mutated = false;

  for (const rid of internalRecipientIds) {
    const user = resolveEditorDirectoryUser(rid);
    if (!user) continue;
    if (next.some((r) => r.user?.id === user.id)) continue;

    const emptySlot = next.find((r) => r.action === 'Needs to complete' && !r.user);
    if (emptySlot) {
      next = next.map((r) =>
        r.id === emptySlot.id ? { ...r, user, searchTerm: '' } : r,
      );
      mutated = true;
      continue;
    }

    const newId = Math.random().toString(36).slice(2, 11);
    next.push({
      id: newId,
      user,
      action: 'Needs to complete',
      searchTerm: '',
      isActionDropdownOpen: false,
      showCustomMessage: false,
    });
    if (signingOrderEnabled) {
      nextGroups = [...nextGroups, [newId]];
    }
    mutated = true;
  }

  return { recipients: next, signingOrderGroups: nextGroups, mutated };
}
