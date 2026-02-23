"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { MessageDraft } from "@/components/tool-ui/message-draft";
import { Mail, MessageSquare } from "lucide-react";
import { parseSerializableMessageDraft, type SerializableMessageDraft } from "@/components/tool-ui/message-draft/schema";
import { useState } from "react";

type MessageDraftArgs = SerializableMessageDraft;

type MessageDraftResult = SerializableMessageDraft & {
  timestamp?: string;
  status?: "sent" | "cancelled";
};

export const MessageDraftToolUI = makeAssistantToolUI<MessageDraftArgs, MessageDraftResult>({
  toolName: "message_draft",
  render: ({ args, result, status }) => {
    const [outcome, setOutcome] = useState<"sent" | "cancelled" | undefined>(
      result?.outcome
    );

    if (status.type === "running") {
      const Icon = args?.channel === "email" ? Mail : MessageSquare;
      return (
        <div className="my-3 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/50 px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
          <Icon className={`w-3.5 h-3.5 animate-pulse ${args?.channel === "email" ? "text-blue-600" : "text-purple-600"}`} />
          <span>Preparing {args?.channel === "email" ? "email" : "Slack message"}...</span>
        </div>
      );
    }

    if (status.type === "complete" && args) {
      try {
        // Parse and validate the args
        const validatedProps = parseSerializableMessageDraft(args);
        
        const handleSend = async () => {
          setOutcome("sent");
          // You can update the tool result if needed
        //   addToolResult?.({
        //     ...validatedProps,
        //     outcome: "sent",
        //     timestamp: new Date().toISOString()
        //   });
        };

        const handleUndo = () => {
          setOutcome(undefined);
        };

        const handleCancel = () => {
          setOutcome("cancelled");
          addToolResult?.({
            ...validatedProps,
            outcome: "cancelled",
            timestamp: new Date().toISOString()
          });
        };

        return (
          <div className="my-4">
            <MessageDraft
              {...validatedProps}
              outcome={outcome}
              onSend={handleSend}
              onUndo={handleUndo}
              onCancel={handleCancel}
              undoGracePeriod={5000} // 5 seconds to undo
              className="w-full"
            />
          </div>
        );
      } catch (error) {
        console.error("Failed to parse message draft:", error);
        return (
          <div className="my-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Error rendering message draft: Invalid format
          </div>
        );
      }
    }

    return null;
  },
});