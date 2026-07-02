import {
  VARIABLE_DROPDOWN_ROOT,
  recipientFieldLeaves,
  type VariableMenuNode,
} from '../components/variablesCatalog';

export type EditorRecipientEntry = {
  id: string;
  label: string;
  kind: 'placeholder' | 'internal';
};

function sortNodesByLabel(nodes: VariableMenuNode[]): VariableMenuNode[] {
  return [...nodes].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }),
  );
}

/**
 * Merge static object-graph variables with a Recipient fields folder that
 * includes Employee, Manager, each saved placeholder (Lawyer, …), each
 * assigned internal employee (Angel Hunter, …), and Custom (new placeholder only).
 */
export function buildVariableDropdownRootForEditor(
  recipients: EditorRecipientEntry[],
): VariableMenuNode[] {
  const recipientFieldsFolder = VARIABLE_DROPDOWN_ROOT.find((n) => n.id === 'root.recipient-fields');
  if (!recipientFieldsFolder?.children) return VARIABLE_DROPDOWN_ROOT;

  const employeeNode = recipientFieldsFolder.children.find((c) => c.id === 'recipient.employee');
  const managerNode = recipientFieldsFolder.children.find((c) => c.id === 'recipient.employee-manager');
  const customNewNode = recipientFieldsFolder.children.find((c) => c.id === 'recipient.custom');

  const placeholderRecipients = recipients.filter(
    (r) => r.kind === 'placeholder' && r.id !== 'employee' && r.id !== 'manager',
  );

  const internalRecipients = recipients.filter((r) => r.kind === 'internal');

  const placeholderNodes: VariableMenuNode[] = placeholderRecipients.map((r) => ({
    id: `recipient.placeholder.${r.id}`,
    label: r.label,
    searchKeywords: [r.label.toLowerCase(), 'recipient', 'placeholder', 'custom'],
    children: recipientFieldLeaves(`recipient.placeholder.${r.id}`, 'custom', r.id),
  }));

  const internalNodes: VariableMenuNode[] = internalRecipients.map((r) => ({
    id: `recipient.internal.${r.id}`,
    label: r.label,
    searchKeywords: [r.label.toLowerCase(), 'recipient', 'employee', 'internal'],
    children: recipientFieldLeaves(`recipient.internal.${r.id}`, 'custom', r.id),
  }));

  const children = sortNodesByLabel(
    [employeeNode, managerNode, ...placeholderNodes, ...internalNodes, customNewNode].filter(
      (n): n is VariableMenuNode => !!n,
    ),
  );

  const mergedRecipientFields: VariableMenuNode = {
    ...recipientFieldsFolder,
    children,
  };

  return sortNodesByLabel(
    VARIABLE_DROPDOWN_ROOT.map((n) =>
      n.id === 'root.recipient-fields' ? mergedRecipientFields : n,
    ),
  );
}
