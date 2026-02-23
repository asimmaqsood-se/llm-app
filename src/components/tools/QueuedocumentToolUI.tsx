"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { documentStoreRef } from "@/lib/document-store";
import { jobStore } from "@/lib/job-store";
import { FileText, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

type QueueDocArgs = {
  action: "create" | "update";
  title: string;
  description?: string;
  documentId?: string;
  prompt: string;
};

type QueueDocResult = {
  jobId: string;
  title: string;
  status: "queued";
};

type JobPhase =
  | { phase: "waiting" }
  | { phase: "generating"; progress: number }
  | { phase: "done" }
  | { phase: "error"; error: string };

function QueueDocumentRenderer({
  args,
  result,
}: {
  args: QueueDocArgs;
  result?: QueueDocResult;
  status: { type: string };
}) {
  const [jobPhase, setJobPhase] = useState<JobPhase>({ phase: "waiting" });
  const watchedRef = useRef(false);
  const doneRef = useRef(false);

  // Keep args in a ref so the subscribe callback always has fresh values
  // without needing to be in the dependency array (avoids stale closure)
  const argsRef = useRef(args);
  argsRef.current = args;

  useEffect(() => {
    if (!result?.jobId || watchedRef.current) return;
    watchedRef.current = true;

    // Start SSE in global store — survives re-renders
    jobStore.watch(result.jobId);

    const unsub = jobStore.subscribe(result.jobId, (s) => {
      if (s.phase === "generating") {
        // Use functional update to guarantee fresh state regardless of closure age
        setJobPhase(prev => {
          // Only update if progress actually changed
          if (prev.phase === "generating" && prev.progress === s.progress) return prev;
          return { phase: "generating", progress: s.progress };
        });
      }

      if (s.phase === "done" && !doneRef.current) {
        doneRef.current = true;
        setJobPhase({ phase: "done" });

        const currentArgs = argsRef.current;
        if (currentArgs.action === "update" && currentArgs.documentId) {
          documentStoreRef.updateDocument?.(currentArgs.documentId, s.content, s.description);
        } else {
          documentStoreRef.createDocument?.(s.title, s.content, s.description);
        }
      }

      if (s.phase === "error") {
        setJobPhase({ phase: "error", error: s.error });
      }
    });

    return unsub;
  }, [result?.jobId]); // only jobId dependency — nothing stale

  // ── LLM still generating args ─────────────────────────────────────────────
  if (!result) {
    return (
      <div className="my-3 flex items-center gap-3 rounded-xl border border-violet-200 bg-linear-to-r from-violet-50 to-purple-50 px-4 py-3 max-w-sm">
        <div className="p-2 rounded-lg bg-violet-100">
          <FileText className="w-4 h-4 text-violet-600 animate-pulse" />
        </div>
        <div>
          <p className="text-xs text-violet-600 font-medium">Queuing document...</p>
          {args?.title && <p className="text-sm font-semibold text-violet-900 truncate max-w-48">{args.title}</p>}
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (jobPhase.phase === "error") {
    return (
      <div className="my-3 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 max-w-sm">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-700">Generation failed</p>
          <p className="text-xs text-red-500">{jobPhase.error}</p>
        </div>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (jobPhase.phase === "done") {
    return (
      <div className="my-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-linear-to-r from-emerald-50 to-teal-50 px-4 py-3 max-w-sm">
        <div className="p-2 rounded-lg bg-emerald-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-emerald-600 font-medium">
            {args.action === "update" ? "Document updated ✓" : "Document ready ✓"}
          </p>
          <p className="text-sm font-semibold text-emerald-900 truncate">{result.title}</p>
        </div>
      </div>
    );
  }

  // ── Generating — progress bar ─────────────────────────────────────────────
  const progress = jobPhase.phase === "generating" ? jobPhase.progress : 0;
  return (
    <div className="my-3 rounded-xl border border-violet-200 bg-linear-to-r from-violet-50 to-purple-50 p-4 max-w-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-violet-100 shrink-0">
          <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-violet-600 font-medium">Generating in background</p>
            <span className="text-xs font-bold text-violet-700">{progress}%</span>
          </div>
          <p className="text-sm font-semibold text-violet-900 truncate">{result.title}</p>
        </div>
      </div>
      <div className="w-full bg-violet-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-linear-to-r from-violet-500 to-purple-500 h-1.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-violet-400 mt-2 flex items-center gap-1">
        <span>💬</span>
        <span>You can keep chatting — document opens automatically when ready</span>
      </p>
    </div>
  );
}

export const QueueDocumentToolUI = makeAssistantToolUI<QueueDocArgs, QueueDocResult>({
  toolName: "queue_document",
  render: (props) => <QueueDocumentRenderer {...props} />,
});