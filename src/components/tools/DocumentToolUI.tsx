"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { FileText, Plus, RefreshCw } from "lucide-react";
import { documentStoreRef } from "@/lib/document-store";
import { useEffect, useRef } from "react";

type DocumentArgs = {
  action: "create" | "update";
  title: string;
  content: string;
  description?: string;
  documentId?: string;
};

// result echoes the args back from the server execute()
type DocumentResult = DocumentArgs;

function DocumentToolRenderer({
  args,
  result,
}: {
  args: DocumentArgs;
  result?: DocumentResult;
  status: { type: string };
}) {
  const processedRef = useRef(false);

  // When result arrives (execute() completed), update the document store
  useEffect(() => {
    if (result && !processedRef.current) {
      processedRef.current = true;

      const { action, title, content, description, documentId } = result;

      if (action === "create") {
        documentStoreRef.createDocument?.(title, content, description);
      } else if (action === "update" && documentId) {
        documentStoreRef.updateDocument?.(documentId, content, description);
      } else if (action === "update") {
        // No documentId — update most recent doc or create new
        const docs = documentStoreRef.getDocuments?.() ?? [];
        if (docs.length > 0) {
          documentStoreRef.updateDocument?.(docs[docs.length - 1].id, content, description);
        } else {
          documentStoreRef.createDocument?.(title, content, description);
        }
      }
    }
  }, [result]);

  // Still loading (args present but no result yet)
  if (!result) {
    return (
      <div className="my-3 flex items-center gap-3 rounded-xl border border-violet-200 bg-linear-to-r from-violet-50 to-purple-50 px-4 py-3 max-w-sm">
        <div className="p-2 rounded-lg bg-violet-100">
          <FileText className="w-4 h-4 text-violet-600 animate-pulse" />
        </div>
        <div>
          <p className="text-xs text-violet-600 font-medium">
            {args?.action === "update" ? "Updating document..." : "Creating document..."}
          </p>
          {args?.title && (
            <p className="text-sm font-semibold text-violet-900 truncate max-w-48">{args.title}</p>
          )}
        </div>
      </div>
    );
  }

  // Done
  const isUpdate = result.action === "update";
  return (
    <div className="my-3 flex items-center gap-3 rounded-xl border border-violet-200 bg-linear-to-r from-violet-50 to-purple-50 px-4 py-3 max-w-sm">
      <div className="p-2 rounded-lg bg-violet-100">
        {isUpdate
          ? <RefreshCw className="w-4 h-4 text-violet-600" />
          : <Plus className="w-4 h-4 text-violet-600" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-violet-600 font-medium">
          {isUpdate ? "Document updated ✓" : "Document created ✓"}
        </p>
        <p className="text-sm font-semibold text-violet-900 truncate">{result.title}</p>
        {result.description && (
          <p className="text-xs text-violet-500 truncate">{result.description}</p>
        )}
      </div>
    </div>
  );
}

export const DocumentToolUI = makeAssistantToolUI<DocumentArgs, DocumentResult>({
  toolName: "document",
  render: (props) => <DocumentToolRenderer {...props} />,
});