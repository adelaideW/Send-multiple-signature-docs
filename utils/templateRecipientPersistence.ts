import { EDITOR_DIRECTORY_USERS, isEditorInternalRecipientId } from './editorDirectoryUsers';
import { CHIP_ATTR } from './templateRecipientChips';
import type { RecipientKind, RecipientTone } from '../components/insertVariable/recipientFieldsData';

export const REGISTRY_ATTR = 'data-template-recipient-registry';

export type PersistedRecipientEntry = {
  id: string;
  label: string;
  sublabel: string;
  paletteIndex: number;
  kind: RecipientKind;
};

export const DEFAULT_EDITOR_RECIPIENTS: PersistedRecipientEntry[] = [
  { id: 'employee', label: 'Employee', sublabel: 'Placeholder recipient', paletteIndex: 0, kind: 'placeholder' },
  {
    id: 'manager',
    label: "Employee's manager",
    sublabel: 'Placeholder recipient',
    paletteIndex: 1,
    kind: 'placeholder',
  },
];

type RegistryPayload = { v: 1; recipients: PersistedRecipientEntry[] };

function normalizeCssColor(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

export function paletteIndexFromChipElement(
  chip: Element,
  palette: readonly RecipientTone[],
): number | null {
  const attr = chip.getAttribute('data-palette-index');
  if (attr != null) {
    const n = Number.parseInt(attr, 10);
    if (!Number.isNaN(n) && n >= 0) return n;
  }
  const el = chip as HTMLElement;
  const bg = el.style.backgroundColor;
  const border = el.style.borderColor;
  if (!bg && !border) return null;
  const idx = palette.findIndex(
    (tone) =>
      (!bg || normalizeCssColor(tone.bg) === normalizeCssColor(bg)) &&
      (!border || normalizeCssColor(tone.border) === normalizeCssColor(border)),
  );
  return idx >= 0 ? idx : null;
}

export function stripRecipientRegistryFromHtml(html: string): string {
  if (!html || !html.includes(REGISTRY_ATTR)) return html;
  if (typeof DOMParser === 'undefined') {
    return html.replace(
      new RegExp(
        `<div[^>]*${REGISTRY_ATTR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]*>[\\s\\S]*?<\\/div>`,
        'gi',
      ),
      '',
    );
  }
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  doc.querySelectorAll(`div[${REGISTRY_ATTR}]`).forEach((el) => el.remove());
  return doc.body.firstElementChild?.innerHTML ?? html;
}

export function parseRecipientRegistryFromHtml(html: string): PersistedRecipientEntry[] | null {
  if (!html || !html.includes(REGISTRY_ATTR)) return null;
  let raw: string | null = null;
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
    raw = doc.querySelector(`div[${REGISTRY_ATTR}]`)?.textContent?.trim() ?? null;
  } else {
    const m = html.match(
      new RegExp(`<div[^>]*${REGISTRY_ATTR}[^>]*>([\\s\\S]*?)<\\/div>`, 'i'),
    );
    raw = m?.[1]?.trim() ?? null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RegistryPayload;
    if (parsed?.v !== 1 || !Array.isArray(parsed.recipients)) return null;
    return parsed.recipients.filter(
      (r) => r && typeof r.id === 'string' && typeof r.label === 'string',
    );
  } catch {
    return null;
  }
}

function defaultLabelForRecipientId(id: string): { label: string; sublabel: string; kind: RecipientKind } {
  if (id === 'employee') {
    return { label: 'Employee', sublabel: 'Placeholder recipient', kind: 'placeholder' };
  }
  if (id === 'manager') {
    return { label: "Employee's manager", sublabel: 'Placeholder recipient', kind: 'placeholder' };
  }
  if (isEditorInternalRecipientId(id)) {
    const internal = EDITOR_DIRECTORY_USERS.find((u) => u.id === id);
    if (internal) {
      return { label: internal.name, sublabel: internal.dept, kind: 'internal' };
    }
  }
  return { label: 'Placeholder', sublabel: 'Placeholder recipient', kind: 'placeholder' };
}

