import type { EnvelopeMoreMenuActions } from '../components/EnvelopeMoreMenuPortal';
import type { EnvelopeStatus, MoreMenuVariant } from '../components/EnvelopesListView';
import { deriveDisplayEnvelopeStatus, moreMenuVariantForEnvelope } from '../components/EnvelopesListView';
import type { EnvelopeTableRow } from '../components/EnvelopesListView';

export function isEnvelopeCompleted(status: EnvelopeStatus | string): boolean {
  if (status === 'completed' || status === 'Completed') return true;
  return false;
}

export function profilePacketMoreMenuVariant(
  packet: { envelopeId?: string; status: string },
  packetRows?: EnvelopeTableRow[],
): MoreMenuVariant {
  const envelopeRow = packet.envelopeId
    ? packetRows?.find((r) => r.id === packet.envelopeId)
    : undefined;
  if (envelopeRow) return moreMenuVariantForEnvelope(deriveDisplayEnvelopeStatus(envelopeRow));
  const label = packet.status;
  if (label === 'Completed') return 'completed_voided';
  if (label === 'Yet to sign') return 'yet_to_sign';
  return 'in_progress';
}

export function buildEnvelopeMoreMenuActions(opts: {
  packetId: string;
  isAdmin: boolean;
  packetCompleted?: boolean;
  onMarkAllAsCompleted?: (packetId: string) => void | (() => void);
  onMakeCorrection?: (packetId: string) => void | (() => void);
  onVoidEnvelope?: (packetId: string) => void | (() => void);
  onDownload?: () => void;
  onSendReminder?: () => void;
  onRemove?: () => void;
}): EnvelopeMoreMenuActions {
  const { packetId, isAdmin } = opts;
  const invoke = (fn?: (packetId: string) => void | (() => void)) => {
    if (!fn) return undefined;
    return () => {
      if (fn.length === 0) (fn as () => void)();
      else (fn as (packetId: string) => void)(packetId);
    };
  };
  return {
    onDownload: opts.onDownload,
    onSendReminder: opts.onSendReminder,
    onMakeCorrection: invoke(opts.onMakeCorrection),
    onVoid: invoke(opts.onVoidEnvelope),
    onRemove: opts.onRemove,
    onMarkAllAsCompleted:
      isAdmin && !opts.packetCompleted && opts.onMarkAllAsCompleted
        ? invoke(opts.onMarkAllAsCompleted)
        : undefined,
  };
}
