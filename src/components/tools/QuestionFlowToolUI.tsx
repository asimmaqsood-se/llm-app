"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { QuestionFlow } from "@/components/tool-ui/question-flow";
import { parseSerializableQuestionFlow, type SerializableQuestionFlow, type QuestionFlowOption } from "@/components/tool-ui/question-flow/schema";
import { useState, useCallback } from "react";
import { HelpCircle } from "lucide-react";

type QuestionFlowArgs = SerializableQuestionFlow;

type QuestionFlowResult = SerializableQuestionFlow & {
  timestamp?: string;
  answers?: Record<string, string[]>;
  selections?: string[];
};

export const QuestionFlowToolUI = makeAssistantToolUI<QuestionFlowArgs, QuestionFlowResult>({
  toolName: "question_flow",
  render: ({ args, result, status, addResult }) => {
    const [answers, setAnswers] = useState<Record<string, string[]>>(
      result && 'answers' in result ? result.answers || {} : {}
    );
    const [selections, setSelections] = useState<string[]>(
      result && 'selections' in result ? result.selections || [] : []
    );

    if (status.type === "running") {
      return (
        <div className="my-3 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/50 px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
          <HelpCircle className="w-3.5 h-3.5 animate-pulse text-purple-600" />
          <span>Preparing questions...</span>
        </div>
      );
    }

    if (status.type === "complete" && args) {
      try {
        // Parse and validate the args
        const validatedProps = parseSerializableQuestionFlow(args);
        
        // Handle progressive mode (single step)
        if ('step' in validatedProps) {
          const handleSelect = async (optionIds: string[]) => {
            setSelections(optionIds);
            addResult?.({
              ...validatedProps,
              selections: optionIds,
              timestamp: new Date().toISOString()
            });
          };

          const handleBack = () => {
            console.log("Back clicked");
          };

          // Convert options to include icons if needed
          const optionsWithIcons: QuestionFlowOption[] = validatedProps.options.map(opt => ({
            ...opt,
            // You can map icon strings to actual React nodes here if needed
          }));

          return (
            <div className="my-4">
              <QuestionFlow
                id={validatedProps.id}
                step={validatedProps.step}
                title={validatedProps.title}
                description={validatedProps.description}
                options={optionsWithIcons}
                selectionMode={validatedProps.selectionMode || "single"}
                defaultValue={selections}
                onSelect={handleSelect}
                onBack={handleBack}
                className="w-full"
              />
            </div>
          );
        }
        
        // Handle upfront mode (multiple steps)
        if ('steps' in validatedProps) {
          const handleStepChange = (stepId: string) => {
            console.log("Step changed:", stepId);
          };

          const handleComplete = async (finalAnswers: Record<string, string[]>) => {
            setAnswers(finalAnswers);
            addResult?.({
              ...validatedProps,
              answers: finalAnswers,
              timestamp: new Date().toISOString()
            });
          };

          return (
            <div className="my-4">
              <QuestionFlow
                id={validatedProps.id}
                steps={validatedProps.steps}
                onStepChange={handleStepChange}
                onComplete={handleComplete}
                className="w-full"
              />
            </div>
          );
        }

        // Handle receipt mode
        if ('choice' in validatedProps) {
          return (
            <div className="my-4">
              <QuestionFlow
                id={validatedProps.id}
                choice={validatedProps.choice}
                className="w-full"
              />
            </div>
          );
        }

        return null;
      } catch (error) {
        console.error("Failed to parse question flow:", error);
        return (
          <div className="my-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Error rendering questions: {error instanceof Error ? error.message : "Invalid format"}
          </div>
        );
      }
    }

    return null;
  },
});