/** Rebuild recipient registry from chip metadata when opening older saved HTML. */
export function reconstructRecipientsFromHtml(
  html: string,
  palette: readonly RecipientTone[],
  fallback: PersistedRecipientEntry[] = DEFAULT_EDITOR_RECIPIENTS,
): PersistedRecipientEntry[] {
  if (!html || !html.includes(CHIP_ATTR)) return fallback;

  const chipInfos: Array<{ id: string; paletteIndex: number | null; labelAttr: string | null }> = [];
  const seen = new Set<string>();

  const collectChip = (chip: Element) => {
    const id = chip.getAttribute('data-recipient-id') || '';
    if (!id || seen.has(id)) return;
    seen.add(id);
    chipInfos.push({
      id,
      paletteIndex: paletteIndexFromChipElement(chip, palette),
      labelAttr: chip.getAttribute('data-recipient-label'),
    });
  };

  if (typeof DOMParser === 'undefined') {
    const re = new RegExp(
      `<span[^>]*data-chip=["']${CHIP_ATTR}["'][^>]*data-recipient-id=["']([^"']+)["'][^>]*>`,
      'gi',
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const id = m[1];
      if (!seen.has(id)) {
        seen.add(id);
        chipInfos.push({ id, paletteIndex: null, labelAttr: null });
      }
    }
  } else {
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
    doc.querySelectorAll(`span[data-chip="${CHIP_ATTR}"]`).forEach(collectChip);
  }

  if (chipInfos.length === 0) return fallback;

  const byId = new Map<string, PersistedRecipientEntry>();
  for (const base of fallback) {
    byId.set(base.id, { ...base });
  }

  let nextPalette = Math.max(-1, ...Array.from(byId.values()).map((r) => r.paletteIndex));

  for (const info of chipInfos) {
    if (byId.has(info.id)) {
      const existing = byId.get(info.id)!;
      if (info.paletteIndex != null) existing.paletteIndex = info.paletteIndex;
      if (info.labelAttr && info.id.startsWith('ext-')) existing.label = info.labelAttr;
      continue;
    }
    nextPalette += 1;
    const defaults = defaultLabelForRecipientId(info.id);
    byId.set(info.id, {
      id: info.id,
      label: info.labelAttr || defaults.label,
      sublabel: defaults.sublabel,
      paletteIndex: info.paletteIndex ?? nextPalette,
      kind: defaults.kind,
    });
  }

  const orderedIds = chipInfos.map((c) => c.id);
  const pinned = ['employee', 'manager'].filter((id) => byId.has(id));
  const rest = orderedIds.filter((id) => !pinned.includes(id));
  const uniqueRest = [...new Set(rest)];

  return [...pinned, ...uniqueRest].map((id) => byId.get(id)!);
}

export function embedRecipientRegistryInHtml(
  html: string,
  recipients: PersistedRecipientEntry[],
): string {
  const cleaned = stripRecipientRegistryFromHtml(html);
  const payload: RegistryPayload = { v: 1, recipients };
  const encoded = JSON.stringify(payload).replace(/</g, '\\u003c');
  return (
    `${cleaned}<div ${REGISTRY_ATTR} hidden contenteditable="false" ` +
    `style="display:none!important" aria-hidden="true">${encoded}</div>`
  );
}

export function resolveRecipientsForEditorHtml(
  html: string,
  palette: readonly RecipientTone[],
): { displayHtml: string; recipients: PersistedRecipientEntry[] } {
  const displayHtml = stripRecipientRegistryFromHtml(html);
  const restored = parseRecipientRegistryFromHtml(html);
  const recipients = restored?.length
    ? restored
    : reconstructRecipientsFromHtml(displayHtml, palette);
  return { displayHtml, recipients };
}
