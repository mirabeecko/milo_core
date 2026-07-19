"use client";

import { ErrorBoundaryContent } from "@/components/common/error-boundary-content";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundaryContent error={error} reset={reset} />;
}
