"use client";

import { useDocuments } from "@/lib/document-store";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export function DocumentBadge() {
  const { state, openDocument } = useDocuments();
  const { documents, activeDocumentId, isDocumentPanelOpen } = state;

  if (documents.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {documents.map((doc) => {
        const isActive = doc.id === activeDocumentId && isDocumentPanelOpen;
        const versionCount = doc.versions.length;

        return (
          <button
            key={doc.id}
            onClick={() => openDocument(doc.id)}
            className={cn(
              "group flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all",
              isActive
                ? "bg-violet-100 border-violet-300 text-violet-700"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-violet-300"
            )}
          >
            <FileText className="w-3 h-3" />
            <span className="max-w-24 truncate">{doc.title}</span>
            <span
              className={cn(
                "flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold",
                isActive
                  ? "bg-violet-200 text-violet-800"
                  : "bg-muted text-muted-foreground group-hover:bg-violet-100 group-hover:text-violet-700"
              )}
            >
              {versionCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}