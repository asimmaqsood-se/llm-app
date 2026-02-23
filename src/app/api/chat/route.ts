import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import {
  streamText,
  tool,
  convertToModelMessages,
  UIMessage,
  stepCountIs,
} from "ai";
import { z } from "zod";
import { randomUUID } from "crypto";
import documentJobs from "@/lib/documentJobs";
import { generateDocumentInBackground } from "@/app/api/generate-document/route";
import { SerializableMessageDraftSchema } from "@/components/tool-ui/message-draft/schema";
import { SerializableImageSchema } from "@/components/tool-ui/image/schema";

import { SerializableQuestionFlowSchema } from "@/components/tool-ui/question-flow/schema";

import { SerializableDataTableSchema } from "@/components/tool-ui/data-table/schema";

import { SerializableApprovalCardSchema } from "@/components/tool-ui/approval-card/schema";

const MODEL = "anthropic.claude-3-5-sonnet-20240620-v1:0";

const bedrock = createAmazonBedrock({
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a helpful AI assistant similar to Claude.

Don't write explanation for tools.Just write here is result which you want. 

QUESTION FLOWS:
When you need to collect multiple pieces of information from the user:
  - Use the question_flow tool to present structured questions
  - Choose the right mode:
    * Progressive: For a single step/question
    * Upfront: For multiple steps/screens of questions
    * Receipt: To show collected answers summary
  
Use cases:
  - Surveys and feedback collection
  - Multi-step forms (user profile, preferences)
  - Decision trees and guided choices
  - Configuration wizards
  - Screening questionnaires

IMAGES:
When users ask to see images, screenshots, diagrams, or visual content:
  - Use the image tool to display images with proper attribution
  - Always provide meaningful alt text for accessibility
  - Include title and description when helpful
  - Add source attribution when the image comes from a specific source
  - Use appropriate aspect ratios (square for icons, wide for landscapes)
  - Link to original source when applicable

Examples of when to use images:
  - Product screenshots or mockups
  - Data visualizations and charts (consider also chart tool)
  - Diagrams and flowcharts
  - Profile pictures or avatars
  - Reference images for design discussions

APPROVAL CARDS:
When you need user confirmation before taking action:
  - Use the approval_card tool to present a clear decision point
  - Include relevant metadata to help the user decide
  - Use 'destructive' variant for irreversible or dangerous actions
  - The card will show results after user makes a choice

Examples of when to use approval cards:
  - Before sending an important email
  - Before deleting data
  - Before making a significant change
  - When requiring confirmation for financial transactions
  - Before proceeding with irreversible operations


MESSAGE DRAFTS:
When users ask to compose messages (emails, Slack messages, etc.):
  - Use the message_draft tool to create a draft for review
  - For emails: Include subject, recipients (to, cc, bcc), and body
  - For Slack: Specify target channel or DM, and message body
  - The user can review, edit (via conversation), send, or cancel
  - After sending, there's a 5-second grace period to undo

Example formats:
  Email: "Draft an email to john@example.com about the project update"
  Slack: "Create a Slack message for #general announcing the new feature"

DATA TABLES:
When users ask to see structured data, comparisons, or tabular information:
  - Use the data_table tool to display information in a sortable table
  - Define clear columns with appropriate labels
  - Format values appropriately (currency, percentages, dates, etc.)
  - Set a rowIdKey to a unique identifier if available
  - Consider column priorities for mobile views
  - Add defaultSort when relevant

Example table formats:
  - Financial data: Use currency formatting
  - Performance metrics: Use number formatting with appropriate decimals
  - Status tracking: Use badge or status formatting
  - Lists with links: Use link formatting

CODE BLOCKS:
When users ask for code examples, snippets, or explanations:
  - Use the code_block tool to display formatted code
  - Specify the correct language for syntax highlighting
  - Add a filename when relevant (e.g., "app/page.tsx")
  - For long code snippets, consider setting maxCollapsedLines
  - Use highlightLines to draw attention to specific lines

CHART CREATION:
When users ask to visualize data, create charts, or see trends:
  1. Generate appropriate sample data or use provided data
  2. Call create_chart with the data and configuration
  3. Choose the right chart type:
     - bar: Compare categories, show distributions
     - line: Show trends over time
     - pie: Show proportions/percentages
     - area: Show cumulative trends


DOCUMENT CREATION — ASYNC TWO-CALL FLOW:
When a user asks to create/write/draft any document:
  STEP 1: Write a SHORT reply (2-3 sentences) telling the user what you are creating.
  STEP 2: Call "queue_document" with the title, a description, and a detailed prompt describing what to write.
          DO NOT write the full content yourself — the prompt field tells the background job what to generate.
          The queue_document tool returns a jobId instantly. The actual document generates in the background.
          The user will be notified automatically when it is ready.

For EDITING: call queue_document with action "update" and include the documentId.

PROFILE COLLECTION:
When you receive a collect_user_profile result, write a brief acknowledgement, then call queue_document.

PARALLEL RESEARCH:
When asked to research — call web_search, fetch_data, AND read_knowledge_base simultaneously.

TOOLS:
1. weather — current weather
2. arithmetic — math
3. queue_document — async document creation (text reply first, then this)
4. collect_user_profile — collect user info via form
5. web_search / fetch_data / read_knowledge_base — parallel research`;

function lastToolResultIsProfile(messages: UIMessage[]): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === "assistant") {
      const parts = (msg as any).parts ?? [];
      for (const part of parts) {
        if (
          part.type === "tool-invocation" &&
          part.toolInvocation?.toolName === "collect_user_profile" &&
          part.toolInvocation?.state === "result"
        )
          return true;
      }
    }
  }
  return false;
}

// Extract last few user/assistant messages as context for the background LLM call
function extractConversationContext(messages: UIMessage[]): string {
  const recent = messages.slice(-6);
  return recent
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => {
      const textParts =
        (m as any).parts?.filter((p: any) => p.type === "text") ?? [];
      const text = textParts
        .map((p: any) => p.text)
        .join(" ")
        .slice(0, 300);
      return text ? `${m.role}: ${text}` : null;
    })
    .filter(Boolean)
    .join("\n");
}

export async function POST(req: Request) {
  const { messages, system }: { messages: UIMessage[]; system?: string } =
    await req.json();
  const modelMessages = await convertToModelMessages(messages);
  const justGotProfile = lastToolResultIsProfile(messages);
  const conversationContext = extractConversationContext(messages);

  const result = streamText({
    model: bedrock(MODEL),
    system: system ?? SYSTEM_PROMPT,
    messages: modelMessages,
    stopWhen: stepCountIs(5),
    ...(justGotProfile
      ? { toolChoice: { type: "tool", toolName: "queue_document" } }
      : {}),
    tools: {
      weather: tool({
        description: "Get the current weather for a specific location",
        inputSchema: z.object({
          location: z.string(),
          unit: z.enum(["celsius", "fahrenheit"]).optional(),
        }),
        execute: async ({ location, unit = "celsius" }) => {
          const conditions = [
            "Sunny",
            "Partly Cloudy",
            "Overcast",
            "Light Rain",
            "Heavy Rain",
            "Thunderstorm",
            "Snow",
            "Foggy",
            "Windy",
            "Clear",
          ];
          const condition =
            conditions[Math.floor(Math.random() * conditions.length)];
          const tempC = Math.round(Math.random() * 35 - 5);
          const temp =
            unit === "fahrenheit" ? Math.round((tempC * 9) / 5 + 32) : tempC;
          return {
            location,
            temperature: temp,
            unit: unit === "fahrenheit" ? "°F" : "°C",
            condition,
            humidity: Math.round(Math.random() * 60 + 30),
            windSpeed: Math.round(Math.random() * 30 + 5),
            feelsLike:
              unit === "fahrenheit"
                ? Math.round(((tempC - 2) * 9) / 5 + 32)
                : tempC - 2,
          };
        },
      }),

      arithmetic: tool({
        description: "Perform arithmetic operations",
        inputSchema: z.object({
          operation: z.enum([
            "add",
            "subtract",
            "multiply",
            "divide",
            "power",
            "sqrt",
            "percentage",
            "modulo",
          ]),
          a: z.number(),
          b: z.number().optional(),
        }),
        execute: async ({ operation, a, b }) => {
          let result: number;
          let expression: string;
          switch (operation) {
            case "add":
              result = a + (b ?? 0);
              expression = `${a} + ${b} = ${result}`;
              break;
            case "subtract":
              result = a - (b ?? 0);
              expression = `${a} - ${b} = ${result}`;
              break;
            case "multiply":
              result = a * (b ?? 1);
              expression = `${a} × ${b} = ${result}`;
              break;
            case "divide":
              if (b === 0) return { error: "Division by zero" };
              result = a / (b ?? 1);
              expression = `${a} ÷ ${b} = ${result}`;
              break;
            case "power":
              result = Math.pow(a, b ?? 2);
              expression = `${a}^${b} = ${result}`;
              break;
            case "sqrt":
              result = Math.sqrt(a);
              expression = `√${a} = ${result}`;
              break;
            case "percentage":
              result = (a * (b ?? 100)) / 100;
              expression = `${b}% of ${a} = ${result}`;
              break;
            case "modulo":
              result = a % (b ?? 1);
              expression = `${a} % ${b} = ${result}`;
              break;
            default:
              return { error: "Unknown operation" };
          }
          return { result, expression, operation, inputs: { a, b } };
        },
      }),

      collect_user_profile: tool({
        description: "Collect personal info from the user via a form.",
        inputSchema: z.object({
          reason: z.string().optional(),
          fields: z.array(z.string()).optional(),
        }),
      }),

      web_search: tool({
        description:
          "Search the web. Call in parallel with fetch_data and read_knowledge_base.",
        inputSchema: z.object({
          query: z.string(),
          source: z.string().optional(),
        }),
        execute: async ({ query, source = "general" }) => {
          const start = Date.now();
          await new Promise((r) => setTimeout(r, 1500));
          return {
            query,
            source,
            summary: `Found 8 relevant results for "${query}".`,
            duration_ms: Date.now() - start,
          };
        },
      }),

      fetch_data: tool({
        description:
          "Fetch structured data. Call in parallel with web_search and read_knowledge_base.",
        inputSchema: z.object({
          url: z.string(),
          data_type: z.string().optional(),
        }),
        execute: async ({ url, data_type = "JSON" }) => {
          const start = Date.now();
          await new Promise((r) => setTimeout(r, 2000));
          return {
            url,
            data_type,
            records: Math.floor(Math.random() * 500) + 50,
            duration_ms: Date.now() - start,
          };
        },
      }),

      read_knowledge_base: tool({
        description:
          "Read knowledge base. Call in parallel with web_search and fetch_data.",
        inputSchema: z.object({
          topic: z.string(),
          depth: z.enum(["shallow", "deep"]).optional(),
        }),
        execute: async ({ topic, depth = "shallow" }) => {
          const start = Date.now();
          await new Promise((r) => setTimeout(r, 1000));
          return {
            topic,
            depth,
            articles_found: Math.floor(Math.random() * 20) + 3,
            duration_ms: Date.now() - start,
          };
        },
      }),

      // ── THE KEY TOOL — returns jobId instantly, triggers background generation ──
      queue_document: tool({
        description:
          "Queue a document for async background generation. Returns a jobId instantly so the user is never blocked. The document generates in the background and the user is notified when ready. Use this for ALL document creation/editing tasks.",
        inputSchema: z.object({
          action: z.enum(["create", "update"]).describe("create or update"),
          title: z.string().describe("Document title"),
          description: z
            .string()
            .optional()
            .describe("Brief description of the document"),
          documentId: z
            .string()
            .optional()
            .describe("ID of doc to update (update action only)"),
          prompt: z
            .string()
            .describe(
              "Detailed instructions for what the document should contain — the background job uses this to generate the full content",
            ),
        }),
        execute: async ({ action, title, description, documentId, prompt }) => {
          // Generate a jobId
          const jobId = randomUUID();

          // Register job and call directly — no HTTP, no deadlock
          documentJobs.set(jobId, {
            status: "pending",
            progress: 0,
            title,
            description,
          });
          // Fire and forget — do NOT await
          generateDocumentInBackground(
            jobId,
            title,
            description,
            prompt,
            conversationContext,
          ).catch((err) =>
            console.error("[queue_document] Background job error:", err),
          );

          // Return jobId to LLM and client IMMEDIATELY — stream closes right after
          return {
            jobId,
            title,
            status: "queued",
            message: `Document "${title}" is being generated in the background. The user will be notified when it's ready.`,
          };
        },
      }),
      create_chart: tool({
        description:
          "Create a data visualization chart. Use this when users ask to visualize data, create charts, or see trends.",
        inputSchema: z.object({
          title: z.string().describe("Chart title"),
          description: z
            .string()
            .optional()
            .describe("Brief description or subtitle"),
          type: z
            .enum(["bar", "line", "pie", "area"])
            .describe("Type of chart"),
          data: z.array(z.record(z.any())).describe("Array of data objects"),
          xKey: z.string().describe("Key for x-axis values"),
          series: z
            .array(
              z.object({
                key: z.string(),
                label: z.string(),
              }),
            )
            .describe("Series to plot"),
          showLegend: z.boolean().optional().default(true),
          showGrid: z.boolean().optional().default(true),
          stacked: z
            .boolean()
            .optional()
            .describe("For bar charts, stack the series"),
        }),
        execute: async (input) => {
          // Validate data
          if (!input.data || input.data.length === 0) {
            throw new Error("No data provided for chart");
          }

          // Return the chart configuration - the UI will render it
          return {
            ...input,
            timestamp: new Date().toISOString(),
          };
        },
      }),
      code_block: tool({
        description:
          "Display code with syntax highlighting. Use this when users ask to see code examples, share code snippets, or need code explanations.",
        inputSchema: z.object({
          code: z.string().describe("The code to display"),
          language: z
            .string()
            .optional()
            .default("text")
            .describe("Programming language for syntax highlighting"),
          filename: z
            .string()
            .optional()
            .describe("Optional filename to display"),
          lineNumbers: z
            .enum(["visible", "hidden"])
            .optional()
            .default("visible"),
          highlightLines: z
            .array(z.number().int().positive())
            .optional()
            .describe("Line numbers to highlight"),
          maxCollapsedLines: z
            .number()
            .min(1)
            .optional()
            .describe("Max lines before collapse"),
          title: z
            .string()
            .optional()
            .describe("Optional title for the code block"),
        }),
        execute: async (input) => {
          return {
            ...input,
            timestamp: new Date().toISOString(),
          };
        },
      }),
      data_table: tool({
        description:
          "Display structured data in a sortable table format. Use this when users ask to see data in tabular form, compare values, or view structured information.",
        inputSchema: SerializableDataTableSchema, // Use the existing schema
        execute: async (input) => {
          return {
            ...input,
            timestamp: new Date().toISOString(),
          };
        },
      }),
      approval_card: tool({
        description:
          "Present an approval request to the user with confirm/deny options. Use this when you need user confirmation for actions, approvals for decisions, or any situation requiring explicit user consent before proceeding.",
        inputSchema: z.object({
          id: z.string(),
          role: z.string().optional(),
          title: z
            .string()
            .min(1)
            .describe("The main question or action requiring approval"),
          description: z
            .string()
            .optional()
            .describe(
              "Additional context or details about what's being approved",
            ),
          icon: z
            .string()
            .optional()
            .describe(
              "Lucide icon name (e.g., 'check-circle', 'alert-triangle', 'trash-2')",
            ),
          metadata: z
            .array(
              z.object({
                key: z.string(),
                value: z.string(),
              }),
            )
            .optional()
            .describe("Key-value pairs showing relevant information"),
          variant: z
            .enum(["default", "destructive"])
            .optional()
            .default("default")
            .describe("Visual style - use 'destructive' for dangerous actions"),
          confirmLabel: z
            .string()
            .optional()
            .describe("Custom text for confirm button (default: 'Approve')"),
          cancelLabel: z
            .string()
            .optional()
            .describe("Custom text for cancel button (default: 'Deny')"),
          choice: z.enum(["approved", "denied"]).optional(),
        }),
        execute: async (input) => {
          return {
            ...input,
            timestamp: new Date().toISOString(),
          };
        },
      }),
      image: tool({
        description:
          "Display an image with proper attribution, captions, and optional links. Use this when users ask to see images, screenshots, diagrams, or any visual content.",
        inputSchema: z.object({
          id: z.string(),
          role: z.string().optional(),
          receipt: z.any().optional(),
          assetId: z.string(),
          src: z.string().url(), // Changed from z.url() to z.string().url()
          alt: z.string().min(1),
          title: z.string().optional(),
          description: z.string().optional(),
          href: z.string().url().optional(), // Changed from z.url() to z.string().url()
          domain: z.string().optional(),
          ratio: z
            .enum(["auto", "1:1", "4:3", "16:9", "9:16"])
            .optional()
            .default("auto"),
          fit: z
            .enum(["cover", "contain", "fill", "scale-down"])
            .optional()
            .default("cover"),
          fileSizeBytes: z.number().int().positive().optional(),
          createdAt: z.string().datetime().optional(),
          locale: z.string().optional(),
          source: z
            .object({
              label: z.string(),
              iconUrl: z.string().url().optional(), // Changed from z.url() to z.string().url()
              url: z.string().url().optional(), // Changed from z.url() to z.string().url()
            })
            .optional(),
        }),
        execute: async (input) => {
          return {
            ...input,
            timestamp: new Date().toISOString(),
          };
        },
      }),
      question_flow: tool({
        description:
          "Present a series of questions to the user to collect information. Use this when you need to gather multiple pieces of information, conduct surveys, or guide users through a decision process.",
        inputSchema: z
          .object({
            // Use z.object() instead of discriminated union
            type: z.enum(["progressive", "upfront", "receipt"]),
            id: z.string(),
            role: z.string().optional(),
            // Progressive mode fields
            step: z.number().min(1).optional(),
            title: z.string().optional(),
            description: z.string().optional(),
            options: z
              .array(
                z.object({
                  id: z.string(),
                  label: z.string(),
                  description: z.string().optional(),
                  disabled: z.boolean().optional(),
                }),
              )
              .optional(),
            selectionMode: z.enum(["single", "multi"]).optional(),
            // Upfront mode fields
            steps: z
              .array(
                z.object({
                  id: z.string(),
                  title: z.string(),
                  description: z.string().optional(),
                  options: z
                    .array(
                      z.object({
                        id: z.string(),
                        label: z.string(),
                        description: z.string().optional(),
                        disabled: z.boolean().optional(),
                      }),
                    )
                    .min(1),
                  selectionMode: z.enum(["single", "multi"]).optional(),
                }),
              )
              .optional(),
            // Receipt mode fields
            choice: z
              .object({
                title: z.string(),
                summary: z
                  .array(
                    z.object({
                      label: z.string(),
                      value: z.string(),
                    }),
                  )
                  .min(1),
              })
              .optional(),
          })
          .refine(
            (data) => {
              // Validate based on type
              if (data.type === "progressive") {
                return (
                  data.step !== undefined &&
                  data.title !== undefined &&
                  data.options !== undefined
                );
              }
              if (data.type === "upfront") {
                return data.steps !== undefined && data.steps.length > 0;
              }
              if (data.type === "receipt") {
                return data.choice !== undefined;
              }
              return false;
            },
            {
              message: "Invalid combination of fields for the selected type",
            },
          ),
        execute: async (input) => {
          return {
            ...input,
            timestamp: new Date().toISOString(),
          };
        },
      }),
      // message_draft: tool({
      //   description:
      //     "Create a draft message (email or Slack) for user review before sending. Use this when users ask to compose emails, Slack messages, or any kind of message that needs review before sending.",
      //   inputSchema: SerializableMessageDraftSchema,
      //   execute: async (input) => {
      //     return {
      //       ...input,
      //       timestamp: new Date().toISOString(),
      //     };
      //   },
      // }),
    },
  });

  return result.toUIMessageStreamResponse();
}
