"use client";

import { useDocuments } from "@/lib/document-store";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  X,
  ChevronDown,
  FileText,
  Clock,
  CheckCircle2,
  Edit3,
} from "lucide-react";
import { useState, useCallback } from "react";
import { DocumentVersion } from "@/types";

function renderMarkdown(content: string): string {
  const html = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/```[\w]*\n([\s\S]*?)```/gm, "<pre><code>$1</code></pre>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>")
    .replace(/^---$/gim, "<hr/>")
    .replace(/^\* (.*$)/gim, "<li>$1</li>")
    .replace(/^- (.*$)/gim, "<li>$1</li>")
    .replace(/^\d+\. (.*$)/gim, "<li>$1</li>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .split("\n\n")
    .map((para) => {
      if (
        para.startsWith("<h") ||
        para.startsWith("<pre") ||
        para.startsWith("<blockquote") ||
        para.startsWith("<hr")
      )
        return para;
      if (para.includes("<li>")) return `<ul>${para}</ul>`;
      if (para.trim()) return `<p>${para.replace(/\n/g, "<br/>")}</p>`;
      return "";
    })
    .join("\n");
  return html;
}

export function DocumentPanel() {
  const {
    state,
    closeDocument,
    setActiveVersion,
    getActiveDocument,
    getActiveVersion,
  } = useDocuments();

  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  const activeDoc = getActiveDocument();
  const activeVersion = getActiveVersion();

  const handleVersionSelect = useCallback(
    (version: DocumentVersion) => {
      setActiveVersion(version.id);
      setIsVersionsOpen(false);
      setIsEditing(false);
    },
    [setActiveVersion]
  );

  const handleEditToggle = () => {
    if (!isEditing) setEditContent(activeVersion?.content || "");
    setIsEditing(!isEditing);
  };

  if (!state.isDocumentPanelOpen || !activeDoc || !activeVersion) return null;

  const versionCount = activeDoc.versions.length;
  const isLatestVersion = activeVersion.id === activeDoc.currentVersionId;

  return (
    <div
      className="flex flex-col h-full bg-background border-l border-border"
      style={{ animation: "slide-in 0.3s ease-out" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/50 shrink-0">
            <FileText className="w-4 h-4 text-violet-600" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-sm truncate">{activeDoc.title}</h2>
            <p className="text-xs text-muted-foreground">
              {versionCount} version{versionCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleEditToggle}
            className={cn(
              "p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1.5",
              isEditing
                ? "bg-violet-100 text-violet-600"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
            title={isEditing ? "Preview" : "Edit"}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="text-xs hidden sm:inline">
              {isEditing ? "Preview" : "Edit"}
            </span>
          </button>
          <button
            onClick={closeDocument}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Version selector */}
      <div className="px-4 py-2 border-b border-border">
        <button
          onClick={() => setIsVersionsOpen(!isVersionsOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
        >
          <div className="flex items-center gap-2">
            {isLatestVersion ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span className="font-medium">
              Version {activeVersion.version}
              {isLatestVersion && (
                <span className="ml-1.5 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                  Latest
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDate(activeVersion.createdAt)}
            </span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-muted-foreground transition-transform",
                isVersionsOpen && "rotate-180"
              )}
            />
          </div>
        </button>

        {/* Version dropdown */}
        {isVersionsOpen && (
          <div className="mt-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
            {[...activeDoc.versions].reverse().map((version) => (
              <button
                key={version.id}
                onClick={() => handleVersionSelect(version)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-muted text-left",
                  version.id === activeVersion.id && "bg-violet-50"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {version.id === activeDoc.currentVersionId ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      Version {version.version}
                      {version.id === activeDoc.currentVersionId && (
                        <span className="ml-1.5 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                          Latest
                        </span>
                      )}
                    </p>
                    {version.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {version.description}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  {formatDate(version.createdAt)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Document content */}
      <div className="flex-1 overflow-y-auto">
        {isEditing ? (
          <div className="h-full flex flex-col">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 w-full p-6 bg-transparent font-mono text-sm resize-none outline-none text-foreground leading-relaxed"
              placeholder="Write your document in Markdown..."
              spellCheck
            />
            <div className="px-4 py-3 border-t border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Editing locally — ask the AI to make changes to create a new version
              </p>
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-8 max-w-2xl mx-auto">
            <div
              className="document-prose"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(activeVersion.content),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}