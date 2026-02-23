"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { Search, Globe, BookOpen, Loader2, CheckCircle2 } from "lucide-react";

// ── Tool 1: web_search ───────────────────────────────────────────────────────
type SearchArgs = { query: string; source?: string };
type SearchResult = { query: string; source: string; summary: string; duration_ms: number };

export const WebSearchToolUI = makeAssistantToolUI<SearchArgs, SearchResult>({
  toolName: "web_search",
  render: ({ args, result }) => {
    if (!result) {
      return (
        <div className="my-2 flex items-center gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 max-w-xs">
          <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-blue-700">Searching the web...</p>
            <p className="text-xs text-blue-500 truncate">{args?.query}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="my-2 flex items-center gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 max-w-xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-blue-700">Web search ✓ <span className="font-normal text-blue-400">{result.duration_ms}ms</span></p>
          <p className="text-xs text-blue-500 truncate">{result.query}</p>
        </div>
      </div>
    );
  },
});

// ── Tool 2: fetch_data ───────────────────────────────────────────────────────
type FetchArgs = { url: string; data_type?: string };
type FetchResult = { url: string; data_type: string; records: number; duration_ms: number };

export const FetchDataToolUI = makeAssistantToolUI<FetchArgs, FetchResult>({
  toolName: "fetch_data",
  render: ({ args, result }) => {
    if (!result) {
      return (
        <div className="my-2 flex items-center gap-2.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 max-w-xs">
          <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-violet-700">Fetching data...</p>
            <p className="text-xs text-violet-500 truncate">{args?.url}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="my-2 flex items-center gap-2.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 max-w-xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-violet-700">Data fetched ✓ <span className="font-normal text-violet-400">{result.duration_ms}ms</span></p>
          <p className="text-xs text-violet-500 truncate">{result.records} records from {result.data_type}</p>
        </div>
      </div>
    );
  },
});

// ── Tool 3: read_knowledge_base ──────────────────────────────────────────────
type KBArgs = { topic: string; depth?: string };
type KBResult = { topic: string; articles_found: number; duration_ms: number };

export const KnowledgeBaseToolUI = makeAssistantToolUI<KBArgs, KBResult>({
  toolName: "read_knowledge_base",
  render: ({ args, result }) => {
    if (!result) {
      return (
        <div className="my-2 flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 max-w-xs">
          <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-emerald-700">Reading knowledge base...</p>
            <p className="text-xs text-emerald-500 truncate">{args?.topic}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="my-2 flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 max-w-xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-emerald-700">Knowledge base ✓ <span className="font-normal text-emerald-400">{result.duration_ms}ms</span></p>
          <p className="text-xs text-emerald-500 truncate">{result.articles_found} articles on {result.topic}</p>
        </div>
      </div>
    );
  },
});