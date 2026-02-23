"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { Calculator } from "lucide-react";

type ArithmeticArgs = {
  operation: "add" | "subtract" | "multiply" | "divide" | "power" | "sqrt" | "percentage" | "modulo";
  a: number;
  b?: number;
};

type ArithmeticResult = {
  result?: number;
  expression?: string;
  operation?: string;
  error?: string;
};

const opColors: Record<string, string> = {
  add: "text-emerald-600", subtract: "text-red-600", multiply: "text-blue-600",
  divide: "text-purple-600", power: "text-orange-600", sqrt: "text-teal-600",
  percentage: "text-pink-600", modulo: "text-amber-600",
};

export const ArithmeticToolUI = makeAssistantToolUI<ArithmeticArgs, ArithmeticResult>({
  toolName: "arithmetic",
  render: ({ args, result, status }) => {
    if (status.type === "running") {
      return (
        <div className="my-3 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/50 px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
          <Calculator className="w-3.5 h-3.5 animate-spin" />
          <span>Calculating...</span>
        </div>
      );
    }

    if (result) {
      if (result.error) {
        return (
          <div className="my-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            <Calculator className="w-3.5 h-3.5" />
            <span>Error: {result.error}</span>
          </div>
        );
      }
      const colorClass = opColors[args?.operation ?? "add"] ?? "text-foreground";
      return (
        <div className="my-3 inline-flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 shadow-sm">
          <div className={`p-2 rounded-lg bg-[var(--color-muted)] ${colorClass}`}>
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)] mb-0.5 capitalize">{args?.operation}</p>
            <p className="font-mono text-base font-semibold">
              <span className="text-[var(--color-muted-foreground)]">{result.expression?.split("=")[0]}= </span>
              <span className={colorClass}>{result.result}</span>
            </p>
          </div>
        </div>
      );
    }

    return null;
  },
});