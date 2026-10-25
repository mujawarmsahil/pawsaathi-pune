import { useId, useRef } from 'react';

import { ConfirmDialog } from './ConfirmDialog';

type ReasonDialogProps = {
  open: boolean;
  title: string;
  description: string;
  fieldLabel: string;
  placeholder?: string;
  confirmLabel: string;
  cancelLabel?: string;
  reason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  error?: string;
};

export function ReasonDialog({
  open,
  title,
  description,
  fieldLabel,
  placeholder,
  confirmLabel,
  cancelLabel,
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
  busy = false,
  error,
}: ReasonDialogProps) {
  const reasonId = useId();
  const reasonInput = useRef<HTMLTextAreaElement>(null);

  return (
    <ConfirmDialog
      open={open}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      confirmDisabled={!reason.trim()}
      initialFocusRef={reasonInput}
      busy={busy}
      busyLabel="Saving…"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <label htmlFor={reasonId}>{fieldLabel}</label>
      <textarea
        ref={reasonInput}
        id={reasonId}
        rows={3}
        maxLength={500}
        value={reason}
        disabled={busy}
        placeholder={placeholder}
        onChange={(event) => onReasonChange(event.target.value)}
      />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </ConfirmDialog>
  );
}
