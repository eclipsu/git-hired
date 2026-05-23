import { useCallback, useState } from 'react';

export function useCopyFeedback(durationMs = 1500) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const markCopied = useCallback(
    (id: string) => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), durationMs);
    },
    [durationMs],
  );

  return { copiedId, markCopied };
}
