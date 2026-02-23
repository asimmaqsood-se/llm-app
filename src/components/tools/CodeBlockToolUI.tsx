"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { CodeBlock } from "@/components/tool-ui/code-block"; // Adjust path as needed
import { Code2 } from "lucide-react";

type CodeBlockArgs = {
  code: string;
  language?: string;
  filename?: string;
  lineNumbers?: "visible" | "hidden";
  highlightLines?: number[];
  maxCollapsedLines?: number;
  title?: string;
};

type CodeBlockResult = CodeBlockArgs & {
  timestamp?: string;
};

export const CodeBlockToolUI = makeAssistantToolUI<CodeBlockArgs, CodeBlockResult>({
  toolName: "code_block",
  render: ({ args, result, status }) => {
    if (status.type === "running") {
      return (
        <div className="my-3 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/50 px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
          <Code2 className="w-3.5 h-3.5 animate-pulse text-blue-600" />
          <span>Generating code block...</span>
        </div>
      );
    }

    if (status.type === "complete" && result) {
      return (
        <div className="my-4">
          {result.title && (
            <div className="mb-2 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-[var(--color-foreground)]">
                {result.title}
              </span>
            </div>
          )}
          
          <CodeBlock
            id={`codeblock-${Date.now()}`}
            code={result.code}
            language={result.language || "text"}
            filename={result.filename}
            lineNumbers={result.lineNumbers || "visible"}
            highlightLines={result.highlightLines}
            maxCollapsedLines={result.maxCollapsedLines}
          />
        </div>
      );
    }

    return null;
  },
});