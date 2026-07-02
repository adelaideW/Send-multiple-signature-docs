/** Recipients who must sign (not CC/view-only). */
type SigningRecipientLike = {
  action: string;
  user?: { id: string } | null;
};

/**
 * In Make correction, block rich-document editing once any required signer
 * has already completed — their signed content must stay immutable.
 */
export function isDocumentEditingBlockedInCorrection(
  correctingFlow: boolean,
  lockedRecipientUserIds: readonly string[] | undefined,
  recipients: readonly SigningRecipientLike[],
): boolean {
  if (!correctingFlow || !lockedRecipientUserIds?.length) return false;
  const locked = new Set(lockedRecipientUserIds);
  return recipients.some(
    (r) => r.action === 'Needs to complete' && !!r.user?.id && locked.has(r.user.id),
  );
}

export const DOCUMENT_EDIT_BLOCKED_IN_CORRECTION_MESSAGE =
  'Documents can\u2019t be edited after a required signer has already signed.';

/** Strip ephemeral UI fields so correction save-and-exit can detect real edits. */
export function serializeEnvelopeStateForComparison(st: {
  selectedTemplates: string[];
  uploadedFiles: Array<{ id: string; name: string; previewTitle?: string; previewParagraphs?: string[] }>;
  recipients: Array<{
    id: string;
    user?: { id: string; name: string; email?: string } | null;
    action: string;
    customMessage?: string;
    showCustomMessage?: boolean;
    customMessageBodyExpanded?: boolean;
  }>;
  selectedFolder: string | null;
  signingOrderEnabled: boolean;
  signingOrderGroups: string[][];
  customTemplates: Array<{ name: string; body: string }>;
  customMessageSubject: string;
  customMessageBody: string;
  advancedTags: string[];
  expirationEnabled?: boolean;
  expirationAfterPreset?: string;
  expirationAfterCustomAmount?: number;
  expirationAfterCustomUnit?: string;
  expirationAlertPreset?: string;
  expirationAlertCustomAmount?: number;
  expirationAlertCustomUnit?: string;
  envelopeName?: string;
  envelopeNameTouched?: boolean;
  lockedRecipientUserIds?: string[];
}): string {
  return JSON.stringify({
    selectedTemplates: st.selectedTemplates,
    uploadedFiles: st.uploadedFiles.map((f) => ({
      id: f.id,
      name: f.name,
      previewTitle: f.previewTitle,
      previewParagraphs: f.previewParagraphs,
    })),
    recipients: st.recipients.map((r) => ({
      id: r.id,
      user: r.user
        ? { id: r.user.id, name: r.user.name, email: r.user.email ?? '' }
        : null,
      action: r.action,
      customMessage: r.customMessage ?? '',
      showCustomMessage: !!r.showCustomMessage,
      customMessageBodyExpanded: r.customMessageBodyExpanded !== false,
    })),
    selectedFolder: st.selectedFolder,
    signingOrderEnabled: st.signingOrderEnabled,
    signingOrderGroups: st.signingOrderGroups,
    customTemplates: st.customTemplates,
    customMessageSubject: st.customMessageSubject,
    customMessageBody: st.customMessageBody,
    advancedTags: st.advancedTags,
    expirationEnabled: st.expirationEnabled ?? false,
    expirationAfterPreset: st.expirationAfterPreset ?? '5_days',
    expirationAfterCustomAmount: st.expirationAfterCustomAmount ?? 5,
    expirationAfterCustomUnit: st.expirationAfterCustomUnit ?? 'day',
    expirationAlertPreset: st.expirationAlertPreset ?? 'do_not_send',
    expirationAlertCustomAmount: st.expirationAlertCustomAmount ?? 1,
    expirationAlertCustomUnit: st.expirationAlertCustomUnit ?? 'day',
    envelopeName: st.envelopeName ?? '',
    envelopeNameTouched: st.envelopeNameTouched ?? false,
    lockedRecipientUserIds: st.lockedRecipientUserIds ?? [],
  });
}

export function isCorrectionEnvelopeUnchanged(
  baselineSerialized: string | null,
  current: Parameters<typeof serializeEnvelopeStateForComparison>[0],
): boolean {
  if (!baselineSerialized) return false;
  return baselineSerialized === serializeEnvelopeStateForComparison(current);
}
