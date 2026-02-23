"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { ApprovalCard } from "@/components/tool-ui/approval-card";
import { parseSerializableApprovalCard, type SerializableApprovalCard } from "@/components/tool-ui/approval-card/schema";
import { useState } from "react";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

type ApprovalCardArgs = SerializableApprovalCard;

type ApprovalCardResult = SerializableApprovalCard & {
  timestamp?: string;
  decision?: "approved" | "denied";
};

export const ApprovalCardToolUI = makeAssistantToolUI<ApprovalCardArgs, ApprovalCardResult>({
  toolName: "approval_card",
  render: ({ args, result, status, addResult }) => {
    const [decision, setDecision] = useState<"approved" | "denied" | undefined>(
      result?.choice
    );

    if (status.type === "running") {
      const icon = args?.variant === "destructive" ? AlertCircle : CheckCircle;
      return (
        <div className="my-3 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/50 px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
          <icon className={`w-3.5 h-3.5 animate-pulse ${args?.variant === "destructive" ? "text-red-600" : "text-blue-600"}`} />
          <span>Preparing approval request...</span>
        </div>
      );
    }

    if (status.type === "complete" && args) {
      try {
        // Parse and validate the args
        const validatedProps = parseSerializableApprovalCard(args);
        
        const handleConfirm = async () => {
          setDecision("approved");
          addResult?.({
            ...validatedProps,
            choice: "approved",
            timestamp: new Date().toISOString()
          });
        };

        const handleCancel = async () => {
          setDecision("denied");
          addResult?.({
            ...validatedProps,
            choice: "denied",
            timestamp: new Date().toISOString()
          });
        };

        return (
          <div className="my-4">
            <ApprovalCard
              {...validatedProps}
              choice={decision}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              className="w-full"
            />
          </div>
        );
      } catch (error) {
        console.error("Failed to parse approval card:", error);
        return (
          <div className="my-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Error rendering approval request: Invalid format
          </div>
        );
      }
    }

    return null;
  },
});