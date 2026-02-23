import type { ReactNode } from "react";
import type { ToolCallMessagePartComponent, ReadonlyJSONObject } from "@assistant-ui/react";

export interface ArgsToolRendererOptions<TProps> {
  safeParse: (input: unknown) => TProps | null;
  idPrefix: string;
  render: (props: TProps & { id: string }) => ReactNode;
}

export function createArgsToolRenderer<TProps>({
  safeParse,
  idPrefix,
  render,
}: ArgsToolRendererOptions<TProps>): ToolCallMessagePartComponent {
  return function ToolRenderer({ 
    result, 
    status,
    toolCallId,
  }: { 
    args?: ReadonlyJSONObject; 
    result?: unknown; 
    status: { type: "running" } | { type: "complete" } | { 
      type: "incomplete"; 
      reason?: "length" | "error" | "cancelled" | "content-filter" | "other";
      error?: unknown;
    };
    toolName?: string;
    toolCallId?: string;
  }) {
    // Loading state
    if (status.type === "running") {
      return (
        <div className="my-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
          <span>Loading...</span>
        </div>
      );
    }

    // Incomplete state (error, cancelled, etc.)
    if (status.type === "incomplete") {
      const errorMessage = status.reason === "error" 
        ? "An error occurred" 
        : status.reason === "cancelled"
        ? "Tool execution was cancelled"
        : "Tool execution incomplete";
      
      return (
        <div className="my-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      );
    }

    // Complete state with result
    if (status.type === "complete" && result) {
      const parsed = safeParse(result);
      if (!parsed) {
        return (
          <div className="my-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Invalid data format
          </div>
        );
      }

      // Use toolCallId if available for consistency
      const id = toolCallId || `${idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      return <>{render({ ...parsed, id })}</>;
    }

    return null;
  };
}