"use client";

import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Mail, Send, XCircle } from "lucide-react";
import { useState } from "react";

const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
});

type SendEmailArgs = z.infer<typeof sendEmailSchema>;

type SendEmailResult = {
  status: "sent" | "cancelled" | "error";
  messageId?: string;
  error?: string;
};

interface SendEmailToolProps {
  args: SendEmailArgs;
  result?: SendEmailResult;
  addResult: (result: SendEmailResult) => void;
  isInProgress: boolean;
}

export function SendEmailTool({ args, result, addResult, isInProgress }: SendEmailToolProps) {
  const [isConfirming, setIsConfirming] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // If we already have a result, show the status
  if (result) {
    return (
      <Card className="w-full max-w-md my-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {result.status === "sent" && (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Email Sent
              </>
            )}
            {result.status === "cancelled" && (
              <>
                <XCircle className="w-5 h-5 text-yellow-500" />
                Email Cancelled
              </>
            )}
            {result.status === "error" && (
              <>
                <AlertCircle className="w-5 h-5 text-red-500" />
                Failed to Send
              </>
            )}
          </CardTitle>
          <CardDescription>
            {result.status === "sent" && `Message ID: ${result.messageId}`}
            {result.status === "cancelled" && "Email was not sent."}
            {result.status === "error" && result.error}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Show confirmation dialog
  if (isConfirming && !isInProgress) {
    return (
      <Card className="w-full max-w-md my-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="w-5 h-5" />
            Confirm Email
          </CardTitle>
          <CardDescription>
            Please review and confirm the email details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="font-semibold">To:</span> {args.to}
          </div>
          <div>
            <span className="font-semibold">Subject:</span> {args.subject}
          </div>
          <div>
            <span className="font-semibold">Body:</span>
            <p className="mt-1 p-2 bg-muted rounded-md whitespace-pre-wrap">
              {args.body}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsConfirming(false);
              addResult({
                status: "cancelled"
              });
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setIsConfirming(false);
              try {
                // Simulate sending email (in production, call your email API)
                await new Promise(resolve => setTimeout(resolve, 1000));
                addResult({
                  status: "sent",
                  messageId: `msg_${Date.now()}`
                });
              } catch (err) {
                addResult({
                  status: "error",
                  error: err instanceof Error ? err.message : "Failed to send email"
                });
              }
            }}
          >
            <Send className="w-4 h-4 mr-2" />
            Send Email
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Show sending/loading state
  return (
    <Card className="w-full max-w-md my-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="w-5 h-5 animate-pulse" />
          {error ? "Error" : "Sending Email..."}
        </CardTitle>
        {error && (
          <CardDescription className="text-red-500">
            {error}
          </CardDescription>
        )}
      </CardHeader>
    </Card>
  );
}