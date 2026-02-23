"use client";

import { DocumentProvider, useDocuments } from "@/lib/document-store";
import { ChatInterface } from "@/components/ChatInterface";
import { DocumentPanel } from "@/components/document/DocumentPanel";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

function AppLayout() {
  const { state } = useDocuments();
  const showDocument = state.isDocumentPanelOpen;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left: Chat panel */}
      <div
        className={cn(
          "flex flex-col h-full transition-all duration-300 ease-in-out",
          showDocument
            ? "w-[420px] min-w-[360px] border-r border-border"
            : "flex-1"
        )}
      >


        {/* Chat */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </div>

      {/* Right: Document panel */}
      {showDocument && (
        <div className="flex-1 h-full overflow-hidden">
          <DocumentPanel />
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <DocumentProvider>
      <AppLayout />
    </DocumentProvider>
  );
}