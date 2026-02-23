"use client";

import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ActionBarPrimitive,
  BranchPickerPrimitive,
} from "@assistant-ui/react";
import { useDocuments } from "@/lib/document-store";
import { WeatherToolUI } from "@/components/tools/WeatherToolUI";
import { ArithmeticToolUI } from "@/components/tools/ArithmeticToolUI";
import { DocumentToolUI } from "@/components/tools/DocumentToolUI";
import { ChartToolUI } from "@/components/tools/ChartToolUI";
import { CodeBlockToolUI } from "@/components/tools/CodeBlockToolUI";
import { QuestionFlowToolUI } from "@/components/tools/QuestionFlowToolUI";
import { MessageDraftToolUI } from "@/components/tools/MessageDraftToolUI";
import { UserProfileToolUI } from "@/components/tools/UserProfileToolUI";
import { ImageToolUI } from "@/components/tools/ImageToolUI";
import {
  WebSearchToolUI,
  FetchDataToolUI,
  KnowledgeBaseToolUI,
} from "@/components/tools/ResearchToolUI";
import { QueueDocumentToolUI } from "@/components/tools/QueuedocumentToolUI";
import { DocumentBadge } from "@/components/document/DocumentBadge";
import { DataTableToolUI } from "@/components/tools/DataTableToolUI";
import { ApprovalCardToolUI } from "@/components/tools/ApprovalCardToolUI";

// ── shadcn components ────────────────────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Send,
  Square,
  ChevronLeft,
  ChevronRight,
  Copy,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Bot,
  Briefcase,
  AlertTriangle,
  Settings,
  HelpCircle,
  MoreHorizontal,
  Clock,
  PanelLeft,
} from "lucide-react";
import { type FC, useState } from "react";

// ── Assistant Avatar ──────────────────────────────────────────────────────────
const AssistantAvatar: FC = () => (
  <Avatar className="w-7 h-7 shrink-0 mt-0.5">
    <AvatarFallback className="bg-black text-white text-xs">
      <Bot className="w-3.5 h-3.5" />
    </AvatarFallback>
  </Avatar>
);

// ── Composer ──────────────────────────────────────────────────────────────────
const MyComposer: FC = () => (
  <div className="px-6 pb-6 pt-2">
    <ComposerPrimitive.Root className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden focus-within:border-gray-300 focus-within:shadow-md transition-all">
      <ComposerPrimitive.Input
        className="w-full resize-none px-5 pt-4 pb-14 text-sm text-gray-800 outline-none placeholder:text-gray-400 min-h-[80px] max-h-[200px] leading-relaxed bg-transparent"
        placeholder="Ask anything"
        autoFocus
        rows={2}
      />
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8 rounded-full"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Attach file</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex items-center gap-2">
          <ComposerPrimitive.Cancel asChild>
            <Button
              variant="secondary"
              size="icon"
              className="w-8 h-8 rounded-full"
            >
              <Square className="w-3.5 h-3.5" />
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button
              size="icon"
              className="w-8 h-8 rounded-full bg-black hover:bg-gray-800 disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </ComposerPrimitive.Send>
        </div>
      </div>
    </ComposerPrimitive.Root>
  </div>
);

// ── User Message ──────────────────────────────────────────────────────────────
const MyUserMessage: FC = () => (
  <MessagePrimitive.Root className="flex justify-end mb-4 px-6">
    <div className="max-w-[75%]">
      <div className="bg-gray-100 text-gray-800 px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed">
        <MessagePrimitive.Content />
      </div>
    </div>
  </MessagePrimitive.Root>
);

// ── Assistant Message ─────────────────────────────────────────────────────────
const MyAssistantMessage: FC = () => (
  <MessagePrimitive.Root className="flex gap-3 mb-4 px-6 group">
    <AssistantAvatar />
    <div className="flex-1 min-w-0">
      <div className="text-sm text-gray-800 leading-relaxed">
        <MessagePrimitive.Content />
      </div>
      <ActionBarPrimitive.Root
        hideWhenRunning
        className="flex gap-0.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <ActionBarPrimitive.Copy asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-gray-600"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </ActionBarPrimitive.Copy>
            </TooltipTrigger>
            <TooltipContent>Copy</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ActionBarPrimitive.Reload asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-gray-600"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </ActionBarPrimitive.Reload>
            </TooltipTrigger>
            <TooltipContent>Regenerate</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ActionBarPrimitive.FeedbackPositive asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-emerald-500"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </Button>
              </ActionBarPrimitive.FeedbackPositive>
            </TooltipTrigger>
            <TooltipContent>Good response</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ActionBarPrimitive.FeedbackNegative asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-red-400"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </Button>
              </ActionBarPrimitive.FeedbackNegative>
            </TooltipTrigger>
            <TooltipContent>Bad response</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <BranchPickerPrimitive.Root
          hideWhenSingleBranch
          className="flex items-center gap-0.5 ml-1"
        >
          <BranchPickerPrimitive.Previous asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
          </BranchPickerPrimitive.Previous>
          <span className="text-xs text-gray-400 px-1">
            <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
          </span>
          <BranchPickerPrimitive.Next asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </BranchPickerPrimitive.Next>
        </BranchPickerPrimitive.Root>
      </ActionBarPrimitive.Root>
    </div>
  </MessagePrimitive.Root>
);

// ── Welcome Screen ────────────────────────────────────────────────────────────
const MyWelcome: FC = () => (
  <ThreadPrimitive.Empty>
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
      <h2
        className="text-2xl font-semibold text-gray-800 mb-1.5"
        style={{ fontFamily: "Georgia, serif" }}
      >
        Hello there!
      </h2>
      <p className="text-sm text-gray-400 mb-10">How can I help you today?</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {[
          {
            label: "🌤️ Weather in Tokyo",
            prompt: "What's the weather in Tokyo?",
          },
          { label: "🔢 Calculate 15% of 847", prompt: "Calculate 15% of 847" },
          {
            label: "📄 Write a project proposal",
            prompt:
              "Write a project proposal for an AI-powered analytics dashboard",
          },
          {
            label: "📝 Create a README",
            prompt: "Create a README.md for a Next.js + TypeScript project",
          },
          {
            label: "🔬 Research: AI Agents",
            prompt:
              "Research the topic of AI agents — gather info from all sources simultaneously",
          },
          {
            label: "🧑 Personalized fitness plan",
            prompt: "Create a personalized fitness plan for me",
          },
        ].map((s) => (
          <ThreadPrimitive.Suggestion
            key={s.prompt}
            prompt={s.prompt}
            autoSend
            asChild
          >
            <Button
              variant="outline"
              className="h-auto text-left px-4 py-3 rounded-xl justify-start font-normal text-gray-500 hover:text-gray-700"
            >
              {s.label}
            </Button>
          </ThreadPrimitive.Suggestion>
        ))}
      </div>
    </div>
  </ThreadPrimitive.Empty>
);

// ── Thread ────────────────────────────────────────────────────────────────────
const MyThread: FC = () => (
  <ThreadPrimitive.Root className="flex flex-col h-full bg-white">
    <ScrollArea className="flex-1">
      <div className="py-6">
        <MyWelcome />
        <ThreadPrimitive.Messages
          components={{
            UserMessage: MyUserMessage,
            AssistantMessage: MyAssistantMessage,
          }}
        />
        <ThreadPrimitive.If running>
          <div className="flex gap-3 px-6 mb-4">
            <AssistantAvatar />
            <div className="flex items-center gap-1 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </ThreadPrimitive.If>
      </div>
    </ScrollArea>
    <MyComposer />
  </ThreadPrimitive.Root>
);

// ── Sidebar Nav Item ──────────────────────────────────────────────────────────
function NavItem({
  icon: Icon,
  label,
  active = false,
}: {
  icon: FC<{ className?: string }>;
  label: string;
  active?: boolean;
}) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      className={`w-full justify-start gap-2.5 h-9 px-3 text-sm font-normal ${
        active ? "bg-gray-200 text-gray-800 font-medium" : "text-gray-600"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Button>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ collapsed }: { collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <div className="w-56 flex flex-col h-full bg-gray-50 border-r border-gray-200 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-2">
        <div>
          <img
            src="/tz-logo-blue.svg"
            alt="TargetZero"
            height={40}
            width={36}
          />
        </div>
        <span className="font-semibold text-sm text-gray-800">TargetZero</span>
      </div>

      <Separator />

      {/* Nav */}
      <ScrollArea className="flex-1 px-2 py-2">
        <NavItem icon={Bot} label="Agent" active />
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider px-3 pt-4 pb-1.5">
          Records
        </p>
        <NavItem icon={Briefcase} label="Cases" />
        <NavItem icon={AlertTriangle} label="Incidents" />
      </ScrollArea>

      <Separator />

      {/* Bottom */}
      <div className="px-2 py-2 space-y-0.5">
        <NavItem icon={Settings} label="Settings" />
        <NavItem icon={HelpCircle} label="Help" />

        <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
          <Avatar className="w-7 h-7 shrink-0">
            <AvatarFallback className="text-[11px] font-semibold bg-gray-200 text-gray-600">
              JD
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">
              John Doe
            </p>
            <p className="text-[10px] text-gray-400 truncate">
              john.doe@agency.gov
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 shrink-0"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Document Badges Bar ───────────────────────────────────────────────────────
function DocumentBadgesBar() {
  const { state } = useDocuments();
  if (state.documents.length === 0) return null;
  return (
    <div className="px-4 py-2 border-b border-gray-200 bg-white flex items-center gap-2 flex-wrap">
      <Badge
        variant="secondary"
        className="text-[10px] text-gray-400 bg-transparent border-0 px-0 font-normal"
      >
        Docs:
      </Badge>
      <DocumentBadge />
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white shrink-0">
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400"
                onClick={onToggleSidebar}
              >
                <PanelLeft className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle sidebar</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="text-sm font-medium text-gray-700">Agent</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs text-gray-500 gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          New Thread
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs text-gray-500 gap-1.5"
        >
          <Clock className="w-3.5 h-3.5" />
          Recents
        </Button>
      </div>
    </div>
  );
}

// ── Root Export ───────────────────────────────────────────────────────────────
export function ChatInterface() {
  const runtime = useChatRuntime({ api: "/api/chat" });
  const { state } = useDocuments();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-full bg-white overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed || state.isDocumentPanelOpen} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header onToggleSidebar={() => setSidebarCollapsed((v) => !v)} />
          <DocumentBadgesBar />
          <div className="flex-1 overflow-hidden">
            <MyThread />
          </div>
        </div>
      </div>

      {/* Tool UIs — must be inside AssistantRuntimeProvider */}
      <WeatherToolUI />
      <ArithmeticToolUI />
      <QueueDocumentToolUI />
      <UserProfileToolUI />
      <WebSearchToolUI />
      <FetchDataToolUI />
      <KnowledgeBaseToolUI />
      <ChartToolUI />
      <CodeBlockToolUI />
      <DataTableToolUI />
      <ImageToolUI /> 
      <MessageDraftToolUI />
       <ApprovalCardToolUI />
       <QuestionFlowToolUI />
    </AssistantRuntimeProvider>
  );
}
